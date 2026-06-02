'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, Sparkles, Plus } from 'lucide-react'
import { onboardingPlacementAction } from './onboardingPlacementAction'
import { createGroupFromOnboardingAction } from './createGroupFromOnboardingAction'

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
  // Local groups list — grows if director creates a group inline
  const [localGroups, setLocalGroups] = useState<GroupOption[]>(groups)

  const defaultGroupId =
    donnaRecommendedGroupId && localGroups.find(g => g.id === donnaRecommendedGroupId)
      ? donnaRecommendedGroupId
      : (localGroups[0]?.id ?? '')

  const [selectedGroupId, setSelectedGroupId] = useState<string>(defaultGroupId)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Inline group creation state
  const [newGroupName, setNewGroupName] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(localGroups.length === 0)
  const [isCreatingGroup, startCreateGroupTransition] = useTransition()
  const [createGroupError, setCreateGroupError] = useState<string | null>(null)

  // ── Already confirmed ──────────────────────────────────────────────────────
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

  // ── Group creation helper ─────────────────────────────────────────────────
  function handleCreateGroup() {
    if (!newGroupName.trim()) { setCreateGroupError('Enter a group name.'); return }
    setCreateGroupError(null)
    startCreateGroupTransition(async () => {
      const result = await createGroupFromOnboardingAction(newGroupName)
      if (!result.ok || !result.group) {
        setCreateGroupError(result.error ?? 'Failed to create group')
        return
      }
      const newGroup = result.group
      setLocalGroups(prev => [...prev, newGroup])
      setSelectedGroupId(newGroup.id)
      setNewGroupName('')
      setShowCreateGroup(false)
    })
  }

  // ── Confirm placement ─────────────────────────────────────────────────────
  function handleConfirm() {
    if (!selectedGroupId) { setError('Select a group before confirming.'); return }
    setError(null)
    startTransition(async () => {
      const result = await onboardingPlacementAction({ playerId, groupId: selectedGroupId })
      if (!result.ok) { setError(result.error); return }
      onDone(result.recId!, selectedGroupId)
    })
  }

  // ── Empty state with inline group creation ────────────────────────────────
  if (localGroups.length === 0) {
    return (
      <div className="space-y-4">
        <div className="px-4 py-3 rounded-xl bg-status-orange/5 border border-status-orange/20">
          <p className="text-sm text-text-primary font-medium">No training groups yet</p>
          <p className="text-xs text-text-muted mt-1">
            Create at least one group to assign this player.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-text-secondary">Create a group</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateGroup() }}
              placeholder="e.g. Orange 2 — Monday/Wednesday"
              className="flex-1 px-3 py-2 rounded-xl bg-surface-raised border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors"
            />
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !newGroupName.trim()}
              className="btn-lime flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50 shrink-0"
            >
              {isCreatingGroup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isCreatingGroup ? 'Creating…' : 'Create'}
            </button>
          </div>
          {createGroupError && <p className="text-sm text-status-red">{createGroupError}</p>}
          <p className="text-[10px] text-text-muted">
            You can rename and configure the group further from the academy settings.
          </p>
        </div>
      </div>
    )
  }

  // ── Normal placement flow ─────────────────────────────────────────────────
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
          {localGroups.map(g => (
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

      {/* Inline: add a group while in this step */}
      {showCreateGroup ? (
        <div className="space-y-2 px-4 py-3 rounded-xl bg-surface-raised border border-border">
          <p className="text-xs font-medium text-text-secondary">Create a new group</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateGroup() }}
              placeholder="e.g. Orange 2 — Monday/Wednesday"
              className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50 transition-colors"
            />
            <button
              type="button"
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !newGroupName.trim()}
              className="btn-lime flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50 shrink-0"
            >
              {isCreatingGroup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isCreatingGroup ? 'Creating…' : 'Create'}
            </button>
          </div>
          {createGroupError && <p className="text-sm text-status-red">{createGroupError}</p>}
          <button
            type="button"
            onClick={() => { setShowCreateGroup(false); setCreateGroupError(null) }}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCreateGroup(true)}
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <Plus className="w-3 h-3" />
          Create a new group
        </button>
      )}

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
