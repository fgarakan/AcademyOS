// Director Attention Queue — Item Builder
//
// Pure TypeScript. No DB calls. No mutations. No side effects.
// Takes pre-fetched DB rows and produces a scored, sorted AttentionItem list.
//
// Scoring philosophy:
//   High   — time-sensitive, blocking player progress or director workflow
//   Medium — important but not immediately blocking
//   Low    — informational, best-effort improvement
//
// DONNA explanations are deterministic text. No AI inference.

// ── Types ─────────────────────────────────────────────────────────────────────

export type AttentionCategory =
  | 'reassessment_due'
  | 'onboarding_incomplete'
  | 'placement_review_needed'
  | 'level_readiness_review'
  | 'missing_assessment'
  | 'parent_update_pending'
  | 'coach_followup_needed'
  | 'missing_evidence'

export type AttentionPriority = 'high' | 'medium' | 'low'

export type AttentionFilter =
  | 'all'
  | 'players'
  | 'reassessment'
  | 'parent-updates'
  | 'placements'
  | 'onboarding'
  | 'coach'

export interface AttentionItem {
  id: string
  category: AttentionCategory
  priority: AttentionPriority
  // Player fields (null for aggregate items like coach recaps)
  playerId: string | null
  playerName: string | null
  currentLevel: string | null
  groupName: string | null
  coachName: string | null
  // Display
  reason: string
  recommendedAction: string
  donnaExplanation: string
  // Navigation
  href: string
  // Filter membership
  filters: AttentionFilter[]
  // Supporting metadata
  daysSinceEvent: number | null
}

// ── Input row shapes ──────────────────────────────────────────────────────────

export interface PlayerSummaryRow {
  player_id: string | null
  full_name: string | null
  player_status: string | null
  level_label: string | null
  group_name: string | null
  coach_name: string | null
  last_assessed_at: string | null
  next_assessment_due: string | null
  promotion_ready: boolean | null
  overall_score: number | null
  focus_areas: string[] | null
  assessment_status: string | null
}

export interface ReassessmentRow {
  player_id: string | null
  full_name: string | null
  group_name: string | null
  coach_name: string | null
  urgency: string | null
  days_overdue: number | null
  last_assessed_at: string | null
}

export interface PendingActionRow {
  id: string
  action_label: string | null
  target_module: string
  created_at: string
}

export interface BuildAttentionItemsInput {
  players: PlayerSummaryRow[]
  reassessmentRows: ReassessmentRow[]
  placementActions: PendingActionRow[]
  parentActions: PendingActionRow[]
  coachWrapUpActions: PendingActionRow[]
}

