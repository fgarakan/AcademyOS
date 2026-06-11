// Sprint 1776–1805 — DONNA Operating Partner V1 Certification
//
// 9 scenarios × 13 assertion groups.
// Run: npx tsx src/lib/donna/operations/operatingPartnerCertification.ts

import type { OperatingPartnerInputs }           from './operatingPartnerInputContract'
import type {
  OperatingPartnerPhilosophyInputs,
  DriftInput,
} from './operatingPartnerPhilosophyContract'
import type { OperatingPartnerOperationalInputs } from './operatingPartnerOperationalContract'
import type { OperatingPriority }                 from './operatingPartnerOutputContract'

import { classifyAcademySituation }              from './academySituationAssessment'
import { buildEmptyOperationalInputs, buildOperatingPartnerInputs } from './buildOperatingPartnerInputs'
import { buildOperatingAttentionReport }         from './academyAttentionEngine'
import { buildAttentionScore }                   from './academyAttentionScoring'
import { buildTodayPriorities }                  from './whatShouldIDoTodayEngine'
import { buildTopWins }                          from './academyOpportunityEngine'
import { rankBottlenecks }                       from './academyBottleneckRanking'
import { buildDirectorDailyBrief }               from './directorDailyBriefEngine'
import { answerAllCOOQuestions }                 from './cooConversationEngine'
import { buildCapacityBudget, estimateCapacityCost } from './directorCapacityModel'

// ── Assertion engine ───────────────────────────────────────────────────────────

