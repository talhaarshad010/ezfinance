using System.Data;
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

    /// <summary>
    /// Whether an email can start sign-up. Reads Supabase's auth tables (the API connects as
    /// postgres). A sign-up that verified its code but never finished (no password, no Google,
    /// no details) may carry on; anything else is an existing account.
    /// </summary>
    public static async Task<SignUpEmailStatus> GetSignUpEmailStatusAsync(
        this AppDbContext db, string email, CancellationToken ct)
    {
        var connection = db.Database.GetDbConnection();
        var opened = connection.State != ConnectionState.Open;
        if (opened)
        {
            await connection.OpenAsync(ct);
        }
        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = """
                select coalesce(p.has_password, false),
                       exists (select 1 from auth.identities i where i.user_id = u.id and i.provider <> 'email'),
                       (p.city is not null or p.province is not null or p.monthly_income is not null)
                from auth.users u
                left join public.profiles p on p.id = u.id
                where lower(u.email) = lower(@email) and u.deleted_at is null
                limit 1
                """;
            var parameter = command.CreateParameter();
            parameter.ParameterName = "email";
            parameter.Value = email;
            command.Parameters.Add(parameter);

            await using var reader = await command.ExecuteReaderAsync(ct);
            if (!await reader.ReadAsync(ct))
            {
                return SignUpEmailStatus.Available;
            }
            var hasPassword = reader.GetBoolean(0);
            var hasSocialLogin = reader.GetBoolean(1);
            var detailsFilled = reader.GetBoolean(2);
            if (hasPassword)
            {
                return SignUpEmailStatus.HasAccount;
            }
            if (hasSocialLogin)
            {
                return SignUpEmailStatus.GoogleOnly;
            }
            return detailsFilled ? SignUpEmailStatus.HasAccount : SignUpEmailStatus.Available;
        }
        finally
        {
            if (opened)
            {
                await connection.CloseAsync();
            }
        }
    }

    /// <summary>Records that the user chose a password (creating the profile first if missing).</summary>
    public static async Task MarkPasswordSetAsync(this AppDbContext db, Guid userId, CancellationToken ct)
    {
        await db.Database.ExecuteSqlAsync($"select public.ensure_profile({userId})", ct);
        await db.Database.ExecuteSqlAsync(
            $"update public.profiles set has_password = true where id = {userId} and not has_password", ct);
    }
}

public enum SignUpEmailStatus
{
    /// <summary>New email, or a sign-up that was started but never finished.</summary>
    Available,
    /// <summary>A finished account that logs in with email and password.</summary>
    HasAccount,
    /// <summary>An account that only signs in with Google.</summary>
    GoogleOnly,
}
