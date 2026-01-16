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
            amount: 6900, // 69.00 EUR
            description: '69€/Mo + 15% Share',
            productId: 'prod_TnuhZOYvur5WON',
            taxCode: 'txcd_10103001',
        },
        growth: {
            name: 'The Forge - Growth Membership',
            amount: 9900, // 99.00 EUR
            description: '99€/Mo + 2€/Order + 10% Share',
            taxCode: 'txcd_10103001',
        },
        premium: {
            name: 'The Forge - Premium Membership',
            amount: 14900, // 149.00 EUR
            description: '149€/Mo + 5% Share',
            taxCode: 'txcd_10103001',
        },
    };

    const selectedPlan = plans[plan as keyof typeof plans] || plans.growth;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: session.user.email,
      client_reference_id: founder.id,
      automatic_tax: { enabled: true }, // Enable automatic tax calculation
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product: selectedPlan.productId, // Use existing Product ID if available
            product_data: !selectedPlan.productId ? {
              name: selectedPlan.name,
              description: selectedPlan.description,
              tax_code: selectedPlan.taxCode,
            } : undefined,
            unit_amount: selectedPlan.amount,
            recurring: {
              interval: 'month',
            },
          },
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
