'use client'

import { useState, useTransition } from 'react'
import { UserCheck, UserPlus, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import {
  linkGuardianToPlayerAction,
  unlinkGuardianFromPlayerAction,
  type LinkGuardianInput,
} from './guardianLinkingAction'

export interface LinkedGuardian {
  guardianId: string
  firstName: string
  lastName: string
  email: string | null
  relationship: string
  profileId: string | null
}

interface Props {
  playerId: string
  academyId: string
  linkedGuardians: LinkedGuardian[]
}

export function GuardianLinkingPanel({ playerId, academyId, linkedGuardians }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleLink() {
    if (!firstName.trim() || !lastName.trim()) {
      setResult({ ok: false, error: 'First and last name are required.' })
      return
    }
    setResult(null)
    const input: LinkGuardianInput = { playerId, academyId, firstName, lastName, email, relationship }
    startTransition(async () => {
      const res = await linkGuardianToPlayerAction(input)
      setResult(res)
      if (res.ok) {
        setFirstName(''); setLastName(''); setEmail(''); setRelationship('parent')
        setShowForm(false)
      }
    })
  }

  function handleUnlink(guardianId: string) {
    setResult(null)
    startTransition(async () => {
      const res = await unlinkGuardianFromPlayerAction(playerId, guardianId, academyId)
      if (!res.ok) setResult(res)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-lime" />
            <p className="label-xs">Parent / Guardian Access</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-lime hover:opacity-80 flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" /> Link guardian
            </button>
          )}
        </div>
        <p className="text-[11px] text-text-muted mt-1">
          Linked guardians can access the parent portal for this player once they sign up with the linked email.
        </p>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">

        {/* Linked guardians list */}
        {linkedGuardians.length === 0 ? (
          <p className="text-xs text-text-muted">No guardians linked yet.</p>
        ) : (
          <div className="space-y-2">
            {linkedGuardians.map(g => (
              <div
                key={g.guardianId}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-surface-raised border border-border"
              >
                <div className="min-w-0">
                  <p className="text-sm text-text-primary font-medium truncate">
                    {g.firstName} {g.lastName}
                  </p>
                  <p className="text-[11px] text-text-muted capitalize">
                    {g.relationship}
                    {g.email ? ` · ${g.email}` : ''}
                  </p>
                  {g.profileId ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-green mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
                      Portal access active
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-muted mt-0.5 block">
                      No account linked yet
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleUnlink(g.guardianId)}
                  disabled={isPending}
                  title="Remove guardian link"
                  className="w-6 h-6 rounded flex items-center justify-center text-text-muted hover:text-status-red hover:bg-status-red/10 transition-colors disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add guardian form */}
        {showForm && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-[11px] text-text-muted font-medium uppercase tracking-widest">Add guardian</p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-xs block mb-1">First name <span className="text-status-red">*</span></label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-surface-raised border border-border rounded px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 disabled:opacity-50"
                  placeholder="First"
                />
              </div>
              <div>
                <label className="label-xs block mb-1">Last name <span className="text-status-red">*</span></label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-surface-raised border border-border rounded px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 disabled:opacity-50"
                  placeholder="Last"
                />
              </div>
            </div>

            <div>
              <label className="label-xs block mb-1">Email (for portal access)</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isPending}
                className="w-full bg-surface-raised border border-border rounded px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 disabled:opacity-50"
                placeholder="parent@example.com"
              />
              <p className="text-[10px] text-text-muted mt-1">
                When a parent signs up with this email, they'll be linked to this guardian record.
              </p>
            </div>

            <div>
              <label className="label-xs block mb-1">Relationship</label>
              <select
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                disabled={isPending}
                className="w-full bg-surface-raised border border-border rounded px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-lime/50 disabled:opacity-50"
              >
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
                <option value="grandparent">Grandparent</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleLink}
                disabled={isPending || !firstName.trim() || !lastName.trim()}
                className="btn-lime text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                {isPending ? 'Linking…' : 'Link Guardian'}
              </button>
              <button
                onClick={() => { setShowForm(false); setResult(null) }}
                disabled={isPending}
                className="btn-ghost text-xs px-3 py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
            result.ok
              ? 'bg-status-green/10 border border-status-green/30 text-status-green'
              : 'bg-status-red/10 border border-status-red/30 text-status-red'
          }`}>
            {result.ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
            <span>{result.ok ? 'Guardian linked successfully.' : result.error}</span>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
