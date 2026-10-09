using EzFinance.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Diagnostics;

namespace EzFinance.Api.Infrastructure.Errors;

/// <summary>
/// Turns <see cref="SupabaseAuthException"/> into a ProblemDetails response. Client errors keep
/// Supabase's message and error code (as "code") so the app can react, e.g. to
/// "email_not_confirmed"; server-side failures become a generic 502.
/// </summary>
public sealed class SupabaseAuthExceptionHandler(
    IProblemDetailsService problemDetails, ILogger<SupabaseAuthExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        if (exception is not SupabaseAuthException error)
        {
            return false;
        }

        var status = MapStatus(error);
        if (status >= 500)
        {
            logger.LogError(exception, "Supabase Auth failed with {Status} ({Code})", error.StatusCode, error.ErrorCode);
        }

        context.Response.StatusCode = status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails =
            {
                Status = status,
                Detail = status >= 500 ? "The authentication service is unavailable. Try again later." : error.Message,
                Extensions = { ["code"] = status >= 500 ? "auth_unavailable" : error.ErrorCode },
            },
        });
    }

    private static int MapStatus(SupabaseAuthException error) => error.ErrorCode switch
    {
        "invalid_credentials" or "invalid_grant" or "refresh_token_not_found"
            or "refresh_token_already_used" or "session_not_found" or "session_expired" or "bad_jwt" => 401,
        "email_not_confirmed" => 403,
        "user_already_exists" or "email_exists" => 409,
        _ when error.StatusCode is >= 400 and < 500 => error.StatusCode,
        _ => 502,
    };
}
