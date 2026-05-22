// Sprint 617 — Parent Multi-Child Data Model Audit
// Pure TypeScript types and helpers. No DB calls. No mutations. No side effects.
//
// SCHEMA REALITY (as of Sprint 617 audit):
//   player_guardians — join table with ONLY (player_id, guardian_id).
//   No display_order, no per-child permissions, no per-child is_primary.
//   guardians.relationship — global to the guardian row, not per-child.
//   guardians.is_primary — global to the guardian row, not per-child.
//   academy_id lives on guardians, NOT on player_guardians.
//
// CURRENT PORTAL COLLAPSE POINT:
//   src/app/parent/page.tsx line 85 — playerIds[0] only.
//   Query fetches up to 3 player_ids (.limit(3)) then discards index 1+.
//
// SCHEMA GAPS (require a future migration — NOT this sprint):
//   1. player_guardians.display_order — needed for stable child ordering.
//   2. player_guardians.portal_permissions — needed for per-child visibility flags.
//   3. player_guardians.is_primary_child — needed for "primary child" default.
//   Until then, ordering is positional (array insertion order, unstable).
//
// CROSS-CHILD LEAKAGE RISK:
//   src/app/parent/page.tsx ~line 210: proposed_by_id: user!.id
//   Lesson requests are queried by guardian auth ID, not by child player ID.
//   If a guardian has multiple children, all their lesson requests (across
//   children) are returned regardless of which child is currently being viewed.
//   Requires a child-id filter to be added when multi-child switching goes live.

// ─────────────────────────────────────────────
// Access status for a single guardian → child link
// ─────────────────────────────────────────────

export type ParentChildAccessStatus =
  | 'linked'    // guardians row + player_guardians row both exist and player is active
  | 'unlinked'  // player_guardians row exists but guardians.profile_id is null (no auth)
  | 'orphaned'  // player_guardians row exists but player record is missing or deleted

// ─────────────────────────────────────────────
// Relationship kind — mirrors guardians.relationship CHECK constraint
// ─────────────────────────────────────────────

export type ParentChildRelationshipKind = 'parent' | 'guardian' | 'other'

// ─────────────────────────────────────────────
// Per-child permission flags
// NOTE: No per-child permission columns exist in the current schema.
// All flags below reflect assumed defaults for every linked child.
// When player_guardians.portal_permissions is added (future migration),
// this type should be populated from that column.
// ─────────────────────────────────────────────

export interface ParentChildPermissionFlags {
  canViewProgress: boolean
  canViewAttendance: boolean
  canRequestLesson: boolean
  canViewAssessments: boolean
}

const DEFAULT_PERMISSION_FLAGS: ParentChildPermissionFlags = {
  canViewProgress: true,
  canViewAttendance: true,
  canRequestLesson: true,
  canViewAssessments: true,
}

// ─────────────────────────────────────────────
// A single resolved child link (one row in player_guardians + joined data)
// ─────────────────────────────────────────────

export interface ChildLinkRecord {
  playerId: string
  playerName: string | null
  guardianId: string
  // Mirrors guardians.relationship — applies to the guardian globally, not per child.
  relationshipKind: ParentChildRelationshipKind
  accessStatus: ParentChildAccessStatus
  // Positional index from query result — no schema-level display_order exists.
  // Do NOT treat this as stable across sessions or reorders.
  queryIndex: number
  permissions: ParentChildPermissionFlags
}

// ─────────────────────────────────────────────
// Full multi-child state for a parent portal session
// ─────────────────────────────────────────────

export interface ParentMultiChildState {
  guardianId: string
  academyId: string
  children: ChildLinkRecord[]
  activeChildId: string | null
  // True when children.length > 1
  hasMultipleChildren: boolean
  // Reflects the hardcoded .limit(3) in src/app/parent/page.tsx.
  // Children beyond this count are silently excluded by the query.
  queryLimit: number
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function buildParentMultiChildState(
  guardianId: string,
  academyId: string,
  children: ChildLinkRecord[],
  activeChildId: string | null,
  queryLimit = 3,
): ParentMultiChildState {
  return {
    guardianId,
    academyId,
    children,
    activeChildId,
    hasMultipleChildren: children.length > 1,
    queryLimit,
  }
}

export function getActiveChildLink(state: ParentMultiChildState): ChildLinkRecord | null {
  if (!state.activeChildId) return state.children[0] ?? null
  return state.children.find((c) => c.playerId === state.activeChildId) ?? null
}

export function hasMultipleChildren(state: ParentMultiChildState): boolean {
  return state.children.length > 1
}

// Returns the activeChildId if it refers to a known linked child.
// Falls back to the first child's ID, or null if no children exist.
export function validateActiveChildId(
  state: ParentMultiChildState,
  id: string | null,
): string | null {
  if (!id) return state.children[0]?.playerId ?? null
  const known = state.children.some((c) => c.playerId === id)
  return known ? id : (state.children[0]?.playerId ?? null)
}

// Returns a display label for the child switcher UI.
// Falls back to "Child N" when name is not available.
export function getSafeChildSwitcherLabel(child: ChildLinkRecord, index: number): string {
  if (child.playerName && child.playerName.trim().length > 0) {
    return child.playerName.trim()
  }
  return `Child ${index + 1}`
}

// Builds a ChildLinkRecord with default permissions (current schema has no per-child flags).
export function buildChildLinkRecord(
  playerId: string,
  playerName: string | null,
  guardianId: string,
  relationshipKind: ParentChildRelationshipKind,
  accessStatus: ParentChildAccessStatus,
  queryIndex: number,
): ChildLinkRecord {
  return {
    playerId,
    playerName,
    guardianId,
    relationshipKind,
    accessStatus,
    queryIndex,
    permissions: { ...DEFAULT_PERMISSION_FLAGS },
  }
}
