# QA — DONNA Onboarding Guide Mode V1
**Sprint:** 912.18
**Date:** 2026-05-28
**Method:** Static code analysis of Sprint 912.18 implementation
**Code analysed:**
- `src/lib/donna/donnaOnboardingGuideAnswer.ts` (NEW)
- `src/components/donna/DonnaVoiceReadyShell.tsx`
- `src/lib/donna/donnaMissingContextEngine.ts`

---

## Part 1 — Existing Onboarding Coverage (Pre-Sprint)

`donnaMissingContextEngine.ts` already handles:

| Pattern | Response |
|---|---|
| "walk me through setup", "onboarding", "getting started", "how to start", "where do I begin" | Offers to navigate to `/director/onboarding` |
| "add coaches", "coach setup", "no coaches" | Offers to navigate to `/director/onboarding/coaches-permissions` |
| "curriculum setup", "curriculum structure", "no curriculum" | Offers to navigate to `/director/onboarding/curriculum` |
| "add players", "player placement" | Offers to navigate to `/director/onboarding/players-placement` |
| "session template", "create a template", "no templates" | Offers to navigate to `/director/templates` |

**Gap:** `detectMissingContext` handles NAVIGATION questions (offering to take the director somewhere). Sprint 912.18 adds IN-PAGE guidance for when the director is already on an onboarding page, and progress/readiness questions not covered:
- "Am I ready to launch?"
- "What is left in setup?"
- "Setup checklist"
- "What is this setup step?"

---

## Part 2 — Supported Phrases

### Always-fire patterns (any page)

| Phrase | `SETUP_PROGRESS_PATTERNS` match |
|---|---|
| "Setup checklist" | `setup checklist` ✅ |
| "Onboarding checklist" | `onboarding checklist` ✅ |
| "What is left in setup?" | `what...left...setup` ✅ |
| "What is remaining to complete?" | `what...remaining...to complete` ✅ |
| "Am I done with setup?" | `am i done` ✅ |
| "Am I ready to launch?" | `am i ready to launch` ✅ |
| "Are we ready to go live?" | `are we ready to go live` ✅ |
| "How close am I to being done?" | `how close...done` ✅ |
| "All setup steps complete?" | `all setup steps complete` ✅ |
| "What do I need to complete before launch?" | `what...need...complete...before...launch` ✅ |
| "Finished setup" / "Is setup done?" | `setup done` / `setup finished` ✅ |

### Page-gated patterns (only on `/director/onboarding/*`)

| Phrase | `STEP_EXPLAIN_PATTERNS` match |
|---|---|
| "What is this step?" | `what is this step` ✅ |
| "What is this stage for?" | `what...stage...for` ✅ |
| "Explain this section" | `explain this section` ✅ |
| "What do I fill in here?" | `what do i fill in here` ✅ |
| "Help with this step" | `help...this step` ✅ |
| "What am I doing on this page?" | `what...am i...doing...on this` — does NOT match (needs explicit step/phase/section word) ❌ (falls through to page guide) |

---

## Part 3 — Response Routing

```
detectOnboardingProgressQuestion(text, pathname)
  → false: falls through to null-directorCtx guard → KPI → dashboard priority → ...
  → true:
      buildOnboardingProgressAnswer(directorCtx, pathname)
        /interview         → buildInterviewStepAnswer()
        /onboarding/curriculum → buildCurriculumSetupStepAnswer(ctx)
        /players-placement → buildPlayerPlacementStepAnswer(ctx)
        /coaches-permissions → buildCoachSetupStepAnswer(ctx)
        /programs-groups   → buildProgramsGroupsStepAnswer()
        /onboarding (general) → buildGeneralOnboardingAnswer(ctx)
```

### Pipeline position

```
1.  Pending confirmation
2.  Orphaned confirm guard
3.  Slot-fill handler
4.  Nav offer
5.  Boundary check
6.  Page guide (Sprint 912.14)
7.  Missing context (Sprint 725) ← handles navigation-offer onboarding questions
8.  null-directorCtx guard (Sprint 912.13)
9.  ← NEW: Onboarding Guide Mode (Sprint 912.18) ← handles progress/readiness questions
10. KPI intercept
11. Dashboard priority
...
```

---

## Part 4 — Data Source

All signals come from `DirectorDonnaContext` (loaded from real DB at page render):

| Signal | Field | Used for |
|---|---|---|
| Players added? | `ctx.playerCount > 0` | Infer player placement complete |
| Coaches added? | `ctx.coachCount > 0` | Infer coach setup complete |
| Templates exist? | `ctx.templateCount > 0` | Infer templates created |
| Curriculum gaps? | `ctx.curriculumGaps.length` | Infer curriculum complete |
| First-time setup? | `ctx.isFirstTimeSetup` | Not directly used (counts are more specific) |
| Demo/live mode | `ctx.isLive` | `[Demo]` prefix when demo |

**Important caveat (stated in responses):** These are count-based approximations, not the formal step-completion flags (`academy_identity_completed`, etc.). The on-screen progress checklist is authoritative.

