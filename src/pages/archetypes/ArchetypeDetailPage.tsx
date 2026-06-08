import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { fetchArchetypes, fetchSpells } from '../../data';
import { Archetype, Spell } from '../../types';
import { Shield, Sword, Zap, BookOpen } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { idToSlug } from '../../slugs';

export default function ArchetypeDetailPage() {
  const { archetypeSlug } = useParams<{ archetypeSlug: string }>();
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [spellCatalog, setSpellCatalog] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchArchetypes(), fetchSpells()]).then(([a, s]) => {
      setArchetypes(a);
      setSpellCatalog(s);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Archetype Archives...</div>;

  const archetype = archetypes.find(a => idToSlug(a.id) === archetypeSlug);
  if (!archetype) return <Navigate to="/archetypes" replace />;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Breadcrumb items={[
        { label: 'Rules', href: '/rules' },
        { label: 'Archetypes', href: '/archetypes' },
        { label: archetype.label },
      ]} />

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
          <Zap className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-5xl font-bold text-white uppercase tracking-tighter">{archetype.label}</h1>
          <span className="text-xs bg-orange-950 text-orange-400 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-orange-900 mt-2 inline-block">Archetype</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Description</h2>
            <p className="text-zinc-300 leading-relaxed italic">
              "{Array.isArray(archetype.description) ? archetype.description.join(' ') : archetype.description}"
            </p>
          </section>

          {archetype.spellcasting && (
            <section className="space-y-4">
              <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Spellcasting</h2>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{archetype.spellcasting}</p>
            </section>
          )}

          <section className="space-y-4">
            <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Features</h2>
            <div className="space-y-4">
              {archetype.features.map((feature: any, idx: number) => (
                <div key={idx} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-white">{feature.label}</h3>
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
            <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Proficiencies</h2>
            <div className="space-y-4">
              {[
                { label: 'Skills', icon: Shield, items: archetype.proficiencies.skills },
                { label: 'Weapons', icon: Sword, items: archetype.proficiencies.weapons },
                { label: 'Armor', icon: Shield, items: archetype.proficiencies.armor },
                { label: 'Saves', icon: BookOpen, items: archetype.proficiencies.saves },
              ].map(({ label, items }) => (
                <div key={label}>
                  <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-2">{label}</span>
                  <div className="flex flex-wrap gap-2">
                    {items.map((s: string) => (
                      <span key={s} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{s}</span>
                    ))}
                  </div>
                </div>
              ))}

              {archetype.spellLevelAccess && archetype.spellLevelAccess.length > 0 && (
                <div>
                  <span className="text-[10px] text-zinc-600 uppercase font-bold block mb-2">Accessible Spell Levels</span>
                  <div className="flex gap-2 flex-wrap">
                    {archetype.spellLevelAccess.map((level) => (
                      <span key={level} className="text-xs bg-purple-900 text-purple-300 px-3 py-1 rounded">
                        Level {level}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 space-y-3">
                    <span className="text-[10px] text-zinc-600 uppercase font-bold block">Available Spells</span>
                    {archetype.spellLevelAccess.map((level) => {
                      const spellsAtLevel = spellCatalog.filter(spell => spell.spellLevel === level);
                      return (
                        <div key={level}>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wide block mb-1">
                            Level {level} ({spellsAtLevel.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {spellsAtLevel.slice(0, 5).map((spell) => (
                              <Link
                                key={spell.id}
                                to={`/spells/${idToSlug(spell.id)}`}
                                className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700 hover:border-purple-500 hover:text-purple-300 transition-colors"
                              >
                                {spell.label}
                              </Link>
                            ))}
                            {spellsAtLevel.length > 5 && (
                              <Link to="/spells" className="text-xs text-zinc-500 hover:text-zinc-300">
                                +{spellsAtLevel.length - 5} more
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
