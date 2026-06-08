import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { fetchRaces } from '../../data';
import { Race } from '../../types';
import { Users, Zap, Heart } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { idToSlug } from '../../slugs';

export default function RaceDetailPage() {
  const { raceSlug } = useParams<{ raceSlug: string }>();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRaces().then(data => {
      setRaces(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Racial Archives...</div>;

  const race = races.find(r => idToSlug(r.id) === raceSlug);
  if (!race) return <Navigate to="/races" replace />;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Breadcrumb items={[
        { label: 'Rules', href: '/rules' },
        { label: 'Races', href: '/races' },
        { label: race.label },
      ]} />

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
          <Users className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-5xl font-bold text-white uppercase tracking-tighter">{race.label}</h1>
          <span className="text-xs bg-orange-950 text-orange-400 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-orange-900 mt-2 inline-block">Race</span>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Racial Traits
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {race.features.map((feature: any, idx: number) => (
            <div key={idx} className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
              <h3 className="font-bold text-white mb-2">{feature.label}</h3>
              <div className="space-y-2">
                {feature.description.map((para: string, pIdx: number) => (
                  <p key={pIdx} className="text-sm text-zinc-400 leading-relaxed">{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {race.relationFeatures && (
        <section className="space-y-4">
          <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Heart className="w-4 h-4" /> Relations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {race.relationFeatures.map((relation: any, idx: number) => (
              <div key={idx} className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                <h3 className="font-bold text-zinc-300 mb-1">{relation.label}</h3>
                <div className="space-y-1">
                  {relation.description.map((para: string, pIdx: number) => (
                    <p key={pIdx} className="text-xs text-zinc-500 leading-relaxed italic">{para}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
