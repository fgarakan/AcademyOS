// Sprint 935 — DONNA Daily COO Briefing V1
// Pure TypeScript aggregator. No DB calls. No API calls. No side effects.
// Converts raw director page signals into a structured COODailyBrief.
//
// Design rules:
//   - Missing data is disclosed, never invented.
//   - All counts come from live Supabase queries already run by director/page.tsx.
//   - Aggregator never queries anything — it only reads what is passed to it.
//   - Section status derived deterministically from signal counts.
//   - Top 3 actions are always the highest-urgency actionable items.

// ── Item types ─────────────────────────────────────────────────────────────────

export type COOBriefUrgency = 'critical' | 'high' | 'medium' | 'low'

export interface COOBriefItem {
  id: string
  label: string
  detail: string | null
  urgency: COOBriefUrgency
  actionLabel: string
  actionHref: string
}

export interface COOBriefSection {
  id: string
  title: string
  items: COOBriefItem[]
  status: 'urgent' | 'attention' | 'clear' | 'no_data'
  clearMessage: string
}

export interface COODailyBrief {
  generatedAt: string
  overallStatus: 'critical' | 'attention' | 'on_track' | 'no_data'
  openingStatement: string
  sections: {
    todayPriority: COOBriefSection
    watchList: COOBriefSection
    decisionsWaiting: COOBriefSection
    parentCoachFollowUp: COOBriefSection
    setupCurriculum: COOBriefSection
  }
  top3Actions: COOBriefItem[]
  missingDataNotes: string[]
  hasUrgentItems: boolean
  totalAttentionItems: number
}

// ── Aggregator input ───────────────────────────────────────────────────────────

export interface COOAggregatorInput {
  activePlayers: number
  todaySessionCount: number
  sessionsThisWeek: number
  // Decisions waiting (review queue)
  pendingWrapUps: number
  assessmentsInReview: number
  placementReviews: number
  parentUpdatesWaiting: number
  lessonRequests: number
  oldestPendingReviewAgeDays: number | null
  // Player signals
  attentionCount: number           // on_hold or reassessment_due
  advancementReadyCount: number
  stalledPlayerCount: number
  pendingPlacementCount: number    // awaiting curriculum placement
  reassessmentDueCount: number
  // Coach / session
  coachRecapsMissing: number
  coachCoverageGaps: number        // sessions today without an assigned coach
  // Curriculum / setup
  curriculumGapCount: number
  playersWithoutLevel: number
  curriculumTemplateCoverageGapCount: number
  classTemplateCount: number
  sessionsExist: boolean
}

// ── Urgency ordering ───────────────────────────────────────────────────────────

const URGENCY_RANK: Record<COOBriefUrgency, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

// ── Section builders ───────────────────────────────────────────────────────────

function buildTodayPrioritySection(input: COOAggregatorInput): COOBriefSection {
  const items: COOBriefItem[] = []

  const totalReviewItems = input.pendingWrapUps + input.assessmentsInReview + input.placementReviews
  if (totalReviewItems > 0) {
    const n = totalReviewItems
    const ageDetail = input.oldestPendingReviewAgeDays !== null && input.oldestPendingReviewAgeDays > 1
      ? `oldest ${input.oldestPendingReviewAgeDays} day${input.oldestPendingReviewAgeDays !== 1 ? 's' : ''} ago`
      : null
    items.push({
      id: 'review_queue_total',
      label: `${n} ${n === 1 ? 'item' : 'items'} in the review queue awaiting your decision`,
      detail: ageDetail,
      urgency: n >= 5 ? 'critical' : 'high',
      actionLabel: 'Open Review Queue',
      actionHref: '/director/review',
    })
  }

  if (input.attentionCount > 0) {
    const n = input.attentionCount
    items.push({
      id: 'players_attention',
      label: `${n} ${n === 1 ? 'player is' : 'players are'} on hold or due for reassessment`,
      detail: null,
      urgency: n >= 3 ? 'critical' : 'high',
      actionLabel: 'View Players',
      actionHref: '/director/players',
    })
  }

  if (input.coachCoverageGaps > 0) {
    items.push({
      id: 'coach_coverage_gaps',
      label: `${input.coachCoverageGaps} ${input.coachCoverageGaps === 1 ? 'session today has' : 'sessions today have'} no assigned coach`,
      detail: 'Coach assignment needed before session starts',
      urgency: 'high',
      actionLabel: 'View Sessions',
      actionHref: '/director/sessions',
    })
  }

  const hasUrgent = items.some(i => i.urgency === 'critical' || i.urgency === 'high')
  return {
    id: 'today_priority',
    title: "Today's Priority",
    items,
    status: items.length === 0 ? 'clear' : hasUrgent ? 'urgent' : 'attention',
    clearMessage: 'No critical items right now. Academy is running to plan.',
  }
}

