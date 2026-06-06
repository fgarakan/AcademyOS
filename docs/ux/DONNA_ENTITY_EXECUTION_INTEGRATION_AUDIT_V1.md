# DONNA Entity Execution Integration — Audit V1

**Sprint:** Mega Sprint 2321–2340  
**Date:** 2026-06-06  
**Purpose:** Integration audit for wiring the V2 entity intelligence layer into the live DONNA conversation pipeline.

---

## 1. Live Pipeline Entry Points Audited

### `DonnaAssistantButton.tsx` — Primary execution layer

| Aspect | Finding |
|---|---|
| `processDonnaMessage` call location | Line ~3923 — synchronous, before switch |
| Entity context passed to brain | **NOT passed** (pre-sprint state) |
| `navigate` action handler | Already wired: `router.push(brainResult.navigateTo)` — silent (no confirmation message) |
| `respond` action handler | Sets `commandResponse` + `cooThread` + speaks; no disambiguation state |
| `recordConversationTurn` entity label | Uses `brainResult.entity?.primary?.normalizedLabel` (V1 field only) |
| `updateLastEntity` call | **NOT called** after brain result (pre-sprint state) |
| Entity context state | **Not present** (pre-sprint state) |
| Disambiguation state | **Not present** (pre-sprint state) |

### `processDonnaMessage.ts` — Brain orchestration

| Step | Description | Entity-relevant? |
|---|---|---|
| 0a | Goal session routing | No |
| 0b | Goal workflow intent detection | No |
| 1 | Active guided workflow | No |
| 2 | COO control command | No |
| 3 | Continuity phrase | No |
| 4 | Today guidance | No |
| 5 | Daily brief | No |
| 6 | Review queue | No |
| 7 | Attention | No |
| 8 | Ambiguity resolution (V1) | Partial — uses `lastRelevantEntity` string to expand ambiguous pronouns |
| 9 | Intent classification | No |
| 10 | V1 entity resolution | Yes — resolves entities, sets `entity` field |
| 11 | Goal resolution | No |
| 12–16 | Context pack, workflow, respond, COO, God Mode | No |

**Gap:** No step intercepts entity navigation intents ("show me Jake", "open OB2") before falling through to the COO prompt chain.

### `DonnaMessageInput` / `DonnaMessageResult` types

- `DonnaMessageInput` has no `entityContext` or `pendingDisambiguation` fields (pre-sprint)
- `DonnaMessageResult` has no `resolvedEntityV2` or `disambiguationQuestion` fields (pre-sprint)

---

## 2. Entity Context Data Path

### What `DonnaContextSummary` (currently loaded in DonnaAssistantButton) contains

Text-only fields: `contextType`, `title`, `summary`, `keyFacts`, `openQuestions`, `suggestedNextSteps`, `dataUsed`, `missingData`, `safetyNotes`, `fetchedAt`.

**No entity roster data.** Cannot be used for V2 entity resolution.

### What `DirectorDonnaContext` contains

Includes: `playerCurriculumStateSummaries`, `groupSummaries`, `templateSummaries`, `assessmentSummaries` — exactly the data needed by `AcademyEntityContext`.

**Problem:** `loadDirectorDonnaContext` is a heavy aggregator (decisions, gaps, structural analysis, KPIs). Loading it just for entity resolution would be expensive and slow.

**Solution:** New server action `donnaEntityContextAction.ts` — loads only the 4 slices needed for entity resolution (players, groups, templates, assessments) in parallel. Coaches and parents not loaded (honest limitation).

---

## 3. Integration Points Identified

### Where to insert **Step 0.5 — Disambiguation resolution**

**Location:** Between Step 0b (goal workflow intent) and Step 1 (guided workflow)  
**Rationale:** A pending disambiguation answer must be resolved before ANY other intent detection. If the director says "the first one" while a disambiguation question is pending, it should not be classified as a new intent.

### Where to insert **Step 10.5 — Entity intelligence (V2)**

**Location:** Between Step 10 (V1 entity resolution) and Step 11 (goal resolution)  
**Rationale:**
- Runs AFTER Step 8 (ambiguity resolution) so "he" / "she" is already expanded to the player name
- Runs AFTER Step 9 (intent classification) but BEFORE Step 11 (goal resolution) — entity navigation is a terminal action that should not be routed to goal resolution
- Falls through silently if `entityContext` is null (backward compatible)

### Navigate case — extend to show message

Current `navigate` case: `router.push(brainResult.navigateTo)` — silent.  
Updated: shows `brainResult.response` as confirmation message before navigating, saves entity to goal memory.

---

## 4. Backward Compatibility Assessment

| Change | Backward compatible? | Notes |
|---|---|---|
| New `entityContext` field in `DonnaMessageInput` | ✅ Optional | Existing callers pass `undefined` → treated as null |
| New `pendingDisambiguation` field in `DonnaMessageInput` | ✅ Optional | Same |
| New `resolvedEntityV2` field in `DonnaMessageResult` | ✅ New field with default null | Does not change existing fields |
| New `disambiguationQuestion` field in `DonnaMessageResult` | ✅ New field with default null | Same |
| New BrainRoutingStep values | ✅ Union extension only | No switch exhaustiveness required |
| `navigate` case change in DonnaAssistantButton | ✅ Additive | Existing `router.push` preserved; message shown only when `brainResult.response` is non-empty |
| `respond` case change in DonnaAssistantButton | ✅ Additive | Existing `recordConversationTurn` preserved; new fields set conditionally |

---

## 5. Safe Action Boundaries

DONNA entity intelligence in this sprint is **read-only and navigation-only**:

| Capability | Included |
|---|---|
| Navigate to player profile | ✅ |
| Navigate to curriculum level view | ✅ |
| Navigate to group/template/assessment | ✅ |
| Resolve pronouns for memory continuity | ✅ |
| Show disambiguation question | ✅ |
| Answer relationship queries (who coaches X, who is in X) | ✅ (text response only) |
| Modify player data | ❌ Never |
| Trigger level movement | ❌ Never |
| Write to `proposed_actions` | ❌ Never in this sprint |
| Make external API calls | ❌ Never |

---

## 6. Known Limitations

1. **Coaches not loaded in entity context** — `AcademyEntityContext.coaches` is `[]` because the current data model has no coach loader in the entity slice. Coach resolution falls back to honest messages ("check the player profile").
2. **Parents not loaded** — Same limitation. Parent relationship queries work only when `ctx.parents` is populated externally (not yet wired).
3. **30-player cap** — `loadPlayerCurriculumStates` limits to 30 players. Large academies may need pagination.
4. **Entity context loaded once per session** — A coach who adds a new player mid-session will not see that player in DONNA entity resolution until the panel is closed and reopened.
5. **Medium-confidence confirm flow** — At 0.50–0.72 confidence, DONNA asks "Is that the one you meant?" but there is no explicit "yes/open it" handler yet. The director must repeat the request to navigate.
