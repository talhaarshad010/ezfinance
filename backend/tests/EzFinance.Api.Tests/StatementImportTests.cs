using System.Text;
using EzFinance.Api.Infrastructure.Statements;
using UglyToad.PdfPig.Fonts.Standard14Fonts;
using UglyToad.PdfPig.Writer;

namespace EzFinance.Api.Tests;

/// <summary>
/// Bank statement import: CSV / Excel reading with fixed rules, the running-balance check, stable
/// row ids, masking before anything goes to Gemini, and PDF text extraction.
/// </summary>
public class StatementImportTests
{
    private static readonly Guid User = Guid.Parse("abe5fc09-6eee-46d1-a39e-20661805fc2e");

    private static VerifiedStatement ReadCsv(string csv)
    {
        var sheets = SpreadsheetReader.Read(Encoding.UTF8.GetBytes(csv), isCsv: true);
        return StatementVerifier.Verify(TableStatementParser.Parse(sheets[0]), User);
    }

    [Fact]
    public void Debit_credit_columns_oldest_first_all_rows_verified()
    {
        var result = ReadCsv("""
            HBL Statement of Account,,,,
            Account: 0123-4567890-01,,,,
            Date,Narration,Debit,Credit,Balance
            01/10/2026,Opening Balance,,,"50,000.00"
            02/10/2026,PSO SERVICE STATION,"5,200.00",,"44,800.00"
            05/10/2026,SALARY OCT 2026,,"150,000.00","194,800.00"
            07/10/2026,K-ELECTRIC BILL PAYMENT,"8,450.50",,"186,349.50"
            31/10/2026,Closing Balance,,,"186,349.50"
            """);

        Assert.Equal("passed", result.BalanceCheck);
        Assert.Equal(3, result.Rows.Count);
        Assert.All(result.Rows, r => Assert.Equal("verified", r.Check));
        Assert.Equal(("expense", 5200m, "Fuel"), (result.Rows[0].Type, result.Rows[0].Amount, result.Rows[0].Category));
        Assert.Equal(("income", "Salary"), (result.Rows[1].Type, result.Rows[1].Category));
        Assert.Equal(("expense", 8450.50m, "Bills"), (result.Rows[2].Type, result.Rows[2].Amount, result.Rows[2].Category));
        Assert.Equal(new DateOnly(2026, 10, 7), result.Rows[2].Date);
    }

    [Fact]
    public void Newest_first_single_amount_with_dr_cr_markers_is_verified()
    {
        var result = ReadCsv("""
            Transaction Date,Particulars,Amount,Balance
            12-Oct-2026,IMTIAZ SUPER MARKET,"3,000.00 Dr","97,000.00"
            10-Oct-2026,IBFT FROM ALI,"20,000.00 Cr","100,000.00"
            08-Oct-2026,KFC DHA,"1,500.00Dr","80,000.00"
            """);

        Assert.Equal("passed", result.BalanceCheck);
        // The oldest row has no earlier balance to compare with (no opening balance printed).
        Assert.Equal(["verified", "verified", "unchecked"], result.Rows.Select(r => r.Check));
        Assert.Equal(["expense", "income", "expense"], result.Rows.Select(r => r.Type));
        Assert.Equal(["Groceries", "Other", "Dining"], result.Rows.Select(r => r.Category));
    }

    [Fact]
    public void Direction_missing_from_file_is_worked_out_from_the_balance()
    {
        var result = ReadCsv("""
            Date,Description,Amount,Balance
            01/10/2026,Opening balance,,"10,000"
            03/10/2026,Transfer received,"2,500","12,500"
            04/10/2026,Card purchase,"1,000","11,500"
            """);

        Assert.Equal(["income", "expense"], result.Rows.Select(r => r.Type));
        Assert.All(result.Rows, r => Assert.Equal("verified", r.Check));
    }

    [Fact]
    public void A_row_that_does_not_add_up_is_flagged()
    {
        var result = ReadCsv("""
            Date,Narration,Debit,Credit,Balance
            01/10/2026,Opening Balance,,,"50,000.00"
            02/10/2026,PSO,"5,200.00",,"44,800.00"
            03/10/2026,Naheed,"2,000.00",,"42,000.00"
            04/10/2026,Daraz,"1,000.00",,"41,000.00"
            """);

        Assert.Equal("failed", result.BalanceCheck);
        Assert.Equal(["verified", "mismatch", "verified"], result.Rows.Select(r => r.Check));
        Assert.Contains(result.Warnings, w => w.Contains("doesn't add up"));
    }