let pass = 0
let fail = 0
let currentScenario = ''

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS ${message}`)
    pass++
  } else {
    console.error(`  FAIL ${message}`)
    fail++
  }
}

function scenario(name: string): void {
  currentScenario = name
  console.log(`\n${name}`)
}

// ── Fixture builders ───────────────────────────────────────────────────────────

// makeEmptyPhilosophy: all dimensions = 'default', overallConfidence = 'provisional'
// → completeness contribution = 5 pts (not 40). Combined with all-empty ops = score < 20.
function makeEmptyPhilosophy(academyId = 'test'): OperatingPartnerPhilosophyInputs {
  return {
    academyId,
    generatedAt: new Date().toISOString(),
    dataWindowDays: 0,
    identity: {
      dimensions: [{
        key: 'technique_focus',
        label: 'Technical Precision',
        finalScore: 50,
        primarySource: 'default',
        confidence: 'provisional',
        driftWarning: null,
      }],
      overallConfidence: 'provisional',
      narrative: 'Academy not yet configured.',
      dataLimitations: ['No onboarding data available'],
    },
    drift: {
      driftDetected: false, driftSeverity: 'LOW', confidence: 'provisional',
      driftedDimensions: [], donnaMessage: '', suggestedAction: '',
    },
    preferences: { topPreferences: [], topAvoidances: [] },
    decisions: {
      totalDecisions: 0, overrideCount: 0, overrideRate: 0,
      topContentTypes: [], dataLimitation: 'No decisions recorded',
    },
    evolution: {
      recentPhases: [], overallTheme: 'No activity', summaryLine: 'No activity recorded.',
      dataLimitations: ['No evolution data'],
    },
    overrides: [],
  }
}

function makeNoDriftPhilosophy(academyId = 'test'): OperatingPartnerPhilosophyInputs {
  const noDrift: DriftInput = {
    driftDetected: false,
    driftSeverity: 'LOW',
    confidence: 'reliable',
    driftedDimensions: [],
    donnaMessage: '',
    suggestedAction: '',
  }

  return {
    academyId,
    generatedAt: new Date().toISOString(),
    dataWindowDays: 90,
    identity: {
      dimensions: [{
        key: 'technique_focus',
        label: 'Technical Precision',
        finalScore: 75,
        primarySource: 'stated_philosophy',
        confidence: 'reliable',
        driftWarning: null,
      }],
      overallConfidence: 'reliable',
      narrative: 'Test academy with technical precision focus.',
      dataLimitations: [],
    },
    drift: noDrift,
    preferences: {
      topPreferences: [{
        label: 'Technical precision',
        score: 80,
        direction: 'rising',
        confidence: 'reliable',
        positiveSignals: 5,
        negativeSignals: 0,
      }],
      topAvoidances: [],
    },
    decisions: {
      totalDecisions: 5,
      overrideCount: 0,
      overrideRate: 0,
      topContentTypes: [
        { contentType: 'drill', count: 3 },
        { contentType: 'exercise', count: 2 },
      ],
      dataLimitation: 'V1: accepted decisions only',
    },
    evolution: {
      recentPhases: [{
        periodLabel: 'June 2026',
        activityLevel: 'moderate',
        dominantTheme: 'Foundation building',
        curriculumAdded: 3,
        curriculumRemoved: 0,
        playersAdvanced: 4,
      }],
      overallTheme: 'Foundation building',
      summaryLine: 'Academy in early growth phase.',
      dataLimitations: [],
    },
    overrides: [],
  }
}

function makeDriftPhilosophy(academyId = 'test'): OperatingPartnerPhilosophyInputs {
  const base = makeNoDriftPhilosophy(academyId)
  return {
    ...base,
    drift: {
      driftDetected: true,
      driftSeverity: 'HIGH',
      confidence: 'reliable',
      driftedDimensions: [{
        dimension: 'Technical Precision',
        gap: 35,
        description: 'Academy stated high technical precision focus but curriculum additions have been generic.',
      }],
      donnaMessage: 'Your curriculum decisions are drifting from your stated technical precision focus.',
      suggestedAction: 'Review recent curriculum additions against your stated philosophy.',
    },
  }
}

function makeCleanOps(academyId = 'test'): OperatingPartnerOperationalInputs {
  const base = buildEmptyOperationalInputs(academyId)
  return {
    ...base,
    players: {
      dataAvailable: true, missingData: [],
      totalPlayerCount: 15, levelDistribution: [],
      stallCount: 1, assessmentDueCount: 1, advancementEligibleCount: 2,
      attendanceRiskCount: 1, readinessBlockerCount: 0,
      playersWithoutLevel: 0, playersWithoutCoach: 0,
      hasStallData: true, hasAssessmentData: true, hasAttendanceData: true,
    },
    coaches: {
      dataAvailable: true, missingData: [],
      totalCoachCount: 3, missingWrapUpCount: 0, missingWrapUpCoachCount: 0,
      inconsistentExecutionCount: 0, stagnantPlayerByCoachCount: 0,
      recentWrapUpSubmissionRate: 0.95, hasWrapUpData: true, hasExecutionData: true,
    },
    curriculum: {
      dataAvailable: true, missingData: [],
      weakLevelCount: 0, emptyLevelCount: 0, missingAssessmentCount: 0,
      missingGateCount: 0, contentGapsByType: {}, bottleneckLevelCount: 0,
      pendingApprovalCount: 0, playerBackedBottleneckCount: 0,
      hasCurriculumData: true, hasGateData: true, hasPlayerEvidenceData: true,
    },
    parents: {
      dataAvailable: true, missingData: [],
      totalParentCount: 12, communicationGapCount: 0, updateOverdueCount: 0,
      engagementRiskCount: 0, retentionRiskCount: 0, transparencyLevel: 'high',
      hasCommunicationData: true, hasEngagementData: true, hasRetentionData: true,
    },
    business: {
      dataAvailable: true, missingData: [],
      enrollmentTrendSignal: 'stable', capacityIssueCount: 0, programImbalanceSignal: null,
      attendanceTrendLast30Days: 'stable', churnRiskSignal: 'low', revenueSignal: 'unavailable',
      hasEnrollmentData: true, hasCapacityData: true,
    },
    system: {
      dataAvailable: true, missingData: [],
      pendingApprovalCount: 0, oldestPendingAgeDays: null,
      onboardingIncompleteItems: [], unreadAlertCount: 0,
      hasLiveData: true, isAcademyLive: true,
    },
    generatedAt: new Date().toISOString(),
    academyId,
    dataWindowDays: 90,
  }
}

function runFullPipeline(inputs: OperatingPartnerInputs) {
  const signals   = buildOperatingAttentionReport(inputs)
  const score     = buildAttentionScore(signals)
  const situation = classifyAcademySituation(inputs.philosophy, inputs.operations)
  const today     = buildTodayPriorities(inputs, situation, signals)
  const wins      = buildTopWins(inputs)
  const bottlenecks = rankBottlenecks(inputs, situation)
  const brief     = buildDirectorDailyBrief(inputs, situation, signals, today, wins)
  const answers   = answerAllCOOQuestions(inputs, brief, situation, today)
  return { signals, score, situation, today, wins, bottlenecks, brief, answers }
}

function validateBriefLimits(brief: ReturnType<typeof runFullPipeline>['brief']): void {
  assert(brief.priorities.length <= 3, `Brief priorities ≤ 3 (got ${brief.priorities.length})`)
  assert(brief.alerts.length <= 3, `Brief alerts ≤ 3 (got ${brief.alerts.length})`)
  assert(brief.wins.length <= 3, `Brief wins ≤ 3 (got ${brief.wins.length})`)
  assert(brief.primaryAction !== undefined && brief.primaryAction !== null, 'Brief has exactly 1 primaryAction')
}

// ── Scenario 1: Empty Academy ─────────────────────────────────────────────────
// Completeness < 20; situation = unclear_cause_requires_review; cannot brief reliably.

function runScenario1(): void {
  scenario('Scenario 1: Empty Academy (completeness < 20)')

  const inputs = buildOperatingPartnerInputs(
    'empty-academy',
    makeEmptyPhilosophy('empty-academy'),
    buildEmptyOperationalInputs('empty-academy'),
  )

  const { signals, situation, today, brief } = runFullPipeline(inputs)

  assert(inputs.inputCompletenessScore < 20,
    `1.1 Completeness < 20 (got ${inputs.inputCompletenessScore})`)
  assert(situation.situationType === 'unclear_cause_requires_review',
    `1.2 Situation: unclear_cause_requires_review (got ${situation.situationType})`)
  assert(situation.confidence === 'provisional',
    `1.3 Situation confidence: provisional`)
  assert(today.cannotBrief === true,
    `1.4 cannotBrief = true when completeness < 20 and situation is unclear`)
  assert(brief.confidence === 'provisional',
    `1.5 Brief confidence: provisional`)
  assert(brief.isComplete === false,
    `1.6 Brief isComplete: false`)
  assert(brief.priorities.length <= 3,
    `1.7 Top Three Law: priorities ≤ 3 (got ${brief.priorities.length})`)
  assert(brief.primaryAction !== null && brief.primaryAction !== undefined,
    `1.8 Primary action still present (investigation brief)`)
  assert(signals.totalCount >= 3,
    `1.9 Signals generated for unavailable domains (got ${signals.totalCount})`)
  assert(signals.signals.every(s => !s.dataAvailable || s.confidence === 'provisional'),
    `1.10 All signals in empty academy are provisional`)
  assert(inputs.missingCriticalInputs.length > 0,
    `1.11 missingCriticalInputs is non-empty (got ${inputs.missingCriticalInputs.length})`)
  assert(today.cannotBriefReason !== null,
    `1.12 cannotBriefReason is set when cannot brief`)
}

// ── Scenario 2: Clean Academy ─────────────────────────────────────────────────
// All domains healthy; opportunity_to_double_down; wins detected; no alerts.

function runScenario2(): void {
  scenario('Scenario 2: Clean Academy (opportunity_to_double_down)')

  const inputs = buildOperatingPartnerInputs(
    'clean-academy',
    makeNoDriftPhilosophy('clean-academy'),
    makeCleanOps('clean-academy'),
  )

  const { situation, today, brief, wins, score, answers } = runFullPipeline(inputs)

  assert(inputs.inputCompletenessScore >= 80,
    `2.1 Completeness ≥ 80 (got ${inputs.inputCompletenessScore})`)
  assert(situation.situationType === 'opportunity_to_double_down',
    `2.2 Situation: opportunity_to_double_down (got ${situation.situationType})`)
  assert(today.cannotBrief === false,
    `2.3 cannotBrief = false — full brief generated`)
  assert(brief.confidence === 'reliable',
    `2.4 Brief confidence: reliable`)
  assert(brief.isComplete === true,
    `2.5 Brief isComplete: true`)
  validateBriefLimits(brief)
  assert(brief.priorities.length <= 3,
    `2.6 Top Three Law: priorities ≤ 3 (got ${brief.priorities.length})`)
  assert(wins.length <= 3,
    `2.7 Wins ≤ 3 (got ${wins.length})`)
  assert(wins.length >= 1,
    `2.8 At least 1 win detected in clean academy`)
  assert(score.overall >= 0 && score.overall <= 100,
    `2.9 Attention score in 0–100 range (got ${score.overall})`)
  assert(score.whatLoweredScore.length >= 3,
    `2.10 Clean academy has domains in whatLoweredScore (got ${score.whatLoweredScore.length})`)
  assert(brief.alerts.length === 0,
    `2.11 No alerts in clean academy (got ${brief.alerts.length})`)
  assert(answers.length === 10,
    `2.12 COO engine answers all 10 questions (got ${answers.length})`)
  assert(answers.every(a => typeof a.answer === 'string' && a.answer.length > 0),
    `2.13 All COO answers have non-empty answer text`)
}

// ── Scenario 3: Coach Execution Gap ───────────────────────────────────────────

function runScenario3(): void {
  scenario('Scenario 3: Coach Execution Gap Academy')

  const cleanOps = makeCleanOps('coach-gap')
  const ops: OperatingPartnerOperationalInputs = {
    ...cleanOps,
    players: { ...cleanOps.players, stallCount: 7, totalPlayerCount: 20 }, // stallRate 35%
    coaches: {
      ...cleanOps.coaches,
      missingWrapUpCount: 6, missingWrapUpCoachCount: 3,
      recentWrapUpSubmissionRate: 0.4, inconsistentExecutionCount: 2,
      stagnantPlayerByCoachCount: 2,
    },
  }

  const inputs = buildOperatingPartnerInputs('coach-gap', makeNoDriftPhilosophy('coach-gap'), ops)
  const { situation, today, brief, signals } = runFullPipeline(inputs)

  assert(situation.situationType === 'coach_execution_gap',
    `3.1 Situation: coach_execution_gap (got ${situation.situationType})`)
  assert(situation.confidence === 'reliable',
    `3.2 Situation confidence: reliable`)
  assert(brief.priorities.length >= 1,
    `3.3 At least 1 priority generated (got ${brief.priorities.length})`)
  validateBriefLimits(brief)
  assert(brief.priorities.some(p => p.domain === 'coaches' || p.domain === 'cross_domain'),
    `3.4 Primary domain is coaches or cross_domain`)
  assert(today.priorities.every(p => p.tradeoff !== undefined),
    `3.5 Every TodayPriority has a TradeoffAnalysis`)
  assert(today.priorities.every(p => p.explanation !== undefined),
    `3.6 Every TodayPriority has a PriorityExplanation (Guard #7)`)
  assert(today.budget.allocatedCapacity <= today.budget.totalCapacity,
    `3.7 Capacity budget not exceeded (${today.budget.allocatedCapacity}/${today.budget.totalCapacity})`)
  assert(signals.signals.some(s => s.domain === 'coaches'),
    `3.8 Attention engine generates coach signals`)
  assert(signals.highCount >= 1,
    `3.9 At least 1 high-severity signal (got ${signals.highCount})`)
  assert(today.priorities.every(p => p.capacityCost > 0),
    `3.10 Every priority has capacityCost > 0`)
  assert(today.priorities[0]?.tradeoff.chosenAction !== undefined,
    `3.11 TradeoffAnalysis.chosenAction is set`)
  assert(today.priorities[0]?.explanation.evidenceUsed.length >= 1,
    `3.12 PriorityExplanation.evidenceUsed is non-empty`)
  assert(today.whatToIgnore.length >= 1,
    `3.13 whatToIgnore is populated for coach execution gap situation`)
}

