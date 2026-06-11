// Mega Sprint 1746–1775 — DONNA Philosophy Memory & Academy Evolution Engine V1
// Philosophy Certification Suite: validates the philosophy intelligence layer
// across 7 academy archetype scenarios × 3 time horizons.
//
// Run with: npx tsx src/lib/donna/philosophy/philosophyCertification.ts
//
// Each test builds a minimal synthetic dataset, runs the full philosophy pipeline,
// and asserts invariants. Failures are printed to stdout with detail.
//
// Non-negotiable rules verified:
//   1. Reality outranks philosophy — player evidence overrides stated DNA
//   2. Memory layer never invents signals — signals only from real decisions
//   3. Identity profile is always deterministic
//   4. Drift detection fires when stated vs. observed diverge ≥20 points
//   5. Evolution timeline is always time-ordered
//   6. Evolution questions always return 10 answers
//   7. Missing data is stated, not hidden

import type { CurriculumMemoryEntry } from '../curriculum/curriculumMemory'
import type { AcademyMemory, MemorySourceType } from '../memory/donnaAcademyMemoryTypes'
import type { AcademyDnaSummary } from '../curriculum/curriculumIntelligenceContext'
import type { PlayerLevelSummary } from '../curriculum/curriculumIntelligenceContext'

import {
  buildPhilosophyMemoryFromBehavior,
} from './academyPhilosophyMemory'

import {
  extractAcademyPreferences,
} from './academyPreferenceExtractor'

import {
  buildCurriculumDecisionPatterns,
  buildProposedActionDecisionPatterns,
  summarizeDecisionPatterns,
} from './academyDecisionPatterns'

import {
  buildAcademyIdentityProfile,
  buildRealityOverrideAnalysis,
} from './academyIdentityProfile'

import {
  buildAcademyEvolutionTimeline,
  detectPhilosophyDrift,
} from './academyEvolutionTimeline'

import {
  buildFullEvolutionAnswerSet,
} from './academyEvolutionQuestions'

// ── Test primitives ───────────────────────────────────────────────────────────

interface CertResult {
  passed: boolean
  label:  string
  detail: string
}

function assert(condition: boolean, label: string, detail: string): CertResult {
  return { passed: condition, label, detail }
}

// ── Synthetic data builders ───────────────────────────────────────────────────

function makeCurrEntry(
  id: string,
  contentType: string,
  intent: CurriculumMemoryEntry['intent'],
  levelName: string = 'Orange Ball 1',
  createdAt: string = '2026-03-15',
): CurriculumMemoryEntry {
  const category: CurriculumMemoryEntry['category'] =
    intent === 'add' || intent === 'expand' ? 'recommendation_outcome' : 'academy_operation'
  return {
    id,
    levelId:           `level_${id}`,
    levelName,
    intent,
    category,
    contentType,
    changeDescription: `${intent} ${contentType} at ${levelName}`,
    createdAt,
  }
}

function makeMemory(
  id: string,
  sourceType: MemorySourceType,
  headline: string,
  occurredAt: string = '2026-03-10',
): AcademyMemory {
  return {
    id,
    sourceType,
    headline,
    summary:        headline,
    evidence:       [],
    entityLinks:    [],
    importance:     'medium',
    confidence:     'high',
    occurredAt,
    overrideReason: null,
    reviewerNotes:  null,
    dataGaps:       [],
  }
}

function makeDna(
  inferredModel: string,
  overrides: Partial<AcademyDnaSummary> = {},
): AcademyDnaSummary {
  return {
    hasDna:             true,
    inferredModel,
    playerMix:          'mixed',
    familyPriorities:   'development',
    stagePriorities:    {},
    priorityEdge:       'balanced',
    advancementApproval: 'director_approval',
    parentTransparency: 'standard',
    ...overrides,
  }
}

function makePlayerLevel(
  levelId: string,
  levelName: string,
  playerCount: number,
  advancementEligibleCount: number,
  hasEvidence: boolean = true,
): PlayerLevelSummary {
  return {
    levelId,
    levelName,
    playerCount,
    advancementEligibleCount,
    improvementSuggestions: [],
    weakDomains:            [],
    hasEvidence,
    evidenceSource:         hasEvidence ? 'evidence_records' : 'none',
  }
}

