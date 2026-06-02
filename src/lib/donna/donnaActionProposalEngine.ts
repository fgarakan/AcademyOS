// DONNA Action Proposal Engine V1
//
// For each intent, defines what actions DONNA can propose.
// Actions are classified by risk level:
//   - low:    navigate, filter, show — execute immediately
//   - medium: create draft — creates proposed_action, routes to review queue
//   - high:   official mutation — always requires explicit director approval
//
// Rules (from DONNA_UI_CONSTITUTION.md):
//   1. Low-risk actions execute immediately (navigation, display)
//   2. Medium-risk creates a draft in the review queue
//   3. High-risk ALWAYS routes to Approvals — DONNA cannot execute alone
//
// Pure TypeScript — no DB, no mutations, no side effects.

import type { DonnaIntent } from './donnaGlobalIntentRouter'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionRisk = 'low' | 'medium' | 'high'
export type ActionType =
  | 'navigate'          // go to a page
  | 'filter'            // filter/search existing list
  | 'expand'            // expand detail section
  | 'create_draft'      // create a proposed_action draft
  | 'start_workflow'    // open a form/flow
  | 'approval_required' // routes to approvals — director must approve

export interface ProposedAction {
  id: string
  label: string
  type: ActionType
  risk: ActionRisk
  href?: string
  /** For create_draft actions: the target_module to create */
  draftModule?: string
  /** Human-readable description of what happens */
  description: string
  /** Whether approval in the review queue is needed before effect */
  requiresApproval: boolean
}

// ── Action library ────────────────────────────────────────────────────────────

const ACTIONS: Record<string, ProposedAction> = {
  go_to_approvals: {
    id: 'go_to_approvals',
    label: 'Open Approvals',
    type: 'navigate',
    risk: 'low',
    href: '/director/review',
    description: 'Go to the Approvals queue',
    requiresApproval: false,
  },
  go_to_players: {
    id: 'go_to_players',
    label: 'View Players',
    type: 'navigate',
    risk: 'low',
    href: '/director/players',
    description: 'Go to the Players directory',
    requiresApproval: false,
  },
  go_to_assessments: {
    id: 'go_to_assessments',
    label: 'View Assessments',
    type: 'navigate',
    risk: 'low',
    href: '/director/assessments',
    description: 'Go to the Assessments section',
    requiresApproval: false,
  },
  go_to_player_missions_tab: {
    id: 'go_to_player_missions_tab',
    label: 'View Missions',
    type: 'navigate',
    risk: 'low',
    href: '?tab=missions',  // relative — resolved by caller
    description: "Open the player's Missions tab",
    requiresApproval: false,
  },
  go_to_player_development_tab: {
    id: 'go_to_player_development_tab',
    label: 'View Development Plan',
    type: 'navigate',
    risk: 'low',
    href: '?tab=development',
    description: "Open the player's Development tab",
    requiresApproval: false,
  },
  go_to_player_assessments_tab: {
    id: 'go_to_player_assessments_tab',
    label: 'View Assessments',
    type: 'navigate',
    risk: 'low',
    href: '?tab=assessments',
    description: "Open the player's Assessments tab",
    requiresApproval: false,
  },
  start_assessment: {
    id: 'start_assessment',
    label: 'Start Reassessment',
    type: 'start_workflow',
    risk: 'medium',
    description: 'Begin a new assessment for this player',
    requiresApproval: false,
    draftModule: 'assessment_event',
  },
  draft_parent_update: {
    id: 'draft_parent_update',
    label: 'Draft Parent Update',
    type: 'create_draft',
    risk: 'medium',
    description: 'Create a parent-safe update draft for review before publishing',
    requiresApproval: true,
    draftModule: 'parent_communication',
  },
  assign_mission: {
    id: 'assign_mission',
    label: 'Assign Mission',
    type: 'create_draft',
    risk: 'medium',
    description: 'Create a mission assignment for this player',
    requiresApproval: false,
    draftModule: 'mission_assignment',
  },
  create_level_review: {
    id: 'create_level_review',
    label: 'Start Level Review',
    type: 'create_draft',
    risk: 'high',
    href: '/director/review',
    description: 'Initiate a level readiness review — requires director approval before any movement',
    requiresApproval: true,
    draftModule: 'level_review',
  },
  review_missions: {
    id: 'review_missions',
    label: 'Review Pending Missions',
    type: 'navigate',
    risk: 'low',
    href: '?tab=missions',
    description: 'Review and approve pending mission assignments',
    requiresApproval: false,
  },
  review_placements: {
    id: 'review_placements',
    label: 'Review Placements',
    type: 'navigate',
    risk: 'low',
    href: '/director/review?tab=needs-approval',
    description: 'Go to pending placement decisions',
    requiresApproval: false,
  },
  ask_donna_why: {
    id: 'ask_donna_why',
    label: 'Ask DONNA to explain',
    type: 'expand',
    risk: 'low',
    description: 'Ask DONNA for a full explanation of this recommendation',
    requiresApproval: false,
  },
  go_to_add_player: {
    id: 'go_to_add_player',
    label: 'Add New Player',
    type: 'navigate',
    risk: 'low',
    href: '/director/players/new',
    description: 'Open the Add New Player form',
    requiresApproval: false,
  },
  go_to_onboarding_review: {
    id: 'go_to_onboarding_review',
    label: 'Onboarding Dashboard',
    type: 'navigate',
    risk: 'low',
    href: '/director/players/onboarding-review',
    description: 'View pending and active player onboarding status',
    requiresApproval: false,
  },
}

