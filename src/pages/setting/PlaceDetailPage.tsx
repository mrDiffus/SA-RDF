import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

interface PlaceDetail {
  label: string;
  description: string | string[];
  subPlaces?: { label: string; description: string }[];
  attitude?: string[];
}

function resolveDataPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

const PLANET_FOLDER_MAP: Record<string, string> = {
  arrur: 'Arrur',
  arcech: 'Arcech',
};

async function fetchPlace(planetSlug: string, placeSlug: string): Promise<PlaceDetail | null> {
  const folderName = PLANET_FOLDER_MAP[planetSlug.toLowerCase()] ?? planetSlug;
  const cleanSlug = placeSlug.startsWith('location:') ? placeSlug.slice('location:'.length) : placeSlug;
  const path = `/data/Setting/Planets/${folderName}/Places/${cleanSlug}.json`;

  try {
    const res = await fetch(resolveDataPath(path));
    if (!res.ok) return null;
    const raw = await res.json();
    const node = raw['@graph']?.[0] ?? raw;
    const containsLocation = node['sa:containsLocation'] as Record<string, string>[] | undefined;
    return {
      label: node['rdfs:label'] as string,
      description: node['schema:description'] as string | string[],
      subPlaces: containsLocation?.map(p => ({
        label: p['rdfs:label'],
        description: p['schema:description'],
      })),
      attitude: node['sa:attitude'] as string[] | undefined,
    };
  } catch {
    return null;
  }
}

export default function PlaceDetailPage() {
  const { planetSlug, placeSlug } = useParams<{ planetSlug: string; placeSlug: string }>();
  const [place, setPlace] = useState<PlaceDetail | null | undefined>(undefined);
  const [planetLabel, setPlanetLabel] = useState<string>('');

  useEffect(() => {
    if (!planetSlug || !placeSlug) return;
    // Derive display label for the planet
    setPlanetLabel(PLANET_FOLDER_MAP[planetSlug.toLowerCase()] ?? planetSlug);
    fetchPlace(planetSlug, placeSlug).then(setPlace);
  }, [planetSlug, placeSlug]);

  if (place === undefined) return <div className="text-zinc-500 animate-pulse">Loading place data...</div>;
  if (place === null) return <Navigate to={`/setting/planets/${planetSlug}`} replace />;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Breadcrumb items={[
        { label: 'Setting', href: '/setting' },
        { label: 'Planets', href: '/setting/planets' },
        { label: planetLabel, href: `/setting/planets/${planetSlug}` },
        { label: place.label },
      ]} />

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">
          <MapPin className="w-3 h-3" /> Place
        </div>
        <h1 className="text-4xl font-bold text-white uppercase tracking-tighter">{place.label}</h1>
      </div>

      <div>
        {Array.isArray(place.description) ? (
          <div className="space-y-3">
            {place.description.map((line, i) => (
              <p key={i} className="text-zinc-300 leading-relaxed">{line}</p>
            ))}
          </div>
        ) : (
          <p className="text-zinc-300 leading-relaxed">{place.description}</p>
        )}
      </div>

      {place.subPlaces && place.subPlaces.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3 border-b border-zinc-800 pb-3">
            <MapPin className="w-5 h-5 text-purple-500" /> Locations
          </h2>
          <div className="space-y-3">
            {place.subPlaces.map((sub) => (
              <div key={sub.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-2">{sub.label}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{sub.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {place.attitude && place.attitude.length > 0 && (
        <section className="space-y-3 border-t border-zinc-800 pt-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">Attitude</h2>
          <div className="space-y-2">
            {place.attitude.map((line, i) => (
              <p key={i} className="text-sm text-zinc-400 italic leading-relaxed">{line}</p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
