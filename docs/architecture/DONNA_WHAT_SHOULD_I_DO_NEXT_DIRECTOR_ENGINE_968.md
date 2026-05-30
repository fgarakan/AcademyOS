# DONNA "What Should I Do Next?" Director Engine — Sprint 968

**Date:** 2026-05-30
**Sprint:** 968
**Status:** Implemented — TypeScript clean

---

## Summary

Sprint 968 wires the DONNA Director Next Action Engine into the main floating DONNA panel (`DonnaAssistantButton`). When a director asks "What should I do next?" or taps the matching chip, DONNA returns one clear next-action recommendation, explains why it matters, identifies a UI target to highlight, and states the safety/approval implications. No LLM orchestration. No new API. No new DONNA surface. No migrations.

---

## Before Sprint 968

- "What should I do next?" in `DonnaAssistantButton.detectAndHandleCommand` returned `ctx.nextAction` — a static page-guidance string from `donnaPageContextRegistry`.
- If `contextSummary` was already loaded, it showed the `guide` mode with suggestions from the predictive suggestions engine.
- No live signal (pending review count) was used.
- No highlight target was set.
- The existing `buildWhatNextAnswer` (Sprint 941, `donnaWhatNextEngine.ts`) was wired only in `DonnaVoiceReadyShell.tsx`, not in the floating panel.
- The `/director` dashboard chip set had no "What should I do next?" chip.

---

## New Behavior After Sprint 968

When the director types or says "What should I do next?" (or any phrase in the `matchesWhatNextIntent` family), or taps the "What should I do next?" chip on the director dashboard:

1. `buildDirectorNextAction({ pendingReviews, pathname })` is called from `detectAndHandleCommand`.
2. The engine returns a `DirectorNextAction` with a one-recommendation summary, safety level, and optional highlight target.
3. The summary is shown in the panel via `setCommandResponse`.
4. If `action.targetFocusId` is present: `setDonnaFocusTarget` writes to sessionStorage and `donna:highlight` is dispatched — `DonnaHighlightBanner` applies the teal glow to the matching element.
5. If `action.targetFocusId` is absent (element not on current page): response is shown without a highlight — no crash, no error.
6. `setActiveMode('guide')` is called so the panel stays in guide orientation.

---

## DirectorNextAction Output Shape

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Stable identifier for this recommendation type |
| `title` | `string` | Short headline shown in the panel (e.g. "Review Queue") |
| `summary` | `string` | Full DONNA response — calm COO style, one clear recommendation |
| `why` | `string` | Why this action matters right now |
| `targetRoute` | `string` | Route to navigate to (caller decides whether to navigate) |
| `targetFocusId` | `string \| undefined` | `data-donna-focus-id` of the element to highlight |
| `safetyLevel` | `'safe' \| 'review_only' \| 'approval_gated'` | Safety classification |
| `requiresApproval` | `boolean` | Whether any action here requires explicit director approval |
| `nextStepLabel` | `string` | Short click-target label (e.g. "Open Review Queue") |
| `priority` | `number` | Priority rank — 1 is highest urgency |

---

## Signal Priority Rules (V1)

| Priority | Condition | Recommendation | Target Route | Focus ID |
|---|---|---|---|---|
| 1 | `pendingReviews > 0` + on `/director` | Open Review Queue | `/director/review` | `review-queue-card` |
| 1 | `pendingReviews > 0` + on `/director/review` | Open Review Queue | `/director/review` | `attendance-exceptions-section` |
| 1 | `pendingReviews > 0` + other page | Open Review Queue | `/director/review` | _(none — cross-page)_ |
| 2 | On `/director/curriculum` | Review Curriculum Status | `/director/curriculum` | `curriculum-status` |
| 3 | On `/director/class-templates/[id]` | Complete Template Setup | current page | `class-template-primary-action` |
| 4 | On `/director/class-templates` | Review Templates | `/director/class-templates` | `template-list` |
| 5 | On `/director/sessions` | Review Sessions | `/director/sessions` | `session-list` |
| 6 | On `/director/players` | Review Player List | `/director/players` | `player-list` |
| 7 | On `/director/review` + `pendingReviews === 0` | Queue clear, check dashboard | `/director` | _(none)_ |
| 8 | Fallback (on `/director`) | View Academy Dashboard | `/director` | `academy-metrics-section` |
| 8 | Fallback (other page) | View Academy Dashboard | `/director` | _(none)_ |

