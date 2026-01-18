import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { getFounderByEmail } from '@/lib/notion';

// Typ-Definition für sauberen Code
interface PlanConfig {
  name: string;
  priceId: string;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    // Notion Check: Existiert der User?
    const founder = await getFounderByEmail(session.user.email);
    if (!founder) {
      return new NextResponse('Founder profile not found. Please complete onboarding first.', { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Deine Plan-Konfiguration
    // WICHTIG: Stelle sicher, dass diese Price IDs im Stripe Dashboard "Live" existieren
    const plans: Record<string, PlanConfig> = {
        starter: {
            name: 'The Forge - Starter Membership',
            priceId: 'price_1SqIrhAmspxoSxsTXdvAw6zG',
        },
        growth: {
            name: 'The Forge - Growth Membership',
            priceId: 'price_1SqIsqAmspxoSxsTG0vKQ1jQ',
        },
        premium: {
            name: 'The Forge - Premium Membership',
            priceId: 'price_1SqItkAmspxoSxsTyFOgpHXC',
        },
    };

    // Fallback auf Growth, falls plan undefined ist, oder Error werfen
    const selectedPlan = plans[plan as string] || plans.growth;

    // Erstelle die Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email,
      client_reference_id: founder.id, // Verknüpfung zur Notion/DB ID
      
      // WICHTIG FÜR DEUTSCHLAND/EU:
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true }, // Erlaubt Eingabe der USt-ID für B2B
      billing_address_collection: 'required', // Wichtig für ordentliche Rechnungen
      allow_promotion_codes: true, // Falls du später Rabatte geben willst

      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      
      metadata: {
        founderId: founder.id,
        email: session.user.email,
        plan: plan,
        source: 'the-forge-platform'
      },
      
      success_url: `${appUrl}/dashboard?payment=success&plan=${plan}`,
      cancel_url: `${appUrl}/pricing?canceled=true`, // Besser zurück zur Pricing Page als Dashboard
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}