function buildWatchListSection(input: COOAggregatorInput): COOBriefSection {
  const items: COOBriefItem[] = []

  if (input.pendingPlacementCount > 0) {
    const n = input.pendingPlacementCount
    items.push({
      id: 'pending_placement',
      label: `${n} ${n === 1 ? 'player is' : 'players are'} awaiting curriculum placement`,
      detail: 'Cannot join a training group until placed',
      urgency: 'high',
      actionLabel: 'View Players',
      actionHref: '/director/players',
    })
  }

  if (input.reassessmentDueCount > 0) {
    const n = input.reassessmentDueCount
    items.push({
      id: 'reassessment_due',
      label: `${n} ${n === 1 ? 'player is' : 'players are'} overdue for reassessment`,
      detail: null,
      urgency: 'high',
      actionLabel: 'View Players',
      actionHref: '/director/players',
    })
  }

  if (input.advancementReadyCount > 0) {
    const n = input.advancementReadyCount
    items.push({
      id: 'advancement_ready',
      label: `${n} ${n === 1 ? 'player meets' : 'players meet'} all gate criteria for level advancement`,
      detail: 'Level changes require your review — never automatic',
      urgency: 'medium',
      actionLabel: 'Review Players',
      actionHref: '/director/players',
    })
  }

  if (input.stalledPlayerCount > 0) {
    const n = input.stalledPlayerCount
    items.push({
      id: 'stalled_players',
      label: `${n} ${n === 1 ? 'player has' : 'players have'} stalled development (180+ days at current level)`,
      detail: null,
      urgency: 'medium',
      actionLabel: 'View Players',
      actionHref: '/director/players',
    })
  }

  const hasUrgent = items.some(i => i.urgency === 'critical' || i.urgency === 'high')
  const hasItems   = items.length > 0
  return {
    id: 'watch_list',
    title: 'Watch List',
    items,
    status: !hasItems ? 'clear' : hasUrgent ? 'urgent' : 'attention',
    clearMessage: `${input.activePlayers} active player${input.activePlayers !== 1 ? 's' : ''} — no development concerns flagged.`,
  }
}

function buildDecisionsWaitingSection(input: COOAggregatorInput): COOBriefSection {
  const items: COOBriefItem[] = []

  if (input.pendingWrapUps > 0) {
    const n = input.pendingWrapUps
    items.push({
      id: 'pending_wrap_ups',
      label: `${n} coach wrap-up${n !== 1 ? 's' : ''} awaiting your review`,
      detail: 'Session notes and observations pending approval',
      urgency: n >= 3 ? 'high' : 'medium',
      actionLabel: 'Review Queue',
      actionHref: '/director/review',
    })
  }

  if (input.assessmentsInReview > 0) {
    const n = input.assessmentsInReview
    items.push({
      id: 'assessments_in_review',
      label: `${n} assessment${n !== 1 ? 's' : ''} in the review queue`,
      detail: null,
      urgency: 'medium',
      actionLabel: 'Review Queue',
      actionHref: '/director/review',
    })
  }

  if (input.placementReviews > 0) {
    const n = input.placementReviews
    items.push({
      id: 'placement_reviews',
      label: `${n} placement ${n !== 1 ? 'reviews' : 'review'} awaiting decision`,
      detail: null,
      urgency: 'high',
      actionLabel: 'Review Queue',
      actionHref: '/director/review',
    })
  }

  if (input.lessonRequests > 0) {
    const n = input.lessonRequests
    items.push({
      id: 'lesson_requests',
      label: `${n} private lesson ${n !== 1 ? 'requests' : 'request'} need review`,
      detail: null,
      urgency: 'medium',
      actionLabel: 'View Requests',
      actionHref: '/director/review',
    })
  }

  const hasUrgent = items.some(i => i.urgency === 'critical' || i.urgency === 'high')
  return {
    id: 'decisions_waiting',
    title: 'Decisions Waiting',
    items,
    status: items.length === 0 ? 'clear' : hasUrgent ? 'urgent' : 'attention',
    clearMessage: 'Review queue is clear — no pending decisions.',
  }
}

