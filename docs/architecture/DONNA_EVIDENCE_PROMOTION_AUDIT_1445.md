# DONNA Evidence-Based Promotion — Architecture Audit
**Sprint:** Mega Sprint 1445–1474 — DONNA Evidence-Based Promotion Engine V1
**Date:** 2026-06-09
**Auditor:** Claude Code

---

## 1. Advancement Systems — Current Inventory

### 1.1 Player Advancement

**`src/lib/evidence/levelReadinessEngine.ts`** (existing, Sprint ~452)

The only current evidence-based advancement logic for players.

| Field | Value |
|---|---|
| Status types | `'ready' \| 'close' \| 'not_ready' \| 'insufficient_evidence'` |
| Input | `EvidenceRecord[]` from `playerEvidenceTypes.ts` — DB-backed evidence records |
| Confidence scoring | Weighted average of evidence record scores (0–100) |
| Critical categories | `['skill', 'competition']` — both must be present for 'ready' |
| Required categories | `['skill', 'competition', 'movement', 'mental_performance', 'behavior']` |
| Min evidence count | 2 records |
| Output | `LevelReadinessResult` with `readinessScore`, `confidence`, `supportingEvidence[]`, `blockingEvidence[]`, `staleEvidence[]`, `missingCategories[]`, `donnaExplanation`, `recommendedNextAction` |

**Connected to:**
- `src/lib/evidence/developmentPrioritiesEngine.ts` — uses readiness result in player profile
- `src/app/director/players/[playerId]/page.tsx` — player profile page (reads DB evidence records)

**NOT connected to:**
- DONNA brain pipeline (`processDonnaMessage.ts`) — no routing step calls this
- Entity intelligence pipeline (Sprint 1355/1385) — `AcademyEntityContext` not used
- COO intelligence engine — not surfaced in daily brief
- Any conversational question ("Can Jake advance?")

---

### 1.2 `player_curriculum_states` Table — Advancement Flags

| Column | Type | Meaning |
|---|---|---|
| `advancement_eligible` | `boolean` | DB flag — set by director/coach actions; means "director has marked eligible" |
| `advancement_blocked_by` | `string[] \| null` | Array of string reasons why advancement is blocked |

**What `advancement_eligible` means in practice:**
This flag is SET manually (or by a Supabase function after director confirms gate evidence). It does NOT mean a full readiness score has been computed — it means a human has reviewed and marked the player as eligible. It IS the strongest promotion signal available in `AcademyEntityContext`.

**What `advancement_blocked_by` means:**
String array of human-readable blockers (e.g., `["Serve gate not met", "No recent assessment"]`). When non-empty, player is actively blocked.

**Available in `AcademyEntityContext.players`:**
Both `advancementEligible` and `enrolledAt` are in `PlayerCurriculumStateSummary` — accessible at brain time.

---

### 1.3 `curriculum_levels` Table — Advancement Thresholds

| Column | Meaning |
|---|---|
| `advance_min_assessment_score` | Minimum assessment score to advance (nullable) |
| `advance_min_domains_complete` | Minimum domains that must be complete |
| `advance_min_outcomes` | Minimum outcomes completed |
| `is_assessment_required` | Whether a formal assessment is required |
| `min_assessment_score` | Minimum score for the level itself (not advancement) |

**Gap:** These thresholds are stored in `curriculum_levels` but are NOT included in `AcademyEntityContext`. They require a separate DB query. DONNA cannot currently check "has Jake met the `advance_min_assessment_score` threshold?" without DB access at brain time.

---

### 1.4 `curriculum_gates` Table — Gate Criteria

Each gate defines a specific criterion that must be met to transition from one level to another.

| Column | Meaning |
|---|---|
| `from_level_id` | Source level |
| `to_level_id` | Target level (nullable = level completion, not advancement) |
| `criterion` | Free-text description of what must be demonstrated |
| `threshold` | Free-text threshold (e.g., "7/10 rallies", "3 observations") |
| `domain` | Which curriculum domain this gate belongs to |
| `gate_type` | Type of gate (`evidence`, `assessment`, `coach_observation`, etc.) |
| `evidence_window` | How long evidence stays valid |

