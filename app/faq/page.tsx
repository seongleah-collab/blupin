'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Fraunces, Inter } from 'next/font/google';
import SiteNav from '../components/SiteNav';
import SkyBackdrop from '../components/SkyBackdrop';

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

type FaqItem = { q: string; a: string };

const faqs: FaqItem[] = [
  {
    q: 'what is blupin?',
    a: 'blupin is competitive intelligence that watches your competitors, scores what actually threatens your product, and tells you what to do next. it runs in the background so you can keep shipping.',
  },
  {
    q: 'how does blupin find competitors?',
    a: "you tell us what you're building in one sentence. we pull from product hunt, hacker news, reddit, and a growing list of sources every hour — then match launches to your space.",
  },
  {
    q: 'how is this different from crayon, kompyte, or similarweb?',
    a: 'those tools dump a firehose of updates into a dashboard nobody reads. blupin is built around a single question — "what should i do this week?" — and answers it in a sentence, not a report.',
  },
  {
    q: 'when will blupin launch?',
    a: 'we\'re rolling out to the waitlist in small batches over the coming weeks. join the waitlist and we\'ll reach out when your spot opens up.',
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
    q: 'who is blupin for?',
    a: 'early-stage founders and small product teams who can\'t afford a full-time market researcher but also can\'t afford to miss a threat that ships next week.',
  },
  {
    q: 'can i integrate with slack or email?',
    a: 'email digests are coming at launch. slack is on the near-term roadmap. waitlist members help us prioritize which integrations land first.',
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <SiteNav />
      <main className={`${inter.className} relative min-h-screen text-white flex flex-col items-center px-6 overflow-hidden`}>
        <SkyBackdrop />

        {/* hero */}
        <section className="w-full max-w-3xl flex flex-col items-center text-center gap-6 pt-40 pb-16">
          <span className="text-[11px] uppercase tracking-[0.28em] text-white/80 drop-shadow-sm">
            faq
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight drop-shadow-lg">
            questions,{' '}
            <span className={`${fraunces.className} italic font-normal`}>answered.</span>
          </h1>
          <p className="text-lg text-white/85 max-w-xl leading-relaxed drop-shadow-sm">
            the short version of everything founders tend to ask us before signing up.
          </p>
        </section>

        {/* accordion */}
        <section className="w-full max-w-3xl pb-24">
          <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/70 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)] overflow-hidden divide-y divide-slate-900/10">
            {faqs.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div key={faq.q}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-6 px-6 py-5 text-left hover:bg-white/40 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className={`${fraunces.className} italic text-lg md:text-xl text-slate-900 tracking-tight`}>
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

          {/* closing cta */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 px-6 py-6 shadow-lg shadow-indigo-500/10">
            <div>
              <h3 className={`${fraunces.className} italic text-xl text-white leading-tight drop-shadow-lg`}>
                still have questions?
              </h3>
              <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
                email us at hello@blupin.ai — or skip ahead and join the waitlist.
              </p>
            </div>
            <Link
              href="/waitlist"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-indigo-950 text-sm font-medium hover:bg-white/95 transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
            >
              join the waitlist
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
