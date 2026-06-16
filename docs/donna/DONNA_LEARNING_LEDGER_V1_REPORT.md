# DONNA Learning Ledger V1 Report
## Sprint 2861–2890 | 2026-06-16

---

## Mission

Build the canonical learning infrastructure for DONNA — a 13-module pipeline that captures, scores, clusters, deduplicates, reviews, and promotes learning from every conversation, coach observation, parent feedback, and direct owner teaching event.

**Core principle:** Only approved learnings influence academy intelligence. AI (OpenAI) is advisory only. Brian Dabul is the highest-trust source.

---

## Architecture

### Learning Pipeline Flow

```
Conversation / Voice / Observation / Brian Direct Teaching
          ↓
  ConversationLearningRecord (Sprint 2831–2860)
          ↓
  donnaLearningMemoryBridge.ts  ←── bridges → 
          ↓
  LearningEntry (captured)
          ↓
  donnaLearningScoringEngine.ts  ← scores (0–100)
          ↓
  donnaLearningDeduplicator.ts   ← checks for semantic duplicates
          ↓
  donnaLearningClusterEngine.ts  ← groups similar entries
          ↓
  donnaLearningReviewQueue.ts    ← surfaces to Director
          ↓
  Director Approves / Rejects    ← human gate (always)
          ↓
  donnaLearningLedger (promoted) ← influences intelligence
```

---

## Module Summary

### 1. `learningEntryModel.ts` — Canonical Learning Type

The single shared data type for all 13 modules.

**Key fields:**
| Field | Type | Purpose |
|---|---|---|
| `id` | `string` | Unique entry identifier |
| `sourceType` | `LearningSourceType` | Who/what created this learning |
| `concepts` | `AcademyOSConcept[]` | AcademyOS concepts this touches |
| `confidence` | `0–1` | DONNA's extraction confidence |
| `importance` | `0–1` | Estimated impact on intelligence |
| `frequency` | `number` | How many times observed |
| `sourceReliability` | `0–1` | Reliability of this source |
| `learningScore` | `0–100` | Composite score (computed) |
| `status` | `LearningStatus` | Pipeline state |
| `promotionEligible` | `boolean` | Score ≥ 70 and approved |

**Status machine:**
```
captured → reviewing → approved → promoted
                    ↘ rejected ↗     ↓
                              archived (terminal)
```

---

### 2. `donnaSourceReliabilityEngine.ts` — Source Trust Tiers

| Source | Base Reliability | Tier |
|---|---|---|
| `brian_direct` | 0.95 | owner |
| `director_voice` | 0.85 | director |
| `system_observation` | 0.75 | automated |
| `coach_observation` | 0.75 | staff |
| `conversation` | 0.70 | varies by role |
| `parent_feedback` | 0.65 | community |
| `player_input` | 0.55 | community |

**Role adjustments** (conversation source only):
- `director` +0.10, `coach` +0.05, `parent` −0.05, `player` −0.10

**Actor-level drift:** `ActorReliabilityStore` tracks confirmed vs. contradicted learnings per named actor. Each confirmation: +0.02 (max +0.15). Each contradiction: −0.03 (min −0.15). Brian Dabul pre-registered.

---

### 3. `donnaLearningScoringEngine.ts` — Learning Score

0–100 composite score driving review priority and promotion eligibility.

| Factor | Weight | How Measured |
|---|---|---|
| `confidence` | 30% | DONNA's extraction confidence |
| `sourceReliability` | 25% | Source trust tier + actor delta |
| `importance` | 20% | Estimated academy impact |
| `evidenceQuality` | 15% | Word count + phrase count + specificity |
| `frequency` | 10% | Diminishing returns: log(n) curve |

**Labels:** critical ≥80 · high ≥60 · medium ≥40 · low <40

**Promotion threshold:** `learningScore ≥ 70` makes an entry eligible for Knowledge promotion.

---

### 4. `donnaLearningLedger.ts` — Canonical Repository

In-memory singleton. Persists within a process session; DB persistence is a future sprint.

**Capabilities:**
- `addEntry()`, `updateStatus()`, `updateScore()`, `assignCluster()`, `markDuplicate()`
- `getEntriesByStatus/Academy/Role/Topic/Domain/Concept/Cluster/Source`
- Audit log (capped at 2000 entries)
- `getStats(academyId?)` — aggregated totals by status, source, role, top concepts

**Status transition enforcement:** `canTransition()` gates all mutations. Invalid transitions silently return `false`. Never delete — archive instead.

---

### 5. `donnaLearningClusterEngine.ts` — Pattern Clustering

Groups similar entries into named clusters to detect emerging academy patterns.

**Similarity criteria (any match clusters two entries):**
1. Same `topicDomain` + ≥2 shared AcademyOS concepts
2. Same top concept + ≥2 keyword overlap in summary
3. Identical topic label (case-insensitive)

**Emerging pattern:** cluster with `frequency ≥ 3` and `trend !== declining`.

Returns: `ClusterReport` with `clusters`, `emergingPatterns`, `topCluster`, `unclustered`.

---

### 6. `donnaLearningDeduplicator.ts` — Duplicate Detection

Prevents the same learning from crowding the review queue.

**Similarity score (threshold 75%):**
- Concept Jaccard similarity: 45%
- Topic word overlap: 30%
- Summary keyword overlap: 25%

**On detection:** marks `isDuplicate=true`, sets `canonicalEntryId`. Never deletes — preserves audit history. Caller updates frequency on canonical entry.

---

### 7. `donnaLearningTimeline.ts` — Lifecycle History

Builds a human-readable event timeline from the Ledger audit log.

Event types: `captured`, `reviewed`, `approved`, `rejected`, `promoted`, `archived`, `clustered`, `merged`, `score_updated`

