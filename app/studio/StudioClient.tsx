'use client';

import AuthGuard from '@/app/components/AuthGuard';
import PageShell from '@/app/components/PageShell';
import { MediaStudio } from '@/app/components/forge/MediaStudio';

interface StudioClientProps {
  ventureId: string | null;
}

export default function StudioClient({ ventureId }: StudioClientProps) {
  return (
    <AuthGuard>
      <PageShell>
        <div className="space-y-8">
          <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-black/60 to-black p-8">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#D4AF37]/10 blur-[90px]" />
            <div className="relative z-10 space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">AI Studio</div>
              <h1 className="text-3xl sm:text-4xl font-instrument-serif text-white">
                Bilder & Videos. Ohne Brand-Zwang.
              </h1>
              <p className="max-w-2xl text-sm text-white/60">
                Generiere Visuals und Clips direkt im Studio. Kein Venture-Setup notwendig.
              </p>
            </div>
          </header>

          {ventureId ? (
            <MediaStudio ventureId={ventureId} />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
              Studio konnte nicht initialisiert werden.
            </div>
          )}
        </div>
      </PageShell>
    </AuthGuard>
  );
}
