/**
 * Sprint 785 — DONNA Follow-Up Resolver V1
 * Sprint 786 — Response Style polish applied to all copy
 *
 * Detects short follow-up phrases and resolves them using safe current-session
 * intent context. Fires ONLY after the operator guard and all explicit intent
 * matchers have already run. Returns null when input is not a follow-up, so
 * the normal COO router continues.
 *
 * Safety rules:
 * - No DB reads, no API calls, no mutations.
 * - Context stores counts and labels only — no raw content, no player names.
 * - Context expires after 10 minutes of inactivity.
 * - Never bypasses the operator flow (operator guard runs before this at step 5.2).
 * - Never auto-executes approved actions.
 *
 * Response style rules (Sprint 786):
 * - 1–3 sentences maximum.
 * - Warm, calm, operationally sharp — not robotic, not hype.
 * - Bullets only for 3+ concrete items (none in this file).
 * - Always offer a clear next step.
 * - Preserve safety and approval language.
 */

// ── Context TTL ────────────────────────────────────────────────────────────────

const CONTEXT_TTL_MS = 10 * 60 * 1000 // 10 minutes

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Safe current-session intent context.
 * Set by DonnaAssistantButton after: daily brief loads, review queue opens,
 * attention report loads. Stored in React state only — never persisted.
 * Contains counts and safe labels only. No raw content, no player names.
 */
export interface DonnaSessionIntentContext {
  lastIntentFamily:
    | 'daily_brief'
    | 'review_queue'
    | 'page_actions'
    | 'attention'
    | 'coo_answer'
    | 'section_nav'     // Sprint 876 — dedicated family for handleUIDispatch section-navigation results
    | 'roster_attention'
    | null
  /** Number of sections in the last brief (safe: structural metadata only) */
  lastResultSectionCount: number | null
  /** Number of high-priority sections in the last brief */
  lastResultHighPriorityCount: number | null
  /** Total item count across all sections */
  lastResultItemCount: number | null
  /** Safe navigation target for "go there" / "open that" follow-ups */
  lastSuggestedNavigationHref: string | null
  /** Human-readable label for the navigation target */
  lastSuggestedNavigationLabel: string | null
  /** Safe topic label for "tell me more" / "why" follow-ups */
  lastTopicLabel: string | null
  /** Unix timestamp (ms) when context was set — used for TTL check */
  setAt: number
}

export type FollowUpActionType =
  | 'navigate'
  | 'summarize'
  | 'recommend'
  | 'elaborate'
  | 'clarify'
  | 'time_shift'

export interface DonnaFollowUpResult {
  actionType: FollowUpActionType
  responseText: string
  /** When set, the caller should navigate here (open review queue or router.push) */
  navigationHref: string | null
  confidence: 'high' | 'medium' | 'low'
}

// ── Pattern groups ─────────────────────────────────────────────────────────────
// All patterns tested against: lowercase + trimmed + trailing punctuation stripped

/** Clear anaphoric references — high confidence follow-ups (≤ 6 words) */
const ANAPHORIC_PATTERNS: RegExp[] = [
  /^which (ones?|items?|things?)$/,
  /^show me$/,
  /^show me (the )?(first|that|those|them|it|all)$/,
  /^open (that|it|the first one|them)$/,
  /^(the )?(first|that|last) one$/,
  /^those$/,
  /^(show|open|see) (all of )?them$/,
  /^take me (there|to it)$/,
  /^let'?s go$/,
  /^go there$/,
  /^show me all$/,
  /^(can you )?show (it|that|those|them) to me$/,
]

/** Sequential navigation — very short only (≤ 3 words) */
const SEQUENTIAL_PATTERNS: RegExp[] = [
  /^next$/,
  /^go back$/,
  /^previous$/,
  /^(go to the )?first$/,
  /^(go to the )?last$/,
  /^skip that$/,
  /^skip it$/,
]

/** Elaboration requests (≤ 8 words) */
const ELABORATION_PATTERNS: RegExp[] = [
  /^why$/,
  /^why is that( important| urgent| critical)?$/,
  /^why does that matter$/,
  /^tell me more$/,
  /^(more |tell me )?more about that$/,
  /^explain (that|this|it)$/,
  /^(can you )?(elaborate|clarify)$/,
  /^what do you mean$/,
  /^(can you )?(explain|clarify|expand) (that|this|it)$/,
  /^say more$/,
  /^expand on that$/,
]

