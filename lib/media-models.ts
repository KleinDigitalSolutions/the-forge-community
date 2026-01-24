/**
 * Centralized AI Media Model Registry - January 2026 Edition
 */

export type MediaProvider = 'replicate' | 'ideogram' | 'openai';
export type ModelTier = 'turbo' | 'pro';

export interface ModelDefinition {
  id: string;
  provider: MediaProvider;
  tier: ModelTier;
  label: string;
  cost: number;
  type: 'image' | 'video';
  aspectRatios: string[];
}

export const IMAGE_MODELS: Record<string, ModelDefinition> = {
  // FORUM / FAST USE (nur Forum)
  'flux-schnell': {
    id: 'black-forest-labs/flux-schnell',
    provider: 'replicate',
    tier: 'turbo',
    label: 'Flux Schnell (Speed)',
    cost: 2,
    type: 'image',
    aspectRatios: ['1:1', '16:9', '9:16'],
  },
  // STUDIO / MARKETING PRO
  'flux-1.1-pro': {
    id: 'black-forest-labs/flux-1.1-pro',
    provider: 'replicate',
    tier: 'pro',
    label: 'Flux 1.1 Pro (Gold Standard)',
    cost: 15,
    type: 'image',
    aspectRatios: ['1:1', '16:9', '9:16', '4:5', '3:2'],
  },
  'flux-2-pro': {
    id: 'black-forest-labs/flux-2-pro',
    provider: 'replicate',
    tier: 'pro',
    label: 'Flux 2 Pro (Photorealism)',
    cost: 25,
    type: 'image',
    aspectRatios: ['1:1', '16:9', '9:16', '21:9'],
  },
  'ideogram-v3-pro': {
    id: 'ideogram-v3',
    provider: 'ideogram',
    tier: 'pro',
    label: 'Ideogram 3.0 Pro (Typography)',
    cost: 20,
    type: 'image',
    aspectRatios: ['1:1', '16:9', '9:16'],
  }
};

export const VIDEO_MODELS: Record<string, ModelDefinition> = {
  'kling-v1.5-pro': {
    id: 'kwaivgi/kling-v1.5-pro',
    provider: 'replicate',
    tier: 'pro',
    label: 'Kling 1.5 Pro (Cinema)',
    cost: 50,
    type: 'video',
    aspectRatios: ['16:9', '9:16', '4:5'],
  },
  'minimax-video-01': {
    id: 'minimax/video-01',
    provider: 'replicate',
    tier: 'pro',
    label: 'Minimax Video (Human Motion)',
    cost: 45,
    type: 'video',
    aspectRatios: ['16:9', '9:16'],
  },
  'luma-dream-machine': {
    id: 'lumaai/dream-machine',
    provider: 'replicate',
    tier: 'pro',
    label: 'Luma Dream Machine (Atmospheric)',
    cost: 40,
    type: 'video',
    aspectRatios: ['16:9', '9:16'],
  },
};

export const DEFAULT_MODELS = {
  forum: IMAGE_MODELS['flux-schnell'],
  studio_image: IMAGE_MODELS['flux-2-pro'],
  studio_video: VIDEO_MODELS['minimax-video-01'],
};
