// Sprint 942 — DONNA Tool Calling Contract V1
// Defines the types, categories, and validation schema for DONNA's tool/action system.
// Pure TypeScript — no DB calls, no React, no API calls, no mutations.
//
// This contract governs how DONNA requests tools and how callers validate the output.
// All consequential actions go through the draft/review/approval pipeline.
// DONNA never executes approval_required or always_blocked tools directly.
//
// Usage:
//   import { validateDonnaOutput, DONNA_TOOL_CATEGORIES } from '@/lib/donna/donnaToolContract'
//   const result = validateDonnaOutput(rawOutput)
//   if (result.valid) { /* use result.output */ }

// ── Tool categories ───────────────────────────────────────────────────────────

/**
 * Five categories of DONNA tools, ordered from safest to most restricted.
 */
export type DonnaToolCategory =
  | 'read'              // Safe read-only data access — no state change
  | 'ui_guidance'       // Navigate, highlight, explain — no state change
  | 'draft'             // Create a proposed_actions row — requires review
  | 'approval_required' // Requires explicit director click — DONNA never executes
  | 'always_blocked'    // Never callable by DONNA regardless of context

// ── Tool safety levels ────────────────────────────────────────────────────────

export type DonnaToolSafetyLevel =
  | 'immediate'         // Safe to execute immediately — no approval needed
  | 'draft_to_review'   // Creates a draft; director reviews before any effect
  | 'director_approval' // DONNA routes to review queue; director must click
  | 'platform_required' // Needs platform-owner authorization
  | 'blocked'           // Must never be executed

// ── Tool definition ───────────────────────────────────────────────────────────

export interface DonnaTool {
  id: string
  displayName: string
  description: string
  category: DonnaToolCategory
  safetyLevel: DonnaToolSafetyLevel
  allowedRoles: readonly string[]
  requiresApproval: boolean
  /** True if this tool makes a DB write (even via draft pathway) */
  makesDbWrite: boolean
  /** True if this tool affects records that parents or players could see */
  affectsParentOrPlayerVisibility: boolean
  naturalLanguageExamples: readonly string[]
  blockedReason: string | null
}

// ── Tool registry ─────────────────────────────────────────────────────────────

