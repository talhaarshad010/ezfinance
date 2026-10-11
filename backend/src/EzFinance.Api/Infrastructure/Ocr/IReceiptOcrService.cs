using EzFinance.Api.Contracts;

namespace EzFinance.Api.Infrastructure.Ocr;

/// <summary>
/// Service for extracting data from receipt images.
/// </summary>
public interface IReceiptOcrService
{
    /// <summary>
    /// Extracts receipt data from an image.
    /// </summary>
    Task<ReceiptScanResponse> ExtractAsync(byte[] imageBytes, string contentType, CancellationToken ct = default);
}
