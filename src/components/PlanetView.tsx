import React, { useEffect, useState } from 'react';
import { Globe, MapPin, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingPlace {
  label: string;
  description: string;
  id?: string;
}

interface Planet {
  label: string;
  description: string;
  genre?: string;
  keywords?: string[];
  about?: Record<string, unknown>;
  places?: SettingPlace[];
  placesPath?: string;
}

interface PlanetViewProps {
  planetName: string;
  onNavigateToPlace: (planetName: string, placeName: string) => void;
}

function resolveDataPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

async function fetchPlanetData(planetName: string): Promise<Planet | null> {
  // Map planet names to file paths
  const planetMap: Record<string, { file: string; placesPath: string }> = {
    'Arrur': {
      file: '/data/Setting/Planets/Arrur/arrur.json',
      placesPath: '/data/Setting/Planets/Arrur/Places/'
    },
    'Arcech': {
      file: '/data/Setting/Planets/Arcech/arcech.json',
      placesPath: '/data/Setting/Planets/Arcech/Places/'
    }
  };

  const planetInfo = planetMap[planetName];
  if (!planetInfo) return null;

  try {
    const raw = await fetch(resolveDataPath(planetInfo.file)).then(r => r.json());

    const hasPart = raw['hasPart'] as Record<string, unknown>[] | undefined;
    return {
      label: raw['label'] as string,
      description: (raw['description'] as string) ?? '',
      genre: raw['genre'] as string | undefined,
      keywords: raw['keywords'] as string[] | undefined,
      about: raw['about'] as Record<string, unknown> | undefined,
      places: hasPart?.map((p) => ({
        label: p['label'] as string,
        description: p['description'] as string ?? '',
        id: p['@id'] as string | undefined,
      })),
      placesPath: resolveDataPath(planetInfo.placesPath),
    };
  } catch {
    return null;
  }
}

export default function PlanetView({ planetName, onNavigateToPlace }: PlanetViewProps) {
  const [planet, setPlanet] = useState<Planet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchPlanetData(planetName).then(data => {
      setPlanet(data);
      setLoading(false);
    });
  }, [planetName]);

  if (loading) {
    return <div className="text-zinc-500 animate-pulse">Loading planet data...</div>;
  }

  if (!planet) {
    return <div className="text-red-500">Planet not found: {planetName}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-purple-800 text-[10px] uppercase font-bold tracking-[0.2em] text-purple-400"
        >
          <Globe className="w-3 h-3" /> Planet
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <h1 className="text-5xl font-bold text-white uppercase tracking-tighter">{planet.label}</h1>
          {planet.genre && (
            <p className="text-sm text-purple-400 uppercase font-bold tracking-widest">{planet.genre}</p>
          )}
        </motion.div>
      </div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="prose prose-invert max-w-none"
      >
        <p className="text-lg text-zinc-300 leading-relaxed">{planet.description}</p>
      </motion.div>

      {/* Keywords */}
      {planet.keywords && planet.keywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2"
        >
          {planet.keywords.map((kw) => (
            <span
              key={kw}
              className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded border border-zinc-700 uppercase tracking-wider"
            >
              {kw}
            </span>
          ))}
        </motion.div>
      )}

      {/* Places */}
      {planet.places && planet.places.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <MapPin className="w-6 h-6 text-purple-500" /> Notable Places
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planet.places.map((place) => (
              <motion.button
                key={place.label}
                type="button"
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  const slug = place.id?.split('/').pop() || place.label;
                  onNavigateToPlace(planetName, slug);
                }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-left hover:border-purple-700 transition-colors group space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-purple-300 transition-colors flex-1">
                    {place.label}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0 mt-1" />
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{place.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}
