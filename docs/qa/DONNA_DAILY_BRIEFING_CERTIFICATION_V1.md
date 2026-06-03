# DONNA Daily COO Briefing Certification V1

**Sprint:** Mega Sprint 1661–1680
**Date:** 2026-06-03
**File:** `src/lib/donna/briefing/dailyBriefingEngine.ts`

---

## 1. Opening Line

| Input | Output | Status |
|---|---|---|
| `directorName: 'Brian'` — morning | "Good morning Brian." | PASS |
| `directorName: null` — afternoon | "Good afternoon." | PASS |
| `directorName: undefined` — evening | "Good evening." | PASS |

Time-of-day greeting: morning (< 12h), afternoon (12–17h), evening (17+h).

---

## 2. Item Builders — Required Fields

Each `BriefingItem` must have:

| Field | Status |
|---|---|
| `id` | PASS — unique string |
| `category` | PASS — one of 7 categories |
| `urgency` | PASS — critical/high/medium/informational |
| `headline` | PASS — e.g., "3 items need your approval" |
| `issue` | PASS — what the situation is |
| `evidence` | PASS — what data supports this |
| `whyItMatters` | PASS — director-facing reason |
| `suggestedAction` | PASS — text-only next action |
| `actionHref` | PASS — route to navigate to |
| `donnaCommands` | PASS — voice commands array |
| `requiresApproval` | PASS — boolean |

---

## 3. Item Coverage

| Signal | Item Built | Category | Status |
|---|---|---|---|
| `pendingReviews > 0` | "N items need your approval" | approvals | PASS |
| `highRiskPlayerCount > 0` | "N players have high-risk signals" | players | PASS |
| `advancementEligibleCount > 0` | "N players eligible for advancement" | players | PASS |
| `attendanceExceptions > 0` | "N attendance exceptions pending" | operations | PASS |
| `playerProgressStallCount > 0` | "N players stalled in development" | players | PASS |
| `curriculumDraftCount > 0` | "N curriculum drafts awaiting approval" | curriculum | PASS |
| All signals = 0 | No items; "No urgent items today" | — | PASS |

---

## 4. Urgency Ranking

Items are sorted by urgency before returning: critical → high → medium → informational.

| Count vs Threshold | Urgency | Status |
|---|---|---|
| count ≥ criticalThreshold | critical | PASS |
| count ≥ highThreshold | high | PASS |
| count > 0 | medium | PASS |
| count = 0 | item not created | PASS |

---

## 5. `asText()` Output Format

```
Good morning Brian.
Today's top 4 priorities:
1. 3 items need your approval.
2. 2 players have high-risk signals.
3. 1 player eligible for advancement.
4. 2 curriculum drafts awaiting approval.
Would you like me to walk you through them?
```

Caps at 5 items maximum. Single item uses "priority" not "priorities".

---

## 6. Null Safety

| Input | Behavior | Status |
|---|---|---|
| `ctx: null` | Empty items list; "No urgent items today" | PASS |
| `directorName: null` | No name in greeting | PASS |
| `ctx.playerProgressStallCount: undefined` | Defaults to 0 | PASS |

---

## 7. Safety Invariants

- `requiresApproval: true` is set for advancement, attendance exceptions, curriculum drafts
- No item auto-approves anything — all items are explanatory
- No parent/player data exposed
- Evidence field describes data source, not raw data

**Certification: PASS**
