import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ ok: false, error: 'password must be at least 6 characters' }, { status: 400 });
    }

    const clean = email.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'invalid email' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({ email: clean, password });

    if (error) {
      console.error('signup error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('waitlist route error:', err);
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }
}