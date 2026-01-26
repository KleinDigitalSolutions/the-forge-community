const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPositive = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, value);
};

export const CREDIT_EUR_VALUE = clampPositive(
  parseNumber(process.env.CREDIT_EUR_VALUE, 0.1),
  0.1
);

export const CREDIT_MARGIN = clampPositive(
  parseNumber(process.env.CREDIT_MARGIN, 1.2),
  1.2
);

export const ELEVENLABS_EUR_PER_1K_CREDITS = clampPositive(
  parseNumber(process.env.ELEVENLABS_EUR_PER_1K_CREDITS, 0.2),
  0.2
);

const isTurboOrFlashModel = (modelId?: string | null) => {
  const id = (modelId || '').toLowerCase();
  return id.includes('turbo') || id.includes('flash');
};

export const calculateCreditsFromEur = (costEur: number, minimum = 1) => {
  if (!Number.isFinite(costEur) || costEur <= 0) return Math.max(1, minimum);
  const effectiveCost = costEur * Math.max(1, CREDIT_MARGIN);
  const credits = Math.ceil(effectiveCost / Math.max(0.0001, CREDIT_EUR_VALUE));
  return Math.max(minimum, credits);
};

export const estimateElevenLabsTtsCredits = (options: {
  textLength: number;
  modelId?: string | null;
  voiceMultiplier?: number;
  minimumCredits?: number;
}) => {
  const textLength = Math.max(0, Math.floor(options.textLength));
  const voiceMultiplier = clampPositive(options.voiceMultiplier ?? 1, 1) || 1;
  const perCharCredits = isTurboOrFlashModel(options.modelId) ? 0.5 : 1;

  const elevenCredits = Math.ceil(textLength * perCharCredits * voiceMultiplier);
  const eurPerCredit = Math.max(0, ELEVENLABS_EUR_PER_1K_CREDITS) / 1000;
  const costEur = elevenCredits * eurPerCredit;
  const credits = calculateCreditsFromEur(costEur, options.minimumCredits ?? 1);

  return {
    credits,
    elevenCredits,
    costEur,
    perCharCredits
  };
};
