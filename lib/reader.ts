// Server-side article extractor. Fetches the article HTML, hands it
// to a Mozilla Readability instance running on a jsdom window, and
// returns the cleaned-up content as sanitized HTML the feed can drop
// into a reader pane.

import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const UA =
  'Mozilla/5.0 (compatible; blupin-reader/0.1; +https://blupin.ai)';

export type ParsedArticle = {
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  contentHtml: string;
  textLength: number;
  siteName: string | null;
};

// strips event handlers, scripts, iframes, forms — anything that could
// run code or load external trackers. Readability already drops most
// of this but we belt-and-suspenders it before injecting via
// dangerouslySetInnerHTML in the client.
function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export async function readArticle(url: string): Promise<ParsedArticle | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html')) return null;
    const html = (await res.text()).slice(0, 1_500_000);

    // jsdom needs the original URL so relative links / images resolve
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (!article || !article.content) return null;

    return {
      title: article.title ?? null,
      byline: article.byline ?? null,
      excerpt: article.excerpt ?? null,
      contentHtml: sanitize(article.content),
      textLength: article.textContent?.length ?? 0,
      siteName: article.siteName ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
