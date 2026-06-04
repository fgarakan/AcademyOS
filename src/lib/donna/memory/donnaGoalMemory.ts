// Sprint 1831–1860 — DONNA Intent, Goal & Continuity Engine V1
// Goal Memory — sessionStorage-backed goal state.
//
// Tracks what the director is trying to accomplish across conversation turns.
// Supports: active goal, interrupted goal, previous goal, completed goals,
// last relevant entity.
//
// Also handles conversational continuity phrases:
//   "let's continue" / "go back" / "what were we doing?" / "finish it" / "take me there"
//
// Design rules:
//   - Client-side only (sessionStorage). Never throws. Fails silently.
//   - No player PII beyond labels the director explicitly stated.
//   - TTL: 2 hours. Stale entries silently discarded.
//   - Approval-safe: reads only. Never triggers mutations or workflows.
//   - One active goal per session — most recent wins.

import type { DirectorGoal } from '../goals/donnaGoalEngine'
import type { EntityType } from '../entities/donnaEntityResolver'
import { GOAL_LABELS } from '../goals/donnaGoalEngine'

// ── State shape ───────────────────────────────────────────────────────────────

export interface DonnaGoalMemoryState {
  activeGoal:                DirectorGoal | null
  activeGoalSubject:         string | null  // "Orange Ball 2", "Jamie Chen"
  activeGoalDescription:     string | null
  activeGoalRoute:           string | null  // recommended route for active goal
  activeGoalWorkflow:        string | null  // workflowCandidate id if any

  previousGoal:              DirectorGoal | null
  previousGoalSubject:       string | null

  interruptedGoal:           DirectorGoal | null
  interruptedGoalSubject:    string | null
  interruptedGoalRoute:      string | null
  interruptedGoalWorkflow:   string | null

  completedGoals:            DirectorGoal[]

  lastRelevantEntity:        string | null
  lastEntityType:            EntityType | null

  storedAt:                  number
  updatedAt:                 number
}

// ── Continuity response ───────────────────────────────────────────────────────

export interface ContinuityResponse {
  /** The conversational response DONNA gives */
  message: string
  /** Navigation route if DONNA should redirect */
  route: string | null
  /** Trigger phrase DONNA should submit to continue the workflow */
  workflowTrigger: string | null
  /** Type of continuity action */
  action: 'resume' | 'return' | 'recall' | 'complete' | 'acknowledge'
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'donna_goal_memory_v1'
const TTL_MS      = 2 * 60 * 60 * 1000  // 2 hours

// ── Storage helpers ───────────────────────────────────────────────────────────

function readState(): DonnaGoalMemoryState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DonnaGoalMemoryState
    if (typeof parsed.storedAt !== 'number') return null
    if (Date.now() - parsed.storedAt > TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeState(state: DonnaGoalMemoryState): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* non-fatal */
  }
}

