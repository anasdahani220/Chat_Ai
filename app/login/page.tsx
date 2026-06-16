'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  // Allow login with Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: "radial-gradient(125% 125% at 50% 101%, rgba(245,87,2,1) 10%, rgba(20,20,30,1) 60%)" }}
    >
      <div className="w-full max-w-md p-8 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm">

        {/* Title */}
        <h1 className="text-white text-2xl font-medium text-center mb-2">
          Welcome Back 👋
        </h1>
        <p className="text-white/50 text-sm text-center mb-8">
          Login to continue
        </p>

        <div className="space-y-4">

          {/* Email */}
          <div>
            <label className="text-white/70 text-sm mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-white/70 text-sm mb-1 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Register link */}
          <p className="text-white/50 text-sm text-center">
            Don't have an account?{' '}
            <a href="/register" className="text-orange-400 hover:text-orange-300 transition-colors">
              Register
            </a>
          </p>

        </div>
      </div>
    </div>
  )
}

