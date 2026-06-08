import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-24 space-y-6">
      <p className="text-[10px] uppercase tracking-widest text-zinc-600">404</p>
      <h1 className="text-4xl font-bold text-white uppercase tracking-tighter">Page Not Found</h1>
      <p className="text-zinc-500">The archive you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}
