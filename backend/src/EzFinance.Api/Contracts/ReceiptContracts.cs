namespace EzFinance.Api.Contracts;

/// <summary>
/// Response contract for a receipt scan.
/// </summary>
public sealed record ReceiptScanResponse(
    string? Merchant,
    decimal? Total,
    decimal? Tax,
    string? TaxId,
    DateOnly? Date,
    string? Category,
    IReadOnlyList<ReceiptLineItem> Items,
    double Confidence);

/// <summary>
/// A line item extracted from a receipt.
/// </summary>
public sealed record ReceiptLineItem(string Name, decimal Price);
