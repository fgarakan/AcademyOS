// Sprint 1776–1805 — DONNA Academy Operating Partner V1
// COO Conversation Engine: answers 10 strategic director questions using the
// full Operating Partner context (inputs + brief + situation).
//
// Each question produces a COOConversationAnswer with evidence, confidence,
// missing data, and a recommended next action.

import type {
  COOConversationAnswer,
  DirectorOperatingBrief,
  AcademySituationAssessment,
} from './operatingPartnerOutputContract'
import type { OperatingPartnerInputs } from './operatingPartnerInputContract'
import type { TodayPriorityResult }    from './whatShouldIDoTodayEngine'

// ── Question types ─────────────────────────────────────────────────────────────

export type COOQuestion =
  | 'what_should_i_do_today'
  | 'what_needs_attention'
  | 'what_changed_this_week'
  | 'what_changed_this_month'
  | 'what_is_holding_us_back'
  | 'what_should_i_ignore'
  | 'what_should_we_stop_doing'
  | 'what_should_we_double_down_on'
  | 'what_are_our_biggest_opportunities'
  | 'what_are_our_biggest_bottlenecks'

// ── Answer builders ────────────────────────────────────────────────────────────

function answerWhatShouldIDoToday(
  inputs:      OperatingPartnerInputs,
  brief:       DirectorOperatingBrief,
  todayResult: TodayPriorityResult,
): COOConversationAnswer {
  const primary = brief.primaryAction

  if (todayResult.cannotBrief) {
    return {
      question: 'What should I do today?',
      answer: `DONNA does not have enough data to advise. Data completeness: ${inputs.inputCompletenessScore}/100. Load the missing data and return for a full brief.`,
      evidenceUsed: [`Completeness: ${inputs.inputCompletenessScore}/100`],
      confidence: 'provisional',
      missingData: inputs.missingCriticalInputs,
      recommendedNextAction: inputs.missingCriticalInputs.length > 0
        ? `Load: ${inputs.missingCriticalInputs.join(', ')}.`
        : 'Complete academy onboarding.',
    }
  }

  const priorityList = brief.priorities.map((p, i) => `${i + 1}. ${p.title}`).join('. ')

  return {
    question: 'What should I do today?',
    answer: `Primary action: ${primary.title} (${primary.urgency} — ${primary.expectedImpact} impact). Today's priorities: ${priorityList}. Start with the primary action.`,
    evidenceUsed: primary.evidenceUsed,
    confidence: brief.confidence,
    missingData: primary.missingData,
    recommendedNextAction: primary.firstStep,
  }
}

function answerWhatNeedsAttention(
  inputs:    OperatingPartnerInputs,
  brief:     DirectorOperatingBrief,
  situation: AcademySituationAssessment,
): COOConversationAnswer {
  if (brief.alerts.length === 0 && brief.priorities.length === 0) {
    return {
      question: 'What needs attention?',
      answer: 'No urgent items detected. The academy is in a positive state based on available data.',
      evidenceUsed: [],
      confidence: brief.confidence,
      missingData: inputs.missingCriticalInputs,
      recommendedNextAction: null,
    }
  }

  const alertSummary = brief.alerts.length > 0
    ? `Alerts: ${brief.alerts.map(a => a.headline).join('; ')}.`
    : ''
  const prioritySummary = `Priorities: ${brief.priorities.map(p => p.title).join('; ')}.`
  const situationLine   = `Current situation: ${situation.situationType.replace(/_/g, ' ')} (${situation.severity} severity).`

  return {
    question: 'What needs attention?',
    answer: `${situationLine} ${prioritySummary} ${alertSummary}`.trim(),
    evidenceUsed: [
      situation.evidenceSummary,
      ...brief.alerts.map(a => a.evidence).slice(0, 2),
    ],
    confidence: brief.confidence,
    missingData: inputs.missingCriticalInputs,
    recommendedNextAction: brief.priorities[0]?.firstStep ?? null,
  }
}

