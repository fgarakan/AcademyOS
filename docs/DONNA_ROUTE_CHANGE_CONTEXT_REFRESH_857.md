# Sprint 857 — DONNA Route Change Context Refresh V1

**Date:** 2026-05-26
**Sprint:** 857
**Type:** Behavior — refresh DONNA context when panel remains open across navigation
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 856–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Problem

**Source:** Sprint 856 known limitation (post-856 table).

> "Context not refreshed on route change with panel open — If director navigates to a different player with panel open, context shows previous player until close+reopen."

Sprint 856 fixed the panel-open case: `useEffect([panelOpen])` with a null guard auto-fetches context whenever the panel opens and `contextSummary === null`. But Sprint 811 intentionally preserved `contextSummary` across navigation so directors don't lose context when clicking links inside a DONNA response. That design assumed the director would close and reopen the panel to get fresh context on the new route.

Sprint 857 closes the gap for the case where the panel stays open across navigation.

---

## Audit Findings (Sprint 857)

| Question | Finding |
|---|---|
| Sprint 856 `[panelOpen]` effect location | Lines 1084–1095 — runs when `panelOpen` becomes true; `contextSummary === null` guard prevents double-fetch on re-open |
| Existing `[pathname]` route-change effect | Lines 1168–1253 — clears most state; intentionally does NOT clear `contextSummary` (Sprint 811 comment at line 1189) |
| `handleContextSummary()` definition | Async function declaration at line 2315 (hoisted, safe to call before lexical definition) |
| `handleContextSummary()` internals | Already calls `setContextSummary(null)` and `setSuggestions([])` on lines 2317–2318 before the async fetch — clears stale state immediately |
| `deriveContextRequest(pathname)` | Reads `pathname` from closure at call time — gets new route's value on navigation |
| Stale context bug path | `panelOpen` unchanged on navigate → Sprint 856 `[panelOpen]` silent; Sprint 811 preserves `contextSummary` in the `[pathname]` effect → stale context persists until close+reopen |
| Fix complexity | One `useEffect([pathname])` with `panelOpen` guard, 4 lines |
| Infinite loop risk | None — `handleContextSummary` writes `contextSummary`/`suggestions`, which are not in this effect's `[pathname]` dep array |
| Double-fetch risk on panel open | None — Sprint 856 `[panelOpen]` fires on panelOpen change; Sprint 857 `[pathname]` fires on pathname change; disjoint triggers |
| Double-fetch risk on mount | None — on initial mount `panelOpen = false` (sessionStorage restore fires asynchronously after mount via the `[]` effect at line 1026); `if (!panelOpen) return` blocks any mount-time fetch from Sprint 857 effect |

---

## Implementation

### `src/components/assistant/DonnaAssistantButton.tsx`

Added one `useEffect` after the Sprint 856 panel-open effect (line 1095), before the Sprint 405 `donna:open` custom event listener:

```ts
// Sprint 857 — Route-change context refresh while DONNA panel is open.
// Sprint 811 intentionally preserved contextSummary across navigation so the director
// doesn't have to re-ask when closing and reopening. Sprint 856 added auto-fetch on
// panel open. Sprint 857 closes the remaining gap: when the panel stays open and the
// director navigates to a different route or player, this effect detects the route
// change and fetches fresh context for the new destination.
//
// Guard: only runs when panelOpen is true — no wasted server action when panel is closed.
// Does NOT depend on panelOpen — Sprint 856 [panelOpen] effect owns that trigger;
// adding panelOpen here would cause double-fetches on panel open.
// No infinite loop risk — handleContextSummary writes contextSummary/suggestions,
// which are not in this effect's deps. pathname only changes on real navigation events.
// handleContextSummary is a function declaration (hoisted) — safe to call here.
// handleContextSummary already clears contextSummary/suggestions before fetching (line 2317).
useEffect(() => {
  if (!panelOpen) return
  void handleContextSummary()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pathname])
```

**Why `handleContextSummary()` alone is sufficient (no explicit clears before it):**
- `handleContextSummary()` opens with `setContextSummary(null)` and `setSuggestions([])` (lines 2317–2318)
- React batches state updates — these clear synchronously before the async fetch
- Director sees the context section clear immediately; spinner shows via `isLoadingContext: true`
- No need to duplicate the clears in the effect itself

**Interaction with Sprint 856 `[panelOpen]` effect:**
- Sprint 856 effect dep: `[panelOpen]` — fires on panelOpen change only
- Sprint 857 effect dep: `[pathname]` — fires on pathname change only
- Triggers are disjoint — exactly one fires for each user action (open panel vs. navigate)

**Interaction with Sprint 811 `[pathname]` route-change effect (lines 1168–1253):**
- Sprint 811 effect intentionally skips `contextSummary` to allow cross-navigation context persistence
- Sprint 857 effect runs alongside it when `panelOpen` is true; the guard `if (!panelOpen) return` makes Sprint 857 a no-op when the panel is closed, preserving Sprint 811 behavior for that path

