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
  // Sprint 883 audit — each value annotated with active / future-reserved status.
  // Active values have a confirmed write site in DonnaAssistantButton.tsx.
  // Sprint 884 — removed 'page_actions' (confirmed dormant in Sprint 883 audit: never written,
  // no write site, no DonnaDirectorIntent counterpart). See DONNA_INTENT_FAMILY_TYPE_UNION_AUDIT_883.md.
  lastIntentFamily:
    | 'daily_brief'      // Active — written by handleFetchDailyBrief (DonnaAssistantButton line 2248, Sprint 785)
    | 'review_queue'     // Active — written by handleOpenReviewQueue (DonnaAssistantButton line 2332, Sprint 785)
    | 'attention'        // Active — written by handleFetchAttentionReport (DonnaAssistantButton line 2208, Sprint 785)
    | 'coo_answer'       // Active — written by handleDonnaCooPrompt for all non-blocked COO answers where routing.intent !== 'roster_attention' (DonnaAssistantButton line 3051, Sprint 802; conditional added Sprint 887)
    | 'section_nav'      // Active — written by handleUIDispatch navigate block (DonnaAssistantButton line 2857, Sprint 876)
    | 'roster_attention' // Active — written by handleDonnaCooPrompt when routing.intent === 'roster_attention' (DonnaAssistantButton line 3051, Sprint 887); same fields as coo_answer; href='/director/players' or specific player href
    | null               // Cleared state — set on panel close (line 973) and route change (line 1277)
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
  // Sprint 889 — pattern expansion: natural phrases confirmed missing from pre-889 patterns.
  // All patterns are start+end anchored; word count ≤ 4 (well within the 6-word guard).
  // "take me to it" was already covered by /^take me (there|to it)$/ — not re-added.
  /^open (it|that|this)( for me)?$/,          // "open it for me", "open that for me", "open this"
  /^let me see (it|that|this)$/,              // "let me see it", "let me see that", "let me see this"
  /^bring (it|that|this) up$/,               // "bring it up", "bring that up", "bring this up"
  /^pull (it|that|this) up$/,                // "pull it up", "pull that up", "pull this up"
  /^navigate (there|to it|to that|to this)$/, // "navigate there", "navigate to it", "navigate to that"
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
  /^what is (that|this|it)$/,        // Sprint 878 — covers "what is that?" after section nav
  /^what does (that|this|it) mean$/, // Sprint 878 — covers "what does that mean?" after section nav
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
  /^what now$/, // Sprint 879 — covers "what now?" after section nav (2-word phrase; no other group matches it)
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

// ── Section nav recommendation map ───────────────────────────────────────────
// Sprint 879 — hardcoded label → action-oriented next-step copy for known section labels.
// Keys must match the focusTarget.label values set by SECTION_NAV_ENTRIES resolvers.
// Kept intentionally small — unknown labels fall back to baseline copy.

const SECTION_NAV_RECOMMENDATION_MAP: Record<string, string> = {
  'Session Blocks':    'In Session Blocks, review the planned activities, check the order, and make sure the session flow matches the group\'s needs.',
  'Session Attendance':'In Session Attendance, confirm who was present, absent, or needs follow-up before moving on.',
  'Wrap-Up Actions':   'In Wrap-Up Actions, finish the coach wrap-up and submit anything that needs review.',
  'Wrap-Up Question':  'Answer the current wrap-up question clearly and specifically, then move to the next wrap-up action.',
  'Template Blocks':   'In Template Blocks, review the block structure, make sure the activities match the template goal, and adjust anything that feels off.',
  'Run Session':       'In Run Session, use the blocks as the live coaching guide, then update attendance or notes as needed.',  // Sprint 880: key corrected from 'Coach Run Session' — entry.label is 'Run Session'
}

// ── Section nav elaboration map ───────────────────────────────────────────────
// Sprint 878 — hardcoded label → description map for known section labels.
// Keys must match the focusTarget.label values set by SECTION_NAV_ENTRIES resolvers.
// Kept intentionally small — unknown labels fall back to baseline copy.

