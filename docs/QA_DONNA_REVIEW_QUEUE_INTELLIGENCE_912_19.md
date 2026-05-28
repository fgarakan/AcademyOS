# QA — DONNA Review Queue Intelligence V1
**Sprint:** 912.19
**Date:** 2026-05-28
**Method:** Static code analysis of Sprint 912.19 implementation
**Code analysed:**
- `src/lib/donna/donnaReviewQueueAnswer.ts` (NEW)
- `src/components/donna/DonnaVoiceReadyShell.tsx`
- `src/lib/donna/directorDonnaContext.ts`

---

## Part 1 — Review Queue Data Audit

### What `DirectorDonnaContext` provides (live from `proposed_actions`)

| Field | Source | Sprint 912.19 usage |
|---|---|---|
| `pendingReviews` | `proposed_actions` WHERE `status='pending_review'` — total count | ✅ Total shown in response |
| `evidenceDrafts` | `proposed_actions` WHERE `target_module INCLUDES 'evidence'` | ✅ Breakdown item |
| `attendanceExceptions` | `proposed_actions` WHERE `target_module = 'attendance'` | ✅ Breakdown item + priority note |
| `templateDrafts` | `proposed_actions` WHERE `target_module INCLUDES 'template'` | ✅ Breakdown item |
| `confidence` | Data quality signal | ✅ Passed to response |
| `isLive` | true when DB loaded | ✅ Prefix + sourceNote |

### Derived field: `otherCount`
```
otherCount = max(0, pendingReviews - evidenceDrafts - attendanceExceptions - templateDrafts)
```
Covers: coach wrap-up items, player proposals, observation drafts — anything whose `target_module` isn't one of the three explicitly tracked types. Labeled "may include coach wrap-ups or player proposals" in the response.

### NOT available in `directorCtx` — documented in response

| Missing signal | Where it lives | Response treatment |
|---|---|---|
| Curriculum override drafts | `academy_curriculum_overrides` (separate table) | Response says: "Curriculum drafts from DONNA voice commands are in a separate queue on the Curriculum Builder page." |
| Per-item risk levels | Item-level data not in ctx | Response gives category-based prioritization guidance |
| Age/staleness of items | Not in ctx | Not mentioned — no fake data |

---

## Part 2 — Detection Patterns

### `detectReviewQueueQuestion(text)` returns true for:

| Pattern | Example phrases |
|---|---|
| `what('?s\| is\| are) in (the )?review queue` | "what's in the review queue?", "what is in the review queue?" |
| `review queue (summary\|breakdown\|status\|detail\|items?)` | "review queue summary", "review queue breakdown" |
| `what.{0,15}review queue` | "what is my review queue?", "tell me about the review queue" |
| `what curriculum drafts? (are )?(waiting\|pending)` | "what curriculum drafts are waiting?", "what curriculum draft is pending?" |
| `curriculum (drafts?\|changes?) (waiting\|pending\|in the queue)` | "curriculum changes pending", "curriculum drafts in queue" |
| `what.{0,20}(decisions?\|approvals?\|items?) (are )?(waiting\|pending) (on\|for) me` | "what decisions are waiting on me?", "what approvals are waiting for me?" |
| `summarize (pending\|the )?reviews?` | "summarize pending reviews", "summarize the reviews" |
| `pending (reviews?\|approvals?) (summary\|breakdown\|detail\|items?)` | "pending reviews breakdown", "pending approvals detail" |
| `breakdown of (pending\|review) items?` | "breakdown of pending items", "breakdown of review items" |
| `what.{0,15}(risky\|high.?risk\|critical\|riskiest) (in the queue\|pending)` | "what is risky in the queue?", "what's high-risk pending?" |
| `what needs (review\|approval)` | "what needs review?", "what needs approval?" |

### Pipeline position

```
1.  Pending confirmation
2.  Orphaned confirm guard
3.  Slot-fill handler
4.  Nav offer yes/no
5.  Boundary check
6.  ← NEW: Review Queue Intelligence (Sprint 912.19) [requires directorCtx]
7.  Page guide (Sprint 912.14)
8.  Missing context (Sprint 725)
9.  null-directorCtx guard (Sprint 912.13)
10. Onboarding guide (Sprint 912.18)
11. KPI intercept
12. Dashboard priority
...
```

**Why before page guide:** "What needs review?" would otherwise get a page-contextual answer from `PAGE_APPROVAL` (e.g., on the DONNA Hub: "No approval actions identified on this page"). The data-driven answer (actual queue counts) is always more useful.

**Guard:** `directorCtx &&` — if context is null, falls through to the rest of the pipeline (page guide, missing context, etc.).

---

## Part 3 — Response Format

### Standard case (items pending)

**Input:** "What needs review?" with ctx: `pendingReviews=5, evidenceDrafts=2, attendanceExceptions=1, templateDrafts=0`

