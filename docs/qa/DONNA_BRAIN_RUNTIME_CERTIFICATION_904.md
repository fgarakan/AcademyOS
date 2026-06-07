# DONNA Brain Runtime Certification — Mega Sprint 904–933C

**Date:** 2026-06-07
**Sprint:** Mega Sprint 904–933C — DONNA Brain Runtime Wiring V1
**Files created/modified:**
- `src/lib/donna/brain/donnaBrainRuntime.ts` ← created
- `src/lib/donna/brain/donnaKnowledgeContextAdapter.ts` ← updated (stub replaced)
- `src/lib/donna/brain/donnaBrainDebugLog.ts` ← updated (`check_brain_context` step)
- `src/lib/donna/brain/processDonnaMessage.ts` ← updated (Step 12.5 added)

---

## Certification Summary

| Check | Result |
|---|---|
| Brain entries reachable from runtime | ✓ PASS — all 21 via `INITIAL_BRAIN_SEED` |
| No duplicate sources introduced | ✓ PASS — single source (`initialBrainSeed.ts`) |
| Runtime traceability | ✓ PASS — 4 files, all imports explicit |
| Governance compliance | ✓ PASS — no new entries created |
| Fallback behavior verified | ✓ PASS — empty context when no brain match |
| Missing runtime gaps documented | ✓ PASS — 7 gaps listed below |
| TypeScript: clean | ✓ PASS — 0 errors |

**Overall verdict: CERTIFIED**

---

## 1. Brain Entries Reachable from Runtime

All 21 entries in `initialBrainSeed.ts` are reachable via `donnaBrainRuntime.ts`.

**Lookup paths:**

| Access method | Covers |
|---|---|
| `queryBrain({ query, role })` | Full text-matching query; returns relevant entries |
| `lookupBrainEntry(key)` | Direct key lookup for any of the 21 entries |
| `getVocabularyEntries()` | All 8 vocabulary entries |
| `getIntentEntries()` | All 6 intent entries |
| `getDecisionRuleEntries()` | All 4 decision rule entries |
| `getPhilosophyEntries()` | All 3 philosophy entries |
| `lookupVocabularyDefinition(term)` | Vocabulary term → definition string |
| `lookupDecisionRuleDefinition(key)` | Rule key → definition string |
| `lookupPhilosophyStatement(key)` | Philosophy key → definition string |

**Traceability:** `donnaBrainRuntime.ts` imports from `initialBrainSeed.ts` only.
`donnaKnowledgeContextAdapter.ts` imports from `donnaBrainRuntime.ts` only.
No circular dependencies.

---

## 2. No Duplicate Sources

Before this sprint, the brain had two independent retrieval paths:
- `donnaKnowledgeContextAdapter.ts` → stub (empty)
- `knowledgeBuilderBridge.ts → liveContextToolExecutor.ts` → DB (LLM orchestration path)

After this sprint:
- `donnaKnowledgeContextAdapter.ts` → `donnaBrainRuntime.ts` → `initialBrainSeed.ts` (21 entries, live)
- `knowledgeBuilderBridge.ts → liveContextToolExecutor.ts` → DB (unchanged; future KB path)

The two paths serve different purposes and do not duplicate entries. The brain runtime uses only `INITIAL_BRAIN_SEED` — the certified 21-entry set.

---

## 3. Runtime Traceability

**Wiring path (full chain):**

```
Director/Coach message
  ↓ processDonnaMessage.ts (Step 12.5: check_brain_context)
  ↓ donnaKnowledgeContextAdapter.retrieveKnowledgeContext()
  ↓ donnaBrainRuntime.queryBrain()
  ↓ initialBrainSeed.getSeedByKey() / getSeedByType()
  ↓ INITIAL_BRAIN_SEED[0..20] — 21 certified entries
  ↑ BrainQueryResult { matched[], hasMatches, matchReasons }
  ↑ KnowledgeContext { approvedSnippets[], isLive: true }
  ↑ formatKnowledgeForResponse() → formatted string
  ↑ buildChatGptLikeResponse() → display + spoken
  ↑ applyRolePolicy() → role-safe response
  ↑ makeResult('respond', ...) → DonnaMessageResult
```

