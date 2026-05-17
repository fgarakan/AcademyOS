'use client'

// Sprint 566 — Attendance Draft Apply Preview V1
// Shows what would happen if an attendance draft were applied.
// No official write — preview only.

import { UserCheck, UserX, HelpCircle, UserPlus, AlertTriangle } from 'lucide-react'
import type {
  RosteredAttendanceDraft,
  UnrosteredAttendeeDraft,
} from '@/app/director/sessions/[sessionId]/attendanceExceptionDraftAction'

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AttendanceApplyPreviewProps {
  rostered: RosteredAttendanceDraft[]
  unrostered: UnrosteredAttendeeDraft[]
  warnings: string[]
  sessionName?: string
}

// ── Player row ────────────────────────────────────────────────────────────────

function RosteredRow({ player }: { player: RosteredAttendanceDraft }) {
  const { proposed_status, player_name } = player

  const icon =
    proposed_status === 'present' ? (
      <UserCheck className="w-3.5 h-3.5 text-status-green shrink-0" />
    ) : proposed_status === 'absent' ? (
      <UserX className="w-3.5 h-3.5 text-status-red shrink-0" />
    ) : (
      <HelpCircle className="w-3.5 h-3.5 text-text-muted shrink-0" />
    )

  const labelColor =
    proposed_status === 'present' ? 'text-status-green'
    : proposed_status === 'absent' ? 'text-status-red'
    : 'text-text-muted'

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {icon}
      <span className="text-sm text-text-primary flex-1">{player_name}</span>
      <span className={`text-[10px] font-medium capitalize ${labelColor}`}>
        {proposed_status === 'present' ? 'Present' : proposed_status === 'absent' ? 'Absent' : 'Unknown'}
      </span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AttendanceApplyPreview({
  rostered,
  unrostered,
  warnings,
  sessionName,
}: AttendanceApplyPreviewProps) {
  const presentCount = rostered.filter(r => r.proposed_status === 'present').length
  const absentCount = rostered.filter(r => r.proposed_status === 'absent').length
  const unknownCount = rostered.filter(r => r.proposed_status === 'unknown').length

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-status-blue shrink-0" />
        <p className="text-xs font-semibold text-text-secondary">Apply preview — no changes yet</p>
        {sessionName && (
          <span className="ml-auto text-[10px] text-text-muted truncate max-w-[140px]">
            {sessionName}
          </span>
        )}
      </div>

      {/* ── Summary chips ── */}
      <div className="flex gap-3 px-3.5 py-2.5 border-b border-border/50">
        {presentCount > 0 && (
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-status-green" />
            <span className="text-xs text-status-green">{presentCount} present</span>
          </div>
        )}
        {absentCount > 0 && (
          <div className="flex items-center gap-1.5">
            <UserX className="w-3.5 h-3.5 text-status-red" />
            <span className="text-xs text-status-red">{absentCount} absent</span>
          </div>
        )}
        {unknownCount > 0 && (
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-xs text-text-muted">{unknownCount} unknown</span>
          </div>
        )}
        {unrostered.length > 0 && (
          <div className="flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-status-orange" />
            <span className="text-xs text-status-orange">{unrostered.length} unrostered</span>
          </div>
        )}
      </div>

      {/* ── Player rows ── */}
      {rostered.length > 0 && (
        <div className="px-3.5 divide-y divide-border/30">
          {rostered.map(r => (
            <RosteredRow key={r.player_id} player={r} />
          ))}
        </div>
      )}

      {/* ── Unrostered ── */}
      {unrostered.length > 0 && (
        <div className="px-3.5 py-2.5 border-t border-border/50">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Unrostered</p>
          {unrostered.map((u, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <UserPlus className="w-3.5 h-3.5 text-status-orange shrink-0" />
              <span className="text-sm text-text-primary">{u.name}</span>
              <span className="text-[10px] text-text-muted ml-auto">{u.reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Warnings ── */}
      {warnings.length > 0 && (
        <div className="px-3.5 py-2.5 border-t border-border/50">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <AlertTriangle className="w-3.5 h-3.5 text-status-orange shrink-0 mt-0.5" />
              <p className="text-xs text-status-orange leading-snug">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Preview disclaimer ── */}
      <div className="px-3.5 py-2 border-t border-border/30 bg-surface">
        <p className="text-[10px] text-text-muted italic text-center">
          Preview only — no attendance records will change until you click Apply.
        </p>
      </div>
    </div>
  )
}
