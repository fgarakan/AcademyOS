// Wrap-Up Review Queue Mapper
// Maps a WrapUpFullDraft to the proposed_action input shapes that would be
// created in the director review queue.
// Pure mapping — no DB writes. Defines the routing contract for Sprint 478.

import type { WrapUpFullDraft } from '@/components/capture/WrapUpReviewSummary'

// ── Proposed action input shapes ──────────────────────────────────────────────

export type ReviewItemTargetModule =
  | 'attendance_exception'
  | 'session_wrap_up_v1'
  | 'coach_observation'
  | 'parent_update'
  | 'director_follow_up'
  | 'coach_follow_up'
  | 'player_support'
  | 'admin_note'

export interface ReviewItemSource {
  sourceType: 'coach_wrap_up_v2'
  sessionId: string
  submittedAt: string
  reviewRequired: true
  notOfficial: true
}

export interface ProposedActionInput {
  targetModule: ReviewItemTargetModule
  actionType: 'create_draft'
  payload: Record<string, unknown>
  source: ReviewItemSource
  status: 'pending_review'
  notOfficial: true
  executionApplied: false
}

// ── Mappers per section ───────────────────────────────────────────────────────

function buildSource(sessionId: string, submittedAt: string): ReviewItemSource {
  return {
    sourceType: 'coach_wrap_up_v2',
    sessionId,
    submittedAt,
    reviewRequired: true,
    notOfficial: true,
  }
}

// Map attendance → attendance_exception proposed actions
function mapAttendance(draft: WrapUpFullDraft, source: ReviewItemSource): ProposedActionInput[] {
  if (!draft.attendance) return []
  const items: ProposedActionInput[] = []

  for (const absence of draft.attendance.absences) {
    items.push({
      targetModule: 'attendance_exception',
      actionType: 'create_draft',
      payload: {
        exceptionType: 'absence',
        playerName: absence.name,
        sessionId: draft.sessionId,
        confirmed: absence.confirmed,
        freeText: draft.attendance.freeText,
      },
      source,
      status: 'pending_review',
      notOfficial: true,
      executionApplied: false,
    })
  }

  for (const unrostered of draft.attendance.unrostered) {
    items.push({
      targetModule: 'attendance_exception',
      actionType: 'create_draft',
      payload: {
        exceptionType: 'unrostered_attendee',
        playerName: unrostered.name,
        sessionId: draft.sessionId,
        freeText: draft.attendance.freeText,
      },
      source,
      status: 'pending_review',
      notOfficial: true,
      executionApplied: false,
    })
  }

  return items
}

// Map session actual → session_wrap_up_v1 proposed action
function mapSessionActual(draft: WrapUpFullDraft, source: ReviewItemSource): ProposedActionInput[] {
  if (!draft.sessionActual) return []
  return [
    {
      targetModule: 'session_wrap_up_v1',
      actionType: 'create_draft',
      payload: {
        sessionId: draft.sessionId,
        completedAsPlanned: draft.sessionActual.completedAsPlanned,
        modified: draft.sessionActual.modified,
        modifications: draft.sessionActual.modifications,
        notes: draft.sessionActual.notes,
      },
      source,
      status: 'pending_review',
      notOfficial: true,
      executionApplied: false,
    },
  ]
}

// Map observations → coach_observation proposed actions
function mapObservations(draft: WrapUpFullDraft, source: ReviewItemSource): ProposedActionInput[] {
  const all = [...draft.standouts, ...draft.needsAttention]
  return all.map(obs => ({
    targetModule: 'coach_observation' as ReviewItemTargetModule,
    actionType: 'create_draft' as const,
    payload: {
      playerName: obs.playerName,
      observation: obs.observation,
      observationType: obs.observationType,
      skillTag: obs.skillTag,
      nextStep: obs.nextStep,
      visibility: obs.visibility,
      isParentSafeCandidate: obs.isParentSafeCandidate,
      sessionId: draft.sessionId,
    },
    source,
    status: 'pending_review' as const,
    notOfficial: true as const,
    executionApplied: false as const,
  }))
}

// Map follow-ups → various proposed action modules
function mapFollowUps(draft: WrapUpFullDraft, source: ReviewItemSource): ProposedActionInput[] {
  if (!draft.followUps) return []

  const moduleMap: Record<string, ReviewItemTargetModule> = {
    parent_update: 'parent_update',
    director_follow_up: 'director_follow_up',
    coach_follow_up: 'coach_follow_up',
    player_support: 'player_support',
    admin_note: 'admin_note',
  }

  return draft.followUps.items.map(item => ({
    targetModule: moduleMap[item.type] ?? 'admin_note',
    actionType: 'create_draft' as const,
    payload: {
      type: item.type,
      description: item.description,
      playerName: item.playerName,
      urgency: item.urgency,
      sessionId: draft.sessionId,
    },
    source,
    status: 'pending_review' as const,
    notOfficial: true as const,
    executionApplied: false as const,
  }))
}

// ── Main mapper ───────────────────────────────────────────────────────────────

export interface WrapUpReviewQueueMapping {
  sessionId: string
  submittedAt: string
  source: ReviewItemSource
  items: ProposedActionInput[]
  itemsByModule: Record<ReviewItemTargetModule, ProposedActionInput[]>
  totalItems: number
  summary: string
}

export function mapWrapUpToReviewQueue(draft: WrapUpFullDraft): WrapUpReviewQueueMapping {
  const submittedAt = draft.completedAt ?? new Date().toISOString()
  const source = buildSource(draft.sessionId, submittedAt)

  const attendanceItems = mapAttendance(draft, source)
  const sessionActualItems = mapSessionActual(draft, source)
  const observationItems = mapObservations(draft, source)
  const followUpItems = mapFollowUps(draft, source)

  const allItems = [
    ...attendanceItems,
    ...sessionActualItems,
    ...observationItems,
    ...followUpItems,
  ]

  const itemsByModule = allItems.reduce<Record<ReviewItemTargetModule, ProposedActionInput[]>>((acc, item) => {
    if (!acc[item.targetModule]) {
      acc[item.targetModule] = []
    }
    acc[item.targetModule].push(item)
    return acc
  }, {} as Record<ReviewItemTargetModule, ProposedActionInput[]>)

  const parts: string[] = []
  if (attendanceItems.length > 0) parts.push(`${attendanceItems.length} attendance exception(s)`)
  if (sessionActualItems.length > 0) parts.push('session actual')
  if (observationItems.length > 0) parts.push(`${observationItems.length} observation(s)`)
  if (followUpItems.length > 0) parts.push(`${followUpItems.length} follow-up(s)`)

  const summary = parts.length > 0
    ? `Coach wrap-up: ${parts.join(', ')} — pending director review`
    : 'Coach wrap-up submitted — no specific items extracted'

  return {
    sessionId: draft.sessionId,
    submittedAt,
    source,
    items: allItems,
    itemsByModule,
    totalItems: allItems.length,
    summary,
  }
}

// ── Safety assertion ──────────────────────────────────────────────────────────
// All items in a WrapUpReviewQueueMapping are review-only.
// None are executed until a director explicitly approves and applies them.

export function assertAllItemsPendingReview(mapping: WrapUpReviewQueueMapping): void {
  const notPending = mapping.items.filter(item => item.status !== 'pending_review')
  if (notPending.length > 0) {
    throw new Error(
      `Review queue safety violation: ${notPending.length} item(s) are not pending_review. ` +
      'All wrap-up items must be pending_review before director approval.'
    )
  }
}
