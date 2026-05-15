// Sprint 365 — Donna Execution Adapter Shell V1
// Interface + shell for execution adapters.
// Defines what will eventually connect Donna approvals to real server actions.
// No actual DB calls. No imports from server-side modules. Pure interface + registry.

import type { DonnaApprovalRequest } from './donnaApprovalContract'

// ── Context + Result types ─────────────────────────────────────────────────────

export interface DonnaExecutionContext {
  userId: string
  academyId: string
  role: string
  sessionId: string
}

export type DonnaExecutionOutcome =
  | 'success'
  | 'not_wired'
  | 'blocked_by_role'
  | 'validation_failed'
  | 'server_error'

export interface DonnaExecutionResult {
  ok: boolean
  outcome?: DonnaExecutionOutcome
  error?: string
  auditId?: string
}

// ── Adapter interface ──────────────────────────────────────────────────────────

export interface DonnaExecutionAdapter {
  /** The workflow this adapter handles */
  workflowId: string
  /** Execute the approved request. Must not be called before director approval. */
  execute(
    request: DonnaApprovalRequest,
    context: DonnaExecutionContext,
  ): Promise<DonnaExecutionResult>
  /** Returns true if this adapter can execute this request in this context. */
  canExecute(
    request: DonnaApprovalRequest,
    context: DonnaExecutionContext,
  ): boolean
}

// ── Registry class ─────────────────────────────────────────────────────────────

export class DonnaExecutionRegistry {
  private _adapters = new Map<string, DonnaExecutionAdapter>()

  /** Register an adapter for a workflowId. Overwrites any existing adapter. */
  register(adapter: DonnaExecutionAdapter): void {
    this._adapters.set(adapter.workflowId, adapter)
  }

  /** Look up an adapter by workflowId. Returns undefined if not registered. */
  lookup(workflowId: string): DonnaExecutionAdapter | undefined {
    return this._adapters.get(workflowId)
  }

  /** Returns all registered workflowIds. */
  registeredWorkflows(): string[] {
    return Array.from(this._adapters.keys())
  }
}

/** Singleton registry — import and use across the app. */
export const executionRegistry = new DonnaExecutionRegistry()

// ── Stub adapter ───────────────────────────────────────────────────────────────
// Demonstrates the pattern. Returns not_wired until a real adapter is wired.

const ClassTemplateExecutionAdapter: DonnaExecutionAdapter = {
  workflowId: 'class_template_creation',

  canExecute(_request: DonnaApprovalRequest, context: DonnaExecutionContext): boolean {
    return context.role === 'academy_director'
  },

  async execute(
    _request: DonnaApprovalRequest,
    _context: DonnaExecutionContext,
  ): Promise<DonnaExecutionResult> {
    // Not yet wired to a real server action — returns not_wired.
    // Sprint 365+: wire to saveAssistantTemplateDraftAction.
    return { ok: false, outcome: 'not_wired' }
  },
}

// Register the stub adapter at module load time.
executionRegistry.register(ClassTemplateExecutionAdapter)
