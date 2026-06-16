// Sprint 2831–2860 — DONNA Conversational Intelligence & Learning Foundation V1
// Part 10 — Conversation Training Sandbox
//
// Runs conversation simulations to identify successful patterns and failure modes.
// Stores successful and failed patterns for future learning.
//
// Simulates:
//   - Director conversations
//   - Coach conversations
//   - Parent conversations
//   - Player conversations
//
// Measures:
//   - Intent accuracy
//   - Clarification quality
//   - Stage completion
//   - Response style compliance
//
// Does NOT call OpenAI in the base sandbox — runs purely deterministic simulations.
// Optional: can call the ConversationTeacher to enrich patterns.
//
// Design rules:
//   - Pure TypeScript. No DB, no React, no side effects.
//   - Runs as a standalone module — can be executed via npx tsx.

import { interpretIntent } from './donnaIntentInterpreter'
import { extractMeaning } from './donnaMeaningExtractor'
import { selectBestNextQuestion } from './donnaBestNextQuestion'
import { validateResponseStyle } from './donnaResponseStyle'
import { createInitialNavigatorState, advanceConversation } from './donnaConversationNavigator'
import type { InterpreterRole } from './donnaIntentInterpreter'
import type { AcademyOSConcept } from './donnaMeaningExtractor'

// ── Scenario types ────────────────────────────────────────────────────────────

export interface ConversationScenario {
  id: string
  description: string
  role: InterpreterRole
  turns: ConversationTurnSpec[]
  expectedIntents: string[]                   // what DONNA should interpret
  expectedConcepts: AcademyOSConcept[]        // what concepts should surface
  expectedStageReached: string                // minimum stage expected
  dnaModelId?: string
}

export interface ConversationTurnSpec {
  userText: string
  expectedConcept?: AcademyOSConcept
  expectedIntentConfidence?: number           // minimum expected confidence
}

// ── Sandbox result ────────────────────────────────────────────────────────────

export type SandboxResultStatus = 'pass' | 'partial' | 'fail'

export interface SandboxTurnResult {
  turnIndex: number
  userText: string
  interpretedIntent: string
  intentConfidence: number
  topConcept: AcademyOSConcept | null
  conceptConfidence: number
  bestNextQuestion: string | null
  navigationStage: string
  styleCompliant: boolean
  dummyResponse: string
}

export interface SandboxResult {
  scenarioId: string
  description: string
  role: InterpreterRole
  status: SandboxResultStatus
  score: number                              // 0–100
  turnResults: SandboxTurnResult[]
  intentAccuracy: number                     // 0–1
  conceptAccuracy: number                    // 0–1
  stageReached: string
  failureReasons: string[]
  patternType: 'successful' | 'failed' | 'partial'
  notes: string
}

// ── Pattern store ─────────────────────────────────────────────────────────────

export interface StoredPattern {
  patternId: string
  role: InterpreterRole
  inputExamples: string[]
  detectedConcepts: AcademyOSConcept[]
  bestQuestion: string | null
  successRate: number
  type: 'successful' | 'failed' | 'partial'
  capturedAt: string
}

const successfulPatterns: StoredPattern[] = []
const failedPatterns: StoredPattern[] = []

// ── Scenario runner ───────────────────────────────────────────────────────────

/**
 * Run a single conversation scenario through the full interpretation pipeline.
 */
