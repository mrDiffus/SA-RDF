using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DiscordLoreAndCharBotDotnet.Services;
using DiscordLoreAndCharBotDotnet.Tests.Fixtures;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class AssetManifestServiceTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public async Task SyncWithGeminiAsync_SkipsUploadWhenFreshEntryMatchesHash()
    {
        var tempDir = CreateTempDir();
        try
        {
            var dataRoot = Path.Combine(tempDir, "data");
            Directory.CreateDirectory(dataRoot);

            var filePath = Path.Combine(dataRoot, "rules.json");
            const string content = "{\"name\":\"Rules\"}";
            await File.WriteAllTextAsync(filePath, content);

            var manifestPath = Path.Combine(tempDir, "assets_manifest.json");
            await File.WriteAllTextAsync(manifestPath, $$"""
{
  "Entries": [
    {
      "RelativePath": "rules.json",
      "Hash": "{{ComputeHash(content)}}",
      "MimeType": "application/ld+json",
      "FileUri": "https://example.test/existing",
      "UploadTimestampUtc": "{{DateTimeOffset.UtcNow.ToString("O")}}"
    }
  ]
}
""");

            var service = await AssetManifestService.LoadOrCreateAsync(manifestPath);
            var handler = new TestHttpMessageHandler((_, _) => throw new InvalidOperationException("Upload should not occur for fresh cache hits."));
            using var httpClient = new HttpClient(handler);

            await service.SyncWithGeminiAsync(httpClient, "api-key", dataRoot, CancellationToken.None);

            Assert.Empty(handler.Requests);
            var fileRefs = service.FileRefs;
            Assert.Single(fileRefs);
            Assert.Equal("https://example.test/existing", fileRefs[0].FileUri);
            Assert.Equal("application/json", fileRefs[0].MimeType);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task SyncWithGeminiAsync_UploadsSupportedFilesAndNormalizesMimeType()
    {
        var tempDir = CreateTempDir();
        try
        {
            var dataRoot = Path.Combine(tempDir, "data");
            Directory.CreateDirectory(dataRoot);
            await File.WriteAllTextAsync(Path.Combine(dataRoot, "rules.jsonld"), "{\"name\":\"Rules\"}");

            var manifestPath = Path.Combine(tempDir, "assets_manifest.json");
            var service = await AssetManifestService.LoadOrCreateAsync(manifestPath);

            var handler = new TestHttpMessageHandler((request, _) => Task.FromResult(HandleUploadRequest(request)));
            using var httpClient = new HttpClient(handler);

            await service.SyncWithGeminiAsync(httpClient, "api-key", dataRoot, CancellationToken.None);

            Assert.Equal(2, handler.Requests.Count);
            Assert.Equal("application/json", handler.Requests[0].Headers.GetValues("X-Goog-Upload-Header-Content-Type").Single());

            var fileRefs = service.FileRefs;
            Assert.Single(fileRefs);
            Assert.Equal("https://example.test/uploaded", fileRefs[0].FileUri);
            Assert.Equal("application/json", fileRefs[0].MimeType);

            using var manifestDoc = JsonDocument.Parse(await File.ReadAllTextAsync(manifestPath));
            var entry = manifestDoc.RootElement.GetProperty("Entries")[0];
            Assert.Equal("rules.jsonld", entry.GetProperty("RelativePath").GetString());
            Assert.Equal("application/ld+json", entry.GetProperty("MimeType").GetString());
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task SyncWithGeminiAsync_RemovesStaleEntries()
    {
        var tempDir = CreateTempDir();
        try
        {
            var dataRoot = Path.Combine(tempDir, "data");
            Directory.CreateDirectory(dataRoot);

            var manifestPath = Path.Combine(tempDir, "assets_manifest.json");
            await File.WriteAllTextAsync(manifestPath, """
{
  "Entries": [
    {
      "RelativePath": "obsolete.json",
      "Hash": "ABC",
      "MimeType": "application/json",
      "FileUri": "https://example.test/obsolete",
      "UploadTimestampUtc": "2026-03-28T00:00:00Z"
    }
  ]
}
""");

            var service = await AssetManifestService.LoadOrCreateAsync(manifestPath);
            var handler = new TestHttpMessageHandler((_, _) => throw new InvalidOperationException("No upload expected when removing stale entries only."));
            using var httpClient = new HttpClient(handler);

            await service.SyncWithGeminiAsync(httpClient, "api-key", dataRoot, CancellationToken.None);

            Assert.Empty(service.FileRefs);
            using var manifestDoc = JsonDocument.Parse(await File.ReadAllTextAsync(manifestPath));
            Assert.Empty(manifestDoc.RootElement.GetProperty("Entries").EnumerateArray());
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task SyncWithGeminiAsync_ThrowsWhenUploadStartFails()
    {
        var tempDir = CreateTempDir();
        try
        {
            var dataRoot = Path.Combine(tempDir, "data");
            Directory.CreateDirectory(dataRoot);
            await File.WriteAllTextAsync(Path.Combine(dataRoot, "rules.csv"), "name,value");

            var manifestPath = Path.Combine(tempDir, "assets_manifest.json");
            var service = await AssetManifestService.LoadOrCreateAsync(manifestPath);

            var handler = new TestHttpMessageHandler((_, _) => Task.FromResult(
                TestHttpMessageHandler.JsonResponse(HttpStatusCode.BadRequest, "bad upload start")));
            using var httpClient = new HttpClient(handler);

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                service.SyncWithGeminiAsync(httpClient, "api-key", dataRoot, CancellationToken.None));

            Assert.Contains("Failed to start Gemini file upload", ex.Message, StringComparison.Ordinal);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    private static HttpResponseMessage HandleUploadRequest(HttpRequestMessage request)
    {
        if (request.Headers.TryGetValues("X-Goog-Upload-Command", out var commands)
            && commands.Single() == "start")
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK);
            response.Headers.Add("X-Goog-Upload-Url", "https://example.test/upload-session");
            return response;
        }

        return TestHttpMessageHandler.JsonResponse(HttpStatusCode.OK, """
{
  "file": {
    "uri": "https://example.test/uploaded",
    "mimeType": "application/ld+json"
  }
}
""");
    }

    private static string CreateTempDir()
    {
        var path = Path.Combine(Path.GetTempPath(), "discord-bot-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);
        return path;
    }

    private static string ComputeHash(string content)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(content)));
    }
}