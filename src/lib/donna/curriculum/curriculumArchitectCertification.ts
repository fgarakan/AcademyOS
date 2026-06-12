// DONNA Curriculum Architect Certification — Mega Sprint 1836–1865
// 12 mock trials covering the full curriculum architect pipeline.
//
// Run: npx tsx src/lib/donna/curriculum/curriculumArchitectCertification.ts

import { interpretDirectorInput, assembleDraftFromContext, generateArchitectResponse, getUnansweredFields } from './curriculumArchitect'
import { checkForDuplicates } from './curriculumDuplicateDetector'
import { buildImpactPreview } from './curriculumImpactPreview'
import { buildCurriculumGapReport } from './curriculumGapAnalysis'
import { buildCurriculumMemoryEntry } from './curriculumMemory'
import type { CurriculumIntelligenceContext, CurriculumItemSummary, CurriculumLevelSummary, CurriculumGateSummary } from './curriculumIntelligenceContext'
import type { CurriculumDraftObject } from './curriculumDraftObject'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORANGE2_LEVEL: CurriculumLevelSummary = {
  id:              'orange2',
  displayName:     'Orange Ball 2',
  stage:           'orange_development',
  sortOrder:       5,
  itemCount:       3,
  itemCountByType: { drill: 2, game: 1 },
  isEmpty:         false,
  isSparse:        true,
}

const ORANGE1_LEVEL: CurriculumLevelSummary = {
  id:              'orange1',
  displayName:     'Orange Ball 1',
  stage:           'orange_development',
  sortOrder:       4,
  itemCount:       0,
  itemCountByType: {},
  isEmpty:         true,
  isSparse:        false,
}

const GREEN1_LEVEL: CurriculumLevelSummary = {
  id:              'green1',
  displayName:     'Green Ball 1',
  stage:           'green_performance',
  sortOrder:       7,
  itemCount:       6,
  itemCountByType: { drill: 5, game: 1 },
  isEmpty:         false,
  isSparse:        false,
}

const GATE_ORANGE2: CurriculumGateSummary = {
  id:          'gate1',
  fromLevelId: 'orange2',
  toLevelId:   'green1',
  domain:      'serve',
  criterion:   'Consistent first serve placement — 7/10',
  gateType:    'skill',
}

const EXISTING_ITEMS: CurriculumItemSummary[] = [
  // Orange Ball 2
  {
    id:          'item1',
    title:       'Short ball attack drill',
    contentType: 'drill',
    levelId:     'orange2',
    levelName:   'Orange Ball 2',
    domain:      'technical',
  },
  {
    id:          'item2',
    title:       'Crosscourt rally game',
    contentType: 'game',
    levelId:     'orange2',
    levelName:   'Orange Ball 2',
    domain:      'tactical',
  },
  {
    id:          'item3',
    title:       'Baseline consistency drill',
    contentType: 'drill',
    levelId:     'orange2',
    levelName:   'Orange Ball 2',
    domain:      'technical',
  },
  // Green Ball 1 — 5 drills, 1 game, no progressions (drill-heavy, progression gap)
  { id: 'g1', title: 'Forehand drive drill',         contentType: 'drill', levelId: 'green1', levelName: 'Green Ball 1', domain: 'technical' },
  { id: 'g2', title: 'Backhand slice drill',          contentType: 'drill', levelId: 'green1', levelName: 'Green Ball 1', domain: 'technical' },
  { id: 'g3', title: 'Serve placement drill',         contentType: 'drill', levelId: 'green1', levelName: 'Green Ball 1', domain: 'technical' },
  { id: 'g4', title: 'Approach shot drill',           contentType: 'drill', levelId: 'green1', levelName: 'Green Ball 1', domain: 'technical' },
  { id: 'g5', title: 'Rally consistency drill',       contentType: 'drill', levelId: 'green1', levelName: 'Green Ball 1', domain: 'technical' },
  { id: 'g6', title: 'Live ball point play game',     contentType: 'game',  levelId: 'green1', levelName: 'Green Ball 1', domain: 'tactical' },
]

