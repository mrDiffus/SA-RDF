using DiscordLoreAndCharBotDotnet.Models;

namespace DiscordLoreAndCharBotDotnet.Services.Handlers;

internal interface ISlashCommandHandler
{
    Task<string> HandleAskAsync(string userId, AskCommandInput input, CancellationToken cancellationToken);
}
