// Sprint 1078 — DONNA Product Memory / Approved Learning V1
//
// Approval-safe product memory foundation for DONNA behavioral rules.
//
// Design principles:
//   - DONNA never learns automatically from messages. Memory items are always PROPOSED first.
//   - A memory item only becomes active when `status === 'approved'` — explicit approval required.
//   - Every memory item has a `proposedRule` (the actionable rule) and `sourceText` (the origin).
//   - `safetyNotes` captures known risks or constraints on the rule.
//   - `requiresApproval` is always true for rules that touch mutations, communications, or records.
//   - This is a pure TypeScript foundation — not wired into runtime in this sprint.
//
// Relationship to existing memory systems:
//   - donnaSafeSessionMemory.ts   — session navigation context (cleared on browser close)
//   - donnaChatSessionMemory.ts   — in-session chat thread (RAM only)
//   - donnaSemanticMemory.ts      — entity embeddings (DB via migration 074)
//   - donnaMemoryPolicy.ts        — memory category taxonomy and retention policy
//   - knowledgeReviewQueue.ts     — external knowledge review pipeline (closest analog)
//   - THIS FILE: product rules and approved behavioral standards for DONNA
//
// Future wiring:
//   - Inject approved rules into orchestrator system prompt (Sprint 1079+)
//   - Use getApprovedProductMemoryByCategory to surface rules in relevant page contexts
//   - Build a director-facing memory review UI when the review queue supports it
//
// Pure TypeScript — no DB, no API, no mutations, no side effects.

// ── Category types ─────────────────────────────────────────────────────────────

/**
 * Category of the product memory item.
 * Determines which part of DONNA's behavior this rule governs.
 */
export type ProductMemoryCategory =
  | 'product_rule'              // General product-level rule (not category-specific)
  | 'ux_standard'               // UI/UX standards — cognitive load, interaction patterns, labeling
  | 'donna_behavior_rule'       // How DONNA answers, asks, routes, or declines
  | 'curriculum_rule'           // Curriculum structure, level progression, content standards
  | 'fitness_rule'              // Fitness template design, age-appropriateness, load standards
  | 'parent_communication_rule' // Parent-safe content, approval requirements, tone standards
  | 'safety_rule'               // Approval gates, mutation guards, privacy boundaries
  | 'business_rule'             // Academy operating model, approval flows, role boundaries

// ── Source type ────────────────────────────────────────────────────────────────

/**
 * Origin of the product memory item.
 * Tracks where the rule came from for auditability.
 */
export type ProductMemorySourceType =
  | 'director_correction'   // Director corrected DONNA's behavior in a session
  | 'sprint_decision'       // Codified from an explicit sprint implementation decision
  | 'product_policy'        // From a product policy document (CLAUDE.md, AI_BACKEND_RULES, etc.)
  | 'curriculum_standard'   // From the curriculum architecture or tennis development standards
  | 'pilot_feedback'        // From pilot director feedback (e.g. Dabul Tennis Academy)

// ── Status ─────────────────────────────────────────────────────────────────────

/**
 * Lifecycle status of a product memory item.
 *
 * proposed  — created but not yet approved. Not active.
 * approved  — explicitly approved by an authorized party. DONNA may use this rule.
 * rejected  — reviewed and declined. Not active. Preserved for audit trail.
 * archived  — previously approved but no longer relevant. Not active.
 */
export type ProductMemoryStatus = 'proposed' | 'approved' | 'rejected' | 'archived'

// ── Scope ──────────────────────────────────────────────────────────────────────

/**
 * Scope of the product memory item.
 *
 * global       — applies across all routes, roles, and sessions
 * academy      — applies to a specific academy (future: per-academy customization)
 * page_specific — applies only to specific routes (use relatedRoutes to specify)
 */
export type ProductMemoryScope = 'global' | 'academy' | 'page_specific'

// ── Visibility ─────────────────────────────────────────────────────────────────

/**
 * Who can see or is affected by this memory item.
 *
 * director_only — affects DONNA's behavior for director-role sessions only
 * all_roles     — applies to DONNA behavior across all roles
 * internal      — platform/developer use only; not surfaced in director-facing answers
 */
export type ProductMemoryVisibility = 'director_only' | 'all_roles' | 'internal'

// ── Approval metadata ──────────────────────────────────────────────────────────

export interface ProductMemoryApprovalMeta {
  /** Who approved this item — role string (e.g. 'academy_director') or user ID. */
  approvedBy: string
  /** ISO 8601 timestamp of approval. */
  approvedAt: string
  /** Optional note from the approver. */
  notes: string | null
}

