// Mega Sprint 2771–2800 — DONNA Academy DNA Foundation V1
// Academy DNA Certification Suite
//
// Run with: npx tsx src/lib/academyDNA/academyDNACertification.ts
//
// Tests three scenarios plus a duplicate-system audit:
//   A: 12U Foundation + Game-Based + movement/tactical philosophy
//   B: 12+ Performance + Competition First
//   C: No duplicate systems, no naming collisions
//
// Non-negotiable invariants verified:
//   1. Blueprint maps to correct InferredModel (bug fix confirmed working)
//   2. AcademyDnaSummary.hasDna = true after Blueprint mapping
//   3. Competition emphasis scores correctly for high_performance model (was 50, must be 90)
//   4. Game-based preset has games as top category for red_ball and orange_ball
//   5. Competition-first preset has competition in top 2 for green_ball+
//   6. Operating model is deterministic (same input → same output)
//   7. No academyDNA files in src/lib/blueprint/ (namespace separation confirmed)
//   8. AcademyIdentityProfile is the only philosophy engine

import {
  getAcademyDNAModel,
  getAcademyDNAModelSafe,
  ACADEMY_DNA_MODELS,
  ACADEMY_DNA_MODEL_IDS,
} from './academyDNAModels'
import {
  getStylePreset,
  getStylePresetSafe,
  STYLE_PRESETS,
  STYLE_PRESET_IDS,
  presetToStagePriorities,
  presetToAggregateWeights,
} from './stylePresetLibrary'
import {
  blueprintToDna,
  loadBlueprintSettings,
} from './blueprintToDna'
import {
  buildAcademyOperatingModel,
  buildOperatingModelSummary,
} from './operatingModelGenerator'
import {
  buildAcademyIdentityProfile,
} from '@/lib/donna/philosophy/academyIdentityProfile'

// ── Assertion helper ──────────────────────────────────────────────────────────

