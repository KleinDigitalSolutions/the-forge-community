import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { getFounderByEmail } from '@/lib/notion';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { plan } = body;

    const founder = await getFounderByEmail(session.user.email);
    if (!founder) {
      return new NextResponse('Founder not found', { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Define Plans
    const plans = {
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
            priceId: 'price_1SqItkAmspxoSxsTyFOgpHXC', // Your specific Premium Price ID
        },
    };

    const selectedPlan = plans[plan as keyof typeof plans] || plans.growth;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email,
      client_reference_id: founder.id,
      automatic_tax: { enabled: true },
      line_items: [
        {
          // Use price ID if it exists (Starter), otherwise create inline (Growth/Premium)
          price: (selectedPlan as any).priceId,
          price_data: !(selectedPlan as any).priceId ? {
            currency: 'eur',
            product_data: {
              name: selectedPlan.name,
              description: (selectedPlan as any).description,
              tax_code: (selectedPlan as any).taxCode,
            },
            unit_amount: (selectedPlan as any).amount,
            recurring: {
              interval: 'month',
            },
          } : undefined,
          quantity: 1,
        },
      ],
      metadata: {
        founderId: founder.id,
        email: session.user.email,
        plan: plan,
      },
      success_url: `${appUrl}/dashboard?payment=success&plan=${plan}`,
      cancel_url: `${appUrl}/dashboard?payment=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
