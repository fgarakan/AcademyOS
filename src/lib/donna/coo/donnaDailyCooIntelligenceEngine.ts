// Mega Sprint 1325–1354 — DONNA Daily COO Intelligence V1
//
// Pure TypeScript. No DB. No side effects.
// Takes signals already computed in director/page.tsx (no additional queries).
// Produces structured daily intelligence with evidence, confidence, and prioritization.
//
// Answers 8 canonical COO questions:
//   D1 "What do I need to do today?"
//   D2 "How is everything looking?"
//   D3 "Who needs attention?"
//   D4 "What is urgent?"
//   D5 "What can wait?"
//   D6 "What is blocked?"
//   D7 "What needs approval?"
//   D8 "What would you do if you were me?"
//
// Design rules:
//   - Never invents data; missing info is disclosed explicitly
//   - Prioritization: urgent = today risk, important = this-week, can_wait = low urgency
//   - Academy health delegates to AcademyHealthReport (already computed in page.tsx)

import type { AcademyHealthReport } from '@/lib/donna/intelligence/academyHealthBrief'
import type { PlayerProgressStall } from '@/lib/donna/playerProgressStallDetector'

// ── Enumerations ──────────────────────────────────────────────────────────────

export type IntelligencePriority = 'urgent' | 'important' | 'can_wait'
export type IntelligenceUrgency  = 'critical' | 'high' | 'medium' | 'low'
export type IntelligenceConfidence = 'high' | 'medium' | 'low'

export type COOIntelligenceCategory =
  | 'today_priorities'
  | 'players_needing_attention'
  | 'coaches_needing_attention'
  | 'parent_followups'
  | 'curriculum_review'
  | 'setup_onboarding'
  | 'recommended_next_action'

// ── Item type ─────────────────────────────────────────────────────────────────

export interface COOIntelligenceItem {
  id: string
  category: COOIntelligenceCategory
  title: string
  /** One-sentence factual summary: what is happening */
  summary: string
  /** One-sentence causal explanation: why this matters right now */
  why: string
  evidence: string[]
  confidence: IntelligenceConfidence
  urgency: IntelligenceUrgency
  priority: IntelligencePriority
  recommendedAction: string
  route: string | null
}

// ── Output type ───────────────────────────────────────────────────────────────

export interface DailyCOOIntelligence {
  generatedAt: string
  urgentItems: COOIntelligenceItem[]
  importantItems: COOIntelligenceItem[]
  canWaitItems: COOIntelligenceItem[]
  allItems: COOIntelligenceItem[]
  /** Passed through from page.tsx — already computed, not re-derived here */
  academyHealthReport: AcademyHealthReport
  /** Pre-built text answers for DONNA conversational Q&A */
  answers: {
    todayPriorities: string
    academyHealth: string
    playersNeedingAttention: string
    coachesNeedingAttention: string
    parentFollowups: string
    curriculumReview: string
    setupOnboarding: string
    recommendedNextAction: string
  }
  overallStatus: 'critical' | 'attention' | 'on_track' | 'no_data'
  dataGaps: string[]
}

// ── Input type ────────────────────────────────────────────────────────────────

export interface DailyCOOIntelligenceInput {
  // Players
  activePlayers: number
  attentionCount: number          // on_hold or reassessment_due
  advancementReadyCount: number
  stalledPlayerCount: number
  playerProgressStalls: PlayerProgressStall[]
  pendingPlacementCount: number
  reassessmentDueCount: number
  playersWithoutLevel: number
  // Reviews / decisions
  pendingWrapUpsCount: number
  assessmentsNeedingReview: number
  activePlacementReviews: number
  parentUpdatesPendingApproval: number
  lessonRequests: number
  oldestPendingReviewAgeDays: number | null
  // Coaches / sessions
  coachRecapsMissing: number
  coachCoverageGaps: number
  sessionsThisWeek: number
  todaySessionCount: number
  sessionsExist: boolean
  // Groups
  overCapacityGroupCount: number
  // Curriculum / setup
  curricGapCount: number
  curriculumTemplateCoverageGapCount: number
  classTemplateCount: number
  // Onboarding readiness
  onboardingReadinessLevel: 'not_started' | 'partial' | 'nearly_ready' | 'ready_signal' | 'unknown'
  // Academy health (already computed in page.tsx — no re-derivation)
  academyHealthReport: AcademyHealthReport
}