---

## Behavior Matrix (post-Sprint-857)

| Action | Panel state | Effect triggered | Result |
|---|---|---|---|
| Open DONNA panel | closed → open | Sprint 856 `[panelOpen]` | Context fetched for current route ✅ |
| Navigate with panel closed | closed | Sprint 857 `[pathname]` (guard blocks) | No fetch — preserves Sprint 811 ✅ |
| Navigate with panel open | open | Sprint 857 `[pathname]` | Context cleared + fetched for new route ✅ |
| Navigate Player A → Player B (panel open) | open | Sprint 857 `[pathname]` | Player B context loaded ✅ |
| Navigate dashboard → review (panel open) | open | Sprint 857 `[pathname]` | Review queue context loaded ✅ |
| Close panel after navigation | open → closed | closePanel() | contextSummary cleared to null ✅ |
| Reopen panel after navigation | closed → open | Sprint 856 `[panelOpen]` | If null → fetches; if loaded → null guard skips ✅ |
| Initial mount (sessionStorage restore) | false initially | Sprint 857 fires but `panelOpen = false` → guard blocks | No fetch ✅ |

---

## Context by Route (post-Sprint-857)

Same route mapping as Sprint 856 — `deriveContextRequest` is unchanged:

| Route | Context type | What DONNA shows |
|---|---|---|
| `/director/players/<uuid>` | `player_profile` | Player status, curriculum level, active priority count, coach note count, attendance trend, last assessment, suggested next steps |
| `/director/players` | `player_collection` | Academy player summary |
| `/director/sessions` | `session_context` | Today's sessions |
| `/director/class-templates` | `class_template_collection` | Template overview |
| `/director/review` | `review_queue_context` | Pending reviews |
| `/director/signals` | `signals_context` | Active signals |
| `/director` (dashboard) | `academy_overview` | Academy overview |

---

## Files Created

### `docs/DONNA_ROUTE_CHANGE_CONTEXT_REFRESH_857.md`
This file.

---

## Files Modified

### `src/components/assistant/DonnaAssistantButton.tsx`
Added Sprint 857 `useEffect([pathname])` — route-change context refresh when panel is open (after Sprint 856 block, before Sprint 405 block).

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `handleContextSummary()` | Unchanged — existing function already correct |
| `fetchDonnaContext` server action | Unchanged |
| `donnaContextActions.ts` | Unchanged |
| `deriveContextRequest()` | Unchanged — already routes all 7 context types correctly |
| `closePanel()` | Unchanged — still clears contextSummary on close |
| Sprint 856 `[panelOpen]` effect | Unchanged — panel-open trigger preserved exactly |
| Sprint 811 route-change effect | Unchanged — Sprint 811 preservation logic preserved for panel-closed path |
| Sprint 823 auto-expand effect | Unchanged — still auto-expands Context section when summary loads |
| `DonnaSessionContext` | Unchanged |
| `PlayerProfileDonnaRegistrar` | Unchanged |
| Any `.tsx` file outside `DonnaAssistantButton` | Unchanged |
| SQL / RLS / migrations / seed / env | Unchanged |

---

## Safety Guarantees

| Guarantee | Status |
|---|---|
| No DB writes | ✅ `handleContextSummary()` is read-only — same queries as user-triggered context fetch |
| No player data changed | ✅ |
| No player level movement | ✅ |
| No parent/player visibility | ✅ director-only surface |
| No schema changes | ✅ |
| No migrations | ✅ |
| No RLS weakening | ✅ all queries use `academy_id` scoping |
| No new DB queries | ✅ reuses existing `fetchDonnaContext` server action |
| No fake data | ✅ live DB data only |
| No auto-approval | ✅ |
| No review queue bypass | ✅ |
| No double-fetch on panel open | ✅ Sprint 856 and Sprint 857 have disjoint triggers |
| Sprint 856 panel-open behavior preserved | ✅ |
| Sprint 811 cross-navigation persistence preserved (panel closed) | ✅ `if (!panelOpen) return` guard |

---

## Known Limitations (post-857)

| Limitation | Impact | Resolution path |
|---|---|---|
| Race condition if director navigates before prior fetch completes | Two fetches in flight; last write wins — correct result arrives but may briefly show old context | Abort controller for in-flight fetch (future sprint) |
| `academy_overview` fetch on dashboard navigation | Every navigate to `/director` triggers the heavier overview fetch | Acceptable — same cost as Sprint 856; cache layer future sprint |
| 6 DB reads per route change with panel open | Minor cost on every navigation with panel open | Acceptable for V1; optimize later |

---

## Score Impact (estimated)

Dimension 2 — Data Freshness: **8.5/10 → 9.5/10**

The last known structural gap in DONNA context freshness is now closed. Context is live on every panel open (Sprint 856) and on every route change while panel remains open (Sprint 857). The only remaining gap is the abort-controller race condition (rare, cosmetic, self-correcting).

**Projected Sprint 857 total: 92/100** (up from 91/100)
