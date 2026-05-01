import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function supabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Classification = {
  niche_match: boolean;
  relevance_score: number;
  threat_level: 'low' | 'medium' | 'high';
  summary: string;
  recommended_action: string;
};

function buildPrompt(company: {
  name: string;
  description: string;
  niche_keywords: string[];
  stage: string | null;
}, event: {
  title: string;
  content: string | null;
  potential_competitor_name: string | null;
}) {
  return `You are a competitive intelligence classifier for the founder of ${company.name}. Your only job is to decide whether a newly launched product is competitively relevant to THEIR company specifically — not to startups in general.

## The founder's company (this is your source of truth — read carefully)
Name: ${company.name}
Stage: ${company.stage ?? 'unknown'}
Description: ${company.description}
${company.niche_keywords.length > 0 ? `Niche keywords: ${company.niche_keywords.join(', ')}` : ''}

The description above defines:
- WHAT the company does (the product)
- WHO they serve (the customer / user)
- WHAT problem they solve

Anything you classify must be evaluated AGAINST those three things. Do not bring in your own assumptions about what "founder tools" or "AI startups" should compete with each other. A meeting-notes AI does NOT compete with a sales lead tool just because both are AI products. A coding agent does NOT compete with a fitness app just because both are consumer software.

## The event to classify
Product/company: ${event.potential_competitor_name ?? 'unknown'}
Title: ${event.title}
Details: ${event.content ?? '(no additional details)'}

## What counts as relevant (relative to ${company.name})
Three categories matter:
1. **Direct competitor** — solves the same problem for the same customer as ${company.name}
2. **Adjacent / substitute** — solves a closely-related problem for the same customer, such that the customer might pick this *instead* of ${company.name} (e.g., if ${company.name} is a meeting-notes AI, then a meeting transcription tool like Otter is adjacent — same customer, overlapping problem)
3. **New entrant in the same niche** — early-stage product targeting the exact same customer + problem

If the new product does NOT serve the same customer AND solve a related problem to ${company.name}, set niche_match = false. Default to false when uncertain. It is much worse to surface a noisy false positive than to miss a marginal one.

## Scoring guide
- 0.0-0.2: completely unrelated to ${company.name}'s product, customer, or problem
- 0.3-0.5: same broad industry but different customer or different problem (niche_match=false)
- 0.5-0.7: same customer OR same problem, but not both (niche_match=false unless the overlap is strong)
- 0.7-0.9: same customer AND closely related problem (niche_match=true)
- 0.9-1.0: head-on competitor — same customer, same problem (niche_match=true)

## Threat level
- 'low': worth knowing about but no action needed
- 'medium': monitor actively; could evolve into direct threat; worth a mention in weekly digest
- 'high': direct threat requiring response this week

## Voice and tone
The founder reading this is busy. Skip the jargon. No "GTM motion," "ICP," "vertical SaaS," "buyer intent signals," "adjacent market intelligence," "competitive landscape" — write like a friend texting them, not a McKinsey deck.

Use short sentences. Plain words. Talk about what the product DOES (not what category it's in). When something matters, say so straight: "this is a real threat," "worth keeping an eye on," "you can ignore this." No hedging.

## Output format
Return a single JSON object with EXACTLY this shape, and nothing else (no prose, no markdown fences):

{
  "niche_match": boolean,
  "relevance_score": number between 0.0 and 1.0,
  "threat_level": "low" | "medium" | "high",
  "summary": "1–2 sentences in plain English. Say what the product does in everyday words, then say whether it overlaps with what ${company.name} is building. Avoid words like 'GTM', 'ICP', 'adjacent', 'vertical', 'space', 'landscape', 'motion', 'signals'. Write like you'd text a friend.",
  "recommended_action": "Start with a clear verdict: 'worry about this', 'keep an eye on this', or 'you can ignore this'. Then in one short sentence, say WHY and what to actually do. Examples: 'Worry about this — they're going after the exact same customer. Check their pricing this week.' / 'Keep an eye on this. They're not direct competition yet but they're inching closer.' / 'You can ignore this. Different problem, different audience.'"
}

## Important
- If niche_match is false, threat_level MUST be 'low' and the recommendation should start with "you can ignore this".
- If niche_match is true and relevance_score >= 0.7, threat_level should be 'medium' or 'high', and the recommendation should start with "worry about this" or "keep an eye on this" (not "ignore").
- Never use the words: GTM, ICP, adjacent, vertical, landscape, space, motion, signals, intent, AOV, MRR, vector, pipeline (in the marketing sense), buyer journey, top-of-funnel, bottom-of-funnel.
- Do NOT include any text outside the JSON object.`;
}