const SECTION_NAV_ELABORATION_MAP: Record<string, string> = {
  'Session Blocks':    "It's where you review the planned activities or blocks inside that session.",
  'Session Attendance':"It's where you check who is present, absent, or needs attendance review.",
  'Wrap-Up Actions':   "It's where you finish or submit the coach wrap-up.",
  'Wrap-Up Question':  "It's the current coach wrap-up prompt DONNA is asking you to answer.",
  'Template Blocks':   "It's where the template's drills, activities, and block structure live.",
  'Run Session':       "It's the coach-facing area for executing the session, including blocks and attendance.",  // Sprint 880: key corrected from 'Coach Run Session' — entry.label is 'Run Session'
}

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

// Sprint 879 — section_nav recommendation builder
function buildSectionNavRecommendationResponse(context: DonnaSessionIntentContext): DonnaFollowUpResult {
  const label = context.lastSuggestedNavigationLabel ?? context.lastTopicLabel
  const href  = context.lastSuggestedNavigationHref

  if (label) {
    const nextStep = SECTION_NAV_RECOMMENDATION_MAP[label]
    if (nextStep) {
      return {
        actionType: 'recommend',
        responseText: `${nextStep} I can take you back there.`,
        navigationHref: href,
        confidence: 'medium',
      }
    }
    // Label set but not in map — baseline copy
    return {
      actionType: 'recommend',
      responseText: `You're at ${label}. The best next step is to review that section, make any needed updates, and continue with the related session or wrap-up flow. I can take you back there.`,
      navigationHref: href,
      confidence: 'medium',
    }
  }
  // No label — minimal fallback
  return {
    actionType: 'recommend',
    responseText: href
      ? `The best next step is to review the section DONNA just navigated to and work through whatever's there. I can take you back.`
      : `The best next step is to open the Review Queue — that's where pending items usually need attention first. Want me to open it?`,
    navigationHref: href ?? '/director/review',
    confidence: 'low',
  }
}