function answerWhatChangedThisWeek(inputs: OperatingPartnerInputs): COOConversationAnswer {
  const { evolution } = inputs.philosophy
  const recentPhases  = evolution.recentPhases
  const latestPhase   = recentPhases[recentPhases.length - 1]

  if (!latestPhase) {
    return {
      question: 'What changed this week?',
      answer: 'No recent evolution data available. DONNA has not yet recorded activity in the last 90 days.',
      evidenceUsed: [],
      confidence: 'provisional',
      missingData: ['Recent evolution phase data'],
      recommendedNextAction: null,
    }
  }

  const parts: string[] = []
  if (latestPhase.curriculumAdded > 0)   parts.push(`${latestPhase.curriculumAdded} curriculum item(s) added`)
  if (latestPhase.curriculumRemoved > 0) parts.push(`${latestPhase.curriculumRemoved} curriculum item(s) removed`)
  if (latestPhase.playersAdvanced > 0)   parts.push(`${latestPhase.playersAdvanced} player(s) advanced`)

  const ops = inputs.operations
  const opsParts: string[] = []
  if (ops.coaches.dataAvailable && ops.coaches.missingWrapUpCount > 0) {
    opsParts.push(`${ops.coaches.missingWrapUpCount} session recaps outstanding`)
  }
  if (ops.system.dataAvailable && ops.system.pendingApprovalCount > 0) {
    opsParts.push(`${ops.system.pendingApprovalCount} items awaiting approval`)
  }

  const summary = parts.length > 0 ? parts.join(', ') : 'No curriculum or advancement activity recorded'
  const opsSummary = opsParts.length > 0 ? ` Operational: ${opsParts.join(', ')}.` : ''
  const theme = latestPhase.dominantTheme ? ` Dominant theme: ${latestPhase.dominantTheme}.` : ''

  return {
    question: 'What changed this week?',
    answer: `In ${latestPhase.periodLabel} (activity: ${latestPhase.activityLevel}): ${summary}.${theme}${opsSummary}`,
    evidenceUsed: [`Period: ${latestPhase.periodLabel}`, ...parts],
    confidence: 'reliable',
    missingData: [],
    recommendedNextAction: latestPhase.playersAdvanced > 0 ? 'Confirm advanced players are assigned to their new curriculum level.' : null,
  }
}

function answerWhatChangedThisMonth(inputs: OperatingPartnerInputs): COOConversationAnswer {
  const { evolution } = inputs.philosophy
  const recentPhases  = evolution.recentPhases

  if (recentPhases.length === 0) {
    return {
      question: 'What changed this month?',
      answer: 'No evolution history available for the last 90 days.',
      evidenceUsed: [],
      confidence: 'provisional',
      missingData: ['Evolution phase history'],
      recommendedNextAction: null,
    }
  }

  const totalAdded    = recentPhases.reduce((sum, p) => sum + p.curriculumAdded, 0)
  const totalRemoved  = recentPhases.reduce((sum, p) => sum + p.curriculumRemoved, 0)
  const totalAdvanced = recentPhases.reduce((sum, p) => sum + p.playersAdvanced, 0)

  const theme = evolution.overallTheme ?? recentPhases[recentPhases.length - 1]?.dominantTheme ?? 'general development'

  const parts: string[] = []
  if (totalAdded > 0)    parts.push(`${totalAdded} curriculum items added`)
  if (totalRemoved > 0)  parts.push(`${totalRemoved} removed`)
  if (totalAdvanced > 0) parts.push(`${totalAdvanced} players advanced`)

  const summary = parts.length > 0 ? parts.join(', ') : 'No significant changes recorded'

  return {
    question: 'What changed this month?',
    answer: `Over the last ${recentPhases.length} period(s): ${summary}. Theme: ${theme}. ${evolution.summaryLine ?? ''}`.trim(),
    evidenceUsed: [`${recentPhases.length} recent evolution phase(s)`, ...parts],
    confidence: 'reliable',
    missingData: evolution.dataLimitations,
    recommendedNextAction: totalAdvanced > 5 ? 'Review whether advanced players need new coach assignments.' : null,
  }
}

function answerWhatIsHoldingUsBack(
  inputs:    OperatingPartnerInputs,
  situation: AcademySituationAssessment,
  brief:     DirectorOperatingBrief,
): COOConversationAnswer {
  const primaryPriority = brief.priorities[0]
  const primaryAlert    = brief.alerts[0]

  if (!primaryPriority && !primaryAlert) {
    return {
      question: 'What is holding us back?',
      answer: 'No primary constraint identified with available data. The academy appears to be operating without a dominant bottleneck.',
      evidenceUsed: [],
      confidence: brief.confidence,
      missingData: inputs.missingCriticalInputs,
      recommendedNextAction: null,
    }
  }

  const constraintSource = primaryAlert ?? primaryPriority
  const constraintTitle  = primaryAlert ? primaryAlert.headline : primaryPriority!.title

  return {
    question: 'What is holding us back?',
    answer: `Primary constraint: ${constraintTitle}. Situation: ${situation.situationType.replace(/_/g, ' ')} — ${situation.likelyCause} Root cause: ${situation.evidenceSummary}`,
    evidenceUsed: [
      situation.evidenceSummary,
      ...(constraintSource ? [constraintSource.evidence] : []),
    ],
    confidence: situation.confidence,
    missingData: situation.missingData.slice(0, 3),
    recommendedNextAction: primaryPriority?.firstStep ?? null,
  }
}

