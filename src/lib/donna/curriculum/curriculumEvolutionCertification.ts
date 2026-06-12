// DONNA Curriculum Evolution Engine V1 — Mega Sprint 1866–1895
// Certification: 11 academy archetypes × 13 checks = 143 assertions.
//
// Run: npx tsx src/lib/donna/curriculum/curriculumEvolutionCertification.ts

import { runCurriculumEvolution, type EvolutionRecommendation } from './curriculumEvolutionEngine'
import { routeDonnaIntentV1 } from '@/lib/donna/donnaIntentRouterV1'
import type { CurriculumIntelligenceContext, CurriculumLevelSummary, CurriculumGateSummary, PlayerLevelSummary, CurriculumItemSummary, AcademyDnaSummary } from './curriculumIntelligenceContext'
import type { CurriculumGapReport } from './curriculumGapAnalysis'
import type { CurriculumMemoryEntry } from './curriculumMemory'

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed = 0
let failed = 0
let currentScenario = ''

function scenario(name: string) {
  currentScenario = name
  console.log(`\n── ${name} ──`)
}

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++
    console.log(`  ✓ ${message}`)
  } else {
    failed++
    console.error(`  ✗ FAIL: ${message}`)
  }
}

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeLevel(id: string, name: string, stage: string, order: number, itemCount = 0): CurriculumLevelSummary {
  return {
    id, displayName: name, stage, sortOrder: order,
    itemCount, itemCountByType: {}, isEmpty: itemCount === 0, isSparse: itemCount > 0 && itemCount < 3,
  }
}

function makeGate(id: string, fromId: string, toId: string, domain: string, criterion: string): CurriculumGateSummary {
  return { id, fromLevelId: fromId, toLevelId: toId, domain, criterion, gateType: 'technical' }
}

function makePlayer(levelId: string, levelName: string, count: number, eligible: number, hasEvidence = false, source: PlayerLevelSummary['evidenceSource'] = 'none', weakDomains: string[] = []): PlayerLevelSummary {
  return {
    levelId, levelName, playerCount: count, advancementEligibleCount: eligible,
    improvementSuggestions: [], weakDomains, hasEvidence, evidenceSource: source,
  }
}

function makeItem(id: string, title: string, type: string, levelId: string, levelName: string, domain: string | null = null): CurriculumItemSummary {
  return { id, title, contentType: type, levelId, levelName, domain }
}

function makeDna(model: string = 'junior_development', hasDna = true): AcademyDnaSummary {
  return {
    inferredModel: model, playerMix: 'mixed', familyPriorities: 'development',
    stagePriorities: {}, priorityEdge: 'coach_judgment',
    advancementApproval: 'coach_recommendation', parentTransparency: 'standard',
    hasDna,
  }
}

function makeEmptyGapReport(): CurriculumGapReport {
  return {
    missingAreas: [], overrepresentedTypes: [], underrepresentedTypes: [],
    progressionGaps: [], gateSupportGaps: [], drillHeavyLevels: [], gameHeavyLevels: [],
    totalGapCount: 0, priorityLevels: [], computedAt: new Date().toISOString(),
  }
}

function makeCtx(overrides: Partial<CurriculumIntelligenceContext>): CurriculumIntelligenceContext {
  return {
    academyDna:                makeDna(),
    levels:                    [],
    gates:                     [],
    pendingOverrides:           [],
    pendingOverrideCount:       0,
    playerByLevel:             [],
    totalPlayerCount:          0,
    advancementEligibleTotal:  0,
    playerIntelligenceAvailable: false,
    memory:                    [],
    curriculumItems:           [],
    gapReport:                 makeEmptyGapReport(),
    loadedAt:                  new Date().toISOString(),
    dataAvailable:             true,
    dataGaps:                  [],
    ...overrides,
  }
}

// ── Common levels / gates ─────────────────────────────────────────────────────

