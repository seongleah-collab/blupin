'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Fraunces } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'
import { PLANS, TRIAL_DAYS, type PlanSlug } from '@/lib/billing/plans'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
})

function PricingInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [busy, setBusy] = useState<PlanSlug | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canceled = params.get('canceled') === '1'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      setAuthChecked(true)
    })
  }, [])

  async function startCheckout(plan: PlanSlug) {
    setError(null)
    if (!authed) {
      // Funnel through signup so we have a user before checkout.
      router.push(`/signup?next=${encodeURIComponent(`/pricing?plan=${plan}`)}`)
      return
    }
    setBusy(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? `failed: ${res.status}`)
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setBusy(null)
    }
  }

  // If we returned from /signup with ?plan=… in the URL, auto-start checkout.
  useEffect(() => {
    if (!authChecked || !authed) return
    const plan = params.get('plan') as PlanSlug | null
    if (plan && PLANS[plan]) startCheckout(plan)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, authed])

  const tiers: PlanSlug[] = ['starter', 'pro', 'scale']

  return (
    <div className="relative min-h-screen bg-black">
      <div className="relative px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-[11px] uppercase tracking-[0.25em] text-white/60 mb-3">
            pricing
          </span>
          <h1 className="text-4xl md:text-5xl text-white leading-tight mb-4">
            pick your{' '}
            <span className={`${fraunces.className} italic font-medium`}>
              watch level
            </span>
          </h1>
          <p className="text-base text-white/70 leading-relaxed max-w-lg mx-auto">
            {TRIAL_DAYS}-day free trial on every plan. cancel anytime from settings.
          </p>
          {canceled && (
            <p className="mt-6 text-sm text-amber-300/80">
              checkout canceled — pick a plan when you&apos;re ready.
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {tiers.map((slug) => {
            const plan = PLANS[slug]
            const featured = slug === 'pro'
            return (
              <div
                key={slug}
                className={
                  featured
                    ? 'rounded-2xl bg-white p-7 shadow-[0_30px_80px_-20px_rgba(255,255,255,0.25)] relative'
                    : 'rounded-2xl bg-white/5 border border-white/15 p-7 backdrop-blur-sm'
                }
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black text-white text-[10px] uppercase tracking-[0.2em]">
                    most popular
                  </span>
                )}
                <div className={featured ? 'text-slate-900' : 'text-white'}>
                  <div className="text-[12px] uppercase tracking-[0.2em] mb-2 opacity-70">
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`${fraunces.className} italic text-5xl font-medium`}>
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-sm opacity-60">/month</span>
                  </div>
                  <p className={`text-[13px] mb-6 ${featured ? 'text-slate-600' : 'text-white/60'}`}>
                    {plan.tagline}
                  </p>

                  <ul className="space-y-2.5 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-[13px] leading-relaxed">
                        <span className={featured ? 'text-slate-400' : 'text-white/40'}>—</span>
                        <span className={featured ? 'text-slate-700' : 'text-white/80'}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => startCheckout(slug)}
                    disabled={busy !== null}
                    className={
                      featured
                        ? 'w-full px-4 py-3 rounded-full bg-black text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                        : 'w-full px-4 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                    }
                  >
                    {busy === slug ? 'redirecting…' : `start ${TRIAL_DAYS}-day trial`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <p className="mt-8 text-sm text-rose-300 bg-rose-950/40 border border-rose-900/60 px-4 py-3 rounded-lg max-w-md mx-auto text-center">
            {error}
          </p>
        )}

        <p className="mt-10 text-center text-[12px] text-white/40">
          you won&apos;t be charged until day {TRIAL_DAYS + 1}. card required to start.
        </p>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PricingInner />
    </Suspense>
  )
}