**Gap:** `curriculum_gates` is NOT in `AcademyEntityContext`. Gate criteria cannot be evaluated by DONNA at brain time without a DB query.

---

### 1.5 `player_gate_status` Table — Per-Player Gate Progress

| Column | Meaning |
|---|---|
| `player_id` | Which player |
| `gate_id` | Which gate |
| `status` | `not_started \| observing \| evidence_threshold_met \| blocked \| confirmed \| waived` |
| `evidence_count` | How many evidence submissions |
| `confirmed_at` | When director confirmed gate completion |
| `waived_at` | When director waived the gate requirement |

**Gap:** `player_gate_status` is NOT in `AcademyEntityContext`. DONNA cannot check "has Jake met all gates?" without DB access.

---

### 1.6 `assessments` Table — Promotion-Ready Flag

| Column | Meaning |
|---|---|
| `promotion_ready` | `boolean` — explicitly set by coach/director on the assessment |
| `promotion_notes` | Free-text notes from the assessor |
| `overall_score` | Numeric score |

**Available in `AcademyEntityContext.assessments`:**
`AssessmentSummary` includes `promotionReady: boolean` and `overallScore: number | null`. This IS accessible at brain time.

---

### 1.7 `player_curriculum_history` Table — Past Level Changes

| Column | Meaning |
|---|---|
| `from_level_id` | Previous level |
| `to_level_id` | New level |
| `advanced_at` | When the move happened |
| `advanced_by` | Who authorized the move |
| `assessment_score_at_time` | Score when they moved |
| `domains_mastered_at_time` | Domains complete when they moved |

**Gap:** `player_curriculum_history` is NOT in `AcademyEntityContext`. DONNA cannot see how many times a player has been evaluated for advancement.

---

### 1.8 Badge System — `src/lib/badges/badgeEligibilityEngine.ts`

`BadgeEligibilityInput` takes: `attendanceRate`, `skillAssessmentScore`, `completedOutcomes`, `hoursOnCourt`, `levelsProgressed`, `missionsCompleted`, `parentEngagement`.

`buildBadgeEligibilityReport()` returns earned/pending/locked badges.

**Gap:** The badge system is NOT connected to DONNA at all. DONNA cannot answer "What badges has Jake earned?" or "What does Jake need for his next badge?"

---

### 1.9 Mission Engine — `src/lib/player/missionEngine.ts`

Evaluates player missions based on progress metrics. Returns mission eligibility by category.

**Gap:** Not connected to DONNA. DONNA cannot answer "What missions is Jake eligible for?"

---

## 2. Gaps — What DONNA Cannot Currently Answer

| Question | Current DONNA behavior | Root cause |
|---|---|---|
| "Can Jake advance?" | Falls through to `route_coo_prompt` → LLM fallback | No promotion intent detector; no promotion engine in brain |
| "Who is ready for promotion?" | Reaches step 10.5.1 for entity Q&A but no promotion logic | `buildEntitySummary()` has stall/eligible signal but no `PromotionDecision` type |
| "Why is Jake blocked?" | Falls through to `route_coo_prompt` | `advancement_blocked_by` string array is in context but never interpreted |
| "What evidence is missing for Jake?" | Falls through | Evidence gap detection exists in `levelReadinessEngine.ts` but not wired to brain |
| "Who is close to advancing?" | Not computed at brain time | "Close" status requires gate evidence counts (DB) |
| "Is the Green Ball curriculum complete?" | Not computed | Requires checking all required gates/domains — not in AcademyEntityContext |
| "Can the Orange 1 group move to Orange 2?" | Not computed | Requires group-level eligibility aggregation |
| "What needs reassessment?" | Partially answered by existing stall detection | No "MISSING_EVIDENCE" classification |
| "What badges has Jake earned?" | Not answered | Badge engine not in DONNA pipeline |
| "What missions is Jake eligible for?" | Not answered | Mission engine not in DONNA pipeline |

---

## 3. Hardcoded / Heuristic Decisions