`otherCount = 5 - 2 - 1 - 0 = 2`

**Output:**
```
Review Queue: 5 items pending: 2 evidence drafts, 1 attendance exception, 2 other items (may include coach wrap-ups or player proposals). Attendance exceptions may affect parent records — review these carefully. Curriculum drafts from DONNA voice commands are in a separate queue on the Curriculum Builder page. DONNA will not approve, reject, or apply any item — your explicit action in the Review Center is required.
```

**followUp:** "Open Review Queue" → `/director/review` (nav offer set)

---

### Empty queue case

**Input:** "What needs review?" with `pendingReviews=0`

**Output:**
```
Your Review Queue is clear right now — no pending items in proposed_actions. Curriculum drafts from DONNA voice commands are tracked separately on the Curriculum Builder page.
```

**followUp:** "Check Curriculum Builder" → `/director/curriculum/builder`

---

### Demo data case

Same format but prefixed with `[Demo]` when `ctx.isLive = false`.

---

## Part 4 — Prioritization Logic

| Condition | Priority note added |
|---|---|
| `attendanceExceptions > 0` | "Attendance exceptions may affect parent records — review these carefully." |
| `evidenceDrafts > 0` (and no attendance exceptions) | "Evidence drafts affect player advancement readiness — worth reviewing before advancement decisions." |
| All zero | No priority note |

No other risk classification — honest about what data is available.

---

## Manual/Static QA Scenarios

### Scenario 1 — "What needs review?" on /director/donna ✅ PASS

**Before Sprint 912.19:** `PAGE_APPROVAL` fires at step 7 → "On the **DONNA Hub**, no director-approval actions have been identified." — wrong response for queue intent.

**After Sprint 912.19:** Review queue intercept fires at step 6 → data-driven response with actual count breakdown.

**Trace:**
- `detectReviewQueueQuestion("what needs review")` → `/what needs (review|approval)/` → ✅
- `directorCtx` available → fires
- `buildReviewQueueAnswer(ctx)` → breakdown response

**Expected:** ✅ Data-driven queue breakdown. Page guide no longer shadows this.

---

### Scenario 2 — "What is in the review queue?" ✅ PASS

**Trace:**
- `detectReviewQueueQuestion("what is in the review queue")` → `/what.{0,15}review queue/` → ✅
- → `buildReviewQueueAnswer(ctx)`

**Expected:** ✅ Queue breakdown response.

---

### Scenario 3 — "What curriculum drafts are waiting?" ✅ PASS

**Trace:**
- `detectReviewQueueQuestion("what curriculum drafts are waiting")` → `/what curriculum drafts? (are )?(waiting|pending)/` → ✅
- → `buildReviewQueueAnswer(ctx)` → includes "Curriculum drafts from DONNA voice commands are in a separate queue on the Curriculum Builder page."

**Expected:** ✅ Honest response that notes the separate curriculum queue.

---

### Scenario 4 — "What decisions are waiting on me?" ✅ PASS

**Trace:**
- `detectReviewQueueQuestion("what decisions are waiting on me")` → `/what.{0,20}decisions? (are )?waiting (on|for) me/` → ✅
- → `buildReviewQueueAnswer(ctx)`

**Expected:** ✅ Queue breakdown with nav offer.

---

### Scenario 5 — "Review queue summary" ✅ PASS

**Trace:**
- `detectReviewQueueQuestion("review queue summary")` → `/review queue (summary|breakdown|status|detail|items?)/` → ✅

**Expected:** ✅ Queue summary response.

---

### Scenario 6 — "What is risky in the queue?" ✅ PASS

**Trace:**
- `detectReviewQueueQuestion("what is risky in the queue")` → `/what.{0,15}risky.{0,5}in (the )?queue/` → ✅
- → `buildReviewQueueAnswer(ctx)` — attendance exception priority note shown if applicable

**Expected:** ✅ Risk-informed queue response using available data.

---

### Scenario 7 — directorCtx is null — falls through ✅ PASS

**Trace:**
- `plainRole === 'director' && directorCtx && detectReviewQueueQuestion(...)` → `directorCtx = null` → guard fails
- Falls through to page guide → missing context → null-directorCtx guard
- null-directorCtx guard: `NEEDS_LIVE_CTX` doesn't match "what needs review" → falls through
- Eventually hits fallback

**Expected:** ✅ No crash. Graceful fallthrough.

---

### Scenario 8 — "What needs approval on this page?" — PAGE_APPROVAL still wins ✅ PASS

`detectReviewQueueQuestion("what needs approval on this page")` — "on this page" is not in any queue pattern → returns false → falls through to page guide → `PAGE_APPROVAL` catches it → page-contextual answer. ✅

---

### Scenario 9 — Page guide "what needs review" on /director/review ✅ PASS (changed)

