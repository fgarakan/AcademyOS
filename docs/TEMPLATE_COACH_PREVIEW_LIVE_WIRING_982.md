# Coach Preview Live Template Wiring
Sprint 982 — 2026-05-18

## Overview

`src/app/director/templates/coach-preview/page.tsx` now accepts an optional `templateId` search param. When present, it fetches the live template and its blocks from the repository and renders them instead of `DEMO_BLOCKS`.

## Search Params

| Param | Source | Effect |
|---|---|---|
| `level` | URL | Curriculum level for enrichment (watch-fors, drills) |
| `goal` | URL | Session goal display |
| `type` | URL | `class` or `fitness` |
| `templateId` | URL (new) | If present, triggers live data fetch |

## Live Data Fetch

```
getSupabaseServer() → auth.getUser() → profiles.academy_id
  → getTemplateById(db, templateId, academyId)
  → getTemplateBlocks(db, templateId)
```

- Both fetches are schema-safe — `isSchemaMissing` guard prevents throws.
- On any error or missing template → falls through to `DEMO_BLOCKS`.
- `dataSource` set to `'live'` only when template row is found and confirmed.

## DisplayBlock Interface

```typescript
interface DisplayBlock {
  id: string
  type: string
  displayType: string    // derived from BLOCK_TYPE_DISPLAY map
  title: string          // block.name
  durationMin: number    // block.duration_min
  todaysFocus: string    // block.notes ?? ''
  steps: string[]        // always [] for live blocks (not stored in template_blocks)
}
```

Blocks sorted by `order_index` (the correct column name — not `order_num`).

## Curriculum Enrichment

Regardless of data source, curriculum watch-fors and drills are always shown:
- `getWatchForsForBlock(stage, block.type)`
- `getCurriculumDrillsForBlock(stage, block.type)`
- `stage` is derived from `levelParam` (the URL param, not the live template level)

## Source Banner

- Live: green banner with `Database` icon — "Showing live template data from your academy."
- Demo: orange banner with `AlertCircle` — "Demo view — sample template."

## Link Updates

`class/[templateId]/page.tsx` and `fitness/[templateId]/page.tsx` — "Preview for Coach" links now append `&templateId=${encodeURIComponent(templateId)}` so the coach-preview page can fetch the correct live template.

## Fitness Block Types

`BLOCK_TYPE_COLOR` and `BLOCK_TYPE_DISPLAY` extended to include fitness block types (`movement`, `speed`, `agility`, `strength`, `plyometrics`, `coordination`, `mobility`, `recovery_cool_down`) so fitness templates render correctly in the preview.

## Safety Rules

- Read-only. No writes, no mutations.
- `academyId` always resolved from the authenticated session — never from URL params.
- Schema-missing and template-not-found both fall through to demo gracefully.
- No curriculum mutation. No parent sends. No external sends.