export function runConversationScenario(scenario: ConversationScenario): SandboxResult {
  const turnResults: SandboxTurnResult[] = []
  const failureReasons: string[] = []
  let state = createInitialNavigatorState(scenario.role)

  let intentAccuracySum = 0
  let conceptAccuracySum = 0

  for (let i = 0; i < scenario.turns.length; i++) {
    const turn = scenario.turns[i]

    // Interpret intent
    const intentResult = interpretIntent(turn.userText, scenario.role)

    // Extract meaning
    const meaningResult = extractMeaning(turn.userText, scenario.role)

    // Get best next question
    const questionResult = selectBestNextQuestion({
      role: scenario.role,
      topConcepts: meaningResult.interpretations.slice(0, 3).map(m => m.concept),
      currentConfidence: intentResult.confidence,
    })

    // Build dummy DONNA response for style validation
    const dummyResponse = questionResult
      ? questionResult.question
      : `${meaningResult.topConcept ? meaningResult.topConcept.replace(/_/g, ' ') + ' noted.' : 'Noted.'} Let me pull the data.`

    // Validate style
    const styleResult = validateResponseStyle(dummyResponse)

    // Advance navigator
    const navOutput = advanceConversation(state, {
      userText: turn.userText,
      topConcept: meaningResult.topConcept,
      intentConfidence: intentResult.confidence,
      extractedEntity: intentResult.extractedEntity,
      donnaQuestionAsked: questionResult !== null,
    })
    state = navOutput.updatedState

    // Compute accuracy for this turn
    const expectedConcept = turn.expectedConcept
    const conceptMatch = expectedConcept
      ? meaningResult.topConcept === expectedConcept ||
        meaningResult.interpretations.some(m => m.concept === expectedConcept)
      : true

    const confTarget = turn.expectedIntentConfidence ?? 0.40
    const confMet = intentResult.confidence >= confTarget

    const turnScore = (conceptMatch ? 0.5 : 0) + (confMet ? 0.5 : 0)
    intentAccuracySum += confMet ? 1 : 0
    conceptAccuracySum += conceptMatch ? 1 : 0

    turnResults.push({
      turnIndex: i,
      userText: turn.userText,
      interpretedIntent: String(intentResult.primaryIntent),
      intentConfidence: intentResult.confidence,
      topConcept: meaningResult.topConcept,
      conceptConfidence: meaningResult.topConfidence,
      bestNextQuestion: questionResult?.question ?? null,
      navigationStage: navOutput.stage,
      styleCompliant: styleResult.passes,
      dummyResponse,
    })

    // Check turn-level failures
    if (expectedConcept && !conceptMatch) {
      failureReasons.push(
        `Turn ${i}: Expected concept "${expectedConcept}", got "${meaningResult.topConcept ?? 'none'}"`,
      )
    }
    if (!confMet) {
      failureReasons.push(
        `Turn ${i}: Confidence ${(intentResult.confidence * 100).toFixed(0)}% < target ${(confTarget * 100).toFixed(0)}%`,
      )
    }
  }

  const turnCount = Math.max(scenario.turns.length, 1)
  const intentAccuracy = intentAccuracySum / turnCount
  const conceptAccuracy = conceptAccuracySum / turnCount

  // Check stage reached
  const stageReached = state.stage
  const stageOrder: Record<string, number> = {
    question: 1, understanding: 2, action: 3, completion: 4, blocked: 0,
  }
  const stageExpected = stageOrder[scenario.expectedStageReached] ?? 1
  const stageActual = stageOrder[stageReached] ?? 0
  const stageMet = stageActual >= stageExpected

  if (!stageMet) {
    failureReasons.push(
      `Stage reached "${stageReached}", expected at least "${scenario.expectedStageReached}"`,
    )
  }

  // Compute overall score
  const score = Math.round(
    (intentAccuracy * 40) +
    (conceptAccuracy * 40) +
    (stageMet ? 20 : 0),
  )

  const status: SandboxResultStatus =
    score >= 80 ? 'pass' : score >= 50 ? 'partial' : 'fail'

  const patternType = status === 'pass' ? 'successful' : status === 'partial' ? 'partial' : 'failed'

  // Store the pattern
  const pattern: StoredPattern = {
    patternId: `pat-${scenario.id}-${Date.now()}`,
    role: scenario.role,
    inputExamples: scenario.turns.map(t => t.userText),
    detectedConcepts: turnResults
      .map(t => t.topConcept)
      .filter((c): c is AcademyOSConcept => c !== null),
    bestQuestion: turnResults[0]?.bestNextQuestion ?? null,
    successRate: score / 100,
    type: patternType,
    capturedAt: new Date().toISOString(),
  }

  if (patternType === 'successful') {
    successfulPatterns.push(pattern)
  } else {
    failedPatterns.push(pattern)
  }

  return {
    scenarioId: scenario.id,
    description: scenario.description,
    role: scenario.role,
    status,
    score,
    turnResults,
    intentAccuracy,
    conceptAccuracy,
    stageReached,
    failureReasons,
    patternType,
    notes: failureReasons.length === 0
      ? `All checks passed. Stage: ${stageReached}.`
      : `${failureReasons.length} issue(s): ${failureReasons[0]}`,
  }
}

