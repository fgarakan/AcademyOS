'use client'

import { useState } from 'react'
import { CheckCircle, ChevronDown, ChevronRight, AlertTriangle, Users, FileText, Star, Heart, MessageSquare, Eye } from 'lucide-react'
import type { AttendanceAnswer } from './WrapUpAttendanceInput'
import type { SessionActualAnswer } from './WrapUpSessionActualInput'
import type { PlayerObservationDraft } from './WrapUpPlayerObservationInput'
import type { FollowUpAnswer } from './WrapUpFollowUpInput'

// ── Full wrap-up data struct ──────────────────────────────────────────────────

export interface WrapUpFullDraft {
  sessionId: string
  coachId: string
  attendance: AttendanceAnswer | null
  sessionActual: SessionActualAnswer | null
  standouts: PlayerObservationDraft[]
  needsAttention: PlayerObservationDraft[]
  followUps: FollowUpAnswer | null
  completedAt: string | null
}

// ── Collapsible section ───────────────────────────────────────────────────────

function ReviewSection({
  icon,
  title,
  count,
  children,
  statusLabel,
  statusColor,
  defaultOpen = true,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  children: React.ReactNode
  statusLabel: string
  statusColor: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-text-muted">{icon}</span>
          <span className="text-sm font-medium text-text-primary">{title}</span>
          {count !== undefined && (
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${count > 0 ? 'bg-lime/10 text-lime' : 'bg-surface-raised text-text-muted'}`}>
              {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase tracking-widest font-medium ${statusColor}`}>{statusLabel}</span>
          {open ? <ChevronDown size={14} className="text-text-muted" /> : <ChevronRight size={14} className="text-text-muted" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-surface-raised">
          {children}
        </div>
      )}
    </div>
  )
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-xs text-text-muted italic py-2">{label}</p>
}

// ── Section content renderers ─────────────────────────────────────────────────

function AttendanceSummary({ attendance }: { attendance: AttendanceAnswer }) {
  if (attendance.everyonePresent) {
    return <p className="text-xs text-lime py-2">Full attendance — everyone present.</p>
  }
  if (attendance.unsure) {
    return <p className="text-xs text-status-orange py-2">Coach unsure — manual review needed.</p>
  }
  return (
    <div className="py-2 space-y-1.5">
      {attendance.absences.map((a, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-status-orange shrink-0" />
          <span className="text-text-primary">{a.name}</span>
          <span className="text-text-muted">absent</span>
        </div>
      ))}
      {attendance.unrostered.map((u, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-status-blue shrink-0" />
          <span className="text-text-primary">{u.name}</span>
          <span className="text-text-muted">unexpected</span>
        </div>
      ))}
      {attendance.freeText && (
        <p className="text-xs text-text-secondary mt-1">{attendance.freeText}</p>
      )}
    </div>
  )
}

