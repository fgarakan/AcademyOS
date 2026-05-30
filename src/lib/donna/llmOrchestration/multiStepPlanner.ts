// Sprint 985 — DONNA Multi-Step Planning V1
// Generates safe, director-approved multi-step workflow plans.
// Pure TypeScript — no DB, no API, no React, no mutations.
//
// Purpose:
//   Some director workflows require multiple steps in sequence.
//   DONNA should be able to outline the full plan before the director begins,
//   so they know what to expect and can choose to proceed.
//
// V1 supported workflows:
//   - onboard_new_player: place → assign curriculum → generate session → assign coach
//   - run_session_cycle: create from template → assign coach → review wrap-up → approve
//   - review_pending_queue: open queue → review each tab → approve/reject → clear queue
//   - update_curriculum: review current status → draft change → submit for review → approve
//
// Safety:
//   No step in a plan executes automatically. Plans are informational.
//   Director must take each step explicitly.

// ── Types ─────────────────────────────────────────────────────────────────────

export type WorkflowId =
  | 'onboard_new_player'
  | 'run_session_cycle'
  | 'review_pending_queue'
  | 'update_curriculum'
  | 'create_class_template'
  | 'assign_coach_to_session'

export type StepSafetyLevel = 'safe' | 'review_only' | 'approval_gated'

export interface WorkflowStep {
  stepNumber: number
  label: string
  description: string
  route: string
  targetFocusId?: string
  safetyLevel: StepSafetyLevel
  requiresApproval: boolean
  estimatedMinutes: number
}

export interface WorkflowPlan {
  id: WorkflowId
  title: string
  summary: string
  steps: WorkflowStep[]
  totalEstimatedMinutes: number
  requiresDirectorApprovalAt: number[] // step numbers requiring explicit approval
  safetyNote: string
}

// ── Workflow definitions ──────────────────────────────────────────────────────