// ── Prioritization rules ──────────────────────────────────────────────────────
//
// Urgent:    Requires action today; escalation or external consequence if delayed.
//            Criteria: review queue critical (oldest ≥ 7 days OR ≥ 5 items), coach
//            coverage gap for today, academy not started, ≥ 3 players on hold.
//
// Important: Should be addressed this week; not time-critical but health-critical.
//            Criteria: pending reviews (< 7 days, < 5 items), advancement ready,
//            stalled players, reassessment due, pending placement, recaps missing.
//
// Can Wait:  Beneficial but low urgency. Curriculum gaps, minor setup items.

function classifyPriority(urgency: IntelligenceUrgency): IntelligencePriority {
  if (urgency === 'critical') return 'urgent'
  if (urgency === 'high')     return 'urgent'
  if (urgency === 'medium')   return 'important'
  return 'can_wait'
}

// ── Category builders ─────────────────────────────────────────────────────────

function buildTodayPriorityItems(input: DailyCOOIntelligenceInput): COOIntelligenceItem[] {
  const items: COOIntelligenceItem[] = []
  const totalReviews = input.pendingWrapUpsCount + input.assessmentsNeedingReview + input.activePlacementReviews
  const ageIsOld     = input.oldestPendingReviewAgeDays !== null && input.oldestPendingReviewAgeDays >= 7
  const queueIsLarge = totalReviews >= 5

  if (totalReviews > 0) {
    const urgency: IntelligenceUrgency = (ageIsOld || queueIsLarge) ? 'critical' : 'high'
    const ageNote = input.oldestPendingReviewAgeDays !== null && input.oldestPendingReviewAgeDays > 1
      ? ` The oldest item has been waiting ${input.oldestPendingReviewAgeDays} days.`
      : ''
    items.push({
      id:              'review_queue',
      category:        'today_priorities',
      title:           `${totalReviews} item${totalReviews !== 1 ? 's' : ''} in the review queue`,
      summary:         `${totalReviews} proposed action${totalReviews !== 1 ? 's' : ''} are waiting for your approval.`,
      why:             `Coaches and staff are waiting on decisions.${ageNote} Queue buildup reduces program responsiveness.`,
      evidence:        [
        `${input.pendingWrapUpsCount} coach wrap-up${input.pendingWrapUpsCount !== 1 ? 's' : ''} pending`,
        `${input.assessmentsNeedingReview} assessment${input.assessmentsNeedingReview !== 1 ? 's' : ''} in review`,
        `${input.activePlacementReviews} placement ${input.activePlacementReviews !== 1 ? 'reviews' : 'review'}`,
        ...(input.oldestPendingReviewAgeDays !== null ? [`Oldest: ${input.oldestPendingReviewAgeDays} days in queue`] : []),
      ].filter(e => !e.startsWith('0 ')),
      confidence:      'high',
      urgency,
      priority:        classifyPriority(urgency),
      recommendedAction: 'Open the review queue and start with the oldest urgent items.',
      route:           '/director/review',
    })
  }

  if (input.attentionCount >= 3) {
    items.push({
      id:              'players_on_hold',
      category:        'today_priorities',
      title:           `${input.attentionCount} players on hold or overdue for reassessment`,
      summary:         `${input.attentionCount} enrolled players are blocked from normal program participation.`,
      why:             'Players on hold cannot be placed or advanced until you review their status. The longer they wait, the higher the dropout risk.',
      evidence:        [
        `${input.attentionCount} player${input.attentionCount !== 1 ? 's' : ''} with on_hold or reassessment_due status`,
      ],
      confidence:      'high',
      urgency:         'critical',
      priority:        'urgent',
      recommendedAction: 'Review each player on hold. Determine whether to clear, reassess, or escalate.',
      route:           '/director/players',
    })
  } else if (input.attentionCount > 0) {
    items.push({
      id:              'players_on_hold',
      category:        'today_priorities',
      title:           `${input.attentionCount} player${input.attentionCount !== 1 ? 's' : ''} need your attention`,
      summary:         `${input.attentionCount} player${input.attentionCount !== 1 ? 's' : ''} on hold or overdue for reassessment.`,
      why:             'Players on hold are waiting on a director decision before returning to normal program participation.',
      evidence:        [`${input.attentionCount} player${input.attentionCount !== 1 ? 's' : ''} with on_hold or reassessment_due status`],
      confidence:      'high',
      urgency:         'high',
      priority:        'urgent',
      recommendedAction: 'Review each flagged player and clear or escalate.',
      route:           '/director/players',
    })
  }

  if (input.coachCoverageGaps > 0) {
    items.push({
      id:              'coach_coverage_today',
      category:        'today_priorities',
      title:           `${input.coachCoverageGaps} session${input.coachCoverageGaps !== 1 ? 's' : ''} today without a coach`,
      summary:         `${input.coachCoverageGaps} scheduled session${input.coachCoverageGaps !== 1 ? 's have' : ' has'} no coach assigned for today.`,
      why:             'Sessions without a coach cannot run safely. This must be resolved before the sessions start.',
      evidence:        [`${input.coachCoverageGaps} session${input.coachCoverageGaps !== 1 ? 's' : ''} today with no coach assignment`],
      confidence:      'high',
      urgency:         'critical',
      priority:        'urgent',
      recommendedAction: 'Assign coaches to unassigned sessions immediately or cancel if no cover is available.',
      route:           '/director/sessions',
    })
  }

  if (input.lessonRequests > 0) {
    items.push({
      id:              'lesson_requests',
      category:        'today_priorities',
      title:           `${input.lessonRequests} private lesson request${input.lessonRequests !== 1 ? 's' : ''} waiting`,
      summary:         `${input.lessonRequests} new lesson request${input.lessonRequests !== 1 ? 's have' : ' has'} not yet been reviewed.`,
      why:             'Unanswered requests signal slow responsiveness to families. Review them today.',
      evidence:        [`${input.lessonRequests} lesson request${input.lessonRequests !== 1 ? 's' : ''} in new status`],
      confidence:      'high',
      urgency:         'medium',
      priority:        'important',
      recommendedAction: 'Open the review queue and process lesson requests.',
      route:           '/director/review',
    })
  }

  return items
}

