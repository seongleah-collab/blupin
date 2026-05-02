import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('web_push_enabled, min_severity')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    preferences: data ?? { web_push_enabled: true, min_severity: 8 },
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    web_push_enabled?: boolean;
    min_severity?: number;
  };

  const update: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() };
  if (typeof body.web_push_enabled === 'boolean') update.web_push_enabled = body.web_push_enabled;
  if (typeof body.min_severity === 'number') {
    const n = Math.round(body.min_severity);
    if (n < 1 || n > 10) {
      return NextResponse.json({ error: 'min_severity must be 1-10' }, { status: 400 });
    }
    update.min_severity = n;
  }

  const { error } = await supabase
    .from('notification_preferences')
    .upsert(update, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
