import React, { useState, useEffect } from 'react';
import { fetchRaces } from '../data';
import { Race } from '../types';
import { Users, Info, Heart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RaceListProps {
  selectedResourceId?: string;
  onNavigate: (resourceId?: string) => void;
}

export default function RaceList({ selectedResourceId, onNavigate }: RaceListProps) {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  useEffect(() => {
    fetchRaces().then(data => {
      setRaces(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedResourceId) {
      setSelectedRace(null);
      return;
    }

    const nextSelectedRace = races.find((race) => race.id === selectedResourceId) ?? null;
    setSelectedRace(nextSelectedRace);
  }, [selectedResourceId, races]);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Racial Archives...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Races</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {races.map((race) => (
          <motion.div
            key={race.id}
            layoutId={race.id}
            onClick={() => {
              setSelectedRace(race);
              onNavigate(race.id);
            }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl cursor-pointer hover:border-zinc-600 transition-all group relative overflow-hidden"
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
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedRace && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedRace(null);
                onNavigate();
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              layoutId={selectedRace.id}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 z-[70] shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-4xl font-bold text-white uppercase tracking-tighter mb-2">{selectedRace.label}</h3>
                  <span className="text-xs bg-orange-950 text-orange-400 px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-orange-900">Race</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedRace(null);
                    onNavigate();
                  }}
                  className="text-zinc-500 hover:text-white transition-colors p-2 bg-zinc-800 rounded-full"
                >
                  <Info className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <section className="space-y-4">
                  <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Racial Traits
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedRace.features.map((feature: any, idx: number) => (
                      <div key={idx} className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                        <h5 className="font-bold text-white mb-1">{feature.label}</h5>
                        <div className="space-y-2">
                          {feature.description.map((para: string, pIdx: number) => (
                            <p key={pIdx} className="text-sm text-zinc-400 leading-relaxed">{para}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {selectedRace.relationFeatures && (
                  <section className="space-y-4">
                    <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" /> Relations
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedRace.relationFeatures.map((relation: any, idx: number) => (
                        <div key={idx} className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-800">
                          <h5 className="font-bold text-zinc-300 mb-1">{relation.label}</h5>
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
