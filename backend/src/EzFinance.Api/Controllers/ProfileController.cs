using EzFinance.Api.Contracts;
using EzFinance.Api.Entities;
using EzFinance.Api.Infrastructure.Auth;
using EzFinance.Api.Infrastructure.Data;
using EzFinance.Api.Infrastructure.Supabase;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EzFinance.Api.Controllers;

/// <summary>The signed-in user's profile. Users can only ever reach their own row.</summary>
[ApiController]
[Route("api/profile")]
[Authorize]
public sealed class ProfileController(
    AppDbContext db, SupabaseStorageClient storage, ILogger<ProfileController> logger) : ControllerBase
{
    /// <summary>Largest accepted photo. The app resizes to ~512px first, so real uploads are far smaller.</summary>
    private const int MaxAvatarBytes = 2 * 1024 * 1024;

    [HttpGet]
    public async Task<ActionResult<ProfileResponse>> Get(CancellationToken ct)
    {
        var profile = await LoadProfileAsync(track: false, ct);
        return profile is null
            ? Problem(statusCode: StatusCodes.Status404NotFound, detail: "Profile not found.")
            : Ok(await ToResponseAsync(profile, ct));
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

        return Ok(await ToResponseAsync(profile, ct));
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
        return Ok(await ToResponseAsync(profile, ct));
    }

    /// <summary>
    /// Sets the profile photo (multipart field "file": JPEG, PNG or WebP, up to 2 MB). Stored in the
    /// private "avatars" bucket; the previous photo is deleted.
    /// </summary>
    [HttpPost("avatar")]
    [RequestSizeLimit(MaxAvatarBytes + 64 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxAvatarBytes + 64 * 1024)]
    public async Task<ActionResult<ProfileResponse>> UploadAvatar(IFormFile? file, CancellationToken ct)
    {
        if (!storage.IsConfigured)
        {
            return AvatarsUnavailable();
        }
        if (file is null || file.Length == 0)
        {
            return Fail(StatusCodes.Status400BadRequest, "invalid_image", "Choose a photo to upload.");
        }
        if (file.Length > MaxAvatarBytes)
        {
            return Fail(StatusCodes.Status413PayloadTooLarge, "image_too_large", "That photo is too large. The limit is 2 MB.");
        }

        byte[] bytes;
        await using (var stream = file.OpenReadStream())
        using (var buffer = new MemoryStream((int)file.Length))
        {
            await stream.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }
        // Trust the file's contents, not the name or the declared type.
        var image = DetectImage(bytes);
        if (image is null)
        {
            return Fail(StatusCodes.Status400BadRequest, "invalid_image", "Use a JPEG, PNG or WebP photo.");
        }

        var profile = await LoadProfileAsync(track: true, ct);
        if (profile is null)
        {
            return Problem(statusCode: StatusCodes.Status404NotFound, detail: "Profile not found.");
        }

        // A new random name each time, so devices never show a cached old photo.
        var path = $"{profile.Id}/{Guid.NewGuid():N}.{image.Value.Extension}";
        await storage.UploadAsync(SupabaseStorageClient.AvatarBucket, path, bytes, image.Value.ContentType, ct);

        var previous = profile.AvatarPath;
        profile.AvatarPath = path;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await DeleteAvatarFileAsync(previous);

        return Ok(await ToResponseAsync(profile, ct));
    }

    /// <summary>Removes the profile photo (204 also when there was none).</summary>
    [HttpDelete("avatar")]
    public async Task<IActionResult> DeleteAvatar(CancellationToken ct)
    {
        if (!storage.IsConfigured)
        {
            return AvatarsUnavailable();
        }
        var profile = await LoadProfileAsync(track: true, ct);
        if (profile?.AvatarPath is null)
        {
            return NoContent();
        }

        var previous = profile.AvatarPath;
        profile.AvatarPath = null;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        await DeleteAvatarFileAsync(previous);
        return NoContent();
    }

    private async Task<ProfileResponse> ToResponseAsync(Profile profile, CancellationToken ct)
    {
        var response = ProfileResponse.From(profile, User.GetEmail());
        if (profile.AvatarPath is null || !storage.IsConfigured)
        {
            return response;
        }
        try
        {
            return response with
            {
                AvatarUrl = await storage.SignedUrlAsync(SupabaseStorageClient.AvatarBucket, profile.AvatarPath, ct),
            };
        }
        catch (HttpRequestException)
        {
            return response; // the profile still loads; the app shows initials instead of the photo
        }
    }

    /// <summary>Best effort: a leftover file only costs storage, so a failure here doesn't fail the request.</summary>
    private async Task DeleteAvatarFileAsync(string? path)
    {
        if (path is null)
        {
            return;
        }
        try
        {
            await storage.DeleteAsync(SupabaseStorageClient.AvatarBucket, path, CancellationToken.None);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "Could not delete old avatar {Path}", path);
        }
    }

    private static (string Extension, string ContentType)? DetectImage(byte[] b)
    {
        if (b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF)
        {
            return ("jpg", "image/jpeg");
        }
        if (b.Length >= 8 && b[0] == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47
            && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A)
        {
            return ("png", "image/png");
        }
        if (b.Length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
            && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P')
        {
            return ("webp", "image/webp");
        }
        return null;
    }

    private ObjectResult AvatarsUnavailable() =>
        Fail(StatusCodes.Status503ServiceUnavailable, "avatars_unavailable",
            "Profile photos aren't available right now. Try again later.");

    private ObjectResult Fail(int status, string code, string detail) =>
        Problem(statusCode: status, detail: detail, extensions: new Dictionary<string, object?> { ["code"] = code });

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
