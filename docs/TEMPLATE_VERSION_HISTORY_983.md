# Template Version History
Sprint 983 — 2026-05-18

## Overview

`src/app/director/templates/class/[templateId]/page.tsx` and `src/app/director/templates/fitness/[templateId]/page.tsx` now fetch and display version history from `template_version_history` (migration 067 table) when live template data is available.

## Pages Updated

| Page | Change |
|---|---|
| `class/[templateId]/page.tsx` | Fetches version history after live template load; renders version history panel |
| `fitness/[templateId]/page.tsx` | Same |

## Repository Function Used

```typescript
getTemplateVersionHistory(db: DB, templateId: string, academyId: string): Promise<RepoListResult<TemplateVersionHistoryRow>>
```

Returns rows sorted by `version_number` descending. `TemplateVersionHistoryRow` fields used:
- `id` — React key
- `version_number` — displayed as `v{n}` in lime mono
- `change_type` — mapped via `CHANGE_TYPE_LABEL` to "Created" / "Updated" / "Archived" / "Duplicated"
- `created_at` — sliced to `YYYY-MM-DD`

## Fetch Placement

The version history fetch runs inside the existing try/catch block, after `dataSource = 'live'` is set. It reuses `profile.academy_id` already resolved in scope — no additional auth round-trip.

```typescript
const vResult = await getTemplateVersionHistory(db, templateId, profile.academy_id)
if (vResult.isSchemaMissing) {
  versionHistorySchemaMissing = true
} else {
  versionHistory = vResult.data
}
```

## Schema-Missing Behavior

- `versionHistorySchemaMissing = true` → panel shows: "Version history unavailable until backend migration is applied."
- This handles the case where migrations 067/068 have not been applied to the database.
- Page does not crash. No throw propagated.

## Live / Demo Behavior

| State | UI |
|---|---|
| `dataSource === 'live'`, history exists | Shows up to 3 version rows |
| `dataSource === 'live'`, history empty | "No version history yet." |
| `dataSource === 'live'`, schema missing | "Version history unavailable until backend migration is applied." |
| `dataSource === 'demo'` | "Version history appears for saved templates." |

## Known Limitations

- `changed_by` field is fetched but not currently displayed (UUID only — no profile name join). Sprint 984 QA can flag this for a future sprint.
- Maximum 3 records shown. Full history paging deferred.
- `CHANGE_TYPE_LABEL` covers the 4 known request types; unknown types fall back to the raw `change_type` string.

## What Sprint 984 Should QA

- Class detail page renders without crash at demo and live routes.
- Fitness detail page renders without crash at demo and live routes.
- Version history panel appears when `dataSource === 'live'` and disappears (replaced by muted note) when demo.
- Schema-missing message appears correctly when migration 067 is not applied.
- No "DONNA" or "apply/publish/send" language in any new UI strings.
- TypeScript: `npx tsc --noEmit` is clean.
- No unintended files staged.

## Safety Rules

- Read-only. No writes, no inserts, no server actions.
- No parent sends. No external sends. No curriculum mutation.
- Migrations 067/068 remain draft-only — not applied, not referenced by migration scripts.
