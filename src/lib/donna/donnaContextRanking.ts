// DONNA Cross-Module Context Ranking — Sprint 506
// Prioritizes which insights/questions DONNA should surface first in a session.
// Input: current session state. Output: ranked context suggestions.
// Pure TypeScript — no DB calls, no side effects.

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContextSignalType =
  | 'high_urgency_flag'
  | 'pending_review_items'
  | 'approved_not_applied'
  | 'wrap_up_outstanding'
  | 'player_attention_risk'
  | 'parent_update_due'
  | 'coach_support_needed'
  | 'curriculum_bottleneck'
  | 'group_health_at_risk'
  | 'review_queue_empty'
  | 'all_wrap_ups_submitted'

export type ContextSuggestionModule =
  | 'review_queue'
  | 'player_attention'
  | 'group_health'
  | 'coach_support'
  | 'parent_coverage'
  | 'curriculum'
  | 'wrap_up_status'
  | 'command_brief'

export interface DonnaContextSuggestion {
  id: string
  module: ContextSuggestionModule
  signal: ContextSignalType
  donnaIntro: string
  priority: number // 1 = highest
  requiresImmediateAttention: boolean
  questionId: string | null
}

export interface DonnaContextRankingInput {
  timeOfDay: 'morning' | 'midday' | 'afternoon' | 'evening'
  pendingReviewCount: number
  approvedNotAppliedCount: number
  highUrgencyFlagCount: number
  wrapUpsOutstanding: number
  playerAttentionRiskCount: number
  coachSupportNeededCount: number
  parentUpdateOverdueCount: number
  curriculumBottleneckCount: number
  groupsAtRiskCount: number
  lastInteractionModule: ContextSuggestionModule | null
}

export interface DonnaContextRankingResult {
  suggestions: DonnaContextSuggestion[]
  topSuggestion: DonnaContextSuggestion | null
  donnaOpeningLine: string
}

// ── Signal scorers ────────────────────────────────────────────────────────────

function scoreHighUrgency(count: number): number {
  // High urgency flags are always the highest priority
  return count > 0 ? 1000 + count * 10 : 0
}

function scorePendingReview(count: number): number {
  return count > 5 ? 800 : count > 2 ? 600 : count > 0 ? 400 : 0
}

function scoreApprovedNotApplied(count: number): number {
  // Approved but not applied = director left something half-done
  return count > 3 ? 700 : count > 0 ? 350 : 0
}

function scoreWrapUpsOutstanding(count: number, timeOfDay: DonnaContextRankingInput['timeOfDay']): number {
  // Wrap-ups matter more in the afternoon/evening after sessions
  const timeMultiplier = timeOfDay === 'afternoon' || timeOfDay === 'evening' ? 1.5 : 1.0
  return count > 0 ? Math.round(300 * timeMultiplier) : 0
}

function scorePlayerAttentionRisk(count: number): number {
  return count > 3 ? 500 : count > 1 ? 300 : count > 0 ? 200 : 0
}

function scoreGroupsAtRisk(count: number): number {
  return count > 2 ? 450 : count > 0 ? 250 : 0
}

function scoreCoachSupport(count: number): number {
  return count > 2 ? 400 : count > 0 ? 200 : 0
}

function scoreParentOverdue(count: number): number {
  return count > 5 ? 350 : count > 2 ? 200 : count > 0 ? 100 : 0
}

function scoreCurriculumBottleneck(count: number): number {
  return count > 3 ? 300 : count > 0 ? 150 : 0
}

// ── Suggestion builders ───────────────────────────────────────────────────────