function answerWhatShouldIIgnore(
  todayResult: TodayPriorityResult,
  brief:       DirectorOperatingBrief,
): COOConversationAnswer {
  const toIgnore = todayResult.whatToIgnore

  if (toIgnore.length === 0) {
    return {
      question: 'What should I ignore?',
      answer: `${brief.whatToIgnore} No specific items are being excluded today.`,
      evidenceUsed: [],
      confidence: 'provisional',
      missingData: [],
      recommendedNextAction: null,
    }
  }

  return {
    question: 'What should I ignore?',
    answer: toIgnore.join(' '),
    evidenceUsed: brief.priorities.map(p => p.title).slice(0, 2),
    confidence: 'reliable',
    missingData: [],
    recommendedNextAction: null,
  }
}

function answerWhatShouldWeStopDoing(
  inputs:    OperatingPartnerInputs,
  situation: AcademySituationAssessment,
): COOConversationAnswer {
  const { preferences, drift } = inputs.philosophy

  const stops: string[] = []

  if (drift.driftDetected && drift.driftSeverity === 'HIGH') {
    stops.push(`Stop the behavior causing drift: ${drift.driftedDimensions.map(d => d.description).join('; ')}.`)
  }

  if (preferences.topAvoidances.length > 0) {
    const topAvoid = preferences.topAvoidances[0]
    stops.push(`Continue to avoid: ${topAvoid.label} (academy decision pattern score: ${topAvoid.score}).`)
  }

  const situationSpecific: Record<string, string> = {
    curriculum_gap:            'Stop adding new players to levels that have no content.',
    coach_execution_gap:       'Stop accepting new coach-submitted curriculum without wrap-up compliance.',
    parent_retention_risk:     'Stop delaying parent communication — every day of silence increases retention risk.',
    unclear_cause_requires_review: 'Stop taking action based on incomplete data.',
    assessment_debt:           'Stop advancing players without evidence records in place.',
  }

  const specific = situationSpecific[situation.situationType]
  if (specific) stops.push(specific)

  const answer = stops.length > 0
    ? stops.join(' ')
    : 'No clear behavior to stop has been identified with available data. Review decision history for patterns.'

  return {
    question: 'What should we stop doing?',
    answer,
    evidenceUsed: [
      ...(drift.driftDetected ? [`Philosophy drift: ${drift.driftSeverity}`] : []),
      ...(preferences.topAvoidances.length > 0 ? [`Top avoidance: ${preferences.topAvoidances[0].label}`] : []),
    ],
    confidence: drift.driftDetected ? drift.confidence : 'provisional',
    missingData: [],
    recommendedNextAction: drift.driftDetected ? (drift.suggestedAction ?? null) : null,
  }
}

function answerWhatShouldWeDoubleDown(
  inputs: OperatingPartnerInputs,
  brief:  DirectorOperatingBrief,
): COOConversationAnswer {
  const { preferences, evolution } = inputs.philosophy

  const doubles: string[] = []

  if (preferences.topPreferences.length > 0) {
    const top = preferences.topPreferences[0]
    doubles.push(`Double down on: ${top.label} (score ${top.score}) — your strongest confirmed identity signal.`)
  }

  const latestPhase = evolution.recentPhases[evolution.recentPhases.length - 1]
  if (latestPhase && latestPhase.playersAdvanced >= 3) {
    doubles.push(`The approach used in ${latestPhase.periodLabel} advanced ${latestPhase.playersAdvanced} players — repeat it.`)
  }

  if (brief.wins.length > 0) {
    doubles.push(`${brief.wins[0].headline} — reinforce this.`)
  }

  const answer = doubles.length > 0
    ? doubles.join(' ')
    : 'No clear reinforcement target identified yet. Review what drove the most recent player advancements.'

  return {
    question: 'What should we double down on?',
    answer,
    evidenceUsed: [
      ...(preferences.topPreferences.length > 0 ? [`Top preference: ${preferences.topPreferences[0].label}`] : []),
      ...(brief.wins.length > 0 ? [brief.wins[0].evidence] : []),
    ],
    confidence: preferences.topPreferences.length > 0 ? preferences.topPreferences[0].confidence : 'provisional',
    missingData: [],
    recommendedNextAction: preferences.topPreferences.length > 0
      ? `Ensure your next curriculum addition reflects: ${preferences.topPreferences[0].label}.`
      : null,
  }
}