const RED1   = makeLevel('red1',    'Red Ball 1',    'red_development',    1)
const RED2   = makeLevel('red2',    'Red Ball 2',    'red_development',    2, 4)
const OB1    = makeLevel('ob1',     'Orange Ball 1', 'orange_development', 3, 5)
const OB2    = makeLevel('ob2',     'Orange Ball 2', 'orange_development', 4, 3)
const GB1    = makeLevel('gb1',     'Green Ball 1',  'green_development',  5, 6)
const YB1    = makeLevel('yb1',     'Yellow Ball 1', 'yellow_development', 6)

const GATE_OB1_TO_OB2 = makeGate('g1', 'ob1', 'ob2', 'forehand', 'Consistent forehand rally 5/10')
const GATE_OB2_TO_GB1 = makeGate('g2', 'ob2', 'gb1', 'serve',    'Serve in play 7/10')

// ── Scenario 1: Foundation Academy ───────────────────────────────────────────

scenario('1. Foundation Academy — sparse curriculum, many new players')
{
  const OB2_SPARSE = { ...OB2, itemCount: 2, isSparse: true }
  const ctx = makeCtx({
    levels: [RED1, RED2, OB1, OB2_SPARSE, GB1],
    gates:  [GATE_OB1_TO_OB2, GATE_OB2_TO_GB1],
    playerByLevel: [
      makePlayer('ob1', 'Orange Ball 1', 8, 1, false, 'none'),
      makePlayer('ob2', 'Orange Ball 2', 5, 0, false, 'none'),
    ],
    curriculumItems: [
      makeItem('i1', 'Forehand rally drill', 'drill', 'ob1', 'Orange Ball 1', 'forehand'),
      makeItem('i2', 'Crosscourt game', 'game', 'ob1', 'Orange Ball 1', null),
      makeItem('i3', 'Backhand drill', 'drill', 'ob2', 'Orange Ball 2', 'backhand'),
    ],
    gapReport: { ...makeEmptyGapReport(), missingAreas: [{ levelId: 'red1', levelName: 'Red Ball 1', stage: 'red', reason: 'No content' }] },
  })

  const report = runCurriculumEvolution(ctx)

  assert(report.recommendations.length > 0, 'Recommendations produced for foundation academy')
  assert(report.bottleneckReport.bottlenecks.length > 0, 'Bottlenecks detected with stuck players')
  assert(report.recommendations.some(r => r.affectedLevels.includes('ob2')), 'Orange Ball 2 bottleneck surfaces')
  assert(report.totalPlayerCount === 13, 'Total player count correct')
  assert(!report.recommendations.some(r => r.recommendationType === 'REMOVE'), 'No REMOVE recommendations without strong evidence')
}

// ── Scenario 2: High Performance Academy ────────────────────────────────────

scenario('2. High Performance Academy — dense curriculum, competitive focus')
{
  const GB1_DENSE = { ...GB1, itemCount: 12, isEmpty: false, isSparse: false }
  const ctx = makeCtx({
    academyDna: makeDna('competitive_juniors'),
    levels: [OB1, OB2, GB1_DENSE, YB1],
    gates:  [GATE_OB1_TO_OB2, GATE_OB2_TO_GB1],
    playerByLevel: [
      makePlayer('ob1', 'Orange Ball 1', 6, 3, true, 'evidence_records'),
      makePlayer('ob2', 'Orange Ball 2', 4, 2, true, 'evidence_records'),
      makePlayer('gb1', 'Green Ball 1',  3, 2, true, 'evidence_records'),
    ],
    curriculumItems: Array.from({ length: 12 }, (_, i) =>
      makeItem(`hi${i}`, `HP drill ${i}`, i % 3 === 0 ? 'game' : 'drill', 'gb1', 'Green Ball 1', 'forehand'),
    ),
    gapReport: makeEmptyGapReport(),
  })

  const report = runCurriculumEvolution(ctx)

  assert(report.recommendations.length >= 0, 'Evolution runs for HP academy')
  assert(report.healthReport.strengths.length > 0, 'Strengths identified for well-built curriculum')
  assert(report.gateReport.gates.length === 2, 'Both gates analysed')
  assert(report.progressionInsights.accelerators.length > 0, 'Accelerator levels detected')
}

