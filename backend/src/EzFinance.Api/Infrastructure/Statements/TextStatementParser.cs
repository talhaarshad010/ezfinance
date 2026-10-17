using System.Text.RegularExpressions;

namespace EzFinance.Api.Infrastructure.Statements;

/// <summary>
/// Reads a digital PDF statement with fixed rules, for the common layout where each transaction has
/// one line holding its date … amount … running balance (NayaPay, Raqami and many bank PDFs). The
/// description is either on that line, or wrapped onto the lines around it. No AI: the numbers are
/// the bank's own text. The caller only uses the result when the running balances and the statement
/// totals all add up; otherwise the PDF goes to Gemini.
/// </summary>
public static partial class TextStatementParser
{
    private sealed record TxLine(int Page, int Index, RawStatementRow Row, string Inline);

    public static ParsedStatement? TryParse(IReadOnlyList<string> pages)
    {
        var pageLines = pages.Select(SplitLines).ToList();
        var all = pageLines.SelectMany(l => l).ToList();
        var statement = new ParsedStatement { Method = "rules", BankName = FindBank(pages) };
        var labelled = FindLabelledAmounts(all);
        statement.OpeningBalance = labelled.Opening;
        statement.ClosingBalance = labelled.Closing;
        statement.TotalIn = labelled.TotalIn;
        statement.TotalOut = labelled.TotalOut;

        var txs = new List<TxLine>();
        for (var page = 0; page < pageLines.Count; page++)
        {
            for (var index = 0; index < pageLines[page].Count; index++)
            {
                if (ReadTransactionLine(pageLines[page][index]) is { } tx)
                {
                    txs.Add(new TxLine(page, index, tx.Row, tx.Inline));
                }
            }
        }
        if (txs.Count == 0)
        {
            return null;
        }

        // Wrapped layout: most transaction lines carry no words of their own (only a reference number).
        var wrapped = txs.Count(t => !HasWords(t.Inline)) * 2 > txs.Count;
        var extra = wrapped ? AssignWrappedLines(pageLines, txs) : [];
        foreach (var tx in txs)
        {
            var parts = new List<(int Page, int Index, string Text)>();
            if (HasWords(tx.Inline)) parts.Add((tx.Page, tx.Index, tx.Inline));
            if (extra.TryGetValue(tx, out var lines)) parts.AddRange(lines);
            tx.Row.Description = Tidy(string.Join(' ', parts.OrderBy(p => p.Page).ThenBy(p => p.Index).Select(p => p.Text)));
            statement.Rows.Add(tx.Row);
        }
        return statement;
    }

    /// <summary>A line that starts with a date and holds an amount and the running balance.</summary>
    private static (RawStatementRow Row, string Inline)? ReadTransactionLine(string line)
    {
        var dateMatch = LeadingDate().Match(line);
        if (!dateMatch.Success || StatementValues.ParseDate(dateMatch.Value.TrimEnd(' ', '|', ',')) is not { } date)
        {
            return null;
        }
        var rest = line[dateMatch.Length..];
        var money = Money().Matches(rest);
        if (money.Count < 2)
        {
            return null; // a transaction line here always ends with an amount and the balance
        }
        var inline = Clean(rest[..money[0].Index]);
        if (SummaryLine().IsMatch(inline.ToLowerInvariant()))
        {
            return null;
        }

        var balance = Amount(money[^1]);
        // Debit and credit columns: an empty cell leaves one amount; a zero one is skipped.
        var amountMatch = money.Take(money.Count - 1).LastOrDefault(m => Amount(m) is not 0m) ?? money[^2];
        if (Amount(amountMatch) is not { } amount || amount == 0 || balance is null)
        {
            return null;
        }
        var sign = amountMatch.Groups["sign"].Success ? amountMatch.Groups["sign"].Value : amountMatch.Groups["sign2"].Value;
        var direction = sign switch
        {
            "-" => RowDirection.Out,
            "+" => RowDirection.In,
            _ => amountMatch.Groups["drcr"].Value.ToLowerInvariant() switch
            {
                "dr" => RowDirection.Out,
                "cr" => RowDirection.In,
                _ => RowDirection.Unknown, // the running balance decides
            },
        };
        return (new RawStatementRow { Date = date, Amount = Math.Abs(amount), Direction = direction, Balance = balance }, inline);
    }

