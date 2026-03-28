using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class ProfileStoreTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public async Task UpsertAsync_PersistsAndRetrievesProfile()
    {
        var tempDir = CreateTempDir();
        try
        {
            var store = new ProfileStore(Path.Combine(tempDir, "profiles.json"));
            await store.InitAsync();

            await store.UpsertAsync(new CharacterProfile
            {
                UserId = "user-1",
                Name = "Mira",
                Notes = "pilot",
                CurrentLevel = 2,
                Archetype = "Ace",
                Race = "Human",
                Trope = "Hotshot",
                UpdatedAt = string.Empty
            });

            var profile = await store.GetAsync("user-1", "mira");

            Assert.NotNull(profile);
            Assert.Equal("Ace", profile!.Archetype);
            Assert.Equal("Hotshot", profile.Trope);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task UpsertAsync_PreservesExistingFieldsWhenInputOmitsThem()
    {
        var tempDir = CreateTempDir();
        try
        {
            var store = new ProfileStore(Path.Combine(tempDir, "profiles.json"));
            await store.InitAsync();

            await store.UpsertAsync(new CharacterProfile
            {
                UserId = "user-1",
                Name = "Mira",
                Notes = "pilot",
                CurrentLevel = 2,
                Archetype = "Ace",
                Race = "Human",
                Trope = "Hotshot",
                UpdatedAt = string.Empty
            });

            var updated = await store.UpsertAsync(new CharacterProfile
            {
                UserId = "user-1",
                Name = "Mira",
                Notes = null,
                CurrentLevel = null,
                Archetype = "Arcanist",
                Race = null,
                Trope = null,
                UpdatedAt = string.Empty
            });

            Assert.Equal("Arcanist", updated.Archetype);
            Assert.Equal("Human", updated.Race);
            Assert.Equal(2, updated.CurrentLevel);
            Assert.Equal("pilot", updated.Notes);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    private static string CreateTempDir()
    {
        var path = Path.Combine(Path.GetTempPath(), "discord-bot-tests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(path);
        return path;
    }
}