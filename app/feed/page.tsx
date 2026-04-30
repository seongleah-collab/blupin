'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fraunces } from 'next/font/google';
import { createClient } from '@/lib/supabase/client';
import Sidebar, { ConversationListItem, SidebarUser } from '../chat/Sidebar';

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
});

type FeedEvent = {
  id: string;
  potential_competitor_name: string | null;
  title: string;
  summary: string | null;
  recommended_action: string | null;
  threat_level: 'high' | 'medium' | 'low' | string | null;
  relevance_score: number | null;
  source: string;
  published_at: string | null;
  niche_match: boolean | null;
  event_type: string | null;
};

const GROUP_ORDER = ['today', 'yesterday', 'this week', 'earlier this month', 'older'] as const;
type Group = (typeof GROUP_ORDER)[number];

function groupOf(iso: string | null): Group {
  if (!iso) return 'older';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'today';
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'yesterday';
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days < 7) return 'this week';
  if (days < 30) return 'earlier this month';
  return 'older';
}

function cleanTitle(title: string): string {
  // strip leading subreddit prefixes (r/SideProject:, r/SaaS -, etc.)
  // — they're already implied by the source pill below the title.
  return title.replace(/^r\/[A-Za-z0-9_]+\s*[:\-–—|·]?\s*/i, '').trim();
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${Math.max(min, 1)}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function severityFromLevel(level: string | null, score: number | null): number {
  // map threat_level + relevance_score to a 1-10 dot intensity
  const base =
    level === 'high' ? 8 : level === 'medium' ? 5 : level === 'low' ? 3 : 4;
  const bump = score == null ? 0 : Math.round((score - 0.5) * 4);
  return Math.min(10, Math.max(1, base + bump));
}

// matches the hue scale chat uses for [severity:N] markers — green
// at low end → red at high end, so the feed and chat speak the same
// visual language.
function severityHue(n: number): number {
  const clamped = Math.max(1, Math.min(10, n));
  return 50 - ((clamped - 1) * 50) / 9;
}

function severityLabel(n: number): 'high' | 'medium' | 'low' {
  if (n >= 7) return 'high';
  if (n >= 4) return 'medium';
  return 'low';
}

export default function FeedPage() {
  const router = useRouter();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserEmail(user.email ?? null);
      const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
      const metaName = (meta.full_name || meta.name || '').split(' ')[0]?.toLowerCase();
      setFirstName(metaName || null);
    });

    fetch('/api/conversations')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.conversations) setConversations(d.conversations);
      })
      .catch(() => {});

    fetch('/api/events')
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => {
        setEvents(d.events ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((e) => {
      const sev = severityFromLevel(e.threat_level, e.relevance_score);
      return severityLabel(sev) === filter;
    });
  }, [events, filter]);

  const grouped = useMemo(() => {
    const m = new Map<Group, FeedEvent[]>();
    for (const e of filtered) {
      const g = groupOf(e.published_at);
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(e);
    }
    return m;
  }, [filtered]);

  return (
    <div className="flex h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Sidebar
        conversations={conversations}
        activeId={null}
        collapsed={sidebarCollapsed}
        user={{ email: userEmail, displayName: firstName } satisfies SidebarUser}
        activeView="feed"
        onToggle={() => setSidebarCollapsed((v) => !v)}
        onNewChat={() => router.push('/chat')}
        onSelect={(id) => router.push(`/chat?conversation=${id}`)}
        onDelete={() => {
          /* feed page doesn't manage convo deletion */
        }}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="px-8 pt-6 pb-4 flex items-end justify-between gap-4">
          <h1 className="text-3xl md:text-4xl text-neutral-900 dark:text-neutral-100 leading-tight">
            <span className={`${fraunces.className} italic font-medium`}>feed</span>.
          </h1>

          <div className="flex items-center gap-1.5 text-[12px]">
            {(['all', 'high', 'medium', 'low'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 h-8 rounded-full font-medium transition-colors ${
                  filter === f
                    ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 pb-12">
          {loading ? (
            <div className="text-sm text-neutral-400 dark:text-neutral-500 py-12">loading…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl glass-card dark:bg-neutral-900 dark:shadow-none p-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
              {filter === 'all' ? 'nothing yet.' : `no ${filter}-severity events.`}
            </div>
          ) : (
            <div className="space-y-8 max-w-4xl">
              {GROUP_ORDER.filter((g) => grouped.has(g)).map((g) => (
                <section key={g}>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-3">
                    {g}
                  </div>
                  <ul className="space-y-3">
                    {grouped.get(g)!.map((e) => {
                      const sev = severityFromLevel(e.threat_level, e.relevance_score);
                      const hue = severityHue(sev);
                      const isOpen = expandedId === e.id;
                      return (
                        <li
                          key={e.id}
                          className="rounded-2xl glass-card dark:bg-neutral-900 dark:shadow-none border border-transparent dark:border-neutral-800 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedId(isOpen ? null : e.id)}
                            className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-white/40 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <span
                              className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shrink-0"
                              style={{
                                backgroundColor: `hsla(${hue}, 88%, 52%, 0.1)`,
                                borderColor: `hsla(${hue}, 88%, 52%, 0.3)`,
                              }}
                              aria-label={`${severityLabel(sev)} severity, ${sev} of 10`}
                            >
                              <span
                                className="inline-block w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: `hsl(${hue}, 88%, 52%)`,
                                  boxShadow: `0 0 8px hsla(${hue}, 88%, 52%, 0.8)`,
                                }}
                                aria-hidden
                              />
                              <span
                                className="text-[11px] font-semibold tabular-nums tracking-wide"
                                style={{ color: `hsl(${hue}, 70%, 32%)` }}
                              >
                                {sev}/10
                              </span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                                {cleanTitle(e.title)}
                              </div>
                              <div className="mt-1 flex items-baseline gap-2 flex-wrap text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                                  {e.potential_competitor_name ?? 'unknown'}
                                </span>
                                <span className="uppercase tracking-wider">{e.source}</span>
                                <span className="ml-auto tabular-nums">
                                  {relativeTime(e.published_at)}
                                </span>
                              </div>
                              {e.summary && !isOpen && (
                                <div className="mt-2 text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                                  {e.summary}
                                </div>
                              )}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="px-5 pb-5 pt-4 space-y-3 border-t border-neutral-200/70 dark:border-neutral-800">
                              {e.summary && (
                                <p className="text-[14px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                  {e.summary}
                                </p>
                              )}
                              {e.recommended_action && (
                                <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
                                  {e.recommended_action}
                                </p>
                              )}
                              <Link
                                href={`/chat?event=${e.id}`}
                                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
                              >
                                ask blupin
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                  <polyline points="12 5 19 12 12 19" />
                                </svg>
                              </Link>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
