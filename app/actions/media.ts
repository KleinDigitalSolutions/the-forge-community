'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { reserveEnergy, settleEnergy, refundEnergy } from '@/lib/energy';
import { revalidatePath } from 'next/cache';

// Helper to interact with Modal Backend
async function callModal(endpoint: string, payload: any) {
  const MODAL_URL = process.env.MODAL_URL || 'https://bucci369--forge-media-studio'; // Base URL pattern
  // Note: Actual URL depends on Modal deployment. Assuming env var or fixed pattern.
  // For now using a placeholder that needs to be set in .env
  
  const token = process.env.MODAL_API_KEY;
  const res = await fetch(`${MODAL_URL}-${endpoint}`, { // Modal naming convention usually app-name-func-name
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Modal call failed');
  }
  
  return res.json();
}

export async function getVentureMedia(ventureId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  return prisma.mediaAsset.findMany({
    where: {
      ventureId,
      venture: { owner: { email: session.user.email } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function saveGeneratedAsset(
  ventureId: string,
  base64Data: string,
  type: 'IMAGE' | 'VIDEO',
  metadata: any,
  cost: number,
  reservationId: string
) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  if (!user) throw new Error('User not found');

  try {
    // 1. Upload to Blob Storage
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${ventureId}/${Date.now()}.${type === 'VIDEO' ? 'mp4' : 'png'}`;
    
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: type === 'VIDEO' ? 'video/mp4' : 'image/png'
    });

    // 2. Create DB Entry
    const asset = await prisma.mediaAsset.create({
      data: {
        ventureId,
        ownerId: user.id,
        type,
        url: blob.url,
        filename: filename,
        mimeType: type === 'VIDEO' ? 'video/mp4' : 'image/png',
        size: buffer.length,
        source: 'GENERATED',
        prompt: metadata.prompt,
        model: metadata.model,
        width: metadata.width,
        height: metadata.height,
        duration: metadata.duration
      }
    });

    // 3. Settle Energy Transaction
    await settleEnergy({
      reservationId,
      finalCost: cost,
      metadata: { assetId: asset.id }
    });

    revalidatePath(`/forge/${ventureId}/marketing`);
    return asset;

  } catch (error) {
    console.error('Save failed:', error);
    // Refund on failure
    await refundEnergy(reservationId, 'save-failed');
    throw error;
  }
}

export async function deleteAsset(assetId: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    include: { venture: { include: { owner: true } } }
  });

  if (!asset || asset.venture.owner.email !== session.user.email) {
    throw new Error('Unauthorized');
  }

  // Optional: Delete from Blob (requires del() import)
  // await del(asset.url); 

  await prisma.mediaAsset.delete({ where: { id: assetId } });
  revalidatePath(`/forge/${asset.ventureId}/marketing`);
}
