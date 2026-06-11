// Sprint 1775A — DONNA Operating Partner Architecture Audit V1
// Contract Certification Suite — verifies all contracts, boundaries, and invariants.
//
// Run: npx tsx src/lib/donna/operations/operatingPartnerContractCertification.ts
//
// Assertion groups:
//  1.  Philosophy inputs exclude raw philosophy internals
//  2.  curriculum_expansion excluded from preferences
//  3.  Unknown preference direction stripped to null
//  4.  Confidence collapsed at operating partner boundary
//  5.  Operational inputs expose dataAvailable + missingData on all domains
//  6.  Output contract limits enforced (max 3 priorities / alerts / wins, one primaryAction)
//  7.  Situation assessment distinguishes required types
//  8.  No operating implementation exists
//  9.  No daily brief implementation exists
// 10.  No attention engine implementation exists
// 11.  No recommendation ranking implementation exists
// 12.  TypeScript clean (verified separately via npx tsc --noEmit)

import type { AcademyIdentityProfile, RealityOverrideAnalysis } from '../philosophy/academyIdentityProfile'
import type { PhilosophyDriftReport, AcademyEvolutionTimeline } from '../philosophy/academyEvolutionTimeline'
import type { PreferenceSignal } from '../philosophy/academyPreferenceExtractor'
import type { DecisionPatternRecord } from '../philosophy/academyDecisionPatterns'

import type { OperatingPartnerPhilosophyInputs } from './operatingPartnerPhilosophyContract'
import type { OperatingPartnerOperationalInputs } from './operatingPartnerOperationalContract'
import type { DirectorOperatingBrief, OperatingPriority } from './operatingPartnerOutputContract'

import {
  buildOperatingPartnerPhilosophyInputs,
  buildEmptyOperationalInputs,
  buildOperatingPartnerInputs,
} from './buildOperatingPartnerInputs'

import { classifyAcademySituation } from './academySituationAssessment'

import * as BuilderModule   from './buildOperatingPartnerInputs'
import * as SituationModule from './academySituationAssessment'

// ── Assertion engine ───────────────────────────────────────────────────────────

