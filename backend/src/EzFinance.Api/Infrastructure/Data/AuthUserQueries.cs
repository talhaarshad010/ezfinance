using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Infrastructure.Data;

/// <summary>Whether a user has chosen a password (profiles.has_password).</summary>
/// <remarks>
/// Not read from auth.users: Supabase gives accounts created with an emailed code a random
/// password, so its password column can't tell whether the user can log in with one.
/// </remarks>
public static class AuthUserQueries
{
    public static async Task<bool> HasPasswordAsync(this AppDbContext db, Guid userId, CancellationToken ct) =>
        await db.Profiles.Where(p => p.Id == userId).Select(p => p.HasPassword).FirstOrDefaultAsync(ct);

    /// <summary>Records that the user chose a password (creating the profile first if missing).</summary>
    public static async Task MarkPasswordSetAsync(this AppDbContext db, Guid userId, CancellationToken ct)
    {
        await db.Database.ExecuteSqlAsync($"select public.ensure_profile({userId})", ct);
        await db.Database.ExecuteSqlAsync(
            $"update public.profiles set has_password = true where id = {userId} and not has_password", ct);
    }
}
