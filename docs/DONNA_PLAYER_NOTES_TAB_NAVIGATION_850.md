# Sprint 850 — DONNA Player Notes Tab Navigation V1

**Date:** 2026-05-26
**Sprint:** 850
**Type:** UX / DONNA integration — sourceCommand-aware focus target for player profile navigation
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 849 recommended sprint

Sprint 849 added `data-donna-focus-id="player-notes-tab"` to the Notes tab trigger — a stable always-in-DOM anchor. However, `buildFocusTargetForRoute` still returned `player-profile-header` for ALL navigations to `/director/players/<uuid>` regardless of the user's intent. The `player-notes-tab` DOM anchor from Sprint 849 was never activated.

**Gap:** DONNA had no way to distinguish:
- "open this player's profile" → `player-profile-header` (top of page — correct default)
- "show me player priorities" / "view development notes" → `player-notes-tab` (Notes tab trigger — where the content lives)

---

## Audit Findings

### Why NAV_PATTERNS entries are not applicable

`NAV_PATTERNS` maps natural language commands to **static route strings** (e.g., `/director/players`). Specific player profile URLs (`/director/players/<uuid>`) are dynamic — no NAV_PATTERNS entry can contain a UUID. The `buildFocusTargetForRoute` prefix fallback (Sprint 841) is the only hook for dynamic player profile URLs.

### `buildFocusTargetForRoute` — the correct lever

```ts
export function buildFocusTargetForRoute(
  route: string,
  sourceCommand?: string,   // ← user's original text — already available
): DonnaFocusTarget | undefined
```

`sourceCommand` is already passed at every call site:
- `resolveNavigation(text, role)` → `buildFocusTargetForRoute(route, text)` — `text` is the user command
- Sprint 848 nav confirmation → `buildFocusTargetForRoute(pendingOffer.href, pendingOffer.questionContext)` — `questionContext` is the user's question

### Intent detection — `sourceCommand` pattern

`NOTES_INTENT = /priorit|evidence|note|development|observation|coach|recommendation/i`

| User command | Matches? | Target |
|---|---|---|
| `"who needs attention?"` | ❌ | `player-profile-header` |
| `"show me player priorities"` | ✅ `/priorit/` | `player-notes-tab` |
| `"view development notes"` | ✅ `/note/`, `/development/` | `player-notes-tab` |
| `"open evidence for this player"` | ✅ `/evidence/` | `player-notes-tab` |
| `"check coach observations"` | ✅ `/observation/`, `/coach/` | `player-notes-tab` |
| `"show player recommendations"` | ✅ `/recommendation/` | `player-notes-tab` |
| `"open player profile"` | ❌ | `player-profile-header` |
| `"open this player"` | ❌ | `player-profile-header` |
| `null` / absent | ❌ | `player-profile-header` |

### Roster attention answer (Sprint 847/848) — correctly unaffected

`"who needs attention?"` does not match `NOTES_INTENT`. Players flagged by observations/attendance navigate to `player-profile-header` — the director sees the full profile context on arrival, not just the Notes tab.

---

## Solution

One block updated in `src/lib/donna/donnaUIActionDispatcher.ts` — the Sprint 841 player profile prefix fallback in `buildFocusTargetForRoute`.

### Before (Sprint 841)

```ts
if (route.startsWith('/director/players/') && route.split('/').length === 4) {
  return {
    route,
    targetId: 'player-profile-header',    // ← always the same
    label: 'Player Profile',
    reason: "Here's the player profile. Use the tabs to review priorities, notes, evidence, and session history.",
    sourceCommand,
    highlightStyle: 'teal-glow',
  }
}
```

### After (Sprint 850)

```ts
if (route.startsWith('/director/players/') && route.split('/').length === 4) {
  const NOTES_INTENT = /priorit|evidence|note|development|observation|coach|recommendation/i
  const notesIntent = sourceCommand ? NOTES_INTENT.test(sourceCommand) : false

  return {
    route,
    targetId: notesIntent ? 'player-notes-tab' : 'player-profile-header',
    label: notesIntent ? 'Player Notes' : 'Player Profile',
    reason: notesIntent
      ? "The Notes tab contains active priorities, recommendation drafts, coach notes, and evidence hub."
      : "Here's the player profile. Use the tabs to review priorities, notes, evidence, and session history.",
    sourceCommand,
    highlightStyle: 'teal-glow',
  }
}
```

**Changes:**
1. Added `NOTES_INTENT` regex constant (scoped locally inside the condition)
2. Added `notesIntent` boolean — false when `sourceCommand` is absent/null
3. `targetId` — `'player-notes-tab'` when intent matches, `'player-profile-header'` otherwise
4. `label` — `'Player Notes'` when intent matches, `'Player Profile'` otherwise
5. `reason` — notes-specific guidance when intent matches, existing default otherwise
6. Updated JSDoc for the function to document Sprint 850

---

## Behavior Matrix (post-Sprint 850)

