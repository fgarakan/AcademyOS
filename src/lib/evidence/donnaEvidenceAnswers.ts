// DONNA Evidence Answer Builders — pure TypeScript, no DB calls.
// Builds deterministic, citation-only answers for evidence-based DONNA intents.
// If evidence is empty: answer says exactly that — never invents.
// Answers are always role-gated before display.
// Sprint 1451-1480: added buildAssessmentEvidenceMissingAnswer, buildWhyNotReadyToAdvanceAnswer, buildCoachFocusAnswer

import type { EvidenceRecord, ProgressRollup, EvidenceAnswer, EvidencePathway } from './playerEvidenceTypes'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cite(records: EvidenceRecord[], limit = 3): string[] {
  return records.slice(0, limit).map(r => r.id)
}

function noEvidence(intent: string, missing: string): EvidenceAnswer {
  return {
    intent,
    answer:             `I don't have enough evidence yet. Missing: ${missing}`,
    citedEvidenceIds:   [],
    missingEvidenceNote: missing,
    confidence:          0,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

// ─── 1. Why is this player at this level? ─────────────────────────────────────

export function buildWhyThisLevelAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  rollup: ProgressRollup,
  currentLevelName: string | null,
): EvidenceAnswer {
  const name = playerFirstName ?? 'This player'
  const placementRecords = records.filter(r =>
    r.source_type === 'placement_decision' || r.source_type === 'assessment_score'
  )

  if (placementRecords.length === 0) {
    return noEvidence('why_this_level', 'placement decision or assessment record')
  }

  const placement = placementRecords.find(r => r.source_type === 'placement_decision')
  const assessment = placementRecords.find(r => r.source_type === 'assessment_score')

  const levelClause = currentLevelName ? ` at ${currentLevelName}` : ''
  const placementClause = placement
    ? ` Placement decision: ${placement.evidence_summary}`
    : ''
  const assessmentClause = assessment
    ? ` Assessment: ${assessment.evidence_summary}`
    : ''

  const answer = `${name} is${levelClause} based on their assessment results and director placement decision.${placementClause}${assessmentClause}`

  return {
    intent:              'why_this_level',
    answer,
    citedEvidenceIds:    cite(placementRecords),
    missingEvidenceNote: null,
    confidence:          placement ? 85 : 60,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

// ─── 2. What evidence supports moving to the next level? ─────────────────────

export function buildEvidenceForNextLevelAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  rollup: ProgressRollup,
  nextLevelName: string | null,
): EvidenceAnswer {
  const name = playerFirstName ?? 'This player'
  const intent = 'evidence_for_next_level'

  const strongRecords = records.filter(r => r.evidence_strength === 'strong')
  const blockers = rollup.readinessBlockers
  const missing  = rollup.missingEvidence

  if (records.length === 0) {
    return noEvidence(intent, 'any development evidence')
  }

  const targetLevel = nextLevelName ?? 'the next level'
  const strongClause = strongRecords.length > 0
    ? ` Supporting evidence (${strongRecords.length} strong signals): ${strongRecords.slice(0, 3).map(r => r.evidence_summary.slice(0, 80)).join(' · ')}.`
    : ' No strong evidence signals yet.'
  const blockerClause = blockers.length > 0
    ? ` Blockers: ${blockers.map(b => b.description).slice(0, 2).join(' ')}`.slice(0, 200)
    : ' No major blockers identified.'
  const missingClause = missing.length > 0
    ? ` Missing: ${missing.slice(0, 3).join(', ')}.`
    : ''

  const answer = `Evidence for ${name} moving to ${targetLevel}.${strongClause}${blockerClause}${missingClause}`

  return {
    intent,
    answer,
    citedEvidenceIds:    cite(strongRecords),
    missingEvidenceNote: missing.length > 0 ? missing.join(', ') : null,
    confidence:          strongRecords.length >= 3 ? 80 : 50,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

// ─── 3. What changed since the last assessment? ───────────────────────────────

export function buildWhatChangedAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
): EvidenceAnswer {
  const name = playerFirstName ?? 'This player'
  const intent = 'what_changed_since_assessment'

  const reassessment = records.find(r => r.source_type === 'reassessment_change')
  const recentRecords = records.filter(r => {
    const daysAgo = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysAgo <= 90
  })

  if (!reassessment && recentRecords.length === 0) {
    return noEvidence(intent, 'reassessment record or recent activity')
  }

  if (!reassessment) {
    const recent = recentRecords.slice(0, 3).map(r => r.evidence_summary.slice(0, 80)).join(' · ')
    return {
      intent,
      answer:              `No reassessment on record yet. Recent activity: ${recent}`,
      citedEvidenceIds:    cite(recentRecords),
      missingEvidenceNote: 'Reassessment record',
      confidence:          40,
      isSafe:              true,
      safeForParent:       false,
      safeForPlayer:       false,
    }
  }

  const answer = `${name}: ${reassessment.evidence_summary}`

  return {
    intent,
    answer,
    citedEvidenceIds:    [reassessment.id],
    missingEvidenceNote: null,
    confidence:          reassessment.confidence,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

// ─── 4. Which mission connects to this blocker? ───────────────────────────────

export function buildMissionConnectionAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  rollup: ProgressRollup,
): EvidenceAnswer {
  const name = playerFirstName ?? 'This player'
  const intent = 'which_mission_connects'

  const missionRecords = records.filter(r =>
    r.source_type === 'mission_assigned' || r.source_type === 'mission_completed'
  )
  const highBlockers = rollup.readinessBlockers.filter(b => b.severity === 'high')

  if (missionRecords.length === 0) {
    return noEvidence(intent, 'active or completed mission records')
  }

  if (highBlockers.length === 0 && rollup.readinessBlockers.length === 0) {
    const active = missionRecords.filter(r => r.source_type === 'mission_assigned')
    const answer = active.length > 0
      ? `${name} has ${active.length} active mission${active.length !== 1 ? 's' : ''}. No blockers identified.`
      : `${name} has no active missions and no blockers identified.`
    return {
      intent,
      answer,
      citedEvidenceIds: cite(active),
      missingEvidenceNote: null,
      confidence: 70,
      isSafe: true,
      safeForParent: false,
      safeForPlayer: false,
    }
  }

  const blockerDesc = highBlockers[0]?.description ?? rollup.readinessBlockers[0]?.description ?? 'identified blockers'
  const missionDesc = missionRecords[0]?.evidence_summary.slice(0, 100) ?? 'active mission'
  const answer = `Blocker: ${blockerDesc} Mission on record: ${missionDesc} Assign or review missions to address this gap.`

  return {
    intent,
    answer,
    citedEvidenceIds:    cite(missionRecords),
    missingEvidenceNote: null,
    confidence:          65,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

// ─── 5. Is this player stalled? ───────────────────────────────────────────────

export function buildStalledCheckAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  rollup: ProgressRollup,
): EvidenceAnswer {
  const name = playerFirstName ?? 'This player'
  const intent = 'stalled_check'

  if (records.length === 0) {
    return noEvidence(intent, 'any evidence — no data on record')
  }

  const isStalled = rollup.progressStatus === 'stalled'
  const isMissingData = rollup.progressStatus === 'missing_data'

  if (isMissingData) {
    return {
      intent,
      answer: `${name} has insufficient data to assess stall status. Missing: ${rollup.missingEvidence.slice(0, 3).join(', ')}.`,
      citedEvidenceIds: [],
      missingEvidenceNote: rollup.missingEvidence.join(', '),
      confidence: 30,
      isSafe: true,
      safeForParent: false,
      safeForPlayer: false,
    }
  }

  if (isStalled) {
    return {
      intent,
      answer: `${name} appears stalled — no new evidence in the last 60 days. ${rollup.recommendedNextAction}`,
      citedEvidenceIds: cite(records.slice(-3)),
      missingEvidenceNote: rollup.missingEvidence.length > 0 ? rollup.missingEvidence.join(', ') : null,
      confidence: 80,
      isSafe: true,
      safeForParent: false,
      safeForPlayer: false,
    }
  }

  const freshnessDays = rollup.assessmentFreshnessDays
  const recentActivity = records.filter(r => {
    const d = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return d <= 30
  }).length

  const answer = `${name} is not stalled. ${recentActivity} evidence signal${recentActivity !== 1 ? 's' : ''} in the last 30 days.${freshnessDays !== null ? ` Last assessed ${freshnessDays} days ago.` : ''}`

  return {
    intent,
    answer,
    citedEvidenceIds: cite(records.slice(0, 3)),
    missingEvidenceNote: null,
    confidence: 75,
    isSafe: true,
    safeForParent: false,
    safeForPlayer: false,
  }
}

// ─── 6. What should the coach watch next? ────────────────────────────────────

export function buildCoachWatchNextAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  rollup: ProgressRollup,
): EvidenceAnswer {
  const name = playerFirstName ?? 'This player'
  const intent = 'coach_watch_next'

  const weakRecords = records.filter(r => r.evidence_strength === 'weak')
  const blockers = rollup.readinessBlockers.filter(b => b.pathway !== null)

  if (records.length === 0) {
    return noEvidence(intent, 'any evidence — run an assessment first')
  }

  const watchItems: string[] = []

  // Weak signals first
  if (weakRecords.length > 0) {
    watchItems.push(weakRecords.slice(0, 2).map(r => r.evidence_summary.slice(0, 80)).join('; '))
  }

  // Then blockers
  blockers.slice(0, 2).forEach(b => watchItems.push(b.description.slice(0, 80)))

  // Fallback to general recommendation
  if (watchItems.length === 0) {
    watchItems.push(rollup.recommendedNextAction)
  }

  const answer = `${name} — coach watch focus: ${watchItems.slice(0, 3).join(' · ')}`

  return {
    intent,
    answer,
    citedEvidenceIds:    cite(weakRecords),
    missingEvidenceNote: rollup.missingEvidence.length > 0 ? rollup.missingEvidence.slice(0, 2).join(', ') : null,
    confidence:          weakRecords.length > 0 ? 75 : 55,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

// ─── 7. What assessment evidence is missing? ──────────────────────────────────

export function buildAssessmentEvidenceMissingAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  rollup: ProgressRollup,
): EvidenceAnswer {
  const name = playerFirstName ?? 'This player'
  const intent = 'assessment_evidence_missing'

  const assessmentRecords = records.filter(r =>
    r.source_type === 'assessment_score' || r.source_type === 'reassessment_change'
  )

  const missingList: string[] = [...rollup.missingEvidence]

  if (assessmentRecords.length === 0) {
    missingList.unshift('Initial assessment record')
  }

  const now = Date.now()
  const staleRecords = assessmentRecords.filter(r => {
    const expires = (r as EvidenceRecord & { expires_at?: string | null }).expires_at
    return expires && new Date(expires).getTime() < now
  })
  if (staleRecords.length > 0) {
    missingList.push(`${staleRecords.length} expired assessment record${staleRecords.length !== 1 ? 's' : ''} — reassessment due`)
  }

  if (missingList.length === 0 && assessmentRecords.length > 0) {
    return {
      intent,
      answer:              `${name} has ${assessmentRecords.length} assessment record${assessmentRecords.length !== 1 ? 's' : ''} on file. No critical evidence gaps detected.`,
      citedEvidenceIds:    cite(assessmentRecords),
      missingEvidenceNote: null,
      confidence:          80,
      isSafe:              true,
      safeForParent:       false,
      safeForPlayer:       false,
    }
  }

  const missingClause = missingList.length > 0
    ? `Missing: ${missingList.slice(0, 4).join(', ')}.`
    : 'No specific gaps detected.'

  const baseClause = assessmentRecords.length > 0
    ? `${name} has ${assessmentRecords.length} assessment record${assessmentRecords.length !== 1 ? 's' : ''} on file. `
    : `${name} has no assessment records on file. `

  return {
    intent,
    answer:              `${baseClause}${missingClause}`,
    citedEvidenceIds:    cite(assessmentRecords),
    missingEvidenceNote: missingList.slice(0, 3).join(', '),
    confidence:          assessmentRecords.length > 0 ? 70 : 40,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

// ─── 8. Why is this player not ready to advance? ─────────────────────────────

export function buildWhyNotReadyToAdvanceAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  rollup: ProgressRollup,
  currentLevelName: string | null,
  nextLevelName: string | null,
): EvidenceAnswer {
  const name = playerFirstName ?? 'This player'
  const intent = 'why_not_ready_to_advance'

  const weakRecords = records.filter(r => r.evidence_strength === 'weak')
  const highBlockers = rollup.readinessBlockers.filter(b => b.severity === 'high')
  const allBlockers  = rollup.readinessBlockers

  const targetLevel = nextLevelName ?? 'the next level'
  const currentLevel = currentLevelName ? ` at ${currentLevelName}` : ''

  if (records.length === 0) {
    return noEvidence(intent, 'assessment or observation records — run a development assessment first')
  }

  if (allBlockers.length === 0 && weakRecords.length === 0) {
    return {
      intent,
      answer:              `No specific blockers identified for ${name}${currentLevel}. Consider running a Level Readiness Assessment to confirm readiness for ${targetLevel}.`,
      citedEvidenceIds:    [],
      missingEvidenceNote: 'Level readiness assessment',
      confidence:          50,
      isSafe:              true,
      safeForParent:       false,
      safeForPlayer:       false,
    }
  }

  const blockerLines = highBlockers.length > 0
    ? highBlockers.slice(0, 3).map(b => b.description)
    : allBlockers.slice(0, 3).map(b => b.description)

  const weakLines = weakRecords.slice(0, 2).map(r => r.evidence_summary.slice(0, 100))
  const allReasons = [...blockerLines, ...weakLines].slice(0, 4)

  const answer = `${name}${currentLevel} is not yet ready for ${targetLevel}. Reasons: ${allReasons.join(' · ')}.`

  return {
    intent,
    answer,
    citedEvidenceIds:    cite(weakRecords),
    missingEvidenceNote: rollup.missingEvidence.length > 0 ? rollup.missingEvidence.slice(0, 2).join(', ') : null,
    confidence:          highBlockers.length > 0 ? 85 : 65,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

// ─── 9. What should the coach focus on? ──────────────────────────────────────

export function buildCoachFocusAnswer(
  playerFirstName: string | null,
  records: EvidenceRecord[],
  rollup: ProgressRollup,
): EvidenceAnswer {
  const name = playerFirstName ?? 'This player'
  const intent = 'coach_focus'

  if (records.length === 0) {
    return noEvidence(intent, 'assessment or observation records')
  }

  const weakAssessmentRecords = records.filter(
    r => r.source_type === 'assessment_score' && r.evidence_strength === 'weak'
  )
  const highBlockers = rollup.readinessBlockers.filter(b => b.severity === 'high')
  const moderateBlockers = rollup.readinessBlockers.filter(b => b.severity === 'medium')

  const focusItems: string[] = []

  weakAssessmentRecords.slice(0, 2).forEach(r => {
    focusItems.push(r.evidence_summary.slice(0, 100))
  })

  highBlockers.slice(0, 2).forEach(b => {
    if (!focusItems.some(f => f.includes(b.description.slice(0, 40)))) {
      focusItems.push(b.description.slice(0, 100))
    }
  })

  moderateBlockers.slice(0, 1).forEach(b => {
    if (focusItems.length < 3) focusItems.push(b.description.slice(0, 100))
  })

  if (focusItems.length === 0) {
    focusItems.push(rollup.recommendedNextAction)
  }

  const answer = `Coach focus for ${name}: ${focusItems.slice(0, 3).join(' · ')}.`

  return {
    intent,
    answer,
    citedEvidenceIds:    cite(weakAssessmentRecords),
    missingEvidenceNote: rollup.missingEvidence.length > 0 ? rollup.missingEvidence[0] : null,
    confidence:          weakAssessmentRecords.length > 0 ? 80 : 60,
    isSafe:              true,
    safeForParent:       false,
    safeForPlayer:       false,
  }
}

