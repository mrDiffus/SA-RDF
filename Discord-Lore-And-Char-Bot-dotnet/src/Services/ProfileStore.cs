using System.Text.Json;
using DiscordLoreAndCharBotDotnet.Models;

namespace DiscordLoreAndCharBotDotnet.Services;

internal sealed class ProfileStore
{
    private readonly string _storePath;
    private readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

    public ProfileStore(string storePath)
    {
        _storePath = storePath;
    }

    public async Task InitAsync()
    {
        var dir = Path.GetDirectoryName(_storePath);
        if (!string.IsNullOrWhiteSpace(dir))
        {
            Directory.CreateDirectory(dir);
        }

        if (!File.Exists(_storePath))
        {
            await WriteAsync(new ProfileData());
        }
    }

    public async Task<CharacterProfile?> GetAsync(string userId, string name)
    {
        var data = await ReadAsync();
        return data.Profiles.FirstOrDefault(p =>
            p.UserId == userId &&
            p.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<CharacterProfile> UpsertAsync(CharacterProfile input)
    {
        var data = await ReadAsync();
        var now = DateTimeOffset.UtcNow.ToString("O");

        var existing = data.Profiles.FirstOrDefault(p =>
            p.UserId == input.UserId &&
            p.Name.Equals(input.Name, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            input.UpdatedAt = now;
            data.Profiles.Add(input);
            await WriteAsync(data);
            return input;
        }

        existing.Notes = input.Notes ?? existing.Notes;
        existing.CurrentLevel = input.CurrentLevel ?? existing.CurrentLevel;
        existing.Archetype = input.Archetype ?? existing.Archetype;
        existing.Race = input.Race ?? existing.Race;
        existing.Trope = input.Trope ?? existing.Trope;
        existing.UpdatedAt = now;

        await WriteAsync(data);
        return existing;
    }

    private async Task<ProfileData> ReadAsync()
    {
        var raw = await File.ReadAllTextAsync(_storePath);
        var data = JsonSerializer.Deserialize<ProfileData>(raw);
        return data ?? new ProfileData();
    }

    private async Task WriteAsync(ProfileData data)
    {
        var raw = JsonSerializer.Serialize(data, _jsonOptions);
        await File.WriteAllTextAsync(_storePath, raw);
    }

    private sealed class ProfileData
    {
        public List<CharacterProfile> Profiles { get; set; } = [];
    }
}