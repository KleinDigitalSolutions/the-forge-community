import { prisma } from '@/lib/prisma';

export type TokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type EnergyReserveInput = {
  userId: string;
  amount: number;
  feature?: string;
  requestId?: string;
  provider?: string;
  model?: string;
  metadata?: Record<string, any>;
};

export type EnergyReserveResult = {
  reservationId: string;
  reservedCredits: number;
  balanceAfter: number;
  status: 'RESERVED' | 'SETTLED' | 'REFUNDED';
  reused?: boolean;
};

export type QuotaResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
};

export type EnergySettleInput = {
  reservationId: string;
  finalCost?: number;
  provider?: string;
  model?: string;
  usage?: TokenUsage;
  metadata?: Record<string, any>;
};

export class InsufficientEnergyError extends Error {
  requiredCredits: number;
  creditsAvailable: number;

  constructor(requiredCredits: number, creditsAvailable: number) {
    super('Nicht genug Energy (Credits). Bitte lade dein Konto auf.');
    this.requiredCredits = requiredCredits;
    this.creditsAvailable = creditsAvailable;
  }
}

const normalizeAmount = (value: number, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
};

export const estimateTokens = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return 1;
  return Math.max(1, Math.ceil(trimmed.length / 4));
};

export const calculateTokenCredits = (totalTokens: number, creditsPer1k: number, minimum = 1) => {
  const normalizedTokens = Math.max(1, Math.floor(totalTokens));
  const normalizedRate = Math.max(1, Math.floor(creditsPer1k));
  return Math.max(minimum, Math.ceil((normalizedTokens / 1000) * normalizedRate));
};

const mergeMetadata = (base: Record<string, any> | null | undefined, next?: Record<string, any>) => {
  if (!next) return base ?? undefined;
  return { ...(base ?? {}), ...next };
};

type QuotaInput = {
  userId: string;
  feature: string;
  limit: number;
  windowMs?: number;
};

