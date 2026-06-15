// Mega Sprint 2621–2650 — DONNA Operating Layer V1
// Director Operating Questions — Part 9.
//
// 9 deterministic questions answered without LLM.
// Uses OperatingLayerResult (signals + health + guidance).
//
// Questions (per sprint spec):
//   1. What should I do next?
//   2. What am I missing?
//   3. What is getting worse?
//   4. What is improving?
//   5. What is most urgent?
//   6. What is most important?
//   7. What is being ignored?
//   8. What should I review today?
//   (+ implied 9th: What would you do if you were me?)
//
// Distinct from academyDirectorQuestionsEngine.ts which answers:
//   attention, focus, defer, advance, coach_support, parent_followup, risk, opportunity, status

import type { OperatingSignal } from './operatingSignal'
import type { AcademyHealthModelV2 } from './academyHealthModelV2'
import type { DirectorGuidance } from './directorGuidanceEngine'

// ── Question types ─────────────────────────────────────────────────────────────

export type OperatingQuestionType =
  | 'what_next'
  | 'what_missing'
  | 'getting_worse'
  | 'improving'
  | 'most_urgent'
  | 'most_important'
  | 'being_ignored'
  | 'review_today'
  | 'what_would_you_do'

// ── Detection patterns ─────────────────────────────────────────────────────────

