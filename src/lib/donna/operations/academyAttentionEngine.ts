// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// Academy Attention Engine: converts OperatingPartnerInputs into typed attention signals.
//
// ROLE: Observation only. Signals are NEVER priorities.
// Each signal: source, severity, confidence, evidence, recommended direction.
// Philosophy signals (drift, reality overrides) are first-class signals here.
//
// Distinct from proactive/academyAttentionEngine.ts, which operates on
// DirectorDonnaContext (UI layer). This engine operates on OperatingPartnerInputs
// (philosophy-fused contract layer) and feeds the situation assessment chain.

import type { OperatingPartnerInputs } from './operatingPartnerInputContract'
import type { SituationDomain, SituationSeverity } from './operatingPartnerOutputContract'

// ── Signal type ────────────────────────────────────────────────────────────────

export interface OperatingAttentionSignal {
  id:                   string
  domain:               SituationDomain
  severity:             SituationSeverity
  confidence:           'reliable' | 'provisional'
  headline:             string
  evidence:             string
  source:               string   // which input field triggered this
  recommendedDirection: string   // directional hint only — NOT a priority
  dataAvailable:        boolean  // false = floor estimate; signal is provisional
}

export interface OperatingAttentionReport {
  signals:              OperatingAttentionSignal[]
  totalCount:           number
  criticalCount:        number
  highCount:            number
  mediumCount:          number
  lowCount:             number
  domainsWithData:      SituationDomain[]
  domainsMissing:       SituationDomain[]
  hasPhilosophySignals: boolean
  generatedAt:          string
}

// ── Player signals ─────────────────────────────────────────────────────────────

function playerSignals(inputs: OperatingPartnerInputs): OperatingAttentionSignal[] {
  const { players } = inputs.operations
  const signals: OperatingAttentionSignal[] = []
  const conf: 'reliable' | 'provisional' = players.dataAvailable ? 'reliable' : 'provisional'

  if (!players.dataAvailable) {
    signals.push({
      id: 'players-data-unavailable',
      domain: 'players', severity: 'low', confidence: 'provisional',
      headline: 'Player data not loaded',
      evidence: `Missing: ${players.missingData.join(', ')}`,
      source: 'players.dataAvailable',
      recommendedDirection: 'Load player data before assessing player health.',
      dataAvailable: false,
    })
    return signals
  }

  const totalPlayers = Math.max(players.totalPlayerCount, 1)
  const stallRate = players.stallCount / totalPlayers

  if (stallRate >= 0.2) {
    signals.push({
      id: 'players-high-stall',
      domain: 'players',
      severity: stallRate >= 0.4 ? 'critical' : 'high',
      confidence: conf,
      headline: `${players.stallCount} players stalled (${Math.round(stallRate * 100)}% of academy)`,
      evidence: `${players.stallCount} of ${players.totalPlayerCount} active players show no recent progression.`,
      source: 'players.stallCount',
      recommendedDirection: 'Determine whether stall is curriculum, coaching, or placement related before acting.',
      dataAvailable: true,
    })
  }

  if (players.advancementEligibleCount >= 5) {
    signals.push({
      id: 'players-advancement-backlog',
      domain: 'players', severity: 'medium', confidence: conf,
      headline: `${players.advancementEligibleCount} players eligible but not yet advanced`,
      evidence: `${players.advancementEligibleCount} players meet advancement criteria with no recorded level change.`,
      source: 'players.advancementEligibleCount',
      recommendedDirection: 'Review advancement readiness to maintain development momentum.',
      dataAvailable: true,
    })
  }

  if (players.hasAttendanceData && players.attendanceRiskCount >= 3) {
    signals.push({
      id: 'players-attendance-risk',
      domain: 'players',
      severity: players.attendanceRiskCount >= 6 ? 'high' : 'medium',
      confidence: conf,
      headline: `${players.attendanceRiskCount} players with attendance risk`,
      evidence: `${players.attendanceRiskCount} players below acceptable attendance threshold.`,
      source: 'players.attendanceRiskCount',
      recommendedDirection: 'Contact families for attendance-risk players before sessions lapse.',
      dataAvailable: true,
    })
  }

  if (players.readinessBlockerCount >= 2) {
    signals.push({
      id: 'players-readiness-blockers',
      domain: 'players', severity: 'medium', confidence: conf,
      headline: `${players.readinessBlockerCount} players blocked by missing evidence`,
      evidence: `${players.readinessBlockerCount} advancement-ready players cannot advance due to missing evidence records.`,
      source: 'players.readinessBlockerCount',
      recommendedDirection: 'Collect outstanding evidence before the next assessment cycle.',
      dataAvailable: true,
    })
  }

  if (players.playersWithoutLevel > 0) {
    signals.push({
      id: 'players-without-level',
      domain: 'players', severity: 'high', confidence: conf,
      headline: `${players.playersWithoutLevel} placed players have no level assigned`,
      evidence: `${players.playersWithoutLevel} players are in the system but have no curriculum level.`,
      source: 'players.playersWithoutLevel',
      recommendedDirection: 'Assign levels before these players begin structured training.',
      dataAvailable: true,
    })
  }

  if (players.playersWithoutCoach > 0) {
    signals.push({
      id: 'players-without-coach',
      domain: 'players', severity: 'medium', confidence: conf,
      headline: `${players.playersWithoutCoach} players without a primary coach`,
      evidence: `${players.playersWithoutCoach} players have no assigned primary coach.`,
      source: 'players.playersWithoutCoach',
      recommendedDirection: 'Assign coaches to ensure consistent delivery.',
      dataAvailable: true,
    })
  }

  if (players.hasAssessmentData && players.assessmentDueCount >= 3) {
    signals.push({
      id: 'players-assessments-overdue',
      domain: 'players', severity: 'medium', confidence: conf,
      headline: `${players.assessmentDueCount} assessments overdue`,
      evidence: `${players.assessmentDueCount} players are due for assessment or reassessment.`,
      source: 'players.assessmentDueCount',
      recommendedDirection: 'Schedule assessment sessions to update development evidence.',
      dataAvailable: true,
    })
  }

  return signals
}

