import React from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Navbar() {
  const onRules = useMatch({ path: '/rules/*', end: false });
  const onRaces = useMatch({ path: '/races/*', end: false });
  const onArchetypes = useMatch({ path: '/archetypes/*', end: false });
  const onSpells = useMatch({ path: '/spells/*', end: false });
  const onEquipment = useMatch({ path: '/equipment/*', end: false });
  const onSkills = useMatch({ path: '/skills/*', end: false });
  const onFeatures = useMatch({ path: '/features/*', end: false });
  const onSetting = useMatch({ path: '/setting/*', end: false });

  const isRules = !!(onRules || onRaces || onArchetypes || onSpells || onEquipment || onSkills || onFeatures);
  const isSetting = !!onSetting;

  const topLinkClass = (active: boolean) =>
    `px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors rounded-md ${
      active
        ? 'text-white bg-zinc-800'
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
    }`;

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <NavLink
              to="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Shield className="w-8 h-8 text-orange-500" />
              <span className="text-xl font-bold tracking-tighter text-white uppercase">Stellar Arcana</span>
            </NavLink>

            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/rules" className={() => topLinkClass(isRules)}>
                Rules
              </NavLink>
              <NavLink to="/setting" className={() => topLinkClass(isSetting)}>
                Setting
              </NavLink>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <NavLink
              to="/character-creation"
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded hover:border-zinc-600 transition-colors"
            >
              Create Character
            </NavLink>
            <NavLink
              to="/character-sheet"
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded hover:border-zinc-600 transition-colors"
            >
              Character Sheet
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
