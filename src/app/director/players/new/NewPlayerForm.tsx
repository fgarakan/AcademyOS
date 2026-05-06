'use client'

import { useState } from 'react'
import { createPlayerAction } from './createPlayerAction'

export function NewPlayerForm() {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await createPlayerAction(formData)
    if (result && !result.ok) {
      setError(result.error)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="first_name" className="label-xs">First name *</label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            autoComplete="given-name"
            placeholder="e.g. Maria"
            className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="last_name" className="label-xs">Last name *</label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            required
            autoComplete="family-name"
            placeholder="e.g. Rodriguez"
            className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="date_of_birth" className="label-xs">Date of birth *</label>
        <input
          id="date_of_birth"
          name="date_of_birth"
          type="date"
          required
          className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary focus:outline-none focus:border-lime/50 transition-colors"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="gender" className="label-xs">Gender (optional)</label>
        <select
          id="gender"
          name="gender"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary focus:outline-none focus:border-lime/50 transition-colors"
        >
          <option value="">Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className="label-xs">Initial notes (optional)</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Any context for this player's first session…"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-status-red">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-lime w-full"
      >
        {submitting ? 'Creating player…' : 'Create player'}
      </button>
    </form>
  )
}
