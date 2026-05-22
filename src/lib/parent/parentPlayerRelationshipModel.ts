// Sprint 618 — Parent-Player Relationship Model V1
// Pure TypeScript. No DB calls. No Supabase client. No AI calls.
// No mutations. No React/UI. No app route imports.
//
// PURPOSE:
//   Safe relationship resolution layer for future parent child switching.
//   Accepts already-fetched, RLS-gated data and resolves, validates, and
//   documents each guardian → child link. Never trusts a raw childId —
//   all candidate IDs are validated against the guardian's verified list.
//
// WHERE THIS FITS:
//   parentPortalQueries.ts  →  [fetches raw data]
//   parentPlayerRelationshipModel.ts  →  [resolves + validates links]    ← THIS FILE
//   parentMultiChildModel.ts  →  [manages active child session state]
//   parent/page.tsx  →  [renders portal — UNCHANGED this sprint]
//
// SCHEMA REALITY (Sprint 617 audit, current as of Sprint 618):
//   player_guardians — bare join table: ONLY player_id + guardian_id.
//   guardians.relationship — global to the guardian row, NOT per-child.
//   guardians.is_primary — global to the guardian row, NOT per-child.
//   guardians.academy_id — academy isolation anchor; NOT on player_guardians.
//   No display_order, no is_primary_child, no portal_permissions per child.
//
// WHAT IS SAFE NOW (without migration):
//   Resolve and validate linked children from pre-fetched data.
//   Cross-check academy_id between guardian row and player row.
//   Mark records unsafe when academy isolation cannot be confirmed.
//   Determine default child (first selectable by queryIndex).
//   Document all schema gaps blocking full multi-child switching.
//
// WHAT MUST WAIT FOR MIGRATION:
//   Per-child display_order — stable switcher ordering.
//   Per-child is_primary_child — explicit default child selection.
//   Per-child portal_permissions — granular per-child visibility flags.
//   Per-child relationship_type — relationship override per child.
//
// CROSS-CHILD LEAKAGE (not fixed here — blocked pending Sprint 619):
//   src/app/parent/page.tsx lesson request query uses proposed_by_id: user.id
//   (guardian-auth-scoped, not child-scoped). Sprint 619 must add
//   child-id scoping before the switcher goes live.

import type { ParentChildRelationshipKind } from './parentMultiChildModel'

// ─────────────────────────────────────────────
// GuardianRelationshipType
// Mirrors guardians.relationship CHECK constraint:
//   CHECK (relationship IN ('parent', 'guardian', 'other'))
// Type alias of ParentChildRelationshipKind — identical values,
// distinct name to reflect the schema column it represents.
// ─────────────────────────────────────────────

export type GuardianRelationshipType = ParentChildRelationshipKind

// ─────────────────────────────────────────────
// RawChildInput
// Shape of data a server-side caller provides after joining
//   player_guardians → players under RLS.
// This model never fetches data itself — it receives it.
// ─────────────────────────────────────────────

export interface RawChildInput {
  playerId: string
  playerName: string | null
  // academy_id from the player row — cross-checked against guardians.academy_id.
  // Must not be null for a child to be selectable.
  playerAcademyId: string | null
  isActive: boolean
}

// ─────────────────────────────────────────────
// ParentRelationshipColumnGap
// Documents a schema column that is missing and blocks a feature.
// ─────────────────────────────────────────────

export interface ParentRelationshipColumnGap {
  table: 'player_guardians' | 'guardians'
  column: string
  impact: string
  blocksFeature: string
  // Which sprint is planned to add the migration, or null if unscheduled.
  requiredForSprint: number | null
}

// ─────────────────────────────────────────────
// ChildRelationshipRecord
// A single resolved, safety-checked guardian → child link.
// ─────────────────────────────────────────────

export interface ChildRelationshipRecord {
  playerId: string
  playerName: string | null
  guardianId: string
  // Academy ID from the guardians row — the trust anchor.
  // player_guardians does NOT carry academy_id.
  guardianAcademyId: string
  // Academy ID from the player row — cross-checked against guardianAcademyId.
  // null means the player record did not return an academy_id (treated as unsafe).
  playerAcademyId: string | null
  // Mirrors guardians.relationship — global to the guardian, not per-child.
  // No per-child relationship override exists in the current schema.
  relationshipType: GuardianRelationshipType
  // True only when: player exists, is active, and academyId cross-check passes.
  // Never fake this — if the schema cannot confirm safety, isSelectable = false.
  isSelectable: boolean
  unselectableReason: string | null
  // Positional index from the caller's query result.
  // No schema-level display_order exists — do not treat as stable across sessions.
  queryIndex: number
  // Safe minimal display label — name only, no private data.
  // Use getSafeChildDisplayLabel() to derive it; stored here for convenience.
  displayLabel: string
}

