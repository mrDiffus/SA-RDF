import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Book, Users, Zap, Star, BookOpen, Sword, ScrollText } from 'lucide-react';

const RULES_SUBNAV = [
  { to: '/rules', label: 'Rules', icon: Book, end: true },
  { to: '/races', label: 'Races', icon: Users, end: false },
  { to: '/archetypes', label: 'Archetypes', icon: Zap, end: false },
  { to: '/features', label: 'Features', icon: Star, end: false },
  { to: '/skills', label: 'Skills', icon: BookOpen, end: false },
  { to: '/spells', label: 'Spells', icon: ScrollText, end: false },
  { to: '/equipment', label: 'Equipment', icon: Sword, end: false },
];

export default function RulesLayout() {
  return (
    <div>
      <div className="border-b border-zinc-800 -mt-12 mb-8">
        <div className="flex items-baseline gap-1 overflow-x-auto pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {RULES_SUBNAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