| Scenario | `sourceCommand` | `notesIntent` | `targetId` | `label` |
|---|---|---|---|---|
| "who needs attention?" → player profile nav | `"who needs attention?"` | ❌ | `player-profile-header` | Player Profile |
| "view development notes" → player nav | `"view development notes"` | ✅ | `player-notes-tab` | Player Notes |
| "show priorities for this player" → player nav | `"show priorities for this player"` | ✅ | `player-notes-tab` | Player Notes |
| Nav offer without sourceCommand | `undefined` | ❌ | `player-profile-header` | Player Profile |
| Generic "open player profile" | `"open player profile"` | ❌ | `player-profile-header` | Player Profile |
| `resolveNavigation` with notes command | `text` containing `/note/i` | ✅ | `player-notes-tab` | Player Notes |

---

## Call-site Coverage

`buildFocusTargetForRoute` is called from:

| Caller | `sourceCommand` value | Effect |
|---|---|---|
| `resolveNavigation` (dispatcher) | User command text | Notes intent detected when applicable |
| Sprint 848 nav confirmation handler | `pendingOffer.questionContext` (user question) | Notes intent detected when applicable |
| `DonnaAssistantButton.tsx` navigate path (line 2796) | None (no sourceCommand passed) | `player-profile-header` default preserved |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ pure focus target logic change |
| No player data changed | ✅ |
| No player level movement | ✅ |
| No parent/player visibility | ✅ |
| No schema changes | ✅ no migrations |
| No RLS weakening | ✅ |
| No routing behavior changed | ✅ navigation routes unchanged |
| No tab auto-switching | ✅ only highlights the tab trigger; director clicks to switch |
| `player-profile-header` behavior preserved | ✅ default when `notesIntent` is false |
| `sourceCommand` absent → safe fallback | ✅ `notesIntent = false` when `undefined` |
| Existing NAV_PATTERNS unchanged | ✅ no entries added or removed |
| Existing `focusTargetId` overrides unchanged | ✅ those override at the NAV_PATTERNS level, before this function |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| NAV_PATTERNS entries | Not applicable — dynamic player profile URLs can't be in static patterns |
| `DonnaAssistantButton.tsx` | Not touched — `buildFocusTargetForRoute` is called by the dispatcher it uses |
| `DonnaVoiceReadyShell.tsx` | Not touched — Sprint 848 wiring is complete and unchanged |
| `PlayerProfileTabs.tsx` | Not touched — Sprint 849 DOM anchor is correct and complete |
| Tab auto-switching | Deferred — highlighting the tab trigger is enough for Sprint 850 |
| Other `focusTargetId` overrides | Unchanged — those apply to static routes, not dynamic player profiles |
| `FOCUS_TARGET_MAP` | Not modified — player profile routes can't use exact-key lookup |

---

## Files Created

### `docs/DONNA_PLAYER_NOTES_TAB_NAVIGATION_850.md`

This file.

---

## Files Modified

### `src/lib/donna/donnaUIActionDispatcher.ts`

1. Updated `buildFocusTargetForRoute` JSDoc to document Sprint 850 sourceCommand-aware behavior
2. Added `NOTES_INTENT` regex and `notesIntent` boolean in the Sprint 841 prefix fallback block
3. Made `targetId`, `label`, and `reason` conditional on `notesIntent`

---

## Score Impact (estimated)

Dimension 3 — Director-to-Player Navigation: **9.5/10 → 9.5/10** (no score change — Sprint 849 established the anchor; Sprint 850 activates it without adding new visible features)

Dimension 8 — DONNA Integration Quality: **9/10 → 9.5/10**

DONNA now guides directors to the right entry point on player profiles based on command intent — the Notes tab trigger is highlighted when the context is priorities, evidence, or coach notes.

---

## Remaining Player Priority Gaps (post-850)

| Gap | Source | Priority |
|---|---|---|
| Player DONNA chips static — not priority-aware | Sprint 833 | Low |
| No deep-link from attention signals to specific profile tab | Sprint 833 | Low |
| No "View in review queue →" link from active priority to originating `proposed_action` | Sprint 845 | Low |
| DONNA attention context not live-requeried per interaction | Sprint 833 | Low |
| Priority title/description are minimal machine-assembled strings | Sprint 833 | Low |
| Tab auto-switching (Notes tab) not yet implemented | Sprint 850 | Low |

---

## Recommended Sprint 851

**Sprint 851 — Player Priority DONNA Chips V1**

Update the player DONNA chips (quick-action buttons shown in the DONNA panel when viewing a player profile) to be priority-aware. When a player has active priorities, surface the top priority as a chip — "View active priority" or similar. This gives the director an immediate, context-aware shortcut from DONNA to the player's current priority state.

Source: Sprint 833 Dimension 9 remaining gap.  
Risk: Low — read-only display change; no data writes; no priority apply changes.

Alternatively: **Sprint 851 — DONNA Review Queue Deep-link V1** — add a "View in review queue" link from active priority cards to the originating `proposed_action` in the review center (Sprint 845 remaining gap). Risk: Low — display-only link addition using `proposed_action_id` already stored on `player_priorities`.
