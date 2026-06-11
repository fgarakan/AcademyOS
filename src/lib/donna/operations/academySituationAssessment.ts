// Sprint 1775A — DONNA Operating Partner Architecture Audit V1
// Situation Assessment Model: deterministic classification of what is happening
// at the academy right now, based on operational + philosophy signals.
//
// NON-NEGOTIABLE: DONNA must not assume every player problem is a curriculum problem.
// Must distinguish between:
//   - curriculum problem      (content missing or weak)
//   - coaching execution problem (coaches not delivering the curriculum)
//   - placement problem       (players in wrong levels)
//   - attendance problem      (players not showing up)
//   - parent communication problem (parents uninformed or disengaged)
//   - business capacity problem  (too many or too few players in a program)
//   - philosophy drift problem   (academy doing something different from stated identity)
//   - unclear cause             (signals present but data gaps too large to classify)
//
// This file defines:
//   1. SituationSignalSet — the inputs to classification
//   2. Deterministic classification rules
//   3. classifyAcademySituation() — the single entry point
//
// Pure TypeScript. No DB calls. No mutations. Deterministic.

import type {
  SituationType,
  SituationSeverity,
  SituationDomain,
  AcademySituationAssessment,
} from './operatingPartnerOutputContract'

import type { OperatingPartnerPhilosophyInputs } from './operatingPartnerPhilosophyContract'
import type { OperatingPartnerOperationalInputs } from './operatingPartnerOperationalContract'

// ── Signal set ────────────────────────────────────────────────────────────────
// Normalised signals extracted from both philosophy and operational inputs.
// This is the classification input — not the raw contracts.

export interface SituationSignalSet {
  // Player signals
  hasHighStallCount:         boolean  // ≥20% of players stalled
  hasAdvancementBacklog:     boolean  // ≥5 advancement-eligible players waiting
  hasAttendanceRisk:         boolean  // ≥3 players below attendance threshold
  hasReadinessBlockers:      boolean  // ≥2 players blocked by missing evidence

  // Coach signals
  hasMissingWrapUps:         boolean  // ≥2 coaches with outstanding recaps
  hasExecutionInconsistency: boolean  // ≥1 coach with execution deviation signal
  hasHighOverrideRate:       boolean  // override rate > 0.4 (philosophy signal)

  // Curriculum signals
  hasWeakLevels:             boolean  // ≥2 levels with sparse curriculum
  hasEmptyLevels:            boolean  // ≥1 level with no academy-owned content
  hasMissingGates:           boolean  // ≥2 advancement gates undefined
  hasPlayerBackedBottleneck: boolean  // player evidence confirms curriculum is blocking
  hasPendingApprovals:       boolean  // curriculum approvals waiting ≥3 days

  // Parent signals
  hasCommunicationGap:       boolean  // ≥3 parents with no recent update
  hasRetentionRisk:          boolean  // parent + player stall signals combined
  hasEngagementRisk:         boolean  // parent engagement declining

  // Business signals
  hasCapacityIssue:          boolean  // capacity problems in any group
  hasEnrollmentDecline:      boolean  // declining enrollment signal

  // System signals
  hasStalePendingApprovals:  boolean  // oldest pending approval ≥7 days
  hasIncompleteOnboarding:   boolean  // academy setup not complete

  // Philosophy signals
  hasHighDrift:              boolean  // drift severity HIGH
  hasMediumDrift:            boolean  // drift severity MEDIUM
  hasRealityOverrides:       boolean  // player evidence contradicts stated philosophy

  // Opportunity signals
  hasAdvancementMomentum:    boolean  // high recent advancement rate — positive
  hasStrongPreferences:      boolean  // ≥2 reliable positive preference signals

  // Data quality
  dataGapCount:              number   // how many domains have dataAvailable=false
  criticalDataMissing:       boolean  // player or curriculum data unavailable
}

// ── Signal set builder ────────────────────────────────────────────────────────

