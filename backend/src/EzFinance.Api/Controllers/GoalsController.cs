using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>
/// The signed-in user's savings goals. What's saved is the sum of a goal's contributions. Another
/// user's goal answers 404. Archiving a goal is a soft delete.
/// </summary>
[Route("api/goals")]
public sealed class GoalsController(AppDbContext db) : UserDataController(db)
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GoalResponse>>> List(CancellationToken ct)
    {
        var goals = await Owned().Where(g => g.DeletedAt == null).OrderBy(g => g.CreatedAt).AsNoTracking().ToListAsync(ct);
        var saved = await SavedByGoalAsync(goals.Select(g => g.Id).ToList(), ct);
        return Ok(goals.Select(g => GoalResponse.From(g, saved.GetValueOrDefault(g.Id))).ToList());
    }

    /// <summary>Adds a goal with the id the app chose; the same id again returns the existing one.</summary>
    [HttpPost]
    public async Task<ActionResult<GoalResponse>> Create(CreateGoalRequest request, CancellationToken ct)
    {
        var existing = await Db.Goals.AsNoTracking().FirstOrDefaultAsync(g => g.Id == request.Id, ct);
        if (existing is not null)
        {
            if (existing.UserId != UserId) return Fail(StatusCodes.Status409Conflict, "id_conflict", "Use a different goal id.");
            var saved = (await SavedByGoalAsync([existing.Id], ct)).GetValueOrDefault(existing.Id);
            return Ok(GoalResponse.From(existing, saved));
        }

        var now = DateTimeOffset.UtcNow;
        var goal = new Goal { Id = request.Id!.Value, UserId = UserId, CreatedAt = now, UpdatedAt = now };
        Apply(goal, request);
        Db.Goals.Add(goal);
        await Db.SaveChangesAsync(ct);
        return Created($"/api/goals/{goal.Id}", GoalResponse.From(goal, 0));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GoalResponse>> Update(Guid id, UpdateGoalRequest request, CancellationToken ct)
    {
        var goal = await Owned().FirstOrDefaultAsync(g => g.Id == id && g.DeletedAt == null, ct);
        if (goal is null) return NotFoundProblem();

        Apply(goal, request);
        goal.UpdatedAt = DateTimeOffset.UtcNow;
        await Db.SaveChangesAsync(ct);
        var saved = (await SavedByGoalAsync([id], ct)).GetValueOrDefault(id);
        return Ok(GoalResponse.From(goal, saved));
    }

    /// <summary>Archives the goal (soft delete); its contributions stay on record.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var goal = await Owned().FirstOrDefaultAsync(g => g.Id == id, ct);
        if (goal is null) return NotFoundProblem();
        if (goal.DeletedAt is null)
        {
            goal.DeletedAt = DateTimeOffset.UtcNow;
            goal.UpdatedAt = goal.DeletedAt.Value;
            await Db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    /// <summary>
    /// Puts money towards the goal (or takes some out). The total saved can't go below zero.
    /// A retry with the same contribution id is a no-op.
    /// </summary>
    [HttpPost("{id:guid}/contributions")]
    public async Task<ActionResult<GoalResponse>> Contribute(Guid id, ContributionRequest request, CancellationToken ct)
    {
        var goal = await Owned().FirstOrDefaultAsync(g => g.Id == id && g.DeletedAt == null, ct);
        if (goal is null) return NotFoundProblem();
        if (request.Amount == 0) return Fail(StatusCodes.Status400BadRequest, "invalid_amount", "Enter an amount.");
        if (IsFuture(request.Date!.Value)) return Fail(StatusCodes.Status400BadRequest, "future_date", "The date can't be in the future.");

        var existing = await Db.GoalContributions.AsNoTracking().FirstOrDefaultAsync(c => c.Id == request.Id, ct);
        if (existing is not null && existing.UserId != UserId)
        {
            return Fail(StatusCodes.Status409Conflict, "id_conflict", "Use a different contribution id.");
        }

        var saved = (await SavedByGoalAsync([id], ct)).GetValueOrDefault(id);
        if (existing is null)
        {
            if (saved + request.Amount < 0)
            {
                return Fail(StatusCodes.Status400BadRequest, "insufficient_saved", $"Only PKR {saved:N0} is saved in this goal.");
            }
            Db.GoalContributions.Add(new GoalContribution
            {
                Id = request.Id!.Value,
                UserId = UserId,
                GoalId = id,
                Amount = Math.Round(request.Amount, 2),
                OccurredOn = request.Date!.Value,
                CreatedAt = DateTimeOffset.UtcNow,
            });
            goal.UpdatedAt = DateTimeOffset.UtcNow;
            await Db.SaveChangesAsync(ct);
            saved += Math.Round(request.Amount, 2);
        }
        return Ok(GoalResponse.From(goal, saved));
    }

    private IQueryable<Goal> Owned()
    {
        var userId = UserId;
        return Db.Goals.Where(g => g.UserId == userId);
    }

    private async Task<Dictionary<Guid, decimal>> SavedByGoalAsync(List<Guid> goalIds, CancellationToken ct)
    {
        if (goalIds.Count == 0) return [];
        var userId = UserId;
        return await Db.GoalContributions
            .Where(c => c.UserId == userId && goalIds.Contains(c.GoalId))
            .GroupBy(c => c.GoalId)
            .Select(g => new { GoalId = g.Key, Saved = g.Sum(c => c.Amount) })
            .ToDictionaryAsync(x => x.GoalId, x => x.Saved, ct);
    }

    private static void Apply(Goal goal, GoalFields f)
    {
        goal.Name = f.Name.Trim();
        goal.Target = Math.Round(f.Target, 2);
        goal.Deadline = f.Deadline;
        goal.Icon = string.IsNullOrWhiteSpace(f.Icon) ? null : f.Icon.Trim();
        goal.Paused = f.Paused;
    }

    private ObjectResult NotFoundProblem() => Fail(StatusCodes.Status404NotFound, "goal_not_found", "Goal not found.");
}
