'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import PageShell from '@/app/components/PageShell';
import { ArrowUpRight, Wallet, Users, MessageSquare, TrendingUp } from 'lucide-react';
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
             <RoadmapWidget />
             
             {/* Quick Actions */}
             <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                  <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white mb-4">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Squad Market</h3>
                  <p className="text-zinc-500 text-xs mb-4 leading-relaxed">
                    Finde Mitgründer oder investiere in bestehende Teams.
                  </p>
                  <Link href="/squads" className="inline-flex items-center gap-2 text-xs font-black text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">
                    Zum Markt <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
                  <div className="h-10 w-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white mb-4">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Community Forum</h3>
                  <p className="text-zinc-500 text-xs mb-4 leading-relaxed">
                    Diskutiere Strategien, hole Feedback ein.
                  </p>
                  <Link href="/forum" className="inline-flex items-center gap-2 text-xs font-black text-zinc-900 hover:text-zinc-600 transition-colors uppercase tracking-wide">
                    Diskussion starten <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
             </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
             {/* Activity Feed Placeholder */}
             <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-200">
                <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-widest">Recent Activity</h3>
                <div className="space-y-4">
                   {[1,2,3].map(i => (
                      <div key={i} className="flex gap-3 items-start">
                         <div className="w-2 h-2 rounded-full bg-zinc-300 mt-1.5 shrink-0" />
                         <p className="text-xs text-zinc-500">
                           <span className="font-bold text-zinc-900">Max Mustermann</span> voted on <span className="text-zinc-900">Brand V2</span>
                         </p>
                      </div>
                   ))}
                </div>
             </div>
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
