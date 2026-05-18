// Canonical approval-flow language for the Curriculum Builder.
// Use these constants everywhere instead of inline strings so the voice is consistent.

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  draft:          'Draft',
  pending_review: 'Awaiting director review',
  approved:       'Approved — queued to apply',
  applied:        'Applied to curriculum',
  executed:       'Applied to curriculum',
  rejected:       'Rejected',
}

export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  draft:          'text-text-muted',
  pending_review: 'text-status-orange',
  approved:       'text-status-green',
  applied:        'text-status-blue',
  executed:       'text-status-blue',
  rejected:       'text-status-red',
}

export const APPROVAL_NEXT_STEP: Record<string, string> = {
  draft:
    'Save to the Review Queue so a director can approve or reject it.',
  pending_review:
    'A director must approve this before anything in the curriculum changes.',
  approved:
    'Queued for application. No curriculum data has changed yet — it applies on the next scheduled run.',
  applied:
    'This change is live. Coaches and players see the updated curriculum.',
  executed:
    'This change is live. Coaches and players see the updated curriculum.',
  rejected:
    'This draft was rejected and discarded. No curriculum data was changed.',
}

export const SAFETY_NOTES = {
  draftOnly:
    'Draft only — nothing in the live curriculum changes until a director approves this in the Review Queue.',
  approveEffect:
    'Approving queues this change for structured application. It does not apply immediately.',
  noPlayerImpact:
    'Players and coaches are not notified and see no changes until this draft is applied.',
  noRetrospective:
    'Existing evaluations and session records are not retroactively affected by curriculum edits.',
  donnaCannotApprove:
    'DONNA proposes. Directors approve. DONNA cannot approve or apply her own drafts.',
} as const
