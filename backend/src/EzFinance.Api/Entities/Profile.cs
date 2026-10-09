namespace EzFinance.Api.Entities;

/// <summary>
/// Row in public.profiles. Created by the on_auth_user_created trigger when a user signs up;
/// see backend/supabase/migrations for the schema and allowed values.
/// </summary>
public sealed class Profile
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? MonthlyIncome { get; set; }
    public string? City { get; set; }
    public string? Province { get; set; }
    public string FilerStatus { get; set; } = ProfileValues.FilerUnsure;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

/// <summary>Allowed values for profile fields, matching the check constraints in the database.</summary>
public static class ProfileValues
{
    public const string IncomeUnder25k = "under_25k";
    public const string Income25kTo50k = "25k_50k";
    public const string Income50kTo100k = "50k_100k";
    public const string Income100kTo150k = "100k_150k";
    public const string Income150kPlus = "150k_plus";

    public const string Punjab = "Punjab";
    public const string Sindh = "Sindh";
    public const string Kpk = "KPK";
    public const string Balochistan = "Balochistan";
    public const string Ict = "ICT";
    public const string Ajk = "AJK";
    public const string Gb = "GB";

    public const string Filer = "filer";
    public const string NonFiler = "non_filer";
    public const string FilerUnsure = "unsure";
}
