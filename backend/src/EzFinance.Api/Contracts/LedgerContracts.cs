using System.ComponentModel.DataAnnotations;
using EzFinance.Api.Entities;

namespace EzFinance.Api.Contracts;

// ── Repeated bills ──────────────────────────────────────────────────────────

public sealed record BillResponse(
    Guid Id, Guid AccountId, string Name, decimal Amount, string Category, int DueDay,
    int RemindDaysBefore, DateOnly? LastPaidOn, DateTimeOffset CreatedAt)
{
    public static BillResponse From(RecurringBill b) => new(
        b.Id, b.AccountId, b.Name, b.Amount, b.Category, b.DueDay, b.RemindDaysBefore, b.LastPaidOn, b.CreatedAt);
}

public class BillFields
{
    /// <summary>The linked account the bill is paid from.</summary>
    [Required]
    public Guid? AccountId { get; init; }

    [Required, StringLength(60, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [Range(TransactionValues.MinAmount, TransactionValues.MaxAmount)]
    public decimal Amount { get; init; }

    [Required, AllowedValues(TransactionValues.Groceries, TransactionValues.Fuel, TransactionValues.Salary,
        TransactionValues.Bills, TransactionValues.Dining, TransactionValues.Other)]
    public string Category { get; init; } = TransactionValues.Bills;

    [Range(1, 31)]
    public int DueDay { get; init; }

    [Range(0, 14)]
    public int RemindDaysBefore { get; init; } = 3;
}

public sealed class CreateBillRequest : BillFields
{
    [Required]
    public Guid? Id { get; init; }
}

public sealed class UpdateBillRequest : BillFields;

/// <summary>Marks a bill paid: logs an expense with this id in the bill's account.</summary>
public sealed class PayBillRequest
{
    [Required]
    public Guid? TransactionId { get; init; }

    [Required]
    public DateOnly? Date { get; init; }
}

public sealed record PayBillResponse(BillResponse Bill, TransactionResponse Transaction);

// ── Loans ───────────────────────────────────────────────────────────────────

public sealed record LoanResponse(
    Guid Id, string Name, string Lender, decimal TotalAmount, decimal Remaining, decimal InterestRate,
    decimal Emi, int DueDay, int RemindDaysBefore, bool RemindOnDue, DateTimeOffset CreatedAt)
{
    public static LoanResponse From(Loan l) => new(
        l.Id, l.Name, l.Lender, l.TotalAmount, l.Remaining, l.InterestRate, l.Emi, l.DueDay,
        l.RemindDaysBefore, l.RemindOnDue, l.CreatedAt);
}

public class LoanFields
{
    [Required, StringLength(60, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(60)]
    public string? Lender { get; init; }

    [Range(0.01, 100_000_000_000d)]
    public decimal TotalAmount { get; init; }

    [Range(0, 100_000_000_000d)]
    public decimal Remaining { get; init; }

    [Range(0, 100)]
    public decimal InterestRate { get; init; }

    [Range(0, 1_000_000_000d)]
    public decimal Emi { get; init; }

    [Range(1, 31)]
    public int DueDay { get; init; }

    [Range(0, 14)]
    public int RemindDaysBefore { get; init; } = 3;

    public bool RemindOnDue { get; init; } = true;
}

public sealed class CreateLoanRequest : LoanFields
{
    [Required]
    public Guid? Id { get; init; }
}

public sealed class UpdateLoanRequest : LoanFields;

// ── Transfers ───────────────────────────────────────────────────────────────

public sealed record TransferResponse(
    Guid Id, Guid FromAccountId, Guid ToAccountId, decimal Amount, string? Note, DateOnly Date, DateTimeOffset CreatedAt)
{
    public static TransferResponse From(Transfer t) => new(
        t.Id, t.FromAccountId, t.ToAccountId, t.Amount, t.Note, t.OccurredOn, t.CreatedAt);
}

public sealed class CreateTransferRequest
{
    [Required]
    public Guid? Id { get; init; }

    [Required]
    public Guid? FromAccountId { get; init; }

    [Required]
    public Guid? ToAccountId { get; init; }

    [Range(TransactionValues.MinAmount, TransactionValues.MaxAmount)]
    public decimal Amount { get; init; }

    [StringLength(60)]
    public string? Note { get; init; }

    [Required]
    public DateOnly? Date { get; init; }
}
