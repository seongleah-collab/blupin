'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Fraunces, Inter } from 'next/font/google';
import SiteNav from './components/SiteNav';
import SkyBackdrop from './components/SkyBackdrop';
import Wordmark from './components/Wordmark';
import { createClient } from '@/lib/supabase/client';

type FaqItem = { q: ReactNode; a: ReactNode };

const faqs: FaqItem[] = [
  {
    q: <>what is <Wordmark />?</>,
    a: <><Wordmark /> is competitive intelligence that watches your competitors, scores what actually threatens your product, and tells you what to do next. it runs in the background so you can keep shipping.</>,
  },
  {
    q: <>how does <Wordmark /> find competitors?</>,
    a: "you tell us what you're building in one sentence. we pull from product hunt, hacker news, reddit, and a growing list of sources every hour — then match launches to your space.",
  },
  {
    q: 'how is this different from crayon, kompyte, or similarweb?',
    a: <>those tools dump a firehose of updates into a dashboard nobody reads. <Wordmark /> is built around a single question — &ldquo;what should i do this week?&rdquo; — and answers it in a sentence, not a report.</>,
  },
  {
    q: <>when will <Wordmark /> launch?</>,
    a: "we're rolling out to the waitlist in small batches over the coming weeks. join the waitlist and we'll reach out when your spot opens up.",
  },
  {
    q: 'how much will it cost?',
    a: 'pricing is still being finalized. waitlist members get early-access pricing locked in for their first year.',
  },
  {
    q: 'is my data secure?',
    a: 'we only store what you give us — your product description, your email, and the sources you want watched. no scraping of your codebase, no third-party trackers on this site.',
  },
  {
    q: <>who is <Wordmark /> for?</>,
    a: "early-stage founders and small product teams who can't afford a full-time market researcher but also can't afford to miss a threat that ships next week.",
  },
  {
    q: 'can i integrate with slack or email?',
    a: 'email digests are coming at launch. slack is on the near-term roadmap. waitlist members help us prioritize which integrations land first.',
  },
];

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInStatus, setSignInStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [signInError, setSignInError] = useState('');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (signInStatus === 'loading') return;
    setSignInStatus('loading');
    setSignInError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail.trim(),
      password: signInPassword,
    });
    if (error) {
      setSignInStatus('error');
      setSignInError(error.message);
      return;
    }
    setSignInStatus('success');
    router.push('/chat');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('success');
        router.push('/onboarding');
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'something went wrong');
      }
    } catch {
      setStatus('error');
      setErrorMsg('network error — try again');
    }
  }

  return (
    <>
      <SiteNav
        links={[
          { href: '#how-it-works', label: 'how it works' },
          { href: '#about', label: 'about' },
          { href: '#faq', label: 'faq' },
          { href: '#waitlist', label: 'join waitlist' },
        ]}
        rightLink={{ href: '#signin', label: 'sign in' }}
      />

      <main className={`${inter.className} relative min-h-screen text-white flex flex-col items-center px-6 overflow-hidden`}>
        <SkyBackdrop />

        {/* hero — pure white, high-contrast */}
        <section className="relative w-full max-w-3xl flex flex-col items-center text-center gap-8 min-h-screen justify-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight text-white font-medium drop-shadow-[0_2px_20px_rgba(0,0,0,0.25)]">
            competitive intelligence,{' '}
            <span className={`${fraunces.className} italic font-medium text-white`}>
              at your speed.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white font-medium max-w-xl leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
            watches your competitors. finds what you&apos;d miss. tells you what to do.
          </p>

          {status === 'success' ? (
            <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/25 backdrop-blur-xl text-white font-medium text-sm border border-white/60 shadow-xl shadow-indigo-500/20">
              <span className="text-green-200">✓</span>
              taking you in…
            </div>
          ) : (
            <form id="waitlist-form" onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your email"
                disabled={status === 'loading'}
                className="flex-1 px-4 py-3 rounded-full bg-white/20 backdrop-blur-xl border border-white/60 text-white font-medium placeholder:text-white/85 focus:outline-none focus:border-white transition-colors"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password (6+ characters)"
                  disabled={status === 'loading'}
                  className="flex-1 px-4 py-3 rounded-full bg-white/20 backdrop-blur-xl border border-white/60 text-white font-medium placeholder:text-white/85 focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || !email || !password}
                  className="px-6 py-3 rounded-full bg-white text-indigo-950 font-semibold hover:bg-white/95 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                >
                  {status === 'loading' ? 'creating…' : 'get started'}
                </button>
              </div>
            </form>
          )}

          {status === 'error' && (
            <p className="text-sm text-white font-medium bg-red-500/40 backdrop-blur-xl px-3 py-1 rounded-full border border-white/60">{errorMsg}</p>
          )}
        </section>

        {/* white canvas — everything below the hero lives here */}
        <div
          className="relative w-screen -mx-6 bg-white text-slate-900"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* long, curved cloud→white fade; stays transparent over the hero text,
              then eases to white as the canvas approaches */}
          <div
            className="pointer-events-none absolute -top-[100vh] inset-x-0 h-[100vh]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 82%, rgba(255,255,255,0.2) 90%, rgba(255,255,255,0.6) 96%, rgba(255,255,255,1) 100%)',
            }}
            aria-hidden
          />

        {/* see it work section */}
        <section id="how-it-works" className="relative px-6 min-h-screen flex items-center py-24">
          <div className="relative max-w-6xl mx-auto w-full">
            <div className="flex flex-col items-center text-center mb-12">
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-3">
                how it works
              </span>
              <h2 className="text-4xl md:text-5xl text-slate-900 leading-tight max-w-2xl">
                three systems,{' '}
                <span className="">working quietly in the background.</span>
              </h2>
              <p className="mt-5 text-base text-slate-600 max-w-xl leading-relaxed">
                <Wordmark /> watches, scores, and advises — so you spend less time tracking competitors and more time shipping.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {/* card 1 — live feed */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)] flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">live feed</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">01</span>
                </div>

                <h3 className="text-2xl font-semibold text-slate-900 leading-[1.15] mb-3 tracking-tight">
                  watches 4 sources, every hour.
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-5">
                  product hunt, hacker news, reddit, and more — so you never miss a launch in your space.
                </p>

                <div className="mt-auto pt-5 border-t border-slate-900/10 space-y-2.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2.5 text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.7)]" />
                      Leadline
                    </span>
                    <span className="text-slate-400 tabular-nums">2m ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2.5 text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
                      Show HN: Rival
                    </span>
                    <span className="text-slate-400 tabular-nums">14m ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2.5 text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
                      ScopeAI
                    </span>
                    <span className="text-slate-400 tabular-nums">1h ago</span>
                  </div>
                </div>
              </div>

              {/* card 2 — threat radar */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)] flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">threat radar</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">02</span>
                </div>

                <h3 className="text-2xl font-semibold text-slate-900 leading-[1.15] mb-3 tracking-tight">
                  sorts signal from noise.
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-5">
                  every launch gets scored by how directly it threatens your product — so you know what actually matters.
                </p>

                <div className="mt-auto pt-5 border-t border-slate-900/10">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-3xl font-bold text-slate-900 leading-none">3</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                        high
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-slate-900/70 leading-none">5</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                        med
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-slate-900/50 leading-none">12</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.8)]" />
                        low
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* card 3 — ask anything */}
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)] flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">ask anything</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">03</span>
                </div>

                <h3 className="text-2xl font-semibold text-slate-900 leading-[1.15] mb-3 tracking-tight">
                  tells you what to do.
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-5">
                  not just what happened — what to ship, what to say, and when.
                </p>

                <div className="mt-auto pt-5 border-t border-slate-900/10 space-y-2">
                  <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-900 px-3.5 py-2 text-[12px] text-white">
                    should i worry about Rival?
                  </div>
                  <div className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-white/90 border border-slate-900/5 px-3.5 py-2 text-[12px] text-slate-800 leading-relaxed">
                    yes — ship your onboarding this week. they&apos;re targeting the same ICP.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* about section */}
        <section id="about" className="relative px-8 md:px-16 min-h-screen flex flex-col justify-center py-24 border-t border-slate-100">
          <div className="relative w-full max-w-6xl mx-auto flex flex-col gap-12">
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">
              {/* left column — header lockup */}
              <div className="md:col-span-5">
                <span className="text-[10px] uppercase tracking-[0.28em] text-slate-500 mb-4 block">
                  about
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 leading-[1.15]">
                  built for founders who{' '}
                  <span className="">can&apos;t afford to miss.</span>
                </h2>
                <div className="mt-5 h-px w-12 bg-slate-300" />
                <p className="mt-5 text-base text-slate-600 leading-relaxed">
                  most competitive intelligence tools tell you what happened. very few tell you what to do about it.
                </p>
                <p className="mt-3 text-base text-slate-600 leading-relaxed">
                  we&apos;re a small team obsessed with turning the firehose of launches and releases into the one or two moves that actually matter this week.
                </p>
              </div>

              {/* right column — principles */}
              <div className="md:col-span-7 space-y-3">
                <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)]">
                  <div className="flex items-baseline gap-4">
                    <span className="text-xl font-bold leading-none w-8 shrink-0 text-slate-300">01</span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 leading-tight tracking-tight">
                        signal over volume.
                      </h3>
                      <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
                        we&apos;d rather surface three threats that matter than a hundred updates you&apos;ll never read.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)]">
                  <div className="flex items-baseline gap-4">
                    <span className="text-xl font-bold leading-none w-8 shrink-0 text-slate-300">02</span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 leading-tight tracking-tight">
                        answers, not dashboards.
                      </h3>
                      <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
                        founders don&apos;t need another tab to check. ask a question, get a next move — that&apos;s the whole product.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)]">
                  <div className="flex items-baseline gap-4">
                    <span className="text-xl font-bold leading-none w-8 shrink-0 text-slate-300">03</span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 leading-tight tracking-tight">
                        built for the speed of small teams.
                      </h3>
                      <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
                        no seats to configure, no integrations to wire up. set it up in a minute and move on with your week.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* bottom stats + cta row */}
            <div className="pt-6 border-t border-slate-200 grid md:grid-cols-4 gap-6 items-end">
              <div>
                <div className="text-3xl font-bold leading-none text-slate-900">4+</div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-slate-500">sources watched</div>
              </div>
              <div>
                <div className="text-3xl font-bold leading-none text-slate-900">hourly</div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-slate-500">refresh cadence</div>
              </div>
              <div>
                <div className="text-3xl font-bold leading-none text-slate-900">&lt;60s</div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-slate-500">to first answer</div>
              </div>
              <div className="md:text-right">
                <a
                  href="#waitlist"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-[13px] font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                >
                  join the waitlist
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* faq section */}
        <section id="faq" className="relative px-6 min-h-screen flex items-center py-24 border-t border-slate-100">
          <div className="relative max-w-3xl mx-auto w-full">
            <div className="flex flex-col items-center text-center mb-12">
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500 mb-3">
                faq
              </span>
              <h2 className="text-4xl md:text-5xl text-slate-900 leading-tight max-w-2xl">
                questions,{' '}
                <span className="">answered.</span>
              </h2>
              <p className="mt-5 text-base text-slate-600 max-w-xl leading-relaxed">
                the short version of everything founders tend to ask us before signing up.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)] overflow-hidden divide-y divide-slate-200">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">
                        {faq.q}
                      </span>
                      <span
                        className={`shrink-0 text-slate-500 text-xl leading-none transition-transform duration-200 ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                        aria-hidden
                      >
                        +
                      </span>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-6 pb-6 text-[14px] text-slate-600 leading-relaxed max-w-2xl">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* dedicated waitlist section */}
        <section id="waitlist" className="relative px-6 min-h-screen flex flex-col items-center justify-center py-24 border-t border-slate-100">
          <div className="w-full max-w-3xl flex flex-col items-center text-center gap-8">
            <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              early access
            </span>

            <h2 className="text-4xl sm:text-5xl md:text-6xl leading-tight text-slate-900">
              join the waitlist.{' '}
              <span className="">
                be first to ship smarter.
              </span>
            </h2>

            <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
              we&apos;re onboarding founders in small batches. early members get locked-in pricing and a direct line to the team.
            </p>

            {status === 'success' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900 text-white text-sm shadow-lg shadow-slate-900/10">
                  <span className="text-green-300">✓</span>
                  taking you in…
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your email"
                  disabled={status === 'loading'}
                  className="flex-1 px-4 py-3 rounded-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password (6+ characters)"
                    disabled={status === 'loading'}
                    className="flex-1 px-4 py-3 rounded-full bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading' || !email || !password}
                    className="px-6 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-lg shadow-slate-900/10"
                  >
                    {status === 'loading' ? 'creating…' : 'get started'}
                  </button>
                </div>
              </form>
            )}

            {status === 'error' && (
              <p className="text-sm text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.25em] text-slate-500 pt-2">
              <span className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-400" />
                no spam
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-400" />
                unsubscribe anytime
              </span>
            </div>
          </div>

          <div className="relative w-full max-w-5xl mt-16 grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)]">
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">01</span>
              <h3 className="text-2xl font-semibold text-slate-900 leading-[1.15] mt-3 mb-2 tracking-tight">
                founding pricing.
              </h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                waitlist members lock in our lowest tier for the first full year — no matter where pricing lands at launch.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)]">
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">02</span>
              <h3 className="text-2xl font-semibold text-slate-900 leading-[1.15] mt-3 mb-2 tracking-tight">
                shape the roadmap.
              </h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                a direct line to the team. the sources we watch next and the integrations we ship first are decided by you.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)]">
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">03</span>
              <h3 className="text-2xl font-semibold text-slate-900 leading-[1.15] mt-3 mb-2 tracking-tight">
                first look.
              </h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                private previews before public launch — so you&apos;re already ahead by the time competitors hear about us.
              </p>
            </div>
          </div>
        </section>

        {/* sign-in section — for returning users */}
        <section id="signin" className="relative px-6 py-24 border-t border-slate-100">
          <div className="relative max-w-3xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500 mb-3 block">
                already with us
              </span>
              <h2 className="text-3xl md:text-4xl text-slate-900 leading-tight tracking-tight mb-4">
                welcome back to <Wordmark className="font-medium" />
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                sign in to pick up where you left off — your watch list, your scores, your space.
              </p>
            </div>

            <form
              onSubmit={handleSignIn}
              className="rounded-2xl bg-white border border-slate-200 p-6 shadow-[0_20px_60px_-30px_rgba(30,41,59,0.3)]"
            >
              <label className="block text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">
                email
              </label>
              <input
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={signInStatus === 'loading'}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors mb-4"
              />
              <label className="block text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">
                password
              </label>
              <input
                type="password"
                required
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                disabled={signInStatus === 'loading'}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors mb-5"
              />
              <button
                type="submit"
                disabled={signInStatus === 'loading' || !signInEmail || !signInPassword}
                className="w-full px-4 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signInStatus === 'loading' ? 'signing in…' : 'sign in'}
              </button>
              {signInStatus === 'error' && (
                <p className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                  {signInError}
                </p>
              )}
              <p className="mt-4 text-[13px] text-slate-500 text-center">
                new here?{' '}
                <a href="#waitlist" className="text-slate-900 underline underline-offset-2 hover:text-slate-700">
                  join the waitlist
                </a>
              </p>
            </form>
          </div>
        </section>
        </div>
      </main>
    </>
  );
}