// ── Coach signals ──────────────────────────────────────────────────────────────

function coachSignals(inputs: OperatingPartnerInputs): OperatingAttentionSignal[] {
  const { coaches } = inputs.operations
  const signals: OperatingAttentionSignal[] = []
  const conf: 'reliable' | 'provisional' = coaches.dataAvailable ? 'reliable' : 'provisional'

  if (!coaches.dataAvailable) {
    signals.push({
      id: 'coaches-data-unavailable',
      domain: 'coaches', severity: 'low', confidence: 'provisional',
      headline: 'Coach data not loaded',
      evidence: `Missing: ${coaches.missingData.join(', ')}`,
      source: 'coaches.dataAvailable',
      recommendedDirection: 'Load coach data before assessing coaching health.',
      dataAvailable: false,
    })
    return signals
  }

  if (coaches.missingWrapUpCount >= 2) {
    signals.push({
      id: 'coaches-missing-wrapups',
      domain: 'coaches',
      severity: coaches.missingWrapUpCount >= 5 ? 'high' : 'medium',
      confidence: conf,
      headline: `${coaches.missingWrapUpCount} session recaps missing`,
      evidence: `${coaches.missingWrapUpCount} sessions have no coach recap submitted. ${coaches.missingWrapUpCoachCount} distinct coaches affected.`,
      source: 'coaches.missingWrapUpCount',
      recommendedDirection: 'Follow up with coaches on outstanding recaps to restore development signal flow.',
      dataAvailable: true,
    })
  }

  if (coaches.inconsistentExecutionCount >= 1) {
    signals.push({
      id: 'coaches-execution-inconsistency',
      domain: 'coaches', severity: 'medium', confidence: conf,
      headline: `${coaches.inconsistentExecutionCount} coach(es) showing delivery inconsistency`,
      evidence: `${coaches.inconsistentExecutionCount} coach(es) with significant deviation from curriculum delivery plan.`,
      source: 'coaches.inconsistentExecutionCount',
      recommendedDirection: 'Clarify delivery expectations and check alignment with curriculum plan.',
      dataAvailable: true,
    })
  }

  if (coaches.hasWrapUpData && coaches.recentWrapUpSubmissionRate < 0.5) {
    signals.push({
      id: 'coaches-low-wrapup-rate',
      domain: 'coaches', severity: 'high', confidence: conf,
      headline: `Wrap-up rate critically low (${Math.round(coaches.recentWrapUpSubmissionRate * 100)}%)`,
      evidence: `Only ${Math.round(coaches.recentWrapUpSubmissionRate * 100)}% of recent sessions have coach recaps. Intelligence flow degraded.`,
      source: 'coaches.recentWrapUpSubmissionRate',
      recommendedDirection: 'Address wrap-up culture gap — low rate blocks all development intelligence.',
      dataAvailable: true,
    })
  }

  if (coaches.stagnantPlayerByCoachCount >= 2) {
    signals.push({
      id: 'coaches-stagnant-players',
      domain: 'coaches', severity: 'medium', confidence: conf,
      headline: `${coaches.stagnantPlayerByCoachCount} coaches with multiple stalled players`,
      evidence: `${coaches.stagnantPlayerByCoachCount} coaches have 2+ stalled players — possible coaching effectiveness gap.`,
      source: 'coaches.stagnantPlayerByCoachCount',
      recommendedDirection: "Review these coaches' sessions for delivery or planning issues.",
      dataAvailable: true,
    })
  }

  return signals
}

