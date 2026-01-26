'use client';

import { useState, useEffect } from 'react';
import { MediaAsset } from '@prisma/client';
import { MediaGeneratorModal } from '@/app/components/marketing/MediaGeneratorModal';
import { MediaAssetGrid } from '@/app/components/marketing/MediaAssetGrid';
import { VoiceGeneratorPanel } from '@/app/components/marketing/VoiceGeneratorPanel';
import { getVentureMedia } from '@/app/actions/media';
import { 
  LayoutGrid, 
  Sparkles, 
  Film, 
  Plus, 
  ArrowRight, 
  Loader2, 
  Scissors,
  Zap
} from 'lucide-react';
import { VideoPreview } from '@/app/components/media/VideoPreview';
import { VeoStudio } from '@/app/components/marketing/VeoStudio';

interface MediaStudioProps {
  ventureId: string;
  brandDNA?: any;
}

type Tab = 'library' | 'generate' | 'veo' | 'chain';

export function MediaStudio({ ventureId, brandDNA }: MediaStudioProps) {
  const [activeTab, setActiveTab] = useState<Tab>('veo');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Chain Builder State
  const [chainSlots, setChainSlots] = useState<(MediaAsset | null)[]>([null, null, null, null]);
  const [isStitching, setIsStitching] = useState(false);
  const [pickerOpenForSlot, setPickerOpenForSlot] = useState<number | null>(null);

  const loadAssets = async () => {
    try {
      const data = await getVentureMedia(ventureId);
      setAssets(data);
    } catch (e) {
      console.error('Failed to load assets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [ventureId]);

  const handleAssetCreated = (newAsset: any) => {
    // Refresh assets to show new one
    loadAssets();
    // Optional: Switch to library to see it?
    // setActiveTab('library');
  };

  const handleSlotClick = (index: number) => {
    setPickerOpenForSlot(index);
  };

  const handleAssetSelect = (asset: MediaAsset) => {
    if (pickerOpenForSlot !== null) {
      const newSlots = [...chainSlots];
      newSlots[pickerOpenForSlot] = asset;
      setChainSlots(newSlots);
      setPickerOpenForSlot(null);
    }
  };

  const handleStitch = async () => {
    const validAssets = chainSlots.filter(s => s !== null && s.type === 'VIDEO');
    if (validAssets.length < 2) {
      alert('Bitte wähle mindestens 2 Videos aus.');
      return;
    }

    setIsStitching(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/marketing/media/stitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetIds: validAssets.map(a => a!.id)
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Stitching failed');
      }

      const data = await res.json();
      await loadAssets(); // Reload to show stitched video
      alert('Video erfolgreich erstellt!');
      
      // Reset slots?
      // setChainSlots([null, null, null, null]);
    } catch (error) {
      console.error(error);
      alert('Fehler beim Erstellen des Videos.');
    } finally {
      setIsStitching(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-white/40">Lade Studio...</div>;

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'library' 
              ? 'bg-white text-black' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Library
        </button>
        <button
          onClick={() => setActiveTab('veo')}
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'veo' 
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className="w-4 h-4" />
          Veo 3.1
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'generate' 
              ? 'bg-white text-black' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Generator
        </button>
        <button
          onClick={() => setActiveTab('chain')}
          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'chain' 
              ? 'bg-white text-black' 
              : 'text-white/40 hover:text-white hover:bg-white/5'
          }`}
        >
          <Film className="w-4 h-4" />
          Chain Builder
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'library' && (
          <MediaAssetGrid assets={assets} onDelete={async (id) => {
              // TODO: Implement delete action call
              // await deleteAsset(id);
              // loadAssets();
          }} />
        )}

        {activeTab === 'generate' && (
          <div className="space-y-6">
            <div className="h-[800px] border border-white/10 rounded-xl overflow-hidden">
              <MediaGeneratorModal 
                isOpen={true} 
                ventureId={ventureId} 
                brandDNA={brandDNA} 
                inline={true}
                onAssetCreated={handleAssetCreated}
              />
            </div>
            <VoiceGeneratorPanel 
              ventureId={ventureId} 
              brandDNA={brandDNA}
              onAssetCreated={handleAssetCreated}
            />
          </div>
        )}

        {activeTab === 'chain' && (
          <div className="space-y-8">
            <div className="glass-card p-6 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-instrument-serif text-white">Story Chain</h3>
                  <p className="text-sm text-white/40">Verbinde bis zu 4 Clips zu einem nahtlosen Video.</p>
                </div>
                <button
                  onClick={handleStitch}
                  disabled={isStitching || chainSlots.filter(s => s).length < 2}
                  className="px-6 py-3 bg-[#D4AF37] text-black rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStitching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
                  Video erstellen (10 Energy)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {chainSlots.map((slot, index) => (
                  <div key={index} className="relative group">
                    <div 
                      onClick={() => handleSlotClick(index)}
                      className={`aspect-[9/16] rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                        slot 
                          ? 'border-[#D4AF37] bg-black' 
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      } flex flex-col items-center justify-center p-4 text-center`}
                    >
                      {slot ? (
                        <>
                          <VideoPreview
                            src={slot.url}
                            poster={slot.thumbnailUrl}
                            className="h-full w-full"
                            mediaClassName="h-full w-full object-cover"
                            enableHover={false}
                            allowClick={false}
                            showOverlay={false}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-xs font-bold text-white">Ändern</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                            <Plus className="w-5 h-5 text-white/40" />
                          </div>
                          <span className="text-xs font-bold text-white/40">Clip {index + 1}</span>
                        </>
                      )}
                    </div>
                    {index < 3 && (
                      <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-black border border-white/10 rounded-full items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-white/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Asset Picker Modal */}
            {pickerOpenForSlot !== null && (
              <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                  <div className="p-6 border-b border-white/10 flex justify-between">
                    <h3 className="text-lg font-bold text-white">Clip auswählen</h3>
                    <button onClick={() => setPickerOpenForSlot(null)} className="text-white/40 hover:text-white">Close</button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                    <MediaAssetGrid 
                      assets={assets.filter(a => a.type === 'VIDEO')} 
                      onSelect={handleAssetSelect}
                      enableLightbox={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
