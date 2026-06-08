import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { fetchEquipment } from '../../data';
import { Equipment } from '../../types';
import { Sword, Shield, Crosshair, Scale, Coins, Tag } from 'lucide-react';
import Breadcrumb from '../../components/Breadcrumb';
import { idToSlug } from '../../slugs';

function renderEquipmentIcon(type: string) {
  if (type === 'Melee') return <Sword className="w-8 h-8 text-zinc-400" />;
  if (type === 'Ranged') return <Crosshair className="w-8 h-8 text-zinc-400" />;
  if (type === 'Armor') return <Shield className="w-8 h-8 text-zinc-400" />;
  if (type === 'Wondrous') return <Tag className="w-8 h-8 text-zinc-400" />;
  return <Scale className="w-8 h-8 text-zinc-400" />;
}

function DetailCard({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4">
      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">{label}</span>
      <p className="text-sm text-zinc-200">{value ?? '-'}</p>
    </div>
  );
}

export default function EquipmentDetailPage() {
  const { equipmentSlug } = useParams<{ equipmentSlug: string }>();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment().then(data => {
      setEquipment(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Equipment Archives...</div>;

  const item = equipment.find(e => idToSlug(e.id) === equipmentSlug);
  if (!item) return <Navigate to="/equipment" replace />;

  const isWondrous = ['WondrousItem', 'AlchemicalSubstance', 'ArcanoTech', 'BoundConstruct', 'AlchemicalItem'].includes(item.equipmentClass ?? '');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Breadcrumb items={[
        { label: 'Rules', href: '/rules' },
        { label: 'Equipment', href: '/equipment' },
        { label: item.label },
      ]} />

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
          {renderEquipmentIcon(item.type)}
        </div>
        <div>
          <h1 className="text-5xl font-bold text-white uppercase tracking-tighter">{item.label}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded uppercase tracking-widest font-bold border border-zinc-700">{item.type}</span>
            {item.cost && (
              <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                <Coins className="w-4 h-4" />
                {item.cost.toLocaleString()}
              </div>
            )}
            {item.weight && <span className="text-sm text-zinc-500">{item.weight} kg</span>}
          </div>
        </div>
      </div>

      <p className="text-zinc-300 leading-relaxed text-lg">{item.description}</p>

      {!isWondrous && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-y border-zinc-800">
          <DetailCard label="Damage" value={item.damage ? `${item.damage}${item.damageType ? ` ${item.damageType}` : ''}` : undefined} />
          <DetailCard label="Range" value={item.range ? `${item.range.normal}/${item.range.maximum}m` : undefined} />
          <DetailCard label="Armor Class" value={item.armorClass} />
          <DetailCard label="Critical" value={item.criticalModifier} />
        </div>
      )}

      {item.equipmentClass === 'Armor' && (
        <section className="space-y-4">
          <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Armor Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <DetailCard label="Category" value={item.category} />
            <DetailCard label="Max Dexterity" value={item.maxDexterity} />
            <DetailCard label="Damage Absorption" value={item.damageAbsorption} />
            <DetailCard label="Hardness" value={item.hardness} />
            <DetailCard label="Base Speed" value={item.baseSpeed != null ? (typeof item.baseSpeed === 'number' ? `${item.baseSpeed} ft` : item.baseSpeed) : undefined} />
          </div>
          {item.hardpoints != null && item.hardpoints.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Hardpoints</span>
              {item.hardpoints.map((hp, i) => (
                <div key={i} className="bg-zinc-800/40 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-300">{hp}</div>
              ))}
            </div>
          )}
        </section>
      )}

      {isWondrous && (
        <div className="space-y-6">
          {item.commonUsage && (
            <section className="space-y-2">
              <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Common Usage</h2>
              <p className="text-zinc-300 leading-relaxed">{item.commonUsage}</p>
            </section>
          )}
          {item.societalImpact && (
            <section className="space-y-2">
              <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Societal Impact</h2>
              <p className="text-zinc-300 leading-relaxed">{item.societalImpact}</p>
            </section>
          )}
          <div className="grid grid-cols-2 gap-4">
            <DetailCard label="Rarity" value={item.rarity} />
            <DetailCard label="Legal Status" value={item.legalStatus} />
            <DetailCard label="Origin" value={item.origin} />
            <DetailCard label="Manufacturer" value={item.manufacturer} />
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Special Notes</h2>
        <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4">
          <p className="text-sm text-zinc-300 leading-relaxed">{item.specialProperties || 'No additional properties recorded.'}</p>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{tag}</span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
