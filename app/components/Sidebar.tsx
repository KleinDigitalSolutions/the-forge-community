'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  CheckSquare, 
  PieChart, 
  FileText, 
  Settings, 
  LogOut,
  Zap,
  Target
} from 'lucide-react';
import { SignOutButton } from './SignOutButton';

const navigation = [
  { name: 'Cockpit', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Forum', href: '/forum', icon: MessageSquare },
  { name: 'Squad Markt', href: '/squads', icon: Users },
  { name: 'Mission Control', href: '/tasks', icon: CheckSquare },
  { name: 'Finanzen', href: '/transparency', icon: PieChart },
  { name: 'Wissen', href: '/resources', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#08090A] border-r border-white/5 flex flex-col z-50 overflow-hidden">
      {/* Subtle Sidebar Glow */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[var(--accent)]/5 to-transparent pointer-events-none" />

      {/* Brand */}
      <div className="p-8 relative z-10">
        <Link href="/dashboard" className="flex flex-col group">
          <span className="font-caveat text-2xl tracking-normal text-white group-hover:text-[var(--accent)] transition-colors lowercase">stake & scale</span>
          <span className="text-[8px] font-black text-white/20 tracking-[0.3em] uppercase ml-1">Operator v1.0</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto relative z-10 scrollbar-hide">
        <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] px-4 mb-4 mt-2">
          Platform
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
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
            </Link>
          );
        })}

        <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] px-4 mb-4 mt-10">
          Account
        </div>
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
      <div className="p-6 border-t border-white/5 relative z-10 bg-black/20">
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 text-[10px] font-bold text-white mb-2 relative z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Operator Status
          </div>
          <p className="text-[9px] text-white/30 uppercase tracking-widest leading-relaxed relative z-10">
            Investment aktiv.<br/>Vollständiger Zugriff.
          </p>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}