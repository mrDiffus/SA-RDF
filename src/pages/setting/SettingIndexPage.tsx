import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Building2, ChevronRight } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

interface Planet {
  label: string;
  description: string;
  genre?: string;
  keywords?: string[];
}

interface Organization {
  label: string;
  folderName: string;
  description: string;
  roles?: { label: string }[];
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

async function fetchSettingOverview() {
  const index = await fetch(resolveDataPath('/data/resource-index.json')).then(r => r.json()) as { resources: ResourceIndexEntry[] };
  const resources = index.resources;

  const planetEntries = resources.filter(
    r => r.file.startsWith('Setting/Planets/') && r.file.indexOf('/Places/') === -1
  );
  const orgEntries = resources.filter(r => r['@type'] === 'sa:Organization');

  const [planets, orgs] = await Promise.all([
    Promise.all(
      planetEntries.map(entry =>
        fetch(resolveDataPath(`/data/${entry.file}`)).then(r => r.json()).catch(() => null)
      )
    ),
    Promise.all(
      orgEntries.map(orgEntry => {
        const folderName = orgEntry.file.split('/')[2];
        return fetch(resolveDataPath(`/data/${orgEntry.file}`))
          .then(r => r.json())
          .then(data => ({ ...data, folderName }))
          .catch(() => null);
      })
    ),
  ]);

  return {
    planets: planets.filter(Boolean).map((raw: any) => {
      const node = raw['@graph']?.[0] ?? raw;
      return {
        label: (node['rdfs:label'] ?? node['label']) as string,
        description: (node['schema:description'] ?? node['description'] ?? '') as string,
        genre: (node['schema:genre'] ?? node['genre']) as string | undefined,
        keywords: (node['schema:keywords'] ?? node['keywords']) as string[] | undefined,
      };
    }),
    organizations: orgs.filter(Boolean).map((raw: any) => {
      const node = raw['@graph']?.[0] ?? raw;
      return {
        label: (node['rdfs:label'] ?? node['label']) as string,
        folderName: raw['folderName'] as string,
        description: (node['sa:description'] ?? node['schema:description'] ?? node['description'] ?? '') as string,
        roles: (node['sa:role'] ?? node['sa:roles'] ?? node['role']) as { label: string }[] | undefined,
      };
    }),
  };
}

export default function SettingIndexPage() {
  const [data, setData] = useState<{ planets: Planet[]; organizations: Organization[] } | null>(null);

  useEffect(() => {
    fetchSettingOverview().then(setData);
  }, []);

  if (!data) return <div className="text-zinc-500 animate-pulse">Accessing Lore Archives...</div>;

  return (
    <div className="space-y-16 pb-12">
      <div className="space-y-3">
        <Breadcrumb items={[{ label: 'Setting' }]} />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-purple-800 text-[10px] uppercase font-bold tracking-[0.2em] text-purple-400">
          <Globe className="w-3 h-3" /> Lore Archives
        </div>
        <h2 className="text-4xl font-bold text-white uppercase tracking-tighter">Setting Overview</h2>
        <p className="text-zinc-400 max-w-2xl">
          Explore the worlds, factions, and places that make up the Stellar Arcana universe.
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <Globe className="w-5 h-5 text-purple-500" /> Planets
          </h3>
          <Link to="/setting/planets" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.planets.map((planet) => (
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
                <h4 className="text-2xl font-bold text-white uppercase tracking-tight group-hover:text-purple-300 transition-colors">
                  {planet.label}
                </h4>
                {planet.genre && (
                  <span className="text-[10px] text-purple-500 uppercase font-bold tracking-widest">{planet.genre}</span>
                )}
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{planet.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
            <Building2 className="w-5 h-5 text-orange-500" /> Organizations
          </h3>
          <Link to="/setting/organizations" className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.organizations.map((org) => (
            <Link
              key={org.label}
              to={`/setting/organizations/${org.folderName}`}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-orange-800 transition-colors group space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-900/30 border border-orange-800/50 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-orange-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors mt-1" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white uppercase tracking-tight group-hover:text-orange-300 transition-colors">
                  {org.label}
                </h4>
                {org.roles && (
                  <span className="text-[10px] text-orange-500 uppercase font-bold tracking-widest">{org.roles.length} roles</span>
                )}
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{org.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