export const DONNA_TOOLS: readonly DonnaTool[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // READ TOOLS — immediate, no state change
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'read_page_context',
    displayName: 'Read page context',
    description: 'Read the current page capability map — purpose, safe context, suggested actions.',
    category: 'read',
    safetyLevel: 'immediate',
    allowedRoles: ['director', 'coach', 'parent', 'player'],
    requiresApproval: false,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Where am I?', 'What is this page?', 'Explain this page.'],
    blockedReason: null,
  },
  {
    id: 'read_pending_review_count',
    displayName: 'Read pending review count',
    description: 'Read the count of pending proposed_actions items from the loaded director context.',
    category: 'read',
    safetyLevel: 'immediate',
    allowedRoles: ['director'],
    requiresApproval: false,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['How many items are pending?', 'What is in the review queue?'],
    blockedReason: null,
  },
  {
    id: 'read_academy_kpis',
    displayName: 'Read academy KPIs',
    description: 'Read the live academy KPI summary from the loaded director context.',
    category: 'read',
    safetyLevel: 'immediate',
    allowedRoles: ['director'],
    requiresApproval: false,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['What are my KPIs?', 'Show me academy health.', 'Explain these metrics.'],
    blockedReason: null,
  },
  {
    id: 'read_player_context',
    displayName: 'Read player development context',
    description: 'Read a player\'s development summary — level, priorities, recent signals. Director-only; never exposed to parents/players.',
    category: 'read',
    safetyLevel: 'immediate',
    allowedRoles: ['director', 'coach'],
    requiresApproval: false,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Summarise this player.', 'What is their current level?', 'What signals are there?'],
    blockedReason: null,
  },
  {
    id: 'read_coach_sessions',
    displayName: 'Read coach session list',
    description: 'Read the coach\'s session schedule — today\'s sessions, pending wrap-ups.',
    category: 'read',
    safetyLevel: 'immediate',
    allowedRoles: ['coach'],
    requiresApproval: false,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ["What sessions do I have today?", 'Do I have pending wrap-ups?'],
    blockedReason: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // UI GUIDANCE TOOLS — navigate, highlight, explain
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'navigate_to_page',
    displayName: 'Navigate to a page',
    description: 'Offer navigation to a named route with optional highlight target. Director says "yes" to confirm.',
    category: 'ui_guidance',
    safetyLevel: 'immediate',
    allowedRoles: ['director', 'coach', 'parent', 'player'],
    requiresApproval: false,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Take me to the review queue.', 'Open players.', 'Show me sessions.'],
    blockedReason: null,
  },
  {
    id: 'highlight_element',
    displayName: 'Highlight a UI element',
    description: 'Set a teal focus target and dispatch donna:highlight to visually point to a registered element.',
    category: 'ui_guidance',
    safetyLevel: 'immediate',
    allowedRoles: ['director', 'coach'],
    requiresApproval: false,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Show me where to click.', 'Point to the wrap-up button.', 'What should I tap?'],
    blockedReason: null,
  },
  {
    id: 'explain_page_element',
    displayName: 'Explain a page element',
    description: 'Explain what a registered UI element does, when to use it, and its safety level.',
    category: 'ui_guidance',
    safetyLevel: 'immediate',
    allowedRoles: ['director', 'coach', 'parent', 'player'],
    requiresApproval: false,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['What does this button do?', 'Explain the Review Center.', 'What happens if I tap Submit?'],
    blockedReason: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DRAFT TOOLS — create proposed_actions rows; require director review
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'draft_attendance_exception',
    displayName: 'Draft an attendance exception',
    description: 'Create a proposed_actions row for an attendance exception. Director reviews before records are updated.',
    category: 'draft',
    safetyLevel: 'draft_to_review',
    allowedRoles: ['director', 'coach'],
    requiresApproval: true,
    makesDbWrite: true,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Mark Marcus absent today.', 'Note that Sofia missed this session.'],
    blockedReason: null,
  },
  {
    id: 'draft_coach_note',
    displayName: 'Draft a coach observation note',
    description: 'Create a proposed player observation note for director review. Not official until approved.',
    category: 'draft',
    safetyLevel: 'draft_to_review',
    allowedRoles: ['director', 'coach'],
    requiresApproval: true,
    makesDbWrite: true,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Note that Marcus struggled with backhand.', 'Add an observation for Sofia.'],
    blockedReason: null,
  },
  {
    id: 'draft_parent_summary',
    displayName: 'Draft a parent progress update',
    description: 'Create a parent-safe draft communication for director review. Never sent automatically.',
    category: 'draft',
    safetyLevel: 'draft_to_review',
    allowedRoles: ['director'],
    requiresApproval: true,
    makesDbWrite: true,
    affectsParentOrPlayerVisibility: true,
    naturalLanguageExamples: ["Draft a progress update for Marcus's parent.", 'Prepare a parent summary.'],
    blockedReason: null,
  },
  {
    id: 'draft_curriculum_item',
    displayName: 'Draft a curriculum item',
    description: 'Create a proposed curriculum drill, gate, or skill for director review. Not published until approved.',
    category: 'draft',
    safetyLevel: 'draft_to_review',
    allowedRoles: ['director'],
    requiresApproval: true,
    makesDbWrite: true,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Add a drill for Orange 2.', 'Propose a new gate for Red 1.'],
    blockedReason: null,
  },
  {
    id: 'draft_player_advancement',
    displayName: 'Draft a player advancement proposal',
    description: 'Create a proposed level-advancement row for director review. Never moves a player automatically.',
    category: 'draft',
    safetyLevel: 'draft_to_review',
    allowedRoles: ['director'],
    requiresApproval: true,
    makesDbWrite: true,
    affectsParentOrPlayerVisibility: true,
    naturalLanguageExamples: ['Propose advancing Marcus.', 'Draft a level change for Sofia.'],
    blockedReason: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVAL-REQUIRED TOOLS — route to review queue; director must click
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'approve_review_item',
    displayName: 'Approve a review queue item',
    description: 'DONNA routes to the review queue. The director must click Approve — DONNA never calls execute_approved_action() directly.',
    category: 'approval_required',
    safetyLevel: 'director_approval',
    allowedRoles: ['director'],
    requiresApproval: true,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Approve this.', 'Accept the wrap-up.'],
    blockedReason: 'DONNA cannot execute approvals. The director must click Approve in the review queue.',
  },
  {
    id: 'move_player_level',
    displayName: 'Move a player to a new level',
    description: 'DONNA can draft a level-change proposal but cannot activate a player directly. finalize_player_placement() is the only execution path.',
    category: 'approval_required',
    safetyLevel: 'director_approval',
    allowedRoles: ['director'],
    requiresApproval: true,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: true,
    naturalLanguageExamples: ['Move Marcus to Orange 2.', 'Advance Sofia.'],
    blockedReason: 'DONNA drafts the proposal; finalize_player_placement() is the only execution path.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ALWAYS-BLOCKED TOOLS — architecture invariants
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'send_parent_message_direct',
    displayName: 'Send a message to a parent directly',
    description: 'DONNA never auto-sends communications. All parent messages require explicit director approval.',
    category: 'always_blocked',
    safetyLevel: 'blocked',
    allowedRoles: [],
    requiresApproval: true,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: true,
    naturalLanguageExamples: ["Send a message to Marcus's mom.", 'Email Sofia\'s parent.'],
    blockedReason: 'DONNA never sends communications automatically. Draft + director approval required.',
  },
  {
    id: 'delete_record',
    displayName: 'Delete or archive a record',
    description: 'Deletion and archival of records is always a human-only UI action.',
    category: 'always_blocked',
    safetyLevel: 'blocked',
    allowedRoles: [],
    requiresApproval: true,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Delete this player.', 'Remove this session.'],
    blockedReason: 'Deletion is always a manual action. DONNA never deletes.',
  },
  {
    id: 'bypass_review_queue',
    displayName: 'Bypass the review queue',
    description: 'Architecture invariant — execute_approved_action() is the only execution path and is never called by DONNA.',
    category: 'always_blocked',
    safetyLevel: 'blocked',
    allowedRoles: [],
    requiresApproval: true,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Just do it.', 'Skip the review.', 'Apply immediately.'],
    blockedReason: 'Review queue is an architecture invariant. DONNA never bypasses it.',
  },
  {
    id: 'cross_tenant_access',
    displayName: 'Access data from another academy',
    description: 'RLS enforces strict tenant isolation. DONNA has no cross-tenant capability.',
    category: 'always_blocked',
    safetyLevel: 'blocked',
    allowedRoles: [],
    requiresApproval: true,
    makesDbWrite: false,
    affectsParentOrPlayerVisibility: false,
    naturalLanguageExamples: ['Show me another academy.', 'Compare with other academies.'],
    blockedReason: 'All data is scoped to academy_id. Cross-tenant access is impossible.',
  },
]

