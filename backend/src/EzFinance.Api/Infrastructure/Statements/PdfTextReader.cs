using System.Text;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using UglyToad.PdfPig.Exceptions;

namespace EzFinance.Api.Infrastructure.Statements;

/// <summary>
/// Reads the text of a digital PDF statement, line by line, keeping columns apart. The text is the
/// bank's own (no OCR), so characters and numbers are exact. Opens password-protected statements
/// with the password the user typed; it is used for this one read and never stored.
/// </summary>
public static class PdfTextReader
{
    public const int MaxPages = 40;

    /// <summary>Text per page. Empty pages mean a scanned (image-only) PDF.</summary>
    public static IReadOnlyList<string> ReadPages(byte[] content, string? password)
    {
        PdfDocument document;
        try
        {
            document = PdfDocument.Open(content, new ParsingOptions { Password = password ?? string.Empty });
        }
        catch (PdfDocumentEncryptedException)
        {
            throw string.IsNullOrEmpty(password)
                ? new StatementImportException("password_required",
                    "This statement is password-protected. Enter the password your bank gave you (often your CNIC or date of birth).")
                : new StatementImportException("wrong_password", "That password didn't open the statement. Check it and try again.");
        }
        catch (Exception ex) when (ex is not StatementImportException)
        {
            throw new StatementImportException("unreadable_file", "This PDF couldn't be opened. Try downloading the statement again.");
        }

        using (document)
        {
            if (document.NumberOfPages > MaxPages)
            {
                throw new StatementImportException("too_many_pages",
                    $"This statement has {document.NumberOfPages} pages. Import up to {MaxPages} pages at a time (e.g. one or two months).");
            }
            return document.GetPages().Select(PageText).ToList();
        }
    }

    /// <summary>Words grouped into lines by their vertical position; wide gaps become " | ".</summary>
    private static string PageText(Page page)
    {
        var words = page.GetWords().Where(w => !string.IsNullOrWhiteSpace(w.Text)).ToList();
        if (words.Count == 0)
        {
            return string.Empty;
        }
        var lineTolerance = Math.Max(2.0, Median(words.Select(w => w.BoundingBox.Height)) * 0.5);
        var lines = new List<List<Word>>();
        foreach (var word in words.OrderByDescending(w => w.BoundingBox.Bottom))
        {
            var line = lines.LastOrDefault();
            if (line is not null && Math.Abs(line[0].BoundingBox.Bottom - word.BoundingBox.Bottom) <= lineTolerance)
            {
                line.Add(word);
            }
            else
            {
                lines.Add([word]);
            }
        }

        var text = new StringBuilder();
        foreach (var line in lines)
        {
            var ordered = line.OrderBy(w => w.BoundingBox.Left).ToList();
            var charWidth = Median(ordered.Select(w => w.BoundingBox.Width / Math.Max(1, w.Text.Length)));
            text.Append(ordered[0].Text);
            for (var i = 1; i < ordered.Count; i++)
            {
                var gap = ordered[i].BoundingBox.Left - ordered[i - 1].BoundingBox.Right;
                text.Append(gap > charWidth * 2.5 ? " | " : " ").Append(ordered[i].Text);
            }
            text.AppendLine();
        }
        return text.ToString();
    }

    private static double Median(IEnumerable<double> values)
    {
        var sorted = values.OrderBy(v => v).ToList();
        return sorted.Count == 0 ? 0 : sorted[sorted.Count / 2];
    }
}