// ── Priority ordering ─────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<AttentionPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(isoString: string | null): number | null {
  if (!isoString) return null
  const ms = Date.now() - new Date(isoString).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function playerHref(playerId: string | null): string {
  return playerId ? `/director/players/${playerId}` : '/director/players'
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildAttentionItems(input: BuildAttentionItemsInput): AttentionItem[] {
  const items: AttentionItem[] = []

  // ── 1. Reassessment Due ─────────────────────────────────────────────────────
  for (const row of input.reassessmentRows) {
    if (!row.player_id) continue
    const isOverdue = row.urgency === 'overdue'
    const days = row.days_overdue ?? daysSince(row.last_assessed_at)
    const daysText = days != null ? `${days} days` : 'some time'
    items.push({
      id: `reassessment_${row.player_id}`,
      category: 'reassessment_due',
      priority: isOverdue ? 'high' : 'medium',
      playerId: row.player_id,
      playerName: row.full_name,
      currentLevel: null,
      groupName: row.group_name,
      coachName: row.coach_name,
      reason: isOverdue
        ? `Reassessment overdue by ${daysText}`
        : `Reassessment due soon (${daysText} since last)`,
      recommendedAction: 'Schedule reassessment and complete assessment form.',
      donnaExplanation: isOverdue
        ? `${row.full_name ?? 'This player'}'s development data is stale. Placement and level decisions made without a current assessment carry higher risk.`
        : `${row.full_name ?? 'This player'} is approaching their reassessment window. Scheduling now avoids a gap in development tracking.`,
      href: playerHref(row.player_id),
      filters: ['all', 'players', 'reassessment'],
      daysSinceEvent: days,
    })
  }

  // ── 2. Onboarding Incomplete ────────────────────────────────────────────────
  const onboardingStatuses = new Set(['pending_placement', 'placement_in_progress', 'pending_approval'])
  for (const row of input.players) {
    if (!row.player_id) continue
    if (!row.player_status || !onboardingStatuses.has(row.player_status)) continue
    const statusLabel =
      row.player_status === 'pending_placement' ? 'pending placement'
      : row.player_status === 'placement_in_progress' ? 'placement in progress'
      : 'pending approval'
    items.push({
      id: `onboarding_${row.player_id}`,
      category: 'onboarding_incomplete',
      priority: 'high',
      playerId: row.player_id,
      playerName: row.full_name,
      currentLevel: row.level_label,
      groupName: row.group_name,
      coachName: row.coach_name,
      reason: `Onboarding incomplete — ${statusLabel}`,
      recommendedAction: 'Resume onboarding flow and complete placement.',
      donnaExplanation: `${row.full_name ?? 'This player'} cannot be assigned to a group or receive curriculum guidance until onboarding is complete.`,
      href: row.player_id ? `/director/players/${row.player_id}/onboard` : '/director/players/onboarding-review',
      filters: ['all', 'players', 'onboarding'],
      daysSinceEvent: null,
    })
  }

  // ── 3. Placement Review Needed ──────────────────────────────────────────────
  for (const action of input.placementActions) {
    const label = action.action_label ?? 'Placement pending review'
    const createdDays = daysSince(action.created_at)
    items.push({
      id: `placement_${action.id}`,
      category: 'placement_review_needed',
      priority: 'high',
      playerId: null,
      playerName: null,
      currentLevel: null,
      groupName: null,
      coachName: null,
      reason: `${label} — awaiting director decision`,
      recommendedAction: 'Review and approve or reject in the Review Queue.',
      donnaExplanation: `This placement recommendation has been waiting${createdDays != null ? ` for ${createdDays} day${createdDays !== 1 ? 's' : ''}` : ''}. Delaying blocks the player from being officially placed.`,
      href: '/director/review?tab=needs-approval',
      filters: ['all', 'placements'],
      daysSinceEvent: createdDays,
    })
  }

  // ── 4. Level Readiness Review ───────────────────────────────────────────────
  for (const row of input.players) {
    if (!row.player_id) continue
    if (row.promotion_ready !== true) continue
    if (row.player_status !== 'active') continue
    items.push({
      id: `level_ready_${row.player_id}`,
      category: 'level_readiness_review',
      priority: 'medium',
      playerId: row.player_id,
      playerName: row.full_name,
      currentLevel: row.level_label,
      groupName: row.group_name,
      coachName: row.coach_name,
      reason: `Marked promotion-ready at ${row.level_label ?? 'current level'} — awaiting level review`,
      recommendedAction: 'Review evidence and initiate level readiness review.',
      donnaExplanation: `${row.full_name ?? 'This player'} has met the criteria for level advancement. A director review confirms the move is well-supported before any change is made.`,
      href: playerHref(row.player_id),
      filters: ['all', 'players', 'placements'],
      daysSinceEvent: null,
    })
  }

  // ── 5. Missing Assessment ───────────────────────────────────────────────────
  for (const row of input.players) {
    if (!row.player_id) continue
    if (row.player_status !== 'active') continue
    // Only flag if never assessed (no last_assessed_at) and no overall score
    if (row.last_assessed_at !== null) continue
    if (row.overall_score !== null) continue
    items.push({
      id: `missing_assessment_${row.player_id}`,
      category: 'missing_assessment',
      priority: 'medium',
      playerId: row.player_id,
      playerName: row.full_name,
      currentLevel: row.level_label,
      groupName: row.group_name,
      coachName: row.coach_name,
      reason: 'No assessment on record — baseline missing',
      recommendedAction: 'Complete intake assessment to establish a baseline.',
      donnaExplanation: `${row.full_name ?? 'This player'} has no assessment data. Placement recommendations, level tracking, and mission assignments all depend on at least one assessment.`,
      href: playerHref(row.player_id),
      filters: ['all', 'players'],
      daysSinceEvent: null,
    })
  }

  // ── 6. Parent Update Pending ────────────────────────────────────────────────
  for (const action of input.parentActions) {
    const label = action.action_label ?? 'Parent communication pending'
    const createdDays = daysSince(action.created_at)
    items.push({
      id: `parent_${action.id}`,
      category: 'parent_update_pending',
      priority: 'medium',
      playerId: null,
      playerName: null,
      currentLevel: null,
      groupName: null,
      coachName: null,
      reason: `${label} — awaiting director approval`,
      recommendedAction: 'Review and approve parent update before it is sent.',
      donnaExplanation: `A parent communication is staged for approval. Once approved, it will be visible to the parent. Nothing is sent until you approve.`,
      href: '/director/review?tab=player-updates',
      filters: ['all', 'parent-updates'],
      daysSinceEvent: createdDays,
    })
  }

  // ── 7. Coach Follow-Up Needed ───────────────────────────────────────────────
  if (input.coachWrapUpActions.length > 0) {
    const count = input.coachWrapUpActions.length
    const oldest = input.coachWrapUpActions.reduce((a, b) =>
      a.created_at < b.created_at ? a : b
    )
    const oldestDays = daysSince(oldest.created_at)
    items.push({
      id: 'coach_followup_wrapups',
      category: 'coach_followup_needed',
      priority: 'medium',
      playerId: null,
      playerName: null,
      currentLevel: null,
      groupName: null,
      coachName: null,
      reason: `${count} coach wrap-up${count !== 1 ? 's' : ''} awaiting review`,
      recommendedAction: 'Review coach session recaps and approve or request clarification.',
      donnaExplanation: `Coach session recaps contain attendance notes, observations, and player flags. Reviewing them keeps the director informed and unlocks the session record.${oldestDays != null ? ` The oldest is ${oldestDays} day${oldestDays !== 1 ? 's' : ''} old.` : ''}`,
      href: '/director/review?tab=needs-approval',
      filters: ['all', 'coach'],
      daysSinceEvent: oldestDays,
    })
  }

  // ── 8. Missing Evidence ─────────────────────────────────────────────────────
  for (const row of input.players) {
    if (!row.player_id) continue
    if (row.player_status !== 'active') continue
    // Skip if already flagged for missing assessment (same root cause)
    if (row.last_assessed_at === null && row.overall_score === null) continue
    // Flag active players with no focus areas and no group (drifting)
    if (row.focus_areas && row.focus_areas.length > 0) continue
    if (row.group_name !== null) continue // assigned to group = not drifting
    items.push({
      id: `missing_evidence_${row.player_id}`,
      category: 'missing_evidence',
      priority: 'low',
      playerId: row.player_id,
      playerName: row.full_name,
      currentLevel: row.level_label,
      groupName: row.group_name,
      coachName: row.coach_name,
      reason: 'Active player with no group assignment and no focus areas',
      recommendedAction: 'Assign to a group or add focus areas via player profile.',
      donnaExplanation: `${row.full_name ?? 'This player'} is active but not connected to a coaching group or development focus. They may not be receiving structured training.`,
      href: playerHref(row.player_id),
      filters: ['all', 'players'],
      daysSinceEvent: null,
    })
  }

  // ── Sort: High → Medium → Low, then alphabetically by playerName ────────────
  return items.sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (pDiff !== 0) return pDiff
    return (a.playerName ?? 'zzz').localeCompare(b.playerName ?? 'zzz')
  })
}

// ── Filter helper ─────────────────────────────────────────────────────────────

export function filterAttentionItems(
  items: AttentionItem[],
  filter: AttentionFilter,
): AttentionItem[] {
  if (filter === 'all') return items
  return items.filter(item => item.filters.includes(filter))
}

// ── Category metadata ─────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<AttentionCategory, string> = {
  reassessment_due:        'Reassessment Due',
  onboarding_incomplete:   'Onboarding Incomplete',
  placement_review_needed: 'Placement Review',
  level_readiness_review:  'Level Readiness',
  missing_assessment:      'Missing Assessment',
  parent_update_pending:   'Parent Update',
  coach_followup_needed:   'Coach Follow-Up',
  missing_evidence:        'Missing Evidence',
}

export const FILTER_LABELS: Record<AttentionFilter, string> = {
  all:            'All',
  players:        'Players',
  reassessment:   'Reassessment',
  'parent-updates': 'Parent Updates',
  placements:     'Placements',
  onboarding:     'Onboarding',
  coach:          'Coach',
}
