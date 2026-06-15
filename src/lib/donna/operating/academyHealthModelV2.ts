// Mega Sprint 2621–2650 — DONNA Operating Layer V1
// Academy Health Model V2 — numeric 0–100 score with domain sub-scores.
//
// Part 8 of sprint. Expands on:
//   AcademyPulse (pulseStatus enum, not numeric)
//   AcademyHealthReport (section list, not sub-scored)
//
// This model produces a directional health score + top contributing factors.
// Pure TypeScript — no DB, no side effects.

import type { OperatingSignal } from './operatingSignal'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DomainHealthScore {
  domain:    string
  label:     string
  score:     number        // 0–100
  weight:    number        // contribution to overall (all weights sum to 1)
  trend:     'improving' | 'stable' | 'declining'
  topIssue:  string | null
}

export interface AcademyHealthFactor {
  domain: string
  score:  number
  impact: 'positive' | 'negative'
  label:  string
}

export interface AcademyHealthModelV2 {
  overall:              number           // 0–100 weighted average
  healthLabel:          'Excellent' | 'Healthy' | 'Stable' | 'Needs Attention' | 'Critical'
  trend:                'improving' | 'stable' | 'declining'
  playerHealth:         DomainHealthScore
  coachHealth:          DomainHealthScore
  parentHealth:         DomainHealthScore
  curriculumHealth:     DomainHealthScore
  assessmentCompliance: DomainHealthScore
  recommendationThroughput: DomainHealthScore
  attendanceTrend:      DomainHealthScore
  topFactors:           AcademyHealthFactor[]
}

// ── Scoring input ─────────────────────────────────────────────────────────────

export interface HealthModelInput {
  // Player health inputs
  activePlayers:        number
  attentionCount:       number
  stalledPlayerCount:   number
  advancementReadyCount: number
  // Coach health inputs
  coachRecapsMissing:   number
  totalCoachCount:      number
  // Parent health inputs
  parentFollowupCount:  number
  // Curriculum health inputs
  overCapacityGroupCount: number
  curriculumGapCount:   number
  // Assessment compliance
  reassessmentDue:      number
  // Recommendation throughput
  pendingActionsCount:  number
  oldestPendingReviewAgeDays: number | null
  // Attendance trend
  attendanceRiskCount:  number
  // Signals for trend detection
  signals:              OperatingSignal[]
}

// ── Sub-score builders ────────────────────────────────────────────────────────

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

function hasEscalation(signals: OperatingSignal[], domain: OperatingSignal['domain']): boolean {
  return signals.some(s => s.domain === domain && s.isEscalated)
}

function buildPlayerHealth(input: HealthModelInput): DomainHealthScore {
  const total = Math.max(input.activePlayers, 1)
  const attentionRate = input.attentionCount / total
  const stallRate     = input.stalledPlayerCount / total

  let score = 100
  score -= Math.min(40, attentionRate * 200)   // attention = risk
  score -= Math.min(30, stallRate * 100)       // stalls = drag
  if (input.advancementReadyCount > 0) score += 5 // opportunity = positive signal

  const topIssue = input.attentionCount > 0
    ? `${input.attentionCount} player${input.attentionCount !== 1 ? 's' : ''} need attention`
    : input.stalledPlayerCount > 0
      ? `${input.stalledPlayerCount} stalled player${input.stalledPlayerCount !== 1 ? 's' : ''}`
      : null

  return {
    domain: 'players', label: 'Player Health', score: clamp(score), weight: 0.30,
    trend: hasEscalation(input.signals, 'players') ? 'declining' : 'stable',
    topIssue,
  }
}

function buildCoachHealth(input: HealthModelInput): DomainHealthScore {
  const totalCoaches = Math.max(input.totalCoachCount, 1)
  const recapRate = input.coachRecapsMissing / totalCoaches

  let score = 100
  score -= Math.min(40, recapRate * 100)

  const topIssue = input.coachRecapsMissing > 0
    ? `${input.coachRecapsMissing} session${input.coachRecapsMissing !== 1 ? 's' : ''} missing recaps`
    : null

  return {
    domain: 'coaches', label: 'Coach Health', score: clamp(score), weight: 0.20,
    trend: hasEscalation(input.signals, 'coaches') ? 'declining' : 'stable',
    topIssue,
  }
}

function buildParentHealth(input: HealthModelInput): DomainHealthScore {
  let score = 100
  if (input.parentFollowupCount > 0) score -= Math.min(40, input.parentFollowupCount * 10)

  const topIssue = input.parentFollowupCount > 0
    ? `${input.parentFollowupCount} parent${input.parentFollowupCount !== 1 ? 's' : ''} need follow-up`
    : null

  return {
    domain: 'parents', label: 'Parent Health', score: clamp(score), weight: 0.15,
    trend: hasEscalation(input.signals, 'parents') ? 'declining' : 'stable',
    topIssue,
  }
}

