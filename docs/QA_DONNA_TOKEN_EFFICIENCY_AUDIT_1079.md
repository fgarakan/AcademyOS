# QA — Sprints 1079–1084: DONNA Token Efficiency + Cost Control Block V1

**Date:** 2026-06-01

---

## Sprint 1080 — Token Usage Logging

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `OrchestratorResponse.inputTokens` field exists | Optional number | |
| 1.2 | `OrchestratorResponse.outputTokens` field exists | Optional number | |
| 1.3 | `OrchestratorResponse.latencyMs` field exists | Optional number | |
| 1.4 | `OrchestratorResponse.model` field exists | Optional string | |
| 1.5 | `OrchestratorResponse.toolCallCount` field exists | Optional number | |
| 1.6 | Standard LLM path populates `inputTokens`, `outputTokens`, `latencyMs`, `model`, `toolCallCount: 0` | Present in return value | |
| 1.7 | Tool-executed path populates same fields with `toolCallCount: 1` | Present | |
| 1.8 | `writeUsageEventToDb` receives `model`, `inputTokens`, `outputTokens`, `latencyMs` | Passed from response | |
| 1.9 | Deterministic-only paths have no token fields (undefined) | Fields absent | |
| 1.10 | TypeScript compiles clean | CLEAN | |

---

## Sprint 1081 — Page-Relevant Tool Manifest Filtering

| # | Check | Expected | Pass? |
|---|---|---|---|
| 2.1 | `/director/kpi` — tool manifest contains `get_academy_state` | Yes | |
| 2.2 | `/director/kpi` — tool manifest does NOT contain `get_session_context` | Absent | |
| 2.3 | `/director/review` — tool manifest contains `get_review_queue_guidance` | Yes | |
| 2.4 | `/director/review` — tool manifest does NOT contain `get_player_profile_summary` | Absent | |
| 2.5 | `/director/curriculum` — tool manifest contains `get_curriculum_context` | Yes | |
| 2.6 | `/director/curriculum` — does NOT contain `get_session_context` | Absent | |
| 2.7 | `/director/players/<id>` (player profile) — contains `get_player_profile_summary` | Yes | |
| 2.8 | `/director/sessions/<id>` — contains `get_session_context` | Yes | |
| 2.9 | Unknown route `/director/parents` — full 14-tool manifest returned | All 14 present | |
| 2.10 | God Mode still functions on known routes | Tool executes correctly | |
| 2.11 | TypeScript compiles clean | CLEAN | |

---

## Sprint 1082 — Academy Context TTL Cache

| # | Check | Expected | Pass? |
|---|---|---|---|
| 3.1 | First orchestrator call: academy profile fetched from DB | DB query fires | |
| 3.2 | Second orchestrator call within 5 min, same academyId: cache hit | No DB query | |
| 3.3 | Different academyId: separate cache entry | Correct isolation | |
| 3.4 | Academy data in cache is non-sensitive (name/slug/timezone only) | No player/coach data | |
| 3.5 | Cache miss (expired): DB query re-fires | DB query fires again | |
| 3.6 | Academy query failure: `buildEmptyAcademyProfile` used | Fallback, not error | |
| 3.7 | `CACHE_KEYS.ACADEMY_PROFILE` key used | Consistent key | |
| 3.8 | `CACHE_TTL_MS.ACADEMY_PROFILE` TTL used (5 min) | 300,000ms | |
| 3.9 | TypeScript compiles clean | CLEAN | |

---

## Sprint 1083 — Conversation History Relevance Filter

| # | Input | History turns | Expected: historyIsRelevant | Pass? |
|---|---|---|---|---|
| 4.1 | `"open approvals"` | 3 | `false` (navigation command) | |
| 4.2 | `"go to players"` | 2 | `false` (navigation) | |
| 4.3 | `"ok"` | 2 | `false` (< 20 chars) | |
| 4.4 | `""` (empty) | 0 | `false` (no history) | |
| 4.5 | `"What about those players you mentioned?"` | 2 | `true` (anaphoric "those") | |
| 4.6 | `"Can you tell me more about what you just said?"` | 1 | `true` (anaphoric) | |
| 4.7 | `"Tell me about the health of my academy and what actions I should take"` | 0 | `false` (no history) | |
| 4.8 | `"Tell me about the health of my academy and what actions I should take"` | 2 | `true` (> 60 chars) | |
| 4.9 | `"What needs attention?"` (23 chars) | 3 | `false` (< 30 chars threshold) | |
| 4.10 | `"What should I do about the session"` (35 chars) | 1 | `true` (≥ 30 chars, could be follow-up) | |
| 4.11 | TypeScript compiles clean | | CLEAN | |

---

## Sprint 1084 — Efficiency Tier Classification

| # | Check | Expected | Pass? |
|---|---|---|---|
| 5.1 | `donnaEfficiencyTiers.ts` exports `DonnaEfficiencyTier` type | 0–6 | |
| 5.2 | Exports `DonnaEfficiencyClassification` interface | Present | |
| 5.3 | Exports `DONNA_EFFICIENCY_TIERS` constant (7 entries) | Present | |
| 5.4 | Exports `classifyDonnaEfficiencyPath` function | Present | |
| 5.5 | Exports `getDonnaEfficiencyTierLabel` function | Present | |
| 5.6 | Exports `buildEfficiencyTrace` function | Present | |
| 5.7 | `"open approvals"` → Tier 0 (navigation) | `tier: 0` | |
| 5.8 | `hasContextPackAnswer: true` → Tier 1 | `tier: 1` | |
| 5.9 | `hasActionRegistryMatch: true` → Tier 2 | `tier: 2` | |
| 5.10 | `"explain these KPIs"` → Tier 3 (template-composed) | `tier: 3` | |
| 5.11 | `"what happened in yesterday's session with the player"` → Tier 5 or 6 (live data) | `tier >= 5` | |
| 5.12 | `buildEfficiencyTrace` returns no user input content | `inputLength` only | |
| 5.13 | Tier 4 metadata: `usesLlm: true, usesDbQuery: false` | Correct | |
| 5.14 | TypeScript compiles clean | CLEAN | |

---

## Regression checks (all sprints)

| # | Check | Expected | Pass? |
|---|---|---|---|
| 6.1 | "Open approvals" still routes to `/director/review` | Unchanged | |
| 6.2 | Context-pack answer on `/director/kpi` for health question | Still returns | |
| 6.3 | Action-registry "suggest level movement" returns blockedMessage | Still returns | |
| 6.4 | God Mode fallback for unknown questions | Still fires | |
| 6.5 | Voice input path unchanged | Same as typed | |
| 6.6 | Sprint 1078 product memory unchanged | Not wired | |
| 6.7 | `DonnaAssistantButton.tsx` unchanged across 1080–1083 | Not modified | |
| 6.8 | `donnaContextPackRegistry.ts` unchanged | Not modified | |
| 6.9 | `donnaActionRegistry.ts` unchanged | Not modified | |
