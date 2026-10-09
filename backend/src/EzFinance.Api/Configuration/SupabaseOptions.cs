using System.ComponentModel.DataAnnotations;

namespace EzFinance.Api.Configuration;

/// <summary>
/// Settings for the Supabase project. Bound from the "Supabase" configuration section.
/// </summary>
public sealed class SupabaseOptions
{
    public const string SectionName = "Supabase";

    /// <summary>Project URL, e.g. https://&lt;project-ref&gt;.supabase.co</summary>
    [Required, Url]
    public string Url { get; init; } = string.Empty;

    /// <summary>Publishable (sb_publishable_...) key, sent as the "apikey" header to Supabase Auth.</summary>
    [Required]
    public string PublishableKey { get; init; } = string.Empty;

    /// <summary>Base URL of Supabase Auth (GoTrue). Also the issuer of user access tokens.</summary>
    public string AuthUrl => $"{Url.TrimEnd('/')}/auth/v1";
}