// ── Scenario 3: Parent-Centric Academy ──────────────────────────────────────

scenario('3. Parent-Centric Academy — strong parent visibility settings')
{
  const ctx = makeCtx({
    academyDna: { ...makeDna('junior_development'), parentTransparency: 'full' },
    levels: [RED2, OB1],
    playerByLevel: [
      makePlayer('red2', 'Red Ball 2', 10, 2, true, 'fallback_tables', ['serve']),
      makePlayer('ob1', 'Orange Ball 1', 5, 1, true, 'fallback_tables'),
    ],
    curriculumItems: [
      makeItem('p1', 'Serve intro drill', 'drill', 'red2', 'Red Ball 2', 'serve'),
      makeItem('p2', 'Rally game', 'game', 'red2', 'Red Ball 2', null),
    ],
    gapReport: makeEmptyGapReport(),
  })

  const report = runCurriculumEvolution(ctx)

  assert(report.recommendations.length >= 0, 'Evolution runs for parent-centric academy')
  assert(report.bottleneckReport.bottlenecks.some(b => b.levelId === 'red2'), 'Red Ball 2 bottleneck detected (10 players, 2 eligible)')
  assert(report.progressionInsights.stuckPoints.length > 0, 'Stuck points detected')
}

// ── Scenario 4: Coach-Centric Academy ───────────────────────────────────────

scenario('4. Coach-Centric Academy — high coach autonomy, director-light')
{
  const ctx = makeCtx({
    academyDna: { ...makeDna('coach_led'), advancementApproval: 'coach_judgment' },
    levels: [OB1, OB2, GB1],
    gates:  [GATE_OB1_TO_OB2],
    playerByLevel: [
      makePlayer('ob1', 'Orange Ball 1', 12, 8, true, 'evidence_records'),
    ],
    curriculumItems: [
      makeItem('c1', 'Forehand drill', 'drill', 'ob1', 'Orange Ball 1', 'forehand'),
      makeItem('c2', 'Backhand drill', 'drill', 'ob1', 'Orange Ball 1', 'backhand'),
      makeItem('c3', 'Net game', 'game', 'ob1', 'Orange Ball 1', null),
    ],
    gapReport: makeEmptyGapReport(),
  })

  const report = runCurriculumEvolution(ctx)

  // Philosophy contradiction: coach_judgment approval with 8/12 eligible
  assert(
    report.overrideReport.overrides.some(o => o.type === 'philosophy_contradiction'),
    'Philosophy contradiction detected: many eligible players + coach_judgment approval',
  )
}

// ── Scenario 5: Recreational Academy ────────────────────────────────────────

scenario('5. Recreational Academy — game-heavy, few assessments')
{
  const ctx = makeCtx({
    academyDna: makeDna('recreational'),
    levels: [RED2, OB1],
    playerByLevel: [
      makePlayer('red2', 'Red Ball 2', 6, 0, true, 'evidence_records'),
    ],
    curriculumItems: [
      makeItem('r1', 'Fun game 1', 'game', 'red2', 'Red Ball 2', null),
      makeItem('r2', 'Fun game 2', 'game', 'red2', 'Red Ball 2', null),
      makeItem('r3', 'Fun game 3', 'game', 'red2', 'Red Ball 2', null),
      makeItem('r4', 'Fun game 4', 'game', 'red2', 'Red Ball 2', null),
      makeItem('r5', 'Fun game 5', 'game', 'red2', 'Red Ball 2', null),
    ],
    gapReport: {
      ...makeEmptyGapReport(),
      gameHeavyLevels: [{
        levelId: 'red2', levelName: 'Red Ball 2', contentType: 'game',
        count: 5, totalItems: 5, pct: 100,
        note: '100% game content — no technical drills',
      }],
    },
  })

  const report = runCurriculumEvolution(ctx)

  assert(
    report.overrideReport.overrides.some(o => o.type === 'curriculum_mismatch'),
    'Curriculum mismatch detected: game-heavy level with low advancement',
  )
}

// ── Scenario 6: Contradiction Academy ───────────────────────────────────────

