// Philosophy Consumption Audit — Sprint 1776–1805 Pre-Implementation
// Run: npx tsx src/lib/donna/philosophy/_audit_consumption.ts
//
// Simulates 7 academy archetypes through the full philosophy pipeline.
// Produces structured output for each layer: DNA, memory, preferences,
// decisions, identity, timeline, drift, overrides, evolution answers.

import type { CurriculumMemoryEntry } from '../curriculum/curriculumMemory'
import type { AcademyMemory, MemorySourceType } from '../memory/donnaAcademyMemoryTypes'
import type { AcademyDnaSummary, PlayerLevelSummary } from '../curriculum/curriculumIntelligenceContext'

import { buildPhilosophyMemoryFromBehavior } from './academyPhilosophyMemory'
import { extractAcademyPreferences, getTopPreferences, getTopAvoidances } from './academyPreferenceExtractor'
import { buildCurriculumDecisionPatterns, buildProposedActionDecisionPatterns, summarizeDecisionPatterns, getMostAcceptedContentTypes } from './academyDecisionPatterns'
import { buildAcademyIdentityProfile, buildRealityOverrideAnalysis } from './academyIdentityProfile'
import { buildAcademyEvolutionTimeline, detectPhilosophyDrift } from './academyEvolutionTimeline'
import { buildFullEvolutionAnswerSet } from './academyEvolutionQuestions'

// ── Helpers ───────────────────────────────────────────────────────────────────

function ce(id: string, ct: string, intent: CurriculumMemoryEntry['intent'], level: string, date: string): CurriculumMemoryEntry {
  return {
    id, intent,
    category: (intent === 'add' || intent === 'expand') ? 'recommendation_outcome' : 'academy_operation',
    contentType: ct, levelId: `lvl_${id}`, levelName: level,
    changeDescription: `${intent} ${ct} at ${level}`, createdAt: date,
  }
}

function am(id: string, st: MemorySourceType, headline: string, date: string, overrideReason: string | null = null): AcademyMemory {
  return {
    id, sourceType: st, headline,
    summary: headline, evidence: [], entityLinks: [],
    importance: 'medium', confidence: 'high',
    occurredAt: date, overrideReason, reviewerNotes: null, dataGaps: [],
  }
}

function dna(model: string, overrides: Partial<AcademyDnaSummary> = {}): AcademyDnaSummary {
  return {
    hasDna: true, inferredModel: model,
    playerMix: 'mixed', familyPriorities: 'development',
    stagePriorities: {}, priorityEdge: 'balanced',
    advancementApproval: 'director_approval', parentTransparency: 'standard',
    ...overrides,
  }
}

function pl(levelId: string, levelName: string, count: number, eligible: number, hasEvidence = true): PlayerLevelSummary {
  return {
    levelId, levelName, playerCount: count, advancementEligibleCount: eligible,
    improvementSuggestions: [], weakDomains: [], hasEvidence,
    evidenceSource: hasEvidence ? 'evidence_records' : 'none',
  }
}

// ── Academy definitions ───────────────────────────────────────────────────────

interface AcademyScenario {
  name: string
  currMem: CurriculumMemoryEntry[]
  memories: AcademyMemory[]
  dna: AcademyDnaSummary
  playerLevels: PlayerLevelSummary[]
}