function buildPlayerAttentionItems(input: DailyCOOIntelligenceInput): COOIntelligenceItem[] {
  const items: COOIntelligenceItem[] = []

  if (input.advancementReadyCount > 0) {
    items.push({
      id:              'advancement_ready',
      category:        'players_needing_attention',
      title:           `${input.advancementReadyCount} player${input.advancementReadyCount !== 1 ? 's' : ''} ready to advance`,
      summary:         `${input.advancementReadyCount} player${input.advancementReadyCount !== 1 ? 's' : ''} meet all gate criteria and are waiting for your approval.`,
      why:             'Level changes require director approval and are never automatic. Delays reduce player motivation and block group placement.',
      evidence:        [`${input.advancementReadyCount} player${input.advancementReadyCount !== 1 ? 's' : ''} flagged as advancement-eligible in curriculum records`],
      confidence:      'high',
      urgency:         'high',
      priority:        'urgent',
      recommendedAction: 'Review advancement candidates and approve or defer each one.',
      route:           '/director/players',
    })
  }

  const highStalls = input.playerProgressStalls.filter(s => s.stallSeverity === 'high')
  if (input.stalledPlayerCount > 0) {
    const urgency: IntelligenceUrgency = highStalls.length >= 2 ? 'high' : 'medium'
    items.push({
      id:              'stalled_players',
      category:        'players_needing_attention',
      title:           `${input.stalledPlayerCount} stalled player${input.stalledPlayerCount !== 1 ? 's' : ''}`,
      summary:         `${input.stalledPlayerCount} player${input.stalledPlayerCount !== 1 ? 's have' : ' has'} been at the same level for 180+ days without advancing.`,
      why:             `Long-term stalls indicate a curriculum fit issue, attendance problem, or engagement gap${highStalls.length > 0 ? ` — ${highStalls.length} are high-severity (270+ days)` : ''}.`,
      evidence:        [
        `${input.stalledPlayerCount} player${input.stalledPlayerCount !== 1 ? 's' : ''} enrolled 180+ days without level change`,
        ...(highStalls.length > 0 ? [`${highStalls.length} high-severity stall${highStalls.length !== 1 ? 's' : ''} (270+ days)`] : []),
        ...input.playerProgressStalls.slice(0, 3).map(s => `${s.playerName} — ${s.daysAtCurrentLevel} days at ${s.currentLevelDisplayName ?? 'current level'}`),
      ],
      confidence:      highStalls.length > 0 ? 'high' : 'medium',
      urgency,
      priority:        classifyPriority(urgency),
      recommendedAction: 'Review each stalled player with their coach. Determine if the block is curriculum fit, attendance, or engagement — the fix differs.',
      route:           '/director/players',
    })
  }

  if (input.reassessmentDueCount > 0) {
    items.push({
      id:              'reassessment_due',
      category:        'players_needing_attention',
      title:           `${input.reassessmentDueCount} player${input.reassessmentDueCount !== 1 ? 's' : ''} overdue for reassessment`,
      summary:         `${input.reassessmentDueCount} player${input.reassessmentDueCount !== 1 ? 's have' : ' has'} not been assessed recently.`,
      why:             'Without recent assessment evidence, advancement and placement decisions are based on incomplete data.',
      evidence:        [`${input.reassessmentDueCount} player${input.reassessmentDueCount !== 1 ? 's' : ''} with reassessment_due status`],
      confidence:      'high',
      urgency:         'medium',
      priority:        'important',
      recommendedAction: 'Schedule assessment sessions for overdue players.',
      route:           '/director/players',
    })
  }

  if (input.pendingPlacementCount > 0) {
    items.push({
      id:              'pending_placement',
      category:        'players_needing_attention',
      title:           `${input.pendingPlacementCount} player${input.pendingPlacementCount !== 1 ? 's' : ''} awaiting placement`,
      summary:         `${input.pendingPlacementCount} new player${input.pendingPlacementCount !== 1 ? 's are' : ' is'} enrolled but not yet placed in a curriculum level or group.`,
      why:             'Players cannot join a training group until placed. Every day of delay delays their first real session.',
      evidence:        [`${input.pendingPlacementCount} player${input.pendingPlacementCount !== 1 ? 's' : ''} in pending_placement or placement_in_progress status`],
      confidence:      'high',
      urgency:         'medium',
      priority:        'important',
      recommendedAction: 'Complete placement for each pending player via the placement workflow.',
      route:           '/director/players',
    })
  }

  return items
}