// ── Structured output schema ──────────────────────────────────────────────────

/**
 * The validated output shape for a DONNA response to any user prompt.
 * Used by Shell A and Shell B to structure responses before rendering.
 */
export interface DonnaStructuredOutput {
  /** The text DONNA should speak or display */
  spokenAnswer: string
  /** Short reasoning summary (not shown to user — used for logging) */
  reasoningSummary: string
  /** The recommended action/next step */
  recommendedAction: {
    toolId: string | null
    description: string
    href: string | null
    requiresConfirmation: boolean
  } | null
  /** UI highlight guidance */
  uiHighlight: {
    targetId: string
    label: string
    route: string
  } | null
  /** Safety classification of this response */
  safety: {
    category: DonnaToolCategory
    safetyLevel: DonnaToolSafetyLevel
    blockedReason: string | null
  }
  /** Optional tool request for callers to execute */
  toolRequest: {
    toolId: string
    params: Record<string, unknown>
  } | null
  /** Data confidence */
  confidence: 'high' | 'partial' | 'blocked'
  /** Source attribution */
  sourceNote: string | null
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface DonnaOutputValidationResult {
  valid: boolean
  output: DonnaStructuredOutput | null
  errors: string[]
}

/**
 * Validate a raw DONNA output object against the structured output schema.
 * Returns a typed output or an error list.
 */
export function validateDonnaOutput(
  raw: unknown,
): DonnaOutputValidationResult {
  const errors: string[] = []

  if (!raw || typeof raw !== 'object') {
    return { valid: false, output: null, errors: ['Output must be an object.'] }
  }

  const obj = raw as Record<string, unknown>

  if (typeof obj.spokenAnswer !== 'string' || !obj.spokenAnswer.trim()) {
    errors.push('spokenAnswer must be a non-empty string.')
  }
  if (typeof obj.reasoningSummary !== 'string') {
    errors.push('reasoningSummary must be a string.')
  }
  if (!['high', 'partial', 'blocked'].includes(obj.confidence as string)) {
    errors.push('confidence must be "high", "partial", or "blocked".')
  }

  if (obj.safety) {
    const safety = obj.safety as Record<string, unknown>
    if (!['read', 'ui_guidance', 'draft', 'approval_required', 'always_blocked'].includes(safety.category as string)) {
      errors.push('safety.category is invalid.')
    }
    if (!['immediate', 'draft_to_review', 'director_approval', 'platform_required', 'blocked'].includes(safety.safetyLevel as string)) {
      errors.push('safety.safetyLevel is invalid.')
    }
  }

  if (errors.length > 0) {
    return { valid: false, output: null, errors }
  }

  return {
    valid: true,
    output: obj as unknown as DonnaStructuredOutput,
    errors: [],
  }
}

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getDonnaTool(id: string): DonnaTool | undefined {
  return DONNA_TOOLS.find(t => t.id === id)
}

export function getToolsByCategory(category: DonnaToolCategory): DonnaTool[] {
  return DONNA_TOOLS.filter(t => t.category === category) as DonnaTool[]
}

export function isToolAllowedForRole(toolId: string, role: string): boolean {
  const tool = getDonnaTool(toolId)
  if (!tool) return false
  if (tool.category === 'always_blocked') return false
  return tool.allowedRoles.includes(role)
}

export function isToolBlocked(toolId: string): boolean {
  const tool = getDonnaTool(toolId)
  return !tool || tool.category === 'always_blocked'
}

/** Returns a safe blocked-tool response for the given tool ID. */
export function buildBlockedToolResponse(toolId: string): DonnaStructuredOutput {
  const tool = getDonnaTool(toolId)
  const reason = tool?.blockedReason ?? 'This action is not available.'
  return {
    spokenAnswer: reason,
    reasoningSummary: `Tool ${toolId} is always blocked.`,
    recommendedAction: null,
    uiHighlight: null,
    safety: {
      category: 'always_blocked',
      safetyLevel: 'blocked',
      blockedReason: reason,
    },
    toolRequest: null,
    confidence: 'blocked',
    sourceNote: null,
  }
}
