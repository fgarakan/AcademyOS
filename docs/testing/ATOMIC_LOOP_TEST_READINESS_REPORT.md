# Atomic Loop Test Readiness Report

**Mega Sprint 3331–3360**
**Date:** 2026-06-20
**Certification:** `src/lib/donna/certification/atomicLoopUsabilityCertification.ts` → **60/60 checks, 10/10 loops fully ready.**

---

## Test readiness: **READY — test now**

All 10 atomic loops pass the 6 structural checks (route exists · primary action · DONNA guidance · completion path · approval guardrails where required · no fake completion). `npx tsc --noEmit` is clean. No blockers prevent a hands-on pilot.

## Loops — pass/fail

| # | Loop | Checks | Status | Notes |
|---|---|--------|--------|-------|
| 1 | Academy Setup | 6/6 | ✅ ready | Stepwise wizard saves to academy profile; 3 setup modes are clearly deferred |
| 2 | Curriculum Builder | 6/6 | ✅ ready | Edits → drafts → review (approval-first) |
| 3 | Template Builder | 6/6 | ✅ ready | Wizard → `saveClassTemplateDraftFromWizardAction` draft |
| 4 | Session Creation | 6/6 | ✅ ready | Real write + audit; redirect to session |
| 5 | Coach Assignment | 6/6 | ✅ ready | ⚠️ No dedicated reassignment screen — via onboarding + session creation |
| 6 | Coach Wrap-Up | 6/6 | ✅ ready | Submit → `proposed_actions` (pending_review); review-first |
| 7 | Player Assessment | 6/6 | ✅ ready | Quick/studio assessment; no auto level movement |
| 8 | Placement / Readiness | 6/6 | ✅ ready | Draft → approve → activate via `finalize_player_placement()` |
| 9 | Parent Portal / Parent Update | 6/6 | ✅ ready | Update is draft → review (never auto-sent); parent-safe portal |
| 10 | Director Approvals | 6/6 | ✅ ready | Two-step approve→apply; `assertNotPreviewMode` + audit |

## Blockers

**None blocking the pilot.** Issues found and handled this sprint:

| Item | Severity | Status |
|---|---|---|
| Coach DONNA "Review Queue" quick-action linked to `/director/review` (middleware-blocked for coaches) | Medium (dead link) | **Fixed** → `/coach/sessions` ("My Sessions") |
| Coach recap panel linked "View in Director Review Queue" → `/director/review` (dead for coaches) | Low (dead link) | **Fixed** → `/coach/sessions` ("View your sessions") |

## Known limitations (not blockers — documented)

| Item | Severity | Recommendation |
|---|---|---|
| Coach Assignment has no dedicated reassignment screen | Low | Future: a focused coach-group assignment view (do not build during pilot) |
| Exception playbooks (Sprint 3301–3330) don't name the specific affected entities | Low | "DONNA Operating Specificity V1" (wiring) |
| Durable learning persistence absent (in-memory) | Medium (future) | Migration-gated sprint (proposed) |

## Files needing next work (post-pilot, not for this sprint)

- `src/app/director/coaches/page.tsx` — add a focused coach-group assignment action (Loop 5 polish).
- `src/lib/donna/brain/donnaOperatingDay.ts` — per-exception live entity lookups.
- `supabase/migrations/` + `src/lib/donna/learning/*` — durable learning persistence (needs migration approval).

## Recommendation

**Test now.** Run the hands-on pass using `ATOMIC_LOOP_USABILITY_TEST_PLAN.md` (internal) and `BRIAN_DABUL_PILOT_TEST_SCRIPT.md` (Brian). Capture DONNA-quality and cognitive-load scores per loop; feed blockers (if any surface in live data) back into a focused fix sprint before wider rollout.
