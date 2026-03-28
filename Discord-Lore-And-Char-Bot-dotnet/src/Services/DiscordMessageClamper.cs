namespace DiscordLoreAndCharBotDotnet.Services;

internal static class DiscordMessageClamper
{
    public const int DefaultLimit = 1900;
    private const int MinPreferredSplitDistance = 250;

    public static string Clamp(string text, int limit = DefaultLimit)
    {
        if (text.Length <= limit)
        {
            return text;
        }

        return text[..(limit - 3)] + "...";
    }

    public static IReadOnlyList<string> SplitIntoSections(string text, int limit = DefaultLimit)
    {
        if (string.IsNullOrEmpty(text))
        {
            return [string.Empty];
        }

        if (text.Length <= limit)
        {
            return [text];
        }

        var normalized = text.Replace("\r\n", "\n", StringComparison.Ordinal);
        var sections = new List<string>();
        var cursor = 0;

        while (cursor < normalized.Length)
        {
            var remainingLength = normalized.Length - cursor;
            if (remainingLength <= limit)
            {
                sections.Add(normalized[cursor..]);
                break;
            }

            var window = normalized.Substring(cursor, limit);
            var splitPoint = FindSplitPoint(window);
            if (splitPoint <= 0)
            {
                splitPoint = limit;
            }

            var candidate = normalized.Substring(cursor, splitPoint);
            if (candidate.Length == 0)
            {
                splitPoint = limit;
                candidate = normalized.Substring(cursor, splitPoint);
            }

            sections.Add(candidate);
            cursor += splitPoint;
        }

        return sections;
    }

    private static int FindSplitPoint(string text)
    {
        var preferredBreaks = new[] { "\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " " };
        foreach (var separator in preferredBreaks)
        {
            var index = text.LastIndexOf(separator, StringComparison.Ordinal);
            if (index < MinPreferredSplitDistance)
            {
                continue;
            }

            return index + separator.Length;
        }

        return -1;
    }
}