function emptyState(): DonnaGoalMemoryState {
  const now = Date.now()
  return {
    activeGoal:             null,
    activeGoalSubject:      null,
    activeGoalDescription:  null,
    activeGoalRoute:        null,
    activeGoalWorkflow:     null,
    previousGoal:           null,
    previousGoalSubject:    null,
    interruptedGoal:        null,
    interruptedGoalSubject: null,
    interruptedGoalRoute:   null,
    interruptedGoalWorkflow: null,
    completedGoals:         [],
    lastRelevantEntity:     null,
    lastEntityType:         null,
    storedAt:               now,
    updatedAt:              now,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Read the current goal memory state. Returns null if nothing is stored. */
export function getCurrentGoalState(): DonnaGoalMemoryState | null {
  return readState()
}

/**
 * Set a new active goal.
 * Moves the previous active goal to previousGoal before replacing.
 */
export function setActiveGoal(params: {
  goal: DirectorGoal
  subject?: string | null
  description?: string | null
  route?: string | null
  workflow?: string | null
}): DonnaGoalMemoryState {
  const existing = readState() ?? emptyState()
  const now = Date.now()

  const updated: DonnaGoalMemoryState = {
    ...existing,
    previousGoal:          existing.activeGoal,
    previousGoalSubject:   existing.activeGoalSubject,
    activeGoal:            params.goal,
    activeGoalSubject:     params.subject ?? null,
    activeGoalDescription: params.description ?? GOAL_LABELS[params.goal] ?? null,
    activeGoalRoute:       params.route ?? null,
    activeGoalWorkflow:    params.workflow ?? null,
    lastRelevantEntity:    params.subject ?? existing.lastRelevantEntity,
    updatedAt:             now,
    storedAt:              existing.storedAt,
  }

  writeState(updated)
  return updated
}

/**
 * Interrupt the active goal (move to interruptedGoal).
 * Call when director starts a new topic mid-workflow.
 */
export function interruptGoal(): DonnaGoalMemoryState {
  const existing = readState() ?? emptyState()
  if (!existing.activeGoal) return existing

  const updated: DonnaGoalMemoryState = {
    ...existing,
    interruptedGoal:        existing.activeGoal,
    interruptedGoalSubject: existing.activeGoalSubject,
    interruptedGoalRoute:   existing.activeGoalRoute,
    interruptedGoalWorkflow: existing.activeGoalWorkflow,
    activeGoal:             null,
    activeGoalSubject:      null,
    activeGoalDescription:  null,
    activeGoalRoute:        null,
    activeGoalWorkflow:     null,
    updatedAt:              Date.now(),
  }

  writeState(updated)
  return updated
}

/**
 * Mark the active goal as complete.
 * Moves it to completedGoals (capped at 10).
 */
export function completeGoal(): DonnaGoalMemoryState {
  const existing = readState() ?? emptyState()
  if (!existing.activeGoal) return existing

  const completed = [existing.activeGoal, ...existing.completedGoals].slice(0, 10)

  const updated: DonnaGoalMemoryState = {
    ...existing,
    completedGoals:        completed,
    previousGoal:          existing.activeGoal,
    previousGoalSubject:   existing.activeGoalSubject,
    activeGoal:            null,
    activeGoalSubject:     null,
    activeGoalDescription: null,
    activeGoalRoute:       null,
    activeGoalWorkflow:    null,
    updatedAt:             Date.now(),
  }

  writeState(updated)
  return updated
}

/**
 * Resume the interrupted goal (move from interruptedGoal back to activeGoal).
 */
export function resumeInterruptedGoal(): DonnaGoalMemoryState {
  const existing = readState() ?? emptyState()
  if (!existing.interruptedGoal) return existing

  const updated: DonnaGoalMemoryState = {
    ...existing,
    activeGoal:             existing.interruptedGoal,
    activeGoalSubject:      existing.interruptedGoalSubject,
    activeGoalDescription:  existing.interruptedGoal ? (GOAL_LABELS[existing.interruptedGoal] ?? null) : null,
    activeGoalRoute:        existing.interruptedGoalRoute,
    activeGoalWorkflow:     existing.interruptedGoalWorkflow,
    interruptedGoal:        null,
    interruptedGoalSubject: null,
    interruptedGoalRoute:   null,
    interruptedGoalWorkflow: null,
    updatedAt:              Date.now(),
  }

  writeState(updated)
  return updated
}

/** Update the last relevant entity label. */
export function updateLastEntity(label: string, type: EntityType): void {
  const existing = readState()
  if (!existing) return
  writeState({ ...existing, lastRelevantEntity: label, lastEntityType: type, updatedAt: Date.now() })
}

/** Clear all goal memory. */
export function clearGoalMemory(): void {
  if (typeof window === 'undefined') return
  try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* non-fatal */ }
}

// ── Continuity phrase detection ───────────────────────────────────────────────

const CONTINUE_PHRASES = [
  "let's continue", 'continue', 'keep going', 'go on', 'proceed', 'resume',
  "let's resume", "let's keep going", "let's go on", 'continue from there',
  'pick up where', "let's pick up",
]

const GO_BACK_PHRASES = [
  "go back", "let's go back", 'back to that', 'back to what we were',
  'return to that', 'go back to', 'back to the',
]

const WHAT_WERE_WE_PHRASES = [
  'what were we doing', 'what was i doing', 'what were we working on',
  'what was i working on', 'what were we talking about', 'what were we',
  'remind me what', 'what did we',
]

const FINISH_IT_PHRASES = [
  'finish it', 'finish this', "let's finish", 'complete it', 'complete this',
  'done with it', 'wrap it up', 'finalize it', 'finalize this',
]

const TAKE_ME_THERE_PHRASES = [
  'take me there', 'go there', 'navigate there', 'show me', 'open it',
  'open that', 'take me to it', "let's go there",
]

function matchesPhrases(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase().trim()
  return phrases.some(p => lower === p || lower.startsWith(p + ' ') || lower.includes(p))
}

/**
 * Detect a conversational continuity phrase and return the appropriate response.
 * Returns null when input is not a continuity phrase.
 *
 * Handles:
 *   "let's continue"       → resume active/interrupted goal
 *   "go back"              → return to interrupted/previous goal
 *   "what were we doing?"  → recall active/previous goal
 *   "finish it"            → offer to complete active goal
 *   "take me there"        → navigate to active goal route
 */
export function buildContinuityResponse(text: string): ContinuityResponse | null {
  const state = readState()

  if (matchesPhrases(text, CONTINUE_PHRASES)) {
    if (state?.activeGoal) {
      const label = GOAL_LABELS[state.activeGoal] ?? state.activeGoal
      const subject = state.activeGoalSubject ? ` — ${state.activeGoalSubject}` : ''
      const workflowTrigger = state.activeGoalWorkflow
        ? `continue ${label.toLowerCase()}`
        : null
      return {
        message: `Continuing: **${label}${subject}**. What's your next answer?`,
        route: state.activeGoalRoute,
        workflowTrigger,
        action: 'resume',
      }
    }
    if (state?.interruptedGoal) {
      const resumed = resumeInterruptedGoal()
      const label = GOAL_LABELS[resumed.activeGoal!] ?? resumed.activeGoal!
      const subject = resumed.activeGoalSubject ? ` — ${resumed.activeGoalSubject}` : ''
      return {
        message: `Resuming: **${label}${subject}**. Ready when you are.`,
        route: resumed.activeGoalRoute,
        workflowTrigger: resumed.activeGoalWorkflow ? `continue ${label.toLowerCase()}` : null,
        action: 'resume',
      }
    }
    return {
      message: "There's no active workflow to continue. What would you like to work on?",
      route: null,
      workflowTrigger: null,
      action: 'acknowledge',
    }
  }

  if (matchesPhrases(text, GO_BACK_PHRASES)) {
    if (state?.interruptedGoal) {
      const label = GOAL_LABELS[state.interruptedGoal] ?? state.interruptedGoal
      const subject = state.interruptedGoalSubject ? ` — ${state.interruptedGoalSubject}` : ''
      return {
        message: `Going back to: **${label}${subject}**. Say "continue" to resume.`,
        route: state.interruptedGoalRoute,
        workflowTrigger: null,
        action: 'return',
      }
    }
    if (state?.previousGoal) {
      const label = GOAL_LABELS[state.previousGoal] ?? state.previousGoal
      const subject = state.previousGoalSubject ? ` — ${state.previousGoalSubject}` : ''
      return {
        message: `The previous goal was: **${label}${subject}**. Say "continue" to pick it back up.`,
        route: null,
        workflowTrigger: null,
        action: 'return',
      }
    }
    return {
      message: "I don't have a previous goal to go back to. What would you like to work on?",
      route: null,
      workflowTrigger: null,
      action: 'acknowledge',
    }
  }

  if (matchesPhrases(text, WHAT_WERE_WE_PHRASES)) {
    if (state?.activeGoal) {
      const label = GOAL_LABELS[state.activeGoal] ?? state.activeGoal
      const subject = state.activeGoalSubject ? ` (${state.activeGoalSubject})` : ''
      return {
        message: `You were working on: **${label}${subject}**. Say "continue" to keep going.`,
        route: null,
        workflowTrigger: null,
        action: 'recall',
      }
    }
    if (state?.previousGoal) {
      const label = GOAL_LABELS[state.previousGoal] ?? state.previousGoal
      const subject = state.previousGoalSubject ? ` (${state.previousGoalSubject})` : ''
      return {
        message: `The last thing we worked on was: **${label}${subject}**.`,
        route: null,
        workflowTrigger: null,
        action: 'recall',
      }
    }
    return {
      message: "We haven't worked on anything together yet this session. What would you like to do?",
      route: null,
      workflowTrigger: null,
      action: 'acknowledge',
    }
  }

  if (matchesPhrases(text, FINISH_IT_PHRASES)) {
    if (state?.activeGoal) {
      const label = GOAL_LABELS[state.activeGoal] ?? state.activeGoal
      const subject = state.activeGoalSubject ? ` — ${state.activeGoalSubject}` : ''
      return {
        message: `Let's finish: **${label}${subject}**. Type your next answer to continue.`,
        route: state.activeGoalRoute,
        workflowTrigger: state.activeGoalWorkflow ? `continue ${label.toLowerCase()}` : null,
        action: 'complete',
      }
    }
    return {
      message: "There's nothing in progress to finish. What would you like to complete?",
      route: null,
      workflowTrigger: null,
      action: 'acknowledge',
    }
  }

  if (matchesPhrases(text, TAKE_ME_THERE_PHRASES)) {
    if (state?.activeGoal && state.activeGoalRoute) {
      const label = GOAL_LABELS[state.activeGoal] ?? state.activeGoal
      const subject = state.activeGoalSubject ? ` — ${state.activeGoalSubject}` : ''
      return {
        message: `Taking you to **${label}${subject}**.`,
        route: state.activeGoalRoute,
        workflowTrigger: null,
        action: 'resume',
      }
    }
    return {
      message: "I don't have a specific destination in mind. Where would you like to go?",
      route: null,
      workflowTrigger: null,
      action: 'acknowledge',
    }
  }

  return null
}

/** Returns true when the text is a continuity phrase (without generating a full response). */
export function isContinuityPhrase(text: string): boolean {
  const lower = text.toLowerCase().trim()
  const allPhrases = [
    ...CONTINUE_PHRASES,
    ...GO_BACK_PHRASES,
    ...WHAT_WERE_WE_PHRASES,
    ...FINISH_IT_PHRASES,
    ...TAKE_ME_THERE_PHRASES,
  ]
  return allPhrases.some(p => lower === p || lower.startsWith(p + ' ') || lower.includes(p))
}
