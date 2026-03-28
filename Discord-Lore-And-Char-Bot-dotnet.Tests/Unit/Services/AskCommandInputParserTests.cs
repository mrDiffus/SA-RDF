using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class AskCommandInputParserTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void Parse_ReadsExpectedFields()
    {
        var input = AskCommandInputParser.Parse(
        [
            new SlashCommandOptionValue("question", "  What is Arcech?  "),
            new SlashCommandOptionValue("intent", "lore"),
            new SlashCommandOptionValue("profile_name", " Mira "),
            new SlashCommandOptionValue("profile_notes", " ace pilot "),
            new SlashCommandOptionValue("current_level", 4L),
            new SlashCommandOptionValue("archetype", "Ace"),
            new SlashCommandOptionValue("race", "Human"),
            new SlashCommandOptionValue("trope", "Hotshot")
        ]);

        Assert.Equal("What is Arcech?", input.Question);
        Assert.Equal("lore", input.IntentOverride);
        Assert.Equal("Mira", input.ProfileName);
        Assert.Equal("ace pilot", input.ProfileNotes);
        Assert.Equal(4, input.CurrentLevel);
        Assert.Equal("Ace", input.Archetype);
        Assert.Equal("Human", input.Race);
        Assert.Equal("Hotshot", input.Trope);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Parse_ReturnsNullsForMissingFields()
    {
        var input = AskCommandInputParser.Parse([]);

        Assert.Null(input.Question);
        Assert.Null(input.IntentOverride);
        Assert.Null(input.ProfileName);
        Assert.Null(input.ProfileNotes);
        Assert.Null(input.CurrentLevel);
        Assert.Null(input.Archetype);
        Assert.Null(input.Race);
        Assert.Null(input.Trope);
    }
}