/** Recommendation requests (≤ 10 words) */
const RECOMMENDATION_PATTERNS: RegExp[] = [
  /^what (do you recommend|would you (recommend|suggest))$/,
  /^what should i (do|start with) (first|next)?$/,
  /^(what|where) should i (start|begin|focus)$/,
  /^(can you )?walk me through (it|this|that)$/,
  /^(give me a )?recommendation$/,
  /^what'?s (the |your )?recommendation$/,
  /^what (is the |is your )?best (next )?(step|move|action)$/,
  /^what do i do (first|next)$/,
  /^(what'?s|what is) the (best|right) (first |next )?step$/,
]

/** Time shift references (≤ 8 words) */
const TIME_SHIFT_PATTERNS: RegExp[] = [
  /what about (last week|this week|last month|yesterday)/,
  /what about today/,
  /(last week|this week|yesterday|last month) (instead|data|numbers?|stats?)/,
]

/** Topic shift references (≤ 8 words) */
const TOPIC_SHIFT_PATTERNS: RegExp[] = [
  /what about (the )?players?/,
  /what about (the )?sessions?/,
  /what about (the )?coaches?/,
  /what about (the )?curriculum/,
  /what about (the )?review/,
  /what about (the )?parents?/,
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.]+$/, '')
    .replace(/\s{2,}/g, ' ')
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function isContextFresh(context: DonnaSessionIntentContext): boolean {
  return Date.now() - context.setAt < CONTEXT_TTL_MS
}

// ── Response builders ──────────────────────────────────────────────────────────

function buildBriefAnaphoricResponse(context: DonnaSessionIntentContext, lower: string): DonnaFollowUpResult {
  const sectionCount = context.lastResultSectionCount ?? 0
  const highCount = context.lastResultHighPriorityCount ?? 0

  if (lower.startsWith('which')) {
    // "Which ones?" — give a count summary, offer to navigate
    const urgentNote = highCount > 0
      ? ` ${highCount} of them look higher priority.`
      : ''
    const text = sectionCount > 0
      ? `You've got ${sectionCount} area${sectionCount !== 1 ? 's' : ''} to look at today.${urgentNote} The Review Queue has the full list — want me to open it?`
      : `Today's brief is ready. The Review Queue has the full item-by-item detail — want me to open it?`
    return { actionType: 'summarize', responseText: text, navigationHref: '/director/review', confidence: 'high' }
  }

  // "show me", "open that", "open it", "the first one", etc. — navigate directly
  return {
    actionType: 'navigate',
    responseText: `I'll open the Review Queue — that's where you can go through each item.`,
    navigationHref: '/director/review',
    confidence: 'high',
  }
}

function buildBriefRecommendationResponse(context: DonnaSessionIntentContext): DonnaFollowUpResult {
  const highCount = context.lastResultHighPriorityCount ?? 0
  const totalItems = context.lastResultItemCount ?? 0

  if (highCount > 0) {
    return {
      actionType: 'recommend',
      responseText: `I'd start with the ${highCount} higher-priority ${highCount === 1 ? 'item' : 'items'} — those are the ones that need your attention first. Want me to open the Review Queue?`,
      navigationHref: '/director/review',
      confidence: 'high',
    }
  }
  if (totalItems > 0) {
    return {
      actionType: 'recommend',
      responseText: `There are ${totalItems} ${totalItems === 1 ? 'item' : 'items'} in today's brief. The Review Queue is the best place to start — that's where pending approvals live. Want me to open it?`,
      navigationHref: '/director/review',
      confidence: 'high',
    }
  }
  return {
    actionType: 'recommend',
    responseText: `The Review Queue is usually a good starting point — approvals waiting there tend to be the most time-sensitive. Want me to open it?`,
    navigationHref: '/director/review',
    confidence: 'medium',
  }
}

function buildTopicShiftResponse(lower: string): DonnaFollowUpResult {
  if (lower.includes('player')) {
    return {
      actionType: 'navigate',
      responseText: `I can take you to Player Profiles to see who needs attention. Want to go there?`,
      navigationHref: '/director/players',
      confidence: 'medium',
    }
  }
  if (lower.includes('session')) {
    return {
      actionType: 'navigate',
      responseText: `Session details are on the Sessions page. Want me to take you there?`,
      navigationHref: '/director/sessions',
      confidence: 'medium',
    }
  }
  if (lower.includes('review') || lower.includes('approval')) {
    return {
      actionType: 'navigate',
      responseText: `The Review Queue has everything pending approval — want me to open it?`,
      navigationHref: '/director/review',
      confidence: 'high',
    }
  }
  if (lower.includes('curriculum')) {
    return {
      actionType: 'navigate',
      responseText: `I can take you to the Curriculum page. Want to go there?`,
      navigationHref: '/director/curriculum',
      confidence: 'medium',
    }
  }
  if (lower.includes('coach')) {
    return {
      actionType: 'clarify',
      responseText: `Happy to help with coaches — ask me about their sessions, wrap-ups, or briefs. What do you need?`,
      navigationHref: null,
      confidence: 'medium',
    }
  }
  if (lower.includes('parent')) {
    return {
      actionType: 'clarify',
      responseText: `Parent messages always go through approval first. I can draft one if you'd like — just say the word.`,
      navigationHref: null,
      confidence: 'medium',
    }
  }
  // Generic fallback for any other topic shift
  return {
    actionType: 'clarify',
    responseText: `Sure — are you asking about today's brief, something in the review queue, or this page specifically?`,
    navigationHref: null,
    confidence: 'low',
  }
}

// ── Main resolver ──────────────────────────────────────────────────────────────