// ── Curriculum signals ─────────────────────────────────────────────────────────

function curriculumSignals(inputs: OperatingPartnerInputs): OperatingAttentionSignal[] {
  const { curriculum } = inputs.operations
  const signals: OperatingAttentionSignal[] = []
  const conf: 'reliable' | 'provisional' = curriculum.dataAvailable ? 'reliable' : 'provisional'

  if (!curriculum.dataAvailable) {
    signals.push({
      id: 'curriculum-data-unavailable',
      domain: 'curriculum', severity: 'low', confidence: 'provisional',
      headline: 'Curriculum data not loaded',
      evidence: `Missing: ${curriculum.missingData.join(', ')}`,
      source: 'curriculum.dataAvailable',
      recommendedDirection: 'Load curriculum data before assessing curriculum health.',
      dataAvailable: false,
    })
    return signals
  }

  if (curriculum.emptyLevelCount >= 1) {
    signals.push({
      id: 'curriculum-empty-levels',
      domain: 'curriculum',
      severity: curriculum.emptyLevelCount >= 3 ? 'critical' : 'high',
      confidence: conf,
      headline: `${curriculum.emptyLevelCount} curriculum level(s) with no content`,
      evidence: `${curriculum.emptyLevelCount} level(s) have no academy-owned items — players reaching them have no curriculum path.`,
      source: 'curriculum.emptyLevelCount',
      recommendedDirection: 'Build out empty levels before players advance into them.',
      dataAvailable: true,
    })
  }

  if (curriculum.weakLevelCount >= 2) {
    signals.push({
      id: 'curriculum-weak-levels',
      domain: 'curriculum', severity: 'medium', confidence: conf,
      headline: `${curriculum.weakLevelCount} curriculum levels weak (< 3 items each)`,
      evidence: `${curriculum.weakLevelCount} levels have fewer than 3 academy-owned curriculum items.`,
      source: 'curriculum.weakLevelCount',
      recommendedDirection: 'Strengthen weak levels with targeted content additions.',
      dataAvailable: true,
    })
  }

  if (curriculum.missingGateCount >= 2) {
    signals.push({
      id: 'curriculum-missing-gates',
      domain: 'curriculum', severity: 'medium', confidence: conf,
      headline: `${curriculum.missingGateCount} advancement gates undefined`,
      evidence: `${curriculum.missingGateCount} levels have no defined advancement gate — players cannot be formally advanced.`,
      source: 'curriculum.missingGateCount',
      recommendedDirection: 'Define advancement gates so coaches and players have clear targets.',
      dataAvailable: true,
    })
  }

  if (curriculum.playerBackedBottleneckCount >= 1) {
    signals.push({
      id: 'curriculum-player-backed-bottleneck',
      domain: 'curriculum', severity: 'high', confidence: conf,
      headline: `${curriculum.playerBackedBottleneckCount} bottleneck(s) confirmed by player evidence`,
      evidence: `${curriculum.playerBackedBottleneckCount} level(s) blocking advancement — confirmed by player evidence records.`,
      source: 'curriculum.playerBackedBottleneckCount',
      recommendedDirection: 'Prioritise curriculum fixes for player-evidenced bottlenecks over structural gaps.',
      dataAvailable: true,
    })
  }

  if (curriculum.pendingApprovalCount >= 3) {
    signals.push({
      id: 'curriculum-pending-approvals',
      domain: 'curriculum', severity: 'medium', confidence: conf,
      headline: `${curriculum.pendingApprovalCount} curriculum changes awaiting approval`,
      evidence: `${curriculum.pendingApprovalCount} proposed curriculum changes have not been director-reviewed.`,
      source: 'curriculum.pendingApprovalCount',
      recommendedDirection: 'Review pending curriculum proposals to unblock coach-submitted improvements.',
      dataAvailable: true,
    })
  }

  if (curriculum.missingAssessmentCount >= 2) {
    signals.push({
      id: 'curriculum-missing-success-criteria',
      domain: 'curriculum', severity: 'medium', confidence: conf,
      headline: `${curriculum.missingAssessmentCount} levels missing success criteria`,
      evidence: `${curriculum.missingAssessmentCount} levels have no assessment items defined.`,
      source: 'curriculum.missingAssessmentCount',
      recommendedDirection: 'Add success criteria to enable evidence collection.',
      dataAvailable: true,
    })
  }

  return signals
}

