'use client';

import { useEffect, useState } from 'react';
import PageShell from '@/app/components/PageShell';
import AuthGuard from '@/app/components/AuthGuard';
import { Users, Target, Calendar, ArrowUpRight, TrendingUp, Lock, Unlock } from 'lucide-react';
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
  'Recruiting': { color: 'bg-emerald-500', label: 'Open for Investment', icon: Unlock },
  'Building': { color: 'bg-blue-500', label: 'In Development', icon: Users },
  'Live': { color: 'bg-indigo-500', label: 'Market Live', icon: TrendingUp },
  'Exit': { color: 'bg-purple-500', label: 'Exit Phase', icon: ArrowUpRight },
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
        <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Squad Market</h1>
            <p className="text-zinc-500 font-medium">Investiere Zeit & Kapital in High-Performance Teams.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-zinc-200 flex gap-8">
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Value</div>
              <div className="text-2xl font-black text-zinc-900">€ 75.000</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Active Squads</div>
              <div className="text-2xl font-black text-zinc-900">{squads.length}</div>
            </div>
          </div>
        </header>

        {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="h-64 bg-zinc-100 rounded-3xl animate-pulse" />
              ))}
            </div>
        ) : squads.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-zinc-300 p-20 text-center">
              <p className="text-zinc-400 font-bold text-lg">Der Markt ist gerade ruhig.</p>
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
                  transition={{ delay: idx * 0.1 }}
                  className="group relative bg-white rounded-[2rem] border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-6 right-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>

                  <div className="p-8 pb-0">
                    <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {squad.name.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 mb-1">{squad.name}</h3>
                    <p className="text-sm text-zinc-500 font-medium">E-Commerce Brand</p>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Target Cap</div>
                        <div className="text-lg font-black text-zinc-900">€ {squad.targetCapital}</div>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Launch</div>
                        <div className="text-lg font-black text-zinc-900">
                          {squad.startDate ? new Date(squad.startDate).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }) : 'TBA'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-zinc-500 mb-2">
                        <span>Founders Board</span>
                        <span>{(squad.currentCount || 2)} / {squad.maxFounders} Seats</span>
                      </div>
                      <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPercent}%` }}
                          className={`h-full ${config.color}`}
                        />
                      </div>
                      <div className="flex -space-x-2 mt-3">
                        {[...Array(squad.maxFounders)].map((_, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${
                            i < (squad.currentCount || 2) ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-300'
                          }`}>
                            {i < (squad.currentCount || 2) ? 'F' : '+'}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className="w-full bg-black text-white py-4 rounded-xl font-black text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-95 flex justify-center items-center gap-2">
                      {squad.status === 'Recruiting' ? 'Apply for Seat' : 'View Details'} <ArrowUpRight className="w-4 h-4" />
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
