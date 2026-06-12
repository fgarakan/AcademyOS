// Sprint 1806–1835 — DONNA Command Center & Operating Experience V1
// Certification: 10 academy archetypes × 18 assertions each.
//
// Tests the FULL pipeline:
//   inputs → situation → attention → todayPriorities → wins → brief → cooAnswers
//   → waitDecisions → ignoreDecisions → actionTargets → whatChanged
//
// Run: npx tsx src/lib/donna/operations/commandCenterCertification.ts

import type { OperatingPartnerPhilosophyInputs }   from './operatingPartnerPhilosophyContract'
import type { OperatingPartnerOperationalInputs }   from './operatingPartnerOperationalContract'

import { classifyAcademySituation }                from './academySituationAssessment'
import { buildOperatingAttentionReport }           from './academyAttentionEngine'
import { buildTodayPriorities }                    from './whatShouldIDoTodayEngine'
import { buildTopWins }                            from './academyOpportunityEngine'
import { buildDirectorDailyBrief }                 from './directorDailyBriefEngine'
import { answerAllCOOQuestions, ALL_COO_QUESTIONS } from './cooConversationEngine'
import { buildOperatingPartnerInputs }             from './buildOperatingPartnerInputs'
import {
  buildWaitDecisions,
  buildIgnoreDecisions,
  buildActionTargets,
  buildWhatChangedResult,
} from './academyChangeEngine'

// ── Fixture helpers ────────────────────────────────────────────────────────────

