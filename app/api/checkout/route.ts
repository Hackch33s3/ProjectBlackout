import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!stripeKey || !priceId || !baseUrl) {
    console.error('Missing Stripe environment variables in Vercel');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/cancel`,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Checkout URL generation failed' }, { status: 500 });
    }

    return NextResponse.redirect(session.url);
  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}