// Sprint 592 — DONNA Intent Classification V1
// Classifies raw coach/director input into a DonnaCommandCategory.
// Pure TypeScript — keyword-matching heuristics only.
// No AI API calls, no DB reads, no external calls.
// Acts as first-pass triage before routing.

import type { DonnaCommandCategory } from './donnaCommandRouter'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IntentClassificationResult {
  category: DonnaCommandCategory
  confidence: 'high' | 'medium' | 'low'
  matchedSignals: string[]
  requiresClarification: boolean
  clarificationPrompt: string | null
}

// ── Signal maps ───────────────────────────────────────────────────────────────

const SIGNAL_MAP: Array<{ category: DonnaCommandCategory; signals: string[] }> = [
  {
    category: 'attendance',
    signals: [
      'attendance', 'absent', 'present', 'late', 'tardy', "didn't show",
      'mark', 'who showed', 'who came', 'who was there', 'missing', 'excused',
    ],
  },
  {
    category: 'session_actual',
    signals: [
      'session note', 'session outcome', 'how did', 'how was the session', 'session went',
      'intensity', 'energy level', 'session intensity', 'update session', 'session update',
      'session record', 'what happened', 'session summary',
    ],
  },
  {
    category: 'coach_observation',
    signals: [
      'observation', 'observed', 'noticed', 'note about', 'player note', 'player concern',
      'flag', 'flagging', 'issue with', 'struggling with', 'excelled at', 'working on',
      'footwork', 'serve', 'backhand', 'forehand', 'volley', 'technique', 'focus issue',
    ],
  },
  {
    category: 'parent_draft',
    signals: [
      'parent message', 'parent update', 'message to parent', 'email parent', 'notify parent',
      'tell the parent', 'draft message', 'send to parent', 'parent communication',
    ],
  },
  {
    category: 'level_readiness',
    signals: [
      'ready to move up', 'level up', 'promote', 'move to', 'level change',
      'advancement', 'readiness', 'move down', 'demote', 'reassign level',
      'is ready', 'level assessment', 'next level',
    ],
  },
  {
    category: 'curriculum_override',
    signals: [
      'curriculum', 'override', 'change the curriculum', 'adjust curriculum',
      'this week focus', 'change focus', 'different pathway', 'pathway override',
      'lesson plan change', 'exercise override', 'skip this block',
    ],
  },
  {
    category: 'review_queue',
    signals: [
      'review queue', 'what needs review', 'pending review', 'pending approval',
      "what's pending", 'items to review', 'review needed',
      'director queue', 'approval queue',
    ],
  },
  {
    category: 'academy_health',
    signals: [
      'academy health', 'how is the academy', 'overall health', 'risk players',
      'at risk', 'who needs attention', 'what needs attention', 'health score',
      'programme health', 'program health', 'injury', 'injuries',
      'coaching load', 'squad health',
    ],
  },
  {
    category: 'wrap_up',
    signals: [
      'wrap up', 'wrap-up', 'end of session', 'session complete', 'finished session',
      'close out', 'done with session', 'session debrief', 'post-session', 'post session',
    ],
  },
]

// ── Classifier ────────────────────────────────────────────────────────────────

export function classifyDonnaIntent(
  input: string,
): IntentClassificationResult {
  const normalized = input.toLowerCase().trim()

  type Match = { category: DonnaCommandCategory; signals: string[]; score: number }
  const matches: Match[] = []

  for (const { category, signals } of SIGNAL_MAP) {
    const matched: string[] = []
    for (const signal of signals) {
      if (normalized.includes(signal)) {
        matched.push(signal)
      }
    }
    if (matched.length > 0) {
      matches.push({ category, signals: matched, score: matched.length })
    }
  }

  if (matches.length === 0) {
    return {
      category: 'unknown',
      confidence: 'low',
      matchedSignals: [],
      requiresClarification: true,
      clarificationPrompt: "I didn't catch what you needed — could you be more specific? (e.g., attendance, observation, session update, or academy health)",
    }
  }

  matches.sort((a, b) => b.score - a.score)
  const best = matches[0]

  const confidence: IntentClassificationResult['confidence'] =
    best.score >= 2 ? 'high'
    : matches.length === 1 ? 'medium'
    : 'low'

  const ambiguous = matches.length > 1 && matches[0].score === matches[1].score

  return {
    category: best.category,
    confidence,
    matchedSignals: best.signals,
    requiresClarification: ambiguous || confidence === 'low',
    clarificationPrompt: ambiguous
      ? `Did you mean ${formatCategoryLabel(matches[0].category)} or ${formatCategoryLabel(matches[1].category)}?`
      : null,
  }
}

// ── Label helper ──────────────────────────────────────────────────────────────

export function formatCategoryLabel(category: DonnaCommandCategory): string {
  const labels: Record<DonnaCommandCategory, string> = {
    attendance: 'an attendance update',
    session_actual: 'a session record update',
    coach_observation: 'a player observation',
    parent_draft: 'a parent message draft',
    level_readiness: 'a level readiness signal',
    curriculum_override: 'a curriculum override',
    review_queue: 'the review queue',
    academy_health: 'an academy health check',
    wrap_up: 'a session wrap-up',
    unknown: 'something I need clarification on',
  }
  return labels[category]
}

export function isInputTooShort(input: string, minWords = 2): boolean {
  return input.trim().split(/\s+/).filter(Boolean).length < minWords
}
