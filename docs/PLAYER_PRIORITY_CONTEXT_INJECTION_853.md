# Sprint 853 — Player Priority Context Injection Audit + Design V1

**Date:** 2026-05-26
**Sprint:** 853
**Type:** Audit + Design — no source files modified
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors) — audit only
**Status:** ✅ DESIGN COMPLETE — implementation deferred to Sprint 854

---

## Goal

Determine the safest architecture for making DONNA player-profile chips truly active-priority-aware without breaking layout boundaries, server/client separation, role safety, or creating fragile prop threading.

---

## Audit Findings

### 1. Where is `DonnaAssistantButton` mounted?

`src/app/director/layout.tsx` — a Server Component. It is mounted as a sibling to `{children}`, NOT as a descendant of the player profile page:

```tsx
// director/layout.tsx
return (
  <DonnaSessionContextProvider>
    <div className="flex min-h-screen">
      <SidebarNav ... />
      <main className="flex-1">
        {children}          {/* ← player profile page renders here */}
      </main>
      <DonnaAssistantButton   {/* ← sibling — no tree connection to children */}
        academyId={academyId}
        directorName={userDisplayName}
      />
      <DonnaHighlightBanner />
    </div>
  </DonnaSessionContextProvider>
)
```

**Result:** `DonnaAssistantButton` cannot receive props from the player profile page. There is no prop-threading path from page content to the layout-level DONNA button. The layout server component runs once on navigation — it does not re-render when page content changes.

---

### 2. Can the player profile page pass page-specific data to `DonnaAssistantButton` directly?

**No.** Two structural reasons:
1. `layout.tsx` is a Server Component — it fetches only layout-level data (`academyId`, `directorName`, `pendingCount`) and does not know which player the director is viewing.
2. `DonnaAssistantButton` receives `{ academyId, directorName, role? }` — there's no mechanism to pass player-specific data through the layout.

Adding player priority data to the layout's fetch would be wrong: the layout would need to conditionally detect a player profile route and query `player_priorities` — adding per-player DB work to every layout render on every director page.

---

### 3. Is there an existing page-context provider or DONNA context bridge?

**Three existing mechanisms — none currently used for player priority context:**

**A. `DonnaSessionContext` (Sprint 625) — closest to what we need**

`DonnaSessionContextProvider` wraps the entire director layout and provides:
```ts
interface DonnaSessionContextValue {
  session: DonnaSessionState    // { lastRoute, lastModule, lastPrompt, lastObjectLabel, lastSummary }
  updateObjectContext: (label: string, summary?: string) => void
  // ... panelOpen, updateRoute, updateModule, etc.
}
```

The `updateObjectContext` method exists specifically for pages to register current object context. `lastObjectLabel` and `lastSummary` are designed for this.

**Critical finding:** `updateObjectContext` is **NEVER CALLED** by any page component in the current codebase. The fields `lastObjectLabel` and `lastSummary` in `DonnaSessionState` have always been `null`.

**`DonnaAssistantButton` at line 399:**
```ts
const { panelOpen, openDonnaPanel, closeDonnaPanel, updatePrompt } = useDonnaSessionContext()
```
It does NOT read `session.lastObjectLabel` or `session.lastSummary` for any purpose.

**B. `donnaPageContextRegistry.ts` (Sprint 625+) — static, no live data**

A static registry of `DonnaPageContext` entries keyed by route pattern. Has an entry for `/director/players/[playerId]` with `suggestedPrompts`, `safeDraftActions`, etc. But carries no live per-player data. Cannot hold `activePriorityCount` or `topActivePriorityTitle`.

**C. `DonnaSessionState.lastSummary` / `lastObjectLabel` — designed for context, but not extended to chips**

`DonnaAssistantButton` does not currently read these fields for chip label generation. They would need to be wired.

---

### 4. Does `DirectorDonnaContext` already support page-specific context?

No. `DirectorDonnaContext` is academy-wide: `attentionItems`, `pendingReviews`, `missingWrapUps`, etc. It has no per-player priority list.

---

### 5. Is there a clean client context pattern that can register current page context from page components?

**Yes — via `DonnaSessionContext.updateObjectContext`.** The mechanism exists and the provider is in scope. However, there is a **critical blocker** in the current implementation:

```ts
// DonnaSessionContextProvider.tsx line 71–76
const updateObjectContext = useCallback((label: string, summary?: string) => {
  setSession(prev => ({
    ...prev,
    lastObjectLabel: label.slice(0, 100),
    lastSummary: summary ? summary.slice(0, 300) : prev.lastSummary,
  }))
}, [])
```

