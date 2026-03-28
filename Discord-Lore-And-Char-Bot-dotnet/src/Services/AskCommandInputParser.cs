using DiscordLoreAndCharBotDotnet.Models;

namespace DiscordLoreAndCharBotDotnet.Services;

internal static class AskCommandInputParser
{
    public static AskCommandInput Parse(IEnumerable<SlashCommandOptionValue> options)
    {
        var optionList = options.ToList();

        return new AskCommandInput(
            GetString(optionList, "question"),
            GetString(optionList, "intent"),
            GetString(optionList, "profile_name"),
            GetString(optionList, "profile_notes"),
            GetInteger(optionList, "current_level"),
            GetString(optionList, "archetype"),
            GetString(optionList, "race"),
            GetString(optionList, "trope"));
    }

    private static string? GetString(IReadOnlyCollection<SlashCommandOptionValue> options, string name)
    {
        return options.FirstOrDefault(option => option.Name == name)?.Value?.ToString()?.Trim();
    }

    private static int? GetInteger(IReadOnlyCollection<SlashCommandOptionValue> options, string name)
    {
        var value = options.FirstOrDefault(option => option.Name == name)?.Value;
        return value is long longValue ? (int)longValue : null;
    }
}