const WORKFLOWS: Record<WorkflowId, WorkflowPlan> = {
  onboard_new_player: {
    id: 'onboard_new_player',
    title: 'Onboard New Player',
    summary: 'Add a player, assign curriculum level, and schedule their first session.',
    steps: [
      { stepNumber: 1, label: 'Add player', description: 'Go to Player Directory and add the new player record.', route: '/director/players/new', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 3 },
      { stepNumber: 2, label: 'Assign curriculum level', description: 'Open the player profile and assign a curriculum level from the Skill Path tab.', route: '/director/players', targetFocusId: 'player-list', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 2 },
      { stepNumber: 3, label: 'Create a session', description: 'Open a class template and generate a scheduled session for this player\'s group.', route: '/director/class-templates', targetFocusId: 'template-list', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 3 },
      { stepNumber: 4, label: 'Assign a coach', description: 'Confirm the coach assignment on the generated session.', route: '/director/sessions', targetFocusId: 'session-list', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 1 },
    ],
    totalEstimatedMinutes: 9,
    requiresDirectorApprovalAt: [],
    safetyNote: 'No step changes official records automatically. Each step requires your explicit action.',
  },

  run_session_cycle: {
    id: 'run_session_cycle',
    title: 'Run Session Cycle',
    summary: 'Create a session from a template, assign a coach, and review the wrap-up after the session.',
    steps: [
      { stepNumber: 1, label: 'Open class template', description: 'Select the relevant class template from the template library.', route: '/director/class-templates', targetFocusId: 'template-list', safetyLevel: 'safe', requiresApproval: false, estimatedMinutes: 2 },
      { stepNumber: 2, label: 'Generate session', description: 'Use "Generate Session" to create a scheduled session. Set date, time, and coach.', route: '/director/class-templates', targetFocusId: 'template-generate-session', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 3 },
      { stepNumber: 3, label: 'Review coach wrap-up', description: 'After the session, the coach submits a wrap-up. Open the Review Queue to review it.', route: '/director/review', targetFocusId: 'review-queue-primary', safetyLevel: 'approval_gated', requiresApproval: true, estimatedMinutes: 5 },
      { stepNumber: 4, label: 'Approve wrap-up', description: 'Approve the wrap-up to make coach observations official player evidence.', route: '/director/review', targetFocusId: 'review-queue-primary', safetyLevel: 'approval_gated', requiresApproval: true, estimatedMinutes: 2 },
    ],
    totalEstimatedMinutes: 12,
    requiresDirectorApprovalAt: [3, 4],
    safetyNote: 'Steps 3 and 4 require your explicit approval. Nothing becomes official player evidence without it.',
  },

  review_pending_queue: {
    id: 'review_pending_queue',
    title: 'Clear Review Queue',
    summary: 'Work through all pending review items — wrap-ups, attendance exceptions, and player signals.',
    steps: [
      { stepNumber: 1, label: 'Open Review Queue', description: 'Go to the Review Queue and check the "For Your Review" tab first.', route: '/director/review', targetFocusId: 'review-queue-primary', safetyLevel: 'safe', requiresApproval: false, estimatedMinutes: 1 },
      { stepNumber: 2, label: 'Review wrap-ups', description: 'Review each coach wrap-up — approve to make observations official, reject if inaccurate.', route: '/director/review', targetFocusId: 'review-queue-primary', safetyLevel: 'approval_gated', requiresApproval: true, estimatedMinutes: 10 },
      { stepNumber: 3, label: 'Review player signals', description: 'Check the "Player Signals" tab for player update proposals.', route: '/director/review', targetFocusId: 'review-queue-primary', safetyLevel: 'approval_gated', requiresApproval: true, estimatedMinutes: 5 },
      { stepNumber: 4, label: 'Review curriculum/session', description: 'Check the "Sessions & Curriculum" tab for session recaps and curriculum proposals.', route: '/director/review', targetFocusId: 'review-queue-primary', safetyLevel: 'approval_gated', requiresApproval: true, estimatedMinutes: 5 },
    ],
    totalEstimatedMinutes: 21,
    requiresDirectorApprovalAt: [2, 3, 4],
    safetyNote: 'Every approval decision is yours. Nothing is approved automatically.',
  },

  update_curriculum: {
    id: 'update_curriculum',
    title: 'Update Curriculum',
    summary: 'Review curriculum status, draft a change, and submit for review.',
    steps: [
      { stepNumber: 1, label: 'Review curriculum status', description: 'Open the Curriculum Builder and review the current level and content status.', route: '/director/curriculum', targetFocusId: 'curriculum-status', safetyLevel: 'safe', requiresApproval: false, estimatedMinutes: 3 },
      { stepNumber: 2, label: 'Identify gap or improvement', description: 'Use the level tree to identify which level needs a change.', route: '/director/curriculum', targetFocusId: 'curriculum-level-tree', safetyLevel: 'safe', requiresApproval: false, estimatedMinutes: 3 },
      { stepNumber: 3, label: 'Draft the change', description: 'Use DONNA or the curriculum editor to draft the proposed change.', route: '/director/curriculum', targetFocusId: 'curriculum-review-draft', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 5 },
      { stepNumber: 4, label: 'Submit for review', description: 'Submit the draft to the Review Queue. Nothing becomes live until you approve it.', route: '/director/review', targetFocusId: 'review-queue-primary', safetyLevel: 'approval_gated', requiresApproval: true, estimatedMinutes: 2 },
    ],
    totalEstimatedMinutes: 13,
    requiresDirectorApprovalAt: [4],
    safetyNote: 'Curriculum changes are drafts until you explicitly approve them. No change is published automatically.',
  },

  create_class_template: {
    id: 'create_class_template',
    title: 'Create Class Template',
    summary: 'Build a new class template with blocks, focus, and curriculum level.',
    steps: [
      { stepNumber: 1, label: 'Open Template Library', description: 'Go to Class Templates and click "Create Template".', route: '/director/class-templates', targetFocusId: 'create-template-button', safetyLevel: 'safe', requiresApproval: false, estimatedMinutes: 1 },
      { stepNumber: 2, label: 'Name and set focus', description: 'Give the template a name, assign a curriculum level, and describe the session goal.', route: '/director/class-templates', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 3 },
      { stepNumber: 3, label: 'Add blocks', description: 'Add session blocks (warm-up, technical, point play, match play) with durations.', route: '/director/class-templates', targetFocusId: 'class-template-block-list', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 5 },
      { stepNumber: 4, label: 'Review and apply lesson plan', description: 'Review the generated lesson plan and apply it to the template.', route: '/director/class-templates', targetFocusId: 'class-template-review-draft', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 3 },
    ],
    totalEstimatedMinutes: 12,
    requiresDirectorApprovalAt: [],
    safetyNote: 'Template creation does not affect any sessions. Sessions must be generated separately.',
  },

  assign_coach_to_session: {
    id: 'assign_coach_to_session',
    title: 'Assign Coach to Session',
    summary: 'Find the session and confirm the coach assignment.',
    steps: [
      { stepNumber: 1, label: 'Open Sessions list', description: 'Go to the Sessions page and find the session that needs a coach assigned.', route: '/director/sessions', targetFocusId: 'session-list', safetyLevel: 'safe', requiresApproval: false, estimatedMinutes: 1 },
      { stepNumber: 2, label: 'Open session detail', description: 'Click on the session to open the detail view.', route: '/director/sessions', safetyLevel: 'safe', requiresApproval: false, estimatedMinutes: 1 },
      { stepNumber: 3, label: 'Confirm coach assignment', description: 'Review the assigned coach in the session header. Coach assignment was set at session creation time.', route: '/director/sessions', targetFocusId: 'session-coach-assignment', safetyLevel: 'review_only', requiresApproval: false, estimatedMinutes: 1 },
    ],
    totalEstimatedMinutes: 3,
    requiresDirectorApprovalAt: [],
    safetyNote: 'Coach assignment is set at session creation time. In-session reassignment is a V2 feature.',
  },
}

