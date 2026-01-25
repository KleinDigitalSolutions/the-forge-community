'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Image as ImageIcon, LayoutDashboard, MessageCircle, MessageSquare, Music, Play, Pause, SkipForward } from 'lucide-react';
import { useUnreadMessages } from '@/app/hooks/useUnreadMessages';
import { useState, useEffect } from 'react';

const tabs = [
  // ... (tabs array remains unchanged)
  { href: '/dashboard', label: 'Cockpit', shortLabel: 'Home', icon: LayoutDashboard },
  { href: '/media', label: 'Media', shortLabel: 'Media', icon: ImageIcon },
  { href: '/forum', label: 'Forum', shortLabel: 'Forum', icon: MessageSquare },
  { href: '/messages', label: 'Messages', shortLabel: 'Chat', icon: MessageCircle },
  { href: '/tasks', label: 'Tasks', shortLabel: 'Tasks', icon: CheckSquare },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();
  const messageBadge = unreadCount > 99 ? '99+' : String(unreadCount);
  const [audioState, setAudioState] = useState<{ isPlaying: boolean; track: any; hasStarted: boolean }>({
    isPlaying: false,
    track: null,
    hasStarted: false
  });

  useEffect(() => {
    const handleState = (e: any) => setAudioState(e.detail);
    window.addEventListener('forge-audio-state', handleState);
    return () => window.removeEventListener('forge-audio-state', handleState);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[140] lg:hidden">
      {/* Mini Audio Controller for Mobile */}
      {audioState.hasStarted && (
        <div className="px-2 pb-2">
          <div className="bg-[#08090A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <Music className={`w-5 h-5 text-[#D4AF37] ${audioState.isPlaying ? 'animate-pulse' : ''}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/80 font-bold truncate">
                {audioState.track?.title || 'System Stream'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('forge-toggle-play'))}
                className="w-10 h-10 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center active:scale-90 transition-all"
              >
                {audioState.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('forge-skip-music'))}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 active:scale-90"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="border-t border-white/10 bg-[#08090A]/95 backdrop-blur-xl px-2 sm:px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            const showBadge = tab.href === '/messages' && unreadCount > 0;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-1 rounded-xl px-1.5 xs:px-2 sm:px-3 py-2 text-[8px] xs:text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.05em] xs:tracking-[0.1em] sm:tracking-[0.15em] transition ${
                  active
                    ? 'text-[var(--accent)] bg-white/5'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.shortLabel}</span>
                {showBadge && (
                  <span className="absolute -right-0.5 top-0.5 sm:right-1 sm:top-1 h-4 min-w-[16px] rounded-full bg-[#D4AF37] px-1 text-[9px] font-bold text-black flex items-center justify-center">
                    {messageBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
