// Sprint 316 — Donna Workflow Registry V1
// Pure TypeScript. No DB, no API, no async, no React.
//
// Each WorkflowDefinition describes a complete Donna-guided workflow:
// what triggers it, what it collects, what requires director approval,
// and what can never be done by voice alone.
//
// Registry is the source of truth for donnaConversationController.ts (Phase 6).

import type { WorkflowId } from './donnaIntentRouter'
import type { DonnaTaskId } from './donnaTaskContracts'

// ── Workflow definition ────────────────────────────────────────────────────────

export interface WorkflowStep {
  /** Display order (1-indexed) */
  stepNumber: number
  /** Human label shown in the step indicator */
  label: string
  /** Which task this step executes — null for informational steps */
  taskId: DonnaTaskId | null
  /** Whether director must click an on-screen button before this step proceeds */
  requiresApprovalGate: boolean
}

export interface WorkflowDefinition {
  workflowId: WorkflowId
  label: string
  description: string
  /** The primary task this workflow is built around */
  primaryTaskId: DonnaTaskId | null
  /** Phrases that trigger this workflow (lowercase, partial match) */
  entryPhrases: readonly string[]
  /** Ordered steps — single-step workflows have one entry */
  steps: WorkflowStep[]
  /** True when the workflow will eventually write to DB */
  requiresDirectorApproval: boolean
  /**
   * Actions that must NEVER happen by voice alone within this workflow.
   * Shown in the safety guardrail UI and used by donnaProtectedActionRouter.ts.
   */
  cannotDoByVoice: readonly string[]
  /** What Donna says when the workflow starts */
  openingLine: string
  /** What Donna says when the draft is complete and ready for review */
  readyForReviewLine: string
}

// ── Registry ───────────────────────────────────────────────────────────────────

