import React, { useState, useEffect } from 'react';
import { fetchSpells } from '../data';
import { Spell } from '../types';
import { Search, Clock, Target, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SpellListProps {
  selectedResourceId?: string;
  onNavigate: (resourceId?: string) => void;
}

export default function SpellList({ selectedResourceId, onNavigate }: SpellListProps) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  useEffect(() => {
    fetchSpells().then(data => {
      setSpells(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedResourceId) {
      setSelectedSpell(null);
      return;
    }

    const nextSelectedSpell = spells.find((spell) => spell.id === selectedResourceId) ?? null;
    setSelectedSpell(nextSelectedSpell);
  }, [selectedResourceId, spells]);

  const normalizedSearch = search.toLowerCase();
  const filteredSpells = spells.filter((spell) => {
    const spellLabel = spell.label ?? '';
    const spellDescription = spell.description ?? '';

    return (
      spellLabel.toLowerCase().includes(normalizedSearch) ||
      spellDescription.toLowerCase().includes(normalizedSearch)
    );
  });

  const groupedSpells = filteredSpells.reduce<Map<number, Spell[]>>((groups, spell) => {
    const level = Number.isInteger(spell.level) ? (spell.level as number) : -1;
    const bucket = groups.get(level);

    if (bucket) {
      bucket.push(spell);
    } else {
      groups.set(level, [spell]);
    }

    return groups;
  }, new Map<number, Spell[]>());

  const sortedLevels = Array.from<number>(groupedSpells.keys()).sort((a, b) => {
    if (a === -1) return 1;
    if (b === -1) return -1;
    return a - b;
  });

  const getLevelLabel = (level: number) => {
    if (level === 0) return 'Cantrips';
    if (level < 0) return 'Unknown Level';
    return `Level ${level}`;
  };

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Spell Archives...</div>;

  return (
    <div className="space-y-6">
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
                <motion.div
                  key={spell.id}
                  layoutId={spell.id}
                  onClick={() => {
                    setSelectedSpell(spell);
                    onNavigate(spell.id);
                  }}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg cursor-pointer hover:border-zinc-600 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{spell.label}</h3>
                    {spell.ritual && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-widest font-bold">Ritual</span>
                    )}
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
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <AnimatePresence>
        {selectedSpell && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedSpell(null);
                onNavigate();
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              layoutId={selectedSpell.id}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-8 z-[70] shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-white uppercase tracking-tighter mb-2">{selectedSpell.label}</h3>
                  <div className="flex gap-2">
                    {selectedSpell.ritual && (
                      <span className="text-xs bg-orange-950 text-orange-400 px-2 py-1 rounded uppercase tracking-widest font-bold border border-orange-900">Ritual</span>
                    )}
                    {selectedSpell.level !== undefined && (
                      <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded uppercase tracking-widest font-bold">
                        {selectedSpell.level === 0 ? 'Cantrip' : `Level ${selectedSpell.level}`}
                      </span>
                    )}
                    <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded uppercase tracking-widest font-bold">Spell</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedSpell(null);
                    onNavigate();
                  }}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <Maximize2 className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 py-6 border-y border-zinc-800">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Casting Time</span>
                  <p className="text-zinc-200 font-medium">{selectedSpell.castingTime}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Range</span>
                  <p className="text-zinc-200 font-medium">{selectedSpell.range || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Duration</span>
                  <p className="text-zinc-200 font-medium">{selectedSpell.duration || '—'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Target</span>
                  <p className="text-zinc-200 font-medium">{selectedSpell.target || '—'}</p>
                </div>
                {selectedSpell.damageType && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Damage</span>
                    <p className="text-zinc-200 font-medium">
                      {selectedSpell.damage ? `${selectedSpell.damage} ` : ''}
                      <span className="capitalize">{selectedSpell.damageType}</span>
                    </p>
                  </div>
                )}
                {selectedSpell.levelScaling && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Scales</span>
                    <p className="text-zinc-200 font-medium capitalize">{selectedSpell.levelScaling}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Description</span>
                <p className="text-zinc-300 leading-relaxed">{selectedSpell.description || '—'}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
