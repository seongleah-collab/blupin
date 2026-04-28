import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 15;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type EventRow = {
  potential_competitor_name: string | null;
  title: string;
  summary: string | null;
  relevance_score: number | null;
  niche_match: boolean | null;
  published_at: string | null;
};

function fallback(companyName: string | null): string[] {
  const who = companyName ? `who's the biggest threat to ${companyName}?` : "who's the biggest threat this week?";
  return [
    'what should i pay attention to today?',
    who,
    'what did my competitors ship recently?',
  ];
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'not authenticated' }), { status: 401 });
    }

    const [companyRes, eventsRes] = await Promise.all([
      supabase
        .from('user_companies')
        .select('company_name')
        .eq('id', user.id)
        .single(),
      supabase
        .from('competitor_events')
        .select('potential_competitor_name, title, summary, relevance_score, niche_match, published_at')
        .eq('user_id', user.id)
        .eq('classification_status', 'classified')
        .order('relevance_score', { ascending: false, nullsFirst: false })
        .limit(8),
    ]);

    const companyName = companyRes.data?.company_name ?? null;
    const events = (eventsRes.data ?? []) as EventRow[];

    const relevant = events.filter((e) => e.niche_match === true || (e.relevance_score ?? 0) >= 0.3).slice(0, 5);

    if (relevant.length === 0) {
      return Response.json({ suggestions: fallback(companyName) });
    }

    const eventsBlock = relevant
      .map(
        (e, i) =>
          `[${i + 1}] ${e.potential_competitor_name ?? 'unknown'} — ${e.title}\n  ${e.summary ?? '(no summary)'}`
      )
      .join('\n\n');

    const prompt = `You generate chat suggestion buttons for a founder using a competitive intelligence tool. Their company is ${companyName ?? 'unknown'}.

Below are the most relevant recent competitor events. Generate exactly 3 short, punchy questions the founder would want to ask about THESE specific events. Each question must:
- be 5-12 words, lowercase, conversational
- reference a specific competitor name and what happened
- sound like a founder asking, not a press release. example: "walk me through cluely's $5 price change", "what's mem's new template feature about?", "should i worry about otter's new pricing?"

Events:
${eventsBlock}

Return ONLY a JSON object with this exact shape, no prose, no markdown fences:
{ "suggestions": ["...", "...", "..."] }`;

    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = res.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('no text in response');

    const raw = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, '');
    const parsed = JSON.parse(raw) as { suggestions: string[] };
    if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
      return Response.json({ suggestions: fallback(companyName) });
    }

    const cleaned = parsed.suggestions
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 3)
      .map((s) => s.trim());

    return Response.json({ suggestions: cleaned.length > 0 ? cleaned : fallback(companyName) });
  } catch (err: any) {
    console.error('[chat suggestions]', err);
    return Response.json({ suggestions: fallback(null) });
  }
}
