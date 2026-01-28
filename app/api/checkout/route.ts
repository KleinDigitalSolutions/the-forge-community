import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * Stripe Checkout Session Creator
 *
 * Supports:
 * - Platform Subscriptions (recurring)
 * - AI Credit Packs (one-time)
 */

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { type, priceId } = body;

    // Validate input
    if (!type || !priceId) {
      return new NextResponse('Missing required fields: type, priceId', { status: 400 });
    }

    if (!['subscription', 'credits'].includes(type)) {
      return new NextResponse('Invalid type. Must be "subscription" or "credits"', { status: 400 });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, stripeCustomerId: true },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.stakeandscale.de';

    // ============================================
    // CREATE CHECKOUT SESSION
    // ============================================

    const sessionConfig: any = {
      customer_email: user.email,
      mode: type === 'subscription' ? 'subscription' : 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        email: user.email,
        type: type,
      },
      // German compliance
      // automatic_tax: { enabled: true }, // Disabled - requires Stripe Tax setup
      billing_address_collection: 'required',
      allow_promotion_codes: true,
    };

    // Add tax ID collection for B2B customers
    if (type === 'subscription') {
      sessionConfig.tax_id_collection = { enabled: true };
    }

    // Use existing customer if available
    if (user.stripeCustomerId) {
      sessionConfig.customer = user.stripeCustomerId;
      delete sessionConfig.customer_email;
    }

    // Set success/cancel URLs
    if (type === 'subscription') {
      sessionConfig.success_url = `${appUrl}/dashboard?payment=success&type=subscription`;
      sessionConfig.cancel_url = `${appUrl}/pricing?canceled=true`;
    } else {
      sessionConfig.success_url = `${appUrl}/dashboard?payment=success&type=credits`;
      sessionConfig.cancel_url = `${appUrl}/pricing?canceled=true`;
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error: any) {
    console.error('[CHECKOUT] Error creating session:', error);
    return new NextResponse(
      `Internal Server Error: ${error.message}`,
      { status: 500 }
    );
  }
}
