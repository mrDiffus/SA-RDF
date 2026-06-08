import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Globe, Building2, Users } from 'lucide-react';

const SETTING_SUBNAV = [
  { to: '/setting', label: 'Overview', icon: Globe, end: true },
  { to: '/setting/planets', label: 'Planets', icon: Globe, end: false },
  { to: '/setting/organizations', label: 'Organizations', icon: Building2, end: false },
  { to: '/setting/characters', label: 'Characters', icon: Users, end: false },
];

export default function SettingLayout() {
  return (
    <div>
      <div className="border-b border-zinc-800 -mt-12 mb-8">
        <div className="flex items-baseline gap-1 overflow-x-auto pb-0 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {SETTING_SUBNAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-purple-500 text-white'
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
