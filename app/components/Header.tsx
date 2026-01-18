'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SignOutButton } from './SignOutButton';

export default function Header() {
  const { status } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-zinc-200 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-black shadow-lg group-hover:scale-105 transition-transform">
            F
          </div>
          <span className="font-bold text-lg tracking-tight text-zinc-900">THE FORGE</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {status === 'authenticated' ? (
            <Link
              href="/dashboard"
              className="text-sm font-bold text-zinc-900 hover:text-zinc-600 transition-colors"
            >
              Zum Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors">
                Login
              </Link>
              <a
                href="#apply"
                className="bg-zinc-900 text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-zinc-800 transition-all shadow-md"
              >
                Apply Now
              </a>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}