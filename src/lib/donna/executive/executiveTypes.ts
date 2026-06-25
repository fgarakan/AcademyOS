// Mega Sprint 3661–3690 — DONNA Executive Conversational Readiness V1
// Part 3 — Shared executive types.
//
// The plain input bag the executive layer reasons over. The live pipeline adapts
// its existing state into a ResolverState (Phase 2 wiring); the certification
// constructs one directly. Keeping this decoupled from the 6k-line brain input
// keeps the new layer additive and independently testable.

export type ExecutiveRole =
  | 'academy_director'
  | 'head_coach'
  | 'coach'
  | 'player'
  | 'parent'

export interface ConversationTurn {
  role: 'user' | 'donna'
  content: string
}

export interface DraftRef {
  /** e.g. 'class_template' | 'fitness_template' | 'session' | 'note' */
  kind: string
  /** Human label, e.g. "Orange 2 — Class Template". */
  label: string
  /** Flat, already-redacted field map describing the draft's current state. */
  fields: Record<string, string | number | string[] | null>
  /** True when the draft is complete enough to submit for review. */
  readyForReview: boolean
}

export interface DecisionRef {
  id: string
  summary: string
  urgency: 'low' | 'medium' | 'high'
}

export interface ActionDescriptor {
  id: string
  label: string
  /** Roles permitted to invoke this action. */
  roles: ExecutiveRole[]
  requiresApproval: boolean
}

export interface AssumptionRecord {
  /** What DONNA assumed, e.g. "duration = 90m (academy default)". */
  statement: string
  /** Where the assumption came from. */
  basis: string
}

export interface MemoryRecord {
  /** Salience tags used to match the memory to the current request. */
  tags: string[]
  content: string
}

export interface AcademyContext {
  /** Tenant id — used for tenant-scoping checks; never serialized to OpenAI. */
  academyId: string
  name: string
  /** Non-sensitive identity label, e.g. development model name. */
  modelLabel?: string | null
  /**
   * Compact one-line live operating snapshot (counts only — players, coaches,
   * pending reviews, onboarding readiness, etc.). Wired from the already-loaded
   * DirectorDonnaContext (Mega Sprint 3841–3870). Only ever set when context is
   * live; never demo/fabricated. No PII.
   */
  operatingSummary?: string | null
}

export interface CurriculumContext {
  /** Tenant id this curriculum belongs to — must match academy for inclusion. */
  academyId: string
  levels: string[]
  summary: string
}

export interface SpineContext {
  academyId: string
  summary: string
}

export interface CompletionContractState {
  /** COMPLETE | APPROVAL | BLOCKED | WAITING | FOLLOW_UP */
  state: 'COMPLETE' | 'APPROVAL' | 'BLOCKED' | 'WAITING' | 'FOLLOW_UP'
  nextAction: string | null
}

export interface ResolverState {
  role: ExecutiveRole
  message: string
  route: string | null
  page: string | null
  conversationHistory: ConversationTurn[]
  activeWorkflowId: string | null
  activeDraft: DraftRef | null
  academy: AcademyContext | null
  academyDefaults: Record<string, string> | null
  curriculum: CurriculumContext | null
  developmentSpine: SpineContext | null
  permissions: string[]
  availableActions: ActionDescriptor[]
  outstandingDecisions: DecisionRef[]
  donnaAssumptions: AssumptionRecord[]
  navigationTarget: string | null
  memories: MemoryRecord[]
  /** Last salient entity DONNA referenced (for coreference of "it"/"that"). */
  lastEntityLabel: string | null
  playerContext?: { label: string; fields: Record<string, string> } | null
  coachContext?: { label: string; fields: Record<string, string> } | null
  parentContext?: { label: string; fields: Record<string, string> } | null
  // Mega Sprint 4111–4140 — Executive Action Loop. UI execution events the client
  // observed since the last turn (page changes, clicks, saves, approvals, errors).
  // Optional + additive — absent when the client emits no events.
  uiEvents?: import('./donnaExecutiveActionLoop').UIEvent[] | null
}
