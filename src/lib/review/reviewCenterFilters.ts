// Sprint 631 — Review Center Filter Framework V1
// Pure TypeScript — no DB calls, no mutations, no AI calls, no UI imports.
// Defines the filter taxonomy, risk classification, and metadata labels for the
// /director/review command view. These are the source of truth for filter chip
// rendering and review item metadata display.

// ── Filter taxonomy ───────────────────────────────────────────────────────────

export type ReviewFilterId =
  | 'needs_approval'
  | 'high_risk'
  | 'parent_player_visible'
  | 'level_movement'
  | 'placement'
  | 'curriculum'
  | 'parent_summary'
  | 'badge_mission'
  | 'video_visibility'
  | 'knowledge_promotion'
  | 'licensing_review'

export interface ReviewFilter {
  id: ReviewFilterId
  label: string
  description: string
  targetModules: string[]
  showsVisibilityRisk: boolean
  requiresApproval: boolean
}

export const REVIEW_CENTER_FILTERS: ReviewFilter[] = [
  {
    id: 'needs_approval',
    label: 'Needs Approval',
    description: 'Items in pending_review status — waiting for your decision',
    targetModules: ['*'],
    showsVisibilityRisk: false,
    requiresApproval: true,
  },
  {
    id: 'high_risk',
    label: 'High Risk',
    description: 'Items with parent/player visibility risk or irreversible outcomes',
    targetModules: [
      'parent_communication',
      'level_review',
      'placement',
      'curriculum_adjustment',
      'curriculum_override',
    ],
    showsVisibilityRisk: true,
    requiresApproval: true,
  },
  {
    id: 'parent_player_visible',
    label: 'Parent/Player Visible',
    description: 'Items that will be visible to parents or players after approval',
    targetModules: [
      'parent_communication',
      'player_brief',
      'curriculum_adjustment',
    ],
    showsVisibilityRisk: true,
    requiresApproval: true,
  },
  {
    id: 'level_movement',
    label: 'Level Movement',
    description: 'Proposed level advancements waiting for director decision',
    targetModules: ['level_review'],
    showsVisibilityRisk: false,
    requiresApproval: true,
  },
  {
    id: 'placement',
    label: 'Placement',
    description: 'New player placement decisions — intake, assessment, recommendation',
    targetModules: [
      'placement_review',
      'placement_intake_candidate',
      'placement_assessment_draft',
      'placement_recommendation_draft',
    ],
    showsVisibilityRisk: false,
    requiresApproval: true,
  },
  {
    id: 'curriculum',
    label: 'Curriculum',
    description: 'Curriculum adjustments, overrides, and coach curriculum suggestions',
    targetModules: [
      'curriculum_adjustment',
      'curriculum_override',
      'curriculum_builder',
    ],
    showsVisibilityRisk: false,
    requiresApproval: true,
  },
  {
    id: 'parent_summary',
    label: 'Parent Summary',
    description: 'Parent-safe development summaries drafted by DONNA — not sent until approved',
    targetModules: ['parent_communication'],
    showsVisibilityRisk: true,
    requiresApproval: true,
  },
  {
    id: 'badge_mission',
    label: 'Badge / Mission',
    description: 'Badge award proposals and mission assignments requiring evidence and approval',
    targetModules: ['badge_award', 'mission_assignment'],
    showsVisibilityRisk: false,
    requiresApproval: true,
  },
  {
    id: 'video_visibility',
    label: 'Video Visibility',
    description: 'Proposed changes to who can see a video or media item',
    targetModules: ['video_visibility_change', 'curriculum_adjustment'],
    showsVisibilityRisk: true,
    requiresApproval: true,
  },
  {
    id: 'knowledge_promotion',
    label: 'Knowledge Promotion',
    description: 'Requests to promote academy knowledge to a broader audience — requires platform-owner for global destinations',
    targetModules: ['knowledge_promotion'],
    showsVisibilityRisk: true,
    requiresApproval: true,
  },
  {
    id: 'licensing_review',
    label: 'Licensing Review',
    description: 'Curriculum licensing health checks flagged for director attention',
    targetModules: ['licensing_review'],
    showsVisibilityRisk: false,
    requiresApproval: true,
  },
]

// ── Risk classification ───────────────────────────────────────────────────────

export type ReviewItemRisk = 'high' | 'medium' | 'low'

export interface ReviewItemRiskLabel {
  risk: ReviewItemRisk
  label: string
  reason: string
}

