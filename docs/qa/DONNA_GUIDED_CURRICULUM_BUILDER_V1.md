# DONNA-Guided Curriculum Builder V1 — QA Checklist

**Sprint:** Mega Sprint 1551–1640
**Date:** 2026-06-03

---

## Workflow: "Help me improve Orange Ball 2"

| Step | Expected Behavior | Pass/Fail |
|---|---|---|
| 1 | Director types "Help me improve Orange Ball 2" | |
| 2 | DONNA matches `curriculum_operator` pattern | |
| 3 | DONNA extracts level key `orange_ball_2`, label `Orange Ball 2` | |
| 4 | DONNA navigates to `/director/curriculum?improve=orange_ball_2` | |
| 5 | `DonnaCurriculumContextPanel` renders on the curriculum page | |
| 6 | Panel has `data-donna-focus-id="donna-curriculum-context"` | |
| 7 | `DonnaHighlightBanner` shows "DONNA: Curriculum: Orange Ball 2" | |

---

## Context-First Summary (DONNA-First Rule)

| # | Check | Pass/Fail |
|---|---|---|
| 8 | Panel shows current level state BEFORE asking any question | |
| 9 | Panel shows current gate count and skill count | |
| 10 | Panel shows evidence signal count and freshness | |
| 11 | Panel shows DONNA's analysis note (suggestion count + top confidence) | |
| 12 | Panel ends with ONE focused question to the director | |
| 13 | Panel does NOT start with "What would you like to do?" | |
| 14 | Panel shows `readinessStatus` from `calculateLevelReadiness` | |
| 15 | Panel shows top priorities from `calculateDevelopmentPriorities` | |

---

## Improvement Suggestions

| # | Check | Pass/Fail |
|---|---|---|
| 16 | At least one suggestion renders when evidence records exist | |
| 17 | Each suggestion shows: Recommendation, Confidence badge, Evidence count, Affected players | |
| 18 | Confidence badge shows HIGH/MEDIUM/LOW with correct color | |
| 19 | Supporting Signals section shows evidence citations | |
| 20 | Reasoning section explains why DONNA recommends this | |
| 21 | "Show Downstream Impact" expander shows willHappen + wontHappen lists | |
| 22 | "Will NOT happen" list explicitly states: no automatic player movement, no parent communications | |
| 23 | "Draft This Change → Review Queue" button is visible | |

---

## Draft Creation

| # | Check | Pass/Fail |
|---|---|---|
| 24 | Clicking "Draft This Change" calls `donnaCurriculumImprovementDraftAction` | |
| 25 | A `proposed_action` row is created with `target_module = 'curriculum_improvement_draft'` | |
| 26 | Draft `status = 'pending_review'` — not applied | |
| 27 | Success state shows "Draft created — review it in the Review Center" | |
| 28 | Audit log entry written | |
| 29 | `/director/review` revalidated after draft creation | |

---

## Level Extraction

| # | Check | Pass/Fail |
|---|---|---|
| 30 | "orange ball 2" → key `orange_ball_2`, label `Orange Ball 2` | |
| 31 | "red ball" → key `red_ball`, label `Red Ball` | |
| 32 | "yellow ball 1" → key `yellow_ball_1`, label `Yellow Ball 1` | |
| 33 | "green dot" → key `green_dot`, label `Green Dot` | |
| 34 | Unrecognized level → null, graceful fallback | |

---

## Safety

| # | Check | Pass/Fail |
|---|---|---|
| 35 | No curriculum content is changed by viewing the panel | |
| 36 | No curriculum content is changed by creating a draft | |
| 37 | Draft requires director approval in Review Center | |
| 38 | `donnaCurriculumImprovementDraftAction` enforces academy_id scoping | |
| 39 | Only director or head_coach can create curriculum improvement drafts | |
