# Sprint 849 — Player Profile Tab Trigger Focus IDs V1

**Date:** 2026-05-26
**Sprint:** 849
**Type:** UX / DONNA integration — DOM focus attribute on Notes tab trigger
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 841 known limitation — confirmed in Sprint 848 remaining gaps

Sprint 841 added four `data-donna-focus-id` attributes to the player profile page:

| Focus ID | Location | Always in DOM |
|---|---|---|
| `player-profile-header` | Wrapper around `<PlayerProfileHeader>` | ✅ Yes |
| `player-active-priorities` | Wrapper around `<PlayerActivePriorities>` in `notesSlot` | ❌ Notes tab only |
| `player-priority-recommendation` | Wrapper around `<PriorityRecommendationDrafts>` in `notesSlot` | ❌ Notes tab only |
| `player-evidence-hub` | Border-div inside `notesSlot` | ❌ Notes tab only |

`TabsContent` returns `null` for inactive tabs — the three notes-tab section IDs are unmounted when any other tab is active. `DonnaHighlightBanner` queries `document.querySelector('[data-donna-focus-id="..."]')` — if the element doesn't exist, it silently ignores it.

**Gap:** There was no focus ID on the Notes tab trigger itself. DONNA had no stable always-visible anchor to:
- Guide the director to the Notes tab from any tab state
- Highlight the tab entry point when directing attention to priorities or evidence

---

## Audit Findings

### `PlayerProfileTabs.tsx` — Notes tab trigger location

```tsx
// src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx, line 44
<TabsTrigger value="notes">Notes</TabsTrigger>
```

The Notes tab trigger is rendered inside `<TabsList scrollable>`, which renders as a `<div role="tablist">` — it is always visible in the player profile DOM regardless of active tab.

### `TabsTrigger` component — prop limitation

`TabsTrigger` in `src/components/ui/Tabs.tsx` (line 49) accepted only `{ value, children, className }`:
```ts
export function TabsTrigger({ value, children, className }: {
  value: string
  children: ReactNode
  className?: string
})
```

No `...rest` spread, no arbitrary HTML attributes. Adding `data-donna-focus-id` as a JSX prop would cause a TypeScript error and would NOT reach the underlying `<button>` DOM element.

**Resolution:** Extended `TabsTrigger` props to accept `'data-donna-focus-id'?: string` (optional, typed) and pass it through to `<button>` — all existing usages unaffected (optional prop, no existing caller passes it).

### `DonnaHighlightBanner` — query mechanism

```ts
const el = document.querySelector<HTMLElement>(`[data-donna-focus-id="${target.targetId}"]`)
if (!el) {
  // Element not on page yet — silently ignore (no error, no banner)
  return
}
el.classList.add(glowClass)
el.scrollIntoView({ behavior: 'smooth', block: 'center' })
```

The `data-donna-focus-id` must be on an element with a visual box — `scrollIntoView` and `classList.add` require a rendered element. A `display: contents` wrapper would silently fail. Placing the attribute directly on the `<button>` rendered by `TabsTrigger` is the correct target.

### `donnaUIActionDispatcher.ts` — no change required this sprint

Sprint 841's prefix fallback for `/director/players/<uuid>` returns `targetId: 'player-profile-header'` as the default for all player profile navigations. The `player-notes-tab` focus ID becomes a stable DOM anchor that a future sprint can use via the `focusTargetId` override in `NAV_PATTERNS` (same pattern as Sprint 820). Sprint 849 is the DOM anchor addition only.

---

## Solution

Two files modified: `src/components/ui/Tabs.tsx` and `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx`.

### `src/components/ui/Tabs.tsx` — extend `TabsTrigger` to accept `data-donna-focus-id`

**Before:**
```ts
export function TabsTrigger({ value, children, className }: {
  value: string
  children: ReactNode
  className?: string
}) {
  ...
  return (
    <button role="tab" aria-selected={isActive} onClick={() => set(value)} className={cn(...)}>
      {children}
    </button>
  )
}
```

**After:**
```ts
export function TabsTrigger({ value, children, className, 'data-donna-focus-id': donnaFocusId }: {
  value: string
  children: ReactNode
  className?: string
  // Sprint 849: optional DONNA focus anchor — passed through to the rendered <button>
  'data-donna-focus-id'?: string
}) {
  ...
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => set(value)}
      {...(donnaFocusId ? { 'data-donna-focus-id': donnaFocusId } : {})}
      className={cn(...)}
    >
      {children}
    </button>
  )
}
```

**Why:** `data-donna-focus-id` must be on the actual DOM `<button>` element for `DonnaHighlightBanner`'s `querySelector` + `classList.add` + `scrollIntoView` to work. The spread is conditional — the attribute is only added when `donnaFocusId` is provided, keeping the rendered HTML clean for all existing tab triggers.

### `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx`

```tsx
{/* Sprint 849: data-donna-focus-id="player-notes-tab" gives DONNA a stable DOM anchor
    on the Notes tab trigger. This is always visible in the TabsList regardless of which
    tab is active — unlike player-active-priorities, player-priority-recommendation, and
    player-evidence-hub, which only exist in the DOM when the Notes tab is active. */}
<TabsTrigger value="notes" data-donna-focus-id="player-notes-tab">Notes</TabsTrigger>
```

