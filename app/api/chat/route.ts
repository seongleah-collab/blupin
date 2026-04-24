import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function buildSystemPrompt(
  company: { company_name: string; company_description: string },
  events: Array<{
    potential_competitor_name: string | null;
    title: string;
    summary: string | null;
    recommended_action: string | null;
    threat_level: string | null;
    relevance_score: number | null;
    source: string;
    published_at: string | null;
    niche_match: boolean | null;
  }>
) {
  const relevantEvents = events
    .filter((e) => e.niche_match === true || (e.relevance_score ?? 0) >= 0.3)
    .slice(0, 15);

  const eventsBlock = relevantEvents.length
    ? relevantEvents
        .map(
          (e, i) =>
            `[${i + 1}] ${e.potential_competitor_name ?? 'Unknown'} — ${e.title}
  Source: ${e.source} | Threat: ${e.threat_level ?? 'low'} | Relevance: ${e.relevance_score?.toFixed(2) ?? '?'} | Match: ${e.niche_match ? 'yes' : 'no'}
  Summary: ${e.summary ?? '(no summary)'}
  Suggested action: ${e.recommended_action ?? '(none)'}
  Published: ${e.published_at ?? 'unknown'}`
        )
        .join('\n\n')
    : '(no relevant events tracked yet)';

  return `You are blupin — an AI-native competitive intelligence co-pilot built specifically for ${company.company_name}'s founder. You are NOT a generic assistant; you are their dedicated analyst for the competitive landscape.

## About ${company.company_name}
${company.company_description}

## What you monitor
You monitor three layers of competition: direct competitors, adjacent competitors, and new entrants in the niche.

## Recent events you're tracking for this founder
${eventsBlock}

## How you respond
- Be direct, specific, and strategic. Founders are busy and hate fluff.
- Ground every claim in the events above. If you cite a competitor, reference which event you're pulling from.
- If asked something you can't answer from the events, say so plainly — don't make things up. Suggest what kind of signal would help answer it.
- Prescribe actions, don't just report. "Here's what I'd do" > "Here's what's happening."
- Match the founder's energy — casual when they're casual, sharper when they're asking for strategy.
- Do not use corporate language ("leverage", "synergize", "unlock value"). Talk like a smart friend who happens to run competitive intel.
- Keep responses focused. Short when a short answer works. Longer only when strategy requires it.
- Don't use markdown headers or excessive bullet formatting — this is a chat, not a report. Prose with the occasional list is right.

You have memory within this conversation but not across sessions yet (that's coming in v2).`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages as ChatMessage[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'not authenticated' }), { status: 401 });
    }

    const [companyRes, eventsRes] = await Promise.all([
      supabase
        .from('user_companies')
        .select('company_name, company_description')
        .eq('id', user.id)
        .single(),
      supabase
        .from('competitor_events')
        .select(
          'potential_competitor_name, title, summary, recommended_action, threat_level, relevance_score, source, published_at, niche_match'
        )
        .eq('user_id', user.id)
        .eq('classification_status', 'classified')
        .order('relevance_score', { ascending: false, nullsFirst: false })
        .limit(30),
    ]);

    if (companyRes.error) throw companyRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const systemPrompt = buildSystemPrompt(companyRes.data!, eventsRes.data ?? []);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
            system: systemPrompt,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });

          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        } catch (err: any) {
          console.error('[chat stream]', err);
          controller.enqueue(encoder.encode(`\n\n[error: ${err.message}]`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: any) {
    console.error('[chat]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
