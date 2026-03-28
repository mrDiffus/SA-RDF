using System.Net;
using System.Text.Json;
using DiscordLoreAndCharBotDotnet.Config;
using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;
using DiscordLoreAndCharBotDotnet.Tests.Fixtures;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class DiscordBotHostSlashHandlingTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void GetAskInputValidationError_ReturnsMessageWhenQuestionMissing()
    {
        var input = new AskCommandInput(
            Question: "   ",
            IntentOverride: "auto",
            ProfileName: null,
            ProfileNotes: null,
            CurrentLevel: null,
            Archetype: null,
            Race: null,
            Trope: null);

        var error = DiscordBotHost.GetAskInputValidationError(input);

        Assert.Equal("Question is required.", error);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task BuildAskResponseAsync_ReturnsClampedGeminiAnswer()
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
            "text": "A"
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

            var response = await host.BuildAskResponseAsync(
                "user-1",
                new AskCommandInput(
                    Question: "What does canon say?",
                    IntentOverride: "lore",
                    ProfileName: null,
                    ProfileNotes: null,
                    CurrentLevel: null,
                    Archetype: null,
                    Race: null,
                    Trope: null),
                CancellationToken.None);

            Assert.Equal("A", response);
            Assert.Single(handler.Requests);

            var body = await handler.Requests[0].Content!.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            var prompt = doc.RootElement
                .GetProperty("contents")[0]
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            Assert.Contains("Question: What does canon say?", prompt, StringComparison.Ordinal);
            Assert.Contains("Intent: Lore", prompt, StringComparison.Ordinal);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task BuildAskResponseAsync_UpsertsProfileAndUsesMergedValuesInPrompt()
    {
        var tempDir = CreateTempDir();
        try
        {
            var profileStore = new ProfileStore(Path.Combine(tempDir, "profiles.json"));
            await profileStore.InitAsync();
            await profileStore.UpsertAsync(new CharacterProfile
            {
                UserId = "user-1",
                Name = "Mira",
                Notes = "pilot",
                CurrentLevel = 2,
                Archetype = "Ace",
                Race = "Human",
                Trope = "Hotshot",
                UpdatedAt = string.Empty
            });

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
            var host = await CreateHostAsync(tempDir, profileStore, httpClient, new KnowledgeBase
            {
                Chunks = [new KnowledgeChunk { SourcePath = "rules.json", Title = "Rules", Text = "Arcanist options." }]
            });

            var response = await host.BuildAskResponseAsync(
                "user-1",
                new AskCommandInput(
                    Question: "How should this build progress?",
                    IntentOverride: "level_up",
                    ProfileName: "Mira",
                    ProfileNotes: null,
                    CurrentLevel: null,
                    Archetype: "Arcanist",
                    Race: null,
                    Trope: null),
                CancellationToken.None);

            Assert.Equal("Grounded answer", response);

            var updated = await profileStore.GetAsync("user-1", "Mira");
            Assert.NotNull(updated);
            Assert.Equal("Arcanist", updated!.Archetype);
            Assert.Equal("Human", updated.Race);
            Assert.Equal(2, updated.CurrentLevel);
            Assert.Equal("pilot", updated.Notes);

            var body = await handler.Requests[0].Content!.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            var prompt = doc.RootElement
                .GetProperty("contents")[0]
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            Assert.Contains("Intent: LevelUp", prompt, StringComparison.Ordinal);
            Assert.Contains("Archetype: Arcanist", prompt, StringComparison.Ordinal);
            Assert.Contains("Race: Human", prompt, StringComparison.Ordinal);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

      [Fact]
      [Trait("Category", "Unit")]
      public async Task ProcessAskCommandAsync_ReturnsTimeoutMessageWhenGeminiCallTimesOut()
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
          host.SlashRequestTimeout = TimeSpan.FromMilliseconds(20);

          string? observedResponse = null;
          await host.ProcessAskCommandAsync(
            "user-1",
            new AskCommandInput(
              Question: "Will this timeout?",
              IntentOverride: "lore",
              ProfileName: null,
              ProfileNotes: null,
              CurrentLevel: null,
              Archetype: null,
              Race: null,
              Trope: null),
            response =>
            {
              observedResponse = response;
              return Task.CompletedTask;
            },
            CancellationToken.None);

          Assert.Equal(DiscordBotHost.SlashTimeoutMessage, observedResponse);
        }
        finally
        {
          Directory.Delete(tempDir, recursive: true);
        }
      }

      [Fact]
      [Trait("Category", "Unit")]
      public async Task ProcessAskCommandAsync_ReturnsShutdownMessageWhenCancelledByShutdownToken()
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
          host.SlashRequestTimeout = TimeSpan.FromSeconds(5);

          using var shutdownCts = new CancellationTokenSource();
          shutdownCts.Cancel();

          string? observedResponse = null;
          await host.ProcessAskCommandAsync(
            "user-1",
            new AskCommandInput(
              Question: "Will this cancel?",
              IntentOverride: "lore",
              ProfileName: null,
              ProfileNotes: null,
              CurrentLevel: null,
              Archetype: null,
              Race: null,
              Trope: null),
            response =>
            {
              observedResponse = response;
              return Task.CompletedTask;
            },
            shutdownCts.Token);

          Assert.Equal(DiscordBotHost.SlashShutdownMessage, observedResponse);
        }
        finally
        {
          Directory.Delete(tempDir, recursive: true);
        }
      }

      [Fact]
      [Trait("Category", "Unit")]
      public async Task ProcessAskCommandAsync_ReturnsUnhandledErrorMessageWhenBuildFlowThrows()
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
          await host.ProcessAskCommandAsync(
            "user-1",
            new AskCommandInput(
              Question: "   ",
              IntentOverride: "lore",
              ProfileName: null,
              ProfileNotes: null,
              CurrentLevel: null,
              Archetype: null,
              Race: null,
              Trope: null),
            response =>
            {
              observedResponse = response;
              return Task.CompletedTask;
            },
            CancellationToken.None);

          Assert.Equal(DiscordBotHost.SlashUnhandledErrorMessage, observedResponse);
        }
        finally
        {
          Directory.Delete(tempDir, recursive: true);
        }
      }

      [Fact]
      [Trait("Category", "Unit")]
      public async Task TryBeginSlashRequest_EnforcesPerUserInFlightLimit()
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
          host.MaxInFlightSlashCommandsPerUser = 2;

          Assert.True(host.TryBeginSlashRequest("user-1"));
          Assert.True(host.TryBeginSlashRequest("user-1"));
          Assert.False(host.TryBeginSlashRequest("user-1"));

          host.EndSlashRequest("user-1");

          Assert.True(host.TryBeginSlashRequest("user-1"));
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