function buildCoachAttentionItems(input: DailyCOOIntelligenceInput): COOIntelligenceItem[] {
  const items: COOIntelligenceItem[] = []

  if (input.coachRecapsMissing > 0) {
    const urgency: IntelligenceUrgency = input.coachRecapsMissing >= 5 ? 'high' : 'medium'
    items.push({
      id:              'missing_recaps',
      category:        'coaches_needing_attention',
      title:           `${input.coachRecapsMissing} session${input.coachRecapsMissing !== 1 ? 's' : ''} missing a coach recap`,
      summary:         `${input.coachRecapsMissing} completed session${input.coachRecapsMissing !== 1 ? 's have' : ' has'} no coach wrap-up or voice note.`,
      why:             'Without recaps, DONNA cannot generate accurate player attendance or development signals. Missing notes create blind spots.',
      evidence:        [`${input.coachRecapsMissing} completed session${input.coachRecapsMissing !== 1 ? 's' : ''} without a wrap-up or voice note (last 30 days)`],
      confidence:      'high',
      urgency,
      priority:        classifyPriority(urgency),
      recommendedAction: 'Ask coaches to complete missing recaps. DONNA is less accurate without them.',
      route:           '/director/sessions',
    })
  }

  if (input.coachCoverageGaps === 0 && input.coachRecapsMissing === 0) {
    items.push({
      id:              'coaches_all_clear',
      category:        'coaches_needing_attention',
      title:           'No coach issues detected',
      summary:         'All sessions have coach assignments and wrap-ups are current.',
      why:             'Coach execution signals are healthy — no action needed.',
      evidence:        [
        `${input.todaySessionCount} session${input.todaySessionCount !== 1 ? 's' : ''} today — all have coach assignments`,
        '0 missing recaps in the last 30 days',
      ],
      confidence:      input.sessionsExist ? 'high' : 'medium',
      urgency:         'low',
      priority:        'can_wait',
      recommendedAction: 'Continue monitoring. Ensure coaches keep submitting wrap-ups.',
      route:           null,
    })
  }

  return items
}

