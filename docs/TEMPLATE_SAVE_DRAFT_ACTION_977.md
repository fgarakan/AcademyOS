# Template Save Draft Server Action
Sprint 977 — 2026-05-18

## Overview

`src/lib/actions/templateDraftAction.ts` provides safe server actions for submitting template drafts for director review. No templates are auto-approved. All submissions land in `template_review_requests` as `status: 'pending'`.

## Actions Created

### `saveTemplateDraftAction(input: SaveTemplateDraftInput)`

Creates a new `template_review_request` row with `request_type: 'create_template'`.

### `updateTemplateDraftAction(input: UpdateTemplateDraftInput)`

Creates a `template_review_request` row with `request_type: 'update_template'` and a reference to the existing `template_id`. Changes are NOT applied to the live template row until a director approves.

## Schema Dependency

Both actions write to `template_review_requests` which is created in migration 067. If the table does not exist, the action returns:

```typescript
{
  success: false,
  error: 'Template backend migration has not been applied yet. Apply migration 067 before submitting template drafts.',
  isSchemaMissing: true,
}
```

No unhandled exceptions reach the caller.

## Role Guard

`assertDirectorOrHead()` reads `profiles.role` for the authenticated user. Only `academy_director` and `head_coach` roles may submit. Coaches attempting to call these actions receive:

```
"Only directors and head coaches can submit template drafts."
```

## Draft Payload

The `template_draft` JSONB field stores a complete snapshot of the submitted template:

```typescript
{
  template_type, name, description, total_duration_min,
  curriculum_stage_key, curriculum_level_key, curriculum_source_label,
  template_goal, pathway_focus, tags, blocks,
  submitted_at, submitted_by_role
}
```

Blocks include exercise sub-arrays. This snapshot is what the director reviews before approving. The snapshot is intentionally redundant — it does not rely on the draft-migration columns being present in the `templates` table.

## Safety Rules Enforced

- No auto-approval — all requests land as `status: 'pending'`
- No curriculum mutation — curriculum fields are text labels/snapshots only
- No parent/player visibility — table has no parent-facing RLS
- No external sends
- Director/head_coach role check before any write
- Schema-missing detection prevents crashes if migration not applied

## No UI Wiring in This Sprint

UI wiring (Save Draft button in create pages) comes in Sprints 980–981.
