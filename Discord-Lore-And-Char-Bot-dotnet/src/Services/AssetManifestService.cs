using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net.Http.Json;

namespace DiscordLoreAndCharBotDotnet.Services;

internal sealed class AssetManifestService
{
    private static readonly string[] SupportedExtensions = [".jsonld", ".json", ".ttl", ".csv"];
    private static readonly TimeSpan RefreshWindow = TimeSpan.FromHours(44);

    private readonly string _manifestPath;
    private readonly Dictionary<string, AssetManifestEntry> _entries;

    private AssetManifestService(string manifestPath, Dictionary<string, AssetManifestEntry> entries)
    {
        _manifestPath = manifestPath;
        _entries = entries;
    }

    public IReadOnlyList<GeminiFileRef> FileRefs => _entries.Values
        .Where(entry => !string.IsNullOrWhiteSpace(entry.FileUri) && !string.IsNullOrWhiteSpace(entry.MimeType))
        .Select(entry => new GeminiFileRef(entry.FileUri!, NormalizeMimeType(entry.MimeType!)))
        .ToArray();

    public static async Task<AssetManifestService> LoadOrCreateAsync(string manifestPath)
    {
        var dir = Path.GetDirectoryName(manifestPath);
        if (!string.IsNullOrWhiteSpace(dir))
        {
            Directory.CreateDirectory(dir);
        }

        if (!File.Exists(manifestPath))
        {
            var empty = new AssetManifestFile();
            var rawEmpty = JsonSerializer.Serialize(empty, JsonOptions());
            await File.WriteAllTextAsync(manifestPath, rawEmpty);
            return new AssetManifestService(manifestPath, []);
        }

        try
        {
            var raw = await File.ReadAllTextAsync(manifestPath);
            var file = JsonSerializer.Deserialize<AssetManifestFile>(raw) ?? new AssetManifestFile();
            var map = file.Entries.ToDictionary(entry => entry.RelativePath, StringComparer.OrdinalIgnoreCase);
            return new AssetManifestService(manifestPath, map);
        }
        catch
        {
            return new AssetManifestService(manifestPath, []);
        }
    }

    public async Task SyncWithGeminiAsync(HttpClient httpClient, string apiKey, string dataRoot, CancellationToken cancellationToken)
    {
        var candidates = Directory.EnumerateFiles(dataRoot, "*.*", SearchOption.AllDirectories)
            .Where(path => SupportedExtensions.Contains(Path.GetExtension(path), StringComparer.OrdinalIgnoreCase))
            .ToArray();

        var activeKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var path in candidates)
        {
            var relativePath = Path.GetRelativePath(dataRoot, path).Replace('\\', '/');
            activeKeys.Add(relativePath);

            var hash = await ComputeSha256Async(path, cancellationToken);
            if (_entries.TryGetValue(relativePath, out var existing)
                && existing.Hash.Equals(hash, StringComparison.OrdinalIgnoreCase)
                && existing.UploadTimestampUtc is not null
                && DateTimeOffset.UtcNow - existing.UploadTimestampUtc.Value < RefreshWindow
                && !string.IsNullOrWhiteSpace(existing.FileUri))
            {
                continue;
            }

            var uploaded = await UploadFileAsync(httpClient, apiKey, path, cancellationToken);
            _entries[relativePath] = new AssetManifestEntry
            {
                RelativePath = relativePath,
                Hash = hash,
                MimeType = uploaded.MimeType,
                FileUri = uploaded.FileUri,
                UploadTimestampUtc = DateTimeOffset.UtcNow
            };

            await SaveAsync(cancellationToken);
        }

        var stale = _entries.Keys.Where(key => !activeKeys.Contains(key)).ToArray();
        foreach (var key in stale)
        {
            _entries.Remove(key);
        }

