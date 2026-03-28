using DiscordLoreAndCharBotDotnet.Models;

namespace DiscordLoreAndCharBotDotnet.Services;

internal static class IntentDetector
{
    private static readonly string[] TropeKeywords =
    [
        "trope", "fantasy", "theme", "vibe", "archetype fantasy", "character fantasy"
    ];

    private static readonly string[] LevelKeywords =
    [
        "level", "level up", "build", "progression", "feat", "feature", "next level"
    ];

    public static BotIntent Detect(string question, string? requested)
    {
        if (!string.IsNullOrWhiteSpace(requested)
            && !requested.Equals("auto", StringComparison.OrdinalIgnoreCase)
            && Enum.TryParse<BotIntent>(NormalizeIntentName(requested), true, out var explicitIntent))
        {
            return explicitIntent;
        }

        var normalized = question.ToLowerInvariant();
        if (TropeKeywords.Any(normalized.Contains))
        {
            return BotIntent.Trope;
        }

        if (LevelKeywords.Any(normalized.Contains))
        {
            return BotIntent.LevelUp;
        }

        return BotIntent.Lore;
    }

    private static string NormalizeIntentName(string value)
    {
        return value.Replace("-", string.Empty).Replace("_", string.Empty);
    }
}
