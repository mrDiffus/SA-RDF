using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using DiscordLoreAndCharBotDotnet.Models;

namespace DiscordLoreAndCharBotDotnet.Services;

internal sealed class GeminiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly string _personaInstruction;
    private readonly AssetManifestService _assetManifest;
    private readonly bool _enableGoogleSearchRetrieval;

    public GeminiService(
        HttpClient httpClient,
        string apiKey,
        string model,
        string personaInstruction,
        AssetManifestService assetManifest,
        bool enableGoogleSearchRetrieval)
    {
        _httpClient = httpClient;
        _apiKey = apiKey;
        _model = model;
        _personaInstruction = personaInstruction;
        _assetManifest = assetManifest;
        _enableGoogleSearchRetrieval = enableGoogleSearchRetrieval;
    }

    public async Task<StartupProbeResult> ProbeAwakeAsync(CancellationToken cancellationToken)
    {
        try
        {
            var endpoint = BuildEndpoint();
            var payload = new
            {
                generationConfig = new
                {
                    temperature = 0.0
                },
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[]
                        {
                            new
                            {
                                text = "Awake?"
                            }
                        }
                    }
                }
            };

            using var response = await _httpClient.PostAsJsonAsync(endpoint, payload, cancellationToken);
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return StartupProbeResult.Ok;
            }

            if (IsRateLimitResponse(response.StatusCode, responseText))
            {
                LogGeminiError(response.StatusCode, responseText);
                return StartupProbeResult.RateLimited;
            }

            Console.WriteLine($"[gemini] startup probe failed {(int)response.StatusCode} {response.StatusCode}: {ExtractErrorSummary(responseText)}");
            return StartupProbeResult.NonRateLimitFailure;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[gemini] startup probe exception: {ex.Message}");
            return StartupProbeResult.NonRateLimitFailure;
        }
    }

    public async Task<string> AnswerAsync(AskRequest input, IReadOnlyList<KnowledgeChunk> context, CancellationToken cancellationToken)
    {
        try
        {
            var endpoint = BuildEndpoint();

            var parts = new List<object>();
            foreach (var fileRef in _assetManifest.FileRefs)
            {
                parts.Add(new
                {
                    file_data = new
                    {
                        mime_type = fileRef.MimeType,
                        file_uri = fileRef.FileUri
                    }
                });
            }

            parts.Add(new { text = BuildPrompt(input, context) });

            var tools = _enableGoogleSearchRetrieval
                ? new object[] { new { google_search = new { } } }
                : Array.Empty<object>();

            var payload = new
            {
                system_instruction = new
                {
                    parts = new[]
                    {
                        new
                        {
                            text = _personaInstruction
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.3
                },
                tools,
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts
                    }
                }
            };

            using var response = await _httpClient.PostAsJsonAsync(endpoint, payload, cancellationToken);
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                LogGeminiError(response.StatusCode, responseText);
                return BuildFriendlyErrorMessage(response.StatusCode);
            }

            var text = TryExtractCandidateText(responseText);
            if (string.IsNullOrWhiteSpace(text))
            {
                Console.WriteLine("[gemini] model response contained no text payload");
                return "I could not generate a response from the provided local data.";
            }

            return text.Trim();
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[gemini] unexpected error: {ex}");
            return "I had trouble contacting the lore model. Please try again shortly.";
        }
    }

    private static string BuildPrompt(AskRequest input, IReadOnlyList<KnowledgeChunk> context)
    {
        var profile = input.Profile is null
            ? "No profile provided."
            : string.Join('\n',
            [
                $"Profile name: {input.Profile.Name}",
                $"Level: {input.Profile.CurrentLevel?.ToString() ?? "unknown"}",
                $"Archetype: {input.Profile.Archetype ?? "unknown"}",
                $"Race: {input.Profile.Race ?? "unknown"}",
                $"Trope: {input.Profile.Trope ?? "unknown"}",
                $"Notes: {input.Profile.Notes ?? "none"}"
            ]);

        var contextText = string.Join("\n\n", context.Select((chunk, i) =>
        {
            var trimmed = chunk.Text.Length > 1200 ? chunk.Text[..1200] + "..." : chunk.Text;
            var sourceRef = chunk.HostedUrl ?? chunk.ResourceIri ?? chunk.SourcePath;
            return $"Source {i + 1}: {chunk.Title} ({sourceRef})\n{trimmed}";
        }));

        var sb = new StringBuilder();
        sb.AppendLine($"Intent: {input.Intent}");
        sb.AppendLine(profile);
        sb.AppendLine($"Question: {input.Question}");
        sb.AppendLine();
        sb.AppendLine("Use only this local context:");
        sb.AppendLine(contextText);
        sb.AppendLine();
        sb.AppendLine("Output requirements:");
        sb.AppendLine("- Give a direct answer first.");
        sb.AppendLine("- For levelup/trope intents, include 2-4 concrete next-step options.");
        sb.AppendLine("- Include a short Evidence section citing source titles used with direct URLs when provided.");
        sb.AppendLine("- Prefer hosted resource links on https://stellar-arcana.org/ in Evidence references.");
        sb.AppendLine("- If unsupported, say so clearly and ask one follow-up question.");
        return sb.ToString();
    }

    private static void LogGeminiError(HttpStatusCode statusCode, string responseText)
    {
        var summary = ExtractErrorSummary(responseText);
        Console.WriteLine($"[gemini] request failed {(int)statusCode} {statusCode}: {summary}");
    }

    private static string BuildFriendlyErrorMessage(HttpStatusCode statusCode)
    {
        return statusCode == HttpStatusCode.TooManyRequests
            ? "The lore model is throttling requests right now. Please wait a moment and try again."
            : $"Sorry, I ran into an issue contacting the lore model (status {(int)statusCode}). Please try again in a bit.";
    }

    private static bool IsRateLimitResponse(HttpStatusCode statusCode, string responseText)
    {
        if (statusCode == HttpStatusCode.TooManyRequests)
        {
            return true;
        }

        var summary = ExtractErrorSummary(responseText);
        return summary.Contains("rate limit", StringComparison.OrdinalIgnoreCase)
            || summary.Contains("quota", StringComparison.OrdinalIgnoreCase)
            || summary.Contains("resource_exhausted", StringComparison.OrdinalIgnoreCase)
            || summary.Contains("too many requests", StringComparison.OrdinalIgnoreCase);
    }

    private string BuildEndpoint()
    {
        return $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(_model)}:generateContent?key={Uri.EscapeDataString(_apiKey)}";
    }

    private static string TryExtractCandidateText(string responseText)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseText);
            if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.ValueKind != JsonValueKind.Array)
            {
                return string.Empty;
            }

            foreach (var candidate in candidates.EnumerateArray())
            {
                if (!candidate.TryGetProperty("content", out var content))
                {
                    continue;
                }

                if (!content.TryGetProperty("parts", out var parts) || parts.ValueKind != JsonValueKind.Array || parts.GetArrayLength() == 0)
                {
                    continue;
                }

                var part = parts[0];
                if (part.TryGetProperty("text", out var textElement) && textElement.ValueKind == JsonValueKind.String)
                {
                    return textElement.GetString() ?? string.Empty;
                }
            }
        }
        catch (JsonException ex)
        {
            Console.WriteLine($"[gemini] failed to parse response JSON: {ex.Message}. Body: {TruncateForLog(responseText)}");
        }

        return string.Empty;
    }

    private static string ExtractErrorSummary(string responseText)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseText);
            if (doc.RootElement.TryGetProperty("error", out var errorElement))
            {
                if (errorElement.TryGetProperty("message", out var messageElement) && messageElement.ValueKind == JsonValueKind.String)
                {
                    return messageElement.GetString() ?? string.Empty;
                }

                return errorElement.ToString();
            }
        }
        catch (JsonException)
        {
            // best effort logging only
        }

        return TruncateForLog(responseText);
    }

    private static string TruncateForLog(string text)
    {
        const int limit = 400;
        return text.Length <= limit ? text : text[..limit] + "...";
    }
}

internal enum StartupProbeResult
{
    Ok,
    RateLimited,
    NonRateLimitFailure
}
