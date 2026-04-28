import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { data: company, error } = await supabase
    .from('user_companies')
    .select('company_name, company_description')
    .eq('id', user.id)
    .single();

  if (error || !company?.company_name || !company?.company_description) {
    return NextResponse.json({ error: 'complete step 1 first' }, { status: 400 });
  }

  const prompt = `You are helping a founder set up competitive monitoring. Their company is:

Name: ${company.company_name}
Description: ${company.company_description}

Suggest 5 likely competitors — products/companies in their direct, adjacent, or new-entrant competitive space. For each, give:
- name: the product or company name
- description: one short sentence (max 12 words) describing what they do, in lowercase

Return ONLY a JSON object with this exact shape, no prose, no markdown fences:
{ "competitors": [ { "name": "...", "description": "..." } ] }`;

  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = res.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new Error('no text in response');

    const raw = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, '');
    const parsed = JSON.parse(raw) as { competitors: Array<{ name: string; description: string }> };

    if (!Array.isArray(parsed.competitors)) throw new Error('malformed response');
    return NextResponse.json({ competitors: parsed.competitors.slice(0, 5) });
  } catch (err: any) {
    console.error('[suggest competitors]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
