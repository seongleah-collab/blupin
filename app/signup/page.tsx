'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError('password must be at least 6 characters'); return
    }
    setLoading(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-3xl italic mb-2" style={{fontFamily:'Fraunces'}}>welcome to blupin</h1>
        <p className="text-gray-600 mb-6">create your account</p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full px-4 py-3 border rounded-lg mb-3" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="password (6+ characters)"
          className="w-full px-4 py-3 border rounded-lg mb-3"
          onKeyDown={(e) => e.key === 'Enter' && email && password && handleSubmit()} />
        <button onClick={handleSubmit} disabled={!email || !password || loading}
          className="w-full px-4 py-3 bg-black text-white rounded-lg disabled:opacity-50">
          {loading ? 'creating account...' : 'get started'}
        </button>
        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
        <p className="text-sm text-gray-600 mt-4 text-center">
          already have an account? <a href="/login" className="underline">sign in</a>
        </p>
      </div>
    </div>
  )
}