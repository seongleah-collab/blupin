'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import CompetitorLogo from '@/app/components/CompetitorLogo';
import { SectionHeader, Status, type SaveState } from '../_components/SectionHeader';

type CompetitorRow = {
  name: string;
  notes: string | null;
  domain: string | null;
};

export default function CompetitorsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [state, setState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('competitors')
        .select('name, notes, domain')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('name', { ascending: true });
      if (cancelled) return;
      setCompetitors(
        (data ?? []).map((c) => ({
          name: c.name,
          notes: c.notes,
          domain: c.domain ?? null,
        }))
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function save() {
    setState('saving');
    setError(null);
    try {
      const cleaned = competitors
        .map((c) => ({
          name: c.name.trim(),
          description: (c.notes ?? '').trim(),
          domain: c.domain ?? undefined,
          addedBy: 'user' as const,
        }))
        .filter((c) => c.name.length > 0);

      const res = await fetch('/api/onboarding/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitors: cleaned }),
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

  function update(idx: number, patch: Partial<CompetitorRow>) {
    setCompetitors((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function remove(idx: number) {
    setCompetitors((prev) => prev.filter((_, i) => i !== idx));
  }

  function add() {
    setCompetitors((prev) => [...prev, { name: '', notes: '', domain: null }]);
  }

  return (
    <section>
      <SectionHeader
        title="competitors"
        description="who blupin actively watches for you. removing one stops it from being scored."
        status={<Status state={state} error={error} />}
      />
      {loading ? (
        <div className="text-[13px] text-neutral-500 dark:text-neutral-400">loading…</div>
      ) : (
        <>
          {competitors.length === 0 ? (
            <div className="px-4 py-6 rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800 text-center text-[13px] text-neutral-500 dark:text-neutral-400">
              no competitors tracked yet.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-900 border-y border-neutral-100 dark:border-neutral-900">
              {competitors.map((c, i) => (
                <div key={i} className="group flex items-start gap-3 py-3">
                  <div className="pt-0.5">
                    <CompetitorLogo name={c.name} domain={c.domain ?? undefined} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => update(i, { name: e.target.value })}
                      placeholder="competitor name"
                      className="w-full text-[14px] font-medium bg-transparent border-0 px-0 py-0 focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                    <textarea
                      value={c.notes ?? ''}
                      onChange={(e) => update(i, { notes: e.target.value })}
                      rows={1}
                      placeholder="short note — what they do"
                      className="w-full text-[13px] text-neutral-500 dark:text-neutral-400 bg-transparent border-0 px-0 py-0 focus:outline-none resize-none leading-relaxed placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label="remove competitor"
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-all p-1 -mr-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M3 3l8 8M11 3l-8 8" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={add}
            className="w-full mt-3 py-2 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-[13px] text-neutral-600 dark:text-neutral-300 hover:border-neutral-500 dark:hover:border-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            + add competitor
          </button>
          <div className="flex justify-start pt-4">
            <button
              type="button"
              onClick={save}
              disabled={state === 'saving'}
              className="px-3.5 py-1.5 rounded-md bg-neutral-900 dark:bg-neutral-200 text-white dark:text-neutral-900 text-[13px] font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              save competitors
            </button>
          </div>
        </>
      )}
    </section>
  );
}
