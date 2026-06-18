// Mega Sprint 3031–3060 — DONNA Page-Aware Operating Layer V1
// Part 4 — Page Completion Engine
//
// Determines how to reach completion for a given page.
// Answers: How do we finish?
//
// Every page has a completion path. No dead ends.
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Completion paths are static per route — they describe the generic path,
//     not a live-data-dependent state.
//   - estimatedSteps is intentionally small (≤4) to avoid overwhelming the director.

import type { PageIntelligence } from './pageContextResolver'
import type { PageTask } from './pageTaskResolver'
import type { LivePageState } from './livePageState'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CompletionPath {
  /** What completion achieves */
  goal: string
  /** Where the director is now in the completion arc */
  currentStep: string
  /** The single next action to move forward */
  nextStep: string
  /** Remaining steps after the next step */
  remainingSteps: string[]
  /** The condition that marks this page as complete */
  completionCondition: string
  /** Short summary for use in DONNA responses */
  summary: string
}

// ── Route-specific completion paths ──────────────────────────────────────────

const ROUTE_COMPLETION_PATHS: Record<string, CompletionPath> = {
  '/director/curriculum': {
    goal: 'Active curriculum spine with all players assigned and assessment criteria defined',
    currentStep: 'Review curriculum architecture — check which levels exist and which are active',
    nextStep: 'Define or activate curriculum levels for each development stage',
    remainingSteps: [
      'Assign all active players to a curriculum level',
      'Define assessment criteria per level',
      'Review coach-curriculum alignment',
    ],
    completionCondition: 'All levels active; all players assigned; assessment criteria set per level',
    summary: 'Define levels → assign players → set criteria → review alignment',
  },

  '/director': {
    goal: 'Clear review queue, acknowledge attention signals, confirm daily priorities',
    currentStep: 'Open review queue to see what is waiting for your decision',
    nextStep: 'Review each pending item and approve, reject, or defer',
    remainingSteps: [
      'Check attention signals for flagged players',
      'Confirm today\'s session activity',
    ],
    completionCondition: 'Review queue triaged; attention signals acknowledged',
    summary: 'Review queue → attention signals → session confirmation',
  },

  '/director/review': {
    goal: 'All pending items reviewed; queue clear',
    currentStep: 'Identify items with parent-visibility risk — review those first',
    nextStep: 'Review each item in priority order: parent-visible → attendance → wrap-ups → level movements',
    remainingSteps: [
      'Apply approved items to write changes to the database',
      'Confirm no items older than 7 days remain',
    ],
    completionCondition: 'All items reviewed; none older than 7 days; all approved items applied',
    summary: 'Parent-visible first → attendance → wrap-ups → apply approved',
  },

  '/director/kpi': {
    goal: 'All attention signals reviewed; advancement-ready players sent to Level Up queue',
    currentStep: 'Identify attention-signal players in the table below',
    nextStep: 'Open each flagged player\'s profile to review their specific signals',
    remainingSteps: [
      'Create follow-up plans for players with attendance risk',
      'Send advancement-ready players to the Level Up queue',
    ],
    completionCondition: 'All flagged players have a next action; advancement candidates in review',
    summary: 'Identify signals → review profiles → create follow-ups → send to Level Up',
  },

  '/director/players': {
    goal: 'All active players with curriculum levels, no unresolved flags',
    currentStep: 'Filter by attention flags to identify players who need action',
    nextStep: 'Open each flagged player\'s profile and determine the correct action',
    remainingSteps: [
      'Assign curriculum levels to any players missing them',
      'Resolve placement queue (unplaced players)',
    ],
    completionCondition: 'All players have curriculum levels; no unresolved attention flags',
    summary: 'Filter flags → review profiles → assign levels → resolve placement',
  },

  '/director/level-up': {
    goal: 'All advancement candidates reviewed and decisions recorded',
    currentStep: 'Open the first advancement candidate to review their evidence',
    nextStep: 'Review evidence (assessment scores, coach notes, time in level)',
    remainingSteps: [
      'Approve or defer the level movement',
      'Continue through remaining candidates',
    ],
    completionCondition: 'All candidates reviewed; no candidates waiting longer than 14 days',
    summary: 'Review evidence → approve or defer → repeat for each candidate',
  },

  '/director/placement': {
    goal: 'All intake players placed and activated',
    currentStep: 'Review intake players and their assessment notes',
    nextStep: 'Assign a curriculum level and group to each intake player',
    remainingSteps: [
      'Run finalize_player_placement() to activate each player',
      'Confirm no players remain in intake',
    ],
    completionCondition: 'All intake players placed; finalize_player_placement() called for each',
    summary: 'Review intake → assign level + group → finalize to activate',
  },

  '/director/sessions': {
    goal: 'All completed sessions have coach wrap-ups; no sessions missing template alignment',
    currentStep: 'Filter to completed sessions without submitted wrap-ups',
    nextStep: 'Follow up with coaches who have not submitted wrap-ups for recent sessions',
    remainingSteps: [
      'Approve submitted wrap-ups in the review queue',
    ],
    completionCondition: 'All completed sessions have submitted wrap-ups; queue clear',
    summary: 'Identify missing wrap-ups → follow up coaches → approve in review queue',
  },

  '/director/parents': {
    goal: 'No players with overdue parent updates; all approved drafts dispatched',
    currentStep: 'Review pending parent update drafts',
    nextStep: 'Approve or edit each draft',
    remainingSteps: [
      'Dispatch approved updates to parents',
      'Identify players without any recent update',
    ],
    completionCondition: 'All drafts reviewed; all approved updates dispatched',
    summary: 'Review drafts → approve → dispatch → identify gaps',
  },

  '/director/onboarding': {
    goal: 'All 7 onboarding steps complete; academy fully configured',
    currentStep: 'Complete Academy DNA selection (Step 1)',
    nextStep: 'Choose the Academy DNA model that describes your development philosophy',
    remainingSteps: [
      'Define first curriculum level',
      'Create first group',
      'Invite first coach',
      'Enroll first player',
      'Complete remaining steps',
    ],
    completionCondition: 'All 7 steps marked complete; DNA, curriculum, and groups configured',
    summary: 'DNA → curriculum → groups → coaches → players → finalize',
  },
}

