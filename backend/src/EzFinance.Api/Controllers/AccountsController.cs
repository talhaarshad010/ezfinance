using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Auth;
using EzFinance.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>
/// The signed-in user's bank accounts and wallets. Balances are worked out here: the opening
/// balance plus income minus spending of the account's (non-deleted) transactions. Another user's
/// account answers 404. Removing an account is a soft delete, so its transactions keep their link.
/// </summary>
[ApiController]
[Route("api/accounts")]
[Authorize]
public sealed class AccountsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AccountResponse>>> List(CancellationToken ct)
    {
        var accounts = await Owned()
            .Where(a => a.DeletedAt == null)
            .OrderBy(a => a.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);
        var nets = await NetByAccountAsync(accounts.Select(a => a.Id).ToList(), ct);
        return Ok(accounts.Select(a => AccountResponse.From(a, nets.GetValueOrDefault(a.Id))).ToList());
    }

    /// <summary>Adds an account with the id the app chose; the same id again returns the existing one.</summary>
    [HttpPost]
    public async Task<ActionResult<AccountResponse>> Create(CreateAccountRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var existing = await db.BankAccounts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == request.Id, ct);
        if (existing is not null)
        {
            if (existing.UserId != userId)
            {
                return Fail(StatusCodes.Status409Conflict, "id_conflict", "Use a different account id.");
            }
            var net = (await NetByAccountAsync([existing.Id], ct)).GetValueOrDefault(existing.Id);
            return Ok(AccountResponse.From(existing, net));
        }

        var now = DateTimeOffset.UtcNow;
        var account = new BankAccount
        {
            Id = request.Id!.Value,
            UserId = userId,
            BankId = request.BankId.Trim(),
            BankName = request.BankName.Trim(),
            AccountTitle = request.AccountTitle.Trim(),
            AccountLast4 = request.AccountLast4,
            OpeningBalance = Math.Round(request.Balance, 2),
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.BankAccounts.Add(account);
        await db.SaveChangesAsync(ct);
        return Created($"/api/accounts/{account.Id}", AccountResponse.From(account, 0));
    }

    /// <summary>
    /// Sets what the account holds now. The opening balance takes the difference, so the
    /// account's transactions stay as they are and later ones carry on from this figure.
    /// </summary>
    [HttpPut("{id:guid}/balance")]
    public async Task<ActionResult<AccountResponse>> UpdateBalance(Guid id, UpdateAccountBalanceRequest request, CancellationToken ct)
    {
        var account = await Owned().FirstOrDefaultAsync(a => a.Id == id && a.DeletedAt == null, ct);
        if (account is null) return NotFoundProblem();

        var net = (await NetByAccountAsync([id], ct)).GetValueOrDefault(id);
        account.OpeningBalance = Math.Round(request.Balance, 2) - net;
        account.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(AccountResponse.From(account, net));
    }

    /// <summary>Removes the account (soft delete). Removing one that's already removed is a no-op.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var account = await Owned().FirstOrDefaultAsync(a => a.Id == id, ct);
        if (account is null) return NotFoundProblem();

        if (account.DeletedAt is null)
        {
            account.DeletedAt = DateTimeOffset.UtcNow;
            account.UpdatedAt = account.DeletedAt.Value;
            await db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    private IQueryable<BankAccount> Owned()
    {
        var userId = User.GetUserId();
        return db.BankAccounts.Where(a => a.UserId == userId);
    }

    /// <summary>
    /// Net movement of each account: income minus spending of its transactions, plus transfers in
    /// minus transfers out (deleted ones left out).
    /// </summary>
    private async Task<Dictionary<Guid, decimal>> NetByAccountAsync(List<Guid> accountIds, CancellationToken ct)
    {
        if (accountIds.Count == 0) return [];
        var userId = User.GetUserId();
        var txNet = await db.Transactions
            .Where(t => t.UserId == userId && t.DeletedAt == null && accountIds.Contains(t.AccountId))
            .GroupBy(t => t.AccountId)
            .Select(g => new { AccountId = g.Key, Net = g.Sum(t => t.Type == TransactionValues.Income ? t.Amount : -t.Amount) })
            .ToListAsync(ct);
        var outgoing = await db.Transfers
            .Where(t => t.UserId == userId && t.DeletedAt == null && accountIds.Contains(t.FromAccountId))
            .GroupBy(t => t.FromAccountId)
            .Select(g => new { AccountId = g.Key, Net = -g.Sum(t => t.Amount) })
            .ToListAsync(ct);
        var incoming = await db.Transfers
            .Where(t => t.UserId == userId && t.DeletedAt == null && accountIds.Contains(t.ToAccountId))
            .GroupBy(t => t.ToAccountId)
            .Select(g => new { AccountId = g.Key, Net = g.Sum(t => t.Amount) })
            .ToListAsync(ct);

        var nets = new Dictionary<Guid, decimal>();
        foreach (var row in txNet.Concat(outgoing).Concat(incoming))
        {
            nets[row.AccountId] = nets.GetValueOrDefault(row.AccountId) + row.Net;
        }
        return nets;
    }

    private ObjectResult NotFoundProblem() =>
        Fail(StatusCodes.Status404NotFound, "account_not_found", "Account not found.");

    private ObjectResult Fail(int status, string code, string detail)
    {
        var problem = ProblemDetailsFactory.CreateProblemDetails(HttpContext, status, detail: detail);
        problem.Extensions["code"] = code;
        return new ObjectResult(problem) { StatusCode = status };
    }
}
