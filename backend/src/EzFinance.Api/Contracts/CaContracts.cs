namespace EzFinance.Api.Contracts;

/// <summary>Request payload for the Personal CA (AI Chartered Accountant) endpoint.</summary>
public sealed record CaChatRequest(
    string Question,
    string MemoryContext,
    string? DeterministicBaseline,
    IReadOnlyList<CaChatHistoryItem>? History);

public sealed record CaChatHistoryItem(
    string Role,
    string Text);

/// <summary>A colored segment of the CA's answer (red for tax/deficit, green for savings/credit).</summary>
public sealed record CaSegment(
    string T,
    string? Tone = null);

/// <summary>A new personal fact extracted from the user's message to store in the Memory Bank.</summary>
public sealed record CaExtractedFact(
    string Key,
    string Value);

/// <summary>
/// A change the user asked for (add an expense or income, create a goal, set the budget, add to a goal).
/// It is only a proposal: the app shows it and saves it once the user confirms.
/// </summary>
public sealed record CaExecutableActionDto(
    string Kind,
    string? TxType,
    decimal Amount,
    string? Category,
    string? Note,
    string? AccountHint,
    string? GoalName,
    string? Date = null,
    string? Deadline = null);

/// <summary>
/// Response returned by the Personal CA endpoint. <c>Source</c> is "ai" when the model answered, or
/// "calculated" when the app's own calculation is returned because the model couldn't answer.
/// </summary>
public sealed record CaChatResponse(
    IReadOnlyList<CaSegment> Segments,
    IReadOnlyList<CaExtractedFact> ExtractedFacts,
    CaExecutableActionDto? ExecutableAction = null,
    string Source = "ai");
