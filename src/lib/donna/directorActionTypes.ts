// Sprint 606 — Director DONNA Action Types V1
// Universal director-side action type taxonomy for AcademyOS.
// Pure TypeScript — no DB calls, no AI calls, no mutations, no side effects.
// Complements donnaActionTypes.ts (Sprint 1020) — director-specific scope, not a replacement.
// Director* prefix throughout to avoid namespace collision with existing DONNA types.

// ── Action class ──────────────────────────────────────────────────────────────
// Controls how DONNA handles a given request category.

export type DirectorActionClass =
  | 'answer_only'               // DONNA explains or summarizes — no state change
  | 'draft_only'                // DONNA creates a proposed_actions draft — director reviews in queue
  | 'review_required'           // DONNA proposes — must pass through director review queue before effect
  | 'director_approval_required'// Requires explicit director approval before any change executes
  | 'platform_owner_required'   // Requires platform-owner authorization beyond director scope
  | 'blocked'                   // Explicitly refused — DONNA explains why and suggests the safe path
  | 'unsafe'                    // Violates architecture safety rules — NEVER automated under any circumstance
  | 'ambiguous'                 // Request is too vague — DONNA asks one clarifying question before acting

// ── Action domain ─────────────────────────────────────────────────────────────
// 24 primary domains covering every director-accessible capability in AcademyOS.

export type DirectorActionDomain =
  | 'academy_setup'
  | 'academy_settings'
  | 'director_dashboard'
  | 'curriculum'
  | 'curriculum_builder'
  | 'global_knowledge'
  | 'media_video'
  | 'templates'
  | 'sessions'
  | 'attendance'
  | 'coach_notes'
  | 'assessments'
  | 'level_movement'
  | 'player_profiles'
  | 'groups_rosters'
  | 'missions'
  | 'badges'
  | 'parent_summaries'
  | 'player_summaries'
  | 'review_queue'
  | 'licensing_health'
  | 'kpi_reporting'
  | 'coach_portal'
  | 'parent_player_visibility'

// ── Implementation status ─────────────────────────────────────────────────────
// Records the current build state of each action's underlying capability.

export type DirectorActionImplementationStatus =
  | 'implemented_and_wired'   // Backend action file + UI entry point both exist and are connected
  | 'implemented_not_wired'   // Backend action file exists; no UI entry point yet surfaced
  | 'partially_implemented'   // Some backend logic exists; incomplete or missing a path
  | 'registry_only'           // Defined here; no backend implementation exists yet
  | 'missing_backend'         // UI pattern exists; backend server action not yet built
  | 'blocked_by_permissions'  // Requires role or platform capability not yet in scope
  | 'unsafe_to_automate'      // Must never be automated — blocked by architecture invariant

// ── Approval level ────────────────────────────────────────────────────────────

export type DirectorApprovalLevel =
  | 'none'            // No approval gate — read-only or self-contained
  | 'director'        // Director must review and approve before execution
  | 'platform_owner'  // Platform-owner authorization required; beyond director scope

// ── UI wiring status ──────────────────────────────────────────────────────────

export type DirectorActionWiringStatus =
  | 'wired'     // UI entry point exists and is connected to the backend action
  | 'partial'   // Partial UI entry point; some paths or flows are missing
  | 'not_wired' // No UI entry point; action is backend-only or registry-only

// ── Core action definition ────────────────────────────────────────────────────

export interface DirectorDonnaAction {
  /** Unique machine-readable identifier — stable across sprints */
  id: string
  /** Human-facing label for UI chips, logs, and reports */
  displayName: string
  /** Representative natural language phrases that trigger this action */
  naturalLanguageExamples: string[]
  /** Primary domain this action belongs to */
  domain: DirectorActionDomain
  /** Safety class — determines how DONNA routes and handles this action */
  actionClass: DirectorActionClass
  /** Roles permitted to trigger this action */
  allowedRoles: string[]
  /** Context objects DONNA needs loaded before it can act */
  requiredContext: string[]
  /** Database object IDs required as input (empty if not object-specific) */
  requiredObjectIds: string[]
  /** Approval gate required before any state change takes effect */
  requiredApprovalLevel: DirectorApprovalLevel
  /** Whether execution could expose data to parents or players */
  parentPlayerVisibilityRisk: boolean
  /** Whether this action must write to audit_logs on execution */
  auditLogRequired: boolean
  /** proposed_actions.target_module value if this action creates a draft row */
  proposedActionType: string | null
  /** Current build state of the underlying backend capability */
  implementationStatus: DirectorActionImplementationStatus
  /** Whether a UI entry point exists and is connected to the backend */
  uiWiringStatus: DirectorActionWiringStatus
  /** Director routes where this action should be surfaced (use '*' for all routes) */
  routes: string[]
  /** Safety constraints and non-negotiable invariants for this action */
  safetyNotes: string[]
  /** What must be built before this action can be fully wired */
  missingDependencies: string[]
}
