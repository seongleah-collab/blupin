import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSubscription, competitorLimitFor } from '@/lib/billing/gate';

type Competitor = { name: string; description: string; domain?: string; addedBy?: 'ai' | 'user' };

function cleanDomain(d: string | undefined | null): string | null {
  if (!d) return null;
  const trimmed = d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return trimmed.length > 0 ? trimmed : null;
}

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
      domain: cleanDomain(c.domain),
      layer: 'giant',
      added_by: c.addedBy === 'user' ? 'user' : 'system',
      status: 'active',
    }));

  // Enforce per-plan competitor limit. We only block when the user is
  // *increasing* their list above their plan's cap — a starter user with
  // 5 grandfathered competitors should still be able to save fewer.
  // Onboarding (no subscription yet) skips the check entirely so users
  // can preview what's possible before paying.
  const sub = await getSubscription(supabase, user.id);
  const limit = competitorLimitFor(sub);
  if (sub && limit !== null && cleaned.length > limit) {
    const { count: currentCount } = await supabase
      .from('competitors')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if (cleaned.length > (currentCount ?? 0)) {
      return NextResponse.json(
        {
          error: `your plan allows ${limit} competitor${limit === 1 ? '' : 's'}. upgrade for more.`,
          code: 'competitor_limit_reached',
          limit,
        },
        { status: 402 }
      );
    }
  }

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
