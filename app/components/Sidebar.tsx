'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Sliders } from 'lucide-react';
import { SignOutButton } from './SignOutButton';
import { CreditsDisplay } from './CreditsDisplay';
import { useUnreadMessages } from '@/app/hooks/useUnreadMessages';
import { navigation } from './navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();
  const messageBadge = unreadCount > 99 ? '99+' : String(unreadCount);

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
