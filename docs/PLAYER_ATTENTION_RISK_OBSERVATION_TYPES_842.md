# Sprint 842 — playerAttentionRiskLoader Observation Type Expansion V1

**Date:** 2026-05-26
**Sprint:** 842
**Type:** Data — read-only query expansion in DONNA attention risk loader
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 833 — Low priority gap (surfaced in Sprint 841 Remaining Gaps table)

`loadPlayerAttentionRisk` in `src/lib/donna/playerAttentionRiskLoader.ts` queried
`coach_observations` with `.eq('observation_type', 'concern')`.

This meant that players with `injury_concern` or `behavioral` observations were silently
excluded from DONNA's attention risk signals. A player flagged by coaches as having an
injury concern or a behavioral issue would not appear in DONNA's "who needs attention" answer,
even if they had multiple recent observations of that type.

These three observation types represent equally urgent director-attention signals:
- `concern` — general coach concern about a player
- `injury_concern` — injury or physical health concern
- `behavioral` — behavioral issue or conduct concern

---

## Solution

One line changed in `src/lib/donna/playerAttentionRiskLoader.ts`:

**Before:**
```ts
.eq('observation_type', 'concern')
```

**After:**
```ts
.in('observation_type', ['concern', 'injury_concern', 'behavioral'])
```

The surrounding query is unchanged:
- Still scoped to `academy_id` (RLS-safe)
- Still filtered to `created_at >= thirtyDaysAgo` (last 30 days)
- Still returns only `player_id` (no data expansion)
- `concernsByPlayer` map accumulates counts identically

---

## Risk Assessment

| Risk | Assessment |
|---|---|
| Schema change | None — `observation_type` column and all three values already exist |
| Data mutation | None — read-only query |
| RLS impact | None — `academy_id` scoping preserved |
| Parent/player visibility | None — DONNA attention signals are director-only |
| Scoring thresholds | Unchanged — `concerns > 2` = high, `concerns > 0` = medium |
| UI change | None — factor detail string unchanged |
| False positives | Possible: players previously invisible to DONNA now surface. This is the intended behavior. |

The only behavioral change is that the attention risk loader will now surface players
with `injury_concern` or `behavioral` observations that were previously missed.

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| Scoring thresholds (`concerns > 2` = high) | No sprint scope change |
| `PlayerAttentionRiskFactor.type` values | `'concern_observation'` covers all flagged obs types |
| Factor detail string ("concern observations in the last 30 days") | No UI change in scope |
| `absencesByPlayer` logic | Attendance gap path unchanged |
| Any other DONNA loader | Out of sprint scope |
| Schema | No changes |

---

## Files Created

### `docs/PLAYER_ATTENTION_RISK_OBSERVATION_TYPES_842.md`

This file.

---

## Files Modified

### `src/lib/donna/playerAttentionRiskLoader.ts`

1. Changed `.eq('observation_type', 'concern')` to `.in('observation_type', ['concern', 'injury_concern', 'behavioral'])`
2. Updated comment on `concernsByPlayer` block to document the expanded types

---

## Score Impact (estimated)

Dimension 8 — DONNA Integration Quality: **8/10 → 8.5/10**

DONNA attention answers now surface players with injury_concern and behavioral
observations that were previously invisible to the risk loader.

---

## Remaining Player Priority Gaps

| Gap | Source | Priority |
|---|---|---|
| DONNA roster attention answers link to player list, not specific flagged player profile | Sprint 833 | Low |
| `PlayerActivePriorities` shows no attribution (approved by / on) | Sprint 833 | Low |
| `draftSummaryUpdateAction` only uses `is_private = true` observations | Sprint 833 | Low |
| Player DONNA chips are static — not priority-aware | Sprint 833 | Low |
| Tab trigger focus IDs (`player-notes-tab`) — `PlayerProfileTabs` not modified | Sprint 841 | Low |

---

## Recommended Sprint 843

**Sprint 843 — PlayerActivePriorities Attribution Display V1**

Add "Approved by" and "Approved on" attribution fields to each active priority card in
`PlayerActivePriorities.tsx`. The `player_priorities` table already stores `approved_by`
(director user ID) and `created_at`. Query the director's name from `profiles` or `users`
and display it as metadata on each priority card.

Risk: Low — read-only display change. No schema changes. Director-only view.