const academies: AcademyScenario[] = [

  // ── 1. Foundation Development Academy ──────────────────────────────────────
  {
    name: '1. Foundation Development Academy',
    dna: dna('recreational', { advancementApproval: 'director_approval', parentTransparency: 'standard' }),
    currMem: [
      ce('c1', 'drill',        'add',    'Red Ball 1',    '2026-01-10'),
      ce('c2', 'drill',        'add',    'Red Ball 1',    '2026-01-15'),
      ce('c3', 'skill',        'add',    'Red Ball 2',    '2026-01-20'),
      ce('c4', 'drill',        'add',    'Orange Ball 1', '2026-02-05'),
      ce('c5', 'coach_cue',    'add',    'Orange Ball 1', '2026-02-10'),
      ce('c6', 'skill',        'expand', 'Orange Ball 2', '2026-02-20'),
      ce('c7', 'game',         'add',    'Red Ball 1',    '2026-03-01'),
      ce('c8', 'progression',  'add',    'Orange Ball 1', '2026-03-10'),
      ce('c9', 'drill',        'remove', 'Red Ball 2',    '2026-03-15'),
    ],
    memories: [
      am('m1', 'placement_decision',  'Player placed: Red Ball 1',    '2026-01-12'),
      am('m2', 'placement_decision',  'Player placed: Red Ball 2',    '2026-01-25'),
      am('m3', 'assessment_result',   'Assessment completed: Red Ball', '2026-02-15'),
    ],
    playerLevels: [
      pl('lvl1', 'Red Ball 1', 18, 3),
      pl('lvl2', 'Red Ball 2', 12, 1),
      pl('lvl3', 'Orange Ball 1', 6, 0),
    ],
  },

  // ── 2. High Performance Academy ────────────────────────────────────────────
  {
    name: '2. High Performance Academy',
    dna: dna('competitive_elite', { advancementApproval: 'director_only', parentTransparency: 'minimal' }),
    currMem: [
      ce('c1', 'competition', 'add',    'Green Ball 1',  '2026-01-08'),
      ce('c2', 'competition', 'add',    'Green Ball 2',  '2026-01-12'),
      ce('c3', 'assessment',  'add',    'Green Ball 1',  '2026-01-20'),
      ce('c4', 'tactical',    'add',    'Yellow Ball',   '2026-01-28'),
      ce('c5', 'assessment',  'expand', 'Green Ball 2',  '2026-02-05'),
      ce('c6', 'competition', 'expand', 'Yellow Ball',   '2026-02-10'),
      ce('c7', 'assessment',  'add',    'Yellow Ball',   '2026-02-18'),
      ce('c8', 'tactical',    'add',    'Green Ball 1',  '2026-02-25'),
      ce('c9', 'competition', 'add',    'Green Ball 2',  '2026-03-05'),
      ce('ca', 'fitness',     'add',    'Yellow Ball',   '2026-03-12'),
    ],
    memories: [
      am('m1', 'promotion_decision',   'Player advanced: Green → Yellow',  '2026-01-30'),
      am('m2', 'promotion_decision',   'Player advanced: Green → Yellow',  '2026-02-20'),
      am('m3', 'assessment_result',    'Elite assessment completed',        '2026-02-28'),
      am('m4', 'director_override',    'Modified: increased gate criteria', '2026-03-10', 'Need higher bar'),
    ],
    playerLevels: [
      pl('lvl1', 'Green Ball 1',  8, 4),
      pl('lvl2', 'Green Ball 2', 10, 6),
      pl('lvl3', 'Yellow Ball',   5, 2),
    ],
  },

  // ── 3. Recreational Retention Academy ──────────────────────────────────────
  {
    name: '3. Recreational Retention Academy',
    dna: dna('recreational', { parentTransparency: 'high', advancementApproval: 'director_approval' }),
    currMem: [
      ce('c1', 'game',          'add',    'Red Ball 1',    '2026-01-05'),
      ce('c2', 'game',          'add',    'Red Ball 2',    '2026-01-10'),
      ce('c3', 'game',          'expand', 'Orange Ball 1', '2026-01-18'),
      ce('c4', 'player_mission','add',    'Red Ball 1',    '2026-01-25'),
      ce('c5', 'parent_guidance','add',   'Red Ball 1',    '2026-02-01'),
      ce('c6', 'game',          'add',    'Orange Ball 2', '2026-02-08'),
      ce('c7', 'player_mission','add',    'Red Ball 2',    '2026-02-15'),
      ce('c8', 'progression',   'add',    'Red Ball 1',    '2026-02-22'),
      ce('c9', 'game',          'add',    'Orange Ball 1', '2026-03-01'),
      ce('ca', 'competition',   'remove', 'Orange Ball 2', '2026-03-08'),
    ],
    memories: [
      am('m1', 'parent_update',       'Parent communication sent',          '2026-01-20'),
      am('m2', 'parent_update',       'Parent communication sent',          '2026-02-10'),
      am('m3', 'placement_decision',  'Player placed: Red Ball 1',          '2026-01-15'),
    ],
    playerLevels: [
      pl('lvl1', 'Red Ball 1',    30, 2, false),
      pl('lvl2', 'Red Ball 2',    20, 1, false),
      pl('lvl3', 'Orange Ball 1', 12, 0, false),
    ],
  },

  // ── 4. Game-Based Academy ───────────────────────────────────────────────────
  {
    name: '4. Game-Based Academy',
    dna: dna('recreational'),
    currMem: [
      ce('c1',  'game', 'add',    'Red Ball 1',    '2026-01-05'),
      ce('c2',  'game', 'add',    'Red Ball 2',    '2026-01-10'),
      ce('c3',  'game', 'expand', 'Orange Ball 1', '2026-01-15'),
      ce('c4',  'game', 'add',    'Red Ball 1',    '2026-01-22'),
      ce('c5',  'game', 'add',    'Orange Ball 2', '2026-02-01'),
      ce('c6',  'game', 'expand', 'Red Ball 2',    '2026-02-08'),
      ce('c7',  'drill','remove', 'Red Ball 1',    '2026-02-12'),
      ce('c8',  'game', 'add',    'Green Ball 1',  '2026-02-18'),
      ce('c9',  'game', 'add',    'Red Ball 1',    '2026-03-01'),
      ce('ca',  'game', 'expand', 'Orange Ball 1', '2026-03-10'),
      ce('cb',  'drill','remove', 'Orange Ball 1', '2026-03-15'),
      ce('cc',  'game', 'add',    'Red Ball 2',    '2026-03-20'),
    ],
    memories: [],
    playerLevels: [
      pl('lvl1', 'Red Ball 1', 25, 5),
      pl('lvl2', 'Red Ball 2', 15, 2),
    ],
  },

  // ── 5. Parent Communication Academy ────────────────────────────────────────
  {
    name: '5. Parent Communication Academy',
    dna: dna('competitive_development', { parentTransparency: 'high' }),
    currMem: [
      ce('c1', 'parent_guidance', 'add',    'Red Ball 1',    '2026-01-08'),
      ce('c2', 'parent_guidance', 'add',    'Red Ball 2',    '2026-01-15'),
      ce('c3', 'parent_guidance', 'expand', 'Orange Ball 1', '2026-01-22'),
      ce('c4', 'parent_guidance', 'add',    'Orange Ball 2', '2026-02-01'),
      ce('c5', 'parent_guidance', 'add',    'Green Ball 1',  '2026-02-10'),
      ce('c6', 'tactical',        'add',    'Orange Ball 1', '2026-02-18'),
      ce('c7', 'parent_guidance', 'expand', 'Red Ball 1',    '2026-02-25'),
      ce('c8', 'parent_guidance', 'add',    'Green Ball 2',  '2026-03-05'),
    ],
    memories: [
      am('m1', 'parent_update', 'Parent communication sent: progress update', '2026-01-20'),
      am('m2', 'parent_update', 'Parent communication sent: event invite',    '2026-02-05'),
      am('m3', 'parent_update', 'Parent communication sent: milestone note',  '2026-02-28'),
    ],
    playerLevels: [
      pl('lvl1', 'Red Ball 1',    20, 4),
      pl('lvl2', 'Orange Ball 1', 14, 3),
    ],
  },

  // ── 6. Coach Execution Academy ──────────────────────────────────────────────
  {
    name: '6. Coach Execution Academy',
    dna: dna('competitive_development'),
    currMem: [
      ce('c1', 'drill',    'add',    'Orange Ball 1', '2026-01-10'),
      ce('c2', 'tactical', 'add',    'Green Ball 1',  '2026-01-18'),
      ce('c3', 'skill',    'add',    'Orange Ball 1', '2026-02-01'),
    ],
    memories: [
      am('m1', 'director_override', 'Modified: changed game to drill',         '2026-01-12', 'Needs more structure'),
      am('m2', 'director_override', 'Modified: removed assessment gate',       '2026-01-20', 'Too early for gates'),
      am('m3', 'director_override', 'Modified: replaced tactical with drill',  '2026-02-03', 'Not ready for tactics'),
      am('m4', 'director_override', 'Modified: reduced progression speed',     '2026-02-10', 'Too fast'),
      am('m5', 'director_override', 'Modified: removed fitness requirement',   '2026-02-18', 'Not our priority'),
      am('m6', 'director_override', 'Modified: added extra drill block',       '2026-03-01', 'More repetition needed'),
    ],
    playerLevels: [
      pl('lvl1', 'Orange Ball 1', 10, 1),
    ],
  },

  // ── 7. Contradiction Academy ────────────────────────────────────────────────
  {
    name: '7. Contradiction Academy (Stated: Elite / Actual: Recreational)',
    dna: dna('competitive_elite', { advancementApproval: 'director_only', parentTransparency: 'minimal' }),
    currMem: [
      ce('c1', 'game',          'add',    'Red Ball 1',    '2026-01-05'),
      ce('c2', 'game',          'add',    'Orange Ball 1', '2026-01-12'),
      ce('c3', 'game',          'expand', 'Green Ball 1',  '2026-01-20'),
      ce('c4', 'player_mission','add',    'Red Ball 1',    '2026-01-28'),
      ce('c5', 'game',          'add',    'Orange Ball 2', '2026-02-05'),
      ce('c6', 'progression',   'add',    'Red Ball 1',    '2026-02-12'),
      ce('c7', 'game',          'add',    'Green Ball 2',  '2026-02-20'),
      ce('c8', 'game',          'expand', 'Orange Ball 1', '2026-02-28'),
      ce('c9', 'game',          'add',    'Red Ball 2',    '2026-03-08'),
      ce('ca', 'competition',   'remove', 'Green Ball 1',  '2026-03-15'),
      ce('cb', 'assessment',    'remove', 'Green Ball 2',  '2026-03-20'),
    ],
    memories: [
      am('m1', 'director_override', 'Modified: reduced gate difficulty', '2026-02-10', 'Too hard for our players'),
    ],
    playerLevels: [
      pl('lvl1', 'Red Ball 1',   40, 1, false),
      pl('lvl2', 'Orange Ball 1', 20, 0, false),
      pl('lvl3', 'Green Ball 1',  8, 0, false),
    ],
  },
]