`formatAge()`: returns `"5s ago"`, `"2m ago"`, `"3h ago"`, `"2d ago"` for UI display.

---

### 8. `donnaLearningAnalyzer.ts` — OpenAI Teacher (Advisory Only)

**Gate 1:** Entry `confidence < 0.50` required  
**Gate 2:** `OPENAI_API_KEY` must be present  
**Gate 3:** Results stored ONLY in `entry.metadata['openai_suggestion']`

`isAdvisory: true` is hardcoded — cannot be false. Suggestions never auto-apply to canonical fields. Director must approve before any suggestion influences intelligence. Graceful fallback for all error cases.

---

### 9. `donnaLearningReviewQueue.ts` — Director Review Surface

Surfaces the most important captured learnings for director review.

**Ordering (descending priority):**
1. `brian_direct` source → always immediate
2. `learningScore ≥ 60` → immediate
3. Age > 3 days → standard
4. `learningScore ≥ 40` → standard
5. All others → low

Excludes: `isDuplicate=true`, `status=promoted/approved/rejected/archived`.

---

### 10. `brianLearningProfile.ts` — Brian Influence Score

Tracks Brian Dabul's direct teaching contribution to DONNA's knowledge base.

**Brian Influence Score (BIS):**
```
BIS = (brian_count / total_count × 0.60) + (brian_weighted_score / total_weighted_score × 0.40) × 100
```

Returns: topic breakdown, domain coverage, avg score, avg confidence, most recent entry date, BIS.

---

### 11. `donnaLearningInsights.ts` — Pattern Insights Engine

Generates 5 types of insights from approved/promoted learnings:

| Type | Trigger | Severity |
|---|---|---|
| `emerging_pattern` | Concept in ≥3 approved entries | medium/high |
| `knowledge_gap` | Domain has <2 approved entries | low |
| `high_value_cluster` | Cluster with avgScore ≥70 and frequency ≥3 | medium |
| `stale_review` | Captured entries older than 7 days | medium/high |
| `owner_teaching_gap` | Brian share <20% of total entries | medium |

Ordered high → medium → low → info.

---

### 12. `donnaLearningContradictionDetector.ts` — Contradiction Detection

Detects when a learning directly contradicts an existing approved entry.

**Contradiction criteria:**
1. Same `topicDomain`
2. ≥1 shared AcademyOS concept
3. Opposite sentiment (positive vs. negative keyword markers)
4. Topic label overlap (≥2 shared words)

**Auto-resolution:**
- Score difference ≥20 → higher-score wins
- `brian_direct` always takes precedence regardless of score

`detectContradictions()` — one new entry vs. existing approved set  
`scanForContradictions()` — full scan across all approved entries

---

### 13. `donnaLearningMemoryBridge.ts` — Conversation Bridge

Bridges `ConversationLearningRecord` → `LearningEntry`.

**Mapping:**
| ConversationRecord | LearningEntry |
|---|---|
| `originalStatement` | `evidence` |
| `interpretedTopConcept` + `allConcepts` | `concepts[]` |
| `finalUnderstanding` | `summary` |
| `finalConfidence` | `confidence` |
| `patternQuality` | `importance` (high_value=0.80, useful=0.65, ambiguous=0.35, low_value=0.20) |
| `role` | `sourceType` (coach→coach_observation, director→director_voice, etc.) |

Status always `captured` after bridge. Score applied immediately via `applyScoreToEntry()`.

---

## Certification Results

**56/56 tests PASS (100%)**

| Section | Tests | Pass |
|---|---|---|
| LM — Learning Entry Model | 3 | 3/3 |
| SR — Source Reliability | 5 | 5/5 |
| SC — Scoring Engine | 4 | 4/4 |
| LD — Ledger | 10 | 10/10 |
| CL — Cluster Engine | 4 | 4/4 |
| DD — Deduplicator | 3 | 3/3 |
| TL — Timeline | 3 | 3/3 |
| AN — Analyzer | 4 | 4/4 |
| RQ — Review Queue | 4 | 4/4 |
| BP — Brian Profile | 4 | 4/4 |
| IN — Insights Engine | 3 | 3/3 |
| CD — Contradiction Detector | 3 | 3/3 |
| MB — Memory Bridge | 6 | 6/6 |

**Ledger state after certification:**
- 16 learning entries (16 Brian-style events: 6 brian_direct, 3 coach, 2 parent, 2 player, 3 system)
- Avg score: 77
- Promotion-eligible: 12/16
- Brian Influence Score: 45/100
- Audit log: 34 entries

---

## Remaining Gaps

| Gap | Notes |
|---|---|
| No DB persistence | Ledger is in-memory only; all data lost on process restart |
| No UI wiring | Review queue and Brian profile have no director-facing UI yet |
| OpenAI not called in production | OPENAI_API_KEY not set in dev; graceful fallback active |
| Cluster IDs not written back to Ledger | `clusterLearningEntries` is pure — caller must call `assignCluster()` |
| No scheduled enrichment job | Batch scoring/clustering runs manually; no cron yet |
| `brian_direct` source requires manual entry | No UI for Brian to teach DONNA directly |

---

## Recommended Next Sprint

**Sprint 2891–2920 — DONNA Learning Ledger DB + Director Review Queue UI V1**

1. Supabase migration: `donna_learning_entries` table with RLS
2. Persist the Ledger to Supabase on every `addEntry` / `updateStatus`
3. Director review queue page (`/director/donna/learning`) — list view, approve/reject buttons
4. Brian profile widget on director dashboard
5. Insights panel surfacing emerging patterns

---

*Sprint 2861–2890 — TypeScript: CLEAN | No new dependencies | No DB changes | No migrations*
