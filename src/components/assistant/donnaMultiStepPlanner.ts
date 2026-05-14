// Donna Multi-Step Planner — Sprint 286
// Pure TypeScript only. No DB, no Supabase, no async, no AI.
//
// Given a director intent string, returns a deterministic ordered plan
// of up to 3 Donna task steps that can be chained to accomplish the goal.
//
// Rules:
//   - Each step maps to an existing DonnaTaskId.
//   - Steps are ordered: prerequisite tasks come first.
//   - Only one plan is returned per intent (no branching).
//   - If the intent doesn't match a known multi-step pattern, returns a single-step plan
//     (or an empty plan if the intent is unrecognised).

import type { DonnaTaskId } from './donnaTaskContracts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DonnaMultiStepPlanStep {
  stepNumber: number
  taskId: DonnaTaskId
  label: string
  why: string
}

export interface DonnaMultiStepPlan {
  intent: string
  steps: DonnaMultiStepPlanStep[]
  summary: string
  requiresDirectorConfirmationBetweenSteps: boolean
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

interface MultiStepPattern {
  /** Phrases that trigger this pattern (lowercase, partial match) */
  triggers: string[]
  plan: Omit<DonnaMultiStepPlan, 'intent'>
}

const MULTI_STEP_PATTERNS: MultiStepPattern[] = [
  {
    triggers: [
      'prepare a session',
      'set up a session',
      'create and populate',
      'create session and populate',
      'create a full session',
    ],
    plan: {
      steps: [
        {
          stepNumber: 1,
          taskId: 'create_session',
          label: 'Create Session',
          why: 'Create the planned session shell with coach, group, and date.',
        },
        {
          stepNumber: 2,
          taskId: 'populate_session_from_template',
          label: 'Populate Session Blocks',
          why: 'Copy template blocks into the session created in step 1.',
        },
      ],
      summary:
        'Create a session, then populate it with blocks from a template. Each step requires your approval before proceeding.',
      requiresDirectorConfirmationBetweenSteps: true,
    },
  },
  {
    triggers: [
      'capture note and draft parent update',
      'note and parent update',
      'coach note then parent update',
      'observation and parent message',
    ],
    plan: {
      steps: [
        {
          stepNumber: 1,
          taskId: 'capture_coach_note',
          label: 'Capture Coach Note',
          why: 'Save the internal observation first before composing the parent update.',
        },
        {
          stepNumber: 2,
          taskId: 'draft_parent_update',
          label: 'Draft Parent Update',
          why: 'Compose a parent-safe update grounded in the note captured in step 1.',
        },
      ],
      summary:
        'Capture an internal coach note, then draft a parent update. Neither action is sent automatically — both require your approval.',
      requiresDirectorConfirmationBetweenSteps: true,
    },
  },
  {
    triggers: [
      'review level and draft parent',
      'level review then parent update',
      'check readiness and notify parent',
      'level readiness and parent message',
    ],
    plan: {
      steps: [
        {
          stepNumber: 1,
          taskId: 'review_level_readiness',
          label: 'Review Level Readiness',
          why: 'Build the evidence summary for level advancement before drafting the parent update.',
        },
        {
          stepNumber: 2,
          taskId: 'draft_parent_update',
          label: 'Draft Parent Update',
          why: 'Compose a parent-safe update based on the level readiness review.',
        },
      ],
      summary:
        'Review a player\'s level readiness, then draft a parent update. No level change or message is sent automatically.',
      requiresDirectorConfirmationBetweenSteps: true,
    },
  },
  {
    triggers: [
      'capture note and draft player note',
      'coach note and player note',
      'observation and player development note',
    ],
    plan: {
      steps: [
        {
          stepNumber: 1,
          taskId: 'capture_coach_note',
          label: 'Capture Coach Note',
          why: 'Save the internal observation first.',
        },
        {
          stepNumber: 2,
          taskId: 'draft_player_note',
          label: 'Draft Player Note',
          why: 'Create a player-facing development note based on the captured observation.',
        },
      ],
      summary:
        'Capture an internal coach note, then draft a development note for the player. Neither is published automatically.',
      requiresDirectorConfirmationBetweenSteps: true,
    },
  },
]

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Given a director intent string, return a multi-step plan if the intent
 * matches a known pattern. Returns null if no pattern matches.
 */
export function detectMultiStepIntent(text: string): DonnaMultiStepPlan | null {
  const lower = text.toLowerCase().trim()
  for (const pattern of MULTI_STEP_PATTERNS) {
    if (pattern.triggers.some(t => lower.includes(t))) {
      return {
        intent: text,
        ...pattern.plan,
      }
    }
  }
  return null
}

/**
 * Returns a human-readable summary of the plan for display.
 */
export function describePlan(plan: DonnaMultiStepPlan): string {
  const stepLabels = plan.steps.map(s => `${s.stepNumber}. ${s.label}`).join(' → ')
  return `${stepLabels} — ${plan.summary}`
}
