# DONNA Unified Intelligence Pipeline — Architecture Audit
**Sprint:** Mega Sprint 1385–1414 — DONNA Unified Intelligence Pipeline V1
**Date:** 2026-06-09
**Auditor:** Claude Code

---

## 1. Current Brain Pipeline — Step-by-step Map

`src/lib/donna/brain/processDonnaMessage.ts` — 907 lines, Sprint 1911–1960 vintage

| Step | Label | BrainRoutingStep | Action | Engine |
|---|---|---|---|---|
| 0a | Active goal session | `check_goal_session` | `route_goal_session` | `donnaWorkflowRegistry` |
| 0b | Goal workflow intent | `check_goal_workflow_intent` | `start_goal_session` | `donnaWorkflowRegistry` |
| 0.5 | Disambiguation resolution | `check_disambiguation` | `navigate` / `respond` | `donnaDisambiguationEngine` |
| 1 | Active guided workflow | `check_guided_workflow` | `route_guided_answer` | — |
| 2 | COO control command | `check_coo_control` | `route_coo_control` | `donnaAutonomousGuidanceEngine` |
| 3 | Continuity phrase | `check_continuity` | `respond` | `donnaGoalMemory` |
| 4 | Today guidance | `check_today_guidance` | `route_coo_prompt` | `donnaTodayGuidanceLoop` |
| 5 | Daily brief | `check_daily_brief` | `fetch_brief` | `donnaIntentClassifier` |
| 6 | Review queue | — | `open_review` | inline phrase detector |
| 7 | Attention intent | — | `fetch_attention` | inline `isAttentionPhrase()` |
| 7.1 | Academy overview | — | `fetch_coo_intelligence` | inline `isAcademyOverviewPhrase()` (Sprint 1325) |
| 7.5 | COO intelligence | — | `fetch_coo_intelligence` | inline `isCOOIntelligencePhrase()` |
| 8 | Ambiguity resolution | — | mutates `messageToProcess` | `donnaAmbiguityResolutionEngine` |
| 9 | Intent classification | `run_intent` | — | `donnaIntentEngine` |
| 10 | Entity resolution (V1) | `run_entity` | — | `entities/donnaEntityResolver` (V1 heuristic) |
| 10.4 | Relationship intelligence | `check_relationship_intelligence` | `respond` | `donnaRelationshipIntelligence` + `donnaRelationshipAnswerBuilder` |
| 10.5 | Entity intelligence (V2) | `check_entity_intent` | `navigate` / `respond` | `donnaEntityContextResolver` + `donnaEntityNavigation` |
| 11 | Goal resolution | `run_goal` | — | `donnaGoalEngine` |
| 12 | Context pack | `check_context_pack` | `respond` | `donnaContextPackRegistry` |
| 12.5 | Brain knowledge | `check_brain_context` | `respond` | `donnaKnowledgeContextAdapter` |
| 13 | High-confidence workflow | `build_reasoning` | `start_workflow` | `donnaGoalEngine` + `donnaReasoningEngine` |
| 14 | Medium-confidence goal | `build_response` | `respond` | `donnaGoalEngine` |
| 15 | Clarification needed | `build_response` | `respond` | `donnaGoalEngine` |
| 16 | COO prompt fallback | `route_coo_prompt` | `route_coo_prompt` | `handleDonnaCooPrompt` |

---

## 2. Current Entity Q&A Path (Step 10.5) — The Gap

**What happens today when the director types "Tell me about Jake":**

1. Steps 1–10 do not fire (no active workflow, not a COO phrase, not a relationship query)
2. Step 10.5 runs `detectEntityIntent("Tell me about Jake")` → returns `{ kind: 'query', entityPhrase: 'Jake' }`
3. `resolveEntityWithContext('Jake', ctx, route, {})` → `resolveResult.entity = { kind: 'player', id: 'p123', displayName: 'Jake Morris', confidence: 0.94 }`
4. `entity.confidence >= CONFIDENCE_ACT_THRESHOLD` → true
5. `buildEntityNavigationResponse(entity, entityIntent)` → `navResponse.shouldNavigate = true` (player has a route)
6. Brain returns `action: 'navigate', navigateTo: '/director/players/p123'`