        if (stale.Length > 0)
        {
            await SaveAsync(cancellationToken);
        }
    }

    private async Task SaveAsync(CancellationToken cancellationToken)
    {
        var payload = new AssetManifestFile
        {
            Entries = _entries.Values.OrderBy(v => v.RelativePath, StringComparer.OrdinalIgnoreCase).ToList()
        };

        var raw = JsonSerializer.Serialize(payload, JsonOptions());
        await File.WriteAllTextAsync(_manifestPath, raw, cancellationToken);
    }

    private static JsonSerializerOptions JsonOptions() => new() { WriteIndented = true };

    private static async Task<string> ComputeSha256Async(string path, CancellationToken cancellationToken)
    {
        await using var stream = File.OpenRead(path);
        var hash = await SHA256.HashDataAsync(stream, cancellationToken);
        return Convert.ToHexString(hash);
    }

    private static string GuessMimeType(string path)
    {
        return Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".jsonld" => "application/json",
            ".json" => "application/json",
            ".ttl" => "text/turtle",
            ".csv" => "text/csv",
            _ => "application/octet-stream"
        };
    }

    private static string NormalizeMimeType(string mimeType)
    {
        return mimeType.Equals("application/ld+json", StringComparison.OrdinalIgnoreCase)
            ? "application/json"
            : mimeType;
    }

    private static async Task<GeminiFileRef> UploadFileAsync(HttpClient httpClient, string apiKey, string path, CancellationToken cancellationToken)
    {
        var fileBytes = await File.ReadAllBytesAsync(path, cancellationToken);
        var mimeType = GuessMimeType(path);
        var displayName = Path.GetFileName(path);

        var startUrl = $"https://generativelanguage.googleapis.com/upload/v1beta/files?key={Uri.EscapeDataString(apiKey)}";
        using var startRequest = new HttpRequestMessage(HttpMethod.Post, startUrl)
        {
            Content = JsonContent.Create(new { file = new { display_name = displayName } })
        };
        startRequest.Headers.Add("X-Goog-Upload-Protocol", "resumable");
        startRequest.Headers.Add("X-Goog-Upload-Command", "start");
        startRequest.Headers.Add("X-Goog-Upload-Header-Content-Length", fileBytes.Length.ToString());
        startRequest.Headers.Add("X-Goog-Upload-Header-Content-Type", mimeType);

        using var startResponse = await httpClient.SendAsync(startRequest, cancellationToken);
        var uploadUrl = startResponse.Headers.TryGetValues("X-Goog-Upload-Url", out var values)
            ? values.FirstOrDefault()
            : null;

        if (!startResponse.IsSuccessStatusCode || string.IsNullOrWhiteSpace(uploadUrl))
        {
            var detail = await startResponse.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"Failed to start Gemini file upload for {displayName}: {(int)startResponse.StatusCode} {detail}");
        }

        using var uploadRequest = new HttpRequestMessage(HttpMethod.Post, uploadUrl)
        {
            Content = new ByteArrayContent(fileBytes)
        };
        uploadRequest.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mimeType);
        uploadRequest.Headers.Add("X-Goog-Upload-Offset", "0");
        uploadRequest.Headers.Add("X-Goog-Upload-Command", "upload, finalize");

        using var uploadResponse = await httpClient.SendAsync(uploadRequest, cancellationToken);
        var uploadRaw = await uploadResponse.Content.ReadAsStringAsync(cancellationToken);
        if (!uploadResponse.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Failed to upload Gemini file {displayName}: {(int)uploadResponse.StatusCode} {uploadRaw}");
        }

        using var doc = JsonDocument.Parse(uploadRaw);
        var file = doc.RootElement.GetProperty("file");
        var fileUri = file.GetProperty("uri").GetString();
        var resolvedMimeType = file.TryGetProperty("mimeType", out var mimeNode) ? mimeNode.GetString() : mimeType;

        if (string.IsNullOrWhiteSpace(fileUri) || string.IsNullOrWhiteSpace(resolvedMimeType))
        {
            throw new InvalidOperationException($"Gemini upload response missing file uri or mimeType for {displayName}.");
        }

        return new GeminiFileRef(fileUri, resolvedMimeType);
    }

    private sealed class AssetManifestFile
    {
        public List<AssetManifestEntry> Entries { get; set; } = [];
    }

    private sealed class AssetManifestEntry
    {
        public required string RelativePath { get; set; }
        public required string Hash { get; set; }
        public string? MimeType { get; set; }
        public string? FileUri { get; set; }
        public DateTimeOffset? UploadTimestampUtc { get; set; }
    }
}

internal readonly record struct GeminiFileRef(string FileUri, string MimeType);