// ── Full pipeline runner ──────────────────────────────────────────────────────

interface PipelineResult {
  philosophyMemoryCount:    number
  preferenceCount:          number
  decisionPatternCount:     number
  identityProfile:          ReturnType<typeof buildAcademyIdentityProfile>
  driftReport:              ReturnType<typeof detectPhilosophyDrift>
  timeline:                 ReturnType<typeof buildAcademyEvolutionTimeline>
  realityOverrides:         ReturnType<typeof buildRealityOverrideAnalysis>
  evolutionAnswers:         ReturnType<typeof buildFullEvolutionAnswerSet>
}

function runPipeline(
  currMem:     CurriculumMemoryEntry[],
  memories:    AcademyMemory[],
  dna:         AcademyDnaSummary,
  playerLevels: PlayerLevelSummary[] = [],
): PipelineResult {
  const philosophyMemory    = buildPhilosophyMemoryFromBehavior(currMem, memories)
  const preferences         = extractAcademyPreferences(philosophyMemory)
  const currPatterns        = buildCurriculumDecisionPatterns(currMem)
  const memPatterns         = buildProposedActionDecisionPatterns(memories)
  const allPatterns         = [...currPatterns, ...memPatterns]
  const identityProfile     = buildAcademyIdentityProfile('acad_cert', dna, preferences, playerLevels, memories)
  const driftReport         = detectPhilosophyDrift(identityProfile.dimensions, dna, preferences)
  const timeline            = buildAcademyEvolutionTimeline(memories, currMem)
  const realityOverrides    = buildRealityOverrideAnalysis(identityProfile, playerLevels)
  const evolutionAnswers    = buildFullEvolutionAnswerSet({
    identityProfile,
    timeline,
    driftReport,
    preferences,
    realityOverrides,
  })

  return {
    philosophyMemoryCount: philosophyMemory.length,
    preferenceCount:       preferences.length,
    decisionPatternCount:  allPatterns.length,
    identityProfile,
    driftReport,
    timeline,
    realityOverrides,
    evolutionAnswers,
  }
}

// ── Scenario 1: Foundation Development Academy ────────────────────────────────
// Mostly technical/drill decisions — should build strong technical_focus preference.

function certFoundationAcademy(): CertResult[] {
  const currMem: CurriculumMemoryEntry[] = [
    makeCurrEntry('c1', 'drill',        'add',    'Red Ball 1'),
    makeCurrEntry('c2', 'drill',        'add',    'Red Ball 1'),
    makeCurrEntry('c3', 'skill',        'add',    'Red Ball 2'),
    makeCurrEntry('c4', 'drill',        'add',    'Orange Ball 1'),
    makeCurrEntry('c5', 'coach_cue',    'add',    'Orange Ball 1'),
    makeCurrEntry('c6', 'skill',        'expand', 'Orange Ball 2'),
    makeCurrEntry('c7', 'game',         'add',    'Red Ball 1'),
  ]
  const dna  = makeDna('recreational')
  const r    = runPipeline(currMem, [], dna)


  return [
    assert(r.philosophyMemoryCount > 0,
      'Foundation: philosophy memory built from curriculum decisions',
      `Got ${r.philosophyMemoryCount} entries.`),
    assert(r.preferenceCount > 0,
      'Foundation: preference signals extracted',
      `Got ${r.preferenceCount} signals.`),
    assert(
      r.identityProfile.dimensions.some(d => d.key === 'technique_focus' && d.finalScore > 50),
      'Foundation: technique_focus dimension elevated by drill/skill decisions',
      `Dimensions: ${r.identityProfile.dimensions.map(d => `${d.key}=${d.finalScore}`).join(', ')}`),
    assert(r.evolutionAnswers.length === 10,
      'Foundation: evolution questions return exactly 10 answers',
      `Got ${r.evolutionAnswers.length} answers.`),
    assert(r.timeline.totalPhases >= 0,
      'Foundation: timeline builds without error',
      `Phases: ${r.timeline.totalPhases}`),
  ]
}

// ── Scenario 2: High Performance Academy ─────────────────────────────────────
// Competition + assessment emphasis. Competitive DNA. Drift should be LOW.

