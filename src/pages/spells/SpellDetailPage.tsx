import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { fetchSpells } from '../../data';
import { Spell } from '../../types';
import { Clock, Target } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { idToSlug } from '../../slugs';

export default function SpellDetailPage() {
  const { spellSlug } = useParams<{ spellSlug: string }>();
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpells().then(data => {
      setSpells(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Spell Archives...</div>;

  const spell = spells.find(s => idToSlug(s.id) === spellSlug);
  if (!spell) return <Navigate to="/spells" replace />;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Breadcrumb items={[
        { label: 'Rules', href: '/rules' },
        { label: 'Spells', href: '/spells' },
        { label: spell.label },
      ]} />

      <div>
        <h1 className="text-5xl font-bold text-white uppercase tracking-tighter mb-3">{spell.label}</h1>
        <div className="flex gap-2">
          {spell.ritual && (
            <span className="text-xs bg-orange-950 text-orange-400 px-2 py-1 rounded uppercase tracking-widest font-bold border border-orange-900">Ritual</span>
          )}
          <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded uppercase tracking-widest font-bold">
            {spell.spellLevel === 0 ? 'Cantrip' : `Level ${spell.spellLevel}`}
          </span>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded uppercase tracking-widest font-bold">Spell</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-zinc-800">
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Casting Time</span>
          <p className="text-zinc-200 font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-zinc-500" />{spell.castingTime}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Range</span>
          <p className="text-zinc-200 font-medium flex items-center gap-2"><Target className="w-4 h-4 text-zinc-500" />{spell.range || '—'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Duration</span>
          <p className="text-zinc-200 font-medium">{spell.duration || '—'}</p>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Target</span>
          <p className="text-zinc-200 font-medium">{spell.target || '—'}</p>
        </div>
        {spell.damageType && (
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Damage</span>
            <p className="text-zinc-200 font-medium">
              {spell.damage ? `${spell.damage} ` : ''}
              <span className="capitalize">{spell.damageType}</span>
            </p>
          </div>
        )}
        {spell.levelScaling && (
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Scales</span>
            <p className="text-zinc-200 font-medium capitalize">{spell.levelScaling}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Summary</span>
          <p className="text-zinc-300 leading-relaxed">{spell.description || '—'}</p>
        </div>
        {spell.effect && (
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Effect</span>
            <p className="text-zinc-300 leading-relaxed">{spell.effect}</p>
          </div>
        )}
      </div>
    </div>
  );
}
