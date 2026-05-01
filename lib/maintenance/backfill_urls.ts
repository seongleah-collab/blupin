import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { resolveRedirect } from '@/lib/unfurl';

function supabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function isProductHuntTracker(url: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname.endsWith('producthunt.com') && u.pathname.startsWith('/r/');
  } catch {
    return false;
  }
}

// Walks the user's events and unwraps any Product Hunt /r/HASH/... tracker
// URLs into the real product website, in place. Bounded by `limit` so a
// single cron tick doesn't burn through hundreds of redirect-follows.
export async function backfillProductHuntUrls(userId: string, limit = 50) {
  const db = supabaseAdmin();

  const { data: rows, error } = await db
    .from('competitor_events')
    .select('id, source_external_url')
    .eq('user_id', userId)
    .like('source_external_url', '%producthunt.com/r/%')
    .limit(limit);

  if (error) throw error;
  if (!rows || rows.length === 0) return { scanned: 0, resolved: 0 };

  let resolved = 0;
  for (const row of rows) {
    const original = row.source_external_url as string | null;
    if (!isProductHuntTracker(original)) continue;
    const next = await resolveRedirect(original!);
    if (!next || isProductHuntTracker(next) || next === original) continue;
    const { error: upErr } = await db
      .from('competitor_events')
      .update({ source_external_url: next })
      .eq('id', row.id);
    if (upErr) {
      console.error(`[backfill ph url] event ${row.id}:`, upErr.message);
      continue;
    }
    resolved++;
  }

  return { scanned: rows.length, resolved };
}
