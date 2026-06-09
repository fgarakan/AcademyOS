// Mega Sprint 1565–1594 — DONNA Decision Execution Engine V1
// Canonical types for the execution plan framework.
// Pure type definitions — no imports from other donna modules.
// No DB, no React, no side effects.

// ── Execution type ─────────────────────────────────────────────────────────────

export type DecisionExecutionType =
  | 'promotion_review'
  | 'placement_review'
  | 'coach_assignment'
  | 'assessment_review'
  | 'parent_update_review'
  | 'curriculum_review'
  | 'coach_load_review'

// ── Execution status ────────────────────────────────────────────────────────────

export type DecisionExecutionStatus =
  | 'draft'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'modified'
  | 'executed'
  | 'failed'

// ── Action within a plan ────────────────────────────────────────────────────────

export interface ExecutionAction {
  label:            string
  href:             string
  isPrimary:        boolean
  requiresApproval: boolean  // true when the action leads to the review queue
}

// ── Execution plan ──────────────────────────────────────────────────────────────

export interface DecisionExecutionPlan {
  id:                string             // matches attention item / decision id
  type:              DecisionExecutionType
  headline:          string             // action summary
  recommendation:    string             // specific recommendation for the director
  confidence:        'high' | 'medium' | 'low'
  evidence:          string[]           // signals supporting the recommendation
  risks:             string[]           // consequences if ignored
  actions:           ExecutionAction[]  // primary + optional secondary
  approvalRequired:  boolean            // always true for mutations
  targetHref:        string             // primary destination
  approvalGuardrail: string             // why director approval is required
}

// ── Minimal decision shape for execution engine input ──────────────────────────
// Avoids circular dependency with directorDecisionEngine.ts

export interface DecisionLike {
  id:         string
  headline:   string
  synthesis:  string
  count:      number
  actionHref: string
  urgency:    'high' | 'medium' | 'low'
}

// ── Conversational execution intent ────────────────────────────────────────────

export type ExecutionIntentType =
  | 'fix_it'
  | 'take_me_there'
  | 'review_this'
  | 'what_should_i_do'
  | 'approve_this'
  | 'defer_this'
  | 'show_evidence'
  | 'why_does_this_matter'