The `summary ? summary.slice(0, 300) : prev.lastSummary` guard:
- If `summary` is `undefined`, `null`, `''`, `0`, or any falsy value → `lastSummary` keeps the previous value
- **It cannot be cleared to `null`** via `updateObjectContext` without passing a non-empty truthy string

**Why this matters:**
- Director is on Player A (Technical Skill priority active) → registrar calls `updateObjectContext('player_profile', 'Technical Skill (high)')`
- Director navigates to Player B (no active priorities) → registrar should clear `lastSummary` to `null`
- But `updateObjectContext('player_profile', undefined)` keeps `lastSummary = 'Technical Skill (high)'`
- Chips on Player B's profile would incorrectly show "View: Technical Skill (High)" (Player A's stale data)

**This is the blocker.** Any workaround (sentinel strings like `'none'`, `'_clear_'`) is a brittle hack that violates the sprint brief's requirement: "Do not create a one-off brittle workaround."

---

### 6. Would adding active priority props to `DonnaAssistantButton` require changing `director/layout.tsx`?

Yes — if done via prop threading. The layout would need to detect the player profile route, extract the `playerId`, and query `player_priorities` — adding per-player DB work to every page load. This is incorrect architecture.

---

### 7. Would it require fetching player priority data again from the client?

Not with the registrar pattern. Data flows from the existing server-side `page.tsx` query → client component `PlayerProfileDonnaRegistrar` (via props) → `DonnaSessionContext`. No new DB query needed.

---

### 8. Stale data risk?

**Yes — inherent to the current `updateObjectContext` semantics.** See finding #5. The `undefined`-keeps-previous behavior makes atomic clear+set operations impossible with the current API.

---

### 9. Would it leak player data to parent/player roles?

No — `DonnaAssistantButton` is only rendered for directors. Only safe, non-sensitive fields would be registered: `activePriorityCount`, `topPriorityTitle`, `topPriorityLevel`. No raw notes, no private evidence text, no coach communication content.

---

### 10. Architecture options evaluated

| Option | Description | Files | Feasibility |
|---|---|---|---|
| A | Prop threading from layout | Requires layout to query per-player data | ❌ Wrong architecture |
| B | Reuse existing `updateObjectContext` as-is | 3 files | ❌ Blocked by falsy-summary semantics |
| C | Workaround with sentinel strings | 3 files | ❌ Brittle — violates "no brittle workarounds" constraint |
| D | Extend `DonnaSessionContext` with typed `playerProfileContext` field | 5 files | ✅ Correct — Sprint 854 |
| E | New dedicated `DonnaPlayerProfileContext` | 6 files | ✅ Correct but over-engineered |
| F | Route-aware only, defer until broader DONNA Page Context Registry | 0 files | ✅ Conservative — longer wait |

**Recommended: Option D — Sprint 854**

---

## Recommended Architecture (Sprint 854)

### 1. Extend `DonnaSessionState` with typed `playerProfileContext`

**File:** `src/lib/donna/donnaSessionContext.ts`

```ts
// New interface — safe director-visible fields only
export interface DonnaPlayerProfileContext {
  activePriorityCount: number
  topPriorityTitle: string | null
  topPriorityLevel: string | null
  // Future fields can be added without touching other files:
  // hasPriorityRecommendationDraft: boolean
  // availableFocusTargets: string[]
}

export interface DonnaSessionState {
  lastRoute: string | null
  lastModule: string | null
  lastPrompt: string | null
  lastObjectLabel: string | null
  lastSummary: string | null
  // Sprint 854: player profile context — populated by PlayerProfileDonnaRegistrar
  playerProfileContext: DonnaPlayerProfileContext | null
}
```

**Why typed over reusing `lastSummary`:**
- `playerProfileContext: null` is unambiguous — no sentinel strings needed
- Fields are individually accessible (`session.playerProfileContext?.topPriorityTitle`)
- Future fields (e.g., `hasPriorityRecommendationDraft`) don't require string encoding changes

### 2. Add `updatePlayerProfileContext` to `DonnaSessionContextProvider`

**File:** `src/components/donna/DonnaSessionContextProvider.tsx`

```ts
const updatePlayerProfileContext = useCallback(
  (ctx: DonnaPlayerProfileContext | null) => {
    setSession(prev => ({ ...prev, playerProfileContext: ctx }))
  },
  []
)
```

Add to `DEFAULT_DONNA_SESSION`:
```ts
playerProfileContext: null,
```

