'use client';

import { useEffect, useMemo, useState } from 'react';
import type { BrandDNA } from '@prisma/client';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Video,
  Upload,
  Wand2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Download,
  Zap
} from 'lucide-react';

const MEDIA_MODES = [
  {
    id: 'text-to-image',
    label: 'Text → Image',
    description: 'Generiere Visuals aus einem Prompt.',
  },
  {
    id: 'image-to-image',
    label: 'Image → Image',
    description: 'Style-Transfer oder Re-Design auf Basis eines Bildes.',
  },
  {
    id: 'text-to-video',
    label: 'Text → Video',
    description: 'Kurze Clips aus einem Text-Prompt.',
  },
  {
    id: 'image-to-video',
    label: 'Image → Video',
    description: 'Bewegung und Dynamik aus einem Bild heraus.',
  },
] as const;

const IMAGE_MODELS = [
  { id: 'qwen-image-2512', label: 'Qwen-Image 2512 · Quality' },
  { id: 'z-image-turbo', label: 'Z-Image Turbo · Fast' },
  { id: 'glm-image', label: 'GLM-Image · Text-Heavy' },
];

const VIDEO_MODELS = [
  { id: 'wan-2.2', label: 'Wan 2.2 · Balanced' },
  { id: 'mochi-1', label: 'Mochi 1 · Premium' },
];

const MODE_DEFAULT_MODEL: Record<MediaMode, string> = {
  'text-to-image': 'qwen-image-2512',
  'image-to-image': 'qwen-image-2512',
  'text-to-video': 'mochi-1',
  'image-to-video': 'wan-2.2',
};

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square' },
  { id: '4:5', label: '4:5 Portrait' },
  { id: '9:16', label: '9:16 Story' },
  { id: '16:9', label: '16:9 Wide' },
  { id: '3:2', label: '3:2 Classic' },
];

type MediaMode = (typeof MEDIA_MODES)[number]['id'];

type MediaAsset = {
  url: string;
  type: 'image' | 'video';
};

interface MediaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventureId: string;
  campaignId?: string | null;
  brandDNA?: BrandDNA | null;
}

