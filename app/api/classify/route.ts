import { NextResponse } from 'next/server';
import { classifyPendingEvents } from '@/lib/classify/events';

export const runtime = 'nodejs';
// Classifier can take 30+ seconds for a batch; let the route run long enough.
export const maxDuration = 60;

async function handle(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const userId = process.env.BLUPIN_TEST_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: 'BLUPIN_TEST_USER_ID not set' }, { status: 500 });
  }

  try {
    const result = await classifyPendingEvents(userId, 25);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[classify]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;