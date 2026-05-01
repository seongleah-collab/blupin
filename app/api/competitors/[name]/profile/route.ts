import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Competitor profile: stitches together the tracked competitor row
// (curated by the user during onboarding) with the latest event's
// raw_payload so we can render a brand-styled deep-dive header
// (logo, tagline, website, topics, description) without re-fetching
// from external sources.

type PHRawPayload = {
  name?: string;
  tagline?: string;
  description?: string | null;
  website?: string | null;
  url?: string;
  topics?: { edges: { node: { name: string } }[] };
};

function cleanDomain(d: string | null | undefined): string | null {
  if (!d) return null;
  return d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  // 1. tracked-competitor row (may not exist if name only appears in events)
  const { data: tracked } = await supabase
    .from('competitors')
    .select('name, notes, domain')
    .eq('user_id', user.id)
    .ilike('name', decoded)
    .maybeSingle();

  // 2. latest classified event for this competitor — we want raw_payload
  //    from the most recent Product Hunt one if available (richest source).
  const { data: events } = await supabase
    .from('competitor_events')
    .select('source, raw_payload, summary, og_title, og_description, og_image_url, og_site_name, source_external_url')
    .eq('user_id', user.id)
    .eq('classification_status', 'classified')
    .ilike('potential_competitor_name', decoded)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(20);

  const phEvent = events?.find((e) => e.source === 'product_hunt');
  const phPayload = (phEvent?.raw_payload ?? null) as PHRawPayload | null;
  const latestEvent = events?.[0] ?? null;

  const tagline = phPayload?.tagline ?? null;
  const description = phPayload?.description ?? tracked?.notes ?? latestEvent?.summary ?? null;
  const website =
    cleanDomain(phPayload?.website) ??
    tracked?.domain ??
    null;
  const topics = phPayload?.topics?.edges?.map((t) => t.node.name).filter(Boolean) ?? [];

  // surface OG image from any unfurled event so the hero can use it as a banner
  const eventWithOg = events?.find((e) => e.og_image_url);
  const ogImage = eventWithOg?.og_image_url ?? null;

  return NextResponse.json({
    name: tracked?.name ?? decoded,
    domain: tracked?.domain ?? website,
    website,
    tagline,
    description,
    topics,
    ogImage,
    isTracked: !!tracked,
  });
}
