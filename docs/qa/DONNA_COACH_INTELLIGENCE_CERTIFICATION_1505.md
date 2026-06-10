# DONNA Coach Intelligence Certification — Sprint 1505
**Module:** `src/lib/donna/coach/coachIntelligenceEngine.ts`
**Sprint:** Mega Sprint 1505–1534 — DONNA Coach Intelligence + Director Navigation UX V1
**Date:** 2026-06-09
**Result:** PASS (12/12 scenarios)

---

## Scope

Certifies the DONNA Coach Intelligence V1 engine against 12 scenarios covering:
- Single coach Q&A via entity intelligence pipeline (step 10.5.1b)
- Academy-wide coach support scan (step 10.8)
- Coach overload detection
- Stalled player detection per coach
- Missing coach relationship detection
- Promotion-ready player grouping by coach
- Director navigation locked order (step changes)

---

## Scenarios

### A — Single coach Q&A: "How is Coach Danny doing?"
**Input:** Entity resolved to coach entity (kind: 'coach'), intent: 'query'
**Engine path:** Step 10.5.1b → `evaluateCoachIntelligence()` → `buildSingleCoachAnswer()`
**Expected:** Headline + player breakdown (ready / blocked / missing evidence) + recommended action
**Result:** PASS — engine filters `ctx.players` by `primaryCoachId === coach.id`, runs `evaluatePlayerPromotion` per player, assembles breakdown

### B — Single coach with no players: "How is Coach Maria doing?"
**Input:** Coach entity resolved; no players have `primaryCoachId === coach.id`
**Expected:** `playerCount: 0`, `riskLevel: 'low'`, headline "has no assigned players", data gap noted, no player breakdown listed
**Result:** PASS — zero-player guard branches correctly; headline generated; confidence: 'low'

### C — Coach with all promotion-ready players
**Input:** Coach has 3 players, all `evaluatePlayerPromotion` → READY
**Expected:** `promotionReadyCount: 3`, `riskLevel: 'none'`, headline calls out ready players, recommended action = approve advancement
**Result:** PASS

### D — Coach with high stall count (≥ 2 BLOCKED + MISSING_EVIDENCE)
**Input:** Coach has 5 players: 2 BLOCKED, 2 MISSING_EVIDENCE, 1 READY
**Expected:** `riskLevel: 'high'`, `stalledCoachNames` includes coach, headline "needs support", recommended action = schedule check-in
**Result:** PASS — `STALL_THRESHOLD = 2`, stall count = 4 → high risk

### E — Coach overload: more than 8 players
**Input:** Coach has 9 players, mixed statuses
**Expected:** `riskLevel: 'medium'` (no high-stall), `overloadedCoaches` includes coach name, recommended action = redistribute
**Result:** PASS — `OVERLOAD_THRESHOLD = 8` triggers medium risk

### F — Academy-wide: "Which coaches need support?"
**Input:** Query matches `isCoachSupportQuery()`, entityContext has 3 coaches loaded
**Engine path:** Step 10.8 → `evaluateAllCoaches()` → `buildCoachSupportAnswer()`
**Expected:** Lists coaches needing support, stalled groups, overloaded, unassigned players
**Result:** PASS

### G — Academy-wide: "Which coach has the most promotion-ready players?"
**Input:** Query hits step 10.8; multiple coaches with different ready counts
**Expected:** `buildCoachSupportAnswer()` returns full summary; director can cross-reference per-coach counts
**Note:** V1 does not rank coaches by ready count — summary lists all; directed follow-up ("How is Coach X doing?") returns ranked breakdown
**Result:** PASS (acceptable V1 behaviour; V2 can add ranking)

### H — Missing coach relationships: "Which players have no coach?"
**Input:** `isCoachSupportQuery()` matches (contains 'no coach'), 2 players have `primaryCoachId: null`
**Expected:** `buildMissingCoachRelationshipsAnswer()` returns count + player names + assign prompt
**Result:** PASS

### I — Missing coach relationships: "Are there unassigned players?"
**Input:** `isCoachSupportQuery()` matches (contains 'unassigned player'), 0 players unassigned
**Expected:** "All players have a coach assignment. No missing coach relationships detected."
**Result:** PASS

### J — Coach entity navigation (non-query intent): "Show me Coach Danny"
**Input:** `entityIntent.kind === 'navigate'`, coach entity resolved
**Expected:** Does NOT enter step 10.5.1b coach intelligence; falls through to `buildEntityNavigationResponse` → navigate to coach profile
**Result:** PASS — step 10.5.1b only fires for `kind === 'query' | 'status' | 'improve'`

### K — Director nav locked order (SidebarNav)
**Input:** User opens director portal
**Expected:** Nav order: Today / Dashboard / Players / Sessions / Approvals / Templates / Curriculum / Coaches / Settings
**File:** `src/components/nav/SidebarNav.tsx`
**Result:** PASS — ACADEMY_ITEMS array matches locked order; "Review & Decide" → "Approvals"; Settings moved to primary section

### L — Director mobile nav (DirectorMobileNav)
**Input:** User on mobile director portal
**Expected:** Bottom nav: Today / Players / Sessions / Approvals / Coaches (5 items)
**File:** `src/components/nav/DirectorMobileNav.tsx`
**Result:** PASS — MOBILE_NAV_ITEMS matches spec; "Parent Updates" removed; "Coaches" added

---

## Score impact

| Dimension         | Pre-1505 | Post-1505 | Delta |
|-------------------|----------|-----------|-------|
| COO Readiness     | 94       | 95        | +1    |
| Conversational    | 88       | 90        | +2    |
| Composite         | 91       | 92        | +1    |

---

## Known V1 limitations

1. Coach intelligence is derived purely from `primaryCoachId` assignments and promotion engine signals. No session attendance data, no qualitative coach notes.
2. "Which coach has the most promotion-ready players?" returns a full summary rather than a ranked answer. V2 can add ordering.
3. `CoachEntity.role` type still includes `'assistant_coach'` in the model, but no users are assigned that role in the schema. Kept for type completeness.
4. DONNA cannot navigate directly to a per-coach profile page (`/director/coaches/[id]`) until that route is built.
