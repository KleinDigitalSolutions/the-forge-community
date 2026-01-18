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
  Zap
} from 'lucide-react';
import { SignOutButton } from './SignOutButton'; // Wir nutzen den existierenden Button Logik, aber stylen ihn neu

const navigation = [
  { name: 'Cockpit', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Forum', href: '/forum', icon: MessageSquare },
  { name: 'Squad Market', href: '/squads', icon: Users },
  { name: 'Mission Control', href: '/tasks', icon: CheckSquare },
  { name: 'Finanzen', href: '/transparency', icon: PieChart },
  { name: 'Wissen', href: '/resources', icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-zinc-200 flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-zinc-100">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-black shadow-lg group-hover:scale-105 transition-transform">
            F
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900">THE FORGE</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-2 mt-2">
          Platform
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-zinc-900 text-white shadow-md' 
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-900'}`} />
              {item.name}
            </Link>
          );
        })}

        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-2 mt-6">
          Account
        </div>
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
            pathname === '/profile' 
              ? 'bg-zinc-900 text-white' 
              : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
          Founder Dossier
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-100">
        <div className="bg-zinc-50 rounded-xl p-4 mb-4 border border-zinc-100">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 mb-1">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            Pro Status
          </div>
          <p className="text-[10px] text-zinc-500 leading-tight">
            Dein Investment ist aktiv. Zugriff gewährt.
          </p>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
