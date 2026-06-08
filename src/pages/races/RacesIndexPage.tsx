import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchRaces } from '../../data';
import { Race } from '../../types';
import { Users } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { idToSlug } from '../../slugs';

export default function RacesIndexPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRaces().then(data => {
      setRaces(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Racial Archives...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Rules', href: '/rules' }, { label: 'Races' }]} />

      <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Races</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {races.map((race) => (
          <Link
            key={race.id}
            to={`/races/${idToSlug(race.id)}`}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-600 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-20 h-20 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-4 group-hover:text-orange-400 transition-colors">
              {race.label}
            </h3>

            <div className="space-y-3">
              {race.features.slice(0, 2).map((feature: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{feature.label}</span>
                  <p className="text-xs text-zinc-400 line-clamp-2">{feature.description[0]}</p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
