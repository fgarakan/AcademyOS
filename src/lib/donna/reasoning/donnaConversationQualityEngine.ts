// Sprint 1911–1960 — DONNA Reasoning + Memory Optimization V1
// Conversation quality engine.
//
// Improves the felt quality of DONNA responses:
//   - Reduces robotic repetition ("As I mentioned...")
//   - Improves follow-up naturalness
//   - Applies human COO tone rules
//   - Validates response completeness (Answer + Reason + Next + Follow-up)
//   - Trims redundant filler phrases
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Deterministic: same input → same output.
//   - Conservative: only removes clearly robotic patterns.
//   - Never removes the Answer or Follow-up sections.

import type { GoalResult } from '@/lib/donna/goals/donnaGoalEngine'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QualityImprovedResponse {
  /** Improved markdown response for display */
  display: string
  /** TTS-safe version of the improved response */
  spoken: string
}

// ── Robotic phrase removal ────────────────────────────────────────────────────
// These phrases sound robotic or redundant in a COO voice.

const ROBOTIC_FILLERS = [
  'As an AI assistant,',
  'As an AI,',
  'I am an AI',
  'As DONNA,',
  'Based on the information provided,',
  'Based on the data,',
  'I would like to note that',
  'It is important to note that',
  'Please note that',
  'I want to make sure you understand that',
  'That being said,',
  'Having said that,',
  'In conclusion,',
  'To summarize,',
  'In summary,',
  'Without further ado,',
]

function removeRoboticFillers(text: string): string {
  let result = text
  for (const filler of ROBOTIC_FILLERS) {
    result = result.replace(new RegExp(filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '')
  }
  // Clean up double spaces and leading whitespace
  return result.replace(/  +/g, ' ').replace(/^\s+/gm, '').trim()
}

// ── Repetition detection ──────────────────────────────────────────────────────
// Checks if the response repeats content from recent conversation turns.

function detectsRepetition(
  response: string,
  conversationHistory: Array<{ role: 'user' | 'donna'; content: string }>,
): boolean {
  if (conversationHistory.length === 0) return false
  const lastDonnaResponses = conversationHistory
    .filter(t => t.role === 'donna')
    .slice(-2)
    .map(t => t.content.toLowerCase())

  const responseLower = response.toLowerCase()
  const responseWords = responseLower.split(' ').filter(w => w.length > 4)

  for (const prev of lastDonnaResponses) {
    const prevWords = prev.split(' ').filter(w => w.length > 4)
    const overlap = responseWords.filter(w => prevWords.includes(w))
    if (overlap.length > responseWords.length * 0.6) return true
  }

  return false
}

// ── Natural follow-up phrases ─────────────────────────────────────────────────
// Context-aware follow-up questions based on goal type.

const GOAL_FOLLOW_UPS: Partial<Record<string, string[]>> = {
  curriculum_completion: [
    'Would you like me to walk you through building this level?',
    'Should I start the curriculum builder for this?',
    'Would you like me to guide you through the steps?',
  ],
  assessment_completion: [
    'Would you like me to guide you through the assessment?',
    'Should we start the assessment workflow?',
    'Would you like to begin?',
  ],
  parent_update_completion: [
    'Would you like me to help you draft this update?',
    'Should I walk you through creating the parent update?',
    "Want me to guide you through the update?",
  ],
  player_progress_review: [
    "Would you like me to pull up this player's signals?",
    "Should I walk you through the progress review?",
    "Want me to show you what I know about this player?",
  ],
  review_queue_clear: [
    'Would you like to open the review queue now?',
    'Should we start clearing the queue?',
    'Want me to take you there?',
  ],
  readiness_review_completion: [
    'Would you like me to walk you through the readiness review?',
    "Should I pull up this player's readiness signals?",
    'Want to start the review?',
  ],
  general_guidance: [
    'What would you like to focus on?',
    'Where would you like to start?',
    'What can I help you with first?',
  ],
}

/**
 * Build a natural follow-up question for a given goal result.
 * Varies the phrasing to avoid repetition.
 */
export function buildFollowUpForGoal(
  goal: GoalResult | null,
  entityLabel: string | null,
): string | null {
  if (!goal) return null

  const options = GOAL_FOLLOW_UPS[goal.goal]
  if (!options || options.length === 0) {
    return goal.workflowCandidate
      ? 'Would you like me to walk you through it?'
      : 'What would you like to do next?'
  }

  // Pick a phrase — use a simple hash of the entityLabel to vary between calls
  const hash = entityLabel
    ? entityLabel.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    : 0
  const index = hash % options.length
  return options[index]!
}

// ── Main quality improver ─────────────────────────────────────────────────────

/**
 * Apply quality improvements to a DONNA response.
 * - Removes robotic fillers
 * - Detects and flags repetition (does not auto-remove — returns flag)
 * - Rebuilds TTS-safe spoken version
 */
export function improveResponseQuality(
  responseDisplay: string,
  conversationHistory: Array<{ role: 'user' | 'donna'; content: string }>,
): QualityImprovedResponse {
  // Remove robotic fillers
  let improved = removeRoboticFillers(responseDisplay)

  // If repetition detected, prepend a brief variation prefix
  if (detectsRepetition(improved, conversationHistory)) {
    // Don't re-explain — acknowledge and redirect
    improved = improved.replace(
      /^(Here'?s?|This is|As I mentioned|I mentioned)/i,
      'To add to that —',
    )
  }

  // Build TTS spoken version
  let spoken = improved
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (spoken.length > 200) {
    const candidate = spoken.slice(0, 200)
    const sentEnd = Math.max(candidate.lastIndexOf('. '), candidate.lastIndexOf('? '))
    spoken = sentEnd > 120 ? candidate.slice(0, sentEnd + 1) : candidate.slice(0, 197) + '…'
  }

  return { display: improved, spoken }
}

// ── Response completeness validator ──────────────────────────────────────────

export interface ResponseCompletenessCheck {
  hasAnswer: boolean
  hasReason: boolean
  hasNextAction: boolean
  hasFollowUp: boolean
  isComplete: boolean
  missingParts: string[]
}

export function checkResponseCompleteness(response: string): ResponseCompletenessCheck {
  const lower = response.toLowerCase()
  const hasAnswer = response.trim().length > 0
  const hasReason = lower.includes('reason') || lower.includes('because') || lower.includes('this matters')
  const hasNextAction = lower.includes('next') || lower.includes('step') || lower.includes('walk you through')
  const hasFollowUp = lower.includes('would you like') || lower.includes('should i') || lower.includes('want me to') || lower.includes('?')

  const missingParts: string[] = []
  if (!hasReason) missingParts.push('reason')
  if (!hasNextAction) missingParts.push('next action')
  if (!hasFollowUp) missingParts.push('follow-up question')

  return {
    hasAnswer,
    hasReason,
    hasNextAction,
    hasFollowUp,
    isComplete: missingParts.length === 0,
    missingParts,
  }
}
