'use client'
import Link from 'next/link'
import { Fraunces } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
})

export default function DonePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/80 mb-3">all set</p>
        <h1 className={`${fraunces.className} italic text-5xl text-white mb-4`}>
          you&apos;re in.
        </h1>
        <p className="text-white/90 mb-8 leading-relaxed">
          your watch list is live. blupin runs in the background — ask anything.
        </p>
        <Link
          href="/chat"
          className="inline-block px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
        >
          open chat
        </Link>
      </div>
    </div>
  )
}
