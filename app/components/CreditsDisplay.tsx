'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

export function CreditsDisplay() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    // Poll credits or fetch once. For now fetch once on mount.
    // In a real app, you might want to use SWR or React Query.
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.credits !== undefined) setCredits(data.credits);
      })
      .catch(err => console.error('Failed to load credits', err));
  }, []);

  if (credits === null) return null;

  return (
    <div className="mx-6 mb-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Energy</span>
        </div>
        <span className="text-white/80 tracking-widest">
          {credits} <span className="text-white/30">/ ∞</span>
        </span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-[#D4AF37]"
          style={{ width: `${Math.min((credits / 50) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
