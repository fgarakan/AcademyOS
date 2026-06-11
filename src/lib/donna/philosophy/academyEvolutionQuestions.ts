// Mega Sprint 1746–1775 — DONNA Philosophy Memory & Academy Evolution Engine V1
// Academy Evolution Questions: routes the 10 core evolution questions through
// the philosophy intelligence layers and returns evidence-backed answers.
//
// Director asks: "What kind of academy are we becoming?"
// DONNA answers using: identity profile + timeline + drift report + preference signals.
//
// Every answer includes:
//   - evidence used
//   - confidence
//   - missing data if any
//   - recommended next action
//
// Pure TypeScript. No DB calls. No mutations.

import type { AcademyIdentityProfile, RealityOverrideAnalysis } from './academyIdentityProfile'
import type { AcademyEvolutionTimeline, PhilosophyDriftReport, EvolutionPhase } from './academyEvolutionTimeline'
import type { PreferenceSignal } from './academyPreferenceExtractor'

// ── Types ─────────────────────────────────────────────────────────────────────

export type EvolutionQuestionType =
  | 'what_kind_of_academy'        // "What kind of academy are we becoming?"
  | 'how_have_we_changed'         // "How have we changed?"
  | 'emerging_philosophies'       // "What philosophies are emerging?"
  | 'decisions_producing_results' // "What decisions are producing results?"
  | 'decisions_hurting_results'   // "What decisions are hurting results?"
  | 'changed_90_days'             // "What has changed in the last 90 days?"
  | 'what_to_stop'                // "What should we stop doing?"
  | 'what_to_do_more'             // "What should we do more of?"
  | 'biggest_blind_spots'         // "What are our biggest blind spots?"
  | 'biggest_strengths'           // "What are our biggest strengths?"

export interface EvolutionAnswer {
  question:           EvolutionQuestionType
  questionText:       string
  answer:             string
  supportingPoints:   string[]
  evidenceUsed:       string[]
  confidence:         'high' | 'medium' | 'low' | 'insufficient'
  missingData:        string[]
  recommendedAction:  string | null
}

export interface EvolutionQuestionContext {
  identityProfile:    AcademyIdentityProfile
  timeline:           AcademyEvolutionTimeline
  driftReport:        PhilosophyDriftReport
  preferences:        PreferenceSignal[]
  realityOverrides:   RealityOverrideAnalysis[]
}

// ── Confidence helper ─────────────────────────────────────────────────────────

function contextConfidence(ctx: EvolutionQuestionContext): EvolutionAnswer['confidence'] {
  const hasHistory = ctx.timeline.totalPhases >= 2
  const hasPrefs   = ctx.preferences.filter(p => p.confidence !== 'insufficient').length >= 3
  const hasDims    = ctx.identityProfile.dimensions.filter(d => d.confidence !== 'insufficient').length >= 4

  if (hasHistory && hasPrefs && hasDims) return 'medium'
  if (hasHistory || hasPrefs)            return 'low'
  return 'insufficient'
}

// ── Question 1: What kind of academy are we becoming? ────────────────────────

function answerWhatKindOfAcademy(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { identityProfile, preferences, driftReport } = ctx
  const highDims = identityProfile.dimensions
    .filter(d => d.finalScore >= 70 && d.confidence !== 'insufficient')
    .sort((a, b) => b.finalScore - a.finalScore)
  const lowDims = identityProfile.dimensions
    .filter(d => d.finalScore <= 35 && d.confidence !== 'insufficient')

  const evidenceUsed: string[] = []
  for (const dim of highDims.slice(0, 3)) evidenceUsed.push(dim.explanation)

  const missingData: string[] = [...identityProfile.limitations]

  let answer: string
  let supportingPoints: string[]

  if (identityProfile.overallConfidence === 'insufficient') {
    answer = 'Not enough history to characterize this academy yet.'
    supportingPoints = ['Complete onboarding and add curriculum content to build an evidence-backed profile.']
  } else {
    answer = identityProfile.narrative
    supportingPoints = [
      ...highDims.slice(0, 3).map(d => `Strong: ${d.label} (${d.finalScore}/100)`),
      ...lowDims.slice(0, 2).map(d => `Lower emphasis: ${d.label} (${d.finalScore}/100)`),
    ]
    if (driftReport.driftDetected) {
      supportingPoints.push(driftReport.donnaMessage)
    }
  }

  return {
    question:          'what_kind_of_academy',
    questionText:      'What kind of academy are we becoming?',
    answer,
    supportingPoints,
    evidenceUsed,
    confidence:        contextConfidence(ctx),
    missingData,
    recommendedAction: highDims.length === 0
      ? 'Add curriculum content and build decision history to refine the identity profile.'
      : null,
  }
}

