# QA — DONNA Attention Ranking Engine V1
**Sprint:** 913.2
**Date:** 2026-05-28
**Method:** Static code analysis

---

## Static QA Scenarios

### Scenario 1 — Missing wrap-ups + review queue + curriculum drafts ✅ PASS

**Setup:** `missingWrapUps=2, pendingReviews=3, oldestPendingReviewAgeDays=2, curriculumDraftCount=2`

**Expected ranking:**
1. `missing_wrap_ups` — score 86 (80 + 2×3) — `coach_execution` / high
2. `pending_reviews` — score 63 (60 + 3) — `review_queue` / medium
3. `curriculum_drafts` — score 44 (40 + 2×2) — `curriculum` / low

**`buildDashboardPriorityResponse` output:**
```
Top priority: 2 missing coach wrap-ups from today

Why it matters: Coaching observations from today's sessions cannot be recovered retroactively...

Evidence: 2 of today's 3 sessions have no coach wrap-up submitted.

Best next action: Open Sessions and follow up with coaches...

DONNA will not submit wrap-ups or contact coaches automatically.
```

**Expected:** ✅ Wrap-ups ranked #1. Priority format with all 5 structured sections.

---

### Scenario 2 — High-risk player + curriculum gaps ✅ PASS

**Setup:** `highRiskPlayerCount=2, curriculumGaps=['gap1','gap2','gap3']`

**Expected ranking:**
1. `high_risk_players` — score 81 (75 + 2×3) — `player_development` / high
2. `curriculum_gaps` — score 41 (35 + 3×2) — `curriculum` / low

**Director asks "What should I do first?":**
→ `buildDashboardPriorityResponse` → top = high_risk_players

**Output includes:**
- "Top priority: 2 players (including...) flagged high-risk"
- "Why it matters: High-risk flags indicate concern observations..."
- "Evidence: 2 players with high-risk signals..."
- "Best next action: Review player profiles..."
- "DONNA will not publish parent updates..."

**Expected:** ✅ Players ranked above curriculum gaps (correct urgency ordering).

---

### Scenario 3 — Attendance exception + pending reviews ✅ PASS

**Setup:** `attendanceExceptions=2, pendingReviews=3, oldestPendingReviewAgeDays=3`

**Expected ranking:**
1. `attendance_exceptions` — score 74 (70 + 2×2) — `parent_records` / medium
2. `pending_reviews` — score 63 (60 + 3) — `review_queue` / medium

**Key:** Attendance exceptions rank above pending reviews because parent records risk score > queue score.

**Expected:** ✅ Attendance exceptions correctly ranked as higher urgency.

---

### Scenario 4 — Stale review queue older than 7 days ✅ PASS

**Setup:** `pendingReviews=2, oldestPendingReviewAgeDays=10`

**Expected:**
- `queueIsStale = 10 >= 7` → true
- `stale_review_queue` emitted (score 65), `pending_reviews` NOT emitted (mutual exclusion)

**Verify:** `buildAttentionPriorities` returns exactly ONE queue-related priority.

**Director asks "What's pending?":**
→ `buildDirectorBriefSummary` → ranked = `[stale_review_queue]`
→ "Here's your academy status:\n1. Review queue oldest item is 10 days old\nBest next step: Open the Review Center..."

**Expected:** ✅ Stale signal fires; no duplicate with fresh-pending signal.

---

### Scenario 5 — Advancement eligible players only ✅ PASS

**Setup:** `advancementEligibleCount=3, highRiskPlayerCount=0, mediumRiskPlayerCount=0`

**Expected ranking:**
1. `advancement_eligible` — score 53 (50 + 3) — `player_development` / medium

**Director asks "What should I do first?":**
→ Top = `advancement_eligible`
→ "Top priority: 3 players ready to advance\nWhy it matters: Players meeting advancement criteria are waiting for a level decision..."

**Expected:** ✅ Advancement eligible surfaces as single priority.

---

### Scenario 6 — Curriculum drafts only ✅ PASS

**Setup:** `curriculumDraftCount=4, pendingReviews=0`

**Expected ranking:**
1. `curriculum_drafts` — score 48 (40 + 4×2) — `curriculum` / medium

**Director asks "Give me a brief":**
→ `buildDirectorBriefSummary` → ranked = `[curriculum_drafts]`
→ "Here's your academy status (ranked by urgency):\n1. 4 curriculum drafts waiting in Curriculum Builder\n\nBest next step: Open the Curriculum Builder..."

**Expected:** ✅ Curriculum drafts visible in brief.

---

### Scenario 7 — Onboarding partial, no players/coaches ✅ PASS

**Setup:** `onboardingReadinessLevel='not_started', hasPlayers=false, hasCoaches=false`

**Expected ranking:**
1. `onboarding_incomplete` — score 45 — `onboarding` / high

**Evidence string includes:** "Missing or incomplete: players, coaches."

**Expected:** ✅ Onboarding surfaces with correct missing parts list.

---

### Scenario 8 — All clear state ✅ PASS

**Setup:** All ctx counts at 0, `onboardingReadinessLevel='ready_signal'`

**Expected:**
- `buildAttentionPriorities(ctx)` → empty array (no signals)
- `getTopPriority(ctx)` → null
- `buildDashboardPriorityResponse(ctx)` → "Academy looks healthy..."
- `buildDirectorBriefSummary(ctx)` → "Academy looks clear..."

**Expected:** ✅ All-clear path clean. No fake priorities.

---

### Scenario 9 — Missing data / null fields ✅ PASS

**Setup:** `oldestPendingReviewAgeDays=null, highRiskPlayerCount=0, curriculumDraftCount=0`

- `staleAge = ctx.oldestPendingReviewAgeDays ?? 0` → `0`
- `queueIsStale = pendingReviews > 0 && 0 >= 7` → false
- No stale priority emitted, no crash ✅

**Expected:** ✅ Null fields handled cleanly via `?? 0` fallback.

---

### Scenario 10 — Director asks "What should I do first?" ✅ PASS

Pipeline: `detectDashboardPriorityQuestion("what should i do first")` → ✅ → `detectBriefQuestion("what should i do first")` → false → `buildDashboardPriorityResponse(ctx)` → ranking engine → structured output.

**Expected:** ✅ Single-action priority format with ranking engine result.

---

## Safety Checks

| Check | Result |
|---|---|
| Ranking engine is pure TypeScript | ✅ |
| No DB calls | ✅ |
| No mutations | ✅ |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` manipulation | ✅ |
| Sprint 904 untouched | ✅ |
| Every priority has explicit `donnaWillNotDo` | ✅ |
| Every priority with mutations has `requiresApproval: true` | ✅ |
| No fabricated data when signal is zero | ✅ — signal only emitted if count > 0 |
| Deduplication: stale vs fresh queue | ✅ — mutually exclusive |
| Deduplication: high vs medium risk | ✅ — medium only when highRisk === 0 |

---

## Files Changed

- **NEW `src/lib/donna/donnaAttentionRankingEngine.ts`** — deterministic ranking engine with 11 signal types, scoring rules, `buildAttentionPriorities`, `getTopAttentionPriorities`, `getTopPriority`
- **Modified `src/lib/donna/directorDashboardDonnaAnswer.ts`** — both `buildDashboardPriorityResponse` and `buildDirectorBriefSummary` now delegate to ranking engine; structured priority format added to priority response

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 913.2 changes.
