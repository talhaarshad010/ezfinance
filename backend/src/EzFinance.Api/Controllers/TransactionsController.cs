using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Auth;
using EzFinance.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>
/// The signed-in user's transactions. Every query is scoped to the caller's user id, and another
/// user's transaction answers 404 so its existence is never revealed. Deletes are soft (Undo
/// restores them) and deleted rows are left out of every read.
/// </summary>
[ApiController]
[Route("api/transactions")]
[Authorize]
public sealed class TransactionsController(AppDbContext db) : ControllerBase
{
    private const int DefaultPageSize = 100;
    private const int MaxPageSize = 500;

    /// <summary>Transactions, newest first. All filters are optional.</summary>
    [HttpGet]
    public async Task<ActionResult<TransactionPage>> List(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? type,
        [FromQuery] string? category,
        [FromQuery] Guid? accountId,
        [FromQuery] string? q,
        [FromQuery] int? limit,
        [FromQuery] string? cursor,
        CancellationToken ct)
    {
        var size = Math.Clamp(limit ?? DefaultPageSize, 1, MaxPageSize);
        var offset = int.TryParse(cursor, out var parsed) && parsed > 0 ? parsed : 0;

        var query = Owned().Where(t => t.DeletedAt == null);
        if (from is not null) query = query.Where(t => t.OccurredOn >= from);
        if (to is not null) query = query.Where(t => t.OccurredOn <= to);
        if (!string.IsNullOrWhiteSpace(type)) query = query.Where(t => t.Type == type);
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(t => t.Category == category);
        if (accountId is not null) query = query.Where(t => t.AccountId == accountId);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var pattern = $"%{q.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_")}%";
            query = query.Where(t => EF.Functions.ILike(t.Note ?? "", pattern) || EF.Functions.ILike(t.Category, pattern));
        }

        // One extra row tells us whether there is another page.
        var rows = await query
            .OrderByDescending(t => t.OccurredOn)
            .ThenByDescending(t => t.CreatedAt)
            .ThenBy(t => t.Id)
            .Skip(offset)
            .Take(size + 1)
            .AsNoTracking()
            .ToListAsync(ct);

        var hasMore = rows.Count > size;
        var items = rows.Take(size).Select(TransactionResponse.From).ToList();
        return Ok(new TransactionPage(items, hasMore ? (offset + size).ToString() : null));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TransactionResponse>> Get(Guid id, CancellationToken ct)
    {
        var tx = await Owned().AsNoTracking().FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null, ct);
        return tx is null ? NotFoundProblem() : Ok(TransactionResponse.From(tx));
    }

    /// <summary>
    /// Creates a transaction with the id the app chose. Sending the same id again (a retry, or the
    /// offline queue replaying) returns the existing row instead of creating a duplicate.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TransactionResponse>> Create(CreateTransactionRequest request, CancellationToken ct)
    {
        if (DateProblem(request.Date!.Value) is { } dateProblem) return dateProblem;
        if (await AccountProblemAsync(request.AccountId, ct) is { } accountProblem) return accountProblem;

        var userId = User.GetUserId();
        var existing = await db.Transactions.AsNoTracking().FirstOrDefaultAsync(t => t.Id == request.Id, ct);
        if (existing is not null)
        {
            return existing.UserId == userId
                ? Ok(TransactionResponse.From(existing))
                : Fail(StatusCodes.Status409Conflict, "id_conflict", "Use a different transaction id.");
        }

        var now = DateTimeOffset.UtcNow;
        var tx = new Transaction
        {
            Id = request.Id!.Value,
            UserId = userId,
            Source = request.Source,
            CreatedAt = now,
            UpdatedAt = now,
        };
        Apply(tx, request);
        db.Transactions.Add(tx);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = tx.Id }, TransactionResponse.From(tx));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TransactionResponse>> Update(Guid id, UpdateTransactionRequest request, CancellationToken ct)
    {
        if (DateProblem(request.Date!.Value) is { } dateProblem) return dateProblem;

        var tx = await Owned().FirstOrDefaultAsync(t => t.Id == id && t.DeletedAt == null, ct);
        if (tx is null) return NotFoundProblem();
        // An existing link to a since-removed account may stay; a new link must be a live account.
        if (request.AccountId != tx.AccountId && await AccountProblemAsync(request.AccountId, ct) is { } accountProblem)
        {
            return accountProblem;
        }

        Apply(tx, request);
        tx.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(TransactionResponse.From(tx));
    }

    /// <summary>Soft-deletes the transaction. Deleting one that's already deleted is a no-op.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var tx = await Owned().FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tx is null) return NotFoundProblem();

        if (tx.DeletedAt is null)
        {
            tx.DeletedAt = DateTimeOffset.UtcNow;
            tx.UpdatedAt = tx.DeletedAt.Value;
            await db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    /// <summary>Undo for delete: brings the transaction back.</summary>
    [HttpPost("{id:guid}/restore")]
    public async Task<ActionResult<TransactionResponse>> Restore(Guid id, CancellationToken ct)
    {
        var tx = await Owned().FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tx is null) return NotFoundProblem();

        if (tx.DeletedAt is not null)
        {
            tx.DeletedAt = null;
            tx.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        return Ok(TransactionResponse.From(tx));
    }

    /// <summary>
    /// Replaces a transaction with parts (same type, account, date and source) whose amounts add up
    /// to the original. Runs in one database transaction. A retried split returns the same parts.
    /// </summary>
    [HttpPost("{id:guid}/split")]
    public async Task<ActionResult<IReadOnlyList<TransactionResponse>>> Split(
        Guid id, SplitTransactionRequest request, CancellationToken ct)
    {
        var partIds = request.Parts.Select(p => p.Id!.Value).ToList();
        if (partIds.Distinct().Count() != partIds.Count || partIds.Contains(id))
        {
            return Fail(StatusCodes.Status400BadRequest, "invalid_split", "Each part needs its own id.");
        }

        var original = await Owned().FirstOrDefaultAsync(t => t.Id == id, ct);
        if (original is null) return NotFoundProblem();

        var existingParts = await db.Transactions.AsNoTracking().Where(t => partIds.Contains(t.Id)).ToListAsync(ct);
        if (existingParts.Count > 0)
        {
            // A retry of a split that already went through returns its parts; anything else is a clash.
            var isRetry = original.DeletedAt is not null
                && existingParts.Count == partIds.Count
                && existingParts.All(p => p.UserId == original.UserId);
            return isRetry
                ? Ok(existingParts.OrderBy(p => partIds.IndexOf(p.Id)).Select(TransactionResponse.From).ToList())
                : Fail(StatusCodes.Status409Conflict, "id_conflict", "Use different ids for the parts.");
        }
        if (original.DeletedAt is not null) return NotFoundProblem();

        if (request.Parts.Sum(p => p.Amount) != original.Amount)
        {
            return Fail(StatusCodes.Status400BadRequest, "split_total_mismatch",
                $"The parts must add up to PKR {original.Amount:N2}.");
        }

        await using var dbTx = await db.Database.BeginTransactionAsync(ct);
        var now = DateTimeOffset.UtcNow;
        original.DeletedAt = now;
        original.UpdatedAt = now;
        var parts = request.Parts.Select(p => new Transaction
        {
            Id = p.Id!.Value,
            UserId = original.UserId,
            Type = original.Type,
            Amount = p.Amount,
            Category = p.Category,
            Note = string.IsNullOrWhiteSpace(p.Note) ? original.Note : p.Note.Trim(),
            AccountId = original.AccountId,
            OccurredOn = original.OccurredOn,
            Source = original.Source,
            ExcludeFromBudget = original.ExcludeFromBudget,
            CreatedAt = now,
            UpdatedAt = now,
        }).ToList();
        db.Transactions.AddRange(parts);
        await db.SaveChangesAsync(ct);
        await dbTx.CommitAsync(ct);

        return Ok(parts.Select(TransactionResponse.From).ToList());
    }

    private IQueryable<Transaction> Owned()
    {
        var userId = User.GetUserId();
        return db.Transactions.Where(t => t.UserId == userId);
    }

    private static void Apply(Transaction tx, TransactionFields fields)
    {
        tx.Type = fields.Type;
        tx.Amount = Math.Round(fields.Amount, 2);
        tx.Category = fields.Category;
        tx.Note = string.IsNullOrWhiteSpace(fields.Note) ? null : fields.Note.Trim();
        tx.AccountId = fields.AccountId!.Value;
        tx.OccurredOn = fields.Date!.Value;
        tx.ExcludeFromBudget = fields.ExcludeFromBudget;
    }

    /// <summary>The account must be one of the caller's live (not removed) accounts.</summary>
    private async Task<ObjectResult?> AccountProblemAsync(Guid? accountId, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var ok = accountId is not null
            && await db.BankAccounts.AnyAsync(a => a.Id == accountId && a.UserId == userId && a.DeletedAt == null, ct);
        return ok ? null : Fail(StatusCodes.Status400BadRequest, "invalid_account", "Pick one of your linked bank accounts.");
    }

    /// <summary>Dates can't be in the future (one day of slack for time zones ahead of UTC).</summary>
    private ObjectResult? DateProblem(DateOnly date) =>
        date > DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1)
            ? Fail(StatusCodes.Status400BadRequest, "future_date", "The date can't be in the future.")
            : null;

    private ObjectResult NotFoundProblem() =>
        Fail(StatusCodes.Status404NotFound, "transaction_not_found", "Transaction not found.");

    private ObjectResult Fail(int status, string code, string detail)
    {
        var problem = ProblemDetailsFactory.CreateProblemDetails(HttpContext, status, detail: detail);
        problem.Extensions["code"] = code;
        return new ObjectResult(problem) { StatusCode = status };
    }
}
