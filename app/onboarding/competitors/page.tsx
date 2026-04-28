'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Fraunces } from 'next/font/google'
import CompetitorLogo from '@/app/components/CompetitorLogo'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
})

type Card = { name: string; description: string; domain?: string; addedBy: 'ai' | 'user' }

export default function CompetitorsPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login'); return
      }
      setChecking(false)
      setLoadingSuggestions(true)
      try {
        const res = await fetch('/api/onboarding/competitors/suggest', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) {
          if (res.status === 400) router.replace('/onboarding')
          else setError(data.error || 'could not fetch suggestions')
          return
        }
        setCards((data.competitors ?? []).map((c: { name: string; description: string; domain?: string }) => ({
          name: c.name, description: c.description, domain: c.domain, addedBy: 'ai' as const,
        })))
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoadingSuggestions(false)
      }
    })
  }, [router])

  const updateCard = (i: number, patch: Partial<Card>) =>
    setCards((prev) => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c))

  const removeCard = (i: number) =>
    setCards((prev) => prev.filter((_, idx) => idx !== i))

  const addCard = () =>
    setCards((prev) => [...prev, { name: '', description: '', addedBy: 'user' }])

  const handleContinue = async () => {
    setSaving(true); setError(null)
    const res = await fetch('/api/onboarding/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitors: cards }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error } = await res.json()
      setError(error || 'something went wrong'); return
    }
    router.push('/onboarding/done')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white/60">
        loading...
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="relative flex items-start justify-center px-6 py-16">
        <div className="max-w-2xl w-full">
          <span className="inline-block text-[11px] uppercase tracking-[0.25em] text-white/60 mb-3">
            step 2 of 2
          </span>
          <h1 className="text-4xl md:text-5xl text-white leading-tight mb-3">
            your{' '}
            <span className={`${fraunces.className} italic font-medium`}>
              competitors
            </span>
          </h1>
          <p className="text-base text-white/70 leading-relaxed mb-10 max-w-lg">
            we suggested some — edit, remove, or add your own. you can change these later.
          </p>

          {loadingSuggestions && (
            <div className="flex items-center gap-3 mb-6 text-sm text-white/60">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
              thinking about who watches your space…
            </div>
          )}

          <div className="space-y-3 mb-4">
            {cards.map((c, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
              >
                <div className="flex items-start gap-3 mb-3">
                  <input
                    value={c.name}
                    onChange={(e) => updateCard(i, { name: e.target.value, addedBy: 'user' })}
                    placeholder="competitor name"
                    className="flex-1 text-base font-semibold text-slate-900 placeholder:text-slate-400 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
                  />
                  <CompetitorLogo name={c.name} domain={c.domain} />
                  <button
                    onClick={() => removeCard(i)}
                    className="text-[12px] uppercase tracking-[0.18em] text-slate-400 hover:text-rose-600 px-2 py-2 transition-colors shrink-0"
                    aria-label="remove"
                  >
                    remove
                  </button>
                </div>
                <textarea
                  value={c.description}
                  onChange={(e) => updateCard(i, { description: e.target.value, addedBy: 'user' })}
                  placeholder="one-line description"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors resize-none"
                />
              </div>
            ))}
          </div>

          <button
            onClick={addCard}
            className="w-full px-4 py-3 rounded-2xl border-2 border-dashed border-white/25 bg-white/5 text-sm text-white/70 hover:border-white/50 hover:text-white hover:bg-white/10 transition-colors mb-8"
          >
            + add another
          </button>

          <button
            onClick={handleContinue}
            disabled={saving || loadingSuggestions}
            className="w-full px-4 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'saving…' : 'continue'}
          </button>
          {error && (
            <p className="mt-4 text-sm text-rose-300 bg-rose-950/40 border border-rose-900/60 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
