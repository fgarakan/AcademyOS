# DONNA Daily COO Briefing — Certification
**Sprint 935–964 — DONNA Daily COO Briefing V1**
**Date: 2026-06-07**

---

## Certification scope

Verifies that the DONNA Daily COO Brief:
- Surfaces on the director home page without requiring Brian to ask DONNA
- Shows real signal data from Supabase queries already run by the page
- Organizes items into 5 structured sections with clear action routes
- Derives top 3 actions from highest-urgency items across all sections
- Discloses missing data rather than silently omitting it
- Never writes, saves, or mutates anything
- Is TypeScript clean with no errors

---

## Scenario 1 — No data academy

**Setup:** New academy with 0 active players, 0 sessions, 0 review items, 0 curriculum records.

**Input:**
```typescript
buildCOODailyBrief({
  activePlayers: 0, todaySessionCount: 0, sessionsThisWeek: 0,
  pendingWrapUps: 0, assessmentsInReview: 0, placementReviews: 0,
  parentUpdatesWaiting: 0, lessonRequests: 0, oldestPendingReviewAgeDays: null,
  attentionCount: 0, advancementReadyCount: 0, stalledPlayerCount: 0,
  pendingPlacementCount: 0, reassessmentDueCount: 0,
  coachRecapsMissing: 0, coachCoverageGaps: 0,
  curriculumGapCount: 0, playersWithoutLevel: 0,
  curriculumTemplateCoverageGapCount: 0, classTemplateCount: 0,
  sessionsExist: false,
})
```

**Expected:**
- `overallStatus: 'no_data'`
- `openingStatement`: "Add your first players and templates to activate your academy brief."
- All 5 sections: `items.length === 0`, `status: 'clear'`
- `top3Actions: []`
- `hasUrgentItems: false`
- `totalAttentionItems: 0`
- `missingDataNotes` includes "No session history" and "No active players" notes

**Panel renders:**
- Status badge: "No Data Yet"
- All-clear message shown
- Missing data notes displayed at bottom

**PASS criteria:**
- [x] `overallStatus === 'no_data'`
- [x] No items in any section
- [x] `missingDataNotes.length >= 2`
- [x] Panel shows all-clear state, not empty/broken
- [x] No data invented

---

## Scenario 2 — Normal active academy

**Setup:** Active academy, 12 players, sessions this week, 2 pending wrap-ups, 1 advancement-ready player, 3 curriculum gaps.

**Input:**
```typescript
buildCOODailyBrief({
  activePlayers: 12, todaySessionCount: 2, sessionsThisWeek: 6,
  pendingWrapUps: 2, assessmentsInReview: 0, placementReviews: 0,
  parentUpdatesWaiting: 0, lessonRequests: 0, oldestPendingReviewAgeDays: 3,
  attentionCount: 0, advancementReadyCount: 1, stalledPlayerCount: 0,
  pendingPlacementCount: 0, reassessmentDueCount: 0,
  coachRecapsMissing: 0, coachCoverageGaps: 0,
  curriculumGapCount: 3, playersWithoutLevel: 0,
  curriculumTemplateCoverageGapCount: 0, classTemplateCount: 4,
  sessionsExist: true,
})
```

**Expected:**
- `overallStatus: 'attention'`
- `sections.todayPriority.items`: 1 item — 2 items in review queue (high urgency, detail "oldest 3 days ago")
- `sections.watchList.items`: 1 item — 1 player advancement-eligible (medium)
- `sections.decisionsWaiting.items`: 1 item — 2 wrap-ups (medium urgency)
- `sections.parentCoachFollowUp.items`: 0 items (clear)
- `sections.setupCurriculum.items`: 1 item — 3 curriculum gaps (medium)
- `top3Actions.length === 3` — review queue, players, curriculum
- `hasUrgentItems: true`
- `totalAttentionItems: 4`
- `missingDataNotes: []`

**PASS criteria:**
- [x] `overallStatus === 'attention'`
- [x] Review queue item includes "oldest 3 days ago" detail
- [x] `decisionsWaiting.items[0].urgency === 'medium'` (2 wrap-ups < 3 threshold)
- [x] Top 3 includes `/director/review`, `/director/players`, `/director/curriculum`
- [x] `parentCoachFollowUp.status === 'clear'`
- [x] No missing data notes (sessions exist, players exist)

---

## Scenario 3 — Parent updates waiting

**Setup:** 3 parent updates awaiting approval, 4 coach recaps missing.

**Input (relevant fields):**
```typescript
parentUpdatesWaiting: 3, coachRecapsMissing: 4, sessionsExist: true, activePlayers: 8
```

**Expected:**
- `sections.parentCoachFollowUp.items.length === 2`
- Item 1: "3 parent updates awaiting your approval before sending" — urgency: medium
- Item 2: "4 completed sessions are missing a coach recap" — urgency: high (≥3 threshold)
- `sections.parentCoachFollowUp.status === 'urgent'` (high urgency item present)
- `top3Actions` includes `/director/review` (parent updates) and `/director/sessions` (recaps)

**PASS criteria:**
- [x] `parentCoachFollowUp.items.length === 2`
- [x] Coach recap item urgency: 'high' (4 ≥ 3 threshold)
- [x] Parent update item urgency: 'medium'
- [x] Both action routes present in `top3Actions`

---

## Scenario 4 — Player risks exist

**Setup:** 3 players on hold, 2 advancement-ready, 2 stalled, 1 pending placement.