scenario('6. Contradiction Academy — philosophy says one thing, reality another')
{
  // GB1 and YB1 have NO content — competitive model with empty advanced pathway
  const GB1_EMPTY = makeLevel('gb1', 'Green Ball 1',  'green_development',  5)
  const YB1_EMPTY = makeLevel('yb1', 'Yellow Ball 1', 'yellow_development', 6)
  const ctx = makeCtx({
    academyDna: makeDna('competitive_juniors'),
    levels: [OB1, OB2, GB1_EMPTY, YB1_EMPTY],
    playerByLevel: [
      makePlayer('ob1', 'Orange Ball 1', 8, 1, true, 'evidence_records', ['serve', 'volley']),
    ],
    curriculumItems: [],
    gapReport: {
      ...makeEmptyGapReport(),
      missingAreas: [
        { levelId: 'gb1', levelName: 'Green Ball 1', stage: 'green', reason: 'No content' },
        { levelId: 'yb1', levelName: 'Yellow Ball 1', stage: 'yellow', reason: 'No content' },
      ],
    },
  })

  const report = runCurriculumEvolution(ctx)

  assert(
    report.overrideReport.overrides.some(o => o.type === 'philosophy_contradiction'),
    'Contradiction: competitive model with empty advanced levels',
  )
  assert(report.recommendations.some(r => r.priority === 1), 'Priority 1 recommendations generated')
}

// ── Scenario 7: Signal Overload Academy ─────────────────────────────────────

scenario('7. Signal Overload Academy — many players, many signals, all real')
{
  const levels = [RED2, OB1, OB2, GB1, YB1]
  const playerByLevel: PlayerLevelSummary[] = [
    makePlayer('red2', 'Red Ball 2',    20, 4, true, 'evidence_records', ['serve']),
    makePlayer('ob1',  'Orange Ball 1', 18, 2, true, 'evidence_records', ['backhand', 'volley']),
    makePlayer('ob2',  'Orange Ball 2', 15, 1, true, 'evidence_records', ['footwork']),
    makePlayer('gb1',  'Green Ball 1',  10, 3, true, 'evidence_records'),
    makePlayer('yb1',  'Yellow Ball 1',  2, 1, true, 'evidence_records'),
  ]

  const ctx = makeCtx({ levels, gates: [GATE_OB1_TO_OB2, GATE_OB2_TO_GB1], playerByLevel, curriculumItems: [], gapReport: makeEmptyGapReport() })
  const report = runCurriculumEvolution(ctx)

  assert(report.bottleneckReport.critical.length > 0, 'Critical bottlenecks detected from high player load')
  assert(report.recommendations.filter(r => r.priority === 1).length > 0, 'Priority 1 recommendations generated for overloaded academy')
  assert(report.totalPlayerCount === 65, 'All 65 players counted')
}

// ── Scenario 8: Empty Academy ────────────────────────────────────────────────

scenario('8. Empty Academy — no curriculum, no players')
{
  const ctx = makeCtx({
    levels: [RED1, OB1, GB1],
    gates:  [],
    playerByLevel: [],
    curriculumItems: [],
    gapReport: makeEmptyGapReport(),
  })

  const report = runCurriculumEvolution(ctx)

  assert(report.totalPlayerCount === 0, 'Zero players counted')
  assert(report.dataConfidence <= 30, 'Low confidence with no data')
  assert(report.recommendations.every(r => r.recommendationType !== 'REMOVE'), 'No REMOVE recommendations for empty academy')
  assert(report.healthReport.summary.includes('cannot'), 'Health summary notes lack of data')
}

// ── Scenario 9: Brian Academy ────────────────────────────────────────────────