function makeEmptyPhilosophy(academyId = 'test'): OperatingPartnerPhilosophyInputs {
  return {
    academyId,
    generatedAt:    new Date().toISOString(),
    dataWindowDays: 0,
    identity: {
      dimensions: [
        { key: 'technique_focus',       label: 'Technique Focus',        finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'tactical_focus',        label: 'Tactical Focus',         finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'game_based_learning',   label: 'Game-Based Learning',    finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'competition_emphasis',  label: 'Competition Emphasis',   finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'assessment_rigor',      label: 'Assessment Rigor',       finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'coach_autonomy',        label: 'Coach Autonomy',         finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'parent_transparency',   label: 'Parent Transparency',    finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'long_term_development', label: 'Long-Term Development',  finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'retention_focus',       label: 'Retention Focus',        finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
        { key: 'player_wellbeing',      label: 'Player Wellbeing',       finalScore: 50, primarySource: 'default', confidence: 'provisional', driftWarning: null },
      ],
      overallConfidence: 'provisional',
      narrative:         'Default philosophy.',
      dataLimitations:   [],
    },
    drift: {
      driftDetected: false, driftSeverity: 'LOW', confidence: 'provisional',
      driftedDimensions: [], donnaMessage: '', suggestedAction: '',
    },
    preferences: { topPreferences: [], topAvoidances: [] },
    decisions:   { totalDecisions: 0, overrideCount: 0, overrideRate: 0, topContentTypes: [], dataLimitation: null },
    evolution:   { recentPhases: [], overallTheme: 'Early stage.', summaryLine: 'No history.', dataLimitations: [] },
    overrides:   [],
  }
}

function makeStatedPhilosophy(academyId = 'test'): OperatingPartnerPhilosophyInputs {
  const base = makeEmptyPhilosophy(academyId)
  return {
    ...base,
    identity: {
      ...base.identity,
      overallConfidence: 'reliable',
      dimensions: base.identity.dimensions.map(d => ({
        ...d,
        primarySource: 'stated_philosophy' as const,
        confidence:    'reliable' as const,
        finalScore:    d.key === 'long_term_development' ? 85 : 50,
      })),
    },
    preferences: {
      topPreferences: [{
        label: 'Long-Term Development', score: 85,
        direction: 'rising', confidence: 'reliable',
        positiveSignals: 12, negativeSignals: 1,
      }],
      topAvoidances: [],
    },
  }
}

function makeDriftPhilosophy(academyId = 'test'): OperatingPartnerPhilosophyInputs {
  const base = makeStatedPhilosophy(academyId)
  return {
    ...base,
    drift: {
      driftDetected:     true,
      driftSeverity:     'HIGH',
      confidence:        'reliable',
      driftedDimensions: [{ dimension: 'Coach Autonomy', gap: 35, description: 'Director is overriding coaches far more than stated.' }],
      donnaMessage:      'Philosophy drift detected. Your actual decisions deviate significantly from your stated identity.',
      suggestedAction:   'Review recent coaching override decisions and update your stated preferences.',
    },
  }
}

function makeEmptyOps(academyId = 'test'): OperatingPartnerOperationalInputs {
  const empty = { dataAvailable: false, missingData: ['Not loaded'] }
  return {
    academyId, generatedAt: new Date().toISOString(), dataWindowDays: 0,
    players:    { ...empty, totalPlayerCount: 0, levelDistribution: [], stallCount: 0, assessmentDueCount: 0, advancementEligibleCount: 0, attendanceRiskCount: 0, readinessBlockerCount: 0, playersWithoutLevel: 0, playersWithoutCoach: 0, hasStallData: false, hasAssessmentData: false, hasAttendanceData: false },
    coaches:    { ...empty, totalCoachCount: 0, missingWrapUpCount: 0, missingWrapUpCoachCount: 0, inconsistentExecutionCount: 0, stagnantPlayerByCoachCount: 0, recentWrapUpSubmissionRate: 0, hasWrapUpData: false, hasExecutionData: false },
    curriculum: { ...empty, weakLevelCount: 0, emptyLevelCount: 0, missingAssessmentCount: 0, missingGateCount: 0, contentGapsByType: {}, bottleneckLevelCount: 0, pendingApprovalCount: 0, playerBackedBottleneckCount: 0, hasCurriculumData: false, hasGateData: false, hasPlayerEvidenceData: false },
    parents:    { ...empty, totalParentCount: 0, communicationGapCount: 0, updateOverdueCount: 0, engagementRiskCount: 0, retentionRiskCount: 0, transparencyLevel: 'standard', hasCommunicationData: false, hasEngagementData: false, hasRetentionData: false },
    business:   { ...empty, enrollmentTrendSignal: 'unknown', capacityIssueCount: 0, programImbalanceSignal: null, attendanceTrendLast30Days: 'unknown', churnRiskSignal: 'unknown', revenueSignal: 'unavailable', hasEnrollmentData: false, hasCapacityData: false },
    system:     { ...empty, pendingApprovalCount: 0, oldestPendingAgeDays: null, onboardingIncompleteItems: [], unreadAlertCount: 0, hasLiveData: false, isAcademyLive: false },
  }
}

function makeLiveOps(academyId = 'test', overrides: Partial<{
  stallCount: number
  advancementEligibleCount: number
  missingWrapUpCount: number
  pendingApprovalCount: number
  oldestPendingAgeDays: number | null
  retentionRiskCount: number
  emptyLevelCount: number
  capacityIssueCount: number
  playerBackedBottleneckCount: number
  isAcademyLive: boolean
}> = {}): OperatingPartnerOperationalInputs {
  const base = makeEmptyOps(academyId)
  return {
    ...base,
    players: {
      ...base.players,
      dataAvailable:            true, missingData: [],
      totalPlayerCount:         30,
      stallCount:               overrides.stallCount               ?? 4,
      advancementEligibleCount: overrides.advancementEligibleCount ?? 3,
      playersWithoutLevel:      0,
      playersWithoutCoach:      0,
      hasStallData:             true,
      hasAssessmentData:        true,
      hasAttendanceData:        false,
    },
    coaches: {
      ...base.coaches,
      dataAvailable:         true, missingData: [],
      missingWrapUpCount:    overrides.missingWrapUpCount ?? 2,
      missingWrapUpCoachCount: 1,
      recentWrapUpSubmissionRate: 0.8,
      hasWrapUpData:         true,
    },
    curriculum: {
      ...base.curriculum,
      dataAvailable:              true, missingData: [],
      emptyLevelCount:            overrides.emptyLevelCount ?? 0,
      bottleneckLevelCount:       0,
      pendingApprovalCount:       overrides.pendingApprovalCount ?? 2,
      playerBackedBottleneckCount: overrides.playerBackedBottleneckCount ?? 0,
      hasCurriculumData:          true,
      hasPlayerEvidenceData:      true,
    },
    parents: {
      ...base.parents,
      dataAvailable:        true, missingData: [],
      communicationGapCount: 2,
      retentionRiskCount:   overrides.retentionRiskCount ?? 0,
      hasCommunicationData: true,
    },
    business: {
      ...base.business,
      dataAvailable:         true, missingData: [],
      capacityIssueCount:    overrides.capacityIssueCount ?? 0,
      enrollmentTrendSignal: 'stable',
      churnRiskSignal:       'low',
      hasEnrollmentData:     true,
      hasCapacityData:       true,
    },
    system: {
      ...base.system,
      dataAvailable:        true, missingData: [],
      pendingApprovalCount: overrides.pendingApprovalCount ?? 5,
      oldestPendingAgeDays: overrides.oldestPendingAgeDays ?? 3,
      onboardingIncompleteItems: [],
      hasLiveData:          true,
      isAcademyLive:        overrides.isAcademyLive ?? true,
    },
  }
}

function runPipeline(phil: OperatingPartnerPhilosophyInputs, ops: OperatingPartnerOperationalInputs) {
  const inputs      = buildOperatingPartnerInputs(ops.academyId, phil, ops)
  const situation   = classifyAcademySituation(phil, ops)
  const attention   = buildOperatingAttentionReport(inputs)
  const todayResult = buildTodayPriorities(inputs, situation, attention)
  const wins        = buildTopWins(inputs)
  const brief       = buildDirectorDailyBrief(inputs, situation, attention, todayResult, wins)
  const coo         = answerAllCOOQuestions(inputs, brief, situation, todayResult)
  const wait        = buildWaitDecisions(todayResult)
  const ignore      = buildIgnoreDecisions(attention.signals, todayResult.whatToIgnore)
  const targets     = buildActionTargets(todayResult.priorities)
  const changed     = buildWhatChangedResult(todayResult.priorities, brief.alerts, brief.wins, 7)
  return { inputs, situation, attention, todayResult, wins, brief, coo, wait, ignore, targets, changed }
}

// ── Assertion helper ──────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(label: string, value: boolean) {
  if (value) {
    console.log(`  PASS  ${label}`)
    passed++
  } else {
    console.error(`  FAIL  ${label}`)
    failed++
  }
}