// ── Pipeline runner ───────────────────────────────────────────────────────────

function runAcademy(scenario: AcademyScenario) {
  const philosophyMemory  = buildPhilosophyMemoryFromBehavior(scenario.currMem, scenario.memories)
  const preferences       = extractAcademyPreferences(philosophyMemory)
  const currPatterns      = buildCurriculumDecisionPatterns(scenario.currMem)
  const memPatterns       = buildProposedActionDecisionPatterns(scenario.memories)
  const allPatterns       = [...currPatterns, ...memPatterns]
  const patternSummaries  = summarizeDecisionPatterns(allPatterns)
  const topContentTypes   = getMostAcceptedContentTypes(allPatterns)
  const identityProfile   = buildAcademyIdentityProfile('acad_sim', scenario.dna, preferences, scenario.playerLevels, scenario.memories)
  const driftReport       = detectPhilosophyDrift(identityProfile.dimensions, scenario.dna, preferences)
  const timeline          = buildAcademyEvolutionTimeline(scenario.memories, scenario.currMem)
  const realityOverrides  = buildRealityOverrideAnalysis(identityProfile, scenario.playerLevels)
  const evolutionAnswers  = buildFullEvolutionAnswerSet({ identityProfile, timeline, driftReport, preferences, realityOverrides })

  return { philosophyMemory, preferences, allPatterns, patternSummaries, topContentTypes, identityProfile, driftReport, timeline, realityOverrides, evolutionAnswers }
}

