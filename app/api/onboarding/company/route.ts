import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyPendingEvents } from '@/lib/classify/events';
import { resyncSystemCompetitors } from '@/lib/competitors/resync';
import { backfillProductHuntUrls } from '@/lib/maintenance/backfill_urls';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const { name, description } = await request.json();
  if (!name || !description) {
    return NextResponse.json({ error: 'name and description required' }, { status: 400 });
  }

  // Detect whether the description actually changed. If it did, every
  // previously-classified event was scored against an outdated company
  // profile — we need to reset those rows to 'pending' and re-run the
  // classifier so the feed reflects who the user *now* is.
  const { data: existing } = await supabase
    .from('user_companies')
    .select('company_description')
    .eq('id', user.id)
    .maybeSingle();

  const descriptionChanged =
    !existing || existing.company_description !== description;

  const { error } = await supabase
    .from('user_companies')
    .upsert({
      id: user.id,
      company_name: name,
      company_description: description,
      onboarded_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (descriptionChanged) {
    // Wipe stale classifications so the feed query (which requires
    // classification_status='classified') hides them until they're
    // re-scored against the new profile.
    const { error: resetErr } = await supabase
      .from('competitor_events')
      .update({ classification_status: 'pending' })
      .eq('user_id', user.id)
      .eq('classification_status', 'classified');

    if (resetErr) {
      console.error('[company update] reset failed:', resetErr.message);
    }

    // Resync the AI-suggested competitor list against the new description, then
    // chain ingest → classify so they don't race. User-added competitors are
    // never touched.
    const origin = new URL(request.url).origin;
    const cronSecret = process.env.CRON_SECRET;
    (async () => {
      try {
        const result = await resyncSystemCompetitors(
          user.id,
          existing?.company_description ?? null,
          description
        );
        console.log(
          `[company update] resync user=${user.id} added=${result.added.length} dropped=${result.dropped.length} skipped=${result.skipped}`
        );

        // If new competitors were added, run the ingest cron and WAIT for it
        // so the classify step downstream sees the fresh events. Cron handles
        // its own internal classify(25), but we still need to mop up the
        // larger backlog of reset rows after.
        if (result.added.length > 0 && cronSecret) {
          const cronRes = await fetch(
            `${origin}/api/cron/refresh?userId=${encodeURIComponent(user.id)}`,
            { headers: { Authorization: `Bearer ${cronSecret}` } }
          );
          console.log(`[company update] cron kick status=${cronRes.status}`);
        }

        // Backfill any lingering Product Hunt tracker URLs while we're here
        // so the feed pills show real domains by the time the user looks.
        const urlBackfill = await backfillProductHuntUrls(user.id, 50).catch((e) => {
          console.error('[company update] ph url backfill failed:', e?.message ?? e);
          return { scanned: 0, resolved: 0 };
        });
        console.log(
          `[company update] url backfill scanned=${urlBackfill.scanned} resolved=${urlBackfill.resolved}`
        );

        // Reclassify a chunk of the reset backlog so the feed repopulates
        // within the user's "give it a minute" window. 100 fits inside the
        // background runtime on most hosts; daily cron sweeps the rest.
        const classified = await classifyPendingEvents(user.id, 100);
        console.log(
          `[company update] reclassify user=${user.id} processed=${classified.processed} classified=${classified.classified} failed=${classified.failed}`
        );
      } catch (e: any) {
        console.error('[company update] background pipeline failed:', e?.message ?? e);
      }
    })();
  }

  return NextResponse.json({ ok: true, reclassifying: descriptionChanged });
}
