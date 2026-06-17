# DONNA Academy Setup Consolidation V1 Report

**Sprint:** Mega Sprint 2961–2970  
**Date:** 2026-06-17  
**Mission:** Eliminate duplicate Academy Setup flows. One onboarding path. One settings path. DONNA routes correctly based on runtime state.

---

## Audit Summary

The audit (pre-sprint) found three parallel paths where "Academy Setup" existed:

| Path | Mechanism | Status |
|---|---|---|
| `/onboarding` → `/director/onboarding/*` | 7-step canonical onboarding wizard | **Canonical — preserved** |
| `/director/setup` DONNA goal session | 10-question `donna_setup_draft` interview | **Retired** |
| `/director/settings` | Post-onboarding editor | **Preserved — canonical for edits** |

The duplicate DONNA path (`AcademySetupDonnaBanner` + `donna_setup_draft` + `donnaSaveAcademySetupDraftAction` + `approveDonnaAcademySetupDraftAction`) was already orphaned — `/director/setup/page.tsx` contained only `redirect('/director/onboarding')` and never mounted the banner. But DONNA engines still routed to `/director/setup` as a canonical URL, and the `academy_setup_completion` guided workflow still launched a 10-question DONNA interview that wrote to a third data store.

---

## Canonical Setup Decision

