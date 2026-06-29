import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  // 1. Parse and log the incoming data
  let body;
  try {
    body = await req.json();
  } catch (err) {
    console.error('Failed to parse JSON body:', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('--- INCOMING AUDIT PAYLOAD ---');
  console.log(body);

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
      .insert([{ 
        email, 
        full_name: fullName, 
        past_city: pastCity, 
        status: 'PENDING_AUDIT' 
      }])
      .select()
      .single();

    if (clientError || !client) {
      console.error('Supabase insert error:', clientError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // 5. Add to the scan queue
    const { error: queueError } = await supabase
      .from('scan_queue')
      .insert([{ client_id: client.id, status: 'PENDING' }]);

    if (queueError) {
      console.error('Queue insert error:', queueError);
    }

    // 6. Return immediately
    return NextResponse.json({ success: true, clientId: client.id });
  } catch (err) {
    console.error('Audit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}