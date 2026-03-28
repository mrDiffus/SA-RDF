using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class MentionParserTests
{
    [Theory]
    [InlineData("<@42> tell me lore", "tell me lore")]
    [InlineData("<@!42> tell me lore", "tell me lore")]
    [InlineData(" <@42>   tell me lore  ", "tell me lore")]
    public void ExtractQuestion_StripsBotMentionPrefixes(string content, string expected)
    {
        var result = MentionParser.ExtractQuestion(new MentionRequest("user-1", content, 42));

        Assert.Equal(expected, result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void ExtractQuestion_ReturnsEmptyStringWhenMentionContainsNoQuestion()
    {
        var result = MentionParser.ExtractQuestion(new MentionRequest("user-1", "<@!42>", 42));

        Assert.Equal(string.Empty, result);
    }
}
