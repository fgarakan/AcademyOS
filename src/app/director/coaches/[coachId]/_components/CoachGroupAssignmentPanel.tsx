'use client'

// Mega Sprint 634–663 — DONNA Atomic Loop Completion V1
// Coach group assignment UI — Loop 5 fix.
// Director adds/removes groups for a coach from the coach detail page.
// Calls assignCoachGroupAction → coach_group_assignments upsert → audit log.

import { useState, useTransition } from 'react'
import { Plus, X, Loader2, Users, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui'
import { assignCoachGroupAction } from '../assignCoachGroupAction'

interface GroupOption {
  id: string
  name: string
}

interface Props {
  coachId: string
  assignedGroups: GroupOption[]
  allGroups: GroupOption[]
}

export function CoachGroupAssignmentPanel({ coachId, assignedGroups, allGroups }: Props) {
  const [localAssigned, setLocalAssigned] = useState<GroupOption[]>(assignedGroups)
  const [pickerGroupId, setPickerGroupId] = useState('')
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const unassigned = allGroups.filter(g => !localAssigned.some(a => a.id === g.id))

  function showFlash(ok: boolean, message: string) {
    setFlash({ ok, message })
    setTimeout(() => setFlash(null), 3000)
  }

  function handleAdd() {
    if (!pickerGroupId) return
    const group = allGroups.find(g => g.id === pickerGroupId)
    if (!group) return

    startTransition(async () => {
      const res = await assignCoachGroupAction({ coachId, groupId: pickerGroupId, action: 'add' })
      if (res.ok) {
        setLocalAssigned(prev => [...prev, group])
        setPickerGroupId('')
        showFlash(true, `${group.name} added.`)
      } else {
        showFlash(false, res.error ?? 'Failed to add group.')
      }
    })
  }

  function handleRemove(group: GroupOption) {
    startTransition(async () => {
      const res = await assignCoachGroupAction({ coachId, groupId: group.id, action: 'remove' })
      if (res.ok) {
        setLocalAssigned(prev => prev.filter(g => g.id !== group.id))
        showFlash(true, `${group.name} removed.`)
      } else {
        showFlash(false, res.error ?? 'Failed to remove group.')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-text-muted" />
          <p className="label-xs">Assigned Groups</p>
        </div>
        <p className="text-[11px] text-text-muted mt-0.5">
          Groups this coach is responsible for. Used for accountability tracking and future impact scoring.
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">

        {/* Assigned group chips */}
        {localAssigned.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {localAssigned.map(g => (
              <div
                key={g.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-lime/25 bg-lime/[0.06] text-[11px] text-lime font-medium"
              >
                {g.name}
                <button
                  onClick={() => handleRemove(g)}
                  disabled={isPending}
                  aria-label={`Remove ${g.name}`}
                  className="text-lime/60 hover:text-status-red transition-colors disabled:opacity-40 leading-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-text-muted">No groups assigned yet.</p>
        )}

        {/* Add group row */}
        {unassigned.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <select
              value={pickerGroupId}
              onChange={e => setPickerGroupId(e.target.value)}
              disabled={isPending}
              className="flex-1 bg-surface-raised border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-lime/50 disabled:opacity-50"
            >
              <option value="">Add a group…</option>
              {unassigned.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!pickerGroupId || isPending}
              className="flex items-center gap-1 text-xs btn-lime px-3 py-1.5 shrink-0 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              Add
            </button>
          </div>
        )}

        {allGroups.length === 0 && (
          <p className="text-[11px] text-text-muted">No groups exist in this academy yet.</p>
        )}

        {/* Flash feedback */}
        {flash && (
          <div className={`flex items-center gap-2 text-[11px] ${flash.ok ? 'text-status-green' : 'text-status-red'}`}>
            {flash.ok
              ? <CheckCircle2 className="w-3 h-3 shrink-0" />
              : <AlertCircle className="w-3 h-3 shrink-0" />
            }
            {flash.message}
          </div>
        )}

        <p className="text-[10px] text-text-muted pt-0.5">
          Every assignment change is audit logged.
        </p>
      </CardContent>
    </Card>
  )
}