// ── Parent signals ─────────────────────────────────────────────────────────────

function parentSignals(inputs: OperatingPartnerInputs): OperatingAttentionSignal[] {
  const { parents } = inputs.operations
  const signals: OperatingAttentionSignal[] = []
  const conf: 'reliable' | 'provisional' = parents.dataAvailable ? 'reliable' : 'provisional'

  if (!parents.dataAvailable) {
    signals.push({
      id: 'parents-data-unavailable',
      domain: 'parents', severity: 'low', confidence: 'provisional',
      headline: 'Parent data not loaded',
      evidence: `Missing: ${parents.missingData.join(', ')}`,
      source: 'parents.dataAvailable',
      recommendedDirection: 'Load parent data before assessing family engagement.',
      dataAvailable: false,
    })
    return signals
  }

  if (parents.retentionRiskCount >= 1) {
    signals.push({
      id: 'parents-retention-risk',
      domain: 'parents',
      severity: parents.retentionRiskCount >= 3 ? 'high' : 'medium',
      confidence: conf,
      headline: `${parents.retentionRiskCount} player(s) at retention risk`,
      evidence: `${parents.retentionRiskCount} player(s) show combined parent disengagement + player stall.`,
      source: 'parents.retentionRiskCount',
      recommendedDirection: 'Proactively contact at-risk families before the situation escalates.',
      dataAvailable: true,
    })
  }

  if (parents.communicationGapCount >= 3) {
    signals.push({
      id: 'parents-communication-gap',
      domain: 'parents',
      severity: parents.communicationGapCount >= 8 ? 'high' : 'medium',
      confidence: conf,
      headline: `${parents.communicationGapCount} parents without recent updates`,
      evidence: `${parents.communicationGapCount} parents have not received an update within the expected window.`,
      source: 'parents.communicationGapCount',
      recommendedDirection: 'Send progress updates to close the communication gap.',
      dataAvailable: true,
    })
  }

  if (parents.hasEngagementData && parents.engagementRiskCount >= 2) {
    signals.push({
      id: 'parents-engagement-risk',
      domain: 'parents', severity: 'medium', confidence: conf,
      headline: `${parents.engagementRiskCount} parents showing declining engagement`,
      evidence: `${parents.engagementRiskCount} parents with low engagement signals.`,
      source: 'parents.engagementRiskCount',
      recommendedDirection: 'Increase transparency and direct communication for disengaged families.',
      dataAvailable: true,
    })
  }

  if (parents.updateOverdueCount >= 3) {
    signals.push({
      id: 'parents-overdue-updates',
      domain: 'parents', severity: 'medium', confidence: conf,
      headline: `${parents.updateOverdueCount} parent updates overdue`,
      evidence: `${parents.updateOverdueCount} updates are past the academy's transparency threshold.`,
      source: 'parents.updateOverdueCount',
      recommendedDirection: 'Clear overdue updates to maintain parent trust.',
      dataAvailable: true,
    })
  }

  return signals
}

// ── Business signals ───────────────────────────────────────────────────────────

