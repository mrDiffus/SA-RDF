import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Globe, MapPin, ChevronRight } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

interface SettingPlace {
  label: string;
  description: string;
  id?: string;
}

interface Planet {
  label: string;
  slug: string;
  description: string;
  genre?: string;
  keywords?: string[];
  places?: SettingPlace[];
}

interface ResourceIndexEntry {
  file: string;
  '@type': string;
  'rdfs:label': string;
  '@id': string | null;
}

function resolveDataPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

async function fetchPlanet(planetSlug: string): Promise<Planet | null> {
  const index = await fetch(resolveDataPath('/data/resource-index.json')).then(r => r.json()) as { resources: ResourceIndexEntry[] };
  const entry = index.resources.find(
    r => r.file.startsWith('Setting/Planets/') &&
      !r.file.includes('/Places/') &&
      r.file.toLowerCase().includes(`/${planetSlug}/`)
  );
  if (!entry) return null;

  try {
    const raw = await fetch(resolveDataPath(`/data/${entry.file}`)).then(r => r.json());
    const node = raw['@graph']?.[0] ?? raw;
    const hasPart = node['schema:hasPart'] as Record<string, unknown>[] | undefined;
    return {
      label: node['rdfs:label'] as string,
      slug: planetSlug,
      description: (node['schema:description'] ?? '') as string,
      genre: node['schema:genre'] as string | undefined,
      keywords: node['schema:keywords'] as string[] | undefined,
      places: hasPart?.map(p => ({
        label: p['rdfs:label'] as string,
        description: (p['schema:description'] ?? '') as string,
        id: p['@id'] as string | undefined,
      })),
    };
  } catch {
    return null;
  }
}

export default function PlanetDetailPage() {
  const { planetSlug } = useParams<{ planetSlug: string }>();
  const [planet, setPlanet] = useState<Planet | null | undefined>(undefined);

  useEffect(() => {
    if (planetSlug) fetchPlanet(planetSlug).then(setPlanet);
  }, [planetSlug]);

  if (planet === undefined) return <div className="text-zinc-500 animate-pulse">Loading planet data...</div>;
  if (planet === null) return <Navigate to="/setting/planets" replace />;

  return (
    <div className="space-y-8">
      <Breadcrumb items={[
        { label: 'Setting', href: '/setting' },
        { label: 'Planets', href: '/setting/planets' },
        { label: planet.label },
      ]} />

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-purple-800 text-[10px] uppercase font-bold tracking-[0.2em] text-purple-400">
          <Globe className="w-3 h-3" /> Planet
        </div>
        <h1 className="text-5xl font-bold text-white uppercase tracking-tighter">{planet.label}</h1>
        {planet.genre && (
          <p className="text-sm text-purple-400 uppercase font-bold tracking-widest">{planet.genre}</p>
        )}
      </div>

      <p className="text-lg text-zinc-300 leading-relaxed">{planet.description}</p>

      {planet.keywords && planet.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {planet.keywords.map((kw) => (
            <span key={kw} className="text-[10px] bg-zinc-800 text-zinc-400 px-3 py-1 rounded border border-zinc-700 uppercase tracking-wider">
              {kw}
            </span>
          ))}
        </div>
      )}

      {planet.places && planet.places.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <MapPin className="w-6 h-6 text-purple-500" /> Notable Places
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planet.places.map((place) => {
              const placeSlug = place.id?.split('/').pop() || place.label.toLowerCase().replace(/\s+/g, '-');
              return (
                <Link
                  key={place.label}
                  to={`/setting/planets/${planetSlug}/${placeSlug}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-purple-700 transition-colors group space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight group-hover:text-purple-300 transition-colors flex-1">
                      {place.label}
                    </h3>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0 mt-1" />
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{place.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
