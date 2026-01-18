import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateFounderStatus, addTransaction, getFounderByEmail } from '@/lib/notion';
import Stripe from 'stripe';
import { sql } from '@vercel/postgres';

/**
 * Stripe Webhook Handler
 *
 * Processes Stripe events for payment and subscription management.
 * Implements idempotency to prevent duplicate processing.
 *
 * Events handled:
 * - checkout.session.completed: Initial payment success
 * - invoice.payment_succeeded: Recurring payment success
 * - invoice.payment_failed: Payment failure handling
 */

// In-memory cache for idempotency (for serverless, use Redis in production)
const processedEvents = new Map<string, boolean>();

async function isEventProcessed(eventId: string): Promise<boolean> {
  // Check in-memory first
  if (processedEvents.has(eventId)) {
    return true;
  }

  // Check database (optional: create webhook_events table)
  try {
    const result = await sql`
      SELECT id FROM webhook_events WHERE event_id = ${eventId} LIMIT 1;
    `;
    return result.rows.length > 0;
  } catch (error) {
    // Table might not exist yet, skip DB check
    return false;
  }
}

async function markEventProcessed(eventId: string): Promise<void> {
  processedEvents.set(eventId, true);

  // Store in database for persistence
  try {
    await sql`
      INSERT INTO webhook_events (event_id, processed_at)
      VALUES (${eventId}, NOW())
      ON CONFLICT (event_id) DO NOTHING;
    `;
  } catch (error) {
    console.warn('Could not store webhook event in DB:', error);
    // Continue anyway, in-memory cache will prevent duplicates in this instance
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('Stripe-Signature');

  if (!sig) {
    return new NextResponse('Missing Stripe Signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return new NextResponse('Server Configuration Error', { status: 500 });
    }
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Idempotency check: Prevent duplicate processing
  if (await isEventProcessed(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`);
    return new NextResponse(null, { status: 200 });
  }

  try {
    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const founderId = session.client_reference_id;
        const plan = session.metadata?.plan; // Get the plan from metadata
        
        if (founderId) {
            console.log(`Processing checkout for founder ${founderId} with plan ${plan}`);
            // 1. Activate Founder & Set Plan
            await updateFounderStatus(founderId, 'active', plan);
            
            // 2. Add Transaction
            await addTransaction({
                description: `Membership Fee (${plan ? plan.toUpperCase() : 'Standard'}) - First Payment`,
                amount: (session.amount_total || 0) / 100,
                category: 'Membership Fee',
                type: 'Income',
                date: new Date().toISOString(),
                status: 'Completed',
                notes: `Stripe Session ID: ${session.id}`,
            });
        } else {
          console.warn('No client_reference_id found in session');
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Logic for recurring payments
        const email = invoice.customer_email;
        if (email) {
            console.log(`Processing recurring payment for ${email}`);
            const founder = await getFounderByEmail(email);
            if (founder) {
                 await addTransaction({
                    description: `Membership Fee (Recurring)`,
                    amount: (invoice.amount_paid || 0) / 100,
                    category: 'Membership Fee',
                    type: 'Income',
                    date: new Date().toISOString(),
                    status: 'Completed',
                    notes: `Stripe Invoice ID: ${invoice.id}`,
                });
                // Ensure they stay active
                if (founder.status !== 'active') {
                    await updateFounderStatus(founder.id, 'active');
                }
            } else {
              console.warn(`Founder not found for email: ${email}`);
            }
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
         if (email) {
            console.log(`Payment failed for ${email}`);
            // Optional: Handle failed payment (notify user, etc.)
         }
         break;
       }
    }

    // Mark event as processed (idempotency)
    await markEventProcessed(event.id);
    console.log(`[Stripe Webhook] Successfully processed event: ${event.id}`);

  } catch (error: any) {
    console.error(`[Stripe Webhook] Error processing event ${event.id}:`, error);

    // Log detailed error for debugging
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }

    // Don't mark as processed on error - allow retry
    return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