Add to `DonnaSessionContextValue`:
```ts
updatePlayerProfileContext: (ctx: DonnaPlayerProfileContext | null) => void
```

### 3. Create `PlayerProfileDonnaRegistrar.tsx`

**File:** `src/app/director/players/[playerId]/_components/PlayerProfileDonnaRegistrar.tsx`

```tsx
'use client'

import { useEffect } from 'react'
import { useDonnaSessionContext } from '@/lib/donna/donnaSessionContext'
import type { DonnaPlayerProfileContext } from '@/lib/donna/donnaSessionContext'

interface Props {
  activePriorityCount: number
  topPriorityTitle: string | null
  topPriorityLevel: string | null
}

export function PlayerProfileDonnaRegistrar({
  activePriorityCount,
  topPriorityTitle,
  topPriorityLevel,
}: Props) {
  const { updatePlayerProfileContext } = useDonnaSessionContext()

  useEffect(() => {
    const ctx: DonnaPlayerProfileContext = {
      activePriorityCount,
      topPriorityTitle,
      topPriorityLevel,
    }
    updatePlayerProfileContext(ctx)

    return () => {
      // Clear on unmount — prevents stale data when navigating to non-player-profile pages
      updatePlayerProfileContext(null)
    }
  }, [activePriorityCount, topPriorityTitle, topPriorityLevel, updatePlayerProfileContext])

  return null
}
```

### 4. Render registrar in `page.tsx`

**File:** `src/app/director/players/[playerId]/page.tsx`

Add near the top of the return JSX:
```tsx
{/* Sprint 854: Register safe player profile context for DONNA panel. Director-only. */}
<PlayerProfileDonnaRegistrar
  activePriorityCount={activePriorities.length}
  topPriorityTitle={activePriorities[0]?.title ?? null}
  topPriorityLevel={activePriorities[0]?.priority_level ?? null}
/>
```

Data passed:
- `activePriorityCount` — integer count, no sensitive content
- `topPriorityTitle` — priority title string (director-visible; never exposed to parent/player)
- `topPriorityLevel` — `'high' | 'medium' | 'low'` string

Data NOT passed (not needed for chips):
- Full priority description
- Evidence details
- Coach notes
- `proposed_action_id`
- Any private data

### 5. Update `DonnaAssistantButton.tsx` to read `session.playerProfileContext`

**File:** `src/components/assistant/DonnaAssistantButton.tsx`

Change line 399 to destructure `session`:
```ts
const { session, panelOpen, openDonnaPanel, closeDonnaPanel, updatePrompt } = useDonnaSessionContext()
```

Update player profile chip logic (Sprint 852 block):
```ts
const playerCtx = session.playerProfileContext
const isPlayerProfile = pathname.startsWith('/director/players/') && pathname.split('/').length === 4

...(isPlayerProfile
  ? ([
      {
        // Sprint 854: show top priority title if available; fallback to generic label
        label: playerCtx?.topPriorityTitle
          ? `View: ${playerCtx.topPriorityTitle}${playerCtx.topPriorityLevel ? ` (${playerCtx.topPriorityLevel})` : ''}`
          : 'View player notes',
        action: () => { router.push(pathname + '?tab=notes'); closePanel() }
      },
      {
        label: (playerCtx?.activePriorityCount ?? 0) > 0 ? 'Show evidence' : 'Show priorities',
        action: () => { router.push(pathname + '?tab=notes'); closePanel() }
      },
      { label: 'Open player updates', action: () => { router.push('/director/review?tab=player-updates'); closePanel() } },
    ])
  : ([...generic Sprint 800 chips])
),
```

**Chip behavior with context:**

| Scenario | Chip 1 | Chip 2 |
|---|---|---|
| `playerCtx` null (registrar not yet mounted) | "View player notes" | "Show priorities" |
| 0 active priorities | "View player notes" | "Show priorities" |
| 1+ active priorities, top = "Technical Skill", level = "high" | "View: Technical Skill (high)" | "Show evidence" |
| 1+ active priorities, no title | "View player notes" | "Show evidence" |

---

## Sprint 854 Implementation Plan

### Files to create
- `src/app/director/players/[playerId]/_components/PlayerProfileDonnaRegistrar.tsx` — new thin client component

