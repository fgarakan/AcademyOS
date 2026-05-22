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

// ── Sprint 626 — Director Intent Classification Upgrade ───────────────────────
// Extended director-specific intent families with safety classification.
// No AI calls. Deterministic rule-based only.

export type DonnaDirectorIntent =
  | 'kpi_explanation'
  | 'kpi_priority'
  | 'dashboard_priority'
  | 'roster_attention'
  | 'review_queue'
  | 'parent_summary'
  | 'level_movement'
  | 'assessment_or_placement'
  | 'curriculum_builder'
  | 'coach_note_summary'
  | 'unsafe_visibility_request'
  | 'ambiguous_context'
  | 'unknown'

export type DonnaSafetyClass = 'safe' | 'needs_review' | 'blocked'

export interface DirectorIntentResult {
  intent: DonnaDirectorIntent
  confidence: 'high' | 'medium' | 'low'
  missingContext: string | null
  safetyClass: DonnaSafetyClass
  recommendedAction: string
}

type DirectorSignalEntry = {
  intent: DonnaDirectorIntent
  signals: RegExp[]
  safetyClass: DonnaSafetyClass
  recommendedAction: string
  missingContext?: string
}

const DIRECTOR_SIGNAL_MAP: DirectorSignalEntry[] = [
  {
    intent: 'unsafe_visibility_request',
    signals: [
      /show (raw |this |the |a )?(coach )?note to (the |a )?parent/,
      /send (raw |this |the )?note to (the |a )?parent/,
      /expose (coach )?notes? to parent/,
      /give parent (access to |the )?raw (coach )?notes?/,
      /share (coach )?observation with parent/,
      /show another academy/,
      /show me (data from |a )?(another|different) academy/,
      /publish (this |the )?(video|content) (to |for )?(the |a )?player now/,
      /move (the |this )?player (up|down) now/,
      /approve (this |the )?(action|change) (right now|immediately|automatically)/,
    ],
    safetyClass: 'blocked',
    recommendedAction: 'Block and explain why this action is not allowed. Offer a safe alternative through the review queue.',
  },
  {
    intent: 'kpi_explanation',
    signals: [
      /\bkpi\b/,
      /\bmetric\b/,
      /attendance rate/,
      /recap completion/,
      /curriculum coverage/,
      /template usage/,
      /coach follow.?through/,
      /player progress velocity/,
      /level readiness/,
      /mission completion/,
      /badge progress/,
      /mental performance coverage/,
      /explain (these |the |this )?(kpi|metric|signal|score|rate)/,
      /what (is|does|are) (the |this |these )?(kpi|metric|attendance|recap|coverage|velocity)/,
    ],
    safetyClass: 'safe',
    recommendedAction: 'Answer using kpiExplainer templates. State trend limitation if trend data is unavailable.',
  },
  {
    intent: 'kpi_priority',
    signals: [
      /which kpi (needs?|is|has) (the most )?attention/,
      /which (metric|signal) (should i|is most) (important|urgent|critical)/,
      /what (kpi|metric|signal) (to|should i) (focus on|look at|fix) first/,
    ],
    safetyClass: 'safe',
    recommendedAction: 'Use kpiExplainer priority path from available context signals.',
  },
  {
    intent: 'dashboard_priority',
    signals: [
      /what (should|do|can) i (do|focus|fix|work on|start) (first|today|now|next)?/,
      /what (needs?|need) (my )?attention/,
      /most important (thing|task|issue)/,
      /how healthy (is|are) (my|the|this) academy/,
      /\bacademy health\b/,
      /biggest bottleneck/,
      /what (to|should i) fix first/,
      /what (is|are) (urgent|critical) (today|now)/,
    ],
    safetyClass: 'safe',
    recommendedAction: 'Use buildDashboardPriorityResponse from directorDashboardDonnaAnswer.',
  },
  {
    intent: 'roster_attention',
    signals: [
      /who (needs?|need) (attention|help|review)/,
      /which players? (need|are|require) (attention|review|at risk)/,
      /who (is|are) at risk/,
      /who should i (focus on|check on|prioritize)/,
      /advancement.ready players?/,
      /who is ready (to advance|for level)/,
      /players? (at risk|falling behind|missing curriculum)/,
    ],
    safetyClass: 'safe',
    recommendedAction: 'Use tryAnswerRosterAttentionQuestion from directorPlayersDonnaIntelligence.',
  },
  {
    intent: 'review_queue',
    signals: [
      /review queue/,
      /pending (review|approval)/,
      /what('?s| is) pending/,
      /items? (to review|awaiting)/,
      /approval queue/,
      /review (center|hub)/,
    ],
    safetyClass: 'safe',
    recommendedAction: 'Show pending review count and route to /director/review.',
  },
  {
    intent: 'parent_summary',
    signals: [
      /parent (summary|update|message|communication)/,
      /draft (a |an )?(parent|family) (summary|update|message)/,
      /send (to|a message to) (the |a )?parent/,
      /parent.safe (summary|update)/,
      /family update/,
    ],
    safetyClass: 'needs_review',
    recommendedAction: 'Propose a parent-safe draft for review. Do not publish. Route to proposed_actions.',
    missingContext: 'Which player should this parent summary be for?',
  },
  {
    intent: 'level_movement',
    signals: [
      /level (up|down|movement|change|advance|promotion)/,
      /move (the |this )?player (up|down|to level)/,
      /promote (the |this )?player/,
      /ready to (move up|advance|level up)/,
      /level (readiness|assessment)/,
      /advance (the |this )?player/,
    ],
    safetyClass: 'needs_review',
    recommendedAction: 'Propose level movement for director review. Do not apply automatically.',
    missingContext: 'Which player and which level?',
  },
  {
    intent: 'assessment_or_placement',
    signals: [
      /\bassessment\b/,
      /\bplacement\b/,
      /assess (the |this )?player/,
      /place (the |this )?player/,
      /schedule (an |a )?assessment/,
      /reassess/,
      /initial placement/,
      /placement recommendation/,
    ],
    safetyClass: 'needs_review',
    recommendedAction: 'Route to placement/assessment flow. Propose for review. Do not finalize automatically.',
    missingContext: 'Which player needs assessment?',
  },
  {
    intent: 'curriculum_builder',
    signals: [
      /add (a |an )?(drill|skill|mission|badge|exercise|block|requirement)/,
      /create (a |an )?(drill|skill|mission|badge|exercise|block|curriculum)/,
      /curriculum (builder|edit|update|change)/,
      /add (this |the )?drill to/,
      /create (a )?badge for/,
      /build (a )?(session|template|curriculum)/,
      /new (drill|mission|badge|block|skill)/,
    ],
    safetyClass: 'needs_review',
    recommendedAction: 'Draft curriculum item and route to review. Do not publish directly.',
  },
  {
    intent: 'coach_note_summary',
    signals: [
      /summarize (the |this |a )?coach (note|observation)/,
      /coach note (summary|digest|review)/,
      /what did (the )?coach (say|note|write|observe)/,
      /coach observation (summary|digest)/,
    ],
    safetyClass: 'needs_review',
    recommendedAction: 'Summarize internal coach notes for director only. Do not expose raw notes to parents/players.',
  },
]

export function classifyDirectorIntent(input: string): DirectorIntentResult {
  const t = input.toLowerCase().trim()

  // Check unsafe first — always blocked
  for (const entry of DIRECTOR_SIGNAL_MAP) {
    if (entry.intent === 'unsafe_visibility_request') {
      for (const signal of entry.signals) {
        if (signal.test(t)) {
          return {
            intent: 'unsafe_visibility_request',
            confidence: 'high',
            missingContext: null,
            safetyClass: 'blocked',
            recommendedAction: entry.recommendedAction,
          }
        }
      }
    }
  }

  type ScoredMatch = DirectorSignalEntry & { score: number }
  const matches: ScoredMatch[] = []

  for (const entry of DIRECTOR_SIGNAL_MAP) {
    if (entry.intent === 'unsafe_visibility_request') continue
    let score = 0
    for (const signal of entry.signals) {
      if (signal.test(t)) score++
    }
    if (score > 0) matches.push({ ...entry, score })
  }

  if (matches.length === 0) {
    return {
      intent: 'unknown',
      confidence: 'low',
      missingContext: 'What would you like to know or do?',
      safetyClass: 'safe',
      recommendedAction: 'Ask a clarifying question to identify the intent.',
    }
  }

  matches.sort((a, b) => b.score - a.score)
  const best = matches[0]
  const ambiguous = matches.length > 1 && matches[0].score === matches[1].score

  const confidence: DirectorIntentResult['confidence'] =
    best.score >= 2 ? 'high' : matches.length === 1 ? 'medium' : 'low'

  return {
    intent: ambiguous ? 'ambiguous_context' : best.intent,
    confidence: ambiguous ? 'low' : confidence,
    missingContext: ambiguous
      ? `Did you mean ${formatDirectorIntentLabel(matches[0].intent)} or ${formatDirectorIntentLabel(matches[1].intent)}?`
      : (best.missingContext ?? null),
    safetyClass: ambiguous ? 'safe' : best.safetyClass,
    recommendedAction: best.recommendedAction,
  }
}

export function formatDirectorIntentLabel(intent: DonnaDirectorIntent): string {
  const labels: Record<DonnaDirectorIntent, string> = {
    kpi_explanation: 'a KPI explanation',
    kpi_priority: 'a KPI priority check',
    dashboard_priority: 'a dashboard priority summary',
    roster_attention: 'roster attention',
    review_queue: 'the review queue',
    parent_summary: 'a parent summary',
    level_movement: 'a level movement',
    assessment_or_placement: 'an assessment or placement',
    curriculum_builder: 'curriculum building',
    coach_note_summary: 'a coach note summary',
    unsafe_visibility_request: 'an unsafe visibility request',
    ambiguous_context: 'something ambiguous',
    unknown: 'something unclear',
  }
  return labels[intent]
}
