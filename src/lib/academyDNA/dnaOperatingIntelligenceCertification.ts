// Mega Sprint 2801–2830 — DONNA Academy Operating Intelligence V1
// DNA Operating Intelligence Certification Suite
//
// Run with: npx tsx src/lib/academyDNA/dnaOperatingIntelligenceCertification.ts
//
// Three scenarios + COO question suite:
//   A: 12U Foundation + Game-Based + same sample signals
//      → education-heavy priorities, parent communication emphasis, long-term language
//   B: 12+ Performance + Competition First + same sample signals
//      → accountability priorities, assessment urgency, advancement pipeline
//   C: Same data, different DNA
//      → verifies recommendations diverge between models
//   COO: 8 director questions — all answerable from DNA context

import { buildOperatingModelContext } from './operatingModelContext'
import {
  buildDnaAwareRecommendations,
  answerCOOQuestion,
  type AcademySignals,
} from './dnaRecommendationEngine'
import {
  buildDnaTodayContext,
} from './dnaTodayInfluence'
import {
  buildDnaCurriculumBias,
  evaluateCurriculumAlignment,
} from './dnaCurriculumBias'
import {
  evaluateCoachDnaAlignment,
  buildCoachAlignmentSummary,
} from './dnaCoachAlignment'
import {
  buildDnaParentCommsGuidance,
  buildParentCommOpportunityGuidance,
} from './dnaParentCommsStyle'
import type { CurriculumLevelSummary } from '@/lib/donna/curriculum/curriculumIntelligenceContext'

// ── Assertion helpers ─────────────────────────────────────────────────────────

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

// ── Shared sample signals (same for all scenarios) ────────────────────────────

const SAMPLE_SIGNALS: AcademySignals = {
  activePlayers:           24,
  stalledPlayerCount:       3,
  attentionCount:           2,
  advancementReadyCount:    4,
  reassessmentDueCount:     5,
  coachRecapMissingCount:   2,
  parentUpdatesPending:     3,
  curriculumGapCount:       1,
  totalPendingReviews:      6,
  averageAttendanceRate:    0.82,
  enrollmentTrend:          'stable',
  daysSinceLastAssessment:  38,
  unassignedPlayerCount:    1,
}

// ── Scenario A: 12U Foundation + Game-Based ───────────────────────────────────

