'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // on mount: check session, bounce to login if none
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
      } else {
        setChecking(false)
      }
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
    return <div className="min-h-screen flex items-center justify-center text-gray-500">loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <p className="text-sm text-gray-500 mb-2">step 1 of 3</p>
        <h1 className="text-3xl italic mb-2" style={{fontFamily:'Fraunces'}}>tell us about your company</h1>
        <p className="text-gray-600 mb-6">we'll use this to find your competitors.</p>
        <label className="block text-sm font-medium mb-1">company name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="blupin"
          className="w-full px-4 py-3 border rounded-lg mb-4" />
        <label className="block text-sm font-medium mb-1">what do you do?</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="AI-native competitive intelligence co-pilot for founders"
          rows={3} className="w-full px-4 py-3 border rounded-lg mb-6" />
        <button onClick={handleSubmit} disabled={!name || !description || loading}
          className="w-full px-4 py-3 bg-black text-white rounded-lg disabled:opacity-50">
          {loading ? 'saving...' : 'continue'}
        </button>
        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
      </div>
    </div>
  )
}