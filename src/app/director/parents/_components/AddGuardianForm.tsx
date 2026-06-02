'use client'

// Add Guardian Form V1 — Sprint 1166-1185
// Allows director to link a parent/guardian to a player.
// Calls addGuardianAction (server action).

import { useState, useTransition } from 'react'
import { addGuardianAction, type AddGuardianResult } from '@/app/director/parents/addGuardianAction'
import { CheckCircle2, AlertCircle, Loader2, UserPlus } from 'lucide-react'

interface PlayerOption {
  id: string
  fullName: string
}

interface AddGuardianFormProps {
  players: PlayerOption[]
}

export function AddGuardianForm({ players }: AddGuardianFormProps) {
  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [playerId, setPlayerId]     = useState(players[0]?.id ?? '')
  const [result, setResult]         = useState<AddGuardianResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !playerId) return
    setResult(null)

    startTransition(async () => {
      const res = await addGuardianAction({
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim() || undefined,
        phone:     phone.trim() || undefined,
        relationship,
        playerId,
        isPrimary: true,
      })
      setResult(res)
      if (res.ok && res.outcome !== 'duplicate') {
        setFirstName('')
        setLastName('')
        setEmail('')
        setPhone('')
      }
    })
  }

  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-raised px-4 py-4 text-center">
        <p className="text-xs text-text-muted">Add players first before linking parent accounts.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-surface-raised flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-lime" />
        <p className="text-sm font-semibold text-text-primary">Add Parent / Guardian</p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <p className="text-xs text-text-muted leading-relaxed">
          Link a parent or guardian to a player. If they have an AcademyOS account, they'll be connected automatically.
        </p>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="label-xs text-text-muted">First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Sarah"
              required
              className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-lime/40 transition-colors"
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <label className="label-xs text-text-muted">Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Chen"
              required
              className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-lime/40 transition-colors"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="label-xs text-text-muted">Email (for account linking)</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="parent@example.com"
            className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-lime/40 transition-colors"
            disabled={isPending}
          />
          <p className="text-[10px] text-text-muted">If their AcademyOS account matches this email, they'll be linked automatically.</p>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="label-xs text-text-muted">Phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
            className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 outline-none focus:border-lime/40 transition-colors"
            disabled={isPending}
          />
        </div>

        {/* Relationship + Player row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="label-xs text-text-muted">Relationship</label>
            <select
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text-secondary outline-none focus:border-lime/40 transition-colors"
              disabled={isPending}
            >
              <option value="parent">Parent</option>
              <option value="guardian">Guardian</option>
              <option value="carer">Carer</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="label-xs text-text-muted">Player *</label>
            <select
              value={playerId}
              onChange={e => setPlayerId(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-text-secondary outline-none focus:border-lime/40 transition-colors"
              disabled={isPending}
            >
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || !firstName.trim() || !lastName.trim() || !playerId}
          className="w-full py-2.5 rounded-xl bg-lime text-base text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Adding…' : 'Add Guardian'}
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
                {result.ok
                  ? result.outcome === 'duplicate'
                    ? 'Guardian already linked to this player.'
                    : `Guardian added.${result.profileLinked ? ' Account linked.' : ' Send them the login link to connect their account.'}`
                  : 'Failed to add guardian'}
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
