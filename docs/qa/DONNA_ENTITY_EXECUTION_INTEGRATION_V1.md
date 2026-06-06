# DONNA Entity Execution Integration QA — V1

**Sprint:** Mega Sprint 2321–2340  
**Validated:** 2026-06-06

Tests the live wiring of the V2 entity intelligence layer into the DONNA conversation pipeline.
Each test covers a full round-trip: director phrase → brain step → action → UI result.

---

## Success Criteria Checklist

- [ ] "Show me Jake" → navigates to `/director/players/{id}` with confirmation message
- [ ] "Open JJ" → disambiguation or confirmation at medium confidence
- [ ] "Improve Orange Ball 2" → navigates to `/director/curriculum?improve=orange_ball_2`
- [ ] "Who is in OB2?" → DONNA text response listing players at that level
- [ ] Multi-match phrase → disambiguation question shown in conversation thread
- [ ] Director says "the player" → resolves disambiguation → navigates
- [ ] "How is she doing?" (after "Show me Alessia") → pronoun resolved to Alessia
- [ ] "Show review queue" still works (not intercepted by entity intelligence)
- [ ] "Walk me through placement" still works (goal workflow, not entity)
- [ ] "What needs attention?" still works (attention intent, not entity)
- [ ] entityContext loads once on panel open (not re-fetched every turn)
- [ ] Panel close clears `pendingDisambiguation`

---

## Test Cases

### Test 1 — Direct player navigation: "Show me Jake"

**Pre-condition:** At least one player with first name "Jake" in the academy.

| Step | Expected |
|---|---|
| Input | `"Show me Jake"` |
| Brain step | `check_entity_intent` |
| Action | `navigate` |
| Response shown | `"Opening Jake's profile."` |
| Navigation | `/director/players/{jakesPlayerId}` |
| Goal memory | `lastRelevantEntity = "Jake {lastName}"` |
| `pendingDisambiguation` | `null` |

**If multiple Jakes:**
- Brain returns `respond` with disambiguation question
- `pendingDisambiguation` set to the `DisambiguationQuestion`
- Director says "the first one" → brain resolves → `navigate`

---

### Test 2 — Curriculum level navigation: "Improve Orange Ball 2"

| Step | Expected |
|---|---|
| Input | `"Improve Orange Ball 2"` |
| Brain step | `check_entity_intent` |
| Entity kind | `curriculum_level` |
| Confidence | ≥ 0.90 |
| Action | `navigate` |
| Response shown | `"Taking you to the Orange Ball 2 curriculum view."` |
| Navigation | `/director/curriculum?improve=orange_ball_2` |

---

### Test 3 — Short-code alias: "What's the status of OB2"

| Step | Expected |
|---|---|
| Input | `"What's the status of OB2"` |
| Brain step | `check_entity_intent` |
| Entity kind | `curriculum_level` |
| Confidence | ≥ 0.90 |
| Action | `navigate` |
| Navigation | `/director/curriculum?improve=orange_ball_2` |

---

### Test 4 — Group membership relationship: "Who is in Orange Ball 2?"

| Step | Expected |
|---|---|
| Input | `"Who is in Orange Ball 2?"` |
| Brain step | `check_entity_intent` |
| Detected as | Relationship query (members) |
| Action | `respond` |
| Response | `"Players at Orange Ball 2: [names list]"` |
| Navigation | None (text response only) |

---

### Test 5 — Disambiguation flow: "Show Danny" (player + coach both named Danny)

**Turn 1:**
- Input: `"Show Danny"`
- Brain returns `respond` + `disambiguationQuestion` set
- Thread shows: `"I found a few matches for 'Danny': 1. Danny Barrios (Player) 2. Danny Torres (Coach)..."`
- `pendingDisambiguation` state set

**Turn 2:**
- Input: `"the player"`
- Brain step: `check_disambiguation`
- Resolves to Danny Barrios (Player)
- Action: `navigate` → `/director/players/{id}`
- `pendingDisambiguation` cleared

---

### Test 6 — Pronoun resolution: "how is she doing?" (after showing Alessia)

**Pre-condition:** Previous `navigate` to Alessia's profile → `lastRelevantEntity = "Alessia Marino"` in goal memory.

| Step | Expected |
|---|---|
| Input | `"how is she doing?"` |
| Brain step 8 | Ambiguity resolution expands "she" → "Alessia Marino" |
| Brain step 10.5 | isRelationshipQuery detects pronoun → resolveRelationshipQuery with lastEntity |
| Action | `respond` |
| Response | `"Resolved 'she' → Alessia Marino (from previous message)"` + navigation or profile summary |

---

### Test 7 — Guard phrases (should NOT trigger entity intelligence)

| Input | Expected outcome |
|---|---|
| `"Show review queue"` | `open_review` action — not entity intent |
| `"What needs attention?"` | `fetch_attention` action |
| `"Walk me through placement"` | `start_goal_session` action |
| `"Daily brief"` | `fetch_brief` action |
| `"Open a new fitness template"` | COO prompt chain (contains "open a new") |

---

### Test 8 — Low confidence entity (fuzzy match only)

| Input | Scenario |
|---|---|
| `"Show Jerod"` | Player is "Jerrod Thompson" — fuzzy match confidence ~0.45 |
| Expected | Falls through entity intelligence (below 0.50) → routes to COO prompt chain |
| Must NOT | Navigate automatically to a wrong player |

---

### Test 9 — Entity context not loaded (panel just opened, context still loading)

| Input | `"Show me Jake"` (before entity context load completes) |
|---|---|
| `entityContext` state | `null` |
| Brain step 10.5 | Skipped (entityContext is null) |
| Fallback | Routes to COO prompt chain |
| Expected outcome | COO prompt chain responds with general info about navigating to player profiles |

---

### Test 10 — Panel close clears disambiguation

1. Director sends "Show Danny" → `pendingDisambiguation` is set
2. Director closes DONNA panel
3. `closePanel()` calls `setPendingDisambiguation(null)`
4. Director reopens panel
5. `pendingDisambiguation` is `null`
6. Director says "the player" → brain Step 0.5 skipped (no pending question) → routes to COO prompt

---

## Entity Context Load Timing

The entity context server action should complete within 500ms on a warm Supabase connection.
If loading fails (auth error, network error), `entityContext` remains null and DONNA silently
falls through to the COO prompt chain — no error shown to the director.

---

## Manual Test Console Script

```typescript
// In browser devtools, after panel opens:
// Inspect the brainResult by temporarily adding a window debug hook.

// 1. Verify entity context was loaded:
//    Check React state in devtools: DonnaAssistantButton → entityContext (should be non-null with players[])

// 2. Test entity intent detection:
import { detectEntityIntent } from '/src/lib/donna/entity/donnaEntityIntentRouter'
console.log(detectEntityIntent('Show me Jake'))
// Expected: { kind: 'navigate', entityPhrase: 'Jake', rawText: 'Show me Jake' }

console.log(detectEntityIntent('Show review queue'))
// Expected: null (guard phrase)

console.log(detectEntityIntent('Improve Orange Ball 2'))
// Expected: { kind: 'improve', entityPhrase: 'Orange Ball 2', rawText: 'Improve Orange Ball 2' }

// 3. Test entity resolve with context:
import { resolveEntityWithContext } from '/src/lib/donna/entity/donnaEntityContextResolver'
// ... (requires entityContext object from the loaded state)
```