**No fake data:** When `ctx` is null, response provides page-context guidance only — no fabricated counts.

---

## Manual/Static QA Scenarios

### Scenario 1 — "Am I ready to launch?" on /director/onboarding ✅ PASS

**Setup:** ctx with playerCount=12, coachCount=2, templateCount=4, curriculumGaps=[]

**Trace:**
- `detectOnboardingProgressQuestion("am i ready to launch", '/director/onboarding')`:
  - `SETUP_PROGRESS_PATTERNS.test("am i ready to launch")` → `am i...ready to launch` → ✅
- `buildOnboardingProgressAnswer(ctx, '/director/onboarding')`:
  - Not interview/curriculum/players/coaches/programs path → `buildGeneralOnboardingAnswer(ctx)`
  - `incomplete = []` (all counts positive, no gaps)
  - Returns "Setup signals look positive — 12 players, 2 coaches, 4 templates. Check the progress checklist..."

**Expected:** ✅ Honest all-signals-positive answer with caveat about on-screen checklist.

---

### Scenario 2 — "Setup checklist" on /director/donna ✅ PASS

**Setup:** ctx with playerCount=0, coachCount=1, templateCount=0, curriculumGaps=["Orange 2 — no drills"]

**Trace:**
- `detectOnboardingProgressQuestion("setup checklist", '/director/donna')`:
  - `SETUP_PROGRESS_PATTERNS.test("setup checklist")` → ✅
- `buildOnboardingProgressAnswer(ctx, '/director/donna')`:
  - Not onboarding sub-page → `buildGeneralOnboardingAnswer(ctx)`
  - `incomplete = ["add players", "resolve curriculum gaps", "create session templates"]`
  - Returns numbered list + "nothing complete until you confirm through setup screen"

**Expected:** ✅ Structured incomplete-steps list. Not on onboarding page but still gives useful guidance.

---

### Scenario 3 — "What is this step?" on /director/onboarding/interview ✅ PASS

**Trace:**
- `detectOnboardingProgressQuestion("what is this step", '/director/onboarding/interview')`:
  - `SETUP_PROGRESS_PATTERNS` → no match
  - `isOnboardingPath = true` → check `STEP_EXPLAIN_PATTERNS`
  - "what is this step" → `what is this (step|stage|phase|section)` → ✅
- `buildOnboardingProgressAnswer(ctx, '/director/onboarding/interview')`:
  - pathname includes '/interview' → `buildInterviewStepAnswer()`
  - Returns: "You're in the Academy Interview — 7 questions about your philosophy..."

**Expected:** ✅ Interview step explanation.

---

### Scenario 4 — "What is this step?" on /director/players (NOT an onboarding page) ✅ PASS

**Trace:**
- `detectOnboardingProgressQuestion("what is this step", '/director/players')`:
  - `SETUP_PROGRESS_PATTERNS` → no match
  - `isOnboardingPath = '/director/players'.startsWith('/director/onboarding')` → false
  - Returns false
- Falls through to page guide intercept (Sprint 912.14)
- `PAGE_WHERE_AM_I` → doesn't match "what is this step"
- Falls through to fallback

**Expected:** ✅ NOT caught by onboarding guide. Correctly falls through to other handlers.

---

### Scenario 5 — "Am I ready?" on /director/onboarding/players-placement ✅ PASS

**Setup:** ctx with playerCount=5

**Trace:**
- `detectOnboardingProgressQuestion("am i ready", '/director/onboarding/players-placement')`:
  - `SETUP_PROGRESS_PATTERNS.test("am i ready")` → `am i (done|ready|finished|complete)` → ✅
- `buildOnboardingProgressAnswer(ctx, '/director/onboarding/players-placement')`:
  - pathname includes '/players-placement' → `buildPlayerPlacementStepAnswer(ctx)`
  - `ctx.playerCount = 5` → "5 players are in the system."
  - Returns: "Player placement is where you activate players... 5 players are in the system. Confirm each player's starting curriculum level..."

**Expected:** ✅ Player placement-specific guidance with live count.

---

### Scenario 6 — "What is left in setup?" with no directorCtx ✅ PASS

**Setup:** `directorCtx = null` (loading)

**Trace:**
- `detectOnboardingProgressQuestion("what is left in setup")` → ✅
- `buildOnboardingProgressAnswer(null, '/director/onboarding')` → `buildGeneralOnboardingAnswer(null)`
- Returns: "Academy setup has five core areas: academy basics, curriculum structure, coaches + permissions, player placement, and session templates..."

**Expected:** ✅ Page-context guidance only, no fake counts, acknowledges no data.

---

### Scenario 7 — "Walk me through setup" — handled by detectMissingContext, NOT this engine ✅ PASS

**Trace:**
- `detectMissingContext("walk me through setup", ctx)` → `ONBOARDING_PATTERNS.test(...)` → ✅
- Returns before onboarding guide intercept fires (missing context is step 7, guide is step 9)

**Expected:** ✅ `detectMissingContext` handles this correctly. No conflict with Sprint 912.18.

---

