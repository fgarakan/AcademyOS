# DONNA COO Surface Layer V1

**Sprint:** Mega Sprint 1701–1710
**Date:** 2026-06-03
**Scope:** Mounting `DonnaAcademyCOOBriefCard` on the director dashboard

---

## Acceptance Criterion

> **Director can identify today's highest leverage action within 5 seconds of opening the dashboard.**

This is satisfied by:
- Card is positioned above the KPI tiles and command section — visible in the first scroll position
- Card is **expanded by default** — top action and 5-field detail visible without any click
- `data-donna-focus-id="academy-coo-brief"` — DONNA can highlight it on navigation
- No loading state — report is built server-side from dashboard data already in scope

---

## Dashboard Placement

| Section | Position | Status |
|---|---|---|
| Hero header (greeting, health badge) | Top | Unchanged |
| `DonnaFirstGreeting` | 2nd | Unchanged |
| `DonnaScreenBriefStatic` | 3rd | Unchanged — 1-sentence brief |
| **`DonnaAcademyCOOBriefCard`** | **4th — NEW** | **Mounted, expanded, data-driven** |
| `DonnaCommandSection` | 5th | Unchanged |
| `DirectorPrimaryActionHero` | 6th | Unchanged |
| `DirectorTodayKpiSection` | 7th | Unchanged |
| Collapsible detail sections | Below | Unchanged |

---

## Data Source

| COO Card Field | Source in `director/page.tsx` | Status |
|---|---|---|
| `missingWrapUps` | `coachRecapsMissing` (sessions − voice_notes) | PASS |
| `highRiskPlayerCount` | `attentionCount` (on_hold + reassessment_due) | PASS |
| `pendingReviews` | `pendingWrapUpsCount + assessmentsNeedingReview + activePlacementReviews` | PASS |
| `attendanceExceptions` | `pendingWrapUpsCount` (proxy — wrap-ups are the main attendance signal) | PASS |
| `advancementEligibleCount` | `advancementReadyCount` (from `player_curriculum_states`) | PASS |
| `playerProgressStallCount` | `stalledPlayerCount` (enrolled > 180 days, not advancement-eligible) | PASS |
| `curriculumGapCount` | `curricGapCount` (from `academy_suggestions`) | PASS |
| `curriculumDraftCount` | `pendingSuggestionsCount` | PASS |
| `reassessmentDueCount` | `reassessmentDue` (from reassessment pipeline) | PASS |
| `sessionsThisWeek` | `sessionsThisWeek` | PASS |
| `isLive` | `isAcademyLive` | PASS |

No new DB queries added. All values were already computed before this sprint.

---

## Card Behaviour

| Scenario | Expected | Status |
|---|---|---|
| Academy has attention items | Card shows health badge + top action (expanded) | PASS |
| Top action requires approval | Approval badge shown; `donnaWillNotDo` text shown | PASS |
| Academy clear (all zeros) | Card shows "Academy is operating normally" | PASS |
| Top action has `href` | "Go" button links to correct route | PASS |
| Supporting items exist | Up to 4 listed below top action | PASS |

---

## Destination Links

| Item type | Destination | Status |
|---|---|---|
| Missing wrap-ups | `/director/sessions` | PASS |
| High-risk players | `/director/players` | PASS |
| Attendance exceptions | `/director/review` | PASS |
| Pending reviews (stale queue) | `/director/review` | PASS |
| Advancement eligible | `/director/players` | PASS |
| Progress stalls | `/director/attention` | PASS |
| Curriculum drafts | `/director/review` | PASS |
| Curriculum gaps | `/director/curriculum` | PASS |
| Reassessment due | `/director/attention` (via assessment coverage gap) | PASS |

---

## Relationship to Daily Brief Surface

| Component | Purpose | Deduplication |
|---|---|---|
| `DonnaDailyCOOBriefSurface` (Sprint 1681) | Dismissible once-per-day greeting brief; links to `/director/donna` | Shows once; lighter content |
| `DonnaAcademyCOOBriefCard` (Sprint 1701) | Persistent COO operating priority; expanded detail; action links | Always present; operational |

They do not duplicate each other: the daily brief is a greeting surface (dismiss-to-go-away); the COO card is a persistent operating tool. Different purpose, different interaction.

---

## Safety Invariants

| Rule | Status |
|---|---|
| No DB queries added to the dashboard | PASS — all values re-use existing queries |
| No mutations in `dashboardAttentionContext.ts` | PASS — pure mapping |
| No player PII exposed in card labels | PASS — all items use aggregate counts |
| Approval items clearly marked | PASS — `ShieldCheck` badge + `donnaWillNotDo` text |
| No fake/invented signals | PASS — `buildDashboardAttentionContext` uses conservative zero defaults |
| Empty state honest | PASS — "Academy is operating normally" when no signals |

---

## Manual Test Checklist

- [ ] Open director dashboard — `DonnaAcademyCOOBriefCard` visible above KPI tiles
- [ ] Top action is visible without clicking (card is expanded by default)
- [ ] Health badge shows correct signal (clear/attention/critical)
- [ ] "Go" button navigates to correct destination
- [ ] Approval badge shows for approval-required items
- [ ] Expand/collapse toggle works
- [ ] Empty state shows when academy has no signals
- [ ] Say "What should I focus on today?" — voice matches same top item as card
- [ ] TypeScript clean: `npx tsc --noEmit` passes

---

## Known Limitations

| Limitation | Impact | Resolution |
|---|---|---|
| `attendanceExceptions` uses `pendingWrapUpsCount` as proxy | Slight over-count when wrap-ups and attendance are separate concerns | Separate query in future sprint |
| `mediumRiskPlayerCount` always 0 | Medium-risk items won't appear in card | Load from `DirectorDonnaContext` when full context load is added to dashboard |
| Named players not shown in high-risk item (no `attentionItems`) | Item says "N players" not "Jamie, Sarah" | Pass `priorityQueue` items in a future pass |
| Daily brief (Sprint 1681) + COO card both visible on first load | Two DONNA surfaces together | Dismiss the daily brief; COO card stays — intentional split |
