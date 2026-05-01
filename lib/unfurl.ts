// Tiny OG / Twitter-card scraper. Pulls title/description/image/site
// from an HTML page so the feed can render Slack-style link previews.
// Regex-based on purpose — no JSDOM dependency, and we only need the
// <head> meta tags. Falls back gracefully when fields are missing.

export type Unfurl = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

const UA =
  'Mozilla/5.0 (compatible; blupin-unfurl/0.1; +https://blupin.ai)';

function decode(s: string | null | undefined): string | null {
  if (!s) return null;
  // basic HTML entity decode for the handful that show up in og tags
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
}

function meta(html: string, prop: string): string | null {
  // matches <meta property="og:title" content="..."> in either order
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
      'i'
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decode(m[1]);
  }
  return null;
}

function pickTitle(html: string): string | null {
  return (
    meta(html, 'og:title') ||
    meta(html, 'twitter:title') ||
    decode(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? null)
  );
}

function pickDescription(html: string): string | null {
  return (
    meta(html, 'og:description') ||
    meta(html, 'twitter:description') ||
    meta(html, 'description')
  );
}

function pickImage(html: string, baseUrl: string): string | null {
  const raw =
    meta(html, 'og:image') || meta(html, 'twitter:image') || null;
  if (!raw) return null;
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function unfurl(url: string): Promise<Unfurl | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html')) return null;
    // cap body so a multi-MB article body doesn't blow memory
    const text = (await res.text()).slice(0, 250_000);
    return {
      title: pickTitle(text),
      description: pickDescription(text),
      image: pickImage(text, url),
      siteName: meta(text, 'og:site_name'),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
