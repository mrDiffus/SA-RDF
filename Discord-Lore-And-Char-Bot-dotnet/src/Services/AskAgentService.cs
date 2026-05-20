#pragma warning disable SKEXP0110

using DiscordLoreAndCharBotDotnet.Models;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Agents;
using Microsoft.SemanticKernel.ChatCompletion;

namespace DiscordLoreAndCharBotDotnet.Services;

internal sealed class AskAgentService : IAskAgentService
{
    private readonly ChatCompletionAgent _agent;

    public AskAgentService(ChatCompletionAgent agent)
    {
        _agent = agent;
    }

    /// <summary>
    /// Invoke the agent for a single-turn slash command question.
    /// </summary>
    public async Task<string> AnswerAsync(string question, CancellationToken cancellationToken)
    {
        var thread = new ChatHistoryAgentThread();
        return await InvokeAgentAsync(question, thread, cancellationToken);
    }

    /// <summary>
    /// Invoke the agent for a mention reply, pre-seeding the thread with prior Discord conversation history.
    /// </summary>
    public async Task<string> AnswerWithHistoryAsync(
        string question,
        IEnumerable<ConversationTurn> history,
        CancellationToken cancellationToken)
    {
        var chatHistory = new ChatHistory();
        foreach (var turn in history)
        {
            chatHistory.Add(new ChatMessageContent(
                turn.IsAssistant ? AuthorRole.Assistant : AuthorRole.User,
                turn.Content));
        }

        var thread = new ChatHistoryAgentThread(chatHistory);
        return await InvokeAgentAsync(question, thread, cancellationToken);
    }

    private async Task<string> InvokeAgentAsync(
        string question,
        ChatHistoryAgentThread thread,
        CancellationToken cancellationToken)
    {
        var userMessage = new ChatMessageContent(AuthorRole.User, question);
        var responseBuilder = new System.Text.StringBuilder();

        await foreach (var response in _agent.InvokeAsync(userMessage, thread, cancellationToken: cancellationToken))
        {
            if (response.Message.Role == AuthorRole.Assistant)
            {
                responseBuilder.Append(response.Message.Content);
            }
        }

        var result = responseBuilder.ToString().Trim();
        if (string.IsNullOrWhiteSpace(result))
        {
            return "I could not generate a response. Please try again.";
        }

        return result;
    }
}
