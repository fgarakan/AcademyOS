# Site-Wide DONNA UI Operator V1 — QA Checklist

**Sprint:** Mega Sprint 1551–1640
**Date:** 2026-06-03

---

## Coverage Matrix

| Page | Focus Targets | DONNA Navigation | DONNA Highlight | DONNA Filter | Operator Ready |
|---|---|---|---|---|---|
| Dashboard `/director` | 3 | ✓ | ✓ | — | Partial |
| Attention Queue `/director/attention` | 3 (NEW) | ✓ (NEW) | ✓ | ✓ (URL param) | Functional |
| Players `/director/players` | 5 | ✓ | ✓ | Partial | Partial |
| Player Profile `/director/players/[id]` | 6 | ✓ | ✓ | — | Partial |
| Assessments Tab | 1 (NEW) | — | ✓ (NEW) | — | Partial |
| Curriculum `/director/curriculum` | 5 | ✓ | ✓ | — | Functional |
| Review Center `/director/review` | 2 | ✓ | ✓ | — | Partial |
| Sessions `/director/sessions` | 2 | ✓ | Partial | — | Partial |
| Parent Updates | 0 | Partial | — | — | Not Ready |
| Settings | 0 | Partial | — | — | Not Ready |

---

## 1 — Page Context Registry

| # | Check | Pass/Fail |
|---|---|---|
| 1 | `pageContextRegistry.ts` exists at `src/lib/donna/pageContextRegistry.ts` | |
| 2 | `getPageContext('attention_queue')` returns entry with focus targets | |
| 3 | `getPageContext('curriculum')` includes `'donna-curriculum-context'` focus target | |
| 4 | `getFocusTargetsForPage` returns focus targets for a given page ID | |
| 5 | `getPageContextByRoute('/director/attention')` matches attention_queue entry | |
| 6 | All 11 pages have `suggestedPrompts` defined | |

---

## 2 — Focus Target System

| # | Check | Pass/Fail |
|---|---|---|
| 7 | Attention Queue filter bar has `data-donna-focus-id="attention-filter-bar"` | |
| 8 | Attention Queue item list has `data-donna-focus-id="attention-items-list"` | |
| 9 | Each attention item row has `data-donna-focus-id="attention-item-{item.id}"` | |
| 10 | Level Readiness Card has `data-donna-focus-id="player-readiness-card"` | |
| 11 | Development Priorities Card has `data-donna-focus-id="player-priorities-card"` | |
| 12 | Assessments section wrapper has `data-donna-focus-id="player-assessments-section"` | |
| 13 | Curriculum DONNA panel has `data-donna-focus-id="donna-curriculum-context"` | |
| 14 | `DonnaHighlightBanner` successfully highlights `attention-items-list` when teal-glow triggered | |

---

## 3 — Operator Action Dispatcher

| # | Check | Pass/Fail |
|---|---|---|
| 15 | `dispatch({ action: 'navigate', route: '/director/attention' })` returns success | |
| 16 | `dispatch({ action: 'apply_filter', text: 'show reassessment' })` returns route with `?filter=reassessment` | |
| 17 | `dispatch({ action: 'apply_filter', text: 'level readiness' })` returns route with `?filter=players` | |
| 18 | `dispatch({ action: 'open_player', playerId: 'xxx' })` returns player profile route | |
| 19 | `dispatch({ action: 'highlight_element', targetId: 'player-readiness-card' })` returns focusTarget | |
| 20 | `buildReadinessWorkflowSteps(playerId)` returns 2 steps targeting readiness + assessments | |
| 21 | `buildPrioritiesWorkflowStep(playerId)` targets `player-priorities-card` | |
| 22 | `buildCurriculumImproveStep('orange_ball_2', 'Orange Ball 2')` returns route with `?improve=orange_ball_2` | |

---

## 4 — Navigation Engine

| # | Check | Pass/Fail |
|---|---|---|
| 23 | "Who needs attention?" → navigates to `/director/attention` | |
| 24 | "Show me reassessment" → navigates to `/director/attention?filter=reassessment` | |
| 25 | "Show me level readiness" → navigates to `/director/attention?filter=players` | |
| 26 | "Show me placement reviews" → navigates to `/director/attention?filter=placements` | |
| 27 | "Show me parent updates" → navigates to `/director/attention?filter=parent-updates` | |
| 28 | Attention Queue loads with correct filter when `?filter=reassessment` in URL | |

---

## 5 — Level Readiness Draft Action

| # | Check | Pass/Fail |
|---|---|---|
| 29 | `donnaLevelReadinessDraftAction` creates `proposed_action` with `target_module = 'level_readiness_review'` | |
| 30 | Draft is academy-scoped and player-scoped | |
| 31 | Only `academy_director` or `head_coach` role can create the draft | |
| 32 | Audit log entry written on draft creation | |
| 33 | Player not found in academy returns error | |
| 34 | Draft is `status: 'pending_review'` — not auto-applied | |

---

## TypeScript

| # | Check | Pass/Fail |
|---|---|---|
| 35 | `npx tsc --noEmit` passes with zero errors | |
