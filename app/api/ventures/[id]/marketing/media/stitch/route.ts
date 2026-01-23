import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { reserveEnergy, settleEnergy, refundEnergy, InsufficientEnergyError } from '@/lib/energy';
import { put } from '@vercel/blob';

// Default Modal URL pattern if not in ENV
const MODAL_STITCH_URL = process.env.MODAL_STITCH_URL || 'https://bucci369--forge-media-studio-stitch-videos.modal.run';

export const maxDuration = 60; // Stitching might take time

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { assetIds } = await req.json();

  if (!assetIds || !Array.isArray(assetIds) || assetIds.length < 2) {
    return NextResponse.json({ error: 'At least 2 videos required' }, { status: 400 });
  }

  // 1. Resolve User & Venture
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const venture = await prisma.venture.findFirst({
    where: { 
      id, 
      ownerId: user.id // Simplification: Only owner for now
    }
  });

  if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 });

  // 2. Reserve Energy (10 Credits for Stitching)
  const COST = 10;
  let reservationId: string | null = null;

  try {
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: COST,
      feature: 'marketing.media.stitch',
      metadata: { ventureId: id, assetCount: assetIds.length }
    });
    reservationId = reservation.reservationId;

    // 3. Fetch Assets
    const assets = await prisma.mediaAsset.findMany({
      where: { 
        id: { in: assetIds },
        ventureId: id,
        type: 'VIDEO'
      },
      orderBy: { createdAt: 'asc' } // Or maintain order from input?
    });

    // Sort assets based on input array order
    const sortedAssets = assetIds
      .map(aid => assets.find(a => a.id === aid))
      .filter(Boolean);

    if (sortedAssets.length < 2) {
      throw new Error('Could not find enough valid video assets');
    }

    // 4. Download & Encode
    const videoBuffers = await Promise.all(sortedAssets.map(async (asset) => {
      if (!asset) return '';
      const response = await fetch(asset.url);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    }));

    // 5. Call Modal
    const modalRes = await fetch(MODAL_STITCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MODAL_API_KEY}`
      },
      body: JSON.stringify({ videos: videoBuffers })
    });

    if (!modalRes.ok) {
        const errText = await modalRes.text();
        throw new Error(`Modal error: ${errText}`);
    }

    const data = await modalRes.json();
    const resultAsset = data.asset; // Expecting { type: 'video', data: 'base64...' }

    if (!resultAsset || !resultAsset.data) {
        throw new Error('No data returned from stitcher');
    }

    // 6. Upload Result
    const buffer = Buffer.from(resultAsset.data, 'base64');
    const filename = `marketing/${user.id}/stitched-${Date.now()}.mp4`;
    
    const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'video/mp4'
    });

    // 7. Save to DB
    const newAsset = await prisma.mediaAsset.create({
        data: {
            ventureId: id,
            ownerId: user.id,
            type: 'VIDEO',
            url: blob.url,
            filename,
            mimeType: 'video/mp4',
            size: buffer.length,
            source: 'EDITED',
            tags: ['stitched', 'campaign'],
            width: sortedAssets[0]?.width || 1280, // Assume same res
            height: sortedAssets[0]?.height || 720,
        }
    });

    // 8. Settle
    await settleEnergy({
        reservationId,
        finalCost: COST,
        metadata: { newAssetId: newAsset.id }
    });

    return NextResponse.json({ asset: newAsset });

  } catch (error) {
    console.error('Stitching failed:', error);
    if (reservationId) await refundEnergy(reservationId, 'stitch-failed');
    
    if (error instanceof InsufficientEnergyError) {
        return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json({ error: 'Stitching failed' }, { status: 500 });
  }
}
