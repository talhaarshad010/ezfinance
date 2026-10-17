namespace EzFinance.Api.Infrastructure.Statements;

/// <summary>Which way money moved on a statement row.</summary>
public enum RowDirection
{
    /// <summary>Not stated in the file; worked out from the running balance when there is one.</summary>
    Unknown,
    Out,
    In,
}

/// <summary>One transaction row as read from a statement, before checking.</summary>
public sealed class RawStatementRow
{
    public DateOnly Date { get; set; }
    public string Description { get; set; } = string.Empty;
    /// <summary>Always positive.</summary>
    public decimal Amount { get; set; }
    public RowDirection Direction { get; set; }
    /// <summary>Running balance after this row, when the statement prints one.</summary>
    public decimal? Balance { get; set; }
}

/// <summary>Everything read from one statement file.</summary>
public sealed class ParsedStatement
{
    public List<RawStatementRow> Rows { get; } = [];
    public decimal? OpeningBalance { get; set; }
    public decimal? ClosingBalance { get; set; }
    /// <summary>"Total In" / "Total Out" printed on the statement, when it has them: a second check.</summary>
    public decimal? TotalIn { get; set; }
    public decimal? TotalOut { get; set; }
    public string? BankName { get; set; }
    /// <summary>"rules" (exact, no AI) or "ai" (Gemini structured it, then checked by arithmetic).</summary>
    public string Method { get; set; } = "rules";
    public List<string> Warnings { get; } = [];
}

/// <summary>A statement that can't be read; <see cref="Code"/> is returned to the app.</summary>
public sealed class StatementImportException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
