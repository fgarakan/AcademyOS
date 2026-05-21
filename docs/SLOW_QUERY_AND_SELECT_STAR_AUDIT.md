# Slow Query and Select-Star Audit

> Sprint 408 — Slow Query + Select-Star Audit V1
> See also: `docs/cache-and-performance-principles.md`, `docs/CACHE_TTL_IMPLEMENTATION_NOTES.md`

---

## Audit Scope

This document records every `select('*')` usage in the codebase, categorizes by risk, and defines the remediation plan.

**Total instances found:** 30+ across 8 files

---

## Risk Classification

### Level 1 — High Risk (fix in Sprint 408)
- Used inside DONNA context builders or player profile fetches
- Table has 15+ columns; most are not needed by the consumer
- Called frequently (per-request)

### Level 2 — Medium Risk (fix in Sprint 422)
- Used in coach workspace or session queries
- Table has 8–14 columns; partial fetch would help but is not urgent

### Level 3 — Low Risk (acceptable for now)
- Used for simple single-record fetches with `.single()`
- Table has < 8 columns or query is infrequent
- Returning all columns causes no measurable overhead

---

## File-by-File Inventory

### `src/lib/backend/intelligence.ts`

| Line | Table | Risk | Action |
|---|---|---|---|
| 19 | `recommendation_reasoning` | L3 — single row by id | Acceptable |
| 33 | `recommendation_reasoning` | L2 — list query | Sprint 422 |
| 49 | `player_behavior_profiles` | L2 — single player | Sprint 422 |
| 101 | `player_predictions` | L2 — list query | Sprint 422 |
| 116 | `v_player_predictions_latest` | L2 — view | Sprint 422 |
| 145 | `coaching_messages` | L2 — list query | Sprint 422 |
| 158 | `v_coaching_messages_pending` | L2 — view | Sprint 422 |

### `src/lib/backend/players.ts`

| Line | Table | Risk | Action |
|---|---|---|---|
| 15 | `players` (with join) | L1 — high-frequency player fetch | Sprint 408 target |
| 44 | `players` | L2 — list query for director | Sprint 422 |
| 81 | `academy_memberships` | L3 — single row | Acceptable |
| 94 | `players` | L2 — grouped fetch | Sprint 422 |
| 173 | `player_priorities` | L3 — single player | Acceptable |
| 190 | `player_priorities` | L3 — single player | Acceptable |

### `src/lib/backend/director.ts`

| Line | Table | Risk | Action |
|---|---|---|---|
| 40 | `proposed_actions` | L1 — high-frequency dashboard query | Sprint 408 target |
| 63 | `players` | L2 — director player list | Sprint 422 |
| 71 | `academy_memberships` | L3 — auth check | Acceptable |

### `src/lib/backend/coachWorkspace.ts`

| Line | Table | Risk | Action |
|---|---|---|---|
| 39 | `sessions` | L2 — coach session list | Sprint 422 |
| 54 | `session_blocks` | L2 — session plan | Sprint 422 |
| 66 | `players` | L2 — group members | Sprint 422 |
| 76 | `session_attendance` | L2 — attendance list | Sprint 422 |
| 86 | `player_groups` | L3 — group list | Acceptable |
| 121 | `exercises` | L3 — exercise library | Acceptable |

### `src/lib/backend/notes.ts`

| Line | Table | Risk | Action |
|---|---|---|---|
| 37 | `player_notes` | L2 — note list | Sprint 422 |
| 79 | `player_notes` | L3 — single note | Acceptable |

### `src/lib/backend/utr.ts`

| Line | Table | Risk | Action |
|---|---|---|---|
| 68 | `utr_records` | L3 — single player | Acceptable |
| 84 | `utr_records` | L3 — list by player | Acceptable |
| 97 | `utr_records` | L3 — most recent | Acceptable |

### `src/lib/templates/templateRepository.ts`

| Line | Table | Risk | Action |
|---|---|---|---|
| 125 | `templates` | L2 — template list | Sprint 422 |
| 170 | `template_blocks` | L2 — block list | Sprint 422 |
| 209 | `templates` | L2 — single template | Sprint 422 |

---

## Why Not Fix All Now

Narrowing `select('*')` to a column list requires:
1. Knowing exactly which columns the consumer uses
2. Updating the return type annotations (currently typed as `Tables<'...'>`)
3. Testing that no downstream code breaks from the narrower return

Supabase TypeScript inference narrows the return type when columns are specified,
which breaks callers that destructure or access columns not in the list.

The safe approach is a column-by-column audit per function, done in a dedicated sprint
with TypeScript validation between each change.

---

## Sprint 408 Fixes (Applied)

Sprint 408 documents the audit. The high-priority fixes (director dashboard and main player fetch) are deferred to Sprint 422 where each function can be fixed with full type-safety review.

---

## No N+1 Query Violations Found

All queries in the audited files use single queries with joins or separate parallel fetches.
No N+1 patterns (looping over results and querying per row) were found.

---

## Remediation Pattern (Sprint 422+)

```ts
// Before — returns full Tables<'players'> row
const { data } = await db.from('players').select('*').eq('id', playerId).single()

// After — returns only needed fields; adjust return type annotation
const { data } = await db
  .from('players')
  .select('id, first_name, last_name, current_level_id, is_active, academy_id')
  .eq('id', playerId)
  .single()
// Return type: { id: string; first_name: string; last_name: string; ... }
```

Each function must be updated with its precise column list and have its return type
annotation updated to match. Run `npx tsc --noEmit` after each file.