    [Fact]
    public void Missing_row_is_caught_by_the_closing_balance()
    {
        var result = ReadCsv("""
            Date,Narration,Debit,Credit
            01/10/2026,Opening Balance,,
            02/10/2026,PSO,"5,200.00",
            03/10/2026,Naheed,"2,000.00",
            31/10/2026,Closing Balance,,
            """.Replace("Opening Balance,,", "Opening Balance,,50000").Replace("Closing Balance,,", "Closing Balance,,40000"));

        // Without a balance column, the totals still have to add up: 50,000 - 7,200 ≠ 40,000.
        Assert.Equal("failed", result.BalanceCheck);
    }

    [Fact]
    public void Wrapped_descriptions_join_and_summary_lines_are_skipped_but_a_shop_called_total_is_kept()
    {
        var result = ReadCsv("""
            Date,Description,Withdrawal,Deposit,Balance
            02/10/2026,TOTAL PARCO PUMP,"4,000",,"46,000"
            ,LAHORE CANTT,,,
            03/10/2026,IBFT,,"1,000","47,000"
            Total,,"4,000","1,000",
            """);

        Assert.Equal(2, result.Rows.Count);
        Assert.Equal("TOTAL PARCO PUMP LAHORE CANTT", result.Rows[0].Description);
        Assert.Equal("Fuel", result.Rows[0].Category);
    }

    [Fact]
    public void Month_first_dates_are_detected()
    {
        var result = ReadCsv("""
            Date,Description,Amount
            10/25/2026,Coffee,-500
            10/26/2026,Lunch,-900
            """);

        Assert.Equal([new DateOnly(2026, 10, 25), new DateOnly(2026, 10, 26)], result.Rows.Select(r => r.Date));
        Assert.Equal("unavailable", result.BalanceCheck);
        Assert.All(result.Rows, r => Assert.Equal("expense", r.Type));
    }

    [Fact]
    public void Row_ids_are_stable_and_identical_rows_stay_distinct()
    {
        const string csv = """
            Date,Description,Debit,Credit
            02/10/2026,Chai Dhaba,200,
            02/10/2026,Chai Dhaba,200,
            """;
        var first = ReadCsv(csv);
        var again = ReadCsv(csv);

        Assert.Equal(first.Rows.Select(r => r.Id), again.Rows.Select(r => r.Id));
        Assert.NotEqual(first.Rows[0].Id, first.Rows[1].Id);
        var otherUser = StatementVerifier.Verify(
            TableStatementParser.Parse(SpreadsheetReader.Read(Encoding.UTF8.GetBytes(csv), true)[0]), Guid.NewGuid());
        Assert.NotEqual(first.Rows[0].Id, otherUser.Rows[0].Id);
    }

    [Fact]
    public void File_without_date_or_amount_columns_is_rejected_with_a_clear_code()
    {
        var ex = Assert.Throws<StatementImportException>(() => ReadCsv("Name,City\nAli,Lahore\n"));
        Assert.Equal("columns_not_found", ex.Code);
    }

    [Theory]
    [InlineData("1,234.50", 1234.50, RowDirection.Unknown)]
    [InlineData("(1,234.50)", -1234.50, RowDirection.Out)]
    [InlineData("Rs. 2,000", 2000, RowDirection.Unknown)]
    [InlineData("PKR 1,234.00 Dr", 1234, RowDirection.Out)]
    [InlineData("1,234.00CR", 1234, RowDirection.In)]
    [InlineData("-500", -500, RowDirection.Out)]
    public void Money_formats(string text, decimal value, RowDirection hint)
    {
        var parsed = StatementValues.ParseMoney(text);
        Assert.NotNull(parsed);
        Assert.Equal(value, parsed.Value.Value);
        Assert.Equal(hint, parsed.Value.Hint);
    }

    [Theory]
    [InlineData("")]
    [InlineData("-")]
    [InlineData("N/A")]
    public void Not_money(string text) => Assert.Null(StatementValues.ParseMoney(text));

