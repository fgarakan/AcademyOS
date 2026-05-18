# Template Approval Application
Sprint 979 — 2026-05-18

## Overview

`src/lib/actions/templateApprovalAction.ts` provides the director-only approval and rejection server actions for template review requests.

## Actions Created

### `approveTemplateReviewRequestAction(reviewRequestId)`

**For `create_template` requests:**
- INSERTs a new row into `templates` with `status='ready'`, `approved_by`, `approved_at`
- INSERTs a version history snapshot into `template_version_history`
- Updates review request to `status='approved'`
- Returns `{ success: true, templateId }`

**For `update_template` requests:**
- UPDATEs existing template row with draft fields
- INSERTs version history snapshot
- Updates review request to `status='approved'`
- Returns `{ success: true, templateId }`

### `rejectTemplateReviewRequestAction(reviewRequestId, reviewNotes)`

- Updates review request to `status='rejected'` with `reviewed_by`, `reviewed_at`, `review_notes`
- No template mutation
- Returns `{ success: true }`

## Director-Only Guard

`assertDirectorOnly()` reads `profiles.role`. Only `academy_director` can approve or reject. `head_coach` and `coach` attempts return:

```
"Only academy directors can approve template requests."
```

## Schema Dependency

Both actions require migration 067 (creates `template_review_requests`, `template_version_history`, and adds `templates.status`, `templates.approved_by`, etc.). If schema is missing, actions return `isSchemaMissing: true`.

Version history INSERT failure is non-fatal — a failed version history write does not roll back the template approval. This prevents a version history bug from blocking template creation.

## `status='ready'` Gate

Approved templates are created/updated with `status='ready'`. This is the only path to the `ready` state in the full production model. The `WITH CHECK (status != 'ready' OR auth_has_role('academy_director'))` RLS constraint in migration 068 enforces the same rule at the DB level.

## No UI Wiring Yet

The decision controls (Approve/Reject buttons) will be implemented as `TemplateReviewDecisionControls.tsx` in a future sprint alongside the `TemplateReviewDraftCard.tsx` component for the review queue page.

## Safety Rules

- Director-only. head_coach/coach blocked.
- No curriculum mutation.
- No parent sends. No external sends.
- Schema-missing detection on all DB operations.
- Version history is append-only (no UPDATE/DELETE RLS).
- `archive_template` and `duplicate_template` request types return safe error — not yet implemented.
