import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateFounderStatus, addTransaction, getFounderByEmail } from '@/lib/notion';
import Stripe from 'stripe';
import { sql } from '@vercel/postgres';

// Vercel empfiehlt: Webhook Runtime auf 'nodejs' lassen, nicht 'edge', wegen Stripe SDK Kompatibilität
export const dynamic = 'force-dynamic';

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
      console.error('CRITICAL: STRIPE_WEBHOOK_SECRET is not set');
      return new NextResponse('Server Config Error', { status: 500 });
    }
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error(`Webhook signature failed:`, err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 1. Idempotenz Check (Nur DB, kein RAM!)
  try {
    // Tabelle erstellen, falls nicht existent (Quick Fix, besser in Migration verschieben)
    await sql`CREATE TABLE IF NOT EXISTS webhook_events (event_id TEXT PRIMARY KEY, processed_at TIMESTAMP DEFAULT NOW());`;
    
    const existing = await sql`SELECT event_id FROM webhook_events WHERE event_id = ${event.id}`;
    if (existing.rows.length > 0) {
      console.log(`Event ${event.id} already processed. Skipping.`);
      return new NextResponse(null, { status: 200 });
    }
  } catch (dbError) {
    console.error('Database Check Failed:', dbError);
    // Im Zweifel weitermachen, aber loggen
  }

  try {
    console.log(`Processing event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const founderId = session.client_reference_id;
        const plan = session.metadata?.plan;

        if (founderId) {
          console.log(`Activating founder ${founderId} for plan ${plan}`);
          
          // Parallel ausführen um Timeouts zu vermeiden
          await Promise.all([
            updateFounderStatus(founderId, 'active', plan),
            addTransaction({
              description: `Membership (${plan || 'Standard'}) - Initial`,
              amount: (session.amount_total || 0) / 100,
              category: 'Membership Fee',
              type: 'Income',
              date: new Date().toISOString(),
              status: 'Completed',
              notes: `Stripe Session: ${session.id}`,
            })
          ]);
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const email = invoice.customer_email;
        
        if (email) {
            // Nur ausführen, wenn es ein Abo-Renewal ist (kein initialer Kauf)
            if (invoice.billing_reason === 'subscription_cycle') {
                const founder = await getFounderByEmail(email);
                if (founder) {
                    await addTransaction({
                        description: `Membership (${founder.plan || 'Standard'}) - Renewal`,
                        amount: (invoice.amount_paid || 0) / 100,
                        category: 'Membership Fee',
                        type: 'Income',
                        date: new Date().toISOString(),
                        status: 'Completed',
                        notes: `Invoice: ${invoice.id}`,
                    });
                }
            }
        }
        break;
      }
    }

    // 2. Als "Verarbeitet" markieren
    await sql`INSERT INTO webhook_events (event_id) VALUES (${event.id}) ON CONFLICT DO NOTHING`;

  } catch (error: any) {
    console.error(`Webhook Logic Failed:`, error);
    // Wir senden 500, damit Stripe es später nochmal probiert (Retry Policy)
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}