'use client'

// Sprint 384 — DONNA Modularization
// Module boundary for the attendance exception workflow rendering.
// Wraps DonnaAttendanceExceptionCard with a null-guard so the parent
// does not need to repeat the conditional check at the call site.
//
// State lives in DonnaAssistantButton (orchestrator).
// Attendance handlers (handleStartAttendanceExceptionDraft,
// handleQueueAttendanceForReview, applyAttendanceAnswer) remain in
// DonnaAssistantButton because they close over 15+ state setters.

import type { AttendanceExceptionDraft } from './donnaAttendanceWorkflow'
import type { AttendanceSessionOption } from './donnaAttendanceSessionResolution'
import type { DonnaApprovalExecutionResult } from './donnaApprovalExecutionTypes'
import { DonnaAttendanceExceptionCard } from './DonnaAttendanceExceptionCard'

interface Props {
  draft: AttendanceExceptionDraft | null
  sessionOptions: AttendanceSessionOption[]
  isLoadingSessions: boolean
  isQueueing: boolean
  queueResult: DonnaApprovalExecutionResult | null
  onDiscard: () => void
  onSelectSession: (option: AttendanceSessionOption) => void
  onQueueForReview: () => void
}

export function DonnaAttendanceLayer({
  draft,
  sessionOptions,
  isLoadingSessions,
  isQueueing,
  queueResult,
  onDiscard,
  onSelectSession,
  onQueueForReview,
}: Props) {
  if (!draft) return null
  return (
    <DonnaAttendanceExceptionCard
      draft={draft}
      onDiscard={onDiscard}
      sessionOptions={sessionOptions}
      isLoadingSessions={isLoadingSessions}
      onSelectSession={onSelectSession}
      onQueueForReview={onQueueForReview}
      isQueueing={isQueueing}
      queueResult={queueResult}
    />
  )
}