**Initial setup:** Academy Onboarding (`/director/onboarding` and sub-routes)  
**Post-onboarding edits:** Academy Settings (`/director/settings`)  
**DONNA routing:** `processDonnaMessage` Step 0.25 — runtime intercept based on `onboardingComplete` prop

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/donna/brain/donnaBrainDebugLog.ts` | Added `'check_setup_routing'` to `BrainRoutingStep` union |
| `src/lib/donna/brain/processDonnaMessage.ts` | Added `onboardingComplete?: boolean` to `DonnaMessageInput`; added Step 0.25 setup routing intercept |
| `src/components/assistant/DonnaAssistantButton.tsx` | Added `onboardingComplete?: boolean` prop; threaded into `processDonnaMessage()` call |
| `src/app/director/layout.tsx` | Passed `onboardingComplete={!onboardingIncomplete}` to `<DonnaAssistantButton />` |
| `src/lib/donna/coo/donnaDailyCooIntelligenceEngine.ts` | Stale `route: '/director/setup'` → `'/director/onboarding'`; updated `recommendedAction` text |
| `src/lib/donna/setup/donnaAcademySetupCompletionEngine.ts` | Stale `Navigate to /director/setup` → `Navigate to /director/onboarding` |
| `src/lib/donna/donnaMissingContextEngine.ts` | `label: 'Academy Setup'` → `'Academy Onboarding'` |
| `src/lib/donna/guidedCompletion/guidedCompletionRegistry.ts` | Removed `/director/setup` from `pageRoutes`; updated `label` → `'Academy Onboarding'`; updated `openingMessage`, `endGoal`, `safeActions`, `approvalGatedActions` |
| `src/lib/donna/intent/donnaClarificationEngine.ts` | `SETUP_OPTIONS` label `'Finish academy setup'` → `'Continue Academy Onboarding'` |
| `src/app/director/_components/TodaySetupCard.tsx` | Header label `"Academy Setup"` → `"Academy Onboarding"` |
| `src/app/director/setup/AcademySetupDonnaBanner.tsx` | Added `@deprecated` block comment — orphaned, V2 deletion candidate |
| `src/app/director/_actions/donnaSaveAcademySetupDraftAction.ts` | Added `@deprecated` block comment — orphaned, V2 deletion candidate |
| `src/app/director/_actions/approveDonnaAcademySetupDraftAction.ts` | Added `@deprecated` block comment — orphaned, V2 deletion candidate |
| `docs/CHANGELOG.md` | Sprint entry added |

---

## Files Created

| File | Description |
|---|---|
| `src/lib/donna/setup/academySetupConsolidationCertification.ts` | 18-assertion certification harness |
| `docs/donna/ACADEMY_SETUP_CONSOLIDATION_V1_REPORT.md` | This document |

---

## Duplicate Setup Systems Found and Resolved

### 1. Stale `/director/setup` route references (4 instances)

All four DONNA engines that referenced `/director/setup` as a canonical route have been updated:

| Engine | Was | Now |
|---|---|---|
| `donnaDailyCooIntelligenceEngine.ts` | `route: '/director/setup'` | `route: '/director/onboarding'` |
| `donnaAcademySetupCompletionEngine.ts` | `Navigate to /director/setup` (text) | `Navigate to /director/onboarding` |
| `guidedCompletionRegistry.ts` | `/director/setup` in `pageRoutes` | Removed |
| `donnaMissingContextEngine.ts` | `label: 'Academy Setup'` | `label: 'Academy Onboarding'` |

Note: `/director/setup/page.tsx` itself is not modified — it correctly contains only `redirect('/director/onboarding')` and serves as a permanent redirect for any bookmarked or cached links.

### 2. `academy_setup_completion` guided workflow

The 10-question DONNA interview (`donna_setup_draft`) has been retired:
- **`triggerPhrases: []`** — cleared entirely. No code reads `.triggerPhrases` at runtime (confirmed by grep). Declaring ownership of setup phrases while Step 0.25 owns them was a false authority. Routing authority comment added: _"Academy setup routing is owned exclusively by processDonnaMessage Step 0.25."_
- `requiredSteps` behavior is bypassed — Step 0.25 intercepts before Step 0b (goal session start) for all setup phrases
- `openingMessage` updated to routing-only message
- `safeActions` and `approvalGatedActions` updated — `'save academy setup draft to the database'` removed
- `label` updated from `'Academy Setup'` to `'Academy Onboarding'`

### 3. `AcademySetupDonnaBanner` + `donna_setup_draft` server actions

All three files marked `@deprecated` with clear V2 deletion instructions. Import audit confirmed they are not imported by any active code path.

---

## DONNA Command Behavior (Post-Sprint)

| Director says | Onboarding state | DONNA response | Route |
|---|---|---|---|
| "Help me finish academy setup" | Incomplete | "Let's continue Academy Onboarding." | `/director/onboarding` |
| "Help me finish academy setup" | Complete | "Academy setup is complete. You can edit details in Academy Settings." | `/director/settings` |
| "Finish setup" | Incomplete | "Let's continue Academy Onboarding." | `/director/onboarding` |
| "Set up my academy" | Complete | "Academy setup is complete. You can edit details in Academy Settings." | `/director/settings` |
| "Walk me through academy setup" | Incomplete | "Let's continue Academy Onboarding." | `/director/onboarding` |

**Implementation:** `processDonnaMessage.ts` Step 0.25 intercepts before Step 0b (goal workflow intent detection). Onboarding state flows from `director/layout.tsx` (which already computed `onboardingIncomplete` from 7 DB flags) → `DonnaAssistantButton` prop `onboardingComplete` → `processDonnaMessage` input field `onboardingComplete`.

---

## Data Duplication Risk

**Pre-sprint:** Three parallel stores for the same logical concept:
1. `academies.settings.academy_dna` — written by `/onboarding`
2. `academies.settings.director_interview_completed` — written by `/director/onboarding/interview`
3. `academies.settings.donna_setup_draft` — written by `donnaSaveAcademySetupDraftAction` (now orphaned)

**Post-sprint:** `donna_setup_draft` is no longer writable from any live setup flow. No new writes can reach it — the intercept prevents the DONNA goal session from starting, and the Banner component that called the write action is orphaned and deprecated. The two canonical stores (1 and 2) remain as-is — no data model changes made.

**Remaining risk:** Existing `donna_setup_draft` rows in the database are inert — no UI reads or acts on them. They can be cleared via Supabase dashboard when convenient (future V2 migration candidate).

---

## Deprecated Paths (V2 Deletion Candidates)

| File | Reason | Safe to delete when |
|---|---|---|
| `src/app/director/setup/AcademySetupDonnaBanner.tsx` | Orphaned — never rendered | `/director/setup/page.tsx` is confirmed to contain only redirect |
| `src/app/director/_actions/donnaSaveAcademySetupDraftAction.ts` | Orphaned — Banner is its only caller | Banner is confirmed deleted |
| `src/app/director/_actions/approveDonnaAcademySetupDraftAction.ts` | Orphaned — Banner is its only caller | Banner is confirmed deleted |

---

## Certification Results

**18/18 assertions — 100% PASS**

| Section | Assertions | Result |
|---|---|---|
| 1 — `/director/setup` removed from `pageRoutes` | 2 | ✓ |
| 2 — Workflow label renamed to `'Academy Onboarding'` | 1 | ✓ |
| 3 — `openingMessage` updated (no 10-question interview language) | 2 | ✓ |
| 4 — Brain routes to `/director/onboarding` when incomplete | 2 | ✓ |
| 5 — Brain routes to `/director/settings` when complete | 3 | ✓ |
| 6 — Phrase variant coverage (6 phrases tested) | 6 | ✓ |
| 7 — `donna_setup_draft` write removed from `approvalGatedActions` | 1 | ✓ |
| 8 — Runtime type contract | 1 | ✓ |

**TypeScript:** Clean — `npx tsc --noEmit` passes with 0 errors.

---

## Duplicate Routing Authority — Final Status

### Pre-commit audit (2026-06-17)

Three separate "workflow" systems were found to reference `academy_setup_completion`:

| System | File | Status |
|---|---|---|
| `GuidedCompletionWorkflow.triggerPhrases` | `guidedCompletionRegistry.ts` | **Cleared — `triggerPhrases: []`**. No code reads this field at runtime. Declaring ownership of setup phrases while Step 0.25 owns them was a false authority. |
| `GoalWorkflow.triggerIntents` (`onboarding_completion`) | `donnaWorkflowRegistry.ts` | Minor overlap — "finish setup", "complete my setup" appear here too, but Step 0.25 fires before Step 0b reaches `detectGoalWorkflowIntent`. `onboarding_completion` routes to `/director` (not the DONNA draft path). Not a competing setup authority. |
| `GoalType` weight | `donnaGoalEngine.ts` | Read-only priority weight. Never triggers independently. Already has `route: '/director/onboarding'`. |

**Conclusion:** No duplicate routing authority remains. `processDonnaMessage` Step 0.25 is the single authority for all academy setup routing decisions.

---

## Remaining Gaps

1. **`donna_setup_draft` DB rows are inert but not removed.** No UI reads them, but they exist in the DB. Safe to leave; clear in a future migration.

2. **`/director/setup/page.tsx`** is not modified — it contains only a redirect. It could be deleted in V2 but preserving it protects any bookmarked or cached links.

---

## Recommended Next Sprint

**Sprint 2971–2975 — Academy Setup V2 Cleanup**

Safe deletions (after pilot confirms no one hits `/director/setup` directly):
- Delete `AcademySetupDonnaBanner.tsx`
- Delete `donnaSaveAcademySetupDraftAction.ts`
- Delete `approveDonnaAcademySetupDraftAction.ts`
- Optional: delete `/director/setup/page.tsx` and add middleware redirect
- Optional: add a Supabase migration to clear stale `donna_setup_draft` settings keys

This is a clean-up sprint with zero product risk — all deprecated code is already unreachable.
