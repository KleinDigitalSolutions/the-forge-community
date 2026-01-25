'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, Zap } from 'lucide-react';
import { FORGE_MENU } from '@/app/components/forge/forge-menu';

interface ForgeSidebarProps {
  ventureId: string;
  ventureName: string;
}

export default function ForgeSidebar({ ventureId, ventureName }: ForgeSidebarProps) {
  const pathname = usePathname();
  const [audioState, setAudioState] = useState<{ isPlaying: boolean; track: any; hasStarted: boolean }>({
    isPlaying: false,
    track: null,
    hasStarted: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('forge-audio-started');
    if (saved === 'true') {
      setAudioState(prev => ({ ...prev, hasStarted: true }));
    }
    const handleState = (e: any) => setAudioState(e.detail);
    window.addEventListener('forge-audio-state', handleState);
    return () => window.removeEventListener('forge-audio-state', handleState);
  }, []);

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-white/5 bg-zinc-950 md:flex">
      {/* Logo / Venture Name */}
      <div className="p-6 border-b border-white/5" data-tour="venture-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">THE FORGE</p>
            <h3 className="text-sm text-white font-semibold truncate">{ventureName}</h3>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        {FORGE_MENU.map((section) => (
          <div key={section.section}>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 px-3">
              {section.section}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const href = item.href.replace('[id]', ventureId);
                const isActive = pathname === href;
                const Icon = item.icon;

                return (
                  <Link
                    key={href}
                    href={href}
                    data-tour={item.tourId}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 px-3">
            System
          </p>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new CustomEvent('forge-toggle-music', { detail: { open: true } }))
            }
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <Music className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">Audio Player</span>
            {audioState.isPlaying && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
            )}
          </button>
        </div>
      </nav>

      {/* Back to Main */}
      <div className="p-4 border-t border-white/5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
