// Sprint 315 — Donna Intent Router V1
// Pure TypeScript. No DB, no API, no async, no React.
//
// Single entry point for classifying any director input — voice or typed — into
// a typed DonnaIntentResult. Supersedes the scattered detectTaskIntent /
// isTemplateCreationIntent / detectMultiStepIntent / isReviewQueuePhrase calls.
//
// DonnaAssistantButton.tsx continues to use its existing inline detectors until
// Phase 7 (donnaConversationController wiring) migrates it to this router.

import type { DonnaTaskId } from './donnaTaskContracts'
import { detectTaskIntent } from './donnaTaskRuntime'
import { isTemplateCreationIntent } from './templateDraftParser'
import { detectMultiStepIntent } from './donnaMultiStepPlanner'
import { isProtectedVoicePhrase, isOnboardingRoutingPhrase } from './donnaVoiceRuntime'

// ── Output types ───────────────────────────────────────────────────────────────

export type IntentType =
  | 'general_question'     // context, explain, status, suggestions
  | 'navigate'             // go to a page or open a panel
  | 'start_workflow'       // multi-step chained workflow (create + populate)
  | 'create_draft'         // start a single-task draft (coach note, session, etc.)
  | 'edit_draft'           // answer a question inside an active draft
  | 'approve_or_execute'   // protected — must use on-screen button
  | 'cancel'               // cancel current task or draft
  | 'undo'                 // undo last change within a draft
  | 'go_back'              // go back one step within a workflow
  | 'unknown'              // no match

export type WorkflowId =
  | 'academy_setup'
  | 'class_template_creation'
  | 'session_creation'
  | 'parent_update_draft'
  | 'coach_note_capture'
  | 'attendance_exception'
  | 'curriculum_override'
  | 'level_readiness'
  | 'review_queue'

export interface DonnaIntentResult {
  intentType: IntentType
  workflowId: WorkflowId | null
  confidence: 'low' | 'medium' | 'high'
  /** Basic slot values extracted from raw text. Full filling via donnaSlotFilling.ts */
  extractedSlots: Record<string, string>
  /** True when this intent will eventually require a director button click to execute */
  requiresApproval: boolean
  /** What Donna can say out loud — never reveals system internals */
  safeResponse: string
}

// ── Task → Workflow map ────────────────────────────────────────────────────────

const TASK_WORKFLOW_MAP: Partial<Record<DonnaTaskId, WorkflowId>> = {
  create_fitness_template:        'class_template_creation',
  populate_session_from_template: 'session_creation',
  create_session:                 'session_creation',
  capture_coach_note:             'coach_note_capture',
  draft_parent_update:            'parent_update_draft',
  draft_player_note:              'parent_update_draft',
  review_level_readiness:         'level_readiness',
  handle_attendance_exception:    'attendance_exception',
  adjust_curriculum:              'curriculum_override',
  draft_coach_communication:      'coach_note_capture',
  summarize_player_progress:      'level_readiness',
}

// ── Safe responses ─────────────────────────────────────────────────────────────

const SAFE_RESPONSES: Record<WorkflowId, string> = {
  academy_setup:
    "Academy onboarding is a guided setup process. Click 'Start Academy Onboarding' and I'll walk you through it step by step.",
  class_template_creation:
    "I can draft a class template for you. Nothing saves until you approve it. Tell me the level, duration, and which blocks to include.",
  session_creation:
    "I can help you create or populate a session. Nothing schedules automatically — you confirm every step.",
  parent_update_draft:
    "I can draft a parent update for you. It stays in review until you approve and send it yourself.",
  coach_note_capture:
    "I can capture a coach note or observation. It goes into draft for your review before saving.",
  attendance_exception:
    "I can record an attendance exception. The draft goes to your review queue before anything is logged.",
  curriculum_override:
    "I can draft a curriculum adjustment. Nothing changes in the curriculum until you approve it.",
  level_readiness:
    "I can review a player's level readiness evidence. No advancement happens automatically.",
  review_queue:
    "Here's your review queue — items waiting for your approval.",
}

// ── Keyword lists ──────────────────────────────────────────────────────────────

const UNDO_PHRASES: readonly string[] = [
  'undo', 'undo that', 'undo last', 'take that back', 'revert',
  'undo my last answer', 'go back and undo',
]

const GO_BACK_PHRASES: readonly string[] = [
  'go back', 'previous question', 'back one step', 'back to previous',
  'last question', 'step back', 'redo last question',
]

const CANCEL_PHRASES: readonly string[] = [
  'cancel', 'never mind', 'forget it', 'start over', 'discard',
  'clear draft', 'exit this', 'quit this',
]

