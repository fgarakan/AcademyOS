# Sprint 796 — Curriculum Builder Review Queue Integration QA V1

**Date:** 2026-05-18
**Sprint:** 796

---

## Review queue integration audit

The curriculum builder's "draft → review → approve" cycle must connect correctly to the existing director review queue at `/director/review`. This audit confirms the connection points.

---

## Connection points

| Builder element | Review queue connection | Status |
|----------------|------------------------|--------|
| `CurriculumChangeQueue` "Open Review Queue →" link | Routes to `/director/review` | ✅ Confirmed |
| DONNA draft success messages | All say "check Review Queue" | ✅ Confirmed |
| `DonnaSafetyDisclosure` | References Review Queue by name | ✅ Confirmed |
| Level builder draft banner | "All changes create a draft in the Review Queue" | ✅ Confirmed |
| `CurriculumBuilderWelcome` | "change queue" chip links to `/director/review` | ✅ Confirmed |

## What is NOT connected (V1 known gaps)

| Gap | Impact | V2 fix |
|-----|--------|--------|
| DONNA drill/gate/fitness drafts do not write to `proposed_actions` | Drafts don't appear in review queue | Wire server action with `assertNotPreviewMode()` guard |
| `CurriculumChangeQueue` component has no live data query | Always shows empty state unless caller passes items | Add DB query for `proposed_actions WHERE action_type LIKE 'curriculum_%'` |
| No curriculum-specific filter in existing review queue | Director sees all action types together | Add `?type=curriculum` filter param to review queue |

## Approval flow integrity (what IS working)

The existing director review queue at `/director/review` already:
- Shows pending `proposed_actions` rows
- Allows approve / reject with `execute_approved_action()` or status update
- Guards against auto-approval
- Writes to `audit_logs` on approval

When DONNA draft components are wired in V2, they will slot into this existing pipeline. The curriculum builder UI is designed to feed that pipeline without altering it.

## Safety check: does the curriculum builder expose any mutation paths?

✅ No. Every "Create draft" button in the builder is a UI state change only. No server actions are called. No DB writes occur. The builder is safe to use in the V1 pilot.
