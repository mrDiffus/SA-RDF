using DiscordLoreAndCharBotDotnet.Models;

namespace DiscordLoreAndCharBotDotnet.Services;

internal interface IAskAgentService
{
    /// <summary>Single-turn slash command question.</summary>
    Task<string> AnswerAsync(string question, CancellationToken cancellationToken);

    /// <summary>Mention reply with prior Discord thread turns as context.</summary>
    Task<string> AnswerWithHistoryAsync(
        string question,
        IEnumerable<ConversationTurn> history,
        CancellationToken cancellationToken);
}
