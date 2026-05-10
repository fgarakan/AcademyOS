# Placement Engine — Current State Audit

Sprint 195 · 2026-05-10

---

## Overview

The placement engine spans three distinct entry points, all converging on a single activation gate: `finalize_player_placement()`. Each path has different levels of director control, audit trail, and UI surface.

---

## Entry Point A — Direct Manual Creation

**Route:** `/director/players/new`  
**Files:** `NewPlayerForm.tsx`, `createPlayerAction.ts`

- Director fills in first name, last name, date of birth, optional gender and notes.
- `createPlayerAction` inserts directly into `players` with `status: 'pending_placement'`.
- `full_name` is a generated column (`first_name || ' ' || last_name`).
- `join_date` defaults to `CURRENT_DATE`.
- No `proposed_actions` row created. No audit trail beyond the insert itself.
- After creation, redirects to the player profile page.
- Player enters the placement queue at `/director/placement`.

**Next required step:** Director must go to `/director/placement` to create a `placement_recommendations` row and activate.

---

## Entry Point B — Unknown Session Attendee (Voice / Attendance Flow)

**Route:** `/director/review` → Placement Review + Placement Intake tabs  
**Pipeline:** `proposed_actions` table, five sequential stages

### Stage 1 — Placement Review
- **Table:** `proposed_actions` (`target_module: 'placement_review'`)
- **Card:** `PlacementReviewCard.tsx`
- **Statuses:** `pending_review` (needs action), `clarification_needed` (Follow-Up Later)
- **Director choices:**
  - Start Placement Intake → creates intake candidate (`startPlacementIntakeFromReviewAction`)
  - Follow-Up Later → sets status to `clarification_needed` (`markPlacementReviewFollowUpLaterAction`)
  - Not a Fit / Dismiss → marks as dismissed (`dismissPlacementReviewDraftAction`)
- No player record created at this stage.

### Stage 2 — Intake Candidate
- **Table:** `proposed_actions` (`target_module: 'placement_intake_candidate'`)
- **Card:** `PlacementIntakeCandidateCard.tsx`
- **Status:** `pending_review`
- **Director choices:**
  - Start Placement Assessment → creates assessment draft (`startPlacementAssessmentDraftAction`)
  - Dismiss Candidate → marks as dismissed (`dismissIntakeCandidateAction`)
- No player record created.

### Stage 3 — Assessment Draft
- **Table:** `proposed_actions` (`target_module: 'placement_assessment_draft'`)
- **Card:** `PlacementAssessmentDraftCard.tsx`
- **Status:** `pending_review` → `executed` (after recommendation generated)
- **Editable fields:** player identity (first/last/DOB/gender), age band, ball color, skill observations, movement observations, competitive readiness, recommended next step.
- **Director actions:**
  - Save Assessment Draft (`saveAssessmentDraftAction`) — updates payload, no status change
  - Generate Placement Recommendation (`generatePlacementRecommendationDraftAction`) — creates Stage 4 row, marks this row `executed`

### Stage 4 — Recommendation Draft
- **Table:** `proposed_actions` (`target_module: 'placement_recommendation_draft'`)
- **Card:** `PlacementRecommendationDraftCard.tsx`
- **Statuses:** `pending_review` → `approved` → `executed`
- **Recommendation generation:** fully deterministic (no AI, no external calls). Helper functions derive current level from ball color, starting pathway from ball color + age band, skill priority from skill observations, group type from competitive readiness, and confidence from completeness of assessment fields.
- **Director choices (pending):**
  - Approve Recommendation → requires group selector; sets `status: 'approved'` (`approveRecommendationDraftAction`)
  - Override → edits payload fields + group selector → sets `status: 'approved'` with director overrides (`overrideRecommendationDraftAction`)
  - Reject → sets `status: 'rejected'` (`rejectRecommendationDraftAction`)
- **After approval:** "Create Player Profile" button appears.

### Stage 5 — Player Creation
- **Action:** `createPlayerFromApprovedRecommendationAction`
- Validates identity fields (first/last/DOB must be set)
- Validates group UUID is still active
- Inserts player into `players` table
- Stamps `created_player_id` on payload (idempotency guard) before further steps
- Creates `placement_recommendations` row with `status: 'approved'`
- Calls `finalize_player_placement(p_recommendation_id, p_activator_id)` — the only activation gate
- Marks `proposed_action` as `executed`
- Writes `audit_logs` row (`action: 'placement_recommendation.player_created'`)

All five stages are director-gated. No player record, roster entry, billing, or parent communication is created until Stage 5.

---

## Entry Point C — Existing Pending Player (Direct Placement Engine)

**Route:** `/director/placement`  
**Files:** `page.tsx`, `PlacementEngineClient.tsx`, `placementDraftAction.ts`

