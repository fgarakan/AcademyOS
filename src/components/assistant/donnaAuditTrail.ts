// Sprint 361 — Donna Audit Trail Foundation V1
// Local session audit trail — logs what Donna proposed and what the director did.
// In-memory only. No sessionStorage. No DB.
// Max 100 events, FIFO trim.

const MAX_EVENTS = 100

// ── Types ──────────────────────────────────────────────────────────────────────

export type AuditEventType =
  | 'draft_started'
  | 'field_collected'
  | 'revision_applied'
  | 'undo_applied'
  | 'draft_discarded'
  | 'draft_approved'
  | 'protected_action_blocked'
  | 'review_opened'

export interface DonnaAuditEvent {
  id: string
  timestamp: string   // ISO
  type: AuditEventType
  description: string
  workflowId?: string
  fieldId?: string
  value?: string
  outcome?: string
}

// ── Module-level store ─────────────────────────────────────────────────────────

let _trail: DonnaAuditEvent[] = []
let _idCounter = 0

function generateId(): string {
  _idCounter += 1
  return `audit_${Date.now()}_${_idCounter}`
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Append an audit event. Auto-generates id and timestamp.
 * Trims to MAX_EVENTS using FIFO if the store is full.
 */
export function appendAuditEvent(
  event: Omit<DonnaAuditEvent, 'id' | 'timestamp'>,
): void {
  const full: DonnaAuditEvent = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...event,
  }
  _trail.push(full)
  if (_trail.length > MAX_EVENTS) {
    _trail = _trail.slice(_trail.length - MAX_EVENTS)
  }
}

/** Returns a copy of the full audit trail (oldest first). */
export function getAuditTrail(): DonnaAuditEvent[] {
  return [..._trail]
}

/** Clears the audit trail. */
export function clearAuditTrail(): void {
  _trail = []
}
