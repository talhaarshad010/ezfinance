using System.ComponentModel.DataAnnotations;
using EzFinance.Api.Entities;

namespace EzFinance.Api.Contracts;

/// <summary>An account with its live balance (opening balance plus its transactions).</summary>
public sealed record AccountResponse(
    Guid Id,
    string BankId,
    string BankName,
    string AccountTitle,
    string AccountLast4,
    decimal OpeningBalance,
    decimal Balance,
    DateTimeOffset CreatedAt)
{
    public static AccountResponse From(BankAccount a, decimal net) => new(
        a.Id, a.BankId, a.BankName, a.AccountTitle, a.AccountLast4, a.OpeningBalance, a.OpeningBalance + net, a.CreatedAt);
}

public sealed class CreateAccountRequest
{
    /// <summary>Created by the app, so a retried create returns the same account.</summary>
    [Required]
    public Guid? Id { get; init; }

    [Required, StringLength(40, MinimumLength = 1)]
    public string BankId { get; init; } = string.Empty;

    [Required, StringLength(60, MinimumLength = 1)]
    public string BankName { get; init; } = string.Empty;

    [Required, StringLength(60, MinimumLength = 1)]
    public string AccountTitle { get; init; } = string.Empty;

    /// <summary>Only the last 4 digits; the full account number never leaves the phone.</summary>
    [Required, RegularExpression("^[0-9]{4}$", ErrorMessage = "Enter the last 4 digits of the account number.")]
    public string AccountLast4 { get; init; } = string.Empty;

    /// <summary>What the account holds now.</summary>
    [Range(-100_000_000_000d, 100_000_000_000d)]
    public decimal Balance { get; init; }
}

public sealed class UpdateAccountBalanceRequest
{
    /// <summary>What the account holds now; later transactions carry on from here.</summary>
    [Range(-100_000_000_000d, 100_000_000_000d)]
    public decimal Balance { get; init; }
}
