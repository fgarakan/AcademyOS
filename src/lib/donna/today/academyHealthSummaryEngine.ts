// Mega Sprint 1535–1564 — DONNA Today Operating System V1
// Academy health summary for the Today page health card.
// Accepts pre-loaded signals (no DB). Returns structured health summary.
// Pure TypeScript — no DB, no React, no side effects.

export type HealthStatus = 'good' | 'watch' | 'action_needed' | 'critical'

export interface AcademyHealthStrength {
  label: string
}

export interface AcademyHealthConcern {
  label:       string
  actionLabel: string
  actionHref:  string
}

export interface AcademyHealthSummary {
  status:            HealthStatus
  score:             number          // 0–100
  headline:          string
  synthesis:         string          // one sentence
  strengths:         AcademyHealthStrength[]
  concerns:          AcademyHealthConcern[]
  recommendedAction: string | null
  recommendedHref:   string | null
  confidence:        'high' | 'medium' | 'low'
}

// ── Input ─────────────────────────────────────────────────────────────────────

export interface AcademyHealthInput {
  activePlayers:              number
  advancementReadyCount:      number
  stalledPlayerCount:         number
  attentionCount:             number       // on_hold + reassessment_due
  reassessmentDue:            number
  totalPendingReviews:        number
  coachRecapsMissing:         number
  curriculumGapCount:         number
  overCapacityGroupCount:     number
  playersWithLevel:           number
  classTemplateCount:         number
  sessionsExist:              boolean
  oldestPendingReviewAgeDays: number | null
  parentUpdatesPending:       number
}

// ── Engine ────────────────────────────────────────────────────────────────────