function buildSuggestions(input: DonnaContextRankingInput): DonnaContextSuggestion[] {
  const suggestions: DonnaContextSuggestion[] = []

  if (input.highUrgencyFlagCount > 0) {
    suggestions.push({
      id: 'high_urgency',
      module: 'player_attention',
      signal: 'high_urgency_flag',
      donnaIntro: `There are ${input.highUrgencyFlagCount} high-priority player flag(s) that need your attention now.`,
      priority: scoreHighUrgency(input.highUrgencyFlagCount),
      requiresImmediateAttention: true,
      questionId: 'who_needs_attention',
    })
  }

  if (input.pendingReviewCount > 0) {
    suggestions.push({
      id: 'pending_review',
      module: 'review_queue',
      signal: 'pending_review_items',
      donnaIntro: `You have ${input.pendingReviewCount} item(s) waiting for your review.`,
      priority: scorePendingReview(input.pendingReviewCount),
      requiresImmediateAttention: input.pendingReviewCount > 5,
      questionId: 'review_queue_status',
    })
  }

  if (input.approvedNotAppliedCount > 0) {
    suggestions.push({
      id: 'approved_not_applied',
      module: 'review_queue',
      signal: 'approved_not_applied',
      donnaIntro: `${input.approvedNotAppliedCount} item(s) are approved but haven't been applied yet.`,
      priority: scoreApprovedNotApplied(input.approvedNotAppliedCount),
      requiresImmediateAttention: false,
      questionId: 'approved_not_applied',
    })
  }

  if (input.wrapUpsOutstanding > 0) {
    suggestions.push({
      id: 'wrap_ups_outstanding',
      module: 'wrap_up_status',
      signal: 'wrap_up_outstanding',
      donnaIntro: `${input.wrapUpsOutstanding} session(s) still need a wrap-up.`,
      priority: scoreWrapUpsOutstanding(input.wrapUpsOutstanding, input.timeOfDay),
      requiresImmediateAttention: false,
      questionId: 'wrap_up_submission_status',
    })
  }

  if (input.playerAttentionRiskCount > 0 && input.highUrgencyFlagCount === 0) {
    suggestions.push({
      id: 'player_attention',
      module: 'player_attention',
      signal: 'player_attention_risk',
      donnaIntro: `${input.playerAttentionRiskCount} player(s) may need attention.`,
      priority: scorePlayerAttentionRisk(input.playerAttentionRiskCount),
      requiresImmediateAttention: false,
      questionId: 'who_needs_attention',
    })
  }

  if (input.groupsAtRiskCount > 0) {
    suggestions.push({
      id: 'groups_at_risk',
      module: 'group_health',
      signal: 'group_health_at_risk',
      donnaIntro: `${input.groupsAtRiskCount} group(s) are showing health warning signs.`,
      priority: scoreGroupsAtRisk(input.groupsAtRiskCount),
      requiresImmediateAttention: false,
      questionId: 'how_are_groups_doing',
    })
  }

  if (input.coachSupportNeededCount > 0) {
    suggestions.push({
      id: 'coach_support',
      module: 'coach_support',
      signal: 'coach_support_needed',
      donnaIntro: `${input.coachSupportNeededCount} coach(es) may benefit from a check-in.`,
      priority: scoreCoachSupport(input.coachSupportNeededCount),
      requiresImmediateAttention: false,
      questionId: 'which_coaches_need_support',
    })
  }

  if (input.parentUpdateOverdueCount > 0) {
    suggestions.push({
      id: 'parent_overdue',
      module: 'parent_coverage',
      signal: 'parent_update_due',
      donnaIntro: `${input.parentUpdateOverdueCount} families haven't heard from the academy recently.`,
      priority: scoreParentOverdue(input.parentUpdateOverdueCount),
      requiresImmediateAttention: false,
      questionId: 'parent_communication_status',
    })
  }

  if (input.curriculumBottleneckCount > 0) {
    suggestions.push({
      id: 'curriculum_bottleneck',
      module: 'curriculum',
      signal: 'curriculum_bottleneck',
      donnaIntro: `I've spotted ${input.curriculumBottleneckCount} recurring skill pattern(s) worth discussing.`,
      priority: scoreCurriculumBottleneck(input.curriculumBottleneckCount),
      requiresImmediateAttention: false,
      questionId: 'curriculum_bottleneck_check',
    })
  }

  // Re-rank by priority (descending), keeping 1 as the highest after sort
  suggestions.sort((a, b) => b.priority - a.priority)

  // Renumber priorities 1..N after sorting
  suggestions.forEach((s, i) => {
    s.priority = i + 1
  })

  return suggestions
}

// ── Opening line builder ──────────────────────────────────────────────────────

function buildOpeningLine(
  suggestions: DonnaContextSuggestion[],
  timeOfDay: DonnaContextRankingInput['timeOfDay'],
): string {
  if (suggestions.length === 0) {
    const greetings = {
      morning: "Good morning. Everything looks calm. Here's today's brief.",
      midday: "Midday check-in — no urgent items right now.",
      afternoon: "Afternoon check — things are on track.",
      evening: "Good evening. Wrapping up for today.",
    }
    return greetings[timeOfDay]
  }

  const top = suggestions[0]
  if (top.requiresImmediateAttention) {
    return `Heads up — ${top.donnaIntro}`
  }

  const greetingPrefix = {
    morning: "Good morning.",
    midday: "Here's your midday update.",
    afternoon: "Checking in.",
    evening: "Before you wrap up —",
  }

  return `${greetingPrefix[timeOfDay]} ${top.donnaIntro}`
}

// ── Main ranker ───────────────────────────────────────────────────────────────

export function rankDonnaContext(input: DonnaContextRankingInput): DonnaContextRankingResult {
  const suggestions = buildSuggestions(input)
  const topSuggestion = suggestions.length > 0 ? suggestions[0] : null
  const donnaOpeningLine = buildOpeningLine(suggestions, input.timeOfDay)

  return {
    suggestions,
    topSuggestion,
    donnaOpeningLine,
  }
}

// ── Utility: filter by module ─────────────────────────────────────────────────

export function getSuggestionsForModule(
  result: DonnaContextRankingResult,
  module: ContextSuggestionModule,
): DonnaContextSuggestion[] {
  return result.suggestions.filter(s => s.module === module)
}

export function getImmediateAttentionItems(
  result: DonnaContextRankingResult,
): DonnaContextSuggestion[] {
  return result.suggestions.filter(s => s.requiresImmediateAttention)
}
