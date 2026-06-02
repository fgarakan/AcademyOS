'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { onboardingPlacementAction } from './onboardingPlacementAction'

interface GroupOption {
  id: string
  name: string
  track: string | null
}

interface Props {
  playerId: string
  groups: GroupOption[]
  approvedRecId: string | null
  approvedGroupName: string | null
  donnaRecommendedGroupId: string | null
  onDone: (recId: string, selectedGroupId: string) => void
}

export function StepDirectorReview({
  playerId,
  groups,
  approvedRecId,
  approvedGroupName,
  donnaRecommendedGroupId,
  onDone,
}: Props) {
  const defaultGroupId =
    donnaRecommendedGroupId && groups.find(g => g.id === donnaRecommendedGroupId)
      ? donnaRecommendedGroupId
      : (groups[0]?.id ?? '')

  const [selectedGroupId, setSelectedGroupId] = useState<string>(defaultGroupId)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (approvedRecId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <p className="text-sm font-semibold text-text-primary">Placement confirmed</p>
        </div>
        <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
          <p className="text-[10px] text-text-muted mb-0.5">Assigned Group</p>
          <p className="text-sm font-semibold text-lime">{approvedGroupName ?? '—'}</p>
        </div>
        <button
          type="button"
          onClick={() => onDone(approvedRecId, selectedGroupId)}
          className="btn-lime px-5 py-2 text-sm"
        >
          Activate Player →
        </button>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="px-4 py-3 rounded-xl bg-surface-raised border border-border">
        <p className="text-sm text-text-secondary">No active groups found.</p>
        <p className="text-xs text-text-muted mt-1">
          Create a group from the academy setup, then return here to confirm placement.
        </p>
      </div>
    )
  }

  function handleConfirm() {
    if (!selectedGroupId) { setError('Select a group before confirming.'); return }
    setError(null)
    startTransition(async () => {
      const result = await onboardingPlacementAction({ playerId, groupId: selectedGroupId })
      if (!result.ok) { setError(result.error); return }
      onDone(result.recId!, selectedGroupId)
    })
  }

  return (
    <div className="space-y-5">
      {/* Group picker */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-text-secondary">Assign to Group</p>
        <select
          value={selectedGroupId}
          onChange={e => setSelectedGroupId(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-sm text-text-primary focus:outline-none focus:border-lime/50 transition-colors"
        >
          <option value="">Select a group…</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}{g.track ? ` (${g.track})` : ''}
              {g.id === donnaRecommendedGroupId ? ' ← DONNA' : ''}
            </option>
          ))}
        </select>
        {donnaRecommendedGroupId && selectedGroupId === donnaRecommendedGroupId && (
          <div className="flex items-center gap-1.5 text-[10px] text-lime">
            <Sparkles className="w-3 h-3" />
            DONNA's recommendation pre-filled
          </div>
        )}
      </div>

      {/* Safety guardrail */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-surface border border-border">
        <ShieldCheck className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-muted leading-relaxed">
          Confirming creates an official placement record. No parent or player notifications are
          sent. No portal access is granted until activation.
        </p>
      </div>

      {error && <p className="text-sm text-status-red">{error}</p>}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={isPending || !selectedGroupId}
        className="btn-lime flex items-center gap-2 px-5 py-2 text-sm disabled:opacity-50"
      >
        {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {isPending ? 'Confirming…' : 'Confirm Placement'}
      </button>
    </div>
  )
}
