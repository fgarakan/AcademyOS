# Sprint 854 — Player Priority Context Injection V1

**Date:** 2026-05-26
**Sprint:** 854
**Type:** Architecture — typed player profile context in DonnaSessionContext
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED

---

## Problem

**Source:** Sprint 853 architecture audit — "Route-aware DONNA chips cannot show real priority data without per-player context injection"

Sprint 852 made player-profile DONNA chips route-aware, but chip labels were static ("View player notes", "Show priorities") because `DonnaAssistantButton` had no access to active priority data. The data lived in the player profile server component and was never forwarded to the DONNA panel.

Sprint 853 designed the architecture. Sprint 854 implements it.

---

## Architecture (Sprint 853 → 854)

**Option D — new typed `playerProfileContext` field on `DonnaSessionState`.**

A thin client component (`PlayerProfileDonnaRegistrar`) is rendered inside the player profile server component. On mount it calls `updatePlayerProfileContext(ctx)` to register priority data into `DonnaSessionContext`. On unmount it clears to `null`, preventing stale data after navigation away.

Key constraint honored: `updateObjectContext` has a falsy guard (`summary ? ... : prev.lastSummary`) that blocks null clearing. A new dedicated method `updatePlayerProfileContext(ctx | null)` has no falsy guard.

---

## Files Created

### `src/app/director/players/[playerId]/_components/PlayerProfileDonnaRegistrar.tsx`

New thin client component. Renders `null` — no visual output.

- Calls `updatePlayerProfileContext(ctx)` on mount and on prop updates
- Clears `updatePlayerProfileContext(null)` on unmount (navigation away)
- Props: `activePriorityCount`, `topPriorityTitle`, `topPriorityLevel`
- No DB reads — data passed from server component via props
- Director-only surface

### `docs/PLAYER_PRIORITY_CONTEXT_INJECTION_854.md`

This file.

---

## Files Modified

### `src/lib/donna/donnaSessionContext.ts`

1. Added `DonnaPlayerProfileContext` interface:
   ```ts
   export interface DonnaPlayerProfileContext {
     activePriorityCount: number
     topPriorityTitle: string | null
     topPriorityLevel: string | null
   }
   ```
2. Added `playerProfileContext: DonnaPlayerProfileContext | null` to `DonnaSessionState`
3. Added `updatePlayerProfileContext: (ctx: DonnaPlayerProfileContext | null) => void` to `DonnaSessionContextValue`
4. Added `playerProfileContext: null` to `DEFAULT_DONNA_SESSION`
5. Added `updatePlayerProfileContext: () => {}` noop to `DonnaSessionContext` default value

### `src/components/donna/DonnaSessionContextProvider.tsx`

1. Added `type DonnaPlayerProfileContext` to import
2. Added `updatePlayerProfileContext` callback (no falsy guard):
   ```ts
   const updatePlayerProfileContext = useCallback((ctx: DonnaPlayerProfileContext | null) => {
     setSession(prev => ({ ...prev, playerProfileContext: ctx }))
   }, [])
   ```
3. Added `updatePlayerProfileContext` to provider value

### `src/app/director/players/[playerId]/page.tsx`

1. Added import: `import { PlayerProfileDonnaRegistrar } from './_components/PlayerProfileDonnaRegistrar'`
2. Rendered `<PlayerProfileDonnaRegistrar>` at the top of the return block (before `PlayerProfileHeader`), using existing `activePriorities` data:
   ```tsx
   <PlayerProfileDonnaRegistrar
     activePriorityCount={activePriorities.length}
     topPriorityTitle={activePriorities[0]?.title ?? null}
     topPriorityLevel={activePriorities[0]?.priority_level ?? null}
   />
   ```
   No new DB queries. Data comes from the existing `activePriorities` query.

### `src/components/assistant/DonnaAssistantButton.tsx`

