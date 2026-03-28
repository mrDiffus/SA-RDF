import React, { useState, useEffect } from 'react';
import { fetchArchetypes, fetchSpells } from '../data';
import { Archetype, Spell } from '../types';
import { Shield, Sword, Zap, BookOpen, Clock, Target, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function renderDescription(description: string | string[]) {
  return Array.isArray(description) ? description.join(' ') : description;
}

interface ArchetypeListProps {
  selectedResourceId?: string;
  onNavigate: (resourceId?: string) => void;
}

export default function ArchetypeList({ selectedResourceId, onNavigate }: ArchetypeListProps) {
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [spellCatalog, setSpellCatalog] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  useEffect(() => {
    fetchArchetypes().then(data => {
      setArchetypes(data);
      setLoading(false);
    });

    fetchSpells().then((data) => {
      setSpellCatalog(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedResourceId) {
      setSelectedArchetype(null);
      return;
    }

    const nextSelectedArchetype = archetypes.find((archetype) => archetype.id === selectedResourceId) ?? null;
    setSelectedArchetype(nextSelectedArchetype);
  }, [selectedResourceId, archetypes]);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Archetype Archives...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Archetypes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {archetypes.map((archetype) => (
          <motion.div
            key={archetype.id}
            layoutId={archetype.id}
            onClick={() => {
              setSelectedArchetype(archetype);
              onNavigate(archetype.id);
            }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl cursor-pointer hover:border-zinc-600 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-4 group-hover:text-orange-400 transition-colors">
              {archetype.label}
            </h3>
            
            <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3">
              {renderDescription(archetype.description)}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Skills
                </span>
                <div className="flex flex-wrap gap-1">
                  {archetype.proficiencies.skills.slice(0, 2).map(skill => (
                    <span key={skill} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{skill}</span>
                  ))}
                  {archetype.proficiencies.skills.length > 2 && <span className="text-[10px] text-zinc-600">+{archetype.proficiencies.skills.length - 2} more</span>}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-1">
                  <Sword className="w-3 h-3" /> Weapons
                </span>
                <div className="flex flex-wrap gap-1">
                  {archetype.proficiencies.weapons.map(weapon => (
                    <span key={weapon} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{weapon}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedArchetype && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedArchetype(null);
                setSelectedSpell(null);
                onNavigate();
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              layoutId={selectedArchetype.id}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 z-[70] shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-4xl font-bold text-white uppercase tracking-tighter mb-2">{selectedArchetype.label}</h3>
                  <span className="text-xs bg-orange-950 text-orange-400 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-orange-900">Archetype</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedArchetype(null);
                    setSelectedSpell(null);
                    onNavigate();
                  }}
                  className="text-zinc-500 hover:text-white transition-colors p-2 bg-zinc-800 rounded-full"
                >
                  <BookOpen className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <section className="space-y-4">
                    <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Description</h4>
                    <p className="text-zinc-300 leading-relaxed italic">"{renderDescription(selectedArchetype.description)}"</p>
                  </section>

                  {selectedArchetype.spellcasting && (
                    <section className="space-y-4">
                      <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Spellcasting</h4>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{selectedArchetype.spellcasting}</p>
                    </section>
                  )}

                  <section className="space-y-4">
                    <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Features</h4>
                    <div className="space-y-4">
                      {selectedArchetype.features.map((feature: any, idx: number) => (
                        <div key={idx} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-bold text-white">{feature.label}</h5>
                            <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{feature.cost}</span>
                          </div>
                          {feature.prerequisites.length > 0 && (
                            <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wide">Prerequisites: {feature.prerequisites.join(', ')}</p>
                          )}
                          <div className="space-y-2">
                            {feature.description.map((desc: string, dIdx: number) => (
                              <p key={dIdx} className="text-sm text-zinc-400 leading-snug">{desc}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section className="space-y-4">
                    <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Proficiencies</h4>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-2">Skills</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedArchetype.proficiencies.skills.map((s: string) => (
                            <span key={s} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-2">Weapons</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedArchetype.proficiencies.weapons.map((s: string) => (
                            <span key={s} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-2">Armor</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedArchetype.proficiencies.armor.map((s: string) => (
                            <span key={s} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-2">Saves</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedArchetype.proficiencies.saves.map((s: string) => (
                            <span key={s} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{s}</span>
                          ))}
                        </div>
                      </div>
                      {selectedArchetype.spellLevels && (
                        <div>
                          <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-2">Spell Levels</span>
                          <div className="space-y-2">
                            {(Object.entries(selectedArchetype.spellLevels) as [string, { id: string; label: string }[]][]).map(([level, levelSpells]) => (
                              <div key={level}>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">{level.replace('spell-level-', 'Level ')}</span>
                                <div className="flex flex-wrap gap-2">
                                  {levelSpells.map((spell) => (
                                    <button
                                      key={spell.id || spell.label}
                                      type="button"
                                      onClick={() => {
                                        const fullSpell = spell.id
                                          ? spellCatalog.find((s) => s.id === spell.id) ?? null
                                          : null;
                                        setSelectedSpell(fullSpell);
                                      }}
                                      className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700 hover:border-orange-500 hover:text-orange-300 transition-colors"
                                    >
                                      {spell.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>

            <AnimatePresence>
              {selectedSpell && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedSpell(null)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
                  />
                  <motion.div
                    layoutId={selectedSpell.id}
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl p-8 z-[90] shadow-2xl"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-3xl font-bold text-white uppercase tracking-tighter mb-2">{selectedSpell.label}</h3>
                        <div className="flex gap-2">
                          {selectedSpell.ritual && (
                            <span className="text-xs bg-orange-950 text-orange-400 px-2 py-1 rounded uppercase tracking-widest font-bold border border-orange-900">Ritual</span>
                          )}
                          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded uppercase tracking-widest font-bold">Spell</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSpell(null)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        <Maximize2 className="w-6 h-6 rotate-45" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8 py-6 border-y border-zinc-800">
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Casting Time</span>
                        <p className="text-zinc-200 font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-zinc-500" />{selectedSpell.castingTime}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Range</span>
                        <p className="text-zinc-200 font-medium flex items-center gap-2"><Target className="w-4 h-4 text-zinc-500" />{selectedSpell.range}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Duration</span>
                        <p className="text-zinc-200 font-medium">{selectedSpell.duration}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Target</span>
                        <p className="text-zinc-200 font-medium">{selectedSpell.target}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Description</span>
                      <p className="text-zinc-300 leading-relaxed">{selectedSpell.description}</p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
