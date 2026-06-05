# DONNA Executive Intelligence Activation V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2006–2010
**Goal:** Close the gap between what DONNA knows and what the director immediately reads.

---

## What Was Activated

### Phase 1 — Executive Brief Connected to Top Action

**File:** `src/app/director/page.tsx`

**Before:** `constitutionBrief` was built from hardcoded counters (`attentionCount`, `coachRecapsMissing`, etc.). The attention engine's ranked output (`cooAttentionReport.topAction`) was never read.

**After:** When `cooAttentionReport.topAction` exists, the brief leads with its label. The top-ranked priority — which can now be a curriculum bottleneck, player stall, assessment gap, or any future attention item — becomes the first sentence the director reads.

**Example before:**
> "3 players need attention, 2 coach recaps missing."

**Example after:**
> "Orange Ball 2 — 3 players stalled at 24% completion."

**Fallback preserved:** No-players setup state and the all-clear state are unchanged. The hardcoded counter list remains as the final fallback when the attention engine yields no items but raw counts exist.

---

### Phase 2 — Academy Health Curriculum Row Activation

**File:** `src/lib/donna/intelligence/academyHealthBrief.ts`

**Before:** `buildCurriculumSection()` read only `curriculumTemplateCoverageGapCount`, `curriculumGaps.length`, `curriculumDraftCount`. Bottleneck fields in `DirectorDonnaContext` were ignored.

**After:** When `mostBlockedLevelStalledCount > 0`, the curriculum health row now leads with:
> `Orange Ball 2 — 3 players stalled at 24% completion`

When `topTaggedConcern` is set, it appends:
> `· top concern: backhand`

Coverage gaps and drafts follow if present. Status becomes `action_needed` when a bottleneck exists.

---

### Phase 3 — Source Map Reality Update

**File:** `src/lib/donna/academyHealthSourceMap.ts`

**Before:** `curriculum_bottleneck` KPI was marked `availability: 'deferred'` with stale table/field references to `coach_notes` and `player_curriculum_levels`.

**After:** Updated to `availability: 'partial'`. Tables corrected to `player_requirement_progress`, `curriculum_levels`, `coach_observations`. `blockedBy` cleared. Copy updated to reflect actual data available.

---

### Phase 4 — Tagged Curriculum Concern Attention Item

**File:** `src/lib/donna/donnaAttentionRankingEngine.ts`

**Before:** `topTaggedConcern` existed in `DirectorDonnaContext` and was shown only as a footnote in `CurriculumIntelligenceCard`. It had no ranked attention priority item.

**After:** New priority item `tagged_curriculum_concern` (score base 45, category `curriculum`, severity `medium`). Fires when `ctx.topTaggedConcern` is non-null. Links to the curriculum improvement flow when `mostBlockedLevelKey` is available.

**Also wired:**
- `src/lib/donna/proactive/dashboardAttentionContext.ts` — `topTaggedConcern` added to `DashboardAttentionInput` and mapped in `buildDashboardAttentionContext()`
- `src/app/director/page.tsx` — extracts `topTaggedConcerns[0].tag` from bottleneck and passes as `topTaggedConcern`

---

### Phase 5 — Weakest Domain Completion % Surfaced

**Files:** `src/lib/curriculum/curriculumAttentionRanking.ts`, `src/app/director/curriculum/_components/CurriculumIntelligenceCard.tsx`

**Before:** `lowestDomainCompletionPct` was computed in `LevelBottleneckSignal` but dropped when mapping to `CurriculumAttentionPriority`. The card showed `weak forehand` with no %.

**After:** `lowestDomainCompletionPct` is now carried through `CurriculumAttentionPriority` and rendered inline:
> `weak forehand — 12%`

Makes the domain signal measurable rather than just labeled.

---

## What Now Appears in DONNA Today (`/director` executive brief)

| Signal | Before | After |
|---|---|---|
| Top-ranked attention priority | Never shown in brief text | First sentence of brief when topAction exists |
| Curriculum bottleneck | Invisible in brief | Can lead the brief: "Orange Ball 2 — 3 players stalled at 24%" |
| Tagged curriculum concern | Invisible in brief | Ranked at 45 — can appear in DONNA COO brief list and inform brief text |
| Hardcoded counter list | Always used | Now fallback only |

---

## What Now Appears in Academy Health (`buildAcademyHealthBrief`)

| Signal | Before | After |
|---|---|---|
| Curriculum health row | Template gaps + structural gaps + drafts | Bottleneck level + stall count + completion % leads when stalls > 0 |
| Top tagged concern | Not shown | Appended when `ctx.topTaggedConcern` is set |
| Curriculum health status | `action_needed` only when template gaps or structural gaps | Now also `action_needed` when stall data signals a bottleneck |

---

## What Still Remains Hidden

| Signal | Location | Why |
|---|---|---|
| `skillTaggedObservationsLast30Days` | `CurriculumBottleneckResult` | Not mapped to `DirectorDonnaContext`; no surface yet |
| `topTaggedConcerns[1..4]` (tags 2–5) | `CurriculumBottleneckResult` | Only index [0] consumed |
| Evidence drought | `player_evidence_records` | 0 rows — no pipeline yet generating evidence |
| Per-level tagged concern breakdown | `coach_observations` | Bottleneck loader aggregates globally; no per-level concern breakdown |

---

## What Remains Blocked

| Signal | Blocker |
|---|---|
| Coverage dimensions 5–8 | No data sources for assessment criteria, missions, badges, parent guidance |
| `evidence_threshold_met` gate evaluation | Threshold field is free-text; no parser built |
| Director gate confirmation UI | Sprint 107: deferred |
| `template_block_exercises` RLS | Migration 058 not applied to live DB |

---

## Source Map Status

| KPI | Was | Now |
|---|---|---|
| `curriculum_bottleneck` | `deferred` | `partial` — live data from `player_requirement_progress` |
| `player_attention_risk` | `partial` | unchanged |
| `wrap_up_coverage_rate` | `partial` | unchanged |
| `group_health` | `deferred` | unchanged — no data source yet |

---

## Acceptance Criteria

| Criterion | Status |
|---|---|
| Executive brief reads from `cooAttentionReport.topAction` | ✓ |
| Curriculum bottleneck can lead DONNA Today | ✓ |
| Academy Health curriculum row includes bottleneck signal | ✓ |
| Source map updated from `deferred` to `partial` | ✓ |
| Tagged concern can appear as attention item | ✓ |
| `topTaggedConcern` wired through dashboard context path | ✓ |
| Weakest domain % surfaced in `CurriculumIntelligenceCard` | ✓ |
| No new schema | ✓ |
| No migrations | ✓ |
| No redesign | ✓ |
| TypeScript clean | ✓ |

---

## Recommended Next Sprint

**Highest remaining ROI:** Wire `topTaggedConcerns[1..4]` — the ranked concern list beyond the top tag is computed but discarded. A simple "Top 3 coach concerns this month" block in `CurriculumIntelligenceCard` would surface patterns that currently require reading individual observations.

**Second priority:** `skillTaggedObservationsLast30Days` — map this count to `DirectorDonnaContext` and use it to gate the `tagged_curriculum_concern` priority item on count ≥ 2 rather than presence alone.