// ── Output formatter ──────────────────────────────────────────────────────────

function hr(label: string) {
  console.log(`\n${'═'.repeat(70)}`)
  console.log(`  ${label}`)
  console.log('═'.repeat(70))
}

function section(label: string) {
  console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 60 - label.length))}`)
}

function run() {
  for (const scenario of academies) {
    hr(scenario.name)
    const r = runAcademy(scenario)

    // DNA
    section('ACADEMY DNA')
    const d = scenario.dna
    console.log(`  Model:              ${d.inferredModel}`)
    console.log(`  Advancement:        ${d.advancementApproval}`)
    console.log(`  Parent transp:      ${d.parentTransparency}`)

    // Philosophy Memory
    section('PHILOSOPHY MEMORY')
    console.log(`  Total entries:      ${r.philosophyMemory.length}`)
    const memByKey: Record<string, { pos: number; neg: number }> = {}
    for (const e of r.philosophyMemory) {
      if (!memByKey[e.preferenceKey]) memByKey[e.preferenceKey] = { pos: 0, neg: 0 }
      if (e.signal === 'positive') memByKey[e.preferenceKey].pos++
      else memByKey[e.preferenceKey].neg++
    }
    for (const [k, v] of Object.entries(memByKey)) {
      console.log(`  ${k.padEnd(30)} +${v.pos} / -${v.neg}`)
    }

    // Preference Signals
    section('PREFERENCE SIGNALS')
    const meaningful = r.preferences.filter(p => p.confidence !== 'insufficient')
    console.log(`  Meaningful signals: ${meaningful.length} / ${r.preferences.length}`)
    const top = getTopPreferences(r.preferences, 60, 5)
    const avoid = getTopAvoidances(r.preferences, 40, 3)
    if (top.length > 0) {
      console.log('  POSITIVE:')
      for (const p of top) console.log(`    ${p.label.padEnd(28)} score=${p.score}  conf=${p.confidence}  dir=${p.direction}`)
    }
    if (avoid.length > 0) {
      console.log('  AVOIDANCE:')
      for (const p of avoid) console.log(`    ${p.label.padEnd(28)} score=${p.score}  conf=${p.confidence}`)
    }

    // Decision Patterns
    section('DECISION PATTERNS')
    console.log(`  Total decisions:    ${r.allPatterns.length}`)
    const topTypes = r.topContentTypes.slice(0, 5)
    if (topTypes.length > 0) {
      console.log('  Top content types:')
      for (const t of topTypes) console.log(`    ${t.contentType.padEnd(20)} ×${t.count}`)
    }
    const highConfSummaries = r.patternSummaries.filter(s => s.confidence !== 'insufficient')
    for (const s of highConfSummaries.slice(0, 4)) {
      console.log(`  ${s.area.padEnd(24)} total=${s.totalDecisions}  accepted=${s.acceptedCount}  edited=${s.editedCount}`)
    }

    // Identity Profile
    section('IDENTITY PROFILE')
    console.log(`  Overall confidence: ${r.identityProfile.overallConfidence}`)
    console.log(`  Narrative:          ${r.identityProfile.narrative}`)
    console.log('  Dimensions (score / source):')
    for (const dim of r.identityProfile.dimensions) {
      const drift = dim.driftWarning ? ' ⚠ DRIFT' : ''
      console.log(`    ${dim.label.padEnd(28)} ${String(dim.finalScore).padStart(3)}  [${dim.primarySource}]${drift}`)
    }
    if (r.identityProfile.limitations.length > 0) {
      console.log('  Limitations:')
      for (const l of r.identityProfile.limitations) console.log(`    ! ${l}`)
    }

    // Evolution Timeline
    section('EVOLUTION TIMELINE')
    console.log(`  Phases:             ${r.timeline.totalPhases}`)
    console.log(`  Overall theme:      ${r.timeline.overallTheme}`)
    console.log(`  Summary:            ${r.timeline.summaryLine}`)
    for (const phase of r.timeline.phases) {
      console.log(`  ${phase.periodLabel.padEnd(14)} [${phase.activityLevel.padEnd(8)}] ${phase.dominantTheme}  +${phase.curriculumAdded}/-${phase.curriculumRemoved}  adv=${phase.playersAdvanced}`)
    }

    // Drift Report
    section('DRIFT REPORT')
    console.log(`  Detected:           ${r.driftReport.driftDetected}`)
    console.log(`  Severity:           ${r.driftReport.driftSeverity}`)
    console.log(`  Confidence:         ${r.driftReport.confidence}`)
    if (r.driftReport.driftDetected) {
      console.log(`  DONNA message:      ${r.driftReport.donnaMessage}`)
      for (const dd of r.driftReport.driftedDimensions.slice(0, 3)) {
        console.log(`    ↳ ${dd.dimension.padEnd(26)} stated=${dd.statedScore}  observed=${dd.observedScore}  gap=${dd.gap}`)
      }
    }

    // Reality Overrides
    section('REALITY OVERRIDES')
    if (r.realityOverrides.length === 0) {
      console.log('  None.')
    } else {
      for (const ro of r.realityOverrides) {
        console.log(`  [${ro.evidenceStrength}] ${ro.observedReality}`)
        console.log(`    → Contradicts: ${ro.contradictedPhilosophy}`)
        console.log(`    → Action:      ${ro.recommendedAction}`)
      }
    }

    // Evolution Questions
    section('EVOLUTION QUESTION ANSWERS')
    for (const ans of r.evolutionAnswers) {
      console.log(`\n  Q: ${ans.questionText}`)
      console.log(`  A: ${ans.answer}`)
      if (ans.supportingPoints.length > 0) {
        for (const pt of ans.supportingPoints.slice(0, 3)) console.log(`     • ${pt}`)
      }
      console.log(`  Confidence: ${ans.confidence}  |  Missing: ${ans.missingData.length > 0 ? ans.missingData[0] : 'none'}`)
      if (ans.recommendedAction) console.log(`  Action: ${ans.recommendedAction}`)
    }
  }

  // ── Cross-academy summary ─────────────────────────────────────────────────
  hr('CROSS-ACADEMY SIGNAL SUMMARY')
  console.log('\nRunning all 7 academies through pipeline...')
  const results = academies.map(s => ({ name: s.name, ...runAcademy(s) }))

  console.log('\n  Academy                          | PhiloMem | Prefs | Patterns | Drift    | Overrides | EvoQ')
  console.log('  ' + '-'.repeat(100))
  for (const r of results) {
    const meaningful = r.preferences.filter(p => p.confidence !== 'insufficient').length
    console.log(
      `  ${r.name.slice(0, 32).padEnd(33)}` +
      `| ${String(r.philosophyMemory.length).padStart(7)}  ` +
      `| ${String(meaningful).padStart(4)}  ` +
      `| ${String(r.allPatterns.length).padStart(7)}  ` +
      `| ${r.driftReport.driftSeverity.padEnd(8)} ` +
      `| ${String(r.realityOverrides.length).padStart(8)}  ` +
      `| ${r.evolutionAnswers.length}`
    )
  }
}

run()