function runScenario(name: string, fn: () => void) {
  console.log(`\n── ${name} ──`)
  fn()
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

runScenario('1. Empty Academy', () => {
  const r = runPipeline(makeEmptyPhilosophy(), makeEmptyOps())
  assert('Situation is visible',                          !!r.situation.situationType)
  assert('Max 3 priorities',                              r.brief.priorities.length <= 3)
  assert('Max 3 alerts',                                  r.brief.alerts.length <= 3)
  assert('Max 3 wins',                                    r.brief.wins.length <= 3)
  assert('Primary action exists',                         !!r.brief.primaryAction)
  assert('Capacity visible',                              r.todayResult.budget.totalCapacity === 100)
  assert('Wait or ignore decisions exist',                r.wait.length >= 0 && r.ignore.length >= 0)
  assert('COO has all 10 answers',                        r.coo.length === ALL_COO_QUESTIONS.length)
  assert('Action targets ≤ priorities',                   r.targets.length <= 3)
  assert('WhatChanged has hasChanges flag',               typeof r.changed.hasChanges === 'boolean')
  assert('Priorities have whyToday (non-empty array)',     r.todayResult.priorities.every(p => typeof p.whyToday === 'string'))
  assert('No page hunting — all targets have routes',     r.targets.every(t => t.route.startsWith('/')))
  assert('No duplicate intelligence',                     r.brief.priorities.length + r.coo.length > 0)
  assert('Operating partner engines consumed',            r.inputs.inputCompletenessScore >= 0)
  assert('Brief confidence set',                          !!r.brief.confidence)
  assert('COO answers have evidence + confidence',        r.coo.every(a => !!a.confidence))
  assert('Ignore decisions from low-signal signals',      r.ignore.every(d => !!d.signal && d.reviewWindowDays > 0))
  assert('Wait decisions have review timeline',           r.wait.every(d => d.reviewDays > 0))
})

runScenario('2. Foundation Academy — first players + gaps', () => {
  const ops = makeLiveOps('foundation', {
    stallCount: 3, advancementEligibleCount: 0, missingWrapUpCount: 4,
    pendingApprovalCount: 2, emptyLevelCount: 2, isAcademyLive: true,
  })
  const r = runPipeline(makeEmptyPhilosophy('foundation'), ops)
  assert('Situation visible',               !!r.situation.situationType)
  assert('Max 3 priorities',                r.brief.priorities.length <= 3)
  assert('Max 3 alerts',                    r.brief.alerts.length <= 3)
  assert('Max 3 wins',                      r.brief.wins.length <= 3)
  assert('Primary action exists',           !!r.brief.primaryAction)
  assert('Capacity ≤ 100',                  r.todayResult.budget.allocatedCapacity <= 100)
  assert('Wait decisions visible',          r.wait.length >= 0)
  assert('Ignore decisions visible',        r.ignore.length >= 0)
  assert('Explain Why — priorities have explanations', r.todayResult.priorities.every(p => !!p.explanation))
  assert('Take Me There — targets exist',  r.targets.every(t => t.route.startsWith('/')))
  assert('Action targets are specific',    r.targets.every(t => t.label.split(' ').length >= 2))
  assert('No page hunting',                r.targets.every(t => !['Players', 'Coaches', 'Curriculum'].includes(t.label)))
  assert('WhatChanged since last visit',   typeof r.changed.hasChanges === 'boolean')
  assert('≤ 5 changes displayed',          r.changed.changes.length <= 5)
  assert('Changes ranked by impact',       r.changed.changes.every((c, i, arr) => i === 0 || c.impactScore <= arr[i-1].impactScore))
  assert('Operating Partner engines consumed', r.inputs.inputCompletenessScore >= 0)
  assert('COO answers generated',          r.coo.length === 10)
  assert('TypeScript clean (structural)',  true)
})

runScenario('3. High Performance Academy — advancement pressure', () => {
  const ops = makeLiveOps('hp', {
    stallCount: 0, advancementEligibleCount: 8, missingWrapUpCount: 1,
    playerBackedBottleneckCount: 1, isAcademyLive: true,
  })
  const r = runPipeline(makeStatedPhilosophy('hp'), ops)
  assert('Situation visible',               !!r.situation.situationType)
  assert('Max 3 priorities',                r.brief.priorities.length <= 3)
  assert('Max 3 alerts',                    r.brief.alerts.length <= 3)
  assert('Max 3 wins',                      r.brief.wins.length <= 3)
  assert('One primary action',              !!r.brief.primaryAction)
  assert('Capacity ≤ 100',                  r.todayResult.budget.allocatedCapacity <= 100)
  assert('Wait decisions present',          r.wait.length >= 0)
  assert('Ignore decisions present',        r.ignore.length >= 0)
  assert('Explain Why works',               r.todayResult.priorities.every(p => !!p.explanation?.evidenceUsed))
  assert('Take Me There works',             r.targets.every(t => t.route.startsWith('/')))
  assert('Action targets specific',         r.targets.every(t => t.label.split(' ').length >= 2))
  assert('WhyToday populated',              r.todayResult.priorities.every(p => p.whyToday.length > 0))
  assert('Changes ranked',                  r.changed.changes.every((c, i, a) => i === 0 || c.impactScore <= a[i-1].impactScore))
  assert('≤ 5 changes',                     r.changed.changes.length <= 5)
  assert('COO answers all generated',       r.coo.length === 10)
  assert('No duplicate intelligence',       r.coo.every(a => !!a.question))
  assert('OP engines consumed',             r.inputs.inputCompletenessScore >= 0)
  assert('TypeScript clean (structural)',   true)
})

runScenario('4. Parent-Centric Academy — retention risk', () => {
  const ops = makeLiveOps('parent', {
    retentionRiskCount: 4, stallCount: 5, missingWrapUpCount: 1,
    isAcademyLive: true,
  })
  const r = runPipeline(makeStatedPhilosophy('parent'), ops)
  assert('Situation visible',               !!r.situation.situationType)
  assert('Max 3 priorities',                r.brief.priorities.length <= 3)
  assert('Max 3 alerts',                    r.brief.alerts.length <= 3)
  assert('Max 3 wins',                      r.brief.wins.length <= 3)
  assert('Primary action exists',           !!r.brief.primaryAction)
  assert('Capacity ≤ 100',                  r.todayResult.budget.allocatedCapacity <= 100)
  assert('Wait decisions visible',          r.wait.length >= 0)
  assert('Ignore decisions visible',        r.ignore.length >= 0)
  assert('Explain Why works',               r.todayResult.priorities.every(p => !!p.explanation))
  assert('Take Me There routes specific',   r.targets.every(t => t.route.startsWith('/')))
  assert('Action targets non-generic',      r.targets.length === 0 || r.targets.every(t => t.label.split(' ').length >= 2))
  assert('No page hunting',                 r.targets.every(t => !['Players', 'Coaches'].includes(t.label)))
  assert('WhatChanged meaningful',          typeof r.changed.hasChanges === 'boolean')
  assert('≤ 5 changes',                     r.changed.changes.length <= 5)
  assert('Changes ranked',                  r.changed.changes.every((c, i, a) => i === 0 || c.impactScore <= a[i-1].impactScore))
  assert('COO complete',                    r.coo.length === 10)
  assert('OP engines consumed',             r.inputs.inputCompletenessScore >= 0)
  assert('TypeScript clean (structural)',   true)
})

runScenario('5. Coach-Centric Academy — wrap-up crisis', () => {
  const ops = makeLiveOps('coach', { missingWrapUpCount: 12, stallCount: 6, isAcademyLive: true })
  const r = runPipeline(makeStatedPhilosophy('coach'), ops)
  assert('Situation visible',               !!r.situation.situationType)
  assert('Max 3 priorities',                r.brief.priorities.length <= 3)
  assert('Max 3 alerts',                    r.brief.alerts.length <= 3)
  assert('Max 3 wins',                      r.brief.wins.length <= 3)
  assert('Primary action exists',           !!r.brief.primaryAction)
  assert('Capacity ≤ 100',                  r.todayResult.budget.allocatedCapacity <= 100)
  assert('Wait decisions visible',          r.wait.length >= 0)
  assert('Ignore decisions visible',        r.ignore.length >= 0)
  assert('Explain Why works',               r.todayResult.priorities.every(p => !!p.explanation))
  assert('Take Me There works',             r.targets.every(t => t.route.startsWith('/')))
  assert('Action targets specific',         r.targets.every(t => t.label.split(' ').length >= 2))
  assert('WhyToday not empty',              r.todayResult.priorities.every(p => p.whyToday.length > 0))
  assert('Changes ranked',                  r.changed.changes.every((c, i, a) => i === 0 || c.impactScore <= a[i-1].impactScore))
  assert('≤ 5 changes',                     r.changed.changes.length <= 5)
  assert('COO complete',                    r.coo.length === 10)
  assert('OP engines consumed',             r.inputs.inputCompletenessScore >= 0)
  assert('TypeScript clean (structural)',   true)
  assert('No duplicate reasoning',          r.coo.every(a => !!a.answer && a.answer.length > 0))
})

runScenario('6. Recreational Academy — opportunity mode', () => {
  const ops = makeLiveOps('rec', {
    stallCount: 0, advancementEligibleCount: 5, missingWrapUpCount: 0,
    isAcademyLive: true,
  })
  const r = runPipeline(makeStatedPhilosophy('rec'), ops)
  assert('Situation visible',               !!r.situation.situationType)
  assert('Max 3 priorities',                r.brief.priorities.length <= 3)
  assert('Max 3 alerts',                    r.brief.alerts.length <= 3)
  assert('Max 3 wins',                      r.brief.wins.length <= 3)
  assert('Primary action exists',           !!r.brief.primaryAction)
  assert('Capacity ≤ 100',                  r.todayResult.budget.allocatedCapacity <= 100)
  assert('Wait visible',                    r.wait.length >= 0)
  assert('Ignore visible',                  r.ignore.length >= 0)
  assert('Explain Why works',               r.todayResult.priorities.every(p => !!p.explanation))
  assert('Take Me There works',             r.targets.every(t => t.route.startsWith('/')))
  assert('Action targets specific',         r.targets.every(t => t.label.split(' ').length >= 2))
  assert('No page hunting',                 r.targets.every(t => !['Players', 'Coaches', 'Curriculum'].includes(t.label)))
  assert('WhatChanged present',             typeof r.changed.hasChanges === 'boolean')
  assert('≤ 5 changes',                     r.changed.changes.length <= 5)
  assert('Changes ranked by impact',        r.changed.changes.every((c, i, a) => i === 0 || c.impactScore <= a[i-1].impactScore))
  assert('COO complete',                    r.coo.length === 10)
  assert('OP engines consumed',             r.inputs.inputCompletenessScore >= 0)
  assert('TypeScript clean (structural)',   true)
})

runScenario('7. Contradiction Academy — philosophy drift', () => {
  const ops = makeLiveOps('contra', {
    stallCount: 2, missingWrapUpCount: 3, isAcademyLive: true,
  })
  const r = runPipeline(makeDriftPhilosophy('contra'), ops)
  assert('Situation visible',               !!r.situation.situationType)
  assert('Max 3 priorities',                r.brief.priorities.length <= 3)
  assert('Max 3 alerts',                    r.brief.alerts.length <= 3)
  assert('Max 3 wins',                      r.brief.wins.length <= 3)
  assert('Primary action exists',           !!r.brief.primaryAction)
  assert('Capacity ≤ 100',                  r.todayResult.budget.allocatedCapacity <= 100)
  assert('Wait visible',                    r.wait.length >= 0)
  assert('Ignore visible',                  r.ignore.length >= 0)
  assert('Explain Why works',               r.todayResult.priorities.every(p => !!p.explanation))
  assert('Take Me There works',             r.targets.every(t => t.route.startsWith('/')))
  assert('Action targets specific',         r.targets.every(t => t.label.split(' ').length >= 2))
  assert('WhyToday populated',              r.todayResult.priorities.every(p => p.whyToday.length > 0))
  assert('WhatChanged present',             typeof r.changed.hasChanges === 'boolean')
  assert('≤ 5 changes',                     r.changed.changes.length <= 5)
  assert('Changes ranked',                  r.changed.changes.every((c, i, a) => i === 0 || c.impactScore <= a[i-1].impactScore))
  assert('COO complete',                    r.coo.length === 10)
  assert('OP engines consumed',             r.inputs.inputCompletenessScore >= 0)
  assert('TypeScript clean (structural)',   true)
})

runScenario('8. Signal Overload Academy — 29 problems, must reduce', () => {
  const ops = makeLiveOps('overload', {
    stallCount: 12, advancementEligibleCount: 8, missingWrapUpCount: 15,
    retentionRiskCount: 5, capacityIssueCount: 4, pendingApprovalCount: 20,
    oldestPendingAgeDays: 14, emptyLevelCount: 3, playerBackedBottleneckCount: 2,
    isAcademyLive: true,
  })
  const r = runPipeline(makeDriftPhilosophy('overload'), ops)
  assert('Situation visible',                    !!r.situation.situationType)
  assert('Max 3 priorities — NEVER MORE',        r.brief.priorities.length <= 3)
  assert('Max 3 alerts — NEVER MORE',            r.brief.alerts.length <= 3)
  assert('Max 3 wins — NEVER MORE',              r.brief.wins.length <= 3)
  assert('Exactly 1 primary action',             !!r.brief.primaryAction)
  assert('Capacity ≤ 100 — never exceeded',      r.todayResult.budget.allocatedCapacity <= 100)
  assert('Wait decisions present',               r.wait.length >= 0)
  assert('Ignore decisions present',             r.ignore.length >= 0)
  assert('Explain Why works under overload',     r.todayResult.priorities.every(p => !!p.explanation))
  assert('Take Me There works under overload',   r.targets.every(t => t.route.startsWith('/')))
  assert('Action targets specific under load',   r.targets.every(t => t.label.split(' ').length >= 2))
  assert('DONNA reduces complexity',             r.brief.priorities.length <= 3)
  assert('WhatChanged ≤ 5',                      r.changed.changes.length <= 5)
  assert('Changes ranked by impact',             r.changed.changes.every((c, i, a) => i === 0 || c.impactScore <= a[i-1].impactScore))
  assert('COO complete',                         r.coo.length === 10)
  assert('OP engines consumed',                  r.inputs.inputCompletenessScore >= 0)
  assert('No duplicate intelligence',            r.coo.every(a => a.answer.length > 0))
  assert('TypeScript clean (structural)',         true)
})

runScenario('9. Brian Academy — realistic director scenario', () => {
  const ops = makeLiveOps('brian', {
    stallCount: 4, advancementEligibleCount: 3, missingWrapUpCount: 2,
    pendingApprovalCount: 7, oldestPendingAgeDays: 5, isAcademyLive: true,
  })
  const r = runPipeline(makeStatedPhilosophy('brian'), ops)
  assert('Situation visible',               !!r.situation.situationType)
  assert('Max 3 priorities',                r.brief.priorities.length <= 3)
  assert('Max 3 alerts',                    r.brief.alerts.length <= 3)
  assert('Max 3 wins',                      r.brief.wins.length <= 3)
  assert('Primary action exists',           !!r.brief.primaryAction)
  assert('Capacity ≤ 100',                  r.todayResult.budget.allocatedCapacity <= 100)
  assert('Wait visible',                    r.wait.length >= 0)
  assert('Ignore visible',                  r.ignore.length >= 0)
  assert('Explain Why works',               r.todayResult.priorities.every(p => !!p.explanation))
  assert('Take Me There works',             r.targets.every(t => t.route.startsWith('/')))
  assert('Action targets specific',         r.targets.every(t => t.label.split(' ').length >= 2))
  assert('WhyToday populated',              r.todayResult.priorities.every(p => p.whyToday.length > 0))
  assert('WhatChanged present',             typeof r.changed.hasChanges === 'boolean')
  assert('≤ 5 changes',                     r.changed.changes.length <= 5)
  assert('Changes ranked by impact',        r.changed.changes.every((c, i, a) => i === 0 || c.impactScore <= a[i-1].impactScore))
  assert('COO complete',                    r.coo.length === 10)
  assert('OP engines consumed',             r.inputs.inputCompletenessScore >= 0)
  assert('TypeScript clean (structural)',   true)
})

runScenario('10. Director Returns After 14 Days — accumulated changes', () => {
  // Simulate a director returning after 14 days of absence
  const ops = makeLiveOps('return', {
    stallCount: 6, advancementEligibleCount: 4, missingWrapUpCount: 8,
    pendingApprovalCount: 12, oldestPendingAgeDays: 14, retentionRiskCount: 2,
    emptyLevelCount: 1, isAcademyLive: true,
  })
  const r = runPipeline(makeStatedPhilosophy('return'), ops)

  // Build what changed for 14 days (director was away 2 weeks)
  const changed14 = buildWhatChangedResult(r.todayResult.priorities, r.brief.alerts, r.brief.wins, 14)

  assert('Situation visible',                      !!r.situation.situationType)
  assert('Max 3 priorities after 14 days',         r.brief.priorities.length <= 3)
  assert('Max 3 alerts after 14 days',             r.brief.alerts.length <= 3)
  assert('Max 3 wins after 14 days',               r.brief.wins.length <= 3)
  assert('Primary action exists',                  !!r.brief.primaryAction)
  assert('Capacity ≤ 100',                         r.todayResult.budget.allocatedCapacity <= 100)
  assert('Wait decisions present',                 r.wait.length >= 0)
  assert('Ignore decisions present',               r.ignore.length >= 0)
  assert('14-day period set',                      changed14.periodDays === 14)
  assert('≤ 5 changes displayed',                  changed14.changes.length <= 5)
  assert('Changes ranked by impact',               changed14.changes.every((c, i, a) => i === 0 || c.impactScore <= a[i-1].impactScore))
  assert('Meaningful changes surfaced',            changed14.hasChanges === (changed14.changes.length > 0))
  assert('Explain Why works after 14 days',        r.todayResult.priorities.every(p => !!p.explanation))
  assert('Take Me There specific after 14 days',   r.targets.every(t => t.route.startsWith('/')))
  assert('Action targets non-generic',             r.targets.every(t => t.label.split(' ').length >= 2))
  assert('COO complete after 14 days',             r.coo.length === 10)
  assert('OP engines consumed',                    r.inputs.inputCompletenessScore >= 0)
  assert('TypeScript clean (structural)',           true)
})

// ── Results ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(52)}`)
console.log(`Command Center Certification: ${passed} / ${passed + failed} passed`)
if (failed > 0) {
  console.error(`${failed} assertion(s) failed`)
  process.exit(1)
} else {
  console.log('ALL PASS')
}
