using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace EzFinance.Api.Infrastructure.HealthChecks;

/// <summary>
/// Writes a health report as JSON with the status of each individual check. Failure details
/// (e.g. the Postgres error) are only included in Development, since the endpoint is public.
/// </summary>
public static class HealthCheckResponseWriter
{
    public static Task WriteJson(HttpContext context, HealthReport report)
    {
        var showDetails = context.RequestServices.GetRequiredService<IHostEnvironment>().IsDevelopment();

        return context.Response.WriteAsJsonAsync(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.ToDictionary(
                e => e.Key,
                e => new
                {
                    status = e.Value.Status.ToString(),
                    description = showDetails ? e.Value.Description ?? e.Value.Exception?.Message : null,
                }),
        });
    }
}
