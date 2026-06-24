// Mega Sprint 3751–3780 — DONNA Executive Experience Convergence V1
// Part 1 — Executive Conversation Classifier.
//
// The single source of truth for one question: "should the Executive Operating
// Layer own this turn?" When the executive flag is on, a conversational/strategic
// director request should reach Executive Reasoning → Context Assembly → OpenAI →
// Validation, instead of being preempted by a deterministic workflow engine or a
// goal-confirmation menu.
//
// This does NOT introduce new architecture. It is a pure classifier that the
// canonical router and the brain consult to decide routing. It is intentionally
// CONSERVATIVE about two things it must never claim:
//   • direct mutations (approve / reject / move / delete / send …) — those stay on
//     the safety + approval pipeline and are handled BEFORE this classifier runs.
//   • narrow single-record data lookups (handled fine deterministically) — these
//     do not match the executive patterns below.
//
// Pure TypeScript: no DB, no OpenAI, no React, no side effects.

/** Coarse reasoning goal, mirrors the executive ReasoningGoal vocabulary for diagnostics. */
export type ExecutiveConversationGoal =
  | 'advance'        // "what should I do next / today / now"
  | 'complete'       // "help me complete this / walk me through this / what else do I need"
  | 'explain'        // "why are you recommending that / explain your reasoning"
  | 'attention'      // "who needs attention / who should I focus on"
  | 'status'         // "how is the academy looking / how are we doing"
  | 'prioritize'     // "take me to the most important thing / what matters most"
  | 'strategic'      // general open-ended executive question

export interface ExecutiveConversationMatch {
  match: boolean
  goal: ExecutiveConversationGoal | null
  reason: string
}

const NO_MATCH: ExecutiveConversationMatch = { match: false, goal: null, reason: 'not an executive conversational request' }

// Direct-mutation verbs. If the message reads as an imperative mutation, this
// classifier declines — the safety/approval pipeline owns those turns. (The
// canonical router already blocks them earlier; this is defence in depth.)
const MUTATION_GUARD = /\b(approve|reject|delete|archive|remove|send|publish|email|message|reassign|move (him|her|them|this player)|finalize|finalise)\b/i

interface GoalPattern {
  goal: ExecutiveConversationGoal
  patterns: RegExp[]
}

// Ordered most-specific → most-general. First hit wins.
const GOAL_PATTERNS: GoalPattern[] = [
  {
    goal: 'explain',
    patterns: [
      /\bwhy (are you|did you|do you|would you) (recommend|recommending|suggest|suggesting|pick|choose|prioriti[sz])/i,
      /\bwhy (that|this|those|these|is that the)/i,
      /\bexplain (your|the) (recommendation|reasoning|thinking|choice|logic)/i,
      /\bwhat'?s your (reasoning|rationale|thinking)\b/i,
    ],
  },
  {
    goal: 'complete',
    patterns: [
      /\bhelp me (complete|finish|wrap up|get through|work through)\b/i,
      /\b(walk|guide|take) me through\b/i,
      /\bwhat else (do i|do we|is) (need|needed|left|remaining)/i,
      /\bwhat'?s (left|remaining|still needed)\b/i,
      /\bwhat (am i|are we) missing\b/i,
      /\bfinish (this|setup|it)\b/i,
    ],
  },
  {
    goal: 'attention',
    patterns: [
      /\bwho needs (attention|help|support|review)\b/i,
      /\bwho (should i|do i need to|should we) (look at|focus on|check|review|prioriti[sz])/i,
      /\bwhich players? (need|needs|require)\b/i,
    ],
  },
  {
    goal: 'prioritize',
    patterns: [
      /\b(take me to|show me|what'?s) the most important\b/i,
      /\bwhat matters most\b/i,
      /\bwhat should i (focus on|prioriti[sz]e)\b/i,
      /\bmy (top|highest)[- ]?(priority|priorities)\b/i,
      /\bbiggest (priority|risk|issue|problem) (right now|today)\b/i,
    ],
  },
  {
    goal: 'status',
    patterns: [
      /\bhow (is|are) (the academy|things|we|everything|it) (looking|doing|going)\b/i,
      /\bhow'?s (the academy|everything|it) (looking|doing|going)\b/i,
      /\b(give me|what'?s) (the|a) (state|status|picture|health) of (the|my) (academy|operation)\b/i,
      /\bwhere (do|are) (we|things) (stand|at)\b/i,
    ],
  },
  {
    goal: 'advance',
    patterns: [
      /\bwhat should i do (next|today|now|first)?\b/i,
      /\bwhat (do i|should i) (do|tackle|work on) (next|now|today|first)?\b/i,
      /\bwhat'?s next\b/i,
      /\bwhat now\b/i,
      /\bwhere (do|should) i (start|begin)\b/i,
    ],
  },
]

// A general strategic-question heuristic: an open question that is clearly about
// running the academy (not a narrow lookup). Used only as a final, conservative
// fallback so genuine executive questions are not dropped to the workflow router.
const STRATEGIC_OPENER = /^(what|how|who|where|should i|could you help me think|help me think|i need to figure out|i'?m trying to decide|i can'?t decide)\b/i
const STRATEGIC_DOMAIN = /\b(academy|players?|roster|coach|coaches|curriculum|level|levels|review|approvals?|priorit|attention|focus|session|template|parents?|placement|operation|today|next|important|recommend)\b/i

/**
 * Classify whether the Executive Operating Layer should own this conversational
 * turn. Returns the matched coarse goal (for diagnostics) when true.
 *
 * Conservative by design: declines on direct mutations and returns no-match for
 * anything that does not read as an executive/strategic request.
 */
export function classifyExecutiveConversation(rawMessage: string): ExecutiveConversationMatch {
  const message = (rawMessage ?? '').trim()
  if (message.length < 3) return NO_MATCH
  // Very long multi-part dumps are better served by the existing chain.
  if (message.length > 400) return NO_MATCH
  if (MUTATION_GUARD.test(message)) return NO_MATCH

  for (const { goal, patterns } of GOAL_PATTERNS) {
    if (patterns.some(p => p.test(message))) {
      return { match: true, goal, reason: `executive ${goal} request` }
    }
  }

  // Final conservative fallback: a short, open strategic question about the academy.
  const wordCount = message.split(/\s+/).length
  if (wordCount <= 18 && STRATEGIC_OPENER.test(message) && STRATEGIC_DOMAIN.test(message)) {
    return { match: true, goal: 'strategic', reason: 'open-ended executive/strategic question' }
  }

  return NO_MATCH
}

/** Convenience boolean wrapper. */
export function isExecutiveConversation(message: string): boolean {
  return classifyExecutiveConversation(message).match
}