const consumeQuotaWindow = async (options: QuotaInput & { windowMs: number }): Promise<QuotaResult> => {
  const limit = Math.max(0, Math.floor(options.limit));
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / options.windowMs) * options.windowMs);
  const resetAt = new Date(windowStart.getTime() + options.windowMs);

  if (limit <= 0) {
    return { allowed: true, remaining: Number.MAX_SAFE_INTEGER, limit: 0, resetAt };
  }

  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("userId", "feature", "windowStart", "count", "createdAt", "updatedAt")
    VALUES (${options.userId}, ${options.feature}, ${windowStart}, 1, NOW(), NOW())
    ON CONFLICT ("userId", "feature", "windowStart")
    DO UPDATE SET
      "count" = "RateLimitBucket"."count" + 1,
      "updatedAt" = NOW()
    WHERE "RateLimitBucket"."count" < ${limit}
    RETURNING "count";
  `;

  if (rows.length === 0) {
    return { allowed: false, remaining: 0, limit, resetAt };
  }

  const currentCount = rows[0].count;
  const remaining = Math.max(0, limit - currentCount);

  return { allowed: true, remaining, limit, resetAt };
};

export async function consumeHourlyQuota(options: QuotaInput): Promise<QuotaResult> {
  const windowMs = options.windowMs ?? 60 * 60 * 1000;
  return consumeQuotaWindow({ ...options, windowMs });
}

export async function consumeDailyQuota(options: QuotaInput): Promise<QuotaResult> {
  const windowMs = options.windowMs ?? 24 * 60 * 60 * 1000;
  return consumeQuotaWindow({ ...options, windowMs });
}

export async function reserveEnergy(input: EnergyReserveInput): Promise<EnergyReserveResult> {
  const amount = normalizeAmount(input.amount);

  return prisma.$transaction(async (tx) => {
    if (input.requestId) {
      const existing = await tx.energyTransaction.findUnique({
        where: { requestId: input.requestId },
        select: { id: true, delta: true, balanceAfter: true, status: true }
      });

      if (existing) {
        return {
          reservationId: existing.id,
          reservedCredits: Math.abs(existing.delta),
          balanceAfter: existing.balanceAfter,
          status: existing.status,
          reused: true,
        };
      }
    }

    const adminBypassEnabled = process.env.ADMIN_UNLIMITED_ENERGY !== 'false';
    if (adminBypassEnabled) {
      const adminUser = await tx.user.findUnique({
        where: { id: input.userId },
        select: { role: true, credits: true }
      });

      if (adminUser?.role === 'ADMIN') {
        const reservation = await tx.energyTransaction.create({
          data: {
            userId: input.userId,
            delta: 0,
            balanceAfter: adminUser.credits,
            type: 'SPEND',
            status: 'RESERVED',
            feature: input.feature,
            provider: input.provider,
            model: input.model,
            requestId: input.requestId,
            metadata: mergeMetadata(input.metadata, { reservedCredits: amount, bypass: 'admin' })
          },
          select: { id: true }
        });

        return {
          reservationId: reservation.id,
          reservedCredits: amount,
          balanceAfter: adminUser.credits,
          status: 'RESERVED'
        };
      }
    }

    const updateResult = await tx.user.updateMany({
      where: { id: input.userId, credits: { gte: amount } },
      data: { credits: { decrement: amount } }
    });

    if (updateResult.count === 0) {
      const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { credits: true }
      });
      throw new InsufficientEnergyError(amount, user?.credits ?? 0);
    }

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: { credits: true }
    });

    if (!user) {
      throw new Error('Benutzer nicht gefunden');
    }

    const reservation = await tx.energyTransaction.create({
      data: {
        userId: input.userId,
        delta: -amount,
        balanceAfter: user.credits,
        type: 'SPEND',
        status: 'RESERVED',
        feature: input.feature,
        provider: input.provider,
        model: input.model,
        requestId: input.requestId,
        metadata: mergeMetadata(input.metadata, { reservedCredits: amount })
      },
      select: { id: true }
    });

    return {
      reservationId: reservation.id,
      reservedCredits: amount,
      balanceAfter: user.credits,
      status: 'RESERVED'
    };
  });
}

export async function settleEnergy(input: EnergySettleInput) {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.energyTransaction.findUnique({
      where: { id: input.reservationId },
      select: {
        id: true,
        userId: true,
        delta: true,
        status: true,
        metadata: true,
        feature: true,
        balanceAfter: true,
      }
    });

    if (!reservation) {
      throw new Error('Energy-Reservierung nicht gefunden');
    }

    if (reservation.status === 'REFUNDED') {
      return { creditsRemaining: reservation.balanceAfter };
    }

    if (reservation.status === 'SETTLED') {
      const user = await tx.user.findUnique({
        where: { id: reservation.userId },
        select: { credits: true }
      });
      return { creditsRemaining: user?.credits ?? reservation.balanceAfter };
    }

    const reservedCredits = Math.abs(reservation.delta);
    const finalCost = normalizeAmount(input.finalCost ?? reservedCredits);
    const refundAmount = Math.max(0, reservedCredits - finalCost);

    await tx.energyTransaction.update({
      where: { id: reservation.id },
      data: {
        status: 'SETTLED',
        provider: input.provider,
        model: input.model,
        promptTokens: input.usage?.promptTokens,
        completionTokens: input.usage?.completionTokens,
        totalTokens: input.usage?.totalTokens,
        metadata: mergeMetadata(reservation.metadata as Record<string, any>, {
          finalCredits: finalCost,
          refundCredits: refundAmount || undefined,
          ...input.metadata
        })
      }
    });

    if (refundAmount <= 0) {
      return { creditsRemaining: reservation.balanceAfter };
    }

    const updated = await tx.user.update({
      where: { id: reservation.userId },
      data: { credits: { increment: refundAmount } },
      select: { credits: true }
    });

    await tx.energyTransaction.create({
      data: {
        userId: reservation.userId,
        delta: refundAmount,
        balanceAfter: updated.credits,
        type: 'REFUND',
        status: 'SETTLED',
        feature: reservation.feature,
        relatedTransactionId: reservation.id,
        metadata: { reason: 'reserve-adjustment' }
      }
    });

    return { creditsRemaining: updated.credits };
  });
}

export async function refundEnergy(reservationId: string, reason = 'provider-failed') {
  return prisma.$transaction(async (tx) => {
    const reservation = await tx.energyTransaction.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        userId: true,
        delta: true,
        status: true,
        feature: true,
      }
    });

    if (!reservation) {
      throw new Error('Energy-Reservierung nicht gefunden');
    }

    if (reservation.status === 'REFUNDED') {
      return null;
    }

    const refundAmount = Math.abs(reservation.delta);

    const updated = await tx.user.update({
      where: { id: reservation.userId },
      data: { credits: { increment: refundAmount } },
      select: { credits: true }
    });

    await tx.energyTransaction.update({
      where: { id: reservation.id },
      data: { status: 'REFUNDED' }
    });

    await tx.energyTransaction.create({
      data: {
        userId: reservation.userId,
        delta: refundAmount,
        balanceAfter: updated.credits,
        type: 'REFUND',
        status: 'SETTLED',
        feature: reservation.feature,
        relatedTransactionId: reservation.id,
        metadata: { reason }
      }
    });

    return { creditsRemaining: updated.credits };
  });
}

export async function grantEnergy(userId: string, amount: number, reason = 'grant') {
  const normalizedAmount = normalizeAmount(amount);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: normalizedAmount } },
      select: { credits: true }
    });

    await tx.energyTransaction.create({
      data: {
        userId,
        delta: normalizedAmount,
        balanceAfter: updated.credits,
        type: 'GRANT',
        status: 'SETTLED',
        feature: 'system',
        metadata: { reason }
      }
    });

    return { creditsRemaining: updated.credits };
  });
}