const OPERATING_QUESTION_PATTERNS: Array<{ type: OperatingQuestionType; patterns: RegExp[] }> = [
  {
    type: 'what_next',
    patterns: [
      /what\s+(should\s+i|do\s+i)\s+(do\s+)?(next|now)/i,
      /where\s+(should|do)\s+i\s+start/i,
      /what('s|\s+is)\s+(my\s+)?next\s+(step|action|move)/i,
    ],
  },
  {
    type: 'what_missing',
    patterns: [
      /what\s+(am\s+i|are\s+we)\s+missing/i,
      /what\s+(don't\s+i|do\s+i\s+not)\s+know/i,
      /what\s+(am\s+i|are\s+we)\s+not\s+seeing/i,
      /blind\s+spot/i,
    ],
  },
  {
    type: 'getting_worse',
    patterns: [
      /what\s+(is|'s)\s+(getting|becoming)\s+worse/i,
      /what\s+(is|'s)\s+declining/i,
      /what\s+(is|'s)\s+deteriorating/i,
      /what\s+(is|'s)\s+trending\s+down/i,
    ],
  },
  {
    type: 'improving',
    patterns: [
      /what\s+(is|'s)\s+improving/i,
      /what('s|\s+is)\s+(getting\s+)?better/i,
      /what\s+(is|'s)\s+trending\s+up/i,
      /what\s+(is|'s)\s+going\s+well/i,
    ],
  },
  {
    type: 'most_urgent',
    patterns: [
      /what\s+(is|'s)\s+(most\s+)?urgent/i,
      /what\s+(needs?\s+)?(to\s+happen\s+)?today/i,
      /what\s+can('t|\s+not)\s+wait/i,
    ],
  },
  {
    type: 'most_important',
    patterns: [
      /what\s+(is|'s)\s+(most\s+)?important/i,
      /what\s+(matters|should\s+matter)\s+most/i,
      /highest\s+(leverage|priority|impact)/i,
    ],
  },
  {
    type: 'being_ignored',
    patterns: [
      /what\s+(is|'s|am\s+i)\s+(being\s+)?ignored/i,
      /what\s+(is|'s|am\s+i)\s+ignoring/i,
      /what\s+(is|'s)\s+(not\s+)?getting\s+(attention|addressed)/i,
      /what\s+(is|'s)\s+slipping\s+through/i,
    ],
  },
  {
    type: 'review_today',
    patterns: [
      /what\s+should\s+i\s+review(\s+today)?/i,
      /what('s|\s+is)\s+in\s+(my\s+)?review(\s+queue)?/i,
      /what\s+needs?\s+(my\s+)?review/i,
    ],
  },
  {
    type: 'what_would_you_do',
    patterns: [
      /what\s+would\s+you\s+do/i,
      /if\s+you\s+were\s+me/i,
      /donna.*what.*do/i,
    ],
  },
]

export function detectOperatingQuestion(userInput: string): OperatingQuestionType | null {
  const text = userInput.trim()
  for (const entry of OPERATING_QUESTION_PATTERNS) {
    if (entry.patterns.some(p => p.test(text))) {
      return entry.type
    }
  }
  return null
}

// ── Answer builders ────────────────────────────────────────────────────────────

export interface OperatingQuestionResult {
  questionType:   OperatingQuestionType
  responseText:   string
  navigationHint: string | null
  confidence:     'high' | 'medium' | 'low'
}

function answerWhatNext(guidance: DirectorGuidance): OperatingQuestionResult {
  const lines = [
    `**${guidance.highestLeverageAction}**`,
    '',
    `**Why:** ${guidance.whyItMatters}`,
    `**Expected impact:** ${guidance.expectedImpact}`,
    `**Time estimate:** ${guidance.timeEstimate}`,
  ]
  if (guidance.alternativeActions.length > 0) {
    lines.push('')
    lines.push('**After that:**')
    for (const a of guidance.alternativeActions) {
      lines.push(`• ${a}`)
    }
  }
  return {
    questionType: 'what_next',
    responseText: lines.join('\n'),
    navigationHint: guidance.navigationTarget,
    confidence: guidance.confidence,
  }
}

function answerWhatMissing(signals: OperatingSignal[], health: AcademyHealthModelV2): OperatingQuestionResult {
  const lowScores = [
    health.playerHealth,
    health.coachHealth,
    health.parentHealth,
    health.curriculumHealth,
    health.assessmentCompliance,
  ].filter(d => d.score < 70 && d.topIssue)

  if (lowScores.length === 0) {
    return {
      questionType: 'what_missing',
      responseText: 'No obvious blind spots detected. All domain health scores are above 70%. Consider scheduling a proactive review with coaches about players approaching assessment windows.',
      navigationHint: null,
      confidence: 'medium',
    }
  }

  const worstDomain = lowScores.sort((a, b) => a.score - b.score)[0]
  const lines = [
    `The area most likely to become a problem is **${worstDomain.label}** (score: ${worstDomain.score}/100).`,
    '',
    `What DONNA is seeing: ${worstDomain.topIssue}`,
  ]

  if (lowScores.length > 1) {
    lines.push('')
    lines.push('Also watch:')
    for (const d of lowScores.slice(1)) {
      lines.push(`• ${d.label}: ${d.topIssue}`)
    }
  }

  return {
    questionType: 'what_missing',
    responseText: lines.join('\n'),
    navigationHint: null,
    confidence: 'high',
  }
}

function answerGettingWorse(signals: OperatingSignal[], health: AcademyHealthModelV2): OperatingQuestionResult {
  const declining = [
    health.playerHealth, health.coachHealth, health.parentHealth,
    health.curriculumHealth, health.assessmentCompliance,
    health.recommendationThroughput, health.attendanceTrend,
  ].filter(d => d.trend === 'declining')

  const escalated = signals.filter(s => s.isEscalated)

  if (declining.length === 0 && escalated.length === 0) {
    return {
      questionType: 'getting_worse',
      responseText: 'No declining trends detected in current data. All domains are stable or improving.',
      navigationHint: null,
      confidence: 'medium',
    }
  }

  const lines: string[] = []
  if (escalated.length > 0) {
    lines.push(`**${escalated.length} item${escalated.length !== 1 ? 's' : ''} have escalated:**`)
    for (const s of escalated.slice(0, 3)) {
      lines.push(`• ${s.title} — ${s.ageDays} days pending`)
    }
  }
  if (declining.length > 0) {
    lines.push('')
    lines.push('**Domains trending down:**')
    for (const d of declining) {
      lines.push(`• ${d.label}: ${d.topIssue ?? 'signals declining'}`)
    }
  }

  return {
    questionType: 'getting_worse',
    responseText: lines.join('\n'),
    navigationHint: escalated[0]?.targetEntityRoute ?? null,
    confidence: 'high',
  }
}

function answerImproving(health: AcademyHealthModelV2): OperatingQuestionResult {
  const healthy = [
    health.playerHealth, health.coachHealth, health.parentHealth,
    health.curriculumHealth, health.assessmentCompliance,
  ].filter(d => d.score >= 80)

  if (healthy.length === 0) {
    return {
      questionType: 'improving',
      responseText: 'No domains are currently in a healthy range. Focus on the highest-urgency items before looking for positive trends.',
      navigationHint: null,
      confidence: 'medium',
    }
  }

  const lines = [`**${health.overall}/100** overall health score — ${health.healthLabel}.`]
  lines.push('')
  lines.push('**Healthy domains:**')
  for (const d of healthy) {
    lines.push(`• ${d.label}: ${d.score}/100`)
  }

  return {
    questionType: 'improving',
    responseText: lines.join('\n'),
    navigationHint: null,
    confidence: 'high',
  }
}

function answerMostUrgent(signals: OperatingSignal[], guidance: DirectorGuidance): OperatingQuestionResult {
  const criticals = signals.filter(s => s.severity === 'critical' || s.isEscalated)

  if (criticals.length === 0 && !guidance.sourceSignal) {
    return {
      questionType: 'most_urgent',
      responseText: 'No critical or escalated items. The most time-sensitive item is: ' + guidance.highestLeverageAction,
      navigationHint: guidance.navigationTarget,
      confidence: 'medium',
    }
  }

  const top = criticals[0] ?? guidance.sourceSignal!
  const lines = [
    `**${top.title}**`,
    '',
    top.reason,
    '',
    `**Risk if ignored:** ${guidance.riskIfIgnored}`,
    `**Action:** ${top.suggestedAction}`,
  ]

  return {
    questionType: 'most_urgent',
    responseText: lines.join('\n'),
    navigationHint: top.targetEntityRoute,
    confidence: 'high',
  }
}

function answerMostImportant(guidance: DirectorGuidance, health: AcademyHealthModelV2): OperatingQuestionResult {
  const lines = [
    `**${guidance.highestLeverageAction}**`,
    '',
    guidance.whyItMatters,
    '',
    `Academy health is ${health.healthLabel} (${health.overall}/100). The most important domain to address: **${health.topFactors[0]?.label ?? 'all areas are healthy'}**.`,
  ]

  return {
    questionType: 'most_important',
    responseText: lines.join('\n'),
    navigationHint: guidance.navigationTarget,
    confidence: guidance.confidence,
  }
}

function answerBeingIgnored(signals: OperatingSignal[]): OperatingQuestionResult {
  const ignored = signals
    .filter(s => s.ageDays >= 7 && s.type !== 'opportunity')
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 3)

  if (ignored.length === 0) {
    return {
      questionType: 'being_ignored',
      responseText: 'Nothing appears to be aging without attention. All signals are recent (under 7 days).',
      navigationHint: null,
      confidence: 'medium',
    }
  }

  const lines = ['**Items going unaddressed:**']
  for (const s of ignored) {
    lines.push(`• **${s.title}** — ${s.ageDays} days pending${s.isEscalated ? ' [ESCALATED]' : ''}`)
    lines.push(`  Action: ${s.suggestedAction}`)
  }

  return {
    questionType: 'being_ignored',
    responseText: lines.join('\n'),
    navigationHint: ignored[0]?.targetEntityRoute ?? null,
    confidence: 'high',
  }
}

function answerReviewToday(signals: OperatingSignal[], guidance: DirectorGuidance): OperatingQuestionResult {
  const reviewable = signals
    .filter(s => s.type === 'recommendation' || s.type === 'attention')
    .slice(0, 5)

  const lines = ['**Review queue today:**']

  if (reviewable.length > 0) {
    for (const s of reviewable) {
      lines.push(`• ${s.title}`)
    }
  } else {
    lines.push(`• ${guidance.highestLeverageAction}`)
  }

  return {
    questionType: 'review_today',
    responseText: lines.join('\n'),
    navigationHint: '/director/review',
    confidence: 'high',
  }
}

function answerWhatWouldYouDo(guidance: DirectorGuidance, health: AcademyHealthModelV2): OperatingQuestionResult {
  const lines = [
    `If I were directing this academy today, I would start with:`,
    '',
    `**${guidance.highestLeverageAction}**`,
    '',
    `${guidance.whyItMatters} ${guidance.expectedImpact}`,
    '',
    `Time commitment: ${guidance.timeEstimate}.`,
  ]

  if (guidance.alternativeActions.length > 0) {
    lines.push('')
    lines.push(`After that, I'd address: ${guidance.alternativeActions[0]}`)
  }

  lines.push('')
  lines.push(`Academy health is ${health.overall}/100 — ${health.healthLabel.toLowerCase()}. ${health.trend === 'declining' ? 'The trend is declining — act on this today.' : health.trend === 'improving' ? 'The trend is improving.' : 'The trend is stable.'}`)

  return {
    questionType: 'what_would_you_do',
    responseText: lines.join('\n'),
    navigationHint: guidance.navigationTarget,
    confidence: guidance.confidence,
  }
}

// ── Main dispatch ──────────────────────────────────────────────────────────────

export function answerOperatingQuestion(
  questionType: OperatingQuestionType,
  guidance:     DirectorGuidance,
  signals:      OperatingSignal[],
  health:       AcademyHealthModelV2,
): OperatingQuestionResult {
  switch (questionType) {
    case 'what_next':       return answerWhatNext(guidance)
    case 'what_missing':    return answerWhatMissing(signals, health)
    case 'getting_worse':   return answerGettingWorse(signals, health)
    case 'improving':       return answerImproving(health)
    case 'most_urgent':     return answerMostUrgent(signals, guidance)
    case 'most_important':  return answerMostImportant(guidance, health)
    case 'being_ignored':   return answerBeingIgnored(signals)
    case 'review_today':    return answerReviewToday(signals, guidance)
    case 'what_would_you_do': return answerWhatWouldYouDo(guidance, health)
  }
}
