import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSpells } from '../../data';
import { Spell } from '../../types';
import { Search, Clock, Target } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { idToSlug } from '../../slugs';

function getLevelLabel(level: number) {
  if (level === 0) return 'Cantrips';
  return `Level ${level}`;
}

export default function SpellsIndexPage() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSpells().then(data => {
      setSpells(data);
      setLoading(false);
    });
  }, []);

  const normalizedSearch = search.toLowerCase();
  const filteredSpells = spells.filter(spell =>
    (spell.label ?? '').toLowerCase().includes(normalizedSearch) ||
    (spell.description ?? '').toLowerCase().includes(normalizedSearch)
  );

  const groupedSpells = filteredSpells.reduce<Map<number, Spell[]>>((groups, spell) => {
    const bucket = groups.get(spell.spellLevel);
    if (bucket) bucket.push(spell);
    else groups.set(spell.spellLevel, [spell]);
    return groups;
  }, new Map());

  const sortedLevels = Array.from(groupedSpells.keys()).sort((a, b) => {
    if (a === -1) return 1;
    if (b === -1) return -1;
    return a - b;
  });

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Spell Archives...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Rules', href: '/rules' }, { label: 'Spells' }]} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Spells</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search spells..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-8">
        {sortedLevels.map((level) => (
          <section key={level} className="space-y-4">
            <h3 className="text-xl font-bold text-zinc-200 uppercase tracking-wider border-b border-zinc-800 pb-2">
              {getLevelLabel(level)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedSpells.get(level)?.map((spell) => (
                <Link
                  key={spell.id}
                  to={`/spells/${idToSlug(spell.id)}`}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg hover:border-zinc-600 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{spell.label}</h3>
                    <div className="flex gap-1 shrink-0">
                      {spell.ritual && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-widest font-bold">Ritual</span>
                      )}
                      <span className="text-[10px] bg-purple-950 text-purple-400 px-2 py-0.5 rounded uppercase tracking-widest font-bold">Lvl {spell.spellLevel}</span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-4">{spell.description}</p>
                  <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500 uppercase font-bold tracking-wider">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {spell.castingTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {spell.range}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
