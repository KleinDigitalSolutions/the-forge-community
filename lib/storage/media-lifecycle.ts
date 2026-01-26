/**
 * Media Asset Lifecycle Management
 *
 * Handles automatic cleanup of generated media assets to prevent unbounded storage growth.
 *
 * Features:
 * - Auto-delete assets after retention period
 * - Soft-delete (metadata preserved for audit)
 * - Favorite protection (user can exclude assets)
 * - Dry-run mode for testing
 *
 * @module lib/storage/media-lifecycle
 */

import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

/**
 * Cleanup configuration
 */
export const LIFECYCLE_CONFIG = {
  // Retention period in days
  RETENTION_DAYS: parseInt(process.env.MEDIA_RETENTION_DAYS || '90', 10),

  // Feature flags
  ENABLE_CLEANUP: process.env.ENABLE_MEDIA_CLEANUP !== 'false',
  DRY_RUN: process.env.MEDIA_CLEANUP_DRY_RUN === 'true',

  // Batch size (process in chunks to avoid timeouts)
  BATCH_SIZE: parseInt(process.env.MEDIA_CLEANUP_BATCH_SIZE || '100', 10),
} as const;

/**
 * Cleanup result metrics
 */
export type CleanupResult = {
  success: boolean;
  assetsFound: number;
  assetsDeleted: number;
  bytesFreed: number;
  errors: string[];
  dryRun: boolean;
  duration: number; // milliseconds
};

/**
 * Media asset eligibility for cleanup
 */
type CleanupEligibility = {
  eligible: boolean;
  reason?: string;
};

/**
 * Check if media asset is eligible for cleanup
 *
 * Criteria:
 * - Must be generated (not uploaded by user)
 * - Must be older than retention period
 * - Must not be favorited
 * - Must not already be archived
 *
 * @param asset - MediaAsset record
 * @param retentionDate - Cutoff date (assets older than this are eligible)
 * @returns Eligibility status with reason
 */
export function isEligibleForCleanup(
  asset: {
    source: string;
    createdAt: Date;
    isFavorite: boolean;
    isArchived: boolean;
  },
  retentionDate: Date
): CleanupEligibility {
  // Only clean up generated assets (not user uploads)
  if (asset.source !== 'GENERATED') {
    return { eligible: false, reason: 'Not generated' };
  }

  // Already archived - skip
  if (asset.isArchived) {
    return { eligible: false, reason: 'Already archived' };
  }

  // User favorited - protect from deletion
  if (asset.isFavorite) {
    return { eligible: false, reason: 'Favorited by user' };
  }

  // Not old enough yet
  if (asset.createdAt > retentionDate) {
    return { eligible: false, reason: `Created after ${retentionDate.toISOString()}` };
  }

  return { eligible: true };
}

/**
 * Clean up old generated media assets
 *
 * Process:
 * 1. Query eligible assets (generated, old, not favorited)
 * 2. Delete from Vercel Blob storage
 * 3. Soft-delete in database (set isArchived=true)
 * 4. Return metrics
 *
 * @param options - Cleanup options
 * @returns Cleanup result with metrics
 *
 * @example
 * // Dry run (log what would be deleted)
 * const result = await cleanupOldMediaAssets({ dryRun: true });
 * console.log(`Would delete ${result.assetsDeleted} assets`);
 *
 * // Production run
 * const result = await cleanupOldMediaAssets();
 * console.log(`Freed ${result.bytesFreed / 1024 / 1024} MB`);
 */