export function buildAcademyHealthSummary(input: AcademyHealthInput): AcademyHealthSummary {
  const {
    activePlayers,
    advancementReadyCount,
    stalledPlayerCount,
    attentionCount,
    reassessmentDue,
    totalPendingReviews,
    coachRecapsMissing,
    curriculumGapCount,
    overCapacityGroupCount,
    playersWithLevel,
    classTemplateCount,
    sessionsExist,
    oldestPendingReviewAgeDays,
    parentUpdatesPending,
  } = input

  if (activePlayers === 0) {
    return {
      status:            'watch',
      score:             50,
      headline:          'Academy is setting up',
      synthesis:         'No active players yet. Complete setup to unlock health tracking.',
      strengths:         [],
      concerns:          [{ label: 'No active players enrolled', actionLabel: 'Add players', actionHref: '/director/players/new' }],
      recommendedAction: 'Add your first player to begin tracking academy health.',
      recommendedHref:   '/director/players/new',
      confidence:        'low',
    }
  }

  // ── Score computation ──────────────────────────────────────────────────────
  // Start at 100, deduct for each risk signal
  let score = 100

  // High-impact deductions
  if (attentionCount > 0) score -= Math.min(20, attentionCount * 5)
  if (stalledPlayerCount > 0) score -= Math.min(15, stalledPlayerCount * 3)
  if (reassessmentDue > 0) score -= Math.min(10, reassessmentDue * 2)
  if (overCapacityGroupCount > 0) score -= Math.min(10, overCapacityGroupCount * 5)
  if (coachRecapsMissing > 0) score -= Math.min(10, coachRecapsMissing * 2)
  if (curriculumGapCount > 0) score -= Math.min(8, curriculumGapCount * 2)
  if (totalPendingReviews > 5) score -= Math.min(10, (totalPendingReviews - 5) * 2)
  if (oldestPendingReviewAgeDays !== null && oldestPendingReviewAgeDays > 7) score -= 5

  // Positive signals
  if (advancementReadyCount > 0) score = Math.min(100, score + Math.min(5, advancementReadyCount))
  if (sessionsExist) score = Math.min(100, score + 3)
  if (classTemplateCount >= 3) score = Math.min(100, score + 2)

  score = Math.max(0, Math.min(100, Math.round(score)))

  // ── Status ────────────────────────────────────────────────────────────────
  const status: HealthStatus =
    score >= 80 ? 'good' :
    score >= 60 ? 'watch' :
    score >= 40 ? 'action_needed' :
                  'critical'

  // ── Strengths ────────────────────────────────────────────────────────────
  const strengths: AcademyHealthStrength[] = []
  if (advancementReadyCount > 0) {
    strengths.push({ label: `${advancementReadyCount} player${advancementReadyCount > 1 ? 's' : ''} ready to advance` })
  }
  if (stalledPlayerCount === 0 && activePlayers > 0) {
    strengths.push({ label: 'No stalled players' })
  }
  if (coachRecapsMissing === 0 && sessionsExist) {
    strengths.push({ label: 'All recent sessions have coach recaps' })
  }
  if (overCapacityGroupCount === 0 && playersWithLevel > 0) {
    strengths.push({ label: 'All groups within capacity' })
  }
  if (curriculumGapCount === 0 && classTemplateCount > 0) {
    strengths.push({ label: 'Curriculum coverage is complete' })
  }

  // ── Concerns ─────────────────────────────────────────────────────────────
  const concerns: AcademyHealthConcern[] = []
  if (attentionCount > 0) {
    concerns.push({
      label:       `${attentionCount} player${attentionCount > 1 ? 's' : ''} on hold or due for reassessment`,
      actionLabel: 'View players',
      actionHref:  '/director/players',
    })
  }
  if (stalledPlayerCount > 0) {
    concerns.push({
      label:       `${stalledPlayerCount} player${stalledPlayerCount > 1 ? 's' : ''} stalled — no progression in 180+ days`,
      actionLabel: 'Review progression',
      actionHref:  '/director/players',
    })
  }
  if (reassessmentDue > 0) {
    concerns.push({
      label:       `${reassessmentDue} player${reassessmentDue > 1 ? 's' : ''} overdue for reassessment`,
      actionLabel: 'Schedule assessments',
      actionHref:  '/director/review',
    })
  }
  if (overCapacityGroupCount > 0) {
    concerns.push({
      label:       `${overCapacityGroupCount} group${overCapacityGroupCount > 1 ? 's' : ''} over capacity`,
      actionLabel: 'Review groups',
      actionHref:  '/director/players',
    })
  }
  if (coachRecapsMissing > 0) {
    concerns.push({
      label:       `${coachRecapsMissing} session${coachRecapsMissing > 1 ? 's' : ''} missing coach recaps`,
      actionLabel: 'Review recaps',
      actionHref:  '/director/review',
    })
  }
  if (curriculumGapCount > 0) {
    concerns.push({
      label:       `${curriculumGapCount} curriculum gap${curriculumGapCount > 1 ? 's' : ''} identified`,
      actionLabel: 'View curriculum',
      actionHref:  '/director/curriculum',
    })
  }
  if (oldestPendingReviewAgeDays !== null && oldestPendingReviewAgeDays > 7) {
    concerns.push({
      label:       `Oldest pending review is ${oldestPendingReviewAgeDays} days old`,
      actionLabel: 'Clear queue',
      actionHref:  '/director/review',
    })
  }

  // ── Recommended action ────────────────────────────────────────────────────
  let recommendedAction: string | null = null
  let recommendedHref:   string | null = null

  if (attentionCount > 0) {
    recommendedAction = `Review ${attentionCount} player${attentionCount > 1 ? 's' : ''} on hold or due for reassessment`
    recommendedHref   = '/director/players'
  } else if (stalledPlayerCount > 0) {
    recommendedAction = `Review ${stalledPlayerCount} stalled player${stalledPlayerCount > 1 ? 's' : ''} — consider gate assessment`
    recommendedHref   = '/director/players'
  } else if (totalPendingReviews > 0) {
    recommendedAction = `Clear ${totalPendingReviews} pending review${totalPendingReviews > 1 ? 's' : ''} from your queue`
    recommendedHref   = '/director/review'
  } else if (advancementReadyCount > 0) {
    recommendedAction = `Advance ${advancementReadyCount} player${advancementReadyCount > 1 ? 's' : ''} who are ready to move up`
    recommendedHref   = '/director/players'
  } else if (curriculumGapCount > 0) {
    recommendedAction = `Address ${curriculumGapCount} curriculum gap${curriculumGapCount > 1 ? 's' : ''} flagged by DONNA`
    recommendedHref   = '/director/curriculum'
  }

  // ── Headline and synthesis ─────────────────────────────────────────────────
  const headline = buildHeadline(status, score, activePlayers, attentionCount, stalledPlayerCount, totalPendingReviews, advancementReadyCount)
  const synthesis = buildSynthesis(status, activePlayers, attentionCount, stalledPlayerCount, totalPendingReviews, advancementReadyCount, coachRecapsMissing, curriculumGapCount)

  // ── Confidence ────────────────────────────────────────────────────────────
  const confidence: AcademyHealthSummary['confidence'] =
    activePlayers >= 10 && playersWithLevel >= 5 ? 'high' :
    activePlayers >= 3  ? 'medium' :
                          'low'

  return {
    status,
    score,
    headline,
    synthesis,
    strengths,
    concerns,
    recommendedAction,
    recommendedHref,
    confidence,
  }
}

