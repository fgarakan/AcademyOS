'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/database.types'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email, password
    })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Get role to route correctly
    const { data: membership } = await supabase
      .from('academy_memberships')
      .select('role')
      .eq('profile_id', data.user.id)
      .eq('is_active', true)
      .single<Pick<Tables<'academy_memberships'>, 'role'>>()

    const role = membership?.role ?? 'player'
    const next = params.get('next')
    const roleRoute = {
      academy_director: '/director',
      head_coach: '/coach',
      coach: '/coach',
      player: '/player',
      parent: '/parent',
    }[role] ?? '/player'

    router.push(next ?? roleRoute)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="label-xs block mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@academy.com"
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm',
              'bg-surface border border-border',
              'text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:border-lime/50 transition-colors'
            )}
          />
        </div>
        <div>
          <label className="label-xs block mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                'w-full px-4 py-3 pr-11 rounded-xl text-sm',
                'bg-surface border border-border',
                'text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:border-lime/50 transition-colors'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-status-red text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-100',
          'bg-lime text-base',
          loading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 active:scale-98'
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Signing in...
          </span>
        ) : 'Sign in'}
      </button>
    </form>
  )
}