**Result: DONNA navigates to Jake's profile. She does NOT:**
- Call `buildEntitySummary()` — no headline, detail, evidence, or recommendations
- Call `buildEntityEvidence()` — no evidence chain
- Call `buildEntityTimeline()` — no chronological events
- Call `getEntityRelationships()` — no group/level/peer context
- Answer the actual question "Tell me about Jake"

**What happens when `entityIntent.kind === 'query'`:**
Currently, `detectEntityIntent()` returns different `kind` values ('navigate', 'query', 'improve', 'status') but the brain treats them ALL identically — always navigates when confidence is high enough. The `kind` field is never consulted.

---

## 3. Current COO Intelligence Path — The Gap

**What happens today when the director types "How is everything looking?":**

1. Step 7.1: `isAcademyOverviewPhrase()` → true
2. Returns `action: 'fetch_coo_intelligence', confidence: 0.93`
3. The execution layer calls `runDonnaCOOIntelligenceAction()` which uses `donnaCOOIntelligenceEngine.ts` (Sprint 784)
4. Response is built from the Sprint 784 engine with a separate context loader

**What COO intelligence responses are missing:**
- No entity summaries for the players/groups mentioned in priorities
- No evidence chains for why a player is flagged
- No timeline context for why an issue is urgent now
- No per-entity recommendations, just general action routes
- Sprint 1355 engines (`buildEntitySummary`, `buildEntityEvidence`, `buildEntityTimeline`) are never called

---

## 4. Current Evidence Follow-up Path — Missing

**What happens today when the director types "Why?" / "What evidence supports that?":**

1. Steps 1–7.5 do not fire
2. Steps 8–10.5 find no entity, no relationship query
3. Steps 11–12.5 find no clear goal, no context pack match, no brain knowledge match
4. Step 16: Falls through to `route_coo_prompt`
5. `handleDonnaCooPrompt` may produce a response or fall to god_mode

**What evidence follow-up is missing:**
- No detection of follow-up phrases ("why?", "what evidence?", "how confident?", "what's missing?")
- `donnaEvidenceReasoningEngine.ts` (Sprint 1235) is never called from the brain
- Entity evidence chains from Sprint 1355 are never used to answer "why?" questions
- When director asks "Why is Jake flagged?", DONNA has no path to `buildEntityEvidence(jakeEntity, ctx)`

---

## 5. Sprint 1355 Engines — Available but Unwired

| Engine | File | Entry point | Currently called from brain? |
|---|---|---|---|
| Canonical entity model | `entities/donnaAcademyEntityModel.ts` | `AcademyEntity` type | No |
| Relationship engine | `entities/donnaEntityRelationshipEngine.ts` | `getEntityRelationships(entity, rCtx)` | No |
| Evidence engine | `entities/donnaEntityEvidenceEngine.ts` | `buildEntityEvidence(entity, ctx)` | No |
| Timeline engine | `entities/donnaEntityTimelineEngine.ts` | `buildEntityTimeline(entity, ctx)` | No |
| Summary engine | `entities/donnaEntitySummaryEngine.ts` | `buildEntitySummary(entity, ctx, rCtx?)` | No |

All 5 engines are pure TypeScript, no DB, no React — safe to call from `processDonnaMessage.ts`.

---

## 6. Integration Points for Sprint 1385

### 6.1 — Entity Q&A (Step 10.5 enrichment)

**New step 10.5.1**: After V2 entity resolution succeeds AND `entityIntent.kind` is `'query'`, `'status'`, or `'improve'`, build a `UnifiedIntelligenceContext` and return a `UnifiedAnswer` instead of navigating.

**Also**: Add a new phrase detector `isEntityQueryPhrase()` at step 10.3 (before step 10.4) to catch:
- "Tell me about [entity]", "What do we know about [entity]"
- "How is [entity] doing?", "What's happening with [entity]?"
- "Why is [entity] flagged?", "What happened with [entity]?"
- "What evidence do we have on [entity]?"

### 6.2 — Evidence Follow-up (New Step 10.6)

