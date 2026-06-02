# Assessment Studio Form — Architecture

**Sprint:** Mega Sprint 1196-1210
**Last updated:** 2026-06-02

---

## Form rendering model

The Assessment Studio Form (`AssessmentStudioForm.tsx`) is a client component that renders entirely from a `AssessmentFormConfig` object passed as a prop. It never renders from hardcoded arrays.

```
Server (AssessmentsTab.tsx)
  → loadAssessmentFormConfig(supabase, academyId, view, mode)
      → returns AssessmentFormConfig (sections + skills from DB)
          → passed to AssessmentStudioForm as prop
```

---

## Form states

| State | What the user sees |
|---|---|
| Collapsed | "Start Assessment" / "Start Reassessment" button |
| Open — config | View selector, mode selector, assessment type, baseline toggle |
| Open — sections | One card per section. Quick = expanded. Standard = collapsed with expand toggle. |
| Open — skill scores | 1–10 number picker + "N/A" toggle per skill |
| Reassessment mode | Previous score shown beneath each input with delta badge |
| Success | Confirmation card + AssessmentComparisonCard (if previous exists) |

---

## Reassessment mode

Activated when `previousAssessment !== null`. The previous assessment is fetched server-side in `AssessmentsTab` and passed as a prop.

- Previous section scores shown as reference below each section score input
- Previous skill scores shown as reference below each skill score input
- Delta = current − previous, shown as `+2.0` (green) or `−1.5` (red)
- After submit: `compareAssessments()` runs client-side using the submitted data + previous data

---

## Role routing (server action)

`submitAssessmentStudioAction` detects the caller's role:

- `academy_director` / `head_coach` → inserts directly into `assessments` table
- `coach` → creates `proposed_action` with `target_module: 'assessment_studio_draft'`

Both paths write to `audit_logs`. Neither triggers level movement, blueprint changes, or parent notifications.

---

## Comparison engine

`compareAssessments(current, previous)` returns:
- `domainDeltas[]` — per-domain current/previous/delta/status
- `topImprovements[]` — top 5 improved skills
- `topDeclines[]` — top 5 declined skills
- `overallDelta` — overall score delta
- `recommendations[]` — BlueprintRecommendation enum values

Recommendations are **suggestions only**. None are applied automatically.

---

## Score derivation

When the form submits, `deriveDomainScores(scoresDetail)` computes the 5 domain scores + overall from the section/skill scores in the `ScoresDetail` object. These are stored in the named columns of `assessments` for backward compatibility with existing queries.

---

## Assessment view auto-suggest

`autoSuggestView(stage)` maps the player's curriculum stage to an assessment view:

```
stage = null          → general
contains 'red'        → red_ball
contains 'orange'     → orange_ball
contains 'green'      → green_dot
contains 'yellow'     → yellow_ball
contains 'high'/'performance' → high_performance
```

Director can override the suggestion.

---

## Guardrails

1. No automatic level movement — enforced in server action
2. No parent/player data exposure — coach submissions go to proposed_actions, not live records
3. Every submission writes to audit_logs
4. `assessments.version_id` records the template version at submission time
5. Coach submissions require director approval before becoming official records
