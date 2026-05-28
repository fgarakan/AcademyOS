# QA — DONNA Director Brief V1
**Sprint:** 912.17
**Date:** 2026-05-28
**Method:** Static code analysis of Sprint 912.17 implementation
**Code analysed:**
- `src/lib/donna/directorDashboardDonnaAnswer.ts`
- `src/app/api/donna/brief/route.ts`
- `src/app/api/donna/attention/route.ts`
- `src/lib/donna/directorDonnaContext.ts`

---

## Part 1 — Data Source Analysis

### What `DirectorDonnaContext` provides (live DB data, loaded at page render)

| Field | Source table | Sprint 912.17 usage |
|---|---|---|
| `pendingReviews` | `proposed_actions` WHERE `status='pending_review'` | ✅ Used in brief items |
| `missingWrapUps` | sessions today without wrap-up proposed action | ✅ Used as highest priority |
| `attentionItems` | `coach_observations` (concerns) + `session_attendance` (absences) | ✅ highRisk/medRisk count |
| `todaySessions` | `sessions` WHERE `scheduled_date = today` | ✅ Used in brief items |
| `advancementEligibleCount` | `v_player_curriculum_summary` WHERE `advancement_eligible` | ✅ Used in brief items |
| `curriculumGaps` | structural gap analysis across curriculum levels | ✅ Used in brief items |
| `evidenceDrafts` | `proposed_actions` target_module evidence breakdown | (used in priority response) |
| `attendanceExceptions` | `proposed_actions` target_module attendance breakdown | (used in priority response) |
| `templateDrafts` | `proposed_actions` target_module template breakdown | (used in priority response) |
| `isLive` | true when DB data loaded; false when using demo fallback | ✅ Prefix and sourceNote |
| `confidence` | data quality signal | ✅ Passed to response |

### What is NOT in `directorCtx` and therefore NOT in the brief

| Missing signal | Where it lives | Sprint status |
|---|---|---|
| Curriculum draft count (`academy_curriculum_overrides`) | Separate table from `proposed_actions` | Not in `directorCtx`; excluded from brief — no fake data shown |
| Player pending placement count | `players.status = 'pending_placement'` | Not in `directorCtx` — covered by `/api/donna/brief` but not wired to ctx |

**Decision:** Rather than adding new DB queries or wiring the brief API, this sprint uses only what `directorCtx` already provides. All data is genuine — no fabrication. The brief notes "Nothing is applied until you approve it" which is always true.

---

## Part 2 — Detection Patterns Added

### New patterns added to `detectDashboardPriorityQuestion`

| Pattern | Example phrases |
|---|---|
| `give me (a\|my\|the)? (brief\|briefing\|status report\|digest)` | "give me a brief", "give me my briefing", "give me a status report" |
| `\b(director brief\|daily brief\|academy brief\|status report)\b` | "director brief", "my daily brief", "academy brief" |
| `what'?s? (pending\|outstanding\|in the queue)` | "what's pending", "what is pending", "what is in the queue" |
| `anything (pending\|outstanding\|in the queue)` | "anything pending?", "is anything outstanding?" |
| `show me what.{0,15}(pending\|outstanding\|needs attention)` | "show me what's pending", "show me what needs attention" |
| `what (should i\|do i) review (first\|today\|now)` | "what should I review first?", "what do I review today?" |
| `\bacademy status\b` | "academy status", "give me the academy status" |
| `how (is\|are) (the\|my\|this)? academy doing` | "how is the academy doing?", "how are we doing?" |

### Previously matched (unchanged, for reference)

| Pattern | Example phrases |
|---|---|
| `what (needs?\|need) (my )?attention` | "what needs my attention?", "what needs attention today?" |
| `what should i (do\|work on) today` | "what should I do today?" |
| `give me (a )?(summary\|overview) (of today\|for today)` | "give me a summary for today" |
| `most important` | "what is most important?" |

### Conflict analysis with existing patterns

| Potential conflict | Analysis |
|---|---|
| `PAGE_APPROVAL` catches "what needs review" | "What needs review?" → PAGE_APPROVAL fires (step 6) BEFORE dashboard priority (step 10). Correctly routes to page-specific approval guidance. No conflict — "what should I review first" (new pattern) has "review first" which PAGE_APPROVAL doesn't match. ✅ |
| `PAGE_NEXT_STEP` catches "what should I do here" | Requires "here" or "on this page" — new patterns don't include these qualifiers. ✅ |
| KPI intercept | KPI patterns are separate (`detectKpiQuestionType`). None of the new patterns touch kpi/metric vocabulary. ✅ |
| null-directorCtx guard | Guard only fires for `kpi\|metric\|attention\|advance.*player\|coaches`. "Give me a brief" doesn't match — with null ctx, it falls through to the generic fallback. Acceptable V1 behavior. |

---

## Part 3 — `buildDirectorBriefSummary` Output Format

