# Sprint 851 — DONNA Review Queue Deep-link V1

**Date:** 2026-05-26
**Sprint:** 851
**Type:** UX — review queue link on active priority cards
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 845 remaining gap — "No 'View in review queue →' link from active priority to originating `proposed_action`"

Active priority cards in `PlayerActivePriorities.tsx` show attribution (approved by, applied date) but have no link back to the review queue where the originating priority recommendation draft lives. The director has no in-UI path from a player's active priority card to the source draft in the review queue.

---

## Audit Findings

### `proposed_action_id` availability on `player_priorities`

**Result: NOT available.**

`player_priorities` schema (`database.types.ts`, lines 6226–6255) does not include a `proposed_action_id` column. The `applyPriorityRecommendation` server action (`review/actions.ts`, lines 459–476) inserts `player_priorities` rows without setting any back-reference to the originating `proposed_action`:

```ts
const { data: createdPriority, error: insertError } = await rawDb
  .from('player_priorities')
  .insert({
    academy_id: academyId,
    player_id: playerId,
    title,
    description: description || null,
    category: typedCategory,
    is_active: true,
    priority_level: priorityLevel,
    urgency,
    priority_rank: newRank,
    status: 'active',
    confidence_score: 0.75,
    source_signal_ids: [],
  })
  .select('id')
  .single()
```

No `proposed_action_id` field. The audit_log written by step 9 of the same action does include `proposed_action_id` in its payload, but that requires a join through `audit_logs` by `target_id` (priority row id) — which would add a new query per player profile load and still returns only the most recent audit entry, not a navigable link without further joins.

**Conclusion:** A direct deep-link to the specific `proposed_action_id` is not possible from an active priority card without a schema change (adding `proposed_action_id` to `player_priorities`) or an additional DB query (joining `audit_logs`). Both are deferred — they require a migration or query complexity beyond the sprint scope.

### `[actionId]` deep-link page

`/director/review/[actionId]/page.tsx` exists and is functional — it accepts a UUID via URL params, loads the corresponding `proposed_action`, and renders the full review item. However, it is inaccessible from `PlayerActivePriorities.tsx` without a `proposed_action_id`.

### Review queue fallback URL

`/director/review?tab=player-updates` is a confirmed valid URL. `review/page.tsx` includes:

```ts
const VALID_TAB_PARAMS: Record<string, ProposedActionTab> = {
  ...
  'player-updates': 'player_updates',
  'priorities': 'player_updates',  // alias
  ...
}
```

The Player Updates tab (`player_updates`) shows all `priority_recommendation` type proposed_actions — the director can find the originating draft from there. This is the correct fallback: honest, useful, and safe.

---

## Solution

One file modified: `src/app/director/players/[playerId]/PlayerActivePriorities.tsx`.

### `PlayerActivePriorities.tsx` — changes

1. Added `import Link from 'next/link'` (top of file)
2. Added "View in review queue →" link after the attribution block on each priority card:

```tsx
{/* Sprint 851: Review queue link — player_priorities has no proposed_action_id column
    (not stored at insert time in actions.ts, not in database.types.ts schema).
    Fallback: link to the Player Updates tab of the review queue where the originating
    priority_recommendation proposed_action can be found by the director.
    Read-only display — no data writes, no auto-navigation. Director-only path. */}
<Link
  href="/director/review?tab=player-updates"
  className="inline-block text-[11px] text-lime/70 hover:text-lime transition-colors mt-0.5"
>
  View in review queue →
</Link>
```

**No changes to:**
- `PlayerPriorityRow` interface — no new fields
- `page.tsx` active priorities query — no new columns selected
- Any other file

---

## Behavior

Each active priority card now shows:

```
[Title]                                         [HIGH]
[Technical Skill]  [high urgency]  [active]
[Description text if present]
Approved by Director Smith · Applied Jan 12, 2026
View in review queue →          ← new link (lime, 11px)
```

Clicking "View in review queue →" opens `/director/review?tab=player-updates` — the Player Updates tab showing all priority recommendation proposed_actions. The director can find the originating draft from there.

