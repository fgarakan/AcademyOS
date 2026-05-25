/**
 * Sprint 785 — DONNA Follow-Up Resolver V1
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
    const urgentNote = highCount > 0
      ? ` ${highCount} ${highCount === 1 ? 'section is' : 'sections are'} high priority.`
      : ''
    const text = sectionCount > 0
      ? `The brief has ${sectionCount} section${sectionCount !== 1 ? 's' : ''}.${urgentNote} The Review Queue has the full item list — want me to open it?`
      : `Today's brief is loaded. The Review Queue has the full item-by-item detail — want me to open it?`
    return { actionType: 'summarize', responseText: text, navigationHref: '/director/review', confidence: 'high' }
  }

  // "show me", "open that", "open it", "the first one", etc.
  return {
    actionType: 'navigate',
    responseText: `Opening the Review Queue now — that's where you can work through each item.`,
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
      responseText: `Start with the ${highCount} high-priority ${highCount === 1 ? 'item' : 'items'} from the brief — those need attention first. I'd head to the Review Queue now. Want me to open it?`,
      navigationHref: '/director/review',
      confidence: 'high',
    }
  }
  if (totalItems > 0) {
    return {
      actionType: 'recommend',
      responseText: `There are ${totalItems} ${totalItems === 1 ? 'item' : 'items'} in today's brief. I'd start by checking the Review Queue for any pending approvals. Want me to open it?`,
      navigationHref: '/director/review',
      confidence: 'high',
    }
  }
  return {
    actionType: 'recommend',
    responseText: `I'd start with the Review Queue — that's where pending approvals live and is usually the most time-sensitive. Want me to open it?`,
    navigationHref: '/director/review',
    confidence: 'medium',
  }
}

function buildTopicShiftResponse(lower: string): DonnaFollowUpResult {
  if (lower.includes('player')) {
    return { actionType: 'navigate', responseText: `Player Profiles show who needs attention. Want me to take you there?`, navigationHref: '/director/players', confidence: 'medium' }
  }
  if (lower.includes('session')) {
    return { actionType: 'navigate', responseText: `Session data is on the Sessions page. Want me to take you there?`, navigationHref: '/director/sessions', confidence: 'medium' }
  }
  if (lower.includes('review') || lower.includes('approval')) {
    return { actionType: 'navigate', responseText: `The Review Queue has all pending approvals. Want me to open it?`, navigationHref: '/director/review', confidence: 'high' }
  }
  if (lower.includes('curriculum')) {
    return { actionType: 'navigate', responseText: `Curriculum details are on the Curriculum page. Want me to take you there?`, navigationHref: '/director/curriculum', confidence: 'medium' }
  }
  if (lower.includes('coach')) {
    return { actionType: 'clarify', responseText: `I can help with coach-related questions — sessions, wrap-ups, or communications. What specifically would you like to know?`, navigationHref: null, confidence: 'medium' }
  }
  if (lower.includes('parent')) {
    return { actionType: 'clarify', responseText: `Parent updates go through the review process — I can help you draft one. Would you like to start a parent update draft?`, navigationHref: null, confidence: 'medium' }
  }
  return {
    actionType: 'clarify',
    responseText: `I can help with that — do you mean today's agenda, review items, or this page?`,
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
        responseText: `Opening the Review Queue — that's where you can see and work through each item.`,
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
    // No fresh context — helpful generic clarification
    return {
      actionType: 'clarify',
      responseText: `I can help with that — do you mean today's agenda, review items, or this page?`,
      navigationHref: null,
      confidence: 'medium',
    }
  }

  // ── Elaboration ────────────────────────────────────────────────────────────

  if (isElaboration) {
    if (contextIsFresh && context!.lastTopicLabel) {
      const label = context!.lastTopicLabel
      const href = context!.lastSuggestedNavigationHref
      const navLabel = context!.lastSuggestedNavigationLabel
      return {
        actionType: 'elaborate',
        responseText: `Regarding ${label}: the most important next action is to check${href ? ` the ${navLabel}` : ' today\'s pending items'} for anything requiring your approval or attention. Would you like me to open that?`,
        navigationHref: href,
        confidence: 'medium',
      }
    }
    return {
      actionType: 'elaborate',
      responseText: `Happy to explain — what specifically would you like me to expand on? You can ask about today's brief, a specific section, or how something works in AcademyOS.`,
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
        responseText: `I'd start with the highest-priority items in the Review Queue — those are the ones waiting longest for your approval. Want me to take you there?`,
        navigationHref: '/director/review',
        confidence: 'high',
      }
    }
    // Generic recommendation (no fresh context)
    return {
      actionType: 'recommend',
      responseText: `I'd check pending reviews first — those items are waiting on you and are usually the most time-sensitive. Want me to open the Review Queue?`,
      navigationHref: '/director/review',
      confidence: 'medium',
    }
  }

  // ── Time shift ─────────────────────────────────────────────────────────────

  if (isTimeShift) {
    if (lower.includes('today')) {
      return {
        actionType: 'time_shift',
        responseText: `Here's what I have for today — ask me "What do I need to do today?" for a full brief, or I can take you to the Review Queue.`,
        navigationHref: null,
        confidence: 'medium',
      }
    }
    return {
      actionType: 'time_shift',
      responseText: `Historical weekly data is available in the Reports section. For now, I have today's activity. Would you like to see today's brief instead?`,
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
