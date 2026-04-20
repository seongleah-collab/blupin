import { NextResponse } from 'next/server';
import { ingestProductHunt } from '@/lib/ingest/producthunt';

export const runtime = 'nodejs';

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
    const result = await ingestProductHunt(userId, 48);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[ingest/producthunt]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;