| Location | Hardcoded logic | Impact |
|---|---|---|
| `levelReadinessEngine.ts` L52 | `REQUIRED_CATEGORIES = ['skill', 'competition', 'movement', 'mental_performance', 'behavior']` | These categories are hardcoded, not driven by `curriculum_levels` thresholds |
| `levelReadinessEngine.ts` L53 | `CRITICAL_CATEGORIES = ['skill', 'competition']` | Hardcoded; does not respect academy-specific gate priorities |
| `levelReadinessEngine.ts` L55 | `MIN_CATEGORIES_FOR_READY = 3` | Academy-agnostic threshold |
| `levelReadinessEngine.ts` L131 | `readinessScore >= 75` for 'ready' | Fixed threshold regardless of level |
| `progressionIntelligence.ts` | "90+ days = stalled" | Fixed, not per-level |
| `donnaEntitySummaryEngine.ts` | "90+ days = medium stall, 180+ days = high stall" | Fixed thresholds |
| `player_curriculum_states.advancement_eligible` | Boolean flag set by human | Not computed — human decision persisted as data |

---

## 4. What IS Available in `AcademyEntityContext` for Promotion Decisions

The Sprint 1385 unified intelligence pipeline uses `AcademyEntityContext`. The following is available at brain time **without any new DB queries**:

| Signal | Source | Promotion use |
|---|---|---|
| `player.advancementEligible` | `player_curriculum_states.advancement_eligible` | STRONGEST signal: human-confirmed eligible → `READY` |
| `player.advancement_blocked_by[]` | `player_curriculum_states.advancement_blocked_by` | STRONGEST blocker: explicitly blocked → `BLOCKED` |
| `assessments[].promotionReady` | `assessments.promotion_ready` | Assessment-backed signal: `promotionReady = true` → supports READY |
| `assessments[].overallScore` | `assessments.overall_score` | Score evidence |
| `player.enrolledAt` | `player_curriculum_states.enrolled_at` | Days-at-level staleness signal |
| `player.lastEvaluatedAt` | `player_curriculum_states.last_evaluated_at` | Recency of last evaluation |
| `groups[].maxPlayers` | `groups.max_players` | Over-capacity signal for group promotion |
| `templates[].curriculumLevelId` | `templates.curriculum_level_id` | Template coverage for curriculum completion |

**What is NOT available at brain time:**
- `advance_min_assessment_score`, `advance_min_domains_complete`, `advance_min_outcomes` — in `curriculum_levels` table, not in context
- `player_gate_status` per-gate evidence counts — requires separate DB query
- `player_curriculum_history` — not in context
- `player_requirement_progress` — not in context

---

## 5. Design Decisions for Sprint 1445

### 5.1 Two-layer promotion model

**Layer 1 — Signal-based (pure TypeScript, uses AcademyEntityContext):**
- Uses `advancementEligible`, `advancement_blocked_by`, `promotionReady`, days-at-level
- Returns `PromotionDecision` with `PromotionStatus`: `READY | NOT_READY | MISSING_EVIDENCE | REVIEW_REQUIRED | BLOCKED`
- Honest about limitations (`dataGaps[]`)
- Confidence: `high` when DB flags are set; `medium` when derived from heuristics; `low` when few signals

**Layer 2 — Full evidence (future sprint, requires additional DB queries):**
- Wire `curriculum_gates` + `player_gate_status` into promotion engine
- Enable DONNA to answer "Jake has 2/3 gate criteria met"

Sprint 1445 builds **Layer 1 only**.

### 5.2 Status mapping

| PromotionStatus | Trigger | DB signal |
|---|---|---|
| `READY` | `advancementEligible === true` AND at least one `promotionReady` assessment | `advancement_eligible = true` + `assessments.promotion_ready = true` |
| `REVIEW_REQUIRED` | `advancementEligible === true` but NO `promotionReady` assessment | `advancement_eligible = true` + no matching assessment |
| `BLOCKED` | `advancement_blocked_by.length > 0` | `advancement_blocked_by` array non-empty |
| `MISSING_EVIDENCE` | NOT eligible, NOT blocked, no assessments at all OR last assessment > 90 days | Heuristic from enrollment date + assessment records |
| `NOT_READY` | NOT eligible, NOT blocked, has assessments but none are `promotionReady` | `advancement_eligible = false` + all assessments `promotionReady = false` |

### 5.3 Promotion intent detection (brain step 10.7)

