using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using EzFinance.Api.Entities;

namespace EzFinance.Api.Infrastructure.Statements;

/// <summary>A statement row after checking, ready for the review screen.</summary>
public sealed record VerifiedRow(
    Guid Id,
    DateOnly Date,
    string Description,
    decimal Amount,
    string Type,
    decimal? Balance,
    /// <summary>"verified" (its running balance adds up), "mismatch" (it doesn't), or "unchecked" (no balance printed).</summary>
    string Check,
    string Category);

public sealed record VerifiedStatement(
    IReadOnlyList<VerifiedRow> Rows,
    /// <summary>"passed", "failed" or "unavailable" (the statement prints no balances to check against).</summary>
    string BalanceCheck,
    IReadOnlyList<string> Warnings);

/// <summary>
/// Checks every row of a statement with arithmetic instead of trusting how it was read:
/// previous balance ± amount must equal the balance printed on the row, and opening + money in −
/// money out must equal the closing balance. Also gives each row a stable id (so importing the same
/// statement twice never duplicates anything) and a suggested category.
/// </summary>
public static class StatementVerifier
{
    public const int MaxNoteLength = 60;
    private const decimal Tolerance = 0.011m;

    public static VerifiedStatement Verify(ParsedStatement statement, Guid userId)
    {
        var rows = statement.Rows;
        var warnings = new List<string>(statement.Warnings);
        var checks = new string[rows.Count];

        // Statements are printed oldest-first or newest-first; check them in date order.
        var order = Enumerable.Range(0, rows.Count).ToList();
        if (IsNewestFirst(rows))
        {
            order.Reverse();
        }

        var previous = statement.OpeningBalance;
        foreach (var i in order)
        {
            var row = rows[i];
            if (row.Balance is { } balance && previous is { } before)
            {
                var delta = balance - before;
                if (Math.Abs(Math.Abs(delta) - row.Amount) <= Tolerance)
                {
                    var moved = delta >= 0 ? RowDirection.In : RowDirection.Out;
                    if (row.Direction == RowDirection.Unknown)
                    {
                        row.Direction = moved;
                    }
                    checks[i] = row.Direction == moved || row.Amount == 0 ? "verified" : "mismatch";
                }
                else
                {
                    checks[i] = "mismatch";
                }
            }
            else
            {
                checks[i] = "unchecked";
            }
            previous = row.Balance
                ?? (previous is { } p && row.Direction != RowDirection.Unknown ? p + Signed(row) : null);
        }

        if (rows.Any(r => r.Direction == RowDirection.Unknown))
        {
            warnings.Add("Some rows didn't say whether money came in or went out, so they're marked as money out. Check them.");
            foreach (var r in rows.Where(r => r.Direction == RowDirection.Unknown))
            {
                r.Direction = RowDirection.Out;
            }
        }

        var mismatches = checks.Count(c => c == "mismatch");
        var anyChecked = checks.Any(c => c != "unchecked");
        bool? totalsAddUp = statement is { OpeningBalance: { } open, ClosingBalance: { } close }
            ? Math.Abs(open + rows.Sum(Signed) - close) <= Tolerance
            : null;

        // The statement's own Total In / Total Out must match the rows too.
        var totalInOk = statement.TotalIn is not { } tin
            || Math.Abs(rows.Where(r => r.Direction == RowDirection.In).Sum(r => r.Amount) - tin) <= Tolerance;
        var totalOutOk = statement.TotalOut is not { } tout
            || Math.Abs(rows.Where(r => r.Direction != RowDirection.In).Sum(r => r.Amount) - tout) <= Tolerance;
        if (!totalInOk || !totalOutOk)
        {
            totalsAddUp = false;
        }

        var balanceCheck = mismatches > 0 || totalsAddUp == false ? "failed"
            : anyChecked || totalsAddUp == true || statement.TotalIn is not null || statement.TotalOut is not null ? "passed"
            : "unavailable";
        if (mismatches > 0)
        {
            warnings.Add(mismatches == 1
                ? "1 row doesn't add up with the balance printed on the statement. It's unticked; check it."
                : $"{mismatches} rows don't add up with the balances printed on the statement. They're unticked; check them.");
        }
        else if (totalsAddUp == false)
        {
            warnings.Add("The rows don't add up to the statement's closing balance, so a row may be missing. Check before importing.");
        }

        // Identical rows (same day, amount, direction and description) are told apart by their position.
        var seen = new Dictionary<string, int>();
        var result = new List<VerifiedRow>(rows.Count);
        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var type = row.Direction == RowDirection.In ? TransactionValues.Income : TransactionValues.Expense;
            var key = string.Join('|', row.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                row.Amount.ToString("0.00", CultureInfo.InvariantCulture), type, StatementValues.Normalize(row.Description));
            seen[key] = seen.GetValueOrDefault(key) + 1;
            result.Add(new VerifiedRow(
                RowId(userId, key, seen[key]),
                row.Date,
                Shorten(row.Description),
                Math.Round(row.Amount, 2),
                type,
                row.Balance,
                checks[i],
                SuggestCategory(row.Description, type)));
        }
        return new VerifiedStatement(result, balanceCheck, warnings);
    }

    private static decimal Signed(RawStatementRow r) => r.Direction == RowDirection.In ? r.Amount : -r.Amount;

    /// <summary>Newest-first when the running balances fit that order better (or, without balances, the dates say so).</summary>
    private static bool IsNewestFirst(IReadOnlyList<RawStatementRow> rows)
    {
        int forward = 0, backward = 0;
        for (var i = 1; i < rows.Count; i++)
        {
            if (rows[i].Balance is { } b && rows[i - 1].Balance is { } a)
            {
                if (Math.Abs(Math.Abs(b - a) - rows[i].Amount) <= Tolerance) forward++;
                if (Math.Abs(Math.Abs(a - b) - rows[i - 1].Amount) <= Tolerance) backward++;
            }
        }
        if (forward != backward)
        {
            return backward > forward;
        }
        return rows.Count > 1 && rows[0].Date > rows[^1].Date;
    }

    /// <summary>A stable id from the user and the row's content, shaped as a version-5 style UUID.</summary>
    private static Guid RowId(Guid userId, string key, int occurrence)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"ezfinance-import|{userId}|{key}|{occurrence}"));
        var bytes = hash[..16];
        bytes[6] = (byte)((bytes[6] & 0x0F) | 0x50);
        bytes[8] = (byte)((bytes[8] & 0x3F) | 0x80);
        return new Guid(bytes, bigEndian: true);
    }

    private static string Shorten(string description)
    {
        var text = string.Join(' ', description.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        if (text.Length == 0)
        {
            return "Bank transaction";
        }
        return text.Length <= MaxNoteLength ? text : text[..(MaxNoteLength - 1)].TrimEnd() + "…";
    }

    private static readonly (string Category, string[] Words)[] CategoryWords =
    [
        (TransactionValues.Fuel, ["pso", "shell", "parco", "attock", "hascol", "byco", "go petrol", "petrol", "fuel", "cng", "filling station"]),
        (TransactionValues.Bills, ["k-electric", "k electric", "lesco", "iesco", "mepco", "fesco", "gepco", "pesco", "hesco", "qesco", "sepco", "sngpl", "ssgc",
            "ptcl", "nayatel", "stormfiber", "storm fiber", "worldcall", "zong", "ufone", "electricity", "gas bill", "water bill",
            "bill payment", "utility", "internet", "mobile top", "topup", "top-up"]),
        (TransactionValues.Dining, ["kfc", "mcdonald", "foodpanda", "food panda", "pizza", "cafe", "café", "restaurant", "cheezious", "hardee", "burger",
            "starbucks", "gloria jean", "dhaba", "bbq", "biryani", "subway", "domino", "tim hortons"]),
        (TransactionValues.Groceries, ["imtiaz", "carrefour", "metro cash", "al-fatah", "al fatah", "naheed", "chase up", "chaseup", "hyperstar",
            "green valley", "grocery", "grocer", "mart", "superstore", "super store", "pandamart", "bakery", "milk"]),
    ];

    /// <summary>A guess from the description; the user can change it on the review screen.</summary>
    public static string SuggestCategory(string description, string type)
    {
        var text = StatementValues.Normalize(description);
        if (type == TransactionValues.Income)
        {
            return text.Contains("salary") || text.Contains("payroll") || text.Contains("pay roll")
                ? TransactionValues.Salary
                : TransactionValues.Other;
        }
        foreach (var (category, words) in CategoryWords)
        {
            if (words.Any(w => text.Contains(w)))
            {
                return category;
            }
        }
        return TransactionValues.Other;
    }
}
