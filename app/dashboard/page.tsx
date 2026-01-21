'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import PageShell from '@/app/components/PageShell';
import { 
  Rocket,
  Plus,
  ArrowRight,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Layout,
  Users
} from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from '@/app/components/onboarding/OnboardingWizard';
import { formatDistanceToNow, isPast, isToday } from 'date-fns';
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

  const { user, ventures } = data;

  // Aggregate and sort tasks from all ventures
  const allTasks = ventures.flatMap(v => v.tasks.map((t: any) => ({ ...t, ventureName: v.name, ventureId: v.id })))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <AuthGuard>
      <PageShell>
        {user && !user.onboardingComplete && (
          <OnboardingWizard 
            user={user} 
            onComplete={() => {
              setData(prev => prev ? { ...prev, user: { ...prev.user, onboardingComplete: true } } : null);
            }} 
          />
        )}

        <header className="mb-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-instrument-serif text-white tracking-tight mb-2">
                Operator Cockpit
              </h1>
              <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">
                Willkommen zurück, {user.name?.split(' ')[0]}.
              </p>
            </div>
            <Link href="/ventures/new" className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 flex items-center gap-2 transition-all">
              <Plus className="w-3 h-3" />
              Neues Venture
            </Link>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Ventures (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-instrument-serif text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-[#D4AF37]" />
                  Active Ventures
                </h2>
              </div>

              {ventures.length === 0 ? (
                <div className="glass-card p-10 rounded-2xl border border-white/10 text-center space-y-4 bg-gradient-to-br from-[#D4AF37]/5 to-transparent">
                  <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto border border-[#D4AF37]/20">
                    <Rocket className="w-8 h-8 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-2xl font-instrument-serif text-white">Keine aktiven Ventures</h3>
                  <p className="text-white/50 text-sm max-w-md mx-auto">
                    Starte jetzt dein erstes Venture, um Zugriff auf Mission Control und Ressourcen zu erhalten.
                  </p>
                  <Link href="/ventures/new" className="inline-flex items-center gap-2 text-[#D4AF37] font-bold text-xs uppercase tracking-widest hover:underline mt-2">
                    Jetzt starten <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {ventures.map((venture) => {
                    const progress = Math.round(((venture.completedSteps?.length || 0) / (venture._count?.steps || 6)) * 100);
                    
                    return (
                      <Link key={venture.id} href={`/forge/${venture.id}`} className="group block">
                        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-[#D4AF37]/30 transition-all bg-white/[0.02] hover:bg-white/[0.04]">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors">{venture.name}</h3>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/5 text-white/40 border border-white/5">
                                  {venture.type}
                                </span>
                              </div>
                              <p className="text-white/40 text-xs line-clamp-1">{venture.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-instrument-serif text-white">{progress}%</div>
                              <div className="text-[9px] text-white/30 uppercase tracking-widest">Fortschritt</div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
                            <div 
                              className="h-full bg-[#D4AF37] transition-all duration-1000 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-4">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5" />
                                Phase {venture.currentStep}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Updated {formatDistanceToNow(new Date(venture.lastActivityAt || venture.updatedAt), { addSuffix: true, locale: de })}
                              </span>
                            </div>
                            <span className="group-hover:translate-x-1 transition-transform text-white">
                              Details <ArrowRight className="w-3 h-3 inline ml-1" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: Mission Control (1/3 width) */}
          <div className="space-y-8">
            <section className="glass-card p-6 rounded-2xl border border-white/10 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-instrument-serif text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-400" />
                  Mission Control
                </h2>
                <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-white/40">{allTasks.length} Tasks</span>
              </div>

              {allTasks.length === 0 ? (
                <div className="text-center py-12">
                   <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                   </div>
                   <p className="text-white/40 text-xs">Alles erledigt.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allTasks.map((task, i) => {
                    const isOverdue = isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
                    return (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group cursor-default">
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <h4 className="text-sm text-white font-medium leading-tight">{task.title}</h4>
                          {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/30 uppercase tracking-wider truncate max-w-[100px]">
                            {task.ventureName}
                          </span>
                          <span className={`text-[10px] font-mono ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
                            {isOverdue ? 'Überfällig' : formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: de })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {allTasks.length > 0 && (
                    <div className="pt-4 mt-2 border-t border-white/5 text-center">
                      <p className="text-[10px] text-white/20 italic">
                        Bearbeite Tasks im jeweiligen Venture Dashboard.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Quick Links Compact */}
            <section className="glass-card p-6 rounded-2xl border border-white/10">
               <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Quick Access</h3>
               <div className="space-y-2">
                 <Link href="/squads" className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors text-sm text-white/70 hover:text-white">
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400"><Users className="w-3 h-3" /></div>
                    Squad finden
                 </Link>
                 <Link href="/resources" className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors text-sm text-white/70 hover:text-white">
                    <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center text-green-400"><Layout className="w-3 h-3" /></div>
                    Ressourcen
                 </Link>
               </div>
            </section>
          </div>
        </div>
      </PageShell>
    </AuthGuard>
  );
}