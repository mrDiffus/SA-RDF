namespace DiscordLoreAndCharBotDotnet.Models;

internal enum BotIntent
{
    Lore,
    LevelUp,
    Trope
}

internal sealed class CharacterProfile
{
    public required string UserId { get; set; }
    public required string Name { get; set; }
    public string? Notes { get; set; }
    public int? CurrentLevel { get; set; }
    public string? Archetype { get; set; }
    public string? Race { get; set; }
    public string? Trope { get; set; }
    public required string UpdatedAt { get; set; }
}

internal sealed class AskRequest
{
    public required string UserId { get; init; }
    public required string Question { get; init; }
    public required BotIntent Intent { get; init; }
    public CharacterProfile? Profile { get; init; }
}

internal sealed class KnowledgeChunk
{
    public required string SourcePath { get; init; }
    public required string Title { get; init; }
    public required string Text { get; init; }
    public string? ResourceIri { get; init; }
    public string? HostedUrl { get; init; }
}

internal sealed class KnowledgeBase
{
    public required IReadOnlyList<KnowledgeChunk> Chunks { get; init; }
}
