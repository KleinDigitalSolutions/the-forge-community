'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import PageShell from '@/app/components/PageShell';
import { ArrowUpRight, Wallet, Users, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({
    capital: 0,
    squads: 0,
    posts: 0,
    growth: 0
  });

  useEffect(() => {
    // Hier können wir später echte API-Calls machen
    // fetch('/api/stats').then...
    setStats({ capital: 25000, squads: 3, posts: 12, growth: 15 });
  }, []);

  return (
    <AuthGuard>
      <PageShell>
        <header className="mb-12">
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight mb-2">Cockpit</h1>
          <p className="text-zinc-500 font-medium">Willkommen zurück, Founder. Hier ist dein Statusbericht.</p>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <KpiCard 
            title="Total Capital" 
            value={`€ ${stats.capital.toLocaleString()}`} 
            icon={Wallet} 
            trend="+2.5% this month"
          />
          <KpiCard 
            title="Active Squads" 
            value={stats.squads} 
            icon={Users} 
            trend="Recruiting phase"
          />
          <KpiCard 
            title="Forum Activity" 
            value={stats.posts} 
            icon={MessageSquare} 
            trend="+12 new posts"
          />
          <KpiCard 
            title="Network Value" 
            value={`${stats.growth}k`} 
            icon={TrendingUp} 
            trend="Estimated reach"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
            <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Squad Market</h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Finde Mitgründer oder investiere in bestehende Teams. Der Markt ist geöffnet.
            </p>
            <Link href="/squads" className="inline-flex items-center gap-2 text-sm font-black text-zinc-900 hover:text-zinc-600 transition-colors">
              Zum Markt <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
            <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Community Forum</h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              Diskutiere Strategien, hole Feedback ein oder teile deine Wins.
            </p>
            <Link href="/forum" className="inline-flex items-center gap-2 text-sm font-black text-zinc-900 hover:text-zinc-600 transition-colors">
              Diskussion starten <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </PageShell>
    </AuthGuard>
  );
}

function KpiCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-zinc-50 rounded-lg">
          <Icon className="w-5 h-5 text-zinc-900" />
        </div>
        {trend && <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{title}</div>
        <div className="text-2xl font-black text-zinc-900 tracking-tight">{value}</div>
      </div>
    </div>
  );
}
