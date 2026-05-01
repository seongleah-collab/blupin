import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { readArticle } from '@/lib/reader';

export const runtime = 'nodejs';

// Inline reader. Strategy depends on what we have:
//   1. Real article URL (HN/Reddit external link) — try Readability.
//   2. Product Hunt or any source where the "url" is just a marketing
//      homepage — those are JS-rendered SPAs Readability can't parse.
//      Skip the fetch entirely and return the ingested description.
//   3. Reddit self-post / HN Ask post — no external article exists,
//      use the stored content (selftext / story_text).
//   4. Readability fails on a real URL — fall back to stored content
//      so the user always sees something useful.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fallbackArticle(content: string | null, title: string | null) {
  if (!content) return null;
  // turn newline-separated text into <p> blocks; auto-link URLs.
  const html = content
    .split(/\n{2,}/)
    .map((para) => {
      const linked = escapeHtml(para.trim()).replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noreferrer">$1</a>'
      );
      return `<p>${linked.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');
  return {
    title,
    byline: null,
    excerpt: null,
    contentHtml: html,
    siteName: null,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { data: event, error } = await supabase
    .from('competitor_events')
    .select('source, source_url, source_external_url, title, content')
    .eq('user_id', user.id)
    .eq('id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const fallback = fallbackArticle(event.content, event.title);

  // Product Hunt source_external_url is the product's marketing site —
  // almost always a JS-rendered SPA. Skip Readability and use the
  // ingested description directly.
  const skipReadability = event.source === 'product_hunt';

  if (!skipReadability) {
    const target = event.source_external_url || event.source_url;
    if (target) {
      const article = await readArticle(target);
      if (article) {
        return NextResponse.json({ article, url: target });
      }
    }
  }

  if (fallback) {
    return NextResponse.json({
      article: fallback,
      url: event.source_external_url || event.source_url,
      fallback: true,
    });
  }

  return NextResponse.json(
    { error: 'could not extract article — try opening the source link' },
    { status: 422 }
  );
}