// ── Pattern retrieval ─────────────────────────────────────────────────────────

export function getSuccessfulPatterns(): StoredPattern[] {
  return [...successfulPatterns]
}

export function getFailedPatterns(): StoredPattern[] {
  return [...failedPatterns]
}

// ── Training report ───────────────────────────────────────────────────────────

export interface TrainingReport {
  totalScenarios: number
  passed: number
  partial: number
  failed: number
  overallPassRate: number
  avgIntentAccuracy: number
  avgConceptAccuracy: number
  commonFailures: string[]
  successfulPatternCount: number
  failedPatternCount: number
  summary: string
}

export function buildTrainingReport(results: SandboxResult[]): TrainingReport {
  const total = results.length
  const passed = results.filter(r => r.status === 'pass').length
  const partial = results.filter(r => r.status === 'partial').length
  const failed = results.filter(r => r.status === 'fail').length

  const avgIntentAccuracy = total > 0
    ? results.reduce((sum, r) => sum + r.intentAccuracy, 0) / total
    : 0

  const avgConceptAccuracy = total > 0
    ? results.reduce((sum, r) => sum + r.conceptAccuracy, 0) / total
    : 0

  // Collect common failure patterns
  const failureCounts = new Map<string, number>()
  for (const result of results) {
    for (const reason of result.failureReasons) {
      const key = reason.replace(/Turn \d+:/, 'Turn X:')
      failureCounts.set(key, (failureCounts.get(key) ?? 0) + 1)
    }
  }
  const commonFailures = Array.from(failureCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => `${reason} (×${count})`)

  const passRate = total > 0 ? passed / total : 0

  const summary = total === 0
    ? 'No scenarios run.'
    : `${passed}/${total} passed (${(passRate * 100).toFixed(0)}%). ` +
      `Intent accuracy: ${(avgIntentAccuracy * 100).toFixed(0)}%. ` +
      `Concept accuracy: ${(avgConceptAccuracy * 100).toFixed(0)}%.`

  return {
    totalScenarios: total,
    passed,
    partial,
    failed,
    overallPassRate: passRate,
    avgIntentAccuracy,
    avgConceptAccuracy,
    commonFailures,
    successfulPatternCount: successfulPatterns.length,
    failedPatternCount: failedPatterns.length,
    summary,
  }
}

// ── Pre-built scenario library ────────────────────────────────────────────────

