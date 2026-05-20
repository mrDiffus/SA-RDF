using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;

namespace DiscordLoreAndCharBotDotnet.Tests.Fixtures;

internal sealed class FakeAskAgentService : IAskAgentService
{
    private readonly Func<string, CancellationToken, Task<string>> _impl;

    public FakeAskAgentService(string fixedAnswer)
        : this((_, _) => Task.FromResult(fixedAnswer)) { }

    public FakeAskAgentService(Func<string, CancellationToken, Task<string>> impl)
        => _impl = impl;

    public Task<string> AnswerAsync(string question, CancellationToken cancellationToken)
        => _impl(question, cancellationToken);

    public Task<string> AnswerWithHistoryAsync(string question, IEnumerable<ConversationTurn> history, CancellationToken cancellationToken)
        => _impl(question, cancellationToken);
}
