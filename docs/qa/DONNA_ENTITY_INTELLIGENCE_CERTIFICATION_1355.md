# DONNA Entity Intelligence — Certification
**Sprint:** Mega Sprint 1355–1384 — DONNA Academy Entity Intelligence V2
**Date:** 2026-06-09

---

## Scenario 1 — `AcademyEntity` discriminated union covers all 9 EntityKind values

`donnaAcademyEntityModel.ts` defines `AcademyEntity` as a discriminated union.

→ All 9 EntityKind values are represented: `player | coach | parent | group | curriculum_level | assessment | template | session | workflow`
→ Each kind has a dedicated interface extending `AcademyEntityBase` with kind-specific fields:
   - `PlayerEntity`: `currentLevelId`, `currentLevelDisplayName`, `advancementEligible`, `enrolledAt`, `lastEvaluatedAt`
   - `GroupEntity`: `levelId`, `track`, `maxPlayers`
   - `CurriculumLevelEntity`: `playerCount`
   - `AssessmentEntity`: `playerId`, `assessedDate`, `promotionReady`, `overallScore`
   - `TemplateEntity`: `templateType`, `status`, `curriculumLevelId`, `totalDurationMin`
   - `CoachEntity`: `role`
   - `ParentEntity`: `linkedPlayerIds`
   - `SessionEntity`, `WorkflowEntity`: base fields only
→ `AcademyEntityBase` provides shared fields: `id`, `kind`, `displayName`, `confidence`, `lastUpdatedAt`
→ 7 type guards exported: `isPlayerEntity`, `isGroupEntity`, `isAssessmentEntity`, `isCurriculumLevelEntity`, `isTemplateEntity`, `isCoachEntity`, `isParentEntity`

**Result: PASS**

---

## Scenario 2 — `getEntityRelationships()` returns correct relationships for a player

Player `entity.kind === 'player'`, `entity.id = 'p1'`, at level `l1` (which has a group `g1`).
`rCtx.playerByPlayerId` has `p1`. `rCtx.groupByLevelId.get('l1')` returns `g1`.
`rCtx.playersByLevelId.get('l1')` returns `[p1, p2]`.
`rCtx.templatesByLevelId.get('l1')` returns `[t1]`.

→ `getEntityRelationships(entity, rCtx)` returns:
   - `{ kind: 'is_at_level', targetId: 'l1', targetKind: 'curriculum_level', confidence: 1.0 }`
   - `{ kind: 'is_in_group', targetId: 'g1', targetKind: 'group', confidence: 0.85 }`
   - `{ kind: 'co_group_member', targetId: 'p2', targetKind: 'player', confidence: 0.85 }`
   - `{ kind: 'uses_template', targetId: 't1', targetKind: 'template', confidence: 0.80 }`
→ `p1` is excluded from `co_group_member` (self-exclusion guard)
→ Returns 4 relationships, no duplicates

**Result: PASS**

---

## Scenario 3 — `getEntityRelationships()` for a parent returns `parent_of` links

Parent entity: `kind: 'parent'`, `linkedPlayerIds: ['p1', 'p2']`.
`rCtx.playerByPlayerId.get('p1')` returns `{ playerName: 'Alex Chen' }`.
`rCtx.playerByPlayerId.get('p2')` returns `undefined`.

→ Two relationships returned:
   - `{ kind: 'parent_of', targetId: 'p1', targetDisplayName: 'Alex Chen', targetKind: 'player', confidence: 1.0 }`
   - `{ kind: 'parent_of', targetId: 'p2', targetDisplayName: 'p2', targetKind: 'player', confidence: 1.0 }` (ID fallback when player not found)
→ No crash on missing player lookup — falls back to `targetDisplayName: playerId`

**Result: PASS — graceful fallback for missing player records**

---

## Scenario 4 — `traverseRelationship()` filters by relKind and returns `AcademyEntityBase[]`

Player entity at level `l1` with group `g1` and peer `p2`. `rCtx` fully populated.

