'use client'

// Sprint 1771 — Atomic Loop Clarity: Loop 6 fix
// Allows director to initiate a parent update draft from the player profile.
// Draft goes to the director review queue — no parent communication is sent from here.

import { useState, useTransition } from 'react'
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { initiateParentUpdateAction } from './initiateParentUpdateAction'

interface Props {
  playerId: string
}

export function InitiateParentUpdateButton({ playerId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error: string | null; draftId: string | null } | null>(null)

  function handleClick() {
    startTransition(async () => {
      const res = await initiateParentUpdateAction(playerId)
      setResult(res)
    })
  }

  if (result?.ok) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-xl border border-status-green/30 bg-status-green/5">
        <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs text-status-green font-medium">Parent update draft created.</p>
          <p className="text-[11px] text-text-muted leading-relaxed">
            The draft is now in the director review queue under &ldquo;Parent Communications.&rdquo;
            Review and approve it there — nothing is sent to the parent until you approve and apply.
          </p>
          <button
            className="text-[11px] text-text-muted underline underline-offset-2 hover:text-text-secondary mt-1"
            onClick={() => setResult(null)}
          >
            Create another draft
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {result?.error && (
        <div className="flex items-start gap-2 p-2 rounded-lg border border-status-red/30 bg-status-red/5">
          <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0 mt-0.5" />
          <p className="text-[11px] text-status-red leading-relaxed">{result.error}</p>
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="btn-lime flex items-center gap-2 text-sm disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {isPending ? 'Creating draft…' : 'Draft parent update'}
      </button>
      <p className="text-[10px] text-text-muted leading-relaxed">
        Creates a parent-safe draft for director review. Nothing is sent until you approve and apply the draft in the review queue.
      </p>
    </div>
  )
}
