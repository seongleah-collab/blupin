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
  return `You are blupin's classifier. Your job is to evaluate whether a product launch is competitively relevant to a specific founder's company, and if so, how threatening it is and what they should do about it.

## The founder's company
Name: ${company.name}
Stage: ${company.stage ?? 'unknown'}
Description: ${company.description}
Niche keywords: ${company.niche_keywords.join(', ')}

## The event to classify
Product/company: ${event.potential_competitor_name ?? 'unknown'}
Title: ${event.title}
Details: ${event.content ?? '(no additional details)'}

## What counts as relevant
blupin monitors a founder's competitive landscape across three layers:
1. **Direct competitors** — products that solve the same problem the founder solves
2. **Adjacent competitors** — products in the same category the customer might substitute or use instead (for ${company.name}, this includes: market research tools, strategy tools, pricing intelligence, buyer research, industry analysis, trend monitoring, BI tools used for competitive purposes)
3. **New entrants in the niche** — early-stage products targeting the same customer problem

Mark niche_match = true if the product falls into ANY of these three layers.
Mark niche_match = false if the product is a different *category* of founder tool entirely (e.g., an AI coding cofounder, a fitness app, a developer infrastructure tool, a consumer productivity app). Those aren't competitive to ${company.name} even though they serve founders.

## Scoring guide
- 0.0-0.2: completely unrelated (consumer apps, unrelated B2B tools, dev tools)
- 0.3-0.5: adjacent but different category (founder tool for a different problem — niche_match=false here)
- 0.5-0.7: in the same broader category as ${company.name} (market research, strategy, general intelligence tools — niche_match=true)
- 0.7-0.9: directly overlaps ${company.name}'s problem space (CI tools, competitor monitoring, market intelligence for founders — niche_match=true)
- 0.9-1.0: near head-on competitor (niche_match=true)

## Threat level
- 'low': worth knowing about but no action needed
- 'medium': monitor actively; could evolve into direct threat; worth a mention in weekly digest
- 'high': direct threat requiring response this week

## Output format
Return a single JSON object with EXACTLY this shape, and nothing else (no prose, no markdown fences):

{
  "niche_match": boolean,
  "relevance_score": number between 0.0 and 1.0,
  "threat_level": "low" | "medium" | "high",
  "summary": "one sentence describing what the product does and why it matters (or doesn't) to ${company.name}",
  "recommended_action": "one short, specific, concrete recommendation — or 'no action needed' if niche_match is false"
}

## Important
- If niche_match is false, threat_level MUST be 'low'.
- If niche_match is true and relevance_score >= 0.7, threat_level should be 'medium' or 'high'.
- Be concrete in recommended_action: "Monitor their pricing changes" is better than "Stay aware of their growth."
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

  const { data: companies, error: companyError } = await db
    .from('user_companies')
    .select('name, description, niche_keywords, stage')
    .eq('user_id', userId)
    .limit(1);

  if (companyError) throw companyError;
  if (!companies || companies.length === 0) {
    throw new Error(`No user_company found for user ${userId}`);
  }
  const company = companies[0];

  const { data: events, error: eventsError } = await db
    .from('competitor_events')
    .select('id, title, content, potential_competitor_name')
    .eq('user_id', userId)
    .eq('classification_status', 'pending')
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