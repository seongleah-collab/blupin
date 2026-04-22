'use client';

import { useState } from 'react';
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
    <main className={`${inter.className} min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center px-6`}>
      <section className="w-full max-w-3xl flex flex-col items-center text-center gap-8">
        <h1 className="text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight font-normal">
          competitive intelligence,{' '}
          <span
            className={`${fraunces.className} italic bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent`}
          >
            at your speed.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-500 max-w-xl leading-relaxed">
          watches your competitors. finds what you&apos;d miss. tells you what to do.
        </p>

        {status === 'success' ? (
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-100 text-zinc-900 text-sm">
            <span className="text-green-600">✓</span>
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
              className="flex-1 px-4 py-3 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading' || !email}
              className="px-6 py-3 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'adding…' : 'join waitlist'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-500">{errorMsg}</p>
        )}
      </section>
    </main>
  );
}