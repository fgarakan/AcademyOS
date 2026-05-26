# Sprint 852 — Player Priority DONNA Chips V1

**Date:** 2026-05-26
**Sprint:** 852
**Type:** UX — route-aware quick chips on player profile
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 833 Dimension 9 remaining gap — "Player DONNA chips static — not priority-aware"

The DONNA assistant panel (`DonnaAssistantButton`) displayed the same 3 generic director chips regardless of the current page:
- "What do I need to do today?"
- "What needs my attention?"
- "What can you help me do here?"

When the director was on a player profile (`/director/players/<uuid>`), these chips were irrelevant to the player context. There was no quick path from the DONNA panel to the player's notes, priorities, or review queue items.

---

## Audit Findings

### Which DONNA surface handles player profiles?

`DonnaAssistantButton.tsx` — the floating assistant panel — is mounted in `src/app/director/layout.tsx` and rendered on every director page including player profiles. This is the correct surface to update.

`DonnaVoiceReadyShell.tsx` is used only on dedicated DONNA pages (`/director/donna`, `/coach/donna`) — NOT on player profiles. Its chip system is out of scope.

### Active priority data availability

**Result: NOT available to `DonnaAssistantButton.tsx`.**

`DonnaAssistantButton` receives only three props:
```ts
interface Props {
  academyId: string
  directorName?: string
  role?: DonnaRole
}
```

Active priority data (player-specific `player_priorities` rows) lives in the `src/app/director/players/[playerId]/page.tsx` server component and is passed only to `PlayerActivePriorities.tsx`. It is never forwarded to the DONNA panel.

`DirectorDonnaContext` includes academy-level `attentionItems` (risk signals across all players) but does NOT include per-player active priorities.

**Implication:** True active-priority-aware chips — e.g. "You have 2 active priorities — view them", "Your top priority is Technical Skill (High)" — require one of:
- Passing active priorities as a prop to `DonnaAssistantButton` from the player profile layout
- A live context-refresh query inside the DONNA panel (not yet implemented)
- `DirectorDonnaContext` expansion to include per-player priority data

All three approaches are deferred. Sprint 852 provides route-aware but data-honest chips.

### Route detection

`DonnaAssistantButton.tsx` already has `const pathname = usePathname()` (line 396). Player profile detection:

```ts
pathname.startsWith('/director/players/') && pathname.split('/').length === 4
```

- Matches: `/director/players/abc123` (UUID — 4 path segments)
- Does not match: `/director/players` (list — 3 segments)
- Does not match: `/director/players/abc123/anything` (sub-page — 5+ segments)

### Highlight limitation

`DonnaHighlightBanner` fires on `usePathname()` change. Player profile tabs switch via query string (`?tab=notes`) — the pathname `/director/players/<uuid>` does NOT change. Therefore:

- `setDonnaFocusTarget` + navigate to `?tab=notes` will NOT trigger the teal highlight
- `DonnaHighlightBanner`'s `useEffect([pathname])` only re-fires when the path segment changes

**Impact:** Navigation from chip to Notes tab is immediate and direct. The `player-notes-tab` DOM anchor (Sprint 849) is not highlighted on chip tap. This is honest UX — the chip navigates but does not claim to highlight a specific element it cannot reach.

Future sprint: if tab switches move to path-based routing (e.g., `/director/players/<uuid>/notes`), the focus highlight could be triggered.

### Existing chips preserved

The 3 generic director chips ("What do I need to do today?", "What needs my attention?", "What can you help me do here?") remain unchanged for all non-player-profile director routes. The Sprint 784 optional "Back to" chip is preserved for both player profiles and other routes.

---

## Solution

One block modified in `src/components/assistant/DonnaAssistantButton.tsx` — the `// Sprint 800` director chip block.

### Before (Sprint 800)

