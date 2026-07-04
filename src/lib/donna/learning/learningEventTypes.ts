// Sprint 4365 — AcademyOS Learning-Through-Use Taxonomy (pure constants).
//
// The canonical, testable taxonomy for learning-through-use: the event types AcademyOS
// may emit, and the five layers a signal may occupy on its way from ephemeral context to
// durable, approved memory. This file is DOCTRINE MADE TESTABLE — the architecture docs
// reference these same identifiers, and the certification asserts against them.
//
// Design rules (Sprint 4365 scope — enforced by the certification's negative check):
//   - Pure TypeScript constants + derived types. No I/O, no DB, no fetch, no model call.
//   - No persistence, no runtime wiring, no behavior change. Nothing imports a client here.
//   - This file DEFINES the taxonomy; it does not capture, store, or act on anything.

// ── Learning event types ─────────────────────────────────────────────────────────
// The structured signals a user action or conversation may be classified into. Emitting
// or persisting these is out of scope for this sprint — the taxonomy is defined and
// certified first, so any future capture path is constrained by an agreed vocabulary.

export const LEARNING_EVENT_TYPES = [
  'usage_event',
  'conversation_event',
  'correction_event',
  'preference_signal',
  'curriculum_signal',
  'workflow_signal',
  'assessment_signal',
  'progression_signal',
  'approval_signal',
  'rejection_signal',
  'parent_safe_signal',
  'coach_signal',
  'product_friction_signal',
  'learning_candidate',
  'approved_learning',
  'rejected_learning',
] as const

export type LearningEventType = (typeof LEARNING_EVENT_TYPES)[number]

// ── Learning layers ──────────────────────────────────────────────────────────────
// The five layers a signal may occupy. A signal only ever RISES a layer through a human
// approval gate; nothing durable is auto-created. `durable` marks memory that survives a
// session; `requiresApproval` marks the human gate a signal must pass to become durable;
// layer 5 additionally requires anonymization before any cross-academy reuse.

export interface LearningLayer {
  /** 1-based escalation order, temporary → durable. */
  order: number
  /** Stable identifier used by the docs and the certification. */
  id:
    | 'temporary_conversation_context'
    | 'session_summary'
    | 'learning_candidate'
    | 'director_approved_academy_memory'
    | 'owner_approved_global_learning'
  /** Human-readable name. */
  name: string
  /** Whether this layer persists beyond the current session. */
  durable: boolean
  /** Whether reaching this layer requires an explicit human approval. */
  requiresApproval: boolean
  /** Who approves entry into this layer (null for ephemeral layers). */
  approver: 'none' | 'director' | 'owner'
  /** Cross-academy reuse requires anonymization (owner/global layer only). */
  requiresAnonymization: boolean
}

export const LEARNING_LAYERS: readonly LearningLayer[] = [
  {
    order: 1,
    id: 'temporary_conversation_context',
    name: 'Temporary conversation context',
    durable: false,
    requiresApproval: false,
    approver: 'none',
    requiresAnonymization: false,
  },
  {
    order: 2,
    id: 'session_summary',
    name: 'Session-level summary',
    durable: false,
    requiresApproval: false,
    approver: 'none',
    requiresAnonymization: false,
  },
  {
    order: 3,
    id: 'learning_candidate',
    name: 'Learning candidate',
    durable: false,
    requiresApproval: false,
    approver: 'none',
    requiresAnonymization: false,
  },
  {
    order: 4,
    id: 'director_approved_academy_memory',
    name: 'Director-approved academy memory',
    durable: true,
    requiresApproval: true,
    approver: 'director',
    requiresAnonymization: false,
  },
  {
    order: 5,
    id: 'owner_approved_global_learning',
    name: 'Owner-approved global / platform learning',
    durable: true,
    requiresApproval: true,
    approver: 'owner',
    requiresAnonymization: true,
  },
] as const

export type LearningLayerId = LearningLayer['id']
