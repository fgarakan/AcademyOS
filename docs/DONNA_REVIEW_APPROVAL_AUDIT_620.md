# Sprint 620 — DONNA Review/Approval Audit

**Date:** 2026-05-22
**Sprint:** 620
**Review/Approval Safety Score: 7 / 10**

---

## Architecture Overview

The review/approval architecture in AcademyOS follows a strict pipeline:

```
DONNA proposes
      ↓
proposed_actions row created (status: pending_review)
      ↓
Director sees item in /director/review
      ↓
Director approves or rejects
      ↓
execute_approved_action() or module-specific apply action executes
      ↓
audit_logs entry written
```

This architecture is sound. The review queue is the best-connected part of DONNA. The gaps identified below are incomplete wiring, not design failures.

---

## Review Queue Status

| Component | Status |
|---|---|
| `/director/review` route | Well-connected (score 9) |
| `/director/review/[actionId]` route | Well-connected (score 8) |
| `approve_review_item` action | implemented_and_wired |
| `reject_review_item` action | implemented_and_wired |
| `DonnaDraftCard` | Exists — renders static rationale |
| `DonnaReviewBriefPanel` | Exists |
| `DonnaReviewContextPanel` | Exists — on `/director/review/[actionId]` |
| `ReviewItemRouter` | Exists — routes to correct card type by action type |
| Approval sets proposed_actions.status | Yes — status = 'approved' |
| Execution is separate step from approval | Yes — architecture correctly separates approve and execute |
| Director-only visibility until approved | Yes — RLS enforced |

---

## Per-Action Type Audit

### level_review — Level Movement

| Check | Status |
|---|---|
| Backend draft path | Yes — `donnaLevelMovementActions.ts` |
| proposed_actions backed | Yes — target_module: 'level_review' |
| Review queue visible | Yes — `PlacementRecommendationDraftCard` renders |
| Director approve/reject | Yes |
| Apply path wired | **No** — `DonnaLevelMovementApplyControls` exists but is NOT wired to `DonnaDraftCard` in `/director/review`. Director must navigate away to apply. |
| Audit history | Yes — audit_logs written on apply |
| Rollback/undo | No — level movement has no rollback path |
| Parent/player visibility controlled | Yes — level change is director-internal until parent summary is drafted |

**Gap (P1):** Wire `DonnaLevelMovementApplyControls` to `DonnaDraftCard` in the review queue so level movement approval and execution can happen in one place.

---

### placement — Initial Player Placement

| Check | Status |
|---|---|
| Backend draft path | Yes — `placementDraftAction.ts` |
| proposed_actions backed | Yes |
| Review queue visible | Yes — `PlacementRecommendationDraftCard` |
| Director approve/reject | Yes |
| Apply path | `finalize_player_placement()` — the only function that activates a player |
| Audit history | Yes |
| Rollback/undo | Limited — player deactivation path exists but no formal rollback |
| Parent/player visibility controlled | Yes — player not activated until finalize_player_placement() |

**Gap (P1):** `propose_player_placement` is `implemented_not_wired` — director cannot trigger a placement recommendation from `/director/placement`. placementDraftAction.ts exists but has no UI entry point.

---

### parent_communication — Parent Summary Drafts

| Check | Status |
|---|---|
| Backend draft path | Yes — `draftSummaryUpdateAction.ts`, `draftDevelopmentSummaryFromPlacementAction.ts` |
| proposed_actions backed | Yes |
| Review queue visible | Yes — `DevelopmentSummaryDraftCard` |
| Director approve/reject | Yes |
| Apply path | Yes — `ApplyDevelopmentSummaryDraftControls` |
| Audit history | Yes |
| Rollback/undo | No — once applied, no rollback. Parent has not yet received it (send path not built) |
| Parent/player visibility controlled | Yes — raw coach notes excluded via `sanitizeParentFacingText`. Director-only until send path built |

**Status: Well-implemented.** The send path (email/portal delivery) is the one remaining piece — correctly deferred.

---

### session_wrap_up_v1 — Session Wrap-Ups

| Check | Status |
|---|---|
| Backend draft path | Yes — `structureRecapAction.ts`, `saveSessionVoiceNoteAction.ts` |
| proposed_actions backed | Yes |
| Review queue visible | Yes — `WrapUpDraftCard` |
| Director approve/reject | Yes |
| Apply path | Yes — `ApplyWrapUpDraftControls`, `applyWrapUpDraftAction.ts` |
| Audit history | Yes |
| Rollback/undo | No formal rollback — session observations are additive |
| Parent/player visibility controlled | Yes — observations are coach/director-only until explicitly published |

**Status: Well-implemented.**

---

### attendance — Attendance Exceptions

| Check | Status |
|---|---|
| Backend draft path | Yes — `attendanceExceptionDraftAction.ts` |
| proposed_actions backed | Yes |
| Review queue visible | Yes — `AttendanceExceptionDraftCard` |
| Director approve/reject | Yes |
| Apply path | Yes — `ApplyApprovedAttendanceExceptionControls` |
| Audit history | Yes |
| Rollback/undo | No — attendance records are additive |
| Parent/player visibility controlled | Yes — attendance is director-internal |

