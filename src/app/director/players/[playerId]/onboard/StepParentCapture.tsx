'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { addGuardianAction } from './addGuardianAction'

const RELATIONSHIPS = ['parent', 'guardian', 'grandparent', 'sibling', 'other']

interface Props {
  playerId: string
  initialCount: number
  onGuardianAdded: () => void
}

export function StepParentCapture({ playerId, initialCount, onGuardianAdded }: Props) {
  const [count, setCount] = useState(initialCount)
  const [showForm, setShowForm] = useState(initialCount === 0)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [relationship, setRelationship] = useState('parent')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setRelationship('parent')
    setError(null)
    setShowForm(false)
  }

  function handleAdd() {
    if (!firstName.trim()) { setError('First name is required.'); return }
    if (!lastName.trim()) { setError('Last name is required.'); return }
    setError(null)
    startTransition(async () => {
      const result = await addGuardianAction({
        playerId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        relationship,
      })
      if (!result.ok) { setError(result.error); return }
      setCount(c => c + 1)
      onGuardianAdded()
      resetForm()
    })
  }

  const inputClass =
    'w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors'

  return (
    <div className="space-y-4">
      {/* Linked guardians count */}
      {count > 0 && (
        <div className="flex items-center gap-2 py-1">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-sm text-text-primary">
            {count} guardian{count !== 1 ? 's' : ''} linked
          </p>
        </div>
      )}

      {showForm ? (
        <div className="space-y-3 px-4 py-4 rounded-xl bg-surface-raised border border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-secondary">Guardian details</p>
            {count > 0 && (
              <button
                type="button"
                onClick={resetForm}
                className="text-text-muted hover:text-text-secondary transition-colors"
                aria-label="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="label-xs">First name *</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="e.g. Maria"
                autoComplete="given-name"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="label-xs">Last name *</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="e.g. Rodriguez"
                autoComplete="family-name"
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label-xs">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contact@email.com"
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="label-xs">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                autoComplete="tel"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="label-xs">Relationship</label>
              <select
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                className={inputClass}
              >
                {RELATIONSHIPS.map(r => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-status-red">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending}
              className="btn-lime flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isPending ? 'Adding…' : 'Add Guardian'}
            </button>
            {count > 0 && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isPending}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-lime/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add {count > 0 ? 'Another Guardian' : 'Parent or Guardian'}
          </button>

          <Link
            href={`/director/players/${playerId}`}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Manage from full profile →
          </Link>
        </div>
      )}
    </div>
  )
}
