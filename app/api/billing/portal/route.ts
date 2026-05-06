import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/billing/stripe';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: 'no subscription found' }, { status: 404 });
  }

  const origin = new URL(req.url).origin;
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/settings/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[billing/portal]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
