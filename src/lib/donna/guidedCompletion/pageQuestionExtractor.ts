// Sprint 1811–1820 — DONNA Guided Completion Engine V1
// Static per-workflow, per-route question maps.
// Answers: "What questions is DONNA asking on this specific page for this workflow?"
//
// Uses static definitions — no DOM access, no live extraction.
// Pure TypeScript. No DB, no React, no side effects.
//
// This allows DONNA to be page-aware without reading the DOM:
//   - When director is on /director/curriculum, curriculum questions apply
//   - When on a player profile, player-specific questions apply
//   - Generic questions apply on any route not explicitly listed

import type { GuidedWorkflowId, GuidedCompletionStep } from './guidedCompletionRegistry'
import { getWorkflow } from './guidedCompletionRegistry'

// ── Page question context ─────────────────────────────────────────────────────

export interface PageQuestionContext {
  /** Which workflow these questions belong to */
  workflowId: GuidedWorkflowId
  /** The route they apply to */
  route: string
  /** Human label for the context */
  pageLabel: string
  /** Ordered questions visible/relevant on this page */
  questions: GuidedCompletionStep[]
  /** Contextual note for DONNA to acknowledge (e.g. "You are on the curriculum builder") */
  pageNote: string
}

// ── Route → page note map ─────────────────────────────────────────────────────

const PAGE_NOTES: Record<string, string> = {
  '/director/curriculum':         'You\'re on the Curriculum page.',
  '/director/curriculum/builder': 'You\'re in the Curriculum Builder.',
  '/director/templates':          'You\'re in the Template Library.',
  '/director/players':            'You\'re in the Player Directory.',
  '/director/placement':          'You\'re on the Placement page.',
  '/director/onboarding':         'You\'re in Academy Setup.',
  '/director/onboarding/interview': 'You\'re in the Academy Interview.',
  '/director/onboarding/curriculum': 'You\'re in Curriculum Setup.',
  '/director':                    'You\'re on the Director Dashboard.',
  '/director/review':             'You\'re in the Review Queue.',
}

function getPageNote(pathname: string): string {
  // Exact match first
  if (PAGE_NOTES[pathname]) return PAGE_NOTES[pathname]
  // Player profile
  if (pathname.startsWith('/director/players/') && pathname.split('/').length >= 4) {
    return 'You\'re on a Player Profile.'
  }
  return 'Let\'s work through this together.'
}

// ── Route grouping for question selection ─────────────────────────────────────

type RouteGroup =
  | 'curriculum_page'
  | 'curriculum_builder'
  | 'templates'
  | 'player_directory'
  | 'player_profile'
  | 'placement'
  | 'onboarding'
  | 'review'
  | 'dashboard'
  | 'default'

function classifyRoute(pathname: string): RouteGroup {
  if (pathname === '/director/curriculum/builder') return 'curriculum_builder'
  if (pathname.startsWith('/director/curriculum'))  return 'curriculum_page'
  if (pathname.startsWith('/director/templates'))   return 'templates'
  if (pathname.startsWith('/director/placement'))   return 'placement'
  if (pathname.startsWith('/director/review'))      return 'review'
  if (pathname.startsWith('/director/onboarding'))  return 'onboarding'
  if (pathname === '/director')                     return 'dashboard'
  if (pathname.startsWith('/director/players/') && pathname.split('/').length >= 4) {
    return 'player_profile'
  }
  if (pathname.startsWith('/director/players')) return 'player_directory'
  return 'default'
}

// ── Workflow → route → question slice ─────────────────────────────────────────
// For each workflow, some routes surface a focused subset of questions.
// When no route-specific slice is defined, all required steps are returned.

const ROUTE_QUESTION_SLICES: Partial<Record<
  GuidedWorkflowId,
  Partial<Record<RouteGroup, string[]>>   // array of fieldIds relevant on that route group