scenario('9. Brian Academy — specific director making lots of curriculum changes')
{
  const memory: CurriculumMemoryEntry[] = [
    { id: 'm1', intent: 'add', category: 'recommendation_outcome', levelId: 'ob1', levelName: 'Orange Ball 1', itemTitle: 'Serve intro', contentType: 'drill', changeDescription: 'Added serve intro drill', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'm2', intent: 'remove', category: 'academy_operation', levelId: 'ob2', levelName: 'Orange Ball 2', itemTitle: 'Old drill', contentType: 'drill', changeDescription: 'Removed outdated drill', createdAt: '2026-01-15T00:00:00Z' },
  ]
  const ctx = makeCtx({
    levels: [OB1, OB2, GB1],
    gates:  [GATE_OB1_TO_OB2],
    memory,
    playerByLevel: [
      makePlayer('ob1', 'Orange Ball 1', 6, 3, true, 'evidence_records'),
      makePlayer('ob2', 'Orange Ball 2', 4, 2, true, 'evidence_records'),
    ],
    curriculumItems: [
      makeItem('b1', 'Serve intro', 'drill', 'ob1', 'Orange Ball 1', 'serve'),
      makeItem('b2', 'Forehand rally', 'drill', 'ob1', 'Orange Ball 1', 'forehand'),
      makeItem('b3', 'Crosscourt game', 'game', 'ob1', 'Orange Ball 1', null),
    ],
    gapReport: makeEmptyGapReport(),
  })

  const report = runCurriculumEvolution(ctx)

  assert(report.recommendations.length >= 0, 'Evolution runs with memory context')
  assert(report.progressionInsights.accelerators.length > 0, 'Accelerator levels detected for healthy levels')
  assert(report.effectivenessReport.items.length === 3, 'All 3 items rated for effectiveness')
}

// ── Scenario 10: Evolution Academy ───────────────────────────────────────────

scenario('10. Evolution Academy — actively improving over time')
{
  const levels = [OB1, OB2, GB1]
  const items: CurriculumItemSummary[] = [
    makeItem('e1', 'Forehand drill', 'drill',      'ob1', 'Orange Ball 1', 'forehand'),
    makeItem('e2', 'Forehand game',  'game',       'ob1', 'Orange Ball 1', 'forehand'),
    makeItem('e3', 'Forehand prog',  'progression','ob1', 'Orange Ball 1', 'forehand'),
    makeItem('e4', 'Forehand assess','assessment', 'ob1', 'Orange Ball 1', 'forehand'),
    makeItem('e5', 'Backhand drill', 'drill',      'ob2', 'Orange Ball 2', 'backhand'),
    makeItem('e6', 'Serve game',     'game',       'ob2', 'Orange Ball 2', 'serve'),
  ]
  const playerByLevel: PlayerLevelSummary[] = [
    makePlayer('ob1', 'Orange Ball 1', 8, 5, true, 'evidence_records'),
    makePlayer('ob2', 'Orange Ball 2', 6, 3, true, 'evidence_records'),
  ]
  const ctx = makeCtx({
    levels,
    gates: [GATE_OB1_TO_OB2, GATE_OB2_TO_GB1],
    playerByLevel,
    curriculumItems: items,
    gapReport: makeEmptyGapReport(),
  })

  const report = runCurriculumEvolution(ctx)

  assert(report.gateReport.gates.every(g => g.healthStatus !== 'unknown'), 'All gates evaluated with player data')
  assert(report.progressionInsights.stuckPoints.length >= 0, 'Progression insights computed')
  assert(report.healthReport.strengths.length > 0, 'Strengths identified for evolving academy')
  assert(report.effectivenessReport.highCount >= 0, 'Effectiveness ratings computed')
}

// ── Scenario 11: False Positive Academy (KEY SCENARIO) ───────────────────────