// ── Question 2: How have we changed? ─────────────────────────────────────────

function answerHowHaveWeChanged(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { timeline } = ctx

  if (timeline.totalPhases < 2) {
    return {
      question:          'how_have_we_changed',
      questionText:      'How have we changed?',
      answer:            'Not enough history to identify changes — less than 2 months of recorded activity.',
      supportingPoints:  [],
      evidenceUsed:      [],
      confidence:        'insufficient',
      missingData:       timeline.dataLimitations,
      recommendedAction: 'Build 2+ months of curriculum and approval history to enable change detection.',
    }
  }

  const earliest = timeline.phases[0]
  const latest   = timeline.phases[timeline.phases.length - 1]

  const answer = `From ${earliest.periodLabel} to ${latest.periodLabel}: ${timeline.summaryLine}`
  const supportingPoints: string[] = []

  const highActivity = timeline.phases.filter(p => p.activityLevel === 'high')
  if (highActivity.length > 0) {
    supportingPoints.push(`High-activity months: ${highActivity.map(p => p.periodLabel).join(', ')}`)
  }

  // Theme progression
  const themes = timeline.phases.map(p => p.dominantTheme)
  const uniqueThemes = themes.filter((t, i, arr) => arr.indexOf(t) === i)
  if (uniqueThemes.length > 1) {
    supportingPoints.push(`Primary themes: ${uniqueThemes.join(' → ')}`)
  }

  return {
    question:          'how_have_we_changed',
    questionText:      'How have we changed?',
    answer,
    supportingPoints,
    evidenceUsed:      [`${timeline.totalPhases} months of activity records`, timeline.summaryLine],
    confidence:        timeline.totalPhases >= 6 ? 'medium' : 'low',
    missingData:       timeline.dataLimitations,
    recommendedAction: null,
  }
}

// ── Question 3: What philosophies are emerging? ───────────────────────────────

function answerEmergingPhilosophies(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { preferences } = ctx
  const rising = preferences.filter(p => p.direction === 'rising' && p.confidence !== 'insufficient')
  const strong = preferences.filter(p => p.score >= 70 && p.confidence !== 'insufficient')

  if (rising.length === 0 && strong.length === 0) {
    return {
      question:          'emerging_philosophies',
      questionText:      'What philosophies are emerging?',
      answer:            'Insufficient history to detect emerging philosophies. More decisions needed.',
      supportingPoints:  [],
      evidenceUsed:      [],
      confidence:        'insufficient',
      missingData:       ['Need at least 90 days of behavioral history to detect trends.'],
      recommendedAction: 'Continue adding curriculum content to build a behavioral profile.',
    }
  }

  const points: string[] = [
    ...rising.slice(0, 3).map(p => `Rising: ${p.label} (score ${p.score}/100, trending up)`),
    ...strong.filter(p => p.direction !== 'rising').slice(0, 2).map(p => `Established: ${p.label} (score ${p.score}/100)`),
  ]

  const answer = rising.length > 0
    ? `Emerging patterns: ${rising.slice(0, 3).map(p => p.label.toLowerCase()).join(', ')}.`
    : `Established patterns: ${strong.slice(0, 3).map(p => p.label.toLowerCase()).join(', ')}.`

  return {
    question:          'emerging_philosophies',
    questionText:      'What philosophies are emerging?',
    answer,
    supportingPoints:  points,
    evidenceUsed:      preferences.filter(p => p.confidence !== 'insufficient').map(p => p.explanation).slice(0, 5),
    confidence:        contextConfidence(ctx),
    missingData:       preferences.filter(p => p.confidence === 'insufficient').map(p => `${p.label}: insufficient history`).slice(0, 3),
    recommendedAction: null,
  }
}

// ── Question 4: What decisions are producing results? ────────────────────────