// ── Intent → Actions mapping ──────────────────────────────────────────────────

const INTENT_ACTIONS: Record<string, string[]> = {
  summarize_player:              ['go_to_player_development_tab', 'go_to_player_assessments_tab', 'draft_parent_update'],
  player_readiness:              ['go_to_player_missions_tab', 'go_to_player_assessments_tab', 'start_assessment', 'create_level_review'],
  player_blockers:               ['start_assessment', 'assign_mission', 'go_to_player_missions_tab'],
  player_progress:               ['go_to_player_assessments_tab', 'go_to_player_development_tab'],
  player_missions:               ['review_missions', 'assign_mission'],
  player_parent_summary:         ['draft_parent_update', 'go_to_approvals'],
  players_needing_attention:     ['go_to_players', 'go_to_approvals'],
  stalled_players:               ['go_to_players', 'start_assessment'],
  overdue_assessments:           ['go_to_assessments', 'start_assessment'],
  due_assessments:               ['go_to_assessments', 'start_assessment'],
  submitted_assessments:         ['go_to_approvals'],
  start_assessment:              ['start_assessment'],
  compare_assessments:           ['go_to_player_assessments_tab'],
  explain_placement_recommendation: ['go_to_approvals', 'ask_donna_why'],
  pending_placements:            ['review_placements'],
  placement_overrides:           ['review_placements'],
  level_review_candidates:       ['go_to_players', 'create_level_review'],
  explain_level_blockers:        ['start_assessment', 'assign_mission', 'create_level_review'],
  create_level_readiness_review: ['create_level_review'],
  today_sessions:                ['go_to_approvals'],
  coach_watch_fors:              ['go_to_player_development_tab'],
  missing_wrapups:               ['go_to_approvals'],
  coach_assessment_submissions:  ['go_to_assessments'],
  pending_parent_updates:        ['go_to_approvals'],
  draft_parent_update:           ['draft_parent_update'],
  explain_parent_progress:       ['go_to_player_development_tab'],
  academy_attention_today:       ['go_to_approvals', 'go_to_players'],
  overloaded_groups:             ['go_to_players'],
  curriculum_gaps:               ['go_to_players'],
  missing_data:                  ['go_to_players', 'start_assessment'],
  go_to_approvals:               ['go_to_approvals'],
  go_to_assessments:             ['go_to_assessments'],
  assign_mission:                ['assign_mission'],
  add_player:                    ['go_to_add_player'],
  resume_onboarding:             ['go_to_onboarding_review', 'go_to_add_player'],
  freeform_question:             ['go_to_approvals', 'go_to_players'],
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get proposed actions for a given intent.
 * Max 3 actions returned (highest priority first).
 */
export function getProposedActions(
  intent: DonnaIntent,
  context?: { playerId?: string | null },
): ProposedAction[] {
  const actionIds = INTENT_ACTIONS[intent] ?? INTENT_ACTIONS['freeform_question']

  return actionIds
    .slice(0, 3)
    .map(id => {
      const action = ACTIONS[id]
      if (!action) return null

      // Resolve relative hrefs for player-specific actions
      if (context?.playerId && action.href?.startsWith('?')) {
        return {
          ...action,
          href: `/director/players/${context.playerId}${action.href}`,
        }
      }

      return action
    })
    .filter((a): a is ProposedAction => a !== null)
}

/**
 * Classify overall risk for a list of proposed actions.
 * Returns the highest risk level present.
 */
export function getMaxRisk(actions: ProposedAction[]): ActionRisk {
  if (actions.some(a => a.risk === 'high'))   return 'high'
  if (actions.some(a => a.risk === 'medium')) return 'medium'
  return 'low'
}
