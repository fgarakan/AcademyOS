// Sprint 1861–1880 — DONNA Autonomous Guidance Engine V1
//
// After DONNA answers a strategic question, she should not stop.
// She should keep the director moving forward.
//
// This engine:
//   1. Detects director control phrases (stop, not now, skip, show options)
//   2. Builds context-aware follow-up prompts after strategic answers
//   3. Maps available signals → the most useful next question DONNA can ask
//   4. Respects director autonomy — never forces workflows, never repeats aggressively
//
// Used after:
//   - Today guidance answers (from donnaTodayGuidanceLoop)
//   - Attention report answers
//   - Daily brief answers
//   - Goal-inference answers (from donnaGoalEngine)
//
// Design rules:
//   - Pure TypeScript. No DB, no API, no React, no side effects.
//   - Director is always final decision-maker.
//   - DONNA offers, suggests, and guides — never pushes.
//   - Follow-up frequency is rate-limited: max one follow-up per answer.
//   - Approval gates are never bypassed.

import type { GuidedWorkflowId } from '@/lib/donna/guidedCompletion/guidedCompletionRegistry'
import type { DonnaTodayGuidanceOutput } from '@/lib/donna/guidance/donnaTodayGuidanceLoop'

// ── Director control phrases ──────────────────────────────────────────────────

const STOP_PHRASES = [
  'stop', 'stop guidance', 'stop helping', 'stop asking',
  "that's enough", 'thats enough', "i'm done", 'im done',
  'go to sleep', 'donna stop',
] as const

const PAUSE_PHRASES = [
  'not now', 'not right now', 'later', 'maybe later', 'give me a minute',
  'hold on', 'pause', 'pause guidance', 'wait',
] as const

const SKIP_PHRASES = [
  'skip', 'skip this', 'skip that', 'next', 'next item', 'skip it',
  'move on', 'skip to next', "i'll do that later",
] as const

const SHOW_OPTIONS_PHRASES = [
  'show me options', 'what else', 'other options', 'show me another',
  'show another', 'choose another', 'give me options', 'what are my options',
  'show me all', 'show everything',
] as const

// ── Director control detection ────────────────────────────────────────────────

export type DirectorControlIntent =
  | 'stop'          // director wants DONNA to stop guiding
  | 'pause'         // director wants a break ("not now")
  | 'skip'          // director wants to skip the current item
  | 'show_options'  // director wants to see alternative actions
  | 'accept'        // director said yes / confirmed
  | 'none'          // no control phrase — treat as a command/question

export function detectDirectorControl(text: string): DirectorControlIntent {
  const t = text.toLowerCase().trim()

  if (STOP_PHRASES.some(p => t === p || t.includes(p))) return 'stop'
  if (PAUSE_PHRASES.some(p => t === p || t.includes(p))) return 'pause'
  if (SKIP_PHRASES.some(p => t === p || t.includes(p))) return 'skip'
  if (SHOW_OPTIONS_PHRASES.some(p => t === p || t.includes(p))) return 'show_options'

  // Accept: yes, sure, go ahead, let's do it, walk me through it
  if (
    /^(yes|yeah|yep|sure|go ahead|let'?s? (do it|go)|walk me through|start it|i'd like that|ok|okay)[\.,!]?$/.test(t) ||
    t.startsWith("yes,") || t.startsWith("yeah,") || t.startsWith("sure,")
  ) {
    return 'accept'
  }

  return 'none'
}

// ── Control responses ─────────────────────────────────────────────────────────

/** DONNA's response to each director control intent. */
export const DIRECTOR_CONTROL_RESPONSES: Record<Exclude<DirectorControlIntent, 'none' | 'accept'>, string> = {
  stop:
    "Got it — I'll step back. Just ask me anything when you're ready.",
  pause:
    "No problem. I'm here when you need me.",
  skip:
    "Understood. Moving on — let me know if you want to come back to that.",
  show_options:
    "Of course. Here are the other items worth your attention today. Which would you like to start with?",
}

// ── Autonomous follow-up types ────────────────────────────────────────────────

export type DonnaFollowUpContext =
  | 'today_guidance'      // director asked "what do I do today?"
  | 'attention_report'    // director asked for attention signals
  | 'daily_brief'         // daily brief was presented
  | 'goal_inferred'       // DONNA inferred a goal from input
  | 'answer_given'        // DONNA answered a general question

export interface DonnaAutonomousFollowUpInput {
  context: DonnaFollowUpContext
  /** The top action from today guidance, if available */
  todayGuidance?: DonnaTodayGuidanceOutput
  /** Guided workflow candidate identified (if any) */
  workflowCandidate?: GuidedWorkflowId | null
  /** Destination route for the top action */
  destination?: string | null
  /** Human-readable label for the top item */
  topItemLabel?: string
  /** Whether the director has already seen a follow-up in this session */
  alreadyAskedFollowUp?: boolean
}

export interface DonnaAutonomousFollowUpResult {
  /** Whether a follow-up question should be shown */
  shouldFollowUp: boolean
  /** The follow-up question to present */
  followUpQuestion: string | null
  /** Whether DONNA can start a workflow (vs. just navigating) */
  canStartWorkflow: boolean
  /** Workflow to start if director says yes */
  workflowCandidate: GuidedWorkflowId | null
  /** Route to navigate to if director says yes */
  destination: string | null
}

// ── Follow-up builder ─────────────────────────────────────────────────────────

