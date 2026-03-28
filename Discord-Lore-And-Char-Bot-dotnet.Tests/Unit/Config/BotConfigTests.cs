using DiscordLoreAndCharBotDotnet.Config;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Config;

public sealed class BotConfigTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Load_ReadsRequiredValuesAndAppliesDefaults()
    {
        var tempDir = CreateTempDir();
        var originalDirectory = Directory.GetCurrentDirectory();
        var originalEnvironment = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");

        try
        {
            File.WriteAllText(Path.Combine(tempDir, "appsettings.json"), """
{
  "Bot": {
    "DiscordToken": "token",
    "DiscordApplicationId": "12345",
    "GeminiApiKey": "gem-key"
  }
}
""");

            Environment.SetEnvironmentVariable("DOTNET_ENVIRONMENT", null);
            Directory.SetCurrentDirectory(tempDir);

            var config = BotConfig.Load(tempDir);

            Assert.Equal("token", config.DiscordToken);
            Assert.Equal((ulong)12345, config.DiscordApplicationId);
            Assert.Equal("gem-key", config.GeminiApiKey);
            Assert.Equal("gemini-2.5-flash", config.GeminiModel);
            Assert.True(config.AutoRegisterCommands);
            Assert.False(config.EnableMessageContentIntent);
            Assert.True(config.EnableGoogleSearchRetrieval);
            Assert.Equal(Path.GetFullPath(Path.Combine(tempDir, "../public/data")), config.DataRoot);
            Assert.Equal(Path.GetFullPath(Path.Combine(tempDir, "./storage/profiles.json")), config.ProfileStorePath);
        }
        finally
        {
            Directory.SetCurrentDirectory(originalDirectory);
            Environment.SetEnvironmentVariable("DOTNET_ENVIRONMENT", originalEnvironment);
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Load_ThrowsWhenRequiredConfigIsMissing()
    {
        var tempDir = CreateTempDir();
        var originalDirectory = Directory.GetCurrentDirectory();
        var originalEnvironment = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT");

        try
        {
            File.WriteAllText(Path.Combine(tempDir, "appsettings.json"), "{\n  \"Bot\": {}\n}");
            Environment.SetEnvironmentVariable("DOTNET_ENVIRONMENT", null);
            Directory.SetCurrentDirectory(tempDir);

            var ex = Assert.Throws<InvalidOperationException>(() => BotConfig.Load(tempDir));

            Assert.Contains("Bot:DiscordToken", ex.Message, StringComparison.Ordinal);
        }
        finally
        {
            Directory.SetCurrentDirectory(originalDirectory);
            Environment.SetEnvironmentVariable("DOTNET_ENVIRONMENT", originalEnvironment);
            Directory.Delete(tempDir, recursive: true);
        }
    }

    private static string CreateTempDir()
    {
        var path = Path.Combine(Path.GetTempPath(), "discord-bot-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);
        return path;
    }
}