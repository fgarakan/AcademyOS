// Deterministic suggestion generators — Sprint 178
// Pure functions — no DB calls, no AI API, no side effects.
// All generators return AcademySuggestionDraft[] from structured input data.

import type {
  AcademySuggestionDraft,
  AcademySuggestionPriority,
} from './suggestionTypes'

// ── Input types ───────────────────────────────────────────────────────────────

export interface PlayerSummaryInput {
  player_id: string | null
  full_name: string | null
  focus_areas: string[] | null
  overall_score: number | null
  player_status: string | null
  advancement_eligible?: boolean | null
}

export interface PrivateLessonRequestInput {
  id: string
  player_id: string | null
  status: string
  preferred_days: string | null
  preferred_times: string | null
  goal: string | null
  player_name?: string | null
}

export interface DevelopmentSummaryInput {
  player_id: string
  development_focus: string | null
  student_friendly_summary: string | null
  current_strengths: string[]
  things_to_work_on: string[]
  player_name?: string | null
}

export interface ReassessmentPipelineInput {
  player_id: string | null
  full_name: string | null
  urgency: string | null
}

// ── Generator 1: Players missing current focus ────────────────────────────────

export function buildPlayerFocusMissingSuggestions(
  players: PlayerSummaryInput[]
): AcademySuggestionDraft[] {
  return players
    .filter(p => p.player_id && p.player_status === 'active' && (!p.focus_areas || p.focus_areas.length === 0))
    .map(p => {
      const name = p.full_name ?? 'This player'
      return {
        suggestion_type: 'player_focus_update' as const,
        title: `Add current focus for ${name}`,
        summary: `${name} does not have a current development focus set. Adding one will align coaching and improve the Coach Snapshot at the next session.`,
        priority: 'medium' as AcademySuggestionPriority,
        confidence: 'high' as const,
        entity_type: 'player',
        entity_id: p.player_id,
        evidence: [
          {
            type: 'player_data',
            description: `${name} is an active player with no focus areas recorded.`,
          },
        ],
        impact_preview: {
          if_accepted: [
            'Director is routed to the player profile to set Current Focus',
            'Coach Snapshot becomes actionable at the next session',
            'Development Summary card shows a Working On section',
          ],
          next_step: `Open the player profile for ${name} and set Current Focus in the Notes tab.`,
        },
        proposed_changes: {
          player_id: p.player_id,
          field: 'development_focus',
          action: 'set_via_profile',
        },
        will_not_change: [
          'Player level is not changed',
          'No parent notification is sent',
          'No automatic profile update occurs — director sets the focus manually',
        ],
      }
    })
}

// ── Generator 2: Private lesson requests waiting ──────────────────────────────

export function buildPrivateLessonPendingSuggestions(
  requests: PrivateLessonRequestInput[]
): AcademySuggestionDraft[] {
  return requests
    .filter(r => r.id && r.status === 'new')
    .map(r => {
      const name = r.player_name ?? 'A player'
      const goalText = r.goal ? ` Goal: "${r.goal.slice(0, 80)}${r.goal.length > 80 ? '…' : ''}"` : ''
      return {
        suggestion_type: 'private_lesson_opportunity' as const,
        title: `Review private lesson request${r.player_name ? ` from ${r.player_name}` : ''}`,
        summary: `A new private lesson request is waiting for director review.${goalText}`,
        priority: 'medium' as AcademySuggestionPriority,
        confidence: 'high' as const,
        entity_type: 'private_lesson_request',
        entity_id: r.id,
        evidence: [
          {
            type: 'request_data',
            description: `Request status: new. Preferred days: ${r.preferred_days ?? 'not specified'}. Preferred times: ${r.preferred_times ?? 'not specified'}.`,
          },
        ],
        impact_preview: {
          if_accepted: [
            'Director is routed to Private Lessons to review and respond',
            'Request can be scheduled, routed to a coach, or declined',
          ],
          next_step: 'Open Private Lessons and review the request.',
        },
        proposed_changes: {
          request_id: r.id,
          action: 'route_to_private_lessons',
        },
        will_not_change: [
          'No lesson is automatically scheduled',
          'No billing is created',
          'No communication is sent automatically',
        ],
      }
    })
}

// ── Generator 3: Parent-safe summary opportunities ────────────────────────────