function answerDecisionsProducingResults(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { preferences, timeline } = ctx
  const successful = preferences.filter(p => p.score >= 70 && p.positiveSignals >= 3)

  const points: string[] = successful
    .slice(0, 5)
    .map(p => `${p.label}: ${p.positiveSignals} accepted decisions (score ${p.score}/100)`)

  const answer = successful.length > 0
    ? `Areas with consistent positive decisions: ${successful.slice(0, 3).map(p => p.label.toLowerCase()).join(', ')}.`
    : 'Insufficient decision history to identify consistently successful areas.'

  return {
    question:          'decisions_producing_results',
    questionText:      'What decisions are producing results?',
    answer,
    supportingPoints:  points,
    evidenceUsed:      successful.slice(0, 3).map(p => p.explanation),
    confidence:        successful.length >= 2 ? contextConfidence(ctx) : 'insufficient',
    missingData:       ['V1: outcome tracking not yet implemented — results inferred from acceptance patterns only.'],
    recommendedAction: successful.length > 0
      ? `Consider formalising your ${successful[0].label.toLowerCase()} approach in your curriculum philosophy.`
      : null,
  }
}

// ── Question 5: What decisions are hurting results? ──────────────────────────

function answerDecisionsHurtingResults(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { realityOverrides, driftReport } = ctx

  const points: string[] = []
  for (const ro of realityOverrides) {
    points.push(`Reality override: ${ro.observedReality}`)
  }
  if (driftReport.driftDetected && driftReport.driftSeverity !== 'LOW') {
    points.push(`Philosophy drift (${driftReport.driftSeverity}): ${driftReport.driftedDimensions[0]?.description ?? ''}`)
  }

  const answer = realityOverrides.length === 0 && !driftReport.driftDetected
    ? 'No clear signals of harmful decisions detected. Insufficient outcome data to identify specific problems.'
    : `${realityOverrides.length > 0 ? 'Player evidence contradicts stated emphasis in some areas.' : ''} ${driftReport.driftDetected ? driftReport.donnaMessage : ''}`.trim()

  return {
    question:          'decisions_hurting_results',
    questionText:      'What decisions are hurting results?',
    answer,
    supportingPoints:  points,
    evidenceUsed:      realityOverrides.map(ro => ro.observedReality).slice(0, 3),
    confidence:        realityOverrides.length > 0 ? 'low' : 'insufficient',
    missingData:       ['V1: outcome tracking not yet implemented — based on evidence-philosophy divergence only.'],
    recommendedAction: realityOverrides.length > 0 ? realityOverrides[0].recommendedAction : null,
  }
}

// ── Question 6: What has changed in the last 90 days? ────────────────────────

function answerChanged90Days(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { timeline } = ctx
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7)
  const recent = timeline.phases.filter(p => p.periodKey >= cutoff)

  if (recent.length === 0) {
    return {
      question:          'changed_90_days',
      questionText:      'What has changed in the last 90 days?',
      answer:            'No recorded activity in the last 90 days.',
      supportingPoints:  [],
      evidenceUsed:      [],
      confidence:        'insufficient',
      missingData:       ['No recent activity records.'],
      recommendedAction: null,
    }
  }

  const totalAdded   = recent.reduce((s, p) => s + p.curriculumAdded, 0)
  const totalAdvanced = recent.reduce((s, p) => s + p.playersAdvanced, 0)
  const changes: string[] = []
  for (const phase of recent) {
    for (const c of phase.keyChanges.slice(0, 3)) {
      changes.push(`${phase.periodLabel}: ${c.description}`)
    }
  }

  return {
    question:          'changed_90_days',
    questionText:      'What has changed in the last 90 days?',
    answer:            `In the last 90 days: ${totalAdded} curriculum item${totalAdded !== 1 ? 's' : ''} added, ${totalAdvanced} player advancement${totalAdvanced !== 1 ? 's' : ''} recorded across ${recent.length} month${recent.length !== 1 ? 's' : ''}.`,
    supportingPoints:  changes.slice(0, 6),
    evidenceUsed:      recent.map(p => `${p.periodLabel}: ${p.dominantTheme.replace(/_/g, ' ')}`),
    confidence:        recent.length >= 2 ? 'medium' : 'low',
    missingData:       timeline.dataLimitations,
    recommendedAction: null,
  }
}

