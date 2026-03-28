import React, { useState, useEffect } from 'react';
import { fetchEquipment } from '../data';
import { Equipment } from '../types';
import { Sword, Shield, Crosshair, Scale, Coins, Search, Maximize2, Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

function renderEquipmentIcon(type: string) {
  if (type === 'Melee') return <Sword className="w-10 h-10 text-zinc-500" />;
  if (type === 'Ranged') return <Crosshair className="w-10 h-10 text-zinc-500" />;
  if (type === 'Armor') return <Shield className="w-10 h-10 text-zinc-500" />;
  if (type === 'Wondrous') return <Tag className="w-10 h-10 text-zinc-500" />;
  return <Scale className="w-10 h-10 text-zinc-500" />;
}

interface EquipmentListProps {
  selectedResourceId?: string;
  onNavigate: (resourceId?: string) => void;
}

type ModalField = { label: string; value?: string | number };
type ModalSection = { title: string; fields: ModalField[] };

function asDisplayValue(value?: string | number): string | number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string' && value.trim().length === 0) return undefined;
  return value;
}

function buildSpecializedSections(item: Equipment): ModalSection[] {
  const className = item.equipmentClass;

  if (className === 'Weapon') {
    return [
      {
        title: 'Weapon Profile',
        fields: [
          { label: 'Damage', value: item.damage ? `${item.damage}${item.damageType ? ` ${item.damageType}` : ''}` : undefined },
          { label: 'Critical', value: item.criticalModifier },
          { label: 'Size', value: item.size },
          { label: 'Proficiency', value: item.proficiency },
          { label: 'Range', value: item.range ? `${item.range.normal}/${item.range.maximum}m` : undefined },
          { label: 'Clip Size', value: item.clipSize },
          { label: 'Burst Damage', value: item.burstDamage }
        ]
      }
    ];
  }

  if (className === 'Armor') {
    return [
      {
        title: 'Armor Profile',
        fields: [
          { label: 'Category', value: item.category },
          { label: 'Armor Class', value: item.armorClass },
          { label: 'Max Dexterity', value: item.maxDexterity },
          { label: 'Damage Absorption', value: item.damageAbsorption },
          { label: 'Hardness', value: item.hardness },
          { label: 'Base Speed', value: item.baseSpeed },
          { label: 'Hardpoints', value: item.hardpoints?.length ? item.hardpoints.join(', ') : undefined },
        ]
      }
    ];
  }

  if (className === 'PoweredArmor') {
    return [
      {
        title: 'Powered Armor Frame',
        fields: [
          { label: 'Size', value: item.size },
          { label: 'Armor Class', value: item.armorClass },
          { label: 'Max Dexterity', value: item.maxDexterity },
          { label: 'Damage Absorption', value: item.damageAbsorption },
          { label: 'Hardness', value: item.hardness },
          { label: 'Strength Score', value: item.strengthScore },
          { label: 'Dexterity Score', value: item.dexterityScore },
          { label: 'Charisma Modifier', value: item.charismaModifier },
          { label: 'Base Speed', value: item.baseSpeed },
          { label: 'Hardpoints', value: item.hardpoints?.length ? item.hardpoints.join(', ') : undefined },
          { label: 'Culture', value: item.culture }
        ]
      }
    ];
  }

  if (
    className === 'WondrousItem' ||
    className === 'AlchemicalSubstance' ||
    className === 'ArcanoTech' ||
    className === 'BoundConstruct' ||
    className === 'AlchemicalItem'
  ) {
    return [
      {
        title: 'Common Usage',
        fields: [
          { label: 'Common Usage', value: item.commonUsage }
        ]
      },
      {
        title: 'Societal Impact',
        fields: [
          { label: 'Societal Impact', value: item.societalImpact }
        ]
      },
      {
        title: 'Item Details',
        fields: [
          { label: 'Rarity', value: item.rarity },
          { label: 'Legal Status', value: item.legalStatus },
          { label: 'Origin', value: item.origin },
          { label: 'Manufacturer', value: item.manufacturer }
        ]
      }
    ];
  }

  return [
    {
      title: 'Item Profile',
      fields: [
        { label: 'Armor Class', value: item.armorClass },
        { label: 'Damage', value: item.damage ? `${item.damage}${item.damageType ? ` ${item.damageType}` : ''}` : undefined },
        { label: 'Critical', value: item.criticalModifier },
        { label: 'Range', value: item.range ? `${item.range.normal}/${item.range.maximum}m` : undefined }
      ]
    }
  ];
}