// ── Dynamic route completion paths ────────────────────────────────────────────

const DYNAMIC_COMPLETION_PATHS: Array<{ prefix: string; path: CompletionPath }> = [
  {
    prefix: '/director/players/',
    path: {
      goal: 'Player development record current, accurate, and actionable',
      currentStep: 'Review current curriculum level and last assessment date',
      nextStep: 'Check whether assessment is within 90 days; flag if overdue',
      remainingSteps: [
        'Review attendance history and flag any absence risk',
        'Verify coach assignment',
        'Check for any open attention flags and create response plan',
      ],
      completionCondition: 'Level current; assessment on file within 90 days; coach assigned; no unresolved flags',
      summary: 'Review level → check assessment → review attendance → verify coach',
    },
  },
  {
    prefix: '/director/groups/',
    path: {
      goal: 'Group fully configured with coach, curriculum level, and all players assigned',
      currentStep: 'Verify coach assignment for this group',
      nextStep: 'Assign a coach if one is not currently assigned',
      remainingSteps: [
        'Confirm curriculum level is set for the group',
        'Verify all group members have individual curriculum levels',
      ],
      completionCondition: 'Coach assigned; curriculum level set; all players have levels',
      summary: 'Verify coach → set curriculum level → confirm player levels',
    },
  },
  {
    prefix: '/director/fitness/templates/',
    path: {
      goal: 'Template published and ready for session use',
      currentStep: 'Check for load flags on existing blocks',
      nextStep: 'Resolve any orange or red load flags',
      remainingSteps: [
        'Ensure all blocks have exercises assigned',
        'Publish template',
      ],
      completionCondition: 'No load flags; all blocks have exercises; template published',
      summary: 'Resolve flags → fill blocks → publish',
    },
  },
  {
    prefix: '/director/class-templates/',
    path: {
      goal: 'Template published with curriculum level, full blocks, and coaching cues',
      currentStep: 'Run the session flow check — identify empty blocks or missing cues',
      nextStep: 'Add activities and coaching cues to any flagged blocks',
      remainingSteps: [
        'Assign curriculum level',
        'Publish template',
      ],
      completionCondition: 'All blocks have activities and cues; curriculum level set; published',
      summary: 'Flow check → fill blocks → assign level → publish',
    },
  },
]

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a completion path for a given page.
 * Uses intel, task, and optional live academy state to select the correct
 * first-incomplete step rather than always starting from step 1.
 */
