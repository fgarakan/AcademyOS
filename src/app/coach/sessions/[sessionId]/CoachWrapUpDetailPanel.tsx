import { Users, BarChart2, CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react'
import { getSupabaseServer } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { loadWrapUpRoster } from '@/lib/coach/wrapUpRosterLoader'
import { loadWrapUpAttendanceDraft } from '@/lib/coach/wrapUpAttendanceDraftLoader'
import { loadWrapUpSessionActual } from '@/lib/coach/wrapUpSessionActualLoader'
import type { WrapUpRosterStatus } from '@/lib/coach/wrapUpRosterLoader'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  sessionId: string
  academyId: string
  sessionName: string
  scheduledDate: string
  scheduledTime: string | null
  existingWrapUpStatus: string | null
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: WrapUpRosterStatus }) {
  const colors: Record<WrapUpRosterStatus, string> = {
    present:     'bg-status-green',
    absent:      'bg-status-red',
    late:        'bg-status-orange',
    excused:     'bg-status-blue',
    unconfirmed: 'bg-border',
  }
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[status]}`} />
}

function StatusChip({ status }: { status: WrapUpRosterStatus }) {
  const labels: Record<WrapUpRosterStatus, string> = {
    present:     'Present',
    absent:      'Absent',
    late:        'Late',
    excused:     'Excused',
    unconfirmed: 'Unrecorded',
  }
  const colors: Record<WrapUpRosterStatus, string> = {
    present:     'text-status-green',
    absent:      'text-status-red',
    late:        'text-status-orange',
    excused:     'text-status-blue',
    unconfirmed: 'text-text-muted',
  }
  return <span className={`text-[10px] font-medium ${colors[status]}`}>{labels[status]}</span>
}

function BlockBar({ rate, durationMin }: { rate: number; durationMin: number }) {
  const pct = Math.round(rate * 100)
  const barColor = pct === 100 ? 'bg-lime' : pct > 0 ? 'bg-status-orange' : 'bg-border'
  const textColor = pct === 100 ? 'text-lime' : pct > 0 ? 'text-status-orange' : 'text-text-muted'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono tabular-nums shrink-0 ${textColor}`}>{pct}%</span>
      <span className="text-[9px] text-text-muted shrink-0">{durationMin}m</span>
    </div>
  )
}

