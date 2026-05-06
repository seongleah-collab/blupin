'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
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
    q: 'can i integrate with slack?',
    a: "browser push notifications are live now — you get pinged the moment a real threat lands, no inbox to check. slack is on the near-term roadmap. we skip email digests on purpose — founders don't read them.",
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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
            <Link href="/pricing" className="font-medium text-neutral-700 hover:text-neutral-900 transition">pricing</Link>
            <a href="#about" className="font-medium text-neutral-700 hover:text-neutral-900 transition">about</a>
            <a href="#faq" className="font-medium text-neutral-700 hover:text-neutral-900 transition">faq</a>
          </nav>

          <div className="flex items-center gap-2 text-sm justify-self-end">
            <Link
              href="/login"
              className="glass-button-clear h-9 inline-flex items-center justify-center rounded-full px-4 font-medium"
            >
              sign in
            </Link>
            <Link
              href="/signup"
              className="glass-button h-9 inline-flex items-center justify-center rounded-full px-4 font-medium"
            >
              sign up
            </Link>
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
        <section className="relative w-full bg-neutral-50 h-[225vh]">
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

              <Link
                href="/signup"
                className="glass-button blupin-rise inline-flex items-center gap-2 h-11 px-6 rounded-full text-[15px] font-medium"
                style={{ animationDelay: '300ms' }}
              >
                start now
              </Link>
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
              <div className="rounded-3xl glass-card p-7 flex flex-col">
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
              <div className="rounded-3xl glass-card p-7 flex flex-col">
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
              <div className="rounded-3xl glass-card p-7 flex flex-col">
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
                  <div key={p.n} className="rounded-2xl glass-card p-6">
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
                <Link
                  href="/signup"
                  className="glass-button inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm font-medium"
                >
                  start now <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* faq */}
        <section id="faq" className="px-5 py-24 sm:py-32 bg-white">
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

            <div className="rounded-3xl glass-card overflow-hidden divide-y divide-neutral-900/5">
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

        {/* closing CTA — sits right before the footer. background fades
            from white (matching the faq section above) into a very
            light slate so the page settles instead of cutting hard. */}
        <section className="relative px-5 py-32 sm:py-40 overflow-hidden bg-gradient-to-b from-white via-neutral-50 to-slate-100">
          <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            {/* left column — headline + CTA */}
            <div className="flex flex-col items-start gap-6">
              <h2 className={`${sourceSerif.className} text-[clamp(1.25rem,2.2vw,1.75rem)] leading-[1.2] font-medium tracking-[-0.01em] text-neutral-900 max-w-2xl`}>
                competitive intelligence, at your speed.
              </h2>
              <p className="text-base sm:text-lg text-neutral-500 max-w-xl leading-relaxed">
                start watching the field today. set up takes under a minute — no demo call, no sales pitch.
              </p>
              <Link
                href="/signup"
                className="glass-button inline-flex items-center gap-2 h-11 px-6 rounded-full text-[15px] font-medium mt-2"
              >
                start now
              </Link>
            </div>

            {/* right column — both keycaps staggered on the right,
                cluely-style: lightbulb upper-right, magnifying glass
                lower and pulled inward. */}
            <div aria-hidden className="hidden md:block relative h-[300px]">
              <div className="absolute -right-96 -top-8 w-[130px] h-[130px] -rotate-6 glass-keycap flex items-center justify-center">
                <svg
                  className="glass-keycap-icon"
                  width="60"
                  height="60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a6 6 0 0 0-3.5 10.85c.7.7 1.18 1.4 1.4 2.15h4.2c.22-.75.7-1.45 1.4-2.15A6 6 0 0 0 12 2z" />
                </svg>
              </div>
              <div className="absolute left-20 top-20 w-[140px] h-[140px] rotate-6 glass-keycap flex items-center justify-center">
                <svg
                  className="glass-keycap-icon"
                  width="65"
                  height="65"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7.5" />
                  <path d="m20.5 20.5-4.6-4.6" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <footer className="px-5 pt-16 pb-8 border-t border-neutral-200/70 bg-slate-100">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-12 gap-10">
            {/* left — wordmark + tagline */}
            <div className="col-span-2 md:col-span-5 flex flex-col gap-3">
              <Wordmark className="text-2xl font-medium text-neutral-700" dotClassName="text-sky-400" />
              <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
                competitive intelligence for founders who can&apos;t afford to miss.
              </p>
            </div>

            {/* resources */}
            <div className="md:col-span-3">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-medium mb-4">resources</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#how-it-works" className="text-neutral-600 hover:text-neutral-900 transition">how it works</a></li>
                <li><Link href="/pricing" className="text-neutral-600 hover:text-neutral-900 transition">pricing</Link></li>
                <li><a href="#about" className="text-neutral-600 hover:text-neutral-900 transition">about</a></li>
                <li><a href="#faq" className="text-neutral-600 hover:text-neutral-900 transition">faq</a></li>
              </ul>
            </div>

            {/* support */}
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-medium mb-4">support</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="text-neutral-600 hover:text-neutral-900 transition">help center</a></li>
                <li><a href="#" className="text-neutral-600 hover:text-neutral-900 transition">contact</a></li>
              </ul>
            </div>

            {/* legal */}
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 font-medium mb-4">legal</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/privacy" className="text-neutral-600 hover:text-neutral-900 transition">privacy policy</Link></li>
                <li><Link href="/terms" className="text-neutral-600 hover:text-neutral-900 transition">terms of service</Link></li>
              </ul>
            </div>
          </div>

          {/* divider + bottom row: status badge ←→ copyright */}
          <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-neutral-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 bg-white/60 px-3 py-1 text-xs text-neutral-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              all systems live
            </span>
            <span className="text-xs text-neutral-400">© {new Date().getFullYear()} blupin. all rights reserved.</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
