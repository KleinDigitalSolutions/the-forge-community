'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/') {
      router.replace('/');
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8f4f0] flex items-center justify-center">
        <div className="text-[0.7rem] uppercase tracking-[0.3em] text-[var(--secondary)] animate-pulse">
          Authentifiziere...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}
