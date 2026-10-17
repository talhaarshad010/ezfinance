using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using EzFinance.Api.Configuration;
using Microsoft.Extensions.Options;

namespace EzFinance.Api.Infrastructure.Statements;

/// <summary>
/// Structures a PDF statement's rows with Gemini. Digital PDFs send only their text, with account
/// numbers, IBANs, CNICs and card numbers masked first. A scanned PDF (no text) is sent as the file.
/// The result is never trusted as-is: every row then goes through the running-balance check.
/// </summary>
public sealed partial class GeminiStatementExtractor(
    HttpClient http, IOptions<GeminiOptions> options, ILogger<GeminiStatementExtractor> logger)
{
    // One page per request: small answers are reliable (a long one can loop until it's cut off).
    private const int MaxCharsPerRequest = 6000;
    private const int MaxPagesPerRequest = 1;
    private const int Parallel = 3;
    private const int MaxOutputTokens = 8192;
    private const int MaxScannedBytes = 10 * 1024 * 1024;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private const string Rules = """
        Rules:
        1. Return every transaction row in the order it is printed, one entry per row. Never invent, merge, split, skip or reorder rows.
        2. date: YYYY-MM-DD. Printed dates are day-first (05/10/2026 is 5 October 2026).
        3. debit is money out, credit is money in. Copy the amount text exactly as printed (e.g. "Rs. 15,000" or "1,234.50"); never calculate or round. Leave the other one null.
        4. balance: the running balance text printed on that row, copied exactly, or null if the row has none.
        5. description: the row's narration / particulars, with wrapped lines joined.
        6. Opening balance, closing balance, totals, headers and page footers are not rows. Put an opening or closing balance printed in this part in openingBalance / closingBalance.
        7. bankName: the bank's name if printed, else null.
        Characters shown as * were masked on purpose.
        """;

    private static readonly object Schema = new
    {
        type = "OBJECT",
        properties = new Dictionary<string, object>
        {
            ["bankName"] = new { type = "STRING", nullable = true },
            // Amounts are copied as text and parsed here: exact, and asking the model for numbers can
            // make it repeat digits endlessly.
            ["openingBalance"] = new { type = "STRING", nullable = true },
            ["closingBalance"] = new { type = "STRING", nullable = true },
            ["rows"] = new
            {
                type = "ARRAY",
                items = new
                {
                    type = "OBJECT",
                    properties = new Dictionary<string, object>
                    {
                        ["date"] = new { type = "STRING" },
                        ["description"] = new { type = "STRING" },
                        ["debit"] = new { type = "STRING", nullable = true },
                        ["credit"] = new { type = "STRING", nullable = true },
                        ["balance"] = new { type = "STRING", nullable = true },
                    },
                    required = new[] { "date", "description" },
                },
            },
        },
        required = new[] { "rows" },
    };

    /// <summary>Digital PDF: the pages' text, sent a few pages at a time.</summary>
    public async Task<ParsedStatement> FromTextAsync(IReadOnlyList<string> pages, CancellationToken ct)
    {
        var chunks = new List<string>();
        var current = new StringBuilder();
        var pagesInChunk = 0;
        foreach (var (page, index) in pages.Select((p, i) => (Clean(Mask(p)), i)))
        {
            if (current.Length > 0 && (current.Length + page.Length > MaxCharsPerRequest || pagesInChunk == MaxPagesPerRequest))
            {
                chunks.Add(current.ToString());
                current.Clear();
                pagesInChunk = 0;
            }
            current.Append($"--- Page {index + 1} ---\n").Append(page).Append('\n');
            pagesInChunk++;
        }
        if (current.Length > 0)
        {
            chunks.Add(current.ToString());
        }

        using var gate = new SemaphoreSlim(Parallel);
        var results = await Task.WhenAll(chunks.Select(async chunk =>
        {
            await gate.WaitAsync(ct);
            try
            {
                return await AskWithRetryAsync(new object[]
                {
                    new { text = $"This is part of a Pakistani bank statement, extracted from the PDF. Columns are separated by \" | \".\n{Rules}\n\nStatement text:\n{chunk}" },
                }, ct);
            }
            finally
            {
                gate.Release();
            }
        }));
        return Merge(results);
    }

    /// <summary>Scanned PDF (no text layer): Gemini reads the pages themselves.</summary>
    public async Task<ParsedStatement> FromScannedPdfAsync(byte[] pdf, CancellationToken ct)
    {
        if (pdf.Length > MaxScannedBytes)
        {
            throw new StatementImportException("file_too_large", "This scanned statement is too large. Import up to 10 MB at a time.");
        }
        var result = await AskWithRetryAsync(new object[]
        {
            new { text = $"This is a scanned Pakistani bank statement.\n{Rules}" },
            new { inline_data = new { mime_type = "application/pdf", data = Convert.ToBase64String(pdf) } },
        }, ct);
        var statement = Merge([result]);
        statement.Warnings.Add("This statement is a scanned image, so it was read with OCR. Check each row before importing.");
        return statement;
    }

    /// <summary>A cut-off or malformed answer is usually a one-off: ask once more before giving up.</summary>
    private async Task<AiStatement> AskWithRetryAsync(object[] parts, CancellationToken ct)
    {
        try
        {
            return await AskAsync(parts, ct);
        }
        catch (StatementImportException ex) when (ex.Code is "statement_too_long" or "pdf_unreadable")
        {
            logger.LogWarning("Gemini statement answer was unusable ({Code}); retrying once", ex.Code);
            return await AskAsync(parts, ct);
        }
    }

    private async Task<AiStatement> AskAsync(object[] parts, CancellationToken ct, bool minimalThinking = true)
    {
        var key = options.Value.ApiKey;
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new StatementImportException("pdf_unavailable", "PDF import isn't available right now. Import a CSV or Excel file instead.");
        }
        var config = new Dictionary<string, object>
        {
            ["temperature"] = 0,
            ["response_mime_type"] = "application/json",
            ["response_schema"] = Schema,
            ["max_output_tokens"] = MaxOutputTokens,
        };
        if (minimalThinking)
        {
            // Minimal "thinking": faster, and the answer is a straight copy of the rows anyway.
            config["thinking_config"] = new { thinking_level = "minimal" };
        }
        var body = new { contents = new[] { new { parts } }, generationConfig = config };
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{options.Value.Model}:generateContent?key={key}";
        using var response = await http.PostAsJsonAsync(url, body, ct);
        var raw = await response.Content.ReadAsStringAsync(ct);
        if (response.StatusCode == System.Net.HttpStatusCode.BadRequest && minimalThinking)
        {
            // Older Gemini models don't take thinking_level; ask again without it.
            return await AskAsync(parts, ct, minimalThinking: false);
        }
        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Gemini statement extraction failed: {Status} {Body}", (int)response.StatusCode, raw);
            throw new StatementImportException("pdf_unavailable",
                "We couldn't read this PDF right now. Try again in a minute, or import a CSV or Excel file instead.");
        }

        using var doc = JsonDocument.Parse(raw);
        if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            throw new StatementImportException("pdf_unreadable", "We couldn't read the transactions in this PDF. Try a CSV or Excel file instead.");
        }
        var candidate = candidates[0];
        if (candidate.TryGetProperty("finishReason", out var reason) && reason.GetString() == "MAX_TOKENS")
        {
            throw new StatementImportException("statement_too_long",
                "This statement is too long to read in one go. Import a shorter period (e.g. one month).");
        }
        // An answer can come back without text (e.g. blocked); treat it like an unreadable one.
        var text = candidate.TryGetProperty("content", out var content)
            && content.TryGetProperty("parts", out var answerParts) && answerParts.GetArrayLength() > 0
            && answerParts[0].TryGetProperty("text", out var textPart)
            ? textPart.GetString() ?? "{}"
            : throw new StatementImportException("pdf_unreadable", "We couldn't read the transactions in this PDF. Try a CSV or Excel file instead.");
        try
        {
            return JsonSerializer.Deserialize<AiStatement>(text, Json) ?? new AiStatement(null, null, null, null);
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Gemini returned invalid statement JSON");
            throw new StatementImportException("pdf_unreadable", "We couldn't read the transactions in this PDF. Try a CSV or Excel file instead.");
        }
    }

    private static ParsedStatement Merge(IEnumerable<AiStatement> parts)
    {
        var statement = new ParsedStatement { Method = "ai" };
        foreach (var part in parts)
        {
            statement.BankName ??= string.IsNullOrWhiteSpace(part.BankName) ? null : part.BankName.Trim();
            statement.OpeningBalance ??= StatementValues.ParseMoney(part.OpeningBalance)?.Value;
            statement.ClosingBalance = StatementValues.ParseMoney(part.ClosingBalance)?.Value ?? statement.ClosingBalance;
            foreach (var row in part.Rows ?? [])
            {
                var date = StatementValues.ParseDate(row.Date);
                var debit = Math.Abs(StatementValues.ParseMoney(row.Debit)?.Value ?? 0);
                var credit = Math.Abs(StatementValues.ParseMoney(row.Credit)?.Value ?? 0);
                var (amount, direction) = debit > 0 ? (debit, RowDirection.Out)
                    : credit > 0 ? (credit, RowDirection.In)
                    : (0m, RowDirection.Unknown);
                if (date is null || amount <= 0)
                {
                    continue;
                }
                statement.Rows.Add(new RawStatementRow
                {
                    Date = date.Value,
                    Description = (row.Description ?? string.Empty).Trim(),
                    Amount = amount,
                    Direction = direction,
                    Balance = StatementValues.ParseMoney(row.Balance)?.Value,
                });
            }
        }
        if (statement.Rows.Count == 0)
        {
            throw new StatementImportException("no_transactions", "No transactions were found in this statement.");
        }
        return statement;
    }

    /// <summary>
    /// Shortens long runs of one repeated character (e.g. "Pakista00000000000" in a card merchant
    /// name): they carry no meaning and can make the model repeat them endlessly. Amounts are never
    /// affected (they are written with thousands separators).
    /// </summary>
    public static string Clean(string text) => RepeatedChars().Replace(text, m => m.Value[..3]);

    [GeneratedRegex(@"([0-9A-Za-z*xX\-_.])\1{7,}")]
    private static partial Regex RepeatedChars();

    /// <summary>Hides IBANs, CNICs and account / card / phone numbers before text leaves the server.
    /// The patterns are precise on purpose: dates and amounts must reach Gemini unchanged.</summary>
    public static string Mask(string text)
    {
        text = Iban().Replace(text, m => m.Value[..4] + new string('*', m.Value.Length - 8) + m.Value[^4..]);
        text = Cnic().Replace(text, "*****-*******-*");
        text = Card().Replace(text, m => "**** **** **** " + m.Value[^4..]);
        text = DashedAccount().Replace(text, m => KeepLast4(m.Value));
        return LongDigits().Replace(text, m => KeepLast4(m.Value));
    }

    private static string KeepLast4(string value)
    {
        var digits = value.Count(char.IsDigit);
        var seen = 0;
        return new string(value.Select(c => char.IsDigit(c) && ++seen <= digits - 4 ? '*' : c).ToArray());
    }

    [GeneratedRegex(@"\bPK\d{2}[A-Z]{4}\d{16}\b", RegexOptions.IgnoreCase)]
    private static partial Regex Iban();

    [GeneratedRegex(@"\b\d{5}-\d{7}-\d\b")]
    private static partial Regex Cnic();

    [GeneratedRegex(@"\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}\b")]
    private static partial Regex Card();

    // Account numbers like 0123-4567890-01 (a date such as 2026-10-05 doesn't fit: its parts are too short).
    [GeneratedRegex(@"\b\d{3,6}-\d{6,12}(-\d{1,3})?\b")]
    private static partial Regex DashedAccount();

    // Unbroken runs of 10+ digits: account, card and phone numbers. Amounts have commas or are shorter.
    [GeneratedRegex(@"\b\d{10,}\b")]
    private static partial Regex LongDigits();

    private sealed record AiStatement(string? BankName, string? OpeningBalance, string? ClosingBalance, List<AiRow>? Rows);

    private sealed record AiRow(string? Date, string? Description, string? Debit, string? Credit, string? Balance);
}
