# Sprint 617 — Parent Multi-Child Data Model Audit

**Date:** 2026-05-22  
**Sprint:** 617  
**Type:** Audit-only. Non-mutating. No migrations. No UI changes. No parent runtime behavior changes.

---

## Audit Scope

This document answers 13 audit questions about how the parent portal handles guardians who have multiple linked children. The goal is to identify schema gaps and code collapse points before Sprint 618 (Relationship Model) and Sprint 619 (Child Switcher UI) make any changes.

---

## Files Audited

| File | Purpose |
|---|---|
| `src/app/parent/page.tsx` (714 lines) | Parent home page — data fetch + view rendering |
| `src/app/parent/layout.tsx` | Parent layout — tabs, navigation shell |
| `src/lib/parent/parentPortalQueries.ts` | Data access functions for parent portal |
| `src/lib/parent/parentPortalSummary.ts` | View model builder for single player |
| `src/lib/supabase/database.types.ts` | Generated types — guardians + player_guardians schema |
| `supabase/migrations/004_players.sql` | Source of truth for guardians + player_guardians DDL |

---

## Q1: Does the current parent portal show only one child even when a guardian has multiple linked children?

**Yes.** The portal is single-child by design. All queries in `parentPortalQueries.ts` accept a single `playerId` parameter. The layout (`layout.tsx`) passes no child context to child routes. The home page (`page.tsx`) resolves multiple player IDs but immediately collapses to one.

---

## Q2: Where exactly is multi-child data discarded?

**`src/app/parent/page.tsx` line 85.**

```
// line 71–74: fetches up to 3 player_ids
const { data: pgRows } = await supabase
  .from('player_guardians')
  .select('player_id')
  .eq('guardian_id', guardian.id)
  .limit(3)

// line 76: builds array
const playerIds = (pgRows ?? []).map(r => r.player_id)

// line 85: COLLAPSE — everything beyond index 0 is silently discarded
.eq('id', playerIds[0])
```

`playerIds[1]` and `playerIds[2]` are never used anywhere after this point.

---

## Q3: Does `player_guardians` have `academy_id`?

**No.** The `player_guardians` join table contains only two columns:

```sql
CREATE TABLE player_guardians (
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  PRIMARY KEY (player_id, guardian_id)
);
```

Academy isolation for guardians is enforced via `guardians.academy_id`, not via `player_guardians`.

---

## Q4: Does `player_guardians` have a per-child `relationship_type`?

**No.** Relationship is stored on the `guardians` row as a single global field:

```sql
relationship TEXT NOT NULL DEFAULT 'parent'
  CHECK (relationship IN ('parent', 'guardian', 'other'))
```

This means a guardian has one relationship kind for all their linked children — there is no per-child override.

---

## Q5: Does `player_guardians` have portal permissions or visibility flags per child?

**No.** There are no permission columns on `player_guardians`. The join table is a bare link. All access control is enforced at the RLS level via the guardian → player chain. There is no way to grant or restrict a guardian's access to an individual child's data at the row level without a schema migration.

---

## Q6: Does `player_guardians` have `display_order` or a per-child primary flag?

**No.** The only ordering available is insertion order (non-deterministic across sessions). `is_primary` exists on the `guardians` table but is a global flag for the guardian record — not a per-child designation.

---

## Q7: What is the full auth linkage from auth user to player?

```
auth.users (Supabase Auth)
  └─ profiles.id = auth.users.id
       └─ guardians.profile_id = profiles.id
            └─ player_guardians.guardian_id = guardians.id
                 └─ players.id = player_guardians.player_id
```

A parent portal session establishes this chain:
1. Auth user → `profiles` (provides `academy_id`)
2. `profiles.id` → `guardians.profile_id` (guardian row)
3. `guardians.id` → `player_guardians.guardian_id` (child links)
4. `player_guardians.player_id` → `players.id` (child records)

---

## Q8: How many children does the current query limit to?

**3.** Hard-coded `.limit(3)` at `src/app/parent/page.tsx` line 73. Children beyond 3 are never fetched, not just not displayed. There is no pagination or offset.

---

## Q9: Is the lesson request query child-specific?

**No. This is a cross-child leakage risk.**

The lesson request query in `page.tsx` (~line 210) uses:

```typescript
.eq('proposed_by_id', user!.id)
```

It filters by the guardian's auth user ID, not by the child's player ID. If a guardian has two children and each has an open lesson request, both lesson requests appear in the response regardless of which child the guardian is currently viewing.

