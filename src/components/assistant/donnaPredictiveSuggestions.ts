// Donna Predictive Suggestion Engine — pure, deterministic, no DB, no API.
// Input:  DonnaContextSummary (already fetched by donnaContextActions.ts)
// Output: DonnaSuggestion[] — at most 3 ranked, actionable suggestions
//
// Each suggestion maps to either a guided task (taskId) or a navigation target
// (navigationHref). Reasoning is always shown before any action is taken.
//
// This file has no side effects. Call computePredictiveSuggestions() synchronously
// after a context summary is fetched.

import type { DonnaContextSummary } from './donnaContextTypes'
import type { DonnaTaskId } from './donnaTaskContracts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DonnaSuggestionConfidence = 'low' | 'medium' | 'high'

export interface DonnaSuggestion {
  id: string
  label: string
  /** One sentence explaining why this is the right next move. */
  reason: string
  confidence: DonnaSuggestionConfidence
  /** Key facts from the context summary that support this suggestion. */
  evidencePoints: string[]
  /** If set, clicking "Start" launches a guided task in the assistant. */
  taskId?: DonnaTaskId
  /** If set, clicking "Go" navigates the director to this route. */
  navigationHref?: string
}

// ---------------------------------------------------------------------------
// Confidence helper
// ---------------------------------------------------------------------------

function confidenceRank(c: DonnaSuggestionConfidence): number {
  return c === 'high' ? 2 : c === 'medium' ? 1 : 0
}

// ---------------------------------------------------------------------------
// Step → suggestion mapping
//
// Maps one suggestedNextStep string (from context summary) to a DonnaSuggestion.
// Returns null if the step doesn't produce a meaningful actionable suggestion.
// ---------------------------------------------------------------------------

