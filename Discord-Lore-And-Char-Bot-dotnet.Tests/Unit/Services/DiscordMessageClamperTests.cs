using DiscordLoreAndCharBotDotnet.Services;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class DiscordMessageClamperTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Clamp_ReturnsOriginalTextWhenUnderLimit()
    {
        var result = DiscordMessageClamper.Clamp("hello world");

        Assert.Equal("hello world", result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Clamp_TruncatesAndAppendsEllipsisWhenOverLimit()
    {
        var text = new string('x', DiscordMessageClamper.DefaultLimit + 5);

        var result = DiscordMessageClamper.Clamp(text);

        Assert.Equal(DiscordMessageClamper.DefaultLimit, result.Length);
        Assert.EndsWith("...", result, StringComparison.Ordinal);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Clamp_UsesCustomLimitWhenProvided()
    {
        var text = new string('x', 20);

        var result = DiscordMessageClamper.Clamp(text, 10);

        Assert.Equal(10, result.Length);
        Assert.EndsWith("...", result, StringComparison.Ordinal);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void SplitIntoSections_ReturnsSingleSectionWhenUnderLimit()
    {
        var sections = DiscordMessageClamper.SplitIntoSections("hello world", 20);

        var section = Assert.Single(sections);
        Assert.Equal("hello world", section);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void SplitIntoSections_SplitsAtNaturalBoundariesWhenPossible()
    {
        var text = string.Join("\n\n", Enumerable.Repeat("abcd efgh ijkl", 8));

        var sections = DiscordMessageClamper.SplitIntoSections(text, 30);

        Assert.True(sections.Count > 1);
        Assert.All(sections, section => Assert.True(section.Length <= 30));
        Assert.Equal(text, string.Concat(sections));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void SplitIntoSections_UsesHardSplitWhenNoNaturalBoundaryExists()
    {
        var text = new string('x', 37);

        var sections = DiscordMessageClamper.SplitIntoSections(text, 10);

        Assert.Equal(4, sections.Count);
        Assert.All(sections, section => Assert.True(section.Length <= 10));
        Assert.Equal(text, string.Concat(sections));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void NormalizeLinksForDiscord_UnwrapsMarkdownAutolinksAndNormalizesHost()
    {
        const string input = "Arcanist: [https://stellar-arcana.org/archetype/Arcanist](https://stellararcana.org/archetype/Arcanist)";

        var result = DiscordMessageClamper.NormalizeLinksForDiscord(input);

        Assert.Equal("Arcanist: https://stellar-arcana.org/archetype/Arcanist", result);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void NormalizeLinksForDiscord_ConvertsLabeledMarkdownLinksToClickableFormat()
    {
        const string input = "Evidence: [Arcanist page](https://stellararcana.org/archetype/Arcanist)";

        var result = DiscordMessageClamper.NormalizeLinksForDiscord(input);

        Assert.Equal("Evidence: Arcanist page: https://stellar-arcana.org/archetype/Arcanist", result);
    }
}
