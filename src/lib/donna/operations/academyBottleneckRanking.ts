// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// Academy Bottleneck Ranking: ranks the most constrained domains across the academy.
//
// Bottlenecks are NOT the same as priorities. A bottleneck is a constraint that
// limits overall academy throughput. A priority is the specific action to address it.
// This engine identifies the constraint; whatShouldIDoTodayEngine converts it to action.
//
// Ranked by: severity × evidence confidence × directness of player impact.

import type {
  AcademySituationAssessment,
  SituationDomain,
  SituationSeverity,
} from './operatingPartnerOutputContract'
import type { OperatingPartnerInputs } from './operatingPartnerInputContract'

// ── Bottleneck types ───────────────────────────────────────────────────────────

export interface RankedBottleneck {
  rank:           number       // 1 = highest leverage
  domain:         SituationDomain
  bottleneckType: string       // descriptive label
  severity:       SituationSeverity
  evidence:       string       // specific data that confirms this is the bottleneck
  affectedCount:  number | null // players, coaches, or levels impacted
  leverageFix:    string       // single action with highest expected leverage
  confidence:     'reliable' | 'provisional'
  dataAvailable:  boolean
}

export interface BottleneckRankingResult {
  primaryBottleneck:  RankedBottleneck | null
  ranked:             RankedBottleneck[]  // 1–6 domains, best first
  totalBottlenecks:   number
  situationConfirms:  boolean  // true when situation type matches top bottleneck domain
}

// ── Bottleneck scoring ─────────────────────────────────────────────────────────

const SEVERITY_SCORE: Record<string, number> = {
  critical: 100, high: 70, medium: 40, low: 15,
}

interface BottleneckCandidate {
  domain:         SituationDomain
  bottleneckType: string
  severity:       SituationSeverity
  evidence:       string
  affectedCount:  number | null
  leverageFix:    string
  confidence:     'reliable' | 'provisional'
  dataAvailable:  boolean
  score:          number
}

// ── Domain bottleneck detectors ────────────────────────────────────────────────

function detectPlayerBottleneck(inputs: OperatingPartnerInputs): BottleneckCandidate | null {
  const { players } = inputs.operations
  if (!players.dataAvailable) return null

  const total     = Math.max(players.totalPlayerCount, 1)
  const stallRate = players.stallCount / total

  if (stallRate >= 0.3 || players.playersWithoutLevel >= 2) {
    const severity: SituationSeverity = stallRate >= 0.4 ? 'critical' : stallRate >= 0.2 ? 'high' : 'medium'
    return {
      domain: 'players',
      bottleneckType: 'Player progression stall',
      severity,
      evidence: `${players.stallCount} of ${players.totalPlayerCount} players stalled (${Math.round(stallRate * 100)}%). ${players.playersWithoutLevel} without a level.`,
      affectedCount: players.stallCount + players.playersWithoutLevel,
      leverageFix: 'Identify the curriculum or coaching cause of stall before advancing any players.',
      confidence: players.hasStallData ? 'reliable' : 'provisional',
      dataAvailable: true,
      score: SEVERITY_SCORE[severity] + Math.min(20, players.stallCount),
    }
  }

  return null
}

function detectCoachBottleneck(inputs: OperatingPartnerInputs): BottleneckCandidate | null {
  const { coaches } = inputs.operations
  if (!coaches.dataAvailable) return null

  if (coaches.missingWrapUpCount >= 2 || coaches.recentWrapUpSubmissionRate < 0.6) {
    const severity: SituationSeverity = coaches.missingWrapUpCount >= 5 ? 'high' : 'medium'
    const evidence = coaches.hasWrapUpData
      ? `${coaches.missingWrapUpCount} recaps missing across ${coaches.missingWrapUpCoachCount} coaches. Submission rate: ${Math.round(coaches.recentWrapUpSubmissionRate * 100)}%.`
      : `${coaches.missingWrapUpCount} recaps missing — wrap-up rate data not fully loaded.`
    return {
      domain: 'coaches',
      bottleneckType: 'Coach execution and intelligence gap',
      severity,
      evidence,
      affectedCount: coaches.missingWrapUpCoachCount,
      leverageFix: 'Restore wrap-up discipline first — this unlocks all downstream intelligence.',
      confidence: coaches.hasWrapUpData ? 'reliable' : 'provisional',
      dataAvailable: true,
      score: SEVERITY_SCORE[severity] + Math.min(15, coaches.missingWrapUpCount * 2),
    }
  }

  return null
}

