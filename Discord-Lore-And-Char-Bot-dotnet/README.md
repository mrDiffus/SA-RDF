# Discord Lore And Character Bot (.NET)

C# reimplementation of the Discord lore/character bot using Discord.Net and Gemini API.

## Stack
- Discord: Discord.Net
- Gemini: Google Gemini REST API via HttpClient
- Runtime: .NET 10 console app

## Setup
1. `cd Discord-Lore-And-Char-Bot-dotnet`
2. Edit `appsettings.json` and fill in the `Bot` section values.
3. Run: `dotnet run`

## Docker / Compose
- Local build/run via Docker Compose: `docker compose up -d --build`
- Komodo-oriented image pull Compose file: `docker-compose.komodo.yml`
  - Set `Bot__*` variables in Komodo stack environment/secrets.
  - Replace `ghcr.io/your-org/discord-lore-bot:latest` with your published image.

You can also override any `Bot:*` value using environment variables.
Use `__` for nested keys, for example: `Bot__EnableMessageContentIntent=true`.

## Slash Command
- `/ask`
  - `question` (required)
  - `intent` (optional: `auto | lore | levelup | trope`)
  - `profile_name`, `profile_notes`, `current_level`, `archetype`, `race`, `trope` (all optional)

## Mention Replies
Mention replies require:
- Enabling Message Content Intent in Discord Developer Portal.
- Setting `Bot:EnableMessageContentIntent=true` in `appsettings.json` or `Bot__EnableMessageContentIntent=true` as an environment variable.
- Mentioning the bot inside an `ask-*` response thread created by a multi-part `/ask` response.
- The bot includes recent messages from that thread as context when generating a mention reply.

Mention replies do not run in normal guild channels or unrelated threads.

## Notes
- Local JSON under `Bot:DataRoot` is used as grounding context.
- If `Bot:DiscordGuildId` is omitted or invalid, commands are registered globally.

## Smart Loader (Gem Asset Sync)
- On startup the bot scans `Bot:DataRoot` for `.jsonld`, `.ttl`, and `.csv` files.
- It stores uploaded Gemini file metadata in `Bot:AssetManifestPath`.
- Re-upload rules:
  - Reuse existing URI when hash matches and upload is newer than 44 hours.
  - Upload again when file is new, changed, or older than 44 hours.
- Manifest is saved immediately after each upload.

## Persona Replication
- Base persona is loaded from `Bot:PersonaPath`.
- Gemini requests include manifest file URIs as `file_data` parts.
- Google search retrieval tool is enabled via `Bot:EnableGoogleSearchRetrieval`.