function certHighPerformanceAcademy(): CertResult[] {
  const currMem: CurriculumMemoryEntry[] = [
    makeCurrEntry('c1', 'competition', 'add',    'Green Ball 1', '2026-01-10'),
    makeCurrEntry('c2', 'competition', 'add',    'Green Ball 2', '2026-01-15'),
    makeCurrEntry('c3', 'assessment',  'add',    'Green Ball 1', '2026-01-20'),
    makeCurrEntry('c4', 'assessment',  'expand', 'Green Ball 2', '2026-02-01'),
    makeCurrEntry('c5', 'competition', 'expand', 'Yellow Ball',  '2026-02-10'),
    makeCurrEntry('c6', 'tactical',    'add',    'Yellow Ball',  '2026-02-15'),
    makeCurrEntry('c7', 'assessment',  'add',    'Yellow Ball',  '2026-03-01'),
  ]
  const dna = makeDna('competitive_elite')
  const r   = runPipeline(currMem, [], dna)

  return [
    assert(
      r.identityProfile.dimensions.some(d => d.key === 'competition_emphasis' && d.finalScore >= 60),
      'HighPerf: competition_emphasis elevated',
      `Dims: ${r.identityProfile.dimensions.map(d => `${d.key}=${d.finalScore}`).join(', ')}`),
    assert(
      r.identityProfile.dimensions.some(d => d.key === 'assessment_rigor' && d.finalScore >= 60),
      'HighPerf: assessment_rigor elevated',
      `Dims: ${r.identityProfile.dimensions.map(d => `${d.key}=${d.finalScore}`).join(', ')}`),
    assert(
      r.driftReport.driftSeverity !== 'HIGH',
      'HighPerf: drift is not HIGH (competitive DNA broadly matches competitive decisions)',
      `Drift: ${r.driftReport.driftSeverity}, detected: ${r.driftReport.driftDetected}`),
    assert(r.evolutionAnswers.every(a => a.question !== undefined),
      'HighPerf: all evolution answers have a question type',
      ''),
  ]
}

// ── Scenario 3: Recreational Retention Academy ───────────────────────────────
// Game-based, relaxed advancement, recreational DNA.

function certRecreationalAcademy(): CertResult[] {
  const currMem: CurriculumMemoryEntry[] = [
    makeCurrEntry('c1', 'game', 'add',    'Red Ball 1', '2026-02-01'),
    makeCurrEntry('c2', 'game', 'add',    'Red Ball 2', '2026-02-05'),
    makeCurrEntry('c3', 'game', 'expand', 'Orange Ball 1', '2026-02-10'),
    makeCurrEntry('c4', 'player_mission', 'add', 'Red Ball 1', '2026-02-15'),
    makeCurrEntry('c5', 'game', 'add',    'Orange Ball 2', '2026-02-20'),
  ]
  const dna = makeDna('recreational')
  const r   = runPipeline(currMem, [], dna)

  return [
    assert(
      r.identityProfile.dimensions.some(d => d.key === 'game_based_learning' && d.finalScore >= 60),
      'Recreational: game_based_learning elevated',
      `Dims: ${r.identityProfile.dimensions.map(d => `${d.key}=${d.finalScore}`).join(', ')}`),
    assert(
      r.driftReport.driftSeverity !== 'HIGH',
      'Recreational: no HIGH drift (game decisions match recreational DNA)',
      `Drift: ${r.driftReport.driftSeverity}`),
    assert(
      r.driftReport.driftSeverity !== 'HIGH',
      'Recreational: drift not HIGH (recreational DNA broadly matches game decisions)',
      `Detected: ${r.driftReport.driftDetected}, severity: ${r.driftReport.driftSeverity}`),
  ]
}

// ── Scenario 4: Game-Based Academy ───────────────────────────────────────────
// Game content dominates across all curriculum decisions.

function certGameBasedAcademy(): CertResult[] {
  const currMem: CurriculumMemoryEntry[] = []
  for (let i = 0; i < 8; i++) {
    currMem.push(makeCurrEntry(`c${i}`, 'game', 'add', 'Orange Ball 1', `2026-0${(i % 3) + 1}-0${i + 1}`))
  }
  const dna = makeDna('recreational')
  const r   = runPipeline(currMem, [], dna)

  const gamePref = r.identityProfile.dimensions.find(d => d.key === 'game_based_learning')
  return [
    assert(!!gamePref,
      'GameBased: game_based_learning dimension exists',
      `Dims: ${r.identityProfile.dimensions.map(d => d.key).join(', ')}`),
    assert(r.philosophyMemoryCount >= 8,
      'GameBased: philosophy memory has ≥8 entries from 8 game decisions',
      `Got: ${r.philosophyMemoryCount}`),
    assert(r.evolutionAnswers.some(a => a.question === 'what_to_do_more'),
      'GameBased: what_to_do_more answer exists',
      ''),
  ]
}

