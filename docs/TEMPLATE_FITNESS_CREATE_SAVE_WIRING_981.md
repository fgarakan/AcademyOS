# Fitness Template Create Save Wiring
Sprint 981 — 2026-05-18

## Overview

`src/app/director/templates/fitness/create/page.tsx` is now wired to a real server action. The "Save as Draft" button in Step 5 submits the wizard state to `saveFitnessTemplateDraftFromWizardAction` in `src/lib/actions/templateDraftAction.ts`.

## New Server Action

### `saveFitnessTemplateDraftFromWizardAction(input)`

Input:
```typescript
{
  curriculumLevel: string       // e.g. "Orange Ball 2"
  fitnessGoalId: string         // e.g. "speed_agility"
  fitnessGoalLabel: string      // e.g. "Speed & Agility"
  load: string                  // "Light" | "Moderate" | "High"
  durationMin: number
  blocks: Array<{
    type: string                // FitnessBlockType string
    durationMin: number
    exercises: string[]
  }>
}
```

The action resolves `userId` and `academyId` from the Supabase session server-side. No academy context comes from the client.

Result: `{ success, reviewRequestId?, error?, isSchemaMissing? }`

## Template Draft JSONB

The action builds a `template_draft` JSONB snapshot:
- `template_type: 'fitness_template'`
- `name: '<level> — Fitness Template'`
- `curriculum_level_key`, `curriculum_source_label` — from `curriculumLevel`
- `template_goal` — from `fitnessGoalLabel`
- `total_duration_min` — from wizard duration stepper
- `fitness_load` — "Light" / "Moderate" / "High"
- `tags: ['fitness_template', load.toLowerCase()]`
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

Requires migration 067 (`template_review_requests` table). If the table does not exist, returns `isSchemaMissing: true` — page renders orange "Backend not yet available" banner.

## Safety Rules

- Director or head_coach only. Coach role blocked server-side.
- No auto-approval. Draft always lands `status='pending'` for director review.
- No curriculum mutation.
- No parent sends. No external sends.
- `academyId` always resolved from the authenticated session — never from client input.

## Parallel with Sprint 980

This sprint applies the identical pattern as Sprint 980 (class template create wiring) to the fitness create wizard. The only structural differences are:
- `template_type: 'fitness_template'` instead of `class_template`
- Input includes `load`, `durationMin`, and `fitnessGoalId`/`fitnessGoalLabel` instead of `curriculumLevel`/`templateGoal`/`blocks[]` with drill arrays
- `fitness_load` field added to the draft JSONB snapshot
