# Sprint 841 — Player Profile DONNA Focus IDs V1

**Date:** 2026-05-26
**Sprint:** 841
**Type:** UX / DONNA integration — DOM focus attribute wiring + dispatcher prefix fallback
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 833 — GAP-B (Medium)

DONNA can navigate to player profiles (via `player_operator` or from player list links), but
no `data-donna-focus-id` attributes existed anywhere on the player profile page. The
DONNA highlight runtime fires but finds no matching DOM target — the teal glow never
activates on arrival.

Additionally, `buildFocusTargetForRoute` (the dispatcher function that builds focus targets
for navigation results) used exact key lookup against `FOCUS_TARGET_MAP`. Dynamic player
profile routes (`/director/players/<uuid>`) could never match a static map entry, so even if
a dispatch result included a player profile URL, no focus target would be built.

---

## Solution

### 1. DOM Focus IDs — `src/app/director/players/[playerId]/page.tsx`

Four `data-donna-focus-id` attributes added, each as a minimal wrapper `<div>`:

| Focus ID | Location in page | DOM scope |
|---|---|---|
| `player-profile-header` | Wrapper around `<PlayerProfileHeader>` in `return` JSX | Always visible — outside tabs |
| `player-active-priorities` | Wrapper around `<PlayerActivePriorities>` in `notesSlot` | Notes tab only |
| `player-priority-recommendation` | Wrapper around `<PriorityRecommendationDrafts>` + generate card in `notesSlot` | Notes tab only |
| `player-evidence-hub` | `data-` attribute added to existing `<div className="mt-2 pt-2 border-t border-border">` in `notesSlot` | Notes tab only |

`player-profile-header` is always in the DOM (outside the tab system). The other three are
inside the Notes tab content and only present when the notes tab is active.

### 2. Dispatcher Prefix Fallback — `src/lib/donna/donnaUIActionDispatcher.ts`

`buildFocusTargetForRoute` updated with a minimal prefix fallback after the existing
exact-key FOCUS_TARGET_MAP lookup:

```ts
// Sprint 841: dynamic player profile route — /director/players/<uuid>
// Matches any 4-segment path under /director/players/ (list is 3 segments).
if (route.startsWith('/director/players/') && route.split('/').length === 4) {
  return {
    route,
    targetId: 'player-profile-header',
    label: 'Player Profile',
    reason: "Here's the player profile. Use the tabs to review priorities, notes, evidence, and session history.",
    sourceCommand,
    highlightStyle: 'teal-glow',
  }
}
```

**No new routing behavior added.** This only activates if a dispatch result already contains
a player profile URL in its `route` field. No existing dispatch result currently routes to a
specific player profile — this is purely defensive future-proofing.

**`player_operator` command behavior unchanged.** `resolveGuidedOperator` returns
`kind: 'guided_operator'` which does not use `focusTarget`. The prefix fallback does not
affect guided operator results.

---

## Focus ID Activation Matrix

| Focus ID | Tab required | Always in DOM | Notes |
|---|---|---|---|
| `player-profile-header` | None | ✅ | Outside tab system. DONNA can highlight on any tab. |
| `player-active-priorities` | Notes | ❌ | Only when Notes tab is active. |
| `player-priority-recommendation` | Notes | ❌ | Only when Notes tab is active. |
| `player-evidence-hub` | Notes | ❌ | Only when Notes tab is active. |

The custom `TabsContent` component returns `null` for inactive tabs — tab content is
unmounted, not just hidden. Focus highlights on notes-tab targets require the director to
be on the Notes tab. Tab-switching coordination is out of scope for this sprint.

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `PriorityRecommendationDrafts.tsx` | Focus ID wrapper placed in `page.tsx` — component not touched |
| `PlayerActivePriorities.tsx` | Same — wrapper in `page.tsx` |
| `PlayerProfileTabs.tsx` | Not in sprint scope — tab trigger focus IDs are a remaining gap |
| `player_operator` command behavior | Not changed — guided_operator kind doesn't use focusTarget |
| Player priority approval/apply path | Not touched — Sprint 840 CTA and review queue path preserved |
| All player data | No reads or writes changed |
| Schema | No changes |

---

## Files Created

### `docs/PLAYER_PROFILE_DONNA_FOCUS_IDS_841.md`

This file.

---

## Files Modified

### `src/app/director/players/[playerId]/page.tsx`

1. Wrapped `<PlayerProfileHeader>` with `<div data-donna-focus-id="player-profile-header">`
2. Wrapped `<PlayerActivePriorities>` with `<div data-donna-focus-id="player-active-priorities">`
3. Wrapped `<PriorityRecommendationDrafts>` + Priority Recommendation `<Card>` with `<div data-donna-focus-id="player-priority-recommendation">`
4. Added `data-donna-focus-id="player-evidence-hub"` to existing Evidence Hub border-div

### `src/lib/donna/donnaUIActionDispatcher.ts`

1. Updated `buildFocusTargetForRoute` JSDoc to document the Sprint 841 prefix fallback
2. Restructured early return to use `if (entry)` guard (semantically identical)
3. Added prefix-match fallback for `/director/players/<uuid>` routes → returns `player-profile-header` target

---

## Score Impact (estimated)

Dimension 3 — Director-to-Player Navigation: **8/10 → 9/10**
Dimension 8 — DONNA Integration Quality: **7/10 → 8/10**

DONNA can now highlight the player profile header on arrival, and highlight priority/evidence
sections when those tabs are active.

---

## Remaining Player Priority Gaps

| Gap | Source | Priority |
|---|---|---|
| Tab trigger focus IDs (`player-notes-tab`) — `PlayerProfileTabs` not modified | Sprint 841 | Low |
| DONNA roster attention answers link to player list, not specific flagged player profile | Sprint 833 | Low |
| `playerAttentionRiskLoader` only checks `observation_type = 'concern'` — misses `injury_concern` and `behavioral` | Sprint 833 | Low |
| `PlayerActivePriorities` shows no attribution (approved by / on) | Sprint 833 | Low |
| `draftSummaryUpdateAction` only uses `is_private = true` observations | Sprint 833 | Low |
| Player DONNA chips are static — not priority-aware | Sprint 833 | Low |

---

## Recommended Sprint 842

**Sprint 842 — playerAttentionRiskLoader Observation Type Expansion V1**

Extend `src/lib/donna/playerAttentionRiskLoader.ts` to include `injury_concern` and
`behavioral` observation types in the attention risk calculation alongside the existing
`concern` filter. A player with injury or behavioral observations is equally urgent as one
with explicit concern observations.

Fix: Change the `.eq('observation_type', 'concern')` filter to
`.in('observation_type', ['concern', 'injury_concern', 'behavioral'])` (or equivalent
multi-type query).

Risk: Low — read-only data path change, no schema changes, no UI changes. Attention signal
result may surface additional players that were previously missed.
