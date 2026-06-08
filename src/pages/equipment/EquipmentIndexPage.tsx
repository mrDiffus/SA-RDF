import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchEquipment } from '../../data';
import { Equipment } from '../../types';
import { Sword, Shield, Crosshair, Scale, Coins, Search, Tag } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { idToSlug } from '../../slugs';

function renderEquipmentIcon(type: string) {
  if (type === 'Melee') return <Sword className="w-10 h-10 text-zinc-500" />;
  if (type === 'Ranged') return <Crosshair className="w-10 h-10 text-zinc-500" />;
  if (type === 'Armor') return <Shield className="w-10 h-10 text-zinc-500" />;
  if (type === 'Wondrous') return <Tag className="w-10 h-10 text-zinc-500" />;
  return <Scale className="w-10 h-10 text-zinc-500" />;
}

const CATEGORIES = ['All', 'Melee', 'Ranged', 'Armor', 'Power Armor', 'Wondrous'];

export default function EquipmentIndexPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchEquipment().then(data => {
      setEquipment(data);
      setLoading(false);
    });
  }, []);

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Equipment Archives...</div>;

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: 'Rules', href: '/rules' }, { label: 'Equipment' }]} />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Equipment</h2>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-md p-1 flex-wrap gap-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded text-[10px] uppercase font-bold tracking-widest transition-colors ${
                  filter === cat ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search gear..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEquipment.map((item) => (
          <Link
            key={item.id}
            to={`/equipment/${idToSlug(item.id)}`}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row gap-6 hover:border-zinc-600 transition-colors group"
          >
            <div className="w-full sm:w-24 h-24 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-zinc-700 transition-colors">
              {renderEquipmentIcon(item.type)}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-orange-400 transition-colors">{item.label}</h3>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{item.type}</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-orange-500 font-bold">
                    <Coins className="w-3 h-3" />
                    <span>{item.cost?.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{item.weight} kg</div>
                </div>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{item.description}</p>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-800">
                {item.damage && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-600 uppercase font-bold block tracking-tighter">Damage</span>
                    <span className="text-xs text-zinc-300 font-mono">{item.damage} {item.damageType}</span>
                  </div>
                )}
                {item.range && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-600 uppercase font-bold block tracking-tighter">Range</span>
                    <span className="text-xs text-zinc-300 font-mono">{item.range.normal}/{item.range.maximum}m</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