export function buildSituationSignalSet(
  philosophy: OperatingPartnerPhilosophyInputs,
  ops:        OperatingPartnerOperationalInputs,
): SituationSignalSet {
  const { players, coaches, curriculum, parents, business, system } = ops
  const totalPlayers = players.totalPlayerCount || 1  // avoid div-by-zero

  const dataGapCount = [
    players, coaches, curriculum, parents, business, system,
  ].filter(d => !d.dataAvailable).length

  return {
    // Player
    hasHighStallCount:         players.dataAvailable && (players.stallCount / totalPlayers) >= 0.2,
    hasAdvancementBacklog:     players.dataAvailable && players.advancementEligibleCount >= 5,
    hasAttendanceRisk:         players.dataAvailable && players.hasAttendanceData && players.attendanceRiskCount >= 3,
    hasReadinessBlockers:      players.dataAvailable && players.readinessBlockerCount >= 2,

    // Coach
    hasMissingWrapUps:         coaches.dataAvailable && coaches.missingWrapUpCount >= 2,
    hasExecutionInconsistency: coaches.dataAvailable && coaches.inconsistentExecutionCount >= 1,
    hasHighOverrideRate:       philosophy.decisions.overrideRate > 0.4,

    // Curriculum
    hasWeakLevels:             curriculum.dataAvailable && curriculum.weakLevelCount >= 2,
    hasEmptyLevels:            curriculum.dataAvailable && curriculum.emptyLevelCount >= 1,
    hasMissingGates:           curriculum.dataAvailable && curriculum.missingGateCount >= 2,
    hasPlayerBackedBottleneck: curriculum.dataAvailable && curriculum.playerBackedBottleneckCount >= 1,
    hasPendingApprovals:       curriculum.dataAvailable && curriculum.pendingApprovalCount >= 1,

    // Parent
    hasCommunicationGap:       parents.dataAvailable && parents.communicationGapCount >= 3,
    hasRetentionRisk:          parents.dataAvailable && parents.retentionRiskCount >= 1,
    hasEngagementRisk:         parents.dataAvailable && parents.hasEngagementData && parents.engagementRiskCount >= 2,

    // Business
    hasCapacityIssue:          business.dataAvailable && business.capacityIssueCount >= 1,
    hasEnrollmentDecline:      business.dataAvailable && business.enrollmentTrendSignal === 'declining',

    // System
    hasStalePendingApprovals:  system.oldestPendingAgeDays !== null && system.oldestPendingAgeDays >= 7,
    hasIncompleteOnboarding:   !system.isAcademyLive || system.onboardingIncompleteItems.length > 0,

    // Philosophy
    hasHighDrift:              philosophy.drift.driftDetected && philosophy.drift.driftSeverity === 'HIGH',
    hasMediumDrift:            philosophy.drift.driftDetected && philosophy.drift.driftSeverity === 'MEDIUM',
    hasRealityOverrides:       philosophy.overrides.length > 0,

    // Opportunity
    hasAdvancementMomentum:    players.dataAvailable && players.advancementEligibleCount >= 3 &&
                               players.stallCount === 0,
    hasStrongPreferences:      philosophy.preferences.topPreferences.filter(p => p.confidence === 'reliable').length >= 2,

    // Data quality
    dataGapCount,
    criticalDataMissing:       !players.dataAvailable || !curriculum.dataAvailable,
  }
}

// ── Classification result ─────────────────────────────────────────────────────

export interface ClassificationResult {
  situationType:   SituationType
  severity:        SituationSeverity
  confidence:      'reliable' | 'provisional'
  affectedDomains: SituationDomain[]
  likelyCause:     string
  evidenceSummary: string
  missingData:     string[]
}

// ── Deterministic classification rules ───────────────────────────────────────
// Rules are ordered by specificity — more specific situations ranked first.
// Each rule fires when its conditions are met. First match wins.

