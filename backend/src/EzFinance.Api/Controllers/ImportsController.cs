using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Auth;
using EzFinance.Api.Infrastructure.Data;
using EzFinance.Api.Infrastructure.Statements;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>
/// Bank statement import. Step 1 (preview) reads and checks a statement and saves nothing; step 2
/// (transactions) saves the rows the user kept on the review screen.
/// CSV / Excel are read with fixed rules (exact). PDFs: digital ones have their text structured by
/// Gemini (account numbers masked first), scanned ones are read by Gemini OCR. Every row is then
/// checked against the running balance printed on the statement.
/// </summary>
[ApiController]
[Route("api/imports")]
[Authorize]
public sealed class ImportsController(
    AppDbContext db, GeminiStatementExtractor gemini, ILogger<ImportsController> logger) : ControllerBase
{
    private const int MaxSpreadsheetBytes = 5 * 1024 * 1024;
    private const int MaxPdfBytes = 10 * 1024 * 1024;

    /// <summary>
    /// Reads a statement (multipart: "file", optional "password" for protected PDFs). Codes:
    /// password_required / wrong_password (422), unsupported_file, columns_not_found, no_transactions (400).
    /// </summary>
    [HttpPost("statement")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxPdfBytes + 64 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxPdfBytes + 64 * 1024)]
    public async Task<ActionResult<StatementPreviewResponse>> Preview(
        IFormFile? file, [FromForm] string? password, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            return Fail(StatusCodes.Status400BadRequest, "unsupported_file", "Choose a statement file.");
        }
        if (file.Length > MaxPdfBytes)
        {
            return Fail(StatusCodes.Status413PayloadTooLarge, "file_too_large", "That file is too large. The limit is 10 MB.");
        }

        byte[] content;
        await using (var stream = file.OpenReadStream())
        using (var buffer = new MemoryStream((int)file.Length))
        {
            await stream.CopyToAsync(buffer, ct);
            content = buffer.ToArray();
        }

        var kind = DetectKind(content, file.FileName);
        try
        {
            ParsedStatement statement;
            switch (kind)
            {
                case "pdf":
                    var pages = PdfTextReader.ReadPages(content, password);
                    var hasText = pages.Sum(p => p.Length) > 200;
                    if (!hasText && !string.IsNullOrEmpty(password))
                    {
                        return Fail(StatusCodes.Status400BadRequest, "scanned_protected",
                            "This is a scanned, password-protected PDF, which can't be read. Download a CSV or Excel statement instead.");
                    }
                    statement = hasText
                        ? await ReadDigitalPdfAsync(pages, ct)
                        : await gemini.FromScannedPdfAsync(content, ct);
                    break;
                case "csv":
                case "excel":
                    if (content.Length > MaxSpreadsheetBytes)
                    {
                        return Fail(StatusCodes.Status413PayloadTooLarge, "file_too_large", "That file is too large. The limit is 5 MB.");
                    }
                    var sheets = SpreadsheetReader.Read(content, isCsv: kind == "csv");
                    statement = ParseFirstStatementSheet(sheets);
                    break;
                default:
                    return Fail(StatusCodes.Status400BadRequest, "unsupported_file",
                        "Use a CSV, Excel (XLS / XLSX) or PDF statement from your bank.");
            }

            // A bank whose name is only in its logo: the file name often says it (e.g. "raqami.pdf").
            statement.BankName ??= TextStatementParser.FindBank([Path.GetFileNameWithoutExtension(file.FileName ?? "")]);
            var verified = StatementVerifier.Verify(statement, User.GetUserId());
            return Ok(await ToPreviewAsync(kind, statement, verified, ct));
        }
        catch (StatementImportException ex)
        {
            var status = ex.Code is "password_required" or "wrong_password"
                ? StatusCodes.Status422UnprocessableEntity
                : ex.Code is "pdf_unavailable" ? StatusCodes.Status503ServiceUnavailable
                : StatusCodes.Status400BadRequest;
            logger.LogInformation("Statement import rejected: {Code}", ex.Code);
            return Fail(status, ex.Code, ex.Message);
        }
    }

    /// <summary>
    /// Saves the reviewed rows into one of the user's accounts, all at once. Rows already imported are
    /// skipped; rows imported before and since deleted are brought back with the reviewed values.
    /// </summary>
    [HttpPost("transactions")]
    public async Task<ActionResult<ImportTransactionsResponse>> Import(ImportTransactionsRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var accountOk = await db.BankAccounts.AnyAsync(
            a => a.Id == request.AccountId && a.UserId == userId && a.DeletedAt == null, ct);
        if (!accountOk)
        {
            return Fail(StatusCodes.Status400BadRequest, "invalid_account", "Pick one of your linked bank accounts.");
        }
        var latest = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        if (request.Rows.Any(r => r.Date > latest))
        {
            return Fail(StatusCodes.Status400BadRequest, "future_date", "Dates can't be in the future.");
        }

        var ids = request.Rows.Select(r => r.Id!.Value).Distinct().ToList();
        var existing = await db.Transactions.Where(t => ids.Contains(t.Id)).ToDictionaryAsync(t => t.Id, ct);
        var now = DateTimeOffset.UtcNow;
        int imported = 0, restored = 0, skipped = 0;

        foreach (var row in request.Rows.DistinctBy(r => r.Id))
        {
            if (existing.TryGetValue(row.Id!.Value, out var tx))
            {
                if (tx.UserId != userId || tx.DeletedAt is null)
                {
                    skipped++;
                    continue;
                }
                tx.DeletedAt = null;
                restored++;
            }
            else
            {
                tx = new Transaction
                {
                    Id = row.Id.Value,
                    UserId = userId,
                    Source = TransactionValues.SourceImport,
                    CreatedAt = now,
                };
                db.Transactions.Add(tx);
                imported++;
            }
            tx.Type = row.Type;
            tx.Amount = Math.Round(row.Amount, 2);
            tx.Category = row.Category;
            tx.Note = string.IsNullOrWhiteSpace(row.Note) ? null : row.Note.Trim();
            tx.AccountId = request.AccountId!.Value;
            tx.OccurredOn = row.Date!.Value;
            tx.UpdatedAt = now;
        }

        await db.SaveChangesAsync(ct);
        return Ok(new ImportTransactionsResponse(imported, restored, skipped));
    }

    /// <summary>
    /// A digital PDF is first read with fixed rules (one line per transaction). That exact reading is
    /// used only if every running balance and the opening / closing totals add up; otherwise Gemini
    /// structures the text. Gemini's result borrows the exactly-read opening / closing balances, so a
    /// row it drops always fails the totals check.
    /// </summary>
    private async Task<ParsedStatement> ReadDigitalPdfAsync(IReadOnlyList<string> pages, CancellationToken ct)
    {
        var exact = TextStatementParser.TryParse(pages);
        if (exact is not null)
        {
            var check = StatementVerifier.Verify(exact, Guid.Empty);
            var unchecked_ = check.Rows.Count(r => r.Check == "unchecked");
            if (check.BalanceCheck == "passed" && check.Rows.All(r => r.Check != "mismatch") && unchecked_ <= 1)
            {
                logger.LogInformation("PDF statement read with fixed rules ({Rows} rows)", exact.Rows.Count);
                return exact;
            }
        }

        var statement = await gemini.FromTextAsync(pages, ct);
        var labelled = TextStatementParser.FindLabelledAmounts(TextStatementParser.Lines(pages));
        statement.OpeningBalance = labelled.Opening ?? statement.OpeningBalance;
        statement.ClosingBalance = labelled.Closing ?? statement.ClosingBalance;
        statement.TotalIn = labelled.TotalIn;
        statement.TotalOut = labelled.TotalOut;
        statement.BankName ??= TextStatementParser.FindBank(pages);
        return statement;
    }

    private async Task<StatementPreviewResponse> ToPreviewAsync(
        string kind, ParsedStatement statement, VerifiedStatement verified, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var ids = verified.Rows.Select(r => r.Id).ToList();
        var already = (await db.Transactions
                .Where(t => t.UserId == userId && t.DeletedAt == null && ids.Contains(t.Id))
                .Select(t => t.Id)
                .ToListAsync(ct))
            .ToHashSet();

        var latest = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(1);
        var warnings = verified.Warnings.ToList();
        var rows = verified.Rows.Where(r => r.Date <= latest).ToList();
        if (rows.Count < verified.Rows.Count)
        {
            warnings.Add("Rows dated in the future were left out.");
        }
        // Ticked to start with: rows whose running balance adds up. A row with no balance printed is
        // ticked when it was read exactly (CSV / Excel) and nothing failed, or, when read by AI, only
        // if the statement's balances add up. Rows that don't add up are never ticked.
        bool Preselect(VerifiedRow r) => !already.Contains(r.Id) && r.Check switch
        {
            "verified" => true,
            "mismatch" => false,
            _ => statement.Method == "rules" ? verified.BalanceCheck != "failed" : verified.BalanceCheck == "passed",
        };

        return new StatementPreviewResponse(
            kind,
            statement.Method,
            statement.BankName,
            statement.OpeningBalance,
            statement.ClosingBalance,
            verified.BalanceCheck,
            rows.Count > 0 ? rows.Min(r => r.Date) : DateOnly.FromDateTime(DateTime.UtcNow),
            rows.Count > 0 ? rows.Max(r => r.Date) : DateOnly.FromDateTime(DateTime.UtcNow),
            rows.Select(r => new StatementRowResponse(
                r.Id, r.Date, r.Description, r.Amount, r.Type, r.Balance, r.Check, r.Category,
                already.Contains(r.Id), Preselect(r))).ToList(),
            warnings);
    }

    private static ParsedStatement ParseFirstStatementSheet(IReadOnlyList<IReadOnlyList<string?[]>> sheets)
    {
        StatementImportException? first = null;
        foreach (var sheet in sheets)
        {
            try
            {
                return TableStatementParser.Parse(sheet);
            }
            catch (StatementImportException ex)
            {
                first ??= ex;
            }
        }
        throw first ?? new StatementImportException("no_transactions", "No transactions were found in this file.");
    }

    /// <summary>File type from its first bytes (the name's extension can be wrong).</summary>
    private static string DetectKind(byte[] b, string? fileName)
    {
        if (b.Length >= 4 && b[0] == '%' && b[1] == 'P' && b[2] == 'D' && b[3] == 'F') return "pdf";
        if (b.Length >= 4 && b[0] == 0x50 && b[1] == 0x4B && b[2] == 0x03 && b[3] == 0x04) return "excel"; // XLSX (zip)
        if (b.Length >= 4 && b[0] == 0xD0 && b[1] == 0xCF && b[2] == 0x11 && b[3] == 0xE0) return "excel"; // XLS
        var ext = Path.GetExtension(fileName ?? "").ToLowerInvariant();
        if (ext is ".csv" or ".txt" || LooksLikeText(b)) return "csv";
        return "unknown";
    }

    private static bool LooksLikeText(byte[] b) =>
        b.Take(2048).All(c => c is 9 or 10 or 13 || c >= 32);

    private ObjectResult Fail(int status, string code, string detail) =>
        Problem(statusCode: status, detail: detail, extensions: new Dictionary<string, object?> { ["code"] = code });
}
