'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SectionHeader, Status, type SaveState } from '../_components/SectionHeader';

export default function CompanyPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_companies')
        .select('company_name, company_description')
        .eq('id', user.id)
        .single();
      if (cancelled) return;
      if (data) {
        setCompanyName(data.company_name ?? '');
        setCompanyDescription(data.company_description ?? '');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState('saving');
    setError(null);
    try {
      const res = await fetch('/api/onboarding/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName.trim(),
          description: companyDescription.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `failed: ${res.status}`);
      setState('saved');
      setTimeout(() => setState('idle'), 2000);
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  }

  return (
    <section>
      <SectionHeader
        title="company"
        description="this is the lens blupin uses for every threat call."
        status={<Status state={state} error={error} />}
      />
      {loading ? (
        <div className="text-[13px] text-neutral-500 dark:text-neutral-400">loading…</div>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-[12px] text-neutral-500 dark:text-neutral-400 mb-1.5">
              name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[14px] focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
              placeholder="e.g. noted"
              required
            />
          </div>
          <div>
            <label className="block text-[12px] text-neutral-500 dark:text-neutral-400 mb-1.5">
              description
            </label>
            <textarea
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[14px] focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors resize-none leading-relaxed"
              placeholder="what does your product do, and for whom?"
              required
            />
          </div>
          <div className="flex justify-start pt-1">
            <button
              type="submit"
              disabled={state === 'saving'}
              className="px-3.5 py-1.5 rounded-md bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 text-[13px] font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              save company
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
