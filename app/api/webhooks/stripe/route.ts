import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Minimal row type for the `clients` table. Replace with a generated
// `Database` type (npx supabase gen types typescript) when you set up codegen.


// Lazy getters: building a Next.js app runs the route module during static
// analysis to introspect it, so env vars may not be set at that point. We
// only need them when an actual request arrives.
let _stripe: Stripe | null = null;
let _supabase: ReturnType<typeof createClient> | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key);
  }
  return _stripe;
}

function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    _supabase = createClient(url, serviceKey);
  }
  return _supabase;
}

const ENGINE_URL = process.env.ENGINE_URL;
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export const runtime = 'nodejs';
// We need the raw request body to verify the Stripe signature — disable any
// caching/body parsing the framework might do.
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 500 });
    }
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook Signature Error: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Handle initial checkout
  if (event.type === 'checkout.session.completed') {
    const supabase = getSupabase();
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;

    if (!customerEmail) {
      console.error('checkout.session.completed missing customer email', { eventId: event.id });
      return NextResponse.json({ error: 'Missing customer email' }, { status: 400 });
    }

    try {
      // Upsert on email to make this handler safe against Stripe retries.
      // Requires a UNIQUE constraint on clients.email (you have it: clients_email_key).
      const { error } = await (supabase
        .from('clients') as any)
        .upsert(
          {
            email: customerEmail,
            stripe_customer_id: stripeCustomerId,
            status: 'PENDING_ONBOARDING',
          },
          { onConflict: 'email', ignoreDuplicates: false },
        );

      if (error) {
        console.error('Supabase upsert error:', error);
        return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
      } else {
        console.log(`[+] Client created: ${customerEmail}`);
      }
    } catch (err) {
      console.error('Database error:', err);
      return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
    }
  }

  // Handle successful monthly payment - ACTIVATE THE ENGINE
  if (event.type === 'invoice.paid') {
    const supabase = getSupabase();
    const invoice = event.data.object as Stripe.Invoice;
    const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : null;

    if (!stripeCustomerId) {
      console.error('invoice.paid missing customer id', { eventId: event.id });
      return NextResponse.json({ error: 'Missing customer id' }, { status: 400 });
    }

    try {
      const { data: client, error: updateError } = await (supabase
        .from('clients') as any)
        .update({ status: 'ACTIVE_MONITORING' })
        .eq('stripe_customer_id', stripeCustomerId)
        .select()
        .single();

      if (updateError) {
        console.error('Status update error:', updateError);
        return NextResponse.json({ error: 'Status update failed' }, { status: 500 });
      }

      console.log(`[+] Client activated: ${client.email}`);

      const { data: clientData, error: fetchError } = await (supabase
        .from('clients') as any)
        .select('full_name, past_city')
        .eq('id', client.id)
        .single();

      if (fetchError || !clientData) {
        console.error('Failed to fetch client PII:', fetchError);
        return NextResponse.json({ error: 'Client fetch failed' }, { status: 500 });
      }

      if (ENGINE_URL && ENGINE_API_KEY && client.id) {
        try {
          const response = await fetch(`${ENGINE_URL}/start-scan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${ENGINE_API_KEY}`
            },
            body: JSON.stringify({
              clientId: client.id,
              full_name: clientData.full_name || 'Unknown',
              past_city: clientData.past_city || 'Unknown'
            })
          });

          if (!response.ok) {
            console.error(`Engine returned ${response.status}:`, await response.text());
            return NextResponse.json({ error: 'Engine start-scan failed' }, { status: 502 });
          } else {
            console.log(`[+] Scan triggered for client: ${client.id}`);
          }
        } catch (fetchError) {
          console.error('Failed to trigger Python engine:', fetchError);
          return NextResponse.json({ error: 'Engine unreachable' }, { status: 502 });
        }
      }
    } catch (error) {
      console.error('Invoice paid handler error:', error);
      return NextResponse.json({ error: 'Handler error' }, { status: 500 });
    }
  }

  // Handle failed payment - SUSPEND THE ENGINE
  if (event.type === 'invoice.payment_failed') {
    const supabase = getSupabase();
    const invoice = event.data.object as Stripe.Invoice;
    const stripeCustomerId = typeof invoice.customer === 'string' ? invoice.customer : null;

    if (!stripeCustomerId) {
      console.error('invoice.payment_failed missing customer id', { eventId: event.id });
      return NextResponse.json({ error: 'Missing customer id' }, { status: 400 });
    }

    try {
      const { data: client, error } = await (supabase
        .from('clients') as any)
        .update({ status: 'SUSPENDED' })
        .eq('stripe_customer_id', stripeCustomerId)
        .select()
        .single();

      if (error) {
        console.error('Suspension error:', error);
        return NextResponse.json({ error: 'Suspension failed' }, { status: 500 });
      }

      console.log(`[!] Client suspended: ${client.email}`);

      if (ENGINE_URL && ENGINE_API_KEY && client.id) {
        try {
          const response = await fetch(`${ENGINE_URL}/stop-scan`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${ENGINE_API_KEY}`
            },
            body: JSON.stringify({ clientId: client.id })
          });

          if (!response.ok) {
            console.error(`Engine returned ${response.status}:`, await response.text());
            return NextResponse.json({ error: 'Engine stop-scan failed' }, { status: 502 });
          } else {
            console.log(`[!] Scan stopped for client: ${client.id}`);
          }
        } catch (fetchError) {
          console.error('Failed to stop Python engine:', fetchError);
          return NextResponse.json({ error: 'Engine unreachable' }, { status: 502 });
        }
      }
    } catch (error) {
      console.error('Payment failed handler error:', error);
      return NextResponse.json({ error: 'Handler error' }, { status: 500 });
    }
  }

  // Handle subscription cancellation - CHURN THE CLIENT
  if (event.type === 'customer.subscription.deleted') {
    const supabase = getSupabase();
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : null;

    if (!stripeCustomerId) {
      console.error('customer.subscription.deleted missing customer id', { eventId: event.id });
      return NextResponse.json({ error: 'Missing customer id' }, { status: 400 });
    }

    try {
      const { data: client, error } = await (supabase
        .from('clients') as any)
        .update({ status: 'CHURNED' })
        .eq('stripe_customer_id', stripeCustomerId)
        .select()
        .single();

      if (error) {
        console.error('Churn error:', error);
        return NextResponse.json({ error: 'Churn update failed' }, { status: 500 });
      } else {
        console.log(`[-] Client churned: ${client.email}`);
      }
    } catch (error) {
      console.error('Subscription deleted handler error:', error);
      return NextResponse.json({ error: 'Handler error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
