// Donna Approval Execution Types — Sprint 268
// Defines the result shape for all wired Donna save/apply server actions.
// Every execution path returns this shape — the caller renders the outcome without
// needing to know anything about the action internals.

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface DonnaApprovalExecutionResult {
  ok: boolean
  /** Execution outcome — used to drive save button state in GenericDraftPanel */
  status: 'saved' | 'not_wired' | 'blocked' | 'error'
  /** Human-readable message shown in the approval UI after the save attempt */
  message: string
  /** ID of the created/updated record, if any (useful for navigation after save) */
  createdId?: string
  /** Safety notes shown below the success state — e.g. "note is pending review" */
  safetyNotes?: string[]
  /** Optional multiline detail block — used for coach brief drafts (local-only, not persisted) */
  details?: string
}

// ---------------------------------------------------------------------------
// Union of draft types that have a wired server action
// ---------------------------------------------------------------------------

export type DonnaExecutableDraftType =
  | 'fitness_template_draft'
  | 'coach_note_draft'
  | 'session_draft'
  | 'session_block_population_draft'
