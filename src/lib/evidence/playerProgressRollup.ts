// Player Progress Rollup Engine — pure TypeScript, no DB calls.
// Derives ProgressRollup from EvidenceRecord[].
// Called server-side after aggregation.

import type {
  EvidenceRecord,
  EvidencePathway,
  PathwaySignal,
  ProgressRollup,
  ProgressStatus,
  ReadinessBlocker,
} from './playerEvidenceTypes'

const PATHWAY_LABELS: Record<EvidencePathway, string> = {
  skill:              'Technical / Tactical',
  competition:        'Competition',
  fitness:            'Fitness / Movement',
  mental_performance: 'Mental Performance',
  general:            'General',
}

const STALE_ASSESSMENT_DAYS = 90
const STALE_OBSERVATION_DAYS = 45
const STALE_PARENT_UPDATE_DAYS = 60

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// ─── Main rollup function ─────────────────────────────────────────────────────

export function computeProgressRollup(
  playerId: string,
  records: EvidenceRecord[],
  context?: {
    activePriorityCount?: number
    currentLevelName?: string | null
    nextLevelName?: string | null
  },
): ProgressRollup {
  const now = new Date().toISOString()
  const ctx = context ?? {}

  // ── Recency helpers ──────────────────────────────────────────────────────
  const assessmentRecords = records.filter(r =>
    r.source_type === 'assessment_score' || r.source_type === 'reassessment_change'
  )
  const observationRecords = records.filter(r =>
    r.source_type === 'coach_observation' ||
    r.source_type === 'fitness_note' ||
    r.source_type === 'mental_performance_note' ||
    r.source_type === 'competition_note'
  )
  const missionRecords = records.filter(r =>
    r.source_type === 'mission_assigned' || r.source_type === 'mission_completed'
  )
  const attendanceRecords = records.filter(r => r.source_type === 'session_attendance')
  const parentUpdateRecords = records.filter(r => r.source_type === 'parent_update_approved')

  const latestAssessment = assessmentRecords[0]?.created_at ?? null
  const latestObservation = observationRecords[0]?.created_at ?? null
  const latestParentUpdate = parentUpdateRecords[0]?.created_at ?? null

  const assessmentFreshnessDays = daysSince(latestAssessment)
  const observationFreshnessDays = daysSince(latestObservation)
  const parentUpdateFreshnessDays = daysSince(latestParentUpdate)

  // ── Mission progress ────────────────────────────────────────────────────
  const activeMissions  = missionRecords.filter(r => r.source_type === 'mission_assigned').length
  const completedMissions = missionRecords.filter(r => r.source_type === 'mission_completed').length
  const pendingMissions = records.filter(r => r.source_type === 'mission_assigned' && r.evidence_strength === 'weak').length

  // ── Attendance consistency ───────────────────────────────────────────────
  let attendanceConsistency: ProgressRollup['attendanceConsistency'] = 'unknown'
  if (attendanceRecords.length === 0) {
    attendanceConsistency = 'missing'
  } else {
    const recentAttendance = attendanceRecords.filter(r =>
      (daysSince(r.created_at) ?? 999) <= 30
    )
    attendanceConsistency = recentAttendance.length >= 3 ? 'consistent' : 'inconsistent'
  }

  // ── Pathway signals ──────────────────────────────────────────────────────
  const pathways: EvidencePathway[] = ['skill', 'competition', 'fitness', 'mental_performance']
  const pathwaySignals: PathwaySignal[] = pathways.map(pathway => {
    const pathRecords = records.filter(r => r.pathway === pathway)
    const sorted = [...pathRecords].sort((a, b) => b.confidence - a.confidence)

    // Most recent improvement = reassessment with high confidence
    const improvement = records.find(r =>
      r.source_type === 'reassessment_change' &&
      r.pathway === pathway &&
      r.evidence_summary.includes('improved')
    )
    const decline = records.find(r =>
      r.source_type === 'reassessment_change' &&
      r.pathway === pathway &&
      r.evidence_summary.includes('declined')
    )

    return {
      pathway,
      label:              PATHWAY_LABELS[pathway],
      strongestArea:      sorted[0]?.curriculum_requirement_label ?? sorted[0]?.evidence_summary.slice(0, 60) ?? null,
      weakestArea:        sorted[sorted.length - 1]?.curriculum_requirement_label ?? null,
      recentImprovement:  improvement?.evidence_summary ?? null,
      recentDecline:      decline?.evidence_summary ?? null,
      evidenceCount:      pathRecords.length,
      latestDate:         pathRecords[0]?.created_at ?? null,
    }
  })

  // ── Readiness blockers ───────────────────────────────────────────────────
  const readinessBlockers: ReadinessBlocker[] = []
  const missingEvidence: string[] = []

  if (!latestAssessment || (assessmentFreshnessDays ?? 999) > STALE_ASSESSMENT_DAYS) {
    readinessBlockers.push({
      blockerType:  'missing_assessment',
      description:  latestAssessment
        ? `Assessment is ${assessmentFreshnessDays} days old — a fresh assessment is recommended.`
        : 'No assessment on record. Assessment required before level review.',
      pathway:      null,
      severity:     'high',
    })
    missingEvidence.push('Current assessment')
  }

  if (!latestObservation || (observationFreshnessDays ?? 999) > STALE_OBSERVATION_DAYS) {
    readinessBlockers.push({
      blockerType:  'missing_evidence',
      description:  latestObservation
        ? `No coach observations in ${observationFreshnessDays} days.`
        : 'No coach observations on record.',
      pathway:      'skill',
      severity:     'medium',
    })
    missingEvidence.push('Recent coach observations')
  }

  if (attendanceConsistency === 'missing' || attendanceConsistency === 'inconsistent') {
    readinessBlockers.push({
      blockerType:  'attendance_gap',
      description:  attendanceConsistency === 'missing'
        ? 'No attendance data recorded.'
        : 'Attendance inconsistent in the last 30 days.',
      pathway:      null,
      severity:     'medium',
    })
  }

  pathways.forEach(pathway => {
    const pRecords = records.filter(r => r.pathway === pathway)
    if (pRecords.length === 0) {
      missingEvidence.push(`${PATHWAY_LABELS[pathway]} evidence`)
    }
  })

  // ── Stall detection ──────────────────────────────────────────────────────
  const recentActivity = records.filter(r => (daysSince(r.created_at) ?? 999) <= 60)
  const isStalled = recentActivity.length === 0 && records.length > 0

  if (isStalled) {
    readinessBlockers.push({
      blockerType:  'stalled',
      description:  'No new evidence in the last 60 days. Development progress may be stalled.',
      pathway:      null,
      severity:     'high',
    })
  }

  // ── Progress status ──────────────────────────────────────────────────────
  let progressStatus: ProgressStatus = 'on_track'
  const highBlockers = readinessBlockers.filter(b => b.severity === 'high')

  if (isStalled) {
    progressStatus = 'stalled'
  } else if (records.length === 0) {
    progressStatus = 'missing_data'
  } else if (highBlockers.length >= 2) {
    progressStatus = 'needs_attention'
  } else if (
    assessmentFreshnessDays !== null && assessmentFreshnessDays <= 30 &&
    activeMissions > 0 &&
    (attendanceConsistency === 'consistent' || attendanceConsistency === ('unknown' as string))
  ) {
    progressStatus = 'ready_for_review'
  } else if (highBlockers.length >= 1) {
    progressStatus = 'needs_attention'
  }

  // ── DONNA summary ────────────────────────────────────────────────────────
  const levelClause = ctx.currentLevelName ? ` at ${ctx.currentLevelName}` : ''
  const assessmentClause = latestAssessment
    ? (assessmentFreshnessDays !== null && assessmentFreshnessDays < 7 ? ' Recently assessed.' : ` Last assessed ${assessmentFreshnessDays} days ago.`)
    : ' No assessment on record.'
  const missionClause = activeMissions > 0
    ? ` ${activeMissions} active mission${activeMissions !== 1 ? 's' : ''}.`
    : ' No active missions.'
  const blockerClause = highBlockers.length > 0
    ? ` ${highBlockers.length} blocker${highBlockers.length !== 1 ? 's' : ''} identified.`
    : ''

  const donnaSummary = `Player${levelClause}.${assessmentClause}${missionClause}${blockerClause}`

  // ── Recommended next action ───────────────────────────────────────────────
  let recommendedNextAction = 'Continue current development plan.'
  if (progressStatus === 'missing_data') {
    recommendedNextAction = 'Run initial assessment and assign first mission.'
  } else if (progressStatus === 'stalled') {
    recommendedNextAction = 'Schedule check-in session and run reassessment.'
  } else if (progressStatus === 'needs_attention') {
    if (!latestAssessment || (assessmentFreshnessDays ?? 999) > STALE_ASSESSMENT_DAYS) {
      recommendedNextAction = 'Run reassessment — data is too old for level review.'
    } else {
      recommendedNextAction = 'Review readiness blockers before next level evaluation.'
    }
  } else if (progressStatus === 'ready_for_review') {
    recommendedNextAction = `Consider level readiness review${ctx.nextLevelName ? ` for ${ctx.nextLevelName}` : ''}.`
  }

  return {
    playerId,
    computedAt:                now,
    progressStatus,
    activePriorityCount:       ctx.activePriorityCount ?? 0,
    pathwaySignals,
    readinessBlockers,
    assessmentFreshnessDays,
    observationFreshnessDays,
    attendanceConsistency,
    parentUpdateFreshnessDays,
    missionProgress: {
      active:    activeMissions,
      completed: completedMissions,
      pending:   pendingMissions,
    },
    donnaSummary,
    recommendedNextAction,
    missingEvidence,
    totalEvidenceCount: records.length,
  }
}