/**
 * After DONNA answers a strategic question, build her autonomous follow-up.
 *
 * Returns a follow-up question DONNA should ask the director, plus the
 * workflow or destination that question leads to.
 *
 * Returns { shouldFollowUp: false } when:
 *   - No actionable item exists
 *   - Director has already been asked a follow-up in this session
 */
export function buildAutonomousFollowUp(
  input: DonnaAutonomousFollowUpInput,
): DonnaAutonomousFollowUpResult {
  const NO_FOLLOW_UP: DonnaAutonomousFollowUpResult = {
    shouldFollowUp: false,
    followUpQuestion: null,
    canStartWorkflow: false,
    workflowCandidate: null,
    destination: null,
  }

  // Rate-limit: don't stack follow-ups in one session
  if (input.alreadyAskedFollowUp) return NO_FOLLOW_UP

  // Today guidance — most common path
  if (input.context === 'today_guidance' && input.todayGuidance) {
    const { highestImpactItem, workflowCandidate, destination, isAllClear } = input.todayGuidance

    if (isAllClear) {
      return {
        shouldFollowUp: true,
        followUpQuestion: 'Would you like me to review curriculum coverage or check player progress?',
        canStartWorkflow: false,
        workflowCandidate: null,
        destination: '/director/curriculum',
      }
    }

    if (!highestImpactItem) return NO_FOLLOW_UP

    if (workflowCandidate) {
      return {
        shouldFollowUp: true,
        followUpQuestion: `Would you like me to walk you through ${highestImpactItem.label}?`,
        canStartWorkflow: true,
        workflowCandidate,
        destination,
      }
    }

    if (destination) {
      return {
        shouldFollowUp: true,
        followUpQuestion: `Would you like me to take you to ${highestImpactItem.label}?`,
        canStartWorkflow: false,
        workflowCandidate: null,
        destination,
      }
    }

    return {
      shouldFollowUp: true,
      followUpQuestion: `Would you like more detail on ${highestImpactItem.label}?`,
      canStartWorkflow: false,
      workflowCandidate: null,
      destination: null,
    }
  }

  // Attention report
  if (input.context === 'attention_report') {
    if (input.workflowCandidate) {
      return {
        shouldFollowUp: true,
        followUpQuestion: `Would you like me to walk you through${input.topItemLabel ? ` "${input.topItemLabel}"` : ' the top item'}?`,
        canStartWorkflow: true,
        workflowCandidate: input.workflowCandidate,
        destination: input.destination ?? null,
      }
    }
    if (input.destination) {
      return {
        shouldFollowUp: true,
        followUpQuestion: input.topItemLabel
          ? `Should I take you to ${input.topItemLabel}?`
          : 'Should I take you there?',
        canStartWorkflow: false,
        workflowCandidate: null,
        destination: input.destination,
      }
    }
    return NO_FOLLOW_UP
  }

  // Daily brief
  if (input.context === 'daily_brief') {
    if (input.workflowCandidate) {
      return {
        shouldFollowUp: true,
        followUpQuestion: 'Would you like to start with the highest-impact item?',
        canStartWorkflow: true,
        workflowCandidate: input.workflowCandidate,
        destination: input.destination ?? null,
      }
    }
    return {
      shouldFollowUp: true,
      followUpQuestion: 'Would you like me to walk you through your priorities?',
      canStartWorkflow: false,
      workflowCandidate: null,
      destination: input.destination ?? '/director',
    }
  }

  // Goal inferred
  if (input.context === 'goal_inferred' && input.workflowCandidate) {
    return {
      shouldFollowUp: true,
      followUpQuestion: `Should I walk you through it step by step?`,
      canStartWorkflow: true,
      workflowCandidate: input.workflowCandidate,
      destination: input.destination ?? null,
    }
  }

  return NO_FOLLOW_UP
}

// ── Alternate options builder ─────────────────────────────────────────────────
// When director says "show me options", DONNA offers the next 2 items.

export interface DonnaAlternateOptionsResult {
  responseText: string
  options: Array<{ label: string; destination: string | null }>
}

export function buildAlternateOptions(
  todayGuidance: DonnaTodayGuidanceOutput,
  skipIndex = 0,
): DonnaAlternateOptionsResult {
  const remaining = todayGuidance.priorities.filter((_, i) => i !== skipIndex)

  if (remaining.length === 0) {
    return {
      responseText: "Those are all the items I have for today. Everything else looks clear.",
      options: [],
    }
  }

  const options = remaining.map(p => ({
    label: p.label,
    destination: p.destination,
  }))

  const listText = remaining.map((p, i) => `${i + 1}. ${p.label}`).join('\n')

  return {
    responseText: `Here are the other items worth your attention today:\n\n${listText}\n\nWhich would you like to start with?`,
    options,
  }
}

// ── DONNA phase labels ────────────────────────────────────────────────────────
// Used in UI to show what guidance phase DONNA is in.

export type DonnaGuidancePhase =
  | 'presenting_priorities'   // DONNA is showing today's list
  | 'asking_follow_up'        // DONNA is waiting for yes/no
  | 'workflow_active'         // DONNA is running a guided workflow
  | 'paused'                  // director said "not now"
  | 'stopped'                 // director said "stop"
  | 'idle'                    // no active guidance

export function getDonnaGuidancePhaseLabel(phase: DonnaGuidancePhase): string {
  switch (phase) {
    case 'presenting_priorities': return 'DONNA is guiding you.'
    case 'asking_follow_up':      return 'DONNA is waiting for your answer.'
    case 'workflow_active':       return 'DONNA is walking you through it.'
    case 'paused':                return 'DONNA is paused.'
    case 'stopped':               return 'Guidance stopped.'
    case 'idle':                  return ''
  }
}
