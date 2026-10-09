using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using EzFinance.Api.Configuration;
using Microsoft.Extensions.Options;

namespace EzFinance.Api.Infrastructure.Supabase;

/// <summary>
/// Typed HTTP client for the Supabase Auth (GoTrue) REST API. The mobile app never calls
/// Supabase directly; every auth operation goes through this client.
/// </summary>
public sealed class SupabaseAuthClient
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly HttpClient _http;

    public SupabaseAuthClient(HttpClient http, IOptions<SupabaseOptions> options)
    {
        var supabase = options.Value;
        http.BaseAddress = new Uri($"{supabase.AuthUrl}/");
        http.DefaultRequestHeaders.Add("apikey", supabase.PublishableKey);
        _http = http;
    }

    public async Task<bool> IsHealthyAsync(CancellationToken cancellationToken = default)
    {
        using var response = await _http.GetAsync("health", cancellationToken);
        return response.IsSuccessStatusCode;
    }

    /// <summary>
    /// Emails a one-time sign-in code, creating the account first if the email is new
    /// (passwordless sign-up). <paramref name="metadata"/> is only stored for new accounts; the
    /// database trigger uses it to create the profile.
    /// </summary>
    public Task SendEmailCodeAsync(
        string email, IReadOnlyDictionary<string, string?> metadata, CancellationToken ct) =>
        SendAsync(HttpMethod.Post, "otp", new { email, create_user = true, data = metadata }, accessToken: null, ct);

    /// <summary>Verifies an emailed code. Type is "email" (sign-up) or "recovery" (password reset).</summary>
    public Task<GoTrueSession> VerifyOtpAsync(string email, string token, string type, CancellationToken ct) =>
        SendAsync<GoTrueSession>(HttpMethod.Post, "verify", new { type, email, token }, accessToken: null, ct);

    public Task ResendSignUpCodeAsync(string email, CancellationToken ct) =>
        SendAsync(HttpMethod.Post, "resend", new { type = "signup", email }, accessToken: null, ct);

    public Task<GoTrueSession> SignInWithPasswordAsync(string email, string password, CancellationToken ct) =>
        SendAsync<GoTrueSession>(
            HttpMethod.Post, "token?grant_type=password", new { email, password }, accessToken: null, ct);

    /// <summary>
    /// Signs in with an ID token from a native provider SDK (e.g. Google Sign-In). Creates the
    /// user on first sign-in. Supabase verifies the token's signature, issuer and audience.
    /// </summary>
    public Task<GoTrueSession> SignInWithIdTokenAsync(string provider, string idToken, CancellationToken ct) =>
        SendAsync<GoTrueSession>(
            HttpMethod.Post, "token?grant_type=id_token", new { provider, id_token = idToken }, accessToken: null, ct);

    public Task<GoTrueSession> RefreshSessionAsync(string refreshToken, CancellationToken ct) =>
        SendAsync<GoTrueSession>(
            HttpMethod.Post, "token?grant_type=refresh_token", new { refresh_token = refreshToken }, accessToken: null, ct);

    /// <summary>Revokes the session behind <paramref name="accessToken"/> (scope "local").</summary>
    public Task SignOutAsync(string accessToken, CancellationToken ct) =>
        SendAsync(HttpMethod.Post, "logout?scope=local", body: null, accessToken, ct);

    public Task SendPasswordResetAsync(string email, CancellationToken ct) =>
        SendAsync(HttpMethod.Post, "recover", new { email }, accessToken: null, ct);

    public Task UpdatePasswordAsync(string accessToken, string newPassword, CancellationToken ct) =>
        SendAsync(HttpMethod.Put, "user", new { password = newPassword }, accessToken, ct);

    private async Task<T> SendAsync<T>(
        HttpMethod method, string path, object? body, string? accessToken, CancellationToken ct)
    {
        using var response = await SendRequestAsync(method, path, body, accessToken, ct);
        return await response.Content.ReadFromJsonAsync<T>(Json, ct)
            ?? throw new SupabaseAuthException(502, null, "Supabase Auth returned an empty response.");
    }

    private async Task SendAsync(
        HttpMethod method, string path, object? body, string? accessToken, CancellationToken ct)
    {
        using var _ = await SendRequestAsync(method, path, body, accessToken, ct);
    }

    private async Task<HttpResponseMessage> SendRequestAsync(
        HttpMethod method, string path, object? body, string? accessToken, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(method, path);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body, options: Json);
        }
        if (accessToken is not null)
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        }

        var response = await _http.SendAsync(request, ct);
        if (response.IsSuccessStatusCode)
        {
            return response;
        }

        using (response)
        {
            throw await ReadErrorAsync(response, ct);
        }
    }

    private static async Task<SupabaseAuthException> ReadErrorAsync(HttpResponseMessage response, CancellationToken ct)
    {
        GoTrueError? error = null;
        try
        {
            error = await response.Content.ReadFromJsonAsync<GoTrueError>(Json, ct);
        }
        catch (JsonException)
        {
            // Non-JSON error body; fall back to the status line below.
        }

        return new SupabaseAuthException(
            (int)response.StatusCode,
            error?.ErrorCode ?? error?.Error,
            error?.Msg ?? error?.ErrorDescription ?? error?.Message
                ?? response.ReasonPhrase ?? "Supabase Auth request failed.");
    }
}
