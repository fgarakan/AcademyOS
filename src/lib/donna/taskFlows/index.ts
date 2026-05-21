// Sprint 467 — DONNA Multi-Turn Task Flows V1
// Typed task flow definitions for DONNA-guided academy tasks.
// Each flow has a goal, steps, required clarifications, and an output type.
// Pure types/constants — no execution, no DB.

// ── Task flow types ────────────────────────────────────────────────────────────

export type DonnaTaskFlowId =
  | 'create_group'
  | 'build_session_template'
  | 'find_players_needing_reset'
  | 'draft_parent_updates'
  | 'add_curriculum_idea'
  | 'create_badge'
  | 'create_mission'
  | 'schedule_session'
  | 'review_player_progress'
  | 'generate_priorities'

export type TaskFlowStep = {
  id: string
  prompt: string
  type: 'choice' | 'text' | 'confirmation' | 'data_fetch'
  isOptional: boolean
  hint?: string
}

export interface DonnaTaskFlow {
  id: DonnaTaskFlowId
  label: string
  description: string
  roles: ('academy_director' | 'head_coach' | 'coach')[]
  estimatedTurns: number
  requiresApproval: boolean
  outputType: string
  steps: TaskFlowStep[]
}

// ── Task flow definitions ─────────────────────────────────────────────────────