export const BUILT_IN_SCENARIOS: ConversationScenario[] = [
  // ── Director scenarios ──────────────────────────────────────────────────────
  {
    id: 'dir-enrollment-vague',
    description: 'Director: vague enrollment concern',
    role: 'director',
    turns: [
      { userText: 'Orange looks weird.', expectedConcept: 'enrollment_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['player_progress_review', 'general_help'],
    expectedConcepts: ['enrollment_issue'],
    expectedStageReached: 'understanding',
  },
  {
    id: 'dir-parent-frustration',
    description: 'Director: parents seem frustrated',
    role: 'director',
    turns: [
      { userText: 'Parents seem frustrated.', expectedConcept: 'parent_concern', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['parent_communication'],
    expectedConcepts: ['parent_concern', 'retention_risk'],
    expectedStageReached: 'understanding',
  },
  {
    id: 'dir-general-how',
    description: 'Director: how\'s everything looking',
    role: 'director',
    turns: [
      { userText: "How's everything looking?", expectedIntentConfidence: 0.30 },
    ],
    expectedIntents: ['general_help'],
    expectedConcepts: [],
    expectedStageReached: 'question',
  },
  {
    id: 'dir-focus-question',
    description: 'Director: I don\'t know what to focus on',
    role: 'director',
    turns: [
      { userText: "I don't know what to focus on.", expectedIntentConfidence: 0.30 },
    ],
    expectedIntents: ['general_help'],
    expectedConcepts: [],
    expectedStageReached: 'question',
  },
  {
    id: 'dir-enrollment-clear',
    description: 'Director: why is enrollment down',
    role: 'director',
    turns: [
      { userText: 'Why is enrollment down?', expectedConcept: 'enrollment_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['player_progress_review'],
    expectedConcepts: ['enrollment_issue'],
    expectedStageReached: 'understanding',
  },
  // ── Coach scenarios ─────────────────────────────────────────────────────────
  {
    id: 'coach-bad-practice',
    description: 'Coach: practice wasn\'t great',
    role: 'coach',
    turns: [
      { userText: "Practice wasn't great.", expectedConcept: 'session_quality', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['session_feedback'],
    expectedConcepts: ['session_quality', 'engagement_issue'],
    expectedStageReached: 'understanding',
  },
  {
    id: 'coach-kids-struggling',
    description: 'Coach: a few kids struggled',
    role: 'coach',
    turns: [
      { userText: 'A few kids struggled today.', expectedConcept: 'progression_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['player_observation'],
    expectedConcepts: ['progression_issue', 'readiness_issue'],
    expectedStageReached: 'understanding',
  },
  {
    id: 'coach-difficult-group',
    description: 'Coach: this group is difficult',
    role: 'coach',
    turns: [
      { userText: 'This group is difficult.', expectedConcept: 'grouping_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['group_difficulty'],
    expectedConcepts: ['grouping_issue', 'focus_issue'],
    expectedStageReached: 'understanding',
  },
  {
    id: 'coach-flat-session',
    description: 'Coach: today\'s session felt flat',
    role: 'coach',
    turns: [
      { userText: "Today's session felt flat.", expectedConcept: 'engagement_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['session_feedback'],
    expectedConcepts: ['engagement_issue', 'session_quality'],
    expectedStageReached: 'understanding',
  },
  // ── Parent scenarios ────────────────────────────────────────────────────────
  {
    id: 'parent-no-improvement',
    description: 'Parent: I don\'t think she\'s improving',
    role: 'parent',
    turns: [
      { userText: "I don't think she's improving.", expectedConcept: 'progression_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['progress_concern'],
    expectedConcepts: ['progression_issue'],
    expectedStageReached: 'understanding',
  },
  {
    id: 'parent-confidence',
    description: 'Parent: he\'s losing confidence',
    role: 'parent',
    turns: [
      { userText: "He's losing confidence.", expectedConcept: 'confidence_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['confidence_concern'],
    expectedConcepts: ['confidence_issue'],
    expectedStageReached: 'understanding',
  },
  {
    id: 'parent-no-results',
    description: 'Parent: we\'re not seeing results',
    role: 'parent',
    turns: [
      { userText: "We're not seeing results.", expectedConcept: 'progression_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['progress_concern'],
    expectedConcepts: ['progression_issue', 'expectation_issue'],
    expectedStageReached: 'understanding',
  },
  // ── Player scenarios ────────────────────────────────────────────────────────
  {
    id: 'player-what-to-do',
    description: 'Player: what should I work on?',
    role: 'player',
    turns: [
      { userText: 'What should I work on?', expectedConcept: 'readiness_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['what_to_practice'],
    expectedConcepts: [],
    expectedStageReached: 'question',
  },
  {
    id: 'player-stuck',
    description: 'Player: I feel stuck',
    role: 'player',
    turns: [
      { userText: "I feel stuck and can't get better.", expectedConcept: 'progression_issue', expectedIntentConfidence: 0.35 },
    ],
    expectedIntents: ['feeling_stuck'],
    expectedConcepts: ['progression_issue'],
    expectedStageReached: 'understanding',
  },
]
