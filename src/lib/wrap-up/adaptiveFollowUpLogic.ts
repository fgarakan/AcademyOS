// Adaptive Follow-Up Question Logic
// Determines which follow-up questions DONNA should ask based on the current
// wrap-up state. Pure function — no DB calls, no side effects.
// Caps output at MIN_QUESTIONS–MAX_QUESTIONS.

import type { AttendanceAnswer } from '@/components/capture/WrapUpAttendanceInput'
import type { SessionActualAnswer } from '@/components/capture/WrapUpSessionActualInput'
import type { PlayerObservationDraft } from '@/components/capture/WrapUpPlayerObservationInput'
import type { FollowUpAnswer } from '@/components/capture/WrapUpFollowUpInput'

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_QUESTIONS = 0
const MAX_QUESTIONS = 7

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdaptiveFollowUpQuestionId =
  | 'attendance_confirm_absent'
  | 'attendance_confirm_unrostered'
  | 'attendance_unsure_clarify'
  | 'session_deviation_detail'
  | 'session_energy_check'
  | 'observations_nudge'
  | 'observations_skill_tag'
  | 'observations_next_step'
  | 'parent_update_detail'
  | 'parent_update_player'
  | 'director_followup_urgency'
  | 'player_support_context'
  | 'general_anything_else'

export interface AdaptiveFollowUpQuestion {
  id: AdaptiveFollowUpQuestionId
  question: string
  donna: string
  reason: string
  priority: number // lower = higher priority; used for sorting before cap
}

export interface AdaptiveFollowUpInputState {
  attendance: AttendanceAnswer | null
  sessionActual: SessionActualAnswer | null
  standouts: PlayerObservationDraft[]
  needsAttention: PlayerObservationDraft[]
  followUps: FollowUpAnswer | null
}

export interface AdaptiveFollowUpResult {
  questions: AdaptiveFollowUpQuestion[]
  totalBeforeCap: number
  cappedAt: number
  skippedReasons: string[]
}

// ── Rule evaluators ───────────────────────────────────────────────────────────

function attendanceQuestions(
  attendance: AttendanceAnswer | null,
  out: AdaptiveFollowUpQuestion[],
  skipped: string[],
): void {
  if (!attendance) {
    // Attendance section skipped entirely — nothing to follow up on
    skipped.push('attendance: section was skipped')
    return
  }

  if (attendance.everyonePresent) {
    // Clear — do not re-ask
    skipped.push('attendance: everyone present, no follow-up needed')
    return
  }

  if (attendance.unsure) {
    out.push({
      id: 'attendance_unsure_clarify',
      question: 'You marked attendance as unsure — can you remember anyone who was missing?',
      donna: 'Just a quick check on who was here.',
      reason: 'Attendance mode was "unsure"',
      priority: 10,
    })
  }

  if (attendance.absences.length > 0) {
    const unconfirmed = attendance.absences.filter(a => !a.confirmed)
    if (unconfirmed.length > 0) {
      const names = unconfirmed.map(a => a.name).join(', ')
      out.push({
        id: 'attendance_confirm_absent',
        question: `Were ${names} expected today, or was this a planned absence?`,
        donna: 'I want to make sure the right note goes to the director.',
        reason: `${unconfirmed.length} absence(s) not confirmed`,
        priority: 20,
      })
    }
  }

  if (attendance.unrostered.length > 0) {
    const names = attendance.unrostered.map(u => u.name).join(', ')
    out.push({
      id: 'attendance_confirm_unrostered',
      question: `${names} wasn't on the roster — do you know why they attended?`,
      donna: "I'll flag this for the director.",
      reason: 'Unrostered attendee(s) present',
      priority: 25,
    })
  }
}

function sessionActualQuestions(
  sessionActual: SessionActualAnswer | null,
  out: AdaptiveFollowUpQuestion[],
  skipped: string[],
): void {
  if (!sessionActual) {
    skipped.push('session_actual: section was skipped')
    return
  }

  if (sessionActual.completedAsPlanned && !sessionActual.modified) {
    skipped.push('session_actual: completed as planned, no follow-up needed')
    return
  }

  if (sessionActual.modified && sessionActual.modifications.length > 0) {
    const hasNotes = sessionActual.notes.trim().length > 20
    if (!hasNotes) {
      out.push({
        id: 'session_deviation_detail',
        question: 'What prompted the change to the session plan?',
        donna: 'A quick note on the "why" helps the director review.',
        reason: 'Session was modified but notes are short',
        priority: 30,
      })
    }
  }

  if (!sessionActual.completedAsPlanned && !sessionActual.modified) {
    out.push({
      id: 'session_energy_check',
      question: 'How did the group energy feel overall — focused, distracted, or somewhere in between?',
      donna: 'Just a quick read on the vibe.',
      reason: 'Session did not go as planned and no modification type selected',
      priority: 35,
    })
  }
}