// ── Main interface ─────────────────────────────────────────────────────────────

/**
 * A single product memory item representing a behavioral rule DONNA should follow.
 *
 * Only `status === 'approved'` items are active. Proposed items are pending review.
 * DONNA never learns automatically — all items are created via createProposedProductMemory
 * and require explicit approval via approveProductMemoryItem.
 */
export interface ProductMemoryItem {
  /** Unique identifier — stable, kebab-case. */
  memoryId: string
  /** Human-readable title for display, logging, and review UI. */
  title: string
  /** Category of the rule — determines which DONNA behavior domain it governs. */
  category: ProductMemoryCategory
  /** Origin of this memory item. */
  sourceType: ProductMemorySourceType
  /** The original text, correction, or policy statement that produced this rule. */
  sourceText: string
  /** The actionable rule DONNA should follow when this item is approved. */
  proposedRule: string
  /** How broadly this rule applies. */
  scope: ProductMemoryScope
  /** Who this rule affects. */
  visibility: ProductMemoryVisibility
  /** Lifecycle status. Only 'approved' items are active. */
  status: ProductMemoryStatus
  /**
   * Whether this item required director approval before becoming active.
   * Always true for rules touching mutations, communications, or sensitive records.
   */
  requiresApproval: boolean
  /**
   * Approval metadata. Null until the item is approved.
   * Preserved (non-null) after approval even if later archived.
   */
  approvalMeta: ProductMemoryApprovalMeta | null
  /** ISO 8601 creation timestamp. */
  createdAt: string
  /** Routes where this rule is particularly relevant. Empty for global rules. */
  relatedRoutes: string[]
  /**
   * Module or feature names that this rule applies to.
   * E.g. ['fitness_builder', 'class_template_builder', 'parent_updates']
   */
  relatedModules: string[]
  /**
   * Known safety constraints, edge cases, or risks with this rule.
   * Null if no specific safety note applies.
   */
  safetyNotes: string | null
}

// ── Builder input type ─────────────────────────────────────────────────────────

