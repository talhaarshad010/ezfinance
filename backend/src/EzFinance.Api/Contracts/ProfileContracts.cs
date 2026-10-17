using System.ComponentModel.DataAnnotations;
using EzFinance.Api.Entities;

namespace EzFinance.Api.Contracts;

public sealed record ProfileResponse(
    Guid Id,
    string Email,
    string FullName,
    string? MonthlyIncome,
    string? City,
    string? Province,
    string FilerStatus,
    DateTimeOffset CreatedAt,
    bool HasPassword,
    bool TourCompleted,
    /// <summary>Signed, time-limited URL of the profile photo (null when there is none).</summary>
    string? AvatarUrl = null)
{
    public static ProfileResponse From(Profile profile, string email) => new(
        profile.Id, email, profile.FullName, profile.MonthlyIncome, profile.City,
        profile.Province, profile.FilerStatus, profile.CreatedAt, profile.HasPassword, profile.TourCompleted);
}

public sealed class UpdateProfileRequest
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string FullName { get; init; } = string.Empty;

    [AllowedValues(null, ProfileValues.IncomeUnder25k, ProfileValues.Income25kTo50k, ProfileValues.Income50kTo100k,
        ProfileValues.Income100kTo150k, ProfileValues.Income150kPlus)]
    public string? MonthlyIncome { get; init; }

    [StringLength(100)]
    public string? City { get; init; }

    [AllowedValues(null, ProfileValues.Punjab, ProfileValues.Sindh, ProfileValues.Kpk, ProfileValues.Balochistan,
        ProfileValues.Ict, ProfileValues.Ajk, ProfileValues.Gb)]
    public string? Province { get; init; }

    [Required, AllowedValues(ProfileValues.Filer, ProfileValues.NonFiler, ProfileValues.FilerUnsure)]
    public string FilerStatus { get; init; } = ProfileValues.FilerUnsure;
}
