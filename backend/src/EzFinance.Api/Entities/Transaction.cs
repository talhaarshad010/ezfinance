namespace EzFinance.Api.Entities;

/// <summary>
/// Row in public.transactions: one income or expense a user logged. The id comes from the app so
/// retries never duplicate a row; see backend/supabase/migrations for the schema and constraints.
/// </summary>
public sealed class Transaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = TransactionValues.Expense;
    /// <summary>Always positive; <see cref="Type"/> says which way the money moved.</summary>
    public decimal Amount { get; set; }
    public string Category { get; set; } = TransactionValues.Other;
    public string? Note { get; set; }
    /// <summary>The user's bank account the money moved through (required).</summary>
    public Guid AccountId { get; set; }
    /// <summary>The day the money moved.</summary>
    public DateOnly OccurredOn { get; set; }
    public string Source { get; set; } = TransactionValues.SourceManual;
    public bool ExcludeFromBudget { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    /// <summary>Set when deleted (soft delete); cleared again by restore.</summary>
    public DateTimeOffset? DeletedAt { get; set; }
}

/// <summary>Allowed values for transaction fields, matching the check constraints in the database.</summary>
public static class TransactionValues
{
    public const string Expense = "expense";
    public const string Income = "income";

    public const string Groceries = "Groceries";
    public const string Fuel = "Fuel";
    public const string Salary = "Salary";
    public const string Bills = "Bills";
    public const string Dining = "Dining";
    public const string Other = "Other";

    public const string SourceManual = "manual";
    public const string SourceScan = "scan";
    public const string SourceImport = "import";

    public const double MinAmount = 0.01;
    public const double MaxAmount = 1_000_000_000;
}
