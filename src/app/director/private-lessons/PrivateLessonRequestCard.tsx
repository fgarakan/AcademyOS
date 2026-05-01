'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, MessageSquare } from 'lucide-react'
import { updatePrivateLessonStatusAction, updateDirectorNotesAction } from './privateLessonActions'

type PLRStatus = 'new' | 'reviewing' | 'assigned' | 'scheduled' | 'declined' | 'completed'

interface Request {
  id: string
  playerName: string | null
  parentName: string | null
  coachName: string | null
  preferredDays: string | null
  preferredTimes: string | null
  goal: string | null
  notes: string | null
  status: PLRStatus
  directorNotes: string | null
  createdAt: string
}

const STATUS_LABELS: Record<PLRStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  assigned: 'Assigned',
  scheduled: 'Scheduled',
  declined: 'Declined',
  completed: 'Completed',
}

const STATUS_COLORS: Record<PLRStatus, string> = {
  new: 'text-status-orange',
  reviewing: 'text-status-blue',
  assigned: 'text-lime',
  scheduled: 'text-status-green',
  declined: 'text-text-muted',
  completed: 'text-status-green',
}

export function PrivateLessonRequestCard({ request }: { request: Request }) {
  const [status, setStatus] = useState<PLRStatus>(request.status)
  const [notes, setNotes] = useState(request.directorNotes ?? '')
  const [expanded, setExpanded] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(newStatus: PLRStatus) {
    setStatus(newStatus)
    startTransition(async () => {
      await updatePrivateLessonStatusAction(request.id, newStatus)
    })
  }

  function handleSaveNotes() {
    startTransition(async () => {
      await updateDirectorNotesAction(request.id, notes)
      setEditingNotes(false)
    })
  }

  const createdDate = new Date(request.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="min-w-0">
            <p className="text-text-primary text-sm font-medium truncate">
              {request.playerName ?? 'Unknown Player'}
            </p>
            <p className="text-text-muted text-xs mt-0.5">
              {request.parentName ? `Requested by ${request.parentName}` : 'Director-created'} · {createdDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className={`text-xs font-medium ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </span>
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border space-y-4 pt-4">
          {/* Request details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {request.coachName && (
              <div>
                <p className="label-xs text-text-muted mb-1">Requested Coach</p>
                <p className="text-text-secondary">{request.coachName}</p>
              </div>
            )}
            {request.preferredDays && (
              <div>
                <p className="label-xs text-text-muted mb-1">Preferred Days</p>
                <p className="text-text-secondary">{request.preferredDays}</p>
              </div>
            )}
            {request.preferredTimes && (
              <div>
                <p className="label-xs text-text-muted mb-1">Preferred Times</p>
                <p className="text-text-secondary">{request.preferredTimes}</p>
              </div>
            )}
            {request.goal && (
              <div className="sm:col-span-2">
                <p className="label-xs text-text-muted mb-1">Goal</p>
                <p className="text-text-secondary">{request.goal}</p>
              </div>
            )}
            {request.notes && (
              <div className="sm:col-span-2">
                <p className="label-xs text-text-muted mb-1">Notes</p>
                <p className="text-text-secondary">{request.notes}</p>
              </div>
            )}
          </div>

          {/* Status control */}
          <div>
            <p className="label-xs text-text-muted mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_LABELS) as PLRStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={isPending || s === status}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                    s === status
                      ? 'border-lime text-lime bg-surface-raised'
                      : 'border-border text-text-secondary hover:border-text-muted hover:text-text-primary'
                  } disabled:opacity-50`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Director notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="label-xs text-text-muted flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Director Notes (internal)
              </p>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-surface-raised border border-border rounded px-3 py-2 text-text-primary text-sm resize-none focus:outline-none focus:border-lime"
                  placeholder="Add director notes..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isPending}
                    className="btn-lime text-xs px-3 py-1.5 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingNotes(false); setNotes(request.directorNotes ?? '') }}
                    className="btn-ghost text-xs px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary text-sm">
                {notes || <span className="text-text-muted italic">No director notes</span>}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