async function classifyOne(
  company: Parameters<typeof buildPrompt>[0],
  event: Parameters<typeof buildPrompt>[1]
): Promise<Classification> {
  const prompt = buildPrompt(company, event);

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = res.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text in Claude response');
  }

  const raw = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, '');
  const parsed = JSON.parse(raw) as Classification;

  if (
    typeof parsed.niche_match !== 'boolean' ||
    typeof parsed.relevance_score !== 'number' ||
    !['low', 'medium', 'high'].includes(parsed.threat_level) ||
    typeof parsed.summary !== 'string' ||
    typeof parsed.recommended_action !== 'string'
  ) {
    throw new Error(`Malformed classification: ${raw}`);
  }

  return parsed;
}

export async function classifyPendingEvents(userId: string, limit = 50) {
  const db = supabaseAdmin();

  // The user_companies table uses the auth user id as PK and stores
  // the company name/description with a `company_` prefix. Earlier
  // versions of this query referenced columns that don't exist
  // (name/description/user_id) and silently returned no rows, which
  // made every classifier call throw. Always validate against
  // CLAUDE.md's documented schema before changing this query.
  const { data: companyRow, error: companyError } = await db
    .from('user_companies')
    .select('company_name, company_description')
    .eq('id', userId)
    .maybeSingle();

  if (companyError) throw companyError;
  if (!companyRow || !companyRow.company_description) {
    throw new Error(`No user_company found for user ${userId}`);
  }
  const company = {
    name: companyRow.company_name ?? 'unknown',
    description: companyRow.company_description,
    niche_keywords: [] as string[],
    stage: null as string | null,
  };

  // Prioritize events that name a real competitor — those are the only ones
  // that can ever pass the feed filter (which drops potential_competitor_name
  // IS NULL). Generic r/SaaS / r/SideProject posts get classified last so a
  // 100-event budget isn't wasted on noise that the feed can't surface.
  const { data: events, error: eventsError } = await db
    .from('competitor_events')
    .select('id, title, content, potential_competitor_name')
    .eq('user_id', userId)
    .eq('classification_status', 'pending')
    .order('potential_competitor_name', { ascending: true, nullsFirst: false })
    .order('fetched_at', { ascending: false })
    .limit(limit);

  if (eventsError) throw eventsError;
  if (!events || events.length === 0) return { processed: 0, classified: 0, failed: 0 };

  let classified = 0;
  let failed = 0;

  for (const event of events) {
    try {
      const result = await classifyOne(company, event);

      const { error: updateError } = await db
        .from('competitor_events')
        .update({
          classification_status: 'classified',
          niche_match: result.niche_match,
          relevance_score: result.relevance_score,
          threat_level: result.threat_level,
          summary: result.summary,
          recommended_action: result.recommended_action,
          classified_at: new Date().toISOString(),
        })
        .eq('id', event.id);

      if (updateError) throw updateError;
      classified++;
    } catch (err: any) {
      console.error(`[classify] event ${event.id} failed:`, err.message);
      await db
        .from('competitor_events')
        .update({ classification_status: 'failed' })
        .eq('id', event.id);
      failed++;
    }
  }

  return { processed: events.length, classified, failed };
}