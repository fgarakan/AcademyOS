// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Part 4 — Best Next Question Engine
//
// Selects the highest-value clarification question when DONNA needs more information.
// Complements the existing intent/donnaClarificationEngine.ts (Director-only).
// This module adds information-gain scoring across all roles.
//
// Ranking criteria:
//   1. Information gain — how much does this question reduce ambiguity?
//   2. Confidence improvement — will the answer raise confidence above the action threshold?
//   3. Speed to resolution — how directly does this lead to action?
//   4. Actionability — will the answer enable a concrete DONNA output?
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Does NOT replace donnaClarificationEngine.ts — adds information gain scoring layer.
//   - Returns exactly ONE best question per turn (contract rule: one question max).
//   - Always prefers specific + bounded choices over open-ended prompts.

import type { InterpreterRole } from './donnaIntentInterpreter'
import type { AcademyOSConcept } from './donnaMeaningExtractor'
import type { AcademyDNAModelId } from '../../academyDNA/academyDNAModels'

// ── Question candidate ────────────────────────────────────────────────────────

export interface QuestionCandidate {
  questionText: string
  informationGain: number        // 0–1: how much ambiguity this resolves
  confidenceImprovement: number  // 0–1: estimated confidence lift from the answer
  speedToResolution: number      // 0–1: how directly this leads to an action
  actionability: number          // 0–1: likelihood the answer enables concrete output
  totalScore: number             // weighted composite
  domains: string[]              // which AcademyOS domains this question clarifies
}

// ── Score weights ─────────────────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  informationGain:        0.35,
  confidenceImprovement:  0.30,
  speedToResolution:      0.20,
  actionability:          0.15,
}

function computeScore(candidate: Omit<QuestionCandidate, 'totalScore'>): number {
  return (
    candidate.informationGain        * SCORE_WEIGHTS.informationGain +
    candidate.confidenceImprovement  * SCORE_WEIGHTS.confidenceImprovement +
    candidate.speedToResolution      * SCORE_WEIGHTS.speedToResolution +
    candidate.actionability          * SCORE_WEIGHTS.actionability
  )
}

// ── Best question result ──────────────────────────────────────────────────────

export interface BestNextQuestionResult {
  question: string
  reason: string                  // why this question was chosen
  domains: string[]               // domains clarified by this question
  isChoiceQuestion: boolean       // true = choice-based; false = open question
  choices: string[] | null        // if choice question, the options presented
  totalScore: number
}

// ── Director question bank ────────────────────────────────────────────────────

interface QuestionSpec {
  id: string
  forConcepts: AcademyOSConcept[]
  forRoles: InterpreterRole[]
  questionText: string
  choices?: string[]
  informationGain: number
  confidenceImprovement: number
  speedToResolution: number
  actionability: number
  domains: string[]
}

