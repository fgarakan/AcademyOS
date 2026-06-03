# DONNA Operator Certification V1

**Sprint:** Mega Sprint 1641–1660
**Date:** 2026-06-03
**Scope:** All 13 operator action types in `src/lib/donna/operator/actionDispatcher.ts`
**Method:** Direct code inspection + logic trace for each action

---

## Ground Rules

- **PASS** = action is implemented, produces a valid `OperatorActionResult`, and handles missing inputs gracefully
- **PARTIAL** = action is implemented but has a known limitation (documented)
- **FAIL** = action is not implemented or produces a broken result
- All actions are pure TypeScript — no DB calls, no side effects
- Failure handling is tested by tracing the `fail()` branch for each action

---

## 1. `highlight_element`

| Check | Result |
|---|---|
| Missing `targetId` returns fail | **PASS** — `if (!input.targetId) return fail(...)` |
| Returns `focusTarget` with `highlightStyle: 'teal-glow'` | **PASS** |
| Returns `success: true` with message | **PASS** |
| Message is human-readable | **PASS** — `"Highlighting: ${label}"` or generic fallback |

**Status: PASS**

---

## 2. `scroll_to_element`

| Check | Result |
|---|---|
| Missing `targetId` returns fail | **PASS** |
| Returns `focusTarget` with route + targetId | **PASS** |
| Does not require `highlightStyle` | **PASS** — scroll only, no glow |
| Returns meaningful message | **PASS** — `"Scrolling to: ${label}"` |

**Status: PASS**

---

## 3. `navigate`

| Check | Result |
|---|---|
| Missing `route` returns fail | **PASS** — `if (!input.route) return fail(...)` |
| Returns `route` in result | **PASS** |
| Optional `targetId` builds focus target when provided | **PASS** |
| Returns `success: true` with human-readable message | **PASS** |

**Status: PASS**

---

## 4. `open_player`

| Check | Result |
|---|---|
| Missing `playerId` returns fail | **PASS** |
| Route is `/director/players/${playerId}` | **PASS** |
| Focus target points to `player-profile-header` | **PASS** |
| Returns `success: true` | **PASS** |

**Known limitation:** `playerId` must be a UUID. No player name → UUID resolution. Director must supply a known player ID. This is documented in DONNA_OPERATOR_CAPABILITY_AUDIT_V1.md Gap #10.

**Status: PASS (with known limitation)**

---

## 5. `open_assessment`

| Check | Result |
|---|---|
| With `playerId`: routes to `/director/players/${playerId}` | **PASS** |
| Without `playerId`: routes to `/director/players` | **PASS** |
| Focus target is `player-assessments-section` | **PASS** |
| Does not fail when playerId is absent | **PASS** — graceful fallback |

**Status: PASS**

---

## 6. `open_review`

| Check | Result |
|---|---|
| Routes to `/director/review` | **PASS** |
| Focus target is `review-queue-primary` | **PASS** |
| Returns `nextAction` to guide director | **PASS** — "Review pending items and approve or reject." |
| No approval required for opening | **PASS** — `requiresApproval: false` |

**Status: PASS**

---

## 7. `apply_filter`

| Check | Result |
|---|---|
| `text: "show reassessment"` → route with `?filter=reassessment` | **PASS** |
| `text: "level readiness"` → route with `?filter=players` | **PASS** |
| `text: "show placements"` → route with `?filter=placements` | **PASS** |
| `text: "parent updates"` → route with `?filter=parent-updates` | **PASS** |
| `text: "coach wrap-up"` → route with `?filter=coach` | **PASS** |
| Generic `filter` param without intent match | **PASS** — `ok()` with `filterParams` |
| No text and no filter → fail | **PASS** — `"Could not determine which filter to apply."` |

**Status: PASS**

---

## 8. `apply_search`

| Check | Result |
|---|---|
| Returns `filterParams: { q: text }` | **PASS** |
| Empty text: returns `q: ""` (not fail) | **PASS** — search with empty string is valid |
| Returns human-readable message | **PASS** — `"Searching for: ${text}"` |

**Status: PASS**

---

## 9. `open_tab`

| Check | Result |
|---|---|
| Missing `tabName` returns fail | **PASS** |
| Returns `filterParams: { tab: tabName }` | **PASS** |
| Optional `targetId` builds focus target when provided | **PASS** |
| Returns `success: true` | **PASS** |