function buildParentFollowupItems(input: DailyCOOIntelligenceInput): COOIntelligenceItem[] {
  const items: COOIntelligenceItem[] = []

  if (input.parentUpdatesPendingApproval > 0) {
    items.push({
      id:              'parent_updates_pending',
      category:        'parent_followups',
      title:           `${input.parentUpdatesPendingApproval} parent communication${input.parentUpdatesPendingApproval !== 1 ? 's' : ''} waiting for approval`,
      summary:         `${input.parentUpdatesPendingApproval} parent-related proposed action${input.parentUpdatesPendingApproval !== 1 ? 's' : ''} are in the review queue.`,
      why:             'Parent communications require director approval before sending. Delays signal to families that the academy is not responsive.',
      evidence:        [`${input.parentUpdatesPendingApproval} parent action${input.parentUpdatesPendingApproval !== 1 ? 's' : ''} with pending_review status`],
      confidence:      'high',
      urgency:         'medium',
      priority:        'important',
      recommendedAction: 'Review and approve or reject pending parent communications in the review queue.',
      route:           '/director/review',
    })
  }

  if (input.attentionCount > 0) {
    items.push({
      id:              'parent_outreach_signal',
      category:        'parent_followups',
      title:           `${input.attentionCount} player${input.attentionCount !== 1 ? 's' : ''} whose families may need an update`,
      summary:         `Players on hold or flagged for reassessment are the highest-priority candidates for parent outreach.`,
      why:             'Families with players in uncertain status often do not know what is happening unless the director reaches out proactively.',
      evidence:        [`${input.attentionCount} player${input.attentionCount !== 1 ? 's' : ''} with attention flags — parent notification may be appropriate`],
      confidence:      'medium',
      urgency:         'low',
      priority:        'can_wait',
      recommendedAction: 'Draft parent updates for flagged players via DONNA. All communications require director approval before sending.',
      route:           '/director/players',
    })
  }

  if (input.parentUpdatesPendingApproval === 0 && input.attentionCount === 0) {
    items.push({
      id:              'parent_all_clear',
      category:        'parent_followups',
      title:           'No parent communication signals',
      summary:         'No parent updates are pending and no high-risk flags require outreach.',
      why:             'Parent communication health is clear — no action needed today.',
      evidence:        ['0 parent updates pending approval', '0 player attention flags'],
      confidence:      'medium',
      urgency:         'low',
      priority:        'can_wait',
      recommendedAction: 'Consider drafting proactive parent updates even when no flags exist.',
      route:           null,
    })
  }

  return items
}

function buildCurriculumItems(input: DailyCOOIntelligenceInput): COOIntelligenceItem[] {
  const items: COOIntelligenceItem[] = []

  if (input.curriculumTemplateCoverageGapCount > 0) {
    items.push({
      id:              'template_coverage_gap',
      category:        'curriculum_review',
      title:           `${input.curriculumTemplateCoverageGapCount} curriculum level${input.curriculumTemplateCoverageGapCount !== 1 ? 's' : ''} without a class template`,
      summary:         `${input.curriculumTemplateCoverageGapCount} active curriculum level${input.curriculumTemplateCoverageGapCount !== 1 ? 's have' : ' has'} players enrolled but no class template assigned.`,
      why:             'Without a template, coaches have no structured session plan to follow for those players. Session quality suffers.',
      evidence:        [`${input.curriculumTemplateCoverageGapCount} level${input.curriculumTemplateCoverageGapCount !== 1 ? 's' : ''} with enrolled players but no template`],
      confidence:      'high',
      urgency:         'medium',
      priority:        'important',
      recommendedAction: 'Create class templates for the affected levels in the Templates section.',
      route:           '/director/templates',
    })
  }

  if (input.playersWithoutLevel > 0) {
    items.push({
      id:              'players_without_level',
      category:        'curriculum_review',
      title:           `${input.playersWithoutLevel} active player${input.playersWithoutLevel !== 1 ? 's' : ''} without a curriculum level`,
      summary:         `${input.playersWithoutLevel} active player${input.playersWithoutLevel !== 1 ? 's have' : ' has'} no curriculum level assigned.`,
      why:             'Players without a level cannot be placed in a group or tracked for progression.',
      evidence:        [`${input.playersWithoutLevel} active player${input.playersWithoutLevel !== 1 ? 's' : ''} in curriculum records with no level_id`],
      confidence:      'high',
      urgency:         'medium',
      priority:        'important',
      recommendedAction: 'Assign a curriculum level to each unplaced active player.',
      route:           '/director/players',
    })
  }

  if (input.curricGapCount > 0) {
    items.push({
      id:              'curriculum_gap_suggestions',
      category:        'curriculum_review',
      title:           `${input.curricGapCount} curriculum gap${input.curricGapCount !== 1 ? 's' : ''} identified`,
      summary:         `${input.curricGapCount} curriculum suggestion${input.curricGapCount !== 1 ? 's are' : ' is'} pending review.`,
      why:             'Curriculum gaps identified by DONNA represent development path weaknesses — addressing them improves player progression rates.',
      evidence:        [`${input.curricGapCount} pending suggestion${input.curricGapCount !== 1 ? 's' : ''} of type curriculum_gap`],
      confidence:      'medium',
      urgency:         'low',
      priority:        'can_wait',
      recommendedAction: 'Review curriculum gap suggestions in the Curriculum section.',
      route:           '/director/curriculum',
    })
  }

  if (input.overCapacityGroupCount > 0) {
    items.push({
      id:              'over_capacity_groups',
      category:        'curriculum_review',
      title:           `${input.overCapacityGroupCount} group${input.overCapacityGroupCount !== 1 ? 's' : ''} over capacity`,
      summary:         `${input.overCapacityGroupCount} training group${input.overCapacityGroupCount !== 1 ? 's have' : ' has'} more players than the maximum limit.`,
      why:             'Over-capacity groups reduce coaching quality and player experience. Left unchecked, they increase dropout risk.',
      evidence:        [`${input.overCapacityGroupCount} group${input.overCapacityGroupCount !== 1 ? 's' : ''} exceeding max_players limit`],
      confidence:      'high',
      urgency:         'high',
      priority:        'urgent',
      recommendedAction: 'Create a new group or increase the capacity limit. Do not leave groups over capacity.',
      route:           '/director',
    })
  }

  return items
}