// ── Plan retrieval ────────────────────────────────────────────────────────────

export function getWorkflowPlan(id: WorkflowId): WorkflowPlan {
  return WORKFLOWS[id]
}

export function getAllWorkflowPlans(): WorkflowPlan[] {
  return Object.values(WORKFLOWS)
}

/** Detect if user input matches a workflow intent. */
const WORKFLOW_PHRASES: Array<{ id: WorkflowId; phrases: string[] }> = [
  { id: 'onboard_new_player', phrases: ['onboard', 'add a new player', 'new player', 'enroll'] },
  { id: 'run_session_cycle', phrases: ['session cycle', 'run a session', 'create and run session'] },
  { id: 'review_pending_queue', phrases: ['clear the queue', 'work through the queue', 'review all pending'] },
  { id: 'update_curriculum', phrases: ['update curriculum', 'change curriculum', 'edit curriculum'] },
  { id: 'create_class_template', phrases: ['create template', 'new template', 'build template'] },
  { id: 'assign_coach_to_session', phrases: ['assign coach', 'coach assignment', 'who is coaching'] },
]

export function detectWorkflowIntent(text: string): WorkflowId | null {
  const lower = text.toLowerCase()
  for (const { id, phrases } of WORKFLOW_PHRASES) {
    if (phrases.some(p => lower.includes(p))) return id
  }
  return null
}

/** Format a workflow plan as a concise step-by-step DONNA response. */
export function formatWorkflowPlan(plan: WorkflowPlan): string {
  const lines = [
    `**${plan.title}** (est. ${plan.totalEstimatedMinutes} min)`,
    plan.summary,
    '',
  ]
  plan.steps.forEach(step => {
    const approvalFlag = step.requiresApproval ? ' ⚑ approval required' : ''
    lines.push(`${step.stepNumber}. **${step.label}**${approvalFlag} — ${step.description}`)
  })
  lines.push('')
  lines.push(plan.safetyNote)
  return lines.join('\n')
}