function certifyScenarioA(): void {
  section('Scenario A — 12U Foundation + Game-Based (education-heavy, retention priorities)')

  const ctx = buildOperatingModelContext({
    dnaModelId:    '12u_foundation',
    stylePresetId: 'game_based',
  })

  // Context structure
  assert(ctx.hasDna === true,                        'Operating context hasDna = true')
  assert(ctx.dnaModelId === '12u_foundation',        'DNA model ID correct')
  assert(ctx.stylePresetId === 'game_based',         'Style preset ID correct')
  assert(ctx.curriculumPriorities.topCategory === 'games', 'Top curriculum category = games')
  assert(ctx.donnaAssumptions.cooPersona.includes('Retention'),    'COO persona is retention-focused')
  assert(ctx.parentStandards.languageStyle === 'educational',      'Parent language style = educational')
  assert(ctx.coachStandards.recapExpectation === 'every_session',  'Coach recap expectation = every_session')

  // Recommendations: parent and coach recaps should be TOP priorities
  const recs = buildDnaAwareRecommendations(ctx, SAMPLE_SIGNALS)
  assert(recs.length > 0, 'Recommendations produced')

  const topRec = recs[0]!
  assert(
    topRec.domain === 'coaches' || topRec.domain === 'parents',
    `Top recommendation domain is coaches or parents (got: ${topRec.domain}) — retention model leads with these`,
  )
  assert(
    topRec.dnaAlignment.includes('DNA tendency') || topRec.dnaAlignment.includes('DNA'),
    'Top recommendation includes explicit DNA alignment text',
  )
  assert(
    topRec.trace.dataSignals.length > 0,
    'Top recommendation trace has data signals',
  )

  // Language should NOT be "assessment overdue" first (that's performance model)
  const firstRecHint = recs[0]?.recommendation.toLowerCase() ?? ''
  assert(
    !firstRecHint.includes('advancement pipeline') && !firstRecHint.includes('assessment compliance'),
    'First recommendation does NOT lead with assessment pipeline (wrong model language)',
  )

  // Long-term development language
  assert(
    ctx.curriculumPriorities.progressionLanguage.includes('long-term'),
    'Progression language includes long-term development',
  )

  // Parent communication guidance
  const parentGuidance = buildDnaParentCommsGuidance(ctx)
  assert(parentGuidance.languageStyle === 'educational',                     'Parent guidance language style = educational')
  assert(parentGuidance.avoidTopics.includes('Ranking among peers'),         'Avoids peer ranking in parent comms')
  assert(parentGuidance.examplePhrases.some(p => p.includes('love having')), 'Parent comms include warm community phrases')
  assert(parentGuidance.toneDescription.includes('Warm'),                    'Tone description is warm and encouraging')

  // Coach standards check
  assert(ctx.coachStandards.alignmentChecks.some(c => c.includes('enjoyment')), 'Coach alignment checks include enjoyment signals')
  assert(ctx.coachStandards.misalignmentSignals.some(s => s.includes('engagement')), 'Misalignment signals include engagement gaps')

  // Assessment language
  assert(ctx.assessmentStandards.assessmentLanguage.includes('celebration'), 'Assessment framed as celebration checkpoint')

  // Today context
  const todayCtx = buildDnaTodayContext([], ctx, SAMPLE_SIGNALS)
  assert(todayCtx.dnaAdditions.length >= 0, 'Today additions computed without error')
  assert(todayCtx.dnaInfluenceSummary.includes('12U Foundation'), 'Today influence summary names the DNA model')

  // COO question: DNA alignment
  const dnaQ = answerCOOQuestion('dna_alignment', ctx, SAMPLE_SIGNALS, recs)
  assert(dnaQ.answer.includes('12U Foundation') || dnaQ.answer.includes('Retention'), 'DNA alignment answer references foundation model or retention')

  console.log(`  [Scenario A top rec]: ${recs[0]?.recommendation ?? '—'}`)
}

// ── Scenario B: 12+ Performance + Competition First ───────────────────────────