function buildSetupItems(input: DailyCOOIntelligenceInput): COOIntelligenceItem[] {
  const items: COOIntelligenceItem[] = []

  if (input.onboardingReadinessLevel === 'not_started') {
    items.push({
      id:              'academy_not_started',
      category:        'setup_onboarding',
      title:           'Academy setup not started',
      summary:         'No players, templates, or sessions exist yet.',
      why:             'The academy cannot operate until the basic setup is complete — players, class templates, and at least one session are required.',
      evidence:        ['0 active players', '0 class templates', '0 sessions'],
      confidence:      'high',
      urgency:         'critical',
      priority:        'urgent',
      recommendedAction: 'Start with DONNA Setup to configure your academy — ask DONNA "walk me through academy setup".',
      route:           '/director/setup',
    })
  } else if (input.onboardingReadinessLevel === 'partial') {
    items.push({
      id:              'academy_partial_setup',
      category:        'setup_onboarding',
      title:           'Academy setup incomplete',
      summary:         `Players or class templates are still missing.`,
      why:             'An academy without both players and templates cannot run structured sessions.',
      evidence:        [
        `${input.activePlayers} active player${input.activePlayers !== 1 ? 's' : ''}`,
        `${input.classTemplateCount} class template${input.classTemplateCount !== 1 ? 's' : ''}`,
      ],
      confidence:      'high',
      urgency:         'high',
      priority:        'urgent',
      recommendedAction: input.activePlayers === 0
        ? 'Add your first players via the Players section.'
        : 'Create at least one class template in the Templates section.',
      route:           input.activePlayers === 0 ? '/director/players' : '/director/templates',
    })
  } else if (input.onboardingReadinessLevel === 'nearly_ready') {
    items.push({
      id:              'no_sessions_yet',
      category:        'setup_onboarding',
      title:           'No sessions scheduled yet',
      summary:         'Players and templates are ready but no sessions have been created.',
      why:             'The academy needs at least one session before DONNA can provide attendance, recap, or session intelligence.',
      evidence:        [
        `${input.activePlayers} active player${input.activePlayers !== 1 ? 's' : ''}`,
        `${input.classTemplateCount} class template${input.classTemplateCount !== 1 ? 's' : ''}`,
        '0 sessions scheduled',
      ],
      confidence:      'high',
      urgency:         'medium',
      priority:        'important',
      recommendedAction: 'Create your first session in the Sessions section.',
      route:           '/director/sessions',
    })
  }

  return items
}

// ── Synthesis ─────────────────────────────────────────────────────────────────