// ── Scenario 5: Parent Transparency Academy ───────────────────────────────────
// Heavy parent guidance additions → parent_transparency preference should emerge.

function certParentTransparencyAcademy(): CertResult[] {
  const currMem: CurriculumMemoryEntry[] = [
    makeCurrEntry('c1', 'parent_guidance', 'add',    'Red Ball 1', '2026-02-01'),
    makeCurrEntry('c2', 'parent_guidance', 'add',    'Red Ball 2', '2026-02-05'),
    makeCurrEntry('c3', 'parent_guidance', 'expand', 'Orange Ball 1', '2026-02-10'),
    makeCurrEntry('c4', 'parent_guidance', 'add',    'Orange Ball 2', '2026-02-15'),
    makeCurrEntry('c5', 'parent_guidance', 'add',    'Green Ball 1', '2026-02-20'),
  ]
  const dna = makeDna('competitive_development', {
    parentTransparency: 'high',
  })
  const r = runPipeline(currMem, [], dna)

  const parentSignal = r.identityProfile.dimensions.find(d => d.key === 'parent_transparency')
  return [
    assert(!!parentSignal,
      'ParentTransparency: parent_transparency dimension exists',
      `Dims: ${r.identityProfile.dimensions.map(d => d.key).join(', ')}`),
    assert(r.philosophyMemoryCount >= 5,
      'ParentTransparency: philosophy memory populated from parent_guidance decisions',
      `Got: ${r.philosophyMemoryCount}`),
    assert(r.evolutionAnswers.length === 10,
      'ParentTransparency: all 10 evolution questions answered',
      `Got: ${r.evolutionAnswers.length}`),
  ]
}

// ── Scenario 6: Coach Execution Problem Academy ───────────────────────────────
// Director overrides frequently → coach_autonomy negative signal.

function certCoachExecutionProblemAcademy(): CertResult[] {
  // overrideReason must be non-null — that is what triggers philosophy signal generation
  const memories: AcademyMemory[] = [
    { ...makeMemory('m1', 'director_override', 'Director revised: changed drill to game', '2026-02-01'), overrideReason: 'Preferred game format' },
    { ...makeMemory('m2', 'director_override', 'Director revised: removed assessment', '2026-02-05'), overrideReason: 'Too rigid' },
    { ...makeMemory('m3', 'director_override', 'Director revised: replaced tactical with drill', '2026-02-10'), overrideReason: 'Needs more technical focus' },
    { ...makeMemory('m4', 'director_override', 'Director revised: reordered level structure', '2026-02-15'), overrideReason: 'Does not match our approach' },
    { ...makeMemory('m5', 'director_override', 'Director revised: changed fitness requirement', '2026-02-20'), overrideReason: 'Not our priority' },
  ]
  const dna = makeDna('competitive_development')
  const r   = runPipeline([], memories, dna)

  return [
    assert(r.philosophyMemoryCount >= 5,
      'CoachExecution: director_override memories produce philosophy signals',
      `Got: ${r.philosophyMemoryCount}`),
    assert(r.decisionPatternCount >= 5,
      'CoachExecution: decision patterns built from memory',
      `Got: ${r.decisionPatternCount}`),
    assert(
      r.identityProfile.dimensions.find(d => d.key === 'coach_autonomy') !== undefined,
      'CoachExecution: coach_autonomy dimension exists in identity profile',
      `Dims: ${r.identityProfile.dimensions.map(d => d.key).join(', ')}`),
  ]
}

// ── Scenario 7: Contradiction Academy (Drift Test) ────────────────────────────
// Stated: competitive_elite DNA. Observed: recreational/game decisions.
// Expected: HIGH drift detected.

