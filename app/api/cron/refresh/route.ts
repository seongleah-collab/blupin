import { NextRequest, NextResponse } from 'next/server';
import { ingestProductHunt } from '@/lib/ingest/producthunt';
import { classifyPendingEvents } from '@/lib/classify/events';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = process.env.BLUPIN_TEST_USER_ID;
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: 'BLUPIN_TEST_USER_ID not set' },
      { status: 500 }
    );
  }

  try {
    // Step 1: ingest
    const ingested = await ingestProductHunt(userId, 48);

    // Step 2: classify
    const classified = await classifyPendingEvents(userId, 25);

    return NextResponse.json({
      ok: true,
      ingested,
      classified,
      ranAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[cron/refresh]', err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}