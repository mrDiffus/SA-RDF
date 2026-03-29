import React from 'react';
import { AppTab } from '../rdfNavigation';
import { Shield, Zap, Users, Book, Sword, Globe, Building2, Star } from 'lucide-react';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const GAME_TABS = [
  { id: 'rules' as AppTab, label: 'Rules', icon: Book },
  { id: 'races' as AppTab, label: 'Races', icon: Users },
  { id: 'archetypes' as AppTab, label: 'Archetypes', icon: Zap },
  { id: 'general-features' as AppTab, label: 'Features', icon: Star },
  { id: 'spells' as AppTab, label: 'Spells', icon: Zap },
  { id: 'equipment' as AppTab, label: 'Equipment', icon: Sword },
];

const LORE_TABS = [
  { id: 'lore' as AppTab, label: 'Planets', icon: Globe },
  { id: 'lore' as AppTab, label: 'Organizations', icon: Building2 },
];

const LORE_MODE_TABS: AppTab[] = ['lore'];

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const isLoreMode = LORE_MODE_TABS.includes(activeTab);
  const tabs = isLoreMode ? LORE_TABS : GAME_TABS;

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setActiveTab('home')}
            >
              <Shield className="w-8 h-8 text-orange-500" />
              <span className="text-xl font-bold tracking-tighter text-white uppercase">Stellar Arcana</span>
            </div>
            <div className="hidden md:flex items-baseline space-x-4">
              {isLoreMode && (
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-500 mr-2 border border-purple-800 rounded px-2 py-1">
                  Lore Archives
                </span>
              )}
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