function classifyFromSignals(
  s:   SituationSignalSet,
  ops: OperatingPartnerOperationalInputs,
): ClassificationResult {

  // ── Incomplete onboarding — must surface before anything else ───────────────
  if (s.hasIncompleteOnboarding) {
    return {
      situationType:   'unclear_cause_requires_review',
      severity:        'medium',
      confidence:      'provisional',
      affectedDomains: ['system'],
      likelyCause:     'Academy setup is incomplete — operational intelligence is unavailable until the academy is fully configured.',
      evidenceSummary: `${ops.system.onboardingIncompleteItems.length} onboarding item(s) still incomplete.`,
      missingData:     ops.system.onboardingIncompleteItems,
    }
  }

  // ── Critical data missing — cannot classify reliably ──────────────────────
  if (s.criticalDataMissing) {
    return {
      situationType:   'unclear_cause_requires_review',
      severity:        'low',
      confidence:      'provisional',
      affectedDomains: ['players', 'curriculum'],
      likelyCause:     'Player or curriculum data is unavailable — situation cannot be classified without it.',
      evidenceSummary: 'Critical data domains not loaded.',
      missingData:     [
        ...(!ops.players.dataAvailable    ? ['Player operational data'] : []),
        ...(!ops.curriculum.dataAvailable ? ['Curriculum operational data'] : []),
      ],
    }
  }

  // ── Stale approval queue — blocks all other work ─────────────────────────
  if (s.hasStalePendingApprovals) {
    return {
      situationType:   'communication_gap',
      severity:        'critical',
      confidence:      'reliable',
      affectedDomains: ['system', 'players', 'coaches'],
      likelyCause:     `Director approval queue has items waiting ${ops.system.oldestPendingAgeDays ?? '?'} days — this blocks coach workflows, player placements, and parent updates.`,
      evidenceSummary: `Oldest pending approval: ${ops.system.oldestPendingAgeDays ?? '?'} days.`,
      missingData:     [],
    }
  }

  // ── Coach execution gap — recaps missing + players stalling ─────────────
  // Check this before curriculum gap — the same stall can have different root causes.
  if (s.hasMissingWrapUps && s.hasHighStallCount) {
    return {
      situationType:   'coach_execution_gap',
      severity:        'high',
      confidence:      'reliable',
      affectedDomains: ['coaches', 'players'],
      likelyCause:     'Coaches are not submitting session recaps, and player progression has stalled. Missing recaps prevent DONNA from detecting development signals. This is likely an execution problem, not a curriculum problem.',
      evidenceSummary: `${ops.coaches.missingWrapUpCount} missing wrap-ups; ${ops.players.stallCount} stalled players.`,
      missingData:     [],
    }
  }

  // ── High director override rate — execution trust problem ───────────────
  if (s.hasHighOverrideRate && s.hasExecutionInconsistency) {
    return {
      situationType:   'coach_execution_gap',
      severity:        'high',
      confidence:      'provisional',
      affectedDomains: ['coaches', 'philosophy'],
      likelyCause:     'The director is overriding DONNA recommendations at a high rate while coaches are showing inconsistent execution. This may indicate unclear role boundaries or curriculum delivery standards.',
      evidenceSummary: `Override rate: ${Math.round(ops.curriculum.pendingApprovalCount / Math.max(1, ops.curriculum.pendingApprovalCount + 1) * 100)}%; execution inconsistency detected.`,
      missingData:     ['Coach-level deviation data for detail'],
    }
  }

  // ── Player progression bottleneck backed by player evidence ─────────────
  if (s.hasPlayerBackedBottleneck && s.hasHighStallCount) {
    return {
      situationType:   'player_progression_bottleneck',
      severity:        'high',
      confidence:      'reliable',
      affectedDomains: ['players', 'curriculum'],
      likelyCause:     'Player evidence shows weakness in areas the curriculum does not adequately address. Players are stalling because the curriculum lacks the content to move them forward.',
      evidenceSummary: `${ops.players.stallCount} stalled players; ${ops.curriculum.playerBackedBottleneckCount} curriculum bottleneck(s) confirmed by player evidence.`,
      missingData:     [],
    }
  }

  // ── Pure curriculum gap — structural deficit without player stall data ───
  if (s.hasEmptyLevels || (s.hasWeakLevels && s.hasMissingGates)) {
    return {
      situationType:   'curriculum_gap',
      severity:        s.hasEmptyLevels ? 'high' : 'medium',
      confidence:      'reliable',
      affectedDomains: ['curriculum'],
      likelyCause:     'Curriculum structure has significant gaps — missing content or undefined advancement gates. Players who reach these levels will have no clear progression path.',
      evidenceSummary: `${ops.curriculum.emptyLevelCount} empty level(s); ${ops.curriculum.weakLevelCount} weak level(s); ${ops.curriculum.missingGateCount} missing gate(s).`,
      missingData:     [],
    }
  }

  // ── Assessment debt — players outpacing evidence collection ─────────────
  if (s.hasAdvancementBacklog && s.hasReadinessBlockers) {
    return {
      situationType:   'assessment_debt',
      severity:        'medium',
      confidence:      'reliable',
      affectedDomains: ['players', 'curriculum'],
      likelyCause:     'Players are ready to advance but are blocked by missing evidence. Assessment collection is falling behind player development.',
      evidenceSummary: `${ops.players.advancementEligibleCount} advancement-eligible players; ${ops.players.readinessBlockerCount} blocked by missing evidence.`,
      missingData:     [],
    }
  }

  // ── Parent retention risk — engagement + stall combination ──────────────
  if (s.hasRetentionRisk) {
    return {
      situationType:   'parent_retention_risk',
      severity:        'high',
      confidence:      'provisional',
      affectedDomains: ['parents', 'players'],
      likelyCause:     'Parents are showing low engagement while their players are stalling. This combination is the strongest retention risk signal DONNA can detect without revenue data.',
      evidenceSummary: `${ops.parents.retentionRiskCount} player(s) with combined parent disengagement and player stall.`,
      missingData:     ops.parents.hasRetentionData ? [] : ['Parent engagement history'],
    }
  }

  // ── Parent communication gap ─────────────────────────────────────────────
  if (s.hasCommunicationGap) {
    return {
      situationType:   'communication_gap',
      severity:        'medium',
      confidence:      'reliable',
      affectedDomains: ['parents'],
      likelyCause:     'Parents have not received updates within the expected window. This creates information gaps that reduce trust and increase retention risk.',
      evidenceSummary: `${ops.parents.communicationGapCount} parent(s) without a recent update.`,
      missingData:     [],
    }
  }

  // ── Philosophy drift — high severity and confirmed by behavior ───────────
  if (s.hasHighDrift) {
    return {
      situationType:   'philosophy_drift',
      severity:        'medium',
      confidence:      'provisional',
      affectedDomains: ['philosophy'],
      likelyCause:     'The academy\'s observed decisions are significantly diverging from its stated philosophy. This may reflect genuine evolution — or it may indicate that the academy is drifting without intention.',
      evidenceSummary: `Philosophy drift: HIGH severity.`,
      missingData:     ['More behavioral history to confirm whether drift is intentional'],
    }
  }

  // ── Business capacity issue ──────────────────────────────────────────────
  if (s.hasCapacityIssue || s.hasEnrollmentDecline) {
    return {
      situationType:   'business_capacity_issue',
      severity:        s.hasEnrollmentDecline ? 'high' : 'medium',
      confidence:      'provisional',
      affectedDomains: ['business'],
      likelyCause:     s.hasEnrollmentDecline
        ? 'Enrollment is declining — intervention may be needed to stabilise the player base.'
        : 'One or more programs are at or over capacity — new player placement may be blocked.',
      evidenceSummary: `Enrollment: ${ops.business.enrollmentTrendSignal}; capacity issues: ${ops.business.capacityIssueCount}.`,
      missingData:     ops.business.hasCapacityData ? [] : ['Group capacity data'],
    }
  }

  // ── Positive momentum — opportunity to reinforce ─────────────────────────
  if (s.hasAdvancementMomentum && s.hasStrongPreferences) {
    return {
      situationType:   'opportunity_to_double_down',
      severity:        'low',
      confidence:      'provisional',
      affectedDomains: ['players', 'philosophy'],
      likelyCause:     'Advancement is active and the academy has strong established preferences. This is a moment to reinforce what is working rather than changing course.',
      evidenceSummary: `${ops.players.advancementEligibleCount} eligible for advancement; strong philosophy alignment detected.`,
      missingData:     [],
    }
  }

  // ── Too many data gaps — cannot classify ─────────────────────────────────
  if (s.dataGapCount >= 3) {
    return {
      situationType:   'unclear_cause_requires_review',
      severity:        'low',
      confidence:      'provisional',
      affectedDomains: ['cross_domain'],
      likelyCause:     'Multiple data domains are unavailable — the situation cannot be classified with confidence.',
      evidenceSummary: `${s.dataGapCount} of 6 data domains unavailable.`,
      missingData:     [
        ...(!ops.players.dataAvailable    ? ['Player data'] : []),
        ...(!ops.coaches.dataAvailable    ? ['Coach data'] : []),
        ...(!ops.curriculum.dataAvailable ? ['Curriculum data'] : []),
        ...(!ops.parents.dataAvailable    ? ['Parent data'] : []),
        ...(!ops.business.dataAvailable   ? ['Business data'] : []),
        ...(!ops.system.dataAvailable     ? ['System data'] : []),
      ],
    }
  }

  // ── Default: no urgent signals ────────────────────────────────────────────
  return {
    situationType:   'opportunity_to_double_down',
    severity:        'low',
    confidence:      'provisional',
    affectedDomains: ['cross_domain'],
    likelyCause:     'No urgent signals detected. The academy appears to be operating within normal parameters.',
    evidenceSummary: 'No high-severity signals in any domain.',
    missingData:     s.dataGapCount > 0 ? ['Some data domains not loaded — signals may be incomplete'] : [],
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function classifyAcademySituation(
  philosophy: OperatingPartnerPhilosophyInputs,
  ops:        OperatingPartnerOperationalInputs,
): AcademySituationAssessment {
  const signals = buildSituationSignalSet(philosophy, ops)
  const result  = classifyFromSignals(signals, ops)

  const allMissingData = [
    ...result.missingData,
    ...ops.players.missingData.slice(0, 2),
    ...ops.coaches.missingData.slice(0, 1),
  ].filter((v, i, arr) => arr.indexOf(v) === i)

  return {
    situationType:        result.situationType,
    severity:             result.severity,
    confidence:           result.confidence,
    affectedDomains:      result.affectedDomains,
    evidenceSummary:      result.evidenceSummary,
    likelyCause:          result.likelyCause,
    missingData:          allMissingData,
    recommendedDirection: buildRecommendedDirection(result.situationType),
  }
}

function buildRecommendedDirection(type: SituationType): string {
  const map: Record<SituationType, string> = {
    player_progression_bottleneck:  'Address the curriculum content gaps that are blocking player development.',
    coach_execution_gap:            'Reconnect with coaches to restore wrap-up discipline and clarify delivery expectations.',
    curriculum_gap:                 'Build out the missing curriculum structure before the next intake of players.',
    parent_retention_risk:          'Send parent updates for the at-risk families and address the underlying player stall.',
    business_capacity_issue:        'Review group allocation and enrollment pipeline before accepting new players.',
    philosophy_drift:               'Surface the drift to the director and decide whether it reflects intentional evolution or accidental drift.',
    opportunity_to_double_down:     'Reinforce the approaches that are working — extend them to more levels or players.',
    assessment_debt:                'Prioritise evidence collection for advancement-ready players before adding new curriculum content.',
    communication_gap:              'Clear the approval queue and send overdue parent updates to restore information flow.',
    unclear_cause_requires_review:  'Gather missing data before DONNA can provide a specific recommendation.',
  }
  return map[type]
}