// ── Question 7: What should we stop doing? ───────────────────────────────────

function answerWhatToStop(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { preferences, driftReport, realityOverrides } = ctx
  const avoidances = preferences.filter(p => p.score <= 35 && p.confidence !== 'insufficient')

  const points: string[] = [
    ...avoidances.map(p => `${p.label}: ${p.negativeSignals} items removed or avoided`),
    ...realityOverrides.map(ro => `Reality mismatch: ${ro.observedReality} — ${ro.recommendedAction}`),
  ]

  if (driftReport.driftDetected && driftReport.driftSeverity === 'HIGH') {
    points.unshift(`Philosophy drift in ${driftReport.driftedDimensions[0]?.dimension ?? 'key area'} — recalibration may be needed.`)
  }

  const answer = avoidances.length > 0
    ? `Based on decision patterns, the academy consistently avoids: ${avoidances.slice(0, 3).map(p => p.label.toLowerCase()).join(', ')}.`
    : 'No strong avoidance patterns detected. Insufficient behavioral history.'

  return {
    question:          'what_to_stop',
    questionText:      'What should we stop doing?',
    answer,
    supportingPoints:  points.slice(0, 5),
    evidenceUsed:      avoidances.slice(0, 3).map(p => p.explanation),
    confidence:        avoidances.length >= 2 ? contextConfidence(ctx) : 'insufficient',
    missingData:       ['V1: based on patterns only — no outcome data to confirm which decisions are harmful.'],
    recommendedAction: realityOverrides.length > 0 ? realityOverrides[0].recommendedAction : null,
  }
}

// ── Question 8: What should we do more of? ───────────────────────────────────

function answerWhatToDoMore(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { preferences, identityProfile } = ctx
  const strong = preferences.filter(p => p.score >= 70 && p.confidence !== 'insufficient')
  const highDims = identityProfile.dimensions
    .filter(d => d.finalScore >= 75 && d.confidence !== 'insufficient')

  const points: string[] = [
    ...strong.slice(0, 3).map(p => `${p.label}: ${p.positiveSignals} accepted decisions (score ${p.score}/100)`),
    ...highDims.filter(d => !strong.some(p => p.label === d.label)).slice(0, 2).map(d => `${d.label}: ${d.finalScore}/100 identity score`),
  ]

  const answer = strong.length > 0
    ? `The academy consistently accepts and expands: ${strong.slice(0, 3).map(p => p.label.toLowerCase()).join(', ')}. These are areas of demonstrated preference.`
    : 'Not enough decision history to identify strong patterns worth doubling down on.'

  return {
    question:          'what_to_do_more',
    questionText:      'What should we do more of?',
    answer,
    supportingPoints:  points,
    evidenceUsed:      strong.slice(0, 3).map(p => p.explanation),
    confidence:        strong.length >= 2 ? contextConfidence(ctx) : 'low',
    missingData:       strong.length === 0 ? ['Build 5+ decisions per content type to identify reliable patterns.'] : [],
    recommendedAction: strong.length > 0 ? `Consider expanding your ${strong[0].label.toLowerCase()} content systematically.` : null,
  }
}

// ── Question 9: What are our biggest blind spots? ────────────────────────────

function answerBiggestBlindSpots(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { identityProfile, realityOverrides } = ctx
  const insufficientDims = identityProfile.dimensions.filter(d => d.confidence === 'insufficient')

  const points: string[] = [
    ...realityOverrides.map(ro => `${ro.observedReality} (${ro.evidenceStrength} evidence)`),
    ...insufficientDims.slice(0, 3).map(d => `${d.label}: no behavioral data collected yet`),
  ]

  const answer = realityOverrides.length > 0
    ? `Evidence-based blind spot${realityOverrides.length !== 1 ? 's' : ''}: ${realityOverrides.map(ro => ro.contradictedPhilosophy).slice(0, 3).join('; ')}.`
    : insufficientDims.length > 0
    ? `Data gaps in: ${insufficientDims.slice(0, 3).map(d => d.label.toLowerCase()).join(', ')} — no behavioral history to assess these areas.`
    : 'No significant blind spots detected with current data.'

  return {
    question:          'biggest_blind_spots',
    questionText:      'What are our biggest blind spots?',
    answer,
    supportingPoints:  points.slice(0, 5),
    evidenceUsed:      realityOverrides.map(ro => `${ro.observedReality} — confidence ${ro.confidence}%`).slice(0, 3),
    confidence:        realityOverrides.length > 0 ? 'low' : 'insufficient',
    missingData:       insufficientDims.slice(0, 3).map(d => `${d.label}: no data`),
    recommendedAction: realityOverrides.length > 0
      ? realityOverrides[0].recommendedAction
      : 'Collect more player evidence to reveal blind spots.',
  }
}