export function buildCompletionPath(
  intel: PageIntelligence,
  task?: PageTask,
  liveState?: LivePageState | null,
): CompletionPath {
  const route = intel.route

  // Live-state-aware overrides for specific routes
  if (route === '/director/curriculum' && liveState) {
    return buildCurriculumCompletionPath(liveState)
  }

  if (route === '/director/onboarding' && liveState) {
    return buildOnboardingCompletionPath(liveState)
  }

  // Exact route match (static)
  if (ROUTE_COMPLETION_PATHS[route]) {
    return ROUTE_COMPLETION_PATHS[route]
  }

  // Dynamic route match
  for (const entry of DYNAMIC_COMPLETION_PATHS) {
    if (route.startsWith(entry.prefix)) {
      return entry.path
    }
  }

  // Derive from page intelligence + task
  const goal = intel.completionGoals[0] ?? `${intel.pageName} reviewed and actioned`
  const firstGoal = intel.completionGoals[0] ?? 'Review the main content on this page'
  const secondGoal = intel.completionGoals[1] ?? 'Take action on flagged items'
  const remaining = intel.completionGoals.slice(2)

  return {
    goal,
    currentStep: task?.highestPriorityTask ?? `Review ${intel.pageName.toLowerCase()} content`,
    nextStep: firstGoal,
    remainingSteps: [secondGoal, ...remaining].filter(s => s !== firstGoal).slice(0, 3),
    completionCondition: intel.completionGoals.join('; ') || `${intel.pageName} fully reviewed`,
    summary: intel.completionGoals.slice(0, 3).join(' → '),
  }
}

function buildCurriculumCompletionPath(live: LivePageState): CompletionPath {
  const spineActive = live.curriculumSpineActive
  const missing = live.playersMissingCurriculumLevel

  if (spineActive === true && missing === 0) {
    return {
      goal: 'Active curriculum spine with all players assigned and assessment criteria defined',
      currentStep: 'Curriculum spine is active and all players are assigned',
      nextStep: 'Define assessment criteria per curriculum level',
      remainingSteps: ['Review coach-curriculum alignment'],
      completionCondition: 'Assessment criteria set per level; coach alignment reviewed',
      summary: 'Define criteria → review alignment',
    }
  }

  if (spineActive === true && missing !== null && missing > 0) {
    return {
      goal: 'Active curriculum spine with all players assigned and assessment criteria defined',
      currentStep: `Curriculum spine is active — ${missing} player${missing > 1 ? 's' : ''} still need a level assignment`,
      nextStep: `Assign curriculum levels to all ${missing} unassigned player${missing > 1 ? 's' : ''}`,
      remainingSteps: [
        'Define assessment criteria per level',
        'Review coach-curriculum alignment',
      ],
      completionCondition: 'All players assigned; assessment criteria set per level',
      summary: 'Assign players → define criteria → review alignment',
    }
  }

  // spineActive=false or null — start from the top
  return ROUTE_COMPLETION_PATHS['/director/curriculum']
}

function buildOnboardingCompletionPath(live: LivePageState): CompletionPath {
  if (live.onboardingComplete === true) {
    return {
      goal: 'Academy fully configured',
      currentStep: 'All 7 onboarding steps are complete',
      nextStep: 'Monitor curriculum quality and coach performance in daily operations',
      remainingSteps: [],
      completionCondition: 'Already complete — academy is in full operating mode',
      summary: 'Onboarding complete → daily operations',
    }
  }

  const progress = live.onboardingProgress

  // Map progress count to the step that is next
  const allSteps = [
    'Choose the Academy DNA model that describes your development philosophy',
    'Define your first curriculum level',
    'Create your first player group',
    'Invite your first coach',
    'Enroll your first player',
    'Complete placement for enrolled players',
    'Finalize academy configuration',
  ]

  const stepIndex = progress !== null ? Math.min(progress, allSteps.length - 1) : 0
  const currentLabel = progress !== null
    ? `Onboarding step ${progress + 1} of 7`
    : 'Begin onboarding — start with Academy DNA selection'

  return {
    goal: 'All 7 onboarding steps complete; academy fully configured',
    currentStep: currentLabel,
    nextStep: allSteps[stepIndex] ?? 'Finalize remaining onboarding steps',
    remainingSteps: allSteps.slice(stepIndex + 1, stepIndex + 4),
    completionCondition: 'All 7 steps marked complete; DNA, curriculum, and groups configured',
    summary: allSteps.slice(stepIndex, stepIndex + 3).join(' → '),
  }
}

/**
 * Format a CompletionPath as a short DONNA response fragment.
 * Used in Step 7.6 page-confusion responses.
 */
export function formatCompletionPathForResponse(path: CompletionPath): string {
  const remaining = path.remainingSteps.length
  const suffix = remaining > 0
    ? ` Then: ${path.remainingSteps.slice(0, 2).join(' → ')}.`
    : ''
  return `**Next step:** ${path.nextStep}.${suffix}`
}
