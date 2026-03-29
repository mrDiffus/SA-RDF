import React, { useState, useEffect } from 'react';
import { fetchGeneralFeatures } from '../data';
import { Feature } from '../types';
import { curieToRelativeIri } from '../rdfNavigation';
import { Star, ChevronRight, Search } from 'lucide-react';

function toArchetypeDisplayName(archetypeReference: string): string {
  if (!archetypeReference.startsWith('archetype:')) {
    return archetypeReference;
  }

  return archetypeReference
    .slice('archetype:'.length)
    .replace(/([a-z])([A-Z])/g, '$1 $2');
}

export default function GeneralFeaturesList() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGeneralFeatures().then(data => {
      setFeatures(data);
      setLoading(false);
    });
  }, []);

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = 
      feature.label.toLowerCase().includes(search.toLowerCase()) || 
      feature.description.some(desc => desc.toLowerCase().includes(search.toLowerCase())) ||
      feature.prerequisites.some(prereq => prereq.toLowerCase().includes(search.toLowerCase())) ||
      (feature.archetypes || []).some(archetype => archetype.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  if (loading) return <div className="text-zinc-500 animate-pulse">Loading General Features...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <Star className="w-10 h-10 text-orange-500" />
          <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">General Features</h2>
        </div>

        <div className="relative flex-1 lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredFeatures.map((feature, index) => (
          <div key={index} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                <ChevronRight className="w-6 h-6 text-orange-500 flex-shrink-0" />
                {feature.label}
              </h3>
              <div className="bg-orange-500/10 border border-orange-500/30 rounded px-3 py-1 flex-shrink-0">
                <span className="text-sm font-semibold text-orange-400">{feature.cost}</span>
              </div>
            </div>

            {feature.prerequisites && feature.prerequisites.length > 0 && (
              <div className="mb-4 pl-9">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-2">Prerequisites</p>
                <ul className="space-y-1">
                  {feature.prerequisites.map((prereq, idx) => (
                    <li key={idx} className="text-sm text-zinc-400 flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span>{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feature.archetypes && feature.archetypes.length > 0 && (
              <div className="mb-4 pl-9">
                <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-2">Associated Archetypes</p>
                <div className="flex flex-wrap gap-2">
                  {feature.archetypes.map((archetype, idx) => {
                    const href = curieToRelativeIri(archetype);
                    const label = toArchetypeDisplayName(archetype);

                    if (!href) {
                      return (
                        <span
                          key={`${archetype}-${idx}`}
                          className="text-xs px-2 py-1 rounded border border-zinc-700 text-zinc-300"
                        >
                          {label}
                        </span>
                      );
                    }

                    return (
                      <a
                        key={`${archetype}-${idx}`}
                        href={href}
                        className="text-xs px-2 py-1 rounded border border-orange-700/40 text-orange-300 hover:text-orange-200 hover:border-orange-500 transition-colors"
                      >
                        {label}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pl-9 space-y-3">
              <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Description</p>
              <div className="space-y-2">
                {feature.description.map((desc, idx) => (
                  <p key={idx} className="text-zinc-300 leading-relaxed text-sm">{desc}</p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