    [Fact]
    public void Masking_hides_identifiers_but_keeps_dates_and_amounts()
    {
        var masked = GeminiStatementExtractor.Mask(
            "05-10-2026 | IBFT to PK36SCBL0000001123456702 | CNIC 35202-1234567-1 | Acc 0123-4567890-01 | Card 4111 1111 1111 1234 | Mob 03001234567 | 12,345.00 | 2026-10-05");

        Assert.DoesNotContain("SCBL0000001123", masked);
        Assert.DoesNotContain("35202-1234567-1", masked);
        Assert.DoesNotContain("4567890", masked);
        Assert.DoesNotContain("4111 1111", masked);
        Assert.DoesNotContain("0300123", masked);
        Assert.Contains("05-10-2026", masked);
        Assert.Contains("12,345.00", masked);
        Assert.Contains("2026-10-05", masked);
        Assert.Contains("6702", masked); // last 4 digits stay, so the user can still recognise the account
    }

    // Wallet / bank PDFs with one line per transaction (NayaPay-style), read without AI.
    private const string WalletPdfText = """
        Account Statement
        01 Sep 2026 - 30 Sep 2026
        01 Sep 2026 | Total Income | 30 Sep 2026
        Rs. 15,050
        Opening Balance | Total Spent | Closing Balance
        IBAN
        Rs. 131.52 | Rs. 15,115 | Rs. 66.52
        TIME | TYPE | DESCRIPTION | AMOUNT | BALANCE
        01 Sep 2026 | Mobile Top-Up Mobile top-up purchased | -Rs. 5 | Rs. 126.52
        12:16 AM | Ufone *******2660
        Service Charges Rs. 0
        06 Sep 2026 | IBFT In | Incoming fund transfer from Test Sender | +Rs. 15,000 | Rs. 15,126.52
        06 Sep 2026 | Raast Out | Outgoing fund transfer to Test User -Rs. 15,000 | Rs. 126.52
        19 Sep 2026 | Online | Paid to Foodpanda Karachi Pakista00000000000 -Rs. 110 | Rs. 16.52
        19 Sep 2026 | Card | GOOGLE *TEMPORARY HOLD | -Rs. 0 | Rs. 16.52
        22 Sep 2026 | Raast In | Incoming fund transfer from Test Sender | +Rs. 50 | Rs. 66.52
        CARRIED FORWARD
        """;

    [Fact]
    public void One_line_per_transaction_pdf_is_read_exactly_and_adds_up()
    {
        var statement = TextStatementParser.TryParse([WalletPdfText]);

        Assert.NotNull(statement);
        Assert.Equal((131.52m, 66.52m), (statement.OpeningBalance, statement.ClosingBalance));
        var result = StatementVerifier.Verify(statement, User);
        Assert.Equal("passed", result.BalanceCheck);
        Assert.Equal(5, result.Rows.Count); // the zero-amount card hold is not a transaction
        Assert.All(result.Rows, r => Assert.Equal("verified", r.Check));
        Assert.Equal(15_050m, result.Rows.Where(r => r.Type == "income").Sum(r => r.Amount));
        Assert.Equal(15_115m, result.Rows.Where(r => r.Type == "expense").Sum(r => r.Amount));
        Assert.Equal("Raast Out Outgoing fund transfer to Test User", result.Rows[2].Description);
        Assert.Equal("Dining", result.Rows[3].Category);
        Assert.Null(statement.BankName); // the sample text names no bank
        Assert.Equal("NayaPay", TextStatementParser.FindBank([WalletPdfText + "support@nayapay.com"]));
    }

    [Fact]
    public void Missing_row_in_a_pdf_breaks_the_check()
    {
        var withoutOneRow = WalletPdfText.Replace("06 Sep 2026 | Raast Out | Outgoing fund transfer to Test User -Rs. 15,000 | Rs. 126.52\n", "");
        var result = StatementVerifier.Verify(TextStatementParser.TryParse([withoutOneRow])!, User);

        Assert.Equal("failed", result.BalanceCheck);
        Assert.Contains(result.Rows, r => r.Check == "mismatch");
    }