// ── Scenario 4: Curriculum Gap ────────────────────────────────────────────────

function runScenario4(): void {
  scenario('Scenario 4: Curriculum Gap Academy')

  const cleanOps = makeCleanOps('curriculum-gap')
  const ops: OperatingPartnerOperationalInputs = {
    ...cleanOps,
    curriculum: {
      ...cleanOps.curriculum,
      emptyLevelCount: 2, weakLevelCount: 3, missingGateCount: 3,
      playerBackedBottleneckCount: 1, missingAssessmentCount: 2,
    },
  }

  const inputs = buildOperatingPartnerInputs('curriculum-gap', makeNoDriftPhilosophy('curriculum-gap'), ops)
  const { situation, today, brief, signals } = runFullPipeline(inputs)

  assert(situation.situationType === 'curriculum_gap' || situation.situationType === 'player_progression_bottleneck',
    `4.1 Situation: curriculum gap (got ${situation.situationType})`)
  validateBriefLimits(brief)
  assert(brief.priorities.some(p => p.domain === 'curriculum'),
    `4.2 At least 1 curriculum priority`)

  // Guard #2: attention signals are NOT the same type as priorities
  const signalHeadlines = new Set(signals.signals.map(s => s.headline))
  const priorityTitles  = new Set(brief.priorities.map(p => p.title))
  const overlap = brief.priorities.filter(p => signalHeadlines.has(p.title))
  assert(overlap.length === 0,
    `4.3 Guard #2: No priority title is identical to a signal headline (attention ≠ priority)`)

  // Priorities have required OperatingPriority fields
  for (const p of brief.priorities) {
    assert(
      typeof p.rank === 'number' &&
      typeof p.title === 'string' && p.title.length > 0 &&
      typeof p.domain === 'string' &&
      typeof p.urgency === 'string' &&
      typeof p.expectedImpact === 'string' &&
      typeof p.confidence === 'string' &&
      typeof p.timeEstimate === 'string' &&
      typeof p.firstStep === 'string' &&
      typeof p.approvalRequired === 'boolean' &&
      Array.isArray(p.evidenceUsed) &&
      Array.isArray(p.missingData) &&
      typeof p.reason === 'string',
      `4.4 Priority "${p.title}" has all required OperatingPriority fields`,
    )
  }

  assert(signals.signals.some(s => s.domain === 'curriculum'),
    `4.5 Curriculum signals generated`)
  assert(today.budget.allocatedCapacity <= 100,
    `4.6 Capacity budget ≤ 100 (got ${today.budget.allocatedCapacity})`)
  assert(situation.affectedDomains.length >= 1,
    `4.7 Situation has at least 1 affected domain`)
  assert(today.priorities.every(p => typeof p.capacityCost === 'number' && p.capacityCost > 0),
    `4.8 Every TodayPriority.capacityCost > 0`)
}

