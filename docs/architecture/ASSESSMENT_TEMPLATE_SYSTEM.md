# Assessment Template System — Architecture

**Sprint:** Mega Sprint 1196-1210
**Last updated:** 2026-06-02

---

## Overview

The Assessment Studio is template-driven. The assessment form renders from a director-customizable database template, not hardcoded TypeScript arrays.

One global Core Assessment Template ships with the platform. Each academy director has their own clone that they can customize.

---

## Data model (5 tables — migration 081)

### `assessment_templates`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `academy_id` | uuid | null for global template |
| `name` | text | Template name |
| `is_global` | boolean | true = platform-owned, read-only |
| `platform_version` | text | e.g. "1.0" |

### `assessment_template_sections`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `template_id` | uuid | FK → assessment_templates |
| `section_key` | text | Stable identifier (e.g. "forehand") |
| `display_name` | text | Director-editable label |
| `sort_order` | int | Director-editable order |
| `is_visible` | boolean | Director-togglable |
| `is_custom` | boolean | true = director-added |
| `pathway_category` | text | skill / competition / fitness / mental_performance |
| `level_applicability` | text[] | Which assessment views include this section |
| `coach_guidance` | text | Internal coach note (deferred editor) |
| `parent_safe_label` | text | Parent-facing label (deferred editor) |
| `player_safe_label` | text | Player-facing label (deferred editor) |

### `assessment_template_skills`
Same structure as sections, plus:
| Column | Type | Notes |
|---|---|---|
| `section_id` | uuid | FK → assessment_template_sections |
| `is_required` | boolean | Required to score |
| `appears_in_quick` | boolean | Shown in Quick mode |
| `appears_in_standard` | boolean | Shown in Standard mode |
| `appears_in_deep` | boolean | Shown in Deep mode |
| `scoring_scale` | text | 1_10 / 1_5 / pass_fail |

### `assessment_template_versions`
Immutable JSON snapshot of template state at each change.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK — stored in `assessments.version_id` |
| `template_id` | uuid | FK → assessment_templates |
| `version_num` | int | Increments per edit |
| `snapshot` | jsonb | Full sections + skills at time of change |
| `change_note` | text | What changed |

### `academy_assessment_templates`
Links each academy to their active template. One active template per academy.

---

## Assessment views (rendering contexts)

| View key | Display name | When auto-suggested |
|---|---|---|
| `general` | General Intake | No level assigned |
| `red_ball` | Red Ball | Stage contains "red" |
| `orange_ball` | Orange Ball | Stage contains "orange" |
| `green_dot` | Green Dot | Stage contains "green" |
| `yellow_ball` | Yellow Ball | Stage contains "yellow" |
| `high_performance` | High Performance | Stage contains "high" / "performance" |

Views are runtime filters — not separate templates. Each skill's `level_applicability` array determines which views include it.

**General view** includes all skills regardless of `level_applicability`.

---

## Assessment modes

| Mode | Description | Skills shown |
|---|---|---|
| `quick` | Key indicators only | `appears_in_quick = true` |
| `standard` | Section overview + expandable skills | `appears_in_standard = true` |
| `deep` | All sections, all skills fully scored | `appears_in_deep = true` |

---

## Template lifecycle

```
Platform seeds global template (migration 082)
  └── Director accesses Assessment Studio for first time
        └── assessmentTemplateLoader clones global → academy template
              └── academy_assessment_templates record created
                    └── Director customizes their clone
                          └── Every edit creates an assessment_template_version snapshot
```

**Historical accuracy:** `assessments.version_id` stores the `assessment_template_versions.id` active at submission time. Old assessments never break when the template changes.

---

## Template loader (`src/lib/assessment/assessmentTemplateLoader.ts`)

```
loadAssessmentFormConfig(supabase, academyId, view, mode)
  → finds or creates academy template
  → loads sections (filtered by is_visible + level_applicability)
  → loads skills (filtered by is_visible + level_applicability + mode appears_in_*)
  → returns AssessmentFormConfig
```

---

## Scoring storage

Domain scores (stored in `assessments` table columns):
- `technical_score` = avg(forehand, backhand, serve section scores)
- `tactical_score` = return_rally_competition section score
- `movement_score` = fitness_movement section score
- `behavioral_score` = mental_performance section score
- `competition_score` = universal_foundations.competition_readiness skill
- `overall_score` = avg of all non-null domain scores

Detailed per-skill scores stored as JSON in `assessments.scores_detail`:
```json
{
  "assessment_label": "monthly_development_check",
  "assessment_view": "orange_ball",
  "mode": "standard",
  "template_id": "...",
  "template_version_id": "...",
  "sections": {
    "forehand": {
      "section_score": 7,
      "not_assessed": false,
      "notes": "...",
      "skills": {
        "preparation": { "score": 8, "not_assessed": false },
        "spin_control": { "score": null, "not_assessed": true }
      }
    }
  }
}
```

---

## Role authority

| Role | Can do |
|---|---|
| `academy_director` | Run assessment (direct insert), approve coach drafts, customize template |
| `head_coach` | Run assessment (direct insert), approve coach drafts, customize template |
| `coach` | Submit assessment draft (→ proposed_action, pending director approval) |
| `parent`, `player` | See nothing until director-approved assessment is published |

---

## Customization — V1 (supported in editor)

1. Rename section
2. Hide/show section
3. Reorder sections
4. Rename skill
5. Hide/show skill
6. Reorder skills within a section

## Customization — deferred

7. Add custom sections
8. Add custom skills
9. Change scoring scale
10. Set level applicability (UI)
11. Set pathway category (UI)
12. Coach/parent/player guidance text editors

---

## Files

| File | Role |
|---|---|
| `supabase/migrations/081_assessment_templates.sql` | Tables + RLS |
| `supabase/migrations/082_assessment_templates_seed.sql` | Global template seed |
| `src/lib/assessment/assessmentTemplateTypes.ts` | All TypeScript types |
| `src/lib/assessment/assessmentTemplateLoader.ts` | DB loader + clone logic |
| `src/lib/assessment/assessmentComparisonEngine.ts` | Delta + recommendation engine |
| `src/app/director/players/[playerId]/assessmentStudioAction.ts` | Submit + approve server actions |
| `src/app/director/players/[playerId]/_components/AssessmentStudioForm.tsx` | Client form |
| `src/app/director/players/[playerId]/_components/AssessmentComparisonCard.tsx` | Post-submit comparison |
| `src/app/director/players/[playerId]/_components/AssessmentsTab.tsx` | Tab host (updated) |
| `src/app/director/assessment-template/page.tsx` | Template editor page |
| `src/app/director/assessment-template/_components/TemplateSectionEditor.tsx` | Section/skill editor |
| `src/app/director/assessment-template/_actions/templateActions.ts` | Template server actions |
| `src/app/director/review/AssessmentStudioDraftCard.tsx` | Review queue card |