function NextActionHint({ status }: { status: string | null }) {
  if (status === 'pending_review') {
    return (
      <div className="flex items-start gap-2 text-status-blue">
        <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="text-xs leading-snug">Wrap-up submitted — director is reviewing. No further action needed.</p>
      </div>
    )
  }
  if (status === 'approved') {
    return (
      <div className="flex items-start gap-2 text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="text-xs leading-snug">Approved — director will apply it to the official session record.</p>
      </div>
    )
  }
  if (status === 'executed') {
    return (
      <div className="flex items-start gap-2 text-status-green">
        <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="text-xs leading-snug">Applied — your notes are part of the official session record.</p>
      </div>
    )
  }
  if (status === 'clarification_needed') {
    return (
      <div className="flex items-start gap-2 text-status-orange">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="text-xs leading-snug">
          Director requested clarification — review the feedback and update your wrap-up using the button below.
        </p>
      </div>
    )
  }
  if (status === 'rejected') {
    return (
      <div className="flex items-start gap-2 text-text-secondary">
        <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="text-xs leading-snug">
          Previous wrap-up was not approved. You can submit a new one using the{' '}
          <span className="font-medium text-lime">Wrap Up Session</span> button below.
        </p>
      </div>
    )
  }
  // null — not yet submitted
  return (
    <div className="flex items-start gap-2 text-text-secondary">
      <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <p className="text-xs leading-snug">
        Ready to wrap up — use the{' '}
        <span className="font-medium text-lime">Wrap Up Session</span> button below when you&apos;re done.
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export async function CoachWrapUpDetailPanel({
  sessionId,
  academyId,
  sessionName,
  scheduledDate,
  scheduledTime,
  existingWrapUpStatus,
}: Props) {
  const supabase = await getSupabaseServer()

  const roster = await loadWrapUpRoster(supabase, sessionId, academyId)
  const attendance = await loadWrapUpAttendanceDraft(supabase, sessionId, academyId)
  const sessionActual = await loadWrapUpSessionActual(supabase, sessionId, academyId)

  return (
    <div className="rounded-2xl bg-surface-raised border border-border overflow-hidden">

      {/* ── Session context ── */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted mb-1">Session Summary</p>
        <p className="text-sm font-semibold text-text-primary leading-snug">{sessionName}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {formatDate(scheduledDate)}
          {scheduledTime ? ` · ${scheduledTime.slice(0, 5)}` : ''}
        </p>
        <p className="text-[10px] text-text-muted/60 mt-2">
          Draft-only — nothing official changes until reviewed by your director.
        </p>
      </div>

      {/* ── Roster ── */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted">Roster</p>
          <span className="text-[9px] font-mono text-text-muted ml-0.5">({roster.players.length})</span>
        </div>

        {roster.players.length === 0 ? (
          <p className="text-xs text-text-muted leading-snug">
            No roster on file for this session. Attendance can be captured manually in the execution panel.
          </p>
        ) : (
          <ul className="space-y-2">
            {roster.players.map(p => (
              <li key={p.playerId} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <StatusDot status={p.attendanceStatus} />
                  <p className="text-sm text-text-primary truncate">{p.fullName}</p>
                </div>
                <StatusChip status={p.attendanceStatus} />
              </li>
            ))}
          </ul>
        )}

        <p className="text-[9px] text-text-muted/60">
          Roster attendance is a draft — not the official record.
        </p>
      </div>

      {/* ── Attendance summary (only if any records exist) ── */}
      {attendance.hasAnyRecord && (
        <div className="px-4 py-3 border-b border-border space-y-2">
          <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted">Attendance Draft</p>

          <div className="flex gap-5">
            <div>
              <p className="text-xl font-mono font-bold text-status-green">{attendance.presentCount}</p>
              <p className="text-[9px] text-text-muted">Present</p>
            </div>
            <div>
              <p className={`text-xl font-mono font-bold ${attendance.absentCount > 0 ? 'text-status-orange' : 'text-text-muted'}`}>
                {attendance.absentCount}
              </p>
              <p className="text-[9px] text-text-muted">Away</p>
            </div>
            {attendance.unrecordedCount > 0 && (
              <div>
                <p className="text-xl font-mono font-bold text-status-orange">{attendance.unrecordedCount}</p>
                <p className="text-[9px] text-text-muted">Unrecorded</p>
              </div>
            )}
          </div>

          {attendance.isPartiallyFilled && (
            <p className="text-[10px] text-status-orange leading-snug">
              {attendance.unrecordedCount} player{attendance.unrecordedCount !== 1 ? 's' : ''} not yet marked —
              complete attendance in the run panel before wrapping up.
            </p>
          )}

          <p className="text-[9px] text-text-muted/60">
            Attendance draft — not official until director applies the wrap-up.
          </p>
        </div>
      )}

      {/* ── Session actual — blocks ── */}
      {sessionActual.hasBlockData && (
        <div className="px-4 py-3 border-b border-border space-y-2">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <p className="text-[9px] uppercase tracking-widest font-semibold text-text-muted">Session Plan</p>
            <span className="text-[9px] font-mono text-text-muted ml-0.5">
              {sessionActual.fullyCompletedBlocks}/{sessionActual.totalBlocks} blocks complete
            </span>
          </div>

          <div className="space-y-2.5">
            {sessionActual.blocks.map(block => (
              <div key={block.blockId}>
                <p className="text-xs text-text-secondary truncate mb-0.5">{block.blockName}</p>
                {block.totalExercises > 0 ? (
                  <BlockBar rate={block.completionRate} durationMin={block.durationMin} />
                ) : (
                  <p className="text-[9px] text-text-muted">No exercises recorded</p>
                )}
              </div>
            ))}
          </div>

          <p className="text-[9px] text-text-muted/60">
            Block completion is a draft — not applied to the official session record.
          </p>
        </div>
      )}

      {/* ── Next action ── */}
      <div className="px-4 py-3">
        <NextActionHint status={existingWrapUpStatus} />
      </div>
    </div>
  )
}