const NAVIGATE_PATTERNS: Array<{ phrases: readonly string[]; destination: string }> = [
  {
    phrases: ['go to players', 'show me players', 'open players', 'player list'],
    destination: '/director/players',
  },
  {
    phrases: ['go to sessions', 'show me sessions', 'open sessions', 'session list'],
    destination: '/director/sessions',
  },
  {
    phrases: ['go to curriculum', 'show curriculum', 'open curriculum'],
    destination: '/director/curriculum',
  },
  {
    phrases: ['go to review', 'open review queue', 'show review queue'],
    destination: '/director/review',
  },
  {
    phrases: ['go to onboarding', 'open onboarding', 'start onboarding page'],
    destination: '/director/onboarding',
  },
  {
    phrases: ['go to dashboard', 'show dashboard', 'director dashboard'],
    destination: '/director',
  },
]

const REVIEW_QUEUE_PHRASES: readonly string[] = [
  'what needs my attention', 'show review queue', 'open review queue',
  'review queue', 'show pending notes', 'show pending',
  'notes needing routing', 'unlinked notes', 'needs my review',
  'pending approvals', 'what needs approval', 'approval queue',
  'what is pending', 'pending actions',
]

const GENERAL_QUESTION_PHRASES: readonly string[] = [
  'what is this', 'what does this page', 'explain this', 'help me understand',
  'what can you do', 'what can donna do', 'show me context', 'what am i looking at',
  'how does this work', 'what is the review queue', 'tell me about',
  'show me a summary', 'give me a summary', 'whats happening', "what's happening",
  'summarize this page', "what's going on here", 'what is going on here',
  'ask about this page', 'summarize this player', 'what does this player need',
  'what should i know about this player',
  // Predictive suggestion phrases (Sprint 267)
  'what do you recommend', 'any suggestions', 'suggest next best actions',
  'suggest next actions', 'who needs attention', 'what should i look at first',
  'what should i focus on', 'what do you suggest', 'give me suggestions',
  'what are your recommendations',
]

// ── Slot extraction ────────────────────────────────────────────────────────────
// Basic only. Full resolution in donnaSlotFilling.ts (Phase 5).

const TENNIS_LEVELS: readonly string[] = [
  'High Performance 3', 'High Performance 2', 'High Performance 1',
  'Yellow 3', 'Yellow 2', 'Yellow 1',
  'Green 3', 'Green 2', 'Green 1',
  'Orange 3', 'Orange 2', 'Orange 1',
  'Red 3', 'Red 2', 'Red 1',
]

