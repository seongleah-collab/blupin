'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SectionHeader } from '../_components/SectionHeader';

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setEmail(user?.email ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <section>
      <SectionHeader title="account" description="your blupin login." />
      <div className="space-y-5">
        <div>
          <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-1">email</div>
          <div className="text-[14px] text-neutral-900 dark:text-neutral-100">{email ?? '—'}</div>
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