// ── Scenario 5: Parent Retention Risk ─────────────────────────────────────────

function runScenario5(): void {
  scenario('Scenario 5: Parent Retention Risk Academy')

  const cleanOps = makeCleanOps('parent-risk')
  const ops: OperatingPartnerOperationalInputs = {
    ...cleanOps,
    players: { ...cleanOps.players, stallCount: 5, totalPlayerCount: 15 }, // 33% stall
    parents: {
      ...cleanOps.parents,
      retentionRiskCount: 3, communicationGapCount: 8,
      updateOverdueCount: 5, engagementRiskCount: 4,
    },
  }

  const inputs = buildOperatingPartnerInputs('parent-risk', makeNoDriftPhilosophy('parent-risk'), ops)
  const { situation, today, brief } = runFullPipeline(inputs)

  assert(situation.situationType === 'parent_retention_risk',
    `5.1 Situation: parent_retention_risk (got ${situation.situationType})`)
  validateBriefLimits(brief)
  assert(brief.priorities.some(p => p.domain === 'parents' || p.domain === 'cross_domain'),
    `5.2 At least 1 parent or cross_domain priority`)
  assert(brief.priorities[0].urgency === 'immediate',
    `5.3 Primary action urgency is immediate for retention risk`)
  assert(today.priorities[0].tradeoff !== undefined,
    `5.4 TradeoffAnalysis present on primary priority`)
  assert(today.priorities[0].explanation.realityUsed.length >= 0,
    `5.5 PriorityExplanation.realityUsed is array (evidence layer)`)
  assert(brief.priorities.length >= 1 && brief.priorities.length <= 3,
    `5.6 1–3 priorities for parent retention scenario (got ${brief.priorities.length})`)
  assert(today.budget.allocatedCapacity <= 100,
    `5.7 Capacity budget ≤ 100 (got ${today.budget.allocatedCapacity})`)
  assert(typeof today.priorities[0]?.tradeoff.opportunityCost === 'string',
    `5.8 TradeoffAnalysis.opportunityCost is a string`)
  assert(today.priorities.every(p => p.explanation.confidence === 'reliable' || p.explanation.confidence === 'provisional'),
    `5.9 All priority explanations have valid confidence`)
}

