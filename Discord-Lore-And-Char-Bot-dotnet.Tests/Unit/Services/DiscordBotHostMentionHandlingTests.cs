using DiscordLoreAndCharBotDotnet.Config;
using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;
using DiscordLoreAndCharBotDotnet.Tests.Fixtures;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class DiscordBotHostMentionHandlingTests
{
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

            var host = await CreateHostAsync(tempDir, profileStore, new FakeAskAgentService("Mention answer"));

            var response = await host.BuildMentionResponseAsync("user-1", "Tell me lore", CancellationToken.None);

            Assert.Equal("Mention answer", response);
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

            var blockingAgent = new FakeAskAgentService(async (_, ct) =>
            {
                await Task.Delay(Timeout.Infinite, ct);
                return string.Empty;
            });

            var host = await CreateHostAsync(tempDir, profileStore, blockingAgent);
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

            var blockingAgent = new FakeAskAgentService(async (_, ct) =>
            {
                await Task.Delay(Timeout.Infinite, ct);
                return string.Empty;
            });

            var host = await CreateHostAsync(tempDir, profileStore, blockingAgent);
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

            var host = await CreateHostAsync(tempDir, profileStore, new FakeAskAgentService("unused"));

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

            var host = await CreateHostAsync(tempDir, profileStore, new FakeAskAgentService("ok"));
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
