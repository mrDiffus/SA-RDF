#pragma warning disable SKEXP0070
#pragma warning disable SKEXP0110

using DiscordLoreAndCharBotDotnet.Config;
using DiscordLoreAndCharBotDotnet.Plugins;
using DiscordLoreAndCharBotDotnet.Services;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.Connectors.Google;

var baseDirectory = AppContext.BaseDirectory;
var config = BotConfig.Load(baseDirectory);

var profileStore = new ProfileStore(config.ProfileStorePath);
await profileStore.InitAsync();

var knowledgeBase = await KnowledgeBaseService.BuildAsync(config.DataRoot);
Console.WriteLine($"[bot] loaded {knowledgeBase.Chunks.Count} knowledge chunks");

var personaInstruction = File.Exists(config.PersonaPath)
	? await File.ReadAllTextAsync(config.PersonaPath)
	: "You are a tabletop RPG assistant for a custom setting. Local data is the only factual authority. Do not invent source facts.";

var kernel = Kernel.CreateBuilder()
	.AddGoogleAIGeminiChatCompletion(config.GeminiModel, config.GeminiApiKey)
	.Build();

kernel.Plugins.AddFromObject(new KnowledgePlugin(knowledgeBase), "Knowledge");
kernel.Plugins.AddFromObject(new ProfilePlugin(profileStore), "Profile");

var agent = new ChatCompletionAgent
{
	Name = "StellarArcanaMaster",
	Instructions = personaInstruction,
	Kernel = kernel,
	Arguments = new KernelArguments(
		new GeminiPromptExecutionSettings
		{
			FunctionChoiceBehavior = FunctionChoiceBehavior.Auto(),
			Temperature = 0.3
		})
};

var askAgent = new AskAgentService(agent);

var host = new DiscordBotHost(config, profileStore, askAgent);

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
