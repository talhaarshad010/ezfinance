using System.ComponentModel.DataAnnotations;
using EzFinance.Api.Entities;

namespace EzFinance.Api.Contracts;

// ── Goals ───────────────────────────────────────────────────────────────────

public sealed record GoalResponse(
    Guid Id, string Name, decimal Target, decimal Saved, DateOnly? Deadline, string? Icon, bool Paused,
    DateTimeOffset CreatedAt)
{
    public static GoalResponse From(Goal g, decimal saved) =>
        new(g.Id, g.Name, g.Target, saved, g.Deadline, g.Icon, g.Paused, g.CreatedAt);
}

public class GoalFields
{
    [Required, StringLength(40, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [Range(0.01, 100_000_000_000d)]
    public decimal Target { get; init; }

    public DateOnly? Deadline { get; init; }

    [StringLength(40)]
    public string? Icon { get; init; }

    public bool Paused { get; init; }
}

public sealed class CreateGoalRequest : GoalFields
{
    [Required]
    public Guid? Id { get; init; }
}

public sealed class UpdateGoalRequest : GoalFields;

/// <summary>Money put towards a goal (negative to take some out).</summary>
public sealed class ContributionRequest
{
    [Required]
    public Guid? Id { get; init; }

    [Range(-100_000_000_000d, 100_000_000_000d)]
    public decimal Amount { get; init; }

    [Required]
    public DateOnly? Date { get; init; }
}

// ── Budget ──────────────────────────────────────────────────────────────────

public sealed record EnvelopeResponse(
    Guid Id, string Name, string Icon, string Color, decimal MonthlyLimit, bool IsMain)
{
    public static EnvelopeResponse From(BudgetEnvelope e) => new(e.Id, e.Name, e.Icon, e.Color, e.MonthlyLimit, e.IsMain);
}

/// <summary>The user's monthly limit (null until set) and envelopes.</summary>
public sealed record BudgetResponse(decimal? MonthlyLimit, IReadOnlyList<EnvelopeResponse> Envelopes);

public sealed class SetBudgetRequest
{
    [Range(0.01, 100_000_000_000d)]
    public decimal MonthlyLimit { get; init; }
}

public class EnvelopeFields
{
    [Required, StringLength(40, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(40)]
    public string? Icon { get; init; }

    [RegularExpression("^#[0-9A-Fa-f]{6}$")]
    public string? Color { get; init; }

    [Range(0.01, 100_000_000_000d)]
    public decimal MonthlyLimit { get; init; }

    public bool IsMain { get; init; }
}

public sealed class CreateEnvelopeRequest : EnvelopeFields
{
    [Required]
    public Guid? Id { get; init; }
}

public sealed class UpdateEnvelopeRequest : EnvelopeFields;
