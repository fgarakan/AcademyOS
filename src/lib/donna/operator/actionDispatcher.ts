// DONNA Operator Action Dispatcher V1
// Clean, director-experience-first dispatcher for all 13 DONNA UI operator action types.
// Pure TypeScript — no DB calls, no mutations, no side effects.
// Returns structured results that components act on — DONNA never directly mutates state.
//
// Design philosophy: optimize for director experience, not architecture completeness.
// Every result tells the component exactly what to do next, nothing more.

import { setDonnaFocusTarget, type DonnaFocusTarget } from '@/lib/donna/donnaFocusTarget'

// ─── Action types ─────────────────────────────────────────────────────────────

export type OperatorActionType =
  | 'highlight_element'
  | 'scroll_to_element'
  | 'navigate'
  | 'open_player'
  | 'open_assessment'
  | 'open_review'
  | 'apply_filter'
  | 'apply_search'
  | 'open_tab'
  | 'open_drawer'
  | 'open_modal'
  | 'prepare_draft'
  | 'request_approval'

// ─── Action result ────────────────────────────────────────────────────────────

export interface OperatorActionResult {
  success:    boolean
  action:     OperatorActionType
  /** What DONNA says to the director after performing this action */
  message:    string
  /** The route to navigate to (for navigate/open_* actions) */
  route:      string | null
  /** The focus target to highlight after navigation */
  focusTarget: DonnaFocusTarget | null
  /** Filter params for apply_filter results */
  filterParams: Record<string, string> | null
  /** The next action DONNA recommends */
  nextAction: string | null
  /** Whether director approval is required before proceeding */
  requiresApproval: boolean
  /** If failed, why */
  reason:     string | null
}

// ─── Attention queue filter mapping ─────────────────────────────────────────

export const ATTENTION_FILTER_LABELS: Record<string, string> = {
  reassessment:   'reassessment',
  placements:     'placements',
  onboarding:     'onboarding',
  players:        'players',
  'parent-updates': 'parent-updates',
  coach:          'coach',
  all:            'all',
}

// ─── Intent → action mapping ──────────────────────────────────────────────────

const ATTENTION_QUEUE_INTENTS: Array<{
  pattern: RegExp
  filter:  string
  label:   string
  focusId: string
  message: string
}> = [
  {
    pattern: /reassessment|overdue (assessment|player)|who.{0,20}(needs?|need) reassess/i,
    filter:  'reassessment',
    label:   'Reassessment Due',
    focusId: 'attention-items-list',
    message: 'Filtered the Attention Queue to show players due for reassessment.',
  },
  {
    pattern: /placement (review|needed|pending)|pending placement|who.{0,20}needs? placement/i,
    filter:  'placements',
    label:   'Placement Reviews',
    focusId: 'attention-items-list',
    message: 'Filtered the Attention Queue to show pending placement reviews.',
  },
  {
    pattern: /level.?readiness|ready (to|for) (advance|move up)|readiness review/i,
    filter:  'players',
    label:   'Level Readiness',
    focusId: 'attention-items-list',
    message: 'Filtered the Attention Queue to show level readiness candidates.',
  },
  {
    pattern: /onboarding|incomplete|pending onboard/i,
    filter:  'onboarding',
    label:   'Onboarding',
    focusId: 'attention-items-list',
    message: 'Filtered the Attention Queue to show incomplete onboarding.',
  },
  {
    pattern: /parent.?(update|communication)|missing parent/i,
    filter:  'parent-updates',
    label:   'Parent Updates',
    focusId: 'attention-items-list',
    message: 'Filtered the Attention Queue to show pending parent updates.',
  },
  {
    pattern: /coach.?(follow.?up|recap|wrap.?up)|missing.?wrap/i,
    filter:  'coach',
    label:   'Coach Follow-Up',
    focusId: 'attention-items-list',
    message: 'Filtered the Attention Queue to show coach follow-ups.',
  },
]

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export interface DispatchInput {
  action:    OperatorActionType
  text?:     string          // Original director text for intent extraction
  targetId?: string          // data-donna-focus-id target
  route?:    string          // Explicit route override
  playerId?: string          // For open_player
  filter?:   string          // For apply_filter
  tabName?:  string          // For open_tab
  label?:    string          // Human-readable label for focus target
  reason?:   string          // DONNA's reason for pointing here
}

