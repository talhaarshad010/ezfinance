using System.Globalization;
using System.Text.RegularExpressions;

namespace EzFinance.Api.Infrastructure.Statements;

/// <summary>Reads money amounts and dates the way Pakistani bank statements print them.</summary>
public static partial class StatementValues
{
    /// <summary>
    /// "1,234.50", "(1,234.50)", "-1234.5", "Rs. 1,234", "PKR 1,234.00 Dr", "1,234.00CR" → value and,
    /// when the text says so, its direction. Empty, "-" and non-numbers → null.
    /// </summary>
    public static (decimal Value, RowDirection Hint)? ParseMoney(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }
        var s = text.Trim();
        var hint = RowDirection.Unknown;
        var dr = DrCrSuffix().Match(s);
        if (dr.Success)
        {
            hint = dr.Groups[1].Value.StartsWith('d') || dr.Groups[1].Value.StartsWith('D') ? RowDirection.Out : RowDirection.In;
            s = s[..dr.Index].Trim();
        }
        var negative = false;
        if (s.StartsWith('(') && s.EndsWith(')'))
        {
            negative = true;
            s = s[1..^1];
        }
        s = CurrencyMarks().Replace(s, "").Replace(",", "").Replace(" ", "").Trim();
        if (s.StartsWith('-'))
        {
            negative = true;
            s = s[1..];
        }
        else if (s.EndsWith('-'))
        {
            negative = true;
            s = s[..^1];
        }
        if (s.StartsWith('+'))
        {
            s = s[1..];
        }
        if (s.Length == 0 || !decimal.TryParse(s, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var value))
        {
            return null;
        }
        if (negative && hint == RowDirection.Unknown)
        {
            hint = RowDirection.Out;
        }
        return (negative ? -value : value, hint);
    }

    private static readonly string[] DateFormatsDayFirst =
    [
        "d/M/yyyy", "d-M-yyyy", "d.M.yyyy", "d/M/yy", "d-M-yy", "d.M.yy",
        "d-MMM-yyyy", "d MMM yyyy", "d-MMM-yy", "d MMM yy", "d/MMM/yyyy", "d/MMM/yy", "dd-MMM-yyyy",
        "d MMMM yyyy", "d-MMMM-yyyy", "MMM d, yyyy", "MMMM d, yyyy", "MMM d yyyy",
        "yyyy-MM-dd", "yyyy/MM/dd", "yyyyMMdd",
    ];

    private static readonly string[] DateFormatsMonthFirst =
    [
        "M/d/yyyy", "M-d-yyyy", "M.d.yyyy", "M/d/yy", "M-d-yy",
        "d-MMM-yyyy", "d MMM yyyy", "d-MMM-yy", "d MMM yy", "MMM d, yyyy", "MMMM d, yyyy",
        "yyyy-MM-dd", "yyyy/MM/dd", "yyyyMMdd",
    ];

    /// <summary>Parses a statement date. Day-first unless the file showed it is month-first.</summary>
    public static DateOnly? ParseDate(string? text, bool monthFirst = false)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }
        var s = text.Trim();
        // A time part ("12/10/2026 14:05", "2026-10-12T00:00:00") isn't needed.
        var cut = s.IndexOfAny(['T', ' '], Math.Min(8, s.Length));
        if (cut > 0 && TimePart().IsMatch(s[cut..]))
        {
            s = s[..cut].Trim();
        }
        // Excel serial dates (e.g. 46310) from cells that weren't formatted as dates.
        if (double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var serial) && serial is > 20000 and < 80000)
        {
            return DateOnly.FromDateTime(DateTime.FromOADate(serial));
        }
        var formats = monthFirst ? DateFormatsMonthFirst : DateFormatsDayFirst;
        return DateTime.TryParseExact(s, formats, CultureInfo.InvariantCulture,
            DateTimeStyles.AllowWhiteSpaces, out var date)
            ? DateOnly.FromDateTime(date)
            : null;
    }

    /// <summary>
    /// True when numeric dates in the file are month-first (e.g. 10/25/2026). Pakistani statements
    /// are day-first, so that is the default unless some date can only be read month-first.
    /// </summary>
    public static bool LooksMonthFirst(IEnumerable<string?> dateTexts)
    {
        var dayFirstOnly = false;
        var monthFirstOnly = false;
        foreach (var t in dateTexts)
        {
            var m = NumericDate().Match(t?.Trim() ?? "");
            if (!m.Success)
            {
                continue;
            }
            var a = int.Parse(m.Groups[1].Value, CultureInfo.InvariantCulture);
            var b = int.Parse(m.Groups[2].Value, CultureInfo.InvariantCulture);
            if (a > 12 && b <= 12) dayFirstOnly = true;
            if (b > 12 && a <= 12) monthFirstOnly = true;
        }
        return monthFirstOnly && !dayFirstOnly;
    }

    /// <summary>Lower-case, single-spaced text for matching and for duplicate detection.</summary>
    public static string Normalize(string? text) =>
        Spaces().Replace((text ?? string.Empty).Trim(), " ").ToLowerInvariant();

    [GeneratedRegex(@"\s*(?<![A-Za-z])(dr|cr|debit|credit|d|c)\.?$", RegexOptions.IgnoreCase)]
    private static partial Regex DrCrSuffix();

    [GeneratedRegex(@"(pkr|rs\.?|₨)", RegexOptions.IgnoreCase)]
    private static partial Regex CurrencyMarks();

    [GeneratedRegex(@"^[\sT]*\d{1,2}:\d{2}")]
    private static partial Regex TimePart();

    [GeneratedRegex(@"^(\d{1,2})[/\-.](\d{1,2})[/\-.]\d{2,4}$")]
    private static partial Regex NumericDate();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
