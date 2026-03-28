using System.Text;
using System.Text.Json;
using DiscordLoreAndCharBotDotnet.Models;

namespace DiscordLoreAndCharBotDotnet.Services;

internal static class KnowledgeBaseService
{
    public static async Task<KnowledgeBase> BuildAsync(string dataRoot)
    {
        var files = Directory.EnumerateFiles(dataRoot, "*.json", SearchOption.AllDirectories);
        var chunks = new List<KnowledgeChunk>();

        foreach (var filePath in files)
        {
            try
            {
                var raw = await File.ReadAllTextAsync(filePath);
                using var doc = JsonDocument.Parse(raw);
                var relativePath = Path.GetRelativePath(dataRoot, filePath).Replace('\\', '/');
                chunks.AddRange(GraphToChunks(relativePath, doc.RootElement));
            }
            catch
            {
                // Ignore malformed files and continue indexing the rest of the corpus.
            }
        }

        return new KnowledgeBase { Chunks = chunks };
    }

    public static IReadOnlyList<KnowledgeChunk> RetrieveRelevantChunks(KnowledgeBase knowledgeBase, string query, int limit = 8)
    {
        var terms = Tokenize(query);
        if (terms.Count == 0)
        {
            return knowledgeBase.Chunks.Take(limit).ToArray();
        }

        var ranked = knowledgeBase.Chunks
            .Select(chunk =>
            {
                var lowerText = chunk.Text.ToLowerInvariant();
                var score = terms.Count(term => lowerText.Contains(term, StringComparison.Ordinal));
                if (chunk.Title.ToLowerInvariant().Contains(terms[0], StringComparison.Ordinal))
                {
                    score += 2;
                }

                return (chunk, score);
            })
            .Where(x => x.score > 0)
            .OrderByDescending(x => x.score)
            .Take(limit)
            .Select(x => x.chunk)
            .ToArray();

        return ranked.Length > 0 ? ranked : knowledgeBase.Chunks.Take(limit).ToArray();
    }

    private static List<string> Tokenize(string text)
    {
        var sb = new StringBuilder(text.Length);
        foreach (var ch in text.ToLowerInvariant())
        {
            sb.Append(char.IsLetterOrDigit(ch) || char.IsWhiteSpace(ch) ? ch : ' ');
        }

        return sb.ToString()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(token => token.Length >= 3)
            .Distinct()
            .ToList();
    }

    private static IEnumerable<KnowledgeChunk> GraphToChunks(string sourcePath, JsonElement root)
    {
        if (root.ValueKind == JsonValueKind.Object
            && root.TryGetProperty("@graph", out var graph)
            && graph.ValueKind == JsonValueKind.Array)
        {
            var index = 0;
            foreach (var node in graph.EnumerateArray())
            {
                index += 1;
                var chunk = ToChunk(sourcePath, node, index);
                if (chunk is not null)
                {
                    yield return chunk;
                }
            }

            yield break;
        }

        var single = ToChunk(sourcePath, root, 1);
        if (single is not null)
        {
            yield return single;
        }
    }

    private static KnowledgeChunk? ToChunk(string sourcePath, JsonElement node, int index)
    {
        var title = ReadProperty(node, "rdfs:label")
            ?? ReadProperty(node, "name")
            ?? ReadProperty(node, "@id")
            ?? $"{Path.GetFileName(sourcePath)}#{index}";

        var text = string.Join(' ', ExtractText(node)).Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        return new KnowledgeChunk
        {
            SourcePath = sourcePath,
            Title = title,
            Text = text
        };
    }

    private static string? ReadProperty(JsonElement element, string propertyName)
    {
        if (element.ValueKind == JsonValueKind.Object
            && element.TryGetProperty(propertyName, out var value)
            && value.ValueKind == JsonValueKind.String)
        {
            return value.GetString();
        }

        return null;
    }

    private static IEnumerable<string> ExtractText(JsonElement value)
    {
        switch (value.ValueKind)
        {
            case JsonValueKind.String:
                var text = value.GetString();
                if (!string.IsNullOrWhiteSpace(text))
                {
                    yield return text!;
                }
                break;
            case JsonValueKind.Number:
            case JsonValueKind.True:
            case JsonValueKind.False:
                yield return value.ToString();
                break;
            case JsonValueKind.Array:
                foreach (var child in value.EnumerateArray())
                {
                    foreach (var sub in ExtractText(child))
                    {
                        yield return sub;
                    }
                }
                break;
            case JsonValueKind.Object:
                foreach (var prop in value.EnumerateObject())
                {
                    if (prop.Name.StartsWith('@'))
                    {
                        continue;
                    }

                    foreach (var sub in ExtractText(prop.Value))
                    {
                        yield return sub;
                    }
                }
                break;
        }
    }
}
