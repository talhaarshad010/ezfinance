using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>
/// The signed-in user's monthly budget and its envelopes (monthly caps per spending category).
/// Envelopes must fit inside the monthly limit, and each name is used once.
/// </summary>
[Route("api/budget")]
public sealed class BudgetController(AppDbContext db) : UserDataController(db)
{
    [HttpGet]
    public async Task<ActionResult<BudgetResponse>> Get(CancellationToken ct)
    {
        var userId = UserId;
        var budget = await Db.Budgets.AsNoTracking().FirstOrDefaultAsync(b => b.UserId == userId, ct);
        var envelopes = await Envelopes().OrderBy(e => e.CreatedAt).AsNoTracking().ToListAsync(ct);
        return Ok(new BudgetResponse(budget?.MonthlyLimit, envelopes.Select(EnvelopeResponse.From).ToList()));
    }

    /// <summary>Sets the monthly limit. It can't be less than what the envelopes already hold.</summary>
    [HttpPut]
    public async Task<ActionResult<BudgetResponse>> Set(SetBudgetRequest request, CancellationToken ct)
    {
        var limit = Math.Round(request.MonthlyLimit, 2);
        var allocated = await Envelopes().SumAsync(e => e.MonthlyLimit, ct);
        if (limit < allocated)
        {
            return Fail(StatusCodes.Status400BadRequest, "below_allocated",
                $"Your envelopes already hold PKR {allocated:N0}. Lower them first, or set at least that much.");
        }

        var userId = UserId;
        var now = DateTimeOffset.UtcNow;
        var budget = await Db.Budgets.FirstOrDefaultAsync(b => b.UserId == userId, ct);
        if (budget is null)
        {
            Db.Budgets.Add(new Budget { UserId = userId, MonthlyLimit = limit, CreatedAt = now, UpdatedAt = now });
        }
        else
        {
            budget.MonthlyLimit = limit;
            budget.UpdatedAt = now;
        }
        await Db.SaveChangesAsync(ct);
        return await Get(ct);
    }

    [HttpPost("envelopes")]
    public async Task<ActionResult<EnvelopeResponse>> CreateEnvelope(CreateEnvelopeRequest request, CancellationToken ct)
    {
        var existing = await Db.BudgetEnvelopes.AsNoTracking().FirstOrDefaultAsync(e => e.Id == request.Id, ct);
        if (existing is not null)
        {
            return existing.UserId == UserId
                ? Ok(EnvelopeResponse.From(existing))
                : Fail(StatusCodes.Status409Conflict, "id_conflict", "Use a different envelope id.");
        }
        if (await ProblemAsync(request, exceptId: null, ct) is { } problem) return problem;

        var now = DateTimeOffset.UtcNow;
        var envelope = new BudgetEnvelope { Id = request.Id!.Value, UserId = UserId, CreatedAt = now, UpdatedAt = now };
        Apply(envelope, request);
        Db.BudgetEnvelopes.Add(envelope);
        await Db.SaveChangesAsync(ct);
        return Created($"/api/budget/envelopes/{envelope.Id}", EnvelopeResponse.From(envelope));
    }

    [HttpPut("envelopes/{id:guid}")]
    public async Task<ActionResult<EnvelopeResponse>> UpdateEnvelope(Guid id, UpdateEnvelopeRequest request, CancellationToken ct)
    {
        var envelope = await Envelopes().FirstOrDefaultAsync(e => e.Id == id, ct);
        if (envelope is null) return NotFoundProblem();
        if (await ProblemAsync(request, exceptId: id, ct) is { } problem) return problem;

        Apply(envelope, request);
        envelope.UpdatedAt = DateTimeOffset.UtcNow;
        await Db.SaveChangesAsync(ct);
        return Ok(EnvelopeResponse.From(envelope));
    }

    [HttpDelete("envelopes/{id:guid}")]
    public async Task<IActionResult> DeleteEnvelope(Guid id, CancellationToken ct)
    {
        var userId = UserId;
        var envelope = await Db.BudgetEnvelopes.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId, ct);
        if (envelope is null) return NotFoundProblem();
        if (envelope.DeletedAt is null)
        {
            envelope.DeletedAt = DateTimeOffset.UtcNow;
            envelope.UpdatedAt = envelope.DeletedAt.Value;
            await Db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    /// <summary>Live envelopes of the caller.</summary>
    private IQueryable<BudgetEnvelope> Envelopes()
    {
        var userId = UserId;
        return Db.BudgetEnvelopes.Where(e => e.UserId == userId && e.DeletedAt == null);
    }

    /// <summary>A budget must be set, the name unused, and all envelopes must fit in the limit.</summary>
    private async Task<ObjectResult?> ProblemAsync(EnvelopeFields f, Guid? exceptId, CancellationToken ct)
    {
        var userId = UserId;
        var budget = await Db.Budgets.AsNoTracking().FirstOrDefaultAsync(b => b.UserId == userId, ct);
        if (budget is null)
        {
            return Fail(StatusCodes.Status400BadRequest, "no_budget", "Set a monthly budget first.");
        }
        var name = f.Name.Trim().ToLower();
        if (await Envelopes().AnyAsync(e => e.Id != exceptId && e.Name.ToLower() == name, ct))
        {
            return Fail(StatusCodes.Status409Conflict, "duplicate_envelope", "You already have an envelope with this name.");
        }
        var others = await Envelopes().Where(e => e.Id != exceptId).SumAsync(e => e.MonthlyLimit, ct);
        if (others + f.MonthlyLimit > budget.MonthlyLimit)
        {
            return Fail(StatusCodes.Status400BadRequest, "over_budget",
                $"That's more than your budget has left. Maximum: PKR {Math.Max(0, budget.MonthlyLimit - others):N0}.");
        }
        return null;
    }

    private static void Apply(BudgetEnvelope e, EnvelopeFields f)
    {
        e.Name = f.Name.Trim();
        e.Icon = string.IsNullOrWhiteSpace(f.Icon) ? "package" : f.Icon.Trim();
        e.Color = string.IsNullOrWhiteSpace(f.Color) ? "#0047AB" : f.Color;
        e.MonthlyLimit = Math.Round(f.MonthlyLimit, 2);
        e.IsMain = f.IsMain;
    }

    private ObjectResult NotFoundProblem() =>
        Fail(StatusCodes.Status404NotFound, "envelope_not_found", "Envelope not found.");
}
