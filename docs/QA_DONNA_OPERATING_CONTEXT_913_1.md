# QA — DONNA Operating Context Expansion
**Sprint:** 913.1
**Date:** 2026-05-28
**Method:** Static code analysis
**Code analysed:** `directorDonnaContext.ts`, `directorDashboardDonnaAnswer.ts`, `donnaReviewQueueAnswer.ts`, `donnaOnboardingGuideAnswer.ts`

---

## Fields Added

| Field | Source | Type | Used by |
|---|---|---|---|
| `curriculumDraftCount` | `academy_curriculum_overrides` WHERE `status IN ('pending_review','draft')` | New DB query | Director brief, Review queue |
| `oldestPendingReviewAgeDays` | `proposed_actions` oldest `created_at` WHERE `pending_review` | New DB query | Dashboard priority, Review queue |
| `highRiskPlayerCount` | `attentionItems.filter(a => a.risk === 'high').length` | Derived | Director brief |
| `mediumRiskPlayerCount` | `attentionItems.filter(a => a.risk === 'medium').length` | Derived | Director brief |
| `hasPlayers` | `playerCount > 0` | Derived | Onboarding guide |
| `hasCoaches` | `coachCount > 0` | Derived | Onboarding guide |
| `hasTemplates` | `templateCount > 0` | Derived | Onboarding guide |
| `hasCurriculumGaps` | `curriculumGaps.length > 0` | Derived | Onboarding guide |
| `onboardingReadinessLevel` | Logic: `not_started \| partial \| nearly_ready \| ready_signal \| unknown` | Computed | Onboarding guide |

## Fields Deferred

| Field | Reason |
|---|---|
| Formal onboarding step flags | Lives in `academy.settings`; requires extending the settings read path — higher-risk change |
| `missingWrapUpsByCoach` | Requires coach name join — scope too large for this sprint |
| Per-item review details | Requires per-item query — deferred for per-item answer sprint |
| `templatesMissingBlocks` | Complex template analysis — deferred |

---

## Answer Engines Updated

### `directorDashboardDonnaAnswer.ts`

**`buildDashboardPriorityResponse`:**
- Added `staleWarning` when `ctx.oldestPendingReviewAgeDays >= 7`: "The oldest item is N days old — coaches may be waiting."
- Staleness fires for `>= 7` days, escalates urgency language for `>= 14` days

**`buildDirectorBriefSummary`:**
- Now uses `ctx.highRiskPlayerCount` and `ctx.mediumRiskPlayerCount` instead of recomputing from `attentionItems`
- Added curriculum draft item: "N curriculum drafts waiting in Curriculum Builder"
- Added staleness note in queue item: "(oldest is N days old)"

### `donnaReviewQueueAnswer.ts`

**`buildReviewQueueAnswer`:**
- Empty queue: now shows curriculum draft count if `ctx.curriculumDraftCount > 0` instead of generic note
- Non-empty queue: adds `cdBreakdown` with actual curriculum draft count
- Adds `staleWarning` when `ctx.oldestPendingReviewAgeDays >= 7`

### `donnaOnboardingGuideAnswer.ts`

**`buildGeneralOnboardingAnswer`:**
- Now uses `ctx.onboardingReadinessLevel` to route to specific responses:
  - `ready_signal` → all-positive message
  - `not_started` → no players/coaches message
  - `partial` / `nearly_ready` → incomplete list using `ctx.hasX` booleans
- `nearly_ready` prefix added for clearer communication
- Uses `ctx.hasPlayers`, `ctx.hasCoaches`, `ctx.hasTemplates`, `ctx.hasCurriculumGaps` instead of raw counts

---

## Static QA Scenarios

### Scenario 1 — "Give me my director brief" with full live data ✅ PASS

**Setup:** `pendingReviews=3, missingWrapUps=2, highRiskPlayerCount=1, todaySessions=4, advancementEligibleCount=1, curriculumGaps=['gap1','gap2'], curriculumDraftCount=2, oldestPendingReviewAgeDays=8`

**Items list:**
1. "2 missing coach wrap-ups from today"
2. "1 player flagged high-risk"
3. "3 items in the Review Queue (oldest is 8 days old)"
4. "4 sessions scheduled today"
5. "1 player ready to advance"
6. "2 curriculum gaps flagged"
7. "2 curriculum drafts waiting in Curriculum Builder"

