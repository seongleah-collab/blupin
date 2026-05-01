'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fraunces } from 'next/font/google';
import { createClient } from '@/lib/supabase/client';
import Sidebar, { ConversationListItem, SidebarUser } from '@/app/chat/Sidebar';
import Sparkline, { SparklinePoint } from '@/app/components/Sparkline';
import CompetitorLogo from '@/app/components/CompetitorLogo';
import { severityFromLevel, severityHue } from '@/lib/severity';

type Profile = {
  name: string;
  domain: string | null;
  website: string | null;
  tagline: string | null;
  description: string | null;
  topics: string[];
  ogImage: string | null;
  isTracked: boolean;
};

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
});

type Event = {
  id: string;
  title: string;
  summary: string | null;
  recommended_action: string | null;
  threat_level: string | null;
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
  event_type: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  product_hunt: 'Product Hunt',
  hacker_news: 'Hacker News',
  reddit: 'Reddit',
};

function sourceLabel(s: string): string {
  return SOURCE_LABELS[s] ?? s.replace(/_/g, ' ');
}

function prettyHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
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

export default function CompetitorPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = use(params);
  const decodedName = decodeURIComponent(name);
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [series, setSeries] = useState<SparklinePoint[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      .then((d) => d?.conversations && setConversations(d.conversations))
      .catch(() => {});

    Promise.all([
      fetch(`/api/competitors/${encodeURIComponent(decodedName)}/events`).then((r) => (r.ok ? r.json() : { events: [] })),
      fetch(`/api/competitors/${encodeURIComponent(decodedName)}/activity`).then((r) => (r.ok ? r.json() : { series: [] })),
      fetch(`/api/competitors/${encodeURIComponent(decodedName)}/profile`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([eventsData, activityData, profileData]) => {
        setEvents(eventsData.events ?? []);
        setSeries(activityData.series ?? []);
        setProfile(profileData ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router, decodedName]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const stats = useMemo(() => {
    const total = events.length;
    const last7 = events.filter((e) => {
      if (!e.published_at) return false;
      return Date.now() - new Date(e.published_at).getTime() < 7 * 86_400_000;
    }).length;
    const high = events.filter((e) => e.threat_level === 'high').length;
    return { total, last7, high };
  }, [events]);

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
        onDelete={() => {}}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="px-8 pt-6 pb-2">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1.5 text-[12px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mb-4"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            back to feed
          </Link>

          {/* brand hero — large logo (which contains the company's
              wordmark in their actual font for most companies via
              Clearbit), tagline, website, topic chips. falls back
              to the italic Fraunces wordmark when no logo loads. */}
          <div className="flex items-start gap-5">
            <CompetitorLogo
              name={profile?.name ?? decodedName}
              domain={profile?.domain ?? undefined}
              size={88}
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl md:text-4xl text-neutral-900 dark:text-neutral-100 leading-tight">
                <span className={`${fraunces.className} italic font-medium`}>
                  {profile?.name ?? decodedName}
                </span>
              </h1>
              {profile?.tagline && (
                <p className="mt-1.5 text-[15px] text-neutral-600 dark:text-neutral-300 leading-snug">
                  {profile.tagline}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
                {profile?.website && (
                  <a
                    href={`https://${profile.website.replace(/^https?:\/\//, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {profile.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </a>
                )}
                {profile?.topics?.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center h-7 px-3 rounded-full bg-neutral-100/70 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300 lowercase"
                  >
                    {t.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {profile?.description && (
            <p className="mt-5 text-[14px] text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-3xl">
              {profile.description}
            </p>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-8 pb-12 pt-4">
          <div className="max-w-4xl space-y-6">
            {/* stat strip + sparkline */}
            <div className="rounded-2xl glass-pill-card px-5 py-4 flex items-center gap-6 flex-wrap">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">total events</div>
                <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{stats.total}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">last 7 days</div>
                <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{stats.last7}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">high-threat</div>
                <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">{stats.high}</div>
              </div>
              <div className="ml-auto text-neutral-700 dark:text-neutral-300">
                <div className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 text-right">
                  30-day activity
                </div>
                <Sparkline series={series} width={220} height={48} />
              </div>
            </div>

            {/* event list */}
            {loading ? (
              <div className="text-sm text-neutral-400 dark:text-neutral-500 py-12">loading…</div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl glass-pill-card p-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                no events tracked yet for {decodedName}.
              </div>
            ) : (
              <ul className="space-y-3">
                {events.map((e) => {
                  const sev = severityFromLevel(e.threat_level, e.relevance_score);
                  const hue = severityHue(sev);
                  return (
                    <li
                      key={e.id}
                      className="rounded-2xl glass-pill-card px-5 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1 inline-block w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: `hsl(${hue}, 88%, 52%)`,
                            boxShadow: `0 0 8px hsla(${hue}, 88%, 52%, 0.6)`,
                          }}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                            {e.title}
                          </div>
                          <div className="mt-1 flex items-baseline gap-2 flex-wrap text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span className="uppercase tracking-wider">{sourceLabel(e.source)}</span>
                            {e.event_type && <span>· {e.event_type.replace(/_/g, ' ')}</span>}
                            <span className="ml-auto tabular-nums">{relativeTime(e.published_at)}</span>
                          </div>
                          {e.summary && (
                            <p className="mt-2 text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                              {e.summary}
                            </p>
                          )}
                          <div className="mt-3 flex items-center flex-wrap gap-2 text-[12px]">
                            {e.source_url && (
                              <a
                                href={e.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                              >
                                {sourceLabel(e.source)}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                              >
                                {prettyHost(e.source_external_url)}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M7 17L17 7" />
                                  <path d="M7 7h10v10" />
                                </svg>
                              </a>
                            )}
                            {e.source_score != null && (
                              <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 tabular-nums">
                                ↑ {e.source_score.toLocaleString()}
                              </span>
                            )}
                            {e.source_comment_count != null && (
                              <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 tabular-nums">
                                {e.source_comment_count.toLocaleString()} comments
                              </span>
                            )}
                            <Link
                              href={`/chat?event=${e.id}`}
                              className="ml-auto inline-flex items-center gap-1.5 h-7 px-3 rounded-full font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
                            >
                              ask blupin
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}
