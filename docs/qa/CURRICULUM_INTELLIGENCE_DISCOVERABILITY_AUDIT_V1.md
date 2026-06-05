# Curriculum Intelligence Discoverability Audit V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 1996–2005
**Purpose:** Measure clicks-to-reach for each curriculum intelligence surface after this sprint.

---

## Target: ≤ 2 clicks to reach any curriculum intelligence signal

---

## Audit Results

### Most Blocked Level

| Before | After |
|---|---|
| Not visible anywhere | Visible on `/director/curriculum` without any click |

**Clicks to reach:** 0 (surface-level, above the fold)
**Pass:** ✓

---

### Stall Count + Completion %

| Before | After |
|---|---|
| Not visible | Shown inline in `CurriculumIntelligenceCard` on curriculum page |

**Clicks to reach:** 0
**Pass:** ✓

---

### Curriculum Improvement Analysis (DONNA)

| Before | After |
|---|---|
| Required knowing `?improve=[levelKey]` URL param | Improve button on every level row in the tree + direct link from `CurriculumIntelligenceCard` |

**Clicks to reach:** 1 (click Improve on the intelligence card or level tree)
**Pass:** ✓

---

### Top Tagged Coach Concern

| Before | After |
|---|---|
| Not visible anywhere in director UI | Shown in `CurriculumIntelligenceCard` on curriculum page |

**Clicks to reach:** 0
**Pass:** ✓

---

### Curriculum Coverage Grade

| Before | After |
|---|---|
| Visible on `/director/curriculum` in `CurriculumHealthPanel` | Unchanged — still visible same location |

**Clicks to reach:** 0
**Pass:** ✓

---

### Curriculum Bottleneck in DONNA Brief

| Before | After |
|---|---|
| Not present in DONNA attention engine | Added as `curriculum_bottleneck` priority item — surfaces in `DonnaAcademyCOOBriefCard` on `/director` |

**Clicks to reach:** 0 (DONNA brief is expanded by default on the director dashboard)
**Pass:** ✓

---

### Curriculum Health (3→4 dimensions)

| Before | After |
|---|---|
| 3/8 dimensions scored (gates, drills, cues) | 4/8 for levels with `curriculum_track_requirements` data (adds skills dimension, weight 15) |

**Clicks to reach:** 0 (inline in `CurriculumHealthPanel`)
**Pass:** ✓

---

### Top 5 Curriculum Priorities

| Before | After |
|---|---|
| No ranked view | Computed by `rankCurriculumAttention()` — surfaced via `CurriculumIntelligenceCard` |

**Clicks to reach:** 0 (top priorities drive the intelligence card)
**Pass:** ✓

---

## Brian Test

**Question:** "Where is my curriculum struggling right now?"
**Time to answer:** < 5 seconds — `CurriculumIntelligenceCard` is the first content below the status hero card
**Answer visible on load:** ✓ level name + stall count + completion % + Improve action

---

## Remaining Gaps (post-sprint)

| Surface | Status | Path to fix |
|---|---|---|
| Evidence drought warning ("no evidence in 14 days") | Not surfaced — `player_evidence_records` has 0 rows | Needs evidence collection to have data |
| Per-level tagged concern breakdown | Not surfaced — bottleneck loader aggregates globally, not per-level | Could extend `LevelBottleneckSignal` to include per-level concern tags |
| Coverage dimensions 5-8 (assessment, missions, badges, parent guidance) | Still excluded from scoring | Need data sources for each dimension |
| Gate confirmation UI | Not built | Deferred to Sprint 107 |