function certifyScenarioB(): void {
  section('Scenario B — 12+ Performance + Competition First (accountability, assessment urgency)')

  const ctx = buildOperatingModelContext({
    dnaModelId:    'performance_12plus',
    stylePresetId: 'competition_first',
  })

  // Context structure
  assert(ctx.donnaAssumptions.cooPersona.includes('Performance'), 'COO persona is performance-focused')
  assert(ctx.parentStandards.languageStyle === 'accountability',  'Parent language style = accountability')
  assert(ctx.coachStandards.observationDepth === 'detailed',      'Coach observation depth = detailed')
  assert(ctx.assessmentStandards.overdueThresholdDays === 45,     `Assessment overdue threshold = 45 days (got: ${ctx.assessmentStandards.overdueThresholdDays})`)

  // Recommendations: assessment and advancement should be TOP priorities
  const recs = buildDnaAwareRecommendations(ctx, SAMPLE_SIGNALS)
  assert(recs.length > 0, 'Recommendations produced')

  const topRec = recs[0]!
  assert(
    topRec.domain === 'assessments' || topRec.domain === 'players',
    `Top recommendation domain is assessments or players (got: ${topRec.domain}) — performance model leads here`,
  )
  assert(
    topRec.dnaAlignment.includes('DNA tendency') || topRec.dnaAlignment.includes('DNA'),
    'Top recommendation includes explicit DNA alignment text',
  )

  // Performance model should surface advancement-ready signal early
  const recIds = recs.map(r => r.id)
  assert(
    recIds.includes('perf-advancement-ready') || recIds.includes('perf-assessment-overdue'),
    'Performance model recs include advancement-ready or assessment-overdue',
  )

  // Language should be accountability / assessment
  const hasAccountabilityLanguage = recs.some(r =>
    r.recommendation.toLowerCase().includes('assessment') ||
    r.recommendation.toLowerCase().includes('advancement') ||
    r.recommendation.toLowerCase().includes('accountability'),
  )
  assert(hasAccountabilityLanguage, 'Recommendations include assessment/advancement/accountability language')

  // Parent comms: accountability style
  const parentGuidance = buildDnaParentCommsGuidance(ctx)
  assert(parentGuidance.languageStyle === 'accountability',                        'Parent guidance language style = accountability')
  assert(parentGuidance.progressFraming.includes('assessment'),                    'Progress framing references assessment data')
  assert(!parentGuidance.avoidTopics.includes('Ranking among peers'),              'Performance model does not avoid assessment score language')
  assert(parentGuidance.examplePhrases.some(p => p.includes('Assessment results')), 'Example phrases include assessment results language')

  // Coach alignment standards
  assert(ctx.coachStandards.alignmentChecks.some(c => c.includes('Advancement')), 'Coach alignment checks include advancement flagging')
  assert(ctx.coachStandards.misalignmentSignals.some(s => s.includes('Recap')),   'Misalignment signals include recap gaps')

  // Assessment framing
  assert(ctx.assessmentStandards.assessmentLanguage.includes('professional'),  'Assessment framed as professional standards')

  // COO: coach alignment question
  const coachQ = answerCOOQuestion('coach_alignment', ctx, SAMPLE_SIGNALS, recs)
  assert(
    coachQ.answer.includes('every_session') || coachQ.answer.includes('detailed') || coachQ.answer.includes('recap'),
    'Coach alignment answer references performance recap standards',
  )

  // COO: biggest risk
  const riskQ = answerCOOQuestion('biggest_risk', ctx, SAMPLE_SIGNALS, recs)
  assert(riskQ.answer.length > 10, 'Biggest risk answer is non-trivial')
  assert(
    riskQ.answer.toLowerCase().includes('assessment') || riskQ.answer.toLowerCase().includes('advancement') || riskQ.answer.toLowerCase().includes('stall'),
    'Biggest risk for performance model involves assessment, advancement, or stalls',
  )

  console.log(`  [Scenario B top rec]: ${recs[0]?.recommendation ?? '—'}`)
}

// ── Scenario C: Same data, different DNA → different recommendations ──────────