const BASE_CONTEXT: CurriculumIntelligenceContext = {
  academyDna: {
    inferredModel:       'competitive_development',
    playerMix:           'mixed',
    familyPriorities:    'development',
    stagePriorities:     { orange_development: 1, green_performance: 2 },
    priorityEdge:        'coach_judgment',
    advancementApproval: 'director_only',
    parentTransparency:  'standard',
    hasDna:              true,
  },
  levels:          [ORANGE1_LEVEL, ORANGE2_LEVEL, GREEN1_LEVEL],
  gates:           [GATE_ORANGE2],
  pendingOverrides:       [],
  pendingOverrideCount:   0,
  playerByLevel: [
    {
      levelId:                  'orange2',
      levelName:                'Orange Ball 2',
      playerCount:              4,
      advancementEligibleCount: 1,
      improvementSuggestions:   [],
      weakDomains:              ['serve'],
      hasEvidence:              false,
      evidenceSource:           'none',
    },
  ],
  totalPlayerCount:            4,
  advancementEligibleTotal:    1,
  playerIntelligenceAvailable: true,
  memory:          [],
  curriculumItems: EXISTING_ITEMS,
  gapReport: buildCurriculumGapReport(
    [ORANGE1_LEVEL, ORANGE2_LEVEL, GREEN1_LEVEL],
    [GATE_ORANGE2],
    EXISTING_ITEMS,
  ),
  loadedAt:     new Date().toISOString(),
  dataAvailable: true,
  dataGaps:     [],
}

// ── Assertion helpers ─────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) {
    console.log(`  PASS  ${label}`)
    passed++
  } else {
    console.error(`  FAIL  ${label}`)
    failed++
  }
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

function scenario01_addDrill() {
  console.log('\n── 1. Add Drill ──')
  const input = 'Add a short ball drill to Orange Ball 2'
  const interpreted = interpretDirectorInput(input, BASE_CONTEXT)
  const draft = assembleDraftFromContext(interpreted, BASE_CONTEXT)
  const response = generateArchitectResponse(interpreted, draft, BASE_CONTEXT)

  assert('Intent is add',                          interpreted.intent === 'add')
  assert('Content type resolved to drill',         interpreted.inferredContentType === 'drill')
  assert('Level resolved to Orange Ball 2',        interpreted.inferredLevel?.id === 'orange2')
  assert('Draft has levelId',                      !!draft.levelId)
  assert('Response message present',               response.message.length > 0)
  assert('Approval statement included',            response.approvalStatement.length > 0)
}

function scenario02_addSkill() {
  console.log('\n── 2. Add Skill ──')
  const input = 'Add a skill for backhand technique at Orange Ball 2'
  const interpreted = interpretDirectorInput(input, BASE_CONTEXT)
  const draft = assembleDraftFromContext(interpreted, BASE_CONTEXT)

  assert('Intent is add',                          interpreted.intent === 'add')
  assert('Content type resolved to skill',         interpreted.inferredContentType === 'skill')
  assert('Level resolved',                         !!interpreted.inferredLevel)
}

function scenario03_addVocabulary() {
  console.log('\n── 3. Add Vocabulary ──')
  const input = 'Add vocabulary for tactical neutral ball at Orange Ball 2'
  const interpreted = interpretDirectorInput(input, BASE_CONTEXT)

  assert('Intent is add',                          interpreted.intent === 'add')
  assert('Content type is coach_cue',              interpreted.inferredContentType === 'coach_cue')
}

function scenario04_addHomework() {
  console.log('\n── 4. Add Homework ──')
  const input = 'Create homework for Orange Ball 2 serve rhythm'
  const interpreted = interpretDirectorInput(input, BASE_CONTEXT)

  assert('Intent is add',                          interpreted.intent === 'add')
  assert('Content type is player_mission',         interpreted.inferredContentType === 'player_mission')
  assert('Level resolved to Orange Ball 2',        interpreted.inferredLevel?.id === 'orange2')
}

function scenario05_improveGate() {
  console.log('\n── 5. Improve Gate ──')
  const input = 'Improve the Orange Ball 2 exit gate for serve'
  const interpreted = interpretDirectorInput(input, BASE_CONTEXT)

  assert('Intent is modify or add',                interpreted.intent === 'modify' || interpreted.intent === 'add')
  assert('Content type is assessment',             interpreted.inferredContentType === 'assessment')
}

