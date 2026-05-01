// resync AI-suggested competitor list against description changes
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

type ResyncDecision = {
  material_change: boolean;
  drop: string[];
  add: Array<{ name: string; description: string; domain: string }>;
};

type ResyncResult = {
  skipped: boolean;
  dropped: string[];
  added: string[];
};

function cleanDomain(d: string | undefined | null): string | null {
  if (!d) return null;
  const trimmed = d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return trimmed.length > 0 ? trimmed : null;
}

function formatSystemList(items: Array<{ name: string; notes: string | null }>): string {
  if (items.length === 0) return '(none)';
  const lines = items.map((c) => {
    const suffix = c.notes ? ' — ' + c.notes : '';
    return '- ' + c.name + suffix;
  });
  return lines.join('\n');
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return '(none)';
  return names.map((n) => '- ' + n).join('\n');
}

function buildPrompt(
  companyName: string,
  oldDescription: string,
  newDescription: string,
  systemCompetitors: Array<{ name: string; notes: string | null }>,
  userCompetitorNames: string[]
): string {
  const parts = [
    'You are helping a founder keep their competitor watchlist in sync with how they describe their company.',
    '',
    '## Company',
    'Name: ' + companyName,
    '',
    '## Old description',
    oldDescription,
    '',
    '## New description',
    newDescription,
    '',
    '## Current AI-suggested competitors (you may drop or keep these)',
    formatSystemList(systemCompetitors),
    '',
    '## Current user-added competitors (DO NOT touch these — listed only so you do not suggest them again)',
    formatNameList(userCompetitorNames),
    '',
    '## Your task',
    '1. Decide whether the description changed materially — i.e. the company now serves a meaningfully different customer, solves a different problem, or operates in a different niche. Cosmetic edits (typos, rewording, tone tweaks) are NOT material.',
    '2. If material, return:',
    '   - drop: names from the AI-suggested list that no longer fit the new description (exact name match).',
    '   - add: up to 5 new competitors that fit the new description and are not already in either list. For each: name, one-sentence description (max 12 words, lowercase), and primary domain (no protocol, no path, no "www.").',
    '3. If NOT material, set material_change=false and return empty drop/add arrays.',
    '',
    '## Special case',
    'If the current AI-suggested list is empty (i.e. "(none)" above), the founder has no competitor coverage yet. Always treat this as material AND always return 5 fresh suggestions in the add array, regardless of how the description compares to the old one.',
    '',
    'Return ONLY a JSON object with this exact shape, no prose, no markdown fences:',
    '{ "material_change": boolean, "drop": ["name1", ...], "add": [{ "name": "...", "description": "...", "domain": "..." }] }',
  ];
  return parts.join('\n');
}

export async function resyncSystemCompetitors(
  userId: string,
  oldDescription: string | null,
  newDescription: string
): Promise<ResyncResult> {
  const db = supabaseAdmin();

  const { data: companyRow } = await db
    .from('user_companies')
    .select('company_name')
    .eq('id', userId)
    .maybeSingle();

  const companyName = companyRow?.company_name ?? 'unknown';

  const { data: competitors, error: compErr } = await db
    .from('competitors')
    .select('name, notes, added_by, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (compErr) throw compErr;

  const systemCompetitors = (competitors ?? [])
    .filter((c) => c.added_by === 'system')
    .map((c) => ({ name: c.name, notes: c.notes }));
  const userCompetitorNames = (competitors ?? [])
    .filter((c) => c.added_by !== 'system')
    .map((c) => c.name);

  const prompt = buildPrompt(
    companyName,
    oldDescription ?? '(none)',
    newDescription,
    systemCompetitors,
    userCompetitorNames
  );

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = res.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('no text in resync response');

  const raw = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, '');
  const parsed = JSON.parse(raw) as ResyncDecision;

  // If the user has no AI-suggested competitors yet, any description is a
  // valid seed — skipping on "not material" would leave the feed empty
  // forever. Force material_change so the add list always gets applied.
  const forceSeed = systemCompetitors.length === 0;
  if (!parsed.material_change && !forceSeed) {
    return { skipped: true, dropped: [], added: [] };
  }

  const systemNameSet = new Set(systemCompetitors.map((c) => c.name));
  const dropNames = (parsed.drop ?? []).filter((n) => systemNameSet.has(n));

  let dropped: string[] = [];
  if (dropNames.length > 0) {
    const { error: delErr } = await db
      .from('competitors')
      .delete()
      .eq('user_id', userId)
      .eq('added_by', 'system')
      .in('name', dropNames);
    if (delErr) throw delErr;
    dropped = dropNames;
  }

  const existingNames = new Set([
    ...systemCompetitors.map((c) => c.name.toLowerCase()),
    ...userCompetitorNames.map((n) => n.toLowerCase()),
  ]);
  // Account for just-dropped rows being eligible to be re-added under the new desc.
  for (const n of dropped) existingNames.delete(n.toLowerCase());

  const toAdd = (parsed.add ?? [])
    .filter((c) => c?.name?.trim() && !existingNames.has(c.name.trim().toLowerCase()))
    .slice(0, 5)
    .map((c) => ({
      user_id: userId,
      name: c.name.trim(),
      notes: c.description?.trim() || null,
      domain: cleanDomain(c.domain),
      layer: 'giant',
      added_by: 'system',
      status: 'active',
    }));

  let added: string[] = [];
  if (toAdd.length > 0) {
    const { error: insErr } = await db.from('competitors').insert(toAdd);
    if (insErr) throw insErr;
    added = toAdd.map((c) => c.name);
  }

  return { skipped: false, dropped, added };
}
