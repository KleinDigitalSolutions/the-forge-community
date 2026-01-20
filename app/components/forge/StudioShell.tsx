/**
 * StudioShell - Shared Layout Wrapper for all Studios
 * Used by: Legal Studio, Email Studio, Intelligence Studio
 */

import { type ReactNode } from 'react';
import type { BrandDNA } from '@prisma/client';

interface StudioShellProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  brandDNA?: BrandDNA | null;
  aiProvider?: 'gemini' | 'groq';
  headerAction?: ReactNode;
}

export function StudioShell({
  title,
  description,
  icon,
  children,
  brandDNA,
  aiProvider,
  headerAction,
}: StudioShellProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl font-instrument-serif text-white mb-2">
              {title}
            </h1>
            <p className="text-white/40 text-sm">{description}</p>
          </div>
        </div>

        {/* Right Side: Brand DNA Preview + AI Status */}
        <div className="flex items-center gap-3">
          {/* Brand DNA Quick Preview */}
          {brandDNA && (
            <div className="glass-card p-4 rounded-xl border border-white/10 max-w-xs">
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2">
                Brand Context
              </p>
              <p className="text-sm text-white font-semibold mb-1 truncate">
                {brandDNA.brandName}
              </p>
              <p className="text-xs text-white/60 line-clamp-1">
                {brandDNA.toneOfVoice || 'No tone set'}
              </p>
            </div>
          )}

          {/* AI Provider Status */}
          {aiProvider && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-400 uppercase">
                {aiProvider}
              </span>
            </div>
          )}

          {/* Optional Header Action (e.g., "New Document" button) */}
          {headerAction}
        </div>
      </div>

      {/* Studio Content */}
      {children}
    </div>
  );
}