function answerBiggestOpportunities(
  brief:  DirectorOperatingBrief,
  inputs: OperatingPartnerInputs,
): COOConversationAnswer {
  if (brief.wins.length === 0) {
    return {
      question: 'What are our biggest opportunities?',
      answer: 'No positive signals detected with available data. Load more operational data to surface opportunities.',
      evidenceUsed: [],
      confidence: 'provisional',
      missingData: inputs.missingCriticalInputs,
      recommendedNextAction: null,
    }
  }

  const winSummary = brief.wins.map((w, i) => `${i + 1}. ${w.headline}`).join(' ')

  return {
    question: 'What are our biggest opportunities?',
    answer: winSummary,
    evidenceUsed: brief.wins.map(w => w.evidence),
    confidence: brief.wins[0].confidence,
    missingData: inputs.missingCriticalInputs,
    recommendedNextAction: null,
  }
}

function answerBiggestBottlenecks(
  brief:     DirectorOperatingBrief,
  situation: AcademySituationAssessment,
): COOConversationAnswer {
  if (brief.priorities.length === 0) {
    return {
      question: 'What are our biggest bottlenecks?',
      answer: 'No bottlenecks identified with available data.',
      evidenceUsed: [],
      confidence: brief.confidence,
      missingData: [],
      recommendedNextAction: null,
    }
  }

  const bottleneckSummary = brief.priorities
    .map((p, i) => `${i + 1}. ${p.title} (${p.domain}, ${p.urgency})`)
    .join(' ')

  return {
    question: 'What are our biggest bottlenecks?',
    answer: `Primary situation: ${situation.situationType.replace(/_/g, ' ')}. Top constraints: ${bottleneckSummary}`,
    evidenceUsed: [situation.evidenceSummary, ...brief.priorities.map(p => p.reason).slice(0, 2)],
    confidence: situation.confidence,
    missingData: situation.missingData.slice(0, 2),
    recommendedNextAction: brief.priorities[0]?.firstStep ?? null,
  }
}

// ── Main entry point ───────────────────────────────────────────────────────────

export function answerCOOQuestion(
  question:    COOQuestion,
  inputs:      OperatingPartnerInputs,
  brief:       DirectorOperatingBrief,
  situation:   AcademySituationAssessment,
  todayResult: TodayPriorityResult,
): COOConversationAnswer {
  switch (question) {
    case 'what_should_i_do_today':
      return answerWhatShouldIDoToday(inputs, brief, todayResult)
    case 'what_needs_attention':
      return answerWhatNeedsAttention(inputs, brief, situation)
    case 'what_changed_this_week':
      return answerWhatChangedThisWeek(inputs)
    case 'what_changed_this_month':
      return answerWhatChangedThisMonth(inputs)
    case 'what_is_holding_us_back':
      return answerWhatIsHoldingUsBack(inputs, situation, brief)
    case 'what_should_i_ignore':
      return answerWhatShouldIIgnore(todayResult, brief)
    case 'what_should_we_stop_doing':
      return answerWhatShouldWeStopDoing(inputs, situation)
    case 'what_should_we_double_down_on':
      return answerWhatShouldWeDoubleDown(inputs, brief)
    case 'what_are_our_biggest_opportunities':
      return answerBiggestOpportunities(brief, inputs)
    case 'what_are_our_biggest_bottlenecks':
      return answerBiggestBottlenecks(brief, situation)
  }
}

// ── Batch answer ───────────────────────────────────────────────────────────────

export const ALL_COO_QUESTIONS: COOQuestion[] = [
  'what_should_i_do_today',
  'what_needs_attention',
  'what_changed_this_week',
  'what_changed_this_month',
  'what_is_holding_us_back',
  'what_should_i_ignore',
  'what_should_we_stop_doing',
  'what_should_we_double_down_on',
  'what_are_our_biggest_opportunities',
  'what_are_our_biggest_bottlenecks',
]

export function answerAllCOOQuestions(
  inputs:      OperatingPartnerInputs,
  brief:       DirectorOperatingBrief,
  situation:   AcademySituationAssessment,
  todayResult: TodayPriorityResult,
): COOConversationAnswer[] {
  return ALL_COO_QUESTIONS.map(q => answerCOOQuestion(q, inputs, brief, situation, todayResult))
}