export function buildParentSafeSummaryOpportunitySuggestions(
  summaries: DevelopmentSummaryInput[]
): AcademySuggestionDraft[] {
  return summaries
    .filter(s => {
      const hasContent = s.current_strengths.length > 0 || s.things_to_work_on.length > 0 || s.development_focus
      const missingParentSafe = !s.student_friendly_summary
      return hasContent && missingParentSafe
    })
    .map(s => {
      const name = s.player_name ?? 'This player'
      return {
        suggestion_type: 'parent_safe_update_draft' as const,
        title: `Create parent-safe progress preview for ${name}`,
        summary: `${name} has a development summary with coaching notes but no parent-safe version. Adding a parent-safe preview lets families see progress without exposing internal coaching notes.`,
        priority: 'low' as AcademySuggestionPriority,
        confidence: 'high' as const,
        entity_type: 'player',
        entity_id: s.player_id,
        evidence: [
          {
            type: 'development_summary',
            description: `Development summary exists with ${s.current_strengths.length} strengths and ${s.things_to_work_on.length} working-on items. No parent-safe version created yet.`,
          },
        ],
        impact_preview: {
          if_accepted: [
            'Director is routed to the player profile Notes tab to add the parent-safe summary',
            'When added, the parent portal can eventually show the approved version',
          ],
          next_step: `Open the player profile for ${name} and add a Player Preview in the development summary.`,
        },
        proposed_changes: {
          player_id: s.player_id,
          field: 'student_friendly_summary',
          action: 'set_via_profile',
        },
        will_not_change: [
          'Internal coach notes remain private',
          'Nothing is sent to parents automatically',
          'No automatic publishing occurs',
        ],
      }
    })
}

// ── Generator 4: Level readiness reviews ─────────────────────────────────────

export function buildLevelReadinessReviewSuggestions(
  players: PlayerSummaryInput[]
): AcademySuggestionDraft[] {
  return players
    .filter(p => p.player_id && p.player_status === 'active' && p.advancement_eligible === true)
    .map(p => {
      const name = p.full_name ?? 'This player'
      return {
        suggestion_type: 'level_readiness_review' as const,
        title: `Review level readiness for ${name}`,
        summary: `${name} meets the advancement criteria for their current level. The director can review their profile and decide whether to advance them.`,
        priority: 'high' as AcademySuggestionPriority,
        confidence: 'high' as const,
        entity_type: 'player',
        entity_id: p.player_id,
        evidence: [
          {
            type: 'curriculum_data',
            description: `${name} has been evaluated and meets the criteria to advance to the next curriculum level.`,
          },
        ],
        impact_preview: {
          if_accepted: [
            'Director is routed to the player profile Skill Path tab',
            'Director can review advancement criteria and initiate level change if appropriate',
          ],
          next_step: `Open the Skill Path tab on ${name}'s profile and review advancement readiness.`,
        },
        proposed_changes: {
          player_id: p.player_id,
          action: 'route_to_skill_path_review',
        },
        will_not_change: [
          'Player level is not moved automatically',
          'No curriculum assignments change without director action',
          'No notifications sent',
        ],
      }
    })
}

// ── Generator 5: Reassessment follow-ups ─────────────────────────────────────

export function buildReassessmentFollowupSuggestions(
  pipeline: ReassessmentPipelineInput[]
): AcademySuggestionDraft[] {
  return pipeline
    .filter(p => p.player_id && (p.urgency === 'overdue' || p.urgency === 'due_soon'))
    .map(p => {
      const name = p.full_name ?? 'This player'
      const isOverdue = p.urgency === 'overdue'
      return {
        suggestion_type: 'coach_note_followup' as const,
        title: `${isOverdue ? 'Overdue' : 'Schedule'} reassessment for ${name}`,
        summary: `${name}'s reassessment is ${isOverdue ? 'overdue' : 'due soon'}. Reassessments help track curriculum progression and identify development priorities.`,
        priority: (isOverdue ? 'high' : 'medium') as AcademySuggestionPriority,
        confidence: 'high' as const,
        entity_type: 'player',
        entity_id: p.player_id,
        evidence: [
          {
            type: 'assessment_schedule',
            description: `${name}'s reassessment urgency is: ${p.urgency}. This is flagged in the academy improvement pipeline.`,
          },
        ],
        impact_preview: {
          if_accepted: [
            'Director is routed to player profile to schedule or record a reassessment',
            'After reassessment, curriculum advancement eligibility can be re-evaluated',
          ],
          next_step: `Open the player profile for ${name} and schedule a reassessment.`,
        },
        proposed_changes: {
          player_id: p.player_id,
          action: 'route_to_player_profile',
        },
        will_not_change: [
          'No assessment is created automatically',
          'No level is changed',
          'No notifications sent',
        ],
      }
    })
}

