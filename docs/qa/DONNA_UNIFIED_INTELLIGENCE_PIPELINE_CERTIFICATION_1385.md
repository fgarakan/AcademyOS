# DONNA Unified Intelligence Pipeline — Certification
**Sprint:** Mega Sprint 1385–1414 — DONNA Unified Intelligence Pipeline V1
**Date:** 2026-06-09

---

## Scenario 1 — `resolvedEntityToAcademyEntity()` maps a player correctly

`resolved = { kind: 'player', id: 'p1', displayName: 'Jake Morris', confidence: 0.94, ... }`
`ctx.players = [{ playerId: 'p1', playerName: 'Jake Morris', currentLevelId: 'l1', currentLevelDisplayName: 'Green Ball', advancementEligible: false, enrolledAt: '2025-12-01', lastEvaluatedAt: null }]`

→ `resolvedEntityToAcademyEntity(resolved, ctx)` returns `PlayerEntity`:
   - `kind: 'player'`
   - `id: 'p1'`, `displayName: 'Jake Morris'`
   - `currentLevelId: 'l1'`, `currentLevelDisplayName: 'Green Ball'`
   - `advancementEligible: false`, `enrolledAt: '2025-12-01'`
   - `confidence: 0.94`
→ No crash — all fields present

**Result: PASS**

---

## Scenario 2 — `resolvedEntityToAcademyEntity()` maps a curriculum_level by player lookup

`resolved = { kind: 'curriculum_level', id: null, displayName: 'Orange Ball', confidence: 0.88 }`
`ctx.players` has 4 players with `currentLevelDisplayName: 'Orange Ball'` and `currentLevelId: 'l2'`

→ Returns `CurriculumLevelEntity`:
   - `kind: 'curriculum_level'`, `id: 'l2'`, `displayName: 'Orange Ball'`
   - `playerCount: 4`
→ id=null in resolved: factory falls back to displayName match, derives levelId from player records

**Result: PASS — curriculum_level factory handles null id gracefully**

---

## Scenario 3 — `resolvedEntityToAcademyEntity()` returns null when player not in context

`resolved = { kind: 'player', id: 'p_unknown', displayName: 'Ghost Player', confidence: 0.91 }`
`ctx.players` has no entry with `playerId: 'p_unknown'`

→ `resolvedEntityToAcademyEntity(resolved, ctx)` returns `null`
→ `buildUnifiedContext()` receives `null` entity → returns `null`
→ Brain step 10.5.1 `uCtx !== null` guard → falls through to navigation path (existing behaviour preserved)

**Result: PASS — null guard prevents crash; navigation path unaffected**

---

## Scenario 4 — `buildUnifiedContext()` runs all four engines for a player

Player: Jake Morris, 195 days at Green Ball, 0 assessments.

→ `buildUnifiedContext(resolved, ctx)` returns `UnifiedIntelligenceContext` with:
   - `entity.kind: 'player'`, `entity.id: 'p1'`
   - `summary.headline`: contains "Jake Morris" and "195 days"
   - `evidenceChain.confidence: 'high'` (curriculum_states evidence always high)
   - `evidenceChain.dataGaps`: non-empty (no assessments, no coach data)
   - `timeline.length >= 1` (at minimum: stall_detected event)
   - `relationships: []` (no rCtx passed)
   - `trace.enginesUsed`: `['entity_summary', 'entity_evidence', 'entity_timeline']`
   - `trace.confidenceSource: 'high_confidence_entity'` (confidence 0.94 ≥ 0.85)
   - `trace.durationMs`: non-null integer
   - `routeTarget: '/director/players/p1'` (from resolved.route)

**Result: PASS**

---

## Scenario 5 — `buildUnifiedContext()` with rCtx adds relationships to trace

Same player, `rCtx` populated with player's level → group link.