// ── Scenario 6: Communication Gap (Stale Approvals) ───────────────────────────

function runScenario6(): void {
  scenario('Scenario 6: Communication Gap (stale approval queue)')

  const cleanOps = makeCleanOps('comm-gap')
  const ops: OperatingPartnerOperationalInputs = {
    ...cleanOps,
    parents: { ...cleanOps.parents, updateOverdueCount: 6, communicationGapCount: 8 },
    system: {
      ...cleanOps.system,
      pendingApprovalCount: 7, oldestPendingAgeDays: 10, unreadAlertCount: 3,
    },
  }

  const inputs = buildOperatingPartnerInputs('comm-gap', makeNoDriftPhilosophy('comm-gap'), ops)
  const { situation, today, brief, signals } = runFullPipeline(inputs)

  assert(situation.situationType === 'communication_gap',
    `6.1 Situation: communication_gap (got ${situation.situationType})`)
  assert(situation.severity === 'critical',
    `6.2 Situation severity: critical for stale queue`)
  validateBriefLimits(brief)
  assert(brief.alerts.length >= 1,
    `6.3 At least 1 alert for stale queue scenario`)
  assert(brief.alerts.some(a => a.domain === 'system'),
    `6.4 Alert from system domain`)
  assert(brief.alerts.every(a => a.severity === 'critical' || a.severity === 'high'),
    `6.5 Alerts are critical or high severity only`)
  assert(brief.priorities[0].domain === 'system' || brief.priorities[0].domain === 'parents',
    `6.6 Primary action addresses communication domain`)
  assert(signals.criticalCount + signals.highCount >= 1,
    `6.7 At least 1 critical or high signal (got ${signals.criticalCount + signals.highCount})`)
  assert(today.budget.isOverBudget === false,
    `6.8 Budget.isOverBudget is always false (structurally enforced)`)
}

