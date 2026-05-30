// Sprint 971 — DONNA Review Queue Guidance V1
// Deterministic guidance for the Director Review Queue.
// Pure TypeScript — no DB calls, no API calls, no React, no mutations.
//
// Provides COO-style text answers for review queue intent phrases:
//   - "What should I review first?"
//   - "What is safe to approve?"
//   - "Explain this review queue"
//   - "What is the priority?"
//
// Usage:
//   const text = buildReviewQueueGuidance('first_priority')
//   // "Start with items in the 'For Your Review' tab..."

// ── Intent types ──────────────────────────────────────────────────────────────

export type ReviewQueueGuidanceIntent =
  | 'first_priority'   // What should I review first?
  | 'safe_to_approve'  // What is safe to approve?
  | 'explain_queue'    // Explain this review queue
  | 'what_caution'     // What requires caution?

// ── Guidance text ─────────────────────────────────────────────────────────────

const GUIDANCE: Record<ReviewQueueGuidanceIntent, string> = {
  first_priority: `Start with the "For Your Review" tab. Within that tab, review in this order: (1) wrap-ups from completed sessions — they contain coach observations that are waiting to become official player evidence; (2) attendance exceptions — coaches flagged these and they need your decision before records are updated; (3) player update drafts — parent-safe messages waiting for your approval before they can be sent. Review the oldest item in each category first. Nothing changes in any player record until you explicitly approve or reject each item.`,

  safe_to_approve: `Every item in the Review Queue is safe to open and read — viewing never changes anything. When you click Approve: that specific item (a wrap-up, observation, or draft) is marked approved and becomes eligible to be applied. When you click Reject: the item is dismissed with your decision recorded. The core rule: nothing is applied automatically. Opening, reading, or approving an item is always reversible until you click Apply. I never auto-approve anything on your behalf.`,

  explain_queue: `The Review Queue is where all coach-generated content waits for your decision before it becomes official. Coach wrap-ups, attendance exceptions, player observations, parent update drafts, and curriculum suggestions all land here. You have three tabs: "For Your Review" (pending your decision), "Player Signals" (player update proposals), and "Sessions & Curriculum" (session recaps and curriculum changes). Nothing reaches parents or player records until you review and approve it here.`,

  what_caution: `Be thoughtful about parent update drafts — once approved and applied, they may be sent to families. Check that the language is appropriate and that the content is parent-safe (no raw coach notes, no internal assessments). For attendance changes, verify the coach-flagged exception matches what actually happened — approval updates the player attendance record. For player level movement proposals, only approve if you have reviewed the readiness signals in the player profile. All other items (wrap-ups, observations, curriculum suggestions) are lower-risk because approval just makes them visible to you — not to parents or players.`,
}

// ── Intent detector ───────────────────────────────────────────────────────────

const FIRST_PRIORITY_PHRASES = [
  'what should i review first',
  'review first',
  'where to start in the queue',
  'start in the queue',
  'prioritize the queue',
  'which item first',
] as const

const SAFE_TO_APPROVE_PHRASES = [
  'what is safe to approve',
  'safe to approve',
  'safe here',
  'what can i safely approve',
  'is it safe to approve',
] as const

const WHAT_CAUTION_PHRASES = [
  'what requires caution',
  'what to be careful',
  'what is risky',
  'what should i be careful about',
] as const

export function matchesReviewQueueGuidanceIntent(text: string): ReviewQueueGuidanceIntent | null {
  const n = text.toLowerCase().trim()

  if (FIRST_PRIORITY_PHRASES.some(p => n.includes(p))) return 'first_priority'
  if (SAFE_TO_APPROVE_PHRASES.some(p => n.includes(p))) return 'safe_to_approve'
  if (WHAT_CAUTION_PHRASES.some(p => n.includes(p))) return 'what_caution'

  return null
}

// ── Main guidance builder ─────────────────────────────────────────────────────

/**
 * Build a COO-style guidance response for the given review queue intent.
 * Returns the full text string — caller handles display via setCommandResponse.
 */
export function buildReviewQueueGuidance(intent: ReviewQueueGuidanceIntent): string {
  return GUIDANCE[intent]
}
