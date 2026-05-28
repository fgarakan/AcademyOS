# QA — DONNA Cross-Signal Correlation Engine V1
**Sprint:** 913.6
**Date:** 2026-05-28
**Method:** Static code analysis

---

## Scenarios

### Scenario 1 — Same player in stalled + high-risk attention ✅ PASS

**Setup:**
```
playerProgressStalls=[{playerName:'Jordan', currentLevelDisplayName:'Orange 2', daysAtCurrentLevel:126, stallSeverity:'high'}]
playerProgressStallContextAvailable=true
attentionItems=[{playerName:'Jordan', risk:'high', reason:'3 concern observations in last 30 days'}]
```

**Rule 1 fires:**
- `stalledNames = {'jordan'}` (norm'd)
- `crossedItems = [{playerName:'Jordan', risk:'high', reason:'...'}]`
- Correlation emitted: `player_stalled_and_risk_flagged`, severity `high`, confidence `high`

**Evidence:** "Jordan has been at Orange 2 for 126 days without advancing and also appears in high-risk attention signals (3 concern observations in last 30 days)."

**Brief output:** "Connected insight: Jordan has been at Orange 2 for 126 days..."

**Expected:** ✅ Player name matched across arrays. Evidence specific.

---

### Scenario 2 — Stalled player level matches assessment gap level ✅ PASS

**Setup:**
```
playerProgressStalls=[{playerName:'Alex', currentLevelDisplayName:'Yellow 1', daysAtCurrentLevel:95}]
assessmentCoverageGaps=[{levelDisplayName:'Yellow 1', gapType:'no_recent_assessment', ...}]
playerProgressStallContextAvailable=true, assessmentContextAvailable=true
```

**Rule 2 fires:**
- `stalledLevels = {'yellow 1'}`
- `crossedGaps = [{levelDisplayName:'Yellow 1'}]`
- `stalledCount = 1` (Alex)
- Correlation: `level_stalled_and_assessment_gap`, severity `medium`, confidence `medium`

**Evidence:** "Yellow 1 has 1 stalled player and at least one assessment coverage gap — level advancement decisions may lack evidence."

**Expected:** ✅ Level name matched across arrays. Hedged with "may".

---

### Scenario 3 — Template gap with active players ✅ PASS (Rule 3 - double gap)

**Setup:**
```
curriculumTemplateCoverageGaps=[{levelDisplayName:'Green 2', playerCountAtLevel:3}]
assessmentCoverageGaps=[{levelDisplayName:'Green 2', ...}]
templateCoverageContextAvailable=true, assessmentContextAvailable=true
```

**Rule 3 fires:**
- `templateGapLevelNames = {'green 2'}`
- `doubleGapLevels = [{levelDisplayName:'Green 2'}]`
- Correlation: `level_double_gap_template_and_assessment`, severity `medium`, confidence `high`

**Evidence:** "Green 2 with 3 active players has no matching session template AND at least one assessment coverage gap — both delivery plan and evidence base are missing."

**Expected:** ✅ Double-gap correlation detected. Evidence specific.

---

### Scenario 4 — Stale review queue + high-risk player ✅ PASS

**Setup:** `pendingReviews=3, oldestPendingReviewAgeDays=12, highRiskPlayerCount=2`

**Rule 4 fires:**
- `staleAge=12 >= 7` ✅
- `highRiskPlayerCount > 0` ✅
- severity `high` (highRiskPlayerCount > 0)
- Correlation: `stale_queue_with_high_impact`, confidence `medium`

**Evidence:** "Oldest review item is 12 days old while 2 high-risk players also need attention — delays may compound."

**Expected:** ✅ Count-based correlation. Hedged with "may".

---

### Scenario 5 — Advancement eligible + assessment evidence gap ✅ PASS

**Setup:** `advancementEligibleCount=3, eligibleWithoutAssessmentEvidence=2`

**Rule 5 fires:**
- `advancementEligibleCount > 0` ✅
- `eligibleWithoutAssessmentEvidence > 0` ✅
- Correlation: `advancement_without_assessment_evidence`, severity `high`, confidence `high`

**Evidence:** "3 players meet advancement criteria, but 2 of them have no promotion-ready assessment on record."

**Expected:** ✅ Both counts used precisely. No hedging needed (high confidence count match).

---

### Scenario 6 — Partial onboarding foundation gaps ✅ PASS

**Setup:** `onboardingReadinessLevel='partial', hasPlayers=false, hasCoaches=false`

**Rule 6 fires:**
- `!ctx.hasPlayers && !ctx.hasCoaches` ✅
- Correlation: `foundation_not_ready`, severity `medium`, confidence `medium`

**Evidence:** "No players and no coaches are configured — DONNA intelligence signals will be minimal or empty until the foundation is set up."

**Expected:** ✅ Foundation gap correlation detected.

---

### Scenario 7 — No matching correlations ✅ PASS

**Setup:** All signals > 0 but no cross-signal matches (distinct player names and level names across arrays)

**All rules evaluated:**
- Rule 1: no shared player name → skip
- Rule 2: no shared level name → skip
- Rule 3: no shared level name → skip
- Rule 4: `oldestPendingReviewAgeDays = 2 < 7` → skip
- Rule 5: `eligibleWithoutAssessmentEvidence = 0` → skip
- Rule 6: `hasPlayers = true` → skip

`buildSignalCorrelations(ctx)` → `[]`
`getTopSignalCorrelations(ctx, 1)` → `[]`
`correlationLine = ''` → filtered by `.filter(Boolean)` → not shown

**Expected:** ✅ No false correlations. Brief unaffected.

---

### Scenario 8 — Raw IDs not exposed ✅ PASS

`DonnaSignalCorrelation` text fields are built using:
- `playerName` (string)
- `currentLevelDisplayName` / `levelDisplayName` (string)
- `daysAtCurrentLevel` (number)
- `reason` (aggregate string)
- Counts

`playerId`, `levelId`, `currentLevelId` are NEVER accessed in correlation engine. ✅

---

### Scenario 9 — Parent-sensitive language not exposed ✅ PASS

No parent names, contact info, or parent-facing wording in any correlation output. All text is director-appropriate. Evidence uses aggregate language ("3 concern observations in last 30 days") not private coach note content. ✅

---

### Scenario 10 — Existing all-clear state still works ✅ PASS

When `ranked.length === 0` → `buildDirectorBriefSummary` early-returns "Academy looks clear..." — `getTopSignalCorrelations` is never called. ✅

---

## Safety Checks

| Check | Result |
|---|---|
| No DB calls | ✅ |
| No mutations | ✅ |
| No `execute_curriculum_override()` | ✅ |
| Context guards on string-match rules (1–3) | ✅ |
| No raw UUIDs in output | ✅ |
| "may" / "suggests" hedging on causal claims | ✅ |
| `donnaWillNotDo` on every correlation | ✅ |
| Empty array when no correlations | ✅ |
| Brief `correlationLine` filtered when empty | ✅ |
| Sprint 904 untouched | ✅ |
