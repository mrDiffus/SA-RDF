using Discord;
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

  [Theory]
  [InlineData(40060)]
  [InlineData(10062)]
  [Trait("Category", "Unit")]
  public void IsIgnorableInteractionAcknowledgementFailure_ReturnsTrueForExpectedDiscordCodes(int discordCode)
  {
    Assert.True(DiscordBotHost.IsIgnorableInteractionAcknowledgementFailure((DiscordErrorCode)discordCode));
  }

  [Theory]
  [InlineData(null)]
  [InlineData(0)]
  [InlineData(50013)]
  [Trait("Category", "Unit")]
  public void IsIgnorableInteractionAcknowledgementFailure_ReturnsFalseForOtherDiscordCodes(int? discordCode)
  {
    var errorCode = discordCode is null ? null : (DiscordErrorCode?)discordCode.Value;

    Assert.False(DiscordBotHost.IsIgnorableInteractionAcknowledgementFailure(errorCode));
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

            var host = await CreateHostAsync(tempDir, profileStore, new FakeAskAgentService("A"));

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

            var host = await CreateHostAsync(tempDir, profileStore, new FakeAskAgentService("Grounded answer"));

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

          var blockingAgent = new FakeAskAgentService(async (_, ct) =>
          {
              await Task.Delay(Timeout.Infinite, ct);
              return string.Empty;
          });

          var host = await CreateHostAsync(tempDir, profileStore, blockingAgent);
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

          var blockingAgent = new FakeAskAgentService(async (_, ct) =>
          {
              await Task.Delay(Timeout.Infinite, ct);
              return string.Empty;
          });

          var host = await CreateHostAsync(tempDir, profileStore, blockingAgent);
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

          var host = await CreateHostAsync(tempDir, profileStore, new FakeAskAgentService("unused"));

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

          var host = await CreateHostAsync(tempDir, profileStore, new FakeAskAgentService("ok"));
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

    private static Task<DiscordBotHost> CreateHostAsync(
        string tempDir,
        ProfileStore profileStore,
        IAskAgentService askAgent)
    {
        return Task.FromResult(new DiscordBotHost(
            CreateConfig(tempDir),
            profileStore,
            askAgent));
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
            DataRoot = tempDir,
            ProfileStorePath = Path.Combine(tempDir, "profiles.json"),
            PersonaPath = Path.Combine(tempDir, "persona.md")
        };
    }

    private static string CreateTempDir()
    {
        var path = Path.Combine(Path.GetTempPath(), "discord-bot-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);
        return path;
    }
}