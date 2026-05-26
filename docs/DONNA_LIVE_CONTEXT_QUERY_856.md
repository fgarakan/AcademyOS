# Sprint 856 — DONNA Live Context Query V1

**Date:** 2026-05-26
**Sprint:** 856
**Type:** Behavior — auto-trigger context fetch on panel open
**Migration:** None
**TypeScript:** Clean (`npx tsc --noEmit` — exit 0, no errors)
**Status:** ✅ IMPLEMENTED
**Part of:** Mega Sprint 856–920 — DONNA 10/10 Conversational Intelligence + Memory Maturity Block V1

---

## Problem

**Source:** Sprint 855 certification — Dimension 2 (Data Freshness) held at 7/10.

> "DONNA context is never live-requeried on panel open. The director must explicitly type a context phrase ("what's the context here?") or click the Context button to get current awareness. Every other open shows stale or no context."

Sprint 854 injected typed player priority data into `DonnaSessionContext` via `PlayerProfileDonnaRegistrar`. That solved chip labels. But the DONNA panel context section (the `DonnaContextSummary` card showing key facts, suggested next steps, open questions) was still empty on panel open — never auto-populated.

---

## Audit Findings (Sprint 856)

| Question | Finding |
|---|---|
| Is `handleContextSummary()` auto-triggered on panel open? | **No.** Only on: explicit context/suggestion phrase typed, `fetch_context` COO action, or button click (line 4452 of DonnaAssistantButton) |
| Is `contextSummary` cleared on panel close? | **Yes** — `closePanel()` line 929: `setContextSummary(null)` |
| Is `contextSummary` cleared on route change? | **No** — Sprint 811 intentional: persists until close or explicit dismiss |
| Does `player_profile` context type exist? | **Yes** — `fetchPlayerProfile()` in `donnaContextActions.ts`: 6 live DB reads (player record, curriculum state, priorities, coach notes, attendance, assessments, pending review items) |
| Does `deriveContextRequest` route player profile correctly? | **Yes** — `pathname.startsWith('/director/players/') && depth === 4` → `{ contextType: 'player_profile', params: { playerId: lastSegment } }` |
| Fix complexity | **Minimal** — one `useEffect([panelOpen])` with null guard |

### panelOpen useEffect inventory (pre-Sprint-856)

| Line | Purpose | Calls handleContextSummary? |
|---|---|---|
| 1003–1010 | Escape closes panel | No |
| 1034–1041 | Sync panelOpen to sessionStorage | No |
| 1044–1055 | Idle timer lifecycle | No |
| 1057–1062 | Reset idle timer on input | No |
| 1069–1082 | Continuity message on re-open | No |

**Confirmed: `handleContextSummary()` was never triggered automatically on panel open.**

---

## Implementation

### `src/components/assistant/DonnaAssistantButton.tsx`

Added one `useEffect` after the continuity message block (line 1082), before the `donna:open` custom event listener:

```ts
// Sprint 856 — Auto-load live context on panel open.
// contextSummary is cleared on every panel close (closePanel line 929), so every fresh open
// starts with null and gets a live read-only refresh via the same fetchDonnaContext path
// the director would trigger manually. The null guard prevents a redundant fetch on the rare
// case where the panel was never closed (e.g. session-storage restore with in-flight state).
// handleContextSummary is a function declaration (hoisted) — safe to call here.
useEffect(() => {
  if (!panelOpen) return
  if (contextSummary !== null) return
  void handleContextSummary()
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [panelOpen])
```

**Why this works:**
1. Every panel close calls `closePanel()` → `setContextSummary(null)` (line 929)
2. Every fresh panel open therefore starts with `contextSummary === null`
3. The null guard prevents re-fetch when context is already loaded (same-session, panel never closed edge case)
4. `handleContextSummary` is a function declaration → hoisted → safe to reference lexically above its definition
5. Follows the same `// eslint-disable-next-line react-hooks/exhaustive-deps` pattern as all other `[panelOpen]` effects in the file

**Behavior on panel open:**
- `handleContextSummary()` fires
- Sets `isLoadingContext: true`
- Calls `fetchDonnaContext(req.contextType, req.params)` via server action
- Returns `DonnaContextSummary` with `title`, `summary`, `keyFacts`, `suggestedNextSteps`, `openQuestions`
- Sets `contextSummary` and `suggestions` (predictive suggestions)
- `contextSummary` auto-expands Context section (existing Sprint 823 effect: line 1145)
- Context section visible in panel without any director action

---

## Context by Route (post-Sprint-856)

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

### `docs/DONNA_LIVE_CONTEXT_QUERY_856.md`
This file.

---

## Files Modified

### `src/components/assistant/DonnaAssistantButton.tsx`
Added Sprint 856 `useEffect([panelOpen])` — auto-context fetch on open (null guard, read-only).

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
| Null guard prevents redundant fetches | ✅ |
| Existing `handleContextSummary()` behavior unchanged | ✅ only calling it automatically on open |
| Sprint 811 route-change persistence preserved | ✅ context still persists on route change |

---

## What Was NOT Changed

| Item | Reason |
|---|---|
| `handleContextSummary()` function itself | Unchanged — just calling it earlier |
| `fetchDonnaContext` server action | Unchanged |
| `donnaContextActions.ts` | Unchanged |
| `deriveContextRequest()` | Unchanged — already correct for all routes |
| `closePanel()` | Unchanged — still clears contextSummary on close |
| Sprint 811 route-change persistence | Unchanged — contextSummary still persists on navigation |
| Sprint 823 auto-expand effect | Unchanged — still auto-expands Context section when summary loads |
| `DonnaSessionContext` | Unchanged |
| `PlayerProfileDonnaRegistrar` | Unchanged — Sprint 854 chip context injection separate concern |
| Any `.tsx` file outside `DonnaAssistantButton` | Unchanged |

---

## Known Limitations (post-856)

| Limitation | Impact | Resolution path |
|---|---|---|
| Context not refreshed on route change with panel open | If director navigates to a different player with panel open, context shows previous player until close+reopen | Add route-change trigger (separate sprint) |
| 6 DB reads per panel open | Minor performance cost on every open | Acceptable — same cost as user-triggered fetch; no caching added |
| No loading indicator on auto-trigger | `isLoadingContext` is set but Sprint 856 doesn't add a "loading on open" visual hint | Existing UI shows spinner when `isLoadingContext` is true |
| `academy_overview` is a heavier fetch | Dashboard open triggers a wider query set than player profile | Acceptable within scope of /goal; can be optimized later |

---

## Score Impact (estimated)

Dimension 2 — Data Freshness: **7/10 → 8.5/10**

DONNA now has live context on every panel open — no explicit prompt required. The remaining gap (no route-change refresh with panel open) is a future sprint.

Dimension 8 — DONNA Integration Quality: **9.7/10 → 9.8/10**

Panel opens with populated context section, predictive suggestions auto-loaded, no "empty panel" state for director to navigate past.

**Projected Sprint 856 total: 91/100** (up from 89/100)
