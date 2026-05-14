// Sprint 320 — Donna Protected Action Router V1
// Pure TypeScript. No DB, no API, no async, no React.
//
// Classifies whether a director input attempts a protected action —
// one that can NEVER be executed by voice alone and always requires an
// on-screen button click. Extends donnaVoiceRuntime.isProtectedVoicePhrase()
// with workflow-specific context (some phrases are only protected inside
// certain workflows, not globally).
//
// Used by donnaConversationController.ts (already) and DonnaAssistantButton.tsx (Phase 7).

import {
  isProtectedVoicePhrase,
  VOICE_PROTECTED_PHRASES,
  VOICE_PROTECTED_RESPONSE,
} from './donnaVoiceRuntime'
import type { WorkflowId } from './donnaIntentRouter'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ProtectionReason =
  | 'global_approval_phrase'   // matches VOICE_PROTECTED_PHRASES in donnaVoiceRuntime
  | 'workflow_mutation'         // workflow-specific action that mutates core data
  | 'level_change'              // any phrase that would change a player level
  | 'send_message'              // any phrase that would send communication
  | 'session_publish'           // publishing or broadcasting a session
  | 'curriculum_apply'          // applying curriculum changes
  | 'roster_mutation'           // modifying session roster or enrollment
  | 'billing_enrollment'        // billing, enrollment, or financial actions
  | 'always_listening_request'  // asking Donna to listen globally (never permitted)

export interface ProtectedActionResult {
  isProtected: boolean
  reason: ProtectionReason | null
  userMessage: string          // what to show the director in the UI
  developerMessage: string     // what to log for debugging
  requiresButtonClick: boolean // always true when isProtected = true
}

// ── Protected phrase sets ──────────────────────────────────────────────────────
// Each set covers one protection reason with multiple surface forms.

const LEVEL_CHANGE_PHRASES: readonly string[] = [
  'move her up', 'move him up', 'move them up', 'advance them',
  'promote player', 'move player up', 'level up player',
  'move to next level', 'move to level', 'advance to level',
  'change their level', 'update their level', 'set their level',
]

const SEND_MESSAGE_PHRASES: readonly string[] = [
  'send it', 'send the message', 'send to parent', 'send this update',
  'send the update', 'send the note', 'email the parent', 'notify the parent',
  'message the parent', 'publish the note', 'release the note',
  'go ahead and send', 'post the update',
]

const SESSION_PUBLISH_PHRASES: readonly string[] = [
  'publish the session', 'broadcast the session', 'release the session',
  'push the session', 'notify the coach', 'send to coach',
  'activate the session', 'make the session live',
]

const CURRICULUM_APPLY_PHRASES: readonly string[] = [
  'apply the curriculum', 'apply curriculum', 'apply curriculum change',
  'publish curriculum', 'release curriculum', 'go ahead and apply',
  'apply the changes', 'apply it now',
]

const ROSTER_MUTATION_PHRASES: readonly string[] = [
  'add them to the roster', 'remove them from the roster', 'remove player',
  'add player to session', 'roster them', 'drop them from the session',
  'enroll the player', 'add to roster',
]

const BILLING_ENROLLMENT_PHRASES: readonly string[] = [
  'enroll', 'bill', 'charge', 'process payment', 'billing', 'invoice',
]

const ALWAYS_LISTENING_PHRASES: readonly string[] = [
  'always listen', 'keep listening', 'listen all the time', 'stay on',
  'always on', 'wake word always', 'listen in the background',
  'keep hearing me', 'always be listening', 'global listen',
]

// ── Per-workflow extra protected phrases ───────────────────────────────────────
// Some phrases are only protected within specific workflows.

const WORKFLOW_PROTECTED_PHRASES: Partial<Record<WorkflowId, string[]>> = {
  academy_setup: [
    'save my academy', 'save academy profile', 'confirm the setup',
    'complete the setup', 'finish setup', 'submit setup',
  ],
  session_creation: [
    'schedule it', 'book it', 'confirm the session',
    'finalize the session', 'lock in the session',
  ],
  parent_update_draft: [
    'send it', 'deliver it', 'publish it', 'release it',
  ],
  level_readiness: [
    'move them up', 'advance the player', 'change their level',
  ],
}

// ── Detection ──────────────────────────────────────────────────────────────────

function matchesPhraseList(lower: string, phrases: readonly string[]): boolean {
  return phrases.some(p => lower.includes(p))
}

/**
 * Check whether a director input is a protected action that cannot be executed
 * by voice alone. Returns a ProtectedActionResult indicating whether the action
 * is blocked and why.
 *
 * Always call this BEFORE processing any voice or typed input in DonnaAssistantButton
 * and donnaConversationController. When isProtected = true, stop routing and show
 * the userMessage instead.
 */