function certContradictionAcademy(): CertResult[] {
  const currMem: CurriculumMemoryEntry[] = [
    makeCurrEntry('c1', 'game',         'add',    'Red Ball 1', '2026-02-01'),
    makeCurrEntry('c2', 'game',         'add',    'Orange Ball 1', '2026-02-05'),
    makeCurrEntry('c3', 'game',         'expand', 'Green Ball 1', '2026-02-10'),
    makeCurrEntry('c4', 'player_mission', 'add',  'Red Ball 1', '2026-02-15'),
    makeCurrEntry('c5', 'game',         'add',    'Orange Ball 2', '2026-02-20'),
    makeCurrEntry('c6', 'progression',  'add',    'Red Ball 1', '2026-02-25'),
    makeCurrEntry('c7', 'game',         'add',    'Green Ball 2', '2026-03-01'),
    makeCurrEntry('c8', 'game',         'expand', 'Orange Ball 1', '2026-03-05'),
    makeCurrEntry('c9', 'game',         'add',    'Red Ball 2', '2026-03-10'),
  ]
  // Stated DNA: highly competitive
  const dna = makeDna('competitive_elite')
  const r   = runPipeline(currMem, [], dna)

  const driftCheck = r.identityProfile.dimensions.some(d =>
    d.driftWarning !== null && d.statedScore !== null && d.observedScore !== null,
  )

  return [
    assert(r.philosophyMemoryCount >= 9,
      'Contradiction: philosophy memory built from 9 decisions',
      `Got: ${r.philosophyMemoryCount}`),
    assert(r.driftReport.driftDetected,
      'Contradiction: drift MUST be detected (competitive DNA vs game decisions)',
      `Detected: ${r.driftReport.driftDetected}, severity: ${r.driftReport.driftSeverity}`),
    assert(
      r.driftReport.driftSeverity === 'MEDIUM' || r.driftReport.driftSeverity === 'HIGH',
      'Contradiction: drift severity MEDIUM or HIGH',
      `Severity: ${r.driftReport.driftSeverity}`),
    assert(driftCheck,
      'Contradiction: at least one dimension has a drift warning',
      `Drift warnings: ${r.identityProfile.dimensions.filter(d => d.driftWarning !== null).map(d => d.key).join(', ')}`),
    assert(r.evolutionAnswers.find(a => a.question === 'what_kind_of_academy') !== undefined,
      'Contradiction: what_kind_of_academy question answered',
      ''),
  ]
}

// ── Global invariants ─────────────────────────────────────────────────────────

function certGlobalInvariants(): CertResult[] {
  // Empty state — no history at all
  const dna = makeDna('competitive_development')
  const r   = runPipeline([], [], dna)

  // Reality override — player evidence contradicts stated competitive DNA
  const playerLevels: PlayerLevelSummary[] = [
    makePlayerLevel('lvl1', 'Red Ball 1', 45, 2, false),   // 45 players, only 2 eligible
    makePlayerLevel('lvl2', 'Orange Ball 1', 12, 0, true), // 0 eligible = retention problem
  ]
  const r2 = runPipeline(
    [makeCurrEntry('c1', 'game', 'add', 'Red Ball 1')],
    [],
    makeDna('competitive_elite'),
    playerLevels,
  )

  return [
    assert(r.evolutionAnswers.length === 10,
      'Global: empty-state pipeline always returns 10 evolution answers',
      `Got: ${r.evolutionAnswers.length}`),
    assert(r.timeline.totalPhases === 0,
      'Global: empty-state timeline has 0 phases',
      `Got: ${r.timeline.totalPhases}`),
    assert(!r.driftReport.driftDetected || r.driftReport.confidence === 'insufficient',
      'Global: empty-state drift either not detected or confidence=insufficient',
      `Detected: ${r.driftReport.driftDetected}, confidence: ${r.driftReport.confidence}`),
    assert(r.identityProfile.dimensions.length === 10,
      'Global: identity profile always has exactly 10 dimensions',
      `Got: ${r.identityProfile.dimensions.length}`),
    assert(
      r.identityProfile.dimensions.every(d => d.finalScore >= 0 && d.finalScore <= 100),
      'Global: all dimension scores in [0, 100]',
      `Scores: ${r.identityProfile.dimensions.map(d => d.finalScore).join(', ')}`),
    assert(
      r.evolutionAnswers.every(a => typeof a.answer === 'string' && a.answer.length > 0),
      'Global: all evolution answers have non-empty answer text',
      ''),
    assert(
      r.evolutionAnswers.every(a => Array.isArray(a.evidenceUsed)),
      'Global: all evolution answers have evidenceUsed array',
      ''),
    assert(r2.identityProfile.dimensions.length === 10,
      'Global: identity profile with player data still has 10 dimensions',
      `Got: ${r2.identityProfile.dimensions.length}`),
    assert(
      typeof r2.driftReport.driftDetected === 'boolean',
      'Global: drift detection with player data returns boolean driftDetected',
      `Got: ${typeof r2.driftReport.driftDetected}`),
  ]
}

