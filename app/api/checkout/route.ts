import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

async function handleCheckout() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!stripeKey || !priceId || !baseUrl) {
    console.error('[checkout] Missing Stripe env vars', {
      hasKey: !!stripeKey,
      hasPrice: !!priceId,
      hasBase: !!baseUrl,
    });
    return NextResponse.json(
      { error: 'Server configuration error (missing Stripe env).' },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeKey);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Checkout URL generation failed.' },
        { status: 500 },
      );
    }

    // Return the URL as JSON so the client can redirect and we can surface
    // any error cleanly instead of a blank 500 page.
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    // Surface the real Stripe message so failures are diagnosable.
    console.error('[checkout] Stripe error:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Checkout failed.' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return handleCheckout();
}

export async function POST() {
  return handleCheckout();
}
