'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import PageShell from '@/app/components/PageShell';
import { ArrowUpRight, Wallet, Users, MessageSquare, TrendingUp, Shield, Zap, Target } from 'lucide-react';
import Link from 'next/link';
import { RoadmapWidget } from '@/app/components/RoadmapWidget';

export default function Dashboard() {
  const [stats, setStats] = useState({
    capital: 0,
    squads: 0,
    posts: 0,
    growth: 0
  });

  useEffect(() => {
    setStats({ capital: 25000, squads: 3, posts: 12, growth: 15 });
  }, []);

  return (
    <AuthGuard>
      <PageShell>
        <header className="mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.3em] mb-6">
            <Shield className="w-3 h-3" />
            Verschlüsselte Verbindung aktiv
          </div>
          <h1 className="text-5xl md:text-6xl font-instrument-serif text-white tracking-tight mb-4">Cockpit</h1>
          <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">Willkommen zurück, Operator. Statusbericht bereit.</p>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <KpiCard 
            title="Gesamtes Kapital" 
            value={`€ ${stats.capital.toLocaleString()}`} 
            icon={Wallet} 
            trend="+2.5% diesen Monat"
          />
          <KpiCard 
            title="Aktive Squads" 
            value={stats.squads} 
            icon={Users} 
            trend="Rekrutierungs-Phase"
          />
          <KpiCard 
            title="Forum Aktivität" 
            value={stats.posts} 
            icon={MessageSquare} 
            trend="+12 neue Beiträge"
          />
          <KpiCard 
            title="Netzwerk Wert" 
            value={`${stats.growth}k`} 
            icon={TrendingUp} 
            trend="Geschätzte Reichweite"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
             <div className="glass-card rounded-3xl border border-white/10 p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <RoadmapWidget />
             </div>
             
             {/* Quick Actions */}
             <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-card p-10 rounded-3xl border border-white/10 hover:border-[var(--accent)]/30 transition-all duration-700 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:border-[var(--accent)]/50 transition-all">
                    <Target className="w-6 h-6 group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                  <h3 className="text-2xl font-instrument-serif text-white mb-3">Squad Markt</h3>
                  <p className="text-white/40 text-sm mb-8 leading-relaxed">
                    Finde Mitgründer oder investiere in bestehende Teams der Schmiede.
                  </p>
                  <Link href="/squads" className="inline-flex items-center gap-3 text-[10px] font-black text-[var(--accent)] hover:brightness-110 transition-all uppercase tracking-[0.2em]">
                    ZUM MARKTPLATZ <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="glass-card p-10 rounded-3xl border border-white/10 hover:border-[var(--accent)]/30 transition-all duration-700 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:border-[var(--accent)]/50 transition-all">
                    <MessageSquare className="w-6 h-6 group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                  <h3 className="text-2xl font-instrument-serif text-white mb-3">Community Forum</h3>
                  <p className="text-white/40 text-sm mb-8 leading-relaxed">
                    Diskutiere Strategien, hole Feedback ein und teile Protokolle.
                  </p>
                  <Link href="/forum" className="inline-flex items-center gap-3 text-[10px] font-black text-[var(--accent)] hover:brightness-110 transition-all uppercase tracking-[0.2em]">
                    DISKUSSION STARTEN <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
             </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
             <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                <h3 className="text-[10px] font-black text-white/30 mb-8 uppercase tracking-[0.4em]">Letzte Aktivitäten</h3>
                <div className="space-y-8">
                   {[
                     { user: 'Max M.', action: 'stimmte für', target: 'SmartStore V2' },
                     { user: 'Sarah K.', action: 'startete Squad', target: 'CleanSaaS' },
                     { user: 'Özgür A.', action: 'aktualisierte', target: 'Infrastruktur' },
                   ].map((item, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                         <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-1.5 shrink-0 shadow-[0_0_10px_var(--accent)]" />
                         <div className="flex flex-col">
                           <p className="text-xs text-white/60 leading-relaxed">
                             <span className="font-bold text-white group-hover:text-[var(--accent)] transition-colors">{item.user}</span> {item.action} <span className="text-white font-medium">{item.target}</span>
                           </p>
                           <span className="text-[9px] text-white/20 uppercase tracking-widest mt-1">vor 2 Stunden</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="bg-gradient-to-br from-[var(--accent)] to-[#FF5500] p-8 rounded-3xl relative overflow-hidden group cursor-pointer shadow-2xl">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <Zap className="w-12 h-14 text-white/20 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform duration-700" />
                <h4 className="text-white font-instrument-serif text-2xl mb-2 relative z-10">Batch #002</h4>
                <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold relative z-10 mb-6">In Vorbereitung</p>
                <button className="bg-white text-black px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest relative z-10 hover:scale-105 transition-transform">Vormerken</button>
             </div>
          </div>
        </div>
      </PageShell>
    </AuthGuard>
  );
}

function KpiCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="glass-card p-8 rounded-3xl border border-white/10 hover:border-[var(--accent)]/40 transition-all duration-700 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl group-hover:border-[var(--accent)]/30 transition-all">
          <Icon className="w-5 h-5 text-white group-hover:text-[var(--accent)] transition-colors" />
        </div>
        {trend && <span className="text-[9px] font-bold text-[var(--accent)] tracking-widest uppercase py-1 px-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">{trend}</span>}
      </div>
      <div className="relative z-10">
        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">{title}</div>
        <div className="text-3xl font-instrument-serif text-white tracking-tight group-hover:scale-105 transition-transform duration-700 origin-left">{value}</div>
      </div>
    </div>
  );
}