function businessSignals(inputs: OperatingPartnerInputs): OperatingAttentionSignal[] {
  const { business } = inputs.operations
  const signals: OperatingAttentionSignal[] = []
  const conf: 'reliable' | 'provisional' = business.dataAvailable ? 'reliable' : 'provisional'

  if (!business.dataAvailable) {
    signals.push({
      id: 'business-data-unavailable',
      domain: 'business', severity: 'low', confidence: 'provisional',
      headline: 'Business data not loaded',
      evidence: `Missing: ${business.missingData.join(', ')}`,
      source: 'business.dataAvailable',
      recommendedDirection: 'Gather enrollment and capacity data to assess business health.',
      dataAvailable: false,
    })
    return signals
  }

  if (business.enrollmentTrendSignal === 'declining') {
    signals.push({
      id: 'business-enrollment-decline',
      domain: 'business', severity: 'high', confidence: conf,
      headline: 'Enrollment trend: declining',
      evidence: 'Enrollment trend signal showing decline — intervention may be needed to stabilise the player base.',
      source: 'business.enrollmentTrendSignal',
      recommendedDirection: 'Investigate whether decline is seasonal, pricing-related, or outcome-related.',
      dataAvailable: true,
    })
  }

  if (business.capacityIssueCount >= 1) {
    signals.push({
      id: 'business-capacity-issue',
      domain: 'business', severity: 'medium', confidence: conf,
      headline: `${business.capacityIssueCount} program(s) at or over capacity`,
      evidence: `${business.capacityIssueCount} groups or sessions are at or over capacity.`,
      source: 'business.capacityIssueCount',
      recommendedDirection: 'Review group allocation before accepting new players.',
      dataAvailable: true,
    })
  }

  if (business.churnRiskSignal === 'high') {
    signals.push({
      id: 'business-churn-risk-high',
      domain: 'business', severity: 'high', confidence: conf,
      headline: 'Churn risk: HIGH',
      evidence: 'Multiple signals indicate elevated player/family churn risk.',
      source: 'business.churnRiskSignal',
      recommendedDirection: 'Investigate root causes of churn risk across all domains before accepting new players.',
      dataAvailable: true,
    })
  }

  if (business.attendanceTrendLast30Days === 'declining') {
    signals.push({
      id: 'business-attendance-declining',
      domain: 'business', severity: 'medium', confidence: conf,
      headline: 'Attendance trending down (last 30 days)',
      evidence: 'Academy-wide attendance declining over the past 30 days.',
      source: 'business.attendanceTrendLast30Days',
      recommendedDirection: 'Monitor whether this is seasonal or a leading retention indicator.',
      dataAvailable: true,
    })
  }

  if (business.programImbalanceSignal !== null) {
    signals.push({
      id: 'business-program-imbalance',
      domain: 'business', severity: 'low', confidence: conf,
      headline: 'Program imbalance detected',
      evidence: business.programImbalanceSignal,
      source: 'business.programImbalanceSignal',
      recommendedDirection: 'Rebalance enrollment across programs to optimise session quality.',
      dataAvailable: true,
    })
  }

  return signals
}

// ── System signals ─────────────────────────────────────────────────────────────

function systemSignals(inputs: OperatingPartnerInputs): OperatingAttentionSignal[] {
  const { system } = inputs.operations
  const signals: OperatingAttentionSignal[] = []
  const conf: 'reliable' | 'provisional' = system.dataAvailable ? 'reliable' : 'provisional'

  if (!system.dataAvailable) {
    signals.push({
      id: 'system-data-unavailable',
      domain: 'system', severity: 'low', confidence: 'provisional',
      headline: 'System data not loaded',
      evidence: `Missing: ${system.missingData.join(', ')}`,
      source: 'system.dataAvailable',
      recommendedDirection: 'Load system data to assess approval queue and onboarding status.',
      dataAvailable: false,
    })
    return signals
  }

  if (system.oldestPendingAgeDays !== null && system.oldestPendingAgeDays >= 7) {
    signals.push({
      id: 'system-stale-approvals',
      domain: 'system',
      severity: system.oldestPendingAgeDays >= 14 ? 'critical' : 'high',
      confidence: conf,
      headline: `Approval queue stale — oldest item ${system.oldestPendingAgeDays} days old`,
      evidence: `${system.pendingApprovalCount} pending approvals. Oldest: ${system.oldestPendingAgeDays} days. Stale queue blocks coach and curriculum workflows.`,
      source: 'system.oldestPendingAgeDays',
      recommendedDirection: 'Clear the approval queue before addressing other priorities.',
      dataAvailable: true,
    })
  }

  if (!system.isAcademyLive || system.onboardingIncompleteItems.length > 0) {
    signals.push({
      id: 'system-onboarding-incomplete',
      domain: 'system', severity: 'medium', confidence: conf,
      headline: `${system.onboardingIncompleteItems.length} onboarding item(s) incomplete`,
      evidence: `Academy setup incomplete. Missing: ${system.onboardingIncompleteItems.join(', ')}`,
      source: 'system.onboardingIncompleteItems',
      recommendedDirection: 'Complete academy setup before deploying to coaches and parents.',
      dataAvailable: true,
    })
  }

  if (system.pendingApprovalCount >= 5 && (system.oldestPendingAgeDays ?? 0) < 7) {
    signals.push({
      id: 'system-approval-queue-building',
      domain: 'system', severity: 'medium', confidence: conf,
      headline: `${system.pendingApprovalCount} items in approval queue`,
      evidence: `${system.pendingApprovalCount} items awaiting director approval — queue is growing.`,
      source: 'system.pendingApprovalCount',
      recommendedDirection: 'Review queue regularly to prevent backlog from becoming stale.',
      dataAvailable: true,
    })
  }

  if (system.unreadAlertCount >= 5) {
    signals.push({
      id: 'system-unread-alerts',
      domain: 'system', severity: 'medium', confidence: conf,
      headline: `${system.unreadAlertCount} unread system alerts`,
      evidence: `${system.unreadAlertCount} system-generated alerts have not been reviewed.`,
      source: 'system.unreadAlertCount',
      recommendedDirection: 'Review unread alerts to confirm none are blocking operations.',
      dataAvailable: true,
    })
  }

  return signals
}

