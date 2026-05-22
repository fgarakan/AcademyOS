# Sprint 618 — Parent-Player Relationship Model V1

**Date:** 2026-05-22  
**Sprint:** 618  
**Type:** Pure TypeScript only. Non-mutating. No migrations. No UI changes. No parent runtime behavior changes.

---

## Purpose

This document describes the relationship resolution layer introduced in Sprint 618 and how it fits into the parent portal's multi-child architecture.

---

## Architecture Position

```
parentPortalQueries.ts          — fetches raw data (RLS-gated, server-side)
          ↓
parentPlayerRelationshipModel.ts — resolves + validates guardian → child links   ← SPRINT 618
          ↓
parentMultiChildModel.ts        — manages active child session state              (Sprint 617)
          ↓
parent/page.tsx                 — renders portal (unchanged until Sprint 619)
```

---

## Exported Types

| Type | Description |
|---|---|
| `GuardianRelationshipType` | `'parent' \| 'guardian' \| 'other'` — mirrors `guardians.relationship` CHECK constraint |
| `RawChildInput` | Shape of pre-fetched joined data a caller passes into the resolver |
| `ChildRelationshipRecord` | Single resolved, safety-checked guardian → child link |
| `RelationshipResolutionResult` | Full resolved output for all of a guardian's linked children |
| `ChildSelectionValidationReason` | Typed reason codes for validation outcomes |
| `ChildSelectionValidationResult` | Output of validating a candidate childId |
| `ParentRelationshipColumnGap` | Documented schema gap blocking a feature |

---

## Exported Helpers

| Helper | Description |
|---|---|
| `resolveParentChildList()` | Resolves raw inputs into a safe `RelationshipResolutionResult` |
| `validateChildBelongsToGuardian()` | Validates a candidate childId against the verified list |
| `buildChildSelectionValidationResult()` | Named alias for `validateChildBelongsToGuardian` |
| `getDefaultActiveChildId()` | Returns first selectable child by queryIndex |
| `sortChildRelationships()` | Sorts by queryIndex (positional — no schema ordering) |
| `getChildRelationshipLabel()` | Human-readable label for relationship type |
| `getSafeChildDisplayLabel()` | Safe minimal display name with "Child N" fallback |
| `getRelationshipColumnGaps()` | Returns all documented schema gaps |

---

## Safety Contract

### `resolveParentChildList()`

The caller is responsible for:
1. Fetching `rawChildren` from a **server-side, RLS-gated** query
2. Providing a verified `guardianId` and `guardianAcademyId` from the `guardians` row
3. Providing `relationshipType` from `guardians.relationship`

This function:
- Cross-checks `playerAcademyId` against `guardianAcademyId`
- Marks records `isSelectable = false` when the cross-check fails
- Never fetches additional data
- Returns all children including unselectable ones (so callers can explain why)

### `validateChildBelongsToGuardian()`

Never trust a raw `childId` from URL params, local storage, or client state. Always call this with the resolved list before using any child ID:

```typescript
const validation = validateChildBelongsToGuardian(candidateId, resolution)
if (!validation.isValid) {
  // redirect to default or show error — do NOT proceed with candidateId
}
const safeChildId = validation.resolvedChildId
```

---

## Schema Gaps (current as of Sprint 618)

| Table | Column | Impact | Blocks |
|---|---|---|---|
| `player_guardians` | `display_order` | Ordering is positional (unstable) | Stable switcher ordering |
| `player_guardians` | `is_primary_child` | Default child is always first by queryIndex | Per-child default selection |
| `player_guardians` | `portal_permissions` | All children get full default access | Per-child visibility |
| `player_guardians` | `relationship_type` | Relationship is global to guardian row | Per-child relationship label |
| `player_guardians` | `academy_id` | Cross-checked via `guardians.academy_id` | Direct isolation on join table |

**None of these gaps are addressed in Sprint 618.** All require a migration sprint.

---

## Cross-Child Leakage Risk (not fixed in Sprint 618)

`src/app/parent/page.tsx` ~line 210 has a lesson request query:

```typescript
.eq('proposed_by_id', user!.id)
```

This is scoped to the guardian's auth user ID, not to a specific child. If a guardian has multiple children with lesson requests, all requests will appear regardless of which child is being viewed.

**Fix:** Sprint 619 must add `.eq('player_id', activePlayerId)` (or equivalent) before the child switcher goes live.

---

## What Sprint 619 Can Safely Build

Sprint 619 (Child Switcher UI) can safely use this model with the following constraints:

| Feature | Safe now? | Condition |
|---|---|---|
| Show a list of linked children | Yes | Use `resolution.selectableChildren` |
| Validate a selected child ID | Yes | Use `validateChildBelongsToGuardian()` |
| Display child name | Yes | Use `record.displayLabel` |
| Default child selection | Yes (positional) | Use `resolution.defaultChildId` |
| Stable ordering | No | Requires `display_order` migration |
| Per-child permissions | No | Requires `portal_permissions` migration |
| Per-child relationship label | No | Requires per-child relationship field |
| Lesson request scoping | Blocked | Fix required in `page.tsx` before going live |

---

## Recommended Migration (future sprint)

```sql
ALTER TABLE player_guardians
  ADD COLUMN display_order     SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN is_primary_child  BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN portal_permissions JSONB;

-- Ensure only one primary child per guardian
CREATE UNIQUE INDEX idx_player_guardians_primary
  ON player_guardians(guardian_id)
  WHERE is_primary_child = true;
```

Do not write this migration until Sprint 619 design is confirmed.
