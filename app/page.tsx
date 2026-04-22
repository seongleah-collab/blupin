'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Fraunces, Inter } from 'next/font/google';

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
    <main className={`${inter.className} relative min-h-screen text-white flex flex-col items-center justify-center px-6 overflow-hidden`}>
      {/* layered cloud atmosphere */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/sky.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        {/* lavender-blue wash tints the clouds */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/50 via-purple-300/30 to-blue-200/40 mix-blend-soft-light" />
        {/* diagonal mood tint for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-purple-500/20" />
        {/* radial glow from top */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(199,210,254,0.35),transparent_60%)]" />
        {/* bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-950/15" />
      </div>

      <section className="w-full max-w-3xl flex flex-col items-center text-center gap-8">
        <h1 className="text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight font-light text-white drop-shadow-[0_2px_30px_rgba(79,70,229,0.35)]">
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
          <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your email"
              disabled={status === 'loading'}
              className="flex-1 px-4 py-3 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white placeholder-white/60 focus:outline-none focus:bg-white/25 focus:border-white/40 transition-all shadow-lg shadow-indigo-500/10"
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
    </main>
  );
}