function mapStepToSuggestion(
  step: string,
  index: number,
  summary: DonnaContextSummary,
): DonnaSuggestion | null {
  const lower = step.toLowerCase()

  // Placement / pending placement
  if (lower.includes('placement') || lower.includes('pending player')) {
    const evidence = summary.keyFacts.filter(f =>
      f.includes('awaiting placement') || f.includes('pending placement') || f.includes('pending')
    )
    return {
      id: `step_placement_${index}`,
      label: 'Complete pending placements',
      reason: step,
      confidence: 'high',
      evidencePoints: evidence.slice(0, 2),
      navigationHref: '/director/review',
    }
  }

  // Assign curriculum levels
  if (lower.includes('curriculum level') && lower.includes('assign')) {
    const evidence = summary.keyFacts.filter(f =>
      f.includes('curriculum level') || f.includes('without a level') || f.includes('missing')
    )
    return {
      id: `step_assign_level_${index}`,
      label: 'Assign curriculum levels to players',
      reason: step,
      confidence: 'high',
      evidencePoints: evidence.slice(0, 2),
      navigationHref: '/director/players',
    }
  }

  // Create template
  if (lower.includes('create') && lower.includes('template')) {
    const evidence = summary.keyFacts.filter(f => f.includes('template'))
    return {
      id: `step_create_template_${index}`,
      label: 'Create a class template',
      reason: step,
      confidence: 'medium',
      evidencePoints: evidence.slice(0, 2),
      taskId: 'create_class_template' as DonnaTaskId,
    }
  }

  // Review wrap-ups
  if (lower.includes('wrap-up') || lower.includes('wrap up')) {
    const evidence = summary.keyFacts.filter(f => f.includes('wrap-up') || f.includes('pending'))
    return {
      id: `step_review_wrapups_${index}`,
      label: 'Review pending coach wrap-ups',
      reason: step,
      confidence: 'high',
      evidencePoints: evidence.slice(0, 2),
      navigationHref: '/director/review',
    }
  }

  // Review players needing attention
  if (lower.includes('attention') || lower.includes('on hold') || lower.includes('reassessment')) {
    const evidence = summary.keyFacts.filter(f =>
      f.includes('need attention') || f.includes('on hold') || f.includes('reassessment')
    )
    return {
      id: `step_attention_${index}`,
      label: 'Review players needing attention',
      reason: step,
      confidence: evidence.length > 0 ? 'high' : 'medium',
      evidencePoints: evidence.slice(0, 2),
      navigationHref: '/director/players',
    }
  }

  // Schedule / generate session
  if (lower.includes('session') && (lower.includes('schedule') || lower.includes('generate') || lower.includes('create'))) {
    return {
      id: `step_session_${index}`,
      label: 'Create a session from a template',
      reason: step,
      confidence: 'medium',
      evidencePoints: summary.keyFacts.filter(f => f.includes('session')).slice(0, 2),
      navigationHref: '/director/sessions',
    }
  }

  // Review lesson requests
  if (lower.includes('lesson request')) {
    return {
      id: `step_lesson_${index}`,
      label: 'Review private lesson requests',
      reason: step,
      confidence: 'medium',
      evidencePoints: summary.keyFacts.filter(f => f.includes('lesson')).slice(0, 2),
      navigationHref: '/director/review',
    }
  }

  // Assign players to groups
  if (lower.includes('assign') && lower.includes('group')) {
    return {
      id: `step_group_${index}`,
      label: 'Assign players to groups',
      reason: step,
      confidence: 'medium',
      evidencePoints: summary.keyFacts.filter(f => f.includes('group')).slice(0, 2),
      navigationHref: '/director/players',
    }
  }

  // Curriculum spine setup
  if (lower.includes('curriculum') && (lower.includes('setup') || lower.includes('activate') || lower.includes('approve'))) {
    return {
      id: `step_curriculum_${index}`,
      label: 'Set up your curriculum spine',
      reason: step,
      confidence: 'high',
      evidencePoints: summary.keyFacts.filter(f => f.includes('curriculum')).slice(0, 2),
      navigationHref: '/director/onboarding/curriculum',
    }
  }

  // Connect templates to curriculum levels
  if (lower.includes('template') && lower.includes('curriculum')) {
    return {
      id: `step_template_curriculum_${index}`,
      label: 'Connect templates to curriculum levels',
      reason: step,
      confidence: 'medium',
      evidencePoints: summary.keyFacts.filter(f => f.includes('template')).slice(0, 2),
      navigationHref: '/director/class-templates',
    }
  }

  // Gate evidence / advancement eligible
  if (lower.includes('gate') || lower.includes('advancement') || lower.includes('advance')) {
    return {
      id: `step_gate_${index}`,
      label: 'Review level advancement evidence',
      reason: step,
      confidence: 'high',
      evidencePoints: summary.keyFacts.filter(f =>
        f.includes('eligible') || f.includes('gate') || f.includes('advancement')
      ).slice(0, 2),
      taskId: 'review_level_readiness' as DonnaTaskId,
    }
  }

  // Pending review items — generic
  if (lower.includes('pending') && lower.includes('item')) {
    return {
      id: `step_pending_${index}`,
      label: 'Clear pending review items',
      reason: step,
      confidence: 'medium',
      evidencePoints: summary.keyFacts.filter(f => f.includes('pending')).slice(0, 2),
      navigationHref: '/director/review',
    }
  }

  // Recommendation/suggest template for group
  if (lower.includes('recommend') && lower.includes('template')) {
    return {
      id: `step_rec_template_${index}`,
      label: 'Get a template recommendation',
      reason: step,
      confidence: 'medium',
      evidencePoints: summary.keyFacts.filter(f => f.includes('template')).slice(0, 2),
      taskId: 'recommend_template_for_group' as DonnaTaskId,
    }
  }

  // Attendance concerns
  if (lower.includes('attendance') && lower.includes('concern')) {
    return {
      id: `step_attendance_${index}`,
      label: 'Review attendance concerns',
      reason: step,
      confidence: 'high',
      evidencePoints: summary.keyFacts.filter(f => f.includes('attendance')).slice(0, 2),
      navigationHref: '/director/players',
    }
  }

  // Coach notes / observations
  if (lower.includes('observation') || (lower.includes('coach') && lower.includes('note'))) {
    return {
      id: `step_note_${index}`,
      label: 'Add coach observations',
      reason: step,
      confidence: 'low',
      evidencePoints: summary.missingData.filter(m => m.includes('note') || m.includes('observ')).slice(0, 2),
      taskId: 'capture_coach_note' as DonnaTaskId,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Suggestion type → supplemental suggestion
//
// Only adds a suggestion if the type is in possibleSuggestionTypes AND no
// equivalent suggestion was already produced from suggestedNextSteps.
// ---------------------------------------------------------------------------

function supplementFromType(
  type: string,
  summary: DonnaContextSummary,
  existingIds: Set<string>,
): DonnaSuggestion | null {
  switch (type) {
    case 'template_recommendation': {
      const id = 'type_template_rec'
      if (existingIds.has(id)) return null
      const hasCurriculum = summary.recommendationInputsAvailable.includes('curriculum_levels') ||
        summary.recommendationInputsAvailable.includes('templates_with_curriculum') ||
        summary.recommendationInputsAvailable.includes('template_count')
      return {
        id,
        label: 'Get a template recommendation for your group',
        reason: 'Donna can suggest the best-fit template based on your current player levels and priorities.',
        confidence: hasCurriculum ? 'medium' : 'low',
        evidencePoints: summary.keyFacts.filter(f => f.includes('template') || f.includes('level')).slice(0, 2),
        taskId: 'recommend_template_for_group' as DonnaTaskId,
      }
    }

    case 'player_attention_signal': {
      const id = 'type_attention'
      if (existingIds.has(id)) return null
      const attentionFacts = summary.keyFacts.filter(f =>
        f.includes('need attention') || f.includes('on hold') || f.includes('reassessment')
      )
      if (attentionFacts.length === 0) return null
      return {
        id,
        label: 'Review players flagged for attention',
        reason: 'One or more players may need a director check-in based on current status.',
        confidence: 'high',
        evidencePoints: attentionFacts.slice(0, 2),
        navigationHref: '/director/players',
      }
    }

    case 'attendance_risk_suggestion': {
      const id = 'type_attendance_risk'
      if (existingIds.has(id)) return null
      const attendanceFacts = summary.keyFacts.filter(f => f.includes('attendance'))
      if (attendanceFacts.length === 0) return null
      return {
        id,
        label: 'Review players with attendance concerns',
        reason: 'Some players show attendance patterns that may indicate a risk of dropping out.',
        confidence: 'medium',
        evidencePoints: attendanceFacts.slice(0, 2),
        navigationHref: '/director/players',
      }
    }

    case 'parent_update_suggestion': {
      const id = 'type_parent_update'
      if (existingIds.has(id)) return null
      return {
        id,
        label: 'Draft a parent update',
        reason: 'A parent update may be worth preparing — especially after recent player activity.',
        confidence: 'low',
        evidencePoints: summary.keyFacts.slice(0, 1),
        taskId: 'draft_parent_update' as DonnaTaskId,
      }
    }

    case 'curriculum_priority_suggestion': {
      const id = 'type_curriculum_priority'
      if (existingIds.has(id)) return null
      const curriculumFacts = summary.keyFacts.filter(f => f.includes('curriculum') || f.includes('level'))
      if (curriculumFacts.length === 0) return null
      return {
        id,
        label: 'Prioritize curriculum focus for upcoming sessions',
        reason: 'Your current player levels and curriculum state suggest where to direct coaching attention.',
        confidence: 'medium',
        evidencePoints: curriculumFacts.slice(0, 2),
        navigationHref: '/director/curriculum',
      }
    }

    case 'session_focus_recommendation': {
      const id = 'type_session_focus'
      if (existingIds.has(id)) return null
      const sessionFacts = summary.keyFacts.filter(f => f.includes('session') || f.includes('upcoming'))
      return {
        id,
        label: 'Review upcoming session focus',
        reason: 'Donna can suggest what to focus on in your next session based on group needs.',
        confidence: sessionFacts.length > 0 ? 'medium' : 'low',
        evidencePoints: sessionFacts.slice(0, 2),
        navigationHref: '/director/sessions',
      }
    }

    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Compute up to 3 predictive suggestions from a DonnaContextSummary.
 * Pure function — no side effects, no async, no DB.
 */
export function computePredictiveSuggestions(
  summary: DonnaContextSummary,
): DonnaSuggestion[] {
  const raw: DonnaSuggestion[] = []

  // 1. Map each suggested next step to a concrete suggestion
  summary.suggestedNextSteps.forEach((step, i) => {
    const s = mapStepToSuggestion(step, i, summary)
    if (s) raw.push(s)
  })

  // 2. Supplement from possibleSuggestionTypes
  const existingIds = new Set(raw.map(s => s.id))
  for (const type of summary.possibleSuggestionTypes) {
    const s = supplementFromType(type, summary, existingIds)
    if (s) {
      raw.push(s)
      existingIds.add(s.id)
    }
  }

  // 3. Deduplicate by id
  const seen = new Set<string>()
  const deduped = raw.filter(s => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return true
  })

  // 4. Sort: high confidence first, then medium, then low
  deduped.sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence))

  // 5. Return at most 3
  return deduped.slice(0, 3)
}
