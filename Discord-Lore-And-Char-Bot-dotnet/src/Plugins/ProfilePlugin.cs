using System.ComponentModel;
using System.Text.Json;
using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;
using Microsoft.SemanticKernel;

namespace DiscordLoreAndCharBotDotnet.Plugins;

internal sealed class ProfilePlugin
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };
    private readonly ProfileStore _profileStore;

    public ProfilePlugin(ProfileStore profileStore)
    {
        _profileStore = profileStore;
    }

    [KernelFunction("get_character_profile")]
    [Description("Retrieve a player's saved character profile by their Discord user ID and profile name. Returns profile fields as JSON, or an empty object if no profile exists.")]
    public async Task<string> GetCharacterProfileAsync(
        [Description("The player's Discord user ID (numeric string)")]
        string user_id,
        [Description("The profile name the player gave their character")]
        string profile_name)
    {
        var profile = await _profileStore.GetAsync(user_id, profile_name);
        if (profile is null)
        {
            return "{}";
        }

        return JsonSerializer.Serialize(new
        {
            name = profile.Name,
            level = profile.CurrentLevel,
            archetype = profile.Archetype,
            race = profile.Race,
            trope = profile.Trope,
            notes = profile.Notes,
            updated_at = profile.UpdatedAt
        }, JsonOptions);
    }

    [KernelFunction("update_character_profile")]
    [Description("Save or update a player's character profile. Only provide fields that are being changed. Returns a confirmation message.")]
    public async Task<string> UpdateCharacterProfileAsync(
        [Description("The player's Discord user ID (numeric string)")]
        string user_id,
        [Description("The profile name for this character")]
        string profile_name,
        [Description("Character level (integer), or null to leave unchanged")]
        int? level = null,
        [Description("Character archetype name, or null to leave unchanged")]
        string? archetype = null,
        [Description("Character race name, or null to leave unchanged")]
        string? race = null,
        [Description("Character trope or theme, or null to leave unchanged")]
        string? trope = null,
        [Description("Free-text notes about the character, or null to leave unchanged")]
        string? notes = null)
    {
        var existing = await _profileStore.GetAsync(user_id, profile_name);
        await _profileStore.UpsertAsync(new CharacterProfile
        {
            UserId = user_id,
            Name = profile_name,
            CurrentLevel = level ?? existing?.CurrentLevel,
            Archetype = archetype ?? existing?.Archetype,
            Race = race ?? existing?.Race,
            Trope = trope ?? existing?.Trope,
            Notes = notes ?? existing?.Notes,
            UpdatedAt = DateTimeOffset.UtcNow.ToString("O")
        });

        return $"Profile '{profile_name}' updated for user {user_id}.";
    }
}