**Best next step:** "Check missing wrap-ups..."

**Expected:** ✅ Curriculum drafts now included. Staleness note for 8-day-old item. Uses pre-computed `highRiskPlayerCount`.

---

### Scenario 2 — "What needs review?" with curriculum drafts ✅ PASS

**Setup:** `pendingReviews=3, curriculumDraftCount=2, oldestPendingReviewAgeDays=10`

**Output includes:**
- "Review Queue: 3 items pending..."
- "Oldest item is 10 days old — coaches may be waiting on decisions."
- "Plus 2 curriculum drafts in the Curriculum Builder queue."
- "DONNA will not approve, reject, or apply any item..."

**Expected:** ✅ Curriculum drafts visible in queue breakdown. Staleness warning active.

---

### Scenario 3 — Empty queue with curriculum drafts ✅ PASS

**Setup:** `pendingReviews=0, curriculumDraftCount=3`

**Output:** "Your Review Queue is clear right now — no pending items in proposed_actions. 3 curriculum drafts are waiting in the Curriculum Builder — review them there."

**Expected:** ✅ Curriculum drafts surfaced even when main queue is empty.

---

### Scenario 4 — "Am I ready to launch?" — onboardingReadinessLevel = 'ready_signal' ✅ PASS

**Setup:** `hasPlayers=true, hasCoaches=true, hasTemplates=true, hasCurriculumGaps=false, onboardingReadinessLevel='ready_signal'`

**Output:** "Setup signals look positive — 12 players, 2 coaches, 4 templates, no curriculum gaps detected. Check the progress checklist..."

**Expected:** ✅ `ready_signal` path with positive summary.

---

### Scenario 5 — "Am I ready to launch?" — not_started ✅ PASS

**Setup:** `onboardingReadinessLevel='not_started'`

**Output:** "Setup looks like it hasn't started yet — no players or coaches are in the system..."

**Expected:** ✅ Clear not-started messaging.

---

### Scenario 6 — "Setup checklist" — nearly_ready ✅ PASS

**Setup:** `onboardingReadinessLevel='nearly_ready', hasPlayers=true, hasCoaches=true, hasTemplates=false, hasCurriculumGaps=false`

Incomplete: `['create session templates']`

**Output:** "Nearly ready — Based on what I can see: still need to 1. create session templates. Work through steps..."

**Expected:** ✅ "Nearly ready" prefix, single remaining item.

---

### Scenario 7 — Fresh queue with no stale items ✅ PASS

**Setup:** `pendingReviews=2, oldestPendingReviewAgeDays=1`

`1 < 7` → staleness condition false → NO stale warning added.

**Expected:** ✅ No false staleness alerts for recent items.

---

### Scenario 8 — oldestPendingReviewAgeDays is null (empty queue or query failed) ✅ PASS

`(ctx.oldestPendingReviewAgeDays ?? 0) >= 7` → `(null ?? 0) = 0` → `0 >= 7` = false → no stale warning.

**Expected:** ✅ Null handled cleanly, no crash.

---

### Scenario 9 — Existing curriculum draft creation still works ✅ PASS

New fields are additive to `DirectorDonnaContext`. `createCurriculumContentItemDraft` is unchanged. The new `curriculumDraftCount` query in `loadDirectorDonnaContext` is independent of the existing draft creation path.

**Expected:** ✅ No interference.

---

### Scenario 10 — Empty data / fallback state ✅ PASS

All new queries have try/catch blocks:
- `curriculumDraftCount` defaults to `0` on query failure
- `oldestPendingReviewAgeDays` defaults to `null` on query failure
- Derived fields always compute from already-loaded values (no new query failures possible)

**Expected:** ✅ Safe fallback for all new fields.

---

## Safety Checks

| Check | Result |
|---|---|
| No migrations | ✅ — `academy_curriculum_overrides` exists since Sprint 901 |
| No new server actions | ✅ |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` mutation | ✅ — only reads |
| Sprint 904 untouched | ✅ |
| All new fields are read-only | ✅ |
| No fake data | ✅ — all new fields either query real tables or derive from loaded data |
| Demo context updated with realistic values | ✅ — `curriculumDraftCount: 2`, `oldestPendingReviewAgeDays: 3` |
| TypeScript clean | ✅ — 0 errors |
