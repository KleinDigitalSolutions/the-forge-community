'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import PageShell from '@/app/components/PageShell';
import { 
  ArrowUpRight, 
  Wallet, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  Zap, 
  Target, 
  Rocket,
  Plus,
  ArrowRight,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { RoadmapWidget } from '@/app/components/RoadmapWidget';
import OnboardingWizard from '@/app/components/onboarding/OnboardingWizard';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface DashboardData {
  user: any;
  ventures: any[];
  squads: any[];
  stats: {
    myVentures: number;
    mySquads: number;
    forumPosts: number;
    karma: number;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Initialisiere Cockpit...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!data) return null;

  const { user, ventures, squads, stats } = data;

  return (
    <AuthGuard>
      <PageShell>
        {user && !user.onboardingComplete && (
          <OnboardingWizard 
            user={user} 
            onComplete={() => {
              // Optimistic update
              setData(prev => prev ? { ...prev, user: { ...prev.user, onboardingComplete: true } } : null);
            }} 
          />
        )}

        <header className="mb-12 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.3em] mb-6">
            <Shield className="w-3 h-3" />
            Operator Access: Granted
          </div>
          <h1 className="text-5xl md:text-6xl font-instrument-serif text-white tracking-tight mb-4">
            Willkommen, {user.name || 'Founder'}.
          </h1>
          <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">
            Status: {ventures.length > 0 ? 'Active Deployment' : 'Ready to Launch'} • System V2.0 Online
          </p>
        </header>

        {/* Ventures Section - THE CORE */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
             <h2 className="text-2xl font-instrument-serif text-white">Deine Ventures</h2>
             {ventures.length > 0 && (
                <Link href="/ventures/new" className="text-xs font-bold text-[#D4AF37] hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest">
                   <Plus className="w-4 h-4" /> Neues Venture
                </Link>
             )}
          </div>

          {ventures.length === 0 ? (
            // EMPTY STATE - CALL TO ACTION
            <div className="glass-card p-12 rounded-3xl border border-white/10 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                  <div className="w-24 h-24 bg-[#D4AF37]/10 rounded-full flex items-center justify-center border border-[#D4AF37]/20 shrink-0">
                     <Rocket className="w-10 h-10 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                     <h3 className="text-3xl font-instrument-serif text-white mb-2">Starte deine Reise</h3>
                     <p className="text-white/50 max-w-xl leading-relaxed">
                        Die Forge ist bereit für deine Idee. Nutze unsere AI-gestützten Tools für Brand DNA, Legal und Marketing, um von 0 auf 1 zu skalieren.
                     </p>
                  </div>
                  <Link 
                    href="/ventures/new"
                    className="px-8 py-4 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-[#FFD700] transition-colors flex items-center gap-2 shrink-0"
                  >
                    Venture Erstellen <ArrowRight className="w-4 h-4" />
                  </Link>
               </div>
            </div>
          ) : (
            // VENTURE LIST
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {ventures.map((venture) => (
                  <Link key={venture.id} href={`/forge/${venture.id}`} className="group">
                    <div className="glass-card p-8 rounded-3xl border border-white/10 h-full hover:border-[#D4AF37]/30 transition-all duration-500 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                       
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#D4AF37]/50 transition-colors">
                             <Zap className="w-6 h-6 text-white group-hover:text-[#D4AF37]" />
                          </div>
                          <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] transition-colors">
                             {venture.status}
                          </span>
                       </div>

                       <h3 className="text-2xl font-instrument-serif text-white mb-2 group-hover:translate-x-1 transition-transform">{venture.name}</h3>
                       <p className="text-white/40 text-sm line-clamp-2 mb-6 h-10">
                          {venture.description || 'Keine Beschreibung'}
                       </p>

                       <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                             {formatDistanceToNow(new Date(venture.updatedAt), { addSuffix: true, locale: de })}
                          </span>
                          <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                             <ArrowUpRight className="w-4 h-4" />
                          </span>
                       </div>
                    </div>
                  </Link>
               ))}
               
               {/* Add New Card (Mini) */}
               <Link href="/ventures/new" className="glass-card p-8 rounded-3xl border border-white/10 border-dashed hover:border-[#D4AF37]/50 hover:bg-white/[0.02] transition-all flex flex-col items-center justify-center gap-4 group text-center cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Plus className="w-6 h-6 text-white/40 group-hover:text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white">Neues Venture</span>
               </Link>
            </div>
          )}
        </section>

        {/* Stats & Quick Actions Grid */}
        <div className="grid lg:grid-cols-4 gap-6 mb-16">
          <KpiCard 
            title="Meine Squads" 
            value={stats.mySquads} 
            icon={Users} 
            trend={stats.mySquads > 0 ? "Aktiv" : "Suchend"}
            href="/squads"
          />
          <KpiCard 
            title="Forum Beiträge" 
            value={stats.forumPosts} 
            icon={MessageSquare} 
            href="/forum"
          />
          <KpiCard 
            title="Kapitalbedarf" 
            value="€ 0" 
            icon={Wallet} 
            trend="Pre-Seed"
            opacity={true}
          />
          <KpiCard 
            title="System Status" 
            value="Online" 
            icon={TrendingUp} 
            trend="V 1.0.2"
            opacity={true}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Roadmap Widget */}
          <div className="lg:col-span-2 space-y-8">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-instrument-serif text-white">Community Roadmap</h2>
                <Link href="/roadmap" className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">
                   Alle Anzeigen
                </Link>
             </div>
             <div className="glass-card rounded-3xl border border-white/10 p-8 relative overflow-hidden">
                <RoadmapWidget />
             </div>
          </div>

          {/* Quick Links / Resources */}
          <div className="space-y-8">
             <h2 className="text-xl font-instrument-serif text-white mb-4">Quick Links</h2>
             
             <Link href="/squads" className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                   <Target className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-white font-bold">Squad finden</h4>
                   <p className="text-xs text-white/50">Schließe dich Experten an</p>
                </div>
             </Link>

             <Link href="/forum" className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                   <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-white font-bold">Community</h4>
                   <p className="text-xs text-white/50">Austausch & Hilfe</p>
                </div>
             </Link>

             <Link href="/resources" className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                   <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-white font-bold">Ressourcen</h4>
                   <p className="text-xs text-white/50">Tools & Guides</p>
                </div>
             </Link>
          </div>
        </div>
      </PageShell>
    </AuthGuard>
  );
}

function KpiCard({ title, value, icon: Icon, trend, href, opacity }: any) {
  const CardContent = (
    <div className={`glass-card p-8 rounded-3xl border border-white/10 hover:border-[var(--accent)]/40 transition-all duration-700 relative overflow-hidden group h-full ${opacity ? 'opacity-60 hover:opacity-100' : ''}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl group-hover:border-[var(--accent)]/30 transition-all">
          <Icon className="w-5 h-5 text-white group-hover:text-[var(--accent)] transition-colors" />
        </div>
        {trend && <span className="text-[9px] font-bold text-[var(--accent)] tracking-widest uppercase py-1 px-2 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">{trend}</span>}
      </div>
      <div className="relative z-10">
        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">{title}</div>
        <div className="text-2xl font-instrument-serif text-white tracking-tight">{value}</div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{CardContent}</Link>;
  }
  return <div className="h-full">{CardContent}</div>;
}
