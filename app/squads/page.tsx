'use client';

import { useEffect, useState } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { Users, Target, Calendar, ArrowUpRight, TrendingUp, Lock, Unlock, Shield, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

interface Squad {
  id: string;
  name: string;
  targetCapital: string;
  status: string;
  maxFounders: number;
  startDate: string;
  currentCount?: number;
}

const statusConfig: Record<string, { color: string, label: string, icon: any }> = {
  'Recruiting': { color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10', label: 'Investition offen', icon: Unlock },
  'Building': { color: 'text-blue-500 border-blue-500/20 bg-blue-500/10', label: 'In Entwicklung', icon: Users },
  'Live': { color: 'text-indigo-500 border-indigo-500/20 bg-indigo-500/10', label: 'Markt Live', icon: TrendingUp },
  'Exit': { color: 'text-purple-500 border-purple-500/20 bg-purple-500/10', label: 'Exit Phase', icon: ArrowUpRight },
};

export default function SquadsPage() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSquads() {
      try {
        const res = await fetch('/api/squads');
        if (res.ok) {
          const data = await res.json();
          setSquads(data);
        }
      } catch (e) {
        console.error('Error fetching squads:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchSquads();
  }, []);

  return (
    <AuthGuard>
      <PageShell>
        <header className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8 relative">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.3em] mb-6">
              <Rocket className="w-3 h-3" />
              Verfügbare Operationen
            </div>
            <h1 className="text-5xl md:text-6xl font-instrument-serif text-white tracking-tight mb-4">Squad Markt</h1>
            <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">Investiere Zeit & Kapital in High-Performance Teams.</p>
          </div>
          <div className="glass-card px-8 py-6 rounded-3xl border border-white/10 flex gap-12 relative z-10">
            <div>
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Gesamtwert</div>
              <div className="text-3xl font-instrument-serif text-white tracking-tight">€ 75.000</div>
            </div>
            <div>
              <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Aktive Squads</div>
              <div className="text-3xl font-instrument-serif text-white tracking-tight">{squads.length}</div>
            </div>
          </div>
        </header>

        {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1,2,3].map(i => (
                <div key={i} className="h-[450px] bg-white/5 rounded-[2.5rem] border border-white/5 animate-pulse" />
              ))}
            </div>
        ) : squads.length === 0 ? (
          <div className="glass-card rounded-[2.5rem] border border-dashed border-white/10 p-24 text-center">
              <p className="text-white/20 font-black uppercase tracking-[0.4em] text-sm">Der Markt ist gerade ruhig.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {squads.map((squad, idx) => {
              const config = statusConfig[squad.status] || statusConfig['Recruiting'];
              const Icon = config.icon;
              const fillPercent = Math.min(((squad.currentCount || 2) / squad.maxFounders) * 100, 100);

              return (
                <motion.div 
                  key={squad.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative glass-card rounded-[2.5rem] border border-white/10 hover:border-[var(--accent)]/30 transition-all duration-700 overflow-hidden flex flex-col shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                  
                  <div className="p-10 pb-0 relative z-10 flex justify-between items-start">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[var(--accent)] text-3xl font-instrument-serif shadow-2xl group-hover:border-[var(--accent)]/50 transition-all duration-700">
                      {squad.name.charAt(0)}
                    </div>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>

                  <div className="p-10 pb-6 relative z-10 flex-1">
                    <h3 className="text-3xl font-instrument-serif text-white mb-2 group-hover:text-[var(--accent)] transition-colors duration-700">{squad.name}</h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mb-10">E-Commerce Brand</p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                        <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Ziel-Kapital</div>
                        <div className="text-xl font-instrument-serif text-white">€ {squad.targetCapital}</div>
                      </div>
                      <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                        <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Launch</div>
                        <div className="text-xl font-instrument-serif text-white">
                          {squad.startDate ? new Date(squad.startDate).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }) : 'TBA'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                        <span>Founders Board</span>
                        <span className="text-[var(--accent)]">{(squad.currentCount || 2)} / {squad.maxFounders} Plätze</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPercent}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={`h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]`}
                        />
                      </div>
                      <div className="flex -space-x-3 mt-6">
                        {[...Array(squad.maxFounders)].map((_, i) => (
                          <div key={i} className={`w-9 h-9 rounded-full border-2 border-[#08090A] flex items-center justify-center text-[10px] font-black shadow-xl transition-transform hover:scale-110 relative ${
                            i < (squad.currentCount || 2) ? 'bg-[var(--accent)] text-black' : 'bg-white/5 text-white/10'
                          }`}>
                            {i < (squad.currentCount || 2) ? 'F' : '+'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-10 pt-0 relative z-10 mt-auto">
                    <button className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[var(--accent)] transition-all duration-500 shadow-2xl active:scale-[0.98] flex justify-center items-center gap-3 group/btn">
                      {squad.status === 'Recruiting' ? 'Platz anfordern' : 'Details ansehen'} 
                      <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </PageShell>
    </AuthGuard>
  );
}