### Files to modify
1. `src/lib/donna/donnaSessionContext.ts` — add `DonnaPlayerProfileContext` interface + `playerProfileContext` field to `DonnaSessionState` + `updatePlayerProfileContext` to `DonnaSessionContextValue`
2. `src/components/donna/DonnaSessionContextProvider.tsx` — implement `updatePlayerProfileContext` callback, add to `DEFAULT_DONNA_SESSION`
3. `src/app/director/players/[playerId]/page.tsx` — render `<PlayerProfileDonnaRegistrar>` with safe extracted fields
4. `src/components/assistant/DonnaAssistantButton.tsx` — read `session.playerProfileContext`, update chip logic

### Risk assessment for Sprint 854
| Risk | Status |
|---|---|
| `donnaSessionContext.ts` change | Low — additive only; `DonnaSessionState` is extensible; all new fields are optional |
| `DonnaSessionContextProvider.tsx` change | Low — adding a callback; existing callbacks unchanged |
| `page.tsx` change | Low — rendering a null-returning client component with read-only props |
| `DonnaAssistantButton.tsx` change | Low — reading session state; no new side effects |
| Stale data | Handled — `updatePlayerProfileContext(null)` on unmount clears the field deterministically |
| Role safety | Safe — `DonnaAssistantButton` is director-only; `topPriorityTitle` is already director-visible |
| Extra DB queries | None — data comes from existing `page.tsx` `player_priorities` query |

### Sprint 854 migration needed
None.

---

## Why This Sprint Is Design-Only

| Check | Result |
|---|---|
| Implementation requires layout restructuring? | ❌ No — `layout.tsx` unchanged |
| Implementation requires client context provider changes? | ✅ YES — `DonnaSessionContextProvider.tsx` needs `updatePlayerProfileContext` |
| Implementation requires server/client boundary changes? | ❌ No — standard Next.js server-renders-client-component pattern |
| Implementation requires new DB queries from DONNA panel? | ❌ No — data from existing `page.tsx` query |
| `updateObjectContext` (existing) can be used as-is? | ❌ No — `summary ? ... : prev.lastSummary` prevents clean `null` clearing |
| Workaround with sentinel strings acceptable? | ❌ No — sprint brief explicitly prohibits brittle workarounds |

The client context provider change (extending `DonnaSessionContextProvider`) is the decisive factor. Per sprint brief: "If implementation requires... client context provider changes → STOP and document the design instead."

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ design only, no code changes |
| No player data changed | ✅ |
| No player level movement | ✅ |
| No parent/player visibility | ✅ director-only DONNA surface |
| No schema changes | ✅ |
| No RLS weakening | ✅ |
| No `layout.tsx` changes | ✅ layout architecture unchanged |
| No new DB queries from DONNA panel | ✅ data flows server → client via props |
| No brittle sentinel workarounds | ✅ design uses typed `null` for clearing |

---

## Files Created

### `docs/PLAYER_PRIORITY_CONTEXT_INJECTION_853.md`

This file.

---

## Files Modified

None — audit + design sprint.

---

## Score Impact

No score change. This sprint delivers the architectural foundation for Sprint 854.

---

## Remaining Player Priority Gaps (post-853)

| Gap | Source | Priority |
|---|---|---|
| Active-priority-aware chip labels — implementation deferred to Sprint 854 | Sprint 852, 853 | Medium (design complete) |
| Focus highlight does not fire on query-string-only tab change | Sprint 852 | Low |
| Direct deep-link to specific review item — `proposed_action_id` not on `player_priorities` | Sprint 851 | Low (migration required) |
| No deep-link from attention signals to specific profile tab | Sprint 833 | Low |
| DONNA attention context not live-requeried per interaction | Sprint 833 | Low |
| Priority title/description are minimal machine-assembled strings | Sprint 833 | Low |
| Tab auto-switching (Notes tab) not yet implemented | Sprint 850 | Low |

---

## Recommended Sprint 854

**Sprint 854 — Player Priority Context Injection V1 (Implementation)**

Implement the architecture designed in Sprint 853:

1. Extend `DonnaSessionState` with `playerProfileContext: DonnaPlayerProfileContext | null`
2. Add `updatePlayerProfileContext` to `DonnaSessionContextProvider`
3. Create `PlayerProfileDonnaRegistrar.tsx` — thin client component that registers/clears context
4. Render registrar in `page.tsx` with safe extracted priority fields
5. Update `DonnaAssistantButton.tsx` chip logic to read `session.playerProfileContext`

**Outcome:** When director is on a player profile with active priorities, DONNA chips show:
- "View: Technical Skill (high)" instead of "View player notes"
- "Show evidence" instead of "Show priorities"

When no active priorities:
- "View player notes"
- "Show priorities"

Risk: Low — additive changes only; no new DB queries; no schema changes; clean `null`-based clearing (no sentinel strings).
