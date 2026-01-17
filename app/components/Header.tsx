'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut, signIn } from 'next-auth/react';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => pathname === path;
  const isAuth = status === 'authenticated';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-[#f8f4f0]/90 backdrop-blur-md border-b border-[var(--border)] z-50">
        <div className="w-full px-8 md:px-12 lg:px-16 py-2 flex justify-between items-center">
          {/* Logo */}
          <Link href={isAuth ? "/dashboard" : "/"} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full border border-[var(--border)] bg-white/70 flex items-center justify-center font-display text-[0.6rem] tracking-[0.32em] text-[var(--foreground)]">
              S&S
            </div>
            <div className="leading-tight">
              <div className="text-[0.7rem] uppercase tracking-[0.4em] text-[var(--secondary)]">
                Stake &amp; Scale
              </div>
              <div className="text-xs text-[var(--secondary)]">
                {isAuth ? 'Dashboard' : 'Community Venture Studio'}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 items-center text-[0.7rem] uppercase tracking-[0.28em] text-[var(--secondary)]">
            {isAuth ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`transition-colors ${isActive('/dashboard') ? 'text-[var(--foreground)] font-medium' : 'hover:text-[var(--foreground)]'}`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/transparency" 
                  className={`transition-colors ${isActive('/transparency') ? 'text-[var(--foreground)] font-medium' : 'hover:text-[var(--foreground)]'}`}
                >
                  Transparenz
                </Link>
                <Link 
                  href="/forum" 
                  className={`transition-colors ${isActive('/forum') ? 'text-[var(--foreground)] font-medium' : 'hover:text-[var(--foreground)]'}`}
                >
                  Forum
                </Link>
                <Link 
                  href="/tasks" 
                  className={`transition-colors ${isActive('/tasks') ? 'text-[var(--foreground)] font-medium' : 'hover:text-[var(--foreground)]'}`}
                >
                  Tasks
                </Link>
                <Link 
                  href="/resources" 
                  className={`transition-colors ${isActive('/resources') ? 'text-[var(--foreground)] font-medium' : 'hover:text-[var(--foreground)]'}`}
                >
                  Resources
                </Link>
                <Link 
                  href="/squads" 
                  className={`transition-colors ${isActive('/squads') ? 'text-[var(--foreground)] font-medium' : 'hover:text-[var(--foreground)]'}`}
                >
                  Squads
                </Link>
                
                <div className="h-4 w-px bg-[var(--border)] mx-2" />

                {/* Profile & Logout */}
                <Link 
                  href="/profile" 
                  className={`flex items-center gap-2 hover:text-[var(--foreground)] transition-colors ${isActive('/profile') ? 'text-[var(--foreground)]' : ''}`}
                  title="Mein Profil"
                >
                  <User className="w-4 h-4" />
                </Link>
                
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hover:text-red-600 transition-colors"
                  title="Abmelden"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
                  Home
                </Link>
                <Link href="/transparency" className="hover:text-[var(--foreground)] transition-colors">
                  Transparenz
                </Link>
                {/* Apply Button */}
                <Link
                  href="/#apply"
                  className="bg-[var(--accent)] text-white px-4 py-2 rounded-full hover:bg-[#0b2f24] transition-colors text-[0.65rem] tracking-[0.3em] uppercase"
                >
                  Founder werden
                </Link>
                <button
                  onClick={() => signIn()}
                  className="ml-2 hover:text-[var(--foreground)] transition-colors"
                >
                  Login
                </button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-[var(--border)] text-[var(--foreground)] hover:bg-white/70 transition-colors"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[78%] max-w-xs bg-[var(--surface)] z-50 border-l border-[var(--border)] shadow-2xl transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="text-xs uppercase tracking-[0.35em] text-[var(--secondary)]">
            Navigation
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-[var(--border)] text-[var(--foreground)] hover:bg-white/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="px-6 py-6 flex flex-col gap-4 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--secondary)]">
          {isAuth ? (
            <>
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link href="/transparency" onClick={() => setIsMenuOpen(false)}>Transparenz</Link>
              <Link href="/forum" onClick={() => setIsMenuOpen(false)}>Forum</Link>
              <Link href="/tasks" onClick={() => setIsMenuOpen(false)}>Tasks</Link>
              <Link href="/resources" onClick={() => setIsMenuOpen(false)}>Resources</Link>
              <Link href="/squads" onClick={() => setIsMenuOpen(false)}>Squads</Link>
              <Link href="/profile" onClick={() => setIsMenuOpen(false)}>Profil</Link>
              <button onClick={() => signOut({ callbackUrl: '/' })} className="text-left text-red-600">Abmelden</button>
            </>
          ) : (
            <>
              <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="/transparency" onClick={() => setIsMenuOpen(false)}>Transparenz</Link>
              <Link 
                href="/#apply" 
                onClick={() => setIsMenuOpen(false)}
                className="mt-2 inline-flex items-center justify-center bg-[var(--accent)] text-white px-4 py-3 rounded-full hover:bg-[#0b2f24] transition-colors text-[0.65rem] tracking-[0.3em] uppercase"
              >
                Founder werden
              </Link>
              <button onClick={() => signIn()} className="text-left">Login</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
