// Sprint 446 — Coach Session Summary Builder V1
// Builds a structured session summary for the wrap-up proposed_action payload.
// Combines attendance, block execution, observations, and voice notes.
// No DB calls — pure assembly. Server-side only.

import type { AttendanceSummary } from './attendanceQueries'
import type { BlockExecutionSummary } from './sessionBlockQueries'
import type { VoiceNoteRecord } from './voiceNoteQueries'
import type { PlayerObservation } from './observationTracker'
import type { CoachSessionSummary } from './sessionQueries'

export interface SessionSummaryPayload {
  sessionId: string
  coachId: string
  academyId: string
  scheduledDate: string
  sessionName: string | null
  attendance: AttendanceSummary | null
  blockExecution: BlockExecutionSummary | null
  observationCount: number
  observations: PlayerObservation[]
  transcriptSummary: string | null
  voiceNoteCount: number
  hasAudioRecording: boolean
  summaryGeneratedAt: string
}

// Build a session summary payload for the proposed_action.proposed_payload.
export function buildSessionSummaryPayload(params: {
  session: CoachSessionSummary
  coachId: string
  academyId: string
  attendance?: AttendanceSummary | null
  blockExecution?: BlockExecutionSummary | null
  observations?: PlayerObservation[]
  voiceNotes?: VoiceNoteRecord[]
}): SessionSummaryPayload {
  const transcript = params.voiceNotes
    ?.filter(vn => vn.transcript)
    .map(vn => vn.transcript)
    .join('\n\n')
    .trim() ?? null

  const transcriptSummary = transcript && transcript.length > 500
    ? transcript.slice(0, 500) + '…'
    : transcript ?? null

  return {
    sessionId: params.session.id,
    coachId: params.coachId,
    academyId: params.academyId,
    scheduledDate: params.session.scheduledDate,
    sessionName: params.session.name,
    attendance: params.attendance ?? null,
    blockExecution: params.blockExecution ?? null,
    observationCount: params.observations?.length ?? 0,
    observations: params.observations ?? [],
    transcriptSummary,
    voiceNoteCount: params.voiceNotes?.length ?? 0,
    hasAudioRecording: Boolean(params.voiceNotes?.some(vn => vn.audioPath)),
    summaryGeneratedAt: new Date().toISOString(),
  }
}

// Returns a one-line description of the session for the proposed_action.action_label.
export function buildWrapUpActionLabel(
  session: CoachSessionSummary,
  attendance: AttendanceSummary | null,
): string {
  const date = session.scheduledDate
  const playerCount = attendance?.total ?? 0
  const name = session.name ? ` — ${session.name}` : ''
  return `Session wrap-up${name} (${date}, ${playerCount} player${playerCount !== 1 ? 's' : ''})`
}

// Returns whether a session already has an approved or executed wrap-up (guards against duplicates).
export type WrapUpStatus = 'none' | 'pending' | 'approved' | 'executed' | 'rejected'

export function getWrapUpStatus(wrapUpProposedActionStatus: string | null): WrapUpStatus {
  if (!wrapUpProposedActionStatus) return 'none'
  if (wrapUpProposedActionStatus === 'pending_review' || wrapUpProposedActionStatus === 'clarification_needed') return 'pending'
  if (wrapUpProposedActionStatus === 'approved' || wrapUpProposedActionStatus === 'modified') return 'approved'
  if (wrapUpProposedActionStatus === 'executed') return 'executed'
  if (wrapUpProposedActionStatus === 'rejected') return 'rejected'
  return 'none'
}
