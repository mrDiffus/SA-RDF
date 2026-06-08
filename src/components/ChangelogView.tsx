import React, { useEffect, useState } from 'react';

function resolveDataPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

export default function ChangelogView() {
  const [changelogContent, setChangelogContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const response = await fetch(resolveDataPath('/data/CHANGELOG.md'));
        if (!response.ok) {
          throw new Error('Failed to load changelog');
        }
        const content = await response.text();
        setChangelogContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    void fetchChangelog();
  }, []);

  if (loading) {
    return <div className="text-center text-zinc-400">Loading changelog...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400">Error: {error}</div>;
  }

  return (
    <div className="space-y-8">

      <div className="prose prose-invert max-w-none">
        <article className="space-y-6 text-zinc-300">
          {changelogContent.split('\n').map((line, idx) => {
            if (!line.trim()) {
              return <div key={idx} className="h-2" />;
            }

            if (line.startsWith('# ')) {
              return (
                <h1 key={idx} className="text-4xl font-bold text-white uppercase tracking-tight mt-8 mb-4">
                  {line.slice(2)}
                </h1>
              );
            }

            if (line.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-2xl font-bold text-orange-400 uppercase tracking-tight mt-8 mb-4">
                  {line.slice(3)}
                </h2>
              );
            }

            if (line.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-xl font-bold text-purple-400 uppercase tracking-tight mt-6 mb-3">
                  {line.slice(4)}
                </h3>
              );
            }

            if (line.startsWith('- ')) {
              return (
                <div key={idx} className="ml-4 flex gap-3">
                  <span className="text-orange-500 font-bold mt-0.5">•</span>
                  <p className="text-zinc-300">{line.slice(2)}</p>
                </div>
              );
            }

            if (line.startsWith('  - ')) {
              return (
                <div key={idx} className="ml-8 flex gap-3">
                  <span className="text-zinc-600 font-bold mt-0.5">◦</span>
                  <p className="text-zinc-400 text-sm">{line.slice(4)}</p>
                </div>
              );
            }

            if (line.startsWith('**')) {
              return (
                <p key={idx} className="text-zinc-300 font-semibold">
                  {line}
                </p>
              );
            }

            return (
              <p key={idx} className="text-zinc-300 leading-relaxed">
                {line}
              </p>
            );
          })}
        </article>
      </div>
    </div>
  );
}
