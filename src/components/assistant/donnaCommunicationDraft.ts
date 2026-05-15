// Sprint 366 — Donna Communication Draft Workflow V1
// Types + runtime for structured communication drafts.
// No sending. No DB writes. Pure client-side draft management.
// Sprint 367: parent-safe check wired into applyCommunicationField.

// ── Types ──────────────────────────────────────────────────────────────────────

export type CommunicationDraftType =
  | 'parent_update'
  | 'coach_brief'
  | 'attendance_note'
  | 'progress_summary'

export type CommunicationDraftStatus = 'draft' | 'ready' | 'blocked'

export interface CommunicationDraft {
  id: string
  type: CommunicationDraftType
  recipientRole: 'parent' | 'coach' | 'director'
  subject: string
  body: string
  tone: 'formal' | 'warm' | 'direct' | 'concise'
  playerId?: string
  coachId?: string
  sessionId?: string
  status: CommunicationDraftStatus
  /** Violations found by parent-safe check (populated by Sprint 367) */
  violations?: string[]
  createdAt: string
  lastModifiedAt: string
}

export interface CommunicationRequiredFields {
  recipientRole: boolean
  subject: boolean
  body: boolean
}

// ── Required fields per type ───────────────────────────────────────────────────

export const COMMUNICATION_REQUIRED_FIELDS: Record<CommunicationDraftType, (keyof CommunicationDraft)[]> = {
  parent_update:    ['recipientRole', 'subject', 'body'],
  coach_brief:      ['recipientRole', 'subject', 'body'],
  attendance_note:  ['recipientRole', 'body'],
  progress_summary: ['recipientRole', 'subject', 'body'],
}

// ── Slot-filling questions ─────────────────────────────────────────────────────

export const COMMUNICATION_QUESTIONS: Record<CommunicationDraftType, Array<{ fieldId: keyof CommunicationDraft; question: string }>> = {
  parent_update: [
    { fieldId: 'subject', question: 'What is the main topic of this parent update?' },
    { fieldId: 'body',    question: 'What are the key points you want to share with the parent?' },
    { fieldId: 'tone',   question: 'What tone would you like — warm, formal, or direct?' },
  ],
  coach_brief: [
    { fieldId: 'subject', question: 'What is the topic or session for this coach brief?' },
    { fieldId: 'body',    question: 'What key points should the coach know?' },
    { fieldId: 'tone',   question: 'What tone — formal, warm, or direct?' },
  ],
  attendance_note: [
    { fieldId: 'body', question: 'Describe the attendance situation or exception.' },
  ],
  progress_summary: [
    { fieldId: 'subject', question: 'What aspect of progress are you summarizing?' },
    { fieldId: 'body',    question: 'What are the key progress highlights?' },
    { fieldId: 'tone',   question: 'Tone preference — warm, formal, or direct?' },
  ],
}

// ── ID generation ──────────────────────────────────────────────────────────────

let _idCounter = 0
function generateId(): string {
  _idCounter += 1
  return `comms_${Date.now()}_${_idCounter}`
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Create a new empty communication draft of the given type.
 */
export function createCommunicationDraft(
  type: CommunicationDraftType,
  context: {
    recipientRole?: 'parent' | 'coach' | 'director'
    playerId?: string
    coachId?: string
    sessionId?: string
  } = {},
): CommunicationDraft {
  const now = new Date().toISOString()
  const recipientRole =
    context.recipientRole ??
    (type === 'parent_update' || type === 'progress_summary' ? 'parent' : 'coach')

  return {
    id: generateId(),
    type,
    recipientRole,
    subject: '',
    body: '',
    tone: 'warm',
    playerId: context.playerId,
    coachId: context.coachId,
    sessionId: context.sessionId,
    status: 'draft',
    violations: [],
    createdAt: now,
    lastModifiedAt: now,
  }
}

/**
 * Apply a field update to a communication draft.
 * Returns a new draft object (immutable update).
 * Sprint 367: when body is set on a parent-facing draft, runs parent-safe check.
 */
export function applyCommunicationField(
  draft: CommunicationDraft,
  field: keyof CommunicationDraft,
  value: string,
): CommunicationDraft {
  const updated: CommunicationDraft = {
    ...draft,
    [field]: value,
    lastModifiedAt: new Date().toISOString(),
  }

  // Sprint 367: parent-safe check on body update for parent-facing types
  if (field === 'body' && (updated.type === 'parent_update' || updated.type === 'progress_summary')) {
    // Dynamic import avoided — use lazy inline require pattern to avoid circular dep
    // The check is simple keyword-based and safe to inline here.
    const parentBlockedKeywords = [
      'injury', 'injured', 'medical', 'doctor', 'diagnosis', 'sprain', 'fracture', 'surgery',
      'other player', 'another player', 'compared to', 'better than', 'worse than',
      'billing', 'payment', 'invoice', 'overdue', 'fee dispute', 'refund',
      'should be', 'level behind', 'level ahead', 'more advanced', 'less advanced',
      'coach complaint', 'unhappy with coach', 'problem with coach', 'coach issue',
    ]
    const lower = value.toLowerCase()
    const violations: string[] = []
    for (const kw of parentBlockedKeywords) {
      if (lower.includes(kw)) {
        violations.push(`Contains flagged content: "${kw}"`)
      }
    }
    if (violations.length > 0) {
      updated.status = 'blocked'
      updated.violations = violations
      return updated
    } else {
      updated.violations = []
    }
  }

  // Recalculate status
  updated.status = isCommunicationDraftReady(updated) ? 'ready' : 'draft'
  return updated
}

/**
 * Returns true if the draft has all required fields filled.
 */
export function isCommunicationDraftReady(draft: CommunicationDraft): boolean {
  const required = COMMUNICATION_REQUIRED_FIELDS[draft.type]
  return required.every(field => {
    const val = draft[field]
    return typeof val === 'string' && val.trim().length > 0
  })
}
