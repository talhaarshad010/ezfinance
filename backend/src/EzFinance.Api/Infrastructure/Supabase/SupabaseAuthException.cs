namespace EzFinance.Api.Infrastructure.Supabase;

/// <summary>A failed Supabase Auth request, carrying its HTTP status and error code.</summary>
public sealed class SupabaseAuthException(int statusCode, string? errorCode, string message)
    : Exception(message)
{
    public int StatusCode { get; } = statusCode;

    /// <summary>Supabase error code, e.g. "invalid_credentials" or "otp_expired".</summary>
    public string? ErrorCode { get; } = errorCode;
}
