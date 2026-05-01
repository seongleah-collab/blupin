import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const SUBREDDITS = ['SideProject', 'SaaS'];
const USER_AGENT = 'blupin/0.1 competitive-intel-bot';

type RedditPost = {
  id: string;
  title: string;
  selftext: string;
  url: string;
  permalink: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  link_flair_text: string | null;
};

type RedditResponse = {
  data: { children: { data: RedditPost }[] };
};

async function fetchSubreddit(
  subreddit: string,
  hoursBack: number
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=50`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Reddit r/${subreddit} ${res.status}`);
  const json = (await res.json()) as RedditResponse;

  const cutoff = (Date.now() - hoursBack * 3600 * 1000) / 1000;
  return json.data.children
    .map((c) => c.data)
    .filter((p) => p.created_utc >= cutoff);
}

export async function ingestReddit(userId: string, hoursBack = 24) {
  const results = await Promise.all(
    SUBREDDITS.map((s) =>
      fetchSubreddit(s, hoursBack).catch((e) => {
        console.error(`[reddit] r/${s} failed:`, e.message);
        return [] as RedditPost[];
      })
    )
  );
  const posts = results.flat();
  if (posts.length === 0) return { fetched: 0, inserted: 0 };

  const rows = posts.map((p) => {
    // when the reddit post links out to a real article, surface that
    // url separately. self-posts (p.url points back at reddit) get null.
    const externalUrl =
      p.url && !p.url.includes('reddit.com') ? p.url : null;
    return {
      user_id: userId,
      competitor_id: null,
      potential_competitor_name: null,
      source: 'reddit',
      source_url: `https://www.reddit.com${p.permalink}`,
      source_external_url: externalUrl,
      source_id: p.id,
      source_score: p.score,
      source_comment_count: p.num_comments,
      event_type: p.subreddit.toLowerCase() === 'saas' ? 'discussion' : 'product_launch',
      title: `[r/${p.subreddit}] ${p.title}`,
      content: [
        p.selftext || '',
        externalUrl ? `Link: ${externalUrl}` : '',
        `Upvotes: ${p.score}`,
        `Comments: ${p.num_comments}`,
        p.link_flair_text ? `Flair: ${p.link_flair_text}` : '',
      ].filter(Boolean).join('\n'),
      raw_payload: p,
      published_at: new Date(p.created_utc * 1000).toISOString(),
      classification_status: 'pending' as const,
    };
  });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from('competitor_events')
    .upsert(rows, { onConflict: 'source,source_id', ignoreDuplicates: true })
    .select('id');

  if (error) throw error;
  return { fetched: rows.length, inserted: data?.length ?? 0 };
}