function buildParentCoachFollowUpSection(input: COOAggregatorInput): COOBriefSection {
  const items: COOBriefItem[] = []

  if (input.parentUpdatesWaiting > 0) {
    const n = input.parentUpdatesWaiting
    items.push({
      id: 'parent_updates',
      label: `${n} parent update${n !== 1 ? 's' : ''} awaiting your approval before sending`,
      detail: 'Parent communications require director sign-off',
      urgency: 'medium',
      actionLabel: 'Review Queue',
      actionHref: '/director/review',
    })
  }

  if (input.coachRecapsMissing > 0) {
    const n = input.coachRecapsMissing
    items.push({
      id: 'coach_recaps_missing',
      label: `${n} completed ${n !== 1 ? 'sessions are' : 'session is'} missing a coach recap`,
      detail: 'Missing recaps leave player progress data incomplete',
      urgency: n >= 3 ? 'high' : 'medium',
      actionLabel: 'View Sessions',
      actionHref: '/director/sessions',
    })
  }

  const hasUrgent = items.some(i => i.urgency === 'critical' || i.urgency === 'high')
  return {
    id: 'parent_coach_follow_up',
    title: 'Parent & Coach Follow-up',
    items,
    status: items.length === 0 ? 'clear' : hasUrgent ? 'urgent' : 'attention',
    clearMessage: 'No parent updates or coach follow-ups pending.',
  }
}

function buildSetupCurriculumSection(input: COOAggregatorInput): COOBriefSection {
  const items: COOBriefItem[] = []

  if (input.classTemplateCount === 0) {
    items.push({
      id: 'no_class_templates',
      label: 'No class templates created yet — coaches have no session structure to follow',
      detail: null,
      urgency: 'high',
      actionLabel: 'Create Template',
      actionHref: '/director/templates',
    })
  }

  if (input.playersWithoutLevel > 0) {
    const n = input.playersWithoutLevel
    items.push({
      id: 'players_without_level',
      label: `${n} active ${n !== 1 ? 'players have' : 'player has'} no curriculum level assigned`,
      detail: null,
      urgency: 'medium',
      actionLabel: 'View Players',
      actionHref: '/director/players',
    })
  }

  if (input.curriculumGapCount > 0) {
    const n = input.curriculumGapCount
    items.push({
      id: 'curriculum_gaps',
      label: `${n} curriculum ${n !== 1 ? 'gaps were' : 'gap was'} identified in player development paths`,
      detail: null,
      urgency: 'medium',
      actionLabel: 'View Curriculum',
      actionHref: '/director/curriculum',
    })
  }

  if (input.curriculumTemplateCoverageGapCount > 0) {
    const n = input.curriculumTemplateCoverageGapCount
    items.push({
      id: 'template_coverage_gap',
      label: `${n} active curriculum ${n !== 1 ? 'levels have' : 'level has'} no class template`,
      detail: 'Players at this level have no session structure available',
      urgency: 'medium',
      actionLabel: 'View Curriculum',
      actionHref: '/director/curriculum',
    })
  }

  const hasUrgent = items.some(i => i.urgency === 'critical' || i.urgency === 'high')
  return {
    id: 'setup_curriculum',
    title: 'Setup & Curriculum',
    items,
    status: items.length === 0 ? 'clear' : hasUrgent ? 'urgent' : 'attention',
    clearMessage: 'Academy setup and curriculum are complete.',
  }
}

