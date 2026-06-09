# DONNA Entity Intelligence — Architecture Audit
**Sprint:** Mega Sprint 1355–1384 — DONNA Academy Entity Intelligence V2
**Date:** 2026-06-09
**Auditor:** Claude Code

---

## 1. Existing Entity Infrastructure

### Layer 1 — V1 Heuristic Resolver (`entities/`)

| File | Sprint | Purpose |
|---|---|---|
| `entities/donnaEntityResolver.ts` | 1831–1860 | Heuristic entity detection: curriculum levels, sessions, templates, named persons |

**Status:** Active — brain step 3 imports `resolveEntities()` and `EntityResolutionResult`. **Must NOT be touched or overwritten.**

Technique: substring/keyword heuristics against raw message text. Returns `EntityResolutionResult` with `detectedEntities[]`, no confidence scoring, no fuzzy matching.

---

### Layer 2 — V2 Comprehensive Resolver (`entity/`)

| File | Sprint | Purpose |
|---|---|---|
| `entity/donnaEntityResolver.ts` | 2291–2320 | Full resolver: Levenshtein fuzzy match, NICKNAME_MAP (40+ entries), LEVEL_ALIAS_ENTRIES, confidence scoring, 9 entity kinds |
| `entity/donnaEntityContextResolver.ts` | 2291–2320 | Route-aware context resolver: boosts confidence for entity kinds preferred on current route |
| `entity/donnaEntityContextLoader.ts` | 2321–2340 | Converts `EntityContextSlice` → `AcademyEntityContext`; coaches and parents stubs are empty (honest limitation) |
| `entity/donnaEntityIntentRouter.ts` | 2321–2340 | Detects entity intent kind: 'navigate' | 'query' | 'improve' | 'status'; guard phrases block entity detection for review/attention/brief routes |
| `entity/donnaEntityNavigation.ts` | 2321–2340 | Converts resolved entity + intent → `EntityNavigationResponse` (message, route, spokenMessage) |
| `entity/donnaRelationshipGraph.ts` | 2291–2320 | Pronoun resolution, parent-of, who-coaches, what-group-is, who-is-in; `RelationshipQueryResult` |
| `entity/donnaDisambiguationEngine.ts` | 2291–2320 | `buildDisambiguationQuestion()` + `resolveDisambiguationAnswer()` for multi-candidate disambiguation |

**EntityKind values (V2):** `player | coach | parent | group | curriculum_level | assessment | template | session | workflow`

**AcademyEntityContext shape:**
```ts
{
  players: PlayerCurriculumStateSummary[]
  groups:  GroupSummary[]
  levels:  CurriculumLevelSummary[]
  templates: TemplateSummary[]
  assessments: AssessmentSummary[]
  sessions: SessionSummary[]
}
```
Note: `coaches` and `parents` are present in the type but populated as empty arrays by the context loader (known limitation).

---

### Layer 3 — Relationship Intelligence (`relationship/`)

| File | Sprint | Purpose |
|---|---|---|
| `relationship/donnaRelationshipIntelligence.ts` | 2341–2370 | Builds derived relationship Maps from `AcademyEntityContext`; stall detection (medium: 90+ days, high: 180+ days); `getPlayerContext`, `getGroupContext`, `getLevelContext`, `buildAcademyInsight` |
| `relationship/donnaRelationshipIntentDetector.ts` | 2341–2370 | Detects relationship questions (who coaches, what group, parent of, pronouns) |
| `relationship/donnaRelationshipAnswerBuilder.ts` | 2341–2370 | COO-style answer strings for player/group/level/academy relationship queries |
| `relationship/donnaRelationshipSurfaces.ts` | 2341–2370 | Surface-specific answer formatting for different UI contexts |

---

### Layer 4 — DB-Backed Entity Persistence

| File | Sprint | Purpose |
|---|---|---|
| `donnaEntitySummaries.ts` | 914.12 | DB table `donna_entity_summaries`: upsert/get entity summaries keyed by (kind, entity_id) |
| `donnaEventLedger.ts` | 914.6 | DB table `donna_events`: log and retrieve recent DONNA events by entity |

---

### Layer 5 — Source Data (used by all layers)

| File | Sprint | Provides |
|---|---|---|
| `extendedContextLoaders.ts` | 742B/C | `PlayerCurriculumStateSummary`, `AssessmentSummary`, `GroupSummary`, `TemplateSummary`, `SessionSummary` |

---

## 2. Brain Integration Points

