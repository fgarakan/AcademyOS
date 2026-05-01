'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ConfirmRequirementProgressResult } from './requirementProgressConfirmationAction'

const STATUS_OPTIONS = [
  { value: 'not_started',     label: 'Not Started'     },
  { value: 'in_progress',     label: 'In Progress'     },
  { value: 'evidence_needed', label: 'Evidence Needed' },
  { value: 'met',             label: 'Met'             },
  { value: 'waived',          label: 'Waived'          },
  { value: 'blocked',         label: 'Blocked'         },
] as const

interface Props {
  progressId:    string
  currentStatus: string
  confirmAction: (
    progressId: string,
    newStatus:  string,
    note?:      string
  ) => Promise<ConfirmRequirementProgressResult>
}

export function RequirementProgressConfirmationControls({
  progressId,
  currentStatus,
  confirmAction,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [note, setNote]     = useState('')
  const [result, setResult] = useState<ConfirmRequirementProgressResult | null>(null)

  const hasChanges = selectedStatus !== currentStatus || note.trim().length > 0

  function handleSave() {
    setResult(null)
    startTransition(async () => {
      const res = await confirmAction(progressId, selectedStatus, note.trim() || undefined)
      setResult(res)
      if (res.ok) {
        router.refresh()
      }
    })
  }

  return (
    <div className="pt-3 mt-2 border-t border-border space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-text-muted">
        Confirm Status
      </p>

      {/* Status picker */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => { setSelectedStatus(opt.value); setResult(null) }}
            className={`text-[11px] border px-2 py-1 rounded transition-colors ${
              selectedStatus === opt.value
                ? 'bg-lime/10 border-lime/50 text-lime'
                : 'border-border text-text-muted hover:text-text-secondary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Show current saved status when the user has selected something different */}
      {selectedStatus !== currentStatus && (
        <p className="text-[10px] text-text-muted">
          Current saved: {STATUS_OPTIONS.find(o => o.value === currentStatus)?.label ?? currentStatus}
        </p>
      )}

      {/* Optional note */}
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note (max 1000 chars)"
        maxLength={1000}
        rows={2}
        className="w-full text-xs bg-surface border border-border rounded p-2 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/50"
      />

      {/* Guardrail copy */}
      <p className="text-[10px] text-text-muted leading-relaxed">
        Manual confirmation only. This does not move the player up, change levels, or publish anything to parents.
      </p>

      {/* Save button — only visible when something changed */}
      {hasChanges && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="btn-lime text-xs py-1.5 px-3 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Confirm Status'}
        </button>
      )}

      {/* Success / error feedback */}
      {result?.ok && (
        <p className="text-xs text-lime">Status confirmed.</p>
      )}
      {result && !result.ok && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}
    </div>
  )
}
