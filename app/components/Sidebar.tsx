'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Sliders, Music, Play, Pause, SkipForward, Maximize2, CreditCard } from 'lucide-react';
import { SignOutButton } from './SignOutButton';
import { CreditsDisplay } from './CreditsDisplay';
import { useUnreadMessages } from '@/app/hooks/useUnreadMessages';
import { navigation } from './navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();
  const [audioState, setAudioState] = useState<{ isPlaying: boolean; track: any; hasStarted: boolean }>({
    isPlaying: false,
    track: null,
    hasStarted: false
  });

  useEffect(() => {
    // Check if audio was started in previous session
    const saved = localStorage.getItem('forge-audio-started');
    if (saved === 'true') {
      setAudioState(prev => ({ ...prev, hasStarted: true }));
    }

    const handleState = (e: any) => setAudioState(e.detail);
    window.addEventListener('forge-audio-state', handleState);
    return () => window.removeEventListener('forge-audio-state', handleState);
  }, []);

  const messageBadge = unreadCount > 99 ? '99+' : String(unreadCount);
  const openAudioModal = () =>
    window.dispatchEvent(new CustomEvent('forge-toggle-music', { detail: { open: true } }));

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#08090A] border-r border-white/5 flex flex-col z-50 overflow-hidden">
      {/* Subtle Sidebar Glow */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[var(--accent)]/5 to-transparent pointer-events-none" />

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto relative z-10 scrollbar-hide">
        <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] px-4 mb-4">
          Platform
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.name === 'Messages' && unreadCount > 0;
          const showStatus = item.status === 'WIP';
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500 group ${
                isActive 
                  ? 'bg-white/5 text-[var(--accent)] shadow-[0_0_20px_rgba(212,175,55,0.05)] border border-white/10' 
                  : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              {item.name}
              {showStatus && (
                <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
                  In Arbeit
                </span>
              )}
              {showBadge && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#D4AF37] text-[9px] font-bold text-black flex items-center justify-center shadow-[0_0_10px_rgba(212,175,55,0.35)]">
                  {messageBadge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] px-4 mb-4 mt-10">
          Account
        </div>
        <Link
          href="/settings/billing"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500 group ${
            pathname === '/settings/billing'
              ? 'bg-white/5 text-[var(--accent)] border border-white/10'
              : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <CreditCard className="w-4 h-4 transition-transform duration-500 group-hover:rotate-6" />
          Billing
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500 group ${
            pathname === '/settings'
              ? 'bg-white/5 text-[var(--accent)] border border-white/10'
              : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Sliders className="w-4 h-4 transition-transform duration-500 group-hover:rotate-12" />
          Account
        </Link>
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500 group ${
            pathname === '/profile' 
              ? 'bg-white/5 text-[var(--accent)] border border-white/10' 
              : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
          }`}
        >
          <Settings className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90" />
          Founder Dossier
        </Link>
      </nav>

      {/* Audio System Sidebar Widget */}
      <div className="px-4 mb-4 relative z-20">
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center ${audioState.isPlaying ? 'animate-pulse' : ''}`}>
              <Music className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest leading-none mb-1">Audio Link</p>
              <p className="text-[10px] text-white/60 font-medium truncate">
                {audioState.track?.title || (audioState.hasStarted ? 'System Stream' : 'Stream bereit')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <button 
              onClick={() => {
                if (audioState.hasStarted) {
                  window.dispatchEvent(new CustomEvent('forge-toggle-play'));
                } else {
                  openAudioModal();
                  window.dispatchEvent(new CustomEvent('forge-play-music'));
                }
              }}
              className="flex-1 h-8 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
            >
              {audioState.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('forge-skip-music'))}
              className={`w-10 h-8 rounded-xl flex items-center justify-center transition-colors ${
                audioState.hasStarted ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
              disabled={!audioState.hasStarted}
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button 
              onClick={openAudioModal}
              className="w-10 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-[#D4AF37] transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 relative z-10 bg-black/20 pb-6 pt-4">
        <CreditsDisplay />
        <div className="px-6 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>Operator</span>
            </div>
            <span className="text-white/60 tracking-widest">Access aktiv</span>
          </div>
          <SignOutButton />
        </div>
      </div>
  </aside>
  );
}
