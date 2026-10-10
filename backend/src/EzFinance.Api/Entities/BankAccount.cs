namespace EzFinance.Api.Entities;

/// <summary>
/// Row in public.bank_accounts: a bank account or wallet the user linked. Only the last 4 digits
/// of the number are kept. The balance is <see cref="OpeningBalance"/> plus the account's
/// transactions; see backend/supabase/migrations for the schema.
/// </summary>
public sealed class BankAccount
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    /// <summary>Bank from the app's list of Pakistani banks, e.g. "meezan".</summary>
    public string BankId { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string AccountTitle { get; set; } = string.Empty;
    public string AccountLast4 { get; set; } = string.Empty;
    public decimal OpeningBalance { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    /// <summary>Set when removed (soft delete); its transactions keep pointing at it.</summary>
    public DateTimeOffset? DeletedAt { get; set; }
}
