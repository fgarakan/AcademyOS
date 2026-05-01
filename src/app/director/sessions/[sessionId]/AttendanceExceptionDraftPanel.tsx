'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { createAttendanceExceptionDraftAction } from './attendanceExceptionDraftAction'

interface Props {
  sessionId: string
  hasGroup: boolean
  rosterCount: number
}

export function AttendanceExceptionDraftPanel({ sessionId, hasGroup, rosterCount }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rawInput, setRawInput] = useState('')
  const [result, setResult] = useState<{ ok: boolean; error: string | null; draftId: string | null } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rawInput.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await createAttendanceExceptionDraftAction(sessionId, rawInput)
      setResult(res)
      if (res.ok) {
        setRawInput('')
        router.refresh()
      }
    })
  }

  if (result?.ok) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-status-green/10 border border-status-green/30 text-xs text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Attendance exception draft created — see the review queue for director review.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {!hasGroup && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-orange/5 border border-status-orange/20 text-[11px] text-text-muted">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-status-orange" />
          <span>No group is assigned to this session. The draft will have no roster to match against.</span>
        </div>
      )}

      {hasGroup && rosterCount > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <Users className="w-3 h-3" />
          <span>{rosterCount} player{rosterCount !== 1 ? 's' : ''} on roster — names will be matched automatically.</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="label-xs" htmlFor="attendance-recap-input">
          Attendance recap
        </label>
        <textarea
          id="attendance-recap-input"
          value={rawInput}
          onChange={e => setRawInput(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder={'e.g. "Everyone was here except Sarah. Also, this new kid Jeremy showed up."'}
          disabled={isPending}
          className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-lime/40 disabled:opacity-50"
        />
        {rawInput.length > 1600 && (
          <p className="text-[10px] text-text-muted text-right">{rawInput.length}/2000</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="submit"
          disabled={isPending || !rawInput.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-lime text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Users className="w-3.5 h-3.5" />
          }
          {isPending ? 'Creating draft…' : 'Create Attendance Exception Draft'}
        </button>

        <p className="text-[10px] text-text-muted">
          Creates a draft for director review — no attendance is recorded yet.
        </p>
      </div>

      {result?.error && (
        <p className="text-xs text-status-red">{result.error}</p>
      )}
    </form>
  )
}
