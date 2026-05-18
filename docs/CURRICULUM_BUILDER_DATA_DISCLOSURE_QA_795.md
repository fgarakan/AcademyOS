# Sprint 795 — Curriculum Builder Data Disclosure QA V1

**Date:** 2026-05-18
**Sprint:** 795

---

## Data trust surface audit — curriculum builder

All curriculum builder views rely on `getCurriculumExplorerData()`. That function returns live data from Supabase when tables exist, or safe empty arrays when they don't. The `tablesAvailable` boolean controls which empty states fire.

---

## Disclosure checklist

| Surface | What's shown | Trust status | Disclosure present? |
|---------|-------------|-------------|---------------------|
| Level map — drill count | Count from `drills` table joined to level | `live` when table populated | ✅ Sufficiency dots (green/orange/red) |
| Level map — gate count | Count from `gates` table | `live` when table populated | ✅ Sufficiency dots |
| Level map — no data | "Curriculum data not yet available" | `no_data` state | ✅ Empty state shown |
| DONNA context panel — drill obs | Reads `drillCount` from filtered drills array | `live` derived count | ✅ Observation copy calibrated to 0 / <3 / ≥3 |
| DONNA context panel — gate obs | Reads `gateCount` from filtered gates array | `live` derived count | ✅ Observation copy calibrated to 0 / <2 / ≥2 |
| DONNA context panel — session data | NOT shown | `blocked_by_schema` — session data lives elsewhere | ✅ Orange alert: "DONNA cannot see session history here" |
| Guided review — level detail | Full `CurriculumLevelDetailPanel` | `live` or `no_data` per table | ✅ `tablesAvailable` flag passed through |
| Level builder — overview tab | Same `CurriculumLevelDetailPanel` | `live` or `no_data` | ✅ Handled by panel |
| Impact preview panel | `ImpactEstimate` or null | `draft` / estimate | ✅ "Estimates are based on current enrolment data" disclaimer |

## No fake data policy — confirmed

- No hardcoded player counts in any builder component
- No hardcoded drill/gate counts
- Counts derived from live `data` prop arrays in all cases
- Demo data (if any) is prefixed `[DEMO]` at the row level — not fabricated in components

## What is labelled as draft/estimate

- `CurriculumImpactPreviewPanel` — explicitly labelled "Estimate" with disclaimer
- All DONNA draft submissions — labelled "Draft only" and "goes to review queue"
- `DonnaCurriculumContextPanel` — labelled with orange alert on data boundary