New phrase detector `isPromotionIntentPhrase()` catches:
- "Can Jake advance?", "Is Jake ready to move up?", "Can Jake move to Green Ball?"
- "Who is ready for promotion?", "Who is advancement-eligible?"
- "Why is Jake blocked?", "What's blocking Jake?"
- "What evidence is missing?", "Who needs reassessment?"
- "Who is ready?", "Who can advance?"

Fires a new brain step `'check_promotion_intent'` that:
1. Detects entity phrase from question
2. Resolves entity via `resolveEntityWithContext()`
3. Calls `evaluatePlayerPromotion(entity, ctx)` or `evaluateGroupPromotion(entity, ctx)`
4. Returns `UnifiedAnswer` with `PromotionDecision` embedded in evidence

### 5.4 COO Integration (Step 8)

Modify `donnaDailyCooIntelligenceEngine.ts` to include a `promotionInsights` section built by:
- `getReadyPlayers(ctx)` — players with `READY` status
- `getBlockedPlayers(ctx)` — players with `BLOCKED` status
- `getMissingEvidencePlayers(ctx)` — players with `MISSING_EVIDENCE` status

Uses only `AcademyEntityContext.players` + `assessments` — same data already in brain.

---

## 6. Files to Create / Modify

| File | Action | Reason |
|---|---|---|
| `src/lib/donna/promotion/donnaPromotionFramework.ts` | CREATE | `PromotionStatus`, `PromotionDecision`, `PromotionConfidence`, `PromotionEvidenceItem` types |
| `src/lib/donna/promotion/donnaPlayerPromotionEngine.ts` | CREATE | `evaluatePlayerPromotion(entity, ctx)` → `PromotionDecision` |
| `src/lib/donna/promotion/donnaCurriculumPromotionEngine.ts` | CREATE | `evaluateCurriculumLevel(entity, ctx)` → `PromotionDecision` |
| `src/lib/donna/promotion/donnaGroupPromotionEngine.ts` | CREATE | `evaluateGroupPromotion(entity, ctx)` → `PromotionDecision` |
| `src/lib/donna/promotion/donnaPromotionRecommendationEngine.ts` | CREATE | `buildPromotionRecommendation(decision, entityName)` → formatted DONNA answer |
| `src/lib/donna/brain/processDonnaMessage.ts` | MODIFY | Add step 10.7: promotion intent detection and answer path |
| `src/lib/donna/brain/donnaBrainDebugLog.ts` | MODIFY | Add `'check_promotion_intent'` to `BrainRoutingStep` |
| `src/lib/donna/coo/donnaDailyCooIntelligenceEngine.ts` | MODIFY | Add `promotionInsights` section from promotion engines |
| `docs/architecture/DONNA_EVIDENCE_PROMOTION_AUDIT_1445.md` | CREATE | This document |
| `docs/qa/DONNA_EVIDENCE_PROMOTION_CERTIFICATION_1445.md` | CREATE | 10-scenario certification |
| `docs/CHANGELOG.md` | UPDATE | Dated entry |
| `docs/certification/DONNA_CAPABILITY_SCORECARD.md` | UPDATE | Score updates |

---

## 7. Architecture Invariants — Never Cross

1. **No automatic player level movement** — `finalize_player_placement()` is the only path. The promotion engine PROPOSES; it never moves.
2. **`PromotionDecision` is advisory only** — all decisions route to director confirmation.
3. **No DB calls in promotion engines** — all computation from `AcademyEntityContext` (pure TypeScript).
4. **Data gaps always disclosed** — `PromotionDecision.missingEvidence[]` is always populated.
5. **No parent/player exposure** — promotion decisions are director-only, never surfaced to parent or player portals.

---

## 8. Confidence Calibration

| Scenario | Confidence | Reason |
|---|---|---|
| `advancement_eligible = true` + `promotionReady = true` assessment | HIGH | Two independent signals from DB flags |
| `advancement_eligible = true` + no `promotionReady` assessment | MEDIUM | One signal, missing corroboration |
| `advancement_blocked_by` non-empty | HIGH | Explicit DB record of blocker |
| `advancement_eligible = false` + days >= 180 + no assessments | MEDIUM | Heuristic from enrollment date |
| No curriculum state at all | LOW | Missing data signal |
| Group: majority eligible | MEDIUM | Aggregate signal from player flags |