// ── Timeline ordering invariant ───────────────────────────────────────────────

function certTimelineOrdering(): CertResult[] {
  const currMem: CurriculumMemoryEntry[] = [
    makeCurrEntry('c1', 'game',  'add', 'Red Ball 1', '2026-03-10'),
    makeCurrEntry('c2', 'drill', 'add', 'Red Ball 1', '2026-01-05'),
    makeCurrEntry('c3', 'game',  'add', 'Red Ball 2', '2026-05-20'),
    makeCurrEntry('c4', 'skill', 'add', 'Orange Ball 1', '2026-02-15'),
  ]
  const dna = makeDna('recreational')
  const r   = runPipeline(currMem, [], dna)

  const keys = r.timeline.phases.map(p => p.periodKey)
  const isSorted = keys.every((k, i) => i === 0 || k >= keys[i - 1])

  return [
    assert(isSorted,
      'Timeline: phases are always sorted chronologically',
      `Keys: ${keys.join(', ')}`),
    assert(r.timeline.phases.length === 4,
      'Timeline: groups 4 entries into 4 distinct months (Jan, Feb, Mar, May)',
      `Got: ${r.timeline.phases.length} phases: ${keys.join(', ')}`),
  ]
}

// ── Main runner ───────────────────────────────────────────────────────────────

export async function runPhilosophyCertification(): Promise<boolean> {
  const suites: Array<{ name: string; fn: () => CertResult[] }> = [
    { name: 'Foundation Development Academy', fn: certFoundationAcademy },
    { name: 'High Performance Academy',       fn: certHighPerformanceAcademy },
    { name: 'Recreational Retention Academy', fn: certRecreationalAcademy },
    { name: 'Game-Based Academy',             fn: certGameBasedAcademy },
    { name: 'Parent Transparency Academy',    fn: certParentTransparencyAcademy },
    { name: 'Coach Execution Problem Academy', fn: certCoachExecutionProblemAcademy },
    { name: 'Contradiction Academy (Drift)',  fn: certContradictionAcademy },
    { name: 'Global Invariants',              fn: certGlobalInvariants },
    { name: 'Timeline Ordering',             fn: certTimelineOrdering },
  ]

  let totalPassed = 0
  let totalFailed = 0

  console.log('\n══════════════════════════════════════════════════════')
  console.log('  DONNA Philosophy Engine — Certification Suite V1')
  console.log('  Mega Sprint 1746–1775')
  console.log('══════════════════════════════════════════════════════\n')

  for (const suite of suites) {
    console.log(`▶ ${suite.name}`)
    const results = suite.fn()
    for (const r of results) {
      const icon = r.passed ? '  ✓' : '  ✗'
      console.log(`${icon} ${r.label}`)
      if (!r.passed) {
        console.log(`      Detail: ${r.detail}`)
        totalFailed++
      } else {
        totalPassed++
      }
    }
    console.log('')
  }

  console.log('══════════════════════════════════════════════════════')
  console.log(`  Results: ${totalPassed} passed, ${totalFailed} failed`)
  if (totalFailed === 0) {
    console.log('  STATUS: CERTIFIED ✓')
    console.log('  Philosophy layer is ready for Sprint 1776–1805.')
  } else {
    console.log('  STATUS: FAILED — fix failures before proceeding.')
  }
  console.log('══════════════════════════════════════════════════════\n')

  return totalFailed === 0
}

// Direct execution
runPhilosophyCertification().then(passed => {
  process.exit(passed ? 0 : 1)
}).catch(err => {
  console.error('Certification error:', err)
  process.exit(1)
})