/**
 * Resolve a follow-up phrase using safe current-session intent context.
 *
 * Returns a DonnaFollowUpResult when the input is recognized as a follow-up
 * to a prior DONNA response. Returns null otherwise — the caller continues
 * to the COO router or fallback.
 *
 * Never mutates state. Never reads DB. Never calls APIs.
 */
export function resolveFollowUp(
  text: string,
  context: DonnaSessionIntentContext | null,
): DonnaFollowUpResult | null {
  if (!text.trim()) return null

  const lower = normalize(text)
  const wc = wordCount(lower)

  // Guard: only fire on short-to-medium inputs to avoid false positives
  if (wc > 12) return null

  const contextIsFresh = context !== null && isContextFresh(context)

  // ── Detect pattern group ──────────────────────────────────────────────────

  const isAnaphoric = wc <= 6 && ANAPHORIC_PATTERNS.some(p => p.test(lower))
  const isSequential = wc <= 3 && SEQUENTIAL_PATTERNS.some(p => p.test(lower))
  const isElaboration = wc <= 8 && ELABORATION_PATTERNS.some(p => p.test(lower))
  const isRecommendation = wc <= 10 && RECOMMENDATION_PATTERNS.some(p => p.test(lower))
  const isTimeShift = wc <= 8 && TIME_SHIFT_PATTERNS.some(p => p.test(lower))
  const isTopicShift = wc <= 8 && TOPIC_SHIFT_PATTERNS.some(p => p.test(lower))

  if (!isAnaphoric && !isSequential && !isElaboration && !isRecommendation && !isTimeShift && !isTopicShift) {
    return null
  }

  // ── Anaphoric + Sequential ─────────────────────────────────────────────────

  if (isAnaphoric || isSequential) {
    if (contextIsFresh && context!.lastIntentFamily === 'daily_brief') {
      return buildBriefAnaphoricResponse(context!, lower)
    }
    if (contextIsFresh && (context!.lastIntentFamily === 'review_queue' || context!.lastIntentFamily === 'attention')) {
      return {
        actionType: 'navigate',
        responseText: `I'll open the Review Queue so you can go through each item.`,
        navigationHref: '/director/review',
        confidence: 'high',
      }
    }
    if (contextIsFresh && context!.lastSuggestedNavigationHref) {
      return {
        actionType: 'navigate',
        responseText: `I'll take you to the ${context!.lastSuggestedNavigationLabel ?? 'relevant page'}.`,
        navigationHref: context!.lastSuggestedNavigationHref,
        confidence: 'medium',
      }
    }
    // No fresh context — helpful clarification
    return {
      actionType: 'clarify',
      responseText: `Sure — are you asking about today's brief, something in the review queue, or this page specifically?`,
      navigationHref: null,
      confidence: 'medium',
    }
  }

  // ── Elaboration ────────────────────────────────────────────────────────────

  if (isElaboration) {
    if (contextIsFresh && context!.lastTopicLabel) {
      const href = context!.lastSuggestedNavigationHref
      const navLabel = context!.lastSuggestedNavigationLabel ?? 'the relevant page'
      return {
        actionType: 'elaborate',
        responseText: `The main thing right now is checking ${href ? navLabel : 'today\'s items'} for anything that needs your sign-off. Want me to open it?`,
        navigationHref: href,
        confidence: 'medium',
      }
    }
    return {
      actionType: 'elaborate',
      responseText: `What would you like me to explain? You can ask about today's brief, a specific area, or how something works here.`,
      navigationHref: null,
      confidence: 'low',
    }
  }

  // ── Recommendation ─────────────────────────────────────────────────────────

  if (isRecommendation) {
    if (contextIsFresh && context!.lastIntentFamily === 'daily_brief') {
      return buildBriefRecommendationResponse(context!)
    }
    if (contextIsFresh && (context!.lastIntentFamily === 'review_queue' || context!.lastIntentFamily === 'attention')) {
      return {
        actionType: 'recommend',
        responseText: `I'd look at the Review Queue first — the oldest pending items usually need attention soonest. Want me to open it?`,
        navigationHref: '/director/review',
        confidence: 'high',
      }
    }
    // Generic recommendation (no fresh context)
    return {
      actionType: 'recommend',
      responseText: `The Review Queue is usually a good starting point — those are the items waiting on your approval. Want me to open it?`,
      navigationHref: '/director/review',
      confidence: 'medium',
    }
  }

  // ── Time shift ─────────────────────────────────────────────────────────────

  if (isTimeShift) {
    if (lower.includes('today')) {
      return {
        actionType: 'time_shift',
        responseText: `I can show you what's on today. Try "What do I need to do today?" for a full brief, or I can open the Review Queue.`,
        navigationHref: null,
        confidence: 'medium',
      }
    }
    return {
      actionType: 'time_shift',
      responseText: `I don't have last week's data here, but I can show you what's happening today. Want today's brief?`,
      navigationHref: null,
      confidence: 'medium',
    }
  }

  // ── Topic shift ────────────────────────────────────────────────────────────

  if (isTopicShift) {
    return buildTopicShiftResponse(lower)
  }

  return null
}
