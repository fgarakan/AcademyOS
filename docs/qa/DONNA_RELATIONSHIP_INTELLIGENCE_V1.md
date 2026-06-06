# DONNA Relationship Intelligence QA — V1

**Sprint:** Mega Sprint 2341–2370  
**Validated:** 2026-06-06

Tests the full relationship intelligence pipeline from director phrase → brain step → response.

---

## Success Criteria Checklist

- [ ] "Who else is in Jake's group?" → lists all players at Jake's level
- [ ] "Who else is in that group?" (after showing Jake) → resolves via lastRelevantEntity
- [ ] "Which players share the same bottleneck?" → identifies hotspot level + stalled players
- [ ] "Which coach has the most players needing attention?" → honest fallback (coaches not loaded)
- [ ] "Which parents need updates?" → honest fallback (parents not loaded)
- [ ] "Which curriculum level causes the most issues?" → returns hotspot level with stall stats
- [ ] "What should I focus on today?" → routes to today guidance (NOT relationship intelligence)
- [ ] "Which players are stalled?" → returns stalled player list ordered by severity
- [ ] "Academy health" → returns full academy insight summary
- [ ] "Why does Jake need attention?" → COO reasoning with stall context + peer comparison
- [ ] "Which players are ready to advance?" → lists advancement-eligible players
- [ ] "Which players haven't been assessed?" → lists players without assessment in 90 days
- [ ] entityContext null → relationship intelligence step skipped gracefully
- [ ] "Show review queue" still works (guard phrase, not intercepted)

---

## Test Cases

### Test 1 — Co-group members: "Who else is in Jake's group?"

**Pre-condition:** Jake is a player at Orange Ball 2; other players exist at Orange Ball 2.

| Step | Expected |
|---|---|
| Input | `"Who else is in Jake's group?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `co_group_members` |
| Subject | `"Jake"` |
| Lookup | `rCtx.playerByPlayerId` → group via `groupByLevelId` → members via `playersByLevelId` |
| Response | `"**Orange Ball 2 Group** has N players total. Other members alongside Jake: [names]"` |
| Action | `respond` |

---

### Test 2 — Demonstrative co-group: "Who else is in that group?" (after showing Jake)

**Pre-condition:** Previous navigation to Jake → `lastRelevantEntity = "Jake [lastname]"` in goal memory.

| Step | Expected |
|---|---|
| Input | `"Who else is in that group?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `co_group_members` |
| Subject | `null` (no named subject in phrase) |
| Resolution | `goalMemory.lastRelevantEntity` → finds Jake → resolves co-group |
| Response | `"**Orange Ball 2 Group** has N players total. Other members alongside Jake: [names]"` |

---

### Test 3 — Shared bottleneck: "Which players share the same bottleneck?"

| Step | Expected |
|---|---|
| Input | `"Which players share the same bottleneck?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `shared_bottleneck` |
| Resolution | `rCtx.levelHotspot` → players at that level |
| Response | `"**Shared bottleneck: [Level Name]**\n\nN players stalled at this level: [names]..."` |
| No hotspot? | `"No curriculum bottleneck detected from the currently loaded player data."` |

---

### Test 4 — Coach load: "Which coach has the most players needing attention?"

| Step | Expected |
|---|---|
| Input | `"Which coach has the most players needing attention?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `coach_load` |
| Response | `"Coach-to-player assignments aren't loaded in the current session context..."` |
| Action | `respond` (honest fallback) |

---

### Test 5 — Players needing attention: "Which players need attention?"

| Step | Expected |
|---|---|
| Input | `"Which players need attention?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `players_needing_attention` |
| Response | Ordered list: high-priority (>180 days), then medium-priority (90–180 days) |
| No stalled? | `"No players are currently stalled."` |

---

### Test 6 — Academy insight: "State of the academy"

| Step | Expected |
|---|---|
| Input | `"State of the academy"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `academy_insight` |
| Response | Full insight: urgent/moderate stalls, advancing count, hotspot level, assessment gaps, groups at risk |
| Action | `respond` |

---

### Test 7 — COO reasoning: "Why does Jake need attention?"

**Pre-condition:** Jake is stalled (enrolled >90 days, not advancement-eligible).

| Step | Expected |
|---|---|
| Input | `"Why does Jake need attention?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `coo_reasoning` |
| Subject | `"Jake"` |
| Response | `"Why Jake needs attention: • Stalled at Orange Ball 2 for N days... • N other players at same level also stalled..."` |
| Recommendation | `"Open Jake's player profile to review..."` |

---

### Test 8 — Curriculum level health: "Which level causes the most issues?"

| Step | Expected |
|---|---|
| Input | `"Which level causes the most issues?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `level_health` |
| Response | `"**Shared bottleneck: [Hotspot Level]**\n\nN players stalled..."` |

