'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Fraunces } from 'next/font/google'
import Wordmark from '@/app/components/Wordmark'
import { createClient } from '@/lib/supabase/client'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
})

function DoneInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [checking, setChecking] = useState(true)
  const justCheckedOut = params.get('checkout') === 'success'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
        return
      }
      // If they just came back from Stripe Checkout, give the webhook a
      // few seconds to land before we look up the row. Otherwise we'd
      // bounce them right back to /pricing.
      if (justCheckedOut) {
        await new Promise((r) => setTimeout(r, 2000))
      }
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', session.user.id)
        .maybeSingle()
      const active = sub && (sub.status === 'trialing' || sub.status === 'active')
      if (!active) {
        router.replace('/pricing')
        return
      }
      setChecking(false)
    })
  }, [router, justCheckedOut])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/60">
        loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/80 mb-3">all set</p>
        <h1 className={`${fraunces.className} italic text-5xl text-white mb-4`}>
          you&apos;re in.
        </h1>
        <p className="text-white/90 mb-8 leading-relaxed">
          your watch list is live. <Wordmark className="text-white" dotClassName="text-blue-300" /> runs in the background — ask anything.
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

export default function DonePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <DoneInner />
    </Suspense>
  )
}
