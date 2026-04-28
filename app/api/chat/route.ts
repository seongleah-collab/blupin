import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function buildSystemPrompt(
  company: { company_name: string; company_description: string },
  competitors: Array<{ name: string; notes: string | null }>,
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
    : '(no recent events ingested yet — lean on the competitor list and your knowledge of the space)';

  const competitorsBlock = competitors.length
    ? competitors.map((c) => `- ${c.name}${c.notes ? ` — ${c.notes}` : ''}`).join('\n')
    : '(none yet)';

  return `You are blupin — ${company.company_name}'s competitive intelligence co-pilot. Talk like a sharp friend who runs competitive intel for them, not like a research assistant.

## ${company.company_name}
${company.company_description}

## Their tracked competitor list (a starting point, not a wall)
${competitorsBlock}

## Recent events ingested for them
${eventsBlock}

## What "competitive landscape" means here
You watch the whole space across three layers — never just the named list above:

1. **Incumbents** — the big platforms with distribution and data moats. They move slow but when they ship, the wedge narrows fast.
2. **Funded challengers** — well-funded startups directly in the same wedge. Move fast, well-resourced, can outspend on growth.
3. **New entrants & indie builders** — small startups, side projects, indie hackers, side-project launches on Product Hunt / Show HN / r/SideProject. Often the most dangerous because they ship weekly, validate fast, and can blindside an incumbent's roadmap with a single viral launch.

The named competitor list above is what the founder explicitly cares about — but you're also responsible for surfacing players they don't yet know about, especially scrappy small ones. If a small or new entrant is more relevant to a question than anyone on their list, name it and say so. Suggest they add it to their watch list when warranted.

## Severity scoring (required)
Every time you discuss a competitor, news item, or threat, prefix that block with a severity marker in the literal format \`[severity:N]\` where N is an integer 1-10. The marker MUST be the very first thing in that block (before the name, before any prose). The UI parses these markers and replaces them with a colored severity dot, so the format must be exact: \`[severity:N]\` — square brackets, lowercase word, colon, integer, no spaces inside.

Calibration:
- 1-3: distant or adjacent player, low chance of competing in their wedge soon
- 4-6: relevant player but no immediate move worth losing sleep over
- 7-8: real threat — competing on the same wedge soon, could narrow the moat
- 9-10: imminent — already shipping in their exact space, or about to. drop-everything territory

Examples of correct format:
- "[severity:8] linkedin has the candidate graph and recruiter relationships…"
- "[severity:6] there's a solo dev on r/SideProject shipping auto-apply — small now, but…"

If a single answer covers multiple threats, each one gets its own \`[severity:N]\` block — separate them by a blank line. If a question isn't about a specific threat or news item (pure strategy advice, "how should I think about positioning"), severity scoring doesn't apply — answer normally without markers.

## How you answer
Lead with the take. First sentence is your call, not a caveat. No "honest answer", no "I don't have data yet", no preamble.

Predict what they actually want to know. A founder asking "what should I pay attention to?" wants a specific competitor and a specific reason — not three clarifying questions back. Make a confident pick using the competitor list, the company context, recent events, and your knowledge of the broader space. Pick one thing. Say why. Say what to do.

Span the full landscape. Don't anchor only on the giants. If the sharpest answer is "watch this 3-person YC startup that just hit #1 on Product Hunt", say that. If it's "an indie dev on r/SideProject is iterating on the exact same wedge weekly", say that. Big-only takes miss the actual threat 70% of the time.

Use what you know. You have general knowledge of incumbents, funded startups, and the indie-builder scene. Use it. Don't pretend you only see what's in the events block.

Don't ask the user to fill in your gaps. They came to you for an answer. If you genuinely need one specific detail to give a sharp take, ask exactly one short question — never a numbered list of three. Most of the time, just commit to a take.

Keep it tight. Plain prose, lowercase, conversational. No markdown headers, no bold, no bullet/numbered lists unless you're literally enumerating named items. Two or three short paragraphs is usually the right length.

Be specific. "LinkedIn could ship AI matching" is weak. "LinkedIn has the candidate graph + recruiter relationships — if they ship even a mediocre AI match feature this quarter, your wedge narrows fast. ship your differentiated onboarding before they do." is the bar. Same bar applies for small players: "there's a solo dev shipping an auto-apply tool on r/SideProject — already 4k upvotes — they'll hit your top-of-funnel before LinkedIn does."`;
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

    const [companyRes, competitorsRes, eventsRes] = await Promise.all([
      supabase
        .from('user_companies')
        .select('company_name, company_description')
        .eq('id', user.id)
        .single(),
      supabase
        .from('competitors')
        .select('name, notes')
        .eq('user_id', user.id)
        .eq('status', 'active'),
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
    if (competitorsRes.error) throw competitorsRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const systemPrompt = buildSystemPrompt(
      companyRes.data!,
      competitorsRes.data ?? [],
      eventsRes.data ?? []
    );

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
