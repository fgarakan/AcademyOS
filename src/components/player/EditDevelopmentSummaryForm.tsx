'use client'

import { useState, useTransition } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import type { PlayerDevelopmentSummary } from '@/lib/backend/notes'

interface Props {
  summary: PlayerDevelopmentSummary | null
  onSubmit: (formData: FormData) => Promise<void>
}

export function EditDevelopmentSummaryForm({ summary, onSubmit }: Props) {
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
        setSuccess(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <p className="label-xs">
          {summary ? 'Edit Development Summary' : 'Create Development Summary'}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-text-muted mb-1.5">
              Current Strengths
              <span className="ml-1 font-normal normal-case">(one per line)</span>
            </label>
            <textarea
              name="current_strengths"
              rows={3}
              defaultValue={summary?.current_strengths?.join('\n') ?? ''}
              placeholder={'Consistent forehand\nGood court positioning'}
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-muted mb-1.5">
              Things to Work On
              <span className="ml-1 font-normal normal-case">(one per line)</span>
            </label>
            <textarea
              name="things_to_work_on"
              rows={3}
              defaultValue={summary?.things_to_work_on?.join('\n') ?? ''}
              placeholder={'Backhand slice consistency\nNet approach timing'}
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-text-muted mb-1.5">Development Focus</label>
            <textarea
              name="development_focus"
              rows={2}
              defaultValue={summary?.development_focus ?? ''}
              placeholder="Current priority for this training cycle…"
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-[11px] text-text-muted">Coach Summary</label>
              <span className="text-[10px] text-status-orange uppercase tracking-wide">Internal</span>
            </div>
            <textarea
              name="coach_summary"
              rows={3}
              defaultValue={summary?.coach_summary ?? ''}
              placeholder="Internal notes for the coaching team only…"
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-[11px] text-text-muted">Student-Friendly Summary</label>
              <span className="text-[10px] text-text-muted uppercase tracking-wide">
                Hidden until visibility is enabled
              </span>
            </div>
            <textarea
              name="student_friendly_summary"
              rows={3}
              defaultValue={summary?.student_friendly_summary ?? ''}
              placeholder="Encouraging summary written for the student…"
              className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime resize-none"
            />
          </div>

          {/* Visibility gates — disabled in this sprint */}
          <div className="space-y-2 pt-1 opacity-50 pointer-events-none">
            <p className="label-xs">Visibility gates (future sprint)</p>
            <label className="flex items-center gap-2 cursor-not-allowed select-none">
              <input
                type="checkbox"
                name="show_to_student"
                value="true"
                defaultChecked={summary?.show_to_student ?? false}
                disabled
                className="rounded border-border bg-surface-raised accent-lime"
              />
              <span className="text-xs text-text-secondary">Show student-friendly summary to student</span>
            </label>
            <label className="flex items-center gap-2 cursor-not-allowed select-none">
              <input
                type="checkbox"
                name="show_to_parent"
                value="true"
                defaultChecked={summary?.show_to_parent ?? false}
                disabled
                className="rounded border-border bg-surface-raised accent-lime"
              />
              <span className="text-xs text-text-secondary">Show parent summary to parent</span>
            </label>
          </div>

          {error && <p className="text-xs text-status-red">{error}</p>}
          {success && <p className="text-xs text-status-green">Summary saved.</p>}

          <button
            type="submit"
            disabled={isPending}
            className="btn-lime w-full disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save Summary'}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
