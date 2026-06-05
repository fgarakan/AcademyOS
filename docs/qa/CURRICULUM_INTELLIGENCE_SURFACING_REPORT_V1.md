# Curriculum Intelligence Surfacing Report V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 1996–2005
**Purpose:** Document what intelligence was surfaced, what remains hidden, what is still blocked, and what to build next.

---

## What Was Surfaced This Sprint

### CurriculumIntelligenceCard (new)
- **File:** `src/app/director/curriculum/_components/CurriculumIntelligenceCard.tsx`
- **Location:** Above the fold, `/director/curriculum` page — between status hero and spine section
- **Shows:** Most blocked level name, stalled player count, avg completion %, weakest domain, Improve link, top tagged coach concern, curriculum attention score chip (Healthy / Needs Attention / Critical)
- **Data source:** `loadCurriculumBottleneck()` → `rankCurriculumAttention()`

### CurriculumAttentionRanking (new)
- **File:** `src/lib/curriculum/curriculumAttentionRanking.ts`
- **Function:** Deterministic priority scorer combining bottleneck signals + coverage gaps
- **Output:** Top 5 priorities sorted by score, attention score, top concern

### DONNA Attention Engine — curriculum_bottleneck (new item)
- **File:** `src/lib/donna/donnaAttentionRankingEngine.ts`
- **Priority id:** `curriculum_bottleneck`
- **Triggers when:** `mostBlockedLevelStalledCount > 0`
- **Severity:** `high` when ≥3 stalled or >70% completion deficit; `medium` otherwise
- **Surfaces in:** `DonnaAcademyCOOBriefCard` on `/director` dashboard
- **Score base:** 52 + per-stall amplification, capped at 85

### DirectorDonnaContext bottleneck fields (extended)
- `mostBlockedLevelName`, `mostBlockedLevelKey`, `mostBlockedLevelStalledCount`, `mostBlockedLevelAvgCompletion`, `topTaggedConcern`
- Populated by `loadCurriculumBottleneck()` in the aggregator (non-fatal, zero-defaults on failure)

### DashboardAttentionContext bottleneck passthrough (extended)
- 4 bottleneck fields added to `DashboardAttentionInput`
- Mapped in `buildDashboardAttentionContext()` — bridges director page data into the DONNA attention pipeline

### Curriculum Coverage: 3→4 dimensions (Phase 5)
- **File:** `src/app/director/curriculum/page.tsx`
- **Change:** Queries `curriculum_track_requirements` count per level; passes as `skillCount`; removes `'skills'` from `excludeFromScoring` when count > 0
- **Effect:** Levels with seeded requirements (Orange Ball 1-3: 32 requirements) now score 4 dimensions (gates 25 + drills 20 + cues 15 + skills 15 = 75 max). Other levels remain on 3-dimension scoring.

---

## What Is Still Hidden (exists and runs, not shown)

| Signal | Location | Why hidden | Fix path |
|---|---|---|---|
| Evidence drought warning | `player_evidence_records` | Table exists, 0 rows — no director has submitted assessment evidence via the new pipeline | Will surface automatically as evidence accumulates |
| Per-level tagged concern | `coach_observations.tags` | Bottleneck loader aggregates globally; no per-level breakdown | Extend `LevelBottleneckSignal` to include per-level concern tags |
| Academy-wide improvement overview | All improve panels | Currently only per-level (`?improve=[key]`) | Surface `CurriculumIntelligenceCard` Improve links as overview entry points |

---

## What Is Still Blocked

| Signal | Blocker | Fix path |
|---|---|---|
| Coverage dimensions 5-8 | No data sources for assessment criteria, missions, badges, parent guidance | Need DB data or manual entry before scoring |
| `evidence_threshold_met` auto-transition | Threshold field is free-text; no parser built | Sprint 107: threshold evaluation |
| Director gate confirmation UI | Not built | Sprint 107: confirmation UI + server action |
| `template_block_exercises` RLS | Migration 058 not applied to live DB | Manual: apply migration 058 in Supabase SQL editor |

---

## Academy Health Candidates

These signals are now computable and should appear in an Academy Health summary:

| Signal | Source | Readiness |
|---|---|---|
| Most blocked level name + stall count | `loadCurriculumBottleneck()` | **Ready now** |
| Aggregate requirement completion % | `player_requirement_progress` | **Ready now** — compute avg across all `levelBottlenecks` |
| Evidence collection pace (last 30 days) | `player_evidence_records` | Ready once evidence rows exist |
| Coverage grade | `buildCurriculumCoverageReport()` | **Ready now** — already in `CurriculumHealthPanel` |

---

## DONNA Today Brief Candidates

These signals are now feeding DONNA:

| Signal | Status |
|---|---|
| Most blocked level | ✓ Live — `curriculum_bottleneck` priority in attention engine |
| Top tagged concern | ✓ Available in `DirectorDonnaContext.topTaggedConcern` — surfaced in `CurriculumIntelligenceCard` on curriculum page |
| Evidence drought | Not yet wired — needs evidence rows to trigger |

---

## Next Recommended Sprint

**Sprint priority:** Wire `curriculum_bottleneck` attention item into the DONNA COO brief's text narrative.

Currently the `curriculum_bottleneck` priority appears in the attention item list but may not appear in DONNA's text summary (the `constitutionBrief` on the director dashboard). Wiring it into the brief text would mean Brian sees:

> "Orange Ball 2 — 3 players stalled at 24% completion. Open the improvement analysis to identify root causes."

as the first curriculum signal in his daily brief.

**Estimated effort:** 1 file (`director/page.tsx`) — extend the `constitutionBrief` logic to include the bottleneck signal when it is the top curriculum item.

---

## Sprint Summary

| Acceptance Criterion | Status |
|---|---|
| Improve flow discoverable | ✓ — button on every level row + intelligence card |
| Label mismatch fixed | ✓ — LEVEL_LABELS updated in Mega Sprint 1991–1995 |
| Bottleneck data surfaced | ✓ — CurriculumIntelligenceCard above the fold |
| Curriculum Intelligence summary created | ✓ |
| DONNA brief enhanced | ✓ — curriculum_bottleneck priority item |
| Curriculum Health improved | ✓ — 3→4 dimensions for levels with requirements |
| Curriculum priorities ranked | ✓ — curriculumAttentionRanking.ts |
| Discoverability audited | ✓ — CURRICULUM_INTELLIGENCE_DISCOVERABILITY_AUDIT_V1.md |
| No new schema | ✓ |
| No migrations | ✓ |
| TypeScript clean | ✓ |
