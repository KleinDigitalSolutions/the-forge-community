'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Palette,
  Megaphone,
  Factory,
  Wallet,
  Settings,
  Zap,
  Package,
  BarChart3,
  Users,
  Box,
  TrendingUp
} from 'lucide-react';

interface ForgeSidebarProps {
  ventureId: string;
  ventureName: string;
}

const FORGE_MENU = [
  {
    section: 'OVERVIEW',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/forge/[id]' },
    ]
  },
  {
    section: 'BUILD',
    items: [
      { icon: Palette, label: 'Brand DNA', href: '/forge/[id]/brand' },
    ]
  },
  {
    section: 'MARKETING',
    items: [
      { icon: Megaphone, label: 'Campaigns', href: '/forge/[id]/marketing' },
      { icon: BarChart3, label: 'Analytics', href: '/forge/[id]/analytics' },
    ]
  },
  {
    section: 'SOURCING',
    items: [
      { icon: Factory, label: 'Suppliers', href: '/forge/[id]/sourcing' },
      { icon: Box, label: 'Samples', href: '/forge/[id]/samples' },
      { icon: TrendingUp, label: 'Orders', href: '/forge/[id]/orders' },
    ]
  },
  {
    section: 'ADMIN',
    items: [
      { icon: Wallet, label: 'Budget', href: '/forge/[id]/admin' },
      { icon: Users, label: 'Team', href: '/forge/[id]/team' },
      { icon: Settings, label: 'Settings', href: '/forge/[id]/settings' },
    ]
  }
];

export default function ForgeSidebar({ ventureId, ventureName }: ForgeSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-950 border-r border-white/5 flex flex-col">
      {/* Logo / Venture Name */}
      <div className="p-6 border-b border-white/5">
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
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
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
