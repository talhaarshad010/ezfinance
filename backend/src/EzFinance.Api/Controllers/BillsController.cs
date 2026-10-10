using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>
/// The signed-in user's repeated (monthly) bills. Another user's bill answers 404. Paying a bill
/// logs an expense transaction in the bill's account and records the day it was paid.
/// </summary>
[Route("api/bills")]
public sealed class BillsController(AppDbContext db) : UserDataController(db)
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BillResponse>>> List(CancellationToken ct) =>
        Ok(await Owned().Where(b => b.DeletedAt == null).OrderBy(b => b.DueDay).ThenBy(b => b.CreatedAt)
            .AsNoTracking().Select(b => BillResponse.From(b)).ToListAsync(ct));

    /// <summary>Adds a bill with the id the app chose; the same id again returns the existing one.</summary>
    [HttpPost]
    public async Task<ActionResult<BillResponse>> Create(CreateBillRequest request, CancellationToken ct)
    {
        var existing = await Db.RecurringBills.AsNoTracking().FirstOrDefaultAsync(b => b.Id == request.Id, ct);
        if (existing is not null)
        {
            return existing.UserId == UserId
                ? Ok(BillResponse.From(existing))
                : Fail(StatusCodes.Status409Conflict, "id_conflict", "Use a different bill id.");
        }
        if (!await IsLiveAccountAsync(request.AccountId, ct)) return InvalidAccount();

        var now = DateTimeOffset.UtcNow;
        var bill = new RecurringBill { Id = request.Id!.Value, UserId = UserId, CreatedAt = now, UpdatedAt = now };
        Apply(bill, request);
        Db.RecurringBills.Add(bill);
        await Db.SaveChangesAsync(ct);
        return Created($"/api/bills/{bill.Id}", BillResponse.From(bill));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BillResponse>> Update(Guid id, UpdateBillRequest request, CancellationToken ct)
    {
        var bill = await Owned().FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null, ct);
        if (bill is null) return NotFoundProblem();
        if (request.AccountId != bill.AccountId && !await IsLiveAccountAsync(request.AccountId, ct)) return InvalidAccount();

        Apply(bill, request);
        bill.UpdatedAt = DateTimeOffset.UtcNow;
        await Db.SaveChangesAsync(ct);
        return Ok(BillResponse.From(bill));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var bill = await Owned().FirstOrDefaultAsync(b => b.Id == id, ct);
        if (bill is null) return NotFoundProblem();
        if (bill.DeletedAt is null)
        {
            bill.DeletedAt = DateTimeOffset.UtcNow;
            bill.UpdatedAt = bill.DeletedAt.Value;
            await Db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    /// <summary>
    /// Marks the bill paid: logs an expense (with the app's transaction id) in the bill's account and
    /// sets the paid day, in one database transaction. A retry with the same transaction id is a no-op.
    /// </summary>
    [HttpPost("{id:guid}/pay")]
    public async Task<ActionResult<PayBillResponse>> Pay(Guid id, PayBillRequest request, CancellationToken ct)
    {
        var bill = await Owned().FirstOrDefaultAsync(b => b.Id == id && b.DeletedAt == null, ct);
        if (bill is null) return NotFoundProblem();
        if (IsFuture(request.Date!.Value)) return Fail(StatusCodes.Status400BadRequest, "future_date", "The date can't be in the future.");

        var existing = await Db.Transactions.AsNoTracking().FirstOrDefaultAsync(t => t.Id == request.TransactionId, ct);
        if (existing is not null)
        {
            return existing.UserId == UserId
                ? Ok(new PayBillResponse(BillResponse.From(bill), TransactionResponse.From(existing)))
                : Fail(StatusCodes.Status409Conflict, "id_conflict", "Use a different transaction id.");
        }
        if (!await IsLiveAccountAsync(bill.AccountId, ct))
        {
            return Fail(StatusCodes.Status400BadRequest, "invalid_account", "This bill's account was removed. Edit the bill to pick another account.");
        }

        await using var dbTx = await Db.Database.BeginTransactionAsync(ct);
        var now = DateTimeOffset.UtcNow;
        var tx = new Transaction
        {
            Id = request.TransactionId!.Value,
            UserId = UserId,
            Type = TransactionValues.Expense,
            Amount = bill.Amount,
            Category = bill.Category,
            Note = bill.Name,
            AccountId = bill.AccountId,
            OccurredOn = request.Date!.Value,
            Source = TransactionValues.SourceManual,
            CreatedAt = now,
            UpdatedAt = now,
        };
        Db.Transactions.Add(tx);
        if (bill.LastPaidOn is null || request.Date > bill.LastPaidOn) bill.LastPaidOn = request.Date;
        bill.UpdatedAt = now;
        await Db.SaveChangesAsync(ct);
        await dbTx.CommitAsync(ct);

        return Ok(new PayBillResponse(BillResponse.From(bill), TransactionResponse.From(tx)));
    }

    private IQueryable<RecurringBill> Owned()
    {
        var userId = UserId;
        return Db.RecurringBills.Where(b => b.UserId == userId);
    }

    private static void Apply(RecurringBill bill, BillFields f)
    {
        bill.AccountId = f.AccountId!.Value;
        bill.Name = f.Name.Trim();
        bill.Amount = Math.Round(f.Amount, 2);
        bill.Category = f.Category;
        bill.DueDay = (short)f.DueDay;
        bill.RemindDaysBefore = (short)f.RemindDaysBefore;
    }

    private ObjectResult NotFoundProblem() => Fail(StatusCodes.Status404NotFound, "bill_not_found", "Bill not found.");
}
