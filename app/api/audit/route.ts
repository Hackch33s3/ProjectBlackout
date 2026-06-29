import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { fullName, pastCity, email } = await req.json();

  if (!fullName || !pastCity || !email) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  try {
    // 1. Create lead in Supabase
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

    // 2. Add to the scan queue (DO NOT call the engine yet)
    const { error: queueError } = await supabase
      .from('scan_queue')
      .insert([{ client_id: client.id, status: 'PENDING' }]);

    if (queueError) {
      console.error('Queue insert error:', queueError);
    }

    // 3. Return immediately so the user gets instant feedback
    return NextResponse.json({ success: true, clientId: client.id });
  } catch (err) {
    console.error('Audit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}