// ─────────────────────────────────────────────
// RelationshipResolutionResult
// Full resolved output for one guardian's linked children.
// ─────────────────────────────────────────────

export interface RelationshipResolutionResult {
  guardianId: string
  guardianAcademyId: string
  relationshipType: GuardianRelationshipType
  // All children — including unselectable ones. Sorted by queryIndex.
  children: ChildRelationshipRecord[]
  // Subset where isSelectable === true.
  selectableChildren: ChildRelationshipRecord[]
  // First selectable child by queryIndex, or null.
  // Without display_order this is positional; not user-configurable.
  defaultChildId: string | null
  hasUnselectableChildren: boolean
  schemaGaps: ParentRelationshipColumnGap[]
}

// ─────────────────────────────────────────────
// ChildSelectionValidationResult
// Output of validating a candidate childId against a resolved list.
// ─────────────────────────────────────────────

export type ChildSelectionValidationReason =
  | 'valid'
  | 'not_linked'           // candidate ID not found in the guardian's verified list
  | 'academy_mismatch'     // child's academyId does not match guardian's academyId
  | 'record_unsafe'        // child found but isSelectable === false for another reason
  | 'null_input_defaulted' // candidateChildId was null; defaulted to first selectable
  | 'no_children'          // guardian has no linked children at all

