import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { severityFromLevel } from '@/lib/severity';

export const runtime = 'nodejs';
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function deriveTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 60) return cleaned;
  return cleaned.slice(0, 57).trimEnd() + '…';
}

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
  Severity: ${severityFromLevel(e.threat_level, e.relevance_score)}/10 (use this exact number in [severity:N] when discussing this event)
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

  return `You are blupin — ${company.company_name}'s always-on competitive intelligence co-pilot. You're the one watching the landscape for them, every day, across every source. They don't have to lift a finger — they just open the app and you tell them what's going on. Talk like the friend who already has eyes on everything and just brings them what matters.

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

**If the threat you're discussing is one of the events listed above, you MUST use the exact \`Severity: N/10\` number from that event's row — do not re-score it.** The feed and competitor pages display that same number, and it has to match across surfaces. Only pick a fresh number when you're discussing a player that isn't in the events block (e.g. a relevant incumbent or indie builder you're surfacing from your own knowledge).

Calibration (only for items not in the events block):
- 1-3: distant or adjacent player, low chance of competing in their wedge soon
- 4-6: relevant player but no immediate move worth losing sleep over
- 7-8: real threat — competing on the same wedge soon, could narrow the moat
- 9-10: imminent — already shipping in their exact space, or about to. drop-everything territory

Examples of correct format:
- "[severity:8] linkedin has the candidate graph and recruiter relationships…"
- "[severity:6] there's a solo dev on r/SideProject shipping auto-apply — small now, but…"

If a single answer covers multiple threats, each one gets its own \`[severity:N]\` block — separate them by a blank line. If a question isn't about a specific threat or news item (pure strategy advice, "how should I think about positioning"), severity scoring doesn't apply — answer normally without markers.

## How you answer
Lead with the take in first-person plural — *we*, never *you should*. blupin is the one doing the watching; the founder isn't. Open with the call: "no, but we'll keep an eye on it for you" / "yes — we've been tracking them for two weeks" / "we flagged this one yesterday" / "nothing yet, we're watching their changelog." No "honest answer", no "I don't have data yet", no preamble. The first sentence reassures them blupin's already on it.

Frame the whole answer around what *we're watching*, *what we'll flag*, and *when we'll ping them* — not what they should monitor, check, or follow. The entire premise of blupin is that the founder doesn't do that work. So even when there's an action they should take on their own product, scope it tightly ("ship your differentiated onboarding") and pair it with what blupin will handle ("we'll ping you the moment they post a launch teaser"). Never tell them to go look at something themselves — that's our job.

Predict what they actually want to know. A founder asking "what should I pay attention to?" wants a specific competitor and a specific reason — not three clarifying questions back. Make a confident pick using the competitor list, the company context, recent events, and your knowledge of the broader space. Pick one thing. Say why it matters. Say what we're watching for next and when we'll surface a change.

Span the full landscape. Don't anchor only on the giants. If the sharpest answer is "we're already tracking this 3-person YC startup that just hit #1 on Product Hunt", say that. If it's "there's an indie dev on r/SideProject iterating on the exact same wedge weekly — we're on it", say that. Big-only takes miss the actual threat 70% of the time.

Use what you know. You have general knowledge of incumbents, funded startups, and the indie-builder scene. Use it. Don't pretend you only see what's in the events block.

Don't ask the user to fill in your gaps. They came to you because they don't want to do the legwork. If you genuinely need one specific detail to give a sharp take, ask exactly one short question — never a numbered list of three. Most of the time, just commit to a take.

Keep it tight. Plain prose, lowercase, conversational. No markdown headers, no bullet/numbered lists unless you're literally enumerating named items. Two or three short paragraphs is usually the right length.

Bold every actual company, product, or platform name by wrapping it in \`**Name**\` (markdown bold) — e.g. \`**Netflix**\`, \`**Mubi**\`, \`**Product Hunt**\`, \`**Show HN**\`, \`**r/SideProject**\`. The UI renders these in bold so the founder can scan named players at a glance. Bold ONLY proper nouns that name a company / product / platform / subreddit. Do not bold generic phrases, features, or descriptions ("creator monetization", "the streaming wars"). Do not use \`**...**\` for any other emphasis — bolding is reserved for names.

Be specific. "LinkedIn could ship AI matching" is weak. "linkedin has the candidate graph + recruiter relationships — if they ship even a mediocre ai match feature this quarter, your wedge narrows fast. we're watching their product blog and engineering hires for any sign they're staffing it up — we'll flag the second something moves. in the meantime, ship your differentiated onboarding so we have something defensible to point to when they do." is the bar. Same bar for small players: "there's a solo dev shipping an auto-apply tool on r/SideProject — already 4k upvotes. we've added them to the watch list and we'll surface every release they push."`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages as ChatMessage[];
    const incomingConvoId: string | undefined = body.conversationId;

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

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) {
      return new Response(JSON.stringify({ error: 'no user message in payload' }), { status: 400 });
    }

    let conversationId = incomingConvoId;
    if (!conversationId) {
      const { data: created, error: createErr } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title: deriveTitle(lastUserMsg.content) })
        .select('id')
        .single();
      if (createErr || !created) {
        return new Response(JSON.stringify({ error: createErr?.message ?? 'create convo failed' }), { status: 500 });
      }
      conversationId = created.id;
    } else {
      const { data: owned, error: ownErr } = await supabase
        .from('conversations')
        .select('id, title')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      if (ownErr || !owned) {
        return new Response(JSON.stringify({ error: 'conversation not found' }), { status: 404 });
      }
      if (!owned.title) {
        await supabase
          .from('conversations')
          .update({ title: deriveTitle(lastUserMsg.content) })
          .eq('id', conversationId)
          .eq('user_id', user.id);
      }
    }

    await supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: lastUserMsg.content,
    });

    const systemPrompt = buildSystemPrompt(
      companyRes.data!,
      competitorsRes.data ?? [],
      eventsRes.data ?? []
    );

    const encoder = new TextEncoder();
    const finalConvoId = conversationId;
    const stream = new ReadableStream({
      async start(controller) {
        let fullText = '';
        try {
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
            system: systemPrompt,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          });

          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullText += chunk.delta.text;
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch (err: any) {
          console.error('[chat stream]', err);
          const errText = `\n\n[error: ${err.message}]`;
          fullText += errText;
          controller.enqueue(encoder.encode(errText));
        } finally {
          if (fullText.trim().length > 0) {
            await supabase.from('conversation_messages').insert({
              conversation_id: finalConvoId,
              user_id: user.id,
              role: 'assistant',
              content: fullText,
            });
            await supabase
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', finalConvoId)
              .eq('user_id', user.id);
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'X-Conversation-Id': conversationId!,
      },
    });
  } catch (err: any) {
    console.error('[chat]', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
