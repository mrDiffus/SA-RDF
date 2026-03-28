using DiscordLoreAndCharBotDotnet.Models;

namespace DiscordLoreAndCharBotDotnet.Services.Handlers;

internal interface IMentionHandler
{
    Task<string?> HandleMentionAsync(MentionRequest request, CancellationToken cancellationToken);
}
