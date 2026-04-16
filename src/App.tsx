import React, { startTransition, useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import SpellList from './components/SpellList';
import ArchetypeList from './components/ArchetypeList';
import RaceList from './components/RaceList';
import RuleList from './components/RuleList';
import EquipmentList from './components/EquipmentList';
import GeneralFeaturesList from './components/GeneralFeaturesList';
import SettingView from './components/SettingView';
import CharacterSheet from './components/CharacterSheet';
import { fetchEquipment, fetchRaces, fetchRules } from './data';
import { AppRoute, AppTab, curieToRelativeIri, getCollectionHref, getCurrentRelativeIri, parseBrowserRoute } from './rdfNavigation';
import { Shield, Zap, Star, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [route, setRoute] = useState<AppRoute>({ tab: 'home' });
  const [routeReady, setRouteReady] = useState(false);

  const navigateTo = (nextRoute: AppRoute, replace = false) => {
    const nextHref = nextRoute.resourceId
      ? (curieToRelativeIri(nextRoute.resourceId)
          ?? (nextRoute.tab === 'equipment' ? `/equipment/${encodeURIComponent(nextRoute.resourceId)}` : null))
      : getCollectionHref(nextRoute.tab);

    if (!nextHref) {
      return;
    }

    const currentHref = getCurrentRelativeIri(window.location);
    if (currentHref !== nextHref || (!nextRoute.resourceId && window.location.pathname !== nextHref)) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', nextHref);
    }

    startTransition(() => setRoute(nextRoute));
    setRouteReady(true);
  };

  useEffect(() => {
    const normalizeForLookup = (value: string): string =>
      decodeURIComponent(value)
        .trim()
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ');

    const resolveRouteForResource = async (resourceId: string): Promise<AppRoute | null> => {
      if (resourceId.startsWith('spell:')) return { tab: 'spells', resourceId };
      if (resourceId.startsWith('archetype:')) return { tab: 'archetypes', resourceId };

      const [races, rules, equipment] = await Promise.all([
        fetchRaces(),
        fetchRules(),
        fetchEquipment()
      ]);

      const equipmentLookupId = resourceId.startsWith('equipment:')
        ? resourceId.slice('equipment:'.length)
        : resourceId;
      const normalizedLookupId = normalizeForLookup(equipmentLookupId);

      const matchedEquipment = equipment.find((item) => {
        const normalizedItemId = normalizeForLookup(item.id);
        const normalizedItemLabel = normalizeForLookup(item.label);
        return normalizedItemId === normalizedLookupId || normalizedItemLabel === normalizedLookupId;
      });

      if (matchedEquipment) return { tab: 'equipment', resourceId: matchedEquipment.id };

      if (races.some((race) => race.id === resourceId)) return { tab: 'races', resourceId };
      if (rules.some((rule) => rule.id === resourceId)) return { tab: 'rules', resourceId };

      return null;
    };

    const applyLocation = async () => {
      const { collectionTab, resourceId } = parseBrowserRoute(window.location.pathname, window.location.hash);

      if (collectionTab && !resourceId) {
        startTransition(() => setRoute({ tab: collectionTab }));
        setRouteReady(true);
        return;
      }

      if (resourceId) {
        const resolvedRoute = await resolveRouteForResource(resourceId);
        startTransition(() => setRoute(resolvedRoute ?? { tab: 'home' }));
        setRouteReady(true);
        return;
      }

      if (collectionTab) {
        startTransition(() => setRoute({ tab: collectionTab }));
        setRouteReady(true);
        return;
      }

      startTransition(() => setRoute({ tab: 'home' }));
      setRouteReady(true);
    };

    void applyLocation();

    const handlePopState = () => {
      void applyLocation();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderContent = () => {
    switch (route.tab) {
      case 'rules':
        return <RuleList selectedResourceId={route.resourceId} onNavigate={(resourceId) => navigateTo(resourceId ? { tab: 'rules', resourceId } : { tab: 'rules' })} />;
      case 'races':
        return <RaceList selectedResourceId={route.resourceId} onNavigate={(resourceId) => navigateTo(resourceId ? { tab: 'races', resourceId } : { tab: 'races' })} />;
      case 'archetypes':
        return (
          <ArchetypeList
            selectedResourceId={route.resourceId}
            onNavigate={(resourceId) => navigateTo(resourceId ? { tab: 'archetypes', resourceId } : { tab: 'archetypes' })}
          />
        );
      case 'spells':
        return <SpellList selectedResourceId={route.resourceId} onNavigate={(resourceId) => navigateTo(resourceId ? { tab: 'spells', resourceId } : { tab: 'spells' })} />;
      case 'equipment':
        return <EquipmentList selectedResourceId={route.resourceId} onNavigate={(resourceId) => navigateTo(resourceId ? { tab: 'equipment', resourceId } : { tab: 'equipment' })} />;
      case 'general-features':
        return <GeneralFeaturesList />;
      case 'character-sheet':
        return <CharacterSheet />;
      case 'lore':
        return <SettingView />;
      default:
        return <Home onExplore={() => navigateTo({ tab: 'rules' })} onLore={() => navigateTo({ tab: 'lore' })} />;
    }
  };

  if (!routeReady) {
    return <div className="min-h-screen bg-black text-zinc-300 grid place-items-center">Resolving archive route...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-orange-500/30 selection:text-orange-200">
      <Navbar 
        activeTab={route.tab}
        setActiveTab={(tab) => navigateTo({ tab })}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={route.tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-zinc-900 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-zinc-700" />
            <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Stellar Arcana &copy; 2026</span>
          </div>
          <div className="flex gap-8 text-[10px] uppercase font-bold tracking-widest text-zinc-700">
          </div>
        </div>
      </footer>
    </div>
  );
}

function Home({ onExplore, onLore }: { onExplore: () => void; onLore: () => void }) {
  return (
    <div className="space-y-24 py-12">
      <section className="relative">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] uppercase font-bold tracking-[0.2em] text-orange-500 mb-4"
          >
            <Zap className="w-3 h-3" /> System Version 1.0.4-Alpha
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-white uppercase tracking-tighter leading-[0.9]">
            Stellar <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-purple-300">Arcana</span>
          </h1>
          
          <p className="text-xl text-zinc-400 leading-relaxed">
            Stellar Arcana is a science-fantasy tabletop setting where ancient magic fuels interstellar travel and high-tech weaponry is etched with arcane runes. Explore the hive cities of Arcech or survive the brutal highlands of Arrur.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <button 
              onClick={onExplore}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-full hover:bg-orange-500 hover:text-white transition-all"
            >
              Begin Exploration <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-zinc-900 text-white border border-zinc-800 font-bold uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-all" onClick={onLore}>
              View Lore Archives
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {([] as { icon: typeof Shield; title: string; desc: string }[]).map((feature, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-2xl hover:border-zinc-700 transition-colors">
            <feature.icon className="w-10 h-10 text-orange-500 mb-6" />
            <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-4">{feature.title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
