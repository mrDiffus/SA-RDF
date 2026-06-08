import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchArchetypes } from '../../data';
import { Archetype } from '../../types';
import { Zap, Shield, Sword } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { idToSlug } from '../../slugs';

export default function ArchetypesIndexPage() {
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchetypes().then(data => {
      setArchetypes(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Archetype Archives...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Rules', href: '/rules' }, { label: 'Archetypes' }]} />

      <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Archetypes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {archetypes.map((archetype) => (
          <Link
            key={archetype.id}
            to={`/archetypes/${idToSlug(archetype.id)}`}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-600 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-4 group-hover:text-orange-400 transition-colors">
              {archetype.label}
            </h3>

            <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3">
              {Array.isArray(archetype.description) ? archetype.description.join(' ') : archetype.description}
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
                  {archetype.proficiencies.skills.length > 2 && (
                    <span className="text-[10px] text-zinc-600">+{archetype.proficiencies.skills.length - 2} more</span>
                  )}
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
          </Link>
        ))}
      </div>
    </div>
  );
}