→ `traverseRelationship(entity, 'is_at_level', rCtx)` → 1 result: `{ id: 'l1', kind: 'curriculum_level', displayName: 'Red', confidence: 1.0, lastUpdatedAt: null }`
→ `traverseRelationship(entity, 'co_group_member', rCtx)` → 1 result: peer `p2`
→ `traverseRelationship(entity, 'parent_of', rCtx)` → `[]` (player has no `parent_of` relationships)
→ All results conform to `AcademyEntityBase` interface: `id`, `kind`, `displayName`, `confidence`, `lastUpdatedAt`

**Result: PASS**

---

## Scenario 5 — `buildEntityEvidence()` for a player with assessments returns high confidence

Player: `advancementEligible: false`, `enrolledAt: 30 days ago`, 2 assessments (latest score 85).

→ `buildEntityEvidence(playerEntity, ctx)` returns `EvidenceChain`:
   - `lines[0]`: `• [player_curriculum_states] Enrolled at level: Red Ball`
   - `lines[1]`: `• [assessments] 2 assessments on record; most recent: 2026-05-20 (score: 85)`
   - `confidence: 'high'` (2/2 items are `confidence: 'high'`)
   - `dataGaps`: contains "Coach assignment data not available..." and "Parent communication history not available..."
→ No stall indicator (30 days < 90 day threshold)
→ `evidence[]` array non-empty; no empty evidence[] violation

**Result: PASS**

---

## Scenario 6 — `buildEntityEvidence()` for a player with no assessments discloses gap

Player: `advancementEligible: false`, `enrolledAt: 150 days ago`, 0 assessments.
`ctx.assessments` contains no entries for this player.

→ `buildEntityEvidence(playerEntity, ctx)` returns:
   - `lines[0]`: `• [player_curriculum_states] Enrolled at level: Orange Ball`
   - `lines[1]`: `• [player_curriculum_states] 150 days at current level — stall indicator`
   - `confidence: 'high'` (2/2 items are enrollment/stall from curriculum_states)
   - `dataGaps[0]`: `"No assessments on record for <playerName>."`
   - `dataGaps[1]`: `"Coach assignment data not available..."`
   - `dataGaps[2]`: `"Parent communication history not available..."`
→ Missing assessments surfaced in `dataGaps[]`, not silently ignored

**Result: PASS — evidence discipline maintained; gaps always disclosed**

---

## Scenario 7 — `buildEntityTimeline()` for a stalled player returns sorted events

Player: `enrolledAt: 200 days ago`, 2 assessments (dates: 2026-01-10 and 2025-11-20), `advancementEligible: false`.

→ `buildEntityTimeline(playerEntity, ctx)` returns events sorted newest-first:
   1. `{ kind: 'assessment_result', date: '2026-01-10', significance: 'medium' }`
   2. `{ kind: 'assessment_result', date: '2025-11-20', significance: 'medium' }`
   3. `{ kind: 'enrollment', date: <enrolledAt>, significance: 'medium' }`
   4. `{ kind: 'stall_detected', date: null, label: 'Stall indicator: 200 days...', significance: 'high', detail: 'High-severity stall...' }` (undated → end)
→ Stall event has `significance: 'high'` (200 days ≥ 180 threshold)
→ Events with `date: null` sorted after dated events

**Result: PASS**

---

## Scenario 8 — `buildEntityTimeline()` for advancement-eligible player flags high significance

Player: `advancementEligible: true`, `lastEvaluatedAt: '2026-06-01'`, 1 assessment (promotion-ready).

→ `buildEntityTimeline(playerEntity, ctx)` returns:
   - `{ kind: 'advancement_eligible', date: '2026-06-01', label: 'Advancement eligible', significance: 'high' }`
   - `{ kind: 'assessment_result', date: '2026-05-28', label: 'Assessment — promotion ready', significance: 'high' }`
   - `{ kind: 'enrollment', ... significance: 'medium' }`
→ No `stall_detected` event (advancement-eligible players are NOT stalled)
→ Two high-significance events surface this player clearly

**Result: PASS**

---

## Scenario 9 — `buildEntitySummary()` for a stalled player returns actionable headline and recommendations

Player: `displayName: 'Jake Morris'`, `currentLevelDisplayName: 'Green Ball'`, `enrolledAt: 195 days ago`, `advancementEligible: false`, 0 assessments.

