// Sprint 943 — DONNA Safe Action Router V1
// Routes DONNA tool/action requests through safety levels and approval gates.
// Pure TypeScript — no DB calls, no React, no API calls.
// Returns structured routing decisions — callers execute; the router only decides.
//
// Safety hierarchy:
//   read / ui_guidance  → immediate execution allowed
//   draft               → propose to proposed_actions; director reviews
//   approval_required   → route to review queue; director must click
//   always_blocked      → refuse with safe message; never execute
//
// Usage:
//   import { routeDonnaAction } from '@/lib/donna/donnaSafeActionRouter'
//   const decision = routeDonnaAction('draft_coach_note', 'director', '/director/players/123')
//   if (decision.canExecute) { /* proceed */ }

import type { DonnaContextRole } from './donnaPersonality'
import { getSafetyMessage } from './donnaPersonality'
import {
  getDonnaTool,
  isToolAllowedForRole,
  isToolBlocked,
  buildBlockedToolResponse,
  type DonnaTool,
  type DonnaStructuredOutput,
  type DonnaToolCategory,
} from './donnaToolContract'

// ── Router types ──────────────────────────────────────────────────────────────

export type RoutingOutcome =
  | 'execute_immediately' // Safe to run now — read or ui_guidance
  | 'submit_to_draft'     // Create proposed_actions row; director reviews
  | 'route_to_queue'      // Navigate director to review queue; no auto-execution
  | 'role_blocked'        // This role cannot perform this action
  | 'always_blocked'      // Architecture invariant — always refused

export interface DonnaActionRoutingDecision {
  outcome: RoutingOutcome
  canExecute: boolean
  toolId: string
  tool: DonnaTool | null
  /** Message DONNA should say when explaining this routing decision */
  explanation: string
  /** Route to send user to (for route_to_queue or submit_to_draft confirmation) */
  approvalRoute: string | null
  /** Structured DONNA response to surface to the user */
  donnaResponse: DonnaStructuredOutput
}

// ── Main router ───────────────────────────────────────────────────────────────

/**
 * Route a DONNA action request through safety levels and role permissions.
 * Returns a routing decision — callers decide whether and how to execute.
 */
export function routeDonnaAction(
  toolId: string,
  role: DonnaContextRole,
  currentPath: string,
  params?: Record<string, unknown>,
): DonnaActionRoutingDecision {
  const tool = getDonnaTool(toolId)

  // ── Always blocked ──────────────────────────────────────────────────────────
  if (!tool || isToolBlocked(toolId)) {
    const blocked = buildBlockedToolResponse(toolId)
    return {
      outcome: 'always_blocked',
      canExecute: false,
      toolId,
      tool: tool ?? null,
      explanation: blocked.spokenAnswer,
      approvalRoute: null,
      donnaResponse: blocked,
    }
  }

  // ── Role permission check ───────────────────────────────────────────────────
  if (!isToolAllowedForRole(toolId, role)) {
    const roleMsg = buildRoleBlockedMessage(tool, role)
    return {
      outcome: 'role_blocked',
      canExecute: false,
      toolId,
      tool,
      explanation: roleMsg,
      approvalRoute: null,
      donnaResponse: buildRoleBlockedResponse(tool, role, roleMsg),
    }
  }

  // ── Route by category ───────────────────────────────────────────────────────
  switch (tool.category) {
    case 'read':
    case 'ui_guidance':
      return buildImmediateDecision(tool, currentPath)

    case 'draft':
      return buildDraftDecision(tool, currentPath)

    case 'approval_required':
      return buildApprovalRequiredDecision(tool, currentPath)

    default:
      return buildBlockedDecision(tool, 'Unrecognised tool category.')
  }
}

// ── Category-specific decision builders ──────────────────────────────────────

function buildImmediateDecision(tool: DonnaTool, currentPath: string): DonnaActionRoutingDecision {
  const explanation = `I can help with **${tool.displayName}** right now — this is a safe, read-only action.`
  return {
    outcome: 'execute_immediately',
    canExecute: true,
    toolId: tool.id,
    tool,
    explanation,
    approvalRoute: null,
    donnaResponse: {
      spokenAnswer: explanation,
      reasoningSummary: `Tool ${tool.id} is safe to execute immediately (${tool.category}).`,
      recommendedAction: {
        toolId: tool.id,
        description: tool.description,
        href: currentPath,
        requiresConfirmation: false,
      },
      uiHighlight: null,
      safety: {
        category: tool.category,
        safetyLevel: tool.safetyLevel,
        blockedReason: null,
      },
      toolRequest: { toolId: tool.id, params: {} },
      confidence: 'high',
      sourceNote: null,
    },
  }
}

