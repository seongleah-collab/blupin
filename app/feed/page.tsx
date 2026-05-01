'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar, { ConversationListItem, SidebarUser } from '../chat/Sidebar';
import Sparkline, { SparklinePoint } from '../components/Sparkline';
import CompetitorLogo from '../components/CompetitorLogo';

type FeedEvent = {
  id: string;
  potential_competitor_name: string | null;
  title: string;
  summary: string | null;
  recommended_action: string | null;
  threat_level: 'high' | 'medium' | 'low' | string | null;
  relevance_score: number | null;
  source: string;
  source_url: string | null;
  source_external_url: string | null;
  source_score: number | null;
  source_comment_count: number | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  og_site_name: string | null;
  published_at: string | null;
  classified_at: string | null;
  niche_match: boolean | null;
  event_type: string | null;
};

// The timestamp shown on each card represents when blupin surfaced the
// event to the user (classified_at), not the upstream source's publish
// time — falls back to published_at if the row is missing classified_at.
function notifiedAt(e: { classified_at: string | null; published_at: string | null }): string | null {
  return e.classified_at ?? e.published_at;
}

const SOURCE_LABELS: Record<string, string> = {
  product_hunt: 'Product Hunt',
  hacker_news: 'Hacker News',
  reddit: 'Reddit',
};

function sourceLabel(s: string): string {
  return SOURCE_LABELS[s] ?? s.replace(/_/g, ' ');
}

// parses the verdict prefix the classifier puts at the start of every
// recommended_action ("worry about this", "keep an eye on this",
// "you can ignore this") and returns the rest of the sentence so the
// UI can render the verdict as a colored pill instead of inline prose.
type Verdict = 'worry' | 'watch' | 'ignore';
function parseVerdict(action: string | null): { kind: Verdict | null; rest: string } {
  if (!action) return { kind: null, rest: '' };
  const trimmed = action.trim();
  const lower = trimmed.toLowerCase();
  const strip = (re: RegExp) => trimmed.replace(re, '').replace(/^[—\-,:.\s]+/, '').trim();
  if (lower.startsWith('worry about this')) return { kind: 'worry', rest: strip(/^worry about this/i) };
  if (lower.startsWith('keep an eye on this')) return { kind: 'watch', rest: strip(/^keep an eye on this/i) };
  if (lower.startsWith('you can ignore this')) return { kind: 'ignore', rest: strip(/^you can ignore this/i) };
  return { kind: null, rest: trimmed };
}

function VerdictBadge({ kind }: { kind: Verdict }) {
  const styles = {
    worry: {
      wrap: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
      dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]',
      label: 'worry about this',
    },
    watch: {
      wrap: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
      dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]',
      label: 'keep an eye on this',
    },
    ignore: {
      wrap: 'bg-neutral-500/10 border-neutral-500/30 text-neutral-600 dark:text-neutral-400',
      dot: 'bg-neutral-500',
      label: 'you can ignore this',
    },
  }[kind];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold tracking-wide ${styles.wrap}`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${styles.dot}`} aria-hidden />
      {styles.label}
    </span>
  );
}

