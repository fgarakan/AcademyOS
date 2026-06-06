# DONNA Entity Intelligence QA — V1

**Sprint:** Mega Sprint 2291–2320  
**Validated:** 2026-06-06

Tests the 10 sprint phrases plus edge cases across entity resolution, disambiguation,
page context, and relationship graph.

---

## Test Matrix

Each test lists: input phrase → expected entity kind + id/displayName → expected route → expected confidence range → pass conditions.

---

### Test 1 — Exact player name: "Show me Jake"

| Field             | Expected |
|---|---|
| Input             | `"Show me Jake"` |
| Entity kind       | `player` |
| Match method      | Exact first name |
| Min confidence    | 0.80 |
| Route             | `/director/players/{jakesPlayerId}` |
| Pass condition    | Returns exactly 1 high-confidence player named Jake |
| Fail condition    | Returns a group or curriculum level, or returns no entity |

**Notes:** Requires at least one player with `playerName` starting with "Jake" in context. If multiple Jakes exist, disambiguation should be triggered.

---

### Test 2 — Short nickname: "Open JJ"

| Field             | Expected |
|---|---|
| Input             | `"Open JJ"` |
| Entity kind       | `player` |
| Match method      | Initials (first + last initial) |
| Min confidence    | 0.55 |
| Route             | `/director/players/{playerId}` |
| Pass condition    | Returns player whose first+last initials = "JJ" |
| Fail condition    | Returns no entity |

**Notes:** Confidence intentionally low (0.60) — below `CONFIDENCE_ACT_THRESHOLD` — so DONNA should clarify before navigating.

---

### Test 3 — Curriculum level short code: "Improve Orange Ball 2"

| Field             | Expected |
|---|---|
| Input             | `"Improve Orange Ball 2"` |
| Entity kind       | `curriculum_level` |
| Match method      | Alias match `"orange ball 2"` |
| Min confidence    | 0.90 |
| Route             | `/director/curriculum?improve=orange_ball_2` |
| Pass condition    | Returns `curriculum_level` with id `orange_ball_2` |
| Fail condition    | Returns player or group |

---

### Test 4 — Curriculum alias "OB2": "What's the status of OB2"

| Field             | Expected |
|---|---|
| Input             | `"What's the status of OB2"` |
| Entity kind       | `curriculum_level` |
| Match method      | Short-code alias `"ob2"` |
| Min confidence    | 0.90 |
| Route             | `/director/curriculum?improve=orange_ball_2` |
| Pass condition    | Returns `curriculum_level` with id `orange_ball_2` |

---

### Test 5 — Relationship: "Show Katrina's child" / "Show Katrina's player"

| Field             | Expected |
|---|---|
| Input             | `"Show Katrina's player"` |
| Entity kind       | relationship query (`parent` → `player`) |
| Method            | `resolveRelationshipQuery` → finds parent named Katrina → linked player |
| Pass condition (parents loaded)   | Returns linked player entity with route to player profile |
| Pass condition (no parents in ctx) | Returns honest fallback message mentioning Katrina's player profile |

**Notes:** Parents not in V1 context (`DirectorDonnaContext`). Graceful degradation must return a helpful message, not throw.

---

### Test 6 — Coach query: "Who coaches Jake?"

| Field             | Expected |
|---|---|
| Input             | `"Who coaches Jake?"` |
| Detected as       | Relationship query (coach) |
| Method            | `resolveRelationshipQuery` with `extractSubjectFromWhoCoaches` |
| Pass condition (coaches loaded)  | Returns coach entity |
| Pass condition (no coaches)      | Returns honest message: "Check Jake's player profile to see who coaches them" |

---

### Test 7 — Group membership: "Who is in Orange Ball 2?"

| Field             | Expected |
|---|---|
| Input             | `"Who is in Orange Ball 2?"` |
| Detected as       | Relationship query (members) |
| Method            | `resolveMembersOfLevel` |
| Pass condition    | Returns list of player names at Orange Ball 2 level via `message` field |
| Route             | `/director/curriculum?improve=orange_ball_2` (level entity) |
| Fail condition    | Returns null without a message |

---

### Test 8 — Pronoun resolution: "how is she doing?" (after "Show me Alessia")

| Field             | Expected |
|---|---|
| Input             | `"how is she doing?"` |
| Last entity       | Alessia's player entity (passed in as `lastEntity`) |
| Method            | `PRONOUN_RE` match → returns `lastEntity` |
| Confidence        | 0.78 |
| Pass condition    | Returns Alessia's entity with message "Resolved 'she' → Alessia ..." |
| Fail condition    | Returns null (pronoun not resolved) |

---

### Test 9 — Player disambiguation: "Show Danny" (Danny the coach vs Danny the player)

