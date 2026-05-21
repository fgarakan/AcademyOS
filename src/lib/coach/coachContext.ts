// Sprint 444-445 — Coach OS Context Builder V1
// Assembles the coach's current session context for DONNA and the wrap-up flow.
// Operates on data already fetched — no DB calls. Server-side only.

import type { CoachSessionSummary } from './sessionQueries'
import type { AttendanceSummary } from './attendanceQueries'
import type { BlockExecutionSummary } from './sessionBlockQueries'
import type { VoiceNoteRecord } from './voiceNoteQueries'
import type { PlayerObservation } from './observationTracker'

export interface CoachSessionContext {
  sessionId: string
  coachId: string
  academyId: string
  session: CoachSessionSummary
  attendanceSummary: AttendanceSummary | null
  blockSummary: BlockExecutionSummary | null
  voiceNotes: VoiceNoteRecord[]
  observations: PlayerObservation[]
  hasWrapUpDraft: boolean
}

export interface CoachOsContext {
  coachId: string
  academyId: string
  activeSession: CoachSessionContext | null
  upcomingSessionCount: number
  recentSessionCount: number
  pendingVoiceNoteCount: number
  lastSessionDate: string | null
}

// Build the coach OS context from pre-fetched data.
export function buildCoachOsContext(params: {
  coachId: string
  academyId: string
  activeSession?: CoachSessionContext | null
  upcomingSessionCount: number
  recentSessionCount: number
  pendingVoiceNoteCount: number
  lastSessionDate: string | null
}): CoachOsContext {
  return {
    coachId: params.coachId,
    academyId: params.academyId,
    activeSession: params.activeSession ?? null,
    upcomingSessionCount: params.upcomingSessionCount,
    recentSessionCount: params.recentSessionCount,
    pendingVoiceNoteCount: params.pendingVoiceNoteCount,
    lastSessionDate: params.lastSessionDate,
  }
}

// Build a session context for the wrap-up flow.
export function buildCoachSessionContext(params: {
  coachId: string
  academyId: string
  session: CoachSessionSummary
  attendanceSummary?: AttendanceSummary | null
  blockSummary?: BlockExecutionSummary | null
  voiceNotes?: VoiceNoteRecord[]
  observations?: PlayerObservation[]
  hasWrapUpDraft?: boolean
}): CoachSessionContext {
  return {
    sessionId: params.session.id,
    coachId: params.coachId,
    academyId: params.academyId,
    session: params.session,
    attendanceSummary: params.attendanceSummary ?? null,
    blockSummary: params.blockSummary ?? null,
    voiceNotes: params.voiceNotes ?? [],
    observations: params.observations ?? [],
    hasWrapUpDraft: params.hasWrapUpDraft ?? false,
  }
}

// Returns whether a session is ready for wrap-up (in_progress or completed).
export function isSessionReadyForWrapUp(session: CoachSessionSummary): boolean {
  return session.status === 'in_progress' || session.status === 'completed'
}

// Returns a brief status message for the coach about their current session.
export function getCoachSessionStatusMessage(ctx: CoachSessionContext): string {
  if (!isSessionReadyForWrapUp(ctx.session)) {
    return 'Session has not started yet.'
  }

  const lines: string[] = []

  if (ctx.attendanceSummary) {
    lines.push(`${ctx.attendanceSummary.present} of ${ctx.attendanceSummary.total} players present.`)
  }

  if (ctx.blockSummary) {
    lines.push(`${ctx.blockSummary.completedBlocks} of ${ctx.blockSummary.totalBlocks} blocks completed.`)
  }

  if (ctx.voiceNotes.length > 0) {
    lines.push(`${ctx.voiceNotes.length} voice note(s) recorded.`)
  }

  if (ctx.observations.length > 0) {
    lines.push(`${ctx.observations.length} player observation(s).`)
  }

  return lines.length > 0 ? lines.join(' ') : 'Session in progress.'
}
