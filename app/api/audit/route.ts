import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error('Failed to parse JSON body:', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { fullName, pastCity, email } = body;

  // 2. Check each field individually
  if (!fullName) return NextResponse.json({ error: 'Missing fullName' }, { status: 400 });
  if (!pastCity) return NextResponse.json({ error: 'Missing pastCity' }, { status: 400 });
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  // 3. Initialize Supabase exactly once
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 4. Create lead in Supabase
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          email,
          full_name: fullName,
          past_city: pastCity,
          status: 'PENDING_AUDIT',
        },
      ])
      .select()
      .single();

    // Duplicate email -> Supabase returns a unique_violation (23505).
    // Don't 500 — tell the user they already have a scan queued.
    if (clientError) {
      if (
        (clientError.code === '23505') ||
        /duplicate|unique/i.test(clientError.message || '')
      ) {
        return NextResponse.json(
          {
            error: 'ALREADY_SCANNED',
            message:
              "You've already started a scan with this email. Check your inbox for your report link.",
          },
          { status: 409 },
        );
      }
      console.error('Supabase insert error:', clientError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!client) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 5. Add to the scan queue — FREE teaser tier (5 brokers only).
    //    The full 19-broker + CA scan is triggered post-payment.
    //    NOTE: a queue insert failure must NOT abort the signup. The client
    //    lead already exists; the worker can recover a missing queue row.
    //    So we log the error but still return the clientId to the user.
    const { error: queueError } = await supabase
      .from('scan_queue')
      .insert([{ client_id: client.id, status: 'PENDING', scan_tier: 'free' }]);

    if (queueError) {
      console.error('Queue insert error (non-fatal, lead preserved):', queueError);
    }

    return NextResponse.json({ success: true, clientId: client.id });
  } catch (err) {
    console.error('Audit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}