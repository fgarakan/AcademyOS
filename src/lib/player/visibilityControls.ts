// Sprint 490 — Visibility Control Layer V1
// Centralised visibility gate helpers for parent/player content.
// Single source of truth for "can this user see this content?"
// Combines show_to_parent/show_to_student flags from player_development_summary
// with is_parent_visible/is_player_visible from curriculum_requirements and evidence.
// Pure TypeScript — no DB calls.

export type VisibilityRole = 'player' | 'parent' | 'coach' | 'head_coach' | 'academy_director'

export interface VisibilityGateInput {
  showToStudent: boolean | null
  showToParent: boolean | null
  isParentVisible: boolean | null
  isPlayerVisible: boolean | null
  isParentSafe: boolean | null
}

export interface ContentVisibilityResult {
  visibleToPlayer: boolean
  visibleToParent: boolean
  visibleToCoach: boolean
  blockedFromPlayerReason: string | null
  blockedFromParentReason: string | null
}

// Check whether a development summary is visible to a specific role.
export function isDevelopmentSummaryVisible(
  input: {
    showToStudent: boolean | null
    showToParent: boolean | null
  },
  role: VisibilityRole,
): boolean {
  if (role === 'academy_director' || role === 'head_coach' || role === 'coach') return true
  if (role === 'player') return input.showToStudent === true
  if (role === 'parent') return input.showToParent === true
  return false
}

// Check whether a curriculum requirement progress record is visible to a role.
export function isProgressRecordVisible(
  input: {
    isParentVisible: boolean | null
    isPlayerVisible: boolean | null
  },
  role: VisibilityRole,
): boolean {
  if (role === 'academy_director' || role === 'head_coach' || role === 'coach') return true
  if (role === 'player') return input.isPlayerVisible === true
  if (role === 'parent') return input.isParentVisible === true
  return false
}

// Check whether an evidence link is visible to a role.
export function isEvidenceLinkVisible(
  input: {
    isParentSafe: boolean | null
    isPlayerVisible: boolean | null
  },
  role: VisibilityRole,
): boolean {
  if (role === 'academy_director' || role === 'head_coach' || role === 'coach') return true
  if (role === 'player') return input.isPlayerVisible === true
  if (role === 'parent') return input.isParentSafe === true
  return false
}

// Comprehensive gate: given all flags, determine visibility for all roles.
export function computeContentVisibility(
  input: VisibilityGateInput,
): ContentVisibilityResult {
  const visibleToPlayer =
    input.showToStudent === true &&
    input.isPlayerVisible !== false

  const visibleToParent =
    input.showToParent === true &&
    input.isParentVisible !== false &&
    input.isParentSafe !== false

  const visibleToCoach = true

  let blockedFromPlayerReason: string | null = null
  if (!visibleToPlayer) {
    if (input.showToStudent !== true) blockedFromPlayerReason = 'show_to_student is not enabled'
    else if (input.isPlayerVisible === false) blockedFromPlayerReason = 'is_player_visible is false'
  }

  let blockedFromParentReason: string | null = null
  if (!visibleToParent) {
    if (input.showToParent !== true) blockedFromParentReason = 'show_to_parent is not enabled'
    else if (input.isParentSafe === false) blockedFromParentReason = 'is_parent_safe is false'
    else if (input.isParentVisible === false) blockedFromParentReason = 'is_parent_visible is false'
  }

  return {
    visibleToPlayer,
    visibleToParent,
    visibleToCoach,
    blockedFromPlayerReason,
    blockedFromParentReason,
  }
}

// Filter an array of records by visibility for a given role.
export function filterByVisibility<T extends {
  isParentVisible?: boolean | null
  isPlayerVisible?: boolean | null
}>(records: T[], role: VisibilityRole): T[] {
  if (role === 'academy_director' || role === 'head_coach' || role === 'coach') return records
  if (role === 'player') return records.filter(r => r.isPlayerVisible === true)
  if (role === 'parent') return records.filter(r => r.isParentVisible === true)
  return []
}

// Check if a coach note / observation can be shown to a parent.
// Coach notes are NEVER visible to parents unless explicitly marked is_parent_safe=true.
export function isCoachNoteVisibleToParent(isParentSafe: boolean | null | undefined): boolean {
  return isParentSafe === true
}

// Check if a coach note can be shown to the player.
// Coach notes are NEVER shown to players by default — must be explicitly enabled.
export function isCoachNoteVisibleToPlayer(isPlayerVisible: boolean | null | undefined): boolean {
  return isPlayerVisible === true
}

// Returns human-readable label for a visibility configuration.
export function describeVisibilityGate(input: VisibilityGateInput): string {
  const visibility = computeContentVisibility(input)
  const parts: string[] = []
  if (visibility.visibleToCoach) parts.push('coach')
  if (visibility.visibleToParent) parts.push('parent')
  if (visibility.visibleToPlayer) parts.push('player')
  if (parts.length === 0) return 'Internal only (coach-visible)'
  return `Visible to: ${parts.join(', ')}`
}