→ `buildUnifiedContext(resolved, ctx, rCtx)` returns context with:
   - `relationships.length >= 1` (at minimum `is_at_level`)
   - `trace.enginesUsed` includes `'entity_relationships'`

**Result: PASS**

---

## Scenario 6 — `buildUnifiedAnswer()` formats display text correctly

`UnifiedIntelligenceContext` for Jake Morris (stalled, 195 days).

→ `buildUnifiedAnswer(ctx)` returns `UnifiedAnswer`:
   - `headline`: `"Jake Morris has been at Green Ball for 195 days — high-severity stall"`
   - `detail`: contains `"**Evidence:**"`, stall evidence bullet, and `"**Recommended actions:**"` section
   - `evidence.length >= 1`
   - `timelineHighlights.length >= 1` (at minimum: stall_detected with `isUrgent: true`)
   - `confidence: 'high'`
   - `missingInformation.length >= 1` (assessment gap always present for this player)
   - `recommendations.length >= 1` (schedule assessment)
   - `recommendedNextAction`: first recommendation string
   - `routeTarget`: route from context
   - `trace`: populated `IntelligenceTrace` with durationMs set

**Result: PASS**

---

## Scenario 7 — Brain step 10.5.1 fires for 'query' intent, not 'navigate' intent

**Query intent test:**
Input: `"Tell me about Jake"` → `detectEntityIntent` returns `{ kind: 'query', entityPhrase: 'Jake' }`
Entity resolved with confidence 0.94. `entityContext` populated.

→ Step 10.5.1 condition: `kind === 'query'` AND `confidence >= CONFIDENCE_ACT_THRESHOLD` AND `entityContext !== null` → TRUE
→ `buildUnifiedContext()` succeeds → `buildUnifiedAnswer()` runs
→ Brain returns `action: 'respond'` with `unifiedAnswer` populated
→ `response` = `uAnswer.detail`, `spokenResponse` = `uAnswer.headline`
→ Debug log: deciding step = `'check_entity_qa'`

**Navigate intent test:**
Input: `"Show me Jake"` → `detectEntityIntent` returns `{ kind: 'navigate', entityPhrase: 'Jake' }`
Entity resolved with confidence 0.94.

→ Step 10.5.1 condition: `kind === 'navigate'` → FALSE → does NOT fire
→ Falls through to existing `buildEntityNavigationResponse()` → `action: 'navigate'`
→ Existing navigation path completely unaffected

**Result: PASS — intent kind correctly gates the Q&A path**

---

## Scenario 8 — Brain step 10.5.1 fires for 'status' and 'improve' intents

Input: `"What's the status of the Green Advanced group?"` → `detectEntityIntent` returns `{ kind: 'status', ... }`
Input: `"Improve the Orange Ball level"` → `detectEntityIntent` returns `{ kind: 'improve', ... }`

→ Both trigger step 10.5.1 → unified answer path fires
→ For status: group summary built; detail includes member count, stall count
→ For improve: curriculum level summary built with recommendations

**Result: PASS**

---

## Scenario 9 — Brain step 10.6 answers evidence follow-up

Sequence:
1. Director types `"Tell me about Jake"` → step 10.5.1 fires → `goalMemory.lastRelevantEntity` = `'Jake'`
2. Director types `"Why?"` → `isEvidenceFollowUpPhrase('why?')` → TRUE

→ Step 10.6: `entityContext !== null`, `goalMemory.lastRelevantEntity = 'Jake'`, phrase detected
→ `resolveEntityWithContext('Jake', ctx, route, {})` → Jake resolved at confidence 0.94
→ `buildUnifiedContext(jakeEntity, ctx)` → evidence chain built
→ Response lines include `"Here's what I know about **Jake Morris**:"` and evidence bullets
→ Brain returns `action: 'respond'` with deciding step `'check_evidence_followup'`

**Result: PASS**

---

## Scenario 10 — Brain step 10.6 silently falls through when no prior entity

