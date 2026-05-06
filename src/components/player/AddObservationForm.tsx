'use client'

import { useRef, useState, useTransition } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui'

const OBSERVATION_TYPES = [
  { value: 'general',            label: 'General' },
  { value: 'technical',          label: 'Technical' },
  { value: 'tactical',           label: 'Tactical' },
  { value: 'movement',           label: 'Movement' },
  { value: 'competition',        label: 'Competition' },
  { value: 'behavioral',         label: 'Behavioral' },
  { value: 'injury_concern',     label: 'Injury Concern' },
  { value: 'positive_highlight', label: 'Positive Highlight' },
]

interface Props {
  onSubmit: (formData: FormData) => Promise<void>
}

export function AddObservationForm({ onSubmit }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await onSubmit(formData)
        formRef.current?.reset()
        setSuccess(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save observation')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <p className="label-xs">Add Coach Observation</p>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-text-muted mb-4">
          Saved internally. Not visible to players or parents unless separately approved.
        </p>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-text-muted mb-1.5">Type</label>
            <select
              name="observation_type"
              defaultValue="general"
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime"
            >
              {OBSERVATION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-text-muted mb-1.5">Observation</label>
            <textarea
              name="content"
              required
              rows={4}
              placeholder="Describe what you observed…"
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="is_private"
              value="true"
              defaultChecked
              className="rounded border-border bg-surface-raised accent-lime"
            />
            <span className="text-xs text-text-secondary">Internal only (not visible to parents or students)</span>
          </label>

          {error && <p className="text-xs text-status-red">{error}</p>}
          {success && <p className="text-xs text-status-green">Observation saved.</p>}

          <button
            type="submit"
            disabled={isPending}
            className="btn-lime w-full disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Add Observation'}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
