import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { createCreditPurchaseInvoice, createSubscriptionInvoice } from '@/lib/platform-invoicing';
import Stripe from 'stripe';

/**
 * Stripe Webhook Handler - Production Grade
 *
 * Events:
 * - checkout.session.completed: Credits kaufen ODER Abo starten
 * - invoice.payment_succeeded: Monatliche Abo-Credits
 * - invoice.payment_failed: Zahlung fehlgeschlagen
 * - customer.subscription.deleted: Abo gekündigt
 */

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('Stripe-Signature');

  if (!sig) {
    console.error('[WEBHOOK] Missing Stripe Signature');
    return new NextResponse('Missing Stripe Signature', { status: 400 });
  }

  let event: Stripe.Event;

  // ============================================
  // 1. WEBHOOK SIGNATURE VERIFICATION
  // ============================================
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[WEBHOOK] CRITICAL: STRIPE_WEBHOOK_SECRET not set');
      return new NextResponse('Server Config Error', { status: 500 });
    }
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[WEBHOOK] Signature verification failed:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // ============================================
  // 2. IDEMPOTENCY CHECK (Prevent Duplicate Processing)
  // ============================================
  try {
    const existing = await prisma.$executeRaw`
      SELECT 1 FROM webhook_events WHERE event_id = ${event.id}
    `;

    if (existing && Number(existing) > 0) {
      console.log(`[WEBHOOK] Event ${event.id} already processed. Skipping.`);
      return new NextResponse(null, { status: 200 });
    }
  } catch (dbError) {
    console.error('[WEBHOOK] Idempotency check failed:', dbError);
    // Continue processing (fail-open for resilience)
  }

  // ============================================
  // 3. EVENT PROCESSING
  // ============================================
  try {
    console.log(`[WEBHOOK] Processing: ${event.type} (${event.id})`);

    switch (event.type) {
      // ====================================
      // A) CHECKOUT COMPLETED
      // ====================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      // ====================================
      // B) INVOICE PAID (Monatliche Renewal)
      // ====================================
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      // ====================================
      // C) INVOICE FAILED
      // ====================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }

      // ====================================
      // D) SUBSCRIPTION DELETED
      // ====================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }

    // ============================================
    // 4. MARK AS PROCESSED
    // ============================================
    await prisma.$executeRaw`
      INSERT INTO webhook_events (event_id, processed_at)
      VALUES (${event.id}, NOW())
      ON CONFLICT (event_id) DO NOTHING
    `;

    console.log(`[WEBHOOK] ✅ Successfully processed: ${event.id}`);
    return new NextResponse(null, { status: 200 });

  } catch (error: any) {
    console.error('[WEBHOOK] Processing failed:', error);
    // Return 500 to trigger Stripe retry
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}

// ============================================
// HANDLER FUNCTIONS
// ============================================

/**
 * A) Checkout Completed
 * Handles both: Credit Packs + Platform Subscriptions
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email;

  if (!customerEmail) {
    console.error('[CHECKOUT] No customer email found');
    return;
  }

  console.log(`[CHECKOUT] Processing for: ${customerEmail}`);

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: customerEmail },
  });

  if (!user) {
    console.error(`[CHECKOUT] User not found: ${customerEmail}`);
    return;
  }

  // Get line items to check what was purchased
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
  const priceId = lineItems.data[0]?.price?.id;

  if (!priceId) {
    console.error('[CHECKOUT] No price ID found');
    return;
  }

  // Fetch price with metadata
  const price = await stripe.prices.retrieve(priceId);
  const product = await stripe.products.retrieve(price.product as string);

  console.log(`[CHECKOUT] Product metadata:`, product.metadata);

  // ====================================
  // CASE 1: AI CREDITS (One-time purchase)
  // ====================================
  if (product.metadata.product === 'ai_credits') {
    const credits = parseInt(product.metadata.credits || '0', 10);

    if (credits <= 0) {
      console.error('[CHECKOUT] Invalid credits amount in metadata');
      return;
    }

    console.log(`[CHECKOUT] Granting ${credits} credits to ${user.email}`);

    // Get payment details
    const amountCents = session.amount_total || 0;
    const currency = session.currency || 'eur';

    const requestId = `stripe-checkout-${session.id}`;
    const existingGrant = await prisma.energyTransaction.findUnique({
      where: { requestId },
    });

    if (!existingGrant) {
      // Grant credits using transaction
      await prisma.$transaction(async (tx) => {
        // Update user credits
        const updated = await tx.user.update({
          where: { id: user.id },
          data: { credits: { increment: credits } },
          select: { credits: true },
        });

        // Create energy transaction record
        await tx.energyTransaction.create({
          data: {
            userId: user.id,
            delta: credits,
            balanceAfter: updated.credits,
            type: 'GRANT',
            status: 'SETTLED',
            feature: 'credit-purchase',
            requestId,
          },
        });

        console.log(`[CHECKOUT] ✅ ${credits} credits granted. New balance: ${updated.credits}`);
      });
    } else {
      console.log(`[CHECKOUT] Credits already granted for ${requestId}`);
    }

    // Create invoice + ledger entry (Finanzamt compliance)
    await createCreditPurchaseInvoice({
      userId: user.id,
      credits,
      amountCents,
      currency,
      stripePaymentIntentId: session.payment_intent as string,
      stripeInvoiceId: session.invoice as string,
      customerEmail: customerEmail,
      customerName: session.customer_details?.name || user.name || undefined,
      customerAddress: session.customer_details?.address ?? undefined,
      customerCountry: session.customer_details?.address?.country ?? undefined,
    });
  }

  // ====================================
  // CASE 2: PLATFORM SUBSCRIPTION
  // ====================================
  else if (product.metadata.product === 'platform_access') {
    const subscriptionId = session.subscription as string;

    if (!subscriptionId) {
      console.error('[CHECKOUT] No subscription ID in session');
      return;
    }

    console.log(`[CHECKOUT] Activating subscription for ${user.email}`);

    // Update user with subscription details
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active',
        subscriptionTier: 'pro', // Can be customized based on price
      },
    });

    // IMPORTANT: Monatliche Credits werden NICHT hier vergeben,
    // sondern bei invoice.payment_succeeded (auch für das erste Renewal)
    console.log(`[CHECKOUT] ✅ Subscription activated: ${subscriptionId}`);
  }
}

/**
 * B) Invoice Paid (Monthly Renewal)
 * Grant monthly credits for active subscriptions
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // @ts-ignore - Stripe Invoice has subscription property
  const invoiceSub = invoice.subscription;
  const subscriptionId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub?.id;

  if (!subscriptionId) {
    console.log('[INVOICE] No subscription ID, skipping');
    return;
  }

  // Only process subscription renewals (not initial payment)
  if (invoice.billing_reason !== 'subscription_cycle') {
    console.log('[INVOICE] Not a renewal, skipping');
    return;
  }

  // Find user by subscription ID
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!user) {
    console.error(`[INVOICE] User not found for subscription: ${subscriptionId}`);
    return;
  }

  // Fetch subscription to get price metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;

  if (!priceId) {
    console.error('[INVOICE] No price ID in subscription');
    return;
  }

  const price = await stripe.prices.retrieve(priceId);
  const product = await stripe.products.retrieve(price.product as string);

  // Check if monthly credits are configured
  const monthlyCredits = parseInt(product.metadata.monthly_credits || '0', 10);

  if (monthlyCredits <= 0) {
    console.log('[INVOICE] No monthly credits configured for this plan');
    return;
  }

  console.log(`[INVOICE] Granting ${monthlyCredits} monthly credits to ${user.email}`);

  // Get payment details
  const amountCents = invoice.amount_paid || 0;
  const currency = invoice.currency || 'eur';

  const requestId = `stripe-invoice-${invoice.id}`;
  const existingGrant = await prisma.energyTransaction.findUnique({
    where: { requestId },
  });

  if (!existingGrant) {
    // Grant monthly credits
    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { credits: { increment: monthlyCredits } },
        select: { credits: true },
      });

      await tx.energyTransaction.create({
        data: {
          userId: user.id,
          delta: monthlyCredits,
          balanceAfter: updated.credits,
          type: 'GRANT',
          status: 'SETTLED',
          feature: 'monthly-subscription-credits',
          requestId,
        },
      });

      console.log(`[INVOICE] ✅ ${monthlyCredits} credits granted. New balance: ${updated.credits}`);
    });
  } else {
    console.log(`[INVOICE] Credits already granted for ${requestId}`);
  }

  // Create subscription invoice + ledger entry (Finanzamt compliance)
  await createSubscriptionInvoice({
    userId: user.id,
    credits: monthlyCredits,
    amountCents,
    currency,
    stripeInvoiceId: invoice.id,
    customerEmail: user.email,
    customerName: invoice.customer_name || user.name || undefined,
    customerAddress: invoice.customer_address ?? undefined,
    customerCountry: invoice.customer_address?.country ?? undefined,
  });
}

/**
 * C) Invoice Failed
 * Mark subscription as past_due (don't ban immediately)
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  // @ts-ignore - Stripe Invoice has subscription property
  const invoiceSub = invoice.subscription;
  const subscriptionId = typeof invoiceSub === 'string' ? invoiceSub : invoiceSub?.id;

  if (!subscriptionId) return;

  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!user) {
    console.error(`[INVOICE_FAILED] User not found for subscription: ${subscriptionId}`);
    return;
  }

  console.log(`[INVOICE_FAILED] Marking subscription as past_due for ${user.email}`);

  await prisma.user.update({
    where: { id: user.id },
    data: { subscriptionStatus: 'past_due' },
  });

  console.log(`[INVOICE_FAILED] ✅ Subscription marked as past_due`);
}

/**
 * D) Subscription Deleted
 * Downgrade user to free tier
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!user) {
    console.error(`[SUB_DELETED] User not found for subscription: ${subscription.id}`);
    return;
  }

  console.log(`[SUB_DELETED] Downgrading ${user.email} to free tier`);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: null,
      subscriptionStatus: 'cancelled',
      subscriptionTier: 'founder', // Free tier
    },
  });

  console.log(`[SUB_DELETED] ✅ User downgraded to free tier`);
}