---

## Complete Player Profile Focus ID Map (post-Sprint 849)

| Focus ID | Element | Always in DOM | Sprint |
|---|---|---|---|
| `player-profile-header` | Wrapper `<div>` around `<PlayerProfileHeader>` | ✅ | 841 |
| `player-notes-tab` | `<button role="tab">` — Notes tab trigger | ✅ | **849** |
| `player-active-priorities` | Wrapper `<div>` around `<PlayerActivePriorities>` | ❌ Notes tab only | 841 |
| `player-priority-recommendation` | Wrapper `<div>` around `<PriorityRecommendationDrafts>` | ❌ Notes tab only | 841 |
| `player-evidence-hub` | Border-div inside `notesSlot` | ❌ Notes tab only | 841 |

Two stable always-in-DOM anchors now exist:
1. `player-profile-header` — top of the profile page
2. `player-notes-tab` — the Notes tab entry point

---

## `donnaUIActionDispatcher.ts` — Not Required This Sprint

The Sprint 841 prefix fallback returns `targetId: 'player-profile-header'` for all `/director/players/<uuid>` navigations. Using `player-notes-tab` as a focus target requires either:
- A new `NAV_PATTERNS` entry with `focusTargetId: 'player-notes-tab'` (Sprint 820 override pattern)
- Or a new DONNA conversational pattern that explicitly guides to the Notes tab

This is deferred to a future sprint. Sprint 849 provides the stable DOM anchor needed for that work.

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ DOM attribute only |
| No player data changed | ✅ |
| No player level movement | ✅ |
| No parent/player visibility | ✅ director-only |
| No schema changes | ✅ no migrations |
| No RLS weakening | ✅ |
| No routing behavior changed | ✅ `handleTabChange` unchanged |
| No tab behavior changed | ✅ click handler unchanged |
| Existing `TabsTrigger` usages unchanged | ✅ optional prop, no existing caller passes it |
| TypeScript clean | ✅ |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `donnaUIActionDispatcher.ts` | Not required — `player-notes-tab` DOM anchor added; dispatcher usage deferred |
| Other `TabsTrigger` instances | Not modified — `data-donna-focus-id` is optional; no other tab needs it yet |
| `page.tsx` (`notesSlot`) | Not modified — section-level focus IDs unchanged |
| Tab content `TabsContent` | Not modified — `null`-for-inactive behavior preserved |
| Player priority approval/apply path | Not touched |
| `FOCUS_TARGET_MAP` in dispatcher | Not modified — `player-notes-tab` not a route-level target |

---

## Files Created

### `docs/PLAYER_PROFILE_TAB_TRIGGER_FOCUS_IDS_849.md`

This file.

---

## Files Modified

### `src/components/ui/Tabs.tsx`

1. Added `'data-donna-focus-id'?: string` to `TabsTrigger` props (optional, typed)
2. Added `{...(donnaFocusId ? { 'data-donna-focus-id': donnaFocusId } : {})}` spread to `<button>` — passes attribute to DOM only when provided

### `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx`

1. Added `data-donna-focus-id="player-notes-tab"` to the Notes `<TabsTrigger>` with explanatory comment

---

## Score Impact (estimated)

Dimension 3 — Director-to-Player Navigation: **9/10 → 9.5/10**
Dimension 8 — DONNA Integration Quality: **8.5/10 → 9/10**

DONNA now has a stable always-visible anchor to the Notes tab entry point, enabling future navigation guidance like "Switch to the Notes tab to review priorities."

---

## Remaining Player Priority Gaps (post-849)

| Gap | Source | Priority |
|---|---|---|
| `donnaUIActionDispatcher.ts` not updated to use `player-notes-tab` — tab-trigger focus target needs NAV_PATTERNS entry | Sprint 849 | Low |
| Player DONNA chips static — not priority-aware | Sprint 833 | Low |
| No deep-link from attention signals to specific profile tab | Sprint 833 | Low |
| No "View in review queue →" link from active priority to originating `proposed_action` | Sprint 845 | Low |
| DONNA attention context not live-requeried per interaction | Sprint 833 | Low |
| Priority title/description are minimal machine-assembled strings | Sprint 833 | Low |

---

## Recommended Sprint 850

**Sprint 850 — DONNA Player Notes Tab Navigation V1**

Update `donnaUIActionDispatcher.ts` to wire `player-notes-tab` as a focus target for DONNA commands that direct the director to the Notes tab (priorities, evidence, coach notes). Add a `NAV_PATTERNS` entry or `focusTargetId` override that sets `targetId: 'player-notes-tab'` when navigating to a player profile in response to a priority-or-evidence question.

This completes the Sprint 849 → 850 pipeline: DOM anchor (849) → dispatcher wiring (850) → full tab-level DONNA guidance.

Risk: Low — dispatcher-only change; no data changes; `player-notes-tab` DOM target confirmed in Sprint 849.