// ── Overall status + opening statement ────────────────────────────────────────

function deriveOverallStatus(
  sections: COODailyBrief['sections'],
  activePlayers: number,
): COODailyBrief['overallStatus'] {
  const allItems = [
    ...sections.todayPriority.items,
    ...sections.watchList.items,
    ...sections.decisionsWaiting.items,
    ...sections.parentCoachFollowUp.items,
    ...sections.setupCurriculum.items,
  ]

  if (activePlayers === 0 && allItems.length === 0) return 'no_data'
  if (allItems.some(i => i.urgency === 'critical')) return 'critical'
  if (allItems.length > 0) return 'attention'
  return 'on_track'
}

function buildOpeningStatement(
  status: COODailyBrief['overallStatus'],
  totalItems: number,
): string {
  if (status === 'no_data') {
    return "Add your first players and templates to activate your academy brief."
  }
  if (status === 'critical') {
    return `Your academy has ${totalItems} item${totalItems !== 1 ? 's' : ''} that need immediate attention. Start with the critical items below.`
  }
  if (status === 'attention') {
    return `${totalItems} ${totalItems === 1 ? 'item needs' : 'items need'} your attention today. Here's what I've prepared.`
  }
  return "Academy is on track. No urgent items today — here's the full picture."
}

// ── Missing data notes ─────────────────────────────────────────────────────────

function buildMissingDataNotes(input: COOAggregatorInput): string[] {
  const notes: string[] = []

  if (!input.sessionsExist) {
    notes.push('No session history yet — session and recap signals will appear once sessions are scheduled.')
  }
  if (input.activePlayers === 0) {
    notes.push('No active players — player development signals will appear once players are added and placed.')
  }

  return notes
}

// ── Top 3 actions ──────────────────────────────────────────────────────────────

function deriveTop3Actions(sections: COODailyBrief['sections']): COOBriefItem[] {
  const allItems = [
    ...sections.todayPriority.items,
    ...sections.decisionsWaiting.items,
    ...sections.watchList.items,
    ...sections.parentCoachFollowUp.items,
    ...sections.setupCurriculum.items,
  ]

  // De-duplicate by actionHref (prefer highest urgency per route)
  const byHref = new Map<string, COOBriefItem>()
  for (const item of allItems) {
    const existing = byHref.get(item.actionHref)
    if (!existing || URGENCY_RANK[item.urgency] > URGENCY_RANK[existing.urgency]) {
      byHref.set(item.actionHref, item)
    }
  }

  return Array.from(byHref.values())
    .sort((a, b) => URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency])
    .slice(0, 3)
}

// ── Main export ────────────────────────────────────────────────────────────────

export function buildCOODailyBrief(input: COOAggregatorInput): COODailyBrief {
  const todayPriority      = buildTodayPrioritySection(input)
  const watchList          = buildWatchListSection(input)
  const decisionsWaiting   = buildDecisionsWaitingSection(input)
  const parentCoachFollowUp = buildParentCoachFollowUpSection(input)
  const setupCurriculum    = buildSetupCurriculumSection(input)

  const sections: COODailyBrief['sections'] = {
    todayPriority,
    watchList,
    decisionsWaiting,
    parentCoachFollowUp,
    setupCurriculum,
  }

  const allItems = [
    ...todayPriority.items,
    ...watchList.items,
    ...decisionsWaiting.items,
    ...parentCoachFollowUp.items,
    ...setupCurriculum.items,
  ]
  const totalAttentionItems = allItems.length
  const hasUrgentItems      = allItems.some(i => i.urgency === 'critical' || i.urgency === 'high')
  const overallStatus       = deriveOverallStatus(sections, input.activePlayers)
  const openingStatement    = buildOpeningStatement(overallStatus, totalAttentionItems)
  const top3Actions         = deriveTop3Actions(sections)
  const missingDataNotes    = buildMissingDataNotes(input)

  return {
    generatedAt: new Date().toISOString(),
    overallStatus,
    openingStatement,
    sections,
    top3Actions,
    missingDataNotes,
    hasUrgentItems,
    totalAttentionItems,
  }
}
