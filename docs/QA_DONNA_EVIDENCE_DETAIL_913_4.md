# QA — DONNA Evidence Detail Intelligence V1
**Sprint:** 913.4
**Date:** 2026-05-28
**Method:** Static code analysis

---

## Scenarios

### Scenario 1 — High-risk players with names ✅ PASS

**Setup:** `highRiskPlayerCount=2, attentionItems=[{playerName:'Jordan', reason:'3 concern observations in last 30 days', risk:'high'}, ...]`

**Evidence output:** "2 players with high-risk signals from recent observations or session absences. including Jordan — 3 concern observations in last 30 days."

`summarizeAttentionItemEvidence(items, 'high')` → `"including Jordan — 3 concern observations in last 30 days"` ✅

---

### Scenario 2 — High-risk players without names ✅ PASS

**Setup:** `highRiskPlayerCount=1, attentionItems=[{playerName:null, reason:'...', risk:'high'}]`

`summarizeAttentionItemEvidence` → `first.playerName` is null → returns `''` → fallback to count-only evidence: "1 player with high-risk signals..." ✅

---

### Scenario 3 — Player stalls with level/days detail ✅ PASS

**Setup:** `playerProgressStalls=[{playerName:'Jordan', currentLevelDisplayName:'Orange 2', daysAtCurrentLevel:126, stallSeverity:'high'}]`

`summarizePlayerStallEvidence([...])`:
- `parts = ['Jordan', 'at Orange 2', 'for 126 days']`
- Returns `"including Jordan at Orange 2 for 126 days"` ✅

**Evidence:** "3 player progress stall signals detected. including Jordan at Orange 2 for 126 days."

---

### Scenario 4 — Player stalls count-only fallback ✅ PASS

**Setup:** `playerProgressStalls=[{playerName:'', currentLevelDisplayName:null, daysAtCurrentLevel:0}]`

`summarizePlayerStallEvidence`:
- `playerName = ''` (falsy)
- `currentLevelDisplayName = null`
- `daysAtCurrentLevel = 0` → 0 > 0 is false → not pushed
- `parts = []` → returns `''` → fallback to count-only

**Evidence:** "1 player progress stall signal detected." ✅

---

### Scenario 5 — Assessment gaps with level detail ✅ PASS

**Setup:** `assessmentCoverageGaps=[{levelDisplayName:'Orange 2', gapType:'no_recent_assessment', daysSinceLastAssessment:95, ...}]`

`summarizeAssessmentGapEvidence`:
- `level = 'Orange 2'` ✅
- `gapType = 'no_recent_assessment'` → second branch
- `daysNote = ' with no assessment in 95 days'`
- Returns `"including 1 player at Orange 2 with no assessment in 95 days"` ✅

---

### Scenario 5b — Assessment gap with eligible_no_promotion_evidence ✅ PASS

**Setup:** `assessmentCoverageGaps=[{levelDisplayName:'Yellow 1', gapType:'eligible_no_promotion_evidence', ...}]`

`summarizeAssessmentGapEvidence`:
- `gapType === 'eligible_no_promotion_evidence'` → first branch
- Returns `"including 1 advancement-eligible player at Yellow 1 without promotion assessment"` ✅

---

### Scenario 6 — Template gaps with level names ✅ PASS

**Setup:** `curriculumTemplateCoverageGaps=[{levelDisplayName:'Orange 2', playerCountAtLevel:3,...},{levelDisplayName:'Yellow 1', playerCountAtLevel:2,...}]`

`summarizeTemplateCoverageEvidence`:
- First 2 gaps: `["Orange 2 (3 players)", "Yellow 1 (2 players)"]`
- Returns `"including Orange 2 (3 players) and Yellow 1 (2 players)"` ✅

---

### Scenario 7 — Curriculum gaps with category detail ✅ PASS

**Setup:** `curriculumGaps=["Orange 2 — no drills defined (3 gates exist)", "Yellow 1 — no gates assigned"]`

`summarizeCurriculumGapEvidence`:
- `first = "Orange 2 — no drills defined (3 gates exist)"` (43 chars ≤ 70)
- Returns `'including: "Orange 2 — no drills defined (3 gates exist)"'` ✅

**Evidence:** `'2 structural gaps detected in curriculum level definitions. including: "Orange 2 — no drills defined (3 gates exist)".'` ✅

---

### Scenario 8 — Empty arrays with counts ✅ PASS

**Setup:** `playerProgressStallCount=3, playerProgressStallContextAvailable=true, playerProgressStalls=[]`

This is an inconsistent state (count > 0 but array empty — shouldn't happen in practice). 

`summarizePlayerStallEvidence([])` → returns `''` → evidence is count-only: "3 player progress stall signals detected." No crash. ✅

---

### Scenario 9 — Parent-sensitive data not exposed ✅ PASS

Verification:
- `playerId` (UUID) — NEVER used in any evidence text ✅
- `currentLevelId` (UUID) — NEVER used ✅
- `levelId` (UUID) — NEVER used ✅
- Raw coach note text — `attentionItems.reason` is already aggregated ("3 concern observations in last 30 days") — not coach note content ✅
- No parent-facing language in any evidence strings ✅

---

### Scenario 10 — Existing all-clear state ✅ PASS

**Setup:** All counts at 0

`buildAttentionPriorities(ctx)` → empty array → `getTopPriority(ctx)` → null → `buildDashboardPriorityResponse` → "Academy looks healthy..." → no evidence helpers called. ✅

All-clear behavior unchanged from Sprint 913.2.

---

## Safety Checks

| Check | Result |
|---|---|
| No raw UUIDs in evidence text | ✅ |
| No raw coach note content | ✅ — reason field is aggregate |
| Player names only from existing director-visible fields | ✅ |
| Helpers return `''` when data absent (no fabrication) | ✅ |
| IIF pattern: all evidence wrapped in `(() => { ... })()` | ✅ — isolates evidence computation |
| Sprint 904 untouched | ✅ |
| No new imports needed in ranking engine | ✅ — types inferred from DirectorDonnaContext |
