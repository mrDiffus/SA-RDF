import React, { useEffect, useState } from 'react';
import { Globe, Building2, ChevronRight, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Planet {
  label: string;
  description: string;
  genre?: string;
  keywords?: string[];
}

interface Character {
  filename: string;
  label: string;
  identity?: { label: string; description: string };
}

interface Organization {
  label: string;
  folderName: string;
  description: string;
  roles?: { label: string; description: string | string[]; requiredRenown?: number }[];
  characters?: Character[];
}

interface SettingData {
  planets: Planet[];
  organizations: Organization[];
}

function resolveDataPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

interface ResourceIndexEntry {
  file: string;
  '@type': string;
  'rdfs:label': string;
  '@id': string | null;
}

async function fetchSettingData(): Promise<SettingData> {
  const index = await fetch(resolveDataPath('/data/resource-index.json')).then(r => r.json()) as {
    resources: ResourceIndexEntry[];
  };

  const resources: ResourceIndexEntry[] = index.resources;

  // Derive planets: Setting/Planets/<Name>/<slug>.json (no /Places/ segment)
  const planetEntries = resources.filter(
    r => r.file.startsWith('Setting/Planets/') && r.file.indexOf('/Places/') === -1
  );

  // Derive orgs: all sa:Organization entries under Setting/Organizations/
  const orgEntries = resources.filter(r => r['@type'] === 'sa:Organization');

  const [planets, ...orgs] = await Promise.all([
    Promise.all(
      planetEntries.map(entry =>
        fetch(resolveDataPath(`/data/${entry.file}`)).then(r => r.json()).catch(() => null)
      )
    ),
    ...orgEntries.map(orgEntry => {
      // Derive folder name from file path: "Setting/Organizations/{FolderName}/{slug}.json"
      const folderName = orgEntry.file.split('/')[2];

      return fetch(resolveDataPath(`/data/${orgEntry.file}`))
        .then(r => r.json())
        .then(async (orgData) => {
          // Load all non-org-definition files in the same folder
          const memberEntries = resources.filter(
            r => r.file.startsWith(`Setting/Organizations/${folderName}/`) && r['@type'] !== 'sa:Organization'
          );

          const characters = await Promise.all(
            memberEntries.map(async (memberEntry) => {
              try {
                const charData = await fetch(resolveDataPath(`/data/${memberEntry.file}`)).then(r => r.json());
                return {
                  filename: memberEntry.file.split('/').pop()!.replace('.json', ''),
                  label: charData['label'] || charData['rdfs:label'] || memberEntry['rdfs:label'],
                  identity: charData['sa:identity'],
                };
              } catch {
                return null;
              }
            })
          );

          return {
            ...orgData,
            folderName,
            characters: characters.filter((c) => c !== null),
          };
        })
        .catch(() => null);
    }),
  ]);

  const toPlanet = (raw: Record<string, unknown>): Planet => ({
    label: raw['label'] as string,
    description: (raw['description'] as string) ?? '',
    genre: raw['genre'] as string | undefined,
    keywords: raw['keywords'] as string[] | undefined,
  });

  const toOrg = (raw: Record<string, unknown>): Organization => ({
    label: raw['label'] as string,
    folderName: raw['folderName'] as string,
    description: raw['description'] as string ?? '',
    roles: (raw['role'] as Record<string, unknown>[] | undefined)?.map((r) => ({
      label: r['label'] as string,
      description: r['description'] as string | string[],
      requiredRenown: r['requiredRenown'] as number | undefined,
    })),
    characters: raw['characters'] as Character[] | undefined,
  });

  return {
    planets: (planets as (Record<string, unknown> | null)[]).filter(p => p !== null).map(toPlanet),
    organizations: orgs.filter((org) => org !== null).map(toOrg),
  };
}

interface SettingViewProps {
  onNavigateToPlanet: (planetName: string) => void;
  onNavigateToCharacter: (organizationName: string, characterSlug: string) => void;
}

export default function SettingView({ onNavigateToPlanet, onNavigateToCharacter }: SettingViewProps) {
  const [data, setData] = useState<SettingData | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetchSettingData().then(setData);
  }, []);

  if (!data) {
    return <div className="text-zinc-500 animate-pulse">Accessing Lore Archives...</div>;
  }

  return (
    <div className="space-y-16 pb-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-purple-800 text-[10px] uppercase font-bold tracking-[0.2em] text-purple-400">
          <Globe className="w-3 h-3" /> Lore Archives
        </div>
        <h2 className="text-4xl font-bold text-white uppercase tracking-tighter">Setting Overview</h2>
        <p className="text-zinc-400 max-w-2xl">
          Explore the worlds, factions, and places that make up the Stellar Arcana universe.
        </p>
      </div>

      {/* Planets */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
          <Globe className="w-5 h-5 text-purple-500" /> Planets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.planets.map((planet) => (
            <motion.button
              key={planet.label}
              type="button"
              whileHover={{ scale: 1.01 }}
              onClick={() => onNavigateToPlanet(planet.label)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left hover:border-purple-800 transition-colors group space-y-4"
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
              {planet.keywords && planet.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                  {planet.keywords.slice(0, 5).map((kw) => (
                    <span key={kw} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700 uppercase tracking-wider">
                      {kw}
                    </span>
                  ))}
                  {planet.keywords.length > 5 && (
                    <span className="text-[10px] text-zinc-600 px-2 py-1">+{planet.keywords.length - 5} more</span>
                  )}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Organizations */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
          <Building2 className="w-5 h-5 text-orange-500" /> Organizations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.organizations.map((org) => (
            <motion.button
              key={org.label}
              type="button"
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedOrg(org)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left hover:border-orange-800 transition-colors group space-y-4"
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
                  <span className="text-[10px] text-orange-500 uppercase font-bold tracking-widest">
                    {org.roles.length} roles
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">{org.description}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Organization Detail Modal */}
      <AnimatePresence>
        {selectedOrg && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrg(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-xl p-8 z-[70] shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-3xl font-bold text-white uppercase tracking-tighter mb-2">{selectedOrg.label}</h3>
                  {selectedOrg.roles && (
                    <span className="text-[10px] text-orange-500 uppercase font-bold tracking-widest">
                      {selectedOrg.roles.length} roles available
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="text-zinc-500 hover:text-white transition-colors p-2 bg-zinc-800 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <section className="space-y-4">
                  <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Description</h4>
                  <p className="text-zinc-300 leading-relaxed">{selectedOrg.description}</p>
                </section>

                {selectedOrg.roles && selectedOrg.roles.length > 0 && (
                  <section className="space-y-4">
                    <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Roles</h4>
                    <div className="space-y-4">
                      {selectedOrg.roles.map((role, idx) => (
                        <div key={idx} className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-white text-lg">{role.label}</h5>
                            {role.requiredRenown !== undefined && (
                              <span className="text-[10px] bg-orange-900/30 text-orange-400 px-2 py-1 rounded border border-orange-800/50 uppercase font-bold tracking-widest">
                                Renown {role.requiredRenown}+
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed">
                            {Array.isArray(role.description) ? role.description.join(' ') : role.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {selectedOrg.characters && selectedOrg.characters.length > 0 && (
                  <section className="space-y-4">
                    <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Notable Members
                    </h4>
                    <div className="space-y-3">
                      {selectedOrg.characters.map((char) => (
                        <motion.button
                          key={char.filename}
                          type="button"
                          whileHover={{ scale: 1.02, x: 4 }}
                          onClick={() => {
                            onNavigateToCharacter(selectedOrg.folderName, char.filename);
                            setSelectedOrg(null);
                          }}
                          className="w-full text-left bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-800 hover:border-orange-700/50 rounded-lg p-4 transition-colors group"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <h5 className="font-bold text-white group-hover:text-orange-300 transition-colors">{char.label}</h5>
                              {char.identity?.label && (
                                <p className="text-[12px] text-orange-500 uppercase font-bold tracking-widest mt-1">
                                  {char.identity.label}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors" />
                          </div>
                        </motion.button>
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
