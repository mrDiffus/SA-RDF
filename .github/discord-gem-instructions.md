Agent Instruction: Discord Bot Implementation Plan1. ObjectiveCreate a .NET Discord bot that replicates a Gemini "Gem" by dynamically injecting local knowledge files and system instructions into the Gemini 3 Flash model.2. Startup & Asset Lifecycle (The "Smart Loader")The bot must manage local resources to avoid redundant uploads and stay within the 48-hour API window.Scan Phase: On startup, the bot scans the /resources directory for .jsonld, .ttl, and .csv files.Manifest Check: The bot consults a local assets_manifest.json.Logic: If a file's hash matches an entry in the manifest AND the UploadTimestamp is less than 44 hours old, skip upload and use the existing FileUri.Action: If the file is new, modified, or expired, call FileClient.UploadAsync(), then update the manifest with the new FileUri and current timestamp.Persistence: Save the manifest immediately to disk to survive service restarts.3. "Gem" Replication (System Instructions)Since Gems cannot be referenced by ID, the bot must construct the persona programmatically:Persona: Load the base "Gem Instructions" from a local persona.md.Data Injection: Append the FileUri references to the GenerateContentRequest.Tools: Enable GoogleSearchRetrieval to mirror the Gem's ability to reference external URLs.4. Implementation (Minimal API Pattern)C#using Discord;
using Discord.WebSocket;
using Google.GenAI;

var builder = Host.CreateApplicationBuilder(args);
var app = builder.Build();

// 1. Setup Gemini & Manifest
var gemini = new Google.GenAI.Client("API_KEY");
var manifest = AssetManager.LoadOrCreate("assets_manifest.json");

// 2. Sync Files (CSV, Turtle, JSON-LD)
await manifest.SyncWithGeminiAsync(gemini.Files, "./resources");

// 3. Setup Discord
var discord = new DiscordSocketClient(new DiscordSocketConfig {
    GatewayIntents = GatewayIntents.AllUnprivileged | GatewayIntents.MessageContent
});

discord.MessageReceived += async msg => {
    if (msg.Author.IsBot) return;

    using (msg.Channel.EnterTypingState()) {
        var model = gemini.Models.Get("gemini-3-flash");
        
        var request = new GenerateContentRequest {
            SystemInstruction = "You are the [Gem Persona Name]. Use attached data.",
            Contents = [
                new Content {
                    Parts = [
                        .. manifest.GetFileParts(), // Spreads the cached FileUris
                        new Part { Text = msg.Content }
                    ]
                }
            ],
            Tools = [new Tool { GoogleSearchRetrieval = new() }]
        };

        var response = await model.GenerateContentAsync(request);
        await msg.Channel.SendMessageAsync(response.Text);
    }
};

await discord.LoginAsync(TokenType.Bot, "DISCORD_TOKEN");
await discord.StartAsync();
await app.RunAsync();