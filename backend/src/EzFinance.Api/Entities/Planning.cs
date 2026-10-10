namespace EzFinance.Api.Entities;

/// <summary>Row in public.goals: a savings goal. What's saved is the sum of its contributions.</summary>
public sealed class Goal
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Target { get; set; }
    public DateOnly? Deadline { get; set; }
    public string? Icon { get; set; }
    public bool Paused { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}

/// <summary>Row in public.goal_contributions: money put towards a goal (negative = withdrawn).</summary>
public sealed class GoalContribution
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid GoalId { get; set; }
    public decimal Amount { get; set; }
    public DateOnly OccurredOn { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

/// <summary>Row in public.budgets: the user's monthly spending limit.</summary>
public sealed class Budget
{
    public Guid UserId { get; set; }
    public decimal MonthlyLimit { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

/// <summary>
/// Row in public.budget_envelopes: a monthly cap for one spending category (matched to
/// transactions by name).
/// </summary>
public sealed class BudgetEnvelope
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "package";
    public string Color { get; set; } = "#0047AB";
    public decimal MonthlyLimit { get; set; }
    public bool IsMain { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}