function ok(
  action: OperatorActionType,
  message: string,
  overrides: Partial<OperatorActionResult> = {},
): OperatorActionResult {
  return {
    success: true,
    action,
    message,
    route: null,
    focusTarget: null,
    filterParams: null,
    nextAction: null,
    requiresApproval: false,
    reason: null,
    ...overrides,
  }
}

function fail(action: OperatorActionType, reason: string): OperatorActionResult {
  return {
    success: false,
    action,
    message: reason,
    route: null,
    focusTarget: null,
    filterParams: null,
    nextAction: null,
    requiresApproval: false,
    reason,
  }
}

export function dispatch(input: DispatchInput): OperatorActionResult {
  switch (input.action) {

    case 'highlight_element': {
      if (!input.targetId) return fail('highlight_element', 'No target ID provided.')
      const focusTarget: DonnaFocusTarget = {
        route:          input.route ?? '',
        targetId:       input.targetId,
        label:          input.label ?? 'DONNA is pointing here',
        reason:         input.reason,
        highlightStyle: 'teal-glow',
      }
      return ok('highlight_element', input.label ? `Highlighting: ${input.label}` : 'Highlighting the relevant section.', { focusTarget })
    }

    case 'scroll_to_element': {
      if (!input.targetId) return fail('scroll_to_element', 'No target ID provided.')
      const focusTarget: DonnaFocusTarget = {
        route:    input.route ?? '',
        targetId: input.targetId,
        label:    input.label ?? 'Scrolling to section',
        reason:   input.reason,
      }
      return ok('scroll_to_element', `Scrolling to: ${input.label ?? 'the relevant section'}.`, { focusTarget })
    }

    case 'navigate': {
      if (!input.route) return fail('navigate', 'No route provided.')
      const focusTarget = input.targetId ? {
        route:    input.route,
        targetId: input.targetId,
        label:    input.label ?? 'Key section',
        reason:   input.reason,
        highlightStyle: 'teal-glow' as const,
      } : null
      return ok('navigate', `Navigating to ${input.label ?? input.route}.`, { route: input.route, focusTarget })
    }

    case 'open_player': {
      if (!input.playerId) return fail('open_player', 'No player ID provided.')
      const route = `/director/players/${input.playerId}`
      const focusTarget: DonnaFocusTarget = {
        route,
        targetId: 'player-profile-header',
        label:    'Player Profile',
        reason:   'Opening player profile',
      }
      return ok('open_player', `Opening player profile.`, { route, focusTarget })
    }

    case 'open_assessment': {
      const route = input.playerId
        ? `/director/players/${input.playerId}`
        : '/director/players'
      const focusTarget: DonnaFocusTarget = {
        route,
        targetId: 'player-assessments-section',
        label:    'Assessments',
        reason:   'Opening assessment section',
      }
      return ok('open_assessment', 'Opening the Assessments section.', { route, focusTarget })
    }

    case 'open_review': {
      const route = '/director/review'
      const focusTarget: DonnaFocusTarget = {
        route,
        targetId: 'review-queue-primary',
        label:    'Review Queue',
        reason:   'Opening review center',
      }
      return ok('open_review', 'Opening the Review Center.', { route, focusTarget, nextAction: 'Review pending items and approve or reject.' })
    }

    case 'apply_filter': {
      const text = input.text ?? ''

      // Check attention queue intent patterns
      for (const intent of ATTENTION_QUEUE_INTENTS) {
        if (intent.pattern.test(text) || input.filter === intent.filter) {
          const route = `/director/attention?filter=${intent.filter}`
          const focusTarget: DonnaFocusTarget = {
            route: '/director/attention',
            targetId: intent.focusId,
            label:    intent.label,
            reason:   `Filtered to: ${intent.label}`,
          }
          return ok('apply_filter', intent.message, {
            route,
            focusTarget,
            filterParams: { filter: intent.filter },
          })
        }
      }

      // Generic filter
      if (input.filter) {
        return ok('apply_filter', `Applying filter: ${input.filter}.`, {
          filterParams: { filter: input.filter },
          nextAction: 'Review filtered results.',
        })
      }

      return fail('apply_filter', 'Could not determine which filter to apply.')
    }

    case 'apply_search': {
      return ok('apply_search', `Searching for: ${input.text ?? '...'}`, {
        filterParams: { q: input.text ?? '' },
      })
    }

    case 'open_tab': {
      if (!input.tabName) return fail('open_tab', 'No tab name provided.')
      return ok('open_tab', `Opening the ${input.tabName} tab.`, {
        filterParams: { tab: input.tabName },
        focusTarget: input.targetId ? {
          route:    input.route ?? '',
          targetId: input.targetId,
          label:    input.tabName,
          reason:   input.reason,
        } : null,
      })
    }

    case 'open_drawer': {
      return ok('open_drawer', `Opening ${input.label ?? 'drawer'}.`, {
        filterParams: { drawer: input.targetId ?? '' },
      })
    }

    case 'open_modal': {
      return ok('open_modal', `Opening ${input.label ?? 'modal'}.`, {
        filterParams: { modal: input.targetId ?? '' },
      })
    }

    case 'prepare_draft': {
      return ok('prepare_draft', `Preparing draft: ${input.label ?? 'curriculum change'}. You will need to approve this before anything is applied.`, {
        requiresApproval: true,
        nextAction: 'Review the draft in the Review Center and approve or reject.',
      })
    }

    case 'request_approval': {
      return ok('request_approval', 'Routing to the Review Center for your approval. Nothing is applied until you approve.', {
        route: '/director/review',
        requiresApproval: true,
        nextAction: 'Approve or reject the draft in the Review Center.',
      })
    }

    default:
      return fail(input.action, 'Unknown action type.')
  }
}

