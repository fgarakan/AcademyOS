'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, ShieldOff, Loader2, AlertTriangle, X } from 'lucide-react'
import { confirmGateStatusAction } from './confirmGateStatusAction'

interface Props {
  playerId: string
  gateId: string
  currentStatus: string
}

const TERMINAL = new Set(['confirmed', 'waived', 'blocked'])

export function ConfirmGateButton({ playerId, gateId, currentStatus }: Props) {
  const [showWaive, setShowWaive] = useState(false)
  const [waiverReason, setWaiverReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (TERMINAL.has(currentStatus)) return null

  const isEvidenceMet = currentStatus === 'evidence_threshold_met'

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await confirmGateStatusAction(playerId, gateId, 'confirmed')
      if (result.error) setError(result.error)
    })
  }

  function handleWaive() {
    setError(null)
    startTransition(async () => {
      const result = await confirmGateStatusAction(playerId, gateId, 'waived', waiverReason || undefined)
      if (result.error) {
        setError(result.error)
      } else {
        setShowWaive(false)
        setWaiverReason('')
      }
    })
  }

  return (
    <div className="mt-2 space-y-2">
      {error && (
        <p className="text-[10px] text-status-red flex items-start gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      {!showWaive && (
        <div className="flex items-center gap-2 flex-wrap">
          {isEvidenceMet && (
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-lime text-base hover:bg-lime/90 transition-colors disabled:opacity-60"
            >
              {isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <CheckCircle2 className="w-3 h-3" />}
              {isPending ? 'Confirming…' : 'Confirm gate'}
            </button>
          )}
          <button
            onClick={() => setShowWaive(true)}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-text-muted hover:text-status-orange transition-colors disabled:opacity-60"
          >
            <ShieldOff className="w-3 h-3" /> Waive
          </button>
        </div>
      )}

      {showWaive && (
        <div className="space-y-2 border-t border-border pt-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-text-muted">Reason for waiver (optional):</p>
            <button
              onClick={() => { setShowWaive(false); setWaiverReason(''); setError(null) }}
              className="text-text-muted hover:text-text-secondary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <textarea
            value={waiverReason}
            onChange={e => { setWaiverReason(e.target.value); setError(null) }}
            disabled={isPending}
            rows={2}
            maxLength={1000}
            placeholder="e.g. Player demonstrates equivalent competency through competition results."
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 disabled:opacity-50 resize-none"
          />
          <button
            onClick={handleWaive}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-status-orange/10 border border-status-orange/20 text-status-orange hover:bg-status-orange/20 transition-colors disabled:opacity-60"
          >
            {isPending
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <ShieldOff className="w-3 h-3" />}
            {isPending ? 'Waiving…' : 'Confirm waiver'}
          </button>
        </div>
      )}
    </div>
  )
}