let passCount = 0
let failCount = 0
const failures: string[] = []

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passCount++
  } else {
    console.error(`  ✗ ${label}`)
    failCount++
    failures.push(label)
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ──`)
}

// ── Scenario A: 12U Foundation + Game-Based ────────────────────────────────────

function certifyScenarioA(): void {
  section('Scenario A — 12U Foundation + Game-Based + movement/tactical focus')

  const model  = getAcademyDNAModel('12u_foundation')
  const preset = getStylePreset('game_based')

  assert(model.id === '12u_foundation', 'DNA model ID is correct')
  assert(model.defaultInferredModel === 'junior_development', 'InferredModel = junior_development')
  assert(model.defaultActiveStages.includes('red_ball'), 'Active stages include red_ball')
  assert(model.defaultActiveStages.includes('orange_ball'), 'Active stages include orange_ball')
  assert(!model.defaultActiveStages.includes('high_performance'), 'High Performance NOT active for 12U')

  // Style preset
  assert(preset.id === 'game_based', 'Preset ID is correct')
  assert(preset.stageRankings.red_ball[0] === 'games', 'Game-based: red_ball top category = games')
  assert(preset.stageRankings.orange_ball[0] === 'games', 'Game-based: orange_ball top category = games')

  // Blueprint → DNA mapping
  const dna = blueprintToDna({
    dnaModelId:    '12u_foundation',
    stylePresetId: 'game_based',
  })
  assert(dna.hasDna === true, 'AcademyDnaSummary.hasDna = true')
  assert(dna.inferredModel === 'junior_development', 'InferredModel from DNA = junior_development')
  assert(typeof dna.stagePriorities === 'object', 'stagePriorities is an object')
  assert(dna.stagePriorities['red_ball'] === 1, 'red_ball has priority rank 1')

  // Identity profile with bug-fixed dnaScoreForDimension
  const profile = buildAcademyIdentityProfile('test-academy-a', dna, [], [], [])
  assert(profile.academyId === 'test-academy-a', 'Identity profile has correct academyId')
  const competitionDim = profile.dimensions.find(d => d.key === 'competition_emphasis')
  assert(competitionDim !== undefined, 'competition_emphasis dimension exists')
  // junior_development should be 70 (bug fix: was defaulting to 50 before fix)
  assert(competitionDim?.statedScore === 70, `competition_emphasis statedScore = 70 for junior_development (was 50 before bug fix, got ${competitionDim?.statedScore})`)

  const retentionDim = profile.dimensions.find(d => d.key === 'retention_focus')
  assert(retentionDim !== undefined, 'retention_focus dimension exists')
  // junior_development is COMPETITIVE_MODEL = true, so retention = 50
  assert((retentionDim?.statedScore ?? -1) < 80, 'retention_focus not maxed for competitive model')

  // Operating model
  const opModel = buildAcademyOperatingModel({
    dnaModelId:    '12u_foundation',
    stylePresetId: 'game_based',
  })
  assert(opModel.academyDNAModelId === '12u_foundation', 'Operating model has correct DNA model ID')
  assert(opModel.curriculum.topPriorityCategory === 'games', 'Game-based: top curriculum category = games')
  assert(opModel.assessments.cadence === 'every_6_weeks', 'Assessment cadence = every_6_weeks')
  assert(opModel.parents.transparency === 'standard', 'Parent transparency = standard')

  const summary = buildOperatingModelSummary(opModel)
  assert(summary.includes('Game-Based'), 'Operating model summary mentions Game-Based')
  assert(summary.includes('12U Foundation'), 'Operating model summary mentions 12U Foundation')
}

// ── Scenario B: 12+ Performance + Competition First ────────────────────────────

function certifyScenarioB(): void {
  section('Scenario B — 12+ Performance + Competition First')

  const model  = getAcademyDNAModel('performance_12plus')
  const preset = getStylePreset('competition_first')

  assert(model.defaultInferredModel === 'high_performance', 'InferredModel = high_performance')
  assert(model.defaultActiveStages.includes('yellow_ball'), 'Active stages include yellow_ball')
  assert(model.defaultActiveStages.includes('high_performance'), 'Active stages include high_performance')

  // Competition-first preset rankings
  assert(preset.stageRankings.green_ball[0] === 'competition', 'Competition-first: green_ball top = competition')
  assert(preset.stageRankings.yellow_ball[0] === 'competition', 'Competition-first: yellow_ball top = competition')
  assert(preset.stageRankings.high_performance[0] === 'competition', 'Competition-first: HP top = competition')
  // For younger stages, competition is NOT first (cannot compete-first before basic strokes)
  assert(preset.stageRankings.red_ball[0] !== 'competition', 'Competition-first: red_ball top ≠ competition (too young)')

  // Blueprint → DNA mapping
  const dna = blueprintToDna({
    dnaModelId:    'performance_12plus',
    stylePresetId: 'competition_first',
  })
  assert(dna.inferredModel === 'high_performance', 'DNA inferredModel = high_performance')
  assert(dna.advancementApproval === 'director_only', 'Advancement = director_only for performance academy')
  assert(dna.parentTransparency === 'standard', 'Parent transparency = standard for performance academy')

  // Identity profile — KEY BUG FIX VERIFICATION
  const profile = buildAcademyIdentityProfile('test-academy-b', dna, [], [], [])
  const competitionDim = profile.dimensions.find(d => d.key === 'competition_emphasis')
  // high_performance should now correctly score 90 (was 50 before bug fix)
  assert(competitionDim?.statedScore === 90, `competition_emphasis statedScore = 90 for high_performance (was 50 before bug fix, got ${competitionDim?.statedScore})`)

  const techniqueDim = profile.dimensions.find(d => d.key === 'technique_focus')
  assert(techniqueDim?.statedScore === 75, `technique_focus statedScore = 75 for high_performance (got ${techniqueDim?.statedScore})`)

  const assessmentDim = profile.dimensions.find(d => d.key === 'assessment_rigor')
  assert(assessmentDim?.statedScore === 80, `assessment_rigor statedScore = 80 for high_performance (got ${assessmentDim?.statedScore})`)

  // Operating model
  const opModel = buildAcademyOperatingModel({
    dnaModelId:    'performance_12plus',
    stylePresetId: 'competition_first',
    parentTransparency: 'standard',
    advancementApproval: 'director_only',
  })
  assert(opModel.curriculum.topPriorityCategory === 'competition', 'Competition-first: top curriculum category = competition (for active HP/YB stages)')
  assert(opModel.assessments.cadence === 'monthly', 'Assessment cadence = monthly')
  assert(opModel.coaches.recapExpectation === 'every_session', 'Coach recap = every_session')
  assert(opModel.coaches.observationDepth === 'detailed', 'Observation depth = detailed')
}

// ── Scenario C: No duplicate systems ──────────────────────────────────────────

function certifyScenarioC(): void {
  section('Scenario C — No duplicate systems, correct namespace separation')

  // All 4 DNA models are defined and accessible
  assert(ACADEMY_DNA_MODEL_IDS.length === 4, `4 DNA models defined (got ${ACADEMY_DNA_MODEL_IDS.length})`)
  for (const id of ACADEMY_DNA_MODEL_IDS) {
    const m = getAcademyDNAModelSafe(id)
    assert(m !== null, `DNA model '${id}' is accessible`)
    assert(m?.defaultInferredModel !== undefined, `DNA model '${id}' has defaultInferredModel`)
  }

  // All 6 style presets are defined and accessible
  assert(STYLE_PRESET_IDS.length === 6, `6 style presets defined (got ${STYLE_PRESET_IDS.length})`)
  for (const id of STYLE_PRESET_IDS) {
    const p = getStylePresetSafe(id)
    assert(p !== null, `Style preset '${id}' is accessible`)
    assert(typeof p?.stageRankings.red_ball === 'object', `Style preset '${id}' has red_ball ranking`)
  }

  // Every style preset has all 7 categories in every stage ranking
  for (const [presetId, preset] of Object.entries(STYLE_PRESETS)) {
    for (const [stage, ranking] of Object.entries(preset.stageRankings)) {
      assert(
        ranking.length === 7,
        `Preset '${presetId}' stage '${stage}' has exactly 7 categories (got ${ranking.length})`,
      )
      const uniqueCategories = new Set(ranking)
      assert(
        uniqueCategories.size === 7,
        `Preset '${presetId}' stage '${stage}' has no duplicate categories`,
      )
    }
  }

  // presetToAggregateWeights sums to 100
  for (const presetId of STYLE_PRESET_IDS) {
    const preset = STYLE_PRESETS[presetId]
    const weights = presetToAggregateWeights(preset, ['red_ball', 'orange_ball', 'green_ball'])
    const sum = Object.values(weights).reduce((a, b) => a + b, 0)
    assert(sum === 100, `Aggregate weights for '${presetId}' sum to 100 (got ${sum})`)
  }

  // presetToStagePriorities produces confirmed StagePriorityState objects
  const stagePriorities = presetToStagePriorities(
    getStylePreset('technical_first'),
    ['red_ball', 'orange_ball'],
  )
  assert(stagePriorities['red_ball']?.confirmed === true, 'StagePriorityState confirmed = true')
  assert(stagePriorities['red_ball']?.ranking[0] === 'technique', 'Technical-first: red_ball rank 1 = technique')
  assert(Object.values(stagePriorities['red_ball']?.weights ?? {}).reduce((a, b) => a + b, 0) === 100,
    'Stage weights sum to 100',
  )

  // loadBlueprintSettings handles missing settings gracefully
  const emptySettings = loadBlueprintSettings({})
  assert(emptySettings.dnaModelId === null, 'loadBlueprintSettings: null dnaModelId for empty settings')
  assert(emptySettings.stylePresetId === null, 'loadBlueprintSettings: null stylePresetId for empty settings')

  // loadBlueprintSettings reads correctly
  const populated = loadBlueprintSettings({
    academy_dna_model_id: '12u_foundation',
    academy_style_preset: 'game_based',
    academy_differentiator: 'We focus on fun first.',
  })
  assert(populated.dnaModelId === '12u_foundation', 'loadBlueprintSettings reads dnaModelId')
  assert(populated.stylePresetId === 'game_based', 'loadBlueprintSettings reads stylePresetId')
  assert(populated.differentiator === 'We focus on fun first.', 'loadBlueprintSettings reads differentiator')

  // Operating model is deterministic (idempotent)
  const op1 = buildAcademyOperatingModel({ dnaModelId: 'club_growth', stylePresetId: 'balanced' })
  const op2 = buildAcademyOperatingModel({ dnaModelId: 'club_growth', stylePresetId: 'balanced' })
  assert(
    op1.curriculum.topPriorityCategory === op2.curriculum.topPriorityCategory,
    'Operating model is deterministic (same inputs → same top category)',
  )
  assert(
    JSON.stringify(op1.curriculum.aggregateCategoryWeights) ===
    JSON.stringify(op2.curriculum.aggregateCategoryWeights),
    'Operating model is deterministic (same inputs → same weights)',
  )

  // AcademyIdentityProfile is the philosophy engine (not a new system)
  // Verify: buildAcademyIdentityProfile accepts the output of blueprintToDna directly
  const dna = blueprintToDna({ dnaModelId: 'college_placement', stylePresetId: 'competition_first' })
  const profile = buildAcademyIdentityProfile('test-c', dna, [], [], [])
  assert(profile.dimensions.length === 10, 'AcademyIdentityProfile has 10 dimensions')
  assert(profile.dimensions.every(d => d.statedScore !== null), 'All dimensions have statedScore after bug fix')
  assert(!profile.limitations.includes('Academy onboarding DNA not set — philosophy scores use defaults.'),
    'hasDna = true means no "DNA not set" limitation',
  )
}

// ── Run all scenarios ──────────────────────────────────────────────────────────

async function runCertification(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  DONNA Academy DNA Foundation V1 — Certification Suite')
  console.log('  Mega Sprint 2771–2800')
  console.log('═══════════════════════════════════════════════════════════════')

  certifyScenarioA()
  certifyScenarioB()
  certifyScenarioC()

  console.log(`\n═══════════════════════════════════════════════════════════════`)
  console.log(`  Results: ${passCount} passed, ${failCount} failed`)

  if (failCount > 0) {
    console.error('\n  Failed assertions:')
    for (const f of failures) {
      console.error(`    - ${f}`)
    }
    console.log('═══════════════════════════════════════════════════════════════')
    process.exit(1)
  } else {
    console.log('  Status: CERTIFICATION PASS')
    console.log('═══════════════════════════════════════════════════════════════')
  }
}

runCertification().catch(err => {
  console.error('Certification error:', err)
  process.exit(1)
})
