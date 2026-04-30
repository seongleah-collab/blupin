'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Inter, Source_Serif_4 } from 'next/font/google';
import ConcentricGradient from './components/ConcentricGradient';
import Wordmark from './components/Wordmark';

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
    q: <>is <Wordmark /> live?</>,
    a: <><Wordmark /> is live. create an account and you&apos;ll be watching competitors within a minute — no waitlist, no demo call.</>,
  },
  {
    q: 'how much will it cost?',
    a: "we're launching with founder pricing — early customers lock in our lowest tier for the first full year, no matter where pricing lands later. exact tiers are listed at signup.",
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
    a: "email digests are live at launch. slack is on the near-term roadmap. let us know which integrations matter most for your workflow and we'll prioritize.",
  },
];

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
    <div className={`${inter.className} min-h-dvh w-full bg-neutral-50 text-neutral-900 antialiased tracking-[-0.02em]`}>
      {/* solid top bar — white, full-width, single row, 3-col grid so the nav links are dead-centered */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white border-b border-neutral-200/70">
        <div className="max-w-7xl mx-auto h-14 px-5 grid grid-cols-3 items-center">
          <Link href="/" aria-label="blupin home" className="flex items-center text-neutral-900 justify-self-start">
            <Wordmark className="text-2xl font-medium" dotClassName="text-sky-400" />
          </Link>

          <nav className="hidden sm:flex items-center gap-7 text-sm justify-self-center">
            <a href="#how-it-works" className="font-medium text-neutral-700 hover:text-neutral-900 transition">how it works</a>
            <a href="#about" className="font-medium text-neutral-700 hover:text-neutral-900 transition">about</a>
            <a href="#faq" className="font-medium text-neutral-700 hover:text-neutral-900 transition">faq</a>
          </nav>

          <div className="flex items-center gap-4 text-sm justify-self-end">
            <Link href="/login" className="font-medium text-neutral-700 hover:text-neutral-900 transition">
              sign in
            </Link>
            <a
              href="#waitlist"
              className="glass-button h-9 inline-flex items-center justify-center rounded-full px-4 font-medium"
            >
              sign up
            </a>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* hero — sticky-stage tunnel zoom. parent is 180vh so the
            inner h-screen sticky pins for ~80vh of scroll, exactly the
            window the scroll-driven animations in globals.css play
            across. text fades out, the gradient zooms toward its mint
            core, and a white bloom takes over right as the sticky
            releases into the next section. */}
        <section className="relative w-full bg-neutral-50 h-[180vh]">
          <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center pt-20 md:pt-24 px-5">
            <div className="scroll-stage-text w-full max-w-6xl mx-auto flex flex-col items-center text-center gap-6 mb-10 md:mb-14">
              <h1
                className={`${sourceSerif.className} blupin-rise text-[clamp(2rem,5vw,4rem)] leading-[0.98] font-medium tracking-[-0.02em] text-neutral-900 max-w-3xl`}
                style={{ animationDelay: '0ms' }}
              >
                ship before they do.
              </h1>

              <p
                className="blupin-rise text-base sm:text-lg text-neutral-500 max-w-xl leading-relaxed"
                style={{ animationDelay: '160ms' }}
              >
                watches your competitors. finds what you&apos;d miss. tells you what to do.
              </p>

              <a
                href="#waitlist"
                className="glass-button blupin-rise inline-flex items-center gap-2 h-11 px-6 rounded-full text-[15px] font-medium"
                style={{ animationDelay: '300ms' }}
              >
                start now
              </a>
            </div>

            <div className="scroll-stage-portal w-full max-w-6xl mx-auto">
              <ConcentricGradient
                className="shadow-2xl rounded-t-[140px] overflow-hidden"
                aspectRatio="16 / 10"
              />
            </div>

            <div className="scroll-stage-bloom" aria-hidden />
          </div>
        </section>

        {/* how it works — godly-style gap-24 between the hero and this
            section comes from the section's natural top padding */}
        <section id="how-it-works" className="px-5 py-24 sm:py-32 bg-white">
          <div className="section-enter max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center gap-3 mb-16">
              <span className="text-sm text-neutral-400">how it works</span>
              <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] font-medium tracking-[-0.035em] text-neutral-900 max-w-3xl">
                three systems, working quietly in the background.
              </h2>
              <p className="text-base text-neutral-500 max-w-xl leading-relaxed">
                <Wordmark /> watches, scores, and advises — so you spend less time tracking competitors and more time shipping.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* card 1 — live feed */}
              <div className="rounded-3xl bg-white border border-neutral-200/70 p-7 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                    <span className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-medium">live feed</span>
                  </div>
                  <span className="text-xs text-neutral-300 tabular-nums">01</span>
                </div>

                <h3 className="text-2xl font-medium text-neutral-900 leading-[1.15] mb-3 tracking-[-0.02em]">
                  watches 4 sources, every hour.
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                  product hunt, hacker news, reddit, and more — so you never miss a launch in your space.
                </p>

                <div className="mt-auto pt-5 border-t border-neutral-200/70 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-neutral-700">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      Leadline
                    </span>
                    <span className="text-neutral-400 tabular-nums">2m ago</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-neutral-700">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Show HN: Rival
                    </span>
                    <span className="text-neutral-400 tabular-nums">14m ago</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-neutral-700">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      ScopeAI
                    </span>
                    <span className="text-neutral-400 tabular-nums">1h ago</span>
                  </div>
                </div>
              </div>

              {/* card 2 — threat radar */}
              <div className="rounded-3xl bg-white border border-neutral-200/70 p-7 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-medium">threat radar</span>
                  <span className="text-xs text-neutral-300 tabular-nums">02</span>
                </div>

                <h3 className="text-2xl font-medium text-neutral-900 leading-[1.15] mb-3 tracking-[-0.02em]">
                  sorts signal from noise.
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                  every launch gets scored by how directly it threatens your product — so you know what actually matters.
                </p>

                <div className="mt-auto pt-5 border-t border-neutral-200/70">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-3xl font-semibold text-neutral-900 leading-none tracking-[-0.02em]">3</div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-2 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        high
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-semibold text-neutral-700 leading-none tracking-[-0.02em]">5</div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-2 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        med
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-semibold text-neutral-400 leading-none tracking-[-0.02em]">12</div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-2 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        low
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* card 3 — ask anything */}
              <div className="rounded-3xl bg-white border border-neutral-200/70 p-7 flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-medium">ask anything</span>
                  <span className="text-xs text-neutral-300 tabular-nums">03</span>
                </div>

                <h3 className="text-2xl font-medium text-neutral-900 leading-[1.15] mb-3 tracking-[-0.02em]">
                  tells you what to do.
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                  not just what happened — what to ship, what to say, and when.
                </p>

                <div className="mt-auto pt-5 border-t border-neutral-200/70 space-y-2">
                  <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm text-neutral-900 bg-[#A2CFFE]">
                    should i worry about Rival?
                  </div>
                  <div className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-neutral-100 px-3.5 py-2 text-sm text-neutral-800 leading-relaxed">
                    yes — ship your onboarding this week. they&apos;re targeting the same ICP.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* about */}
        <section id="about" className="px-5 py-24 sm:py-32 bg-white">
          <div className="max-w-6xl mx-auto flex flex-col gap-12">
            <div className="grid md:grid-cols-12 gap-10 items-start">
              <div className="md:col-span-5">
                <span className="text-sm text-neutral-400">about</span>
                <h2 className="mt-3 text-[clamp(1.875rem,3.5vw,3rem)] leading-[1.08] font-medium tracking-[-0.035em] text-neutral-900">
                  built for founders who can&apos;t afford to miss.
                </h2>
                <div className="mt-6 h-px w-12 bg-neutral-300" />
                <p className="mt-6 text-base text-neutral-500 leading-relaxed">
                  most competitive intelligence tools tell you what happened. very few tell you what to do about it.
                </p>
                <p className="mt-3 text-base text-neutral-500 leading-relaxed">
                  we&apos;re obsessed with turning the firehose of launches and releases into the one or two moves that actually matter this week.
                </p>
              </div>

              <div className="md:col-span-7 space-y-3">
                {[
                  { n: '01', t: 'signal over volume.', d: "we'd rather surface three threats that matter than a hundred updates you'll never read." },
                  { n: '02', t: 'answers, not dashboards.', d: "founders don't need another tab to check. ask a question, get a next move — that's the whole product." },
                  { n: '03', t: 'built for the speed of small teams.', d: 'no seats to configure, no integrations to wire up. set it up in a minute and move on with your week.' },
                ].map((p) => (
                  <div key={p.n} className="rounded-2xl bg-neutral-50 border border-neutral-200/70 p-6">
                    <div className="flex items-baseline gap-4">
                      <span className="text-base font-medium text-neutral-300 w-8 shrink-0 tabular-nums">{p.n}</span>
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900 leading-tight tracking-[-0.02em]">{p.t}</h3>
                        <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{p.d}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* stats row */}
            <div className="pt-8 border-t border-neutral-200/70 grid md:grid-cols-4 gap-6 items-end">
              <div>
                <div className="text-3xl font-medium tracking-[-0.02em] text-neutral-900 leading-none">4+</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">sources watched</div>
              </div>
              <div>
                <div className="text-3xl font-medium tracking-[-0.02em] text-neutral-900 leading-none">hourly</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">refresh cadence</div>
              </div>
              <div>
                <div className="text-3xl font-medium tracking-[-0.02em] text-neutral-900 leading-none">&lt;60s</div>
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">to first answer</div>
              </div>
              <div className="md:text-right">
                <a
                  href="#waitlist"
                  className="glass-button inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium"
                >
                  start now <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* faq */}
        <section id="faq" className="px-5 py-24 sm:py-32">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center gap-3 mb-12">
              <span className="text-sm text-neutral-400">faq</span>
              <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] font-medium tracking-[-0.035em] text-neutral-900">
                questions, answered.
              </h2>
              <p className="text-base text-neutral-500 max-w-xl leading-relaxed">
                the short version of everything founders tend to ask before signing up.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-neutral-200/70 overflow-hidden divide-y divide-neutral-200/70">
              {faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={i}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left hover:bg-neutral-50/70 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="text-base sm:text-lg font-medium text-neutral-900 tracking-[-0.02em]">{faq.q}</span>
                      <span
                        className={`shrink-0 text-neutral-400 text-xl leading-none transition-transform duration-200 ${
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
                        <p className="px-6 pb-6 text-sm text-neutral-500 leading-relaxed max-w-2xl">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* waitlist */}
        <section id="waitlist" className="px-5 py-24 sm:py-32 bg-white">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
            <span className="text-sm text-neutral-400">get started</span>

            <h2 className="text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[1.02] font-medium tracking-[-0.04em] text-neutral-900">
              create your account.
              <br />
              start shipping smarter.
            </h2>

            <p className="text-base sm:text-lg text-neutral-500 max-w-xl leading-relaxed">
              blupin is live. create an account, tell us what you&apos;re building, and start watching the field in under a minute.
            </p>

            {status === 'success' ? (
              <div className="glass-button inline-flex items-center gap-2 h-11 px-6 rounded-full text-sm font-medium">
                <span className="text-emerald-700">✓</span>
                taking you in…
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-2 mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your email"
                  disabled={status === 'loading'}
                  className="h-11 px-5 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition"
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
                    className="flex-1 h-11 px-5 rounded-full bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading' || !email || !password}
                    className="glass-button h-11 px-6 rounded-full font-medium disabled:opacity-50"
                  >
                    {status === 'loading' ? 'creating…' : 'get started'}
                  </button>
                </div>
              </form>
            )}

            {status === 'error' && (
              <p className="text-sm text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">{errorMsg}</p>
            )}

            <div className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-neutral-400 pt-1">
              <span className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-300" />
                no spam
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-300" />
                unsubscribe anytime
              </span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-3 gap-4">
            {[
              { n: '01', t: 'founding pricing.', d: 'early customers lock in our lowest tier for the first full year — no matter where pricing lands later.' },
              { n: '02', t: 'shape the roadmap.', d: "we're building this with our first users. the sources we watch next and the integrations we ship first are decided by you." },
              { n: '03', t: 'set up in seconds.', d: 'paste a one-line description, confirm your competitors, and start watching today. no demo call, no sales pitch.' },
            ].map((b) => (
              <div key={b.n} className="rounded-3xl bg-neutral-50 border border-neutral-200/70 p-7">
                <span className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-medium">{b.n}</span>
                <h3 className="text-xl font-medium text-neutral-900 leading-[1.15] mt-3 mb-2 tracking-[-0.02em]">{b.t}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{b.d}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="px-5 py-12 border-t border-neutral-200/70">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-neutral-400">
            <Wordmark className="text-neutral-500" dotClassName="text-sky-400" />
            <span>© {new Date().getFullYear()} blupin</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
