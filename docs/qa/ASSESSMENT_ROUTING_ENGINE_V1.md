# Assessment Routing Engine V1 — QA Checklist

**Sprint:** Mega Sprint 1421–1450
**Date:** 2026-06-03
**Scope:** Template resolver · Purpose picker · Ball-level template loading · DONNA explanation · Director override · Fallback safety

---

## 1 — Template Resolver (pure TS)

| # | Check | Pass/Fail |
|---|---|---|
| 1 | Player with `stage = "red_ball"` → resolver returns `templateName = "Red Ball Assessment"` | |
| 2 | Player with `stage = "orange_ball"` → resolver returns `templateName = "Orange Ball Assessment"` | |
| 3 | Player with `stage = "green_dot"` → resolver returns `templateName = "Green Dot Assessment"` | |
| 4 | Player with `stage = "yellow_ball"` → resolver returns `templateName = "Yellow Ball Assessment"` | |
| 5 | Player with `stage = null` → resolver returns `templateName = "Core Assessment Template"` | |
| 6 | New player (`status = "pending"`) → resolver defaults to `purpose = "quick_placement_snapshot"` | |
| 7 | Returning player with known stage → resolver defaults to `purpose = "development_assessment"` | |
| 8 | `requestedPurpose = "level_readiness_assessment"` + Orange Ball stage → `mode = "deep"`, `templateName = "Orange Ball Assessment"` | |
| 9 | `requestedPurpose = "quick_placement_snapshot"` → always `templateName = "Core Assessment Template"`, `mode = "quick"` | |
| 10 | Resolver returns a non-empty `donnaExplanation` for every purpose × stage combination | |

---

## 2 — Template Loader (`loadAssessmentFormConfigByName`)

| # | Check | Pass/Fail |
|---|---|---|
| 11 | When "Red Ball Assessment" exists in DB → loader returns it with `fallbackUsed = false` | |
| 12 | When "Orange Ball Assessment" exists → sections and skills load correctly | |
| 13 | When a template name is not in DB → loader returns Core Assessment Template with `fallbackUsed = true` | |
| 14 | `fallbackReason` is a non-empty human-readable string when fallback is used | |
| 15 | Ball-level templates load directly from `is_global = true` rows — no `academy_assessment_templates` lookup | |
| 16 | Mode filter applied correctly: `standard` → only `appears_in_standard = true` skills | |
| 17 | Mode filter: `deep` → all `appears_in_deep = true` skills included | |
| 18 | Mode filter: `quick` → only `appears_in_quick = true` skills; empty sections excluded | |

---

## 3 — AssessmentsTab (server component)

| # | Check | Pass/Fail |
|---|---|---|
| 19 | Tab renders without error for all player stages | |
| 20 | Tab correctly passes `playerStage` to resolver | |
| 21 | Resolved `templateName` and `donnaExplanation` reach the `AssessmentPurposePicker` | |
| 22 | `formConfig` passed to picker matches the resolved template | |
| 23 | When template tables are missing (migration not applied), tab shows graceful fallback empty state | |

---

## 4 — DONNA Explanation

| # | Check | Pass/Fail |
|---|---|---|
| 24 | DONNA explanation chip is visible above the assessment form | |
| 25 | Explanation includes the player's first name when available | |
| 26 | Explanation includes the template name (e.g., "Orange Ball Assessment") | |
| 27 | `quick_placement_snapshot` explanation mentions "Quick Placement Snapshot" | |
| 28 | `development_assessment` explanation mentions the stage (e.g., "orange ball stage") | |
| 29 | `level_readiness_assessment` explanation mentions "deep mode" and "advance" | |
| 30 | `evaluation_assessment` explanation mentions "trial, group change, or program review" | |
| 31 | Confidence badge shows "Strong match" / "Good match" / "Best available" correctly | |

---

## 5 — Director Override (Purpose Picker)

| # | Check | Pass/Fail |
|---|---|---|
| 32 | "Change assessment type" toggle is visible below the DONNA chip | |
| 33 | Clicking toggle expands 4 purpose buttons | |
| 34 | Currently active purpose is highlighted with lime border | |
| 35 | Each purpose button shows label + description | |
| 36 | Clicking a different purpose triggers a loading spinner ("Loading template…") | |
| 37 | After override: DONNA explanation updates to match new purpose | |
| 38 | After override: `formConfig` sections/skills update to match new template | |
| 39 | After override: template name badge updates | |
| 40 | Clicking the same purpose that is already active does nothing (no server call) | |
| 41 | Server action enforces academy_id membership — unauthorized users get an error | |

---

## 6 — Fallback Safety

| # | Check | Pass/Fail |
|---|---|---|
| 42 | When ball-level template not seeded: orange warning strip shows `fallbackReason` | |
| 43 | Fallback warning message mentions the missing template name | |
| 44 | Fallback to Core Template is silent when using `quick_placement_snapshot` (no warning) | |
| 45 | Core Template fallback still shows a functional assessment form | |
| 46 | No parent or player data is exposed through the assessment form | |

---

## 7 — Role Safety

| # | Check | Pass/Fail |
|---|---|---|
| 47 | `loadTemplateForPurposeAction` verifies `academy_memberships` before returning data | |
| 48 | Users without academy membership get `error: "Access denied."` | |
| 49 | Assessment form data (scores, notes) never reaches parent or player portals via this component | |

---

## 8 — TypeScript

| # | Check | Pass/Fail |
|---|---|---|
| 50 | `npx tsc --noEmit` passes with zero errors | |

---

## Known limitations / follow-up work

- Ball-level global templates are read-only — directors cannot customize them via the Template Editor (that editor only works on the academy's Core Template clone). Ball-level template customization is a future sprint.
- High Performance stage is not yet mapped to a template — it falls back to Core Assessment Template. An "HP Assessment" template seed is a future sprint.
- Purpose override triggers a server action round-trip to reload the template. For very slow connections, there may be a brief delay. Optimistic UI (pre-loading all configs) is a future performance sprint.
- `playerStatus` and `playerFirstName` are optional props added to `AssessmentsTab` — the player profile `page.tsx` currently passes only `playerId`, `academyId`, and `playerStage`. Status and name props default to `null`, meaning the resolver will work but without personalized DONNA copy or status-based routing. Wire these props from `page.tsx` in a follow-up.