const WORKFLOW_REGISTRY: Record<WorkflowId, WorkflowDefinition> = {

  academy_setup: {
    workflowId: 'academy_setup',
    label: 'Academy Setup',
    description: 'Guided onboarding interview to configure the academy profile.',
    primaryTaskId: null,
    entryPhrases: [
      'academy onboarding', 'academy setup', 'setup academy', 'help me onboard',
      'start onboarding', 'set up my academy', 'set up the academy',
      'onboard my academy', 'begin setup', 'start setup', 'onboarding wizard',
      'guide me through setup', 'walk me through setup',
    ],
    steps: [
      { stepNumber: 1, label: 'Academy Details',   taskId: null, requiresApprovalGate: false },
      { stepNumber: 2, label: 'Director Profile',  taskId: null, requiresApprovalGate: false },
      { stepNumber: 3, label: 'Review & Confirm',  taskId: null, requiresApprovalGate: true },
    ],
    requiresDirectorApproval: true,
    cannotDoByVoice: [
      'Save academy profile',
      'Confirm setup complete',
      'Move to next onboarding phase',
    ],
    openingLine:
      "Let's set up your academy. I'll ask one question at a time — nothing saves until you confirm.",
    readyForReviewLine:
      "Your academy setup is ready to review. Check everything on screen, then click Confirm to save.",
  },

  class_template_creation: {
    workflowId: 'class_template_creation',
    label: 'Create Class Template',
    description: 'Draft a reusable, curriculum-aligned class template with named blocks.',
    primaryTaskId: 'create_class_template',
    entryPhrases: [
      'create a template', 'create template', 'build a template', 'build template',
      'new class template', 'class template', 'fitness template',
      'create a fitness', 'build a fitness', 'conditioning template',
    ],
    steps: [
      { stepNumber: 1, label: 'Collect Details',  taskId: 'create_class_template',   requiresApprovalGate: false },
      { stepNumber: 2, label: 'Review Template',  taskId: null,                       requiresApprovalGate: true },
    ],
    requiresDirectorApproval: true,
    cannotDoByVoice: [
      'Save template',
      'Publish template to curriculum',
      'Apply template to a session',
    ],
    openingLine:
      "I can draft a class template for you. Tell me the level, duration, and which blocks to include.",
    readyForReviewLine:
      "The template is ready to review. Check it on screen, then click Save Template to confirm.",
  },

  session_creation: {
    workflowId: 'session_creation',
    label: 'Create Session',
    description: 'Create a session shell and optionally populate it with template blocks.',
    primaryTaskId: 'create_session',
    entryPhrases: [
      'create a session', 'schedule a session', 'create session', 'schedule session',
      'new session', 'plan a session', 'plan session', 'book a session', 'book session',
      'set up a session', 'prepare a session', 'create and populate',
      'create session and populate', 'create a full session',
    ],
    steps: [
      { stepNumber: 1, label: 'Session Details',   taskId: 'create_session',                  requiresApprovalGate: false },
      { stepNumber: 2, label: 'Populate Blocks',   taskId: 'populate_session_from_template',   requiresApprovalGate: true },
      { stepNumber: 3, label: 'Review Session',    taskId: null,                               requiresApprovalGate: true },
    ],
    requiresDirectorApproval: true,
    cannotDoByVoice: [
      'Schedule session',
      'Populate session blocks',
      'Notify coach of session',
    ],
    openingLine:
      "I can help you create a session. I'll ask for the coach, group, and date — nothing schedules automatically.",
    readyForReviewLine:
      "The session is ready. Review the details on screen, then click Approve and Save.",
  },

  parent_update_draft: {
    workflowId: 'parent_update_draft',
    label: 'Draft Parent Update',
    description: 'Compose a parent-safe update or player development note.',
    primaryTaskId: 'draft_parent_update',
    entryPhrases: [
      'parent update', 'parent message', 'update for parent', 'message to parent',
      'draft parent', 'parent communication', 'write to parent', 'write an update for',
      'player development note', 'draft a player note', 'write a player note',
      'player note', 'development note',
    ],
    steps: [
      { stepNumber: 1, label: 'Draft Content',  taskId: 'draft_parent_update',  requiresApprovalGate: false },
      { stepNumber: 2, label: 'Review & Send',  taskId: null,                    requiresApprovalGate: true },
    ],
    requiresDirectorApproval: true,
    cannotDoByVoice: [
      'Send message to parent',
      'Publish player development note',
      'Mark update as sent',
    ],
    openingLine:
      "I can draft a parent update for you. It stays in review until you approve and send it yourself.",
    readyForReviewLine:
      "The draft is ready. Review it on screen before approving — nothing is sent automatically.",
  },

  coach_note_capture: {
    workflowId: 'coach_note_capture',
    label: 'Capture Coach Note',
    description: 'Save a player observation or coach communication draft.',
    primaryTaskId: 'capture_coach_note',
    entryPhrases: [
      'coach note', 'capture a note', 'capture an observation', 'player observation',
      'observation about', 'observation for', 'note about a player', 'note for a player',
      'i noticed', 'save an observation', 'draft coach communication',
    ],
    steps: [
      { stepNumber: 1, label: 'Capture Note',  taskId: 'capture_coach_note',  requiresApprovalGate: false },
      { stepNumber: 2, label: 'Review & Save', taskId: null,                   requiresApprovalGate: true },
    ],
    requiresDirectorApproval: true,
    cannotDoByVoice: [
      'Save observation to player record',
      'Share note with coaching staff',
      'Link note to a session',
    ],
    openingLine:
      "I can capture a coach note for you. It goes into draft — nothing saves until you approve.",
    readyForReviewLine:
      "The note is ready to review. Click Approve and Save to log it.",
  },

  attendance_exception: {
    workflowId: 'attendance_exception',
    label: 'Attendance Exception',
    description: 'Record an attendance exception such as an absence, late arrival, or makeup session.',
    primaryTaskId: 'handle_attendance_exception',
    entryPhrases: [
      'attendance exception', 'player missed', 'mark absent', 'mark attendance',
      'take attendance', 'record attendance', 'late arrival', 'make up session',
      'makeup session', 'attendance issue', 'unrostered attendee', 'missed session',
      'absent today', 'was absent', 'showed up', 'not on the roster',
    ],
    steps: [
      { stepNumber: 1, label: 'Exception Details', taskId: 'handle_attendance_exception', requiresApprovalGate: false },
      { stepNumber: 2, label: 'Review & Log',      taskId: null,                           requiresApprovalGate: true },
    ],
    requiresDirectorApproval: true,
    cannotDoByVoice: [
      'Log attendance exception',
      'Modify session roster',
      'Notify parent of absence',
    ],
    openingLine:
      "I can record an attendance exception. The draft goes to your review queue before anything is logged.",
    readyForReviewLine:
      "The exception is ready to review. Click Approve and Log to record it.",
  },

  curriculum_override: {
    workflowId: 'curriculum_override',
    label: 'Curriculum Adjustment',
    description: 'Draft a modification to the curriculum for director review.',
    primaryTaskId: 'adjust_curriculum',
    entryPhrases: [
      'adjust curriculum', 'curriculum change', 'curriculum adjustment',
      'modify curriculum', 'curriculum update', 'add drill', 'remove drill',
    ],
    steps: [
      { stepNumber: 1, label: 'Draft Adjustment',  taskId: 'adjust_curriculum', requiresApprovalGate: false },
      { stepNumber: 2, label: 'Review & Apply',    taskId: null,                 requiresApprovalGate: true },
    ],
    requiresDirectorApproval: true,
    cannotDoByVoice: [
      'Apply curriculum change',
      'Publish updated curriculum',
      'Override coach curriculum access',
    ],
    openingLine:
      "I can draft a curriculum adjustment. Nothing changes until you approve it.",
    readyForReviewLine:
      "The curriculum adjustment is ready. Review it on screen before approving.",
  },

  level_readiness: {
    workflowId: 'level_readiness',
    label: 'Level Readiness Review',
    description: 'Build the evidence summary for a player level advancement review.',
    primaryTaskId: 'review_level_readiness',
    entryPhrases: [
      'level readiness', 'ready to advance', 'level up', 'advance level',
      'level review', 'is this player ready', 'player advancement',
      'check level readiness', 'summarize player progress', 'player progress',
      'summarize player', 'player summary', 'how is this player doing',
      'progress report', 'player report', 'summarize progress',
    ],
    steps: [
      { stepNumber: 1, label: 'Collect Evidence', taskId: 'review_level_readiness', requiresApprovalGate: false },
      { stepNumber: 2, label: 'Review Summary',   taskId: null,                      requiresApprovalGate: true },
    ],
    requiresDirectorApproval: true,
    cannotDoByVoice: [
      'Move player to next level',
      'Notify parent of advancement',
      'Log advancement decision',
    ],
    openingLine:
      "I can review a player's level readiness. No advancement happens automatically — you decide.",
    readyForReviewLine:
      "The readiness summary is ready. Review it on screen before making any advancement decision.",
  },

  review_queue: {
    workflowId: 'review_queue',
    label: 'Review Queue',
    description: 'View and act on pending items in the director review queue.',
    primaryTaskId: null,
    entryPhrases: [
      'review queue', 'what needs my attention', 'show pending', 'show review queue',
      'open review queue', 'pending approvals', 'approval queue',
      'notes needing routing', 'unlinked notes', 'needs my review',
    ],
    steps: [
      { stepNumber: 1, label: 'View Queue',  taskId: null, requiresApprovalGate: false },
      { stepNumber: 2, label: 'Act on Item', taskId: null, requiresApprovalGate: true },
    ],
    requiresDirectorApproval: true,
    cannotDoByVoice: [
      'Approve a pending action',
      'Reject a pending action',
      'Mark item as reviewed',
    ],
    openingLine:
      "Here's your review queue — items waiting for your approval.",
    readyForReviewLine:
      "Select an item on screen and click Approve or Reject to act on it.",
  },
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Look up a workflow definition by ID. Returns undefined when not found. */
export function getWorkflow(workflowId: WorkflowId): WorkflowDefinition | undefined {
  return WORKFLOW_REGISTRY[workflowId]
}

/** All registered workflow definitions, ordered by label. */
export function getAllWorkflows(): WorkflowDefinition[] {
  return Object.values(WORKFLOW_REGISTRY).sort((a, b) => a.label.localeCompare(b.label))
}

/** Find which workflow matches a given entry phrase (lowercase, partial match). */
export function findWorkflowByPhrase(lowerPhrase: string): WorkflowDefinition | null {
  for (const def of Object.values(WORKFLOW_REGISTRY)) {
    if (def.entryPhrases.some(p => lowerPhrase.includes(p))) return def
  }
  return null
}

/**
 * Returns true if the given workflowId requires director approval at any step.
 * Shorthand for `getWorkflow(id)?.requiresDirectorApproval ?? false`.
 */
export function workflowRequiresApproval(workflowId: WorkflowId): boolean {
  return WORKFLOW_REGISTRY[workflowId]?.requiresDirectorApproval ?? false
}
