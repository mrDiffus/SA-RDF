namespace DiscordLoreAndCharBotDotnet.Models;

internal sealed record SlashCommandOptionValue(string Name, object? Value);

internal sealed record AskCommandInput(
    string? Question,
    string? IntentOverride,
    string? ProfileName,
    string? ProfileNotes,
    int? CurrentLevel,
    string? Archetype,
    string? Race,
    string? Trope);

internal sealed record MentionRequest(string UserId, string Content, ulong BotUserId);
