'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SectionHeader } from '../_components/SectionHeader';

type Sub = {
  plan: 'starter' | 'pro' | 'scale';
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function statusLabel(sub: Sub): string {
  if (sub.cancel_at_period_end) return `canceling on ${formatDate(sub.current_period_end)}`;
  if (sub.status === 'trialing') return `trialing — ends ${formatDate(sub.trial_end)}`;
  if (sub.status === 'active') return `renews ${formatDate(sub.current_period_end)}`;
  return sub.status;
}

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [sub, setSub] = useState<Sub | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setEmail(user?.email ?? null);
      if (!user) { setSubLoading(false); return; }
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, trial_end, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setSub(data as Sub | null);
      setSubLoading(false);
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  async function openPortal() {
    setPortalBusy(true);
    setPortalError(null);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? `failed: ${res.status}`);
      window.location.href = data.url;
    } catch (err: any) {
      setPortalError(err.message);
      setPortalBusy(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <section>
      <SectionHeader title="account" description="your blupin login and billing." />
      <div className="space-y-5">
        <div>
          <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-1">email</div>
          <div className="text-[14px] text-neutral-900 dark:text-neutral-100">{email ?? '—'}</div>
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900">
          <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-2">billing</div>
          {subLoading ? (
            <div className="text-[13px] text-neutral-500 dark:text-neutral-400">loading…</div>
          ) : sub ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] text-neutral-900 dark:text-neutral-100 capitalize">
                  {sub.plan} plan
                </div>
                <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {statusLabel(sub)}
                </div>
              </div>
              <button
                type="button"
                onClick={openPortal}
                disabled={portalBusy}
                className="px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-[13px] hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors disabled:opacity-40"
              >
                {portalBusy ? 'opening…' : 'manage billing'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] text-neutral-900 dark:text-neutral-100">no active plan</div>
                <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  pick a plan to unlock the co-pilot.
                </div>
              </div>
              <Link
                href="/pricing"
                className="px-3 py-1.5 rounded-md bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 text-[13px] font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                see plans
              </Link>
            </div>
          )}
          {portalError && (
            <div className="text-[12px] text-red-600 mt-2">{portalError}</div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-900">
          <div>
            <div className="text-[14px] text-neutral-900 dark:text-neutral-100">sign out</div>
            <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">end your session on this device.</div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900/40 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            sign out
          </button>
        </div>
      </div>
    </section>
  );
}