// ── Curriculum gap generators (Sprint 199) ────────────────────────────────────

export interface PlayerCurriculumStateInput {
  player_id: string
  player_name: string | null
  current_level_id: string | null
  current_level_name: string | null
  days_since_update: number | null
}

export function buildNoCurriculumAssignmentSuggestions(
  states: PlayerCurriculumStateInput[]
): AcademySuggestionDraft[] {
  return states
    .filter(s => !s.current_level_id)
    .map(s => {
      const name = s.player_name ?? 'This player'
      return {
        suggestion_type: 'curriculum_gap' as const,
        title: `Assign curriculum level for ${name}`,
        summary: `${name} is an active player with no curriculum level assigned. Assigning a level enables gate tracking, coach language, and session planning context.`,
        priority: 'medium' as AcademySuggestionPriority,
        confidence: 'high' as const,
        entity_type: 'player',
        entity_id: s.player_id,
        evidence: [
          {
            type: 'curriculum_state',
            description: `${name} has no curriculum level in player_curriculum_states.`,
          },
        ],
        impact_preview: {
          if_accepted: [
            'Director is routed to the Skill Path tab to assign a curriculum level',
            'Gate requirements become visible on the player profile',
            'Session curriculum context activates for sessions this player attends',
          ],
          next_step: `Open the player profile for ${name} and assign a curriculum level in the Skill Path tab.`,
        },
        proposed_changes: {
          player_id: s.player_id,
          action: 'assign_curriculum_level',
        },
        will_not_change: [
          'Player level is not changed automatically',
          'No parent or player notification is sent',
        ],
      }
    })
}

export function buildCurriculumProgressStaleSuggestions(
  states: PlayerCurriculumStateInput[],
  staleThresholdDays = 60
): AcademySuggestionDraft[] {
  return states
    .filter(s => s.current_level_id && s.days_since_update !== null && s.days_since_update >= staleThresholdDays)
    .map(s => {
      const name = s.player_name ?? 'This player'
      const days = s.days_since_update ?? 0
      const level = s.current_level_name ?? 'current level'
      return {
        suggestion_type: 'curriculum_gap' as const,
        title: `Review curriculum progress for ${name}`,
        summary: `${name} has been at ${level} for ${days} days without a curriculum review. Consider evaluating gate progress or scheduling a reassessment.`,
        priority: days >= 90 ? 'high' as AcademySuggestionPriority : 'medium' as AcademySuggestionPriority,
        confidence: 'medium' as const,
        entity_type: 'player',
        entity_id: s.player_id,
        evidence: [
          {
            type: 'curriculum_state',
            description: `Last curriculum state update was ${days} days ago at ${level}.`,
          },
        ],
        impact_preview: {
          if_accepted: [
            'Director is routed to the player profile Skill Path tab',
            'Gate requirements are visible for director review',
            'Advancement eligibility can be re-evaluated',
          ],
          next_step: `Open the player profile for ${name} and review gate progress in the Skill Path tab.`,
        },
        proposed_changes: {
          player_id: s.player_id,
          action: 'review_curriculum_progress',
        },
        will_not_change: [
          'Player level is not changed automatically',
          'No parent or player notification is sent',
          'No gate progress is modified',
        ],
      }
    })
}

// ── Master generator: combines all generators ────────────────────────────────

export interface AcademySuggestionDraftInputs {
  players: PlayerSummaryInput[]
  privateLessonRequests: PrivateLessonRequestInput[]
  developmentSummaries: DevelopmentSummaryInput[]
  reassessmentPipeline: ReassessmentPipelineInput[]
  playerCurriculumStates?: PlayerCurriculumStateInput[]
}

export function buildAcademySuggestionDrafts(inputs: AcademySuggestionDraftInputs): AcademySuggestionDraft[] {
  const { players, privateLessonRequests, developmentSummaries, reassessmentPipeline, playerCurriculumStates = [] } = inputs
  return [
    ...buildLevelReadinessReviewSuggestions(players),    // high priority first
    ...buildReassessmentFollowupSuggestions(reassessmentPipeline),
    ...buildCurriculumProgressStaleSuggestions(playerCurriculumStates),
    ...buildNoCurriculumAssignmentSuggestions(playerCurriculumStates),
    ...buildPrivateLessonPendingSuggestions(privateLessonRequests),
    ...buildPlayerFocusMissingSuggestions(players),
    ...buildParentSafeSummaryOpportunitySuggestions(developmentSummaries),
  ]
}