→ `buildEntitySummary(playerEntity, ctx)` returns:
   - `headline`: `"Jake Morris has been at Green Ball for 195 days — high-severity stall"`
   - `detail`: includes "No assessments are on record."
   - `evidence`: `["Level: Green Ball", "Enrolled at current level for 195 days", "Stall severity: high (195 days)"]`
   - `recommendations`: `["Schedule an assessment for Jake Morris", "Review development plan for Jake Morris"]`
   - `limitations`: contains coach + parent data unavailability notices

**Result: PASS**

---

## Scenario 10 — `buildEntitySummary()` for an over-capacity group surfaces capacity warning

Group: `displayName: 'Green Advanced'`, `levelId: 'l1'`, `maxPlayers: 6`.
`ctx.players` has 8 players with `currentLevelId: 'l1'`.

→ `buildEntitySummary(groupEntity, ctx)` returns:
   - `headline`: `"Green Advanced is over capacity (8/6)"`
   - `evidence`: `["8 players in group", "Capacity: 8/6"]`
   - `recommendations`: `["Review Green Advanced group capacity — consider splitting or expanding"]`
   - No stall data in `detail` (over-capacity takes precedence in headline)

**Result: PASS — capacity signal correctly escalated to headline**

---

## Scenario 11 — `buildEntitySummary()` for curriculum level with high stall rate includes recommendation

Level: `displayName: 'Orange Ball'`, `id: 'l2'`.
`ctx.players` has 6 players at `l2`: 4 with `enrolledAt` 120 days ago and `advancementEligible: false` (stalled), 2 normal.

→ `buildEntitySummary(levelEntity, ctx)` returns:
   - `headline`: `"Orange Ball: high stall rate — 4/6 players stalled"`
   - `evidence`: `["6 active players", "4 stalled (≥90 days)"]`
   - `recommendations`: `["Review development pace at the Orange Ball level"]`
   - `detail`: explains 4 of 6 players stalled for 90+ days

**Result: PASS**

---

## Scenario 12 — TypeScript clean and architecture compliance

**TypeScript check:**
`npx tsc --noEmit` → 0 errors across all 5 sprint files.

**Architecture compliance:**

| Rule | Status |
|---|---|
| No DB calls in any new file | PASS — all files are pure TypeScript |
| No React in any new file | PASS |
| `entities/donnaEntityResolver.ts` (V1) untouched | PASS — not in sprint plan; file unchanged |
| `entity/` directory untouched | PASS — all V2 files unchanged |
| `relationship/` directory untouched | PASS — relationship engines unchanged |
| No migration needed | PASS — all computation from in-memory context |
| Evidence always disclosed (no hidden gaps) | PASS — `dataGaps[]` populated in all `EvidenceChain` results |
| `limitations[]` in every `EntitySummaryAnswer` | PASS — all per-kind builders populate limitations |
| No new npm packages | PASS |
| No external AI API calls | PASS |
| TypeScript clean | PASS — 0 errors |

**Regression check:**
- `entities/donnaEntityResolver.ts` (V1): unchanged — brain step 3 is unaffected
- All `entity/*` files: unchanged — V2 resolver, disambiguation, context loader, navigation all intact
- All `relationship/*` files: unchanged — relationship intelligence, intent detector, answer builder, surfaces all intact
- No brain imports changed

**Known V1 limitations for Sprint 1355:**

| Limitation | Impact | Fix path |
|---|---|---|
| Brain does not yet call `buildEntitySummary()` | Entity summaries computed but not returned by DONNA | Future sprint: wire summary engine into entity intent routing at brain step 3.4 |
| `buildEntityEvidence()` for `coach`, `parent`, `session`, `workflow` returns only dataGaps | Coaches and parents are empty in context loader | Future sprint: populate coach/parent context in `entity/donnaEntityContextLoader.ts` |
| `buildEntityTimeline()` returns `[]` for `coach`, `parent`, `session`, `workflow` | Timeline not yet available for these kinds | Future sprint: add per-kind timeline builders once data sources are available |
| Relationship engine uses levelId as group proxy (no direct player→group assignment table) | Group membership derived from level, not actual group_memberships table | Future: wire actual group_memberships data into relationship context |
