import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { stripe } from '@/lib/billing/stripe';
import { planFromPriceId } from '@/lib/billing/plans';

export const runtime = 'nodejs';

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function syncSubscription(sub: Stripe.Subscription) {
  // The user_id was stamped on subscription_data.metadata at checkout.
  const userId = sub.metadata?.user_id;
  if (!userId) {
    console.warn('[billing/webhook] subscription has no user_id metadata', sub.id);
    return;
  }

  const priceId = sub.items.data[0]?.price.id;
  const plan = priceId ? planFromPriceId(priceId) : null;
  if (!plan) {
    console.warn('[billing/webhook] unknown price id', priceId);
    return;
  }

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  // Stripe may report current_period_end at the subscription or item level
  // depending on API version. Fall back to the first item if needed.
  const periodEnd =
    (sub as unknown as { current_period_end?: number }).current_period_end
    ?? sub.items.data[0]?.current_period_end
    ?? null;

  const db = admin();
  const { error } = await db.from('subscriptions').upsert(
    {
      user_id: userId,
      plan,
      status: sub.status,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) console.error('[billing/webhook] upsert failed', error);
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: 'missing signature or secret' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    console.error('[billing/webhook] signature verification failed', err.message);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        // Ignore everything else — checkout.session.completed, invoice.*, etc.
        // are not load-bearing for our model right now.
        break;
    }
  } catch (err: any) {
    console.error('[billing/webhook] handler error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
