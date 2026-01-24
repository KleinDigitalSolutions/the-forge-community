import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { reserveEnergy, refundEnergy, settleEnergy } from '@/lib/energy';
import { expandPrompt } from '@/lib/ai-prompt-engine';
import { IMAGE_MODELS, VIDEO_MODELS, DEFAULT_MODELS } from '@/lib/media-models';
import Replicate from 'replicate';

export const maxDuration = 60; // Pro models and video need time

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { 
      prompt: rawPrompt, 
      type = 'image', 
      modelKey, 
      aspectRatio = '1:1', 
      isForum = false 
    } = await request.json();

    if (!rawPrompt) {
      return NextResponse.json({ error: 'Prompt fehlt' }, { status: 400 });
    }

    // 1. Resolve Model
    let modelDef = isForum ? DEFAULT_MODELS.forum : (type === 'video' ? DEFAULT_MODELS.studio_video : DEFAULT_MODELS.studio_image);
    
    if (modelKey) {
      const customModel = type === 'video' ? VIDEO_MODELS[modelKey] : IMAGE_MODELS[modelKey];
      if (customModel) modelDef = customModel;
    }

    // 2. Pricing & User
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, credits: true }
    });

    if (!user) throw new Error('User not found');
    const cost = modelDef.cost;

    // 3. Reserve Credits
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: cost,
      feature: `forge.media.${type}.${modelDef.tier}`,
      metadata: { model: modelDef.id, tier: modelDef.tier }
    });

    // 4. Expand Prompt (only if not a tiny request)
    const refinedPrompt = await expandPrompt(rawPrompt, type as 'image' | 'video');

    // 5. Call Replicate
    // NOTE: We assume most models follow standard Replicate input schema.
    // For specific models like Kling or Flux Pro, we might need adjustments.
    
    const replicateInput: any = {
      prompt: refinedPrompt,
      aspect_ratio: aspectRatio,
    };

    // Specific model adjustments
    if (modelDef.id.includes('flux-1.1-pro')) {
      replicateInput.output_format = "jpg";
      replicateInput.output_quality = 100;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    const webhookUrl = appUrl ? `${appUrl}/api/webhooks/replicate` : undefined;

    const prediction = await replicate.predictions.create({
      model: modelDef.id,
      input: replicateInput,
      ...(webhookUrl ? {
        webhook: webhookUrl,
        webhook_events_filter: ['completed'],
      } : {}),
    });

    // 6. Cache the job (Reuse existing pattern)
    // We use the systemCache to track this prediction
    await prisma.systemCache.create({
      data: {
        key: `replicate:media:${prediction.id}`,
        value: JSON.stringify({
          userId: user.id,
          model: modelDef.id,
          prompt: refinedPrompt,
          rawPrompt,
          cost,
          reservationId: reservation.reservationId,
          type
        }),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h
      }
    });

    return NextResponse.json({
      predictionId: prediction.id,
      status: prediction.status,
      model: modelDef.label,
      refinedPrompt: refinedPrompt
    });

  } catch (error: any) {
    console.error('Unified Media API Error:', error);
    return NextResponse.json({ error: error.message || 'Generierung fehlgeschlagen' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const predictionId = request.nextUrl.searchParams.get('predictionId');
  if (!predictionId) return NextResponse.json({ error: 'Missing predictionId' }, { status: 400 });

  try {
    const prediction = await replicate.predictions.get(predictionId);
    
    let assets = null;
    if (prediction.status === 'succeeded' && prediction.output) {
      // Replicate output format varies, normalize to array of objects
      const urls = Array.isArray(prediction.output) ? prediction.output : [prediction.output];
      assets = urls.map(url => ({ url, type: 'image' }));
    }

    return NextResponse.json({
      status: prediction.status,
      assets,
      error: prediction.error
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
