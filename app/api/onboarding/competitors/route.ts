import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Competitor = { name: string; description: string; addedBy?: 'ai' | 'user' };

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { competitors } = (await req.json()) as { competitors: Competitor[] };

  const cleaned = (competitors ?? [])
    .filter((c) => c?.name?.trim())
    .map((c) => ({
      user_id: user.id,
      name: c.name.trim(),
      notes: c.description?.trim() || null,
      layer: 'giant',
      added_by: c.addedBy === 'user' ? 'user' : 'system',
      status: 'active',
    }));

  const { error: delErr } = await supabase.from('competitors').delete().eq('user_id', user.id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (cleaned.length === 0) return NextResponse.json({ ok: true, count: 0 });

  const { error: insErr } = await supabase.from('competitors').insert(cleaned);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  if (process.env.CRON_SECRET) {
    const origin = new URL(req.url).origin;
    fetch(`${origin}/api/cron/refresh?userId=${encodeURIComponent(user.id)}`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    }).catch((e) => console.error('[onboarding kickoff]', e));
  }

  return NextResponse.json({ ok: true, count: cleaned.length });
}