---

### Test 9 — Guard: "What should I focus on today?"

| Step | Expected |
|---|---|
| Input | `"What should I focus on today?"` |
| Brain step 4 | `check_today_guidance` intercepts it |
| Action | `route_coo_prompt` |
| NOT caught by | `check_relationship_intelligence` (Step 10.4) |

**Verifies:** Today guidance runs before relationship intelligence.

---

### Test 10 — Advancement opportunities: "Which players are ready to advance?"

| Step | Expected |
|---|---|
| Input | `"Which players are ready to advance?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `advancing_players` |
| Response | Lists all players with `advancementEligible === true` |
| None eligible? | `"No players are currently flagged as advancement-eligible."` |

---

### Test 11 — Stalled players: "Which players are stalled?"

| Step | Expected |
|---|---|
| Input | `"Which players are stalled?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `stalled_players` |
| Response | Same as `players_needing_attention` — ordered by severity |

---

### Test 12 — Assessment gaps: "Which players haven't been assessed?"

| Step | Expected |
|---|---|
| Input | `"Which players haven't been assessed?"` |
| Brain step | `check_relationship_intelligence` |
| Detected kind | `players_without_assessment` |
| Response | List of players with no assessment in last 90 days |
| All assessed? | `"All loaded players have had a recent assessment."` |

---

## Relationship Chain Tests (Multi-hop)

### Chain: "Show Jake" → "Who coaches him?" → "What group is he in?" → "Who else is in that group?"

| Turn | Input | Brain step | Expected |
|---|---|---|---|
| 1 | `"Show Jake"` | `check_entity_intent` | Navigate to Jake's player profile; `lastRelevantEntity = Jake` |
| 2 | `"Who coaches him?"` | Step 8 (ambiguity) resolves "him" → "Jake"; `check_entity_intent` → `isRelationshipQuery` | Coach honest fallback |
| 3 | `"What group is he in?"` | Step 8 resolves "he" → "Jake"; `check_entity_intent` → `isRelationshipQuery` | Jake's group via `groupByLevelId` |
| 4 | `"Who else is in that group?"` | `check_relationship_intelligence` → `co_group_members`; subject=null; uses `lastRelevantEntity=Jake` | Co-group members list |

---

## Expected Relationship Answer Format

| Query type | Response starts with |
|---|---|
| Co-group | `"**[Group Name]** has N players total."` |
| Shared bottleneck | `"**Shared bottleneck: [Level Name]**"` |
| Players needing attention | `"**N players need attention:**"` |
| Academy insight | `"**Academy Status Overview**"` |
| COO reasoning | `"**Why [Name] needs attention:**"` |
| Coach load | `"Coach-to-player assignments aren't loaded..."` |
| Advancing players | `"**N players ready to advance:**"` |
| No data | `"No [X] detected..."` or `"...isn't loaded in the current session context."` |

---

## Console Test Script

```typescript
// In browser devtools after entity context loads:

import { buildRelationshipContext, getCoGroupResult, buildAcademyInsight } from '@/lib/donna/relationship/donnaRelationshipIntelligence'
import { detectRelationshipIntelligenceIntent } from '@/lib/donna/relationship/donnaRelationshipIntentDetector'

// Assume entityContext is loaded in DonnaAssistantButton state

// Test 1: intent detection
console.log(detectRelationshipIntelligenceIntent("Who else is in that group?"))
// → { kind: 'co_group_members', subjectPhrase: null, rawText: '...' }

console.log(detectRelationshipIntelligenceIntent("Which players need attention?"))
// → { kind: 'players_needing_attention', subjectPhrase: null, rawText: '...' }

console.log(detectRelationshipIntelligenceIntent("State of the academy"))
// → { kind: 'academy_insight', subjectPhrase: null, rawText: '...' }

console.log(detectRelationshipIntelligenceIntent("Show review queue"))
// → null (guard phrase — not a relationship intelligence query)

console.log(detectRelationshipIntelligenceIntent("What should I focus on today?"))
// → null (today guidance, caught by brain Step 4)

// Test 2: relationship context build (requires entityContext)
const rCtx = buildRelationshipContext(entityContext)
console.log('Stalled players:', rCtx.stalledPlayers.length)
console.log('Level hotspot:', rCtx.levelHotspot)
console.log('Advancing:', rCtx.advancingPlayers.length)

// Test 3: academy insight
const insight = buildAcademyInsight(rCtx)
console.log(insight.recommendedFocusStatement)
```