function buildDraftDecision(tool: DonnaTool, currentPath: string): DonnaActionRoutingDecision {
  const draftNote = getSafetyMessage('draftOnly')
  const explanation = `I'll create a draft of **${tool.displayName}** for your review. ${draftNote}`
  return {
    outcome: 'submit_to_draft',
    canExecute: true,
    toolId: tool.id,
    tool,
    explanation,
    approvalRoute: '/director/review',
    donnaResponse: {
      spokenAnswer: explanation,
      reasoningSummary: `Tool ${tool.id} routes through draft pipeline. Director review required.`,
      recommendedAction: {
        toolId: tool.id,
        description: `Draft: ${tool.description}`,
        href: '/director/review',
        requiresConfirmation: true,
      },
      uiHighlight: null,
      safety: {
        category: tool.category,
        safetyLevel: tool.safetyLevel,
        blockedReason: null,
      },
      toolRequest: null,
      confidence: 'high',
      sourceNote: 'Draft pipeline: proposed_actions → director review',
    },
  }
}

function buildApprovalRequiredDecision(tool: DonnaTool, currentPath: string): DonnaActionRoutingDecision {
  const reviewNote = getSafetyMessage('reviewFirst')
  const explanation = `**${tool.displayName}** requires your explicit approval. ${reviewNote}`
  return {
    outcome: 'route_to_queue',
    canExecute: false,
    toolId: tool.id,
    tool,
    explanation,
    approvalRoute: '/director/review',
    donnaResponse: {
      spokenAnswer: explanation,
      reasoningSummary: `Tool ${tool.id} requires director approval. Routing to review queue.`,
      recommendedAction: {
        toolId: null,
        description: 'Go to the Review Center to complete this action.',
        href: '/director/review',
        requiresConfirmation: false,
      },
      uiHighlight: {
        targetId: 'pending-review-list',
        label: 'Review Center',
        route: '/director/review',
      },
      safety: {
        category: tool.category,
        safetyLevel: tool.safetyLevel,
        blockedReason: tool.blockedReason,
      },
      toolRequest: null,
      confidence: 'high',
      sourceNote: 'Approval required: execute_approved_action() is the only execution path',
    },
  }
}

function buildBlockedDecision(tool: DonnaTool, reason: string): DonnaActionRoutingDecision {
  return {
    outcome: 'always_blocked',
    canExecute: false,
    toolId: tool.id,
    tool,
    explanation: reason,
    approvalRoute: null,
    donnaResponse: buildBlockedToolResponse(tool.id),
  }
}

function buildRoleBlockedMessage(tool: DonnaTool, role: DonnaContextRole): string {
  const ROLE_LABELS: Record<DonnaContextRole, string> = {
    director: 'director',
    coach: 'coach',
    parent: 'parent',
    player: 'player',
    platform: 'platform owner',
  }
  return `**${tool.displayName}** is not available for the ${ROLE_LABELS[role]} role. ${
    tool.category === 'draft'
      ? 'This action requires director access.'
      : tool.blockedReason ?? 'Check with your director for access.'
  }`
}

function buildRoleBlockedResponse(
  tool: DonnaTool,
  role: DonnaContextRole,
  message: string,
): DonnaStructuredOutput {
  return {
    spokenAnswer: message,
    reasoningSummary: `Role ${role} is not permitted to use tool ${tool.id}.`,
    recommendedAction: null,
    uiHighlight: null,
    safety: {
      category: tool.category,
      safetyLevel: 'blocked',
      blockedReason: message,
    },
    toolRequest: null,
    confidence: 'blocked',
    sourceNote: null,
  }
}

// ── Batch routing ─────────────────────────────────────────────────────────────

/**
 * Route multiple tools at once — returns the safest executable one.
 * Prefers immediate → draft → approval_required → blocked.
 */
export function routeBestAction(
  toolIds: readonly string[],
  role: DonnaContextRole,
  currentPath: string,
): DonnaActionRoutingDecision | null {
  const decisions = toolIds
    .map(id => routeDonnaAction(id, role, currentPath))
    .filter(d => d.outcome !== 'always_blocked' && d.outcome !== 'role_blocked')

  const OUTCOME_ORDER: Record<RoutingOutcome, number> = {
    execute_immediately: 0,
    submit_to_draft: 1,
    route_to_queue: 2,
    role_blocked: 3,
    always_blocked: 4,
  }

  return decisions.sort((a, b) => OUTCOME_ORDER[a.outcome] - OUTCOME_ORDER[b.outcome])[0] ?? null
}

// ── Safety audit helpers ──────────────────────────────────────────────────────

/** Returns all tools that a given role can use immediately (no approval). */
export function getImmediateToolsForRole(role: DonnaContextRole): DonnaTool[] {
  return ['read', 'ui_guidance']
    .flatMap(cat => {
      const { getToolsByCategory } = require('./donnaToolContract')
      return getToolsByCategory(cat as DonnaToolCategory) as DonnaTool[]
    })
    .filter(t => isToolAllowedForRole(t.id, role))
}

/** Returns all tools that affect parent/player visibility — must not bypass approval. */
export function getParentPlayerVisibilityTools(): DonnaTool[] {
  const { DONNA_TOOLS } = require('./donnaToolContract')
  return (DONNA_TOOLS as DonnaTool[]).filter(t => t.affectsParentOrPlayerVisibility)
}