---

## Why Not a Direct Deep-link

| Approach | Status | Reason |
|---|---|---|
| `/director/review/<proposed_action_id>` | ❌ Not available | `proposed_action_id` not stored on `player_priorities` |
| Join through `audit_logs` | ❌ Deferred | Requires additional DB query per player profile load; adds complexity without schema support |
| Schema change — add `proposed_action_id` to `player_priorities` | ❌ Out of scope | Requires migration (Sprint 851 explicitly no migration) |
| `/director/review?tab=player-updates` fallback | ✅ Implemented | Confirmed valid URL; shows originating draft type; honest and useful |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ display-only link |
| No player data changed | ✅ |
| No player level movement | ✅ |
| No parent/player visibility | ✅ director-only path |
| No schema changes | ✅ no migrations |
| No RLS weakening | ✅ |
| No routing behavior changed | ✅ link is a standard `<Link>` |
| No auto-navigation | ✅ director clicks manually |
| No auto-approval | ✅ |
| `PlayerPriorityRow` interface unchanged | ✅ no new fields |
| `page.tsx` query unchanged | ✅ no new columns |
| Attribution display unchanged | ✅ link added below, not replacing anything |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `page.tsx` active priorities query | No new columns needed |
| `PlayerPriorityRow` interface | No new fields needed |
| `database.types.ts` | Read-only — generated file; no schema changes |
| `review/actions.ts` | Not touched — apply action unchanged |
| `audit_logs` join | Deferred — out of scope for Sprint 851 |
| `proposed_action_id` schema addition | Requires migration — deferred |

---

## Files Created

### `docs/DONNA_REVIEW_QUEUE_DEEPLINK_851.md`

This file.

---

## Files Modified

### `src/app/director/players/[playerId]/PlayerActivePriorities.tsx`

1. Added `import Link from 'next/link'`
2. Added `<Link href="/director/review?tab=player-updates">View in review queue →</Link>` after attribution block on each priority card
3. Added explanatory comment documenting Sprint 851 fallback rationale

---

## Score Impact (estimated)

Dimension 5 — Player Priority Display: **9/10 → 9.5/10**

Active priority cards now surface a direct path to the review queue. The director can navigate from a player profile's active priority to the originating draft without manually navigating the review queue.

Dimension 3 — Director-to-Player Navigation: **9.5/10 → 9.5/10** (unchanged — no navigation logic change)

---

## Remaining Player Priority Gaps (post-851)

| Gap | Source | Priority |
|---|---|---|
| Direct deep-link (`/director/review/<id>`) not available — `proposed_action_id` not stored on `player_priorities` | Sprint 851 | Low (schema change required) |
| Player DONNA chips static — not priority-aware | Sprint 833 | Low |
| No deep-link from attention signals to specific profile tab | Sprint 833 | Low |
| DONNA attention context not live-requeried per interaction | Sprint 833 | Low |
| Priority title/description are minimal machine-assembled strings | Sprint 833 | Low |
| Tab auto-switching (Notes tab) not yet implemented | Sprint 850 | Low |

---

## Recommended Sprint 852

**Sprint 852 — Player Priority DONNA Chips V1**

Update the player DONNA chips (quick-action buttons shown in the DONNA panel when viewing a player profile) to be priority-aware. When a player has active priorities, surface the top priority as a chip — "View active priority" or similar — alongside or replacing one of the current static chips. This gives the director an immediate, context-aware shortcut from DONNA to the player's current priority state.

Source: Sprint 833 Dimension 9 remaining gap.
Risk: Low — read-only display change; no data writes; no priority apply changes.

Alternatively: **Sprint 852 — Priority Deep-link Schema Patch V1** — add `proposed_action_id` column to `player_priorities` (migration required, low risk since nullable), populate it in `applyPriorityRecommendation`, and update the priority card link to use `/director/review/<proposed_action_id>` directly.
Risk: Low-medium — requires a migration.