/** Input shape for createProposedProductMemory. */
export interface CreateProductMemoryInput {
  memoryId: string
  title: string
  category: ProductMemoryCategory
  sourceType: ProductMemorySourceType
  sourceText: string
  proposedRule: string
  scope: ProductMemoryScope
  visibility: ProductMemoryVisibility
  requiresApproval?: boolean
  relatedRoutes?: string[]
  relatedModules?: string[]
  safetyNotes?: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Create a new product memory item in 'proposed' status.
 * The item is NOT active until approved via approveProductMemoryItem.
 *
 * @example
 * const item = createProposedProductMemory({
 *   memoryId: 'donna-answers-from-page-context',
 *   title: 'DONNA answers from page context before asking for clarification',
 *   category: 'donna_behavior_rule',
 *   sourceType: 'product_policy',
 *   sourceText: 'When a director asks a question on a page where DONNA has context, answer first.',
 *   proposedRule: 'DONNA must use available page context before requesting clarification.',
 *   scope: 'global',
 *   visibility: 'director_only',
 * })
 */
export function createProposedProductMemory(
  input: CreateProductMemoryInput,
): ProductMemoryItem {
  return {
    memoryId: input.memoryId,
    title: input.title,
    category: input.category,
    sourceType: input.sourceType,
    sourceText: input.sourceText,
    proposedRule: input.proposedRule,
    scope: input.scope,
    visibility: input.visibility,
    status: 'proposed',
    requiresApproval: input.requiresApproval ?? true,
    approvalMeta: null,
    createdAt: new Date().toISOString(),
    relatedRoutes: input.relatedRoutes ?? [],
    relatedModules: input.relatedModules ?? [],
    safetyNotes: input.safetyNotes ?? null,
  }
}

/**
 * Approve a product memory item. Returns a new object with status 'approved'
 * and approvalMeta populated.
 * Does NOT mutate the input item — pure function.
 *
 * @example
 * const approved = approveProductMemoryItem(proposed, {
 *   approvedBy: 'academy_director',
 *   approvedAt: new Date().toISOString(),
 *   notes: 'Confirmed matches Sprint 1071 behavior',
 * })
 */
export function approveProductMemoryItem(
  item: ProductMemoryItem,
  approvalMeta: ProductMemoryApprovalMeta,
): ProductMemoryItem {
  return {
    ...item,
    status: 'approved',
    approvalMeta,
  }
}

/**
 * Reject a product memory item. Returns a new object with status 'rejected'
 * and a rejection note in safetyNotes.
 * Does NOT mutate the input item — pure function.
 * Preserves the original safetyNotes alongside the rejection reason.
 */
export function rejectProductMemoryItem(
  item: ProductMemoryItem,
  reason: string,
): ProductMemoryItem {
  const existingNotes = item.safetyNotes ? `${item.safetyNotes}\n` : ''
  return {
    ...item,
    status: 'rejected',
    safetyNotes: `${existingNotes}Rejected: ${reason}`,
  }
}

/**
 * Filter a collection of memory items to those that are approved and match
 * the given category. Use this to retrieve active rules for a domain.
 *
 * @example
 * const fitnessRules = getApprovedProductMemoryByCategory(SEED_PRODUCT_MEMORY, 'fitness_rule')
 * // Returns only approved fitness_rule items from the collection.
 */
export function getApprovedProductMemoryByCategory(
  items: ProductMemoryItem[],
  category: ProductMemoryCategory,
): ProductMemoryItem[] {
  return items.filter(i => i.status === 'approved' && i.category === category)
}

// ── Seed approved memory ───────────────────────────────────────────────────────
//
// These items represent locked AcademyOS rules that are already in effect —
// they are created in 'approved' status to reflect decisions made in prior sprints.
// Sprints 1071, 1073, 1074, 1075, 1076, 1077 all implement these rules in code.
// This registry formalises them as inspectable, auditable product memory.

const SEED_APPROVAL: ProductMemoryApprovalMeta = {
  approvedBy: 'sprint_policy',
  approvedAt: '2026-05-31T00:00:00.000Z',
  notes: 'Codified from existing sprint implementations and product policy documents.',
}

export const SEED_PRODUCT_MEMORY: ProductMemoryItem[] = [

  // ── DONNA Behavior Rule: answer from page context first ──────────────────────
  {
    memoryId: 'donna-answers-from-page-context-first',
    title: 'DONNA answers from page context before asking for clarification',
    category: 'donna_behavior_rule',
    sourceType: 'product_policy',
    sourceText:
      'Sprint 1071 fixed DONNA asking for clarification on the Academy Health page when the page data was sufficient. ' +
      'Sprint 1073 wired context-pack answers as the first check in handleDonnaCooPrompt before routeDonnaPrompt.',
    proposedRule:
      'When a director asks a question on a page where DONNA has access to relevant context ' +
      '(page-specific context pack, academy profile, or registered action), DONNA must answer ' +
      'from that context first. DONNA only asks for clarification when the available context ' +
      'is genuinely insufficient to produce a grounded answer.',
    scope: 'global',
    visibility: 'director_only',
    status: 'approved',
    requiresApproval: false,
    approvalMeta: SEED_APPROVAL,
    createdAt: '2026-05-31T00:00:00.000Z',
    relatedRoutes: [
      '/director/kpi',
      '/director/review',
      '/director/fitness/templates/[templateId]',
      '/director/class-templates/[templateId]',
      '/director/players',
      '/director/sessions',
      '/director/parents',
    ],
    relatedModules: ['context_pack_registry', 'donna_conversational_router', 'god_mode_orchestrator'],
    safetyNotes:
      'Context-pack answers are authoritative for their page scope. ' +
      'God Mode (LLM) is the fallback for questions outside all page context definitions.',
  },

  // ── Safety Rule: no mutations without approval ───────────────────────────────
  {
    memoryId: 'donna-never-mutates-without-approval',
    title: 'DONNA never mutates official records without explicit director approval',
    category: 'safety_rule',
    sourceType: 'product_policy',
    sourceText:
      'From CLAUDE.md: "AI proposes → Director/Head Coach approves → System records → System executes." ' +
      'From AI_BACKEND_RULES.md: execute_approved_action() is the only function that executes approved voice actions. ' +
      'All major mutations write to audit_logs.',
    proposedRule:
      'DONNA never directly writes to player records, session records, curriculum definitions, ' +
      'parent communications, attendance records, or any official academy data. ' +
      'All consequential actions must produce a draft in proposed_actions or route to the review queue ' +
      'for explicit director approval. No action executes automatically.',
    scope: 'global',
    visibility: 'all_roles',
    status: 'approved',
    requiresApproval: true,
    approvalMeta: SEED_APPROVAL,
    createdAt: '2026-05-31T00:00:00.000Z',
    relatedRoutes: ['/director/review', '/director/level-up', '/director/parents'],
    relatedModules: [
      'proposed_actions_pipeline',
      'execute_approved_action',
      'review_queue',
      'donna_action_registry',
    ],
    safetyNotes:
      'This rule is a hard architectural invariant — not a preference. ' +
      'finalize_player_placement() and execute_approved_action() are the only valid mutation paths. ' +
      'Any DONNA output that implies direct mutation should be treated as a safety regression.',
  },

  // ── Fitness Rule: younger players need game-based, broad fitness ─────────────
  {
    memoryId: 'younger-fitness-game-based-broad',
    title: 'Fitness for younger players must be game-based, broad, and developmentally appropriate',
    category: 'fitness_rule',
    sourceType: 'curriculum_standard',
    sourceText:
      'Red Ball (under 8) and Orange Ball players are in foundational movement stages. ' +
      'Isolated strength, heavy plyometrics, and high-intensity drills are inappropriate. ' +
      'Sprint 1072 Fitness Builder context pack and Sprint 1076 action registry both encode ' +
      '"make this more game-based" guidance around competitive movement challenges and fitness games.',
    proposedRule:
      'For Red Ball and Orange Ball curriculum levels, fitness templates must prioritise: ' +
      '(1) game-based exercises over isolated drills, ' +
      '(2) coordination, rhythm, balance, and reaction — the four foundational movement attributes, ' +
      '(3) cooperative pressure formats and agility games over heavy loading. ' +
      'DONNA must flag load concerns (Sprint 1068 load-check step) when templates include ' +
      'plyometrics, strength blocks, or speed work for these age groups.',
    scope: 'global',
    visibility: 'director_only',
    status: 'approved',
    requiresApproval: false,
    approvalMeta: SEED_APPROVAL,
    createdAt: '2026-05-31T00:00:00.000Z',
    relatedRoutes: [
      '/director/fitness/templates/[templateId]',
      '/director/fitness/templates',
      '/director/curriculum',
    ],
    relatedModules: ['fitness_builder', 'load_check', 'curriculum_levels', 'donna_action_registry'],
    safetyNotes:
      'Load flags (Review Load / Caution) in the Fitness Builder are the enforcement mechanism. ' +
      'DONNA guidance alone is advisory — the director must confirm or remove flagged blocks. ' +
      'Do not auto-remove exercises or auto-change block intensity from DONNA chat.',
  },

  // ── Parent Communication Rule: parent-safe and approval-gated ───────────────
  {
    memoryId: 'parent-communication-parent-safe-approval-gated',
    title: 'All parent communications must be parent-safe and require director approval before sending',
    category: 'parent_communication_rule',
    sourceType: 'product_policy',
    sourceText:
      'From CLAUDE.md: "Expose parent/player data to unauthorized roles" is listed under "Never do without explicit sprint approval." ' +
      'From AI_BACKEND_RULES.md: parentSafeResponseRules.ts governs what content may reach parents. ' +
      'Sprint 1072 Parent Updates context pack neverDoRules include five explicit prohibitions on auto-sending and raw-note exposure.',
    proposedRule:
      'Parent communications must satisfy ALL of the following before delivery: ' +
      '(1) Content passes the parent-safe filter — no raw coach notes, no internal observations, ' +
      'no unreviewed assessments, no data about other players. ' +
      '(2) Drafts route through proposed_actions or the review queue. ' +
      '(3) The director explicitly approves the draft. ' +
      '(4) The director manually dispatches the approved communication. ' +
      'DONNA never auto-sends, never schedules sends, and never surfaces one player\'s data to a ' +
      'parent not linked to that player via guardian records.',
    scope: 'global',
    visibility: 'director_only',
    status: 'approved',
    requiresApproval: true,
    approvalMeta: SEED_APPROVAL,
    createdAt: '2026-05-31T00:00:00.000Z',
    relatedRoutes: ['/director/parents', '/director/review', '/director/players/[playerId]'],
    relatedModules: [
      'parent_safe_response_rules',
      'proposed_actions_pipeline',
      'parent_update_draft',
      'review_queue',
    ],
    safetyNotes:
      'parentSafeResponseRules.ts in src/lib/communications/ defines the content filter. ' +
      'guardian-to-player linking via player_guardians table is a precondition for any parent communication. ' +
      'Auto-sending is an architecture invariant — not a preference — and must never be relaxed without explicit sprint authorization.',
  },

]
