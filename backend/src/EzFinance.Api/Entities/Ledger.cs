namespace EzFinance.Api.Entities;

/// <summary>
/// Row in public.recurring_bills: a bill paid every month from one of the user's accounts.
/// Paying it logs an expense transaction in that account and sets <see cref="LastPaidOn"/>.
/// </summary>
public sealed class RecurringBill
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid AccountId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = TransactionValues.Bills;
    public short DueDay { get; set; }
    public short RemindDaysBefore { get; set; }
    public DateOnly? LastPaidOn { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}

/// <summary>Row in public.loans: a loan or other debt the user is paying off.</summary>
public sealed class Loan
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Lender { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal Remaining { get; set; }
    public decimal InterestRate { get; set; }
    public decimal Emi { get; set; }
    public short DueDay { get; set; }
    public short RemindDaysBefore { get; set; }
    public bool RemindOnDue { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}

/// <summary>
/// Row in public.transfers: money moved between two of the user's own accounts. Lowers the
/// "from" account's balance and raises the "to" account's; not income or spending.
/// </summary>
public sealed class Transfer
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid FromAccountId { get; set; }
    public Guid ToAccountId { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateOnly OccurredOn { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}
