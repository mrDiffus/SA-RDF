using System.Net;
using DiscordLoreAndCharBotDotnet.Config;
using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;
using DiscordLoreAndCharBotDotnet.Tests.Fixtures;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class DiscordBotHostMentionHandlingTests
{
  [Fact]
  [Trait("Category", "Unit")]
  public void BuildMentionQuestionWithThreadContext_ReturnsQuestionWhenContextMissing()
  {
    var result = DiscordBotHost.BuildMentionQuestionWithThreadContext("What now?", null);

    Assert.Equal("What now?", result);
  }

  [Fact]
  [Trait("Category", "Unit")]
  public void BuildMentionQuestionWithThreadContext_AppendsThreadTranscript()
  {
    var result = DiscordBotHost.BuildMentionQuestionWithThreadContext(
      "What now?",
      "[alice] setup complete\n[bot] Part 2/3");

    Assert.Contains("What now?", result, StringComparison.Ordinal);
    Assert.Contains("Thread context so far", result, StringComparison.Ordinal);
    Assert.Contains("--- THREAD_CONTEXT_START ---", result, StringComparison.Ordinal);
    Assert.Contains("[alice] setup complete", result, StringComparison.Ordinal);
    Assert.Contains("[bot] Part 2/3", result, StringComparison.Ordinal);
    Assert.Contains("--- THREAD_CONTEXT_END ---", result, StringComparison.Ordinal);
  }

  [Theory]
  [InlineData("ask-user-0328-1530-p2")]
  [InlineData("ASK-user-name-0328-1530-p12")]
  [Trait("Category", "Unit")]
  public void IsAskResponseThreadName_ReturnsTrueForAskThreadNames(string threadName)
  {
    Assert.True(DiscordBotHost.IsAskResponseThreadName(threadName));
  }

  [Theory]
  [InlineData(null)]
  [InlineData("")]
  [InlineData("general-chat")]
  [InlineData("ask-user-0328-1530")]
  [InlineData("ask-user-0328-1530-p1")]
  [InlineData("ask-user-0328-1530-px")]
  [Trait("Category", "Unit")]
  public void IsAskResponseThreadName_ReturnsFalseForNonAskThreadNames(string? threadName)
  {
    Assert.False(DiscordBotHost.IsAskResponseThreadName(threadName));
  }

    [Fact]
    [Trait("Category", "Unit")]
    public void GetMentionValidationError_ReturnsMessageWhenQuestionMissing()
    {
        var error = DiscordBotHost.GetMentionValidationError("   ");

        Assert.Equal("Question is required.", error);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task BuildMentionResponseAsync_ReturnsClampedGeminiAnswer()
    {
        var tempDir = CreateTempDir();
        try
        {
            var profileStore = new ProfileStore(Path.Combine(tempDir, "profiles.json"));
            await profileStore.InitAsync();

            var handler = new TestHttpMessageHandler((_, _) => Task.FromResult(
                TestHttpMessageHandler.JsonResponse(HttpStatusCode.OK, """
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Mention answer"
          }
        ]
      }
    }
  ]
}
""")));

            using var httpClient = new HttpClient(handler);
            var host = await CreateHostAsync(tempDir, profileStore, httpClient, new KnowledgeBase
            {
                Chunks = [new KnowledgeChunk { SourcePath = "rules.json", Title = "Rules", Text = "Local canon mention context." }]
            });

            var response = await host.BuildMentionResponseAsync("user-1", "Tell me lore", CancellationToken.None);

            Assert.Equal("Mention answer", response);
            Assert.Single(handler.Requests);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task ProcessMentionRequestAsync_ReturnsTimeoutMessageWhenGeminiCallTimesOut()
    {
        var tempDir = CreateTempDir();
        try
        {
            var profileStore = new ProfileStore(Path.Combine(tempDir, "profiles.json"));
            await profileStore.InitAsync();

            var handler = new TestHttpMessageHandler((_, cancellationToken) =>
            {
                var tcs = new TaskCompletionSource<HttpResponseMessage>(TaskCreationOptions.RunContinuationsAsynchronously);
                cancellationToken.Register(() => tcs.TrySetCanceled(cancellationToken));
                return tcs.Task;
            });

            using var httpClient = new HttpClient(handler);
            var host = await CreateHostAsync(tempDir, profileStore, httpClient, new KnowledgeBase
            {
                Chunks = [new KnowledgeChunk { SourcePath = "rules.json", Title = "Rules", Text = "Local canon." }]
            });
            host.MentionRequestTimeout = TimeSpan.FromMilliseconds(20);

            string? observedResponse = null;
            await host.ProcessMentionRequestAsync(
                "user-1",
                "Will this timeout?",
                response =>
                {
                    observedResponse = response;
                    return Task.CompletedTask;
                },
                CancellationToken.None);

            Assert.Equal(DiscordBotHost.MentionTimeoutMessage, observedResponse);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task ProcessMentionRequestAsync_ReturnsShutdownMessageWhenCancelledByShutdownToken()
    {
        var tempDir = CreateTempDir();
        try
        {
            var profileStore = new ProfileStore(Path.Combine(tempDir, "profiles.json"));
            await profileStore.InitAsync();

            var handler = new TestHttpMessageHandler((_, cancellationToken) =>
            {
                var tcs = new TaskCompletionSource<HttpResponseMessage>(TaskCreationOptions.RunContinuationsAsynchronously);
                cancellationToken.Register(() => tcs.TrySetCanceled(cancellationToken));
                return tcs.Task;
            });

            using var httpClient = new HttpClient(handler);
            var host = await CreateHostAsync(tempDir, profileStore, httpClient, new KnowledgeBase
            {
                Chunks = [new KnowledgeChunk { SourcePath = "rules.json", Title = "Rules", Text = "Local canon." }]
            });
            host.MentionRequestTimeout = TimeSpan.FromSeconds(5);

            using var shutdownCts = new CancellationTokenSource();
            shutdownCts.Cancel();

            string? observedResponse = null;
            await host.ProcessMentionRequestAsync(
                "user-1",
                "Will this cancel?",
                response =>
                {
                    observedResponse = response;
                    return Task.CompletedTask;
                },
                shutdownCts.Token);

            Assert.Equal(DiscordBotHost.MentionShutdownMessage, observedResponse);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task ProcessMentionRequestAsync_ReturnsUnhandledErrorMessageWhenBuildFlowThrows()
    {
        var tempDir = CreateTempDir();
        try
        {
            var profileStore = new ProfileStore(Path.Combine(tempDir, "profiles.json"));
            await profileStore.InitAsync();

            var handler = new TestHttpMessageHandler((_, _) => Task.FromResult(
                TestHttpMessageHandler.JsonResponse(HttpStatusCode.OK, """
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "unused"
          }
        ]
      }
    }
  ]
}
""")));

            using var httpClient = new HttpClient(handler);
            var host = await CreateHostAsync(tempDir, profileStore, httpClient, new KnowledgeBase
            {
                Chunks = [new KnowledgeChunk { SourcePath = "rules.json", Title = "Rules", Text = "Local canon." }]
            });

            string? observedResponse = null;
            await host.ProcessMentionRequestAsync(
                "user-1",
                "   ",
                response =>
                {
                    observedResponse = response;
                    return Task.CompletedTask;
                },
                CancellationToken.None);

            Assert.Equal(DiscordBotHost.MentionUnhandledErrorMessage, observedResponse);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task TryBeginMentionRequest_EnforcesPerUserInFlightLimit()
    {
        var tempDir = CreateTempDir();
        try
        {
            var profileStore = new ProfileStore(Path.Combine(tempDir, "profiles.json"));
            await profileStore.InitAsync();

            var handler = new TestHttpMessageHandler((_, _) => Task.FromResult(
                TestHttpMessageHandler.JsonResponse(HttpStatusCode.OK, """
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "ok"
          }
        ]
      }
    }
  ]
}
""")));

            using var httpClient = new HttpClient(handler);
            var host = await CreateHostAsync(tempDir, profileStore, httpClient, new KnowledgeBase { Chunks = [] });
            host.MaxInFlightMentionRequestsPerUser = 2;

            Assert.True(host.TryBeginMentionRequest("user-1"));
            Assert.True(host.TryBeginMentionRequest("user-1"));
            Assert.False(host.TryBeginMentionRequest("user-1"));

            host.EndMentionRequest("user-1");

            Assert.True(host.TryBeginMentionRequest("user-1"));
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    private static async Task<DiscordBotHost> CreateHostAsync(
        string tempDir,
        ProfileStore profileStore,
        HttpClient httpClient,
        KnowledgeBase knowledgeBase)
    {
        var manifestPath = Path.Combine(tempDir, "assets_manifest.json");
        await File.WriteAllTextAsync(manifestPath, """
{
  "Entries": []
}
""");

        var manifest = await AssetManifestService.LoadOrCreateAsync(manifestPath);
        var gemini = new GeminiService(
            httpClient,
            "api-key",
            "gemini-model",
            "You are a tester persona.",
            manifest,
            enableGoogleSearchRetrieval: true);

        return new DiscordBotHost(
            CreateConfig(tempDir),
            profileStore,
            gemini,
            knowledgeBase);
    }

    private static BotConfig CreateConfig(string tempDir)
    {
        return new BotConfig
        {
            DiscordToken = "token",
            DiscordApplicationId = 1,
            DiscordGuildId = null,
            GeminiApiKey = "gem-key",
            GeminiModel = "gemini-model",
            AutoRegisterCommands = true,
            EnableMessageContentIntent = false,
            EnableGoogleSearchRetrieval = true,
            DataRoot = tempDir,
            ProfileStorePath = Path.Combine(tempDir, "profiles.json"),
            PersonaPath = Path.Combine(tempDir, "persona.md"),
            AssetManifestPath = Path.Combine(tempDir, "assets_manifest.json")
        };
    }

    private static string CreateTempDir()
    {
        var path = Path.Combine(Path.GetTempPath(), "discord-bot-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);
        return path;
    }
}
