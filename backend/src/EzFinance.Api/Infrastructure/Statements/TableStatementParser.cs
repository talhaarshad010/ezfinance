using System.Text.RegularExpressions;

namespace EzFinance.Api.Infrastructure.Statements;

/// <summary>
/// Reads a statement laid out as a table (CSV / Excel export) with fixed rules — no AI, so the
/// numbers are exactly what the bank wrote. Finds the header row, works out which column is the
/// date, description, debit / credit (or a signed amount) and balance, then reads every row.
/// </summary>
public static partial class TableStatementParser
{
    private const int HeaderSearchRows = 40;

    private sealed record Columns(int Date, int Description, int Debit, int Credit, int Amount, int DrCr, int Balance)
    {
        public bool HasMoney => Debit >= 0 || Credit >= 0 || Amount >= 0;
    }

    public static ParsedStatement Parse(IReadOnlyList<string?[]> table)
    {
        var (headerIndex, cols) = FindHeader(table)
            ?? throw new StatementImportException("columns_not_found",
                "We couldn't find the date and amount columns in this file. Export the statement as CSV or Excel from your bank's internet banking.");

        var body = table.Skip(headerIndex + 1).ToList();
        var monthFirst = StatementValues.LooksMonthFirst(body.Select(r => Cell(r, cols.Date)));
        var statement = new ParsedStatement { Method = "rules" };
        RawStatementRow? last = null;

        foreach (var row in body)
        {
            var description = Clean(Cell(row, cols.Description));
            var balance = StatementValues.ParseMoney(Cell(row, cols.Balance))?.Value;
            var date = StatementValues.ParseDate(Cell(row, cols.Date), monthFirst);
            var money = MoneyIn(row, cols);
            // The line's label: its description, or its first text cell when the bank leaves that empty.
            var label = StatementValues.Normalize(description.Length > 0
                ? description
                : row.FirstOrDefault(c => !string.IsNullOrWhiteSpace(c) && StatementValues.ParseMoney(c) is null));

            if (OpeningLine().IsMatch(label))
            {
                statement.OpeningBalance ??= balance ?? money?.Value;
                continue;
            }
            // "Total…" only counts as a summary line when it has no date (a shop can be called "Total").
            if (ClosingLine().IsMatch(label) && (date is null || label.StartsWith("closing")))
            {
                // A "Total" line holds column sums, never the closing balance.
                var isTotal = label.StartsWith("total") || label.StartsWith("grand total");
                statement.ClosingBalance = balance ?? (isTotal ? null : money?.Value) ?? statement.ClosingBalance;
                continue;
            }

            if (date is null || money is null)
            {
                // A wrapped description continues on the next line with no date or amount.
                if (date is null && money is null && last is not null && description.Length > 0 && balance is null)
                {
                    last.Description = Clean(last.Description + " " + description);
                }
                continue;
            }

            last = new RawStatementRow
            {
                Date = date.Value,
                Description = description,
                Amount = Math.Abs(money.Value.Value),
                Direction = money.Value.Direction,
                Balance = balance,
            };
            statement.Rows.Add(last);
        }

        if (statement.Rows.Count == 0)
        {
            throw new StatementImportException("no_transactions", "No transactions were found in this file.");
        }
        return statement;
    }

    /// <summary>The row's amount and direction, from debit/credit columns or a signed amount column.</summary>
    private static (decimal Value, RowDirection Direction)? MoneyIn(string?[] row, Columns cols)
    {
        var debit = StatementValues.ParseMoney(Cell(row, cols.Debit));
        var credit = StatementValues.ParseMoney(Cell(row, cols.Credit));
        if (debit is { Value: not 0 } d)
        {
            return (Math.Abs(d.Value), RowDirection.Out);
        }
        if (credit is { Value: not 0 } c)
        {
            return (Math.Abs(c.Value), RowDirection.In);
        }

        var amount = StatementValues.ParseMoney(Cell(row, cols.Amount));
        if (amount is null || amount.Value.Value == 0)
        {
            return null;
        }
        var direction = amount.Value.Hint;
        var drCr = StatementValues.Normalize(Cell(row, cols.DrCr));
        if (drCr.StartsWith('d') || drCr.StartsWith("withdraw") || drCr.StartsWith("out"))
        {
            direction = RowDirection.Out;
        }
        else if (drCr.StartsWith('c') || drCr.StartsWith("deposit") || drCr.StartsWith("in"))
        {
            direction = RowDirection.In;
        }
        return (Math.Abs(amount.Value.Value), direction);
    }

    private static (int Index, Columns Columns)? FindHeader(IReadOnlyList<string?[]> table)
    {
        for (var i = 0; i < Math.Min(table.Count, HeaderSearchRows); i++)
        {
            var names = table[i].Select(c => HeaderName(c)).ToArray();

            // Prefer the transaction / posting date over the value date when both exist.
            var date = Array.FindIndex(names, n => n.Contains("date") && !n.Contains("value"));
            if (date < 0) date = Array.FindIndex(names, n => n.Contains("date"));
            if (date < 0) continue;

            var debit = Array.FindIndex(names, n => n.Contains("debit") || n.Contains("withdraw") || n is "dr" || n.Contains("money out") || n.Contains("paid out"));
            var credit = Array.FindIndex(names, n => (n.Contains("credit") || n.Contains("deposit") || n is "cr" || n.Contains("money in") || n.Contains("paid in")) && !n.Contains("debit"));
            var drCr = Array.FindIndex(names, n => n is "dr/cr" or "cr/dr" or "d/c" or "c/d" or "type" or "debit/credit" or "credit/debit" or "transaction type" or "txn type");
            if (drCr == debit || drCr == credit)
            {
                // A single "Debit/Credit" column marks the direction rather than holding an amount.
                debit = credit = -1;
            }
            var amount = Array.FindIndex(names, n => n.Contains("amount") && !n.Contains("debit") && !n.Contains("credit"));
            var balance = Array.FindIndex(names, n => n.Contains("balance"));
            var description = Array.FindIndex(names, n =>
                n.Contains("narration") || n.Contains("description") || n.Contains("particular") || n.Contains("detail")
                || n.Contains("remark")
                || (n.Contains("transaction") && !n.Contains("date") && !n.Contains("type") && !n.Contains("id") && !n.Contains("amount")));

            var cols = new Columns(date, description, debit, credit, amount, drCr, balance);
            if (cols.HasMoney)
            {
                return (i, cols);
            }
        }
        return null;
    }

    private static string HeaderName(string? cell) =>
        HeaderNoise().Replace(StatementValues.Normalize(cell), "").Trim();

    private static string? Cell(string?[] row, int index) =>
        index >= 0 && index < row.Length ? row[index] : null;

    private static string Clean(string? text) => StatementValues.Normalize(text) is var n && n.Length > 0
        ? Spaces().Replace(text!.Trim(), " ")
        : string.Empty;

    [GeneratedRegex(@"^(opening balance|balance b/?f|balance brought forward|brought forward|previous balance|beginning balance|b/f\b)")]
    private static partial Regex OpeningLine();

    [GeneratedRegex(@"^(closing balance|balance c/?f|balance carried forward|carried forward|ending balance|grand total|total\b)")]
    private static partial Regex ClosingLine();

    [GeneratedRegex(@"[^a-z/ ]")]
    private static partial Regex HeaderNoise();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
