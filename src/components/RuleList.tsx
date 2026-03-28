import React, { useState, useEffect } from 'react';
import { fetchRules } from '../data';
import { RuleSection, RuleContent } from '../types';
import { Book, ChevronRight } from 'lucide-react';

export default function RuleList() {
  const [rules, setRules] = useState<RuleSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules().then(data => {
      setRules(data);
      setLoading(false);
    });
  }, []);

  const renderContent = (content: RuleContent, depth = 0) => {
    if (content.type === 'paragraph') {
      return <p key={content.text} className="text-zinc-400 leading-relaxed mb-4">{content.text}</p>;
    }

    if (content.type === 'table') {
      return (
        <div key={content.title} className="space-y-3">
          <h5 className="text-sm font-bold uppercase tracking-widest text-zinc-300">{content.title}</h5>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm text-left text-zinc-300">
              {content.headers.length > 0 && (
                <thead className="bg-zinc-800/70 text-zinc-200">
                  <tr>
                    {content.headers.map((header) => (
                      <th key={header} className="px-3 py-2 font-semibold uppercase tracking-wide text-[11px]">{header}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {content.rows.map((row, rowIndex) => (
                  <tr key={`${content.title}-${rowIndex}`} className="border-t border-zinc-800/80 odd:bg-zinc-900/40 even:bg-zinc-900/20">
                    {row.map((cell, cellIndex) => (
                      <td key={`${content.title}-${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top">{cell || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    return (
      <div key={content.text} className={`space-y-4 ${depth > 0 ? 'ml-6 mt-4' : ''}`}>
        <h4 className={`font-bold text-white uppercase tracking-tight ${depth === 0 ? 'text-xl border-b border-zinc-800 pb-2 mb-6' : 'text-lg text-orange-400'}`}>
          {content.text}
        </h4>
        {content.content.map(c => renderContent(c, depth + 1))}
      </div>
    );
  };

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Rule Archives...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex items-center gap-4 mb-8">
        <Book className="w-10 h-10 text-orange-500" />
        <h2 className="text-4xl font-bold text-white uppercase tracking-tighter">Core Rules</h2>
      </div>

      {rules.map((section) => (
        <section key={section.id} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl">
          <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-8 flex items-center gap-3">
            <ChevronRight className="w-6 h-6 text-orange-500" />
            {section.label}
          </h3>
          <div className="space-y-8">
            {section.content.map(content => renderContent(content))}
          </div>
        </section>
      ))}
    </div>
  );
}
