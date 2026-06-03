# Evidence → Level Readiness Engine V1 — QA Checklist

**Sprint:** Mega Sprint 1481–1510
**Date:** 2026-06-03
**Scope:** Level readiness calculator · DONNA readiness answer · Player profile card · Attention queue integration

---

## 1 — Level Readiness Calculator (pure TS)

| # | Check | Pass/Fail |
|---|---|---|
| 1 | `calculateLevelReadiness` returns `readiness_status = 'insufficient_evidence'` when fewer than 2 evidence records exist | |
| 2 | Returns `'ready'` when score ≥ 75, ≥ 3 categories represented, critical categories met, no high blockers, no stale evidence | |
| 3 | Returns `'close'` when score ≥ 60, ≥ 2 categories, at most 1 high blocker | |
| 4 | Returns `'not_ready'` when score < 60 or critical blockers present | |
| 5 | Expired records are placed in `staleEvidence` array, not in `supportingEvidence` or `blockingEvidence` | |
| 6 | `supportingEvidence` contains only records with `evidence_strength = 'strong'` and `confidence >= 70` | |
| 7 | `blockingEvidence` contains only records with `evidence_strength = 'weak'` or `confidence < 40` | |
| 8 | `missingCategories` lists all required categories (skill, competition, movement, mental_performance, behavior) not represented in fresh records | |
| 9 | `confidence` is 0–100 and reflects number of categories, freshness, and avg confidence | |
| 10 | `readinessScore` is 0–100 weighted average of fresh record confidence × weight | |
| 11 | `isDirectorReviewRecommended = true` when status is `'ready'` or `'close'` | |
| 12 | `donnaExplanation` is non-empty for all four statuses | |
| 13 | `recommendedNextAction` differs by status: Level Readiness Assessment (close/ready), Development Assessment (not_ready/insufficient) | |

---

## 2 — DONNA Readiness Answer

| # | Check | Pass/Fail |
|---|---|---|
| 14 | `buildIsReadyToMoveUpAnswer` uses `calculateLevelReadiness` internally — no separate logic | |
| 15 | `answer` field = `donnaExplanation` from the engine | |
| 16 | `citedEvidenceIds` contains IDs from `supportingEvidence` | |
| 17 | `missingEvidenceNote` = missing categories joined, or null if none | |
| 18 | `safeForParent = false`, `safeForPlayer = false` | |
| 19 | `isSafe = true` (safe for director and coach) | |

---

## 3 — Level Readiness Card (player profile)

| # | Check | Pass/Fail |
|---|---|---|
| 20 | Card renders in the Assessments tab above the assessment form | |
| 21 | Status badge shows correct label: "Ready for Review" / "Close" / "Not Ready" / "Insufficient Evidence" | |
| 22 | Status badge color: green (ready), lime (close), orange (not_ready), muted (insufficient) | |
| 23 | DONNA explanation is displayed below the badge | |
| 24 | Stale evidence warning appears when `staleEvidence.length > 0` | |
| 25 | Missing categories are shown as chips when status is not `insufficient_evidence` | |
| 26 | "Recommended" action text is correct for the player's status | |
| 27 | "View Evidence" link points to `/director/players/{id}#evidence` | |
| 28 | Confidence %, evidence count, and readiness score are shown in the footer | |
| 29 | Card renders without errors when evidence table is missing (graceful fallback via aggregator) | |
| 30 | Card renders without errors when player has zero evidence records (shows `insufficient_evidence` state) | |

---

## 4 — Attention Queue Integration

| # | Check | Pass/Fail |
|---|---|---|
| 31 | Players with `promotion_ready = true` still appear as `medium` priority level readiness items (existing behaviour preserved) | |
| 32 | Active players with `overall_score >= 7.0` and `promotion_ready != true` appear as `low` priority level readiness items | |
| 33 | Players with `overall_score >= 7.0` whose assessment is overdue (`assessment_status = 'overdue'`) are NOT surfaced as readiness candidates | |
| 34 | A player already included in the `promotion_ready` set is not duplicated in the evidence-based signal | |
| 35 | New items have `category = 'level_readiness_review'` and appear in `filters: ['all', 'players']` | |
| 36 | Item reason mentions the actual score (e.g., "Assessment score 7.2/10") | |
| 37 | DONNA explanation on the attention queue item is clear and accurate | |
| 38 | Recommended action says "Open player profile and review evidence before running a Level Readiness Assessment" | |

---

## 5 — Safety

| # | Check | Pass/Fail |
|---|---|---|
| 39 | No automatic level movement triggered by any code in this sprint | |
| 40 | No parent or player data exposed via the readiness card or DONNA answer | |
| 41 | Evidence fetched with `visibleToRole: 'director'` — coach-only evidence is excluded | |
| 42 | DONNA readiness answer has `safeForParent = false` and `safeForPlayer = false` | |
| 43 | `isDirectorReviewRecommended = true` only — never implies automatic promotion | |

---

## 6 — TypeScript

| # | Check | Pass/Fail |
|---|---|---|
| 44 | `npx tsc --noEmit` passes with zero errors | |

---

## Known limitations / follow-up work

- `LevelReadinessCard` fetches all evidence records for the player (up to 60) on every tab load. A future sprint can cache this or make it lazy-loaded.
- `AssessmentsTab` does not yet pass `currentLevelName` or `nextLevelName` to the card — these default to `null`, so the DONNA explanation shows generic text without level names. Wire from the player profile `page.tsx` in a follow-up.
- The attention queue `level_readiness_review` section uses `overall_score` from `v_player_summary` as a proxy for evidence-based readiness. In a future sprint, pre-compute `readiness_status` per player and store it so the attention queue can use the true engine output without per-player evidence queries.
- No promotion draft creation UI is built in this sprint (sprint requirement 7). `isDirectorReviewRecommended` is flagged but the actual "create promotion draft" action is a follow-up sprint.
