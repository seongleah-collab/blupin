import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyUser } from '@/lib/push/notify';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  try {
    const stamp = new Date().toLocaleTimeString();
    const result = await notifyUser(user.id, {
      title: `blupin test ping · ${stamp}`,
      body: 'notifications are working — we’ll ping you when something real moves.',
      url: '/feed',
      // unique tag per send so macOS/Chrome doesn't dedupe banners.
      tag: `blupin-test-${Date.now()}`,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[push/test]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
