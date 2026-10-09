using System.Security.Claims;

namespace EzFinance.Api.Infrastructure.Auth;

public static class ClaimsPrincipalExtensions
{
    /// <summary>The Supabase user id ("sub" claim) of an authenticated request.</summary>
    public static Guid GetUserId(this ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue("sub") ?? throw new InvalidOperationException("Token has no 'sub' claim."));

    public static string GetEmail(this ClaimsPrincipal user) =>
        user.FindFirstValue("email") ?? throw new InvalidOperationException("Token has no 'email' claim.");
}
