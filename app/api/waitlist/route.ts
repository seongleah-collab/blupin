import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // basic validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 });
    }
    const clean = email.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'invalid email' }, { status: 400 });
    }

    const db = supabaseAdmin();
    const { error } = await db.from('waitlist').insert({
      email: clean,
      referrer: req.headers.get('referer') ?? null,
      user_agent: req.headers.get('user-agent') ?? null,
    });

    // 23505 = unique_violation (already signed up). treat as success.
    if (error && error.code !== '23505') {
      console.error('waitlist insert failed:', error);
      return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('waitlist route error:', err);
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }
}