function detectCurriculumBottleneck(inputs: OperatingPartnerInputs): BottleneckCandidate | null {
  const { curriculum } = inputs.operations
  if (!curriculum.dataAvailable) return null

  const criticalGap = curriculum.emptyLevelCount >= 1 || curriculum.playerBackedBottleneckCount >= 1
  if (!criticalGap && curriculum.missingGateCount < 2) return null

  const severity: SituationSeverity = curriculum.playerBackedBottleneckCount >= 1 ? 'high'
    : curriculum.emptyLevelCount >= 3 ? 'critical'
    : curriculum.emptyLevelCount >= 1 ? 'high'
    : 'medium'

  const evidenceParts: string[] = []
  if (curriculum.emptyLevelCount > 0)                evidenceParts.push(`${curriculum.emptyLevelCount} empty levels`)
  if (curriculum.playerBackedBottleneckCount > 0)    evidenceParts.push(`${curriculum.playerBackedBottleneckCount} player-evidenced bottleneck(s)`)
  if (curriculum.missingGateCount >= 2)              evidenceParts.push(`${curriculum.missingGateCount} undefined advancement gates`)

  const affectedCount = curriculum.emptyLevelCount + curriculum.playerBackedBottleneckCount + curriculum.missingGateCount

  return {
    domain: 'curriculum',
    bottleneckType: 'Curriculum structure gap',
    severity,
    evidence: evidenceParts.join('. '),
    affectedCount,
    leverageFix: curriculum.playerBackedBottleneckCount >= 1
      ? 'Fix player-evidenced bottleneck levels first — these are blocking real players right now.'
      : 'Fill empty levels before advancing any players into them.',
    confidence: curriculum.hasCurriculumData ? 'reliable' : 'provisional',
    dataAvailable: true,
    score: SEVERITY_SCORE[severity] + Math.min(20, affectedCount * 3),
  }
}

function detectParentBottleneck(inputs: OperatingPartnerInputs): BottleneckCandidate | null {
  const { parents } = inputs.operations
  if (!parents.dataAvailable) return null
  if (parents.retentionRiskCount < 1 && parents.communicationGapCount < 5) return null

  const severity: SituationSeverity = parents.retentionRiskCount >= 3 ? 'high'
    : parents.retentionRiskCount >= 1 ? 'medium'
    : 'low'

  return {
    domain: 'parents',
    bottleneckType: 'Parent engagement and communication gap',
    severity,
    evidence: `${parents.retentionRiskCount} at-risk families. ${parents.communicationGapCount} parents without recent updates.`,
    affectedCount: parents.retentionRiskCount,
    leverageFix: 'Contact at-risk families directly before addressing the broader communication gap.',
    confidence: parents.hasRetentionData ? 'reliable' : 'provisional',
    dataAvailable: true,
    score: SEVERITY_SCORE[severity] + Math.min(10, parents.retentionRiskCount * 4),
  }
}

function detectBusinessBottleneck(inputs: OperatingPartnerInputs): BottleneckCandidate | null {
  const { business } = inputs.operations
  if (!business.dataAvailable) return null

  const isDeclining = business.enrollmentTrendSignal === 'declining'
  const isCapacity  = business.capacityIssueCount >= 1
  const isChurn     = business.churnRiskSignal === 'high'

  if (!isDeclining && !isCapacity && !isChurn) return null

  const severity: SituationSeverity = isChurn || isDeclining ? 'high' : 'medium'

  const parts: string[] = []
  if (isDeclining) parts.push('Enrollment declining')
  if (isCapacity)  parts.push(`${business.capacityIssueCount} program(s) at capacity`)
  if (isChurn)     parts.push('Churn risk: HIGH')

  return {
    domain: 'business',
    bottleneckType: 'Business health constraint',
    severity,
    evidence: parts.join('. '),
    affectedCount: null,
    leverageFix: isDeclining ? 'Investigate enrollment root cause before accepting new players.'
      : isChurn ? 'Address churn risk drivers across all domains.'
      : 'Redistribute enrollment to resolve capacity imbalance.',
    confidence: business.hasEnrollmentData ? 'reliable' : 'provisional',
    dataAvailable: true,
    score: SEVERITY_SCORE[severity],
  }
}

