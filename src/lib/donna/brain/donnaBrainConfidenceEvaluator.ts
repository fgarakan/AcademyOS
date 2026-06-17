// Mega Sprint 2971–3000 — DONNA Live AI Conversation + Learning Router V1
// Part 1 — Brain Confidence Evaluator
//
// Determines whether a vague input that fell through Step 15.5 is a good
// candidate for Live AI assist (Step 15.6) vs. the full COO prompt chain (Step 16).
//
// AI assist is appropriate for: short, qualitative, emotional, or observational inputs
// that carry meaning but match no deterministic phrase, entity, or goal pattern.
//
// AI assist is NOT appropriate for: data queries, action requests, complex multi-part
// questions, or inputs that benefit from the COO reasoning and data retrieval chain.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Conservative: when in doubt, defer to route_coo_prompt (Step 16).
//   - Does not replace confidenceScoring.ts — extends it for the AI routing gate.

import type { TeacherMode } from '@/lib/donna/conversation/donnaConversationTeacher'

// ── Eligibility result ────────────────────────────────────────────────────────

export interface AIAssistEligibility {
  eligible: boolean
  reason: string
  suggestedMode: TeacherMode
}

// ── Patterns that disqualify AI assist ───────────────────────────────────────

// Data query markers — these need DB access; route_coo_prompt handles retrieval.
const DATA_QUERY_PATTERNS = [
  /\b(show me|list|who is|who are|how many|what is the|get me|pull up|display|find)\b/i,
  /\b(how many|count|total|number of)\b/i,
  /\b(brief|summary|report|dashboard|stats|statistics)\b/i,
]

// Action request markers — these need the approval pipeline, not language interpretation.
const ACTION_REQUEST_PATTERNS = [
  /\b(let'?s|we should|can you|could you|please|i need you to|make|create|start|send|schedule)\b/i,
  /\b(approve|reject|move|reassign|update|change|delete|add|draft)\b/i,
]

// ── Evaluator ─────────────────────────────────────────────────────────────────

/**
 * Evaluate whether a vague input is eligible for Live AI assist (Step 15.6).
 *
 * Called after Step 15.5's meaning path falls through (topConfidence < 0.25).
 * Returns eligible=false when the COO chain is a better fit.
 */
export function evaluateAIAssistEligibility(
  message: string,
  topConfidence: number,
): AIAssistEligibility {
  const lower = message.toLowerCase().trim()
  const wordCount = lower.split(/\s+/).length

  // Gate 1: Too long — COO chain handles complex multi-part questions better
  if (lower.length > 150 || wordCount > 25) {
    return {
      eligible: false,
      reason: 'Input too long for AI assist — routing to COO chain',
      suggestedMode: 'intent_interpretation',
    }
  }

  // Gate 2: Data query — needs DB retrieval, not language interpretation
  for (const pattern of DATA_QUERY_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        eligible: false,
        reason: 'Detected data query — routing to COO chain for data retrieval',
        suggestedMode: 'intent_interpretation',
      }
    }
  }

  // Gate 3: Action request — needs the approval pipeline
  for (const pattern of ACTION_REQUEST_PATTERNS) {
    if (pattern.test(lower)) {
      return {
        eligible: false,
        reason: 'Detected action request — routing to COO chain for approval flow',
        suggestedMode: 'intent_interpretation',
      }
    }
  }

  // Gate 4: Confidence must be genuinely low (confirms Step 15.5 fell through)
  if (topConfidence >= 0.25) {
    return {
      eligible: false,
      reason: 'Confidence sufficient — Step 15.5 should have handled this',
      suggestedMode: 'intent_interpretation',
    }
  }

  // Gate 5: Too short to interpret meaningfully
  if (lower.length < 3) {
    return {
      eligible: false,
      reason: 'Input too short — cannot interpret',
      suggestedMode: 'intent_interpretation',
    }
  }

  // Eligible: qualitative/observational/emotional input with genuinely low confidence.
  // Short inputs (< 30 chars) benefit from language_understanding — explain what the phrase means.
  // Longer vague inputs benefit from intent_interpretation — identify the underlying concern.
  const suggestedMode: TeacherMode = lower.length < 30
    ? 'language_understanding'
    : 'intent_interpretation'

  return {
    eligible: true,
    reason: 'Short, qualitative, low-confidence input — AI can improve interpretation',
    suggestedMode,
  }
}
