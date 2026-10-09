using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace EzFinance.Api.Infrastructure.Auth;

public static class RateLimitPolicies
{
    /// <summary>Per-IP limit on auth endpoints, against password and code guessing.</summary>
    public const string Auth = "auth";

    public static void AddAuthPolicy(this RateLimiterOptions options) =>
        options.AddPolicy(Auth, context => RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
}