export function classifyReviewItemRisk(targetModule: string | null): ReviewItemRiskLabel {
  const module = targetModule ?? ''

  if (
    module === 'parent_communication' ||
    module === 'video_visibility_change' ||
    module === 'knowledge_promotion'
  ) {
    return {
      risk: 'high',
      label: 'High risk',
      reason: 'Parent or player visibility change — requires careful review',
    }
  }

  if (
    module === 'level_review' ||
    module === 'placement_recommendation_draft' ||
    module === 'curriculum_adjustment' ||
    module === 'curriculum_override'
  ) {
    return {
      risk: 'medium',
      label: 'Medium risk',
      reason: 'Affects player record or curriculum — review before applying',
    }
  }

  return {
    risk: 'low',
    label: 'Low risk',
    reason: 'Internal record — limited downstream effect',
  }
}

// ── Module label resolver ─────────────────────────────────────────────────────

export function resolveModuleLabel(targetModule: string | null): string {
  const module = targetModule ?? ''
  const labels: Record<string, string> = {
    parent_communication: 'Parent Communication',
    level_review: 'Level Movement',
    placement_review: 'Placement',
    placement_intake_candidate: 'Intake Candidate',
    placement_assessment_draft: 'Placement Assessment',
    placement_recommendation_draft: 'Placement Recommendation',
    curriculum_adjustment: 'Curriculum',
    curriculum_override: 'Curriculum Override',
    curriculum_builder: 'Coach Curriculum Suggestion',
    badge_award: 'Badge Award',
    mission_assignment: 'Mission',
    video_visibility_change: 'Video Visibility',
    knowledge_promotion: 'Knowledge Promotion',
    licensing_review: 'Licensing Review',
    player_brief: 'Player Note',
    player_observation: 'Observation',
    attendance_exception: 'Attendance Exception',
    session_wrap_up_v1: 'Session Recap',
    coach_communication: 'Coach Brief',
  }
  return labels[module] ?? module ?? 'Unknown module'
}

// ── Visibility impact label resolver ─────────────────────────────────────────

export function resolveVisibilityImpact(targetModule: string | null): string {
  const module = targetModule ?? ''

  if (module === 'parent_communication') {
    return 'Parent/player visible after approval — not sent until you approve'
  }
  if (module === 'video_visibility_change') {
    return 'Changes who can see a video — parent/player visible after approval'
  }
  if (module === 'knowledge_promotion') {
    return 'Broadens visibility of academy knowledge — platform-owner required for global destinations'
  }
  if (module === 'level_review') {
    return 'No parent notification until separately approved — level does not change until apply step'
  }
  if (module === 'curriculum_adjustment' || module === 'curriculum_override') {
    return 'Not live in curriculum until approved — player/parent portal unaffected during review'
  }
  if (module === 'badge_award' || module === 'mission_assignment') {
    return 'Not visible to player/parent until approved and visibility explicitly enabled'
  }
  return 'Director-only until you take action'
}

// ── Approval requirement label resolver ──────────────────────────────────────

export function resolveApprovalRequirement(targetModule: string | null): string {
  const module = targetModule ?? ''

  if (module === 'knowledge_promotion') {
    return 'Platform-owner approval required for global destinations; director approval for academy-local'
  }
  if (
    module === 'parent_communication' ||
    module === 'level_review' ||
    module === 'curriculum_adjustment' ||
    module === 'curriculum_override' ||
    module === 'badge_award' ||
    module === 'mission_assignment' ||
    module === 'video_visibility_change'
  ) {
    return 'Director approval required — nothing applies until you approve'
  }
  if (module === 'placement_recommendation_draft') {
    return 'Director approval required — finalized via finalize_player_placement()'
  }
  return 'Director review required'
}

// ── Filter matching ───────────────────────────────────────────────────────────
// Given a proposed_action, returns which filter IDs it matches.

export function getMatchingFilters(
  targetModule: string | null,
  status: string,
): ReviewFilterId[] {
  const module = targetModule ?? ''
  const matched: ReviewFilterId[] = []

  if (status === 'pending_review') matched.push('needs_approval')

  const risk = classifyReviewItemRisk(module)
  if (risk.risk === 'high') matched.push('high_risk')

  if (
    module === 'parent_communication' ||
    module === 'video_visibility_change'
  ) matched.push('parent_player_visible')

  if (module === 'level_review') matched.push('level_movement')

  if (
    module === 'placement_review' ||
    module === 'placement_intake_candidate' ||
    module === 'placement_assessment_draft' ||
    module === 'placement_recommendation_draft'
  ) matched.push('placement')

  if (
    module === 'curriculum_adjustment' ||
    module === 'curriculum_override' ||
    module === 'curriculum_builder'
  ) matched.push('curriculum')

  if (module === 'parent_communication') matched.push('parent_summary')

  if (module === 'badge_award' || module === 'mission_assignment') matched.push('badge_mission')

  if (module === 'video_visibility_change') matched.push('video_visibility')

  if (module === 'knowledge_promotion') matched.push('knowledge_promotion')

  if (module === 'licensing_review') matched.push('licensing_review')

  return matched
}