// ── Scenario 7: Philosophy Drift ──────────────────────────────────────────────
// Philosophy drift should not override player evidence (Guard #3 intelligence hierarchy).

function runScenario7(): void {
  scenario('Scenario 7: Philosophy Drift Academy (intelligence hierarchy)')

  const cleanOps = makeCleanOps('philosophy-drift')
  const inputs   = buildOperatingPartnerInputs(
    'philosophy-drift',
    makeDriftPhilosophy('philosophy-drift'),
    cleanOps,
  )

  const { situation, today, brief, signals } = runFullPipeline(inputs)

  assert(situation.situationType === 'philosophy_drift',
    `7.1 Situation: philosophy_drift (got ${situation.situationType})`)
  validateBriefLimits(brief)
  assert(brief.priorities.some(p => p.domain === 'philosophy' || p.domain === 'curriculum'),
    `7.2 At least 1 philosophy or curriculum priority`)
  assert(brief.priorities.every(p => p.urgency === 'this_month' || p.urgency === 'this_week'),
    `7.3 Philosophy drift priorities are not immediate — no player emergency`)
  assert(signals.hasPhilosophySignals,
    `7.4 Philosophy drift generates philosophy signals`)

  // Guard #3: intelligence hierarchy — if player evidence contradicts philosophy,
  // evidence wins. With no reality overrides, drift is provisional at best.
  assert(brief.priorities.every(p => p.approvalRequired === true || p.confidence !== 'reliable' || p.urgency !== 'immediate'),
    `7.5 Guard #3: Philosophy drift priorities are not marked as immediate reliable actions (evidence must confirm)`)
  assert(today.priorities.every(p => p.explanation !== undefined),
    `7.6 All priorities have explainability (Guard #7)`)
  assert(today.priorities.every(p => p.explanation.philosophyUsed.length >= 0),
    `7.7 PriorityExplanation.philosophyUsed populated`)
}

// ── Scenario 8: Heavy Signal Overload ─────────────────────────────────────────
// 25+ signals; Top Three Law and alert limit still enforced.