const QUESTION_BANK: QuestionSpec[] = [
  // Enrollment / group size
  {
    id: 'enrollment_scope',
    forConcepts: ['enrollment_issue'],
    forRoles: ['director'],
    questionText: 'Are you referring to a specific group — like Orange Ball — or the academy intake pipeline overall?',
    choices: ['Specific group (e.g. Orange Ball)', 'Overall intake pipeline', 'Multiple groups'],
    informationGain: 0.90,
    confidenceImprovement: 0.85,
    speedToResolution: 0.80,
    actionability: 0.85,
    domains: ['enrollment', 'groups'],
  },
  // Retention risk
  {
    id: 'retention_signal_source',
    forConcepts: ['retention_risk'],
    forRoles: ['director', 'coach'],
    questionText: 'Is this concern about a specific player, or are you noticing a group-level pattern?',
    choices: ['Specific player', 'Group pattern', 'Academy-wide trend'],
    informationGain: 0.85,
    confidenceImprovement: 0.80,
    speedToResolution: 0.75,
    actionability: 0.80,
    domains: ['retention', 'players'],
  },
  // Parent concern
  {
    id: 'parent_concern_type',
    forConcepts: ['parent_concern'],
    forRoles: ['director', 'coach'],
    questionText: 'Is this a specific parent concern, or are you seeing a pattern across multiple families?',
    choices: ['One parent', 'Multiple parents', "General sense from today's session"],
    informationGain: 0.80,
    confidenceImprovement: 0.75,
    speedToResolution: 0.70,
    actionability: 0.85,
    domains: ['parents', 'communication'],
  },
  // Progression / stall
  {
    id: 'stall_scope',
    forConcepts: ['progression_issue'],
    forRoles: ['director', 'coach'],
    questionText: 'Is this about a specific player, or are you seeing multiple players stalling?',
    choices: ['One player', 'A few players', 'The whole group'],
    informationGain: 0.85,
    confidenceImprovement: 0.80,
    speedToResolution: 0.75,
    actionability: 0.80,
    domains: ['players', 'assessments'],
  },
  // Session quality
  {
    id: 'session_issue_type',
    forConcepts: ['session_quality', 'engagement_issue', 'effort_issue'],
    forRoles: ['coach'],
    questionText: 'What was the main issue? Was it effort, focus, a specific drill that did not land, or something else?',
    choices: ['Effort / motivation', 'Focus / attention', 'Drill did not work', 'Energy level'],
    informationGain: 0.85,
    confidenceImprovement: 0.80,
    speedToResolution: 0.80,
    actionability: 0.75,
    domains: ['session', 'curriculum'],
  },
  // Group difficulty
  {
    id: 'group_difficulty_cause',
    forConcepts: ['grouping_issue', 'focus_issue', 'curriculum_issue'],
    forRoles: ['coach'],
    questionText: 'Is the group struggling because of mixed skill levels, focus problems, or the content being off?',
    choices: ['Mixed skill levels', 'Focus / attention', 'Content too hard or too easy', 'All of the above'],
    informationGain: 0.90,
    confidenceImprovement: 0.85,
    speedToResolution: 0.75,
    actionability: 0.80,
    domains: ['groups', 'curriculum', 'session'],
  },
  // Player observation — coach
  {
    id: 'observation_specificity',
    forConcepts: ['progression_issue', 'readiness_issue', 'confidence_issue'],
    forRoles: ['coach'],
    questionText: 'Which player are you referring to, and is this a technical issue, a focus issue, or a motivation issue?',
    choices: ['Technical skill', 'Focus / attention', 'Motivation / confidence', 'Not sure yet'],
    informationGain: 0.85,
    confidenceImprovement: 0.80,
    speedToResolution: 0.75,
    actionability: 0.85,
    domains: ['players', 'observations'],
  },
  // Parent concern — parent role
  {
    id: 'parent_progress_area',
    forConcepts: ['progression_issue', 'expectation_issue'],
    forRoles: ['parent'],
    questionText: 'What area are you most concerned about — technical skills, match results, or how your child feels about practice?',
    choices: ['Technical skills', 'Match results', 'Enjoyment and motivation'],
    informationGain: 0.85,
    confidenceImprovement: 0.80,
    speedToResolution: 0.70,
    actionability: 0.75,
    domains: ['parents', 'player_development'],
  },
  // Confidence concern — parent
  {
    id: 'confidence_onset',
    forConcepts: ['confidence_issue'],
    forRoles: ['parent'],
    questionText: 'When did you first notice this — was it after a specific match or session, or has it been gradual?',
    choices: ['After a specific match or loss', 'After a specific session', 'Gradually over time'],
    informationGain: 0.80,
    confidenceImprovement: 0.75,
    speedToResolution: 0.70,
    actionability: 0.70,
    domains: ['player_development', 'parents'],
  },
  // Player stuck
  {
    id: 'player_stuck_area',
    forConcepts: ['progression_issue', 'readiness_issue'],
    forRoles: ['player'],
    questionText: 'Is it a specific shot that is frustrating you, or does the whole game feel off right now?',
    choices: ['A specific shot (serve, forehand, etc.)', 'Overall game feeling off', 'Match performance'],
    informationGain: 0.80,
    confidenceImprovement: 0.75,
    speedToResolution: 0.70,
    actionability: 0.70,
    domains: ['player_development'],
  },
  // What to focus on — director general
  {
    id: 'director_general_focus',
    forConcepts: [],   // catch-all for low-confidence director inputs
    forRoles: ['director'],
    questionText: 'Do you mean enrollment, player progression, or coach execution?',
    choices: ['Enrollment', 'Player progression', 'Coach execution', 'All three'],
    informationGain: 0.85,
    confidenceImprovement: 0.80,
    speedToResolution: 0.75,
    actionability: 0.80,
    domains: ['enrollment', 'players', 'coaches'],
  },
  // Assessment
  {
    id: 'assessment_context',
    forConcepts: ['assessment_need'],
    forRoles: ['director', 'coach'],
    questionText: 'Is this about a specific player who is overdue, or are you asking about the general assessment schedule?',
    choices: ['Specific player overdue', 'General schedule review', 'Multiple players overdue'],
    informationGain: 0.85,
    confidenceImprovement: 0.80,
    speedToResolution: 0.80,
    actionability: 0.85,
    domains: ['assessments'],
  },
]