    /// <summary>
    /// Splits wrapped description lines between the transaction lines around them. All description
    /// lines are taken in reading order (page breaks, headers and footers skipped), and each gap
    /// between two transactions gets one split point: lines belong to the row above while they are
    /// nearer to it (or, within half a row, carry its description on: "via Raast", "PK…]"); from the
    /// first line that starts a new description, the rest belong to the row below.
    /// </summary>
    private static Dictionary<TxLine, List<(int Page, int Index, string Text)>> AssignWrappedLines(
        IReadOnlyList<List<string>> pageLines, IReadOnlyList<TxLine> txs)
    {
        var txAt = txs.ToDictionary(t => (t.Page, t.Index));
        var seq = new List<(int Page, int Index, string Text, TxLine? Tx)>();
        for (var page = 0; page < pageLines.Count; page++)
        {
            var tableStart = pageLines[page].FindIndex(IsTableHeader);
            for (var i = 0; i < pageLines[page].Count; i++)
            {
                if (txAt.TryGetValue((page, i), out var tx))
                {
                    seq.Add((page, i, pageLines[page][i], tx));
                }
                else if (i > tableStart && !IsNoise(pageLines[page][i]))
                {
                    seq.Add((page, i, pageLines[page][i], null));
                }
            }
        }

        var result = new Dictionary<TxLine, List<(int, int, string)>>();
        void Give(TxLine tx, int k)
        {
            if (!result.TryGetValue(tx, out var list)) result[tx] = list = [];
            list.Add((seq[k].Page, seq[k].Index, seq[k].Text));
        }

        var positions = seq.Select((s, k) => (s.Tx, k)).Where(x => x.Tx is not null).Select(x => x.k).ToList();
        var gaps = positions.Zip(positions.Skip(1), (a, b) => b - a).OrderBy(g => g).ToList();
        var halfRow = (gaps.Count > 0 ? gaps[gaps.Count / 2] : 4) / 2.0;

        for (var k = 0; k < positions[0]; k++) Give(seq[positions[0]].Tx!, k);
        for (var k = positions[^1] + 1; k < seq.Count; k++) Give(seq[positions[^1]].Tx!, k);
        for (var p = 0; p + 1 < positions.Count; p++)
        {
            var (a, b) = (positions[p], positions[p + 1]);
            var stillAbove = true;
            for (var k = a + 1; k < b; k++)
            {
                var (toA, toB) = (k - a, b - k);
                // Exactly between two rows, a line goes to the one with no description of its own
                // (an ATM row next to a card row that has its merchant inline).
                var tieGoesAbove = !HasWords(seq[a].Tx!.Inline) && HasWords(seq[b].Tx!.Inline)
                    || (HasWords(seq[a].Tx!.Inline) == HasWords(seq[b].Tx!.Inline) && IsContinuation(seq[k].Text));
                stillAbove = stillAbove && (toA < toB || (toA == toB && tieGoesAbove)
                    || (IsContinuation(seq[k].Text) && toA <= halfRow + 0.5));
                Give((stillAbove ? seq[a] : seq[b]).Tx!, k);
            }
        }
        return result;
    }