export const DONNA_TASK_FLOWS: Record<DonnaTaskFlowId, DonnaTaskFlow> = {
  create_group: {
    id: 'create_group',
    label: 'Create a training group',
    description: 'DONNA gathers group details and creates a draft for director approval.',
    roles: ['academy_director'],
    estimatedTurns: 4,
    requiresApproval: true,
    outputType: 'proposed_action:create_group',
    steps: [
      { id: 'name', prompt: 'What should the group be called?', type: 'text', isOptional: false },
      { id: 'level', prompt: 'Which curriculum level is this group for?', type: 'choice', isOptional: false, hint: 'e.g. Green 2, Orange 1' },
      { id: 'coach', prompt: 'Who will lead coach this group?', type: 'choice', isOptional: false },
      { id: 'confirm', prompt: 'Ready to submit for director approval?', type: 'confirmation', isOptional: false },
    ],
  },
  build_session_template: {
    id: 'build_session_template',
    label: 'Build a session template',
    description: 'DONNA creates a curriculum-aligned session template draft.',
    roles: ['academy_director', 'head_coach'],
    estimatedTurns: 5,
    requiresApproval: true,
    outputType: 'template_draft',
    steps: [
      { id: 'name', prompt: 'What should this template be called?', type: 'text', isOptional: false },
      { id: 'level', prompt: 'Which curriculum level is it for?', type: 'choice', isOptional: false },
      { id: 'duration', prompt: 'How long is the session? (e.g. 60 min, 90 min)', type: 'text', isOptional: true },
      { id: 'focus', prompt: 'What is the main focus? (e.g. serves, footwork, match play)', type: 'text', isOptional: false },
      { id: 'confirm', prompt: 'Create this template draft?', type: 'confirmation', isOptional: false },
    ],
  },
  find_players_needing_reset: {
    id: 'find_players_needing_reset',
    label: 'Find players needing reset training',
    description: 'DONNA surfaces players with stalled progress or return-to-play flags.',
    roles: ['academy_director', 'head_coach', 'coach'],
    estimatedTurns: 2,
    requiresApproval: false,
    outputType: 'player_list',
    steps: [
      { id: 'scope', prompt: 'Should I look at all players or a specific group?', type: 'choice', isOptional: false },
      { id: 'reason', prompt: 'What type of reset? (injury, stall, confidence, other)', type: 'choice', isOptional: true },
    ],
  },
  draft_parent_updates: {
    id: 'draft_parent_updates',
    label: 'Draft parent updates',
    description: 'DONNA drafts parent-safe summaries for players with no recent update.',
    roles: ['academy_director', 'head_coach'],
    estimatedTurns: 3,
    requiresApproval: true,
    outputType: 'parent_summary_draft',
    steps: [
      { id: 'scope', prompt: 'Should I draft for all players or a specific group?', type: 'choice', isOptional: false },
      { id: 'tone', prompt: 'Should the tone be encouraging, factual, or both?', type: 'choice', isOptional: true },
      { id: 'confirm', prompt: 'Ready to generate drafts for director review?', type: 'confirmation', isOptional: false },
    ],
  },
  add_curriculum_idea: {
    id: 'add_curriculum_idea',
    label: 'Add a curriculum idea',
    description: 'DONNA classifies and drafts a curriculum idea for director review.',
    roles: ['academy_director', 'head_coach', 'coach'],
    estimatedTurns: 3,
    requiresApproval: true,
    outputType: 'curriculum_draft',
    steps: [
      { id: 'idea', prompt: 'What is the curriculum idea? Describe it in any way you like.', type: 'text', isOptional: false },
      { id: 'level', prompt: 'Which level or pathway is this for? (or I can suggest based on the idea)', type: 'text', isOptional: true },
      { id: 'confirm', prompt: 'Submit this idea for director review?', type: 'confirmation', isOptional: false },
    ],
  },
  create_badge: {
    id: 'create_badge',
    label: 'Create a badge from a requirement',
    description: 'DONNA creates a badge draft linked to a curriculum requirement.',
    roles: ['academy_director'],
    estimatedTurns: 4,
    requiresApproval: true,
    outputType: 'badge_draft',
    steps: [
      { id: 'requirement', prompt: 'Which requirement should this badge be based on?', type: 'choice', isOptional: false },
      { id: 'name', prompt: 'What should the badge be called?', type: 'text', isOptional: false },
      { id: 'player_facing', prompt: 'How should this be described to players?', type: 'text', isOptional: true },
      { id: 'confirm', prompt: 'Create this badge draft?', type: 'confirmation', isOptional: false },
    ],
  },
  create_mission: {
    id: 'create_mission',
    label: 'Create a mission',
    description: 'DONNA creates a player mission linked to curriculum and development goals.',
    roles: ['academy_director', 'head_coach'],
    estimatedTurns: 4,
    requiresApproval: true,
    outputType: 'mission_draft',
    steps: [
      { id: 'category', prompt: 'What category? (skill, mental performance, competition, fitness)', type: 'choice', isOptional: false },
      { id: 'name', prompt: 'What should the mission be called?', type: 'text', isOptional: false },
      { id: 'player_description', prompt: 'How would you describe it to a player?', type: 'text', isOptional: false },
      { id: 'confirm', prompt: 'Submit this mission draft for review?', type: 'confirmation', isOptional: false },
    ],
  },
  schedule_session: {
    id: 'schedule_session',
    label: 'Schedule a session',
    description: 'DONNA collects session details and creates a draft.',
    roles: ['academy_director', 'head_coach'],
    estimatedTurns: 4,
    requiresApproval: true,
    outputType: 'proposed_action:create_session',
    steps: [
      { id: 'group', prompt: 'Which group is this session for?', type: 'choice', isOptional: false },
      { id: 'date', prompt: 'What date and time?', type: 'text', isOptional: false },
      { id: 'template', prompt: 'Should I use a template? (optional)', type: 'choice', isOptional: true },
      { id: 'confirm', prompt: 'Create this session draft?', type: 'confirmation', isOptional: false },
    ],
  },
  review_player_progress: {
    id: 'review_player_progress',
    label: 'Review player progress',
    description: 'DONNA summarizes a player\'s recent progress and surfaces action items.',
    roles: ['academy_director', 'head_coach', 'coach'],
    estimatedTurns: 2,
    requiresApproval: false,
    outputType: 'player_progress_summary',
    steps: [
      { id: 'player', prompt: 'Which player should I review?', type: 'text', isOptional: false },
      { id: 'scope', prompt: 'Last 2 weeks, 4 weeks, or since last assessment?', type: 'choice', isOptional: true },
    ],
  },
  generate_priorities: {
    id: 'generate_priorities',
    label: 'Generate player priorities',
    description: 'DONNA suggests development priorities for players based on signals and curriculum gaps.',
    roles: ['academy_director', 'head_coach'],
    estimatedTurns: 3,
    requiresApproval: true,
    outputType: 'priority_draft_set',
    steps: [
      { id: 'scope', prompt: 'Generate for all players or a specific group?', type: 'choice', isOptional: false },
      { id: 'filter', prompt: 'Focus on: all, high risk, or players with no priorities?', type: 'choice', isOptional: true },
      { id: 'confirm', prompt: 'Generate priority drafts for director review?', type: 'confirmation', isOptional: false },
    ],
  },
}

// ── Helper: get flows for role ────────────────────────────────────────────────

export type AcademyRole = 'academy_director' | 'head_coach' | 'coach'

export function getTaskFlowsForRole(role: AcademyRole): DonnaTaskFlow[] {
  return Object.values(DONNA_TASK_FLOWS).filter(f => f.roles.includes(role))
}

export function getTaskFlow(id: DonnaTaskFlowId): DonnaTaskFlow {
  return DONNA_TASK_FLOWS[id]
}
