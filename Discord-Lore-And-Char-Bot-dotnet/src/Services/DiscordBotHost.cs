using Discord;
using Discord.Net;
using Discord.WebSocket;
using DiscordLoreAndCharBotDotnet.Config;
using DiscordLoreAndCharBotDotnet.Models;
using System.Collections.Concurrent;
using System.Globalization;
using System.Text;

namespace DiscordLoreAndCharBotDotnet.Services;

internal sealed class DiscordBotHost
{
    private const int AskSectionLimit = 1800;
    private const int MaxDiscordThreadNameLength = 95;
    private const int AskThreadPreviewMaxLength = 56;
    private const int AskThreadIdSuffixLength = 4;
    private const int MentionThreadHistoryFetchLimit = 40;
    private const int MentionThreadHistoryLineLimit = 16;
    private const int MentionThreadHistoryLineContentLimit = 220;
    private const int MentionThreadHistoryBlockCharLimit = 2600;
    private readonly BotConfig _config;
    private readonly ProfileStore _profileStore;
    private readonly GeminiService _gemini;
    private readonly KnowledgeBase _knowledgeBase;
    private readonly DiscordSocketClient _client;
    private readonly CancellationTokenSource _shutdownCts = new();
    private readonly ConcurrentDictionary<ulong, Task> _activeSlashTasks = new();
    private readonly ConcurrentDictionary<string, int> _activeSlashByUser = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<ulong, Task> _activeMentionTasks = new();
    private readonly ConcurrentDictionary<string, int> _activeMentionsByUser = new(StringComparer.Ordinal);

    internal static string SlashTimeoutMessage => "This request timed out while contacting the lore model. Please try again.";
    internal static string SlashShutdownMessage => "This request was cancelled because the bot is shutting down.";
    internal static string SlashUnhandledErrorMessage => "Sorry, something went wrong while processing your request.";
    internal static string SlashBusyMessage => "You already have too many in-flight ask requests. Please wait a moment and try again.";
    internal static string MentionTimeoutMessage => "This mention request timed out while contacting the lore model. Please try again.";
    internal static string MentionShutdownMessage => "This mention request was cancelled because the bot is shutting down.";
    internal static string MentionUnhandledErrorMessage => "Sorry, something went wrong while processing your mention request.";
    internal static string MentionBusyMessage => "You already have too many in-flight mention requests. Please wait a moment and try again.";

    internal TimeSpan SlashRequestTimeout { get; set; } = TimeSpan.FromSeconds(90);
    internal int MaxInFlightSlashCommandsPerUser { get; set; } = 2;
    internal TimeSpan MentionRequestTimeout { get; set; } = TimeSpan.FromSeconds(90);
    internal int MaxInFlightMentionRequestsPerUser { get; set; } = 2;

    public DiscordBotHost(BotConfig config, ProfileStore profileStore, GeminiService gemini, KnowledgeBase knowledgeBase)
    {
        _config = config;
        _profileStore = profileStore;
        _gemini = gemini;
        _knowledgeBase = knowledgeBase;

        var intents = GatewayIntents.Guilds | GatewayIntents.GuildMessages;
        if (_config.EnableMessageContentIntent)
        {
            intents |= GatewayIntents.MessageContent;
        }

        _client = new DiscordSocketClient(new DiscordSocketConfig
        {
            GatewayIntents = intents,
            LogGatewayIntentWarnings = false
        });

        _client.Log += OnLogAsync;
        _client.Ready += OnReadyAsync;
        _client.SlashCommandExecuted += OnSlashCommandAsync;

        if (_config.EnableMessageContentIntent)
        {
            _client.MessageReceived += OnMessageReceivedAsync;
        }
    }

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        using var cancellationRegistration = cancellationToken.Register(() => _shutdownCts.Cancel());

        await _client.LoginAsync(TokenType.Bot, _config.DiscordToken);
        await _client.StartAsync();