export default function EquipmentList({ selectedResourceId, onNavigate }: EquipmentListProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    fetchEquipment().then(data => {
      setEquipment(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedResourceId) {
      setSelectedEquipment(null);
      return;
    }

    const nextSelectedEquipment = equipment.find((item) => item.id === selectedResourceId) ?? null;
    setSelectedEquipment(nextSelectedEquipment);
  }, [selectedResourceId, equipment]);

  const categories = ['All', 'Melee', 'Ranged', 'Armor', 'Power Armor', 'Wondrous'];

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase()) || 
                         item.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="text-zinc-500 animate-pulse">Accessing Equipment Archives...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Equipment</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-md p-1">
            {categories.map(cat => (
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
          
          <div className="relative flex-1 sm:w-64">
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
          <motion.button
            key={item.id}
            type="button"
            layoutId={item.id}
            onClick={() => {
              setSelectedEquipment(item);
              onNavigate(item.id);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col sm:flex-row gap-6 hover:border-zinc-600 transition-colors group text-left"
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

              <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-800">
                {item.damage && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-600 uppercase font-bold block tracking-tighter">Damage</span>
                    <span className="text-xs text-zinc-300 font-mono">{item.damage} {item.damageType}</span>
                  </div>
                )}
                {item.criticalModifier && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-600 uppercase font-bold block tracking-tighter">Crit</span>
                    <span className="text-xs text-zinc-300 font-mono">{item.criticalModifier}</span>
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
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedEquipment && selectedEquipment.equipmentClass === 'Armor' ? (
          <ArmorModal
            item={selectedEquipment}
            onClose={() => { setSelectedEquipment(null); onNavigate(); }}
          />
        ) : selectedEquipment ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedEquipment(null);
                onNavigate();
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              layoutId={selectedEquipment.id}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 z-[70] shadow-2xl"
            >
              <div className="flex justify-between items-start gap-6 mb-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-[10px] uppercase tracking-widest font-bold text-zinc-300 border border-zinc-700">
                    {renderEquipmentIcon(selectedEquipment.type)}
                    <span>{selectedEquipment.type}</span>
                  </div>
                  <div>
                    <h3 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tighter">{selectedEquipment.label}</h3>
                    <p className="text-zinc-400 leading-relaxed mt-3 max-w-2xl">{selectedEquipment.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEquipment(null);
                    onNavigate();
                  }}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <Maximize2 className="w-6 h-6 rotate-45" />
                </button>
              </div>

              {!['WondrousItem', 'AlchemicalSubstance', 'ArcanoTech', 'BoundConstruct', 'AlchemicalItem'].includes(selectedEquipment.equipmentClass ?? '') && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 py-6 border-y border-zinc-800">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Cost</span>
                    <p className="text-zinc-100 font-medium">{selectedEquipment.cost ? selectedEquipment.cost.toLocaleString() : '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Weight</span>
                    <p className="text-zinc-100 font-medium">{selectedEquipment.weight ?? '-'} kg</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Damage</span>
                    <p className="text-zinc-100 font-medium">{selectedEquipment.damage ? `${selectedEquipment.damage}${selectedEquipment.damageType ? ` ${selectedEquipment.damageType}` : ''}` : '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Range</span>
                    <p className="text-zinc-100 font-medium">{selectedEquipment.range ? `${selectedEquipment.range.normal}/${selectedEquipment.range.maximum}m` : '-'}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {buildSpecializedSections(selectedEquipment).map((section) => {
                  const visibleFields = section.fields.filter((field) => asDisplayValue(field.value) !== undefined);

                  if (visibleFields.length === 0) return null;

                  return (
                    <section key={section.title} className="space-y-4">
                      <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">{section.title}</h4>
                      <div className={`grid gap-4 ${visibleFields.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                        {visibleFields.map((field) => (
                          <div key={field.label}>
                            <DetailCard label={field.label} value={asDisplayValue(field.value)} />
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}

                <section className="space-y-4">
                  <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Special Notes</h4>
                  <div className="space-y-4">
                    <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">Properties</span>
                      <p className="text-sm text-zinc-300 leading-relaxed">{selectedEquipment.specialProperties || 'No additional properties recorded.'}</p>
                    </div>
                    <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center gap-2 mb-3">
                        <Tag className="w-3 h-3" /> Tags
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedEquipment.tags?.length ? selectedEquipment.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">{tag}</span>
                        )) : <span className="text-sm text-zinc-500">No tags recorded.</span>}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ArmorModal({ item, onClose }: { item: Equipment; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
      />
      <motion.div
        layoutId={item.id}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 z-[70] shadow-2xl"
      >
        {/* Header */}
        <div className="flex justify-between items-start gap-6 mb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-[10px] uppercase tracking-widest font-bold text-zinc-300 border border-zinc-700">
              <Shield className="w-4 h-4 text-zinc-400" />
              <span>{item.category ?? 'Armor'}</span>
            </div>
            <div>
              <h3 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tighter">{item.label}</h3>
              <p className="text-zinc-400 leading-relaxed mt-3 max-w-2xl">{item.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors shrink-0"
          >
            <Maximize2 className="w-6 h-6 rotate-45" />
          </button>
        </div>

        {/* Quick stats: Armor Class, Category, Base Speed, Cost */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 py-6 border-y border-zinc-800">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Armor Class</span>
            <p className="text-2xl font-bold text-orange-400">{item.armorClass ?? '-'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Category</span>
            <p className="text-zinc-100 font-medium">{item.category ?? '-'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Base Speed</span>
            <p className="text-zinc-100 font-medium">
              {item.baseSpeed != null
                ? typeof item.baseSpeed === 'number' ? `${item.baseSpeed} ft` : item.baseSpeed
                : '-'}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Cost</span>
            <p className="text-zinc-100 font-medium">{item.cost ? item.cost.toLocaleString() : '-'}</p>
          </div>
        </div>

        {/* Main body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Armor stats */}
          <section className="space-y-4">
            <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Armor Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailCard label="Max Dexterity" value={item.maxDexterity} />
              <DetailCard label="Damage Absorption" value={item.damageAbsorption} />
              <DetailCard label="Hardness" value={item.hardness} />
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

          {/* Special Properties */}
          <section className="space-y-4">
            <h4 className="text-sm text-zinc-500 uppercase font-bold tracking-widest border-b border-zinc-800 pb-2">Special Properties</h4>
            <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {item.specialProperties || 'No special properties recorded.'}
              </p>
            </div>
          </section>
        </div>
      </motion.div>
    </>
  );
}

function DetailCard({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="bg-zinc-800/40 border border-zinc-800 rounded-lg p-4">
      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block mb-2">{label}</span>
      <p className="text-sm text-zinc-200">{value ?? '-'}</p>
    </div>
  );
}
