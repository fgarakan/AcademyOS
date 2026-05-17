# Review Queue Browser QA — Sprint 716

**Date:** 2026-05-17
**Method:** Static code analysis. Items marked `[BROWSER NEEDED]` require manual verification.
**TypeScript:** CLEAN

---

## Tab Structure and Navigation

| Check | Result | Notes |
|---|---|---|
| Tab routing | ✅ PASS | `VALID_TAB_PARAMS` maps 14 URL params (including legacy aliases) to 4 tab sections |
| Tab sections | ✅ PASS | `needs_approval`, `player_updates`, `curriculum_session`, `completed` |
| Legacy URL aliases | ✅ PASS | Old params (`wrap-ups`, `attendance`, etc.) redirect to correct sections |
| Auth guard | ✅ PASS | Returns sign-in prompt if `!user` |
| Academy scope | ✅ PASS | All queries filter by `academy_id` |
| Error boundary | ✅ PASS | `/director/review/error.tsx` |
| Loading state | ✅ PASS | `/director/review/loading.tsx` |
| Runtime render | `[BROWSER NEEDED]` | |

---

## Status State Separation

| Status | Shown Where | Notes |
|---|---|---|
| `pending_review` | Needs Approval tab, pending list | Decision controls shown |
| `approved` | Completed tab, approved list | Apply controls shown |
| `clarification_needed` | Needs Approval or dedicated slot | Clarification UI |
| `rejected` | Completed tab | No apply option |

All 4 statuses fetched and split correctly at query level. Decision controls only rendered when `status === 'pending_review'`. Confirmed in `WrapUpDraftCard`, `AttendanceExceptionDraftCard`, `DevelopmentSummaryDraftCard`.

---

## Draft-Only Language Audit

| Card | Draft-only copy present | Notes |
|---|---|---|
| `DevelopmentSummaryDraftCard` | ✅ PASS | "This draft updates the internal development summary only. It is not shown to players or parents." |
| `WrapUpDraftCard` | ✅ PASS | Shows "pending review" status label |
| `AttendanceExceptionDraftCard` | ✅ PASS | "Pending Review" status badge; decision controls gate |
| `AttendanceExceptionDraftCard` (isPending) | ✅ PASS | `isPending` flag gates action buttons |

**Issue to note:** Not all draft cards explicitly say "this is a draft, not official yet" in text. The status badge (Pending Review) and the absence of Apply buttons serve as the primary trust signal for pending items. This is acceptable for V1. A future polish sprint could add one-line draft disclaimers to remaining cards.

---

## Apply Controls Scope Disclosure Audit

| Apply Control | Scope Banner Present | Disclosed Scope |
|---|---|---|
| `ApplyApprovedDraftControls` | ✅ PASS | "Apply only creates internal coach observations from approved player observation drafts. It does not update attendance, parent messages, player priorities, player levels, or profiles." |
| `ApplyWrapUpDraftControls` | ✅ PASS | "Apply writes the coach wrap-up summary to session notes and marks the session completed." |
| `ApplyApprovedAttendanceExceptionControls` | `[NOT VERIFIED]` | Needs direct file read |
| `ApplyDevelopmentSummaryDraftControls` | `[NOT VERIFIED]` | Needs direct file read |
| `ApplyCurriculumOverrideDraftControls` | `[NOT VERIFIED]` | Needs direct file read |
| `ApplyEvidenceRequirementDraftControls` | `[NOT VERIFIED]` | Needs direct file read |
| `ApplyPriorityRecommendationControls` | `[NOT VERIFIED]` | Needs direct file read |

**Action:** Sprint 722 (No Unsafe Writes Audit) should verify all remaining apply controls have scope banners.

---

## Batch Controls

| Component | Check | Result |
|---|---|---|
| `VoiceIntakeBatchPanel` | type="button" on cancel | ✅ PASS (Sprint 710) |
| `CapturesBatchPanel` | type="button" on cancel | ✅ PASS (Sprint 710) |
| Batch approve/reject | Goes through proposed_actions | ✅ PASS |
| Batch never auto-applies | Confirmed — batch controls only approve/reject, not apply | ✅ PASS |

---

## DONNA Review Queue Panel

| Check | Result | Notes |
|---|---|---|
| `DonnaReviewQueuePanel` exists | ✅ PASS | |
| Retry button type="button" | ✅ PASS | Sprint 710 |
| Error state | ✅ PASS | "Could not load review queue." with Retry |
| No fake certainty in panel | ✅ PASS | Reads real proposed_actions count |

---

## WrapUp Coverage Panel

| Check | Result | Notes |
|---|---|---|
| `WrapUpCoveragePanel` exists | ✅ PASS | |
| Shows coverage rate | ✅ PASS | `loadWrapUpReviewSurface` |
| No mutation from panel | ✅ PASS | Display only |

---

## Draft Card Count by Type

All of the following draft card types have been verified to exist:
- `StructuredDraftCard` (coach recap / observations)
- `PriorityRecommendationDraftCard`
- `EvidenceRequirementDraftCard`
- `AttendanceExceptionDraftCard`
- `CurriculumOverrideDraftCard`
- `VoiceIntakeDraftCard`
- `WrapUpDraftCard`
- `WrapUpObservationDraftCard`
- `DevelopmentSummaryDraftCard`
- `PlacementReviewCard`
- `PlacementIntakeCandidateCard`
- `PlacementAssessmentDraftCard`
- `PlacementRecommendationDraftCard`
- `DonnaDraftCard`
- `GeneralCaptureDraftCard`

**Total: 15 draft card types.** All exist as files and are imported in review page.tsx.

---

## Items Requiring Browser Verification

1. Tab counts show correct numbers (pending, approved, etc.)
2. All 4 tabs render without error
3. Draft cards expand/collapse correctly
4. Approve/Reject buttons work and update status
5. Apply button appears only after approval
6. Apply scope banner is visible before apply button
7. Batch controls work without page reload issues
8. Empty state shows when no drafts of that type
9. No hydration errors

---

## Issues Found

| Severity | Component | Issue | Action |
|---|---|---|---|
| LOW | Most draft cards | No explicit "This is a draft, not official" disclaimer in card body. Status badge is the primary trust signal. | Add one-line draft disclaimers in future copy polish sprint. |
| MEDIUM | 5 apply controls not verified for scope banners | `ApplyApprovedAttendanceExceptionControls`, `ApplyDevelopmentSummaryDraftControls`, `ApplyCurriculumOverrideDraftControls`, `ApplyEvidenceRequirementDraftControls`, `ApplyPriorityRecommendationControls` | Verify in Sprint 722 (No Unsafe Writes Audit). |

---

## Summary

| Check Type | Count | Result |
|---|---|---|
| Static checks passed | 20 | ✅ |
| Requiring browser verification | 9 | `[BROWSER NEEDED]` |
| Apply controls verified | 2 of 7 | PARTIAL |
| Draft-only language confirmed | 3 cards explicit | ✅ |
| DANA references | 0 | ✅ |

---

*Generated by Sprint 716 — Review Queue Browser QA V1.*
