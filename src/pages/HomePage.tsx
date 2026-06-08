import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomePage() {
  const navigate = useNavigate();

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
              onClick={() => navigate('/rules')}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-full hover:bg-orange-500 hover:text-white transition-all"
            >
              Begin Exploration <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/setting')}
              className="px-8 py-4 bg-zinc-900 text-white border border-zinc-800 font-bold uppercase tracking-widest rounded-full hover:bg-zinc-800 transition-all"
            >
              View Lore Archives
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
