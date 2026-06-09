// Mega Sprint 1535–1564 — DONNA Today Operating System V1
// Director risk engine — what threatens the academy if left unaddressed.
// Top 3 risks, sorted by impact. Discloses missing data honestly.
// Pure TypeScript — no DB, no React, no side effects.

export type RiskLevel = 'high' | 'medium' | 'low'

export interface DirectorRisk {
  id:            string
  level:         RiskLevel
  headline:      string
  synthesis:     string
  consequence:   string    // what happens if ignored
  actionLabel:   string
  actionHref:    string
  missingData:   string | null  // disclosed gap if evidence is weak
}

export interface RiskInput {
  activePlayers:              number
  stalledPlayerCount:         number
  attentionCount:             number
  reassessmentDue:            number
  oldestPendingReviewAgeDays: number | null
  coachRecapsMissing:         number
  overCapacityGroupCount:     number
  curriculumGapCount:         number
  unassignedPlayerCount:      number
  playersWithoutLevel:        number
  totalPendingReviews:        number
  parentUpdatesPending:       number
}

export function buildDirectorRisks(input: RiskInput): DirectorRisk[] {
  const risks: DirectorRisk[] = []

  // ── Stale review queue ────────────────────────────────────────────────────────
  if (input.oldestPendingReviewAgeDays !== null && input.oldestPendingReviewAgeDays >= 7) {
    risks.push({
      id:          'stale-queue-risk',
      level:       'high',
      headline:    `Review queue is ${input.oldestPendingReviewAgeDays} days old`,
      synthesis:   'Long-pending approvals create bottlenecks across coaching, assessment, and parent communication.',
      consequence: 'Coaches lose motivation to submit recaps. Parents receive delayed updates. Placement decisions are blocked.',
      actionLabel: 'Clear queue',
      actionHref:  '/director/review',
      missingData: null,
    })
  }

  // ── Players on hold ────────────────────────────────────────────────────────────
  if (input.attentionCount > 0) {
    risks.push({
      id:          'players-on-hold-risk',
      level:       'high',
      headline:    `${input.attentionCount} player${input.attentionCount > 1 ? 's' : ''} on hold — development paused`,
      synthesis:   'Players on hold or overdue for reassessment cannot advance or receive progression tracking.',
      consequence: 'Extended holds reduce player and parent satisfaction. Players may disengage from the program.',
      actionLabel: 'Review players',
      actionHref:  '/director/players',
      missingData: null,
    })
  }

  // ── Stalled players ────────────────────────────────────────────────────────────
  if (input.stalledPlayerCount > 0) {
    risks.push({
      id:          'stalled-players-risk',
      level:       'medium',
      headline:    `${input.stalledPlayerCount} player${input.stalledPlayerCount > 1 ? 's' : ''} stalled for 180+ days`,
      synthesis:   'Players at the same level for 6+ months often have a hidden gate gap or missing assessment evidence.',
      consequence: 'Long stalls increase dropout risk and reduce parent confidence in the program.',
      actionLabel: 'Review progression',
      actionHref:  '/director/players',
      missingData: 'Gate criteria and per-gate completion counts are not tracked in current data — stall detection uses enrollment time as proxy.',
    })
  }

  // ── Over-capacity groups ─────────────────────────────────────────────────────
  if (input.overCapacityGroupCount > 0) {
    risks.push({
      id:          'over-capacity-risk',
      level:       'medium',
      headline:    `${input.overCapacityGroupCount} group${input.overCapacityGroupCount > 1 ? 's' : ''} over capacity`,
      synthesis:   'Groups with more players than maximum capacity reduce coaching attention per player.',
      consequence: 'Over-capacity groups lead to inconsistent session quality and higher dropout rates.',
      actionLabel: 'Review groups',
      actionHref:  '/director/players',
      missingData: null,
    })
  }

  // ── Reassessment overdue ──────────────────────────────────────────────────────
  if (input.reassessmentDue > 0) {
    risks.push({
      id:          'reassessment-overdue-risk',
      level:       'medium',
      headline:    `${input.reassessmentDue} player${input.reassessmentDue > 1 ? 's' : ''} overdue for reassessment`,
      synthesis:   'Without recent assessments, DONNA cannot provide reliable advancement or stall detection.',
      consequence: 'Missed assessments mean promotion decisions are made without evidence — increasing the risk of wrong-level placements.',
      actionLabel: 'Schedule assessments',
      actionHref:  '/director/review',
      missingData: null,
    })
  }

  // ── Unassigned players ────────────────────────────────────────────────────────
  if (input.unassignedPlayerCount > 0) {
    risks.push({
      id:          'unassigned-coach-risk',
      level:       'medium',
      headline:    `${input.unassignedPlayerCount} player${input.unassignedPlayerCount > 1 ? 's have' : ' has'} no assigned coach`,
      synthesis:   'Without a primary coach, there is no accountability chain for development.',
      consequence: 'Unassigned players have no coach following their progress — development gaps may go unnoticed.',
      actionLabel: 'Assign coaches',
      actionHref:  '/director/players',
      missingData: null,
    })
  }

  // ── Missing recaps ────────────────────────────────────────────────────────────
  if (input.coachRecapsMissing > 0) {
    risks.push({
      id:          'missing-recaps-risk',
      level:       'low',
      headline:    `${input.coachRecapsMissing} session${input.coachRecapsMissing > 1 ? 's' : ''} without coach recaps`,
      synthesis:   'Missing recaps leave attendance and observations unrecorded, weakening DONNA\'s data picture.',
      consequence: 'Missing recap data reduces the accuracy of player progress signals and stall detection.',
      actionLabel: 'Follow up with coaches',
      actionHref:  '/director/sessions',
      missingData: null,
    })
  }

  // ── Curriculum gaps ───────────────────────────────────────────────────────────
  if (input.curriculumGapCount > 0) {
    risks.push({
      id:          'curriculum-gap-risk',
      level:       'low',
      headline:    `${input.curriculumGapCount} curriculum gap${input.curriculumGapCount > 1 ? 's' : ''} — some levels lack template coverage`,
      synthesis:   'Players at levels without templates have no structured content for their sessions.',
      consequence: 'Curriculum gaps mean coaches must improvise, reducing consistency and measurability.',
      actionLabel: 'Review curriculum',
      actionHref:  '/director/curriculum',
      missingData: null,
    })
  }

  // ── No data risk ───────────────────────────────────────────────────────────────
  if (risks.length === 0 && input.activePlayers === 0) {
    risks.push({
      id:          'no-data-risk',
      level:       'medium',
      headline:    'Academy has no active players — health signals unavailable',
      synthesis:   'Risk tracking requires active player data. Add players to begin.',
      consequence: 'Without players, no meaningful risk signals can be generated.',
      actionLabel: 'Add players',
      actionHref:  '/director/players/new',
      missingData: 'All risk signals require active player records.',
    })
  }

  // Sort by level (high → medium → low) then slice to top 3
  const order: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 }
  return risks.sort((a, b) => order[a.level] - order[b.level]).slice(0, 3)
}