1. Updated `useDonnaSessionContext()` destructure to include `session` (aliased as `donnaSession` to avoid shadowing local `session` variable at line ~1073):
   ```ts
   const { session: donnaSession, panelOpen, openDonnaPanel, closeDonnaPanel, updatePrompt } = useDonnaSessionContext()
   ```
2. Updated player-profile chip block to use `donnaSession.playerProfileContext`:
   - Chip 1: `View: <topPriorityTitle> (<topPriorityLevel>)` if priority title available, else `View player notes`
   - Chip 2: `Show priorities (<count>)` if count > 0, else `Show priorities`
   - Chip 3: `Open player updates` — unchanged
   - Graceful fallback when `playerProfileContext` is `null` (e.g. panel opens before registrar mounts)

---

## Chip Behavior Matrix (post-Sprint 854)

| Route | `playerProfileContext` | Chip 1 | Chip 2 | Chip 3 |
|---|---|---|---|---|
| `/director/players/<uuid>` | `{ topPriorityTitle: "Technical Skill", topPriorityLevel: "high", activePriorityCount: 2 }` | "View: Technical Skill (high)" | "Show priorities (2)" | "Open player updates" |
| `/director/players/<uuid>` | `{ topPriorityTitle: null, activePriorityCount: 0 }` | "View player notes" | "Show priorities" | "Open player updates" |
| `/director/players/<uuid>` | `null` (registrar not yet mounted) | "View player notes" | "Show priorities" | "Open player updates" |
| Any other director route | — | "What do I need to do today?" | "What needs my attention?" | "What can you help me do here?" |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ pure context registration + chip display |
| No player data changed | ✅ |
| No player level movement | ✅ |
| No parent/player visibility | ✅ director-only surface (DonnaSessionContext in director layout) |
| No schema changes | ✅ no migrations |
| No RLS weakening | ✅ |
| No routing behavior changed | ✅ chip actions unchanged (router.push) |
| No player data queried from DONNA panel | ✅ data passed as props from server component |
| No fake/invented priority data in chips | ✅ chips show real data or fall back to generic labels |
| No auto-approval | ✅ |
| No review queue bypass | ✅ |
| No localStorage writes for priority data | ✅ in-memory React context only |
| Generic director chips preserved for all non-player-profile routes | ✅ |
| `updateObjectContext` unchanged | ✅ falsy guard untouched |
| `DonnaSessionContextProvider` existing callbacks unchanged | ✅ only new callback added |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `director/layout.tsx` | Not required — `DonnaSessionContextProvider` already wraps the director tree |
| `updateObjectContext` | Falsy guard preserved — Sprint 854 adds separate method |
| `DonnaVoiceReadyShell.tsx` | Only on `/director/donna` — out of scope |
| `donnaSuggestedQuestions.ts` | Out of scope |
| Schema, SQL, RLS, migrations, seed, env | None touched |
| `PlayerActivePriorities.tsx` | Not touched |
| `DonnaHighlightBanner` | Not relevant — highlight limitation (query-string tab switches) unchanged |

---

## Known Limitations (post-854)

| Limitation | Impact | Resolution path |
|---|---|---|
| `playerProfileContext` null on first panel open before registrar mounts | Chips fall back to generic labels briefly | Acceptable — context updates on next render cycle; not a common UX path |
| Focus highlight does not fire on query-string-only tab change | `player-notes-tab` teal glow (Sprint 849) not activated on chip tap | Move tabs to path-segment routing |
| "View: <title>" and "Show priorities" both navigate to `?tab=notes` | One tab destination, two chip intents | Differentiate when tab-switch + scroll can be coordinated |
| Direct deep-link (`/director/review/<proposed_action_id>`) not available | No `proposed_action_id` on `player_priorities` | Schema change required (migration) |

---

## Score Impact (estimated)

Dimension 8 — DONNA Integration Quality: **9.5/10 → 9.7/10**

Chips now surface real player priority data (title, level, count) when available. The DONNA panel on a player profile is genuinely context-aware for the first time.

Dimension 3 — Director-to-Player Navigation: **9.5/10 → 9.5/10** (unchanged — no new navigation capability added)
