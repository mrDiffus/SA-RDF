import React, { useState, useEffect, useMemo } from 'react';
import { fetchSkills } from '../../data';
import { Skill } from '../../types';
import Breadcrumb from '../../components/Breadcrumb';

export default function SkillsIndexPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills().then(data => {
      setSkills(data);
      setLoading(false);
    });
  }, []);

  const uniqueAbilities = useMemo(() => {
    const abilities = new Set<string>();
    skills.forEach(skill => skill.keyAbility?.forEach(a => abilities.add(a.label)));
    return Array.from(abilities).sort();
  }, [skills]);

  const filteredSkills = useMemo(() => {
    const filtered = selectedAbility
      ? skills.filter(skill => skill.keyAbility?.some(a => a.label === selectedAbility))
      : skills;
    return filtered.sort((a, b) => a.label.localeCompare(b.label));
  }, [skills, selectedAbility]);

  if (loading) return <div className="text-zinc-500 animate-pulse">Loading Skill Database...</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Rules', href: '/rules' }, { label: 'Skills' }]} />

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Skills</h2>
        <span className="text-sm text-zinc-400">{filteredSkills.length} skills</span>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-white uppercase tracking-wide">Filter by Key Ability</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedAbility(null)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              selectedAbility === null ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          {uniqueAbilities.map((ability) => (
            <button
              key={ability}
              onClick={() => setSelectedAbility(ability)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                selectedAbility === ability ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {ability}
            </button>
          ))}
        </div>
      </div>

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
            {filteredSkills.map((skill) => (
              <tr key={skill.id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
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
    </div>
  );
}
