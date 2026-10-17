using System.Globalization;
using System.Text;
using ExcelDataReader;

namespace EzFinance.Api.Infrastructure.Statements;

/// <summary>Turns a CSV, XLS or XLSX file into rows of text cells (dates as yyyy-MM-dd).</summary>
public static class SpreadsheetReader
{
    private const int MaxRows = 5000;

    static SpreadsheetReader()
    {
        // Old .xls files use legacy code pages that .NET doesn't load by default.
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
    }

    /// <summary>Every sheet's rows; the parser uses the first sheet that has a statement header.</summary>
    public static IReadOnlyList<IReadOnlyList<string?[]>> Read(byte[] content, bool isCsv)
    {
        using var stream = new MemoryStream(content);
        IExcelDataReader reader;
        try
        {
            reader = isCsv
                ? ExcelReaderFactory.CreateCsvReader(stream, new ExcelReaderConfiguration
                {
                    AutodetectSeparators = [',', ';', '\t', '|'],
                    FallbackEncoding = Encoding.UTF8,
                })
                : ExcelReaderFactory.CreateReader(stream);
        }
        catch (Exception ex) when (ex is not StatementImportException)
        {
            throw new StatementImportException("unreadable_file", "This file couldn't be opened. Is it a CSV or Excel statement?");
        }

        var sheets = new List<IReadOnlyList<string?[]>>();
        using (reader)
        {
            do
            {
                var rows = new List<string?[]>();
                while (reader.Read() && rows.Count < MaxRows)
                {
                    var cells = new string?[reader.FieldCount];
                    for (var i = 0; i < reader.FieldCount; i++)
                    {
                        cells[i] = reader.GetValue(i) switch
                        {
                            null => null,
                            DateTime d => d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                            double n => n.ToString("0.##########", CultureInfo.InvariantCulture),
                            var v => Convert.ToString(v, CultureInfo.InvariantCulture),
                        };
                    }
                    rows.Add(cells);
                }
                sheets.Add(rows);
            }
            while (reader.NextResult());
        }
        return sheets;
    }
}
