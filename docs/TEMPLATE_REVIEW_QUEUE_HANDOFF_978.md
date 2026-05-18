# Template Review Queue Handoff
Sprint 978 — 2026-05-18

## Overview

`src/lib/templates/templateReviewQueueAdapter.ts` provides the typed read layer between `template_review_requests` (migration 067) and the director review queue UI.

## Functions Created

| Function | Purpose |
|---|---|
| `loadPendingTemplateReviewItems(db, academyId)` | Returns pending template review requests enriched with draft snapshot fields |
| `loadTemplateReviewHistoryItems(db, academyId)` | Returns all review requests (pending + reviewed) for history view |

Both return `TemplateReviewQueueResult` with `{ items, pendingCount, error, isSchemaMissing }`.

## Request Type Labels

| request_type | Display Label | Color |
|---|---|---|
| `create_template` | New Template Draft | Lime |
| `update_template` | Template Update | Blue |
| `archive_template` | Archive Template | Orange |
| `duplicate_template` | Duplicate Template | Purple |

## Enriched Item Shape

`TemplateReviewQueueItem` extends `TemplateReviewRequestRow` with fields derived from the `template_draft` JSONB snapshot:

- `draftName` — template name from snapshot
- `draftType` — class_template or fitness_template
- `draftDurationMin` — duration from snapshot
- `draftCurriculumLabel` — curriculum connection label
- `draftGoal` — goal or description
- `draftBlockCount` — number of blocks in snapshot
- `requestTypeLabel` / `requestTypeColor` — display fields

The JSONB snapshot is self-contained — the adapter does not need to re-query the `templates` table.

## Schema Dependency

All queries go through `getTemplateReviewRequests` which returns `isSchemaMissing: true` if migration 067 is not applied. The adapter passes this through to callers.

## Review Queue UI Wiring (Not Done Yet)

The existing review queue page (`src/app/director/review/page.tsx`) has 8 tabs and complex multi-type rendering. Adding a "Template Review" tab requires:

1. A new `TemplateReviewDraftCard.tsx` component in `src/app/director/review/`
2. A new `TemplateReviewDecisionControls.tsx` for approve/reject actions
3. Integration into `page.tsx` tab list and query pipeline
4. The approve action (Sprint 979) must be complete first

This wiring is deferred to a future sprint after the template backend is confirmed to be applied in production.

## Separation from proposed_actions

Template review requests use `template_review_requests` (not `proposed_actions`) because:
- `proposed_actions` has a `voice_command_id NOT NULL` constraint
- UI-originated template saves are not voice commands
- This keeps voice-originated mutations cleanly separated from director/head_coach UI-originated template lifecycle

The adapter is designed to be composable with both sources if needed in the future.
