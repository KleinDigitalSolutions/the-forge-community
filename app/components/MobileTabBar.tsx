'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Image as ImageIcon, LayoutDashboard, MessageCircle, MessageSquare } from 'lucide-react';
import { useUnreadMessages } from '@/app/hooks/useUnreadMessages';

const tabs = [
  { href: '/dashboard', label: 'Cockpit', icon: LayoutDashboard },
  { href: '/media', label: 'Media', icon: ImageIcon },
  { href: '/forum', label: 'Forum', icon: MessageSquare },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { unreadCount } = useUnreadMessages();
  const messageBadge = unreadCount > 99 ? '99+' : String(unreadCount);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#08090A]/95 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-around px-4 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          const showBadge = tab.href === '/messages' && unreadCount > 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${
                active
                  ? 'text-[var(--accent)] bg-white/5'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {showBadge && (
                <span className="absolute right-2 top-1 h-4 min-w-[16px] rounded-full bg-[#D4AF37] px-1 text-[9px] font-bold text-black flex items-center justify-center">
                  {messageBadge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
