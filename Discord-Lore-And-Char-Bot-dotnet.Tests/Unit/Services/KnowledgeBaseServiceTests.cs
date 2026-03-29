using DiscordLoreAndCharBotDotnet.Models;
using DiscordLoreAndCharBotDotnet.Services;

namespace DiscordLoreAndCharBotDotnet.Tests.Unit.Services;

public sealed class KnowledgeBaseServiceTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public async Task BuildAsync_IndexesJsonFilesAndSkipsMalformedDocuments()
    {
        var tempDir = CreateTempDir();
        try
        {
            var dataRoot = Path.Combine(tempDir, "data");
            Directory.CreateDirectory(dataRoot);

            await File.WriteAllTextAsync(Path.Combine(dataRoot, "graph.json"), """
{
    "@context": {
        "archetype": "https://stellararcana.org/archetype/"
    },
  "@graph": [
    {
            "@id": "archetype:AcePilot",
      "rdfs:label": "Ace Pilot",
      "description": "Fast ship specialist",
      "level": 3
    },
    {
      "name": "Ignored Node",
      "description": "   "
    }
  ]
}
""");

            await File.WriteAllTextAsync(Path.Combine(dataRoot, "single.json"), """
{
  "name": "Human",
  "traits": ["Adaptable", "Resourceful"]
}
""");

            await File.WriteAllTextAsync(Path.Combine(dataRoot, "broken.json"), "{ this is not valid json }");

            var knowledgeBase = await KnowledgeBaseService.BuildAsync(dataRoot);

            Assert.Equal(3, knowledgeBase.Chunks.Count);

            var aceChunk = Assert.Single(knowledgeBase.Chunks, chunk => chunk.Title == "Ace Pilot");
            Assert.Equal("graph.json", aceChunk.SourcePath);
            Assert.Contains("Fast ship specialist", aceChunk.Text, StringComparison.Ordinal);
            Assert.Contains("3", aceChunk.Text, StringComparison.Ordinal);
            Assert.Equal("https://stellararcana.org/archetype/AcePilot", aceChunk.ResourceIri);
            Assert.Equal("https://stellar-arcana.org/archetype/AcePilot", aceChunk.HostedUrl);

            var humanChunk = Assert.Single(knowledgeBase.Chunks, chunk => chunk.Title == "Human");
            Assert.Equal("single.json", humanChunk.SourcePath);
            Assert.Contains("Adaptable", humanChunk.Text, StringComparison.Ordinal);
            Assert.Contains("Resourceful", humanChunk.Text, StringComparison.Ordinal);

            var ignoredNodeChunk = Assert.Single(knowledgeBase.Chunks, chunk => chunk.Title == "Ignored Node");
            Assert.Equal("graph.json", ignoredNodeChunk.SourcePath);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void RetrieveRelevantChunks_RanksMatchesAndTitleHitsHigher()
    {
        var knowledgeBase = new KnowledgeBase
        {
            Chunks =
            [
                new KnowledgeChunk
                {
                    SourcePath = "a.json",
                    Title = "Ace Build Guide",
                    Text = "Pilot tactics and ace maneuver list"
                },
                new KnowledgeChunk
                {
                    SourcePath = "b.json",
                    Title = "General Notes",
                    Text = "Pilot basics only"
                },
                new KnowledgeChunk
                {
                    SourcePath = "c.json",
                    Title = "Lore",
                    Text = "Planet history"
                }
            ]
        };

        var results = KnowledgeBaseService.RetrieveRelevantChunks(knowledgeBase, "ace pilot", limit: 3);

        Assert.Equal(2, results.Count);
        Assert.Equal("Ace Build Guide", results[0].Title);
        Assert.Equal("General Notes", results[1].Title);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void RetrieveRelevantChunks_ReturnsFallbackForEmptyOrUnmatchedQueries()
    {
        var knowledgeBase = new KnowledgeBase
        {
            Chunks =
            [
                new KnowledgeChunk { SourcePath = "one.json", Title = "First", Text = "Alpha" },
                new KnowledgeChunk { SourcePath = "two.json", Title = "Second", Text = "Beta" },
                new KnowledgeChunk { SourcePath = "three.json", Title = "Third", Text = "Gamma" }
            ]
        };

        var emptyQueryResults = KnowledgeBaseService.RetrieveRelevantChunks(knowledgeBase, "?!", limit: 2);
        var unmatchedResults = KnowledgeBaseService.RetrieveRelevantChunks(knowledgeBase, "xyzzy plugh", limit: 2);

        Assert.Equal(2, emptyQueryResults.Count);
        Assert.Equal("First", emptyQueryResults[0].Title);
        Assert.Equal("Second", emptyQueryResults[1].Title);

        Assert.Equal(2, unmatchedResults.Count);
        Assert.Equal("First", unmatchedResults[0].Title);
        Assert.Equal("Second", unmatchedResults[1].Title);
    }

        [Fact]
        [Trait("Category", "Unit")]
        public async Task BuildAsync_PreservesAlreadyHostedAbsoluteResourceIri()
        {
                var tempDir = CreateTempDir();
                try
                {
                        var dataRoot = Path.Combine(tempDir, "data");
                        Directory.CreateDirectory(dataRoot);

                        await File.WriteAllTextAsync(Path.Combine(dataRoot, "resource.json"), """
{
    "@graph": [
        {
            "@id": "https://stellar-arcana.org/archetype/Academic",
            "rdfs:label": "Academic",
            "description": "Scholarly specialist"
        }
    ]
}
""");

                        var knowledgeBase = await KnowledgeBaseService.BuildAsync(dataRoot);

                        var chunk = Assert.Single(knowledgeBase.Chunks, c => c.Title == "Academic");
                        Assert.Equal("https://stellar-arcana.org/archetype/Academic", chunk.ResourceIri);
                        Assert.Equal("https://stellar-arcana.org/archetype/Academic", chunk.HostedUrl);
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