---

## Route / Target Mapping

| Route | Focus ID available | Element |
|---|---|---|
| `/director` | `review-queue-card` | Review queue card in today's pulse grid |
| `/director` | `academy-metrics-section` | Academy KPI metrics section |
| `/director/review` | `attendance-exceptions-section` | Attendance exceptions section |
| `/director/curriculum` | `curriculum-status` | Curriculum status hero card |
| `/director/class-templates/[id]` | `class-template-primary-action` | Primary action in template stepper |
| `/director/class-templates` | `template-list` | Template list container |
| `/director/sessions` | `session-list` | Session list container |
| `/director/players` | `player-list` | Player list container |

---

## Highlight Behavior

- `setDonnaFocusTarget` writes to sessionStorage with `highlightStyle: 'teal-glow'` and 8-second expiry.
- `window.dispatchEvent(new CustomEvent('donna:highlight'))` triggers `DonnaHighlightBanner` on the same page.
- If the element is not present on the current page, the highlight dispatches but `DonnaHighlightBanner` finds no matching element — silently no-ops. No crash.
- Same `setDonnaFocusTarget` + `donna:highlight` pattern used by `DonnaPanelPageChips` (Sprint 964) — no new highlight system.

---

## Fallback Behavior

When no live signal is available and no page-specific rule matches:
- Returns the "Academy Dashboard" fallback with `id: 'dashboard_review'`.
- On `/director` page: sets `targetFocusId: 'academy-metrics-section'`.
- On other pages: `targetFocusId` is undefined — response shown without highlight.
- Always returns a valid `DirectorNextAction` — never throws.

---

## Safety Levels

| Level | Meaning |
|---|---|
| `safe` | Read-only viewing — no mutation possible from this page |
| `review_only` | Can look and navigate; any edit goes through a draft before taking effect |
| `approval_gated` | Requires explicit director approve/reject before anything changes |

DONNA always states the safety level in the `summary` text. No action is taken automatically. No data is mutated. No communication is sent.

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/donna/directorNextActionEngine.ts` | Created — deterministic next-action engine V1 |
| `src/lib/donna/donnaPageChipRegistry.ts` | Modified — "What should I do next?" prompt chip added to `/director` set |
| `src/components/assistant/DonnaAssistantButton.tsx` | Modified — import + upgraded `detectAndHandleCommand` block |

---

## No-Migration Guarantee

- No new database tables.
- No schema changes.
- No RLS changes.
- No new API routes.
- No new DONNA surfaces (no new panel, no new button).
- No new voice paths (existing `speakDonna` / `speakWithServerTts` path unchanged).
- Primary live signal (`reviewQueuePendingCount`) was already loaded in panel state from Sprint 373.
- All other signals are route/context-driven — no additional DB queries.

---

## V1 Limitations

- **Single live signal:** Only `reviewQueuePendingCount` is used as a live DB-backed signal. Other signals (missing recaps, placement count, advancement count) require parsing the `DailyBrief` sections or a dedicated next-action API.
- **No navigation side effects:** The engine returns `targetRoute` but never navigates automatically. The director must click a link.
- **No cross-page highlight:** When `pendingReviews > 0` and the director is not on `/director` or `/director/review`, no `targetFocusId` is returned. The recommendation is shown with text only.

---

## V2 Improvements (Sprint 969+)

1. **Expand highlight coverage:** Add `data-donna-focus-id` targets to every recommended element on every director page so cross-page highlights work on arrival.
2. **Wire `missingRecapCount`:** Parse from `/api/donna/brief` response or add to panel state — enables "missing coach wrap-ups" as Priority 2 live signal.
3. **Wire `placementCount`, `advancementCount`:** Same — enables player placement and advancement as live signals.
4. **DB-backed next-action API:** `/api/donna/next-action` — returns full signal set directly as `DirectorNextActionInput`, eliminating client-side parsing.
5. **COO-style response markup:** Render `summary`, `why`, `nextStepLabel`, and `safetyLevel` as a structured card (not just text) using an existing DONNA card component.
