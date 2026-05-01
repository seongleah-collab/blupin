import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const COLUMNS =
  'id, potential_competitor_name, title, summary, recommended_action, threat_level, relevance_score, source, source_url, source_external_url, source_score, source_comment_count, og_title, og_description, og_image_url, og_site_name, published_at, classified_at, niche_match, event_type';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const { data, error } = await supabase
      .from('competitor_events')
      .select(COLUMNS)
      .eq('user_id', user.id)
      .eq('classification_status', 'classified')
      .eq('id', id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ event: data });
  }

  // feed-grade filter: only events the founder actually needs to see.
  // - must name a real competitor (drop nulls and the literal "unknown")
  // - niche_match=true is the gate (the classifier already decided this
  //   product solves the same problem for the same customer); we no
  //   longer let high-relevance niche_match=false rows leak through.
  // - drop low-relevance noise even within niche_match
  const { data, error } = await supabase
    .from('competitor_events')
    .select(COLUMNS)
    .eq('user_id', user.id)
    .eq('classification_status', 'classified')
    .not('potential_competitor_name', 'is', null)
    .not('potential_competitor_name', 'ilike', 'unknown')
    .eq('niche_match', true)
    .gte('relevance_score', 0.6)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('relevance_score', { ascending: false, nullsFirst: false })
    .limit(120);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}
