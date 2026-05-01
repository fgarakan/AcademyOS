import { AlertTriangle, CheckCircle, HelpCircle, Users, UserX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui'
import type { AttendanceExceptionPayload } from '@/app/director/sessions/[sessionId]/attendanceExceptionDraftAction'
import { AttendanceExceptionDraftDecisionControls } from './AttendanceExceptionDraftDecisionControls'
import { ApplyApprovedAttendanceExceptionControls } from './ApplyApprovedAttendanceExceptionControls'

export interface EnrichedAttendanceExceptionDraftItem {
  id: string
  status: string
  createdAt: string
  sessionId: string | null
  sessionName: string | null
  sessionDate: string | null
  proposerName: string | null
  payload: AttendanceExceptionPayload
}

interface Props {
  draft: EnrichedAttendanceExceptionDraftItem
}

export function AttendanceExceptionDraftCard({ draft }: Props) {
  const { payload } = draft
  const absentPlayers = payload.rostered_attendance?.filter(r => r.proposed_status === 'absent') ?? []
  const presentPlayers = payload.rostered_attendance?.filter(r => r.proposed_status === 'present') ?? []
  const unknownPlayers = payload.rostered_attendance?.filter(r => r.proposed_status === 'unknown') ?? []
  const unrostered = payload.unrostered_attendees ?? []
  const warnings = payload.warnings ?? []

  const isPending = draft.status === 'pending_review'
  const isApproved = draft.status === 'approved'

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">Attendance Exception Draft</p>
            {draft.sessionName && (
              <p className="text-sm font-semibold text-text-primary">{draft.sessionName}</p>
            )}
            {draft.sessionDate && (
              <p className="text-xs text-text-muted">{new Date(draft.sessionDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusPill status={draft.status} />
            <p className="text-[10px] text-text-muted">
              {new Date(draft.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            {draft.proposerName && (
              <p className="text-[10px] text-text-muted">by {draft.proposerName}</p>
            )}
          </div>
        </div>

        {/* Raw input */}
        <div className="p-3 rounded-lg bg-surface-raised border border-border">
          <p className="text-[10px] uppercase tracking-widest text-text-muted mb-1">Original Recap</p>
          <p className="text-xs text-text-secondary italic">"{payload.raw_input}"</p>
        </div>

        {/* Rostered attendance */}
        {payload.rostered_attendance && payload.rostered_attendance.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-text-muted">
              Rostered Players — Proposed Attendance
            </p>
            <div className="space-y-1">
              {presentPlayers.map(r => (
                <div key={r.player_id} className="flex items-center justify-between gap-2 py-1 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-3 h-3 text-status-green shrink-0" />
                    <p className="text-xs text-text-primary truncate">{r.player_name}</p>
                  </div>
                  <p className="text-[10px] text-text-muted shrink-0">{r.match_reason}</p>
                </div>
              ))}
              {absentPlayers.map(r => (
                <div key={r.player_id} className="flex items-center justify-between gap-2 py-1 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserX className="w-3 h-3 text-status-red shrink-0" />
                    <p className="text-xs text-text-primary truncate">{r.player_name}</p>
                  </div>
                  <p className="text-[10px] text-status-red shrink-0">Absent</p>
                </div>
              ))}
              {unknownPlayers.length > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <HelpCircle className="w-3 h-3 text-text-muted shrink-0" />
                  <p className="text-[11px] text-text-muted">{unknownPlayers.length} player{unknownPlayers.length !== 1 ? 's' : ''} — status unknown (no baseline detected)</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Unrostered attendees */}
        {unrostered.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              Unrostered Attendees
            </p>
            {unrostered.map((u, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-status-orange/5 border border-status-orange/20">
                <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-text-primary">{u.name}</p>
                  <p className="text-[10px] text-text-muted">{u.reason}</p>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-text-muted">
              These individuals are not on the session roster. No player profile, roster change, billing, or parent communication will occur automatically.
            </p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-1">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-text-muted">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-text-muted" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Decision controls */}
        {isPending && (
          <AttendanceExceptionDraftDecisionControls proposedActionId={draft.id} />
        )}

        {/* Apply controls */}
        {isApproved && (
          <ApplyApprovedAttendanceExceptionControls proposedActionId={draft.id} />
        )}
      </CardContent>
    </Card>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_review: 'bg-status-orange/10 text-status-orange border-status-orange/30',
    approved: 'bg-lime/10 text-lime border-lime/30',
    rejected: 'bg-status-red/10 text-status-red border-status-red/30',
    executed: 'bg-status-green/10 text-status-green border-status-green/30',
    clarification_needed: 'bg-status-blue/10 text-status-blue border-status-blue/30',
  }
  const labels: Record<string, string> = {
    pending_review: 'Pending Review',
    approved: 'Approved — Ready to Apply',
    rejected: 'Rejected',
    executed: 'Applied',
    clarification_needed: 'Needs Clarification',
  }
  const pill = styles[status] ?? 'bg-surface-raised text-text-muted border-border'
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${pill}`}>
      {labels[status] ?? status.replace('_', ' ')}
    </span>
  )
}
