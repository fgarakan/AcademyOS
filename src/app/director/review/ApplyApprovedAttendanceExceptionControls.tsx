'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { applyApprovedAttendanceExceptionAction } from './actions'

interface Props {
  proposedActionId: string
}

export function ApplyApprovedAttendanceExceptionControls({ proposedActionId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null; attendanceRowsUpserted: number; skippedUnknown: number; unrosteredFollowUpsCreated: number } | null>(null)

  function handleApply() {
    startTransition(async () => {
      const res = await applyApprovedAttendanceExceptionAction(proposedActionId)
      setResult(res)
      if (res.ok) router.refresh()
    })
  }

  if (result?.ok) {
    return (
      <div className="space-y-1.5 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="font-medium">Applied.</span>
        </div>
        {result.attendanceRowsUpserted > 0 && (
          <p className="pl-5">{result.attendanceRowsUpserted} rostered player{result.attendanceRowsUpserted !== 1 ? 's' : ''} recorded.</p>
        )}
        {result.skippedUnknown > 0 && (
          <p className="pl-5 text-text-muted">{result.skippedUnknown} skipped (unknown status).</p>
        )}
        {result.unrosteredFollowUpsCreated > 0 && (
          <p className="pl-5">
            {result.unrosteredFollowUpsCreated} unexpected attendee follow-up{result.unrosteredFollowUpsCreated !== 1 ? 's' : ''} created — visible in the Placement Review tab.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-border text-[11px] text-text-muted">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
        <span>
          Applying will not create a player or change a roster. Rostered attendance will be recorded (unknown status skipped). Each unexpected attendee creates a placement review follow-up for director decision.
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleApply}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-lime/10 text-lime border border-lime/30 hover:bg-lime/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <CheckCircle className="w-3.5 h-3.5" />
          }
          {isPending ? 'Applying…' : 'Apply Exception Draft'}
        </button>
      </div>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}
    </div>
  )
}
