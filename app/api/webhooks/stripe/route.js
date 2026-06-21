import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    // Verify the webhook actually came from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 });
  }

  // Handle the successful purchase event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details.email;
    
    try {
      // Insert the new client into the Supabase database
      const { data, error } = await supabase
        .from('clients') // Make sure this matches your table name in Supabase
        .insert([
          { 
            email: customerEmail, 
            stripe_customer_id: session.customer,
            status: 'PENDING_ONBOARDING' 
          }
        ]);

      if (error) {
        console.error('Supabase error:', error);
      } else {
        console.log(`Successfully added ${customerEmail} to database.`);
      }

    } catch (error) {
      console.error('Database error:', error);
    }
  }

  // Always return a 200 OK status so Stripe knows we received it
  return NextResponse.json({ received: true });
}