// horizontal chip row used inline in the header. multi-select; click
// to toggle. no label — the chips speak for themselves.
function InlineFilterChips({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    <>
      {options.map((opt) => {
        const active = selected.has(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`px-3 h-8 rounded-full text-[12px] font-medium transition-colors ${
              active
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </>
  );
}

// chip group used inside the filters popover. multi-select; clicking
// a chip toggles it. label is the section heading.
// pretty domain for the external link badge — e.g. "techcrunch.com"
function prettyHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

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

// Date + time stamp shown on every event card. Today's events show
// "today, 3:42 PM"; yesterday's show "yesterday, 3:42 PM"; everything
// older shows "Apr 19, 3:42 PM" (with year if not the current year).
function dateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return `today, ${time}`;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `yesterday, ${time}`;
  const sameYear = d.getFullYear() === now.getFullYear();
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
  return `${date}, ${time}`;
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
  // multi-select filters across severity / source / type. empty Set
  // means "no filter for this category" (i.e. show all).
  const [severityFilter, setSeverityFilter] = useState<Set<'high' | 'medium' | 'low'>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [regenerating, setRegenerating] = useState(false);

  async function regenerateFeed() {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/feed/regenerate', { method: 'POST' });
      // Even if regenerate errored, refetch — partial progress may still
      // have classified some rows.
      const eventsRes = await fetch('/api/events');
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events ?? []);
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('[regenerate]', data?.error ?? res.status);
      }
    } catch (err) {
      console.error('[regenerate] network error', err);
    } finally {
      setRegenerating(false);
    }
  }

  useEffect(() => {
    if (!filtersOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!filtersRef.current?.contains(e.target as Node)) setFiltersOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFiltersOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  const activeFilterCount =
    severityFilter.size + sourceFilter.size + typeFilter.size;
  // tracks which event ids we've already kicked off an unfurl fetch for
  // in this session, so re-expanding doesn't re-hit the API.
  const [unfurled, setUnfurled] = useState<Set<string>>(new Set());
  // per-competitor activity series cache (keyed by lowercase name).
  const [activity, setActivity] = useState<Record<string, SparklinePoint[]>>({});
  // inline-reader cache (keyed by event id). undefined = not loaded,
  // null = load failed, object = loaded article.
  type ReaderArticle = {
    title: string | null;
    byline: string | null;
    excerpt: string | null;
    contentHtml: string;
    siteName: string | null;
  };
  const [articles, setArticles] = useState<Record<string, ReaderArticle | null>>({});
  const [loadingArticle, setLoadingArticle] = useState<Set<string>>(new Set());
  const [openArticleId, setOpenArticleId] = useState<string | null>(null);

  function toggleReader(id: string) {
    if (openArticleId === id) {
      setOpenArticleId(null);
      return;
    }
    setOpenArticleId(id);
    if (articles[id] !== undefined || loadingArticle.has(id)) return;
    setLoadingArticle((prev) => new Set(prev).add(id));
    fetch(`/api/events/${id}/article`)
      .then(async (r) => (r.ok ? r.json() : { article: null }))
      .then((data) => {
        setArticles((prev) => ({ ...prev, [id]: data.article ?? null }));
      })
      .catch(() => setArticles((prev) => ({ ...prev, [id]: null })))
      .finally(() => {
        setLoadingArticle((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      });
  }

  function loadActivity(name: string) {
    const key = name.toLowerCase();
    if (activity[key]) return;
    fetch(`/api/competitors/${encodeURIComponent(name)}/activity`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.series) return;
        setActivity((prev) => ({ ...prev, [key]: data.series }));
      })
      .catch(() => {});
  }

  function expandEvent(id: string) {
    const isOpen = expandedId === id;
    setExpandedId(isOpen ? null : id);
    if (isOpen) return;

    // lazy unfurl: if this event has no og data yet, fetch it. on
    // success, patch the in-memory row so the preview card renders
    // without a refresh.
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    // kick off the activity sparkline fetch in parallel with unfurl
    if (ev.potential_competitor_name) loadActivity(ev.potential_competitor_name);

    // Also call unfurl when the external URL is still a Product Hunt
    // click-tracker — the backend will resolve it to the real product
    // domain even if og data is already cached.
    const needsPHResolve = (() => {
      if (!ev.source_external_url) return false;
      try {
        const u = new URL(ev.source_external_url);
        return u.hostname.endsWith('producthunt.com') && u.pathname.startsWith('/r/');
      } catch {
        return false;
      }
    })();

    if (unfurled.has(id) || ((ev.og_image_url || ev.og_description) && !needsPHResolve)) return;
    if (!ev.source_url && !ev.source_external_url) return;

    setUnfurled((prev) => new Set(prev).add(id));
    fetch(`/api/events/${id}/unfurl`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setEvents((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  og_title: data.og_title ?? e.og_title,
                  og_description: data.og_description ?? e.og_description,
                  og_image_url: data.og_image_url ?? e.og_image_url,
                  og_site_name: data.og_site_name ?? e.og_site_name,
                  source_external_url: data.source_external_url ?? e.source_external_url,
                }
              : e
          )
        );
      })
      .catch(() => {});
  }

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
    return events.filter((e) => {
      if (severityFilter.size > 0) {
        const sev = severityFromLevel(e.threat_level, e.relevance_score);
        if (!severityFilter.has(severityLabel(sev))) return false;
      }
      if (sourceFilter.size > 0 && !sourceFilter.has(e.source)) return false;
      if (typeFilter.size > 0 && (!e.event_type || !typeFilter.has(e.event_type))) return false;
      return true;
    });
  }, [events, severityFilter, sourceFilter, typeFilter]);

  // surface only the source / type values that actually appear in this
  // user's events — no need to show "Reddit" if they have no Reddit data.
  const availableSources = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) s.add(e.source);
    return Array.from(s);
  }, [events]);
  const availableTypes = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) if (e.event_type) s.add(e.event_type);
    return Array.from(s);
  }, [events]);

  const grouped = useMemo(() => {
    const m = new Map<Group, FeedEvent[]>();
    for (const e of filtered) {
      const g = groupOf(notifiedAt(e));
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(e);
    }
    return m;
  }, [filtered]);

  return (
    <div className="relative flex h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 overflow-hidden">
      <div aria-hidden className="glass-ambient">
        <span className="orb" />
      </div>
      <div className="relative z-10 flex flex-1 min-w-0">
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
        <header className="px-8 pt-6 pb-4 flex items-center justify-end gap-2 flex-wrap" ref={filtersRef}>
          {/* inline filter chips — appear to the left of the filters
              button when toggled open. severity always shows; source
              and type only show when there's more than one option. */}
          {filtersOpen && (
            <>
              <InlineFilterChips
                options={[
                  { value: 'high', label: 'high' },
                  { value: 'medium', label: 'medium' },
                  { value: 'low', label: 'low' },
                ]}
                selected={severityFilter}
                onToggle={(v) => setSeverityFilter((s) => toggle(s, v as 'high' | 'medium' | 'low'))}
              />
              {availableSources.length > 1 && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-700">·</span>
                  <InlineFilterChips
                    options={availableSources.map((s) => ({
                      value: s,
                      label: SOURCE_LABELS[s] ?? s.replace(/_/g, ' '),
                    }))}
                    selected={sourceFilter}
                    onToggle={(v) => setSourceFilter((s) => toggle(s, v))}
                  />
                </>
              )}
              {availableTypes.length > 1 && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-700">·</span>
                  <InlineFilterChips
                    options={availableTypes.map((t) => ({
                      value: t,
                      label: t.replace(/_/g, ' '),
                    }))}
                    selected={typeFilter}
                    onToggle={(v) => setTypeFilter((s) => toggle(s, v))}
                  />
                </>
              )}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSeverityFilter(new Set());
                    setSourceFilter(new Set());
                    setTypeFilter(new Set());
                  }}
                  className="text-[12px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors px-2"
                >
                  clear
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-medium transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white/25 dark:bg-neutral-900/30 text-[11px] tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={regenerateFeed}
            disabled={regenerating}
            aria-label="regenerate feed"
            title="regenerate feed — re-score events against your current company description"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-medium bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={regenerating ? 'animate-spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {regenerating ? 'regenerating…' : 'regenerate'}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-8 pb-12">
          {loading ? (
            <div className="text-sm text-neutral-400 dark:text-neutral-500 py-12">loading…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl glass-pill-card p-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
              {activeFilterCount === 0 ? 'nothing yet.' : 'no events match these filters.'}
            </div>
          ) : (
            <div className="space-y-8">
              {GROUP_ORDER.filter((g) => grouped.has(g)).map((g) => (
                <section key={g}>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-3">
                    {g}
                  </div>
                  <ul className="space-y-4">
                    {grouped.get(g)!.map((e) => {
                      const sev = severityFromLevel(e.threat_level, e.relevance_score);
                      const hue = severityHue(sev);
                      const isOpen = expandedId === e.id;
                      return (
                        <li key={e.id}>
                          <div className="px-1 mb-1.5 text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
                            {dateTime(notifiedAt(e))}
                          </div>
                          <div className="rounded-2xl glass-pill-card overflow-hidden">
                          <button
                            type="button"
                            onClick={() => expandEvent(e.id)}
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
                            {e.potential_competitor_name && (
                              <CompetitorLogo
                                name={e.potential_competitor_name}
                                /* only PH events expose the actual company
                                   homepage in source_external_url; HN/Reddit
                                   external URLs point at third-party articles,
                                   so let the logo component fall back to its
                                   name-based slug for those. */
                                domain={
                                  e.source === 'product_hunt'
                                    ? prettyHost(e.source_external_url) ?? undefined
                                    : undefined
                                }
                                size={36}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                                {cleanTitle(e.title)}
                              </div>
                              <div className="mt-1 flex items-baseline gap-2 flex-wrap text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                                  {e.potential_competitor_name ?? 'unknown'}
                                </span>
                                <span className="uppercase tracking-wider">{e.source}</span>
                              </div>
                              {e.summary && !isOpen && (
                                <div className="mt-2 text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
                                  {e.summary}
                                </div>
                              )}
                            </div>
                          </button>

                          {isOpen && (() => {
                            const { kind: verdictKind, rest: verdictRest } = parseVerdict(e.recommended_action);
                            return (
                            <div className="px-5 pb-5 pt-4 space-y-4 border-t border-neutral-200/70 dark:border-neutral-800">
                              {verdictKind && (
                                <div>
                                  <VerdictBadge kind={verdictKind} />
                                </div>
                              )}
                              {e.summary && (
                                <p className="text-[14px] text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                  {e.summary}
                                </p>
                              )}
                              {verdictRest && (
                                <p className="text-[14px] font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
                                  {verdictRest}
                                </p>
                              )}

                              {/* unfurl preview — image + og description for the
                                  external article when we have one. only renders
                                  if Phase-2 unfurl populated og_* columns. */}
                              {(e.og_image_url || e.og_description) && (e.source_external_url || e.source_url) && (
                                <a
                                  href={e.source_external_url ?? e.source_url ?? '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 hover:bg-white/80 dark:hover:bg-neutral-900 transition-colors overflow-hidden"
                                >
                                  {e.og_image_url && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={e.og_image_url}
                                      alt=""
                                      className="w-28 h-28 object-cover shrink-0"
                                      loading="lazy"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0 py-2.5 pr-3">
                                    {e.og_site_name && (
                                      <div className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                                        {e.og_site_name}
                                      </div>
                                    )}
                                    {e.og_title && (
                                      <div className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug">
                                        {e.og_title}
                                      </div>
                                    )}
                                    {e.og_description && (
                                      <div className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                                        {e.og_description}
                                      </div>
                                    )}
                                  </div>
                                </a>
                              )}

                              {/* per-competitor activity sparkline — 30-day
                                  event volume for the named competitor. shows
                                  whether they're heating up or quiet. */}
                              {e.potential_competitor_name && (() => {
                                const key = e.potential_competitor_name.toLowerCase();
                                const series = activity[key];
                                if (!series) return null;
                                const total = series.reduce((s, p) => s + p.count, 0);
                                if (total === 0) return null;
                                return (
                                  <Link
                                    href={`/competitor/${encodeURIComponent(e.potential_competitor_name)}`}
                                    className="flex items-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/60 hover:bg-white/80 dark:hover:bg-neutral-900 transition-colors px-4 py-3"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        {e.potential_competitor_name} · last 30 days
                                      </div>
                                      <div className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 tabular-nums">
                                        {total} {total === 1 ? 'event' : 'events'}
                                      </div>
                                    </div>
                                    <div className="text-neutral-700 dark:text-neutral-300">
                                      <Sparkline series={series} width={140} height={32} />
                                    </div>
                                  </Link>
                                );
                              })()}

                              {/* source row — discussion link, external article
                                  link (if any), per-source engagement metrics. */}
                              <div className="flex items-center flex-wrap gap-2 text-[12px]">
                                {e.source_url && (
                                  <a
                                    href={e.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                  >
                                    view on {sourceLabel(e.source)}
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M7 17L17 7" />
                                      <path d="M7 7h10v10" />
                                    </svg>
                                  </a>
                                )}
                                {e.source_external_url && prettyHost(e.source_external_url) && (
                                  <a
                                    href={e.source_external_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                  >
                                    {prettyHost(e.source_external_url)}
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M7 17L17 7" />
                                      <path d="M7 7h10v10" />
                                    </svg>
                                  </a>
                                )}
                                {e.source_score != null && (
                                  <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 tabular-nums">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="18 15 12 9 6 15" />
                                    </svg>
                                    {e.source_score.toLocaleString()}
                                  </span>
                                )}
                                {e.source_comment_count != null && (
                                  <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 tabular-nums">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    {e.source_comment_count.toLocaleString()}
                                  </span>
                                )}
                                {(e.source_external_url || e.source_url) && (
                                  <button
                                    type="button"
                                    onClick={() => toggleReader(e.id)}
                                    className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full transition-colors ${
                                      openArticleId === e.id
                                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                    }`}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                    {openArticleId === e.id ? 'close reader' : 'read here'}
                                  </button>
                                )}
                                <Link
                                  href={`/chat?event=${e.id}`}
                                  className="ml-auto inline-flex items-center gap-1.5 h-8 px-4 rounded-full font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
                                >
                                  ask blupin
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                  </svg>
                                </Link>
                              </div>

                              {/* inline reader pane — opens when "read here"
                                  is clicked. fetched lazily, scoped to the
                                  card so multiple readers can be open. */}
                              {openArticleId === e.id && (
                                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 max-h-[60vh] overflow-y-auto">
                                  {loadingArticle.has(e.id) ? (
                                    <div className="text-[13px] text-neutral-500 dark:text-neutral-400">loading article…</div>
                                  ) : articles[e.id] === null ? (
                                    <div className="text-[13px] text-neutral-500 dark:text-neutral-400">
                                      couldn&apos;t extract this article — try{' '}
                                      <a
                                        href={e.source_external_url ?? e.source_url ?? '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="underline"
                                      >
                                        opening the source
                                      </a>
                                      .
                                    </div>
                                  ) : articles[e.id] ? (
                                    <article className="reader-content">
                                      {articles[e.id]!.title && (
                                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1 leading-tight">
                                          {articles[e.id]!.title}
                                        </h2>
                                      )}
                                      <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-4 flex flex-wrap gap-x-3">
                                        {articles[e.id]!.siteName && <span>{articles[e.id]!.siteName}</span>}
                                        {articles[e.id]!.byline && <span>{articles[e.id]!.byline}</span>}
                                      </div>
                                      <div
                                        className="text-[14px] text-neutral-700 dark:text-neutral-300 leading-relaxed space-y-3"
                                        dangerouslySetInnerHTML={{ __html: articles[e.id]!.contentHtml }}
                                      />
                                    </article>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                          })()}
                          </div>
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
    </div>
  );
}