// ─── Multi-step workflow: navigate + highlight ────────────────────────────────

export interface WorkflowStep {
  route:     string
  focusId:   string
  label:     string
  message:   string
  reason?:   string
}

export function buildNavigateAndHighlightResult(step: WorkflowStep): OperatorActionResult {
  const focusTarget: DonnaFocusTarget = {
    route:         step.route,
    targetId:      step.focusId,
    label:         step.label,
    reason:        step.reason,
    highlightStyle: 'teal-glow',
  }
  return ok('navigate', step.message, {
    route: step.route,
    focusTarget,
  })
}

// ─── Convenience: "Take me to the attention queue" workflow ───────────────────

export function buildAttentionQueueStep(text: string): WorkflowStep {
  for (const intent of ATTENTION_QUEUE_INTENTS) {
    if (intent.pattern.test(text)) {
      return {
        route:   `/director/attention?filter=${intent.filter}`,
        focusId: intent.focusId,
        label:   intent.label,
        message: intent.message,
        reason:  `DONNA filtered to: ${intent.label}`,
      }
    }
  }
  return {
    route:   '/director/attention',
    focusId: 'attention-items-list',
    label:   'Attention Queue',
    message: 'Opening the Attention Queue.',
  }
}

// ─── Convenience: "Open Jamie's profile" workflow ────────────────────────────

export function buildOpenPlayerStep(playerId: string, focusId?: string): WorkflowStep {
  return {
    route:   `/director/players/${playerId}`,
    focusId: focusId ?? 'player-profile-header',
    label:   'Player Profile',
    message: 'Opening the player profile.',
  }
}

// ─── Convenience: "Show me why Jamie is not ready" workflow ──────────────────

export function buildReadinessWorkflowSteps(playerId: string): WorkflowStep[] {
  return [
    {
      route:   `/director/players/${playerId}`,
      focusId: 'player-readiness-card',
      label:   'Level Readiness',
      message: 'Opening the player profile and highlighting the Level Readiness card.',
      reason:  'This shows why the player is or isn\'t ready to advance.',
    },
    {
      route:   `/director/players/${playerId}`,
      focusId: 'player-assessments-section',
      label:   'Assessment Evidence',
      message: 'Scrolling to the assessment evidence.',
      reason:  'Evidence records explain the readiness signal.',
    },
  ]
}

// ─── Convenience: "What should Jamie work on?" workflow ──────────────────────

export function buildPrioritiesWorkflowStep(playerId: string): WorkflowStep {
  return {
    route:   `/director/players/${playerId}`,
    focusId: 'player-priorities-card',
    label:   'Development Priorities',
    message: 'Highlighting the Development Priorities card — this shows the top focus areas based on evidence.',
    reason:  'Evidence-based priority ranking from assessment and readiness data.',
  }
}

// ─── Convenience: "Help me improve [level]" workflow ────────────────────────

export function buildCurriculumImproveStep(levelKey: string, levelLabel: string): WorkflowStep {
  return {
    route:   `/director/curriculum?improve=${levelKey}`,
    focusId: 'donna-curriculum-context',
    label:   `Curriculum: ${levelLabel}`,
    message: `Opening the Curriculum page with DONNA's analysis of ${levelLabel}.`,
    reason:  'DONNA will summarize the current curriculum state, evidence signals, and improvement suggestions.',
  }
}
