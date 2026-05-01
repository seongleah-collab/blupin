import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// All classified events for a single competitor, used by the deep-dive
// page. Returns more rows than /api/events (no severity floor) so the
// deep-dive can show the full picture, not just the high-signal items.

const COLUMNS =
  'id, potential_competitor_name, title, summary, recommended_action, threat_level, relevance_score, source, source_url, source_external_url, source_score, source_comment_count, og_title, og_description, og_image_url, og_site_name, published_at, niche_match, event_type';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('competitor_events')
    .select(COLUMNS)
    .eq('user_id', user.id)
    .eq('classification_status', 'classified')
    .ilike('potential_competitor_name', decoded)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ name: decoded, events: data ?? [] });
}
