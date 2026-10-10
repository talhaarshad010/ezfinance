using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>
/// Money moved between two of the signed-in user's accounts. Another user's transfer answers 404.
/// Deletes are soft, so Undo (restore) works.
/// </summary>
[Route("api/transfers")]
public sealed class TransfersController(AppDbContext db) : UserDataController(db)
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TransferResponse>>> List(CancellationToken ct) =>
        Ok(await Owned().Where(t => t.DeletedAt == null)
            .OrderByDescending(t => t.OccurredOn).ThenByDescending(t => t.CreatedAt)
            .AsNoTracking().Select(t => TransferResponse.From(t)).ToListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<TransferResponse>> Create(CreateTransferRequest request, CancellationToken ct)
    {
        if (IsFuture(request.Date!.Value)) return Fail(StatusCodes.Status400BadRequest, "future_date", "The date can't be in the future.");
        if (request.FromAccountId == request.ToAccountId)
        {
            return Fail(StatusCodes.Status400BadRequest, "same_account", "Pick two different accounts.");
        }

        var existing = await Db.Transfers.AsNoTracking().FirstOrDefaultAsync(t => t.Id == request.Id, ct);
        if (existing is not null)
        {
            return existing.UserId == UserId
                ? Ok(TransferResponse.From(existing))
                : Fail(StatusCodes.Status409Conflict, "id_conflict", "Use a different transfer id.");
        }
        if (!await IsLiveAccountAsync(request.FromAccountId, ct) || !await IsLiveAccountAsync(request.ToAccountId, ct))
        {
            return InvalidAccount();
        }

        var now = DateTimeOffset.UtcNow;
        var transfer = new Transfer
        {
            Id = request.Id!.Value,
            UserId = UserId,
            FromAccountId = request.FromAccountId!.Value,
            ToAccountId = request.ToAccountId!.Value,
            Amount = Math.Round(request.Amount, 2),
            Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            OccurredOn = request.Date!.Value,
            CreatedAt = now,
            UpdatedAt = now,
        };
        Db.Transfers.Add(transfer);
        await Db.SaveChangesAsync(ct);
        return Created($"/api/transfers/{transfer.Id}", TransferResponse.From(transfer));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var transfer = await Owned().FirstOrDefaultAsync(t => t.Id == id, ct);
        if (transfer is null) return NotFoundProblem();
        if (transfer.DeletedAt is null)
        {
            transfer.DeletedAt = DateTimeOffset.UtcNow;
            transfer.UpdatedAt = transfer.DeletedAt.Value;
            await Db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    /// <summary>Undo for delete.</summary>
    [HttpPost("{id:guid}/restore")]
    public async Task<ActionResult<TransferResponse>> Restore(Guid id, CancellationToken ct)
    {
        var transfer = await Owned().FirstOrDefaultAsync(t => t.Id == id, ct);
        if (transfer is null) return NotFoundProblem();
        if (transfer.DeletedAt is not null)
        {
            transfer.DeletedAt = null;
            transfer.UpdatedAt = DateTimeOffset.UtcNow;
            await Db.SaveChangesAsync(ct);
        }
        return Ok(TransferResponse.From(transfer));
    }

    private IQueryable<Transfer> Owned()
    {
        var userId = UserId;
        return Db.Transfers.Where(t => t.UserId == userId);
    }

    private ObjectResult NotFoundProblem() =>
        Fail(StatusCodes.Status404NotFound, "transfer_not_found", "Transfer not found.");
}
