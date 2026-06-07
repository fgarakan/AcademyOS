'use client'

// Mega Sprint 634–663 — DONNA Atomic Loop Completion V1
// Player group reassignment UI — Loop 4 fix.
// Director confirms group change from the player profile Overview tab.
// Calls reassignPlayerGroupAction → group_memberships update → audit log.
// Only rendered when player.status === 'active'.

import { useState, useTransition } from 'react'
import { ArrowRight, CheckCircle2, AlertCircle, Loader2, Users } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { reassignPlayerGroupAction } from '../_actions/reassignPlayerGroupAction'

interface GroupOption {
  id: string
  name: string
}

interface Props {
  playerId: string
  playerName: string
  currentGroupId: string | null
  currentGroupName: string | null
  groups: GroupOption[]
}

export function PlayerGroupReassignPanel({
  playerId,
  playerName,
  currentGroupId,
  currentGroupName,
  groups,
}: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; error: string | null; newGroupName: string | null } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Available groups: exclude current group
  const availableGroups = groups.filter(g => g.id !== currentGroupId)

  const selectedGroup = availableGroups.find(g => g.id === selectedGroupId)

  function handleSubmit() {
    if (!selectedGroupId || !confirmed) return
    setResult(null)
    startTransition(async () => {
      const res = await reassignPlayerGroupAction({
        playerId,
        newGroupId: selectedGroupId,
        reason: reason.trim() || undefined,
      })
      setResult(res)
      if (res.ok) {
        setSelectedGroupId('')
        setReason('')
        setConfirmed(false)
      }
    })
  }

  if (result?.ok) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-2 p-3 rounded-xl border border-status-green/30 bg-status-green/5">
            <CheckCircle2 className="w-4 h-4 text-status-green shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-status-green font-medium">
                {playerName} moved to {result.newGroupName}.
              </p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Group membership updated. Audit log written. No curriculum level was changed.
              </p>
              <button
                className="text-[11px] text-lime hover:opacity-80 underline underline-offset-2 mt-1"
                onClick={() => setResult(null)}
              >
                Move again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-text-muted" />
          <p className="label-xs">Change Group</p>
        </div>
        {currentGroupName && (
          <p className="text-[11px] text-text-muted mt-0.5">
            Current group: <span className="text-text-secondary font-medium">{currentGroupName}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {availableGroups.length === 0 ? (
          <p className="text-[11px] text-text-muted">No other groups available in this academy.</p>
        ) : (
          <>
            {/* Group picker */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Move to group</p>
              <select
                value={selectedGroupId}
                onChange={e => { setSelectedGroupId(e.target.value); setConfirmed(false) }}
                className="w-full bg-surface-raised border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-lime/50"
              >
                <option value="">Select a group…</option>
                {availableGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Optional reason */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Reason (optional)</p>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Skill progression, schedule change…"
                maxLength={200}
                className="w-full bg-surface-raised border border-border rounded px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-lime/50"
              />
            </div>

            {/* Confirmation preview + confirm checkbox */}
            {selectedGroup && (
              <div className="p-2.5 rounded-lg bg-surface-raised border border-border space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-secondary">{currentGroupName ?? 'No group'}</span>
                  <ArrowRight className="w-3 h-3 text-text-muted shrink-0" />
                  <span className="text-lime font-semibold">{selectedGroup.name}</span>
                </div>
                <p className="text-[10px] text-text-muted leading-snug">
                  This will close the current group membership and open a new one.
                  Curriculum level is not affected. The change is immediate and audit logged.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={e => setConfirmed(e.target.checked)}
                    className="w-3.5 h-3.5 accent-lime"
                  />
                  <span className="text-[11px] text-text-secondary">
                    I confirm this group change for {playerName}
                  </span>
                </label>
              </div>
            )}

            {result?.error && (
              <div className="flex items-start gap-2 p-2 rounded-lg border border-status-red/30 bg-status-red/5">
                <AlertCircle className="w-3.5 h-3.5 text-status-red shrink-0 mt-0.5" />
                <p className="text-[11px] text-status-red leading-relaxed">{result.error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedGroupId || !confirmed || isPending}
              className="btn-lime flex items-center gap-2 text-xs px-4 py-2 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              {isPending ? 'Moving…' : 'Move Player'}
            </button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
