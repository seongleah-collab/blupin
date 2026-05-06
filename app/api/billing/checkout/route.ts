import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/billing/stripe';
import { PLANS, TRIAL_DAYS, priceIdFor, type PlanSlug } from '@/lib/billing/plans';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not authenticated' }, { status: 401 });

  const { plan } = (await req.json()) as { plan: PlanSlug };
  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: 'invalid plan' }, { status: 400 });
  }

  // Reuse the customer if we already created one for this user.
  // Otherwise Stripe Checkout will create one and we'll capture it via webhook.
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing && existing.status === 'active') {
    return NextResponse.json({ error: 'already subscribed' }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceIdFor(plan), quantity: 1 }],
      // The user_id is stamped on the subscription so the webhook can map
      // back to the right Supabase user even when Stripe creates a fresh
      // customer.
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { user_id: user.id, plan },
      },
      // Without this, Stripe lets a trial start with no card on file —
      // which means the trial silently expires instead of converting.
      payment_method_collection: 'always',
      ...(existing?.stripe_customer_id
        ? { customer: existing.stripe_customer_id }
        : { customer_email: user.email ?? undefined }),
      client_reference_id: user.id,
      success_url: `${origin}/onboarding/done?checkout=success`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: 'no checkout url returned' }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[billing/checkout]', err);
    return NextResponse.json({ error: err.message ?? 'checkout failed' }, { status: 500 });
  }
}
