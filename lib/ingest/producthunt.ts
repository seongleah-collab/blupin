import { GraphQLClient, gql } from 'graphql-request';
import { createClient } from '@supabase/supabase-js';
import { resolveRedirect } from '@/lib/unfurl';

// Service-role client bypasses RLS — we're inserting on behalf of a user server-side
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const PH_ENDPOINT = 'https://api.producthunt.com/v2/api/graphql';

const RECENT_POSTS_QUERY = gql`
  query RecentPosts($first: Int!, $postedAfter: DateTime) {
    posts(first: $first, postedAfter: $postedAfter, order: NEWEST) {
      edges {
        node {
          id
          name
          tagline
          description
          url
          website
          createdAt
          votesCount
          topics {
            edges {
              node { name }
            }
          }
        }
      }
    }
  }
`;

type PHPost = {
  id: string;
  name: string;
  tagline: string;
  description: string | null;
  url: string;
  website: string | null;
  createdAt: string;
  votesCount: number;
  topics: { edges: { node: { name: string } }[] };
};

type PHResponse = {
  posts: { edges: { node: PHPost }[] };
};

export async function ingestProductHunt(userId: string, hoursBack = 48) {
  const token = process.env.PRODUCT_HUNT_TOKEN;
  if (!token) throw new Error('PRODUCT_HUNT_TOKEN not set');

  const client = new GraphQLClient(PH_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const postedAfter = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  const data = await client.request<PHResponse>(RECENT_POSTS_QUERY, {
    first: 50,
    postedAfter,
  });

  const posts = data.posts.edges.map((e) => e.node);
  if (posts.length === 0) return { fetched: 0, inserted: 0 };

  // PH's `website` field is a /r/HASH/... click-tracker that points back to
  // producthunt.com — unwrap it to the real product URL so the feed pill
  // shows the actual destination domain (e.g. "drizzle.ai" not "producthunt.com").
  const resolvedWebsites = await Promise.all(
    posts.map(async (p) => {
      if (!p.website) return null;
      try {
        const u = new URL(p.website);
        if (u.hostname.endsWith('producthunt.com') && u.pathname.startsWith('/r/')) {
          const resolved = await resolveRedirect(p.website);
          return resolved ?? p.website;
        }
        return p.website;
      } catch {
        return p.website;
      }
    })
  );

  const rows = posts.map((p, i) => ({
    user_id: userId,
    competitor_id: null,
    potential_competitor_name: p.name,
    source: 'product_hunt',
    source_url: p.url,
    source_external_url: resolvedWebsites[i],
    source_id: p.id,
    source_score: p.votesCount,
    source_comment_count: null,
    event_type: 'product_launch',
    title: `${p.name} — ${p.tagline}`,
    content: [
      p.description ?? '',
      p.website ? `Website: ${p.website}` : '',
      `Topics: ${p.topics.edges.map((t) => t.node.name).join(', ')}`,
      `Upvotes: ${p.votesCount}`,
    ].filter(Boolean).join('\n'),
    raw_payload: p,
    published_at: p.createdAt,
    classification_status: 'pending' as const,
  }));

  const db = supabaseAdmin();
  const { data: inserted, error } = await db
    .from('competitor_events')
    .upsert(rows, { onConflict: 'source,source_id', ignoreDuplicates: true })
    .select('id');

  if (error) throw error;

  return { fetched: posts.length, inserted: inserted?.length ?? 0 };
}