import { AlertTriangle, CheckCircle, Clock, UserPlus } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

export type ExceptionDraftType = 'absent_exception' | 'late_arrival' | 'left_early' | 'unrostered_attendee' | 'new_player_showed_up'
export type ExceptionDraftStatus = 'pending_review' | 'approved' | 'rejected' | 'applied'

export interface AttendanceExceptionDraftSummaryItem {
  id: string
  type: ExceptionDraftType
  playerName: string
  sessionName: string | null
  sessionDate: string | null
  note: string | null
  status: ExceptionDraftStatus
  directorDecision: string | null
}

// ── Status pill ───────────────────────────────────────────────

function StatusPill({ status }: { status: ExceptionDraftStatus }) {
  const config: Record<ExceptionDraftStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending_review: { label: 'Pending Review',   color: 'text-status-orange border-status-orange/30 bg-status-orange/5', icon: <Clock className="w-3 h-3" /> },
    approved:       { label: 'Approved',          color: 'text-status-green border-status-green/30 bg-status-green/5',   icon: <CheckCircle className="w-3 h-3" /> },
    rejected:       { label: 'Rejected',          color: 'text-status-red border-status-red/30 bg-status-red/5',         icon: <AlertTriangle className="w-3 h-3" /> },
    applied:        { label: 'Applied',            color: 'text-text-muted border-border bg-surface-raised',              icon: <CheckCircle className="w-3 h-3" /> },
  }
  const { label, color, icon } = config[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${color}`}>
      {icon}
      {label}
    </span>
  )
}

// ── Exception type label ──────────────────────────────────────

const TYPE_LABEL: Record<ExceptionDraftType, string> = {
  absent_exception:    'Absent',
  late_arrival:        'Late Arrival',
  left_early:          'Left Early',
  unrostered_attendee: 'Unrostered Attendee',
  new_player_showed_up:'New Player',
}

// ── Single item card ──────────────────────────────────────────

function ExceptionCard({ item }: { item: AttendanceExceptionDraftSummaryItem }) {
  const isUnrostered = item.type === 'unrostered_attendee' || item.type === 'new_player_showed_up'

  return (
    <div className={`rounded-2xl border p-4 space-y-2.5 ${
      item.status === 'rejected' ? 'border-status-red/20 bg-status-red/5' :
      item.status === 'pending_review' ? 'border-status-orange/20' :
      'border-border'
    } bg-surface`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-primary truncate">{item.playerName}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-[10px] text-text-muted">{TYPE_LABEL[item.type]}</span>
            {item.sessionName && (
              <>
                <span className="text-[10px] text-text-muted">·</span>
                <span className="text-[10px] text-text-muted truncate">{item.sessionName}</span>
              </>
            )}
          </div>
        </div>
        <StatusPill status={item.status} />
      </div>

      {item.note && (
        <p className="text-xs text-text-secondary leading-snug">{item.note}</p>
      )}

      {isUnrostered && item.status === 'pending_review' && (
        <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-status-orange/5 border border-status-orange/20">
          <AlertTriangle className="w-3 h-3 text-status-orange shrink-0 mt-0.5" />
          <p className="text-[10px] text-text-secondary leading-snug">
            Director review required before this player is added to the roster, billing, or parent communication.
          </p>
        </div>
      )}

      {item.directorDecision && (
        <div className="px-2.5 py-1.5 rounded-lg bg-surface-raised border border-border">
          <p className="text-[9px] uppercase tracking-widest text-text-muted mb-0.5">Director Notes</p>
          <p className="text-xs text-text-secondary">{item.directorDecision}</p>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────

interface Props {
  items: AttendanceExceptionDraftSummaryItem[]
}

export function CoachAttendanceExceptionSummary({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center">
        <UserPlus className="w-5 h-5 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-secondary">No attendance exceptions flagged.</p>
        <p className="text-xs text-text-muted mt-1">
          If anyone was missing or an unrostered player showed up, flag it in your wrap-up.
        </p>
      </div>
    )
  }

  const pendingCount = items.filter(i => i.status === 'pending_review').length

  return (
    <div className="space-y-3">
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-status-orange/5 border border-status-orange/20">
          <Clock className="w-3.5 h-3.5 text-status-orange shrink-0" />
          <p className="text-xs text-text-secondary">
            {pendingCount} exception{pendingCount !== 1 ? 's' : ''} pending director review.
            Nothing is applied until approved.
          </p>
        </div>
      )}
      {items.map(item => (
        <ExceptionCard key={item.id} item={item} />
      ))}
    </div>
  )
}