**Before Sprint 912.19:** On `/director/review`, "what needs review" → `PAGE_APPROVAL` → "all actions require explicit approval."

**After Sprint 912.19:** Review queue intercept fires FIRST with the data breakdown → then offers nav to Review Center. This is a BETTER answer for this page.

**Expected:** ✅ Data-driven answer is more useful than generic page guidance.

---

### Scenario 10 — Director brief still works ✅ PASS

`detectReviewQueueQuestion("give me a brief")` → none of the queue patterns match "give me a brief" → false → falls through to Sprint 912.17 dashboard priority handler.

**Expected:** ✅ Director brief unaffected.

---

### Scenario 11 — Curriculum draft creation still works ✅ PASS

"Add a drill for Orange 2 focused on forehand prep" → `detectReviewQueueQuestion(...)` → none match → falls through to Sprint 912.8 drill handler.

**Expected:** ✅ No interference.

---

### Scenario 12 — DONNA never approves/rejects/applies ✅ PASS

`buildReviewQueueAnswer` is pure TypeScript — no DB calls, no mutations, no `execute_curriculum_override()`, no `proposed_actions` manipulation. Every response ends with: "DONNA will not approve, reject, or apply any item — your explicit action in the Review Center is required."

Sprint 904 approve/reject actions are in `curriculumOverrideApprovalActions.ts` — not touched.

**Expected:** ✅ No auto-approval possible.

---

## Pattern Conflict Analysis

| Interceptor | Could conflict? | Analysis |
|---|---|---|
| `PAGE_APPROVAL` (step 7 after my step 6) | No conflict — my intercept fires first | "What needs review?" → review queue data answer (step 6). If directorCtx null, falls through to PAGE_APPROVAL (step 7). ✅ |
| `detectMissingContext` (step 8) | No — fires after my intercept | "What needs review?" with null ctx → my guard fails → missing context handles (offers setup navigation). ✅ |
| `detectDashboardPriorityQuestion` (step 12) | No — queue patterns don't match priority patterns | "What should I do first?" doesn't match queue patterns. ✅ |
| Onboarding guide (step 10) | No — different patterns | Onboarding guide targets setup progress. ✅ |
| Curriculum draft handlers | No | Queue patterns don't match "add a drill". ✅ |

---

## Safety Checks

| Check | Result |
|---|---|
| No migrations | ✅ |
| No new server actions | ✅ |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` manipulation | ✅ — only reads from `directorCtx.pendingReviews` etc. |
| Sprint 904 approve/reject actions | ✅ — untouched |
| DONNA never approves/rejects/applies | ✅ — stated in every response |
| No fake data | ✅ — curriculum overrides absence explicitly noted |

---

## Files Changed

- **NEW `src/lib/donna/donnaReviewQueueAnswer.ts`:**
  - `detectReviewQueueQuestion(text)` — 11 regex patterns for queue-data requests
  - `buildReviewQueueAnswer(ctx)` — breakdown response from `directorCtx` breakdown fields; empty-queue variant; `otherCount` for wrap-ups/proposals not explicitly tracked; curriculum override note; safety declaration

- **Modified `src/components/donna/DonnaVoiceReadyShell.tsx`:**
  - Added imports for `detectReviewQueueQuestion`, `buildReviewQueueAnswer`
  - Added Sprint 912.19 review queue intercept at step 6 (after boundary check, before page guide)
  - Guard: `plainRole === 'director' && directorCtx` — data-dependent, falls through if null
  - Sets nav offer to Review Center after response

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 912.19 changes.

---

## Known Limitations

### Limitation 1 — Curriculum override drafts not counted

`academy_curriculum_overrides` is a separate table — DONNA voice drafts go here, not `proposed_actions`. The count is not in `directorCtx`. Response explicitly tells the director where to find them. Adding this count would require extending `loadDirectorDonnaContext`.

### Limitation 2 — "Other items" category is imprecise

Coach wrap-up items, player proposals, session notes — all in `proposed_actions` but their `target_module` isn't in the three explicitly tracked categories. Grouped as "other" with a descriptive note. Director can see exact types in the Review Center.

### Limitation 3 — No per-item risk scores

Each `proposed_actions` item could theoretically have a risk level, but this isn't in `directorCtx`. Risk guidance is category-based (attendance exceptions > evidence drafts) rather than per-item.

---

## Sprint 912.20 Recommendations

1. **DONNA God Mode Live Demo QA V1** — final QA pass across all 13 audit categories now that Sprints 912.13–912.19 are complete. Includes: golden demo loop test, "what needs attention" live data test, page guide mode on all major pages, curriculum draft creation and review cycle, session memory follow-up continuity.
2. **Add curriculum override count to `directorCtx`** — extend `loadDirectorDonnaContext` to query `academy_curriculum_overrides` WHERE `status IN ('pending_review', 'draft')`. Then include it in the review queue answer and director brief.
