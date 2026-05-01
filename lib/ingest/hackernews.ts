import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const ALGOLIA_ENDPOINT = 'https://hn.algolia.com/api/v1/search_by_date';

type HNHit = {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string;
  points: number | null;
  num_comments: number | null;
  created_at: string;
  created_at_i: number;
  story_text: string | null;
  _tags: string[];
};

type HNResponse = { hits: HNHit[] };

// "Show HN: Blupin – AI competitive intelligence" -> "Blupin"
function parseShowHNName(title: string): string | null {
  const m = title.match(/^Show HN:\s*([^–—\-,:(]+?)(?:\s*[–—\-,:(]|$)/i);
  return m ? m[1].trim() : null;
}

async function fetchHN(
  tags: string,
  hoursBack: number,
  minPoints?: number
): Promise<HNHit[]> {
  const since = Math.floor((Date.now() - hoursBack * 3600 * 1000) / 1000);
  const filters = minPoints
    ? `created_at_i>${since},points>=${minPoints}`
    : `created_at_i>${since}`;
  const url = `${ALGOLIA_ENDPOINT}?tags=${tags}&numericFilters=${encodeURIComponent(filters)}&hitsPerPage=50`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HN Algolia ${res.status}`);
  const data = (await res.json()) as HNResponse;
  return data.hits.filter((h) => h.title); // drop bare comments
}

export async function ingestHackerNews(userId: string, hoursBack = 24) {
  const [showHn, frontPage] = await Promise.all([
    fetchHN('show_hn', hoursBack),
    fetchHN('story', hoursBack, 50), // min 50 points = rough front-page proxy
  ]);

  const showHnIds = new Set(showHn.map((h) => h.objectID));

const toRow = (h: HNHit, eventType: 'product_launch' | 'discussion') => ({
        user_id: userId,
    competitor_id: null,
    potential_competitor_name:
      eventType === 'product_launch' ? parseShowHNName(h.title!) : null,
    source: 'hacker_news',
    // source_url always points at the HN discussion page, so users can
    // jump into the comments. source_external_url is the article itself
    // when the submission links out — we expose both in the feed UI.
    source_url: `https://news.ycombinator.com/item?id=${h.objectID}`,
    source_external_url: h.url,
    source_id: h.objectID,
    source_score: h.points,
    source_comment_count: h.num_comments,
    event_type: eventType,
    title: h.title!,
    content: [
      h.story_text ?? '',
      `Points: ${h.points ?? 0}`,
      `Comments: ${h.num_comments ?? 0}`,
      `HN discussion: https://news.ycombinator.com/item?id=${h.objectID}`,
    ].filter(Boolean).join('\n'),
    raw_payload: h,
    published_at: h.created_at,
    classification_status: 'pending' as const,
  });

  const rows = [
    ...showHn.map((h) => toRow(h, 'product_launch')),
    ...frontPage
      .filter((h) => !showHnIds.has(h.objectID)) // dedupe
.map((h) => toRow(h, 'discussion')),
  ];

  if (rows.length === 0) return { fetched: 0, inserted: 0 };

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('competitor_events')
    .upsert(rows, { onConflict: 'source,source_id', ignoreDuplicates: true })
    .select('id');

  if (error) throw error;
  return { fetched: rows.length, inserted: data?.length ?? 0 };
}