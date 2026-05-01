# Group Curriculum Assignment Plan

**Sprint:** 73
**Last updated:** 2026-05-01
**Status:** Gap documented — V1 implementation deferred pending schema decision

---

## Current State

Groups are defined in `supabase/migrations/002_core_identity.sql`:

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id),
  name TEXT NOT NULL,
  level_id UUID REFERENCES academy_levels(id),  -- ← academy_levels, NOT curriculum_levels
  track development_track,
  max_players INTEGER,
  min_age INTEGER,
  max_age INTEGER,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ...
);
```

Groups have a `level_id` that references `academy_levels` — the academy's internal level structure — **not** the global `curriculum_levels` table used by the curriculum engine.

---

## Gap

The curriculum resolution engine (`src/lib/curriculum/academyCurriculumResolution.ts`) cannot resolve a curriculum level from a group without a schema change. Attempting to use `groups.level_id` as a curriculum level ID would be incorrect because:

1. `academy_levels` and `curriculum_levels` are different tables with different data.
2. There is no foreign key or mapping between them yet.
3. Adding such a mapping without schema migration would be unsound.

---

## Options

### Option A — Add `curriculum_level_id` to `groups` table (migration required)

Add `curriculum_level_id UUID REFERENCES curriculum_levels(id)` to `groups`.

- **Pro:** Clean, direct, resolves the gap permanently.
- **Con:** Requires a migration. Directors must re-assign curriculum levels to groups after migration.
- **Recommended:** Yes — this is the right long-term fix.

### Option B — Add a `group_curriculum_assignments` join table

A separate table mapping `group_id → curriculum_level_id` with a per-academy scope.

- **Pro:** Non-breaking, no groups table change.
- **Con:** Extra join, more complexity.

### Option C — Infer from group members' player_curriculum_states (V1 workaround)

For a group, look at the majority curriculum level of its active members.

- **Pro:** No schema change.
- **Con:** Fragile — groups with mixed levels won't resolve cleanly.

---

## V1 Behavior

Sprint 73 ships **no schema change** and **no assignment UI**.

- Group pages show: "No direct curriculum level assignment. Curriculum level is resolved per-player."
- The resolution engine ignores `groupId` input in V1.
- Template-based resolution (Sprint 74) and player-based resolution (Sprint 72/77) remain the primary paths.

---

## Recommended Next Steps

1. Create migration: `ALTER TABLE groups ADD COLUMN curriculum_level_id UUID REFERENCES curriculum_levels(id);`
2. Add RLS-safe index on `groups(curriculum_level_id)`.
3. Update `resolveAcademyCurriculumContext` to use `groups.curriculum_level_id` when `groupId` is provided.
4. Add a group curriculum level selector in the group management UI.

---

## Impact on Sprint 76 (Coach Session View)

Session pages currently resolve curriculum context from the source template's `curriculum_level_id`. This is unaffected by the group gap — sessions generated from curriculum-aware templates already carry the correct level. Groups without a direct curriculum level assignment show no curriculum level in the group view, which is safe and expected.
