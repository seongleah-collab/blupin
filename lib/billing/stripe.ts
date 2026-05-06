import Stripe from 'stripe';

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('missing STRIPE_SECRET_KEY env var');
  cached = new Stripe(key);
  return cached;
}
