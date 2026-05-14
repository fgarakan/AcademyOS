'use client'

// Sprint 284 — Donna Level Movement Apply Controls
// Shows apply controls for an approved level_review proposed_action.
// Requires two explicit director actions: Approve in Decision Controls, then Apply Level Change here.
// Never notifies parent, player, or coach. Writes audit_log on apply.

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle, Loader2, ShieldAlert } from 'lucide-react'
import { applyApprovedLevelMovementAction } from '@/app/director/_actions/donnaLevelMovementActions'

interface Props {
  proposedActionId: string
  playerLabel: string | null
  previewText: string
  onSuccess: () => void
}

export function DonnaLevelMovementApplyControls({
  proposedActionId,
  playerLabel,
  previewText,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string; safetyNotes: string[] } | null>(null)

  function handleApply() {
    startTransition(async () => {
      const res = await applyApprovedLevelMovementAction(proposedActionId)
      setResult(res)
      if (res.ok) {
        setConfirmed(false)
        onSuccess()
      }
    })
  }

  if (result?.ok) {
    return (
      <div
        className="rounded-lg px-3 py-2.5 space-y-1.5"
        style={{ background: 'rgba(48,209,88,0.07)', border: '1px solid rgba(48,209,88,0.25)' }}
      >
        <div className="flex items-center gap-2 text-xs text-status-green">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium">{result.message}</span>
        </div>
        {result.safetyNotes.map((note, i) => (
          <p key={i} className="text-[10px] text-text-muted leading-snug pl-5">{note}</p>
        ))}
      </div>
    )
  }

  return (
    <div
      className="space-y-2.5 pt-2.5"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      {/* Level change preview */}
      {previewText && (
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(200,255,0,0.05)', border: '1px solid rgba(200,255,0,0.15)' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: '#C8FF00' }}>
            Proposed change
          </p>
          <p className="text-[11px] text-text-secondary">{previewText}</p>
          {playerLabel && (
            <p className="text-[10px] text-text-muted mt-0.5">Player: {playerLabel}</p>
          )}
        </div>
      )}

      {/* Warning */}
      <div
        className="rounded-lg px-3 py-2 flex items-start gap-2"
        style={{ background: 'rgba(255,149,0,0.06)', border: '1px solid rgba(255,149,0,0.2)' }}
      >
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-px" style={{ color: '#FF9500' }} />
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: '#FF9500' }}>
            This will apply the level change
          </p>
          <p className="text-[10px] text-text-muted leading-snug">
            The player&apos;s level will be updated in the database. No parent, player, or coach will be notified. An audit log will be written.
          </p>
        </div>
      </div>

      {/* Error */}
      {result && !result.ok && (
        <div
          className="rounded-lg px-3 py-2 flex items-start gap-2"
          style={{ background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.25)' }}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" style={{ color: '#FF3B30' }} />
          <p className="text-[11px] text-text-secondary leading-snug">{result.message}</p>
        </div>
      )}

      {/* Confirmation gate */}
      {!confirmed ? (
        <button
          onClick={() => setConfirmed(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'rgba(255,149,0,0.08)',
            color: '#FF9500',
            border: '1px solid rgba(255,149,0,0.25)',
          }}
        >
          <AlertTriangle className="w-3 h-3" />
          Apply Level Change
        </button>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] text-status-orange font-semibold">
            Confirm: this will update the player&apos;s level. This action is recorded in the audit log.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              style={{
                background: 'rgba(255,59,48,0.10)',
                color: '#FF3B30',
                border: '1px solid rgba(255,59,48,0.3)',
              }}
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Yes, apply level change
            </button>
            <button
              onClick={() => setConfirmed(false)}
              className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
