# Class Template Create Save Wiring
Sprint 980 — 2026-05-18

## Overview

`src/app/director/templates/class/create/page.tsx` is now wired to a real server action. The "Save as Draft" button in Step 5 submits the wizard state to `saveClassTemplateDraftFromWizardAction` in `src/lib/actions/templateDraftAction.ts`.

## New Server Action

### `saveClassTemplateDraftFromWizardAction(input)`

Input:
```typescript
{
  curriculumLevel: string   // e.g. "Red Ball 1"
  templateGoal: string
  blocks: Array<{
    type: string
    title: string
    durationMin: number
    drills?: string[]
  }>
}
```

The action resolves `userId` and `academyId` from the Supabase session server-side. The client supplies no academy context — this prevents client-supplied academyId injection.

Result: `{ success, reviewRequestId?, error?, isSchemaMissing? }`

## Template Draft JSONB

The action builds a `template_draft` JSONB snapshot:
- `template_type: 'class_template'`
- `name: '<level> — Class Template'`
- `curriculum_level_key`, `curriculum_source_label` — from `curriculumLevel`
- `template_goal` — from wizard goal selection
- `total_duration_min` — sum of block durations
- `blocks` — each with `type`, `name`, `durationMin`, `exercises[]`
- `submitted_at`, `submitted_by_role`

## Client Feedback States

| State | UI |
|---|---|
| `idle` | Save as Draft button active |
| `saving` | Button disabled, Loader2 spinner, "Saving..." |
| `success` | Green banner: "Draft submitted for director review" + next steps |
| `schema_missing` | Orange banner: "Backend not yet available" |
| `error` | Red banner: "Failed to save draft" + error message |

## Save Disabled After Success

The Save Draft button is disabled once `saveStatus === 'success'` to prevent duplicate submissions.

## Schema Dependency

Requires migration 067 (`template_review_requests` table). If the table does not exist, the action returns `isSchemaMissing: true` and the page renders the orange "Backend not yet available" banner — no throw, no crash.

## Safety Rules

- Director or head_coach only. Coach role blocked server-side.
- No auto-approval. Draft always lands `status='pending'` for director review.
- No curriculum mutation.
- No parent sends. No external sends.
- academyId is always resolved from the authenticated session — never from client input.