function scenario06_createProgression() {
  console.log('\n── 6. Create Progression ──')
  const input = 'Create a progression for approach shots at Orange Ball 2'
  const interpreted = interpretDirectorInput(input, BASE_CONTEXT)

  assert('Intent is add or expand',                interpreted.intent === 'add' || interpreted.intent === 'expand')
  assert('Content type is progression',            interpreted.inferredContentType === 'progression')
  assert('Level resolved',                         !!interpreted.inferredLevel)
}

function scenario07_duplicateRisk() {
  console.log('\n── 7. Duplicate Risk Detection ──')
  const draft: CurriculumDraftObject = {
    intent:          'add',
    title:           'Short ball attack drill',
    contentType:     'drill',
    levelId:         'orange2',
    levelName:       'Orange Ball 2',
    coachingCues:    [],
    commonErrors:    [],
    successCriteria: [],
    progressions:    [],
    regressions:     [],
  }

  const result = checkForDuplicates(draft, EXISTING_ITEMS)

  assert('Duplicate risk is possible or likely',   result.risk !== 'none')
  assert('Match found for existing item',          result.matches.length > 0)
  assert('Matched field present',                  !!result.matchedField)
  assert('Explanation generated',                  result.explanation.length > 0)
}

function scenario08_unclearLocation() {
  console.log('\n── 8. Unclear Location — Clarification Required ──')
  const input = 'Add a drill for approaching short balls'
  const interpreted = interpretDirectorInput(input, BASE_CONTEXT)
  const draft = assembleDraftFromContext(interpreted, BASE_CONTEXT)
  const unanswered = getUnansweredFields(draft)

  // Level is not in text — should surface a clarification question
  if (!interpreted.inferredLevel) {
    assert('Unanswered field asks for level',       unanswered.some(f => f.fieldId === 'level'))
  } else {
    // If level was inferred from a different signal, draft should still be complete or near-complete
    assert('Draft has level or clarification asked', !!draft.levelId || unanswered.some(f => f.fieldId === 'level'))
  }
}

function scenario09_permissionBoundary() {
  console.log('\n── 9. Permission Boundary ──')
  // saveCurriculumDraftAction enforces director/head_coach role server-side.
  // Verify the structural contract: intent 'add' requires levelId and title.
  const draft: CurriculumDraftObject = {
    intent:          'add',
    title:           '',
    contentType:     'drill',
    coachingCues:    [],
    commonErrors:    [],
    successCriteria: [],
    progressions:    [],
    regressions:     [],
  }
  const unanswered = getUnansweredFields(draft)
  assert('Empty title surfaces as unanswered',     unanswered.some(f => f.fieldId === 'title'))
  assert('Missing level surfaces as unanswered',   unanswered.some(f => f.fieldId === 'level'))
}

function scenario10_academySpecificSave() {
  console.log('\n── 10. Academy-Specific Save ──')
  // Verify mapDraftObjectToCreateInput produces a valid save-ready input.
  const { mapDraftObjectToCreateInput } = require('./curriculumDraftObject')
  const draft: CurriculumDraftObject = {
    intent:          'add',
    title:           'Test Drill',
    contentType:     'drill',
    levelId:         'orange2',
    levelName:       'Orange Ball 2',
    purpose:         'Build approach shot confidence',
    setup:           'Half court, one feeder',
    instructions:    'Feed short, player attacks',
    coachingCues:    ['Stay low', 'Open stance'],
    commonErrors:    ['Hitting up on ball'],
    successCriteria: ['7/10 winners'],
    progressions:    ['Add movement'],
    regressions:     ['Slow feed'],
    relatedSkills:   ['approach shot', 'footwork'],
  }
  const input = mapDraftObjectToCreateInput(draft)
  assert('Title mapped',                           input.title === 'Test Drill')
  assert('ContentType mapped',                     !!input.contentType)
  assert('Description includes PURPOSE',           (input.description ?? '').includes('PURPOSE:'))
  assert('Description includes SETUP',             (input.description ?? '').includes('SETUP:'))
  assert('Description includes INSTRUCTIONS',      (input.description ?? '').includes('INSTRUCTIONS:'))
  assert('CoachCues mapped',                       (input.coachCues ?? []).length === 2)
  assert('SuccessCriteria mapped',                 (input.successCriteria ?? []).length === 1)
}

