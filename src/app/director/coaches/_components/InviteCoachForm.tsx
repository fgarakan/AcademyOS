'use client'

// Coach Invite Form V1 — Sprint 1166-1185
// Simple form for directors to invite coaches by email.
// Calls inviteCoachAction (server action).

import { useState, useTransition } from 'react'
import { inviteCoachAction, type InviteCoachResult } from '@/app/director/coaches/inviteCoachAction'
import { CheckCircle2, AlertCircle, Loader2, UserPlus } from 'lucide-react'

type CoachRole = 'coach' | 'head_coach'

export function InviteCoachForm() {
  const [email, setEmail]     = useState('')
  const [role, setRole]       = useState<CoachRole>('coach')
  const [result, setResult]   = useState<InviteCoachResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setResult(null)

    startTransition(async () => {
      const res = await inviteCoachAction({ email: email.trim(), role })
      setResult(res)
      if (res.ok) setEmail('')
    })
  }

  const outcomeLabels: Record<string, string> = {
    linked:         'Coach linked to academy successfully.',
    already_member: 'This coach is already an active member.',
    role_updated:   'Coach role updated.',
    no_account:     'No account found for this email.',
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-surface-raised flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-lime" />
        <p className="text-sm font-semibold text-text-primary">Invite Coach</p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <p className="text-xs text-text-muted leading-relaxed">
          The coach must already have an account. Enter their email to link them to this academy.
        </p>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="label-xs text-text-muted">Coach Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="coach@example.com"
            required
            className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-lime/40 transition-colors"
            disabled={isPending}
          />
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="label-xs text-text-muted">Role</label>
          <div className="flex gap-2">
            {(['coach', 'head_coach'] as CoachRole[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                  role === r
                    ? 'bg-lime/10 border-lime/30 text-lime'
                    : 'bg-surface-raised border-border text-text-secondary hover:border-border-strong'
                }`}
              >
                {r === 'head_coach' ? 'Head Coach' : 'Coach'}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="w-full py-2.5 rounded-xl bg-lime text-base text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Inviting…' : 'Invite Coach'}
        </button>

        {/* Result */}
        {result && (
          <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl ${
            result.ok
              ? 'bg-status-green/8 border border-status-green/20'
              : 'bg-status-red/8 border border-status-red/20'
          }`}>
            {result.ok
              ? <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
              : <AlertCircle  className="w-4 h-4 text-status-red    shrink-0 mt-0.5" />
            }
            <div>
              <p className={`text-sm font-semibold ${result.ok ? 'text-status-green' : 'text-status-red'}`}>
                {result.ok ? (outcomeLabels[result.outcome ?? ''] ?? 'Done.') : 'Invite failed'}
              </p>
              {!result.ok && result.error && (
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{result.error}</p>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