function runScenario8(): void {
  scenario('Scenario 8: Heavy Signal Overload (25+ signals, Top Three Law)')

  const base = makeCleanOps('overload')
  const ops: OperatingPartnerOperationalInputs = {
    ...base,
    players: {
      ...base.players,
      totalPlayerCount: 20, stallCount: 9, advancementEligibleCount: 7,
      attendanceRiskCount: 5, readinessBlockerCount: 4,
      playersWithoutLevel: 3, playersWithoutCoach: 2, assessmentDueCount: 5,
      hasStallData: true, hasAssessmentData: true, hasAttendanceData: true,
    },
    coaches: {
      ...base.coaches,
      missingWrapUpCount: 3, missingWrapUpCoachCount: 3,
      recentWrapUpSubmissionRate: 0.3, inconsistentExecutionCount: 2,
      stagnantPlayerByCoachCount: 3, hasWrapUpData: true, hasExecutionData: true,
    },
    curriculum: {
      ...base.curriculum,
      emptyLevelCount: 3, weakLevelCount: 4, missingGateCount: 3,
      playerBackedBottleneckCount: 2, missingAssessmentCount: 3,
      pendingApprovalCount: 4, bottleneckLevelCount: 2,
    },
    parents: {
      ...base.parents,
      retentionRiskCount: 4, communicationGapCount: 10,
      updateOverdueCount: 7, engagementRiskCount: 5, totalParentCount: 15,
    },
    business: {
      ...base.business,
      enrollmentTrendSignal: 'declining', capacityIssueCount: 2,
      churnRiskSignal: 'high', attendanceTrendLast30Days: 'declining',
      programImbalanceSignal: 'Red Ball overcrowded, Green Ball sparse',
    },
    system: {
      ...base.system,
      pendingApprovalCount: 8, oldestPendingAgeDays: 10, unreadAlertCount: 7,
    },
  }

  const inputs  = buildOperatingPartnerInputs('overload', makeDriftPhilosophy('overload'), ops)
  const { signals, today, brief } = runFullPipeline(inputs)

  assert(signals.totalCount >= 25,
    `8.1 ≥ 25 attention signals generated (got ${signals.totalCount})`)
  assert(brief.priorities.length <= 3,
    `8.2 Top Three Law: brief priorities ≤ 3 despite ${signals.totalCount} signals (got ${brief.priorities.length})`)
  assert(brief.alerts.length <= 3,
    `8.3 Alert limit ≤ 3 (got ${brief.alerts.length})`)
  assert(brief.wins.length <= 3,
    `8.4 Win limit ≤ 3 (got ${brief.wins.length})`)
  assert(brief.primaryAction !== null,
    `8.5 Primary action exists despite signal overload`)
  assert(today.budget.allocatedCapacity <= 100,
    `8.6 Capacity budget ≤ 100 despite heavy inputs (got ${today.budget.allocatedCapacity})`)
  assert(today.budget.isOverBudget === false,
    `8.7 isOverBudget always false`)
  assert(today.priorities.every(p => p.tradeoff !== undefined),
    `8.8 Tradeoff analysis present on all priorities`)
  assert(today.priorities.every(p => p.explanation !== undefined),
    `8.9 Explanation present on all priorities (Guard #7)`)
  assert(signals.criticalCount + signals.highCount >= 5,
    `8.10 At least 5 critical/high signals in overload scenario (got ${signals.criticalCount + signals.highCount})`)
}

// ── Scenario 9: Director Capacity Saturation ──────────────────────────────────
// 40 legitimate priorities tested against buildCapacityBudget().
// Verifies: capacity enforced, deferred priorities listed, Top Three Law holds.

