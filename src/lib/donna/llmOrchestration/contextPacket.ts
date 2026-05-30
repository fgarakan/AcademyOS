// Sprint 978 — DONNA LLM Orchestration Context Packet
// Assembles the structured context the LLM receives before generating a response.
// Pure TypeScript — no DB, no API, no React.
//
// The context packet is the LLM's complete world model for one DONNA turn.
// It contains only safe, non-sensitive information.
// No raw coach notes, no player observations, no private data.
// No player names unless explicitly included by a future sprint with director approval.
//
// Usage:
//   const packet = buildContextPacket({ role, pathname, pendingReviews, firstName })
//   // packet.systemPrompt — safe system prompt with context
//   // packet.safeSignals — structured data the LLM can reference

import type { OrchestratorRole } from './types'
import type { DirectorNextAction } from '../directorNextActionEngine'
import type { DirectorActionExplanation } from '../directorActionExplanation'

// ── Context packet input ──────────────────────────────────────────────────────

export interface ContextPacketInput {
  /** Role of the current user */
  role: OrchestratorRole
  /** Current page pathname */
  pathname: string
  /** User's first name for personalization */
  firstName?: string | null
  /** Pending review queue items (already loaded in panel state) */
  pendingReviews?: number
  /** The current page's human-readable label */
  pageLabel?: string
  /** Pre-computed next action from directorNextActionEngine (optional) */
  nextAction?: DirectorNextAction | null
  /** Pre-computed action explanation from directorActionExplanation (optional) */
  actionExplanation?: DirectorActionExplanation | null
  /** The director's typed/spoken input */
  userInput: string
}

// ── Safe signals ──────────────────────────────────────────────────────────────

/** Structured safe data the LLM can reference. No raw private data. */
export interface SafeSignals {
  role: OrchestratorRole
  pathname: string
  pageLabel: string
  pendingReviews: number
  hasUrgentItems: boolean
  nextActionId: string | null
  nextActionTitle: string | null
  nextActionSafetyLevel: string | null
  nextActionRequiresApproval: boolean
  actionExplanationSafetyBadge: string | null
  actionExplanationChangesRecords: boolean
}

// ── Context packet ────────────────────────────────────────────────────────────

export interface ContextPacket {
  /** The system prompt to include at the top of the LLM request */
  systemPrompt: string
  /** Structured signals the LLM can reference */
  safeSignals: SafeSignals
  /** The user's input (sanitized) */
  userInput: string
  /** Token-efficient summary for compact LLM requests */
  compactSummary: string
}

// ── Builder ───────────────────────────────────────────────────────────────────

const ROLE_CONTEXT: Record<OrchestratorRole, string> = {
  academy_director: 'You are DONNA, a COO-style operating assistant for an academy director. You have access to academy operational data but never expose raw private data. You help directors make decisions, not make decisions for them.',
  head_coach: 'You are DONNA, a coaching assistant. You help coaches prepare for sessions and submit accurate wrap-ups. You never expose player data to parents or other coaches.',
  coach: 'You are DONNA, a coaching assistant. You help coaches run sessions and submit wrap-ups for director review.',
}

/**
 * Build a structured context packet for the LLM.
 * Contains a system prompt, safe signals, and compact summary.
 * No raw private data included.
 */
export function buildContextPacket(input: ContextPacketInput): ContextPacket {
  const {
    role,
    pathname,
    firstName,
    pendingReviews = 0,
    pageLabel = pathname,
    nextAction = null,
    actionExplanation = null,
    userInput,
  } = input

  const safeSignals: SafeSignals = {
    role,
    pathname,
    pageLabel,
    pendingReviews,
    hasUrgentItems: pendingReviews > 0,
    nextActionId: nextAction?.id ?? null,
    nextActionTitle: nextAction?.title ?? null,
    nextActionSafetyLevel: nextAction?.safetyLevel ?? null,
    nextActionRequiresApproval: nextAction?.requiresApproval ?? false,
    actionExplanationSafetyBadge: actionExplanation?.safetyBadge ?? null,
    actionExplanationChangesRecords: actionExplanation?.changesRecords ?? false,
  }

  const greeting = firstName ? `The director's name is ${firstName}.` : ''

  const systemPrompt = [
    ROLE_CONTEXT[role],
    greeting,
    `Current page: ${pageLabel} (${pathname}).`,
    pendingReviews > 0
      ? `There are ${pendingReviews} pending items in the review queue requiring the director's decision.`
      : 'The review queue is currently clear.',
    nextAction
      ? `Recommended next action: "${nextAction.title}" — ${nextAction.summary.slice(0, 120)}...`
      : '',
    `Safety rule: Never approve, reject, or execute actions autonomously. Never send parent or player communications. Never change player levels, rosters, billing, or curriculum without explicit director action. All proposed changes go through the review queue.`,
    `Output rule: Respond in one of these modes: answer, recommend_next_action, highlight_target, explain_action, draft_proposed_action, route_to_review, or ask_clarifying_question.`,
  ].filter(Boolean).join('\n')

  const compactSummary = [
    `role:${role}`,
    `page:${pageLabel}`,
    `pending:${pendingReviews}`,
    nextAction ? `next:${nextAction.id}` : 'next:none',
  ].join(' ')

  return {
    systemPrompt,
    safeSignals,
    userInput: userInput.slice(0, 500), // cap at 500 chars for safety
    compactSummary,
  }
}