function buildRecommendedNextAction(
  allItems: COOIntelligenceItem[],
  input: DailyCOOIntelligenceInput,
): COOIntelligenceItem {
  const urgentItems    = allItems.filter(i => i.priority === 'urgent' && i.id !== 'coaches_all_clear' && i.id !== 'parent_all_clear')
  const importantItems = allItems.filter(i => i.priority === 'important')

  const top = urgentItems[0] ?? importantItems[0]

  if (!top) {
    return {
      id:              'all_clear',
      category:        'recommended_next_action',
      title:           'Academy appears operationally stable',
      summary:         'No urgent items flagged across all categories.',
      why:             'All monitored signals are at low urgency. Use this time proactively.',
      evidence:        [
        `${input.activePlayers} active player${input.activePlayers !== 1 ? 's' : ''}`,
        `${input.sessionsThisWeek} session${input.sessionsThisWeek !== 1 ? 's' : ''} this week`,
        '0 urgent flags across all categories',
      ],
      confidence:      input.sessionsExist ? 'high' : 'medium',
      urgency:         'low',
      priority:        'can_wait',
      recommendedAction: 'Review curriculum progress or schedule a coach check-in. Consider drafting proactive parent updates.',
      route:           null,
    }
  }

  const actionSummary = urgentItems.length > 0
    ? `Start with: ${top.recommendedAction} (${urgentItems.length} urgent item${urgentItems.length !== 1 ? 's' : ''} total).`
    : `Start with: ${top.recommendedAction} (${importantItems.length} important item${importantItems.length !== 1 ? 's' : ''} — no urgent flags).`

  return {
    id:              'recommended_action',
    category:        'recommended_next_action',
    title:           `Recommended: ${top.title}`,
    summary:         actionSummary,
    why:             top.why,
    evidence:        top.evidence,
    confidence:      top.confidence,
    urgency:         top.urgency,
    priority:        top.priority,
    recommendedAction: top.recommendedAction,
    route:           top.route,
  }
}

// ── Canonical question answers ────────────────────────────────────────────────

function buildTodayPrioritiesAnswer(items: COOIntelligenceItem[]): string {
  const todayItems = items.filter(i => i.category === 'today_priorities')
  const urgent     = todayItems.filter(i => i.priority === 'urgent')
  const important  = todayItems.filter(i => i.priority === 'important')

  if (todayItems.length === 0) {
    return 'No urgent items today. Review queue is clear and no players are flagged. Use this time to check in with a coach or review curriculum progress.'
  }

  const lines: string[] = []
  if (urgent.length > 0) {
    lines.push(`**${urgent.length} urgent item${urgent.length !== 1 ? 's' : ''} today:**`)
    for (const item of urgent) {
      lines.push(`• ${item.title} — ${item.recommendedAction}`)
    }
  }
  if (important.length > 0) {
    lines.push(`\n**${important.length} important item${important.length !== 1 ? 's' : ''} for this week:**`)
    for (const item of important.slice(0, 3)) {
      lines.push(`• ${item.title}`)
    }
  }
  return lines.join('\n')
}

function buildAcademyHealthAnswer(report: AcademyHealthReport): string {
  const statusLabel: Record<string, string> = {
    good:         'Good — all clear',
    watch:        'Watch — a few areas to monitor',
    action_needed: 'Needs Attention — one or more areas require action',
    critical:     'Critical — urgent issues detected',
  }

  const lines: string[] = [
    `**Overall Status:** ${statusLabel[report.overallStatus] ?? report.overallStatus}`,
    '',
  ]

  for (const section of report.sections) {
    const dot = section.status === 'critical' ? '🔴' : section.status === 'action_needed' ? '🟠' : section.status === 'watch' ? '🟡' : '🟢'
    lines.push(`${dot} **${section.label}:** ${section.summary}`)
  }

  if (report.topRecommendation) {
    lines.push(`\n**Recommended next action:** ${report.topRecommendation}`)
  }
  if (report.limitations.length > 0) {
    lines.push(`\n*Note: ${report.limitations.join(' ')}*`)
  }
  return lines.join('\n')
}

function buildPlayersNeedingAttentionAnswer(items: COOIntelligenceItem[]): string {
  const playerItems = items.filter(i => i.category === 'players_needing_attention')
  if (playerItems.length === 0) return 'No players are currently flagged for attention.'

  const lines: string[] = []
  for (const item of playerItems) {
    lines.push(`• **${item.title}** — ${item.recommendedAction}`)
  }
  return lines.join('\n')
}

function buildCoachesAnswer(items: COOIntelligenceItem[]): string {
  const coachItems = items.filter(i => i.category === 'coaches_needing_attention')
  const issues     = coachItems.filter(i => i.id !== 'coaches_all_clear')
  if (issues.length === 0) return 'No coach issues detected today. All sessions are covered and recaps appear current.'

  return issues.map(i => `• **${i.title}** — ${i.recommendedAction}`).join('\n')
}

