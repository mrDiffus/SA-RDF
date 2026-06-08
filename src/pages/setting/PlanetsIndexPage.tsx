import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, ChevronRight } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

interface Planet {
  label: string;
  description: string;
  genre?: string;
  keywords?: string[];
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

export default function PlanetsIndexPage() {
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const index = await fetch(resolveDataPath('/data/resource-index.json')).then(r => r.json()) as { resources: ResourceIndexEntry[] };
      const entries = index.resources.filter(
        r => r.file.startsWith('Setting/Planets/') && !r.file.includes('/Places/')
      );
      const data = await Promise.all(
        entries.map(e => fetch(resolveDataPath(`/data/${e.file}`)).then(r => r.json()).catch(() => null))
      );
      setPlanets(data.filter(Boolean).map((raw: any) => {
        const node = raw['@graph']?.[0] ?? raw;
        return {
          label: node['rdfs:label'] as string,
          description: (node['schema:description'] ?? '') as string,
          genre: node['schema:genre'] as string | undefined,
          keywords: node['schema:keywords'] as string[] | undefined,
        };
      }));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Planetary Archives...</div>;

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Setting', href: '/setting' }, { label: 'Planets' }]} />

      <h2 className="text-3xl font-bold text-white uppercase tracking-tighter flex items-center gap-3">
        <Globe className="w-8 h-8 text-purple-500" /> Planets
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {planets.map((planet) => (
          <Link
            key={planet.label}
            to={`/setting/planets/${planet.label.toLowerCase()}`}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-800 transition-colors group space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-900/30 border border-purple-800/50 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors mt-1" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight group-hover:text-purple-300 transition-colors">
                {planet.label}
              </h3>
              {planet.genre && (
                <span className="text-[10px] text-purple-500 uppercase font-bold tracking-widest">{planet.genre}</span>
              )}
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{planet.description}</p>
            {planet.keywords && planet.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                {planet.keywords.slice(0, 5).map((kw) => (
                  <span key={kw} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700 uppercase tracking-wider">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
