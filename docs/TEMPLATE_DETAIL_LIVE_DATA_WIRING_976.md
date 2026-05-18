# Template Detail Live Data Wiring
Sprint 976 — 2026-05-18

## Overview

Both class and fitness template detail pages now attempt to load live template data before falling back to demo content. The DONNA context panel always receives the most live-accurate context values available.

## Pages Updated

| Page | Route |
|---|---|
| `src/app/director/templates/class/[templateId]/page.tsx` | `/director/templates/class/[id]` |
| `src/app/director/templates/fitness/[templateId]/page.tsx` | `/director/templates/fitness/[id]` |

## Data Flow

```
getTemplateById(db, templateId, academyId)
  → if found: liveTemplate set, dataSource = 'live'
  → getTemplateBlocks(db, templateId)          [class page]
  → getTemplateBlockExercises(db, templateId)  [fitness page]
  → any failure → dataSource = 'demo'
```

## Display Strategy (live preferred, demo fallback)

| Field | Live source | Demo fallback |
|---|---|---|
| name | `templates.name` | `demoTemplate.name` |
| status | `templates.status` (draft col) / `is_active` proxy | `demoTemplate.status` |
| level | `templates.curriculum_level_key` (draft col) | `demoTemplate.level` |
| description/goal | `templates.description` | `demoTemplate.goal` / `fitnessGoal` |
| duration | `templates.total_duration_min` | `demoTemplate.durationMin` |
| curriculum label | `templates.curriculum_source_label` (draft col) | `demoTemplate.curriculumConnection` |
| blocks | `getTemplateBlocks` results | `DEMO_CLASS_TEMPLATE_BLOCKS` |
| exercises | `getTemplateBlockExercises` results | `DEMO_EXERCISES[templateId]` |
| tennis transfer | `templates.tags` array | `demoTemplate.tennisTransfer` |
| load | always demo | `demoTemplate.load` (no base schema equivalent) |

## Source Banner

| State | Banner |
|---|---|
| Live | Green: "Live saved template." |
| Demo | Orange: "Demo template preview." |

## DONNA Context

DONNA always receives live-preferred values: `templateName`, `templateLevel`, `templateType`, `blockCount` / `durationMin`, `status`. This ensures DONNA context is accurate even before the rest of the page wires fully to live data.

## No Writes

No server actions, no mutations, no migrations.