// ── Philosophy signals ─────────────────────────────────────────────────────────

function philosophySignals(inputs: OperatingPartnerInputs): OperatingAttentionSignal[] {
  const signals: OperatingAttentionSignal[] = []
  const { drift, overrides } = inputs.philosophy

  if (drift.driftDetected && drift.driftSeverity === 'HIGH') {
    signals.push({
      id: 'philosophy-high-drift',
      domain: 'philosophy', severity: 'medium', confidence: drift.confidence,
      headline: 'Philosophy drift: HIGH severity',
      evidence: drift.donnaMessage || 'Academy observed behavior is significantly diverging from stated DNA.',
      source: 'philosophy.drift',
      recommendedDirection: drift.suggestedAction || 'Review whether drift is intentional evolution or accidental deviation.',
      dataAvailable: true,
    })
  }

  overrides.forEach((ro, idx) => {
    if (ro.evidenceStrength === 'STRONG' || ro.evidenceStrength === 'MODERATE') {
      signals.push({
        id: `philosophy-reality-override-${idx}`,
        domain: 'philosophy',
        severity: ro.evidenceStrength === 'STRONG' ? 'high' : 'medium',
        confidence: 'reliable',
        headline: 'Player evidence contradicts stated philosophy',
        evidence: `Reality: ${ro.observedReality}. Philosophy claimed: ${ro.contradictedPhilosophy}`,
        source: 'philosophy.overrides',
        recommendedDirection: ro.recommendedAction,
        dataAvailable: true,
      })
    }
  })

  return signals
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function buildOperatingAttentionReport(
  inputs: OperatingPartnerInputs,
): OperatingAttentionReport {
  const philoSigs = philosophySignals(inputs)

  const allSignals: OperatingAttentionSignal[] = [
    ...playerSignals(inputs),
    ...coachSignals(inputs),
    ...curriculumSignals(inputs),
    ...parentSignals(inputs),
    ...businessSignals(inputs),
    ...systemSignals(inputs),
    ...philoSigs,
  ]

  const domainsWithData:  SituationDomain[] = []
  const domainsMissing:   SituationDomain[] = []
  const ops = inputs.operations

  if (ops.players.dataAvailable)    { domainsWithData.push('players')    } else { domainsMissing.push('players')    }
  if (ops.coaches.dataAvailable)    { domainsWithData.push('coaches')    } else { domainsMissing.push('coaches')    }
  if (ops.curriculum.dataAvailable) { domainsWithData.push('curriculum') } else { domainsMissing.push('curriculum') }
  if (ops.parents.dataAvailable)    { domainsWithData.push('parents')    } else { domainsMissing.push('parents')    }
  if (ops.business.dataAvailable)   { domainsWithData.push('business')   } else { domainsMissing.push('business')   }
  if (ops.system.dataAvailable)     { domainsWithData.push('system')     } else { domainsMissing.push('system')     }

  return {
    signals:              allSignals,
    totalCount:           allSignals.length,
    criticalCount:        allSignals.filter(s => s.severity === 'critical').length,
    highCount:            allSignals.filter(s => s.severity === 'high').length,
    mediumCount:          allSignals.filter(s => s.severity === 'medium').length,
    lowCount:             allSignals.filter(s => s.severity === 'low').length,
    domainsWithData,
    domainsMissing,
    hasPhilosophySignals: philoSigs.length > 0,
    generatedAt:          new Date().toISOString(),
  }
}
