using System.Net;
using System.Text.Json;
using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;
using DiscordLoreAndCharBotDotnet.Tests.Fixtures;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class GeminiServiceTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public async Task ProbeAwakeAsync_ReturnsRateLimitedFor429()
    {
        var handler = new TestHttpMessageHandler((_, _) => Task.FromResult(
            TestHttpMessageHandler.JsonResponse(HttpStatusCode.TooManyRequests, """
{
  "error": {
    "message": "rate limit exceeded"
  }
}
""")));

        using var httpClient = new HttpClient(handler);
        var service = await CreateServiceAsync(httpClient);

        var result = await service.ProbeAwakeAsync(CancellationToken.None);

        Assert.Equal(StartupProbeResult.RateLimited, result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task AnswerAsync_BuildsExpectedPayloadAndReturnsText()
    {
        var handler = new TestHttpMessageHandler((_, _) => Task.FromResult(
            TestHttpMessageHandler.JsonResponse(HttpStatusCode.OK, """
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Grounded answer"
          }
        ]
      }
    }
  ]
}
""")));

        using var httpClient = new HttpClient(handler);
        var service = await CreateServiceAsync(httpClient, includeAssetRef: true);

        var answer = await service.AnswerAsync(
            new AskRequest
            {
                UserId = "user-1",
                Question = "What do the records say?",
                Intent = BotIntent.Lore,
                Profile = new CharacterProfile
                {
                    UserId = "user-1",
                    Name = "Mira",
                    Notes = "pilot",
                    CurrentLevel = 2,
                    Archetype = "Ace",
                    Race = "Human",
                    Trope = "Hotshot",
                    UpdatedAt = string.Empty
                }
            },
            [new KnowledgeChunk { SourcePath = "rules.json", Title = "Rules", Text = "Local canon." }],
            CancellationToken.None);

        Assert.Equal("Grounded answer", answer);
        Assert.Single(handler.Requests);

        var body = await handler.Requests[0].Content!.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.Equal("You are a tester persona.", root.GetProperty("system_instruction").GetProperty("parts")[0].GetProperty("text").GetString());
        Assert.True(root.TryGetProperty("tools", out var tools));
        Assert.True(tools[0].TryGetProperty("google_search", out _));

        var parts = root.GetProperty("contents")[0].GetProperty("parts");
        Assert.Equal(2, parts.GetArrayLength());
        Assert.Equal("application/json", parts[0].GetProperty("file_data").GetProperty("mime_type").GetString());
        Assert.Equal("https://example.test/file", parts[0].GetProperty("file_data").GetProperty("file_uri").GetString());
        Assert.Contains("What do the records say?", parts[1].GetProperty("text").GetString(), StringComparison.Ordinal);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task AnswerAsync_ReturnsFriendlyMessageOnServerError()
    {
        var handler = new TestHttpMessageHandler((_, _) => Task.FromResult(
            TestHttpMessageHandler.JsonResponse(HttpStatusCode.InternalServerError, """
{
  "error": {
    "message": "backend exploded"
  }
}
""")));

        using var httpClient = new HttpClient(handler);
        var service = await CreateServiceAsync(httpClient);

        var answer = await service.AnswerAsync(
            new AskRequest
            {
                UserId = "user-1",
                Question = "Hello?",
                Intent = BotIntent.Lore,
                Profile = null
            },
            [],
            CancellationToken.None);

        Assert.Equal("Sorry, I ran into an issue contacting the lore model (status 500). Please try again in a bit.", answer);
    }

    private static async Task<GeminiService> CreateServiceAsync(HttpClient httpClient, bool includeAssetRef = false)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "discord-bot-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);

        var manifestPath = Path.Combine(tempDir, "assets_manifest.json");
        var manifestJson = includeAssetRef
            ? """
{
  "Entries": [
    {
      "RelativePath": "rules.json",
      "Hash": "ABC",
      "MimeType": "application/ld+json",
      "FileUri": "https://example.test/file",
      "UploadTimestampUtc": "2026-03-28T00:00:00Z"
    }
  ]
}
"""
            : """
{
  "Entries": []
}
""";

        await File.WriteAllTextAsync(manifestPath, manifestJson);
        var manifest = await AssetManifestService.LoadOrCreateAsync(manifestPath);

        return new GeminiService(
            httpClient,
            "api-key",
            "gemini-model",
            "You are a tester persona.",
            manifest,
            enableGoogleSearchRetrieval: true);
    }
}