```ts
// Sprint 800 — Trimmed to 3 core chips (+ optional "Back to" = max 4).
{ label: 'What do I need to do today?', action: () => handleCommandSubmit('What do I need to do today?') },
{ label: 'What needs my attention?', action: () => handleCommandSubmit('What needs my attention?') },
{ label: 'What can you help me do here?', action: () => handleCommandSubmit('What can you help me do here?') },
```

### After (Sprint 852)

```ts
// Sprint 852 — Player profile route-aware chips.
// Active priority data is NOT available here (no per-player context injection).
// Chips are route-aware but data-honest.
...(pathname.startsWith('/director/players/') && pathname.split('/').length === 4
  ? ([
      { label: 'View player notes',   action: () => { router.push(pathname + '?tab=notes'); closePanel() } },
      { label: 'Show priorities',     action: () => { router.push(pathname + '?tab=notes'); closePanel() } },
      { label: 'Open player updates', action: () => { router.push('/director/review?tab=player-updates'); closePanel() } },
    ] as { label: string; action: () => void }[])
  : ([
      // Sprint 800 — generic director chips for all other director routes.
      { label: 'What do I need to do today?', action: () => handleCommandSubmit('What do I need to do today?') },
      { label: 'What needs my attention?', action: () => handleCommandSubmit('What needs my attention?') },
      { label: 'What can you help me do here?', action: () => handleCommandSubmit('What can you help me do here?') },
    ] as { label: string; action: () => void }[])
),
```

---

## Chip Behavior Matrix (post-Sprint 852)

| Route | Chip 1 | Chip 2 | Chip 3 | Back to (conditional) |
|---|---|---|---|---|
| `/director/players/<uuid>` | View player notes | Show priorities | Open player updates | ↩ Back to [page] (if exists) |
| Any other director route | What do I need to do today? | What needs my attention? | What can you help me do here? | ↩ Back to [page] (if exists) |

### Chip actions

| Chip | Action | Destination |
|---|---|---|
| "View player notes" | `router.push(pathname + '?tab=notes')` + `closePanel()` | Same player profile, Notes tab active |
| "Show priorities" | `router.push(pathname + '?tab=notes')` + `closePanel()` | Same player profile, Notes tab active (priorities are on Notes tab) |
| "Open player updates" | `router.push('/director/review?tab=player-updates')` + `closePanel()` | Review queue — Player Updates tab |

### Why both "View player notes" and "Show priorities" navigate to `?tab=notes`

Active priorities live on the Notes tab of the player profile. Both chips represent distinct director intents ("I want to see notes" vs "I want to see priorities") but both are served by the same tab. The director who taps "Show priorities" lands on the Notes tab and sees the `PlayerActivePriorities` section immediately — which is the correct destination. This is an honest and useful mapping.

A future sprint could differentiate them (e.g. "Show priorities" scrolls to `player-active-priorities` on arrival) once the tab-switch + highlight coordination problem is solved.

---

## Limitations Documented

| Limitation | Impact | Resolution path |
|---|---|---|
| Active priority data not available to `DonnaAssistantButton` | Cannot show player-specific priority labels in chips (e.g. "View: Technical Skill priority") | Pass active priorities as prop from player profile page, or expand `DirectorDonnaContext` with per-player priority data |
| Focus highlight does not fire on query-string-only tab change | `player-notes-tab` teal glow (Sprint 849) not activated on chip tap | Move tab routing to path segments (e.g. `/director/players/<uuid>/notes`) so `pathname` changes and `DonnaHighlightBanner` fires |
| "View player notes" and "Show priorities" both navigate to `?tab=notes` | Two chips, one destination | Differentiate when tab-switch + `player-active-priorities` scroll can be coordinated |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ pure navigation + chip display |
| No player data changed | ✅ |
| No player level movement | ✅ |
| No parent/player visibility | ✅ director-only surface |
| No schema changes | ✅ no migrations |
| No RLS weakening | ✅ |
| No routing behavior changed | ✅ chips use `router.push` (same as existing) |
| No player data queried from DONNA panel | ✅ |
| No fake/invented priority data in chips | ✅ chips are route-aware, not data-specific |
| No auto-approval | ✅ |
| No review queue bypass | ✅ "Open player updates" is a `<Link>`-equivalent, not a submit action |
| Generic director chips preserved for all non-player-profile routes | ✅ |
| "Back to" chip preserved | ✅ both player profile and other routes |
| Coach chips unchanged | ✅ only director branch modified |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `DonnaVoiceReadyShell.tsx` | Only used on `/director/donna` — not on player profiles |
| `donnaSuggestedQuestions.ts` | Out of scope — voice shell only |
| `donnaQuickActions.ts` | Out of scope — not rendered on player profiles |
| Player profile `page.tsx` | Not touched |
| `PlayerActivePriorities.tsx` | Not touched |
| `donnaUIActionDispatcher.ts` | Not touched |
| `donnaFocusTarget.ts` | Not used (highlight limitation documented) |
| Schema, SQL, RLS, migrations, seed, env | None of these were touched |