function certifyScenarioC(): void {
  section('Scenario C — Same data, different DNA → different recommendations')

  const ctxFoundation   = buildOperatingModelContext({ dnaModelId: '12u_foundation',    stylePresetId: 'game_based' })
  const ctxPerformance  = buildOperatingModelContext({ dnaModelId: 'performance_12plus', stylePresetId: 'competition_first' })
  const ctxClubGrowth   = buildOperatingModelContext({ dnaModelId: 'club_growth',        stylePresetId: 'balanced' })
  const ctxCollege      = buildOperatingModelContext({ dnaModelId: 'college_placement',  stylePresetId: 'competition_first' })

  const recsFoundation  = buildDnaAwareRecommendations(ctxFoundation,  SAMPLE_SIGNALS)
  const recsPerformance = buildDnaAwareRecommendations(ctxPerformance, SAMPLE_SIGNALS)
  const recsClubGrowth  = buildDnaAwareRecommendations(ctxClubGrowth,  SAMPLE_SIGNALS)
  const recsCollege     = buildDnaAwareRecommendations(ctxCollege,     SAMPLE_SIGNALS)

  // Top recommendations must differ
  const topFoundation  = recsFoundation[0]?.id  ?? ''
  const topPerformance = recsPerformance[0]?.id ?? ''
  const topClubGrowth  = recsClubGrowth[0]?.id  ?? ''

  assert(topFoundation !== topPerformance,  `12U Foundation top rec differs from Performance top rec (${topFoundation} vs ${topPerformance})`)
  assert(topClubGrowth !== topPerformance,  `Club Growth top rec differs from Performance top rec (${topClubGrowth} vs ${topPerformance})`)

  // DNA alignment text differs
  const dnaFoundation  = recsFoundation[0]?.dnaAlignment  ?? ''
  const dnaPerformance = recsPerformance[0]?.dnaAlignment ?? ''
  assert(dnaFoundation !== dnaPerformance, 'DNA alignment text differs between Foundation and Performance models')

  // COO answers differ by model
  const attnFoundation  = answerCOOQuestion('attention', ctxFoundation,  SAMPLE_SIGNALS, recsFoundation)
  const attnPerformance = answerCOOQuestion('attention', ctxPerformance, SAMPLE_SIGNALS, recsPerformance)
  assert(attnFoundation.answer !== attnPerformance.answer, 'COO "attention" answer differs between Foundation and Performance')

  // DNA-specific language in each model
  assert(
    recsFoundation.some(r => r.recommendation.toLowerCase().includes('parent') || r.recommendation.toLowerCase().includes('recap')),
    '12U Foundation recs include parent/recap language',
  )
  assert(
    recsPerformance.some(r =>
      r.recommendation.toLowerCase().includes('assessment') ||
      r.recommendation.toLowerCase().includes('advancement')),
    'Performance recs include assessment/advancement language',
  )
  assert(
    recsCollege.some(r => r.recommendation.toLowerCase().includes('stalled') || r.recommendation.toLowerCase().includes('stagnating')),
    'College placement recs flag stagnation (recruiting urgency)',
  )

  // College top stagnation rec should be 'critical' with SAMPLE_SIGNALS.stalledPlayerCount = 3
  const collegeStalledRec = recsCollege.find(r => r.id === 'college-utr-stagnation')
  assert(collegeStalledRec !== undefined, 'College model has UTR stagnation recommendation')
  assert(collegeStalledRec?.priority === 'critical', 'College model marks stagnation as critical (was: ' + collegeStalledRec?.priority + ')')

  // Foundation stall rec should NOT be critical — it's medium (engagement, not gate)
  const foundationStalledRec = recsFoundation.find(r => r.id === 'foundation-player-stall')
  assert(foundationStalledRec !== undefined, 'Foundation model has stall recommendation')
  assert(
    foundationStalledRec?.priority === 'medium',
    `Foundation model stall is medium priority (got: ${foundationStalledRec?.priority}) — engagement lens, not advancement lens`,
  )

  // Trace explainability
  const trace = recsPerformance[0]?.trace
  assert(trace !== undefined, 'Recommendation trace exists')
  assert((trace?.dataSignals.length ?? 0) > 0, 'Trace has data signals')
  assert((trace?.academyDNAInfluence.length ?? 0) > 0, 'Trace has DNA influence text')
  assert((trace?.rationale.length ?? 0) > 0, 'Trace has rationale')
  assert((trace?.suggestedAction.length ?? 0) > 0, 'Trace has suggested action')

  // All four models build context successfully
  assert(ctxFoundation.generatedAt.length  > 0, '12U Foundation context generatedAt is set')
  assert(ctxPerformance.generatedAt.length > 0, 'Performance context generatedAt is set')
  assert(ctxClubGrowth.generatedAt.length  > 0, 'Club Growth context generatedAt is set')
  assert(ctxCollege.generatedAt.length     > 0, 'College context generatedAt is set')

  // Curriculum bias differs
  const biasFoundation  = buildDnaCurriculumBias(ctxFoundation)
  const biasPerformance = buildDnaCurriculumBias(ctxPerformance)
  assert(biasFoundation.primaryCategory !== biasPerformance.primaryCategory,
    `Curriculum top category differs: Foundation=${biasFoundation.primaryCategory}, Performance=${biasPerformance.primaryCategory}`)
  assert(biasFoundation.deEmphasisedCategories.includes('competition'),
    'Foundation de-emphasises competition in curriculum')
  assert(biasPerformance.deEmphasisedCategories.includes('fun'),
    'Performance de-emphasises fun in curriculum')

  // Parent comms language differs
  const parentFoundation  = buildDnaParentCommsGuidance(ctxFoundation)
  const parentPerformance = buildDnaParentCommsGuidance(ctxPerformance)
  const parentClub        = buildDnaParentCommsGuidance(ctxClubGrowth)
  const parentCollege     = buildDnaParentCommsGuidance(ctxCollege)
  assert(parentFoundation.languageStyle  === 'educational',    'Foundation: educational parent language')
  assert(parentPerformance.languageStyle === 'accountability', 'Performance: accountability parent language')
  assert(parentClub.languageStyle        === 'retention',      'Club Growth: retention parent language')
  assert(parentCollege.languageStyle     === 'recruiting',     'College: recruiting parent language')

  // Parent comms opportunity builder
  const milestoneGuidance = buildParentCommOpportunityGuidance('milestone', ctxFoundation, 'Alex')
  assert(milestoneGuidance.type === 'milestone', 'Parent comm opportunity type = milestone')
  assert(milestoneGuidance.headline.includes('Alex'), 'Parent comm opportunity headline includes player name')
  assert(milestoneGuidance.draftGuidance.length > 0, 'Draft guidance is non-empty')

  // Curriculum alignment evaluation
  const sampleLevels: CurriculumLevelSummary[] = [
    { id: 'l1', displayName: 'Red Ball',    stage: 'red_ball',    sortOrder: 1, itemCount: 1, itemCountByType: {}, isEmpty: false, isSparse: true },
    { id: 'l2', displayName: 'Orange Ball', stage: 'orange_ball', sortOrder: 2, itemCount: 5, itemCountByType: {}, isEmpty: false, isSparse: false },
  ]
  const alignmentResult = evaluateCurriculumAlignment(sampleLevels, ctxFoundation)
  assert(!alignmentResult.isAligned, 'Curriculum alignment detects sparse level')
  assert(alignmentResult.misalignedLevels.length > 0, 'Misaligned levels identified')
  assert(alignmentResult.topRecommendation !== null, 'Top recommendation provided for misaligned curriculum')

  // Coach alignment evaluation
  const coachResult = evaluateCoachDnaAlignment({
    coachId:                 'coach-1',
    coachName:               'Coach Sarah',
    recentRecapCount:        5,
    expectedRecapCount:      6,
    hasDetailedObservations: false,
    hasEngagementNotes:      false,
    playerStallCount:        0,
    advancementFlaggedCount: 0,
    daysSinceLastRecap:      2,
  }, ctxFoundation)
  assert(coachResult.status !== 'aligned', 'Coach with no engagement notes is not fully aligned for foundation model')
  assert(coachResult.gaps.length > 0,       'Coach alignment gaps identified for missing engagement notes')
  assert(coachResult.alignmentScore >= 0 && coachResult.alignmentScore <= 100, 'Coach alignment score in valid range')

  // Coach alignment summary
  const summaryResult = buildCoachAlignmentSummary([coachResult], ctxFoundation)
  assert(summaryResult.totalCoaches === 1, 'Coach summary has 1 coach')
  assert(summaryResult.headline.length > 0, 'Coach summary headline non-empty')
}

