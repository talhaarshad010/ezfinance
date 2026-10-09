using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Infrastructure.Data;

/// <summary>Read-only lookups on Supabase's auth.users table (the backend connects as postgres).</summary>
public static class AuthUserQueries
{
    /// <summary>
    /// Whether the user can log in with email + password. Accounts created through Google have no
    /// password until they set one (Set password, or Forgot password).
    /// </summary>
    public static Task<bool> HasPasswordAsync(this AppDbContext db, Guid userId, CancellationToken ct) =>
        db.Database
            .SqlQuery<bool>($"select coalesce(encrypted_password, '') <> '' as \"Value\" from auth.users where id = {userId}")
            .SingleOrDefaultAsync(ct);
}
