'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/app/components/AuthGuard';
import { 
  Rocket,
  Target,
  X,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import OnboardingWizard from '@/app/components/onboarding/OnboardingWizard';
import { formatDistanceToNow, isPast, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Forge OS Components
import HolographicGrid from '@/app/components/forge/HolographicGrid';
import CockpitControl from '@/app/components/forge/CockpitControl';

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
  const [bootSequence, setBootSequence] = useState(true); // Neu: Boot Animation State
  
  const [activeView, setActiveView] = useState<string>('idle');

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      // Künstliche Verzögerung für den "Boot Effekt" (nur 800ms)
      setTimeout(() => {
        setLoading(false);
        setTimeout(() => setBootSequence(false), 1000); 
      }, 800);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-6">
           <div className="relative w-24 h-24">
             <div className="absolute inset-0 border-4 border-[#D4AF37]/20 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-t-[#D4AF37] rounded-full animate-spin"></div>
             <div className="absolute inset-4 border-2 border-white/10 rounded-full animate-pulse"></div>
           </div>
           <div className="text-[#D4AF37] font-mono text-xs uppercase tracking-[0.3em] animate-pulse">
             System Initializing...
           </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, ventures } = data;
  const allTasks = ventures.flatMap(v => v.tasks.map((t: any) => ({ ...t, ventureName: v.name, ventureId: v.id })))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10);

  return (
    <AuthGuard>
      {/* Container: 100vh fixiert, kein Scrollen im Main View, nur in den Panels */}
      <div className="fixed inset-0 bg-black overflow-hidden font-sans text-white selection:bg-[#D4AF37]/30">
        
        {/* BACKGROUND SYSTEM */}
        <HolographicGrid />

        {/* UI OVERLAY */}
        <div className="relative z-10 w-full h-full">
          
          {/* HEADER (Top Bar HUD) */}
          <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium">Forge OS <span className="text-[#D4AF37]">v2.4</span></span>
              </div>
              <h1 className="text-2xl font-instrument-serif text-white mt-2 tracking-tight">
                Operator {user.name?.split(' ')[0]}
              </h1>
            </div>
            
            <div className="flex gap-8 text-right">
              <div className="hidden md:block">
                <div className="text-xl font-mono text-[#D4AF37]">{data.stats.karma}</div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/30">Karma Level</div>
              </div>
            </div>
          </motion.header>

          {/* MAIN STAGE (Absolute Center) */}
          <main className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
            
            {/* The Core (Interactable) */}
            <div className="z-50">
               <CockpitControl 
                  userImage={user.image}
                  userName={user.name}
                  stats={{ ventures: ventures.length, tasks: allTasks.length }}
                  onToggleView={(view) => setActiveView(activeView === view ? 'idle' : view)}
               />
            </div>

            {/* LEFT PANEL: VENTURES */}
            <AnimatePresence>
              {(activeView === 'ventures') && (
                <motion.div 
                  initial={{ x: -100, opacity: 0, scale: 0.9 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: -100, opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                  className="pointer-events-auto absolute left-8 top-1/2 -translate-y-1/2 w-[400px] h-[60vh] flex flex-col perspective-1000 z-40"
                >
                  <div className="w-full h-full bg-[#050505]/80 border border-white/10 p-1 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
                    {/* Panel Header */}
                    <div className="p-6 border-b border-white/5 bg-white/5">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-instrument-serif text-[#D4AF37] flex items-center gap-3">
                          <Rocket className="w-5 h-5" />
                          Active Ventures
                        </h2>
                        <button onClick={() => setActiveView('idle')} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"><X className="w-4 h-4"/></button>
                      </div>
                    </div>

                    {/* Content List */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {ventures.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/40">
                          <Rocket className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-sm mb-6">Keine aktiven Ventures gefunden.</p>
                          <Link href="/ventures/new" className="px-6 py-2 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-widest rounded hover:brightness-110">
                            Starten
                          </Link>
                        </div>
                      ) : (
                        ventures.map(v => (
                          <Link key={v.id} href={`/forge/${v.id}`} className="block group">
                            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-[#D4AF37]/30 transition-all duration-300">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <span className="block font-bold text-white text-lg group-hover:text-[#D4AF37] transition-colors">{v.name}</span>
                                  <span className="text-[10px] uppercase tracking-widest text-white/40">{v.type}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-mono text-white/80">
                                    {Math.round((v.currentPhase / 6) * 100)}%
                                  </div>
                                </div>
                              </div>
                              {/* Progress Bar */}
                              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FCD34D]" 
                                  style={{ width: `${(v.currentPhase / 6) * 100}%` }}
                                />
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-white/5 bg-black/20">
                      <Link href="/ventures/new" className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl text-white/60 hover:text-[#D4AF37] text-xs font-bold uppercase tracking-widest transition-all">
                        <span className="text-lg leading-none">+</span> Neues Venture
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RIGHT PANEL: MISSIONS */}
            <AnimatePresence>
              {(activeView === 'missions') && (
                <motion.div 
                  initial={{ x: 100, opacity: 0, scale: 0.9 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: 100, opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 30, stiffness: 200 }}
                  className="pointer-events-auto absolute right-8 top-1/2 -translate-y-1/2 w-[400px] h-[60vh] flex flex-col perspective-1000 z-40"
                >
                  <div className="w-full h-full bg-[#050505]/80 border border-white/10 p-1 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/5">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-instrument-serif text-red-400 flex items-center gap-3">
                          <Target className="w-5 h-5" />
                          Mission Control
                        </h2>
                        <button onClick={() => setActiveView('idle')} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"><X className="w-4 h-4"/></button>
                      </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {allTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-white/40">
                           <Target className="w-12 h-12 mb-4 opacity-20" />
                           <p className="text-sm">Alle Systeme nominal. Keine Aufgaben.</p>
                        </div>
                      ) : (
                        allTasks.map((task, i) => {
                           const isOverdue = isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
                           return (
                            <div key={i} className="group p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] transition-colors cursor-default">
                              <div className="flex justify-between items-start gap-3 mb-2">
                                <span className="text-sm font-medium text-white/90 leading-snug group-hover:text-white transition-colors">{task.title}</span>
                                {isOverdue && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                              </div>
                              <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2">
                                <span className="text-[9px] uppercase tracking-wider text-white/30 truncate max-w-[120px]">{task.ventureName}</span>
                                <span className={`text-[10px] font-mono ${isOverdue ? 'text-red-400 font-bold' : 'text-white/40'}`}>
                                  {isOverdue ? 'CRITICAL' : formatDistanceToNow(new Date(task.dueDate), { addSuffix: true, locale: de })}
                                </span>
                              </div>
                            </div>
                           );
                        })
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </main>

          {/* FOOTER (Bottom Status) */}
          <motion.footer 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-8 left-0 w-full text-center pointer-events-none"
          >
             <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-light">
               Secure Environment • System Active
             </p>
          </motion.footer>

        </div>
        
        {/* Onboarding Overlay */}
        {user && !user.onboardingComplete && (
          <div className="absolute inset-0 z-[60] bg-black/90 flex items-center justify-center">
             <div className="max-w-4xl w-full">
               <OnboardingWizard 
                user={user} 
                onComplete={() => {
                  setData(prev => prev ? { ...prev, user: { ...prev.user, onboardingComplete: true } } : null);
                }} 
              />
             </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