// ── Part 8: COO question certification ───────────────────────────────────────

function certifyCOOQuestions(): void {
  section('COO Question Certification — 8 required questions')

  const ctx  = buildOperatingModelContext({ dnaModelId: 'performance_12plus', stylePresetId: 'competition_first' })
  const recs = buildDnaAwareRecommendations(ctx, SAMPLE_SIGNALS)

  const questions = [
    'attention',
    'why',
    'next',
    'dna_alignment',
    'biggest_risk',
    'biggest_opportunity',
    'coach_alignment',
    'player_progression',
  ] as const

  for (const q of questions) {
    const result = answerCOOQuestion(q, ctx, SAMPLE_SIGNALS, recs)
    assert(result.question.length  > 0, `COO question "${q}" has a question label`)
    assert(result.answer.length    > 10, `COO question "${q}" has a substantive answer (>10 chars)`)
    assert(result.confidence !== undefined, `COO question "${q}" has a confidence level`)
    console.log(`    Q: ${result.question}`)
    console.log(`    A: ${result.answer.slice(0, 100)}${result.answer.length > 100 ? '...' : ''}`)
    console.log()
  }
}

// ── Run all ───────────────────────────────────────────────────────────────────

async function runCertification(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  DONNA Academy Operating Intelligence V1 — Certification Suite')
  console.log('  Mega Sprint 2801–2830')
  console.log('═══════════════════════════════════════════════════════════════')

  certifyScenarioA()
  certifyScenarioB()
  certifyScenarioC()
  certifyCOOQuestions()

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