export function MediaGeneratorModal({
  isOpen,
  onClose,
  ventureId,
  campaignId,
  brandDNA,
}: MediaGeneratorModalProps) {
  const [mode, setMode] = useState<MediaMode>('text-to-image');
  const [model, setModel] = useState(IMAGE_MODELS[0].id);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].id);
  const [steps, setSteps] = useState(30);
  const [guidance, setGuidance] = useState(7.5);
  const [seed, setSeed] = useState('');
  const [strength, setStrength] = useState(0.6);
  const [duration, setDuration] = useState(4);
  const [fps, setFps] = useState(24);
  const [variants, setVariants] = useState(1);
  const [useBrandContext, setUseBrandContext] = useState(Boolean(brandDNA));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isVideoMode = mode.includes('video');
  const requiresImage = mode.includes('image-to');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    setSuccessMessage('');
  }, [isOpen]);

  useEffect(() => {
    setModel(MODE_DEFAULT_MODEL[mode]);
  }, [mode]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const promptPlaceholder = useMemo(() => {
    if (mode === 'text-to-video') return 'z.B. Minimalistisches Produkt-Teasing mit weichen Lichtfahrten';
    if (mode === 'image-to-video') return 'z.B. Sanfte Kamerafahrt, leichte Stoffbewegung, cineastisch';
    if (mode === 'image-to-image') return 'z.B. High-end Editorial Look, sauberer Hintergrund, Premium Feel';
    return 'z.B. Studio Shot, natürliche Hauttöne, hochwertige Materialien, cleanes Layout';
  }, [mode]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setCreditsRemaining(null);
    setCreditsUsed(null);

    if (!prompt.trim()) {
      setErrorMessage('Bitte gib einen Prompt an.');
      return;
    }
    if (requiresImage && !imageFile) {
      setErrorMessage('Bitte lade ein Referenzbild hoch.');
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('mode', mode);
      formData.append('model', model);
      formData.append('prompt', prompt.trim());
      if (negativePrompt.trim()) formData.append('negativePrompt', negativePrompt.trim());
      formData.append('aspectRatio', aspectRatio);
      formData.append('steps', String(steps));
      formData.append('guidance', String(guidance));
      formData.append('variants', String(variants));
      if (seed.trim()) formData.append('seed', seed.trim());
      if (requiresImage && imageFile) formData.append('image', imageFile);
      if (mode === 'image-to-image') formData.append('strength', String(strength));
      if (isVideoMode) {
        formData.append('duration', String(duration));
        formData.append('fps', String(fps));
      }
      if (useBrandContext && brandDNA) formData.append('useBrandContext', 'true');
      if (campaignId) formData.append('campaignId', campaignId);

      const res = await fetch(`/api/ventures/${ventureId}/marketing/media`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data?.error || 'Generierung fehlgeschlagen.');
        return;
      }

      setAssets(data.assets || []);
      setCreditsRemaining(data.creditsRemaining ?? null);
      setCreditsUsed(data.creditsUsed ?? null);
      setSuccessMessage('Generierung abgeschlossen.');
    } catch (error) {
      console.error('Media generation failed', error);
      setErrorMessage('Serverfehler. Bitte erneut versuchen.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-5xl rounded-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-instrument-serif text-white">AI Media Studio</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
                Visuals & Video für Marketing
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6 p-6 overflow-y-auto">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MEDIA_MODES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${
                    mode === item.id
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {item.id.includes('video') ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    {item.label}
                  </div>
                  <p className="text-[10px] text-white/50 mt-1">{item.description}</p>
                </button>
              ))}
            </div>

            <div className="glass-card rounded-xl border border-white/10 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Prompt</h3>
                {brandDNA && (
                  <button
                    onClick={() => setUseBrandContext((prev) => !prev)}
                    className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                      useBrandContext
                        ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]'
                        : 'border-white/10 text-white/40'
                    }`}
                  >
                    Brand DNA {useBrandContext ? 'aktiv' : 'aus'}
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={promptPlaceholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none resize-none"
              />
              <textarea
                rows={2}
                value={negativePrompt}
                onChange={(event) => setNegativePrompt(event.target.value)}
                placeholder="Optional: Negative Prompt (z.B. blurry, low quality, artifacts)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-xs focus:border-[#D4AF37] outline-none resize-none"
              />
            </div>

            <div className="glass-card rounded-xl border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Model & Output</h3>
                <button
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {showAdvanced ? 'Basic' : 'Advanced'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Model</label>
                  <select
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                  >
                    {(isVideoMode ? VIDEO_MODELS : IMAGE_MODELS).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(event) => setAspectRatio(event.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                  >
                    {ASPECT_RATIOS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Varianten</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={variants}
                    onChange={(event) => setVariants(Number(event.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Steps</label>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    value={steps}
                    onChange={(event) => setSteps(Number(event.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Guidance</label>
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={20}
                    value={guidance}
                    onChange={(event) => setGuidance(Number(event.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-white/40">Seed</label>
                  <input
                    type="text"
                    value={seed}
                    onChange={(event) => setSeed(event.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Image Strength</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0.1}
                      max={1}
                      value={strength}
                      onChange={(event) => setStrength(Number(event.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">FPS</label>
                    <input
                      type="number"
                      min={12}
                      max={30}
                      value={fps}
                      onChange={(event) => setFps(Number(event.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Duration (sec)</label>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={duration}
                      onChange={(event) => setDuration(Number(event.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {requiresImage && (
              <div className="glass-card rounded-xl border border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Referenzbild</h3>
                  {imageFile && (
                    <button
                      onClick={() => setImageFile(null)}
                      className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white"
                    >
                      Entfernen
                    </button>
                  )}
                </div>
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/40 px-6 py-8 text-white/50 text-xs cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Bild hochladen (JPG/PNG/WebP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setImageFile(file);
                    }}
                  />
                </label>
                {imagePreview && (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={imagePreview} alt="Referenz" className="w-full h-auto" />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                {creditsUsed ? `Energy: ${creditsUsed} verbraucht` : 'Energy Usage'}
                {creditsRemaining !== null && (
                  <span className="text-white/70">· {creditsRemaining} übrig</span>
                )}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-3 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Wand2 className="w-4 h-4 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Medien generieren
                  </>
                )}
              </button>
            </div>

            {(errorMessage || successMessage) && (
              <div
                className={`rounded-xl border px-4 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${
                  errorMessage
                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                    : 'border-green-500/30 bg-green-500/10 text-green-300'
                }`}
              >
                {errorMessage ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{errorMessage || successMessage}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="glass-card rounded-xl border border-white/10 p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Outputs</h3>
              {assets.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40 text-sm">
                  Keine Ergebnisse. Starte eine Generierung, um Visuals zu sehen.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assets.map((asset, index) => (
                    <div key={`${asset.url}-${index}`} className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                      {asset.type === 'video' ? (
                        <video src={asset.url} controls className="w-full h-auto" />
                      ) : (
                        <img src={asset.url} alt="Generated" className="w-full h-auto" />
                      )}
                      <div className="flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-widest text-white/40 border-t border-white/10">
                        <span>{asset.type === 'video' ? 'Video' : 'Image'} #{index + 1}</span>
                        <a
                          href={asset.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-white/60 hover:text-white"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