**Fix required in Sprint 619 (or earlier):** Add `.eq('player_id', activePlayerId)` or similar child-scoping to this query before the child switcher goes live.

---

## Q10: Do RLS policies distinguish per-child access for the same guardian?

**No.** RLS policies in `004_players.sql`, `010_coach_notes.sql`, and `039_player_development_summary.sql` gate access using the pattern:

```sql
SELECT 1 FROM player_guardians pg
  JOIN guardians g ON g.id = pg.guardian_id
WHERE pg.player_id = [table].player_id
  AND g.profile_id = auth.uid()
```

This grants a guardian access to any player they're linked to via `player_guardians`. There is no per-child permission granularity — it's all-or-nothing per guardian.

---

## Q11: What schema additions are needed to properly support multi-child switching?

The following additions are required before a fully-safe child switcher can be built. **These are NOT implemented in Sprint 617 — each requires an explicit migration sprint.**

| Column | Table | Purpose |
|---|---|---|
| `display_order INT` | `player_guardians` | Stable, user-configurable child ordering |
| `is_primary_child BOOLEAN` | `player_guardians` | Mark one child as the default for the portal |
| `portal_permissions JSONB` | `player_guardians` | Per-child visibility flags (optional, advanced) |

Until `display_order` exists, child order is non-deterministic and could change between sessions or Supabase reindexes.

---

## Q12: What is the relationship type constraint?

```sql
relationship TEXT NOT NULL DEFAULT 'parent'
  CHECK (relationship IN ('parent', 'guardian', 'other'))
```

Three allowed values: `'parent'`, `'guardian'`, `'other'`. These are stored as text (not a PostgreSQL `ENUM`), so adding new values requires only a `CHECK` constraint change, not an `ALTER TYPE`.

The `ParentChildRelationshipKind` type in `parentMultiChildModel.ts` mirrors these three values exactly.

---

## Q13: Are there other parent-related files with single-child assumptions?

| File | Single-child assumption |
|---|---|
| `src/lib/parent/parentPortalQueries.ts` | All exported functions accept `playerId: string` (singular) |
| `src/lib/parent/parentPortalSummary.ts` | Builds a `PlayerPortalSummary` for one player — no multi-child concept |
| `src/app/parent/page.tsx` | Collapse at `playerIds[0]`; no child switcher; no child context in layout |
| `src/app/parent/layout.tsx` | No child context provided to route children; tabs are child-agnostic |

Every parent portal query function must be evaluated before Sprint 619 to ensure child-scoping parameters are added where needed.

---

## Summary of Gaps

| Gap | Severity | Fix Sprint |
|---|---|---|
| `page.tsx` collapses to `playerIds[0]` | High — data loss for multi-child parents | Sprint 619 |
| Lesson request query unscoped to child | Medium — cross-child data leakage | Sprint 619 |
| No `display_order` in `player_guardians` | Medium — non-deterministic child ordering | Future migration |
| No per-child permissions in schema | Low — no current requirement | Future migration |
| All portal queries are single-child APIs | High — requires API extension | Sprint 618 |
| `.limit(3)` is hardcoded | Low — sufficient for typical cases | Sprint 618 or 619 |

---

## Types and Helpers Delivered

All types and helpers are in `src/lib/parent/parentMultiChildModel.ts`:

- `ParentChildAccessStatus` — `'linked' | 'unlinked' | 'orphaned'`
- `ParentChildRelationshipKind` — `'parent' | 'guardian' | 'other'`
- `ParentChildPermissionFlags` — per-child flags (schema defaults until migration)
- `ChildLinkRecord` — a single resolved guardian → child link with metadata
- `ParentMultiChildState` — full session state for a multi-child parent portal
- `buildParentMultiChildState()` — constructs state from resolved children
- `getActiveChildLink()` — returns the currently active child or the first child
- `hasMultipleChildren()` — boolean check
- `validateActiveChildId()` — validates an ID against known children, falls back safely
- `getSafeChildSwitcherLabel()` — display name with "Child N" fallback
- `buildChildLinkRecord()` — factory with default permissions

---

## Next Steps

| Sprint | Task |
|---|---|
| Sprint 618 | Extend `parentPortalQueries.ts` to accept an array of `playerIds` and return typed `ChildLinkRecord[]`; update `parentPortalSummary.ts` to support multi-child context |
| Sprint 619 | Build child switcher UI component; add child-scoping to lesson request query; wire `ParentMultiChildState` into parent layout context |
| Future migration | Add `display_order` and `is_primary_child` to `player_guardians` |