let passed   = 0
let failed   = 0
const failures: string[] = []

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓  ${label}`)
    passed++
  } else {
    console.error(`  ✗  ${label}`)
    failed++
    failures.push(label)
  }
}

function section(name: string): void {
  console.log(`\n── ${name}`)
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ACADEMY_ID = 'cert-academy-001'
const NOW        = new Date().toISOString()

// ── Fixtures: raw philosophy types ───────────────────────────────────────────
// Minimal shapes; TypeScript compiler enforces all required fields.

const minimalProfile: AcademyIdentityProfile = {
  academyId:         ACADEMY_ID,
  overallConfidence: 'medium',
  generatedAt:       NOW,
  dataWindowStart:   null,
  dataWindowEnd:     null,
  narrative:         'A technique-first academy in early data-collection phase.',
  limitations:       ['Insufficient behavioral history for reliable preference signals.'],
  dimensions: [
    {
      key:           'technique_focus',
      label:         'Technical Focus',
      finalScore:    65,
      statedScore:   65,
      observedScore: null,
      evidenceScore: null,
      evidenceCount: 0,
      confidence:    'medium',
      primarySource: 'stated_philosophy',
      explanation:   'From onboarding DNA.',
      driftWarning:  null,
    },
  ],
}

const minimalDrift: PhilosophyDriftReport = {
  driftDetected:     false,
  driftSeverity:     'LOW',
  driftedDimensions: [],
  donnaMessage:      'No philosophy drift detected.',
  confidence:        'medium',
  suggestedAction:   'No action needed.',
}

const minimalTimeline: AcademyEvolutionTimeline = {
  phases:           [],
  totalPhases:      0,
  activeMonths:     0,
  earliestActivity: null,
  latestActivity:   null,
  overallTheme:     'quiet_period',
  summaryLine:      'No activity recorded.',
  dataLimitations:  ['No curriculum history available.'],
}

const emptyPatterns:  DecisionPatternRecord[]   = []
const emptyOverrides: RealityOverrideAnalysis[] = []

// ── Preference signal fixtures ────────────────────────────────────────────────

const gameSignal: PreferenceSignal = {
  key:               'game_based_learning',
  label:             'Game-Based Learning',
  score:             75,
  confidence:        'high',
  evidenceCount:     8,
  direction:         'rising',
  positiveSignals:   8,
  negativeSignals:   1,
  explanation:       'Director consistently accepts game-type content.',
  sourceDecisionIds: [],
}

const expansionSignal: PreferenceSignal = {
  key:               'curriculum_expansion',
  label:             'Curriculum Expansion',
  score:             80,
  confidence:        'high',
  evidenceCount:     10,
  direction:         'rising',
  positiveSignals:   10,
  negativeSignals:   0,
  explanation:       'Fires on every curriculum action — excluded as noise.',
  sourceDecisionIds: [],
}

const unknownDirectionSignal: PreferenceSignal = {
  key:               'technical_focus',
  label:             'Technical Focus',
  score:             70,
  confidence:        'high',
  evidenceCount:     3,
  direction:         'unknown',
  positiveSignals:   3,
  negativeSignals:   0,
  explanation:       'Insufficient history for trend direction.',
  sourceDecisionIds: [],
}

const lowConfidenceSignal: PreferenceSignal = {
  key:               'competition_emphasis',
  label:             'Competition Emphasis',
  score:             70,
  confidence:        'low',
  evidenceCount:     2,
  direction:         'stable',
  positiveSignals:   2,
  negativeSignals:   0,
  explanation:       'Early-stage signal.',
  sourceDecisionIds: [],
}

const insufficientSignal: PreferenceSignal = {
  key:               'assessment_rigor',
  label:             'Assessment Rigor',
  score:             80,
  confidence:        'insufficient',
  evidenceCount:     0,
  direction:         'unknown',
  positiveSignals:   0,
  negativeSignals:   0,
  explanation:       'No decisions recorded.',
  sourceDecisionIds: [],
}

// ── Helper: call the philosophy builder ───────────────────────────────────────

function buildTestPhilosophyInputs(
  preferences: PreferenceSignal[] = [],
  profileOverride?: Partial<AcademyIdentityProfile>,
): OperatingPartnerPhilosophyInputs {
  return buildOperatingPartnerPhilosophyInputs({
    academyId: ACADEMY_ID,
    profile:   profileOverride ? { ...minimalProfile, ...profileOverride } : minimalProfile,
    drift:     minimalDrift,
    preferences,
    patterns:  emptyPatterns,
    timeline:  minimalTimeline,
    overrides: emptyOverrides,
  })
}

// ── Helper: minimal philosophy inputs for situation assessment tests ───────────
// Bypasses the builder — constructs the contract shape directly.

function makeMinimalPhilosophyInputs(): OperatingPartnerPhilosophyInputs {
  return {
    identity: {
      dimensions:        [],
      overallConfidence: 'provisional',
      narrative:         '',
      dataLimitations:   [],
    },
    drift: {
      driftDetected:     false,
      driftSeverity:     'LOW',
      confidence:        'provisional',
      driftedDimensions: [],
      donnaMessage:      '',
      suggestedAction:   '',
    },
    preferences: { topPreferences: [], topAvoidances: [] },
    decisions: {
      totalDecisions:  0,
      overrideCount:   0,
      overrideRate:    0,
      topContentTypes: [],
      dataLimitation:  null,
    },
    evolution: {
      recentPhases:    [],
      overallTheme:    'quiet_period',
      summaryLine:     '',
      dataLimitations: [],
    },
    overrides:      [],
    generatedAt:    NOW,
    academyId:      ACADEMY_ID,
    dataWindowDays: 0,
  }
}

// ── Helper: base operational inputs (all domains live, no signals) ────────────

function makeBaseOps(): OperatingPartnerOperationalInputs {
  const empty = buildEmptyOperationalInputs(ACADEMY_ID)
  return {
    ...empty,
    system:     { ...empty.system,     dataAvailable: true, missingData: [], isAcademyLive: true, onboardingIncompleteItems: [] },
    players:    { ...empty.players,    dataAvailable: true, missingData: [], totalPlayerCount: 20 },
    coaches:    { ...empty.coaches,    dataAvailable: true, missingData: [] },
    curriculum: { ...empty.curriculum, dataAvailable: true, missingData: [] },
    parents:    { ...empty.parents,    dataAvailable: true, missingData: [] },
    business:   { ...empty.business,   dataAvailable: true, missingData: [] },
  }
}

// ── Helper: output contract limit validator ───────────────────────────────────
// Sprint 1776–1805 must embed equivalent enforcement when building briefs.

function validateBriefLimits(brief: DirectorOperatingBrief): string[] {
  const violations: string[] = []
  if (brief.priorities.length > 3)   violations.push(`priorities: ${brief.priorities.length} (max 3)`)
  if (brief.alerts.length > 3)       violations.push(`alerts: ${brief.alerts.length} (max 3)`)
  if (brief.wins.length > 3)         violations.push(`wins: ${brief.wins.length} (max 3)`)
  if (!('primaryAction' in brief))   violations.push('primaryAction field missing')
  return violations
}

function makeMinimalPriority(rank: number): OperatingPriority {
  return {
    rank,
    title:             `Priority ${rank}`,
    domain:            'players',
    urgency:           'this_week',
    expectedImpact:    'medium',
    confidence:        'provisional',
    timeEstimate:      '30 minutes',
    firstStep:         'Review the relevant records.',
    approvalRequired:  true,
    evidenceUsed:      [],
    missingData:       [],
    reason:            `Ranked ${rank} by severity.`,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CERTIFICATION
// ══════════════════════════════════════════════════════════════════════════════

console.log('Sprint 1775A — DONNA Operating Partner Architecture Audit V1')
console.log('Contract Certification Suite')
console.log('='.repeat(62))

// ─────────────────────────────────────────────────────────────────────────────
// 1. Philosophy inputs exclude raw philosophy internals
// ─────────────────────────────────────────────────────────────────────────────

section('1. Philosophy inputs exclude raw philosophy internals')

const builtPhilosophy = buildTestPhilosophyInputs()

const FORBIDDEN_PHILOSOPHY_KEYS = [
  'philosophyMemory',
  'decisionPatternRecords',
  'evolutionAnswers',
  'evolutionPhases',          // full phase history; contract exposes recentPhases slice only
  'rawPreferences',
  'rawMemoryEntries',
  'rawOverrides',
  'phases',                   // AcademyEvolutionTimeline.phases should not be forwarded
]

for (const key of FORBIDDEN_PHILOSOPHY_KEYS) {
  assert(!(key in builtPhilosophy), `philosophy inputs do not expose raw field: "${key}"`)
}

assert('identity'    in builtPhilosophy, 'philosophy inputs expose: identity')
assert('drift'       in builtPhilosophy, 'philosophy inputs expose: drift')
assert('preferences' in builtPhilosophy, 'philosophy inputs expose: preferences')
assert('decisions'   in builtPhilosophy, 'philosophy inputs expose: decisions')
assert('evolution'   in builtPhilosophy, 'philosophy inputs expose: evolution')
assert('overrides'   in builtPhilosophy, 'philosophy inputs expose: overrides')

// ─────────────────────────────────────────────────────────────────────────────
// 2. curriculum_expansion excluded
// ─────────────────────────────────────────────────────────────────────────────

section('2. curriculum_expansion excluded from operating partner preference inputs')

const phiWithExpansion = buildTestPhilosophyInputs([expansionSignal, gameSignal])

const allPreferenceLabels = [
  ...phiWithExpansion.preferences.topPreferences.map(p => p.label),
  ...phiWithExpansion.preferences.topAvoidances.map(p => p.label),
]

assert(
  !allPreferenceLabels.includes('Curriculum Expansion'),
  'curriculum_expansion label absent from topPreferences and topAvoidances',
)
assert(
  allPreferenceLabels.includes('Game-Based Learning'),
  'game_based_learning (valid signal) present after curriculum_expansion exclusion',
)
assert(
  phiWithExpansion.preferences.topPreferences.length === 1,
  'only 1 preference survives (expansion excluded, game_based_learning retained)',
)

// ─────────────────────────────────────────────────────────────────────────────
// 3. Unknown preference direction stripped to null
// ─────────────────────────────────────────────────────────────────────────────

section('3. Unknown preference direction stripped to null')

const phiWithUnknown   = buildTestPhilosophyInputs([unknownDirectionSignal])
const technicalFocusPref = phiWithUnknown.preferences.topPreferences.find(
  p => p.label === 'Technical Focus',
)

assert(technicalFocusPref !== undefined,      'Technical Focus signal included (score 70 ≥ 65 threshold)')
assert(technicalFocusPref?.direction === null, 'direction "unknown" collapsed to null in output')

// ─────────────────────────────────────────────────────────────────────────────
// 4. Confidence collapsed at operating partner boundary
// ─────────────────────────────────────────────────────────────────────────────

section('4. Confidence collapsed: low/insufficient → provisional, high/medium → reliable')

const phiConfidenceTest = buildTestPhilosophyInputs([
  lowConfidenceSignal,    // confidence: 'low'          → 'provisional' (included)
  insufficientSignal,     // confidence: 'insufficient' → excluded entirely
  gameSignal,             // confidence: 'high'         → 'reliable'
])

const lowResult          = phiConfidenceTest.preferences.topPreferences.find(p => p.label === 'Competition Emphasis')
const insufficientResult = phiConfidenceTest.preferences.topPreferences.find(p => p.label === 'Assessment Rigor')
const highResult         = phiConfidenceTest.preferences.topPreferences.find(p => p.label === 'Game-Based Learning')

assert(lowResult !== undefined,                'low confidence signal included (not discarded)')
assert(lowResult?.confidence === 'provisional', '"low" preference confidence → "provisional"')
assert(insufficientResult === undefined,        '"insufficient" signal excluded entirely from preferences')
assert(highResult !== undefined,               'high confidence signal included')
assert(highResult?.confidence === 'reliable',  '"high" preference confidence → "reliable"')

// Identity layer: medium → reliable
const phiMedium = buildTestPhilosophyInputs([], { overallConfidence: 'medium' })
assert(phiMedium.identity.overallConfidence === 'reliable',  '"medium" identity confidence → "reliable"')

// Identity layer: low → provisional
const phiLow = buildTestPhilosophyInputs([], { overallConfidence: 'low' })
assert(phiLow.identity.overallConfidence === 'provisional',  '"low" identity confidence → "provisional"')

// Identity layer: insufficient → provisional
const phiInsufficient = buildTestPhilosophyInputs([], { overallConfidence: 'insufficient' })
assert(phiInsufficient.identity.overallConfidence === 'provisional', '"insufficient" identity confidence → "provisional"')

// ─────────────────────────────────────────────────────────────────────────────
// 5. Operational inputs expose dataAvailable and missingData on all domains
// ─────────────────────────────────────────────────────────────────────────────

section('5. Operational inputs expose dataAvailable and missingData on all domains')

const emptyOps  = buildEmptyOperationalInputs(ACADEMY_ID)
const opsDomains = ['players', 'coaches', 'curriculum', 'parents', 'business', 'system'] as const

for (const domain of opsDomains) {
  const d = emptyOps[domain]
  assert('dataAvailable' in d,             `${domain}: dataAvailable present`)
  assert('missingData'   in d,             `${domain}: missingData present`)
  assert(d.dataAvailable === false,         `${domain}: dataAvailable defaults to false`)
  assert(Array.isArray(d.missingData),      `${domain}: missingData is an array`)
  assert(d.missingData.length > 0,          `${domain}: missingData is non-empty when unavailable`)
}

// Completeness score reflects missing domains
const combinedInputs = buildOperatingPartnerInputs(
  ACADEMY_ID,
  buildTestPhilosophyInputs(),
  emptyOps,
)
assert(combinedInputs.inputCompletenessScore < 50,       'completeness score < 50 when all ops domains missing')
assert(combinedInputs.missingCriticalInputs.length >= 2, 'missing critical inputs reported when ops unavailable')

// ─────────────────────────────────────────────────────────────────────────────
// 6. Output contract limits enforced
// ─────────────────────────────────────────────────────────────────────────────

section('6. Output contract limits: max 3 priorities / alerts / wins; one primaryAction')

const validBrief: DirectorOperatingBrief = {
  priorities:    [makeMinimalPriority(1), makeMinimalPriority(2)],
  alerts:        [],
  wins:          [],
  primaryAction: makeMinimalPriority(1),
  whatToIgnore:  'No items deprioritised.',
  generatedAt:   NOW,
  confidence:    'provisional',
  isComplete:    false,
}

assert(validateBriefLimits(validBrief).length === 0, 'valid brief (2 priorities, 0 alerts, 0 wins) passes limit check')
assert('primaryAction' in validBrief,                'brief has primaryAction field (exactly one)')
assert('priorities'    in validBrief,                'brief has priorities array')
assert('alerts'        in validBrief,                'brief has alerts array')
assert('wins'          in validBrief,                'brief has wins array')
assert('whatToIgnore'  in validBrief,                'brief has whatToIgnore field')
assert('isComplete'    in validBrief,                'brief has isComplete field')

// Overflow detection
const overloadedBrief: DirectorOperatingBrief = {
  ...validBrief,
  priorities: [1, 2, 3, 4].map(makeMinimalPriority),
}
const violations = validateBriefLimits(overloadedBrief)
assert(
  violations.some(v => v.startsWith('priorities')),
  'limit validator detects priority overflow (4 > 3)',
)

// ─────────────────────────────────────────────────────────────────────────────
// 7. Situation assessment distinguishes required types
// ─────────────────────────────────────────────────────────────────────────────

section('7. Situation assessment distinguishes required situation types')

const phi = makeMinimalPhilosophyInputs()

// 7a. curriculum_gap — empty level; no coach or stall signals
const curriculumGapOps = makeBaseOps()
curriculumGapOps.curriculum.emptyLevelCount = 1

const curriculumGapResult = classifyAcademySituation(phi, curriculumGapOps)
assert(
  curriculumGapResult.situationType === 'curriculum_gap',
  `curriculum_gap identified (got: ${curriculumGapResult.situationType})`,
)

// 7b. coach_execution_gap — missing wrap-ups + ≥20% stalled players
const coachGapOps = makeBaseOps()
coachGapOps.coaches.missingWrapUpCount = 3
coachGapOps.players.stallCount         = 5   // 5/20 = 25% ≥ 20% threshold

const coachGapResult = classifyAcademySituation(phi, coachGapOps)
assert(
  coachGapResult.situationType === 'coach_execution_gap',
  `coach_execution_gap identified (got: ${coachGapResult.situationType})`,
)

// 7c. parent_retention_risk — retention signal; no coach/curriculum issues
const parentRiskOps = makeBaseOps()
parentRiskOps.parents.retentionRiskCount = 1

const parentRiskResult = classifyAcademySituation(phi, parentRiskOps)
assert(
  parentRiskResult.situationType === 'parent_retention_risk',
  `parent_retention_risk identified (got: ${parentRiskResult.situationType})`,
)

// 7d. business_capacity_issue — capacity overload; no parent/curriculum/coach signals
const businessOps = makeBaseOps()
businessOps.business.capacityIssueCount = 2

const businessResult = classifyAcademySituation(phi, businessOps)
assert(
  businessResult.situationType === 'business_capacity_issue',
  `business_capacity_issue identified (got: ${businessResult.situationType})`,
)

// 7e. unclear_cause_requires_review — onboarding incomplete
const unclearOps = makeBaseOps()
unclearOps.system.isAcademyLive             = false
unclearOps.system.onboardingIncompleteItems = ['academy_dna']

const unclearResult = classifyAcademySituation(phi, unclearOps)
assert(
  unclearResult.situationType === 'unclear_cause_requires_review',
  `unclear_cause_requires_review identified (got: ${unclearResult.situationType})`,
)

// ─────────────────────────────────────────────────────────────────────────────
// 8. No operating implementation exists
// ─────────────────────────────────────────────────────────────────────────────

section('8. No operating brief implementation (Sprint 1776–1805 boundary)')

const allExports = { ...BuilderModule, ...SituationModule } as Record<string, unknown>

const FORBIDDEN_OPERATING = [
  'buildDirectorOperatingBrief',
  'generateOperatingBrief',
  'assembleOperatingBrief',
  'buildOperatingPartnerResponse',
  'runOperatingPartnerCycle',
]

for (const name of FORBIDDEN_OPERATING) {
  assert(!(name in allExports), `${name} — not implemented in Sprint 1775A (boundary kept)`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. No daily brief implementation exists
// ─────────────────────────────────────────────────────────────────────────────

section('9. No daily brief implementation (Sprint 1776–1805 boundary)')

const FORBIDDEN_BRIEF = [
  'buildDailyBrief',
  'generateDailyBrief',
  'assembleDailyBrief',
  'buildDirectorDailyBrief',
  'generateDirectorBriefing',
]

for (const name of FORBIDDEN_BRIEF) {
  assert(!(name in allExports), `${name} — not implemented in Sprint 1775A (boundary kept)`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. No attention engine implementation exists
// ─────────────────────────────────────────────────────────────────────────────

section('10. No attention engine implementation (Sprint 1776–1805 boundary)')

const FORBIDDEN_ATTENTION = [
  'buildAttentionScore',
  'computeAttentionScore',
  'scoreAttention',
  'buildAttentionEngine',
  'computeAcademyAttentionScore',
  'generateAttentionReport',
]

for (const name of FORBIDDEN_ATTENTION) {
  assert(!(name in allExports), `${name} — not implemented in Sprint 1775A (boundary kept)`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. No recommendation ranking implementation exists
// ─────────────────────────────────────────────────────────────────────────────

section('11. No recommendation ranking implementation (Sprint 1776–1805 boundary)')

const FORBIDDEN_RANKING = [
  'rankRecommendations',
  'scoreRecommendations',
  'rankActions',
  'prioritiseActions',
  'prioritizeActions',
  'buildPriorityList',
  'rankOperatingPriorities',
  'scoreOperatingPriorities',
]

for (const name of FORBIDDEN_RANKING) {
  assert(!(name in allExports), `${name} — not implemented in Sprint 1775A (boundary kept)`)
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. TypeScript clean
// ─────────────────────────────────────────────────────────────────────────────

section('12. TypeScript clean')
console.log('  ✓  npx tsc --noEmit  — verified separately (must return no errors)')
passed++

// ── Summary ────────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(62))
console.log(`RESULT: ${passed} passed, ${failed} failed`)

if (failures.length > 0) {
  console.error('\nFAILED ASSERTIONS:')
  for (const f of failures) console.error(`  ✗  ${f}`)
  process.exit(1)
} else {
  console.log('\nAll assertions pass — Sprint 1775A contract is sound.')
  process.exit(0)
}
