'use client'

import { useState, useTransition } from 'react'
import { Users } from 'lucide-react'
import { assignGroupToSessionAction } from './actions'

interface GroupOption {
  id: string
  name: string
  memberCount: number
}

interface GroupAssignmentPanelProps {
  sessionId: string
  currentGroupId: string | null
  currentGroupName: string | null
  groups: GroupOption[]
}

export function GroupAssignmentPanel({
  sessionId,
  currentGroupId,
  currentGroupName,
  groups,
}: GroupAssignmentPanelProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(currentGroupId ?? '')
  const [result, setResult] = useState<{ ok: boolean; error: string | null } | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasChanged = selectedGroupId !== (currentGroupId ?? '')
  const canSave = selectedGroupId !== '' && hasChanged && !isPending

  function handleSave() {
    if (!canSave) return
    setResult(null)
    startTransition(async () => {
      const res = await assignGroupToSessionAction({ sessionId, groupId: selectedGroupId })
      setResult(res)
    })
  }

  if (groups.length === 0) {
    return (
      <div className="py-3 text-center">
        <p className="text-sm text-text-muted">
          No active groups found. Group creation will be added in a future sprint.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {currentGroupId && currentGroupName && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Users className="w-3.5 h-3.5 text-lime shrink-0" />
          <span>Currently assigned: <span className="text-text-primary font-medium">{currentGroupName}</span></span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={selectedGroupId}
          onChange={e => { setSelectedGroupId(e.target.value); setResult(null) }}
          disabled={isPending}
          className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-lime/50 disabled:opacity-50"
        >
          <option value="">Select a group…</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}{g.memberCount > 0 ? ` (${g.memberCount} player${g.memberCount !== 1 ? 's' : ''})` : ' (no members)'}
            </option>
          ))}
        </select>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="btn-lime shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save Group Assignment'}
        </button>
      </div>

      {result && (
        <p className={`text-xs font-medium ${result.ok ? 'text-status-green' : 'text-status-red'}`}>
          {result.ok ? 'Group assigned. Refresh to see the updated roster.' : result.error}
        </p>
      )}
    </div>
  )
}
