import React, { useEffect, useState } from 'react';
import { MapPin, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface PlaceDetail {
  label: string;
  description: string | string[];
  subPlaces?: { label: string; description: string }[];
  attitude?: string[];
}

interface PlaceViewProps {
  planetName: string;
  placeName: string;
  onBack: () => void;
}

function resolveDataPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

async function fetchPlaceData(planetName: string, placeName: string): Promise<PlaceDetail | null> {
  const planetMap: Record<string, string> = {
    'Arrur': '/data/Setting/Planets/Arrur/Places/',
    'Arcech': '/data/Setting/Planets/Arcech/Places/'
  };

  const placesPath = planetMap[planetName];
  if (!placesPath) return null;

  try {
    const res = await fetch(resolveDataPath(`${placesPath}${placeName}.json`));
    if (res.ok) {
      const raw = await res.json();
      return {
        label: raw['label'] as string,
        description: raw['description'] as string | string[],
        subPlaces: (raw['containsPlace'] as Record<string, string>[] | undefined)?.map((p) => ({
          label: p['label'],
          description: p['description'],
        })),
        attitude: raw['attitude'] as string[] | undefined,
      };
    }
  } catch {
    // Place detail not available
  }

  return null;
}

export default function PlaceView({ planetName, placeName, onBack }: PlaceViewProps) {
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPlaceData(planetName, placeName).then(data => {
      setPlace(data);
      setLoading(false);
    });
  }, [planetName, placeName]);

  if (loading) {
    return <div className="text-zinc-500 animate-pulse">Loading place data...</div>;
  }

  if (!place) {
    return <div className="text-red-500">Place not found: {placeName}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header with back button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-purple-800 text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex-1 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">
            <MapPin className="w-3 h-3" /> Place
          </div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tighter">{place.label}</h1>
        </div>
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {Array.isArray(place.description) ? (
          <div className="space-y-3">
            {place.description.map((line, i) => (
              <p key={i} className="text-zinc-300 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-zinc-300 leading-relaxed">{place.description}</p>
        )}
      </motion.div>

      {/* Sub-places/Locations */}
      {place.subPlaces && place.subPlaces.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3 border-b border-zinc-800 pb-3">
            <MapPin className="w-5 h-5 text-purple-500" /> Locations
          </h2>
          <div className="space-y-3">
            {place.subPlaces.map((sub) => (
              <motion.div
                key={sub.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">
                  {sub.label}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{sub.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Attitude */}
      {place.attitude && place.attitude.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 border-t border-zinc-800 pt-6"
        >
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Attitude</h2>
          <div className="space-y-2">
            {place.attitude.map((line, i) => (
              <p key={i} className="text-sm text-zinc-400 italic leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
