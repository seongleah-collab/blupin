'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Fraunces } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
})

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
        return
      }
      // already-onboarded users shouldn't see the form again. send
      // them to /chat where they actually use the product.
      const { data: company } = await supabase
        .from('user_companies')
        .select('onboarded_at')
        .eq('id', session.user.id)
        .maybeSingle()
      if (company?.onboarded_at) {
        router.replace('/chat')
        return
      }
      setChecking(false)
    })
  }, [router])

  const handleSubmit = async () => {
    setLoading(true); setError(null)
    const res = await fetch('/api/onboarding/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    setLoading(false)
    if (!res.ok) {
      const { error } = await res.json()
      setError(error || 'something went wrong'); return
    }
    router.push('/onboarding/competitors')
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
      <div className="relative flex items-center justify-center px-6 py-16 min-h-screen">
        <div className="max-w-lg w-full">
          <span className="inline-block text-[11px] uppercase tracking-[0.25em] text-white/60 mb-3">
            step 1 of 2
          </span>
          <h1 className="text-4xl md:text-5xl text-white leading-tight mb-3">
            tell us about your{' '}
            <span className={`${fraunces.className} italic font-medium`}>
              company
            </span>
          </h1>
          <p className="text-base text-white/70 leading-relaxed mb-10 max-w-md">
            we&apos;ll use this to find your competitors.
          </p>

          <div className="rounded-2xl bg-white p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] mb-6">
            <label className="block text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">
              company name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="blupin"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors mb-5"
            />
            <label className="block text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-2">
              what do you do?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AI-native competitive intelligence co-pilot for founders"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name || !description || loading}
            className="w-full px-4 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'saving…' : 'continue'}
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
