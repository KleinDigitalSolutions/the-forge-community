'use client';

import { useState } from 'react';
import type { MediaAsset } from '@prisma/client';
import { Play, Image as ImageIcon, CheckCircle2, Trash2, Download } from 'lucide-react';

interface MediaAssetGridProps {
  assets: MediaAsset[];
  onSelect?: (asset: MediaAsset) => void;
  selectedIds?: string[];
  onDelete?: (id: string) => void;
  className?: string;
}

export function MediaAssetGrid({ 
  assets, 
  onSelect, 
  selectedIds = [], 
  onDelete,
  className = '' 
}: MediaAssetGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-white/30 border border-white/5 rounded-xl bg-white/[0.02]">
        <ImageIcon className="w-8 h-8 mb-3 opacity-50" />
        <p className="text-sm font-medium">Keine Medien gefunden.</p>
      </div>
    );
  }

  const handleDownload = async (e: React.MouseEvent, url: string, filename: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank'); // Fallback
    }
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${className}`}>
      {assets.map((asset) => {
        const isSelected = selectedIds.includes(asset.id);
        const isVideo = asset.type.toLowerCase() === 'video';
        // Add #t=0.001 to force browser to render the first frame
        const displayUrl = isVideo ? (asset.url.includes('#') ? asset.url : `${asset.url}#t=0.001`) : asset.url;

        return (
          <div
            key={asset.id}
            className={`group relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer ${
              isSelected 
                ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]' 
                : 'border-white/10 hover:border-white/30'
            }`}
            onMouseEnter={() => setHoveredId(asset.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelect?.(asset)}
          >
            {/* Thumbnail / Content */}
            {isVideo ? (
              <div className="relative h-full w-full">
                <video 
                  src={displayUrl} 
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  poster={asset.thumbnailUrl || undefined}
                  onClick={(event) => {
                    const video = event.currentTarget;
                    if (video.paused) {
                      video.play().catch(() => {});
                    } else {
                      video.pause();
                      video.currentTime = 0;
                    }
                  }}
                  onMouseOver={(e) => e.currentTarget.play().catch(() => {})}
                  onMouseOut={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 opacity-70 transition-opacity group-hover:opacity-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/50">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <img src={asset.url} alt="Asset" className="w-full h-full object-cover" />
            )}

            {/* Type Indicator */}
            <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              {isVideo ? <Play className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
              {asset.source === 'EDITED' && <span className="text-[#D4AF37] ml-1">Edited</span>}
            </div>

            {/* Selection Check */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center text-black">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            {/* Hover Actions */}
            <div className={`absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent transition-opacity flex justify-between items-end ${
              hoveredId === asset.id ? 'opacity-100' : 'opacity-0'
            }`}>
              <button 
                onClick={(e) => handleDownload(e, asset.url, asset.filename || 'asset.mp4')}
                className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Wirklich löschen?')) onDelete(asset.id);
                  }}
                  className="p-2 hover:bg-red-500/20 rounded-lg text-white/70 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
