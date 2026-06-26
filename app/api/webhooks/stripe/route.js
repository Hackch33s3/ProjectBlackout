import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Updated: Use ENGINE_URL and ENGINE_API_KEY
const ENGINE_URL = process.env.ENGINE_URL;
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function POST(req) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle initial checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details.email;
    const stripeCustomerId = session.customer;

    try {
      const { error } = await supabase
        .from('clients')
        .insert([
          {
            email: customerEmail,
            stripe_customer_id: stripeCustomerId,
            status: 'PENDING_ONBOARDING'
          }
        ]);

      if (error) console.error('Supabase Insert Error:', error);
      else console.log(`[+] Client created: ${customerEmail}`);
    } catch (error) {
      console.error('Database Error:', error);
    }
  }

  // Handle successful monthly payment - ACTIVATE THE ENGINE
  if (event.type === 'invoice.paid') {
    const invoice = event.data.object;
    const stripeCustomerId = invoice.customer;

    try {
      // Update client status to active
      const { data: client, error: updateError } = await supabase
        .from('clients')
        .update({ status: 'ACTIVE_MONITORING' })
        .eq('stripe_customer_id', stripeCustomerId)
        .select()
        .single();

      if (updateError) {
        console.error('Status update error:', updateError);
      } else {
        console.log(`[+] Client activated: ${client.email}`);
        
        // Fetch client's PII from Supabase
        const { data: clientData, error: fetchError } = await supabase
          .from('clients')
          .select('full_name, past_city')
          .eq('id', client.id)
          .single();

        if (fetchError || !clientData) {
          console.error('Failed to fetch client PII:', fetchError);
          return NextResponse.json({ received: true });
        }

        // Tell the Python engine to start scanning this client
        if (ENGINE_URL && ENGINE_API_KEY && client.id) {
          try {
            const response = await fetch(`${ENGINE_URL}/start-scan`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ENGINE_API_KEY}` // Added authentication
              },
              body: JSON.stringify({ 
                clientId: client.id,
                full_name: clientData.full_name || 'Unknown',
                past_city: clientData.past_city || 'Unknown'
              })
            });

            if (!response.ok) {
              console.error(`Engine returned ${response.status}:`, await response.text());
            } else {
              console.log(`[+] Scan triggered for client: ${client.id}`);
            }
          } catch (fetchError) {
            console.error('Failed to trigger Python engine:', fetchError);
          }
        }
      }
    } catch (error) {
      console.error('Invoice paid handler error:', error);
    }
  }

  // Handle failed payment - SUSPEND THE ENGINE
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const stripeCustomerId = invoice.customer;

    try {
      const { data: client, error } = await supabase
        .from('clients')
        .update({ status: 'SUSPENDED' })
        .eq('stripe_customer_id', stripeCustomerId)
        .select()
        .single();

      if (error) {
        console.error('Suspension error:', error);
      } else {
        console.log(`[!] Client suspended: ${client.email}`);
        
        // Tell the Python engine to stop scanning this client
        if (ENGINE_URL && ENGINE_API_KEY && client.id) {
          try {
            const response = await fetch(`${ENGINE_URL}/stop-scan`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ENGINE_API_KEY}` // Added authentication
              },
              body: JSON.stringify({ clientId: client.id })
            });

            if (!response.ok) {
              console.error(`Engine returned ${response.status}:`, await response.text());
            } else {
              console.log(`[!] Scan stopped for client: ${client.id}`);
            }
          } catch (fetchError) {
            console.error('Failed to stop Python engine:', fetchError);
          }
        }
      }
    } catch (error) {
      console.error('Payment failed handler error:', error);
    }
  }

  // Handle subscription cancellation - CHURN THE CLIENT
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const stripeCustomerId = subscription.customer;

    try {
      const { data: client, error } = await supabase
        .from('clients')
        .update({ status: 'CHURNED' })
        .eq('stripe_customer_id', stripeCustomerId)
        .select()
        .single();

      if (error) {
        console.error('Churn error:', error);
      } else {
        console.log(`[-] Client churned: ${client.email}`);
      }
    } catch (error) {
      console.error('Subscription deleted handler error:', error);
    }
  }

  return NextResponse.json({ received: true });
}