export async function cleanupOldMediaAssets(options?: {
  dryRun?: boolean;
  batchSize?: number;
  retentionDays?: number;
}): Promise<CleanupResult> {
  const startTime = Date.now();

  const dryRun = options?.dryRun ?? LIFECYCLE_CONFIG.DRY_RUN;
  const batchSize = options?.batchSize ?? LIFECYCLE_CONFIG.BATCH_SIZE;
  const retentionDays = options?.retentionDays ?? LIFECYCLE_CONFIG.RETENTION_DAYS;

  // Feature flag check
  if (!LIFECYCLE_CONFIG.ENABLE_CLEANUP && !dryRun) {
    return {
      success: false,
      assetsFound: 0,
      assetsDeleted: 0,
      bytesFreed: 0,
      errors: ['Cleanup disabled (ENABLE_MEDIA_CLEANUP=false)'],
      dryRun: false,
      duration: Date.now() - startTime
    };
  }

  const result: CleanupResult = {
    success: true,
    assetsFound: 0,
    assetsDeleted: 0,
    bytesFreed: 0,
    errors: [],
    dryRun,
    duration: 0
  };

  try {
    // Calculate retention cutoff date
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - retentionDays);

    console.log(`[Media Cleanup] Starting cleanup (dry-run: ${dryRun}, retention: ${retentionDays} days, cutoff: ${retentionDate.toISOString()})`);

    // Query eligible assets
    const assets = await prisma.mediaAsset.findMany({
      where: {
        source: 'GENERATED',
        createdAt: { lt: retentionDate },
        isArchived: false,
        isFavorite: false
      },
      select: {
        id: true,
        url: true,
        size: true,
        type: true,
        createdAt: true,
        ventureId: true
      },
      take: batchSize,
      orderBy: { createdAt: 'asc' } // Delete oldest first
    });

    result.assetsFound = assets.length;

    console.log(`[Media Cleanup] Found ${assets.length} eligible assets`);

    if (assets.length === 0) {
      result.duration = Date.now() - startTime;
      return result;
    }

    // Process each asset
    for (const asset of assets) {
      try {
        if (dryRun) {
          // Dry run: Log what would be deleted
          console.log(`[Media Cleanup] [DRY RUN] Would delete: ${asset.url} (${asset.size} bytes, created: ${asset.createdAt.toISOString()})`);
          result.assetsDeleted++;
          result.bytesFreed += asset.size || 0;
        } else {
          // Production: Actually delete
          console.log(`[Media Cleanup] Deleting: ${asset.url}`);

          // Delete from Vercel Blob
          try {
            await del(asset.url);
          } catch (blobError) {
            // Blob might already be deleted - log warning but continue
            console.warn(`[Media Cleanup] Blob delete failed (may already be deleted): ${asset.url}`, blobError);
          }

          // Soft-delete in database (preserve metadata for audit)
          await prisma.mediaAsset.update({
            where: { id: asset.id },
            data: {
              isArchived: true,
              updatedAt: new Date()
            }
          });

          result.assetsDeleted++;
          result.bytesFreed += asset.size || 0;

          console.log(`[Media Cleanup] Deleted: ${asset.url} (${asset.size} bytes freed)`);
        }
      } catch (assetError) {
        const errorMsg = assetError instanceof Error ? assetError.message : String(assetError);
        console.error(`[Media Cleanup] Failed to delete asset ${asset.id}:`, errorMsg);
        result.errors.push(`Asset ${asset.id}: ${errorMsg}`);
        result.success = false; // Mark as partial failure
      }
    }

    result.duration = Date.now() - startTime;

    console.log(`[Media Cleanup] Completed: ${result.assetsDeleted}/${result.assetsFound} assets deleted, ${(result.bytesFreed / 1024 / 1024).toFixed(2)} MB freed (${result.duration}ms)`);

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Media Cleanup] Cleanup failed:', errorMsg);

    result.success = false;
    result.errors.push(errorMsg);
    result.duration = Date.now() - startTime;

    return result;
  }
}

/**
 * Get cleanup statistics (without actually cleaning)
 *
 * Useful for monitoring/dashboards.
 *
 * @returns Current cleanup eligibility stats
 */
export async function getCleanupStats(): Promise<{
  eligibleAssets: number;
  totalSize: number; // bytes
  oldestAsset: Date | null;
  retentionCutoff: Date;
}> {
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - LIFECYCLE_CONFIG.RETENTION_DAYS);

  const stats = await prisma.mediaAsset.aggregate({
    where: {
      source: 'GENERATED',
      createdAt: { lt: retentionDate },
      isArchived: false,
      isFavorite: false
    },
    _count: true,
    _sum: { size: true },
    _min: { createdAt: true }
  });

  return {
    eligibleAssets: stats._count,
    totalSize: stats._sum.size || 0,
    oldestAsset: stats._min.createdAt,
    retentionCutoff: retentionDate
  };
}