**Known limitation:** `filterParams: { tab }` is the signal — but no page component currently listens for this signal from `OperatorActionResult`. Tab state is local React state on each page. This action produces the correct result from the dispatcher's perspective; wiring it to actual tab components is a separate sprint. Documented as Gap #3 in prior audit.

**Status: PASS (dispatcher) / PARTIAL (UI wire)**

---

## 10. `open_drawer`

| Check | Result |
|---|---|
| Returns `filterParams: { drawer: targetId }` | **PASS** |
| `label` used in message fallback | **PASS** |
| Does not fail when `targetId` is absent | **PASS** — defaults to empty string |

**Known limitation:** `filterParams: { drawer }` is the signal. No drawer component currently observes it. Signal is produced correctly. Documented as Gap #18 in prior audit.

**Status: PASS (dispatcher) / PARTIAL (UI wire)**

---

## 11. `open_modal`

| Check | Result |
|---|---|
| Returns `filterParams: { modal: targetId }` | **PASS** |
| Returns human-readable message | **PASS** |
| Does not fail when `targetId` is absent | **PASS** |

**Known limitation:** Same as `open_drawer` — no modal component currently observes the signal.

**Status: PASS (dispatcher) / PARTIAL (UI wire)**

---

## 12. `prepare_draft`

| Check | Result |
|---|---|
| Returns `requiresApproval: true` | **PASS** |
| Returns `nextAction` reminding director approval is required | **PASS** |
| Returns human-readable message | **PASS** — explicitly says "You will need to approve this before anything is applied." |
| Does not create any draft (UI must call server action separately) | **PASS** — dispatcher is pure TS, no mutations |

**Status: PASS**

---

## 13. `request_approval`

| Check | Result |
|---|---|
| Returns `route: '/director/review'` | **PASS** |
| Returns `requiresApproval: true` | **PASS** |
| Message explicitly states "Nothing is applied until you approve" | **PASS** |
| Returns `nextAction` guiding director to review | **PASS** |

**Status: PASS**

---

## Multi-Step Workflow Helpers

| Helper | Status |
|---|---|
| `buildNavigateAndHighlightResult(step)` | **PASS** — wraps `ok('navigate', ...)` with focus target |
| `buildAttentionQueueStep(text)` | **PASS** — maps intent patterns → route + focusId |
| `buildOpenPlayerStep(playerId, focusId?)` | **PASS** — optional focusId defaults to `player-profile-header` |
| `buildReadinessWorkflowSteps(playerId)` | **PASS** — returns 2 steps: readiness card + assessments section |
| `buildPrioritiesWorkflowStep(playerId)` | **PASS** — targets `player-priorities-card` |
| `buildCurriculumImproveStep(levelKey, levelLabel)` | **PASS** — routes to `/director/curriculum?improve=${levelKey}`, focus `donna-curriculum-context` |

---

## Summary

| Action | Dispatcher Status | UI Wire Status |
|---|---|---|
| `highlight_element` | PASS | PASS — `DonnaHighlightBanner` |
| `scroll_to_element` | PASS | PASS — `scrollIntoView` in banner |
| `navigate` | PASS | PASS — `router.push()` in shell |
| `open_player` | PASS | PASS — shell navigates |
| `open_assessment` | PASS | PASS — shell navigates |
| `open_review` | PASS | PASS — shell navigates |
| `apply_filter` | PASS | PASS — URL param on attention page |
| `apply_search` | PASS | PARTIAL — filterParams produced, page must read |
| `open_tab` | PASS | PARTIAL — signal produced, no page listener yet |
| `open_drawer` | PASS | PARTIAL — signal produced, no drawer listener yet |
| `open_modal` | PASS | PARTIAL — signal produced, no modal listener yet |
| `prepare_draft` | PASS | PASS — server action handles creation |
| `request_approval` | PASS | PASS — routes to review queue |

**Overall Operator Dispatcher: CERTIFIED**

All 13 actions are implemented, fail gracefully with clear messages, and produce structured results. UI wire gaps for `open_tab`, `open_drawer`, and `open_modal` are noted as known gaps — the dispatcher itself is sound.
