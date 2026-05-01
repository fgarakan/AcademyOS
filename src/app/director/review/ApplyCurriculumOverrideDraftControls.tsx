'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Play, CheckCircle, AlertTriangle } from 'lucide-react'
import { applyApprovedCurriculumOverrideDraftAction } from './actions'

interface Props {
  proposedActionId: string
}

export function ApplyCurriculumOverrideDraftControls({ proposedActionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null; overrideId: string | null } | null>(null)

  function handleApply() {
    startTransition(async () => {
      const res = await applyApprovedCurriculumOverrideDraftAction(proposedActionId)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Override applied. Refreshing…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
        <span>
          Applying creates an official academy curriculum override record. This is tracked,
          auditable, and reversible via the rollback control in Academy Version details.
        </span>
      </div>

      <button
        onClick={handleApply}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-lime/10 text-lime border border-lime/30 hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play className="w-3.5 h-3.5" />
        {isPending ? 'Applying override…' : 'Apply Academy Curriculum Override'}
      </button>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}
    </div>
  )
}
