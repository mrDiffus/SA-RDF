namespace DiscordLoreAndCharBotDotnet.Services.Handlers;

internal interface ICommandRegistrar
{
    Task RegisterCommandsAsync(CancellationToken cancellationToken);
}
