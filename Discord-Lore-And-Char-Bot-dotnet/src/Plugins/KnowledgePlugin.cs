using System.ComponentModel;
using System.Text;
using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;
using Microsoft.SemanticKernel;

namespace DiscordLoreAndCharBotDotnet.Plugins;

internal sealed class KnowledgePlugin
{
    private const int ChunkCharLimit = 1200;
    private readonly KnowledgeBase _knowledgeBase;

    public KnowledgePlugin(KnowledgeBase knowledgeBase)
    {
        _knowledgeBase = knowledgeBase;
    }

    [KernelFunction("search_lore")]
    [Description("Search the local Stellar Arcana knowledge base for rules, archetypes, races, spells, equipment, and lore. Call this before answering any game-related question.")]
    public string SearchLore(
        [Description("Keywords or a question describing what to look up (e.g. 'ranger archetype features', 'spell casting rules')")]
        string query)
    {
        var chunks = KnowledgeBaseService.RetrieveRelevantChunks(_knowledgeBase, query, limit: 8);

        if (chunks.Count == 0)
        {
            return "No relevant local knowledge found for that query.";
        }

        var sb = new StringBuilder();
        for (var i = 0; i < chunks.Count; i++)
        {
            var chunk = chunks[i];
            var text = chunk.Text.Length > ChunkCharLimit
                ? chunk.Text[..ChunkCharLimit] + "..."
                : chunk.Text;
            var sourceRef = chunk.HostedUrl ?? chunk.ResourceIri ?? chunk.SourcePath;

            if (sb.Length > 0)
            {
                sb.AppendLine();
            }

            sb.AppendLine($"Source {i + 1}: {chunk.Title} ({sourceRef})");
            sb.Append(text);
        }

        return sb.ToString();
    }
}
