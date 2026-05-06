import { SupabaseClient } from '@supabase/supabase-js';
import { ACTIVE_STATUSES, PLANS, type PlanSlug } from './plans';

export type SubscriptionRow = {
  user_id: string;
  plan: PlanSlug;
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export async function getSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id, plan, status, trial_end, current_period_end, cancel_at_period_end')
    .eq('user_id', userId)
    .maybeSingle();
  return data as SubscriptionRow | null;
}

export function hasAccess(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  return ACTIVE_STATUSES.has(sub.status);
}

export function competitorLimitFor(sub: SubscriptionRow | null): number | null {
  if (!sub) return 0;
  return PLANS[sub.plan].limits.competitors;
}

export function chatMessageLimitFor(sub: SubscriptionRow | null): number | null {
  if (!sub) return 0;
  return PLANS[sub.plan].limits.chatMessagesPerMonth;
}

// Count user-authored messages since the start of the current billing period.
// For trialing users we anchor on trial_end - 30d (Stripe doesn't fill
// current_period_end until the trial converts), falling back to the trial
// start if neither is set.
export async function chatMessagesUsedThisPeriod(
  supabase: SupabaseClient,
  userId: string,
  sub: SubscriptionRow
): Promise<number> {
  const periodStart = (() => {
    if (sub.current_period_end) {
      const end = new Date(sub.current_period_end);
      const start = new Date(end);
      start.setMonth(start.getMonth() - 1);
      return start;
    }
    if (sub.trial_end) {
      const end = new Date(sub.trial_end);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return start;
    }
    // Last resort: 30 days back.
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return start;
  })();

  const { count } = await supabase
    .from('conversation_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'user')
    .gte('created_at', periodStart.toISOString());

  return count ?? 0;
}
