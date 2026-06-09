# DONNA Evidence-Based Promotion Engine — Certification
**Sprint:** Mega Sprint 1445–1474 — DONNA Evidence-Based Promotion Engine V1
**Date:** 2026-06-09
**Status:** CERTIFIED — 13 scenarios, 13 PASS

---

## Certification scope

Tests cover:
1. Entity-specific promotion Q&A via brain step 10.5.1a
2. Set-level promotion scan via brain step 10.7
3. COO brief `promotionStatus` answer
4. All five PromotionStatus values across player, group, and curriculum_level entities
5. Data gap disclosure in all paths
6. Architecture invariants (no automatic level movement, director-only)

---

## Scenario results

| # | Scenario | Input | Expected | Result |
|---|---|---|---|---|
| A | Entity-specific READY: "Can Jake advance?" — Jake has `advancementEligible = true` + one `promotionReady` assessment | `isPromotionIntentPhrase()` matches; entity resolves to PlayerEntity; `evaluatePlayerPromotion` → READY, confidence HIGH | Returns `UnifiedAnswer` via step 10.5.1a with headline "Jake — Ready to advance (high confidence)"; evidence includes advancement_eligible_flag + assessment; `missingEvidence[]` lists gate criteria limitation | PASS |
| B | Entity-specific REVIEW_REQUIRED: "Can Jake advance?" — eligible flag set but no promotion-ready assessment | Same routing; no `promotionReady` assessments | Status REVIEW_REQUIRED, confidence MEDIUM; contradictions list "Advancement-eligible but no assessment explicitly marks promotion-ready"; recommended action: schedule formal assessment | PASS |
| C | Entity-specific NOT_READY: "Can Jake advance?" — not eligible, recent not-ready assessment | Same routing; `advancementEligible = false`, notReadyAssessments.length > 0 | Status NOT_READY; detail explains eligible flag not set and assessment evidence does not indicate readiness | PASS |
| D | Entity-specific MISSING_EVIDENCE: "Can Jake advance?" — no assessments at all | Same routing; `playerAssessments.length === 0` | Status MISSING_EVIDENCE, dataQualityNote "No assessments on file"; recommended action: schedule assessment | PASS |
| E | Entity-specific BLOCKED: "Why is Jake blocked?" — 200+ days at level, two not-ready assessments | `isPromotionIntentPhrase()` matches "why is Jake blocked"; entity resolves; 200 daysAtLevel + 2 notReadyAssessments | Status BLOCKED, confidence MEDIUM; contradictions include duration + failed assessments; `dataQualityNote` discloses "advancement_blocked_by not available in current context" | PASS |
| F | Group-level READY: "How is the Green Advanced group doing for promotions?" — majority eligible + assessment support | `isPromotionIntentPhrase()` matches; GroupEntity resolved; eligiblePlayers >= majorityThreshold + readyAssessments > 0 | Status READY, confidence MEDIUM; detail confirms majority eligible with assessment corroboration; recommended action: review individual advancements — no automatic group movement | PASS |
| G | Group-level NOT_READY: "Is the Red Ball group ready to advance?" — below 50% eligible | Same routing; GroupEntity; <50% eligible | Status NOT_READY; contradictions list eligible percentage; `dataQualityNote` notes level-based proxy limitation | PASS |
| H | Curriculum level: "Can the Orange 1 level advance?" — no players at level | `isPromotionIntentPhrase()` matches; CurriculumLevelEntity; `ctx.players` has no players at that level | Status MISSING_EVIDENCE, confidence LOW; detail explains no players found at level | PASS |
| I | Set-level scan: "Who is ready to advance?" | `isSetLevelPromotionQuery()` matches (no specific entity); step 10.7 fires; 2 players READY, 1 REVIEW_REQUIRED, 1 BLOCKED, 1 MISSING_EVIDENCE | Response lists all players by category; spoken: "2 players are ready to advance, 1 need review."; `*DONNA evaluates from available context signals...`* disclaimer included | PASS |
| J | Set-level scan — no eligible players: "Who can advance?" — all players NOT_READY | Same routing; all players have `advancementEligible = false` | Response: "No players are currently advancement-eligible. N players are enrolled — M need assessments."; no hallucinated READY players | PASS |
| K | COO brief promotionStatus — active academy with advancement candidates | `buildDailyCOOIntelligence()` called with `advancementReadyCount=2, stalledPlayerCount=3, reassessmentDueCount=1` | `answers.promotionStatus` = "• **2 players are advancement-eligible** — review and approve or defer..."; stalled entry present; reassessment entry present; disclaimer present | PASS |
| L | COO brief promotionStatus — no players | `buildDailyCOOIntelligence()` called with `activePlayers=0` | `answers.promotionStatus` = "No active players enrolled — promotion status cannot be evaluated." | PASS |
| M | COO brief promotionStatus — healthy academy: no advancement, no stalls, no reassessments due | `activePlayers=10, advancementReadyCount=0, stalledPlayerCount=0, reassessmentDueCount=0` | `answers.promotionStatus` = "No promotion actions are pending across 10 active players." + disclaimer | PASS |

---

## Architecture compliance

| Invariant | Verified |
|---|---|
| No automatic player level movement | ✓ All promotion engine outputs are advisory (`PromotionDecision`); no DB mutations |
| `finalize_player_placement()` is only path for level activation | ✓ Promotion engines produce recommendations only; brain returns `respond` not a write action |
| No DB calls in promotion engines | ✓ All 4 engines are pure TypeScript — no Supabase client, no server actions |
| Data gaps always disclosed | ✓ `missingEvidence[]` is always populated; gate criteria gap disclosed in every path |
| Director-only promotion visibility | ✓ All promotion steps only fire for `role === 'academy_director'` (entity context only available to director routes) |
| Proposed actions pipeline not bypassed | ✓ No promotion decision triggers a `proposed_action` — advisory only |

---

## Known V1 limitations

1. **Gate criteria not in context** — `advance_min_assessment_score`, `advance_min_domains_complete`, `advance_min_outcomes` from `curriculum_levels` are not in `AcademyEntityContext`. Promotion decisions use `advancementEligible` flag + assessment records as proxy. Disclosed in `missingEvidence[]` on every call.

2. **Per-gate evidence counts absent** — `player_gate_status` per-gate evidence counts are not in context. DONNA cannot report "Jake has 2/3 gate criteria met." Disclosed in `missingEvidence[]`.

3. **Group membership uses level proxy** — `group_players` relation is not in `AcademyEntityContext`. Group promotion uses players at the group's curriculum level as a proxy. Actual roster may differ. Disclosed in `dataQualityNote`.

4. **BLOCKED status is heuristic** — The `BLOCKED` status is derived from enrollment duration (180+ days) + failed assessment count (≥2), not from `advancement_blocked_by` string array (not in context). Actual explicit blockers may differ. Disclosed in `dataQualityNote`.

5. **Curriculum history absent** — `player_curriculum_history` is not in context. DONNA cannot report how many times a player has been reviewed for advancement. Disclosed in `missingEvidence[]`.
