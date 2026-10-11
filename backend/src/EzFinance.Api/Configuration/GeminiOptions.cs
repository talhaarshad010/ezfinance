using System.ComponentModel.DataAnnotations;

namespace EzFinance.Api.Configuration;

/// <summary>
/// Configuration options for the Gemini API.
/// </summary>
public sealed class GeminiOptions
{
    /// <summary>
    /// The configuration section name.
    /// </summary>
    public const string SectionName = "Gemini";

    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// The Gemini model to use.
    /// </summary>
    public string Model { get; set; } = "gemini-flash-lite-latest";
}
