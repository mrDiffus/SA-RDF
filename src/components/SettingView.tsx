import React, { useEffect, useState } from 'react';
import { Globe, Building2, MapPin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingPlace {
  label: string;
  description: string;
  id?: string;
}

interface PlaceDetail {
  label: string;
  description: string | string[];
  subPlaces?: { label: string; description: string }[];
  attitude?: string[];
}

interface Planet {
  label: string;
  description: string;
  genre?: string;
  keywords?: string[];
  about?: SettingPlace;
  places?: SettingPlace[];
  placesPath?: string;
}

interface Organization {
  label: string;
  description: string;
  roles?: { label: string; description: string | string[]; requiredRenown?: number }[];
}

interface SettingData {
  planets: Planet[];
  organizations: Organization[];
}

function resolveDataPath(path: string): string {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

async function fetchSettingData(): Promise<SettingData> {
  const [arrur, arcech, armanitech] = await Promise.all([
    fetch(resolveDataPath('/data/Setting/Planets/Arrur/arrur.json')).then(r => r.json()),
    fetch(resolveDataPath('/data/Setting/Planets/Arcech/arcech.json')).then(r => r.json()),
    fetch(resolveDataPath('/data/Setting/Organizations/Armanitech/armanitech.json')).then(r => r.json()),
  ]);

  const toPlanet = (raw: Record<string, unknown>, placesPath?: string): Planet => {
    const hasPart = raw['hasPart'] as Record<string, unknown>[] | undefined;
    return {
      label: raw['label'] as string,
      description: (raw['description'] as string) ?? '',
      genre: raw['genre'] as string | undefined,
      keywords: raw['keywords'] as string[] | undefined,
      about: raw['about'] as SettingPlace | undefined,
      places: hasPart?.map((p) => ({
        label: p['label'] as string,
        description: p['description'] as string ?? '',
        id: p['@id'] as string | undefined,
      })),
      placesPath,
    };
  };

  const toOrg = (raw: Record<string, unknown>): Organization => ({
    label: raw['label'] as string,
    description: raw['description'] as string ?? '',
    roles: (raw['role'] as Record<string, unknown>[] | undefined)?.map((r) => ({
      label: r['label'] as string,
      description: r['description'] as string | string[],
      requiredRenown: r['requiredRenown'] as number | undefined,
    })),
  });

  return {
    planets: [toPlanet(arrur, resolveDataPath('/data/Setting/Planets/Arrur/Places/')), toPlanet(arcech)],
    organizations: [toOrg(armanitech)],
  };
}

export default function SettingView() {
  const [data, setData] = useState<SettingData | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SettingPlace | null>(null);
  const [placeDetail, setPlaceDetail] = useState<PlaceDetail | null>(null);

  useEffect(() => {
    fetchSettingData().then(setData);
  }, []);

  const handlePlaceClick = async (e: React.MouseEvent, place: SettingPlace) => {
    e.stopPropagation();
    setSelectedPlace(place);
    setPlaceDetail(null);
    if (selectedPlanet?.placesPath && place.id) {
      const slug = place.id.split('/').pop();
      try {
        const res = await fetch(`${selectedPlanet.placesPath}${slug}.json`);
        if (res.ok) {
          const raw = await res.json();
          setPlaceDetail({
            label: raw['label'] as string,
            description: raw['description'] as string | string[],
            subPlaces: (raw['containsPlace'] as Record<string, string>[] | undefined)?.map((p) => ({
              label: p['label'],
              description: p['description'],
            })),
            attitude: raw['attitude'] as string[] | undefined,
          });
        }
      } catch {
        // Place detail not available; modal shows basic info from hasPart
      }
    }
  };

  if (!data) {
    return <div className="text-zinc-500 animate-pulse">Accessing Lore Archives...</div>;
  }

  return (
    <div className="space-y-16">
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
              onClick={() => setSelectedPlanet(planet)}
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

      {/* Planet detail modal */}
      <AnimatePresence>
        {selectedPlanet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlanet(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 z-[70] shadow-2xl"
            >
              <div className="flex justify-between items-start gap-4 mb-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-purple-800 text-[10px] uppercase tracking-widest font-bold text-purple-400">
                    <Globe className="w-3 h-3" /> Planet
                  </div>
                  <h3 className="text-4xl font-bold text-white uppercase tracking-tighter">{selectedPlanet.label}</h3>
                  {selectedPlanet.genre && (
                    <p className="text-[10px] text-purple-400 uppercase font-bold tracking-widest">{selectedPlanet.genre}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanet(null)}
                  className="text-zinc-500 hover:text-white transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <p className="text-zinc-300 leading-relaxed mb-8">{selectedPlanet.description}</p>

              {selectedPlanet.places && selectedPlanet.places.length > 0 && (
                <section className="space-y-4">
                  <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Notable Places
                  </h4>
                  <div className="space-y-3">
                    {selectedPlanet.places.map((place) => (
                      <motion.button
                        key={place.label}
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        onClick={(e) => handlePlaceClick(e, place)}
                        className="w-full bg-zinc-800/40 border border-zinc-800 rounded-lg p-4 text-left hover:border-purple-700 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-sm font-bold text-white uppercase tracking-tight mb-1 group-hover:text-purple-300 transition-colors">{place.label}</h5>
                          <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0" />
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">{place.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </section>
              )}

              {selectedPlanet.keywords && selectedPlanet.keywords.length > 0 && (
                <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-wrap gap-2">
                  {selectedPlanet.keywords.map((kw) => (
                    <span key={kw} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700 uppercase tracking-wider">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Place detail modal */}
      <AnimatePresence>
        {selectedPlace && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedPlace(null); setPlaceDetail(null); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-950 border border-zinc-700 rounded-xl p-8 z-[90] shadow-2xl"
            >
              <div className="flex justify-between items-start gap-4 mb-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-[10px] uppercase tracking-widest font-bold text-zinc-300">
                    <MapPin className="w-3 h-3" /> Place
                  </div>
                  <h3 className="text-3xl font-bold text-white uppercase tracking-tighter">{selectedPlace.label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPlace(null); setPlaceDetail(null); }}
                  className="text-zinc-500 hover:text-white transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {(() => {
                const desc = placeDetail?.description ?? selectedPlace.description;
                return Array.isArray(desc) ? (
                  <div className="space-y-3 mb-8">
                    {desc.map((line, i) => (
                      <p key={i} className="text-zinc-300 leading-relaxed">{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-300 leading-relaxed mb-8">{desc}</p>
                );
              })()}

              {placeDetail?.subPlaces && placeDetail.subPlaces.length > 0 && (
                <section className="space-y-4 mb-6">
                  <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Locations
                  </h4>
                  <div className="space-y-3">
                    {placeDetail.subPlaces.map((sub) => (
                      <div key={sub.label} className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4">
                        <h5 className="text-sm font-bold text-white uppercase tracking-tight mb-1">{sub.label}</h5>
                        <p className="text-sm text-zinc-400 leading-relaxed">{sub.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {placeDetail?.attitude && placeDetail.attitude.length > 0 && (
                <section className="mt-6 pt-6 border-t border-zinc-800">
                  <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest mb-3">Attitude</h4>
                  <div className="space-y-1">
                    {placeDetail.attitude.map((line, i) => (
                      <p key={i} className="text-sm text-zinc-400 italic leading-relaxed">{line}</p>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Org detail modal */}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 z-[70] shadow-2xl"
            >
              <div className="flex justify-between items-start gap-4 mb-6">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-orange-800 text-[10px] uppercase tracking-widest font-bold text-orange-400">
                    <Building2 className="w-3 h-3" /> Organization
                  </div>
                  <h3 className="text-4xl font-bold text-white uppercase tracking-tighter">{selectedOrg.label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrg(null)}
                  className="text-zinc-500 hover:text-white transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <p className="text-zinc-300 leading-relaxed mb-8">{selectedOrg.description}</p>

              {selectedOrg.roles && selectedOrg.roles.length > 0 && (
                <section className="space-y-4">
                  <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Membership Roles</h4>
                  <div className="space-y-3">
                    {selectedOrg.roles.map((role) => (
                      <div key={role.label} className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-white uppercase tracking-tight">{role.label}</h5>
                          {role.requiredRenown != null && (
                            <span className="text-[10px] text-orange-400 border border-orange-800 rounded px-2 py-0.5 uppercase font-bold tracking-wider">
                              Renown {role.requiredRenown}
                            </span>
                          )}
                        </div>
                        {Array.isArray(role.description) ? (
                          <ul className="space-y-1">
                            {role.description.map((line, i) => (
                              <li key={i} className="text-sm text-zinc-400 leading-relaxed flex items-start gap-2">
                                <span className="text-orange-600 mt-1">›</span> {line}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-zinc-400 leading-relaxed">{role.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