function buildHeadline(
  status: HealthStatus,
  score: number,
  activePlayers: number,
  attentionCount: number,
  stalledPlayerCount: number,
  totalPendingReviews: number,
  advancementReadyCount: number,
): string {
  if (status === 'critical') {
    return `Academy needs attention — ${attentionCount > 0 ? `${attentionCount} players flagged` : `${stalledPlayerCount} players stalled`}`
  }
  if (status === 'action_needed') {
    if (totalPendingReviews > 3) return `${totalPendingReviews} decisions waiting in your queue`
    if (stalledPlayerCount > 0) return `${stalledPlayerCount} player${stalledPlayerCount > 1 ? 's' : ''} may be stalling — review recommended`
    return `Academy health is ${score}% — a few items need attention`
  }
  if (status === 'watch') {
    if (advancementReadyCount > 0) return `${advancementReadyCount} player${advancementReadyCount > 1 ? 's' : ''} ready to advance — otherwise healthy`
    return `Academy health is ${score}% — watching a few signals`
  }
  // good
  if (advancementReadyCount > 0) return `Academy is healthy — ${advancementReadyCount} player${advancementReadyCount > 1 ? 's' : ''} ready to advance`
  return `Academy is healthy with ${activePlayers} active player${activePlayers > 1 ? 's' : ''}`
}

function buildSynthesis(
  status: HealthStatus,
  activePlayers: number,
  attentionCount: number,
  stalledPlayerCount: number,
  totalPendingReviews: number,
  advancementReadyCount: number,
  coachRecapsMissing: number,
  curriculumGapCount: number,
): string {
  const parts: string[] = []

  if (activePlayers > 0) {
    parts.push(`${activePlayers} active player${activePlayers > 1 ? 's' : ''}`)
  }
  if (advancementReadyCount > 0) {
    parts.push(`${advancementReadyCount} ready to advance`)
  }
  if (attentionCount > 0) {
    parts.push(`${attentionCount} need${attentionCount === 1 ? 's' : ''} director attention`)
  }
  if (stalledPlayerCount > 0) {
    parts.push(`${stalledPlayerCount} stalled`)
  }
  if (totalPendingReviews > 0) {
    parts.push(`${totalPendingReviews} pending review${totalPendingReviews > 1 ? 's' : ''}`)
  }
  if (coachRecapsMissing > 0) {
    parts.push(`${coachRecapsMissing} recap${coachRecapsMissing > 1 ? 's' : ''} missing`)
  }
  if (curriculumGapCount > 0) {
    parts.push(`${curriculumGapCount} curriculum gap${curriculumGapCount > 1 ? 's' : ''}`)
  }

  if (parts.length === 0) return 'No signals available — add players and sessions to begin tracking.'
  if (parts.length === 1) return `${parts[0]}.`
  return `${parts.slice(0, 3).join(', ')}.`
}
