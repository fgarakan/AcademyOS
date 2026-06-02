'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, ShieldCheck, Zap, Sparkles } from 'lucide-react'
import { activatePlayerAction } from '@/app/director/placement/placementDraftAction'

interface Props {
  playerId: string
  academyId: string
  approvedRecId: string | null
  groupName: string | null
  playerName: string | null
  isActive: boolean
}

export function StepActivatePlayer({
  playerId,
  academyId,
  approvedRecId,
  groupName,
  playerName,
  isActive: initialIsActive,
}: Props) {
  const [activated, setActivated] = useState(initialIsActive)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (activated) {
    return (
      <div className="space-y-5">
        {/* Activation success */}
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-lime/10 border border-lime/30">
          <CheckCircle2 className="w-5 h-5 text-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-lime">
              {playerName ?? 'Player'} is now active
            </p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Assigned to {groupName ?? 'group'}. No portal access or parent notifications have been sent.
            </p>
          </div>
        </div>

        {/* Blueprint generation notice */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-surface-raised border border-border">
          <Sparkles className="w-3.5 h-3.5 text-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-text-primary">Development blueprint generating</p>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              DONNA is building the development priorities, 30-day plan, and initial missions based on
              the assessment. These will appear in the full player profile within a few seconds.
            </p>
          </div>
        </div>

        {/* Next actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/director/players/${playerId}`}
            className="inline-flex items-center gap-1.5 text-sm px-5 py-2.5 rounded-xl border border-lime/40 text-lime hover:bg-lime/10 transition-colors"
          >
            View full player profile →
          </Link>
          <Link
            href={`/director/players/${playerId}?tab=development`}
            className="inline-flex items-center gap-1.5 text-sm px-5 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-lime/30 transition-colors"
          >
            View development plan →
          </Link>
        </div>
      </div>
    )
  }

  if (!approvedRecId) {
    return (
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-sm text-text-secondary">Confirm the placement in the previous step before activating.</p>
      </div>
    )
  }

  function handleActivate() {
    setError(null)
    startTransition(async () => {
      const result = await activatePlayerAction(approvedRecId!, academyId)
      if (result.error) { setError(result.error); return }
      setActivated(true)
    })
  }

  return (
    <div className="space-y-5">
      {/* Placement summary */}
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Placement Summary</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-text-muted">Player</p>
            <p className="text-sm font-medium text-text-primary">{playerName ?? '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-text-muted">Assigned Group</p>
            <p className="text-sm font-semibold text-lime">{groupName ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Safety guardrails */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">
          Confirmed at activation
        </p>
        {[
          'No parent or player portal access created',
          'No billing or enrollment triggered',
          'No parent communications sent',
          'Activated via finalize_player_placement()',
        ].map(label => (
          <div key={label} className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-status-green shrink-0" />
            <span className="text-[10px] text-text-muted">{label}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-status-red">{error}</p>}

      <button
        type="button"
        onClick={handleActivate}
        disabled={isPending}
        className="btn-lime flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Zap className="w-3.5 h-3.5" />
        )}
        {isPending ? 'Activating…' : 'Activate Player'}
      </button>
    </div>
  )
}