function SessionActualSummary({ actual }: { actual: SessionActualAnswer }) {
  return (
    <div className="py-2 space-y-1">
      <p className={`text-xs font-medium ${actual.completedAsPlanned ? 'text-lime' : 'text-status-orange'}`}>
        {actual.completedAsPlanned ? 'Completed as planned' : 'Modified'}
      </p>
      {actual.modifications.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {actual.modifications.map(m => (
            <span key={m} className="text-[10px] border border-border rounded px-2 py-0.5 text-text-secondary capitalize">
              {m.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
      {actual.notes && <p className="text-xs text-text-secondary mt-1">{actual.notes}</p>}
    </div>
  )
}

function ObservationList({ observations, type }: { observations: PlayerObservationDraft[]; type: 'positive' | 'concern' }) {
  if (observations.length === 0) {
    return <EmptyRow label={`No ${type === 'positive' ? 'standouts' : 'concerns'} recorded.`} />
  }
  return (
    <div className="py-2 space-y-2">
      {observations.map(obs => (
        <div key={obs.id} className="text-xs border border-border rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-text-primary">{obs.playerName || 'Unnamed player'}</span>
            {obs.skillTag && (
              <span className="text-[10px] text-text-muted capitalize">{obs.skillTag.replace(/_/g, ' ')}</span>
            )}
          </div>
          <p className="text-text-secondary">{obs.observation}</p>
          {obs.nextStep && <p className="text-text-muted mt-0.5">Next: {obs.nextStep}</p>}
          {obs.isParentSafeCandidate && (
            <p className="text-status-blue text-[10px] mt-1 flex items-center gap-1">
              <Eye size={9} />
              Parent-safe candidate — director review required
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

function FollowUpList({ followUps }: { followUps: FollowUpAnswer }) {
  if (followUps.items.length === 0) {
    return <EmptyRow label="No follow-up items." />
  }
  return (
    <div className="py-2 space-y-2">
      {followUps.items.map(item => (
        <div key={item.id} className="text-xs border border-border rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-text-primary capitalize">{item.type.replace(/_/g, ' ')}</span>
            <span className={`text-[10px] uppercase tracking-widest ${item.urgency === 'high' ? 'text-status-red' : item.urgency === 'medium' ? 'text-status-orange' : 'text-text-muted'}`}>
              {item.urgency}
            </span>
          </div>
          {item.playerName && <p className="text-text-muted mb-0.5">{item.playerName}</p>}
          <p className="text-text-secondary">{item.description}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface WrapUpReviewSummaryProps {
  draft: WrapUpFullDraft
  onSubmit: () => void
  onEdit: (section: 'attendance' | 'session_actual' | 'observations' | 'follow_ups') => void
  isSubmitting?: boolean
  className?: string
}

export function WrapUpReviewSummary({ draft, onSubmit, onEdit: _onEdit, isSubmitting, className }: WrapUpReviewSummaryProps) {
  const parentSafeCandidates = [
    ...draft.standouts.filter(o => o.isParentSafeCandidate),
    ...draft.needsAttention.filter(o => o.isParentSafeCandidate),
  ]

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <p className="label-xs mb-1">Wrap-Up Review</p>
          <p className="text-xs text-text-secondary">
            Review everything before submitting. Nothing is official until a director approves.
          </p>
        </div>

        {/* Attendance */}
        <ReviewSection
          icon={<Users size={14} />}
          title="Attendance"
          statusLabel={draft.attendance ? 'Answered' : 'Skipped'}
          statusColor={draft.attendance ? 'text-lime' : 'text-text-muted'}
        >
          {draft.attendance
            ? <AttendanceSummary attendance={draft.attendance} />
            : <EmptyRow label="Attendance not recorded." />}
        </ReviewSection>

        {/* Session actual */}
        <ReviewSection
          icon={<FileText size={14} />}
          title="Session Actual"
          statusLabel={draft.sessionActual ? 'Answered' : 'Skipped'}
          statusColor={draft.sessionActual ? 'text-lime' : 'text-text-muted'}
        >
          {draft.sessionActual
            ? <SessionActualSummary actual={draft.sessionActual} />
            : <EmptyRow label="Session actual not recorded." />}
        </ReviewSection>

        {/* Standouts */}
        <ReviewSection
          icon={<Star size={14} />}
          title="Stood Out Positively"
          count={draft.standouts.length}
          statusLabel={draft.standouts.length > 0 ? 'Recorded' : 'None'}
          statusColor={draft.standouts.length > 0 ? 'text-lime' : 'text-text-muted'}
          defaultOpen={draft.standouts.length > 0}
        >
          <ObservationList observations={draft.standouts} type="positive" />
        </ReviewSection>

        {/* Needs attention */}
        <ReviewSection
          icon={<Heart size={14} />}
          title="Could Use Extra Support"
          count={draft.needsAttention.length}
          statusLabel={draft.needsAttention.length > 0 ? 'Recorded' : 'None'}
          statusColor={draft.needsAttention.length > 0 ? 'text-status-blue' : 'text-text-muted'}
          defaultOpen={draft.needsAttention.length > 0}
        >
          <ObservationList observations={draft.needsAttention} type="concern" />
        </ReviewSection>

        {/* Follow-ups */}
        <ReviewSection
          icon={<MessageSquare size={14} />}
          title="Follow-Ups"
          count={draft.followUps?.items.length ?? 0}
          statusLabel={draft.followUps && draft.followUps.items.length > 0 ? 'Recorded' : 'None'}
          statusColor={draft.followUps && draft.followUps.items.length > 0 ? 'text-status-orange' : 'text-text-muted'}
          defaultOpen={(draft.followUps?.items.length ?? 0) > 0}
        >
          {draft.followUps
            ? <FollowUpList followUps={draft.followUps} />
            : <EmptyRow label="No follow-ups recorded." />}
        </ReviewSection>

        {/* Parent-safe candidates callout */}
        {parentSafeCandidates.length > 0 && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-status-blue/5 border border-status-blue/20 text-xs text-status-blue">
            <Eye size={13} className="shrink-0 mt-0.5" />
            <span>
              {parentSafeCandidates.length} observation(s) marked as parent-safe candidates.
              Director must review and approve before any parent communication.
            </span>
          </div>
        )}

        {/* Safety summary */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-surface-raised border border-border text-xs text-text-muted">
          <CheckCircle size={13} className="shrink-0 mt-0.5 text-lime" />
          <span>
            Submitting creates drafts for director review. Nothing is official, sent, or applied until a director approves each item.
          </span>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full btn-lime text-sm py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin border-2 border-black/20 border-t-black rounded-full w-4 h-4" />
              Submitting…
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Submit Wrap-Up Draft
            </>
          )}
        </button>

        <p className="text-[10px] text-text-muted text-center">
          <AlertTriangle size={9} className="inline mr-0.5" />
          Draft only — not official until director approves.
        </p>
      </div>
    </div>
  )
}