function buildParentFollowupsAnswer(items: COOIntelligenceItem[]): string {
  const parentItems = items.filter(i => i.category === 'parent_followups')
  const issues      = parentItems.filter(i => i.id !== 'parent_all_clear')
  if (issues.length === 0) return 'No parent communications are pending and no high-risk flags require outreach.'

  return issues.map(i => `• **${i.title}** — ${i.recommendedAction}`).join('\n')
}

function buildCurriculumAnswer(items: COOIntelligenceItem[]): string {
  const curricItems = items.filter(i => i.category === 'curriculum_review')
  if (curricItems.length === 0) return 'No curriculum issues identified. All levels have templates and all players have curriculum assignments.'

  return curricItems.map(i => `• **${i.title}** — ${i.recommendedAction}`).join('\n')
}

function buildSetupAnswer(items: COOIntelligenceItem[]): string {
  const setupItems = items.filter(i => i.category === 'setup_onboarding')
  if (setupItems.length === 0) return 'Academy setup is complete and operational.'

  return setupItems.map(i => `• **${i.title}** — ${i.recommendedAction}`).join('\n')
}

function buildRecommendedNextActionAnswer(synthesis: COOIntelligenceItem): string {
  return `**${synthesis.title}**\n\n${synthesis.summary}\n\n**Why:** ${synthesis.why}\n\n**Evidence:** ${synthesis.evidence.slice(0, 3).join('; ')}.`
}

// ── Overall status ────────────────────────────────────────────────────────────

function deriveOverallStatus(
  items: COOIntelligenceItem[],
  activePlayers: number,
): DailyCOOIntelligence['overallStatus'] {
  if (activePlayers === 0) return 'no_data'
  const hasCritical = items.some(i => i.urgency === 'critical' && i.id !== 'coaches_all_clear' && i.id !== 'parent_all_clear')
  const hasUrgent   = items.some(i => i.priority === 'urgent' && i.id !== 'coaches_all_clear' && i.id !== 'parent_all_clear')
  if (hasCritical) return 'critical'
  if (hasUrgent)   return 'attention'
  const hasImportant = items.some(i => i.priority === 'important')
  return hasImportant ? 'attention' : 'on_track'
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildDailyCOOIntelligence(input: DailyCOOIntelligenceInput): DailyCOOIntelligence {
  const todayItems    = buildTodayPriorityItems(input)
  const playerItems   = buildPlayerAttentionItems(input)
  const coachItems    = buildCoachAttentionItems(input)
  const parentItems   = buildParentFollowupItems(input)
  const curricItems   = buildCurriculumItems(input)
  const setupItems    = buildSetupItems(input)

  const workingItems  = [...todayItems, ...playerItems, ...coachItems, ...parentItems, ...curricItems, ...setupItems]
  const synthesis     = buildRecommendedNextAction(workingItems, input)

  const allItems      = [...workingItems, synthesis]
  const urgentItems   = allItems.filter(i => i.priority === 'urgent')
  const importantItems = allItems.filter(i => i.priority === 'important')
  const canWaitItems  = allItems.filter(i => i.priority === 'can_wait')

  const overallStatus = deriveOverallStatus(allItems, input.activePlayers)

  const dataGaps: string[] = []
  if (!input.sessionsExist) dataGaps.push('No session history yet — coach and attendance signals will appear once sessions are scheduled.')
  if (input.activePlayers === 0) dataGaps.push('No active players — player development signals will appear once players are added.')
  dataGaps.push('Per-coach session and observation data requires the extended COO context loader — use DONNA Q&A for deep coach analysis.')
  dataGaps.push('Per-parent communication history is not available in the current schema.')

  return {
    generatedAt:        new Date().toISOString(),
    urgentItems,
    importantItems,
    canWaitItems,
    allItems,
    academyHealthReport: input.academyHealthReport,
    answers: {
      todayPriorities:         buildTodayPrioritiesAnswer(allItems),
      academyHealth:           buildAcademyHealthAnswer(input.academyHealthReport),
      playersNeedingAttention: buildPlayersNeedingAttentionAnswer(allItems),
      coachesNeedingAttention: buildCoachesAnswer(allItems),
      parentFollowups:         buildParentFollowupsAnswer(allItems),
      curriculumReview:        buildCurriculumAnswer(allItems),
      setupOnboarding:         buildSetupAnswer(allItems),
      recommendedNextAction:   buildRecommendedNextActionAnswer(synthesis),
    },
    overallStatus,
    dataGaps,
  }
}