export interface ChildSelectionValidationResult {
  isValid: boolean
  resolvedChildId: string | null
  record: ChildRelationshipRecord | null
  reason: ChildSelectionValidationReason
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// Returns documented schema gaps that block full multi-child switching.
export function getRelationshipColumnGaps(): ParentRelationshipColumnGap[] {
  return [
    {
      table: 'player_guardians',
      column: 'display_order',
      impact:
        'Child ordering is positional (query insertion order), not user-configurable. ' +
        'Order may change across sessions or Supabase reindexes.',
      blocksFeature: 'Stable child switcher ordering',
      requiredForSprint: 619,
    },
    {
      table: 'player_guardians',
      column: 'is_primary_child',
      impact:
        'No per-child primary designation. Default child is always the first by queryIndex.',
      blocksFeature: 'Per-child default selection',
      requiredForSprint: 619,
    },
    {
      table: 'player_guardians',
      column: 'portal_permissions',
      impact:
        'No per-child visibility flags. All linked children receive full default portal access.',
      blocksFeature: 'Granular per-child portal visibility',
      requiredForSprint: null,
    },
    {
      table: 'player_guardians',
      column: 'relationship_type',
      impact:
        'Relationship is stored on the guardian row (global). ' +
        'Cannot differentiate per-child (e.g., "parent of child A, guardian of child B").',
      blocksFeature: 'Per-child relationship label in switcher UI',
      requiredForSprint: null,
    },
    {
      table: 'player_guardians',
      column: 'academy_id',
      impact:
        'Academy isolation must be cross-checked via guardians.academy_id. ' +
        'academy_id is not directly on the player_guardians join table.',
      blocksFeature: 'Direct academy isolation on join table',
      requiredForSprint: null,
    },
  ]
}

// Returns a human-readable label for a guardian relationship type.
// Safe for display in the parent portal switcher UI.
export function getChildRelationshipLabel(type: GuardianRelationshipType): string {
  const labels: Record<GuardianRelationshipType, string> = {
    parent: 'Parent',
    guardian: 'Guardian',
    other: 'Contact',
  }
  return labels[type]
}

// Returns a safe, minimal display name for a child record.
// Never includes assessments, coach notes, development data, or private details.
export function getSafeChildDisplayLabel(
  record: Pick<ChildRelationshipRecord, 'playerName'>,
  index: number,
): string {
  if (record.playerName && record.playerName.trim().length > 0) {
    return record.playerName.trim()
  }
  return `Child ${(index + 1).toString()}`
}

// Sorts children by queryIndex ascending.
// IMPORTANT: This is positional only — display_order does not exist in schema.
// Do not present this as user-configurable ordering.
export function sortChildRelationships(
  children: ChildRelationshipRecord[],
): ChildRelationshipRecord[] {
  return [...children].sort((a, b) => a.queryIndex - b.queryIndex)
}

// Returns the ID of the first selectable child (by queryIndex), or null.
export function getDefaultActiveChildId(
  resolution: RelationshipResolutionResult,
): string | null {
  return resolution.selectableChildren[0]?.playerId ?? null
}

// Validates whether a candidate childId is safe to select for this guardian.
// NEVER trusts candidateChildId without verifying against the resolved list.
// A candidate passes only if it is: found, academy-matched, and isSelectable.
export function validateChildBelongsToGuardian(
  candidateChildId: string | null,
  resolution: RelationshipResolutionResult,
): ChildSelectionValidationResult {
  if (resolution.children.length === 0) {
    return {
      isValid: false,
      resolvedChildId: null,
      record: null,
      reason: 'no_children',
    }
  }

  if (!candidateChildId) {
    const defaultRecord = resolution.selectableChildren[0] ?? null
    return {
      isValid: defaultRecord !== null,
      resolvedChildId: defaultRecord?.playerId ?? null,
      record: defaultRecord,
      reason: 'null_input_defaulted',
    }
  }

  // Search the full list to give a precise failure reason if found but unsafe.
  const found = resolution.children.find((c) => c.playerId === candidateChildId)

  if (!found) {
    return {
      isValid: false,
      resolvedChildId: null,
      record: null,
      reason: 'not_linked',
    }
  }

  if (
    found.playerAcademyId !== null &&
    found.playerAcademyId !== found.guardianAcademyId
  ) {
    return {
      isValid: false,
      resolvedChildId: null,
      record: found,
      reason: 'academy_mismatch',
    }
  }

  if (!found.isSelectable) {
    return {
      isValid: false,
      resolvedChildId: null,
      record: found,
      reason: 'record_unsafe',
    }
  }

  return {
    isValid: true,
    resolvedChildId: found.playerId,
    record: found,
    reason: 'valid',
  }
}

// Named alias satisfying the sprint's explicit requirement.
export function buildChildSelectionValidationResult(
  candidateChildId: string | null,
  resolution: RelationshipResolutionResult,
): ChildSelectionValidationResult {
  return validateChildBelongsToGuardian(candidateChildId, resolution)
}

// Resolves raw child inputs into a safe, validated RelationshipResolutionResult.
//
// SAFETY CONTRACT:
//   rawChildren must come from a server-side, RLS-gated query.
//   guardianId and guardianAcademyId must be verified by the caller
//   from the guardians row before calling this function.
//   This function cross-checks but does not re-fetch or re-verify.
export function resolveParentChildList(
  rawChildren: RawChildInput[],
  guardianId: string,
  guardianAcademyId: string,
  relationshipType: GuardianRelationshipType,
): RelationshipResolutionResult {
  const children: ChildRelationshipRecord[] = rawChildren.map((raw, index) => {
    let isSelectable = true
    let unselectableReason: string | null = null

    if (!raw.isActive) {
      isSelectable = false
      unselectableReason = 'Player is not active'
    } else if (raw.playerAcademyId === null) {
      isSelectable = false
      unselectableReason =
        'Player academy_id is null — cannot confirm academy isolation'
    } else if (raw.playerAcademyId !== guardianAcademyId) {
      isSelectable = false
      unselectableReason =
        `Player academy_id (${raw.playerAcademyId}) does not match guardian academy_id (${guardianAcademyId})`
    }

    const displayLabel = getSafeChildDisplayLabel({ playerName: raw.playerName }, index)

    return {
      playerId: raw.playerId,
      playerName: raw.playerName,
      guardianId,
      guardianAcademyId,
      playerAcademyId: raw.playerAcademyId,
      relationshipType,
      isSelectable,
      unselectableReason,
      queryIndex: index,
      displayLabel,
    }
  })

  const sorted = sortChildRelationships(children)
  const selectableChildren = sorted.filter((c) => c.isSelectable)

  return {
    guardianId,
    guardianAcademyId,
    relationshipType,
    children: sorted,
    selectableChildren,
    defaultChildId: selectableChildren[0]?.playerId ?? null,
    hasUnselectableChildren: children.some((c) => !c.isSelectable),
    schemaGaps: getRelationshipColumnGaps(),
  }
}
