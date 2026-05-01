import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { unfurl } from '@/lib/unfurl';

export const runtime = 'nodejs';

// Lazy unfurl: when the feed expands a card with no og_* data, it hits
// this route to fetch and cache OG metadata for the event's external
// link (or its source_url as fallback). Subsequent reads use the
// cached row. Refresh cadence is 30 days — most articles don't change
// their og tags, and sites that do can wait.
const STALE_DAYS = 30;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { data: event, error: fetchErr } = await supabase
    .from('competitor_events')
    .select('source_url, source_external_url, og_title, og_description, og_image_url, og_site_name, og_fetched_at')
    .eq('user_id', user.id)
    .eq('id', id)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const fresh =
    event.og_fetched_at &&
    Date.now() - new Date(event.og_fetched_at).getTime() <
      STALE_DAYS * 24 * 60 * 60 * 1000;

  if (fresh) {
    return NextResponse.json({
      og_title: event.og_title,
      og_description: event.og_description,
      og_image_url: event.og_image_url,
      og_site_name: event.og_site_name,
      cached: true,
    });
  }

  const target = event.source_external_url || event.source_url;
  if (!target) return NextResponse.json({ error: 'no url to unfurl' }, { status: 400 });

  const data = await unfurl(target);
  // even on null we record the attempt so we don't re-hit the URL on
  // every page load. og_* stays null; og_fetched_at becomes "now".
  const update = {
    og_title: data?.title ?? null,
    og_description: data?.description ?? null,
    og_image_url: data?.image ?? null,
    og_site_name: data?.siteName ?? null,
    og_fetched_at: new Date().toISOString(),
  };

  const { error: upErr } = await supabase
    .from('competitor_events')
    .update(update)
    .eq('user_id', user.id)
    .eq('id', id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ...update, cached: false });
}
