using System.Net.Http.Headers;
using System.Net.Http.Json;
using EzFinance.Api.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace EzFinance.Api.Infrastructure.Supabase;

/// <summary>
/// Typed HTTP client for Supabase Storage, used for profile photos in the private "avatars"
/// bucket. Authenticates with the project's secret key, so it must only ever run on the server.
/// The app gets short-lived signed URLs, never the key or direct bucket access.
/// </summary>
public sealed class SupabaseStorageClient
{
    public const string AvatarBucket = "avatars";

    /// <summary>Signed photo URLs stay valid this long; they are cached a day less.</summary>
    private static readonly TimeSpan SignedUrlLifetime = TimeSpan.FromDays(7);
    private static readonly TimeSpan SignedUrlCache = TimeSpan.FromDays(6);

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SupabaseStorageClient> _logger;
    private readonly string _storageUrl;

    public SupabaseStorageClient(
        HttpClient http, IOptions<SupabaseOptions> options, IMemoryCache cache, ILogger<SupabaseStorageClient> logger)
    {
        var supabase = options.Value;
        _storageUrl = supabase.StorageUrl;
        IsConfigured = !string.IsNullOrWhiteSpace(supabase.SecretKey);
        http.BaseAddress = new Uri($"{_storageUrl}/");
        if (IsConfigured)
        {
            http.DefaultRequestHeaders.Add("apikey", supabase.SecretKey);
        }
        _http = http;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>False until Supabase:SecretKey is set (user secrets / environment variables).</summary>
    public bool IsConfigured { get; }

    public async Task UploadAsync(string bucket, string path, byte[] content, string contentType, CancellationToken ct)
    {
        using var body = new ByteArrayContent(content);
        body.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        using var request = new HttpRequestMessage(HttpMethod.Post, $"object/{bucket}/{path}") { Content = body };
        request.Headers.Add("x-upsert", "false");
        request.Headers.CacheControl = new CacheControlHeaderValue { MaxAge = TimeSpan.FromDays(7) };
        using var response = await _http.SendAsync(request, ct);
        await EnsureSuccessAsync(response, "upload", ct);
    }

    public async Task DeleteAsync(string bucket, string path, CancellationToken ct)
    {
        _cache.Remove(CacheKey(bucket, path));
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"object/{bucket}")
        {
            Content = JsonContent.Create(new { prefixes = new[] { path } }),
        };
        using var response = await _http.SendAsync(request, ct);
        await EnsureSuccessAsync(response, "delete", ct);
    }

    /// <summary>A signed, time-limited URL for a private file (cached so the app's image cache stays warm).</summary>
    public async Task<string> SignedUrlAsync(string bucket, string path, CancellationToken ct)
    {
        if (_cache.TryGetValue(CacheKey(bucket, path), out string? cached) && cached is not null)
        {
            return cached;
        }
        using var response = await _http.PostAsJsonAsync(
            $"object/sign/{bucket}/{path}", new { expiresIn = (int)SignedUrlLifetime.TotalSeconds }, ct);
        await EnsureSuccessAsync(response, "sign", ct);
        var signed = await response.Content.ReadFromJsonAsync<SignedUrlResponse>(ct)
            ?? throw new InvalidOperationException("Supabase Storage returned no signed URL.");
        // signedURL is relative to the Storage API, e.g. "/object/sign/avatars/<path>?token=..."
        var url = $"{_storageUrl}{signed.SignedURL}";
        _cache.Set(CacheKey(bucket, path), url, SignedUrlCache);
        return url;
    }

    private async Task EnsureSuccessAsync(HttpResponseMessage response, string operation, CancellationToken ct)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }
        var body = await response.Content.ReadAsStringAsync(ct);
        _logger.LogError("Supabase Storage {Operation} failed: {Status} {Body}", operation, (int)response.StatusCode, body);
        throw new HttpRequestException($"Supabase Storage {operation} failed with {(int)response.StatusCode}.");
    }

    private static string CacheKey(string bucket, string path) => $"storage-url:{bucket}/{path}";

    private sealed record SignedUrlResponse(string SignedURL);
}