| Brain Step | Import | From |
|---|---|---|
| Step 3 | `resolveEntities()`, `EntityResolutionResult` | `entities/donnaEntityResolver.ts` (V1) |
| Step 3.1 | `resolveEntityWithContext()`, `EntityResolveResult` | `entity/donnaEntityContextResolver.ts` (V2) |
| Step 3.2 | `isRelationshipQuery()`, `resolveRelationshipQuery()` | `entity/donnaRelationshipGraph.ts` |
| Step 3.3 | `buildDisambiguationQuestion()` | `entity/donnaDisambiguationEngine.ts` |
| Step 3.4 | `detectEntityIntent()` | `entity/donnaEntityIntentRouter.ts` |
| Step 3.5 | `buildEntityNavigationResponse()` | `entity/donnaEntityNavigation.ts` |
| Step 4.R | `isRelationshipIntentPhrase()` | `relationship/donnaRelationshipIntentDetector.ts` |
| Step 4.R.1 | `buildRelationshipAnswer()` | `relationship/donnaRelationshipAnswerBuilder.ts` |

---

## 3. What Exists vs. What This Sprint Adds

### What exists (do not rebuild)

| Capability | Status |
|---|---|
| Fuzzy entity name matching (Levenshtein + nicknames) | EXISTS — `entity/donnaEntityResolver.ts` |
| Route-context entity boosting | EXISTS — `entity/donnaEntityContextResolver.ts` |
| Pronoun + relationship graph traversal | EXISTS — `entity/donnaRelationshipGraph.ts` |
| Disambiguation Q&A | EXISTS — `entity/donnaDisambiguationEngine.ts` |
| Relationship intelligence (stall detection, level hotspots, academy insight) | EXISTS — `relationship/donnaRelationshipIntelligence.ts` |
| Navigation response builder | EXISTS — `entity/donnaEntityNavigation.ts` |
| DB entity summary storage | EXISTS — `donnaEntitySummaries.ts` |

### What is genuinely missing (Sprint 1355 will add)

| Gap | File to create |
|---|---|
| No canonical entity type model unifying all 9 EntityKind values with shared fields (id, kind, displayName, evidence[], confidence, relationships[], lastUpdatedAt) | `entities/donnaAcademyEntityModel.ts` |
| No relationship type catalog with enum-safe traversal; V2 resolver and relationship engine have no shared contract | `entities/donnaEntityRelationshipEngine.ts` |
| No evidence aggregation layer (pure TS: what signals support this entity, how recent, how confident) | `entities/donnaEntityEvidenceEngine.ts` |
| No chronological timeline builder (player history, coach history, group event sequence) | `entities/donnaEntityTimelineEngine.ts` |
| No entity Q&A summary engine (what can DONNA say about this entity in text) | `entities/donnaEntitySummaryEngine.ts` |

---

## 4. Constraints

1. `entities/donnaEntityResolver.ts` (V1) — **read-only, do not touch**. Brain imports directly; overwriting would break steps 3+.
2. All 5 new files must be pure TypeScript — no DB calls, no React, no side effects.
3. New files in `entities/` only; nothing in `entity/` or `relationship/` directories.
4. No migration needed — all computations derive from `AcademyEntityContext` and `PlayerCurriculumStateSummary` shapes already used by the existing layers.
5. TypeScript must be clean after implementation.

---

## 5. Data Flow (Post-Sprint)

```
AcademyEntityContext (from page.tsx signals)
         │
         ├─► entities/donnaAcademyEntityModel.ts    ← canonical type system
         │         (AcademyEntity union, EntityRelationship, EntityEvidence)
         │
         ├─► entities/donnaEntityRelationshipEngine.ts  ← wraps relationship/
         │         (getEntityRelationships, traverseRelationship)
         │
         ├─► entities/donnaEntityEvidenceEngine.ts   ← evidence aggregation
         │         (buildEntityEvidence, scoreEvidenceChain)
         │
         ├─► entities/donnaEntityTimelineEngine.ts   ← timeline builder
         │         (buildEntityTimeline, TimelineEvent[])
         │
         └─► entities/donnaEntitySummaryEngine.ts    ← Q&A answers
                   (buildEntitySummary, EntitySummaryAnswer)
```

---

## 6. Expected Score Impact

| Dimension | Pre-1355 | Post-1355 | Driver |
|---|---|---|---|
| COO Readiness | 85 | 88 | Evidence engine gives DONNA structured evidence chains for all entity queries |
| Conversational Readiness | 74 | 78 | Summary engine enables per-entity Q&A answers across all 9 entity kinds |
| Composite | 86 | 88 | Entity model + summary engine close the gap between "entity detected" and "entity answered" |
