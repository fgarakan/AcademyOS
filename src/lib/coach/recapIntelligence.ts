// Sprint 439 — Coach Recap Intelligence V1
// Pure logic helpers for processing and enriching session recap data.
// Complements structureCoachRecapAction.ts — operates on data already fetched.
// No DB calls. Server-side only.

import type { AttendanceSummary } from './attendanceQueries'

export interface RecapQualitySignal {
  dimension: 'attendance' | 'block_completion' | 'observation_count' | 'transcript_length'
  quality: 'good' | 'acceptable' | 'low'
  detail: string
}

export interface RecapQualityReport {
  sessionId: string
  overallQuality: 'good' | 'acceptable' | 'low'
  signals: RecapQualitySignal[]
  isReadyForStructuring: boolean
  blockedReason: string | null
}

export interface SessionBlockCompletion {
  blockId: string
  actualStatus: string
  plannedDurationMin: number
  name: string
}

// Assess the quality of a session recap before structuring.
// A recap must meet minimum quality to be sent to the AI for structuring.
export function assessRecapQuality(params: {
  sessionId: string
  transcriptLength: number
  blockCompletions: SessionBlockCompletion[]
  attendanceSummary: AttendanceSummary | null
  observationCount: number
}): RecapQualityReport {
  const signals: RecapQualitySignal[] = []

  // Signal 1: Transcript length
  if (params.transcriptLength >= 200) {
    signals.push({ dimension: 'transcript_length', quality: 'good', detail: 'Transcript is detailed.' })
  } else if (params.transcriptLength >= 50) {
    signals.push({ dimension: 'transcript_length', quality: 'acceptable', detail: 'Transcript is brief but usable.' })
  } else {
    signals.push({ dimension: 'transcript_length', quality: 'low', detail: 'Transcript is too short to structure effectively.' })
  }

  // Signal 2: Block completion data
  const completedBlocks = params.blockCompletions.filter(b =>
    b.actualStatus === 'completed' || b.actualStatus === 'skipped',
  ).length
  const totalBlocks = params.blockCompletions.length

  if (totalBlocks > 0) {
    const completionRate = completedBlocks / totalBlocks
    if (completionRate >= 0.75) {
      signals.push({ dimension: 'block_completion', quality: 'good', detail: 'Most blocks have completion data.' })
    } else if (completionRate >= 0.5) {
      signals.push({ dimension: 'block_completion', quality: 'acceptable', detail: 'Some blocks lack completion data.' })
    } else {
      signals.push({ dimension: 'block_completion', quality: 'low', detail: 'Most blocks are missing completion data.' })
    }
  }

  // Signal 3: Attendance data
  if (params.attendanceSummary && params.attendanceSummary.total > 0) {
    signals.push({ dimension: 'attendance', quality: 'good', detail: 'Attendance has been marked.' })
  } else {
    signals.push({ dimension: 'attendance', quality: 'low', detail: 'Attendance has not been marked.' })
  }

  // Signal 4: Observations
  if (params.observationCount >= 3) {
    signals.push({ dimension: 'observation_count', quality: 'good', detail: `${params.observationCount} player observations.` })
  } else if (params.observationCount >= 1) {
    signals.push({ dimension: 'observation_count', quality: 'acceptable', detail: `${params.observationCount} player observation(s).` })
  } else {
    signals.push({ dimension: 'observation_count', quality: 'low', detail: 'No player observations recorded.' })
  }

  // Compute overall quality
  const lowCount = signals.filter(s => s.quality === 'low').length
  const overallQuality =
    lowCount === 0 ? 'good' :
    lowCount <= 1 ? 'acceptable' :
    'low'

  // Block structuring if transcript is too short
  const isReadyForStructuring = params.transcriptLength >= 20
  const blockedReason = isReadyForStructuring ? null : 'Transcript is too short. Add more detail before structuring.'

  return {
    sessionId: params.sessionId,
    overallQuality,
    signals,
    isReadyForStructuring,
    blockedReason,
  }
}

// Build the observation focus areas for a session based on block types.
export function extractObservationFocusAreas(blocks: SessionBlockCompletion[]): string[] {
  const areas: string[] = []
  for (const block of blocks) {
    if (block.actualStatus === 'completed' && block.name) {
      areas.push(block.name)
    }
  }
  return areas.slice(0, 5)
}

// Returns coaching prompts the coach might want to include in their recap.
export function getSuggestedRecapPrompts(attendanceSummary: AttendanceSummary | null): string[] {
  const prompts: string[] = [
    'What was the energy level and engagement of the group today?',
    'Which players showed notable improvement?',
    'Were there any players who struggled or need follow-up?',
    'Did you complete the planned session structure?',
    'What would you change for the next session?',
  ]

  if (attendanceSummary && attendanceSummary.absent > 0) {
    prompts.unshift(`Note: ${attendanceSummary.absent} player(s) were absent today.`)
  }

  return prompts
}