// Sprint 878 — section_nav elaboration builder
function buildSectionNavElaborationResponse(context: DonnaSessionIntentContext): DonnaFollowUpResult {
  const label = context.lastSuggestedNavigationLabel ?? context.lastTopicLabel
  const href  = context.lastSuggestedNavigationHref

  if (label) {
    const description = SECTION_NAV_ELABORATION_MAP[label]
    if (description) {
      return {
        actionType: 'elaborate',
        responseText: `That was ${label}. ${description} I can take you back there or help you use that section.`,
        navigationHref: href,
        confidence: 'medium',
      }
    }
    // Label is set but not in the map — baseline copy
    return {
      actionType: 'elaborate',
      responseText: `That was ${label} — the section DONNA just helped you navigate to. I can take you back there if you'd like.`,
      navigationHref: href,
      confidence: 'medium',
    }
  }
  // No label available — minimal fallback
  return {
    actionType: 'elaborate',
    responseText: href
      ? `That was the section DONNA just navigated to. I can take you back there if you'd like.`
      : `That was the section DONNA just helped you find. Ask me anything else or let me know where to go next.`,
    navigationHref: href,
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
    // Sprint 877 — explicit section_nav handler: context-aware copy via lastSuggestedNavigationLabel.
    // Fires before the generic catch-all so section-navigation follow-ups return
    // "I'll take you back to Session Blocks — that's where we were." instead of
    // the generic "I'll take you to the relevant page."
    if (contextIsFresh && context!.lastIntentFamily === 'section_nav' && context!.lastSuggestedNavigationHref) {
      return {
        actionType: 'navigate',
        responseText: context!.lastSuggestedNavigationLabel
          ? `I'll take you back to ${context!.lastSuggestedNavigationLabel} — that's where we were.`
          : `I'll take you back to that section.`,
        navigationHref: context!.lastSuggestedNavigationHref,
        confidence: 'medium',
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
    // Sprint 885 — explicit daily_brief elaboration handler.
    // Fires first so "what is that?", "tell me more", "explain that" after the daily brief loads
    // returns brief-specific explanation copy instead of the generic lastTopicLabel handler's
    // "checking Review Queue for sign-off" framing (which fires because lastSuggestedNavigationLabel
    // is 'Review Queue' and lastTopicLabel is "today's brief" — both semantically off for elaboration).
    if (contextIsFresh && context!.lastIntentFamily === 'daily_brief') {
      const sectionCount = context!.lastResultSectionCount
      const highCount    = context!.lastResultHighPriorityCount
      const href         = context!.lastSuggestedNavigationHref ?? '/director/review'

      let responseText: string
      if (sectionCount !== null && highCount !== null && highCount > 0) {
        responseText = `Today's brief summarizes ${sectionCount} area${sectionCount !== 1 ? 's' : ''}, with ${highCount} higher-priority item${highCount !== 1 ? 's' : ''} to look at first. It helps you quickly see what needs attention before you start making decisions. I can open the Review Queue if you want the item-by-item list.`
      } else if (sectionCount !== null) {
        responseText = `Today's brief summarizes ${sectionCount} area${sectionCount !== 1 ? 's' : ''} that may need your attention. It helps you quickly understand what matters today before you start making decisions. I can open the Review Queue if you want the item-by-item list.`
      } else {
        responseText = `Today's brief is DONNA's quick summary of what needs your attention today. It helps you understand the important items before you start making decisions. I can open the Review Queue if you want the item-by-item list.`
      }

      return {
        actionType: 'elaborate',
        responseText,
        navigationHref: href,
        confidence: 'medium',
      }
    }
    // Sprint 878 — explicit section_nav elaboration handler.
    // Fires before the generic lastTopicLabel check so DONNA gives a useful
    // section-specific description (via SECTION_NAV_ELABORATION_MAP) instead of
    // the generic "checking {navLabel} for sign-off" copy.
    if (contextIsFresh && context!.lastIntentFamily === 'section_nav') {
      return buildSectionNavElaborationResponse(context!)
    }
    // Sprint 888 — explicit roster_attention elaboration handler.
    // Fires before the coo_answer handler (Sprint 882) so roster-specific copy replaces
    // the generic "That was Player Directory — the page DONNA suggested" framing.
    // Label-as-condition: lastSuggestedNavigationLabel is a follow-up prompt or player name —
    // not suitable for direct injection into copy; presence determines which variant to use.
    // Navigation: lastSuggestedNavigationHref always set for roster_attention
    // (buildRosterHubAnswer guarantees href = '/director/players' or '/director/players/${id}').
    if (contextIsFresh && context!.lastIntentFamily === 'roster_attention' && context!.lastSuggestedNavigationHref) {
      return {
        actionType: 'elaborate',
        responseText: context!.lastSuggestedNavigationLabel
          ? `That was the roster attention view — DONNA's summary of players or roster items that may need your attention. I can take you there or help you decide whether it matters right now.`
          : `That was DONNA's roster attention summary. I can take you there or help you decide whether it matters right now.`,
        navigationHref: context!.lastSuggestedNavigationHref,
        confidence: 'medium',
      }
    }
    // Sprint 882 — explicit coo_answer elaboration handler.
    // When DONNA's COO answer suggested a specific page (lastSuggestedNavigationHref set),
    // the generic lastTopicLabel handler's "checking {label} for sign-off" framing is too
    // narrow — not every COO-suggested page is about sign-off. This handler returns copy
    // that names the suggested page naturally and offers to navigate there.
    // Sprint 887 roster_attention extension superseded by Sprint 888 dedicated handler above.
    if (contextIsFresh && context!.lastIntentFamily === 'coo_answer' && context!.lastSuggestedNavigationHref) {
      const label = context!.lastSuggestedNavigationLabel ?? context!.lastTopicLabel
      return {
        actionType: 'elaborate',
        responseText: label
          ? `That was ${label} — the page DONNA suggested based on your question. I can take you there or help you decide whether it matters right now.`
          : `That was the page DONNA suggested based on your question. I can take you there or help you decide whether it matters right now.`,
        navigationHref: context!.lastSuggestedNavigationHref,
        confidence: 'medium',
      }
    }
    // Sprint 890 — explicit review_queue and attention elaboration handlers.
    // Both families previously fell to the generic lastTopicLabel handler: "checking Review Queue
    // for sign-off" (Sprint 886 audit: "Generic + acceptable" — functionally correct but imprecise).
    // review_queue copy should describe the queue's purpose; attention copy should name the feature
    // rather than using "sign-off" framing. Combined check mirrors the existing pattern used in the
    // anaphoric and recommendation branches for these two families.
    if (contextIsFresh && (context!.lastIntentFamily === 'review_queue' || context!.lastIntentFamily === 'attention')) {
      const isReviewQueue = context!.lastIntentFamily === 'review_queue'
      const href = context!.lastSuggestedNavigationHref ?? '/director/review'
      return {
        actionType: 'elaborate',
        responseText: isReviewQueue
          ? `That was the Review Queue — the place where DONNA collects items waiting for your approval or review. I can open it so you can go through each item.`
          : `That was the attention view — DONNA's summary of urgent items that may need your review first. I can open the Review Queue so you can handle them.`,
        navigationHref: href,
        confidence: 'medium',
      }
    }
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
    // Sprint 879 — explicit section_nav recommendation handler.
    // Fires before the generic fallback so "what should I do next?" / "what now?" after section
    // navigation returns action-oriented guidance via SECTION_NAV_RECOMMENDATION_MAP instead of
    // the generic "Review Queue is a good starting point" copy.
    if (contextIsFresh && context!.lastIntentFamily === 'section_nav') {
      return buildSectionNavRecommendationResponse(context!)
    }
    // Sprint 888 — explicit roster_attention recommendation handler.
    // Fires before the coo_answer handler (Sprint 881) so roster-specific copy replaces
    // the generic "DONNA suggested Player Directory" framing.
    // Label-as-condition: same rationale as elaboration handler above.
    if (contextIsFresh && context!.lastIntentFamily === 'roster_attention' && context!.lastSuggestedNavigationHref) {
      return {
        actionType: 'recommend',
        responseText: context!.lastSuggestedNavigationLabel
          ? `DONNA flagged roster attention. The best next step is to open the roster view and review which players or roster items need attention. I can take you there.`
          : `DONNA flagged something in the roster. The best next step is to open the roster view and review what needs attention. I can take you there.`,
        navigationHref: context!.lastSuggestedNavigationHref,
        confidence: 'medium',
      }
    }
    // Sprint 881 — explicit coo_answer recommendation handler.
    // Written at DonnaAssistantButton.tsx line 3051 for all non-blocked COO answers where
    // routing.intent !== 'roster_attention'. When lastSuggestedNavigationHref is set, the
    // generic Review Queue fallback is semantically wrong — the user should go to the page
    // DONNA just suggested, not the Review Queue.
    // Sprint 887 roster_attention extension superseded by Sprint 888 dedicated handler above.
    if (contextIsFresh && context!.lastIntentFamily === 'coo_answer' && context!.lastSuggestedNavigationHref) {
      const label = context!.lastSuggestedNavigationLabel ?? context!.lastTopicLabel
      return {
        actionType: 'recommend',
        responseText: label
          ? `DONNA suggested ${label}. The best next step is to open it and review what needs your attention there. I can take you there.`
          : `DONNA suggested a page for this. The best next step is to open it and review what needs your attention there. I can take you there.`,
        navigationHref: context!.lastSuggestedNavigationHref,
        confidence: 'medium',
      }
    }
    // Generic recommendation fallback — fires when: (a) no fresh context, or (b) coo_answer
    // with no suggested href (DONNA answered conversationally without a page suggestion), or
    // (c) roster_attention with no href (impossible in practice — buildRosterHubAnswer always
    // sets href), or (d) any other intent family not handled above (stale or unhandled context).
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