>> = {
  curriculum_builder_completion: {
    curriculum_builder: ['level_name', 'level_goal', 'required_skills', 'supporting_drills', 'assessment_method', 'parent_player_description'],
    curriculum_page:    ['level_name', 'level_goal', 'required_skills'],
    default:            ['level_name', 'level_goal', 'required_skills', 'supporting_drills', 'assessment_method', 'parent_player_description'],
  },
  academy_setup_completion: {
    onboarding:   ['academy_name', 'development_philosophy', 'curriculum_structure', 'level_count', 'parent_portal_enabled', 'first_coach'],
    dashboard:    ['academy_name', 'development_philosophy', 'curriculum_structure', 'level_count', 'parent_portal_enabled', 'first_coach'],
    default:      ['academy_name', 'development_philosophy', 'curriculum_structure', 'level_count', 'parent_portal_enabled', 'first_coach'],
  },
  player_onboarding_completion: {
    player_directory: ['player_name', 'player_age', 'recommended_level', 'assigned_coach', 'assigned_group', 'parent_contact'],
    placement:        ['player_name', 'player_age', 'recommended_level', 'assigned_coach', 'assigned_group', 'parent_contact'],
    default:          ['player_name', 'player_age', 'recommended_level', 'assigned_coach', 'assigned_group', 'parent_contact'],
  },
  assessment_completion: {
    player_profile:   ['player_name', 'assessment_domain', 'observation', 'performance_rating', 'recommendation', 'parent_visibility'],
    player_directory: ['player_name', 'assessment_domain', 'observation', 'performance_rating', 'recommendation', 'parent_visibility'],
    default:          ['player_name', 'assessment_domain', 'observation', 'performance_rating', 'recommendation', 'parent_visibility'],
  },
  parent_update_completion: {
    player_profile:   ['player_name', 'main_message', 'positive_progress', 'home_support', 'internal_flag'],
    review:           ['player_name', 'main_message', 'positive_progress', 'home_support', 'internal_flag'],
    default:          ['player_name', 'main_message', 'positive_progress', 'home_support', 'internal_flag'],
  },
  template_builder_completion: {
    templates:            ['template_purpose', 'session_duration', 'session_focus', 'block_structure', 'key_drills', 'target_level'],
    curriculum_builder:   ['template_purpose', 'session_duration', 'session_focus', 'block_structure', 'key_drills', 'target_level'],
    default:              ['template_purpose', 'session_duration', 'session_focus', 'block_structure', 'key_drills', 'target_level'],
  },
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the ordered list of questions DONNA should ask on the given page
 * for the given workflow. Falls back to all required steps when no route slice exists.
 */
export function getPageQuestions(
  workflowId: GuidedWorkflowId,
  pathname: string,
): PageQuestionContext {
  const workflow = getWorkflow(workflowId)
  if (!workflow) {
    return {
      workflowId,
      route: pathname,
      pageLabel: 'Unknown page',
      questions: [],
      pageNote: 'I couldn\'t find the workflow context for this page.',
    }
  }

  const routeGroup = classifyRoute(pathname)
  const slices = ROUTE_QUESTION_SLICES[workflowId] ?? {}
  const fieldIds: string[] | undefined =
    slices[routeGroup] ?? slices['default'] ?? undefined

  let questions: GuidedCompletionStep[]
  if (fieldIds) {
    const allSteps = [...workflow.requiredSteps, ...workflow.optionalSteps]
    questions = fieldIds
      .map(fid => allSteps.find(s => s.fieldId === fid))
      .filter((s): s is GuidedCompletionStep => s !== undefined)
  } else {
    questions = [...workflow.requiredSteps]
  }

  return {
    workflowId,
    route: pathname,
    pageLabel: getPageNote(pathname).replace('You\'re on ', '').replace('You\'re in ', '').replace('.', ''),
    questions,
    pageNote: getPageNote(pathname),
  }
}

/**
 * Returns just the questions relevant to the current page as an ordered array.
 * Convenience wrapper over getPageQuestions.
 */
export function getOrderedPageQuestions(
  workflowId: GuidedWorkflowId,
  pathname: string,
): GuidedCompletionStep[] {
  return getPageQuestions(workflowId, pathname).questions
}

/**
 * Given a workflow and a set of already-answered fieldIds,
 * returns the next unanswered question for the current page context.
 * Returns null when all questions on this page have been answered.
 */
export function getNextPageQuestion(
  workflowId: GuidedWorkflowId,
  pathname: string,
  answeredFieldIds: Set<string>,
): GuidedCompletionStep | null {
  const questions = getOrderedPageQuestions(workflowId, pathname)
  return questions.find(q => !answeredFieldIds.has(q.fieldId)) ?? null
}
