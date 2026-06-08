import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Shield } from 'lucide-react';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-orange-500/30 selection:text-orange-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-900 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-zinc-700" />
            <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">Stellar Arcana &copy; 2026</span>
          </div>
          <div className="flex gap-8 text-[10px] uppercase font-bold tracking-widest text-zinc-700">
            <Link to="/changelog" className="hover:text-zinc-400 transition-colors">
              Changelog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
