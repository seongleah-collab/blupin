'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Fraunces, Inter } from 'next/font/google';
import SiteNav from './components/SiteNav';
import SkyBackdrop from './components/SkyBackdrop';

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
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('success');
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
          { href: '/faq', label: 'faq' },
          { href: '/waitlist', label: 'join waitlist' },
        ]}
      />

      <main className={`${inter.className} relative min-h-screen text-white flex flex-col items-center px-6 overflow-hidden`}>
        <SkyBackdrop />

        {/* hero — unchanged, still white on clouds */}
        <section className="w-full max-w-3xl flex flex-col items-center text-center gap-8 min-h-screen justify-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight drop-shadow-lg">
            competitive intelligence,{' '}
            <span className={`${fraunces.className} italic font-normal`}>
              at your speed.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/85 max-w-xl leading-relaxed drop-shadow-sm">
            watches your competitors. finds what you&apos;d miss. tells you what to do.
          </p>

          {status === 'success' ? (
            <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 backdrop-blur-xl text-white text-sm border border-white/30 shadow-xl shadow-indigo-500/20">
              <span className="text-green-300">✓</span>
              you&apos;re on the list. we&apos;ll be in touch.
            </div>
          ) : (
            <form id="waitlist-form" onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your email"
                disabled={status === 'loading'}
                className="flex-1 px-4 py-3 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white placeholder:text-white/60 focus:outline-none focus:border-white/50 transition-colors"
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email}
                className="px-6 py-3 rounded-full bg-white text-indigo-950 font-medium hover:bg-white/95 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                {status === 'loading' ? 'adding…' : 'join waitlist'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="text-sm text-red-100 bg-red-500/25 backdrop-blur-xl px-3 py-1 rounded-full border border-red-300/30">{errorMsg}</p>
          )}
        </section>

        {/* see it work section */}
        <section id="how-it-works" className="relative w-screen -mx-6 px-6 min-h-screen flex items-center py-16">
          <div className="absolute inset-0 bg-white/15 backdrop-blur-md" />
          <div className="relative max-w-6xl mx-auto w-full">
            <div className="flex flex-col items-center text-center mb-10">
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/80 mb-3 drop-shadow-sm">
                how it works
              </span>
              <h2 className="text-3xl md:text-4xl text-white leading-tight drop-shadow-lg max-w-2xl">
                three systems,{' '}
                <span className={`${fraunces.className} italic font-normal`}>working quietly in the background.</span>
              </h2>
              <p className="mt-4 text-sm text-white/80 max-w-xl leading-relaxed drop-shadow-sm">
                blupin watches, scores, and advises — so you spend less time tracking competitors and more time shipping.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {/* card 1 — live feed */}
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/70 p-6 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)] flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">live feed</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">01</span>
                </div>

                <h3 className={`${fraunces.className} italic text-2xl text-slate-900 leading-[1.15] mb-3 tracking-tight`}>
                  watches 4 sources, every hour.
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-5">
                  product hunt, hacker news, reddit, and more — so you never miss a launch in your space.
                </p>

                <div className="mt-auto pt-5 border-t border-slate-900/10 space-y-2.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2.5 text-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      Leadline
                    </span>
                    <span className="text-slate-400 tabular-nums">2m ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2.5 text-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Show HN: Rival
                    </span>
                    <span className="text-slate-400 tabular-nums">14m ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2.5 text-slate-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      ScopeAI
                    </span>
                    <span className="text-slate-400 tabular-nums">1h ago</span>
                  </div>
                </div>
              </div>

              {/* card 2 — threat radar */}
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/70 p-6 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)] flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">threat radar</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">02</span>
                </div>

                <h3 className={`${fraunces.className} italic text-2xl text-slate-900 leading-[1.15] mb-3 tracking-tight`}>
                  sorts signal from noise.
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-5">
                  every launch gets scored by how directly it threatens your product — so you know what actually matters.
                </p>

                <div className="mt-auto pt-5 border-t border-slate-900/10">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className={`${fraunces.className} text-3xl text-slate-900 leading-none`}>3</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-rose-500" />
                        high
                      </div>
                    </div>
                    <div>
                      <div className={`${fraunces.className} text-3xl text-slate-900/70 leading-none`}>5</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                        med
                      </div>
                    </div>
                    <div>
                      <div className={`${fraunces.className} text-3xl text-slate-900/50 leading-none`}>12</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                        low
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* card 3 — ask anything */}
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/70 p-6 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)] flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500 font-medium">ask anything</span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">03</span>
                </div>

                <h3 className={`${fraunces.className} italic text-2xl text-slate-900 leading-[1.15] mb-3 tracking-tight`}>
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
        <section id="about" className="relative w-screen -mx-6 px-8 md:px-16 min-h-screen flex flex-col justify-center py-16">
          <div className="relative w-full flex flex-col gap-12">
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">
              {/* left column — header lockup */}
              <div className="md:col-span-5">
                <span className="text-[10px] uppercase tracking-[0.28em] text-white/80 mb-4 drop-shadow-sm block">
                  about
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl text-white leading-[1.15] drop-shadow-lg">
                  built for founders who{' '}
                  <span className={`${fraunces.className} italic font-normal`}>can&apos;t afford to miss.</span>
                </h2>
                <div className="mt-5 h-px w-12 bg-white/40" />
                <p className="mt-5 text-sm text-white/85 leading-relaxed drop-shadow-sm">
                  most competitive intelligence tools tell you what happened. very few tell you what to do about it.
                </p>
                <p className="mt-3 text-sm text-white/85 leading-relaxed drop-shadow-sm">
                  we&apos;re a small team obsessed with turning the firehose of launches and releases into the one or two moves that actually matter this week.
                </p>
              </div>

              {/* right column — principles */}
              <div className="md:col-span-7 space-y-3">
                <div className="rounded-xl bg-white/75 backdrop-blur-xl border border-white/70 p-5 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)]">
                  <div className="flex items-baseline gap-4">
                    <span className={`${fraunces.className} italic text-xl leading-none w-8 shrink-0 text-slate-300`}>01</span>
                    <div>
                      <h3 className={`${fraunces.className} italic text-lg text-slate-900 leading-tight tracking-tight`}>
                        signal over volume.
                      </h3>
                      <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
                        we&apos;d rather surface three threats that matter than a hundred updates you&apos;ll never read.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white/75 backdrop-blur-xl border border-white/70 p-5 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)]">
                  <div className="flex items-baseline gap-4">
                    <span className={`${fraunces.className} italic text-xl leading-none w-8 shrink-0 text-slate-300`}>02</span>
                    <div>
                      <h3 className={`${fraunces.className} italic text-lg text-slate-900 leading-tight tracking-tight`}>
                        answers, not dashboards.
                      </h3>
                      <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
                        founders don&apos;t need another tab to check. ask a question, get a next move — that&apos;s the whole product.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white/75 backdrop-blur-xl border border-white/70 p-5 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)]">
                  <div className="flex items-baseline gap-4">
                    <span className={`${fraunces.className} italic text-xl leading-none w-8 shrink-0 text-slate-300`}>03</span>
                    <div>
                      <h3 className={`${fraunces.className} italic text-lg text-slate-900 leading-tight tracking-tight`}>
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
            <div className="pt-6 border-t border-white/25 grid md:grid-cols-4 gap-6 items-end">
              <div>
                <div className={`${fraunces.className} italic text-3xl leading-none text-white drop-shadow-lg`}>4+</div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-white/75">sources watched</div>
              </div>
              <div>
                <div className={`${fraunces.className} italic text-3xl leading-none text-white drop-shadow-lg`}>hourly</div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-white/75">refresh cadence</div>
              </div>
              <div>
                <div className={`${fraunces.className} italic text-3xl leading-none text-white drop-shadow-lg`}>&lt;60s</div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.25em] text-white/75">to first answer</div>
              </div>
              <div className="md:text-right">
                <Link
                  href="/waitlist"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-indigo-950 text-[13px] font-medium hover:bg-white/95 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  join the waitlist
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}