import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Building2, Users, ChevronRight } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

interface OrgRole {
  label: string;
  description: string | string[];
  requiredRenown?: number;
  prerequisites?: string;
}

interface Character {
  filename: string;
  label: string;
  identity?: { label: string; description: string };
}

interface OrgDetail {
  label: string;
  description: string;
  roles?: OrgRole[];
  characters: Character[];
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

async function fetchOrgDetail(orgSlug: string): Promise<OrgDetail | null> {
  const index = await fetch(resolveDataPath('/data/resource-index.json')).then(r => r.json()) as { resources: ResourceIndexEntry[] };
  const resources = index.resources;

  const orgEntry = resources.find(
    r => r['@type'] === 'sa:Organization' && r.file.includes(`/${orgSlug}/`)
  );
  if (!orgEntry) return null;

  try {
    const [orgData, memberEntries] = await Promise.all([
      fetch(resolveDataPath(`/data/${orgEntry.file}`)).then(r => r.json()),
      Promise.resolve(resources.filter(
        r => r.file.startsWith(`Setting/Organizations/${orgSlug}/`) && r['@type'] !== 'sa:Organization'
      )),
    ]);

    const characters = await Promise.all(
      memberEntries.map(async (memberEntry) => {
        try {
          const charData = await fetch(resolveDataPath(`/data/${memberEntry.file}`)).then(r => r.json());
          const graph = charData['@graph']?.[0] ?? charData;
          return {
            filename: memberEntry.file.split('/').pop()!.replace('.json', ''),
            label: graph['rdfs:label'] || graph['label'] || memberEntry['rdfs:label'],
            identity: graph['sa:identity'] ? {
              label: graph['sa:identity']['rdfs:label'] || graph['sa:identity']['label'] || '',
              description: graph['sa:identity']['schema:description'] || graph['sa:identity']['description'] || '',
            } : undefined,
          };
        } catch {
          return null;
        }
      })
    );

    const graph = orgData['@graph']?.[0] ?? orgData;
    return {
      label: graph['rdfs:label'] || graph['label'] || '',
      description: graph['sa:description'] || graph['schema:description'] || graph['description'] || '',
      roles: (graph['sa:role'] || graph['role'])?.map((r: any) => ({
        label: r['rdfs:label'] || r['label'],
        description: r['sa:description'] || r['description'],
        requiredRenown: r['sa:requiredRenown'] || r['requiredRenown'],
        prerequisites: r['sa:prerequisites'] || r['prerequisites'],
      })),
      characters: characters.filter(Boolean) as Character[],
    };
  } catch {
    return null;
  }
}

export default function OrgDetailPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [org, setOrg] = useState<OrgDetail | null | undefined>(undefined);

  useEffect(() => {
    if (orgSlug) fetchOrgDetail(orgSlug).then(setOrg);
  }, [orgSlug]);

  if (org === undefined) return <div className="text-zinc-500 animate-pulse">Accessing Organization Archives...</div>;
  if (org === null) return <Navigate to="/setting/organizations" replace />;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <Breadcrumb items={[
        { label: 'Setting', href: '/setting' },
        { label: 'Organizations', href: '/setting/organizations' },
        { label: org.label },
      ]} />

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-orange-900/30 border border-orange-800/50 flex items-center justify-center shrink-0">
          <Building2 className="w-8 h-8 text-orange-400" />
        </div>
        <div>
          <h1 className="text-5xl font-bold text-white uppercase tracking-tighter">{org.label}</h1>
          {org.roles && (
            <span className="text-[10px] text-orange-500 uppercase font-bold tracking-widest mt-1 block">
              {org.roles.length} roles available
            </span>
          )}
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Description</h2>
        <p className="text-zinc-300 leading-relaxed">{org.description}</p>
      </section>

      {org.roles && org.roles.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Roles</h2>
          <div className="space-y-4">
            {org.roles.map((role, idx) => (
              <div key={idx} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white text-lg">{role.label}</h3>
                  {role.requiredRenown !== undefined && (
                    <span className="text-[10px] bg-orange-900/30 text-orange-400 px-2 py-1 rounded border border-orange-800/50 uppercase font-bold tracking-widest shrink-0">
                      Renown {role.requiredRenown}+
                    </span>
                  )}
                </div>
                {role.prerequisites && (
                  <p className="text-[11px] text-zinc-500 mb-2 uppercase tracking-wide">Prerequisites: {role.prerequisites}</p>
                )}
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {Array.isArray(role.description) ? role.description.join(' ') : role.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {org.characters.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Users className="w-4 h-4" /> Notable Members
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {org.characters.map((char) => (
              <Link
                key={char.filename}
                to={`/setting/organizations/${orgSlug}/${char.filename}`}
                className="bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-800 hover:border-orange-700/50 rounded-lg p-4 transition-colors group flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white group-hover:text-orange-300 transition-colors truncate">{char.label}</h3>
                  {char.identity?.label && (
                    <p className="text-[12px] text-orange-500 uppercase font-bold tracking-widest mt-0.5 truncate">
                      {char.identity.label}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
