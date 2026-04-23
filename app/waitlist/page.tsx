'use client';

import { useState } from 'react';
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

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
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
          { href: '/#how-it-works', label: 'how it works' },
          { href: '/#about', label: 'about' },
          { href: '/faq', label: 'faq' },
        ]}
      />
      <main className={`${inter.className} relative min-h-screen text-white flex flex-col items-center px-6 overflow-hidden`}>
        <SkyBackdrop />

        {/* hero + form */}
        <section className="w-full max-w-3xl flex flex-col items-center text-center gap-8 min-h-screen justify-center pt-24">
          <span className="text-[11px] uppercase tracking-[0.28em] text-white/80 drop-shadow-sm">
            early access
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight drop-shadow-lg">
            join the waitlist.{' '}
            <span className={`${fraunces.className} italic font-normal`}>
              be first to ship smarter.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/85 max-w-xl leading-relaxed drop-shadow-sm">
            we&apos;re onboarding founders in small batches. early members get locked-in pricing and a direct line to the team.
          </p>

          {status === 'success' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/20 backdrop-blur-xl text-white text-sm border border-white/30 shadow-xl shadow-indigo-500/20">
                <span className="text-green-300">✓</span>
                you&apos;re on the list. we&apos;ll be in touch.
              </div>
              <p className="text-sm text-white/75 drop-shadow-sm">
                keep an eye on your inbox — we send the first note within a week.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-2">
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
            <p className="text-sm text-red-100 bg-red-500/25 backdrop-blur-xl px-3 py-1 rounded-full border border-red-300/30">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.25em] text-white/70 drop-shadow-sm pt-2">
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/70" />
              no spam
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/70" />
              unsubscribe anytime
            </span>
          </div>
        </section>

        {/* what you get */}
        <section className="relative w-screen -mx-6 px-6 py-24">
          <div className="absolute inset-0 bg-white/15 backdrop-blur-md" />
          <div className="relative max-w-5xl mx-auto w-full">
            <div className="flex flex-col items-center text-center mb-10">
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/80 mb-3 drop-shadow-sm">
                what you get
              </span>
              <h2 className="text-3xl md:text-4xl text-white leading-tight drop-shadow-lg max-w-2xl">
                early access,{' '}
                <span className={`${fraunces.className} italic font-normal`}>and the details that come with it.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/70 p-6 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)]">
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">01</span>
                <h3 className={`${fraunces.className} italic text-2xl text-slate-900 leading-[1.15] mt-3 mb-2 tracking-tight`}>
                  founding pricing.
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  waitlist members lock in our lowest tier for the first full year — no matter where pricing lands at launch.
                </p>
              </div>

              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/70 p-6 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)]">
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">02</span>
                <h3 className={`${fraunces.className} italic text-2xl text-slate-900 leading-[1.15] mt-3 mb-2 tracking-tight`}>
                  shape the roadmap.
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  a direct line to the team. the sources we watch next and the integrations we ship first are decided by you.
                </p>
              </div>

              <div className="rounded-2xl bg-white/75 backdrop-blur-xl border border-white/70 p-6 shadow-[0_20px_60px_-20px_rgba(30,41,59,0.25)]">
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">03</span>
                <h3 className={`${fraunces.className} italic text-2xl text-slate-900 leading-[1.15] mt-3 mb-2 tracking-tight`}>
                  first look.
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  private previews before public launch — so you&apos;re already ahead by the time competitors hear about us.
                </p>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center gap-3">
              <div className={`${fraunces.className} italic text-white/90 drop-shadow-sm`}>
                fewer than 200 spots in the next batch.
              </div>
              <a
                href="#top"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] uppercase tracking-[0.25em] text-white/80 hover:text-white transition-colors"
              >
                back to top ↑
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