**Input (relevant fields):**
```typescript
attentionCount: 3, advancementReadyCount: 2, stalledPlayerCount: 2,
pendingPlacementCount: 1, activePlayers: 15
```

**Expected:**
- `sections.todayPriority.items`: 1 item — 3 players on hold (urgency: critical, ≥3 threshold)
- `sections.watchList.items.length === 3` — placement, advancement-ready, stalled
- `overallStatus: 'critical'`
- `hasUrgentItems: true`
- Status badge: "Needs Attention"

**PASS criteria:**
- [x] `overallStatus === 'critical'`
- [x] `todayPriority.items[0].urgency === 'critical'` (3 attention players)
- [x] `watchList.items` includes pending placement (high), advancement (medium), stalled (medium)
- [x] Status badge label is "Needs Attention"

---

## Scenario 5 — Setup incomplete

**Setup:** New academy with 2 players but no templates, no sessions scheduled yet.

**Input (relevant fields):**
```typescript
activePlayers: 2, classTemplateCount: 0, sessionsExist: false,
curriculumGapCount: 0, playersWithoutLevel: 1
```

**Expected:**
- `sections.setupCurriculum.items.length === 2`
- Item 1: "No class templates created yet" — urgency: high
- Item 2: "1 active player has no curriculum level assigned" — urgency: medium
- `sections.setupCurriculum.status === 'urgent'`
- `missingDataNotes` includes "No session history" note
- `overallStatus: 'attention'`

**PASS criteria:**
- [x] No-template item has urgency 'high'
- [x] `setupCurriculum.status === 'urgent'` (high urgency item present)
- [x] Session history missing note disclosed
- [x] `missingDataNotes.length >= 1`

---

## Scenario 6 — Curriculum incomplete

**Setup:** Active academy, 10 players, sessions exist, 2 curriculum levels have no class template, 5 curriculum gaps.

**Input (relevant fields):**
```typescript
activePlayers: 10, classTemplateCount: 2, sessionsExist: true,
curriculumTemplateCoverageGapCount: 2, curriculumGapCount: 5, playersWithoutLevel: 0
```

**Expected:**
- `sections.setupCurriculum.items.length === 2`
- Item 1: "5 curriculum gaps were identified in player development paths" — medium
- Item 2: "2 active curriculum levels have no class template" — medium
- Both link to `/director/curriculum`
- `missingDataNotes: []` (sessions exist, players exist)

**PASS criteria:**
- [x] Both curriculum items present with correct labels
- [x] Both `actionHref === '/director/curriculum'`
- [x] De-duplicated in `top3Actions` → appears once in top 3 (highest urgency wins per route)
- [x] No missing data notes

---

## Scenario 7 — Missing data disclosed

**Setup:** Academy with players but no sessions ever run.

**Input (relevant fields):**
```typescript
activePlayers: 5, sessionsExist: false, coachRecapsMissing: 0
```

**Expected:**
- `missingDataNotes` includes: "No session history yet — session and recap signals will appear once sessions are scheduled."
- `sections.parentCoachFollowUp` shows 0 items (clear)
- Missing note shown at bottom of panel
- No false "all clear" on session signals — the note explains why they are absent

**PASS criteria:**
- [x] "No session history" note in `missingDataNotes`
- [x] Note rendered at bottom of `DonnaCOODailyBriefPanel` with `AlertTriangle` icon
- [x] `coachRecapsMissing === 0` → no recap item (data is genuinely 0, not missing)
- [x] Director can distinguish "0 items" from "no data" via the note

---

## Top 3 actions de-duplication

When multiple items link to the same route, only the highest-urgency one appears in top 3:

| Items | Routes | Expected top 3 |
|---|---|---|
| Wrap-ups (medium) + Assessments (medium) + Placement reviews (high) | `/director/review` × 3 | 1 entry: placement reviews (high) |
| Watch list (medium) + Attention players (high) | `/director/players` × 2 | 1 entry: attention players (high) |
| Curriculum gaps (medium) | `/director/curriculum` × 1 | 1 entry: curriculum gaps (medium) |

Result: top 3 is `/director/review`, `/director/players`, `/director/curriculum` — 3 different routes.

**PASS criteria:**
- [x] `top3Actions` never contains 2 items with the same `actionHref`
- [x] Highest-urgency item per route wins de-duplication
- [x] Max 3 items in `top3Actions`

---

## No mutation guarantee

| Action | Verified |
|---|---|
| `buildCOODailyBrief` does not call Supabase | [x] — pure TypeScript, no imports of DB clients |
| `DonnaCOODailyBriefPanel` does not call Supabase | [x] — server component, no data fetching |
| Panel renders no forms, no buttons, no input fields | [x] — only Link elements for navigation |
| No `proposed_actions` row created | [x] — read-only |
| No `audit_logs` write | [x] — no mutation |

---

## Build classification

| Category | Status |
|---|---|
| `COODailyBrief` type contract | Built — `donnaDailyCOOAggregator.ts` |
| 5-section aggregation | Built — `buildCOODailyBrief()` |
| Top 3 action derivation | Built — `deriveTop3Actions()` with de-duplication |
| Missing data disclosure | Built — `buildMissingDataNotes()` |
| Panel component | Built — `DonnaCOODailyBriefPanel.tsx` |
| Director page wiring | Built — imported and rendered in `page.tsx` |
| TypeScript | Clean — 0 errors |

---

**Certification status:** All 7 scenarios defined and traceable to implementation. Brief is proactive (renders on page load), uses real signals, discloses missing data, never mutates. Director always controls navigation. TypeScript clean.
