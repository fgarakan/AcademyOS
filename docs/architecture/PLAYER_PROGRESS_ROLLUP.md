# Player Progress Rollup Engine — Architecture

**Sprint:** Mega Sprint 1211-1230
**Last updated:** 2026-06-02

---

## Purpose

The progress rollup computes a `ProgressRollup` from `EvidenceRecord[]`. It is pure TypeScript — no DB calls. Called server-side after the aggregator returns evidence records.

---

## Input

```typescript
computeProgressRollup(
  playerId: string,
  records: EvidenceRecord[],
  context?: {
    activePriorityCount?: number
    currentLevelName?: string | null
    nextLevelName?: string | null
  }
): ProgressRollup
```

---

## Output: ProgressRollup

```typescript
{
  playerId
  computedAt
  progressStatus          // on_track | needs_attention | ready_for_review | missing_data | stalled
  activePriorityCount
  pathwaySignals[]        // per pathway: strongest area, weakest, recent improvement/decline, count, latest date
  readinessBlockers[]     // high/medium/low severity blockers with description
  assessmentFreshnessDays // days since last assessment_score record
  observationFreshnessDays
  attendanceConsistency   // consistent | inconsistent | missing | unknown
  parentUpdateFreshnessDays
  missionProgress         // { active, completed, pending }
  donnaSummary            // one-sentence DONNA-readable summary
  recommendedNextAction   // specific, actionable recommendation
  missingEvidence[]       // list of missing evidence types
  totalEvidenceCount
}
```

---

## Progress Status Derivation

| Status | Condition |
|---|---|
| `missing_data` | `records.length === 0` |
| `stalled` | No evidence activity in last 60 days AND records exist |
| `needs_attention` | ≥ 1 high-severity blocker |
| `ready_for_review` | Assessment < 30 days old + active missions + consistent attendance |
| `on_track` | Default when no blockers |

---

## Readiness Blockers

Three automatic blockers:

| Blocker type | Trigger | Severity |
|---|---|---|
| `missing_assessment` | No assessment OR last assessment > 90 days | high |
| `missing_evidence` | No coach observations OR last observation > 45 days | medium |
| `attendance_gap` | No attendance records OR < 3 in last 30 days | medium |
| `stalled` | No evidence activity in last 60 days | high |

---

## Pathway Signals

Four pathways are computed: `skill`, `competition`, `fitness`, `mental_performance`.

For each pathway, the rollup identifies:
- `strongestArea` — highest-confidence requirement or summary from this pathway
- `weakestArea` — lowest-confidence requirement
- `recentImprovement` — most recent reassessment_change with "improved" text
- `recentDecline` — most recent reassessment_change with "declined" text
- `evidenceCount` — total records on this pathway
- `latestDate` — most recent evidence date

---

## DONNA Summary Format

```
{player} at {level}. Last assessed {N} days ago. {N} active missions. {N} blocker(s) identified.
```

Examples:
- "Player at Orange 1. Last assessed 12 days ago. 1 active mission."
- "Player at Red 2. No assessment on record. No active missions. 2 blockers identified."
- "Player at Green Dot. Recently assessed. 3 active missions."

---

## Staleness Thresholds

| Signal | Threshold |
|---|---|
| Assessment stale | > 90 days |
| Observation stale | > 45 days |
| Parent update stale | > 60 days |
| Stall detection | > 60 days no activity |

---

## Ownership-aware rollup

The rollup respects ownership boundaries:
- Only `anonymized_at IS NULL` records are used (aggregator excludes anonymized records)
- Parent-visible pathwaySignals use only `visible_to_parent = true` records
- Coach-visible rollup excludes `visible_to_director = true AND visible_to_coach = false` records (director-only overrides)
- After player exit, only `portability_status = 'portable'` records should be used for passport-style summary

---

## V2 Improvements (deferred)

- Cached rollup table (`player_progress_snapshots`) to avoid recomputing on every page load
- Rollup versioning — track rollup history over time
- Rollup diff — detect changes between consecutive rollups
- Event-driven invalidation — rollup recomputed when evidence records change