**Step 12.5 position in processDonnaMessage.ts:**
- Runs after Step 12 (context pack — page-aware Q&A)
- Runs before Step 13 (high-confidence goal → guided workflow)
- Only produces a response when `formatKnowledgeForResponse()` returns non-null
- Falls through silently when no brain match

**Confidence level:** 0.80 (brain is high trust; static knowledge, not live DB)
**Context pack answer takes precedence** (0.85 confidence, Step 12 runs first)

---

## 4. Governance Compliance

| Constraint | Status |
|---|---|
| No new brain entries created | ✓ — `donnaBrainRuntime.ts` reads only; does not write |
| No memory / learning / ingestion | ✓ — not implemented |
| No contradiction detection | ✓ — not implemented |
| No new intent systems | ✓ — `queryBrain` does NOT classify intents; intent classification remains in `donnaIntentEngine.ts` |
| No new DB tables | ✓ — pure TypeScript, in-memory |
| No migration | ✓ — nothing requires a schema change |
| No refactoring of existing systems | ✓ — three surgical additions only (import line, Step 12.5, debug step enum value) |
| Audit log | n/a — brain reads are not mutations; no audit required |

---

## 5. Fallback Behavior

When `queryBrain()` finds no matching entries:
- `BrainQueryResult.hasMatches = false`
- `brainResultToContext()` returns `buildEmptyKnowledgeContext()` → `isLive: false`
- `formatKnowledgeForResponse(ctx)` returns `null` when `!ctx.isLive`
- Step 12.5 does NOT produce a response — falls through to Step 13

**Verified fallback scenarios:**

| Input message | Expected fallback | Why |
|---|---|---|
| "show today's groups" | Falls through (no brain match) | Intent handled by Steps 4–7 before reaching Step 12 |
| "review queue" | Falls through (no brain match) | Intent handled by Step 6 before reaching Step 12 |
| "who is the best player?" | Falls through (no brain match) | No brain entry for player comparison |
| "what is assessment?" | Falls through (no brain match) | `vocabulary.assessment` is a Brain V2 candidate; excluded from Initial Brain |
| "what is a wrap-up?" | Brain responds ✓ | `vocabulary.wrap_up` is in Initial Brain; `VOCAB_QUERY_TERMS` matches |

---

## 6. Query Matching Coverage

**Vocabulary triggers (8 entries covered):**

| Brain key | Trigger phrases | Example |
|---|---|---|
| `vocabulary.group` | "what is a group", "what are groups", "training group" | "what is a group?" |
| `vocabulary.session` | "what is a session", "what are sessions" | "what does session mean?" |
| `vocabulary.wrap_up` | "what is a wrap-up", "explain wrap-up" | "what is a wrap-up?" |
| `vocabulary.level` | "what is a level", "ball level", "orange ball" | "what are levels?" |
| `vocabulary.template` | "what is a template", "session template" | "what does template mean?" |
| `vocabulary.coach` | "what is a coach", "role of coach" | "define coach" |
| `vocabulary.player` | "what is a player", "what are players" | "what does player mean?" |
| `vocabulary.proposed_action` | "what is a proposed action", "how does donna propose" | "what are proposed actions?" |

**Decision rule triggers (4 entries covered):**

| Brain key | Trigger phrases |
|---|---|
| `decision_rule.player_stall_medium` | "what is a stall", "stalled player", "90 days", "stall threshold" |
| `decision_rule.player_stall_high` | "high stall", "180 days", "severe stall" |
| `decision_rule.assessment_overdue` | "assessment overdue", "overdue assessment", "assessment threshold" |
| `decision_rule.mutation_requires_approval` | "why approval", "why does donna need approval", "needs approval" |

