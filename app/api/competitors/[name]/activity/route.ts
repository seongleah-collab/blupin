import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Returns a 30-day daily event count for a competitor, used by the
// sparkline in the feed and the deep-dive page. Aggregates by day in
// JS — we don't have enough rows per user to need a SQL roll-up.

const DAYS = 30;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const since = new Date();
  since.setDate(since.getDate() - DAYS);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('competitor_events')
    .select('published_at')
    .eq('user_id', user.id)
    .eq('classification_status', 'classified')
    .ilike('potential_competitor_name', decoded)
    .gte('published_at', since.toISOString())
    .order('published_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // bucket by day key (yyyy-mm-dd local)
  const buckets = new Map<string, number>();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of data ?? []) {
    if (!row.published_at) continue;
    const key = new Date(row.published_at).toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const series = Array.from(buckets.entries()).map(([day, count]) => ({ day, count }));
  return NextResponse.json({ name: decoded, series });
}
