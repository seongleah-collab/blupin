import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  try {
    // Step 1: ingest
    const ingestRes = await fetch(`${baseUrl}/api/ingest/producthunt`, {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const ingestData = await ingestRes.json();

    // Step 2: classify
    const classifyRes = await fetch(`${baseUrl}/api/classify`, {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const classifyData = await classifyRes.json();

    return NextResponse.json({
      ok: true,
      ingested: ingestData,
      classified: classifyData,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}