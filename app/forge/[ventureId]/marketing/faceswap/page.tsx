'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StudioShell } from '@/app/components/forge/StudioShell';
import { ArrowLeft, Upload, Video, User, Zap, CheckCircle2, AlertCircle, Loader2, Play, Download } from 'lucide-react';
import { FACESWAP_MODELS } from '@/lib/media-models';
import { useAIContext } from '@/app/context/AIContext';
import { cn } from '@/lib/utils';

type JobStatus = 'idle' | 'uploading' | 'processing' | 'succeeded' | 'failed';

export default function FaceSwapPage() {
  const params = useParams();
  const router = useRouter();
  const ventureId = params.ventureId as string;
  const { setContext } = useAIContext();

  const [isPaid, setIsPaid] = useState(false);
  const [tierLabel, setTierLabel] = useState<'Free' | 'Pro' | 'Enterprise'>('Free');
  const [tierReady, setTierReady] = useState(false);

  const [model, setModel] = useState('lucataco-faceswap');
  const [swapCondition, setSwapCondition] = useState<'all' | 'first'>('all');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [duration, setDuration] = useState(4);

  const [status, setStatus] = useState<JobStatus>('idle');
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setContext('AI Avatar Studio - Hybrid Character & Background Swap.');
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadTier = async () => {
      try {
        const [meRes, billingRes] = await Promise.all([
          fetch('/api/me').then(res => (res.ok ? res.json() : null)).catch(() => null),
          fetch('/api/billing/summary').then(res => (res.ok ? res.json() : null)).catch(() => null),
        ]);

        if (!mounted) return;
        const role = meRes?.role;
        const status = billingRes?.subscriptionStatus;
        const tier = billingRes?.subscriptionTier;
        const active = status === 'active' || status === 'trialing';
        const paidTier = tier === 'pro' || tier === 'enterprise';
        const paid = role === 'ADMIN' || (active && paidTier);

        setIsPaid(paid);
        if (!paid) {
          setTierLabel('Free');
        } else if (tier === 'enterprise') {
          setTierLabel('Enterprise');
        } else {
          setTierLabel('Pro');
        }
      } finally {
        if (mounted) setTierReady(true);
      }
    };

    loadTier();
    return () => {
      mounted = false;
    };
  }, []);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('Video ist zu groß (max 50MB)');
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleFaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Bild ist zu groß (max 10MB)');
      return;
    }

    setFaceFile(file);
    setFacePreview(URL.createObjectURL(file));
    setError(null);
  };

  const startFaceSwap = async () => {
    if (!faceFile || (isPaid && !videoFile)) {
      setError(isPaid ? 'Bitte lade Video und Referenzbild hoch' : 'Bitte lade ein Referenzbild hoch');
      return;
    }

    setStatus('uploading');
    setError(null);
    setOutputUrl(null);
    setPredictionId(null);

    try {
      const formData = new FormData();
      if (videoFile) formData.append('video', videoFile);
      formData.append('face', faceFile);
      formData.append('prompt', prompt);
      formData.append('aspectRatio', aspectRatio);
      formData.append('duration', String(duration));
      formData.append('model', model);
      formData.append('swapCondition', swapCondition);

      const res = await fetch(`/api/ventures/${ventureId}/marketing/faceswap`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Avatar fehlgeschlagen');
      }

      if (data.outputUrl) {
        setOutputUrl(data.outputUrl);
        setStatus('succeeded');
        return;
      }

      if (data.predictionId) {
        setPredictionId(data.predictionId);
        setStatus('processing');
        startPolling(data.predictionId);
        return;
      }

      throw new Error('Kein Ergebnis erhalten');
    } catch (err: any) {
      setStatus('failed');
      setError(err.message || 'Avatar fehlgeschlagen');
    }
  };

  const startPolling = (id: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/marketing/faceswap?predictionId=${id}`);
        const data = await res.json();

        if (data.status === 'succeeded') {
          setStatus('succeeded');
          setOutputUrl(data.outputUrl);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        } else if (data.status === 'failed' || data.status === 'canceled') {
          setStatus('failed');
          setError(data.error || 'Avatar fehlgeschlagen');
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds
  };

  const reset = () => {
    setVideoFile(null);
    setFaceFile(null);
    setVideoPreview(null);
    setFacePreview(null);
    setStatus('idle');
    setPredictionId(null);
    setOutputUrl(null);
    setError(null);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  const modelConfig = isPaid ? FACESWAP_MODELS[model] : null;
  const canStart = Boolean(faceFile && status === 'idle' && (!isPaid || videoFile) && tierReady);

  return (
    <StudioShell
      title="AI Avatar Studio"
      description="Hybrid Character Swap: FREE (Wan 2.2) + PRO (Replicate)."
      icon={<User className="w-5 h-5" />}
    >
      {/* Back Navigation */}
      <div className="mb-8">
        <Link
          href={`/forge/${ventureId}/marketing`}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Marketing Studio
        </Link>
      </div>

      {!isPaid && (
        <div className="mb-8 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-white/40">Style Prompt (optional)</label>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="z.B. cinematic, soft light, realistic skin"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              disabled={status !== 'idle'}
            />
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                disabled={status !== 'idle'}
              >
                <option value="9:16">9:16 (Vertical)</option>
                <option value="16:9">16:9 (Landscape)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:5">4:5 (Portrait)</option>
                <option value="3:2">3:2</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Dauer</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                disabled={status !== 'idle'}
              >
                <option value={4}>4s</option>
                <option value={6}>6s</option>
                <option value={8}>8s</option>
                <option value={10}>10s</option>
                <option value={12}>12s</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Engine</h3>
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">{tierLabel} Tier</span>
        </div>

        {isPaid ? (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(FACESWAP_MODELS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setModel(key)}
                  disabled={status !== 'idle'}
                  className={cn(
                    'rounded-2xl border p-6 text-left transition-all',
                    model === key
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10',
                    status !== 'idle' && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-base font-bold text-white">{config.label}</div>
                    <div className="flex items-center gap-1 text-xs font-bold text-[#D4AF37]">
                      <Zap className="w-3.5 h-3.5" />
                      {config.cost}
                    </div>
                  </div>
                  <p className="text-sm text-white/50">{config.description}</p>
                </button>
              ))}
            </div>

            {/* Swap Condition (only for lucataco model) */}
            {model === 'lucataco-faceswap' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40">Swap Mode</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSwapCondition('all')}
                    disabled={status !== 'idle'}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                      swapCondition === 'all'
                        ? 'bg-[#D4AF37] text-black'
                        : 'bg-white/5 text-white/60 hover:bg-white/10',
                      status !== 'idle' && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Alle Faces
                  </button>
                  <button
                    onClick={() => setSwapCondition('first')}
                    disabled={status !== 'idle'}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                      swapCondition === 'first'
                        ? 'bg-[#D4AF37] text-black'
                        : 'bg-white/5 text-white/60 hover:bg-white/10',
                      status !== 'idle' && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Nur erste Person
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-6">
            <div className="flex items-start justify-between mb-2">
              <div className="text-base font-bold text-white">Wan 2.2 Animate (FREE)</div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#D4AF37]">
                <Zap className="w-3.5 h-3.5" />
                3 / Monat
              </div>
            </div>
            <p className="text-sm text-white/50">
              Image-to-Video. Nutzt dein Referenzbild (Person + Room) und erstellt ein neues Video.
            </p>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Video Upload */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
            <Video className="w-4 h-4" />
            {isPaid ? 'Target Video' : 'Motion Video (optional)'}
          </h3>
          <div
            onClick={() => status === 'idle' && videoInputRef.current?.click()}
            className={cn(
              'relative rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center transition-all cursor-pointer hover:border-[#D4AF37]/50 hover:bg-white/10',
              videoPreview && 'border-solid border-[#D4AF37]/30',
              status !== 'idle' && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime"
              onChange={handleVideoSelect}
              className="hidden"
              disabled={status !== 'idle'}
            />
            {videoPreview ? (
              <video src={videoPreview} controls className="w-full rounded-xl" />
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-white/40" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">Video hochladen</div>
                  <div className="text-sm text-white/40">
                    MP4 oder MOV (max 50MB){isPaid ? '' : ' · optional'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Face Upload */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
            <User className="w-4 h-4" />
            Reference Image
          </h3>
          <div
            onClick={() => status === 'idle' && faceInputRef.current?.click()}
            className={cn(
              'relative rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center transition-all cursor-pointer hover:border-[#D4AF37]/50 hover:bg-white/10',
              facePreview && 'border-solid border-[#D4AF37]/30',
              status !== 'idle' && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              ref={faceInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFaceSelect}
              className="hidden"
              disabled={status !== 'idle'}
            />
            {facePreview ? (
              <img src={facePreview} alt="Face preview" className="w-full rounded-xl" />
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-white/40" />
                </div>
                <div>
                  <div className="text-white font-semibold mb-1">Referenzbild hochladen</div>
                  <div className="text-sm text-white/40">JPG, PNG oder WebP (max 10MB)</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm text-red-200">{error}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={startFaceSwap}
          disabled={!canStart}
          className={cn(
            'flex items-center gap-2 px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm transition-all',
            canStart
              ? 'bg-[#D4AF37] text-black hover:bg-[#F0C05A] shadow-lg shadow-[#D4AF37]/20'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          )}
        >
          {status === 'uploading' || status === 'processing' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {status === 'uploading' ? 'Lade hoch...' : 'Verarbeite...'}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {isPaid ? `Avatar Swap starten (${modelConfig?.cost ?? 0} Credits)` : 'Avatar Video erstellen (Free Tier)'}
            </>
          )}
        </button>

        {status !== 'idle' && (
          <button
            onClick={reset}
            className="px-6 py-4 rounded-full text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Status Progress */}
      {status !== 'idle' && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-4">
            {status === 'uploading' && (
              <>
                <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                <span className="text-white font-semibold">Dateien werden hochgeladen...</span>
              </>
            )}
            {status === 'processing' && (
              <>
                <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin" />
                <span className="text-white font-semibold">Avatar wird verarbeitet... (kann bis zu 5 Minuten dauern)</span>
              </>
            )}
            {status === 'succeeded' && (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-white font-semibold">Avatar erfolgreich erstellt!</span>
              </>
            )}
            {status === 'failed' && (
              <>
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-white font-semibold">Avatar fehlgeschlagen</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Output Video */}
      {outputUrl && (
        <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Ergebnis</h3>
            <a
              href={outputUrl}
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37] text-black font-semibold text-sm hover:bg-[#F0C05A] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
          <video src={outputUrl} controls className="w-full rounded-xl" />
        </div>
      )}

      {/* Info Box */}
      <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Tipps für beste Ergebnisse</h3>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>Nutze ein scharfes Referenzbild (Person + Umgebung klar sichtbar)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>PRO: Verwende ruhige, gut beleuchtete Videos (min. 720p)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>FREE: Nutze den Style Prompt für Look &amp; Licht</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>Bei mehreren Personen: "Nur erste Person" für gezieltes Swapping (PRO)</span>
          </li>
        </ul>
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Demo</h3>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10">
          <iframe
            src="https://www.youtube.com/embed/xAICmrzPJjA?si=q8b0Yj7ZUv3gxy8k"
            title="YouTube video player"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </StudioShell>
  );
}
