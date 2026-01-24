'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export interface LightboxAsset {
  url: string;
  type: string;
  thumbnailUrl?: string | null;
  prompt?: string | null;
  model?: string | null;
}

interface MediaLightboxProps {
  open: boolean;
  asset: LightboxAsset | null;
  onClose: () => void;
}

export function MediaLightbox({ open, asset, onClose }: MediaLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !asset) return null;

  const isVideo = asset.type.toLowerCase() === 'video';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 sm:p-8">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Schliessen"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/50">
            {isVideo ? 'Video' : 'Image'} Viewer
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:text-white"
            aria-label="Schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center bg-black p-4 sm:p-6">
          {isVideo ? (
            <video
              src={asset.url}
              poster={asset.thumbnailUrl || undefined}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="max-h-[70vh] w-full rounded-xl bg-black"
            >
              Dein Browser unterstuetzt dieses Videoformat nicht.
            </video>
          ) : (
            <img
              src={asset.url}
              alt={asset.prompt || 'Media'}
              className="max-h-[70vh] w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          )}
        </div>

        {(asset.prompt || asset.model) && (
          <div className="border-t border-white/10 px-4 py-3 text-xs text-white/50 sm:px-6">
            <span className="font-bold uppercase tracking-[0.2em] text-white/40">Prompt</span>
            <span className="ml-3 text-white/70">{asset.prompt || asset.model}</span>
          </div>
        )}
      </div>
    </div>
  );
}
