import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { classifyPendingEvents } from '@/lib/classify/events';

export const runtime = 'nodejs';
// Classifying ~25 events sequentially takes 25-50 seconds; allow
// enough headroom but cap so a stuck call doesn't hang the dev
// server forever.
export const maxDuration = 60;

// User-scoped re-classify trigger. Called by the "regenerate" button
// in the feed header. Wipes existing classifications (since they
// were scored against the *old* company description) and re-runs
// the classifier against the current profile.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { error: resetErr } = await supabase
    .from('competitor_events')
    .update({ classification_status: 'pending' })
    .eq('user_id', user.id)
    .in('classification_status', ['classified', 'failed']);
  if (resetErr) {
    return NextResponse.json({ error: `reset failed: ${resetErr.message}` }, { status: 500 });
  }

  try {
    const result = await classifyPendingEvents(user.id, 50);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[feed/regenerate]', err);
    return NextResponse.json({ error: err?.message ?? 'classifier failed' }, { status: 500 });
  }
}
