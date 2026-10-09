using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Auth;
using EzFinance.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>The signed-in user's profile. Users can only ever reach their own row.</summary>
[ApiController]
[Route("api/profile")]
[Authorize]
public sealed class ProfileController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ProfileResponse>> Get(CancellationToken ct)
    {
        var profile = await LoadProfileAsync(track: false, ct);
        return profile is null
            ? Problem(statusCode: StatusCodes.Status404NotFound, detail: "Profile not found.")
            : Ok(ProfileResponse.From(profile, User.GetEmail()));
    }

    [HttpPut]
    public async Task<ActionResult<ProfileResponse>> Update(UpdateProfileRequest request, CancellationToken ct)
    {
        var profile = await LoadProfileAsync(track: true, ct);
        if (profile is null)
        {
            return Problem(statusCode: StatusCodes.Status404NotFound, detail: "Profile not found.");
        }

        profile.FullName = request.FullName.Trim();
        profile.MonthlyIncome = request.MonthlyIncome;
        profile.City = string.IsNullOrWhiteSpace(request.City) ? null : request.City.Trim();
        profile.Province = request.Province;
        profile.FilerStatus = request.FilerStatus;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        return Ok(ProfileResponse.From(profile, User.GetEmail()));
    }

    /// <summary>Records that the user finished or skipped the first-visit app tour.</summary>
    [HttpPost("tour-completed")]
    public async Task<ActionResult<ProfileResponse>> TourCompleted(CancellationToken ct)
    {
        var profile = await LoadProfileAsync(track: true, ct);
        if (profile is null)
        {
            return Problem(statusCode: StatusCodes.Status404NotFound, detail: "Profile not found.");
        }

        if (!profile.TourCompleted)
        {
            profile.TourCompleted = true;
            profile.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        return Ok(ProfileResponse.From(profile, User.GetEmail()));
    }

    /// <summary>
    /// The caller's profile. If the row is missing (e.g. deleted by hand), it is recreated from
    /// the details saved with the account at sign-up. Null only if the account itself is gone.
    /// </summary>
    private async Task<Profile?> LoadProfileAsync(bool track, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var query = track ? db.Profiles : db.Profiles.AsNoTracking();

        var profile = await query.FirstOrDefaultAsync(p => p.Id == userId, ct);
        if (profile is null)
        {
            await db.Database.ExecuteSqlAsync($"select public.ensure_profile({userId})", ct);
            profile = await query.FirstOrDefaultAsync(p => p.Id == userId, ct);
        }
        return profile;
    }
}
