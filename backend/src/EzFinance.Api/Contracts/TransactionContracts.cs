using System.ComponentModel.DataAnnotations;
using EzFinance.Api.Entities;

namespace EzFinance.Api.Contracts;

public sealed record TransactionResponse(
    Guid Id,
    string Type,
    decimal Amount,
    string Category,
    string? Note,
    Guid AccountId,
    DateOnly Date,
    string Source,
    bool ExcludeFromBudget,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt)
{
    public static TransactionResponse From(Transaction t) => new(
        t.Id, t.Type, t.Amount, t.Category, t.Note, t.AccountId, t.OccurredOn, t.Source,
        t.ExcludeFromBudget, t.CreatedAt, t.UpdatedAt);
}

/// <summary>One page of transactions, newest first. Pass <see cref="NextCursor"/> back for the next page.</summary>
public sealed record TransactionPage(IReadOnlyList<TransactionResponse> Items, string? NextCursor);

/// <summary>Fields the user edits; shared by create and update.</summary>
public class TransactionFields
{
    [Required, AllowedValues(TransactionValues.Expense, TransactionValues.Income)]
    public string Type { get; init; } = TransactionValues.Expense;

    [Range(TransactionValues.MinAmount, TransactionValues.MaxAmount)]
    public decimal Amount { get; init; }

    [Required, AllowedValues(TransactionValues.Groceries, TransactionValues.Fuel, TransactionValues.Salary,
        TransactionValues.Bills, TransactionValues.Dining, TransactionValues.Other)]
    public string Category { get; init; } = TransactionValues.Other;

    [StringLength(60)]
    public string? Note { get; init; }

    /// <summary>One of the user's linked bank accounts (required).</summary>
    [Required]
    public Guid? AccountId { get; init; }

    [Required]
    public DateOnly? Date { get; init; }

    public bool ExcludeFromBudget { get; init; }
}

public sealed class CreateTransactionRequest : TransactionFields
{
    /// <summary>Created by the app, so a retried create returns the same row instead of a duplicate.</summary>
    [Required]
    public Guid? Id { get; init; }

    [AllowedValues(TransactionValues.SourceManual, TransactionValues.SourceScan, TransactionValues.SourceImport)]
    public string Source { get; init; } = TransactionValues.SourceManual;
}

public sealed class UpdateTransactionRequest : TransactionFields;

public sealed class SplitTransactionRequest
{
    /// <summary>The parts that replace the transaction; their amounts must add up to its amount.</summary>
    [Required, MinLength(2), MaxLength(10)]
    public List<SplitPart> Parts { get; init; } = [];
}

public sealed class SplitPart
{
    [Required]
    public Guid? Id { get; init; }

    [Range(TransactionValues.MinAmount, TransactionValues.MaxAmount)]
    public decimal Amount { get; init; }

    [Required, AllowedValues(TransactionValues.Groceries, TransactionValues.Fuel, TransactionValues.Salary,
        TransactionValues.Bills, TransactionValues.Dining, TransactionValues.Other)]
    public string Category { get; init; } = TransactionValues.Other;

    [StringLength(60)]
    public string? Note { get; init; }
}
