using System.Net.Http.Headers;
using System.Text.Json;
using EzFinance.Api.Configuration;
using EzFinance.Api.Contracts;
using Microsoft.Extensions.Options;

namespace EzFinance.Api.Infrastructure.Ocr;

/// <summary>
/// Implementation of IReceiptOcrService using the Gemini API.
/// </summary>
public sealed class GeminiReceiptOcrService(
    HttpClient httpClient,
    IOptions<GeminiOptions> options,
    ILogger<GeminiReceiptOcrService> logger) : IReceiptOcrService
{
    private readonly GeminiOptions _options = options.Value;
    
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true,
        ReadCommentHandling = JsonCommentHandling.Skip
    };

    /// <inheritdoc/>
    public async Task<ReceiptScanResponse> ExtractAsync(byte[] imageBytes, string contentType, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException("Gemini API key is not configured. Run: dotnet user-secrets set \"Gemini:ApiKey\" \"<key>\" (or set the Gemini__ApiKey environment variable).");
        }

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_options.Model}:generateContent?key={_options.ApiKey}";
        
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new
                        {
                            text = @"You are an expert receipt OCR assistant. Extract the following information from the receipt image and return ONLY a valid JSON object. 
Fields:
- Merchant: string, merchant name
- Total: number, total amount
- Tax: number, tax amount
- TaxId: string, NTN or tax ID
- Date: string, YYYY-MM-DD
- Category: string, one of: 'Groceries', 'Fuel', 'Salary', 'Bills', 'Dining', 'Other'
- Items: array of objects with 'Name' (string) and 'Price' (number)
- Confidence: number, 0.0 to 1.0 confidence in the extraction

Handle PKR amounts and Urdu/English text. Return ONLY JSON without markdown."
                        },
                        new
                        {
                            inline_data = new
                            {
                                mime_type = contentType,
                                data = Convert.ToBase64String(imageBytes)
                            }
                        }
                    }
                }
            },
            generationConfig = new
            {
                response_mime_type = "application/json",
                max_output_tokens = 1024,
                temperature = 0.1
            }
        };

        var response = await httpClient.PostAsJsonAsync(url, requestBody, ct);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            logger.LogError("Gemini API returned {StatusCode}: {ErrorBody}", response.StatusCode, errorBody);
            throw new InvalidOperationException($"Gemini API error: {response.StatusCode} - {errorBody}");
        }

        var jsonStr = await response.Content.ReadAsStringAsync(ct);
        var geminiResponse = JsonSerializer.Deserialize<GeminiResponse>(jsonStr, JsonOptions);
        
        var text = geminiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;
        if (string.IsNullOrWhiteSpace(text))
        {
            logger.LogWarning("Gemini returned empty text in candidate content");
            return new ReceiptScanResponse(null, null, null, null, null, null, Array.Empty<ReceiptLineItem>(), 0);
        }

        text = text.Trim();
        if (text.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            text = text[7..];
        }
        else if (text.StartsWith("```", StringComparison.OrdinalIgnoreCase))
        {
            text = text[3..];
        }
        
        if (text.EndsWith("```"))
        {
            text = text[..^3];
        }

        try
        {
            var dto = JsonSerializer.Deserialize<ReceiptExtractionDto>(text.Trim(), JsonOptions);
            if (dto is null)
            {
                return new ReceiptScanResponse(null, null, null, null, null, null, Array.Empty<ReceiptLineItem>(), 0);
            }

            DateOnly? parsedDate = null;
            if (!string.IsNullOrWhiteSpace(dto.Date) && DateOnly.TryParse(dto.Date, out var d))
            {
                parsedDate = d;
            }

            return new ReceiptScanResponse(
                dto.Merchant,
                dto.Total,
                dto.Tax,
                dto.TaxId,
                parsedDate,
                dto.Category,
                dto.Items ?? (IReadOnlyList<ReceiptLineItem>)Array.Empty<ReceiptLineItem>(),
                dto.Confidence ?? 0.85);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to deserialize Gemini output: {RawText}", text);
            return new ReceiptScanResponse(null, null, null, null, null, null, Array.Empty<ReceiptLineItem>(), 0);
        }
    }

    private sealed class ReceiptExtractionDto
    {
        public string? Merchant { get; set; }
        public decimal? Total { get; set; }
        public decimal? Tax { get; set; }
        public string? TaxId { get; set; }
        public string? Date { get; set; }
        public string? Category { get; set; }
        public List<ReceiptLineItem>? Items { get; set; }
        public double? Confidence { get; set; }
    }

    private sealed class GeminiResponse
    {
        public List<Candidate>? Candidates { get; set; }
    }

    private sealed class Candidate
    {
        public Content? Content { get; set; }
    }

    private sealed class Content
    {
        public List<Part>? Parts { get; set; }
    }

    private sealed class Part
    {
        public string? Text { get; set; }
    }
}
