// Sprint 406 — Cache Invalidation + Revalidation Map V1
// Typed revalidation helpers that wrap Next.js revalidatePath.
// Server-side only — never import from client components.
//
// USAGE: Call these at the END of a successful server action mutation.
// Always call revalidatePath for the most specific path affected.
// Do not call these for failed mutations.
//
// See docs/CACHE_INVALIDATION_MAP.md for the full invalidation strategy.

import { revalidatePath } from 'next/cache'

// Player-related revalidation

export function revalidatePlayerPath(playerId: string): void {
  revalidatePath(`/director/players/${playerId}`)
  revalidatePath('/director/players')
}

export function revalidatePlayerPriorities(playerId: string): void {
  revalidatePath(`/director/players/${playerId}`)
  revalidatePath(`/player`)
}

export function revalidatePlayerDevelopmentSummary(playerId: string): void {
  revalidatePath(`/director/players/${playerId}`)
  revalidatePath('/player')
  revalidatePath('/parent')
}

// Session-related revalidation

export function revalidateSessionPath(sessionId: string): void {
  revalidatePath(`/coach/sessions/${sessionId}`)
  revalidatePath('/coach/sessions')
  revalidatePath('/director')
}

export function revalidateSessionAttendance(sessionId: string): void {
  revalidatePath(`/coach/sessions/${sessionId}`)
  revalidatePath('/player')
  revalidatePath('/parent')
}

// Proposed action revalidation (approval center)

export function revalidateApprovalCenter(): void {
  revalidatePath('/director')
  revalidatePath('/director/donna')
}

// Template revalidation

export function revalidateTemplatePath(templateId: string): void {
  revalidatePath(`/director/class-templates/${templateId}`)
  revalidatePath('/director/class-templates')
  revalidatePath('/coach')
}

// Academy levels revalidation (affects player portal)

export function revalidateAcademyLevels(): void {
  revalidatePath('/director')
  revalidatePath('/director/curriculum')
  revalidatePath('/player')
}

// Parent portal revalidation (only call when show_to_parent data changes)
// Be careful — this exposes potentially sensitive data if called incorrectly.

export function revalidateParentPortal(): void {
  revalidatePath('/parent')
}

// Player portal revalidation (only call when show_to_student data changes)

export function revalidatePlayerPortal(): void {
  revalidatePath('/player')
}
