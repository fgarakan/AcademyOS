# Template Library Live Data Wiring
Sprint 975 — 2026-05-18

## Overview

Both class and fitness template library pages are now async Server Components that attempt to load live template data from the repository layer before falling back to demo templates.

---

## Pages Updated

| Page | Route |
|---|---|
| `src/app/director/templates/class/page.tsx` | `/director/templates/class` |
| `src/app/director/templates/fitness/page.tsx` | `/director/templates/fitness` |

---

## Data Flow

```
getSupabaseServer()
  → auth.getUser()
  → profiles.select('academy_id').eq('id', user.id)
  → listTemplatesForAcademy(db, academyId)
  → if data.length > 0 && !isSchemaMissing && !error → dataSource = 'live'
  → else → dataSource = 'demo'
```

Any exception in the chain falls through silently to `demo` mode.

---

## Banner States

| State | Banner | Color |
|---|---|---|
| Live data loaded | "Showing saved templates from your academy." | Green (`status-green`) |
| Demo / fallback | "Showing demo templates. Live template backend is not connected yet." | Orange (`status-orange`) |

---

## Card Components

Each page now has two card variants:

| Component | Data source | Type |
|---|---|---|
| `DemoTemplateCard` / `DemoFitnessTemplateCard` | Mock data | `MockClassTemplate` / `MockFitnessTemplate` |
| `LiveTemplateCard` / `LiveFitnessTemplateCard` | Repository `TemplateRow` | `TemplateRow` |

Live cards access draft-migration 067 fields (`status`, `curriculum_level_key`, `curriculum_source_label`) via a `templateExt()` helper that casts `TemplateRow` through `unknown` to `Record<string, unknown>`. These fields are absent before migration 067 is applied and are safely typed as `string | undefined`.

Live cards fall back gracefully for missing fields:
- Status: uses `template.is_active` as proxy when `status` column absent
- Level: omits level chip if `curriculum_level_key` absent
- Curriculum label: shows "No curriculum connection yet" if absent
- Duration: falls back to 60min if `total_duration_min` null

---

## Filtering Note

`listTemplatesForAcademy` is called without `templateType` filter in this sprint. The `template_type` column is a draft-migration 067 field; filtering by it would return `isSchemaMissing: true` before migration is applied. Both pages display all live academy templates regardless of type until migration 067 is applied and type filtering is safe.

---

## No Writes

No server actions, no mutations, no migrations. Read-only path only.

---

## Known Limitations

- Live cards show all templates for the academy regardless of class vs fitness type (type column requires migration 067).
- Stats strip (ready/draft/needs_review counts) for live data uses the draft `status` column — shows 0 for all status categories if migration 067 not applied (column absent → all filter to false).
- Filter bar buttons (level/goal) remain visual-only — live filtering requires future sprint.
