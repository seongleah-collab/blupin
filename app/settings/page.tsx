'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fraunces } from 'next/font/google';
import { createClient } from '@/lib/supabase/client';
import Wordmark from '@/app/components/Wordmark';

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
});

type CompetitorRow = {
  id: string;
  name: string;
  notes: string | null;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function Status({ state, error }: { state: SaveState; error: string | null }) {
  if (state === 'saving') return <span className="text-[12px] text-neutral-500">saving…</span>;
  if (state === 'saved') return <span className="text-[12px] text-green-600">saved</span>;
  if (state === 'error') return <span className="text-[12px] text-red-600">{error ?? 'error'}</span>;
  return null;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyState, setCompanyState] = useState<SaveState>('idle');
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [competitors, setCompetitors] = useState<Array<Pick<CompetitorRow, 'name' | 'notes'>>>([]);
  const [competitorsState, setCompetitorsState] = useState<SaveState>('idle');
  const [competitorsError, setCompetitorsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      if (cancelled) return;
      setEmail(user.email ?? null);

      const [companyRes, competitorsRes] = await Promise.all([
        supabase
          .from('user_companies')
          .select('company_name, company_description')
          .eq('id', user.id)
          .single(),
        supabase
          .from('competitors')
          .select('id, name, notes')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('name', { ascending: true }),
      ]);

      if (cancelled) return;

      if (companyRes.data) {
        setCompanyName(companyRes.data.company_name ?? '');
        setCompanyDescription(companyRes.data.company_description ?? '');
      }
      setCompetitors(
        (competitorsRes.data ?? []).map((c) => ({
          name: c.name,
          notes: c.notes,
        }))
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    setCompanyState('saving');
    setCompanyError(null);
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
      setCompanyState('saved');
      setTimeout(() => setCompanyState('idle'), 2000);
    } catch (err: any) {
      setCompanyError(err.message);
      setCompanyState('error');
    }
  }

  async function saveCompetitors() {
    setCompetitorsState('saving');
    setCompetitorsError(null);
    try {
      const cleaned = competitors
        .map((c) => ({
          name: c.name.trim(),
          description: (c.notes ?? '').trim(),
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
      setCompetitorsState('saved');
      setTimeout(() => setCompetitorsState('idle'), 2000);
    } catch (err: any) {
      setCompetitorsError(err.message);
      setCompetitorsState('error');
    }
  }

  function updateCompetitor(idx: number, patch: Partial<{ name: string; notes: string | null }>) {
    setCompetitors((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function removeCompetitor(idx: number) {
    setCompetitors((prev) => prev.filter((_, i) => i !== idx));
  }

  function addCompetitor() {
    setCompetitors((prev) => [...prev, { name: '', notes: '' }]);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center">
        <span className="text-sm text-neutral-400">loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="px-6 py-4 flex items-center justify-between border-b border-neutral-100">
        <Link href="/chat" className="flex items-center gap-2">
          <Wordmark className="text-base font-medium tracking-tight text-neutral-900" />
        </Link>
        <Link
          href="/chat"
          className="text-[13px] text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          back to chat
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl mb-2 leading-tight">
          your <span className={`${fraunces.className} italic font-medium`}>settings</span>
        </h1>
        <p className="text-neutral-500 mb-10 text-[14px]">
          update what blupin knows about you and who you&apos;re watching.
        </p>

        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-medium">company</h2>
            <Status state={companyState} error={companyError} />
          </div>
          <p className="text-[13px] text-neutral-500 mb-4">
            this is the lens blupin uses for every threat call.
          </p>
          <form onSubmit={saveCompany} className="space-y-4">
            <div>
              <label className="block text-[12px] uppercase tracking-wide text-neutral-500 mb-1.5">
                name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-[14px] focus:outline-none focus:border-neutral-400 transition-colors"
                placeholder="e.g. noted"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] uppercase tracking-wide text-neutral-500 mb-1.5">
                description
              </label>
              <textarea
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-[14px] focus:outline-none focus:border-neutral-400 transition-colors resize-none leading-relaxed"
                placeholder="what does your product do, and for whom?"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={companyState === 'saving'}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                save company
              </button>
            </div>
          </form>
        </section>

        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-medium">competitors</h2>
            <Status state={competitorsState} error={competitorsError} />
          </div>
          <p className="text-[13px] text-neutral-500 mb-4">
            who blupin actively watches for you. removing one stops it from being scored.
          </p>
          <div className="space-y-3">
            {competitors.length === 0 && (
              <div className="px-4 py-6 rounded-lg border border-dashed border-neutral-200 text-center text-[13px] text-neutral-500">
                no competitors tracked yet.
              </div>
            )}
            {competitors.map((c, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateCompetitor(i, { name: e.target.value })}
                    placeholder="competitor name"
                    className="flex-1 px-3 py-2 rounded-md border border-neutral-200 text-[14px] focus:outline-none focus:border-neutral-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeCompetitor(i)}
                    className="text-[12px] uppercase tracking-wide text-neutral-400 hover:text-red-600 px-2 py-1 transition-colors"
                  >
                    remove
                  </button>
                </div>
                <textarea
                  value={c.notes ?? ''}
                  onChange={(e) => updateCompetitor(i, { notes: e.target.value })}
                  rows={2}
                  placeholder="short note — what they do"
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 text-[13px] text-neutral-700 focus:outline-none focus:border-neutral-400 transition-colors resize-none leading-relaxed"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addCompetitor}
              className="w-full py-2.5 rounded-lg border border-dashed border-neutral-300 text-[13px] text-neutral-600 hover:border-neutral-500 hover:text-neutral-900 transition-colors"
            >
              + add competitor
            </button>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={saveCompetitors}
                disabled={competitorsState === 'saving'}
                className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-[13px] font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                save competitors
              </button>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-lg font-medium mb-3">account</h2>
          <div className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-neutral-500">email</div>
                <div className="text-[14px] text-neutral-900">{email ?? '—'}</div>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-[14px] text-neutral-900">sign out</div>
                <div className="text-[12px] text-neutral-500">end your session on this device.</div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-md border border-neutral-200 text-[13px] text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                sign out
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