### When items exist (standard case)

**Input:** "Give me a brief" (with directorCtx: missingWrapUps=2, highRisk=1, pendingReviews=3, todaySessions=4, advancementEligibleCount=1, curriculumGaps.length=2)

**Output:**
```
Here's your academy status:

1. 2 missing coach wrap-ups from today.
2. 1 player flagged high-risk.
3. 3 items in the Review Queue.
4. 4 sessions scheduled today.
5. 1 player ready to advance.
6. 2 curriculum gaps flagged.

Best next step: Check missing wrap-ups — coaching observations from today cannot be recovered later.

Nothing is applied until you approve it.
```

**sourceNote:** "Live data" (when `ctx.isLive = true`)
**followUp:** "Show sessions"
**href:** "/director/sessions"

---

### When no urgent signals (all-clear case)

**Input:** "Academy status" (with directorCtx: all counts 0, todaySessions=2)

**Output:**
```
Academy looks clear — nothing urgent right now. 2 sessions today. Good time to review curriculum coverage or check in on player progress.
```

**followUp:** "Ask me what to focus on"
**href:** "/director/donna"

---

### With demo data prefix

When `ctx.isLive = false`:
```
[Demo] Here's your academy status:
...
```

---

## Part 4 — Routing Logic

```
detectDashboardPriorityQuestion(text)
  → false: return null (falls through to next interceptor)
  → true:
      detectBriefQuestion(text)
        → true:  buildDirectorBriefSummary(ctx) ← NEW Sprint 912.17
        → false: buildDashboardPriorityResponse(ctx) ← existing behavior
```

**Priority questions** ("what should I do first?", "what needs my attention?") → `buildDashboardPriorityResponse` — returns ONE clear action.

**Brief/status questions** ("give me a brief", "what is pending?") → `buildDirectorBriefSummary` — returns ALL pending signals as a numbered list.

---

## Manual/Static QA Scenarios

### Scenario 1 — "What needs my attention today?" ✅ PASS (existing behavior preserved)

**Trace:**
- `detectDashboardPriorityQuestion("what needs my attention today")` → `/what (needs?|need) (my )?attention/` → ✅
- `detectBriefQuestion(...)` → none of the brief patterns match "what needs my attention" → false
- → `buildDashboardPriorityResponse(ctx)` (existing function, unchanged)

**Expected:** Single-action priority answer. ✅

---

### Scenario 2 — "Give me my director brief" ✅ PASS

**Trace:**
- `detectDashboardPriorityQuestion("give me my director brief")`:
  - `/\b(director brief|daily brief|academy brief|status report)\b/` → "director brief" → ✅
- `detectBriefQuestion("give me my director brief")`:
  - `/\b(director brief|daily brief|academy brief|status report)\b/` → ✅
- → `buildDirectorBriefSummary(ctx)`

**Output with ctx (pendingReviews=3, missingWrapUps=0, highRisk=0, todaySessions=5):**
```
Here's your academy status:

1. 3 items in the Review Queue.
2. 5 sessions scheduled today.

Best next step: Clear your Review Queue — coaches and players are waiting on your decisions.

Nothing is applied until you approve it.
```

**Expected:** ✅ Structured brief with all items.

---

### Scenario 3 — "What's pending?" ✅ PASS

**Trace:**
- `detectDashboardPriorityQuestion("what's pending")`:
  - `/what'?s? (pending|outstanding|in (the )?queue)/` → "what's pending" → ✅
- `detectBriefQuestion("what's pending")` → ✅
- → `buildDirectorBriefSummary(ctx)`

**Expected:** ✅ Structured brief.

---

### Scenario 4 — "What should I review first?" ✅ PASS

**Trace:**
- `detectDashboardPriorityQuestion("what should i review first")`:
  - `/what (should i|do i) review (first|today|now)/` → ✅
- `detectBriefQuestion("what should i review first")` → none of the brief patterns match → false
- → `buildDashboardPriorityResponse(ctx)` (single-action priority answer)

**Expected:** ✅ Single-action priority answer (appropriate for "what should I review FIRST").

---

### Scenario 5 — "What is most important right now?" ✅ PASS (existing)

**Trace:**
- `detectDashboardPriorityQuestion(...)` → `/(most important|highest priority|...)/` → ✅
- `detectBriefQuestion(...)` → false
- → `buildDashboardPriorityResponse(ctx)` (unchanged)

**Expected:** ✅ Single-action priority answer.

---

### Scenario 6 — "Academy status" ✅ PASS

**Trace:**
- `detectDashboardPriorityQuestion("academy status")` → `/\bacademy status\b/` → ✅
- `detectBriefQuestion("academy status")` → `/\bacademy status\b/` → ✅
- → `buildDirectorBriefSummary(ctx)`

**Expected:** ✅ Structured brief.

---

### Scenario 7 — "How is the academy doing?" ✅ PASS