// ── Selector ──────────────────────────────────────────────────────────────────

/**
 * Select the best clarifying question given the current context.
 *
 * @param role — the user's role
 * @param topConcepts — ranked concepts extracted from the message
 * @param currentConfidence — current intent confidence (0–1)
 * @param dnaModelId — optional academy DNA model for context-sensitive questions
 */
export function selectBestNextQuestion(params: {
  role: InterpreterRole
  topConcepts: AcademyOSConcept[]
  currentConfidence: number
  dnaModelId?: AcademyDNAModelId | null
}): BestNextQuestionResult | null {
  const { role, topConcepts, currentConfidence } = params

  // If confidence is already high enough, no question needed
  if (currentConfidence >= 0.75) return null

  // Filter candidates by role and concept relevance
  const candidates = QUESTION_BANK.filter(q => {
    if (!q.forRoles.includes(role)) return false
    if (q.forConcepts.length === 0) return true  // catch-all
    return topConcepts.some(c => q.forConcepts.includes(c))
  })

  if (candidates.length === 0) {
    return buildFallbackQuestion(role)
  }

  // Score each candidate
  const scored = candidates.map(q => {
    const base = computeScore({
      questionText: q.questionText,
      informationGain: q.informationGain,
      confidenceImprovement: q.confidenceImprovement,
      speedToResolution: q.speedToResolution,
      actionability: q.actionability,
      domains: q.domains,
    })
    // Boost candidates that match top concept exactly
    const conceptBoost = topConcepts[0] && q.forConcepts.includes(topConcepts[0]) ? 0.10 : 0
    return { q, score: base + conceptBoost }
  })
    .sort((a, b) => b.score - a.score)

  const best = scored[0]

  return {
    question: best.q.questionText,
    reason: `Highest information gain (${(best.q.informationGain * 100).toFixed(0)}%) for "${topConcepts[0] ?? 'unknown'}" concept.`,
    domains: best.q.domains,
    isChoiceQuestion: Boolean(best.q.choices && best.q.choices.length > 0),
    choices: best.q.choices ?? null,
    totalScore: best.score,
  }
}

// ── Fallback question ─────────────────────────────────────────────────────────

function buildFallbackQuestion(role: InterpreterRole): BestNextQuestionResult {
  const roleQuestions: Record<InterpreterRole, { q: string; choices: string[] }> = {
    director: {
      q: 'Do you mean enrollment, player progression, or coach execution?',
      choices: ['Enrollment', 'Player progression', 'Coach execution'],
    },
    coach: {
      q: "What's on your mind from today's session — a player, the group, or the session overall?",
      choices: ['Specific player', 'Group issue', 'Overall session'],
    },
    parent: {
      q: 'What would be most helpful — an update on progress, scheduling, or speaking with someone?',
      choices: ['Progress update', 'Schedule question', 'Speak with staff'],
    },
    player: {
      q: 'What would you like help with today — what to practice, your progress, or an upcoming match?',
      choices: ['What to practice', 'My progress', 'Upcoming match'],
    },
  }

  const { q, choices } = roleQuestions[role]

  return {
    question: q,
    reason: 'Fallback question — no matching concept found.',
    domains: ['general'],
    isChoiceQuestion: true,
    choices,
    totalScore: 0.55,
  }
}

// ── Format for display ────────────────────────────────────────────────────────

/**
 * Format the best next question as a DONNA message.
 */
export function formatBestNextQuestion(result: BestNextQuestionResult): string {
  if (!result.isChoiceQuestion || !result.choices) {
    return result.question
  }

  const choiceLines = result.choices
    .map((c, i) => `${i + 1}. ${c}`)
    .join('\n')

  return `${result.question}\n\n${choiceLines}`
}