- Shows players with `status IN ('pending_placement', 'placement_in_progress', 'pending_approval')`.
- Fetches `placement_recommendations` with `status IN ('draft', 'generated', 'approved')`.
- Per-player flow:
  1. Create draft: `createPlacementDraftAction` → inserts into `placement_recommendations` with `status: 'generated'`, sets `recommended_group_id`, `recommended_track`, optional `recommended_level_id` and `recommendation_rationale`.
  2. Approve: `approvePlacementDraftAction` → sets `status: 'approved'`, stamps `approved_by` and `approved_at`.
  3. Activate: `activatePlayerAction` → calls `finalize_player_placement()` RPC.

Note: This path does NOT go through `proposed_actions`. It writes directly to `placement_recommendations`. There is no review audit trail in the proposed_actions pipeline for this flow.

---

## Activation Gate

`finalize_player_placement(p_recommendation_id, p_activator_id)` is the only function that activates a player. Called from:
- `activatePlayerAction` (Entry Point C)
- `createPlayerFromApprovedRecommendationAction` (Entry Point B, Stage 5)

Expected effects (verified in `PlacementRecommendationDraftCard` success state):
- `players.status` set to `active`
- Group assigned
- `group_memberships` row created (`is_current = true`)
- `placement_recommendations.status` set to `activated`
- Audit log written: `player.placement.finalized`

---

## Post-Activation Review

**Route:** `/director/players/onboarding-review`

Checklist for active players:
1. Curriculum Level — `player_curriculum_states` row with `academy_id` + `player_id`
2. Group Assignment — `group_memberships.is_current = true` OR `players.current_group_id` non-null
3. Development Profile — `player_development_summary` with non-empty strengths or things_to_work_on
4. Current Priority — `player_priorities.is_active = true`

Note: Curriculum level is explicitly NOT set at placement. It is assigned separately via the Skill Path tab on the player profile.

---

## Backend Utility Layer

`src/lib/backend/assessments.ts` exports:
- `createAssessment` — inserts into `assessments` table (not used in placement pipeline currently)
- `getPlayerAssessments` — reads assessments for a player
- `getPlacementRecommendations` — joins `placement_recommendations` with `players` and `assessments`
- `finalizePlacement` — wraps `finalize_player_placement()` RPC (not called from placement UI; UI uses the action functions directly)

---

## Known Gaps / Phase 2 Targets

1. **Curriculum level not set at placement.** The `PlacementRecommendationDraftCard` explicitly warns: "Assign via the Skill Path tab on the player profile." Phase 2 could add optional curriculum level selection in the `/director/placement` flow.

2. **Entry Point C bypasses `proposed_actions`.** Players added via `/director/players/new` go through a direct `placement_recommendations` path with no proposed_actions audit trail. This is intentional for speed but deviates from the voice-first operating model. Phase 2 could optionally route this through proposed_actions for consistency.

3. **No `track` field in Entry Point B.** `createPlacementDraftAction` (Entry Point C) accepts a `track` parameter. `createPlayerFromApprovedRecommendationAction` (Entry Point B) inserts into `placement_recommendations` without a `recommended_track` field. Phase 2 should surface track selection in the recommendation flow if tracks are used.

4. **Development intake is a separate, unguided step.** After activation, there is no prompt directing the director to complete development intake. Phase 2 could add a "next step" CTA on the player profile pointing to development intake when no development summary exists.

5. **No parent/player portal onboarding.** Out of scope by design but should be documented as a Phase 3 item.

6. **`placement_recommendations` also exists in assessment backend** but `getPlacementRecommendations` in `assessments.ts` is not currently used by any UI component — it is a utility for future reporting or AI agent use.

---

## File Map

| File | Purpose |
|---|---|
| `src/app/director/players/new/NewPlayerForm.tsx` | Entry Point A form |
| `src/app/director/players/new/createPlayerAction.ts` | Entry Point A server action |
| `src/app/director/placement/page.tsx` | Entry Point C server component |
| `src/app/director/placement/PlacementEngineClient.tsx` | Entry Point C client |
| `src/app/director/placement/placementDraftAction.ts` | Entry Point C server actions |
| `src/app/director/review/PlacementReviewCard.tsx` | Entry Point B Stage 1 card |
| `src/app/director/review/PlacementIntakeCandidateCard.tsx` | Entry Point B Stage 2 card |
| `src/app/director/review/PlacementAssessmentDraftCard.tsx` | Entry Point B Stage 3 card |
| `src/app/director/review/PlacementRecommendationDraftCard.tsx` | Entry Point B Stage 4–5 card |
| `src/app/director/review/actions.ts` | All review queue server actions (incl. placement pipeline) |
| `src/app/director/players/onboarding-review/page.tsx` | Post-activation readiness check |
| `src/app/director/players/development-intake/` | Post-activation development intake |
| `src/lib/backend/assessments.ts` | Backend utilities (placement_recommendations, assessments) |
