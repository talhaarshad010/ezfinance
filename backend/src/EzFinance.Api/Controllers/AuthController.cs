using EzFinance.Api.Contracts;
using EzFinance.Api.Infrastructure.Auth;
using EzFinance.Api.Infrastructure.Data;
using EzFinance.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EzFinance.Api.Controllers;

/// <summary>
/// Email + password authentication backed by Supabase Auth. Supabase errors come back as
/// ProblemDetails with a "code" (see SupabaseAuthExceptionHandler).
/// </summary>
[ApiController]
[Route("api/auth")]
[EnableRateLimiting(RateLimitPolicies.Auth)]
public sealed class AuthController(SupabaseAuthClient auth, AppDbContext db, PasswordResetStore resets) : ControllerBase
{
    /// <summary>
    /// Sign-up step 1: emails a 6-digit code, creating the account if the email is new. The response
    /// is the same either way, so it doesn't reveal whether the email is registered. After the code
    /// is verified, the app checks the profile's hasPassword to tell a new account from an existing one.
    /// </summary>
    [HttpPost("email-code")]
    public async Task<IActionResult> EmailCode(EmailCodeRequest request, CancellationToken ct)
    {
        var metadata = new Dictionary<string, string?> { ["full_name"] = request.FullName?.Trim() };
        await auth.SendEmailCodeAsync(Normalize(request.Email), metadata, ct);
        return NoContent();
    }

    /// <summary>Verifies an emailed sign-up or sign-in code and signs the user in.</summary>
    [HttpPost("verify-email")]
    public async Task<ActionResult<AuthSessionResponse>> VerifyEmail(VerifyEmailRequest request, CancellationToken ct)
    {
        var session = await auth.VerifyOtpAsync(Normalize(request.Email), request.Code, "email", ct);
        return Ok(AuthSessionResponse.From(session));
    }

    /// <summary>Sends a new sign-up verification code.</summary>
    [HttpPost("resend-code")]
    public async Task<IActionResult> ResendCode(EmailRequest request, CancellationToken ct)
    {
        await auth.ResendSignUpCodeAsync(Normalize(request.Email), ct);
        return NoContent();
    }

    /// <summary>Signs in. Returns 403 with code "email_not_confirmed" if the email is unverified.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthSessionResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var session = await auth.SignInWithPasswordAsync(Normalize(request.Email), request.Password, ct);
        return Ok(AuthSessionResponse.From(session));
    }

    /// <summary>
    /// Signs in with Google using the ID token from native Google Sign-In on the phone. The first
    /// sign-in creates the account (and its profile, named from the Google account).
    /// </summary>
    [HttpPost("google")]
    public async Task<ActionResult<AuthSessionResponse>> Google(GoogleSignInRequest request, CancellationToken ct)
    {
        var session = await auth.SignInWithIdTokenAsync("google", request.IdToken, ct);
        return Ok(AuthSessionResponse.From(session));
    }

    /// <summary>Exchanges a refresh token for a new session. Refresh tokens are single-use.</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthSessionResponse>> Refresh(RefreshRequest request, CancellationToken ct)
    {
        var session = await auth.RefreshSessionAsync(request.RefreshToken, ct);
        return Ok(AuthSessionResponse.From(session));
    }

    /// <summary>Revokes the current session. Succeeds even if the session is already gone.</summary>
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        try
        {
            await auth.SignOutAsync(await GetAccessTokenAsync(), ct);
        }
        catch (SupabaseAuthException ex) when (ex.StatusCode is 401 or 403 or 404)
        {
            // Already signed out or expired; nothing left to revoke.
        }
        return NoContent();
    }

    /// <summary>
    /// Emails a password reset code. Always returns 204, whether or not the account exists,
    /// so the endpoint cannot be used to discover registered emails.
    /// </summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(EmailRequest request, CancellationToken ct)
    {
        await auth.SendPasswordResetAsync(Normalize(request.Email), ct);
        return NoContent();
    }

    /// <summary>
    /// Reset step 2: checks the code from the reset email. On success returns a single-use reset
    /// token (valid 10 minutes) for complete-reset; the recovery session itself stays on the server.
    /// </summary>
    [HttpPost("verify-reset-code")]
    public async Task<ActionResult<ResetTokenResponse>> VerifyResetCode(VerifyEmailRequest request, CancellationToken ct)
    {
        var session = await auth.VerifyOtpAsync(Normalize(request.Email), request.Code, "recovery", ct);
        var token = resets.Create(session.AccessToken!);
        return Ok(new ResetTokenResponse(token, (int)PasswordResetStore.Lifetime.TotalSeconds));
    }

    /// <summary>
    /// Reset step 3: sets the new password and ends the recovery session. The user then logs in
    /// with the new password. On a rejected password (e.g. same as before) the token stays valid.
    /// </summary>
    [HttpPost("complete-reset")]
    public async Task<IActionResult> CompleteReset(CompleteResetRequest request, CancellationToken ct)
    {
        var accessToken = resets.Find(request.ResetToken);
        if (accessToken is null)
        {
            return Problem(
                statusCode: StatusCodes.Status410Gone,
                detail: "This reset session has expired. Request a new code.",
                extensions: new Dictionary<string, object?> { ["code"] = "reset_expired" });
        }

        await auth.UpdatePasswordAsync(accessToken, request.NewPassword, ct);
        resets.Remove(request.ResetToken);
        try
        {
            await auth.SignOutAsync(accessToken, ct);
        }
        catch (SupabaseAuthException)
        {
            // Best effort: the recovery session expires on its own.
        }
        return NoContent();
    }

    /// <summary>Changes the password of the signed-in user after re-checking the current one.</summary>
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        GoTrueSession check;
        try
        {
            check = await auth.SignInWithPasswordAsync(User.GetEmail(), request.CurrentPassword, ct);
        }
        catch (SupabaseAuthException ex) when (ex.ErrorCode is "invalid_credentials" or "invalid_grant")
        {
            // 400 rather than 401: the user's session is fine, only the typed password is wrong.
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                detail: "Current password is incorrect.",
                extensions: new Dictionary<string, object?> { ["code"] = "invalid_current_password" });
        }

        await auth.SignOutAsync(check.AccessToken!, ct); // drop the session created by the check
        await auth.UpdatePasswordAsync(await GetAccessTokenAsync(), request.NewPassword, ct);
        return NoContent();
    }

    /// <summary>
    /// Adds a password to an account that has none (created with Google), so the user can also log
    /// in with email + password. Accounts that already have one must use change-password, which
    /// checks the current password.
    /// </summary>
    [Authorize]
    [HttpPost("set-password")]
    public async Task<IActionResult> SetPassword(SetPasswordRequest request, CancellationToken ct)
    {
        if (await db.HasPasswordAsync(User.GetUserId(), ct))
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                detail: "This account already has a password. Use change password instead.",
                extensions: new Dictionary<string, object?> { ["code"] = "password_already_set" });
        }

        await auth.UpdatePasswordAsync(await GetAccessTokenAsync(), request.NewPassword, ct);
        return NoContent();
    }

    private static string Normalize(string email) => email.Trim().ToLowerInvariant();

    private async Task<string> GetAccessTokenAsync() =>
        await HttpContext.GetTokenAsync("access_token")
            ?? throw new InvalidOperationException("Access token was not saved by the JWT handler.");
}
