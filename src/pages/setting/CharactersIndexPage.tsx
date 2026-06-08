import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';

interface CharacterSummary {
  filename: string;
  label: string;
  identity?: { label: string };
  orgSlug?: string;
  orgLabel?: string;
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

async function fetchAllCharacters(): Promise<CharacterSummary[]> {
  const index = await fetch(resolveDataPath('/data/resource-index.json')).then(r => r.json()) as { resources: ResourceIndexEntry[] };
  const resources = index.resources;

  const orgEntries = resources.filter(r => r['@type'] === 'sa:Organization');
  const orgSlugs = new Set(orgEntries.map(e => e.file.split('/')[2]));

  const characterEntries = resources.filter(r =>
    r.file.startsWith('Setting/') &&
    r.file.endsWith('.json') &&
    !orgSlugs.has(r.file.split('/')[2]) &&
    r['@type'] !== 'sa:Organization'
  );

  const orgMemberEntries = resources.filter(r =>
    r.file.startsWith('Setting/Organizations/') &&
    r['@type'] !== 'sa:Organization'
  );

  const [standAlones, orgMembers] = await Promise.all([
    Promise.all(characterEntries.map(async entry => {
      try {
        const data = await fetch(resolveDataPath(`/data/${entry.file}`)).then(r => r.json());
        const graph = data['@graph']?.[0] ?? data;
        return {
          filename: entry.file.split('/').pop()!.replace('.json', ''),
          label: graph['rdfs:label'] || graph['label'] || entry['rdfs:label'],
          identity: graph['sa:identity'] ? { label: graph['sa:identity']['rdfs:label'] || graph['sa:identity']['label'] || '' } : undefined,
        } as CharacterSummary;
      } catch { return null; }
    })),
    Promise.all(orgMemberEntries.map(async entry => {
      try {
        const orgSlug = entry.file.split('/')[2];
        const data = await fetch(resolveDataPath(`/data/${entry.file}`)).then(r => r.json());
        const graph = data['@graph']?.[0] ?? data;
        return {
          filename: entry.file.split('/').pop()!.replace('.json', ''),
          label: graph['rdfs:label'] || graph['label'] || entry['rdfs:label'],
          identity: graph['sa:identity'] ? { label: graph['sa:identity']['rdfs:label'] || graph['sa:identity']['label'] || '' } : undefined,
          orgSlug,
          orgLabel: orgSlug.replace(/-/g, ' '),
        } as CharacterSummary;
      } catch { return null; }
    })),
  ]);

  return [...standAlones.filter(Boolean) as CharacterSummary[], ...orgMembers.filter(Boolean) as CharacterSummary[]];
}

export default function CharactersIndexPage() {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllCharacters().then(data => {
      setCharacters(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Character Archives...</div>;

  const standalone = characters.filter(c => !c.orgSlug);
  const orgMembers = characters.filter(c => c.orgSlug);

  return (
    <div className="space-y-10">
      <Breadcrumb items={[{ label: 'Setting', href: '/setting' }, { label: 'Characters' }]} />

      <h2 className="text-3xl font-bold text-white uppercase tracking-tighter flex items-center gap-3">
        <Users className="w-8 h-8 text-purple-500" /> Characters
      </h2>

      {standalone.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Independent Characters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {standalone.map((char) => (
              <Link
                key={char.filename}
                to={`/setting/characters/${char.filename}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-purple-700/50 transition-colors group flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors truncate">{char.label}</h3>
                  {char.identity?.label && (
                    <p className="text-[11px] text-purple-500 uppercase font-bold tracking-widest mt-0.5 truncate">{char.identity.label}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {orgMembers.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Organization Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgMembers.map((char) => (
              <Link
                key={`${char.orgSlug}/${char.filename}`}
                to={`/setting/organizations/${char.orgSlug}/${char.filename}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-orange-700/50 transition-colors group flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white group-hover:text-orange-300 transition-colors truncate">{char.label}</h3>
                  {char.identity?.label && (
                    <p className="text-[11px] text-orange-500 uppercase font-bold tracking-widest mt-0.5 truncate">{char.identity.label}</p>
                  )}
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-0.5 truncate">{char.orgLabel}</p>
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