    /// <summary>
    /// Amounts printed next to their labels: "Opening Balance | 3,000.00" on one line, or a row of
    /// labels ("Opening Balance | Total Spent | Closing Balance") with the values a line or two below.
    /// </summary>
    public static (decimal? Opening, decimal? Closing, decimal? TotalIn, decimal? TotalOut) FindLabelledAmounts(IReadOnlyList<string> lines)
    {
        decimal? opening = null, closing = null, totalIn = null, totalOut = null;
        void Take(string label, decimal? value)
        {
            var l = label.ToLowerInvariant();
            if (value is null) return;
            if (l.Contains("opening balance")) opening ??= value;
            else if (l.Contains("closing balance")) closing ??= value;
            else if (TotalInLabel().IsMatch(l)) totalIn ??= value;
            else if (TotalOutLabel().IsMatch(l)) totalOut ??= value;
        }

        for (var i = 0; i < lines.Count; i++)
        {
            var lower = lines[i].ToLowerInvariant();
            if (!lower.Contains("opening balance") && !lower.Contains("closing balance")
                && !TotalInLabel().IsMatch(lower) && !TotalOutLabel().IsMatch(lower))
            {
                continue;
            }
            var cells = lines[i].Split(" | ");
            if (Money().IsMatch(lines[i]))
            {
                // "Opening Balance | 3,000.00": each label takes the first amount after it.
                for (var k = 0; k < cells.Length; k++)
                {
                    if (Money().IsMatch(cells[k])) continue;
                    var value = Money().Match(string.Join(" | ", cells.Skip(k + 1)));
                    Take(cells[k], value.Success ? Amount(value) : null);
                }
                continue;
            }
            // A row of labels: the first line below with one value per label.
            for (var j = i + 1; j < Math.Min(lines.Count, i + 4); j++)
            {
                var values = Money().Matches(lines[j]);
                if (values.Count != cells.Length) continue;
                for (var k = 0; k < cells.Length; k++) Take(cells[k], Amount(values[k]));
                break;
            }
        }
        return (opening, closing, totalIn, totalOut);
    }

    /// <summary>Opening and closing balance only.</summary>
    public static (decimal? Opening, decimal? Closing) FindBalances(IReadOnlyList<string> lines)
    {
        var found = FindLabelledAmounts(lines);
        return (found.Opening, found.Closing);
    }

    // Most specific names first ("Bank AL Habib" before "Habib").
    private static readonly (string Name, string[] Marks)[] Banks =
    [
        ("NayaPay", ["nayapay"]), ("SadaPay", ["sadapay"]), ("JazzCash", ["jazzcash"]), ("Easypaisa", ["easypaisa"]),
        ("Raqami", ["raqami"]),
        ("Bank Alfalah", ["bank alfalah", "bankalfalah"]), ("Bank AL Habib", ["bank al habib", "bankalhabib"]),
        ("Habib Metro", ["habibmetro", "habib metropolitan"]), ("HBL", ["habib bank", "hbl.com", "hbl "]),
        ("Meezan Bank", ["meezan"]), ("UBL", ["united bank", "ubldigital", "ubl "]), ("MCB", ["mcb bank", "mcb.com"]),
        ("Allied Bank", ["allied bank", "abl.com"]), ("Faysal Bank", ["faysal"]), ("Askari Bank", ["askari"]),
        ("Standard Chartered", ["standard chartered", "sc.com"]), ("BankIslami", ["bankislami"]),
        ("Dubai Islamic Bank", ["dubai islamic", "dibpak"]), ("JS Bank", ["js bank", "jsbl"]), ("Soneri Bank", ["soneri"]),
        ("National Bank", ["national bank of pakistan", "nbp.com"]), ("Bank of Punjab", ["bank of punjab", "bop.com"]),
        ("Silkbank", ["silkbank"]),
    ];

    /// <summary>
    /// The bank or wallet named in the statement's own header or contact footer (not in its
    /// transactions, which mention other banks).
    /// </summary>
    public static string? FindBank(IReadOnlyList<string> pages)
    {
        var lines = pages.Take(1).SelectMany(SplitLines).ToList();
        var header = lines.TakeWhile(l => !IsTableHeader(l));
        var footer = lines.Where(l => l.Contains("www.") || l.Contains('@'));
        var text = string.Join('\n', header.Concat(footer)).ToLowerInvariant();
        return Banks.FirstOrDefault(b => b.Marks.Any(m => text.Contains(m))).Name;
    }

    public static IReadOnlyList<string> Lines(IReadOnlyList<string> pages) => pages.SelectMany(SplitLines).ToList();

    private static List<string> SplitLines(string page) =>
        page.Split('\n').Select(l => l.Trim()).Where(l => l.Length > 0).ToList();

    private static bool HasWords(string text) => text.Count(char.IsLetter) >= 3;