function extractBasicSlots(text: string): Record<string, string> {
  const slots: Record<string, string> = {}
  const lower = text.toLowerCase()

  for (const level of TENNIS_LEVELS) {
    if (lower.includes(level.toLowerCase())) {
      slots.level = level
      break
    }
  }

  const durMatch = lower.match(/(\d+)\s*(?:min(?:utes?)?|mins?)/)
  if (durMatch) {
    slots.durationMinutes = durMatch[1]
  } else if (lower.includes('hour and a half') || lower.includes('1.5 hour')) {
    slots.durationMinutes = '90'
  } else if (lower.includes('one hour') || lower.includes('1 hour') || lower.includes('an hour')) {
    slots.durationMinutes = '60'
  }

  // Rough player name heuristic — "for [Name]" / "about [Name]"
  const nameMatch = text.match(/(?:for|about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/)
  if (nameMatch) {
    slots.playerName = nameMatch[1]
  }

  return slots
}

// ── Main classifier ────────────────────────────────────────────────────────────

/**
 * Classify any director input (voice transcript or typed text) into a
 * DonnaIntentResult. Call this at the top of every input handler.
 *
 * Priority order (highest first):
 *   1. Protected approval phrase → block immediately
 *   2. Undo / go back / cancel  → workflow navigation
 *   3. Academy setup routing     → navigate
 *   4. Review queue              → navigate
 *   5. Page navigation           → navigate
 *   6. Multi-step workflow       → start_workflow
 *   7. Class template creation   → create_draft
 *   8. Single-task intent        → create_draft
 *   9. General question / suggestions → general_question
 *  10. Unknown
 */
export function classifyIntent(text: string): DonnaIntentResult {
  const lower = text.toLowerCase().trim()

  // 1. Protected approval phrase — must block before any routing
  if (isProtectedVoicePhrase(lower)) {
    return {
      intentType: 'approve_or_execute',
      workflowId: null,
      confidence: 'high',
      extractedSlots: {},
      requiresApproval: false,
      safeResponse:
        'Approval actions always require the on-screen button. ' +
        'I never apply level changes, send messages, or save data from voice alone.',
    }
  }

  // 2a. Undo
  if (UNDO_PHRASES.some(p => lower.includes(p))) {
    return {
      intentType: 'undo',
      workflowId: null,
      confidence: 'high',
      extractedSlots: {},
      requiresApproval: false,
      safeResponse: "I'll undo your last answer so you can try again.",
    }
  }

  // 2b. Go back
  if (GO_BACK_PHRASES.some(p => lower.includes(p))) {
    return {
      intentType: 'go_back',
      workflowId: null,
      confidence: 'high',
      extractedSlots: {},
      requiresApproval: false,
      safeResponse: 'Going back to the previous question.',
    }
  }

  // 2c. Cancel — "cancel" alone is high confidence; as part of a phrase it's medium
  if (CANCEL_PHRASES.some(p => lower.includes(p))) {
    const isExact = lower === 'cancel' || lower === 'never mind' || lower === 'forget it'
    return {
      intentType: 'cancel',
      workflowId: null,
      confidence: isExact ? 'high' : 'medium',
      extractedSlots: {},
      requiresApproval: false,
      safeResponse: "Cancelling. You can start a new task whenever you're ready.",
    }
  }

  // 3. Academy setup routing
  if (isOnboardingRoutingPhrase(lower)) {
    return {
      intentType: 'navigate',
      workflowId: 'academy_setup',
      confidence: 'high',
      extractedSlots: {},
      requiresApproval: false,
      safeResponse: SAFE_RESPONSES.academy_setup,
    }
  }

  // 4. Review queue
  if (REVIEW_QUEUE_PHRASES.some(p => lower.includes(p))) {
    return {
      intentType: 'navigate',
      workflowId: 'review_queue',
      confidence: 'high',
      extractedSlots: {},
      requiresApproval: false,
      safeResponse: SAFE_RESPONSES.review_queue,
    }
  }

  // 5. Page navigation
  for (const { phrases, destination } of NAVIGATE_PATTERNS) {
    if (phrases.some(p => lower.includes(p))) {
      return {
        intentType: 'navigate',
        workflowId: null,
        confidence: 'high',
        extractedSlots: { destination },
        requiresApproval: false,
        safeResponse: `Navigating to ${destination}.`,
      }
    }
  }

  // 6. Multi-step workflow (create session + populate, note + parent update, etc.)
  const multiPlan = detectMultiStepIntent(text)
  if (multiPlan) {
    const firstTaskId = multiPlan.steps[0]?.taskId ?? null
    const workflowId = firstTaskId ? (TASK_WORKFLOW_MAP[firstTaskId] ?? null) : null
    return {
      intentType: 'start_workflow',
      workflowId,
      confidence: 'high',
      extractedSlots: extractBasicSlots(text),
      requiresApproval: true,
      safeResponse: multiPlan.summary,
    }
  }

  // 7. Class template creation (always wired to TemplateDraftPanel)
  if (isTemplateCreationIntent(text)) {
    return {
      intentType: 'create_draft',
      workflowId: 'class_template_creation',
      confidence: 'high',
      extractedSlots: extractBasicSlots(text),
      requiresApproval: true,
      safeResponse: SAFE_RESPONSES.class_template_creation,
    }
  }

  // 8. Single-task intent via donnaTaskRuntime keyword matching
  const taskResult = detectTaskIntent(text)
  if (taskResult.taskId && taskResult.taskId !== 'create_class_template') {
    const workflowId = TASK_WORKFLOW_MAP[taskResult.taskId] ?? null
    return {
      intentType: 'create_draft',
      workflowId,
      confidence: taskResult.confidence,
      extractedSlots: extractBasicSlots(text),
      requiresApproval: true,
      safeResponse: workflowId
        ? SAFE_RESPONSES[workflowId]
        : "I can help with that. Let me ask you a few questions.",
    }
  }

  // 9. General question / context / suggestions
  const isGeneralQ =
    GENERAL_QUESTION_PHRASES.some(p => lower.includes(p)) ||
    // bare question heuristic — ends with ? and no draft keyword
    (lower.endsWith('?') && !lower.includes('save') && !lower.includes('create'))
  if (isGeneralQ) {
    return {
      intentType: 'general_question',
      workflowId: null,
      confidence: lower.endsWith('?') ? 'medium' : 'high',
      extractedSlots: {},
      requiresApproval: false,
      safeResponse:
        "I can help answer that. Let me pull up the context for this page.",
    }
  }

  // 10. Unknown
  return {
    intentType: 'unknown',
    workflowId: null,
    confidence: 'low',
    extractedSlots: extractBasicSlots(text),
    requiresApproval: false,
    safeResponse:
      "I'm not sure what you're asking. Try saying something like 'create a coach note' or 'create a class template'.",
  }
}