### Scenario 8 — Page guide "What is this page?" on /director/onboarding ✅ PASS (unchanged)

**Trace:**
- `PAGE_WHERE_AM_I.test("what is this page")` → ✅ at step 6
- Returns `whereAmI('/director/onboarding')` — fires BEFORE onboarding guide

**Expected:** ✅ Page guide handles page-identity questions. No conflict.

---

### Scenario 9 — Director brief "Give me a brief" still works ✅ PASS (unchanged)

Sprint 912.17 `detectDashboardPriorityQuestion` catches "give me a brief" at step 11.
`detectOnboardingProgressQuestion("give me a brief", ...)` → SETUP_PROGRESS_PATTERNS → no match.

**Expected:** ✅ Director brief unaffected.

---

### Scenario 10 — Curriculum draft creation still works ✅ PASS (unchanged)

"Add a drill for Orange 2" → onboarding patterns don't match → falls through to Sprint 912.8 handler.

**Expected:** ✅ No interference.

---

### Scenario 11 — No fake setup completion ✅ PASS

Every response in `buildOnboardingProgressAnswer` either:
- States that counts are approximations, not formal step completion
- Says "the progress checklist on this page is authoritative"
- Explicitly says "I won't mark anything complete"

`buildGeneralOnboardingAnswer` does NOT call any mutation function. No `proposed_actions`, no DB writes. ✅

---

## Pattern Conflict Analysis

| Interceptor | Could conflict? | Analysis |
|---|---|---|
| `detectMissingContext` (step 7) | No — fires first for navigation offers | Step 7 catches "walk me through setup". Step 9 catches "am I ready". Different phrases. ✅ |
| `PAGE_APPROVAL` (step 6) | No | "am I ready" doesn't match "what needs approval". ✅ |
| Dashboard priority (step 11) | No — guide fires first (step 9) | "What's left in setup?" → onboarding guide. "What should I do first?" → dashboard priority. ✅ |
| KPI intercept (step 10) | No | KPI patterns don't match onboarding phrases. ✅ |
| Null-directorCtx guard (step 8) | No | Guard only catches kpi/attention/advance patterns. Onboarding patterns are distinct. ✅ |

---

## Safety Checks

| Check | Result |
|---|---|
| No migrations | ✅ |
| No new server actions | ✅ |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` usage | ✅ |
| Sprint 904 approve/reject untouched | ✅ |
| DONNA never marks setup steps complete | ✅ — every response explicitly defers to on-screen checklist |
| No fake data | ✅ — counts from directorCtx are labeled as approximations |
| Works with null directorCtx | ✅ — provides page-context guidance only |

---

## Files Changed

- **NEW `src/lib/donna/donnaOnboardingGuideAnswer.ts`:**
  - `detectOnboardingProgressQuestion(text, pathname)` — matches progress/readiness phrases (always) and step-explain phrases (onboarding pages only)
  - `buildOnboardingProgressAnswer(ctx, pathname)` — routes to sub-page-specific or general response
  - Sub-page responders: interview, curriculum setup, players placement, coaches permissions, programs/groups
  - General responder: infers incomplete areas from directorCtx counts, lists them, defers to on-screen checklist for authority

- **Modified `src/components/donna/DonnaVoiceReadyShell.tsx`:**
  - Added import: `detectOnboardingProgressQuestion`, `buildOnboardingProgressAnswer`
  - Added Sprint 912.18 onboarding guide intercept block at step 9 (after null-directorCtx guard, before KPI)
  - Fires for `plainRole === 'director'` regardless of directorCtx availability
  - Uses `pathname` for sub-page routing

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 912.18 changes.

---

## Known Limitations

### Limitation 1 — No formal step-completion state

`directorCtx` has count-based signals (`playerCount`, `coachCount`, etc.) but not the formal `academy_identity_completed`, `director_interview_completed`, etc. flags from `academy.settings`. DONNA infers from counts, not from official flags. A director who completed the interview step but has no players yet would still see "interview" missing from the incomplete list (count-based inference misses it).

**Mitigation:** Every response states "the progress checklist on this page is authoritative." DONNA does not claim certainty about step completion.

### Limitation 2 — STEP_EXPLAIN_PATTERNS are conservative

Phrases like "what am I doing on this page?" don't match `STEP_EXPLAIN_PATTERNS` (requires explicit step/stage/phase/section word). This is intentional — too-broad patterns would conflict with Sprint 912.14 page guide mode. Directors can ask "What is this step?" (matched) or "What is this page?" (caught by page guide).

---

## Sprint 912.19 Recommendations

1. **DONNA Review Queue Intelligence V1** — per the completion plan, add a `tryAnswerReviewQueueQuestion` intercept that breaks down the review queue by type (curriculum drafts, player proposals, wrap-ups) rather than just showing a total count.
2. **Add formal onboarding step flags to directorCtx** — query `academy.settings` in `loadDirectorDonnaContext` to get `academy_identity_completed`, `director_interview_completed`, etc. Then `buildGeneralOnboardingAnswer` can show authoritative step status instead of count-inferred status.