**New step 10.6**: Detect evidence follow-up phrases ("why?", "what evidence?", "how confident?", "what's missing?", "tell me more"). If there's a previously resolved entity in `goalMemory`, re-resolve and call `buildEntityEvidence()` + `donnaEvidenceReasoningEngine`.

### 6.3 — COO Path Enrichment (Steps 7.1 / 7.5)

COO intelligence routes early and bypasses entity engines. In this sprint we do **not** rewire the COO path (that would touch the existing `runDonnaCOOIntelligenceAction` execution layer which is outside the brain file). The COO path enrichment is deferred — too high-risk to change in this sprint.

### 6.4 — Intelligence Trace

`donnaIntelligenceTrace.ts` provides a `IntelligenceTrace` type that records which engines fired, the entity resolved, confidence source, and whether fallback was used. The trace is included in the `UnifiedAnswer` for debugging.

---

## 7. Factory Problem — `ResolvedEntityV2` → `AcademyEntity`

The Sprint 1355 engines take `AcademyEntity` (the canonical discriminated union). The brain pipeline has `ResolvedEntityV2` (the V2 resolver output). A factory function is needed:

```
resolvedEntityToAcademyEntity(
  resolved: ResolvedEntityV2,
  ctx: AcademyEntityContext
): AcademyEntity | null
```

This looks up the entity's full data in `ctx`:
- `player` → find `ctx.players.find(p => p.playerId === resolved.id)` → build `PlayerEntity`
- `group` → find `ctx.groups.find(g => g.groupId === resolved.id)` → build `GroupEntity`
- `assessment` → find `ctx.assessments.find(a => a.assessmentId === resolved.id)` → build `AssessmentEntity`
- `template` → find `ctx.templates.find(t => t.templateId === resolved.id)` → build `TemplateEntity`
- `curriculum_level` → derive from `ctx.players` (find level by displayName match from resolved.displayName) → build `CurriculumLevelEntity`
- `coach`, `parent`, `session`, `workflow` → build base entity only (no extended data in current ctx)

This factory goes into `donnaUnifiedIntelligenceContext.ts`.

---

## 8. `DonnaMessageResult` additions needed

The `DonnaMessageResult` interface needs:
- `unifiedAnswer?: UnifiedAnswer | null` — the full unified answer when the intelligence pipeline fires

This allows the execution layer to surface evidence, timeline, and relationships in the UI without changing the brain's action contract.

---

## 9. Files to create / modify

| File | Action | Reason |
|---|---|---|
| `src/lib/donna/intelligence/donnaIntelligenceTrace.ts` | CREATE | Trace type + factory for auditing which engines fired |
| `src/lib/donna/intelligence/donnaUnifiedIntelligenceContext.ts` | CREATE | `buildUnifiedContext()`: V2 resolved entity + ctx → canonical entity + all engine outputs |
| `src/lib/donna/intelligence/donnaUnifiedAnswerBuilder.ts` | CREATE | `buildUnifiedAnswer()`: `UnifiedIntelligenceContext` → formatted DONNA answer with all fields |
| `src/lib/donna/brain/processDonnaMessage.ts` | MODIFY | Add step 10.3 (entity Q&A phrase detector), step 10.5.1 (unified answer when intent is query/status/improve), step 10.6 (evidence follow-up); add `unifiedAnswer` to result; import new engines |
| `src/lib/donna/brain/donnaBrainDebugLog.ts` | MODIFY | Add `'check_entity_qa'` and `'check_evidence_followup'` to `BrainRoutingStep` union |

---

## 10. Constraints

1. Pure TypeScript — no DB, no API calls in any new file.
2. `processDonnaMessage.ts` is already large (907 lines) — additions must be surgical.
3. New step 10.5.1 only fires when `entityContext !== null` AND entity resolved AND intent kind is `'query' | 'status' | 'improve'`. Existing navigation path for `'navigate'` intent is unchanged.
4. New step 10.6 only fires when evidence follow-up phrase detected AND `entityContext !== null`. When no prior entity, silently falls through.
5. COO path (steps 7.1/7.5) is NOT modified in this sprint — it routes early before entity context is available and wiring it would touch the execution layer.
6. No new fields on `DonnaMessageInput` — all inputs already available (`entityContext`, `goalMemory`, `conversationHistory`).