Director types `"Why?"` when `goalMemory?.lastRelevantEntity` is null.

→ Step 10.6: `goalMemory?.lastRelevantEntity` = falsy → condition fails → falls through
→ Steps 11–16 continue normally (no crash, no incorrect response)

**Result: PASS — graceful fallthrough when context is missing**

---

## Scenario 11 — `unifiedAnswer` field on `DonnaMessageResult` is nullable

Paths that do NOT go through step 10.5.1 or 10.6:
- Step 10.4 (relationship intelligence) → `makeResult('respond', { ... })` without `unifiedAnswer`
- Step 11–14 goal path → same
- Step 16 COO fallback → same

→ `makeResult` defaults `unifiedAnswer` to `null` when not provided in `partial`
→ All existing callers that read `result.response`, `result.navigateTo`, etc. are unaffected

**Result: PASS — backwards-compatible null default**

---

## Scenario 12 — Intelligence trace records engines and timing

`createTrace({ entityKind: 'player', entityId: 'p1', entityName: 'Jake', confidenceSource: 'high_confidence_entity' })`

→ `trace.startedAt`: ISO string (non-null)
→ `trace.enginesUsed: []`
→ `addEngineToTrace(trace, 'entity_summary')` → `enginesUsed: ['entity_summary']`
→ `addEngineToTrace(trace, 'entity_summary')` again (duplicate) → `enginesUsed: ['entity_summary']` (no duplicate)
→ `finalizeTrace(trace)` → `finishedAt` and `durationMs` set
→ `finalizeTrace(trace, true)` → `fallbackUsed: true`

**Result: PASS — immutable updates, dedup, timing**

---

## Scenario 13 — TypeScript clean and architecture compliance

**TypeScript check:**
`npx tsc --noEmit` → 0 errors across all sprint files.

**Architecture compliance:**

| Rule | Status |
|---|---|
| No DB calls in any new file | PASS — all files are pure TypeScript |
| No React in any new file | PASS |
| No migration needed | PASS |
| `processDonnaMessage.ts` navigation path for 'navigate' intent untouched | PASS — step 10.5.1 only fires on 'query'\|'status'\|'improve' |
| `DonnaMessageResult` backwards-compatible (`unifiedAnswer` defaults to null) | PASS |
| No new npm packages | PASS |
| No external AI API calls | PASS |
| `entityContext !== null` guard on both new steps | PASS — silently falls through without context |
| Evidence gaps always disclosed | PASS — `missingInformation[]` populated from `evidenceChain.dataGaps` |
| COO path (steps 7.1/7.5) not touched | PASS — deferred per audit constraint 10.5 |
| TypeScript clean | PASS — 0 errors |

**Regression check:**
- All existing entity navigation paths: unchanged (step 10.5.1 does not interfere with 'navigate' intent)
- All relationship intelligence paths (step 10.4): unchanged
- `DonnaMessageResult` callers reading existing fields: unaffected (null default)
- Brain step ordering: preserved (10.5.1 is inside existing 10.5 block; 10.6 is between 10.5 and 11)

**Known V1 limitations for Sprint 1385:**

| Limitation | Impact | Fix path |
|---|---|---|
| COO path (steps 7.1/7.5) not enriched with entity summaries | COO answers don't include per-entity detail from Sprint 1355 | Future sprint: enrich COO answer builder with entity context |
| No `RelationshipContext` available in brain (rCtx=undefined) | `relationships[]` always empty in step 10.5.1 | Future sprint: build rCtx in the brain alongside entityContext load |
| Step 10.6 re-resolves entity from name string; no entity ID cache | Slightly weaker match than step 10.5.1 which has the original resolve result | Future sprint: store resolved entity ID in goalMemory |
| `curriculum_level` with id=null may derive wrong levelId if display name is not unique | Minor risk if two levels share a display name (unlikely in practice) | Future: add levelId to ResolvedEntityV2 for curriculum levels |