**Trace:**
- `detectDashboardPriorityQuestion("how is the academy doing")` → `/how (is|are) (the |my |this )?academy doing/` → ✅
- `detectBriefQuestion(...)` → `/how (is|are) (the |my |this )?academy doing/` → ✅
- → `buildDirectorBriefSummary(ctx)`

**Expected:** ✅ Structured brief.

---

### Scenario 8 — All clear brief ✅ PASS

**Setup:** ctx with all counts = 0, todaySessions = 3

**Input:** "Give me a brief"
- → `buildDirectorBriefSummary(ctx)`
- `items = []`
- Returns: "Academy looks clear — nothing urgent right now. 3 sessions today. Good time to review curriculum coverage..."

**Expected:** ✅ Honest "all clear" response with session count.

---

### Scenario 9 — Page guide mode still works ✅ PASS

**Input:** "What needs approval?" on `/director/review`

**Trace:**
- Page guide intercept (step 6): `PAGE_APPROVAL` = `/what needs (approval|review|...)/` → matches "what needs approval" ✅
- Page guide returns `whatActionsRequireApproval('/director/review')` → review page approval guidance
- Dashboard priority intercept (step 10) never fires

**Expected:** ✅ Page guide takes priority for page-specific questions. No regression.

---

### Scenario 10 — Curriculum draft creation still works ✅ PASS

**Input:** "Add a drill for Orange 2 focused on forehand prep"

**Trace:**
- No dashboard priority patterns match "add a drill" → dashboard priority intercept doesn't fire
- Falls through to Sprint 912.8 drill creation handler ✅

**Expected:** ✅ No interference from Sprint 912.17 changes.

---

### Scenario 11 — No fake success states ✅ PASS

- `buildDirectorBriefSummary` is pure TypeScript — no DB calls, no mutations
- All numbers come directly from `directorCtx` which was loaded from the real DB at page render time
- Curriculum draft count is NOT included (no fake data for missing signals)
- `ctx.isLive ? 'Live data' : 'Demo data'` sourceNote is always accurate

**Expected:** ✅ No fabricated data anywhere.

---

## Safety Checks

| Check | Result |
|---|---|
| No migrations | ✅ |
| No new server actions | ✅ |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` usage | ✅ |
| Sprint 904 approve/reject untouched | ✅ |
| Sprints 912.3–912.16 behavior preserved | ✅ — only `directorDashboardDonnaAnswer.ts` changed |
| No fake data — "nothing is applied" always stated | ✅ |
| Data is from real DB (via `directorCtx`) | ✅ |
| TTS output will truncate correctly at ~300 chars | ✅ — `stripMarkdownForTts` handles numbered lists and blank lines |

---

## Files Changed

- **`src/lib/donna/directorDashboardDonnaAnswer.ts`:**
  - Extended `detectDashboardPriorityQuestion` with 8 new patterns for brief/status/pending queries
  - Added `detectBriefQuestion` (private helper) — sub-classifier distinguishing brief-style from priority-style
  - Added `buildDirectorBriefSummary` — structured numbered list of all active signals, with best-next-step and "nothing applied until approved" safety note
  - Updated `tryAnswerDashboardPriorityQuestion` to route via `detectBriefQuestion`: true → `buildDirectorBriefSummary`, false → `buildDashboardPriorityResponse` (unchanged)
  - No changes to `buildDashboardPriorityResponse` or any other existing function

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 912.17 changes.

---

## Known Limitations

### Limitation 1 — Curriculum drafts not in brief (documented)

`academy_curriculum_overrides` pending count is not in `directorCtx`. The brief does not include "2 curriculum drafts waiting for review." Directors can see this on the Curriculum Builder page. Adding this count to `directorCtx` requires extending `loadDirectorDonnaContext` — deferred to a future sprint.

### Limitation 2 — Player pending placements not in brief

`players.status = 'pending_placement'` count is not in `directorCtx`. The `/api/donna/brief` API queries this, but it's not wired to the conversation shell. Deferred.

### Limitation 3 — null-directorCtx with brief questions

If `directorCtx` is null (loading) and director says "give me a brief", the null-directorCtx guard (Sprint 912.13) doesn't catch it (only catches KPI/attention/advance patterns). It falls through to the generic fallback. Acceptable V1 — ctx loads quickly after page mount, and the director would typically ask after the page has loaded.

---

## Sprint 912.18 Recommendations

1. **DONNA Onboarding Guide Mode V1** — per the completion plan, add onboarding-page-specific guidance when director is on `/director/onboarding`. DONNA should greet with setup progress and guide to the next incomplete step. Low-risk additive change.
2. **Add curriculum draft count to `directorCtx`** — extend `loadDirectorDonnaContext` to query `academy_curriculum_overrides` WHERE `status IN ('pending_review', 'draft')`. Then include it in `buildDirectorBriefSummary`. Requires touching the context loader but no migration needed.