function buildCurriculumHealth(input: HealthModelInput): DomainHealthScore {
  let score = 100
  if (input.overCapacityGroupCount > 0) score -= Math.min(30, input.overCapacityGroupCount * 10)
  if (input.curriculumGapCount > 0)     score -= Math.min(20, input.curriculumGapCount * 5)

  const topIssue = input.overCapacityGroupCount > 0
    ? `${input.overCapacityGroupCount} group${input.overCapacityGroupCount !== 1 ? 's' : ''} over capacity`
    : input.curriculumGapCount > 0
      ? `${input.curriculumGapCount} curriculum gap${input.curriculumGapCount !== 1 ? 's' : ''}`
      : null

  return {
    domain: 'curriculum', label: 'Curriculum Health', score: clamp(score), weight: 0.15,
    trend: 'stable',
    topIssue,
  }
}

function buildAssessmentCompliance(input: HealthModelInput): DomainHealthScore {
  const total = Math.max(input.activePlayers, 1)
  const dueRate = input.reassessmentDue / total

  let score = 100
  score -= Math.min(40, dueRate * 150)

  const topIssue = input.reassessmentDue > 0
    ? `${input.reassessmentDue} player${input.reassessmentDue !== 1 ? 's' : ''} overdue for reassessment`
    : null

  return {
    domain: 'assessments', label: 'Assessment Compliance', score: clamp(score), weight: 0.10,
    trend: hasEscalation(input.signals, 'assessments') ? 'declining' : 'stable',
    topIssue,
  }
}

function buildRecommendationThroughput(input: HealthModelInput): DomainHealthScore {
  const age = input.oldestPendingReviewAgeDays ?? 0
  let score = 100
  if (input.pendingActionsCount > 0) score -= Math.min(30, input.pendingActionsCount * 5)
  if (age >= 7)  score -= 20
  if (age >= 14) score -= 20

  const topIssue = input.pendingActionsCount > 0
    ? `${input.pendingActionsCount} action${input.pendingActionsCount !== 1 ? 's' : ''} pending${age > 0 ? ` (oldest: ${age}d)` : ''}`
    : null

  return {
    domain: 'recommendations', label: 'Recommendation Throughput', score: clamp(score), weight: 0.05,
    trend: age >= 7 ? 'declining' : 'stable',
    topIssue,
  }
}

function buildAttendanceTrend(input: HealthModelInput): DomainHealthScore {
  let score = 100
  if (input.attendanceRiskCount > 0) score -= Math.min(30, input.attendanceRiskCount * 10)

  const topIssue = input.attendanceRiskCount > 0
    ? `${input.attendanceRiskCount} player${input.attendanceRiskCount !== 1 ? 's' : ''} with attendance risk`
    : null

  return {
    domain: 'attendance', label: 'Attendance Trend', score: clamp(score), weight: 0.05,
    trend: hasEscalation(input.signals, 'attendance') ? 'declining' : 'stable',
    topIssue,
  }
}

// ── Overall score ─────────────────────────────────────────────────────────────

function buildOverall(domains: DomainHealthScore[]): number {
  const weighted = domains.reduce((sum, d) => sum + d.score * d.weight, 0)
  return clamp(weighted)
}

function buildHealthLabel(overall: number): AcademyHealthModelV2['healthLabel'] {
  if (overall >= 90) return 'Excellent'
  if (overall >= 75) return 'Healthy'
  if (overall >= 60) return 'Stable'
  if (overall >= 40) return 'Needs Attention'
  return 'Critical'
}

function buildTrend(domains: DomainHealthScore[]): AcademyHealthModelV2['trend'] {
  const declining = domains.filter(d => d.trend === 'declining').length
  if (declining >= 3) return 'declining'
  if (declining === 0) return 'improving'
  return 'stable'
}

function buildTopFactors(domains: DomainHealthScore[]): AcademyHealthFactor[] {
  return domains
    .filter(d => d.topIssue !== null || d.score >= 90)
    .sort((a, b) => a.score - b.score) // worst first
    .slice(0, 4)
    .map(d => ({
      domain: d.domain,
      score:  d.score,
      impact: d.score < 70 ? 'negative' : 'positive',
      label:  d.topIssue ?? `${d.label} is healthy`,
    }))
}

// ── Main export ────────────────────────────────────────────────────────────────

export function buildAcademyHealthModelV2(input: HealthModelInput): AcademyHealthModelV2 {
  const playerHealth         = buildPlayerHealth(input)
  const coachHealth          = buildCoachHealth(input)
  const parentHealth         = buildParentHealth(input)
  const curriculumHealth     = buildCurriculumHealth(input)
  const assessmentCompliance = buildAssessmentCompliance(input)
  const recommendationThroughput = buildRecommendationThroughput(input)
  const attendanceTrend      = buildAttendanceTrend(input)

  const domains = [
    playerHealth, coachHealth, parentHealth, curriculumHealth,
    assessmentCompliance, recommendationThroughput, attendanceTrend,
  ]

  const overall     = buildOverall(domains)
  const healthLabel = buildHealthLabel(overall)
  const trend       = buildTrend(domains)
  const topFactors  = buildTopFactors(domains)

  return {
    overall, healthLabel, trend,
    playerHealth, coachHealth, parentHealth, curriculumHealth,
    assessmentCompliance, recommendationThroughput, attendanceTrend,
    topFactors,
  }
}
