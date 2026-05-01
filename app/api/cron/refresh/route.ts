import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ingestProductHunt } from '@/lib/ingest/producthunt';
import { ingestHackerNews } from '@/lib/ingest/hackernews';
import { ingestReddit } from '@/lib/ingest/reddit';
import { classifyPendingEvents } from '@/lib/classify/events';
import { backfillProductHuntUrls } from '@/lib/maintenance/backfill_urls';

export const runtime = 'nodejs';
export const maxDuration = 300;

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function refreshUser(userId: string) {
  const [ph, hn, reddit] = await Promise.all([
    ingestProductHunt(userId, 48),
    ingestHackerNews(userId),
    ingestReddit(userId),
  ]);
  const ingested = {
    product_hunt: ph,
    hacker_news: hn,
    reddit,
    total: ph.inserted + hn.inserted + reddit.inserted,
  };
  // Resolve any Product Hunt /r/HASH/... tracker URLs on this user's
  // existing rows so the feed pill shows the real product domain. Capped
  // per run; future runs will pick up whatever's left.
  const urlBackfill = await backfillProductHuntUrls(userId, 50).catch((e) => {
    console.error('[refresh] ph url backfill failed:', e?.message ?? e);
    return { scanned: 0, resolved: 0 };
  });
  const classified = await classifyPendingEvents(userId, 25);
  return { ingested, urlBackfill, classified };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const singleUserId = url.searchParams.get('userId');

  if (singleUserId) {
    try {
      const result = await refreshUser(singleUserId);
      return NextResponse.json({ ok: true, userId: singleUserId, ...result, ranAt: new Date().toISOString() });
    } catch (err: any) {
      console.error('[cron/refresh single]', err);
      return NextResponse.json({ ok: false, userId: singleUserId, error: err?.message ?? String(err) }, { status: 500 });
    }
  }

  const admin = supabaseAdmin();
  const { data: users, error } = await admin
    .from('user_companies')
    .select('id, company_name')
    .not('onboarded_at', 'is', null)
    .not('company_description', 'is', null);

  if (error) {
    console.error('[cron/refresh] list users', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results: Array<{ userId: string; company: string | null; ok: boolean; error?: string; ingested?: unknown; classified?: unknown }> = [];

  for (const u of users ?? []) {
    try {
      const r = await refreshUser(u.id);
      results.push({ userId: u.id, company: u.company_name, ok: true, ...r });
    } catch (err: any) {
      console.error(`[cron/refresh] user ${u.id}`, err);
      results.push({ userId: u.id, company: u.company_name, ok: false, error: err?.message ?? String(err) });
    }
  }

  return NextResponse.json({
    ok: true,
    userCount: results.length,
    results,
    ranAt: new Date().toISOString(),
  });
}