    // Bank PDFs where the description wraps around a date line that holds only a reference number
    // (Raqami-style), across a page break, with Total In / Total Out printed in the header.
    private static readonly string[] WrappedPdfPages =
    [
        """
        E-STATEMENT
        Total In | Total Out
        PKR 11,130.00 | PKR 11,130.00
        DATE | TRANSACTION | REFERENCE NO. | DEBIT/CREDIT | BALANCE
        Opening Balance | 3,000.00
        ATM Withdrawal from Test Bank
        18/07/2026 | 208745657 | - 3,000.00 | 0.00
        Limited
        Received from Test Sender
        Arshad [ -
        20/07/2026 | 285138443 | + 1,130.00 | 1,130.00
        PK56****************8611]
        via Raast
        Transferred to TEST PERSON
        [Raast ID -
        20/07/2026 | 225587813 | - 500.00 | 630.00
        """,
        """
        PK88****************0704]
        via Raast
        Received from Test Sender
        Arshad [ -
        21/07/2026 | 630454175 | + 10,000.00 | 10,630.00
        PK56****************8611]
        via Raast
        22/07/2026 | Transferred to TEST SHOP | 331633842 | - 7,630.00 | 3,000.00
        AUTOS [Raast ID -
        PK11****************1111]
        GENERATED ON 17-OCT-2026
        """,
    ];

    [Fact]
    public void Wrapped_descriptions_are_rebuilt_around_their_date_line()
    {
        var statement = TextStatementParser.TryParse(WrappedPdfPages);

        Assert.NotNull(statement);
        Assert.Equal((3000m, 11_130m, 11_130m), (statement.OpeningBalance!.Value, statement.TotalIn!.Value, statement.TotalOut!.Value));
        var result = StatementVerifier.Verify(statement, User);
        Assert.Equal("passed", result.BalanceCheck);
        Assert.All(result.Rows, r => Assert.Equal("verified", r.Check));
        Assert.Equal(
            [
                "ATM Withdrawal from Test Bank Limited",
                "Received from Test Sender Arshad via Raast",
                "Transferred to TEST PERSON via Raast", // continues on the next page
                "Received from Test Sender Arshad via Raast",
                "Transferred to TEST SHOP AUTOS",
            ],
            result.Rows.Select(r => r.Description));
    }

    [Fact]
    public void Statement_totals_that_do_not_match_fail_the_check()
    {
        var pages = WrappedPdfPages.Select(p => p.Replace("PKR 11,130.00 | PKR 11,130.00", "PKR 11,130.00 | PKR 12,000.00")).ToArray();
        var result = StatementVerifier.Verify(TextStatementParser.TryParse(pages)!, User);

        Assert.Equal("failed", result.BalanceCheck);
    }

    [Fact]
    public void Gemini_input_is_cleaned_of_long_repeated_runs()
    {
        Assert.Equal("Pakista000 -Rs. 680 | Rs. 26.52", GeminiStatementExtractor.Clean("Pakista00000000000 -Rs. 680 | Rs. 26.52"));
        Assert.Equal("Rs. 1,000,000.00", GeminiStatementExtractor.Clean("Rs. 1,000,000.00"));
    }

    [Fact]
    public void Pdf_text_keeps_columns_apart()
    {
        var builder = new PdfDocumentBuilder();
        var page = builder.AddPage(595, 842);
        var font = builder.AddStandard14Font(Standard14Font.Helvetica);
        page.AddText("02/10/2026", 10, new UglyToad.PdfPig.Core.PdfPoint(40, 700), font);
        page.AddText("PSO SERVICE STATION", 10, new UglyToad.PdfPig.Core.PdfPoint(130, 700), font);
        page.AddText("5,200.00", 10, new UglyToad.PdfPig.Core.PdfPoint(380, 700), font);
        page.AddText("44,800.00", 10, new UglyToad.PdfPig.Core.PdfPoint(480, 700), font);

        var pages = PdfTextReader.ReadPages(builder.Build(), password: null);

        Assert.Single(pages);
        Assert.Contains("02/10/2026 | PSO SERVICE STATION | 5,200.00 | 44,800.00", pages[0]);
    }

    [Fact]
    public void Non_pdf_bytes_are_reported_as_unreadable()
    {
        var ex = Assert.Throws<StatementImportException>(() => PdfTextReader.ReadPages("%PDF-garbage"u8.ToArray(), null));
        Assert.Equal("unreadable_file", ex.Code);
    }
}
