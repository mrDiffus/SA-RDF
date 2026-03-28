using Microsoft.Extensions.Configuration;

namespace DiscordLoreAndCharBotDotnet.Config;

internal sealed class BotConfig
{
    public required string DiscordToken { get; init; }
    public required ulong DiscordApplicationId { get; init; }
    public ulong? DiscordGuildId { get; init; }
    public required string GeminiApiKey { get; init; }
    public required string GeminiModel { get; init; }
    public required bool AutoRegisterCommands { get; init; }
    public required bool EnableMessageContentIntent { get; init; }
    public required bool EnableGoogleSearchRetrieval { get; init; }
    public required string DataRoot { get; init; }
    public required string ProfileStorePath { get; init; }
    public required string PersonaPath { get; init; }
    public required string AssetManifestPath { get; init; }

    public static BotConfig Load(string baseDirectory)
    {
        var contentRoot = Directory.GetCurrentDirectory();
        var builder = new ConfigurationBuilder()
            .SetBasePath(contentRoot)
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
            .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Production"}.json", optional: true, reloadOnChange: false)
            .AddEnvironmentVariables();

        // Fallback when running from output folder instead of project root.
        if (File.Exists(Path.Combine(baseDirectory, "appsettings.json"))
            && !File.Exists(Path.Combine(contentRoot, "appsettings.json")))
        {
            builder.SetBasePath(baseDirectory);
        }

        var configuration = builder.Build();

        return new BotConfig
        {
            DiscordToken = Required(configuration, "Bot:DiscordToken"),
            DiscordApplicationId = ParseSnowflakeRequired(configuration, "Bot:DiscordApplicationId"),
            DiscordGuildId = ParseSnowflakeOptional(configuration["Bot:DiscordGuildId"]),
            GeminiApiKey = Required(configuration, "Bot:GeminiApiKey"),
            GeminiModel = Optional(configuration, "Bot:GeminiModel", "gemini-2.5-flash"),
            AutoRegisterCommands = ParseBoolOptional(configuration, "Bot:AutoRegisterCommands", true),
            EnableMessageContentIntent = ParseBoolOptional(configuration, "Bot:EnableMessageContentIntent", false),
            EnableGoogleSearchRetrieval = ParseBoolOptional(configuration, "Bot:EnableGoogleSearchRetrieval", true),
            DataRoot = ResolvePath(contentRoot, Optional(configuration, "Bot:DataRoot", "../public/data")),
            ProfileStorePath = ResolvePath(contentRoot, Optional(configuration, "Bot:ProfileStorePath", "./storage/profiles.json")),
            PersonaPath = ResolvePath(contentRoot, Optional(configuration, "Bot:PersonaPath", "./persona.md")),
            AssetManifestPath = ResolvePath(contentRoot, Optional(configuration, "Bot:AssetManifestPath", "./assets_manifest.json"))
        };
    }

    private static string Required(IConfiguration configuration, string key)
    {
        var value = configuration[key]?.Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"Missing required configuration: {key}");
        }

        return value;
    }

    private static string Optional(IConfiguration configuration, string key, string defaultValue)
    {
        var value = configuration[key]?.Trim();
        return string.IsNullOrWhiteSpace(value) ? defaultValue : value;
    }

    private static bool ParseBoolOptional(IConfiguration configuration, string key, bool defaultValue)
    {
        var value = configuration[key]?.Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return defaultValue;
        }

        return value.Equals("1", StringComparison.OrdinalIgnoreCase)
            || value.Equals("true", StringComparison.OrdinalIgnoreCase)
            || value.Equals("yes", StringComparison.OrdinalIgnoreCase)
            || value.Equals("on", StringComparison.OrdinalIgnoreCase);
    }

    private static ulong ParseSnowflakeRequired(IConfiguration configuration, string key)
    {
        var value = Required(configuration, key);
        if (!ulong.TryParse(value, out var snowflake))
        {
            throw new InvalidOperationException($"Configuration {key} must be a numeric Discord snowflake.");
        }

        return snowflake;
    }

    private static ulong? ParseSnowflakeOptional(string? value)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            return null;
        }

        return ulong.TryParse(trimmed, out var snowflake) ? snowflake : null;
    }

    private static string ResolvePath(string baseDirectory, string input)
    {
        return Path.GetFullPath(Path.Combine(baseDirectory, input));
    }
}
