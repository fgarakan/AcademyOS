// Cross-page action controller — returns relevant DonnaTaskIds for the current pathname.
// Local, deterministic, no DB, no API.
//
// create_class_template is excluded from all routes — it has its own
// dedicated "Create Template" mode button and wired TemplateDraftPanel flow.

import type { DonnaTaskId } from './donnaTaskContracts'

interface PageTaskConfig {
  /** Pathname prefix to match — longer prefixes are more specific */
  pattern: string
  taskIds: DonnaTaskId[]
}

// Ordered most-specific first so the longest matching prefix wins
const PAGE_TASK_MAP: PageTaskConfig[] = [
  {
    pattern: '/director/players',
    taskIds: [
      'summarize_player_progress',
      'capture_coach_note',
      'draft_parent_update',
      'draft_player_note',
      'review_level_readiness',
      'assign_player_to_group',
    ],
  },
  {
    pattern: '/director/sessions',
    taskIds: [
      'create_session',
      'handle_attendance_exception',
      'recommend_template_for_group',
    ],
  },
  {
    pattern: '/director/class-templates',
    taskIds: [
      'create_fitness_template',
      'recommend_template_for_group',
    ],
  },
  {
    pattern: '/director/fitness',
    taskIds: [
      'create_fitness_template',
    ],
  },
  {
    pattern: '/director/curriculum',
    taskIds: [
      'adjust_curriculum',
      'review_level_readiness',
    ],
  },
  {
    pattern: '/director/review',
    taskIds: [
      'review_level_readiness',
      'draft_parent_update',
      'capture_coach_note',
    ],
  },
  {
    pattern: '/director/onboarding',
    taskIds: [
      'create_group',
      'assign_player_to_group',
    ],
  },
  {
    // Default for /director dashboard and any unmatched director route
    pattern: '/director',
    taskIds: [
      'capture_coach_note',
      'create_session',
      'summarize_player_progress',
      'recommend_template_for_group',
    ],
  },
]

/**
 * Returns the most contextually relevant task IDs for the given pathname.
 * Uses longest-prefix matching. create_class_template is never included.
 */
export function getAvailableTasksForPage(pathname: string): DonnaTaskId[] {
  let bestMatch: PageTaskConfig | null = null
  let bestLength = 0

  for (const config of PAGE_TASK_MAP) {
    if (pathname.startsWith(config.pattern) && config.pattern.length > bestLength) {
      bestMatch = config
      bestLength = config.pattern.length
    }
  }

  return bestMatch?.taskIds ?? []
}
