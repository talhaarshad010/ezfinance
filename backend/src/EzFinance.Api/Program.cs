using EzFinance.Api.Configuration;
using EzFinance.Api.Infrastructure.Auth;
using EzFinance.Api.Infrastructure.Data;
using EzFinance.Api.Infrastructure.Errors;
using EzFinance.Api.Infrastructure.HealthChecks;
using EzFinance.Api.Infrastructure.Ocr;
using EzFinance.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Supabase project settings
builder.Services.AddOptions<SupabaseOptions>()
    .BindConfiguration(SupabaseOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Supabase Postgres (via the session pooler connection string, kept in user secrets)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection is not set. Run: " +
        "dotnet user-secrets set \"ConnectionStrings:DefaultConnection\" \"<session pooler connection string>\"");
}
builder.Services.AddDbContext<AppDbContext>(options => options
    .UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention());

// Supabase Auth
builder.Services.AddHttpClient<SupabaseAuthClient>();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<PasswordResetStore>();

// Validate Supabase-issued access tokens. Supabase signs them with asymmetric keys that are
// discovered from {AuthUrl}/.well-known/openid-configuration, so no JWT secret is stored here.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<SupabaseOptions>>((jwt, supabase) =>
    {
        jwt.Authority = supabase.Value.AuthUrl;
        jwt.TokenValidationParameters.ValidAudience = "authenticated";
        jwt.MapInboundClaims = false;
        jwt.SaveToken = true; // lets endpoints forward the caller's token to Supabase Auth
    });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddAuthPolicy();
});

builder.Services.AddHealthChecks()
    // Open a real connection (instead of CanConnectAsync) so failures surface the Postgres error.
    .AddDbContextCheck<AppDbContext>("database", tags: ["ready"], customTestQuery: async (db, ct) =>
    {
        await db.Database.OpenConnectionAsync(ct);
        await db.Database.CloseConnectionAsync();
        return true;
    })
    .AddCheck<SupabaseAuthHealthCheck>("supabase-auth", tags: ["ready"]);

builder.Services.AddExceptionHandler<SupabaseAuthExceptionHandler>();
builder.Services.AddProblemDetails();

// Gemini OCR
builder.Services.AddOptions<GeminiOptions>()
    .BindConfiguration(GeminiOptions.SectionName);
builder.Services.AddHttpClient<GeminiReceiptOcrService>();
builder.Services.AddSingleton<IReceiptOcrService>(sp =>
    sp.GetRequiredService<GeminiReceiptOcrService>());

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
    app.MapGet("/", () => Results.Redirect("/scalar/v1"));
}
else
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Liveness: the process is up. Readiness: Supabase Auth and the database are reachable.
app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = HealthCheckResponseWriter.WriteJson,
});

app.MapControllers();

app.Run();
