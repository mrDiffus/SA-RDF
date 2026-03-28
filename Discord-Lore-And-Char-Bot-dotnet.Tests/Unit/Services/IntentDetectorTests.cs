using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class IntentDetectorTests
{
    [Theory]
    [InlineData("Need a build for level 2", "auto", 1)]
    [InlineData("What fantasy trope fits this character build?", "auto", 2)]
    [InlineData("Tell me about Arcech", "auto", 0)]
    [InlineData("ignored question", "level_up", 1)]
    public void Detect_ReturnsExpectedIntent(string question, string requested, int expected)
    {
        var result = IntentDetector.Detect(question, requested);

        Assert.Equal((BotIntent)expected, result);
    }
}