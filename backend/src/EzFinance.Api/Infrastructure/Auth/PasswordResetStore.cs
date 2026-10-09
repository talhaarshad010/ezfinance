using System.Security.Cryptography;
using Microsoft.Extensions.Caching.Memory;

namespace EzFinance.Api.Infrastructure.Auth;

/// <summary>
/// Holds the Supabase recovery session between "verify reset code" and "set new password", so the
/// app only ever receives an opaque, single-use reset token instead of a signed-in session.
/// In memory: fine for a single API instance; tokens are lost on restart (user requests a new code).
/// </summary>
public sealed class PasswordResetStore(IMemoryCache cache)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    public sealed record Entry(string AccessToken, Guid UserId);

    public string Create(string recoveryAccessToken, Guid userId)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        cache.Set(Key(token), new Entry(recoveryAccessToken, userId), Lifetime);
        return token;
    }

    public Entry? Find(string resetToken) =>
        cache.TryGetValue(Key(resetToken), out Entry? entry) ? entry : null;

    public void Remove(string resetToken) => cache.Remove(Key(resetToken));

    private static string Key(string token) => $"pwreset:{token}";
}