    /// <summary>A line that carries on the description above it rather than starting a new one.</summary>
    private static bool IsContinuation(string line) =>
        ContinuationStart().IsMatch(line) || (line.Contains(']') && !line.Contains('['));

    private static bool IsTableHeader(string line)
    {
        var l = line.ToLowerInvariant();
        return l.Contains("date") && l.Contains("balance") && !Money().IsMatch(line);
    }

    /// <summary>Lines that are never part of a description: summaries, page furniture, contact details.</summary>
    private static bool IsNoise(string line)
    {
        var l = line.ToLowerInvariant();
        return IsTableHeader(line) || SummaryLine().IsMatch(l) || PageFurniture().IsMatch(l)
            || l.Contains("www.") || l.Contains("http") || l.Contains('@') || (!HasWords(line) && line.Length < 4)
            || FooterNote().IsMatch(l);
    }

    private static decimal? Amount(Match m)
    {
        var parsed = StatementValues.ParseMoney(m.Groups["num"].Value);
        return parsed is null ? null : Math.Abs(parsed.Value.Value);
    }

    private static string Clean(string text) =>
        Spaces().Replace(text.Replace(" | ", " ").Replace("|", " "), " ").Trim();

    /// <summary>Readable description: no bracketed IBANs / ids, no long reference numbers.</summary>
    private static string Tidy(string text)
    {
        text = Brackets().Replace(Clean(text), " ");
        text = MaskedIban().Replace(text, " ");
        text = ReferenceNumber().Replace(text, " ");
        return Spaces().Replace(text, " ").Trim(' ', '-', '[', ']', ',');
    }

    // A date at the start of the line: 01 Sep 2026, 01-Sep-2026, 01/09/2026, 2026-09-01 …
    [GeneratedRegex(@"^(\d{1,2}[ \-/.](\d{1,2}|[A-Za-z]{3,9})[ \-/.,]+\d{2,4}|\d{4}-\d{2}-\d{2})\b[ |,]*")]
    private static partial Regex LeadingDate();

    // An amount: with a currency mark (Rs. / PKR), thousands separators or two decimals. Sign before
    // or after the currency mark, optional Dr / Cr after. Dates and plain counts don't match.
    [GeneratedRegex(@"(?<![\w.,])(?<sign>[+-])?\s?(?:(?:Rs\.?|PKR)\s?(?<sign2>[+-])?(?<num>\d[\d,]*(?:\.\d{1,2})?)|(?<num>\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+\.\d{2}))(?![\d.,])(?:\s?(?<drcr>Dr|Cr|DR|CR)\b)?", RegexOptions.ExplicitCapture)]
    private static partial Regex Money();

    [GeneratedRegex(@"^(opening balance|closing balance|balance b/?f|balance c/?f|brought forward|carried forward|total)")]
    private static partial Regex SummaryLine();

    [GeneratedRegex(@"\btotal (in|income|credits?|deposits?|received)\b")]
    private static partial Regex TotalInLabel();

    [GeneratedRegex(@"\btotal (out|spent|debits?|withdrawals?|paid)\b")]
    private static partial Regex TotalOutLabel();

    [GeneratedRegex(@"^(page \d+|\d+ of \d+|e-?statement|statement of account|account statement|current account|savings account)")]
    private static partial Regex PageFurniture();

    [GeneratedRegex(@"^(via |\[|\(|pk\d{2}|[a-z])")]
    private static partial Regex ContinuationStart();

    // Notes and disclaimers printed after the transactions.
    [GeneratedRegex(@"^(note\b|this is a (computer|system)[- ]generated|generated on\b|printed on\b|disclaimer|please (examine|review|notify)|e\.?\s?&\s?o\.?e)")]
    private static partial Regex FooterNote();

    [GeneratedRegex(@"\[[^\]]*\]?")]
    private static partial Regex Brackets();

    [GeneratedRegex(@"\bPK\d{2}\*+\d+\b", RegexOptions.IgnoreCase)]
    private static partial Regex MaskedIban();

    [GeneratedRegex(@"\b\d{6,}\b")]
    private static partial Regex ReferenceNumber();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