function detectSystemBottleneck(inputs: OperatingPartnerInputs): BottleneckCandidate | null {
  const { system } = inputs.operations
  if (!system.dataAvailable) return null

  const hasStale = system.oldestPendingAgeDays !== null && system.oldestPendingAgeDays >= 7
  const hasIncomplete = !system.isAcademyLive || system.onboardingIncompleteItems.length > 0

  if (!hasStale && !hasIncomplete && system.pendingApprovalCount < 5) return null

  const severity: SituationSeverity = hasStale && (system.oldestPendingAgeDays ?? 0) >= 14 ? 'critical'
    : hasStale ? 'high'
    : hasIncomplete ? 'medium'
    : 'low'

  const parts: string[] = []
  if (hasStale)      parts.push(`Approval queue stale — oldest ${system.oldestPendingAgeDays} days`)
  if (hasIncomplete) parts.push(`${system.onboardingIncompleteItems.length} onboarding items incomplete`)
  if (system.pendingApprovalCount >= 5) parts.push(`${system.pendingApprovalCount} items pending`)

  return {
    domain: 'system',
    bottleneckType: 'System and approval queue constraint',
    severity,
    evidence: parts.join('. '),
    affectedCount: system.pendingApprovalCount,
    leverageFix: hasStale ? 'Clear the stale approval queue immediately — it blocks all other workflows.'
      : 'Complete academy onboarding before deploying to coaches and parents.',
    confidence: system.hasLiveData ? 'reliable' : 'provisional',
    dataAvailable: true,
    score: SEVERITY_SCORE[severity] + Math.min(10, system.pendingApprovalCount),
  }
}

// ── Situation domain mapping ───────────────────────────────────────────────────

const SITUATION_DOMAIN_MAP: Record<string, SituationDomain> = {
  player_progression_bottleneck:  'players',
  coach_execution_gap:            'coaches',
  curriculum_gap:                 'curriculum',
  parent_retention_risk:          'parents',
  business_capacity_issue:        'business',
  communication_gap:              'system',
  philosophy_drift:               'philosophy',
  unclear_cause_requires_review:  'system',
  assessment_debt:                'players',
  opportunity_to_double_down:     'cross_domain',
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function rankBottlenecks(
  inputs:    OperatingPartnerInputs,
  situation: AcademySituationAssessment,
): BottleneckRankingResult {
  const detectors = [
    detectSystemBottleneck,      // system first — stale queue blocks everything
    detectCurriculumBottleneck,
    detectCoachBottleneck,
    detectPlayerBottleneck,
    detectParentBottleneck,
    detectBusinessBottleneck,
  ]

  const candidates = detectors
    .map(fn => fn(inputs))
    .filter((c): c is BottleneckCandidate => c !== null)
    .sort((a, b) => b.score - a.score)

  const ranked: RankedBottleneck[] = candidates.map((c, i) => ({
    rank:           i + 1,
    domain:         c.domain,
    bottleneckType: c.bottleneckType,
    severity:       c.severity,
    evidence:       c.evidence,
    affectedCount:  c.affectedCount,
    leverageFix:    c.leverageFix,
    confidence:     c.confidence,
    dataAvailable:  c.dataAvailable,
  }))

  const primaryBottleneck = ranked[0] ?? null
  const situationDomain   = SITUATION_DOMAIN_MAP[situation.situationType] ?? 'cross_domain'
  const situationConfirms = primaryBottleneck !== null && primaryBottleneck.domain === situationDomain

  return {
    primaryBottleneck,
    ranked,
    totalBottlenecks:  ranked.length,
    situationConfirms,
  }
}
