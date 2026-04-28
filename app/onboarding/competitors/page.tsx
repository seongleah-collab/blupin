'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Card = { name: string; description: string; addedBy: 'ai' | 'user' }

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
        setCards((data.competitors ?? []).map((c: { name: string; description: string }) => ({
          name: c.name, description: c.description, addedBy: 'ai' as const,
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
    return <div className="min-h-screen flex items-center justify-center text-gray-500">loading...</div>
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-6 py-16">
      <div className="max-w-2xl w-full">
        <p className="text-sm text-gray-500 mb-2">step 2 of 2</p>
        <h1 className="text-3xl italic mb-2" style={{fontFamily:'Fraunces'}}>your competitors</h1>
        <p className="text-gray-600 mb-6">we suggested some — edit, remove, or add your own. you can change these later.</p>

        {loadingSuggestions && (
          <div className="text-gray-500 mb-6">thinking about who watches your space...</div>
        )}

        <div className="space-y-3 mb-4">
          {cards.map((c, i) => (
            <div key={i} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-3 mb-2">
                <input
                  value={c.name}
                  onChange={(e) => updateCard(i, { name: e.target.value, addedBy: 'user' })}
                  placeholder="competitor name"
                  className="flex-1 text-base font-medium px-2 py-1 border rounded"
                />
                <button
                  onClick={() => removeCard(i)}
                  className="text-sm text-gray-500 hover:text-red-600 px-2 py-1"
                  aria-label="remove">
                  remove
                </button>
              </div>
              <textarea
                value={c.description}
                onChange={(e) => updateCard(i, { description: e.target.value, addedBy: 'user' })}
                placeholder="one-line description"
                rows={2}
                className="w-full px-2 py-1 border rounded text-sm text-gray-700"
              />
            </div>
          ))}
        </div>

        <button
          onClick={addCard}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 mb-6">
          + add another
        </button>

        <button
          onClick={handleContinue}
          disabled={saving || loadingSuggestions}
          className="w-full px-4 py-3 bg-black text-white rounded-lg disabled:opacity-50">
          {saving ? 'saving...' : 'continue'}
        </button>
        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
      </div>
    </div>
  )
}