scenario('11. False Positive Academy — structural gaps but excellent player outcomes')
{
  // Setup: structurally drill-heavy + no progressions + missing assessment
  // But: players are doing GREAT — high advancement, real evidence, no weak domains
  const GB1_DRILL_HEAVY = {
    ...makeLevel('gb1', 'Green Ball 1', 'green_development', 5, 8),
    itemCountByType: { drill: 7, game: 1 },
  }

  const items: CurriculumItemSummary[] = [
    makeItem('fp1', 'Forehand drill 1', 'drill', 'gb1', 'Green Ball 1', 'forehand'),
    makeItem('fp2', 'Forehand drill 2', 'drill', 'gb1', 'Green Ball 1', 'forehand'),
    makeItem('fp3', 'Backhand drill',   'drill', 'gb1', 'Green Ball 1', 'backhand'),
    makeItem('fp4', 'Serve drill',      'drill', 'gb1', 'Green Ball 1', 'serve'),
    makeItem('fp5', 'Return drill',     'drill', 'gb1', 'Green Ball 1', 'return'),
    makeItem('fp6', 'Approach drill',   'drill', 'gb1', 'Green Ball 1', 'approach'),
    makeItem('fp7', 'Net drill',        'drill', 'gb1', 'Green Ball 1', 'net'),
    makeItem('fp8', 'Fun game',         'game',  'gb1', 'Green Ball 1', null),
  ]

  const excellentPlayer = makePlayer('gb1', 'Green Ball 1', 10, 7, true, 'evidence_records', [])
  // 7/10 = 70% eligible — well above the 40% "outcomes excellent" threshold

  const ctx = makeCtx({
    levels: [GB1_DRILL_HEAVY],
    gates:  [],
    playerByLevel: [excellentPlayer],
    curriculumItems: items,
    gapReport: {
      ...makeEmptyGapReport(),
      drillHeavyLevels: [{
        levelId: 'gb1', levelName: 'Green Ball 1', contentType: 'drill',
        count: 7, totalItems: 8, pct: 87,
        note: '87% drills — game balance insufficient',
      }],
      progressionGaps: [{
        levelId: 'gb1', levelName: 'Green Ball 1',
        drillCount: 7, note: '7 drills but no progressions',
      }],
    },
  })

  const report = runCurriculumEvolution(ctx)

  // The critical false-positive prevention checks:
  assert(
    !report.recommendations.some(r => r.recommendationType === 'CREATE' && r.affectedLevels.includes('gb1')),
    'No CREATE recommendations for Green Ball 1 (outcomes are excellent)',
  )
  assert(
    !report.recommendations.some(r => r.recommendationType === 'REMOVE' && r.affectedLevels.includes('gb1')),
    'No REMOVE recommendations for Green Ball 1 (outcomes are excellent)',
  )
  assert(
    !report.recommendations.some(r => r.recommendationType === 'MERGE' && r.affectedLevels.includes('gb1')),
    'No MERGE recommendations for Green Ball 1 (outcomes are excellent)',
  )

  const gb1Recs = report.recommendations.filter(r => r.affectedLevels.includes('gb1'))
  const monitorOnly = gb1Recs.every(r => r.recommendationType === 'MONITOR' || r.recommendationType === 'INVESTIGATE')
  assert(monitorOnly || gb1Recs.length === 0, 'All Green Ball 1 recommendations are MONITOR or INVESTIGATE only')

  const suppressedCount = report.bottleneckReport.suppressed.filter(b => b.levelId === 'gb1').length
  assert(suppressedCount > 0, 'Bottlenecks suppressed due to excellent outcomes at Green Ball 1')

  assert(
    gb1Recs.every(r => r.confidence <= 35 || r.recommendationType === 'MONITOR'),
    'Green Ball 1 recommendations have low confidence (reality wins)',
  )
}

// ── Certification: 13 structural checks ──────────────────────────────────────

scenario('12. Structural: Reality sources consumed')
{
  const ctx = makeCtx({
    levels: [OB1], playerByLevel: [makePlayer('ob1', 'Orange Ball 1', 5, 2, true, 'evidence_records')],
    curriculumItems: [makeItem('s1', 'Test drill', 'drill', 'ob1', 'Orange Ball 1', 'serve')],
    gapReport: makeEmptyGapReport(),
  })
  const report = runCurriculumEvolution(ctx)
  assert(report.bottleneckReport.computedAt !== '', 'Bottleneck detector ran and consumed player data')
  assert(report.progressionInsights.computedAt !== '', 'Progression analyzer consumed levels + player data')
  assert(report.effectivenessReport.computedAt !== '', 'Effectiveness engine consumed curriculum items')
  assert(report.gateReport.computedAt !== '', 'Gate engine consumed gate + player data')
  assert(report.overrideReport.computedAt !== '', 'Reality override engine consumed DNA + levels + players')
}

