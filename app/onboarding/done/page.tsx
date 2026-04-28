'use client'
import Link from 'next/link'

export default function DonePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <p className="text-sm text-gray-500 mb-2">all set</p>
        <h1 className="text-3xl italic mb-4" style={{fontFamily:'Fraunces'}}>you&apos;re in.</h1>
        <p className="text-gray-600 mb-8">your watch list is live. blupin runs in the background — ask anything.</p>
        <Link href="/chat" className="inline-block px-6 py-3 bg-black text-white rounded-lg">open chat</Link>
      </div>
    </div>
  )
}
