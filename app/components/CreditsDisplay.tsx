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
    <div className="mx-6 mb-6 p-4 rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
        <span>Energy</span>
        <Zap className="w-3 h-3 fill-current" />
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-instrument-serif text-white leading-none">{credits}</span>
        <span className="text-[10px] text-white/40 mb-1">/ ∞</span>
      </div>
      <div className="w-full bg-[#D4AF37]/10 h-1 rounded-full overflow-hidden mt-1">
        <div 
          className="h-full bg-[#D4AF37]" 
          style={{ width: `${Math.min((credits / 50) * 100, 100)}%` }} 
        />
      </div>
    </div>
  );
}
