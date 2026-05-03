'use client'

import { useState, useTransition } from 'react'
import { ClipboardList, Check, Loader2, AlertTriangle, X } from 'lucide-react'
import { recordGateEvidenceAction } from './recordGateEvidenceAction'

interface Props {
  playerId: string
  academyId: string
  gateId: string
  gateCriterion: string
}

export function GateEvidenceButton({ playerId, academyId, gateId, gateCriterion }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!text.trim()) { setError('Enter the observed evidence before submitting.'); return }
    setError(null)
    startTransition(async () => {
      const result = await recordGateEvidenceAction(playerId, academyId, gateId, gateCriterion, text)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setText('')
        setTimeout(() => { setSaved(false); setOpen(false) }, 1800)
      }
    })
  }

  if (saved) {
    return (
      <p className="text-[10px] text-status-green flex items-center gap-1 mt-1.5">
        <Check className="w-3 h-3" /> Evidence submitted for review.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-text-muted hover:text-lime transition-colors font-medium"
      >
        <ClipboardList className="w-3 h-3" />
        Record evidence
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-2 border-t border-border pt-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-text-muted">Describe what you observed:</p>
        <button onClick={() => { setOpen(false); setText(''); setError(null) }} className="text-text-muted hover:text-text-secondary transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setError(null) }}
        disabled={isPending}
        rows={2}
        placeholder="e.g. Player consistently hit 75%+ first serves in practice sets today."
        className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 disabled:opacity-50 resize-none"
      />
      {error && (
        <p className="text-[10px] text-status-red flex items-start gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />{error}
        </p>
      )}
      <button
        onClick={handleSubmit}
        disabled={isPending || !text.trim()}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
          text.trim() && !isPending
            ? 'bg-lime text-base hover:bg-lime/90'
            : 'bg-surface-raised text-text-muted border border-border cursor-not-allowed opacity-60',
        ].join(' ')}
      >
        {isPending
          ? <><Loader2 className="w-3 h-3 animate-spin" /> Submitting…</>
          : 'Submit for review'}
      </button>
      <p className="text-[9px] text-text-muted">Goes to director review queue. Nothing changes until approved.</p>
    </div>
  )
}
