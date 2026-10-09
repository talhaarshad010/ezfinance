using EzFinance.Api.Infrastructure.Supabase;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace EzFinance.Api.Infrastructure.HealthChecks;

public sealed class SupabaseAuthHealthCheck(SupabaseAuthClient authClient) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            return await authClient.IsHealthyAsync(cancellationToken)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Supabase Auth returned a non-success status.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Supabase Auth is unreachable.", ex);
        }
    }
}
