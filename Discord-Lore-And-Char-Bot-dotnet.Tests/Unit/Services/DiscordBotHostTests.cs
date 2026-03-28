using System.Reflection;
using System.Collections;
using Discord;
using DiscordLoreAndCharBotDotnet.Config;
using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class DiscordBotHostTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void BuildAskResponseThreadName_UsesReadablePreviewAndDeterministicSuffix()
    {
        var threadName = DiscordBotHost.BuildAskResponseThreadName(
            "How do I level a pilot ace effectively?",
            sourceMessageId: 123456789,
            sectionCount: 2);

        Assert.Equal("ask-how-do-i-level-a-pilot-ace-effectively-i3v9-p2", threadName);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildAskResponseThreadName_TruncatesToDiscordLimitAndKeepsSuffix()
    {
        var longQuestion = string.Join(' ', Enumerable.Repeat("lengthy", 40));

        var threadName = DiscordBotHost.BuildAskResponseThreadName(
            longQuestion,
            sourceMessageId: ulong.MaxValue,
            sectionCount: 12);
        var expectedSuffix = DiscordBotHost.BuildShortBase36Suffix(ulong.MaxValue, 4);

        Assert.True(threadName.Length <= 95, "Thread name should stay within Discord's 95 char limit.");
        Assert.StartsWith("ask-", threadName, StringComparison.Ordinal);
        Assert.EndsWith($"-{expectedSuffix}-p12", threadName, StringComparison.Ordinal);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildAskThreadPreview_NormalizesToAsciiSlug()
    {
        var preview = DiscordBotHost.BuildAskThreadPreview("  ???   Turbo   Build!!!   Lv 5   ");

        Assert.Equal("turbo-build-lv-5", preview);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Ctor_DoesNotThrowWhenMessageContentIntentIsDisabled()
    {
        var ex = Record.Exception(() => new DiscordBotHost(
            CreateConfig(enableMessageContentIntent: false),
            null!,
            null!,
            new KnowledgeBase { Chunks = [] }));

        Assert.Null(ex);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void Ctor_DoesNotThrowWhenMessageContentIntentIsEnabled()
    {
        var ex = Record.Exception(() => new DiscordBotHost(
            CreateConfig(enableMessageContentIntent: true),
            null!,
            null!,
            new KnowledgeBase { Chunks = [] }));

        Assert.Null(ex);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void BuildAskCommand_DefinesExpectedCoreShape()
    {
        var method = typeof(DiscordBotHost).GetMethod("BuildAskCommand", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);

        var command = Assert.IsType<SlashCommandProperties>(method!.Invoke(null, null));
        var commandName = ReadOptionalString(command, "Name");
        var options = ReadOptionalEnumerable(command, "Options")
            .Select(option => ReadOptionalString(option, "Name"))
            .ToArray();

        Assert.Equal("ask", commandName);
        Assert.Contains("question", options, StringComparer.Ordinal);
        Assert.Contains("profile_name", options, StringComparer.Ordinal);
        Assert.Contains("current_level", options, StringComparer.Ordinal);
        Assert.Contains("trope", options, StringComparer.Ordinal);
    }

    private static BotConfig CreateConfig(bool enableMessageContentIntent)
    {
        return new BotConfig
        {
            DiscordToken = "token",
            DiscordApplicationId = 1,
            DiscordGuildId = null,
            GeminiApiKey = "gem-key",
            GeminiModel = "gemini-model",
            AutoRegisterCommands = true,
            EnableMessageContentIntent = enableMessageContentIntent,
            EnableGoogleSearchRetrieval = true,
            DataRoot = "data",
            ProfileStorePath = "profiles.json",
            PersonaPath = "persona.md",
            AssetManifestPath = "assets_manifest.json"
        };
    }

    private static string ReadOptionalString(object container, string propertyName)
    {
        var rawProperty = container.GetType().GetProperty(propertyName)?.GetValue(container)
            ?? throw new InvalidOperationException($"Property {propertyName} was not found.");

        if (rawProperty is string directValue)
        {
            return directValue;
        }

        var optionalType = rawProperty.GetType();
        var isSpecifiedProperty = optionalType.GetProperty("IsSpecified");
        if (isSpecifiedProperty is not null)
        {
            var isSpecified = (bool)isSpecifiedProperty.GetValue(rawProperty)!;
            Assert.True(isSpecified);
        }

        return (string)(optionalType.GetProperty("Value")?.GetValue(rawProperty)
            ?? throw new InvalidOperationException("Optional<T> value is null."));
    }

    private static IEnumerable<object> ReadOptionalEnumerable(object container, string propertyName)
    {
        var rawProperty = container.GetType().GetProperty(propertyName)?.GetValue(container)
            ?? throw new InvalidOperationException($"Property {propertyName} was not found.");

        if (rawProperty is IEnumerable directEnumerable)
        {
            return directEnumerable.Cast<object>();
        }

        var optionalType = rawProperty.GetType();
        var isSpecifiedProperty = optionalType.GetProperty("IsSpecified");
        if (isSpecifiedProperty is not null)
        {
            var isSpecified = (bool)isSpecifiedProperty.GetValue(rawProperty)!;
            Assert.True(isSpecified);
        }

        var rawValue = optionalType.GetProperty("Value")?.GetValue(rawProperty)
            ?? throw new InvalidOperationException("Optional<T> value is null.");

        return ((IEnumerable)rawValue).Cast<object>();
    }
}