function observationQuestions(
  standouts: PlayerObservationDraft[],
  needsAttention: PlayerObservationDraft[],
  out: AdaptiveFollowUpQuestion[],
  skipped: string[],
): void {
  const totalObservations = standouts.length + needsAttention.length

  if (totalObservations === 0) {
    out.push({
      id: 'observations_nudge',
      question: 'Any players who stood out — positive or otherwise — that the director should know about?',
      donna: 'Even a quick note is useful.',
      reason: 'No player observations entered',
      priority: 40,
    })
    return
  }

  // Check if any observation is missing a skill tag
  const missingSkillTag = [...standouts, ...needsAttention].filter(
    obs => !obs.skillTag && obs.observation.trim().length > 10,
  )
  if (missingSkillTag.length > 0 && missingSkillTag.length <= 2) {
    out.push({
      id: 'observations_skill_tag',
      question: `For ${missingSkillTag[0].playerName} — what skill area did that relate to?`,
      donna: 'A tag helps track progress over time.',
      reason: 'Observation with no skill tag',
      priority: 50,
    })
  }

  // Check if needsAttention entries have no next step
  const missingNextStep = needsAttention.filter(obs => !obs.nextStep || obs.nextStep.trim() === '')
  if (missingNextStep.length > 0 && totalObservations <= 3) {
    out.push({
      id: 'observations_next_step',
      question: `For ${missingNextStep[0].playerName} — what would you suggest as a next step?`,
      donna: "I'll draft this for the director to review.",
      reason: '"Needs attention" observation with no next step',
      priority: 55,
    })
  }

  if (totalObservations > 0) {
    skipped.push(`observations: ${totalObservations} observation(s) entered, deep re-prompt skipped`)
  }
}

function followUpQuestions(
  followUps: FollowUpAnswer | null,
  out: AdaptiveFollowUpQuestion[],
  skipped: string[],
): void {
  if (!followUps || followUps.items.length === 0) {
    skipped.push('follow_ups: none entered, no detail questions needed')
    return
  }

  const parentItems = followUps.items.filter(i => i.type === 'parent_update')
  for (const item of parentItems) {
    if (!item.playerName) {
      out.push({
        id: 'parent_update_player',
        question: 'Which player is that parent update about?',
        donna: "I'll attach it to the right profile.",
        reason: 'Parent update without a player name',
        priority: 60,
      })
      break
    }
    if (item.description.trim().length < 20) {
      out.push({
        id: 'parent_update_detail',
        question: `What should the parent of ${item.playerName} know?`,
        donna: "I'll draft a message for the director to approve before anything is sent.",
        reason: 'Parent update description is too brief',
        priority: 65,
      })
      break
    }
  }

  const directorItems = followUps.items.filter(i => i.type === 'director_follow_up')
  for (const item of directorItems) {
    if (item.urgency === 'low' && item.description.trim().length < 15) {
      out.push({
        id: 'director_followup_urgency',
        question: 'Is that director item time-sensitive, or can it wait until the next check-in?',
        donna: "I'll set the priority accordingly.",
        reason: 'Director follow-up with low urgency and short description',
        priority: 70,
      })
      break
    }
  }

  const supportItems = followUps.items.filter(i => i.type === 'player_support')
  for (const item of supportItems) {
    if (!item.playerName) {
      out.push({
        id: 'player_support_context',
        question: 'Which player needs support, and what kind of help are you thinking?',
        donna: "I'll route this to the right person.",
        reason: 'Player support item without player name',
        priority: 75,
      })
      break
    }
  }
}

function generalCloseQuestion(
  totalSoFar: number,
  out: AdaptiveFollowUpQuestion[],
): void {
  if (totalSoFar === 0) {
    out.push({
      id: 'general_anything_else',
      question: "Anything else from today's session that should be on the director's radar?",
      donna: "Last chance to add anything before I summarize.",
      reason: 'No follow-up questions generated — general close',
      priority: 999,
    })
  }
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildAdaptiveFollowUpQuestions(
  state: AdaptiveFollowUpInputState,
): AdaptiveFollowUpResult {
  const raw: AdaptiveFollowUpQuestion[] = []
  const skippedReasons: string[] = []

  attendanceQuestions(state.attendance, raw, skippedReasons)
  sessionActualQuestions(state.sessionActual, raw, skippedReasons)
  observationQuestions(state.standouts, state.needsAttention, raw, skippedReasons)
  followUpQuestions(state.followUps, raw, skippedReasons)
  generalCloseQuestion(raw.length, raw)

  // Sort by priority, then cap
  raw.sort((a, b) => a.priority - b.priority)

  const totalBeforeCap = raw.length
  const capped = raw.slice(MIN_QUESTIONS, MAX_QUESTIONS)

  return {
    questions: capped,
    totalBeforeCap,
    cappedAt: MAX_QUESTIONS,
    skippedReasons,
  }
}

// ── Utility: get question by id ───────────────────────────────────────────────

export function getAdaptiveQuestion(
  result: AdaptiveFollowUpResult,
  id: AdaptiveFollowUpQuestionId,
): AdaptiveFollowUpQuestion | undefined {
  return result.questions.find(q => q.id === id)
}

// ── Utility: count by category ────────────────────────────────────────────────

export function countAdaptiveQuestionsByCategory(result: AdaptiveFollowUpResult): {
  attendance: number
  session: number
  observations: number
  followUp: number
  general: number
} {
  const attendance = result.questions.filter(q =>
    q.id.startsWith('attendance'),
  ).length
  const session = result.questions.filter(q =>
    q.id.startsWith('session'),
  ).length
  const observations = result.questions.filter(q =>
    q.id.startsWith('observations'),
  ).length
  const followUp = result.questions.filter(q =>
    q.id.startsWith('parent_') || q.id.startsWith('director_') || q.id.startsWith('player_support'),
  ).length
  const general = result.questions.filter(q => q.id === 'general_anything_else').length

  return { attendance, session, observations, followUp, general }
}
