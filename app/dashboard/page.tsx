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
import { playGtaWelcomeTrack } from '@/lib/ui-sound';
import LightPillar from '@/app/components/visual/LightPillar';
import { Music as MusicIcon, Play } from 'lucide-react';

// Forge OS Components
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

  const handleToggleView = (view: string) => {
    if (view === 'music') {
      window.dispatchEvent(new CustomEvent('forge-toggle-music', { detail: { open: true } }));
      return;
    }
    setActiveView(activeView === view ? 'idle' : view);
  };

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

  useEffect(() => {
    if (!data?.user) return;
    const storageKey = 'gta-welcome-track-played';
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(storageKey)) return;

    const handleFirstInteraction = () => {
      playGtaWelcomeTrack();
      localStorage.setItem(storageKey, '1');
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    return () => window.removeEventListener('pointerdown', handleFirstInteraction);
  }, [data?.user?.id]);

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
        <div className="absolute inset-0 bg-black" />

        {/* UI OVERLAY */}
        <div className="relative z-10 w-full h-full">
          
          {/* BACKGROUND TEXT LAYER */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none select-none overflow-hidden">
            <h1 
              className="text-[22vw] font-black uppercase tracking-tighter opacity-[0.12] leading-[0.8]"
              style={{
                WebkitTextStroke: '2px rgba(255,255,255,0.5)',
                color: 'transparent',
                fontFamily: 'var(--font-instrument-serif), serif',
                filter: 'blur(0.5px)'
              }}
            >
              The<br/>Forge
            </h1>
          </div>

          {/* BACKGROUND LIGHT PILLAR EFFECT */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
            <LightPillar
              topColor="#ff6a00"
              bottomColor="#fec700"
              intensity={0.8}
              rotationSpeed={0.2}
              glowAmount={0.0015}
              pillarWidth={2.5}
              pillarHeight={0.3}
              noiseIntensity={0.4}
              pillarRotation={15}
              interactive={false}
              mixBlendMode="screen"
              quality="medium"
            />
          </div>
          
          {/* MAIN STAGE (Absolute Center) */}
          <main className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
            
            {/* The Core (Interactable) */}
            <div className="z-50">
               <CockpitControl 
                  userImage={user.image}
                  userName={user.name}
                  stats={{ ventures: ventures.length, tasks: allTasks.length }}
                  onToggleView={handleToggleView}
                  minimal
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
                // ... (Missions code remains unchanged)
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

            {/* AUDIO CORE: MUSIC PLAYER - PREMIUM OVERHAUL */}
            <AnimatePresence>
              {(activeView === 'music') && (
                <motion.div 
                  initial={{ y: 50, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ y: 50, opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  className="pointer-events-auto absolute bottom-12 left-1/2 -translate-x-1/2 w-[min(540px,95vw)] z-[70]"
                >
                  <div className="relative group">
                    {/* Multi-Layer Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] via-orange-600 to-amber-900 rounded-[2.5rem] opacity-20 group-hover:opacity-40 blur-xl transition duration-1000 animate-pulse"></div>
                    
                    {/* Main Console Body */}
                    <div className="relative bg-black/85 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden pointer-events-auto">
                      
                      {/* Holographic Texture Overlay */}
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                      <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />

                      {/* Tech Brackets - MATCHING RADIUS */}
                      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#D4AF37]/60 rounded-tl-[2.5rem] pointer-events-none" />
                      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37]/60 rounded-tr-[2.5rem] pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37]/60 rounded-bl-[2.5rem] pointer-events-none" />
                      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#D4AF37]/60 rounded-br-[2.5rem] pointer-events-none" />

                      {/* Header Area */}
                      <div className="px-8 pt-7 pb-5 flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37] blur-md opacity-20 animate-pulse" />
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 flex items-center justify-center">
                              <MusicIcon className="w-5 h-5 text-[#D4AF37] animate-[spin_4s_linear_infinite]" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white text-shadow-sm">Audio Core</h2>
                              <span className="px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-[7px] text-green-400 font-bold animate-pulse">LIVE</span>
                            </div>
                            <p className="text-[9px] text-[#D4AF37]/50 uppercase tracking-[0.2em] font-mono">FRG-OS // SIGNAL_V2.23</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex flex-col items-end mr-4 opacity-40">
                            <span className="text-[7px] font-mono uppercase tracking-widest text-white/60">Decibel // -12.4dB</span>
                            <span className="text-[7px] font-mono uppercase tracking-widest text-white/60">Buffer // 100%</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveView('idle'); }} 
                            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-white/40 hover:text-[#D4AF37] group/close relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-[#D4AF37]/0 group-hover/close:bg-[#D4AF37]/10 transition-colors" />
                            <X className="w-5 h-5 relative z-10"/>
                          </button>
                        </div>
                      </div>

                      {/* Audio Controller Interface (Triggers Global Player) */}
                      <div className="px-6 pb-8 relative z-10">
                        <div className="relative rounded-[1.5rem] overflow-hidden bg-black/60 border border-white/5 shadow-inner p-8 flex flex-col items-center justify-center gap-6 group/player">
                          
                          <div className="relative">
                            <div className="absolute inset-0 bg-[#D4AF37] blur-2xl opacity-20 group-hover/player:opacity-40 transition-opacity" />
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('forge-start-music'));
                              }}
                              className="relative w-24 h-24 rounded-full bg-linear-to-br from-[#D4AF37] to-amber-700 flex items-center justify-center text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] transition-all group/btn"
                            >
                              <Play className="w-10 h-10 fill-current ml-1 group-hover/btn:scale-110 transition-transform" />
                            </motion.button>
                          </div>

                          <div className="text-center">
                            <h3 className="text-white font-bold tracking-widest text-xs uppercase mb-2">Initialize Global Stream</h3>
                            <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
                              Activate Neural Audio Link for persistent background ambience across all sectors.
                            </p>
                          </div>

                          {/* Decorative Waveform Mockup */}
                          <div className="flex gap-1 h-4 items-end opacity-30">
                            {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.4].map((h, i) => (
                              <motion.div 
                                key={i}
                                animate={{ height: [h*100 + '%', (1-h)*100 + '%', h*100 + '%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                                className="w-1 bg-[#D4AF37] rounded-full"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Sub-Footer System Data - NOW SEAMLESS */}
                      <div className="px-8 py-4 bg-white/[0.05] border-t border-white/10 flex justify-between items-center relative z-10">
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-[#D4AF37] animate-ping" />
                            <span className="text-[7px] font-bold text-[#D4AF37]/80 uppercase tracking-widest">Mastering Active</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">Neural Link</span>
                          </div>
                        </div>
                        <span className="text-[7px] font-mono text-white/30 uppercase tracking-[0.3em]">Sector 7-G // Audio Stream</span>
                      </div>
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