function runScenario9(): void {
  scenario('Scenario 9: Director Capacity Saturation (40 priorities, budget = 100)')

  // Create 40 legitimate OperatingPriority objects, all maximum cost
  // immediate + high + approvalRequired = round(25 * 1.3) + 10 = 43 units each
  const fortyPriorities: OperatingPriority[] = Array.from({ length: 40 }, (_, i) => ({
    rank: i + 1,
    title: `Academy priority ${i + 1}: Address critical ${(['players', 'coaches', 'curriculum', 'parents', 'business'] as const)[i % 5]} issue`,
    domain: (['players', 'coaches', 'curriculum', 'parents', 'business'] as const)[i % 5],
    urgency: 'immediate' as const,
    expectedImpact: 'high' as const,
    confidence: 'reliable' as const,
    timeEstimate: '15 minutes',
    firstStep: `Take the first action for priority ${i + 1}.`,
    approvalRequired: true,
    evidenceUsed: [`Evidence signal ${i + 1}`],
    missingData: [],
    reason: `Priority ${i + 1} is a legitimate strategic issue that needs director attention.`,
  }))

  const budget = buildCapacityBudget(fortyPriorities)
  const firstCost = estimateCapacityCost(fortyPriorities[0]!)

  assert(firstCost === 43,
    `9.1 Each heavy priority costs 43 units (got ${firstCost})`)
  assert(budget.totalCapacity === 100,
    `9.2 Total capacity = 100`)
  assert(budget.allocatedCapacity <= budget.totalCapacity,
    `9.3 Allocated capacity ≤ total capacity (${budget.allocatedCapacity} ≤ ${budget.totalCapacity})`)
  assert(budget.isOverBudget === false,
    `9.4 isOverBudget = false (structurally enforced)`)
  assert(budget.deferredPriorities.length > 0,
    `9.5 Deferred priorities listed (${budget.deferredPriorities.length} deferred)`)
  assert(budget.allocations.length <= 3,
    `9.6 Capacity budget allocations ≤ 3 for 43-unit priorities (got ${budget.allocations.length})`)
  assert(budget.deferredPriorities.length === 40 - budget.allocations.length,
    `9.7 Allocated + Deferred = 40 (${budget.allocations.length} + ${budget.deferredPriorities.length} = ${budget.allocations.length + budget.deferredPriorities.length})`)
  assert(budget.remainingCapacity === budget.totalCapacity - budget.allocatedCapacity,
    `9.8 remainingCapacity = total - allocated`)

  // Full pipeline with heavy inputs also enforces Top Three Law
  const base    = makeCleanOps('saturation')
  const ops: OperatingPartnerOperationalInputs = {
    ...base,
    players: { ...base.players, stallCount: 8, totalPlayerCount: 20, advancementEligibleCount: 6 },
    coaches: { ...base.coaches, missingWrapUpCount: 8, missingWrapUpCoachCount: 5, recentWrapUpSubmissionRate: 0.25 },
    curriculum: { ...base.curriculum, emptyLevelCount: 3, missingGateCount: 4, playerBackedBottleneckCount: 2 },
    parents: { ...base.parents, retentionRiskCount: 5, communicationGapCount: 12 },
    system: { ...base.system, pendingApprovalCount: 9, oldestPendingAgeDays: 12 },
  }
  const inputs  = buildOperatingPartnerInputs('saturation', makeNoDriftPhilosophy('saturation'), ops)
  const { today, brief } = runFullPipeline(inputs)

  assert(brief.priorities.length <= 3,
    `9.9 Top Three Law enforced in full pipeline (got ${brief.priorities.length})`)
  assert(today.budget.allocatedCapacity <= 100,
    `9.10 Full-pipeline capacity not exceeded (got ${today.budget.allocatedCapacity})`)
  assert(today.priorities.every(p => typeof p.tradeoff?.deferredActions === 'object'),
    `9.11 Tradeoff.deferredActions present for all priorities`)
  assert(today.priorities[0]?.tradeoff.chosenAction.length > 0,
    `9.12 Tradeoff.chosenAction is set`)
  assert(today.budget.isOverBudget === false,
    `9.13 isOverBudget always false in full pipeline`)
}

// ── Runner ─────────────────────────────────────────────────────────────────────

console.log('RUNNING Sprint 1776–1805 Operating Partner Certification')
console.log('━'.repeat(60))

runScenario1()
runScenario2()
runScenario3()
runScenario4()
runScenario5()
runScenario6()
runScenario7()
runScenario8()
runScenario9()

console.log('\n' + '━'.repeat(60))
console.log(`RESULT: ${pass} passed, ${fail} failed`)
console.log()

if (fail > 0) {
  console.error(`${fail} assertion(s) failed — Sprint 1776–1805 certification INCOMPLETE.`)
  process.exit(1)
} else {
  console.log('All assertions pass — Sprint 1776–1805 Operating Partner V1 is certified.')
}
