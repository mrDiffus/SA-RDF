import React, { useState, useEffect, useMemo } from 'react';
import { fetchSkills } from '../data';
import { Skill } from '../types';

interface SkillListProps {
  selectedResourceId?: string;
  onNavigate: (resourceId?: string) => void;
}

export default function SkillList({ selectedResourceId, onNavigate }: SkillListProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills().then(data => {
      setSkills(data);
      setLoading(false);
    });
  }, []);

  // Get unique abilities for filter
  const uniqueAbilities = useMemo(() => {
    const abilities = new Set<string>();
    skills.forEach(skill => {
      skill.keyAbility?.forEach(ability => {
        abilities.add(ability.label);
      });
    });
    return Array.from(abilities).sort();
  }, [skills]);

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let filtered = skills;

    if (selectedAbility) {
      filtered = skills.filter(skill =>
        skill.keyAbility?.some(ability => ability.label === selectedAbility)
      );
    }

    return filtered.sort((a, b) => a.label.localeCompare(b.label));
  }, [skills, selectedAbility]);

  if (loading) return <div className="text-zinc-500 animate-pulse">Loading Skill Database...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Skills</h2>
        <span className="text-sm text-zinc-400">{filteredSkills.length} skills</span>
      </div>

      {/* Filter by ability */}
      <div className="space-y-2">
        <label className="text-sm font-bold text-white uppercase tracking-wide">Filter by Key Ability</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedAbility(null)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              selectedAbility === null
                ? 'bg-orange-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          {uniqueAbilities.map((ability) => (
            <button
              key={ability}
              onClick={() => setSelectedAbility(ability)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                selectedAbility === ability
                  ? 'bg-orange-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {ability}
            </button>
          ))}
        </div>
      </div>

      {/* Skills table */}
      <div className="overflow-x-auto border border-zinc-800 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-6 py-3 text-left font-bold text-white uppercase tracking-wide">Skill</th>
              <th className="px-6 py-3 text-left font-bold text-white uppercase tracking-wide">Description</th>
              <th className="px-6 py-3 text-left font-bold text-white uppercase tracking-wide">Key Abilities</th>
            </tr>
          </thead>
          <tbody>
            {filteredSkills.map((skill, idx) => (
              <tr
                key={skill.id}
                className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{skill.label}</td>
                <td className="px-6 py-4 text-zinc-300">{skill.description}</td>
                <td className="px-6 py-4">
                  {skill.keyAbility && skill.keyAbility.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skill.keyAbility.map((ability) => (
                        <span
                          key={ability.id}
                          className="inline-block text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded border border-orange-700"
                        >
                          {ability.label}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-400">No skills match the selected filter.</p>
        </div>
      )}
    </div>
  );
}
