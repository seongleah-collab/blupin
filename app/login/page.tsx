'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Fraunces } from 'next/font/google'
import Wordmark from '@/app/components/Wordmark'

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
})

type Provider = 'google' | 'github'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleEmailSubmit = async () => {
    setLoading(true); setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/chat')
  }

  const handleOAuth = async (provider: Provider) => {
    setOauthLoading(provider); setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setOauthLoading(null)
      setError(error.message)
    }
  }

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <Wordmark className="text-2xl font-medium text-white" dotClassName="text-blue-300" />
          </Link>
          <h1 className="text-3xl md:text-4xl text-white leading-tight mb-2">
            welcome{' '}
            <span className={`${fraunces.className} italic font-medium`}>back</span>
          </h1>
          <p className="text-white/70 text-sm">
            sign in to pick up where you left off.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
          <button
            onClick={() => handleOAuth('google')}
            disabled={loading || oauthLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-white border border-slate-300 text-slate-900 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            <GoogleIcon />
            {oauthLoading === 'google' ? 'redirecting…' : 'continue with google'}
          </button>

          <button
            onClick={() => handleOAuth('github')}
            disabled={loading || oauthLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitHubIcon />
            {oauthLoading === 'github' ? 'redirecting…' : 'continue with github'}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
              or with email
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            disabled={loading || oauthLoading !== null}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors mb-3"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            disabled={loading || oauthLoading !== null}
            onKeyDown={(e) => e.key === 'Enter' && email && password && handleEmailSubmit()}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors mb-4"
          />
          <button
            onClick={handleEmailSubmit}
            disabled={!email || !password || loading || oauthLoading !== null}
            className="w-full px-4 py-3 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'signing in…' : 'sign in'}
          </button>

          {error && (
            <p className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-white/70">
          new here?{' '}
          <Link href="/#waitlist" className="text-white underline underline-offset-2 hover:text-white/80">
            join the waitlist
          </Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 0z"/>
    </svg>
  )
}