        await Task.Delay(Timeout.Infinite, cancellationToken).ContinueWith(_ => { }, TaskScheduler.Default);

        _shutdownCts.Cancel();

        if (_activeSlashTasks.Count > 0)
        {
            try
            {
                await Task.WhenAll(_activeSlashTasks.Values).WaitAsync(TimeSpan.FromSeconds(5));
            }
            catch
            {
                // Pending request cleanup is best-effort during shutdown.
            }
        }

        if (_activeMentionTasks.Count > 0)
        {
            try
            {
                await Task.WhenAll(_activeMentionTasks.Values).WaitAsync(TimeSpan.FromSeconds(5));
            }
            catch
            {
                // Pending request cleanup is best-effort during shutdown.
            }
        }

        await _client.StopAsync();
        await _client.LogoutAsync();
    }

    private async Task OnReadyAsync()
    {
        Console.WriteLine($"[bot] logged in as {_client.CurrentUser}");

        if (_config.AutoRegisterCommands)
        {
            try
            {
                var command = BuildAskCommand();
                if (_config.DiscordGuildId.HasValue)
                {
                    var guild = _client.GetGuild(_config.DiscordGuildId.Value);
                    if (guild is not null)
                    {
                        await guild.CreateApplicationCommandAsync(command);
                    }
                    else
                    {
                        await _client.Rest.CreateGlobalCommand(command);
                    }
                }
                else
                {
                    await _client.Rest.CreateGlobalCommand(command);
                }

                Console.WriteLine("[bot] slash commands registered");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[bot] slash command registration failed: {ex.Message}");
            }
        }

        if (!_config.EnableMessageContentIntent)
        {
            Console.WriteLine("[bot] ask-thread mention replies disabled. Set Bot:EnableMessageContentIntent=true and enable Message Content Intent in Discord Developer Portal to use mentions inside ask threads.");
        }
    }

    private async Task OnSlashCommandAsync(SocketSlashCommand command)
    {
        if (!command.CommandName.Equals("ask", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var input = AskCommandInputParser.Parse(command.Data.Options.Select(option => new SlashCommandOptionValue(option.Name, option.Value)));
        var validationError = GetAskInputValidationError(input);
        if (validationError is not null)
        {
            await command.RespondAsync(validationError, ephemeral: true);
            return;
        }

        try
        {
            await command.DeferAsync();
        }
        catch (HttpException ex) when ((int?)ex.DiscordCode == 40060)
        {
            // Discord retried the interaction delivery before we could acknowledge it.
            // The duplicate invocation already deferred; skip processing this one.
            return;
        }

        var userId = command.User.Id.ToString();
        if (!TryBeginSlashRequest(userId))
        {
            await SafeModifyOriginalResponseAsync(command, SlashBusyMessage);
            return;
        }

        var interactionId = command.Id;
        var backgroundTask = RunSlashCommandOffloadedAsync(command, userId, input);
        _activeSlashTasks[interactionId] = backgroundTask;

        _ = backgroundTask.ContinueWith(_task =>
        {
            _activeSlashTasks.TryRemove(interactionId, out var _removedTask);
            EndSlashRequest(userId);
        }, TaskScheduler.Default);
    }

    internal static string? GetAskInputValidationError(AskCommandInput input)
    {
        return string.IsNullOrWhiteSpace(input.Question) ? "Question is required." : null;
    }

    internal bool TryBeginSlashRequest(string userId)
    {
        while (true)
        {
            if (!_activeSlashByUser.TryGetValue(userId, out var activeCount))
            {
                if (_activeSlashByUser.TryAdd(userId, 1))
                {
                    return true;
                }

                continue;
            }

            if (activeCount >= MaxInFlightSlashCommandsPerUser)
            {
                return false;
            }

            if (_activeSlashByUser.TryUpdate(userId, activeCount + 1, activeCount))
            {
                return true;
            }
        }
    }

    internal void EndSlashRequest(string userId)
    {
        while (true)
        {
            if (!_activeSlashByUser.TryGetValue(userId, out var activeCount))
            {
                return;
            }

            if (activeCount <= 1)
            {
                if (_activeSlashByUser.TryRemove(userId, out _))
                {
                    return;
                }

                continue;
            }

            if (_activeSlashByUser.TryUpdate(userId, activeCount - 1, activeCount))
            {
                return;
            }
        }
    }

    internal bool TryBeginMentionRequest(string userId)
    {
        while (true)
        {
            if (!_activeMentionsByUser.TryGetValue(userId, out var activeCount))
            {
                if (_activeMentionsByUser.TryAdd(userId, 1))
                {
                    return true;
                }

                continue;
            }

            if (activeCount >= MaxInFlightMentionRequestsPerUser)
            {
                return false;
            }

            if (_activeMentionsByUser.TryUpdate(userId, activeCount + 1, activeCount))
            {
                return true;
            }
        }
    }

    internal void EndMentionRequest(string userId)
    {
        while (true)
        {
            if (!_activeMentionsByUser.TryGetValue(userId, out var activeCount))
            {
                return;
            }

            if (activeCount <= 1)
            {
                if (_activeMentionsByUser.TryRemove(userId, out _))
                {
                    return;
                }

                continue;
            }

            if (_activeMentionsByUser.TryUpdate(userId, activeCount - 1, activeCount))
            {
                return;
            }
        }
    }

    internal async Task ProcessAskCommandAsync(
        string userId,
        AskCommandInput input,
        Func<string, Task> respondAsync,
        CancellationToken shutdownToken)
    {
        using var requestCts = CancellationTokenSource.CreateLinkedTokenSource(shutdownToken);
        requestCts.CancelAfter(SlashRequestTimeout);

        try
        {
            var answer = await BuildAskResponseAsync(userId, input, requestCts.Token);
            await TryRespondAsync(respondAsync, answer);
        }
        catch (OperationCanceledException) when (shutdownToken.IsCancellationRequested)
        {
            await TryRespondAsync(respondAsync, SlashShutdownMessage);
        }
        catch (OperationCanceledException)
        {
            await TryRespondAsync(respondAsync, SlashTimeoutMessage);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] slash ask request failed: {ex.Message}");
            await TryRespondAsync(respondAsync, SlashUnhandledErrorMessage);
        }
    }

    internal async Task<string> BuildAskResponseAsync(string userId, AskCommandInput input, CancellationToken cancellationToken)
    {
        if (GetAskInputValidationError(input) is not null)
        {
            throw new InvalidOperationException("BuildAskResponseAsync requires a validated ask input with a non-empty question.");
        }

        var question = input.Question!;

        CharacterProfile? profile = null;
        if (!string.IsNullOrWhiteSpace(input.ProfileName))
        {
            profile = await _profileStore.GetAsync(userId, input.ProfileName);
            if (!string.IsNullOrWhiteSpace(input.ProfileNotes)
                || input.CurrentLevel.HasValue
                || !string.IsNullOrWhiteSpace(input.Archetype)
                || !string.IsNullOrWhiteSpace(input.Race)
                || !string.IsNullOrWhiteSpace(input.Trope))
            {
                profile = await _profileStore.UpsertAsync(new CharacterProfile
                {
                    UserId = userId,
                    Name = input.ProfileName,
                    Notes = input.ProfileNotes ?? profile?.Notes,
                    CurrentLevel = input.CurrentLevel ?? profile?.CurrentLevel,
                    Archetype = input.Archetype ?? profile?.Archetype,
                    Race = input.Race ?? profile?.Race,
                    Trope = input.Trope ?? profile?.Trope,
                    UpdatedAt = DateTimeOffset.UtcNow.ToString("O")
                });
            }
        }

        var intent = IntentDetector.Detect(question, input.IntentOverride);
        var retrievalQuery = $"{question} {profile?.Archetype ?? string.Empty} {profile?.Race ?? string.Empty} {profile?.Trope ?? string.Empty}".Trim();
        var context = KnowledgeBaseService.RetrieveRelevantChunks(_knowledgeBase, retrievalQuery, 8);

        var askRequest = new AskRequest
        {
            UserId = userId,
            Question = question,
            Intent = intent,
            Profile = profile
        };

        var answer = await _gemini.AnswerAsync(askRequest, context, cancellationToken);
        return DiscordMessageClamper.NormalizeLinksForDiscord(answer);
    }

    internal static string? GetMentionValidationError(string question)
    {
        return string.IsNullOrWhiteSpace(question) ? "Question is required." : null;
    }

    internal async Task<string> BuildMentionResponseAsync(
        string userId,
        string question,
        CancellationToken cancellationToken,
        string? threadContext = null)
    {
        if (GetMentionValidationError(question) is not null)
        {
            throw new InvalidOperationException("BuildMentionResponseAsync requires a non-empty mention question.");
        }

        var context = KnowledgeBaseService.RetrieveRelevantChunks(_knowledgeBase, question, 8);
        var askRequest = new AskRequest
        {
            UserId = userId,
            Question = BuildMentionQuestionWithThreadContext(question, threadContext),
            Intent = IntentDetector.Detect(question, "auto")
        };

        var answer = await _gemini.AnswerAsync(askRequest, context, cancellationToken);
        var normalized = DiscordMessageClamper.NormalizeLinksForDiscord(answer);
        return DiscordMessageClamper.Clamp(normalized);
    }

    internal async Task ProcessMentionRequestAsync(
        string userId,
        string question,
        Func<string, Task> respondAsync,
        CancellationToken shutdownToken,
        string? threadContext = null)
    {
        using var requestCts = CancellationTokenSource.CreateLinkedTokenSource(shutdownToken);
        requestCts.CancelAfter(MentionRequestTimeout);

        try
        {
            var answer = await BuildMentionResponseAsync(userId, question, requestCts.Token, threadContext);
            await TryRespondAsync(respondAsync, answer);
        }
        catch (OperationCanceledException) when (shutdownToken.IsCancellationRequested)
        {
            await TryRespondAsync(respondAsync, MentionShutdownMessage);
        }
        catch (OperationCanceledException)
        {
            await TryRespondAsync(respondAsync, MentionTimeoutMessage);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] mention request failed: {ex.Message}");
            await TryRespondAsync(respondAsync, MentionUnhandledErrorMessage);
        }
    }

    private Task RunSlashCommandOffloadedAsync(SocketSlashCommand command, string userId, AskCommandInput input)
    {
        return RunAskThreadedResponseAsync(command, userId, input, _shutdownCts.Token);
    }

    private async Task RunAskThreadedResponseAsync(
        SocketSlashCommand command,
        string userId,
        AskCommandInput input,
        CancellationToken shutdownToken)
    {
        using var requestCts = CancellationTokenSource.CreateLinkedTokenSource(shutdownToken);
        requestCts.CancelAfter(SlashRequestTimeout);

        try
        {
            var answer = await BuildAskResponseAsync(userId, input, requestCts.Token);
            await SafeSendAskResponseThreadedAsync(command, answer, input.Question!);
        }
        catch (OperationCanceledException) when (shutdownToken.IsCancellationRequested)
        {
            await SafeModifyOriginalResponseAsync(command, SlashShutdownMessage);
        }
        catch (OperationCanceledException)
        {
            await SafeModifyOriginalResponseAsync(command, SlashTimeoutMessage);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] slash ask request failed: {ex.Message}");
            await SafeModifyOriginalResponseAsync(command, SlashUnhandledErrorMessage);
        }
    }

    private async Task RunMentionRequestOffloadedAsync(SocketMessage message, string userId, string question)
    {
        try
        {
            await message.Channel.TriggerTypingAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] failed to trigger mention typing indicator: {ex.Message}");
        }

        string? threadContext = null;
        if (message.Channel is SocketThreadChannel threadChannel)
        {
            threadContext = await TryBuildThreadHistoryContextAsync(threadChannel, message);
        }

        await ProcessMentionRequestAsync(
            userId,
            question,
            response => SafeReplyToMentionAsync(message, response),
            _shutdownCts.Token,
            threadContext);
    }

    private static async Task TryRespondAsync(Func<string, Task> respondAsync, string content)
    {
        try
        {
            await respondAsync(content);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] failed to send slash response update: {ex.Message}");
        }
    }

    private static async Task SafeModifyOriginalResponseAsync(SocketSlashCommand command, string content)
    {
        try
        {
            await command.ModifyOriginalResponseAsync(msg => msg.Content = content);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] failed to modify deferred slash response: {ex.Message}");
        }
    }

    private static async Task SafeSendAskResponseThreadedAsync(SocketSlashCommand command, string content, string question)
    {
        try
        {
            var sections = DiscordMessageClamper.SplitIntoSections(content, AskSectionLimit);
            await command.ModifyOriginalResponseAsync(msg => msg.Content = FormatSectionMessage(sections[0], 1, sections.Count));

            if (sections.Count == 1)
            {
                return;
            }

            var threadChannel = await TryCreateAskResponseThreadAsync(command, question, sections.Count);
            if (threadChannel is not null)
            {
                for (var i = 1; i < sections.Count; i++)
                {
                    await threadChannel.SendMessageAsync(FormatSectionMessage(sections[i], i + 1, sections.Count));
                }

                return;
            }

            for (var i = 1; i < sections.Count; i++)
            {
                await command.Channel.SendMessageAsync(FormatSectionMessage(sections[i], i + 1, sections.Count));
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] failed to send threaded slash response: {ex.Message}");
            await SafeModifyOriginalResponseAsync(command, DiscordMessageClamper.Clamp(content));
        }
    }

    private static async Task<IThreadChannel?> TryCreateAskResponseThreadAsync(SocketSlashCommand command, string question, int sectionCount)
    {
        try
        {
            if (command.Channel is not ITextChannel textChannel)
            {
                return null;
            }

            var originalResponse = await command.GetOriginalResponseAsync();
            var threadName = BuildAskResponseThreadName(question, originalResponse.Id, sectionCount);
            return await textChannel.CreateThreadAsync(
                threadName,
                ThreadType.PublicThread,
                ThreadArchiveDuration.OneDay,
                originalResponse);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] failed to create ask thread: {ex.Message}");
            return null;
        }
    }

    private static string FormatSectionMessage(string content, int sectionIndex, int totalSections)
    {
        if (totalSections <= 1)
        {
            return content;
        }

        return $"Part {sectionIndex}/{totalSections}\n\n{content}";
    }

    internal static string BuildAskResponseThreadName(string question, ulong sourceMessageId, int sectionCount)
    {
        var preview = BuildAskThreadPreview(question);
        var shortId = BuildShortBase36Suffix(sourceMessageId, AskThreadIdSuffixLength);
        var trailingSegment = $"-{shortId}-p{sectionCount}";
        var previewLengthBudget = MaxDiscordThreadNameLength - "ask-".Length - trailingSegment.Length;
        if (previewLengthBudget <= 0)
        {
            previewLengthBudget = 1;
        }

        if (preview.Length > previewLengthBudget)
        {
            preview = preview[..previewLengthBudget].Trim('-');
        }

        if (string.IsNullOrWhiteSpace(preview))
        {
            preview = "question";
            if (preview.Length > previewLengthBudget)
            {
                preview = preview[..previewLengthBudget];
            }
        }

        return $"ask-{preview}{trailingSegment}";
    }

    internal static string BuildAskThreadPreview(string question)
    {
        if (string.IsNullOrWhiteSpace(question))
        {
            return "question";
        }

        var builder = new StringBuilder();
        var previousWasHyphen = false;
        foreach (var ch in question.Trim())
        {
            if (ch is >= 'A' and <= 'Z')
            {
                builder.Append(char.ToLowerInvariant(ch));
                previousWasHyphen = false;
            }
            else if (ch is >= 'a' and <= 'z' or >= '0' and <= '9')
            {
                builder.Append(ch);
                previousWasHyphen = false;
            }
            else if (!previousWasHyphen && builder.Length > 0)
            {
                builder.Append('-');
                previousWasHyphen = true;
            }

            if (builder.Length >= AskThreadPreviewMaxLength)
            {
                break;
            }
        }

        var result = builder.ToString().Trim('-');
        return string.IsNullOrWhiteSpace(result) ? "question" : result;
    }

    internal static string BuildShortBase36Suffix(ulong value, int suffixLength)
    {
        const string alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
        if (suffixLength <= 0)
        {
            return "0";
        }

        Span<char> buffer = stackalloc char[13];
        var index = buffer.Length;
        var remaining = value;
        do
        {
            buffer[--index] = alphabet[(int)(remaining % 36)];
            remaining /= 36;
        }
        while (remaining > 0);

        var encoded = new string(buffer[index..]);
        return encoded.Length <= suffixLength
            ? encoded
            : encoded[^suffixLength..];
    }

    internal static bool IsAskResponseThreadName(string? channelName)
    {
        if (string.IsNullOrWhiteSpace(channelName)
            || !channelName.StartsWith("ask-", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var partMarkerIndex = channelName.LastIndexOf("-p", StringComparison.OrdinalIgnoreCase);
        if (partMarkerIndex <= 4 || partMarkerIndex >= channelName.Length - 2)
        {
            return false;
        }

        return int.TryParse(channelName[(partMarkerIndex + 2)..], NumberStyles.None, CultureInfo.InvariantCulture, out var sectionCount)
            && sectionCount > 1;
    }

    internal static string BuildMentionQuestionWithThreadContext(string question, string? threadContext)
    {
        if (string.IsNullOrWhiteSpace(threadContext))
        {
            return question;
        }

        return $"{question}\n\nThread context so far (oldest to newest):\n--- THREAD_CONTEXT_START ---\n{threadContext}\n--- THREAD_CONTEXT_END ---";
    }

    private static async Task<string?> TryBuildThreadHistoryContextAsync(SocketThreadChannel threadChannel, SocketMessage currentMessage)
    {
        try
        {
            var messages = await threadChannel.GetMessagesAsync(limit: MentionThreadHistoryFetchLimit).FlattenAsync();
            return BuildThreadHistoryContextFromMessages(messages, currentMessage.Id);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] failed to load ask-thread history context: {ex.Message}");
            return null;
        }
    }

    internal static string? BuildThreadHistoryContextFromMessages(IEnumerable<IMessage> messages, ulong currentMessageId)
    {
        var orderedLines = messages
            .Where(msg => msg.Id <= currentMessageId)
            .Where(msg => msg.Type is MessageType.Default or MessageType.Reply)
            .Select(msg => new
            {
                msg.Timestamp,
                Content = NormalizeThreadMessageContent(msg.Content),
                Author = string.IsNullOrWhiteSpace(msg.Author?.Username) ? "user" : msg.Author.Username
            })
            .Where(item => !string.IsNullOrWhiteSpace(item.Content))
            .OrderBy(item => item.Timestamp)
            .TakeLast(MentionThreadHistoryLineLimit)
            .Select(item => $"[{item.Author}] {item.Content}")
            .ToArray();

        if (orderedLines.Length == 0)
        {
            return null;
        }

        var builder = new StringBuilder();
        foreach (var line in orderedLines)
        {
            if (builder.Length > 0)
            {
                builder.AppendLine();
            }

            var remaining = MentionThreadHistoryBlockCharLimit - builder.Length;
            if (remaining <= 0)
            {
                break;
            }

            if (line.Length > remaining)
            {
                builder.Append(line[..remaining]);
                break;
            }

            builder.Append(line);
        }

        return builder.Length == 0 ? null : builder.ToString();
    }

    private static string NormalizeThreadMessageContent(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        var singleLine = input.Replace('\r', ' ').Replace('\n', ' ').Trim();
        return singleLine.Length <= MentionThreadHistoryLineContentLimit
            ? singleLine
            : singleLine[..MentionThreadHistoryLineContentLimit];
    }

    private static async Task SafeReplyToMentionAsync(SocketMessage message, string content)
    {
        try
        {
            await message.Channel.SendMessageAsync(
                content,
                messageReference: new MessageReference(message.Id));
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[bot] failed to send mention reply: {ex.Message}");
        }
    }

    private async Task OnMessageReceivedAsync(SocketMessage message)
    {
        if (message.Author.IsBot)
        {
            return;
        }

        if (message.Channel is not SocketThreadChannel threadChannel
            || !IsAskResponseThreadName(threadChannel.Name))
        {
            return;
        }

        if (_client.CurrentUser is null || !message.MentionedUserIds.Contains(_client.CurrentUser.Id))
        {
            return;
        }

        var question = MentionParser.ExtractQuestion(new MentionRequest(
            message.Author.Id.ToString(),
            message.Content,
            _client.CurrentUser.Id));

        if (string.IsNullOrWhiteSpace(question))
        {
            return;
        }

        var userId = message.Author.Id.ToString();
        if (!TryBeginMentionRequest(userId))
        {
            await SafeReplyToMentionAsync(message, MentionBusyMessage);
            return;
        }

        var messageId = message.Id;
        var backgroundTask = RunMentionRequestOffloadedAsync(message, userId, question);
        _activeMentionTasks[messageId] = backgroundTask;

        _ = backgroundTask.ContinueWith(_task =>
        {
            _activeMentionTasks.TryRemove(messageId, out var _removedTask);
            EndMentionRequest(userId);
        }, TaskScheduler.Default);
    }

    private static SlashCommandProperties BuildAskCommand()
    {
        return new SlashCommandBuilder()
            .WithName("ask")
            .WithDescription("Ask lore, level-up, or trope guidance questions grounded in local data.")
            .AddOption("question", ApplicationCommandOptionType.String, "Your question", isRequired: true)
            .AddOption(new SlashCommandOptionBuilder()
                .WithName("intent")
                .WithDescription("Optional intent override")
                .WithType(ApplicationCommandOptionType.String)
                .WithRequired(false)
                .AddChoice("auto", "auto")
                .AddChoice("lore", "lore")
                .AddChoice("levelup", "levelup")
                .AddChoice("trope", "trope"))
            .AddOption("profile_name", ApplicationCommandOptionType.String, "Profile name to load/save", isRequired: false)
            .AddOption("profile_notes", ApplicationCommandOptionType.String, "Notes to save on profile", isRequired: false)
            .AddOption(new SlashCommandOptionBuilder()
                .WithName("current_level")
                .WithDescription("Current level")
                .WithType(ApplicationCommandOptionType.Integer)
                .WithRequired(false)
                .WithMinValue(1)
                .WithMaxValue(20))
            .AddOption("archetype", ApplicationCommandOptionType.String, "Archetype/class", isRequired: false)
            .AddOption("race", ApplicationCommandOptionType.String, "Race", isRequired: false)
            .AddOption("trope", ApplicationCommandOptionType.String, "Character trope/theme", isRequired: false)
            .Build();
    }

    private static Task OnLogAsync(LogMessage msg)
    {
        Console.WriteLine($"[discord] {msg.Severity}: {msg.Message} {msg.Exception}");
        return Task.CompletedTask;
    }
}