---

## Files Created

### `docs/PLAYER_PRIORITY_DONNA_CHIPS_852.md`

This file.

---

## Files Modified

### `src/components/assistant/DonnaAssistantButton.tsx`

1. Replaced the `// Sprint 800` 3-chip block with a route-aware conditional
2. When `pathname.startsWith('/director/players/') && pathname.split('/').length === 4`:
   — Renders "View player notes", "Show priorities", "Open player updates"
3. Otherwise: renders existing Sprint 800 chips unchanged
4. Added Sprint 852 comment block documenting active priority data limitation, highlight limitation, and deferral rationale

---

## Score Impact (estimated)

Dimension 8 — DONNA Integration Quality: **9.5/10 → 9.5/10** (no change — visible UX improvement, but the core limitation — active priority data not in chips — means this doesn't advance the score meaningfully)

Dimension 3 — Director-to-Player Navigation: **9.5/10 → 9.5/10** (no change — chips improve discoverability but don't add new navigation capability)

The chips close a UX gap (irrelevant generic chips on player profiles) rather than advancing a scored dimension. The first real score improvement in this area requires per-player context injection into the DONNA panel.

---

## Remaining Player Priority Gaps (post-852)

| Gap | Source | Priority |
|---|---|---|
| Active-priority-aware chips require per-player context injection | Sprint 852 | Low |
| Focus highlight on player profile tab switch (query-string-only) not triggered | Sprint 852 | Low |
| Direct deep-link to specific review item — `proposed_action_id` not stored on `player_priorities` | Sprint 851 | Low (migration required) |
| No deep-link from attention signals to specific profile tab | Sprint 833 | Low |
| DONNA attention context not live-requeried per interaction | Sprint 833 | Low |
| Priority title/description are minimal machine-assembled strings | Sprint 833 | Low |
| Tab auto-switching (Notes tab) not yet implemented | Sprint 850 | Low |

---

## Recommended Sprint 853

**Sprint 853 — Player Priority Context Injection V1**

Pass active priorities as a prop from the player profile server component to `DonnaAssistantButton`, enabling truly priority-aware chips — e.g. "View active priority: Technical Skill (High)" instead of the current generic "Show priorities" chip. This requires:
1. Adding an optional `playerActivePriorities?: PlayerPriorityRow[]` prop to `DonnaAssistantButton`
2. Passing `activePriorities` from `page.tsx` to the layout or via a client context
3. Using the top priority's `title` and `priority_level` in the chip label

Risk: Medium — requires context threading from server component to client component. No DB writes. No schema changes. No priority apply changes.

Alternatively: **Sprint 853 — Player Profile Tab Path Routing V1** — move player profile tabs from query-string routing (`?tab=notes`) to path-segment routing (`/director/players/<uuid>/notes`). This would allow `DonnaHighlightBanner` to trigger the teal glow on tab navigation, completing the Sprint 849 → 850 → 852 DONNA highlight chain. Risk: Medium — requires updating `PlayerProfileTabs.tsx` routing, `VALID_TABS`, and all tab-URL consumers.
