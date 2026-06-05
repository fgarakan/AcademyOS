# DONNA Attention Engine Data Activation V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2011–2015
**Goal:** Activate executive intelligence signals that already exist but never fire because the required data is not reaching the attention engine.

---

## Problem Statement

The `buildAttentionPriorities()` engine in `donnaAttentionRankingEngine.ts` contains 11+ priority items. After Sprint 2006–2010, at least 5 items were confirmed to never fire on the director dashboard path:

| Priority item | Why it never fired |
|---|---|
| `stale_review_queue` | `oldestPendingReviewAgeDays` hardcoded to `null` in bridge layer |
| `onboarding_incomplete` | `onboardingReadinessLevel` absent from dashboard context path |
| `curriculum_template_coverage_gaps` | `curriculumTemplateCoverageGapCount` absent from dashboard context path |
| `tagged_curriculum_concern` | Fired on presence alone — single observation was a false positive risk |
| `player_progress_stalls` | Evidence text blank — `playerProgressStalls[]` always `[]` on dashboard path |

This sprint supplies the missing data inputs. No new features, no new UI, no new schema, no new migrations.

---

## What Was Activated

### Phase 1 — Stale Review Queue Age

**File:** `src/app/director/page.tsx`

**Before:** `oldestPendingReviewAgeDays` was hardcoded `null` in `DashboardAttentionInput`. The `stale_review_queue` priority item (score 65–75) never fired.

**After:** Added a lightweight query — 1 row, 1 field, ordered by `created_at` ascending — that computes the age in days of the oldest pending `proposed_action` with `status = 'pending_review'`. Result passed to `buildDashboardAttentionContext`.

**When it fires:** `stale_review_queue` activates at 7+ days. A review queue untouched for a week now surfaces as a ranked attention item.

---

### Phase 2 — Onboarding Readiness Level

**File:** `src/app/director/page.tsx`

**Before:** `onboardingReadinessLevel` was absent from the director page data path. The `onboarding_incomplete` priority item (score 30–45) never fired.

**After:** Derived from values already computed on the director page — no new query required:

| Condition | Level |
|---|---|
| `activePlayers === 0 && classTemplateCount === 0` | `not_started` |
| `activePlayers === 0` or `classTemplateCount === 0` | `partial` |
| Both present, but `sessionsExist === false` | `nearly_ready` |
| All three present | `ready_signal` |

`onboarding_incomplete` fires when level is `not_started` or `partial`. New academies now receive setup guidance through the ranked attention system.

---

### Phase 3 — Curriculum Template Coverage Gap Count

**Files:** `src/app/director/page.tsx`

**Before:** `curriculumTemplateCoverageGapCount` was absent. The `curriculum_template_coverage_gaps` priority item (score 56) never fired.

**After:** Extended both existing queries by one field each (no new queries):
- `player_curriculum_states` select now includes `current_level_id`
- `templates` select now includes `curriculum_level_id`

Gap count = set difference: enrolled player levels that have no matching class template. Example: if players are enrolled at Orange Ball 2 but no template covers that level, gap count = 1.

---

### Phase 4 — Tagged Concern Confidence Gate

**Files:** `src/app/director/page.tsx`, `src/lib/donna/donnaAttentionRankingEngine.ts`

**Before:** `tagged_curriculum_concern` fired whenever `topTaggedConcern` was non-null — a single observation was enough. Risk of false positive from one coach note.

**After:** `topTaggedConcernCount` is now extracted from the bottleneck result and passed through:
- Count `≥ 2` → fires (genuine recurring concern)
- Count `= 0` → fires (count unavailable; falls back to presence-based gate — safe default)
- Count `= 1` → suppressed (single observation; insufficient signal confidence)

---

### Phase 5 — Top 3 Tagged Concerns Surface

**File:** `src/app/director/curriculum/_components/CurriculumIntelligenceCard.tsx`

**Before:** Only `topConcern` (rank #1) was displayed. `topTaggedConcerns[1..4]` were computed in `CurriculumBottleneckResult` and discarded.

**After:** Replaced single-concern display with a ranked top-3 list using `allTopConcerns` (added to `CurriculumRankingResult` in the ranking engine). Each entry shows rank number, concern label, and observation count.

**Example rendering:**
```
1. Backhand Preparation                           7×
2. Return Positioning                             4×
3. Recovery Footwork                              2×
```

---

### Phase 6 — Player Progress Stall Evidence

**File:** `src/app/director/page.tsx`

**Before:** `playerProgressStalls` was always `[]` on the director dashboard path. The evidence string for `player_progress_stalls` was blank — directors saw a priority item with no supporting names or context.

**After:** Built `PlayerProgressStall[]` by joining:
- `typedCurricRows` (with `current_level_id` from Phase 3) — for enrollment dates and levels
- `players` (already fetched via `getPlayerSummaries`) — for names

No new DB query. Up to 5 stall objects passed to `buildDashboardAttentionContext`. Severity: >270 days = `'high'`, else `'medium'`.

---

## Before / After Firing State

| Attention Item | Score | Before | After |
|---|---|---|---|
| `stale_review_queue` | 65–75 | Never fired | Fires when oldest pending review ≥ 7 days |
| `onboarding_incomplete` | 30–45 | Never fired | Fires when `not_started` or `partial` readiness |
| `curriculum_template_coverage_gaps` | 56 | Never fired | Fires when enrolled levels outnumber template coverage |
| `tagged_curriculum_concern` | 45 | Fired on presence (false positive risk) | Fires on count ≥ 2 (single observation suppressed) |
| `player_progress_stalls` | 62 | Fired but evidence blank | Fires with named player list + days stalled |

---

## What Remains Hidden

| Signal | Location | Why |
|---|---|---|
| `skillTaggedObservationsLast30Days` | `CurriculumBottleneckResult` | Not mapped to `DirectorDonnaContext` |
| Per-level tagged concern breakdown | `coach_observations` | Bottleneck loader aggregates globally |
| Evidence drought | `player_evidence_records` | 0 rows — no pipeline generating evidence |

---

## Acceptance Criteria

| Criterion | Status |
|---|---|
| `oldestPendingReviewAgeDays` live on director page | ✓ |
| `onboardingReadinessLevel` derived and passed | ✓ |
| `curriculumTemplateCoverageGapCount` computed from set difference | ✓ |
| `topTaggedConcernCount` extracted from bottleneck result | ✓ |
| `playerProgressStalls[]` built from joined data — no new queries | ✓ |
| Top-3 concerns rendered in `CurriculumIntelligenceCard` | ✓ |
| `tagged_curriculum_concern` gated on count ≥ 2 | ✓ |
| No new schema | ✓ |
| No migrations | ✓ |
| No redesign | ✓ |
| TypeScript clean | ✓ |