| Field             | Expected |
|---|---|
| Input             | `"Show Danny"` |
| Scenario          | Both a player named Danny and a coach named Danny exist |
| Method            | `resolveEntityV2` → `needsDisambiguation: true` |
| Pass condition    | Returns `needsDisambiguation: true` with 2 candidates (player + coach) |
| Pass condition    | `buildDisambiguationQuestion` formats a readable choice list |
| Pass condition    | `resolveDisambiguationAnswer("the player", question)` returns player entity |
| Fail condition    | Auto-selects one without asking |

---

### Test 10 — Page context boost: "Danny" on `/director/players` page

| Field             | Expected |
|---|---|
| Input             | `"Danny"` |
| Page route        | `/director/players` |
| Method            | `resolveEntityWithContext` → boosts `player` kind |
| Pass condition    | Returns player Danny with boosted confidence (≥ raw + 0.10) |
| Pass condition    | Does NOT trigger disambiguation if coach Danny also exists (player wins after boost) |

---

## Nickname / Fuzzy Tests

| Input        | Player in context     | Expected match | Method  |
|---|---|---|---|
| "Danny"      | "Daniel Barrios"     | ✓ match        | Nickname map: `danny` → `daniel` |
| "Jake"       | "Jacob Smith"        | ✓ match        | Nickname map: `jake` → `jacob` |
| "Jerod"      | "Jerrod Thompson"    | ✓ fuzzy        | Levenshtein: 85% similar → low confidence |
| "Alx"        | "Alex Moore"         | ✓ fuzzy        | Levenshtein: 75% similar → low confidence |
| "Xzybqq"     | (any)                | ✗ no match     | Below fuzzy threshold |

---

## Curriculum Alias Tests

| Input    | Expected level key       |
|---|---|
| `"OB1"`  | `orange_ball_1`          |
| `"OB2"`  | `orange_ball_2`          |
| `"HP1"`  | `high_performance_1`     |
| `"RB1"`  | `red_ball_1`             |
| `"GD2"`  | `green_dot_2`            |
| `"G1"`   | `green_dot_1`            |
| `"Y1"`   | `yellow_ball_1`          |

---

## Edge Cases

| Scenario                              | Expected behavior |
|---|---|
| Empty string input                    | `noEntityFound: true`, no error |
| Text with no recognizable entity      | `noEntityFound: true`, `candidates: []` |
| Multiple players with same first name | `needsDisambiguation: true`, up to 3 candidates |
| Pronoun without lastEntity param      | `isRelationshipQuery` = true, `resolveRelationshipQuery` returns null (no lastEntity) |
| Coach lookup with empty coaches array | Honest fallback message, no error |
| Parent lookup with empty parents array | Honest fallback message, no error |
| "Orange Ball" (no number)             | `curriculum_level` stage match, confidence 0.82, route `/director/curriculum?stage=orange_ball` |

---

## How to run manually (dev console)

```typescript
import { resolveEntityV2 } from '@/lib/donna/entity/donnaEntityResolver'
import { resolveEntityWithContext } from '@/lib/donna/entity/donnaEntityContextResolver'
import { resolveRelationshipQuery } from '@/lib/donna/entity/donnaRelationshipGraph'
import { buildDisambiguationQuestion, resolveDisambiguationAnswer } from '@/lib/donna/entity/donnaDisambiguationEngine'

// Build a minimal test context
const ctx = {
  players: [
    { playerId: 'p1', playerName: 'Jake Smith', currentLevelId: 'uuid-ob2', currentLevelDisplayName: 'Orange Ball 2', advancementEligible: false, enrolledAt: '2025-01-01', lastEvaluatedAt: null },
    { playerId: 'p2', playerName: 'Daniel Barrios', currentLevelId: 'uuid-ob1', currentLevelDisplayName: 'Orange Ball 1', advancementEligible: true, enrolledAt: '2025-03-01', lastEvaluatedAt: null },
  ],
  groups: [
    { groupId: 'g1', name: 'Orange Ball 2 Group', levelId: 'uuid-ob2', track: null, maxPlayers: 8 },
  ],
  templates: [],
  assessments: [],
  coaches: [
    { coachId: 'c1', displayName: 'Danny Barrios', firstName: 'Danny', lastName: 'Barrios', role: 'head_coach' },
  ],
}

// Test 1: Show me Jake
console.log(resolveEntityV2('Show me Jake', ctx))

// Test 3: Orange Ball 2
console.log(resolveEntityV2('Improve Orange Ball 2', ctx))

// Test 7: Who is in Orange Ball 2
console.log(resolveRelationshipQuery('Who is in Orange Ball 2?', ctx))

// Test 9: Disambiguation
const result = resolveEntityV2('Show Danny', ctx)
if (result.needsDisambiguation) {
  const q = buildDisambiguationQuestion(result.candidates, 'Danny')
  console.log(q.questionText)
  console.log(resolveDisambiguationAnswer('the player', q))
}
```
