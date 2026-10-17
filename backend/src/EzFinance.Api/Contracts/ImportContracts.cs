using System.ComponentModel.DataAnnotations;
using EzFinance.Api.Entities;

namespace EzFinance.Api.Contracts;

/// <summary>What was read from a statement, for the review screen. Nothing is saved yet.</summary>
public sealed record StatementPreviewResponse(
    /// <summary>"csv", "excel" or "pdf".</summary>
    string FileType,
    /// <summary>"rules" (read exactly, no AI) or "ai" (structured by Gemini, then checked).</summary>
    string Method,
    string? BankName,
    decimal? OpeningBalance,
    decimal? ClosingBalance,
    /// <summary>"passed", "failed" or "unavailable".</summary>
    string BalanceCheck,
    DateOnly From,
    DateOnly To,
    IReadOnlyList<StatementRowResponse> Rows,
    IReadOnlyList<string> Warnings);

public sealed record StatementRowResponse(
    /// <summary>Stable id: importing the same row again is recognised, never duplicated.</summary>
    Guid Id,
    DateOnly Date,
    string Description,
    decimal Amount,
    string Type,
    decimal? Balance,
    /// <summary>"verified", "mismatch" or "unchecked".</summary>
    string Check,
    string Category,
    bool AlreadyImported,
    /// <summary>Whether the review screen should tick it to start with.</summary>
    bool Preselected);

/// <summary>The rows the user kept on the review screen, saved into one of their accounts.</summary>
public sealed class ImportTransactionsRequest
{
    [Required]
    public Guid? AccountId { get; init; }

    [Required, MinLength(1), MaxLength(1000)]
    public List<ImportTransactionRow> Rows { get; init; } = [];
}

public sealed class ImportTransactionRow
{
    [Required]
    public Guid? Id { get; init; }

    [Required, AllowedValues(TransactionValues.Expense, TransactionValues.Income)]
    public string Type { get; init; } = TransactionValues.Expense;

    [Range(TransactionValues.MinAmount, TransactionValues.MaxAmount)]
    public decimal Amount { get; init; }

    [Required, AllowedValues(TransactionValues.Groceries, TransactionValues.Fuel, TransactionValues.Salary,
        TransactionValues.Bills, TransactionValues.Dining, TransactionValues.Other)]
    public string Category { get; init; } = TransactionValues.Other;

    [StringLength(60)]
    public string? Note { get; init; }

    [Required]
    public DateOnly? Date { get; init; }
}

/// <summary>Imported: new rows. Restored: rows imported before, deleted, and now brought back. Skipped: already there.</summary>
public sealed record ImportTransactionsResponse(int Imported, int Restored, int Skipped);
