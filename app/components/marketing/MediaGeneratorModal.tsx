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
  Zap,
  BookOpen,
  Copy,
  Play,
  Link2
} from 'lucide-react';
import { PROMPT_TEMPLATES, getTemplatesByType, enrichPromptWithBrandDNA, type PromptTemplate } from '@/lib/prompt-templates';
import { extractLastFrame, uploadFrameToBlob, generateChainId } from '@/lib/video-utils';
import Hyperspeed, { hyperspeedPresets } from '@/app/components/visual/Hyperspeed';

const MEDIA_MODES = [
  {
    id: 'text-to-image',
    label: 'Text → Image',
    description: 'Generiere Visuals aus einem Prompt.',
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

type MediaMode = (typeof MEDIA_MODES)[number]['id'];

type ModelConfig = {
  id: string;
  label: string;
  outputType: 'image' | 'video';
  modes: MediaMode[];
  supportsImageInput?: boolean;
  supportsNegativePrompt?: boolean;
  supportsGuidance?: boolean;
  supportsSteps?: boolean;
  supportsSeed?: boolean;
  supportsDuration?: boolean;
  supportsFps?: boolean;
  supportsRenderingSpeed?: boolean;
  supportsStylePreset?: boolean;
  isEnabled?: boolean;
  disabledReason?: string;
};

const IDEOGRAM_ENABLED = process.env.NEXT_PUBLIC_IDEOGRAM_ENABLED === 'true';

const MODEL_CONFIGS: ModelConfig[] = [
  {
    id: 'black-forest-labs/flux-2-pro',
    label: 'Flux 2 Pro · Photorealism',
    outputType: 'image',
    modes: ['text-to-image'],
  },
  {
    id: 'black-forest-labs/flux-1.1-pro',
    label: 'Flux 1.1 Pro · Detail + Text',
    outputType: 'image',
    modes: ['text-to-image'],
  },
  {
    id: 'ideogram-v3',
    label: 'Ideogram 3.0 Pro · Typography',
    outputType: 'image',
    modes: ['text-to-image'],
    supportsRenderingSpeed: true,
    supportsStylePreset: true,
    isEnabled: IDEOGRAM_ENABLED,
    disabledReason: 'Inaktiv · Top-up 20 EUR',
  },
  {
    id: 'kwaivgi/kling-v2.6',
    label: 'Kling 2.6 Pro · Cinema + Audio',
    outputType: 'video',
    modes: ['text-to-video', 'image-to-video'],
    supportsImageInput: true,
    supportsGuidance: true,
    supportsDuration: true,
  },
  {
    id: 'openai/sora-2',
    label: 'Sora 2 · Flagship + Synced Audio',
    outputType: 'video',
    modes: ['text-to-video'],
  },
  {
    id: 'google/veo-3.1',
    label: 'Veo 3.1 · Context-Aware Audio',
    outputType: 'video',
    modes: ['text-to-video'],
  },
  {
    id: 'minimax/video-01',
    label: 'Minimax Video · Human Motion',
    outputType: 'video',
    modes: ['text-to-video'],
  },
  {
    id: 'lumaai/dream-machine',
    label: 'Luma Dream Machine · Atmospheric',
    outputType: 'video',
    modes: ['text-to-video'],
  },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square' },
  { id: '4:5', label: '4:5 Portrait' },
  { id: '9:16', label: '9:16 Story' },
  { id: '16:9', label: '16:9 Wide' },
  { id: '3:2', label: '3:2 Classic' },
];

const IDEOGRAM_RENDERING_SPEEDS = [
  { id: 'TURBO', label: 'Turbo (Fast)' },
  { id: 'DEFAULT', label: 'Default' },
  { id: 'QUALITY', label: 'Quality' },
];

const IDEOGRAM_STYLE_PRESET_SUGGESTIONS = [
  '90s_Nostalgia',
  'Japandi_Fusion',
  'Mixed_Media',
];

type MediaAsset = {
  url: string;
  type: 'image' | 'video';
};

interface MediaGeneratorModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  ventureId: string;
  campaignId?: string | null;
  brandDNA?: BrandDNA | null;
  inline?: boolean;
  onAssetCreated?: (asset: any) => void;
  allowedModes?: MediaMode[];
  originTag?: string;
  // Chain State
  chainId?: string;
  chainPosition?: number;
  startImageUrl?: string; // For continuing chains
}

const getModelsForMode = (mode: MediaMode) =>
  MODEL_CONFIGS.filter((config) => config.modes.includes(mode));

const resolveModeOptions = (allowedModes?: MediaMode[]) => {
  if (!allowedModes || allowedModes.length === 0) return MEDIA_MODES;
  return MEDIA_MODES.filter((item) => allowedModes.includes(item.id));
};

const isModelEnabled = (config: ModelConfig) => config.isEnabled !== false;

const getDefaultMode = (allowedModes?: MediaMode[]) => {
  const modeOptions = resolveModeOptions(allowedModes);
  const first = modeOptions.find((item) => getModelsForMode(item.id).length > 0);
  return (first?.id ?? modeOptions[0]?.id ?? 'text-to-image') as MediaMode;
};

const getDefaultModelForMode = (mode: MediaMode) => getModelsForMode(mode)[0]?.id ?? '';

export function MediaGeneratorModal({
  isOpen = true,
  onClose,
  ventureId,
  campaignId,
  brandDNA,
  inline = false,
  onAssetCreated,
  allowedModes,
  originTag,
  chainId: initialChainId,
  chainPosition: initialChainPosition,
  startImageUrl: initialStartImageUrl,
}: MediaGeneratorModalProps) {
  const modeOptions = useMemo(() => resolveModeOptions(allowedModes), [allowedModes]);
  const [mode, setMode] = useState<MediaMode>(() => getDefaultMode(allowedModes));
  const [model, setModel] = useState(getDefaultModelForMode(mode));
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].id);
  const [steps, setSteps] = useState(20);
  const [guidance, setGuidance] = useState(7.5);
  const [seed, setSeed] = useState('');
  const [duration, setDuration] = useState(4);
  const [fps, setFps] = useState(24);
  const [renderingSpeed, setRenderingSpeed] = useState(IDEOGRAM_RENDERING_SPEEDS[0].id);
  const [stylePreset, setStylePreset] = useState('');
  const [useBrandContext, setUseBrandContext] = useState(Boolean(brandDNA));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialStartImageUrl || null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [predictionStatus, setPredictionStatus] = useState<string | null>(null);

  // Prompt Templates State
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);

  // Chain State
  const [chainId, setChainId] = useState<string | undefined>(initialChainId);
  const [chainPosition, setChainPosition] = useState<number>(initialChainPosition || 1);
  const [isExtractingFrame, setIsExtractingFrame] = useState(false);

  const availableModels = useMemo(() => getModelsForMode(mode), [mode]);
  const enabledModels = useMemo(
    () => availableModels.filter((item) => isModelEnabled(item)),
    [availableModels]
  );
  const selectedModel = availableModels.find((item) => item.id === model) ?? enabledModels[0];
  const isSelectedModelEnabled = selectedModel ? isModelEnabled(selectedModel) : false;
  const isVideoMode = selectedModel?.outputType === 'video' || mode.includes('video');
  const requiresImage = Boolean(selectedModel?.supportsImageInput);
  const supportsNegativePrompt = Boolean(selectedModel?.supportsNegativePrompt);
  const supportsGuidance = Boolean(selectedModel?.supportsGuidance);
  const supportsSteps = Boolean(selectedModel?.supportsSteps);
  const supportsSeed = Boolean(selectedModel?.supportsSeed);
  const supportsDuration = Boolean(selectedModel?.supportsDuration);
  const supportsFps = Boolean(selectedModel?.supportsFps);
  const supportsRenderingSpeed = Boolean(selectedModel?.supportsRenderingSpeed);
  const supportsStylePreset = Boolean(selectedModel?.supportsStylePreset);

  useEffect(() => {
    if (!isOpen && !inline) return;
    setErrorMessage('');
    setSuccessMessage('');
    setPredictionStatus(null);
  }, [isOpen, inline]);

  useEffect(() => {
    if (!modeOptions.length) return;
    if (!modeOptions.some((item) => item.id === mode)) {
      setMode(getDefaultMode(allowedModes));
    }
  }, [modeOptions, mode, allowedModes]);

  useEffect(() => {
    if (!availableModels.length || !enabledModels.length) {
      setModel('');
      return;
    }
    if (!availableModels.some((item) => item.id === model) || !isSelectedModelEnabled) {
      setModel(enabledModels[0].id);
    }
  }, [availableModels, enabledModels, isSelectedModelEnabled, model]);

  useEffect(() => {
    if (!requiresImage) {
      setImageFile(null);
    }
  }, [requiresImage]);

  useEffect(() => {
    if (!supportsNegativePrompt) {
      setNegativePrompt('');
    }
  }, [supportsNegativePrompt]);

  useEffect(() => {
    if (!supportsDuration) {
      setDuration(4);
    }
  }, [supportsDuration]);

  useEffect(() => {
    if (!supportsGuidance) {
      setGuidance(7.5);
    }
  }, [supportsGuidance]);

  useEffect(() => {
    if (!supportsSteps) {
      setSteps(20);
    }
  }, [supportsSteps]);

  useEffect(() => {
    if (!supportsSeed) {
      setSeed('');
    }
  }, [supportsSeed]);

  useEffect(() => {
    if (!supportsFps) {
      setFps(24);
    }
  }, [supportsFps]);

  useEffect(() => {
    if (!supportsRenderingSpeed) {
      setRenderingSpeed(IDEOGRAM_RENDERING_SPEEDS[0].id);
    }
  }, [supportsRenderingSpeed]);

  useEffect(() => {
    if (!supportsStylePreset) {
      setStylePreset('');
    }
  }, [supportsStylePreset]);

  useEffect(() => {
    if (!imageFile) {
      // Keep initialStartImageUrl if no file
      if (!initialStartImageUrl) {
        setImagePreview(null);
      }
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, initialStartImageUrl]);

  const promptPlaceholder = useMemo(() => {
    if (mode === 'text-to-video') return 'z.B. Minimalistisches Produkt-Teasing mit weichen Lichtfahrten';
    if (mode === 'image-to-video') return 'z.B. Sanfte Kamerafahrt, leichte Stoffbewegung, cineastisch';
    return 'z.B. Studio Shot, natürliche Hauttöne, hochwertige Materialien, cleanes Layout';
  }, [mode]);

  const pollPrediction = async (predictionId: string) => {
    const pollStart = Date.now();
    const maxWaitMs = isVideoMode ? 1000 * 60 * 12 : 1000 * 60 * 4;
    let attempt = 0;

    while (Date.now() - pollStart < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 800 : 1800));
      attempt += 1;

      const res = await fetch(`/api/ventures/${ventureId}/marketing/media?predictionId=${predictionId}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Prediction fehlgeschlagen.');
      }

      setPredictionStatus(data?.status || null);

      if (data?.status === 'succeeded') {
        setAssets(data.assets || []);
        setCreditsRemaining(data.creditsRemaining ?? null);
        setSuccessMessage('Generierung abgeschlossen.');
        if (onAssetCreated && data.assets) {
          data.assets.forEach((asset: any) => onAssetCreated(asset));
        }
        return;
      }

      if (data?.status === 'failed' || data?.status === 'canceled') {
        throw new Error(data?.error || 'Generierung fehlgeschlagen.');
      }
    }

    throw new Error('Timeout: Bitte später erneut prüfen.');
  };

  // Chain Handler - Continue from last frame
  const handleContinueChain = async (videoUrl: string, assetIndex: number) => {
    setIsExtractingFrame(true);
    setErrorMessage('');

    try {
      // Extract last frame
      const frameDataUrl = await extractLastFrame(videoUrl);

      // Upload frame
      const frameUrl = await uploadFrameToBlob(
        frameDataUrl,
        `frame_chain_${chainPosition + 1}.jpg`
      );

      // Set up for next video in chain
      const newChainId = chainId || generateChainId();
      const newPosition = chainPosition + 1;

      // Upload image file for image-to-video mode
      const blob = await fetch(frameDataUrl).then(r => r.blob());
      const file = new File([blob], 'chain_frame.jpg', { type: 'image/jpeg' });

      setImageFile(file);
      setMode('image-to-video');
      setChainId(newChainId);
      setChainPosition(newPosition);
      setPrompt(`Continue the story from the previous scene. Maintain visual continuity and flow.`);
      setSuccessMessage(`Chain ${newPosition}/4 ready - adjust prompt and generate!`);

    } catch (error: any) {
      console.error('Chain continuation failed:', error);
      setErrorMessage(error.message || 'Frame extraction failed');
    } finally {
      setIsExtractingFrame(false);
    }
  };

  // Template Handlers
  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template);

    // Initialize placeholder values
    if (template.placeholders) {
      const initialValues: Record<string, string> = {};
      template.placeholders.forEach(ph => {
        initialValues[ph] = '';
      });
      setPlaceholderValues(initialValues);
    }
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    let finalPrompt = selectedTemplate.prompt;

    // Replace placeholders
    if (selectedTemplate.placeholders) {
      selectedTemplate.placeholders.forEach(ph => {
        const value = placeholderValues[ph] || '';
        finalPrompt = finalPrompt.replace(ph, value);
      });
    }

    // Enrich with Brand DNA if available
    if (brandDNA) {
      finalPrompt = enrichPromptWithBrandDNA(finalPrompt, brandDNA);
    }

    setPrompt(finalPrompt);
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  const availableTemplates = useMemo(() => {
    const type = isVideoMode ? 'video' : 'image';
    return getTemplatesByType(type);
  }, [isVideoMode]);

  if (!isOpen && !inline) return null;

  const handleGenerate = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setPredictionStatus(null);
    setCreditsRemaining(null);
    setCreditsUsed(null);
    setAssets([]);

    if (!prompt.trim()) {
      setErrorMessage('Bitte gib einen Prompt an.');
      return;
    }
    if (!selectedModel) {
      setErrorMessage('Kein Modell verfügbar.');
      return;
    }
    if (!isSelectedModelEnabled) {
      setErrorMessage('Dieses Modell ist aktuell deaktiviert.');
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
      formData.append('model', selectedModel.id);
      formData.append('prompt', prompt.trim());
      if (supportsNegativePrompt && negativePrompt.trim()) {
        formData.append('negativePrompt', negativePrompt.trim());
      }
      formData.append('aspectRatio', aspectRatio);
      if (supportsSteps) formData.append('steps', String(steps));
      if (supportsGuidance) formData.append('guidance', String(guidance));
      if (supportsSeed && seed.trim()) formData.append('seed', seed.trim());
      if (requiresImage && imageFile) formData.append('image', imageFile);
      if (supportsDuration) {
        formData.append('duration', String(duration));
      }
      if (supportsFps) {
        formData.append('fps', String(fps));
      }
      if (supportsRenderingSpeed) {
        formData.append('renderingSpeed', renderingSpeed);
      }
      if (supportsStylePreset && stylePreset.trim()) {
        formData.append('stylePreset', stylePreset.trim());
      }
      if (useBrandContext && brandDNA) formData.append('useBrandContext', 'true');
      if (campaignId) formData.append('campaignId', campaignId);
      if (originTag?.trim()) formData.append('originTag', originTag.trim());

      const res = await fetch(`/api/ventures/${ventureId}/marketing/media`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429 && data?.retryAfter) {
          const minutes = Math.max(1, Math.ceil(Number(data.retryAfter) / 60));
          setErrorMessage(`Stundenlimit erreicht. Bitte in ca. ${minutes} Minuten erneut versuchen.`);
          return;
        }
        setErrorMessage(data?.error || 'Generierung fehlgeschlagen.');
        return;
      }

      setCreditsUsed(data.creditsUsed ?? null);
      setCreditsRemaining(data.creditsRemaining ?? null);
      setPredictionStatus(data.status || 'starting');
      setSuccessMessage('Generierung gestartet...');

      if (data.predictionId) {
        await pollPrediction(data.predictionId);
      } else if (data.assets) {
        setAssets(data.assets || []);
        setPredictionStatus('succeeded');
        setSuccessMessage('Generierung abgeschlossen.');
        if (onAssetCreated && data.assets) {
          data.assets.forEach((asset: any) => onAssetCreated(asset));
        }
      } else {
        throw new Error('Keine Prediction-ID erhalten.');
      }

    } catch (error) {
      console.error('Media generation failed', error);
      setErrorMessage(error instanceof Error ? error.message : 'Serverfehler. Bitte erneut versuchen.');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasAdvancedFields =
    supportsSteps ||
    supportsGuidance ||
    supportsDuration ||
    supportsSeed ||
    supportsFps ||
    supportsRenderingSpeed ||
    supportsStylePreset;

  const Content = (
    <div className={`flex flex-col h-full ${inline ? '' : 'max-h-[90vh] overflow-hidden'}`}>
      {!inline && (
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-instrument-serif text-white flex items-center gap-2">
                AI Media Studio
                {chainId && (
                  <span className="text-sm px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37]">
                    Chain {chainPosition}/4
                  </span>
                )}
              </h2>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
                {chainId ? 'Continuing video chain from last frame' : 'Visuals & Video für Marketing'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className={`grid grid-cols-1 ${inline ? 'lg:grid-cols-2' : 'lg:grid-cols-[1.1fr_1fr]'} gap-6 p-6 overflow-y-auto`}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modeOptions.map((item) => {
              const modeModels = getModelsForMode(item.id);
              const isAvailable = modeModels.length > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => isAvailable && setMode(item.id)}
                  disabled={!isAvailable}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${
                    mode === item.id
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  } ${!isAvailable ? 'opacity-40 cursor-not-allowed hover:text-white/50' : ''}`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {item.id.includes('video') ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    {item.label}
                  </div>
                  <p className="text-[10px] text-white/50 mt-1">{item.description}</p>
                  {!isAvailable && (
                    <p className="text-[10px] text-white/40 mt-2 uppercase tracking-widest">Kein Modell</p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="glass-card rounded-xl border border-white/10 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Prompt</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-[#D4AF37]/40 transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-3 h-3" />
                  Templates
                </button>
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
            </div>
            <textarea
              rows={4}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={promptPlaceholder}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none resize-none"
            />
            {supportsNegativePrompt && (
              <textarea
                rows={2}
                value={negativePrompt}
                onChange={(event) => setNegativePrompt(event.target.value)}
                placeholder="Optional: Negative Prompt (z.B. blurry, low quality, artifacts)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-xs focus:border-[#D4AF37] outline-none resize-none"
              />
            )}
          </div>

          <div className="glass-card rounded-xl border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Model & Output</h3>
              {hasAdvancedFields && (
                <button
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white flex items-center gap-2"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {showAdvanced ? 'Basic' : 'Advanced'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Model</label>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                >
                  {availableModels.length === 0 && (
                    <option value="">Kein Modell verfügbar</option>
                  )}
                  {availableModels.map((option) => (
                    <option key={option.id} value={option.id} disabled={!isModelEnabled(option)}>
                      {option.label}
                      {!isModelEnabled(option) && option.disabledReason ? ` (${option.disabledReason})` : ''}
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

            {showAdvanced && hasAdvancedFields && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {supportsSteps && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Steps</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={steps}
                      onChange={(event) => setSteps(Number(event.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                )}
                {supportsGuidance && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Guidance</label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={20}
                      value={guidance}
                      onChange={(event) => setGuidance(Number(event.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                )}
                {supportsDuration && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Duration (sec)</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={duration}
                      onChange={(event) => setDuration(Number(event.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                )}
                {supportsSeed && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Seed</label>
                    <input
                      type="number"
                      value={seed}
                      onChange={(event) => setSeed(event.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                )}
                {supportsFps && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">FPS</label>
                    <input
                      type="number"
                      min={12}
                      max={60}
                      value={fps}
                      onChange={(event) => setFps(Number(event.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                )}
                {supportsRenderingSpeed && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Rendering Speed</label>
                    <select
                      value={renderingSpeed}
                      onChange={(event) => setRenderingSpeed(event.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                    >
                      {IDEOGRAM_RENDERING_SPEEDS.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {supportsStylePreset && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Style Preset</label>
                    <input
                      list="ideogram-style-presets"
                      value={stylePreset}
                      onChange={(event) => setStylePreset(event.target.value)}
                      placeholder="Optional: Mixed_Media"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                    <datalist id="ideogram-style-presets">
                      {IDEOGRAM_STYLE_PRESET_SUGGESTIONS.map((preset) => (
                        <option key={preset} value={preset} />
                      ))}
                    </datalist>
                  </div>
                )}
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
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/40 px-6 py-8 text-white/50 text-xs cursor-pointer hover:bg-white/5 transition-colors">
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
              {predictionStatus && (
                <span className="text-white/60">· Status: {predictionStatus}</span>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedModel}
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

            {/* Generating Skeleton */}
            {isGenerating && assets.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative rounded-xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/5 to-black/60 overflow-hidden">
                  <div className={`${isVideoMode ? 'aspect-video' : 'aspect-square'} w-full relative`}>
                    {isVideoMode ? (
                      <>
                        <div className="absolute inset-0 pointer-events-none">
                          <Hyperspeed
                            className="absolute inset-0"
                            effectOptions={hyperspeedPresets.three}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/35" />
                      </>
                    ) : (
                      <>
                        {/* Shimmer Animation */}
                        <div className="absolute inset-0">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
                        </div>
                        {/* Scanline Effect */}
                        <div className="absolute inset-0 opacity-30">
                          <div className="absolute inset-0 w-full h-24 bg-gradient-to-b from-transparent via-[#D4AF37]/40 to-transparent animate-[scan_3s_ease-in-out_infinite]" />
                        </div>
                      </>
                    )}
                    {/* Center Icon */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="relative">
                        <Sparkles className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                        <div className="absolute inset-0 animate-ping">
                          <Sparkles className="w-8 h-8 text-[#D4AF37] opacity-30" />
                        </div>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-xs font-bold text-white">
                          {isVideoMode ? 'Video' : 'Bild'} wird generiert...
                        </div>
                        {predictionStatus && (
                          <div className="text-[10px] text-white/50 uppercase tracking-wider">
                            {predictionStatus}
                          </div>
                        )}
                        {/* Progress Dots */}
                        <div className="flex items-center justify-center gap-1.5 pt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-[bounce_1s_ease-in-out_0s_infinite]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-[bounce_1s_ease-in-out_0.2s_infinite]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-[bounce_1s_ease-in-out_0.4s_infinite]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bottom Bar with ETA */}
                  <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/10">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/40 uppercase tracking-widest font-bold">
                        {selectedModel?.label || 'Processing'}
                      </span>
                      <span className="text-[#D4AF37]/70">
                        {isVideoMode ? '~60-120s' : '~15-30s'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isGenerating && assets.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/40 text-sm">
                Keine Ergebnisse. Starte eine Generierung, um Visuals zu sehen.
              </div>
            ) : null}

            {/* Results */}
            {assets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assets.map((asset, index) => {
                  const isVideo = asset.type.toLowerCase() === 'video';
                  return (
                    <div key={`${asset.url}-${index}`} className="relative rounded-xl border border-white/10 bg-black/60 overflow-hidden group">
                      {isVideo ? (
                        <div className="aspect-[16/9] sm:aspect-video w-full bg-zinc-900 flex items-center justify-center">
                          <video 
                            key={asset.url}
                            src={asset.url} 
                            controls 
                            muted 
                            loop 
                            playsInline 
                            className="w-full h-full object-contain"
                          >
                            Dein Browser unterstützt dieses Videoformat nicht.
                          </video>
                        </div>
                      ) : (
                        <img src={asset.url} alt="Generated" className="w-full h-auto" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md p-3 opacity-0 group-hover:opacity-100 transition-opacity border-t border-white/10">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                            {isVideo ? 'Video' : 'Image'} Output
                            {chainId && (
                              <span className="ml-2 text-[#D4AF37]">Chain {chainPosition}/4</span>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            {isVideo && (chainId ? chainPosition < 4 : true) && (
                              <button
                                onClick={() => handleContinueChain(asset.url, index)}
                                disabled={isExtractingFrame}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 rounded-lg text-[10px] font-bold text-[#D4AF37] transition-all disabled:opacity-50"
                                title={chainId ? `Continue to ${chainPosition + 1}/4` : 'Start video chain (1/4)'}
                              >
                                <Link2 className="w-3 h-3" />
                                {chainId ? `Continue (${chainPosition + 1}/4)` : 'Start Chain'}
                              </button>
                            )}
                            <a
                              href={asset.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition-all"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Template Modal Overlay
  const TemplateModal = showTemplates && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] rounded-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-instrument-serif text-white">Prompt Templates</h2>
              <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">
                {isVideoMode ? 'Video' : 'Image'} · Best Practices 2025
              </p>
            </div>
          </div>
          <button
            onClick={() => { setShowTemplates(false); setSelectedTemplate(null); }}
            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Template Selection - Scrollable */}
        {!selectedTemplate && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid gap-3">
              {availableTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#D4AF37]/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                          {template.label}
                        </span>
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/10 text-white/40">
                          {template.category}
                        </span>
                      </div>
                      {template.tips && (
                        <p className="text-xs text-white/50">{template.tips}</p>
                      )}
                    </div>
                    <Copy className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Template Configuration - Scrollable */}
        {selectedTemplate && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Template Preview</div>
              <div className="text-sm text-white/70 font-mono leading-relaxed">
                {selectedTemplate.prompt}
              </div>
            </div>

            {selectedTemplate.placeholders && selectedTemplate.placeholders.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Fülle die Platzhalter aus
                </div>
                {selectedTemplate.placeholders.map((placeholder) => (
                  <div key={placeholder}>
                    <label className="block text-xs text-white/50 mb-1.5 font-mono">
                      {placeholder}
                    </label>
                    <input
                      type="text"
                      value={placeholderValues[placeholder] || ''}
                      onChange={(e) => setPlaceholderValues(prev => ({ ...prev, [placeholder]: e.target.value }))}
                      placeholder={`z.B. ${placeholder === '[PRODUCT]' ? 'Premium Sneakers' : placeholder === '[BRAND]' ? 'Nike' : placeholder === '[COLOR1]' ? 'neon pink' : 'dein Text'}`}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {selectedTemplate.tips && (
              <div className="p-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1">
                  💡 Pro Tip
                </div>
                <div className="text-xs text-white/70">{selectedTemplate.tips}</div>
              </div>
            )}

            <div className="flex gap-2 sm:gap-3 pt-2 sticky bottom-0 bg-gradient-to-t from-black via-black to-transparent pt-4 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-0">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-xs sm:text-sm font-bold"
              >
                Zurück
              </button>
              <button
                onClick={handleApplyTemplate}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 transition-all text-xs sm:text-sm font-bold"
              >
                Übernehmen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (inline) {
    return (
      <>
        <div className="w-full h-full">{Content}</div>
        {TemplateModal}
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="glass-card w-full max-w-5xl rounded-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden">
          {Content}
        </div>
      </div>
      {TemplateModal}
    </>
  );
}