export function checkProtectedAction(
  text: string,
  activeWorkflowId?: WorkflowId | null,
): ProtectedActionResult {
  const lower = text.toLowerCase().trim()

  // 1. Global approval phrase (from donnaVoiceRuntime)
  if (isProtectedVoicePhrase(lower)) {
    return {
      isProtected: true,
      reason: 'global_approval_phrase',
      userMessage: VOICE_PROTECTED_RESPONSE,
      developerMessage: `Matched global protected phrase. Input: "${text.slice(0, 80)}"`,
      requiresButtonClick: true,
    }
  }

  // 2. Always-listening request — never permitted regardless of context
  if (matchesPhraseList(lower, ALWAYS_LISTENING_PHRASES)) {
    return {
      isProtected: true,
      reason: 'always_listening_request',
      userMessage:
        "Donna only listens when you click the microphone button. " +
        "She never listens in the background.",
      developerMessage: `Always-listening request blocked. Input: "${text.slice(0, 80)}"`,
      requiresButtonClick: false, // no button — this action is simply not available
    }
  }

  // 3. Level change
  if (matchesPhraseList(lower, LEVEL_CHANGE_PHRASES)) {
    return {
      isProtected: true,
      reason: 'level_change',
      userMessage:
        "Player level changes always require the on-screen button. " +
        "I never move a player by voice alone.",
      developerMessage: `Level change phrase blocked. Input: "${text.slice(0, 80)}"`,
      requiresButtonClick: true,
    }
  }

  // 4. Send message
  if (matchesPhraseList(lower, SEND_MESSAGE_PHRASES)) {
    return {
      isProtected: true,
      reason: 'send_message',
      userMessage:
        "Sending messages always requires the on-screen button. " +
        "Nothing is sent until you click Send.",
      developerMessage: `Send message phrase blocked. Input: "${text.slice(0, 80)}"`,
      requiresButtonClick: true,
    }
  }

  // 5. Session publish
  if (matchesPhraseList(lower, SESSION_PUBLISH_PHRASES)) {
    return {
      isProtected: true,
      reason: 'session_publish',
      userMessage:
        "Publishing a session requires the on-screen button. " +
        "Nothing is sent to coaches until you confirm.",
      developerMessage: `Session publish phrase blocked. Input: "${text.slice(0, 80)}"`,
      requiresButtonClick: true,
    }
  }

  // 6. Curriculum apply
  if (matchesPhraseList(lower, CURRICULUM_APPLY_PHRASES)) {
    return {
      isProtected: true,
      reason: 'curriculum_apply',
      userMessage:
        "Applying curriculum changes requires the on-screen button. " +
        "No changes go live until you confirm.",
      developerMessage: `Curriculum apply phrase blocked. Input: "${text.slice(0, 80)}"`,
      requiresButtonClick: true,
    }
  }

  // 7. Roster mutation
  if (matchesPhraseList(lower, ROSTER_MUTATION_PHRASES)) {
    return {
      isProtected: true,
      reason: 'roster_mutation',
      userMessage:
        "Roster changes require the on-screen button. " +
        "I never add or remove players from a session by voice.",
      developerMessage: `Roster mutation phrase blocked. Input: "${text.slice(0, 80)}"`,
      requiresButtonClick: true,
    }
  }

  // 8. Billing / enrollment
  if (matchesPhraseList(lower, BILLING_ENROLLMENT_PHRASES)) {
    return {
      isProtected: true,
      reason: 'billing_enrollment',
      userMessage:
        "Enrollment and billing actions are not available through Donna. " +
        "Use the admin panel for those.",
      developerMessage: `Billing/enrollment phrase blocked. Input: "${text.slice(0, 80)}"`,
      requiresButtonClick: false,
    }
  }

  // 9. Workflow-specific protected phrases
  if (activeWorkflowId) {
    const workflowPhrases = WORKFLOW_PROTECTED_PHRASES[activeWorkflowId]
    if (workflowPhrases && matchesPhraseList(lower, workflowPhrases)) {
      return {
        isProtected: true,
        reason: 'workflow_mutation',
        userMessage:
          "That action requires the on-screen button. " +
          "Nothing saves or sends until you click the confirmation button.",
        developerMessage:
          `Workflow-specific protected phrase blocked. workflowId: ${activeWorkflowId}, input: "${text.slice(0, 80)}"`,
        requiresButtonClick: true,
      }
    }
  }

  return {
    isProtected: false,
    reason: null,
    userMessage: '',
    developerMessage: '',
    requiresButtonClick: false,
  }
}

// ── Exported constants for reference ──────────────────────────────────────────

/** All globally protected phrases (from donnaVoiceRuntime + this module combined). */
export const ALL_PROTECTED_PHRASES: readonly string[] = [
  ...VOICE_PROTECTED_PHRASES,
  ...LEVEL_CHANGE_PHRASES,
  ...SEND_MESSAGE_PHRASES,
  ...SESSION_PUBLISH_PHRASES,
  ...CURRICULUM_APPLY_PHRASES,
  ...ROSTER_MUTATION_PHRASES,
  ...BILLING_ENROLLMENT_PHRASES,
  ...ALWAYS_LISTENING_PHRASES,
]
