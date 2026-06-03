# Evidence → Development Priorities Engine V1 — QA Checklist

**Sprint:** Mega Sprint 1511–1540
**Date:** 2026-06-03
**Scope:** Priorities engine · DONNA priority answers · Player profile card · Attention queue integration

---

## 1 — Development Priority Engine (pure TS)

| # | Check | Pass/Fail |
|---|---|---|
| 1 | `calculateDevelopmentPriorities` returns empty `topPriorities` when no evidence exists | |
| 2 | Returns 1–3 priorities ranked from most to least critical | |
| 3 | Priorities sourced from weak/blocking evidence records (low confidence, weak strength) | |
| 4 | Priorities from `readinessResult.blockingEvidence` rank higher than generic weak records | |
| 5 | Each priority has: rank, category, label, description, evidenceSource, urgency, isBlockingAdvancement | |
| 6 | `isBlockingAdvancement = true` when record is in readiness blocking set | |
| 7 | Urgency = `'high'` for blocking priorities, `'medium'` for rank-1 non-blocking, `'low'` for lower ranks | |
| 8 | Strengths sourced from strong evidence records (strength=strong, confidence≥70) | |
| 9 | Maximum 4 strengths returned, sorted by confidence descending | |
| 10 | `coachFocusAreas` contains the `description` from each top priority | |
| 11 | `recommendedNextAssessment` reflects readiness status: Level Readiness (ready/close) vs Development (not_ready/insufficient) | |
| 12 | `confidence` is 0–100 and increases with more evidence records, readiness result, and strengths | |
| 13 | `totalEvidenceUsed` = count of non-stale records | |

---

## 2 — Priority Category Classification

| # | Check | Pass/Fail |
|---|---|---|
| 14 | Evidence with `evidence_category = 'skill'` or `pathway = 'skill'` → priority `'technical'` | |
| 15 | Evidence with `evidence_category = 'tactical'` or summary containing "tactical"/"direction" → `'tactical'` | |
| 16 | Evidence with `pathway = 'competition'` → `'competition'` | |
| 17 | Evidence with `pathway = 'fitness'` or summary containing "movement"/"recovery" → `'movement'` | |
| 18 | Evidence with `pathway = 'mental_performance'` → `'mental'` | |
| 19 | Evidence with `evidence_category = 'behavior'` → `'behavior'` | |

---

## 3 — Development Priorities Card (player profile)

| # | Check | Pass/Fail |
|---|---|---|
| 20 | Card renders in the Assessments tab above the Level Readiness card | |
| 21 | When no evidence: DONNA explanation says "Run a Development Assessment first" | |
| 22 | Top priorities render as numbered list (1. Technical, 2. Competition, etc.) | |
| 23 | "Blocking" badge appears on priorities with `isBlockingAdvancement = true` | |
| 24 | Urgency badge shows correct color: red=high, orange=medium, muted=low | |
| 25 | Strengths render as green chips below the priorities | |
| 26 | Coach Focus section shows priority descriptions | |
| 27 | Recommended next assessment line appears at the bottom | |
| 28 | Confidence % and evidence count shown in card header | |
| 29 | Card renders without error when evidence table is missing (graceful fallback) | |
| 30 | `visible_to_parent = false` enforced via `visibleToRole: 'director'` in aggregator call | |

---

## 4 — DONNA Priority Answers

| # | Check | Pass/Fail |
|---|---|---|
| 31 | `buildNextWorkOnAnswer` returns "not enough evidence" when no records exist | |
| 32 | `buildNextWorkOnAnswer` returns ranked priority list in answer text | |
| 33 | `buildNextWorkOnAnswer` has `safeForParent = false`, `safeForPlayer = false` | |
| 34 | `buildWhatAreStrengthsAnswer` returns "no strong evidence signals" when no strong records | |
| 35 | `buildWhatAreStrengthsAnswer` lists strength categories from strong evidence | |
| 36 | `buildWhatAreStrengthsAnswer` cites `evidence_strength = 'strong'` record IDs | |
| 37 | Both builders have `isSafe = true` (director/coach safe) | |
| 38 | `buildTopPrioritiesAnswer` (in engine) includes "blocking advancement" note for high-urgency priorities | |
| 39 | `buildPlayerStrengthsAnswer` (in engine) includes "consistently strong assessment signals" description | |

---

## 5 — Attention Queue Integration

| # | Check | Pass/Fail |
|---|---|---|
| 40 | `AttentionCategory` union includes `'development_priority_gap'` | |
| 41 | `CATEGORY_LABELS['development_priority_gap'] = 'Priority Gap'` | |
| 42 | Active players with `overall_score != null`, `group_name != null`, `last_assessed_at != null`, `focus_areas = []` appear as `'development_priority_gap'` items | |
| 43 | Players with `assessment_status = 'overdue'` are excluded from priority gap (reassessment takes precedence) | |
| 44 | Players with no group assignment are excluded from priority gap (already in `missing_evidence`) | |
| 45 | Priority gap items have `priority = 'low'` | |
| 46 | Item reason mentions the overall score (e.g., "Assessment data (6.8/10) with no development priorities") | |
| 47 | Item recommended action points to the Assessments tab | |
| 48 | `AttentionQueueClient.tsx` renders "Priority Gap" badge without TypeScript errors | |

---

## 6 — Safety

| # | Check | Pass/Fail |
|---|---|---|
| 49 | No automatic curriculum edits triggered | |
| 50 | No automatic parent/player communication triggered | |
| 51 | All DONNA answers have `safeForParent = false`, `safeForPlayer = false` | |
| 52 | `DevelopmentPrioritiesCard` fetches evidence with `visibleToRole: 'director'` | |
| 53 | No evidence summary text reaches parent or player portals via this component | |

---

## 7 — TypeScript

| # | Check | Pass/Fail |
|---|---|---|
| 54 | `npx tsc --noEmit` passes with zero errors | |

---

## Known limitations / follow-up work

- `DevelopmentPrioritiesCard` and `LevelReadinessCard` each load evidence independently — two DB calls per tab render. A future sprint can consolidate into one evidence load in `AssessmentsTab` passed down to both cards.
- Priority labels use the category label (e.g., "Technical") rather than a specific skill label (e.g., "Serve Reliability"). The sprint prompt example "Serve Reliability" requires skill-level evidence records from the assessment evidence mapper. When skill-level records exist in `player_evidence_records`, the `extractShortLabel` function will produce more specific labels.
- `buildNextWorkOnAnswer` and `buildWhatAreStrengthsAnswer` use `require()` for lazy import to avoid circular dependencies. A future refactor can reorganise the module graph to use static imports.
- Coach Session Planning integration (sprint requirement 7) and Parent Guidance foundation (requirement 8) are not built — architecture is in place via `coachFocusAreas` and `recommendedNextAssessment` fields on the result.
