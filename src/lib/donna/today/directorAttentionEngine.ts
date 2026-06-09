// Mega Sprint 1535–1564 — DONNA Today Operating System V1
// Director attention items — cross-domain synthesis.
// Generates attention items for players, coaches, promotions, evidence, approvals, curriculum.
// Each item has: headline, synthesis, actionLabel, actionHref, whyText, priority.
// Pure TypeScript — no DB, no React, no side effects.

export type AttentionPriority = 'critical' | 'high' | 'medium' | 'low'
export type AttentionDomain   = 'player' | 'coach' | 'promotion' | 'evidence' | 'approval' | 'curriculum' | 'setup'

export interface DirectorAttentionItem {
  id:          string
  domain:      AttentionDomain
  priority:    AttentionPriority
  headline:    string
  synthesis:   string
  actionLabel: string
  actionHref:  string
  whyText:     string
}

// ── Input ─────────────────────────────────────────────────────────────────────

export interface AttentionInput {
  activePlayers:              number
  attentionCount:             number
  stalledPlayerCount:         number
  reassessmentDue:            number
  advancementReadyCount:      number
  pendingWrapUpsCount:        number
  assessmentsNeedingReview:   number
  activePlacementReviews:     number
  parentUpdatesPending:       number
  newRequests:                number
  curriculumGapCount:         number
  overCapacityGroupCount:     number
  coachRecapsMissing:         number
  playersWithoutLevel:        number
  oldestPendingReviewAgeDays: number | null
  totalPendingReviews:        number
  unassignedPlayerCount:      number   // players with no primary_coach_id
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function buildDirectorAttentionItems(input: AttentionInput): DirectorAttentionItem[] {
  const items: DirectorAttentionItem[] = []

  // ── Approvals ────────────────────────────────────────────────────────────────
  if (input.oldestPendingReviewAgeDays !== null && input.oldestPendingReviewAgeDays >= 7) {
    items.push({
      id:          'stale-review-queue',
      domain:      'approval',
      priority:    'critical',
      headline:    `Approval queue has a ${input.oldestPendingReviewAgeDays}-day-old item`,
      synthesis:   'Decisions sitting this long may block player progress or coach workflow.',
      actionLabel: 'Clear queue',
      actionHref:  '/director/review',
      whyText:     'Pending approvals block coach wrap-ups, player placements, and parent updates from being finalised.',
    })
  }
  if (input.assessmentsNeedingReview > 0) {
    items.push({
      id:          'assessments-review',
      domain:      'approval',
      priority:    'high',
      headline:    `${input.assessmentsNeedingReview} assessment${input.assessmentsNeedingReview > 1 ? 's' : ''} waiting for your review`,
      synthesis:   'Assessment drafts need director approval before results are recorded.',
      actionLabel: 'Review assessments',
      actionHref:  '/director/review',
      whyText:     'Unreviewed assessments cannot trigger advancement decisions or be shared with parents.',
    })
  }
  if (input.activePlacementReviews > 0) {
    items.push({
      id:          'placements-review',
      domain:      'approval',
      priority:    'high',
      headline:    `${input.activePlacementReviews} player placement${input.activePlacementReviews > 1 ? 's' : ''} waiting for approval`,
      synthesis:   'New players cannot be assigned to groups until placement is approved.',
      actionLabel: 'Review placements',
      actionHref:  '/director/review',
      whyText:     'Players in pending placement cannot join sessions or receive curriculum.',
    })
  }
  if (input.pendingWrapUpsCount > 0) {
    items.push({
      id:          'wrap-ups-review',
      domain:      'approval',
      priority:    'medium',
      headline:    `${input.pendingWrapUpsCount} coach wrap-up${input.pendingWrapUpsCount > 1 ? 's' : ''} awaiting your review`,
      synthesis:   'Coach session recaps need director sign-off to be finalised.',
      actionLabel: 'Review recaps',
      actionHref:  '/director/review',
      whyText:     'Unreviewed recaps leave attendance exceptions and observations unconfirmed.',
    })
  }
  if (input.parentUpdatesPending > 0) {
    items.push({
      id:          'parent-updates-review',
      domain:      'approval',
      priority:    'medium',
      headline:    `${input.parentUpdatesPending} parent update${input.parentUpdatesPending > 1 ? 's' : ''} pending approval`,
      synthesis:   'Parent communication drafts cannot be sent until you approve them.',
      actionLabel: 'Review updates',
      actionHref:  '/director/review',
      whyText:     'Parents are waiting for progress updates. Delayed communication reduces parent confidence.',
    })
  }
  if (input.newRequests > 0) {
    items.push({
      id:          'lesson-requests',
      domain:      'approval',
      priority:    'medium',
      headline:    `${input.newRequests} lesson request${input.newRequests > 1 ? 's' : ''} need review`,
      synthesis:   'Private lesson requests from parents or players are waiting.',
      actionLabel: 'Review requests',
      actionHref:  '/director/review',
      whyText:     'Unanswered lesson requests create a negative parent experience.',
    })
  }

  // ── Players ───────────────────────────────────────────────────────────────────
  if (input.attentionCount > 0) {
    items.push({
      id:          'players-attention',
      domain:      'player',
      priority:    'high',
      headline:    `${input.attentionCount} player${input.attentionCount > 1 ? 's are' : ' is'} on hold or overdue for reassessment`,
      synthesis:   'These players cannot progress until you take action.',
      actionLabel: 'View players',
      actionHref:  '/director/players',
      whyText:     'Players on hold or overdue for reassessment are blocked from advancing — their development is paused.',
    })
  }
  if (input.stalledPlayerCount > 0) {
    items.push({
      id:          'players-stalled',
      domain:      'player',
      priority:    'medium',
      headline:    `${input.stalledPlayerCount} player${input.stalledPlayerCount > 1 ? 's have' : ' has'} been at the same level for 180+ days`,
      synthesis:   'Long time at level without advancement often signals missing evidence or a gate assessment gap.',
      actionLabel: 'Review progression',
      actionHref:  '/director/players',
      whyText:     'Players stalled for 6+ months may be stuck on a gate criterion. A targeted assessment or check-in usually resolves this.',
    })
  }
  if (input.playersWithoutLevel > 0) {
    items.push({
      id:          'players-no-level',
      domain:      'setup',
      priority:    'medium',
      headline:    `${input.playersWithoutLevel} player${input.playersWithoutLevel > 1 ? 's have' : ' has'} no curriculum level`,
      synthesis:   'These players cannot receive curriculum coverage or advancement tracking.',
      actionLabel: 'Assign levels',
      actionHref:  '/director/players',
      whyText:     'Without a level assignment, DONNA cannot track progression, identify stalls, or recommend advancement timing.',
    })
  }

  // ── Promotion ─────────────────────────────────────────────────────────────────
  if (input.advancementReadyCount > 0) {
    items.push({
      id:          'promotion-ready',
      domain:      'promotion',
      priority:    'medium',
      headline:    `${input.advancementReadyCount} player${input.advancementReadyCount > 1 ? 's are' : ' is'} ready to advance`,
      synthesis:   'These players meet advancement criteria and are waiting for director confirmation.',
      actionLabel: 'Review advancement',
      actionHref:  '/director/players',
      whyText:     'Timely advancement keeps players motivated and prevents stagnation. These players have met all tracked gate criteria.',
    })
  }
  if (input.reassessmentDue > 0) {
    items.push({
      id:          'reassessment-due',
      domain:      'evidence',
      priority:    'medium',
      headline:    `${input.reassessmentDue} player${input.reassessmentDue > 1 ? 's are' : ' is'} overdue for reassessment`,
      synthesis:   'Without recent assessments, DONNA cannot confirm or deny advancement eligibility.',
      actionLabel: 'Schedule assessments',
      actionHref:  '/director/review',
      whyText:     'Assessment cadence is the primary evidence source for promotion decisions. Gaps here create blind spots.',
    })
  }

  // ── Coach ─────────────────────────────────────────────────────────────────────
  if (input.coachRecapsMissing > 0) {
    items.push({
      id:          'coach-recaps-missing',
      domain:      'coach',
      priority:    'low',
      headline:    `${input.coachRecapsMissing} session${input.coachRecapsMissing > 1 ? 's' : ''} missing coach recaps`,
      synthesis:   'Coaches have not submitted session recaps for recent completed sessions.',
      actionLabel: 'Follow up',
      actionHref:  '/director/sessions',
      whyText:     'Recaps provide attendance confirmation and observation data that feeds player progress tracking.',
    })
  }
  if (input.unassignedPlayerCount > 0) {
    items.push({
      id:          'coach-unassigned-players',
      domain:      'coach',
      priority:    'low',
      headline:    `${input.unassignedPlayerCount} player${input.unassignedPlayerCount > 1 ? 's have' : ' has'} no assigned coach`,
      synthesis:   'Coach assignments are missing — DONNA cannot track coach accountability for these players.',
      actionLabel: 'Assign coaches',
      actionHref:  '/director/players',
      whyText:     'Without a primary coach assignment, there is no accountability chain for player development.',
    })
  }

  // ── Curriculum ────────────────────────────────────────────────────────────────
  if (input.curriculumGapCount > 0) {
    items.push({
      id:          'curriculum-gaps',
      domain:      'curriculum',
      priority:    'low',
      headline:    `${input.curriculumGapCount} curriculum gap${input.curriculumGapCount > 1 ? 's' : ''} identified`,
      synthesis:   'DONNA has identified curriculum areas without adequate template coverage.',
      actionLabel: 'Review curriculum',
      actionHref:  '/director/curriculum',
      whyText:     'Curriculum gaps mean players at certain levels may not have structured session content to follow.',
    })
  }
  if (input.overCapacityGroupCount > 0) {
    items.push({
      id:          'over-capacity-groups',
      domain:      'player',
      priority:    'medium',
      headline:    `${input.overCapacityGroupCount} group${input.overCapacityGroupCount > 1 ? 's are' : ' is'} over capacity`,
      synthesis:   'More players are enrolled in these groups than the maximum player count allows.',
      actionLabel: 'Review groups',
      actionHref:  '/director/players',
      whyText:     'Over-capacity groups reduce coaching quality and may indicate players need redistribution.',
    })
  }

  // Sort by priority
  const order: Record<AttentionPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  return items.sort((a, b) => order[a.priority] - order[b.priority])
}
