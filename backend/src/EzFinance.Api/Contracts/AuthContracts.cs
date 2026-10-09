using System.ComponentModel.DataAnnotations;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Supabase;

namespace EzFinance.Api.Contracts;

public sealed class EmailCodeRequest
{
    [Required, EmailAddress, StringLength(254)]
    public string Email { get; init; } = string.Empty;

    /// <summary>Stored as the profile name if this creates a new account.</summary>
    [StringLength(100)]
    public string? FullName { get; init; }
}

public sealed class EmailRequest
{
    [Required, EmailAddress, StringLength(254)]
    public string Email { get; init; } = string.Empty;
}

public sealed class VerifyEmailRequest
{
    [Required, EmailAddress, StringLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required, RegularExpression("^[0-9]{6,10}$", ErrorMessage = "The code must be 6 to 10 digits.")]
    public string Code { get; init; } = string.Empty;
}

public sealed class LoginRequest
{
    [Required, EmailAddress, StringLength(254)]
    public string Email { get; init; } = string.Empty;

    [Required, StringLength(72)]
    public string Password { get; init; } = string.Empty;
}

public sealed class GoogleSignInRequest
{
    /// <summary>The ID token (JWT) returned by Google Sign-In on the device.</summary>
    [Required, StringLength(4096)]
    public string IdToken { get; init; } = string.Empty;
}

public sealed class RefreshRequest
{
    [Required]
    public string RefreshToken { get; init; } = string.Empty;
}

public sealed class CompleteResetRequest
{
    [Required, StringLength(128)]
    public string ResetToken { get; init; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8)]
    public string NewPassword { get; init; } = string.Empty;
}

/// <summary>Single-use handle for setting the new password after the reset code was verified.</summary>
public sealed record ResetTokenResponse(string ResetToken, int ExpiresIn);

public sealed class ChangePasswordRequest
{
    [Required, StringLength(72)]
    public string CurrentPassword { get; init; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8)]
    public string NewPassword { get; init; } = string.Empty;
}

public sealed class SetPasswordRequest
{
    [Required, StringLength(72, MinimumLength = 8)]
    public string NewPassword { get; init; } = string.Empty;
}

/// <summary>Tokens the app stores securely and sends as "Authorization: Bearer {AccessToken}".</summary>
public sealed record AuthSessionResponse(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    long ExpiresAt,
    AuthUserResponse User)
{
    public static AuthSessionResponse From(GoTrueSession session) => new(
        session.AccessToken ?? throw new InvalidOperationException("Session has no access token."),
        session.RefreshToken ?? throw new InvalidOperationException("Session has no refresh token."),
        session.TokenType ?? "bearer",
        session.ExpiresIn,
        session.ExpiresAt,
        new AuthUserResponse(
            session.User?.Id ?? throw new InvalidOperationException("Session has no user."),
            session.User.Email ?? string.Empty,
            session.User.EmailConfirmedAt is not null));
}

public sealed record AuthUserResponse(Guid Id, string Email, bool EmailConfirmed);
