# Player Onboarding Workflow Certification V1

**Date:** 2026-06-02
**Sprint:** Player Onboarding Workflow Certification V1
**Scope:** Full add-player → onboarding stepper → activation loop

---

## Certification Checklist

| # | Check | Status | Notes |
|---|---|---|---|
| 1 | DONNA recognizes "add a new player" | **FIXED** | Added `add_player` intent to `donnaGlobalIntentRouter.ts` with patterns matching: add player, add a new player, create player, onboard player, new student, register player |
| 2 | DONNA routes to /director/players/new | **FIXED** | Added `go_to_add_player` navigation action in `donnaActionProposalEngine.ts`. DONNA answers with guidance message and renders an "Add New Player" button that links to `/director/players/new` |
| 3 | Add Player form works with no full_name insert error | **PASS** | `createPlayerAction.ts` builds `fullName = \`${firstName} ${lastName}\`` and inserts it. DB type has `full_name?: string \| null` (optional insert). No type conflict. |
| 4 | New player redirects to /director/players/[playerId]/onboard | **PASS** | `createPlayerAction` calls `redirect(\`/director/players/${inserted.id}/onboard\`)` after successful insert. |
| 5 | Stepper shows correct current step | **FIXED** | `computeInitialStep` previously returned `3` for brand-new players (no assessment). Changed to return `1` so directors land on Step 1 (Profile) and see DONNA's "Confirm the player details look right" commentary before proceeding. |
| 6 | Parent / Contact step does not break flow | **PASS** | Step 2 renders guardian count (shows "0 guardians" empty state for new players) + a link to the player profile to add contacts. "Next" navigation continues normally. |
| 7 | Starting Assessment saves correctly | **PASS** | `quickAssessmentAction` inserts into `assessments` table with correct `academy_id` scoping and role check (director or head_coach). Returns `assessmentId` on success. `StepAssessment` transitions to done state and calls `onDone()`. |
| 8 | DONNA Recommendation appears | **PASS** | `StepDonnaRecommendation` calls `generatePlacementRecommendation` from `src/lib/blueprint/placementRecommendationEngine.ts` (client-side, deterministic). Renders explanation + confidence tier + suggested group + top reasons. If no assessment: shows "Complete assessment first" message with Skip option. |
| 9 | Placement Review can confirm placement | **PASS** | `StepDirectorReview` → `onboardingPlacementAction` → `createPlacementDraftAction` (inserts `placement_recommendations` with `status: 'generated'`) → `approvePlacementDraftAction` (updates to `status: 'approved'`). Both steps scoped to `academy_id`. Director group selection persists. |
| 10 | Activate Player works | **PASS** | `StepActivatePlayer` → `activatePlayerAction` → `supabase.rpc('finalize_player_placement', ...)`. RPC is the only activation path (architecture red line). After success: `generateBlueprintAction` fires (fire-and-forget, non-blocking). |
| 11 | Player profile reflects active status | **PASS** | `activatePlayerAction` calls `revalidatePath('/director/players/${rec.player_id}')` and `revalidatePath('/director/players')`. Player status is set to `active` by the RPC. `StepActivatePlayer` renders success state with link to full player profile. |
| 12 | Evidence/placement/assessment records created correctly | **PASS** | Assessment → `assessments` table. Placement draft → `placement_recommendations` (generated → approved). Activation → RPC mutates player status. Blueprint → `player_development_blueprints` (generated async). All writes are audit-logged. |
| 13 | Review Center still loads | **PASS** | `npx tsc --noEmit` clean before and after sprint. Review page imports are intact. No changes to review queue files. |
| 14 | TypeScript clean | **PASS** | Verified clean before sprint. All changes type-safe: `add_player` added to `DonnaIntent` union, follow-up entry added to `Record<DonnaIntent, string[]>`, `go_to_add_player` added to `ACTIONS` record. |

---

## Fixes Applied

### Fix 1 — DONNA `add_player` intent
- **File:** `src/lib/donna/donnaGlobalIntentRouter.ts`
- **Change:** Added `'add_player'` to `DonnaIntent` union. Added `IntentPattern` with 6 regex patterns and 7 keywords in the `navigation_action` category.
- **Patterns:** `add player`, `add a new player`, `create player`, `onboard player`, `new student`, `register player`

### Fix 2 — DONNA `go_to_add_player` action
- **File:** `src/lib/donna/donnaActionProposalEngine.ts`
- **Change:** Added `go_to_add_player` action (type: `navigate`, risk: `low`, href: `/director/players/new`). Wired `add_player` → `['go_to_add_player']` in `INTENT_ACTIONS`.

### Fix 3 — DONNA command handler for `add_player`
- **File:** `src/app/director/_actions/donnaGlobalCommandAction.ts`
- **Change:** Added `add_player` case in the answer switch with the required guidance message. Added `add_player` entry to the `Record<DonnaIntent, string[]>` follow-up table (required by TypeScript exhaustive check).

### Fix 4 — DONNA guidance banner on new player page
- **File:** `src/app/director/players/new/page.tsx`
- **Change:** Added static DONNA guidance panel (lime border, Sparkles icon) between the page header and the form card. Message: "Let's add the player's basic information first. After that, I'll guide you through parent contact, assessment, placement, and activation."

### Fix 5 — Stepper initial step for brand-new players
- **File:** `src/app/director/players/[playerId]/onboard/page.tsx`
- **Change:** `computeInitialStep` returned `3` for players with no assessment. Changed to return `1`. New players now land on Step 1 (Profile) and see DONNA's "Confirm the player details look right before moving on" commentary — which was previously unreachable on first visit.

---

## Architecture Compliance

- No automatic player creation from voice — DONNA navigates only
- `finalize_player_placement()` is the sole activation path — no bypass
- All placement writes go through `placement_recommendations` table
- All assessment writes go through `assessments` table
- No parent or player portal access created at any point in the flow
- No billing, enrollment, or communications triggered
- `academy_id` scoped on every DB query in the flow

---

## Known Gaps (not fixed in this sprint)

- If no active groups exist in the academy, Step 5 (Placement Review) shows an empty state with no clear next action. Directors must create groups from academy setup first.
- Step 2 (Parent/Contact) links to the player profile for guardian adding. Guardian can only be linked from the full profile — there is no inline guardian entry in the stepper.
- `generateBlueprintAction` (called after activation) is fire-and-forget. Blueprint generation errors do not surface to the director in the stepper UI.
- The onboarding stepper does not have an error boundary — uncaught errors in step components will bubble to the nearest parent boundary (`/director/error.tsx`).