function scenario11_curriculumMemoryWrite() {
  console.log('\n── 11. Curriculum Memory Write ──')
  const entry = buildCurriculumMemoryEntry({
    intent:            'add',
    levelId:           'orange2',
    levelName:         'Orange Ball 2',
    contentType:       'drill',
    changeDescription: 'Added drill: Short ball attack at Orange Ball 2',
    reason:            'Addresses weak approach shot signal from player evidence',
  })

  assert('Memory entry has id',                    !!entry.id)
  assert('Category is recommendation_outcome',     entry.category === 'recommendation_outcome')
  assert('Intent recorded',                        entry.intent === 'add')
  assert('Level recorded',                         entry.levelId === 'orange2')
  assert('Change description recorded',            entry.changeDescription.length > 0)
  assert('createdAt is ISO string',                !!Date.parse(entry.createdAt))
}

function scenario12_curriculumBloatPrevention() {
  console.log('\n── 12. Curriculum Bloat Prevention ──')
  // Scenario: Director tries to add a drill that is essentially identical to
  // an existing item at the same level. DONNA should detect it as a likely
  // duplicate and recommend improving the existing item.

  const draft: CurriculumDraftObject = {
    intent:          'add',
    title:           'Short ball attacking drill',   // Very close to "Short ball attack drill"
    contentType:     'drill',
    levelId:         'orange2',
    levelName:       'Orange Ball 2',
    purpose:         'Attack short balls crosscourt',
    coachingCues:    [],
    commonErrors:    [],
    successCriteria: [],
    progressions:    [],
    regressions:     [],
  }

  const result = checkForDuplicates(draft, EXISTING_ITEMS)

  assert('Duplicate risk detected',                result.risk !== 'none')
  assert('Recommendation is improve or keep',      result.recommendation !== 'no_action')
  assert('Existing item identified in matches',    result.matches.some(m => m.itemTitle.toLowerCase().includes('short ball')))

  // Impact preview should also surface the duplicate warning
  const impact = buildImpactPreview(draft, {
    ...BASE_CONTEXT,
    levels: [{ ...ORANGE2_LEVEL, itemCountByType: { drill: 3, game: 1 }, itemCount: 4 }],
  })
  assert('Impact preview generated',              impact.expectedBenefit.length > 0 || impact.possibleRisk.length > 0)
  assert('Impact possible risk has content',       impact.possibleRisk.length > 0)
}

// ── Gap analysis spot check ───────────────────────────────────────────────────

function gapAnalysisCheck() {
  console.log('\n── Gap Analysis Structural Check ──')
  const report = buildCurriculumGapReport(
    [ORANGE1_LEVEL, ORANGE2_LEVEL, GREEN1_LEVEL],
    [GATE_ORANGE2],
    EXISTING_ITEMS,
  )

  assert('Missing area detected for Orange Ball 1', report.missingAreas.some(g => g.levelId === 'orange1'))
  assert('Drill-heavy level detected for Green Ball 1', report.drillHeavyLevels.some(g => g.levelId === 'green1'))
  assert('Progression gap detected for Green Ball 1', report.progressionGaps.some(g => g.levelId === 'green1'))
  assert('totalGapCount is a number',              typeof report.totalGapCount === 'number')
  assert('priorityLevels present',                 report.priorityLevels.length > 0)
  assert('computedAt is ISO string',               !!Date.parse(report.computedAt))
}

// ── Run ───────────────────────────────────────────────────────────────────────

scenario01_addDrill()
scenario02_addSkill()
scenario03_addVocabulary()
scenario04_addHomework()
scenario05_improveGate()
scenario06_createProgression()
scenario07_duplicateRisk()
scenario08_unclearLocation()
scenario09_permissionBoundary()
scenario10_academySpecificSave()
scenario11_curriculumMemoryWrite()
scenario12_curriculumBloatPrevention()
gapAnalysisCheck()

console.log(`\n${'─'.repeat(52)}`)
console.log(`Curriculum Architect Certification: ${passed} / ${passed + failed} passed`)
if (failed === 0) {
  console.log('ALL PASS\n')
} else {
  console.error(`${failed} FAILED\n`)
  process.exit(1)
}
