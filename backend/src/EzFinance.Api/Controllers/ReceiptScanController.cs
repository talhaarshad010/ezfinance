using EzFinance.Api.Contracts;
using EzFinance.Api.Infrastructure.Ocr;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EzFinance.Api.Controllers;

/// <summary>
/// Controller for receipt scanning and processing.
/// </summary>
[ApiController]
[Route("api/receipts")]
[Authorize]
public sealed class ReceiptScanController(
    IReceiptOcrService ocrService,
    ILogger<ReceiptScanController> logger) : ControllerBase
{
    /// <summary>
    /// Scans a receipt image.
    /// </summary>
    [HttpPost("scan")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Scan(IFormFile image, CancellationToken ct)
    {
        if (image.Length == 0)
            return Fail("Image is required.");

        if (image.Length > 10 * 1024 * 1024)
            return Fail("Image must be smaller than 10MB.");

        if (!image.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return Fail("Only image files are supported.");

        using var ms = new MemoryStream();
        await image.CopyToAsync(ms, ct);
        var imageBytes = ms.ToArray();

        try
        {
            logger.LogInformation("Processing receipt image ({Bytes} bytes, content type {Type})", imageBytes.Length, image.ContentType);
            var result = await ocrService.ExtractAsync(imageBytes, image.ContentType, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process receipt image");
            return Fail($"Failed to process image: {ex.Message}");
        }
    }

    private IActionResult Fail(string message) => BadRequest(new { error = message, detail = message });
}
