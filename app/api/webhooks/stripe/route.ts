import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateFounderStatus, addTransaction, getFounderByEmail } from '@/lib/notion';
import Stripe from 'stripe';

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
    console.error(`Webhook signature verification failed.`, err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    console.log(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const founderId = session.client_reference_id;
        
        if (founderId) {
            console.log(`Processing checkout for founder ${founderId}`);
            // 1. Activate Founder
            await updateFounderStatus(founderId, 'active');
            
            // 2. Add Transaction
            await addTransaction({
                description: `Membership Fee (First Payment)`,
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
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
