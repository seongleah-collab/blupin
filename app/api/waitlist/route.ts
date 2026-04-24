import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 });
    }

    const clean = email.trim().toLowerCase();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'invalid email' }, { status: 400 });
    }

    const supabase = await createClient();

    // send magic link — this also creates the auth user on first sign-in
    const origin = req.headers.get('origin') ?? 'http://localhost:3000';
    const { error } = await supabase.auth.signInWithOtp({
      email: clean,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('magic link error:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('waitlist route error:', err);
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }
}