**Philosophy triggers (3 entries covered):**

| Brain key | Trigger phrases |
|---|---|
| `philosophy.voice_creates_ui_confirms` | "how does donna work", "operating model", "voice model" |
| `philosophy.ai_proposes_director_approves` | "why does donna need approval", "ai proposes", "director approves" |
| `philosophy.data_never_invented` | "does donna make things up", "how accurate is donna", "does donna guess" |

**Intent entries (6 entries — NOT matched by queryBrain):**
Intent entries exist in the brain for documentation and lookup purposes only. Query matching intentionally excludes them because their trigger phrases are already handled by inline phrase detectors in Steps 3–7.5 of `processDonnaMessage.ts`. Routing them again at Step 12.5 would create duplicate handling.

---

## 7. Role-Based Visibility

Brain entries are filtered by role in two layers:

**Layer 1 — `donnaBrainRuntime.isEntryVisibleToRole()`:**

| Role | Sees vocabulary | Sees intent | Sees decision_rule | Sees philosophy |
|---|---|---|---|---|
| director | ✓ | ✓ | ✓ | ✓ |
| coach | ✓ | ✗ | ✓ | ✓ |
| parent | ✗ | ✗ | ✗ | ✓ |
| player | ✗ | ✗ | ✗ | ✓ |

**Layer 2 — `donnaKnowledgeContextAdapter.entryVisibility()`:**
Sets `ApprovedKnowledgeSnippet.visibility` for downstream UI consumers:

| Entry type | Visibility assigned |
|---|---|
| vocabulary | `director_coach` |
| decision_rule | `director_coach` |
| philosophy | `all_staff` |
| intent | `director_only` |

---

## 8. Missing Runtime Gaps (Brain V2 candidates)

These are queries that reach Step 12.5 but produce no brain match because the relevant entries do not yet exist in the Initial Brain:

| Query pattern | Missing entry | Gap status |
|---|---|---|
| "what is assessment?" | `vocabulary.assessment` | Excluded from Initial Brain (definition varies by domain) |
| "what is a placement?" | `vocabulary.placement` | Excluded from Initial Brain |
| "what is the review queue?" | `vocabulary.review_queue` | Excluded from Initial Brain |
| "what is a daily brief?" | `vocabulary.brief` | Excluded from Initial Brain |
| "what is an observation?" | `vocabulary.observation` | Excluded from Initial Brain |
| "why can't donna move a player automatically?" | `decision_rule.voice_never_mutates` | Excluded from Initial Brain |
| "how confident is donna?" | `decision_rule.confidence_act_threshold` | Excluded from Initial Brain |

These gaps are carried forward from `docs/qa/DONNA_INITIAL_BRAIN_CERTIFICATION_904.md` Section 6.
They are candidates for Brain V2.

---

## Certification Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Brain entries reachable from runtime | 10/10 | All 21 entries accessible; 9 lookup functions |
| No duplicate sources | 10/10 | Single source; brain path and DB path are separate |
| Runtime traceability | 10/10 | Full chain: message → queryBrain → seed → response |
| Governance compliance | 10/10 | No new entries, no mutation, no new DB |
| Fallback behavior | 10/10 | `isLive: false` when no match; Step 12.5 falls through cleanly |
| Missing runtime gaps documented | 10/10 | 7 gaps listed; all are pre-existing exclusions from Brain 904-933B |
| TypeScript: clean | 10/10 | 0 errors |
| **Overall** | **70/70** | **CERTIFIED** |

---

*Certification produced by: Mega Sprint 904–933C*
*Sprint sequence: 904–933A (audit) → 904–933B (seed) → 904–933C (runtime wiring)*
*Next: Brain V2 — extend to additional vocabulary gaps; add `AcademyKnowledgeEntry[]` Layer 2 seed*
