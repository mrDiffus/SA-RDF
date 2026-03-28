using DiscordLoreAndCharBotDotnet.Models;

namespace DiscordLoreAndCharBotDotnet.Services;

internal static class MentionParser
{
    public static string ExtractQuestion(MentionRequest request)
    {
        return request.Content
            .Replace($"<@{request.BotUserId}>", string.Empty, StringComparison.Ordinal)
            .Replace($"<@!{request.BotUserId}>", string.Empty, StringComparison.Ordinal)
            .Trim();
    }
}
