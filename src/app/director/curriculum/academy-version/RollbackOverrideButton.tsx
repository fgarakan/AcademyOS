'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react'
import { rollbackAcademyCurriculumOverrideAction } from '@/lib/actions/rollbackCurriculumOverride'

interface Props {
  overrideId: string
}

export function RollbackOverrideButton({ overrideId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  function handleRollback() {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    startTransition(async () => {
      const res = await rollbackAcademyCurriculumOverrideAction(overrideId)
      setResult({ ok: res.ok, error: res.error })
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        Rolled back.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {confirmed && (
        <div className="flex items-start gap-1.5 text-[11px] text-status-orange">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>This will mark the override as rolled back and create a rollback record. Click again to confirm.</span>
        </div>
      )}
      <button
        onClick={handleRollback}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          confirmed
            ? 'bg-status-red/10 text-status-red border border-status-red/30 hover:bg-status-red/20'
            : 'bg-surface-raised text-text-muted border border-border hover:text-text-secondary'
        }`}
      >
        <RotateCcw className="w-3 h-3" />
        {isPending ? 'Rolling back…' : confirmed ? 'Confirm Rollback' : 'Rollback'}
      </button>
      {result?.error && (
        <p className="text-[11px] text-status-red">{result.error}</p>
      )}
    </div>
  )
}
