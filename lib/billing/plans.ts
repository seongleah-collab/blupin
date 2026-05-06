// Single source of truth for plan metadata, limits, and Stripe price IDs.
// Used by /pricing UI, checkout, webhook, and gating code.

export type PlanSlug = 'starter' | 'pro' | 'scale';

export type PlanLimits = {
  // Max competitors a user can track. null = unlimited.
  competitors: number | null;
  // Max user-authored chat messages per billing period. null = unlimited.
  chatMessagesPerMonth: number | null;
  // How often we refresh competitor data for users on this plan.
  refresh: 'daily' | 'hourly';
};

export type Plan = {
  slug: PlanSlug;
  name: string;
  priceMonthly: number; // dollars
  tagline: string;
  features: string[];
  limits: PlanLimits;
};

export const PLANS: Record<PlanSlug, Plan> = {
  starter: {
    slug: 'starter',
    name: 'starter',
    priceMonthly: 15,
    tagline: 'for solo founders just getting started',
    features: [
      'track up to 3 competitors',
      'daily refresh',
      'browser push notifications on real threats',
      '50 chat messages per month',
    ],
    limits: { competitors: 3, chatMessagesPerMonth: 50, refresh: 'daily' },
  },
  pro: {
    slug: 'pro',
    name: 'pro',
    priceMonthly: 25,
    tagline: 'for founders shipping fast',
    features: [
      'track up to 10 competitors',
      'hourly refresh',
      'browser push notifications',
      'unlimited chat with the co-pilot',
    ],
    limits: { competitors: 10, chatMessagesPerMonth: null, refresh: 'hourly' },
  },
  scale: {
    slug: 'scale',
    name: 'scale',
    priceMonthly: 49,
    tagline: 'when every move matters',
    features: [
      'unlimited competitors',
      'hourly refresh',
      'browser push notifications',
      'unlimited chat with the co-pilot',
      'priority support — direct line to the founder',
    ],
    limits: { competitors: null, chatMessagesPerMonth: null, refresh: 'hourly' },
  },
};

export const TRIAL_DAYS = 7;

// Resolved at runtime so build-time env doesn't matter.
export function priceIdFor(slug: PlanSlug): string {
  const id =
    slug === 'starter' ? process.env.STRIPE_PRICE_STARTER :
    slug === 'pro' ? process.env.STRIPE_PRICE_PRO :
    process.env.STRIPE_PRICE_SCALE;
  if (!id) throw new Error(`missing STRIPE_PRICE_${slug.toUpperCase()} env var`);
  return id;
}

export function planFromPriceId(priceId: string): PlanSlug | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_SCALE) return 'scale';
  return null;
}

// A subscription "grants access" if it's in one of these statuses.
export const ACTIVE_STATUSES = new Set(['trialing', 'active']);