**Status: Well-implemented.**

---

### curriculum_adjustment — Curriculum Drafts

| Check | Status |
|---|---|
| Backend draft path | Partial — `CurriculumBuilderChangeQueue`, curriculum override actions |
| proposed_actions backed | Yes |
| Review queue visible | Yes — `CurriculumBuilderDraftCard`, `CurriculumOverrideDraftCard` |
| Director approve/reject | Yes |
| Apply path | Yes — `ApplyCurriculumOverrideDraftControls` |
| Audit history | Yes |
| Rollback/undo | Yes — `RollbackOverrideButton` exists |
| Parent/player visibility controlled | Yes — curriculum changes are director-internal until published |

**Status: Mostly well-implemented.** Draft creation paths (drill, mission, badge) have no backend server actions yet (P3 gaps).

---

### coach_communication — Coach Communication Drafts

| Check | Status |
|---|---|
| Backend draft path | Yes — `saveCoachCommunicationDraftAction.ts` |
| proposed_actions backed | Yes |
| Review queue visible | Partial — coach communication cards exist |
| Director approve/reject | Yes |
| Apply path | Partial |
| Audit history | Yes |
| Rollback/undo | No |
| Parent/player visibility controlled | Yes — director-to-coach, not parent-facing |

---

### player_brief — Player Development Briefs

| Check | Status |
|---|---|
| Backend draft path | Yes — `draftSummaryUpdateAction.ts`, `evidenceRequirementDraftAction.ts`, `priorityRecommendationAction.ts` |
| proposed_actions backed | Yes |
| Review queue visible | Yes — `EvidenceRequirementDraftCard`, `PriorityRecommendationDraftCard` |
| Director approve/reject | Yes |
| Apply path | Yes — corresponding apply controls exist |
| Audit history | Yes |
| Rollback/undo | No |
| Parent/player visibility controlled | Yes — director-only until parent summary explicitly created |

---

### video_visibility — Video Visibility Changes

| Check | Status |
|---|---|
| Backend draft path | **No** |
| proposed_actions backed | **No** — no proposed_action type defined |
| Review queue visible | **No** |
| Director approve/reject | **No** |
| Apply path | **No** |
| Audit history | **No** |
| Parent/player visibility controlled | Blocked — no mechanism to change video visibility at all |

**Gap (P3):** Entire video visibility change pipeline does not exist.

---

### badge_award — Badge Awards

| Check | Status |
|---|---|
| Backend draft path | **No** |
| proposed_actions backed | **No** — `badge_award` type not defined |
| Review queue visible | **No** |
| Director approve/reject | **No** |
| Apply path | **No** |
| Audit history | **No** |
| Parent/player visibility controlled | **No** mechanism |

**Gap (P3):** Badge award pipeline does not exist. `badgeEligibilityEngine.ts` and `badgeModel.ts` exist — no proposed_action path.

---

## execute_approved_action() Coverage

| Action type | Covered? |
|---|---|
| session_wrap_up_v1 | Yes |
| attendance | Yes |
| level_review | Yes |
| parent_communication | Yes |
| curriculum_adjustment | Yes |
| player_brief | Yes |
| coach_communication | Yes |
| player_observation | Yes |
| placement | Yes |
| attendance_exception | Yes |
| move_player_group | **No** — action type not defined |
| badge_award | **No** — action type not defined |
| video_visibility | **No** — action type not defined |
| curriculum_mission | **No** — no backend |
| curriculum_badge | **No** — no backend |

**11/15 types covered. 4 types have no apply path.**

---

## Approval Safety Gaps

| Gap | Priority |
|---|---|
| DonnaLevelMovementApplyControls not wired to DonnaDraftCard | P1 |
| Fitness template session generation bypasses proposed_actions | P1 |
| execute_approved_action() missing 4 action types | P1 |
| Inline DONNA Q&A on review items ("Why was this drafted?") | P2 |
| No audit history visible in review item detail | P2 |
| No rollback/undo on approved level movements | P2 |
| Video visibility pipeline entirely missing | P3 |
| Badge award pipeline entirely missing | P3 |
| move_player_group proposed_action type not defined | P3 |

---

## Fitness Template Approval Bypass — Detail

**File:** `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts`

**Issue:** Session generation from a fitness template creates a `sessions` row directly without going through `proposed_actions`. This bypasses the director review queue and violates the architecture invariant:

> AI proposes → Director approves → System executes

**Risk level:** Medium. The session is created in the director's academy and does not reach parents or players until the director assigns it. However, the lack of a review gate means the director may not realize DONNA created a session on their behalf.

**Fix:** Create a `generate_session_from_template` proposed_action type. The generate-session action should create a proposed_action row instead of a sessions row directly. Director approves → execute_approved_action() creates the session.

**Sprint estimate:** Part of Sprint 622.
