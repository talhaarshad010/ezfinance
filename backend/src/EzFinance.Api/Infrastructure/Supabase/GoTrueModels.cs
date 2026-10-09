namespace EzFinance.Api.Infrastructure.Supabase;

// Shapes of Supabase Auth (GoTrue) responses. JSON is snake_case on the wire.

/// <summary>
/// A session from /token or /verify. /signup returns the same shape when email confirmation is
/// off; when it is on, it returns only the user and <see cref="AccessToken"/> is null.
/// </summary>
public sealed record GoTrueSession(
    string? AccessToken,
    string? TokenType,
    int ExpiresIn,
    long ExpiresAt,
    string? RefreshToken,
    GoTrueUser? User);

public sealed record GoTrueUser(Guid Id, string? Email, DateTimeOffset? EmailConfirmedAt);

/// <summary>
/// Supabase Auth error body. Newer endpoints send error_code/msg; the OAuth-style /token
/// endpoint can send error/error_description instead.
/// </summary>
internal sealed record GoTrueError(
    string? ErrorCode,
    string? Msg,
    string? Error,
    string? ErrorDescription,
    string? Message);
