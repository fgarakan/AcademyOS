# Curriculum Override Versioning Architecture

**Sprint:** Mega Sprint 1101-1110
**Date:** 2026-06-02

## Problem

Two code paths write to `academy_curriculum_overrides`:

1. `donnaCurriculumAdjustmentApplyActions.ts` → `status: 'active'`
2. `curriculumOverrideApprovalActions.ts` → `status: 'applied'`

The rollback action (`rollbackAcademyCurriculumOverrideAction`) only accepted `status: 'applied'`, making DONNA-applied overrides impossible to roll back from the UI. Field shapes also diverged: DONNA uses `change_description`, the approval path uses `applied_change`/`proposed_change`.

Additionally, `original_snapshot` and `applied_change` were never populated in the DONNA path, preventing rollback reconstruction.

## Solution

### 1. Snapshot population in donnaCurriculumAdjustmentApplyActions.ts

The override insert now populates:
- `original_snapshot: { description, target_level, captured_at }` — V1: the proposed change text as a before-state proxy
- `applied_change: { description, adjustment_type, applied_by, applied_at }` — what was actually applied

The audit log now includes `curriculum_version_id` and `rollback_available: true`.

safetyNotes updated to mention rollback availability.

### 2. Dual-status rollback in rollbackAcademyCurriculumOverrideAction.ts

Rollback now accepts both `'applied'` and `'active'`:

```typescript
const rollbackableStatuses = ['applied', 'active']
```

### 3. Field shape normalisation

The rollback reads the original change with fallback:

```typescript
const originalChangeText =
  originalOverride.change_description ??   // DONNA path
  originalOverride.applied_change ??        // approval path
  originalOverride.proposed_change          // fallback
```

### 4. Enriched audit log

Rollback audit log now includes `original_change` (the text rolled back) and `original_status`.

## Override status lifecycle

```
pending_review → approved → applied    (approval path)
                           ↓
                       rolled_back

pending_review → approved → active     (DONNA path)
                           ↓
                       rolled_back
```

Both `applied` and `active` overrides can be rolled back.

## What is not built in V1

- Global curriculum version increments
- Automatic conflict detection between overrides
- Override diff view in director UI
- Rollback of rollback

## Files changed

| File | Change |
|---|---|
| `donnaCurriculumAdjustmentApplyActions.ts` | Populates `original_snapshot` and `applied_change`; enriched audit log |
| `rollbackCurriculumOverride.ts` | Accepts both statuses; normalises field shapes; enriched audit log; revalidatePath added |