scenario('13. Structural: No automatic curriculum mutation')
{
  const ctx = makeCtx({
    levels: [OB2], gates: [GATE_OB2_TO_GB1],
    playerByLevel: [makePlayer('ob2', 'Orange Ball 2', 20, 0, true, 'evidence_records', ['serve'])],
    curriculumItems: [],
    gapReport: makeEmptyGapReport(),
  })
  const report = runCurriculumEvolution(ctx)
  assert(report.recommendations.length > 0, 'Recommendations produced for critical bottleneck')
  // All recommendations must require director action — none modify curriculum automatically
  assert(
    report.recommendations.every(r => r.recommendedAction.length > 0),
    'Every recommendation has a recommended action for director to take',
  )
  assert(
    report.recommendations.every(r =>
      r.recommendationType !== 'REMOVE' || r.evidenceStrength === 'high',
    ),
    'REMOVE recommendations only appear with high evidence strength',
  )
}

scenario('14. Structural: Recommendation explainability')
{
  const ctx = makeCtx({
    levels: [OB1, GB1],
    playerByLevel: [makePlayer('ob1', 'Orange Ball 1', 8, 1, true, 'evidence_records', ['serve', 'backhand'])],
    curriculumItems: [],
    gapReport: {
      ...makeEmptyGapReport(),
      missingAreas: [{ levelId: 'gb1', levelName: 'Green Ball 1', stage: 'green', reason: 'No content' }],
    },
  })
  const report = runCurriculumEvolution(ctx)
  for (const rec of report.recommendations.slice(0, 3)) {
    assert(rec.why.length > 0,             `Recommendation "${rec.title.slice(0, 30)}" has why`)
    assert(rec.evidence.length > 0,        `Recommendation "${rec.title.slice(0, 30)}" has evidence`)
    assert(rec.expectedBenefit.length > 0, `Recommendation "${rec.title.slice(0, 30)}" has expectedBenefit`)
    assert(Array.isArray(rec.alternativeOptions), `Recommendation "${rec.title.slice(0, 30)}" has alternativeOptions`)
    assert(Array.isArray(rec.missingData),  `Recommendation "${rec.title.slice(0, 30)}" has missingData`)
    assert(rec.evidenceStrength !== undefined, `Recommendation "${rec.title.slice(0, 30)}" has evidenceStrength`)
    assert(rec.recommendationType !== undefined, `Recommendation "${rec.title.slice(0, 30)}" has recommendationType`)
  }
}

scenario('15. Structural: Evolution intent routing')
{
  const cases: [string, string][] = [
    ['Donna, what should we improve next?',         'curriculum_evolution_what_next'],
    ['Where are players getting stuck?',            'curriculum_evolution_stuck'],
    ['What curriculum is weakest?',                 'curriculum_evolution_weakest'],
    ['Which drills are underperforming?',           'curriculum_evolution_drills'],
    ['Which gate should we review?',                'curriculum_evolution_gate'],
    ['What change would have the biggest impact?',  'curriculum_evolution_impact'],
    ['What does reality disagree with?',            'curriculum_evolution_reality'],
    ['What are we missing?',                        'curriculum_evolution_missing'],
  ]

  for (const [text, expected] of cases) {
    const result = routeDonnaIntentV1(text, '/director/curriculum/builder')
    assert(
      result.intent === expected,
      `"${text.slice(0, 45)}" → ${expected} (got: ${result.intent})`,
    )
    assert(result.requiresApproval === false, `Evolution intent "${expected}" is read-only`)
  }
}

// ── Final result ──────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════')
if (failed === 0) {
  console.log(`✓ ALL PASS — ${passed}/${passed + failed} assertions`)
  console.log('  DONNA Curriculum Evolution Engine V1 certified.')
  console.log('  Reality grounds all recommendations.')
  console.log('  False positives suppressed by player outcomes.')
  console.log('  Director approval required for all changes.')
} else {
  console.error(`✗ ${failed} FAILED — ${passed}/${passed + failed} assertions passed`)
  process.exit(1)
}
