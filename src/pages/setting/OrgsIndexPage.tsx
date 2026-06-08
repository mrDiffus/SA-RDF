import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

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

export default function OrgsIndexPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const index = await fetch(resolveDataPath('/data/resource-index.json')).then(r => r.json()) as { resources: ResourceIndexEntry[] };
      const orgEntries = index.resources.filter(r => r['@type'] === 'sa:Organization');
      const data = await Promise.all(
        orgEntries.map(entry => {
          const folderName = entry.file.split('/')[2];
          return fetch(resolveDataPath(`/data/${entry.file}`))
            .then(r => r.json())
            .then(raw => ({ ...raw, folderName }))
            .catch(() => null);
        })
      );
      setOrgs(data.filter(Boolean).map((raw: any) => {
        const node = raw['@graph']?.[0] ?? raw;
        return {
          label: node['rdfs:label'] as string,
          folderName: raw['folderName'] as string,
          description: (node['sa:description'] ?? node['schema:description'] ?? '') as string,
          roles: (node['sa:role'] ?? node['role']) as { label: string }[] | undefined,
        };
      }));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Organization Archives...</div>;

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Setting', href: '/setting' }, { label: 'Organizations' }]} />

      <h2 className="text-3xl font-bold text-white uppercase tracking-tighter flex items-center gap-3">
        <Building2 className="w-8 h-8 text-orange-500" /> Organizations
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orgs.map((org) => (
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
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight group-hover:text-orange-300 transition-colors">
                {org.label}
              </h3>
              {org.roles && (
                <span className="text-[10px] text-orange-500 uppercase font-bold tracking-widest">
                  {org.roles.length} roles
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{org.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
