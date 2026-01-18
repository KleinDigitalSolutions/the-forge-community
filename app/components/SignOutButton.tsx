'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className={className || "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 group"}
    >
      <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
      Abmelden
    </button>
  );
}
