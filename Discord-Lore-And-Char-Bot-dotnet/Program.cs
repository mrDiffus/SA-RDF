using DiscordLoreAndCharBotDotnet.Config;
using DiscordLoreAndCharBotDotnet.Services;

var baseDirectory = AppContext.BaseDirectory;
var config = BotConfig.Load(baseDirectory);

var profileStore = new ProfileStore(config.ProfileStorePath);
await profileStore.InitAsync();

var knowledgeBase = await KnowledgeBaseService.BuildAsync(config.DataRoot);
Console.WriteLine($"[bot] loaded {knowledgeBase.Chunks.Count} knowledge chunks");

using var httpClient = new HttpClient();
var personaInstruction = File.Exists(config.PersonaPath)
	? await File.ReadAllTextAsync(config.PersonaPath)
	: "You are a tabletop RPG assistant for a custom setting. Local data snippets are the only factual authority. Do not invent source facts.";

var assets = await AssetManifestService.LoadOrCreateAsync(config.AssetManifestPath);
await assets.SyncWithGeminiAsync(httpClient, config.GeminiApiKey, config.DataRoot, CancellationToken.None);
Console.WriteLine($"[bot] manifest contains {assets.FileRefs.Count} uploaded Gemini file references");

var gemini = new GeminiService(
	httpClient,
	config.GeminiApiKey,
	config.GeminiModel,
	personaInstruction,
	assets,
	config.EnableGoogleSearchRetrieval);

var startupProbe = await gemini.ProbeAwakeAsync(CancellationToken.None);
if (startupProbe == StartupProbeResult.RateLimited)
{
	Console.WriteLine("[bot] startup blocked: Gemini API is currently rate-limited. Try again later.");
	Environment.ExitCode = 1;
	return;
}

if (startupProbe == StartupProbeResult.NonRateLimitFailure)
{
	Console.WriteLine("[bot] warning: Gemini startup probe failed for a non-rate-limit reason; continuing startup.");
}

var host = new DiscordBotHost(config, profileStore, gemini, knowledgeBase);

using var cts = new CancellationTokenSource();
Console.CancelKeyPress += (_, args) =>
{
	args.Cancel = true;
	cts.Cancel();
};

try
{
	await host.RunAsync(cts.Token);
}
catch (OperationCanceledException)
{
	Console.WriteLine("[bot] shutdown requested");
}
catch (Exception ex)
{
	Console.WriteLine($"[bot] startup failed {ex}");
	Environment.ExitCode = 1;
}
