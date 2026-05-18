# Coach Session Plan Live Data
Sprint 988 — 2026-05-18

## Overview

Enhanced `src/app/coach/sessions/[sessionId]/page.tsx` to show curriculum level and session goal from the template in the session header. The session plan already showed a rich curriculum content panel (`CoachSessionCurriculumPanel`); this sprint surfaces the top-level curriculum level chip and goal text that appear before the plan details.

## Files Modified

| File | Change |
|---|---|
| `src/app/coach/sessions/[sessionId]/page.tsx` | Template fetch now includes `curriculum_level_key` and `template_goal`; session header renders template chip, curriculum level chip, and goal text |

## Template Fetch Enhancement

Previously: `select('name')` only.

Now: `select('name, curriculum_level_key, template_goal')` using `rawDb` cast (migration 067 fields not in generated types). Graceful fallback — fields are absent before migration 067 is applied; `null` coerce prevents render errors.

## Session Header Additions

- **Template chip** — `"Template: {name}"` as a muted border pill
- **Curriculum level chip** — `"{curriculum_level_key}"` as a lime accent pill (only shown if field is populated)
- **Session goal** — `"Goal: {template_goal}"` as a body line below the chips (only shown if populated)

## Schema-Missing Safety

`rawDb.from('templates').select('name, curriculum_level_key, template_goal')` — if migration 067 has not been applied, the query may return missing column results. The `?? null` coerce on each field means the page renders correctly with template name only (same as before).

## No Writes

Read-only. No server actions. No DB mutations.