// ── Question 10: What are our biggest strengths? ─────────────────────────────

function answerBiggestStrengths(ctx: EvolutionQuestionContext): EvolutionAnswer {
  const { identityProfile, preferences } = ctx
  const highDims = identityProfile.dimensions
    .filter(d => d.finalScore >= 70 && d.confidence !== 'insufficient')
    .sort((a, b) => b.finalScore - a.finalScore)

  const points: string[] = highDims.slice(0, 5).map(d =>
    `${d.label}: ${d.finalScore}/100 (${d.primarySource === 'player_evidence' ? 'backed by player evidence' : d.primarySource === 'behavior' ? 'backed by decision history' : 'from stated philosophy'})`,
  )

  const answer = highDims.length > 0
    ? `Strongest areas: ${highDims.slice(0, 3).map(d => d.label.toLowerCase()).join(', ')}.`
    : 'Insufficient data to identify strengths with confidence.'

  return {
    question:          'biggest_strengths',
    questionText:      'What are our biggest strengths?',
    answer,
    supportingPoints:  points,
    evidenceUsed:      highDims.slice(0, 3).map(d => d.explanation),
    confidence:        highDims.length >= 3 ? contextConfidence(ctx) : 'low',
    missingData:       [],
    recommendedAction: highDims.length > 0
      ? `Build on ${highDims[0].label.toLowerCase()} — your strongest demonstrated area.`
      : null,
  }
}

// ── Main router ───────────────────────────────────────────────────────────────

const QUESTION_TEXTS: Record<EvolutionQuestionType, string> = {
  what_kind_of_academy:        'What kind of academy are we becoming?',
  how_have_we_changed:         'How have we changed?',
  emerging_philosophies:       'What philosophies are emerging?',
  decisions_producing_results: 'What decisions are producing results?',
  decisions_hurting_results:   'What decisions are hurting results?',
  changed_90_days:             'What has changed in the last 90 days?',
  what_to_stop:                'What should we stop doing?',
  what_to_do_more:             'What should we do more of?',
  biggest_blind_spots:         'What are our biggest blind spots?',
  biggest_strengths:           'What are our biggest strengths?',
}

export function answerEvolutionQuestion(
  question: EvolutionQuestionType,
  ctx:      EvolutionQuestionContext,
): EvolutionAnswer {
  switch (question) {
    case 'what_kind_of_academy':        return answerWhatKindOfAcademy(ctx)
    case 'how_have_we_changed':         return answerHowHaveWeChanged(ctx)
    case 'emerging_philosophies':       return answerEmergingPhilosophies(ctx)
    case 'decisions_producing_results': return answerDecisionsProducingResults(ctx)
    case 'decisions_hurting_results':   return answerDecisionsHurtingResults(ctx)
    case 'changed_90_days':             return answerChanged90Days(ctx)
    case 'what_to_stop':                return answerWhatToStop(ctx)
    case 'what_to_do_more':             return answerWhatToDoMore(ctx)
    case 'biggest_blind_spots':         return answerBiggestBlindSpots(ctx)
    case 'biggest_strengths':           return answerBiggestStrengths(ctx)
  }
}

/** Runs all 10 evolution questions and returns a full answer set. */
export function buildFullEvolutionAnswerSet(
  ctx: EvolutionQuestionContext,
): EvolutionAnswer[] {
  const questions: EvolutionQuestionType[] = [
    'what_kind_of_academy', 'how_have_we_changed', 'emerging_philosophies',
    'decisions_producing_results', 'decisions_hurting_results', 'changed_90_days',
    'what_to_stop', 'what_to_do_more', 'biggest_blind_spots', 'biggest_strengths',
  ]
  return questions.map(q => answerEvolutionQuestion(q, ctx))
}
