# DONNA Context Engine Certification V1

**Sprint:** Mega Sprint 1661–1680
**Date:** 2026-06-03
**File:** `src/lib/donna/context/donnaContextEngine.ts`

---

## 1. Type Coverage

| Field | Type | Status |
|---|---|---|
| `pathname` | `string` | PASS |
| `pageLabel` | `string` | PASS — from `getPageCapabilityMap()` |
| `pageIntent` | `string` | PASS — from page capability map |
| `role` | `'director' \| 'coach' \| 'parent' \| 'player'` | PASS |
| `entityKind` | `DonnaFocusEntityKind` | PASS — 6 variants |
| `entityLabel` | `string \| null` | PASS — nullable |
| `entitySummary` | `string \| null` | PASS — nullable |
| `activePriorityCount` | `number` | PASS — defaults to 0 |
| `topPriorityTitle` | `string \| null` | PASS |
| `topPriorityLevel` | `string \| null` | PASS |
| `pendingReviews` | `number` | PASS — defaults to 0 |
| `highRiskPlayerCount` | `number` | PASS |
| `advancementEligibleCount` | `number` | PASS |
| `curriculumDraftCount` | `number` | PASS |
| `attendanceExceptions` | `number` | PASS |
| `hasPendingWork` | `boolean` | PASS — derived |
| `isOnEntityPage` | `boolean` | PASS — derived |
| `greeting()` | `() => string` | PASS — context-first |

---

## 2. Entity Kind Detection

| Pathname | Expected entityKind | Status |
|---|---|---|
| `/director/players/abc-123` + playerProfileCtx | `'player'` | PASS |
| `/director/players/abc-123` without playerProfileCtx | `'none'` | PASS |
| `/director/curriculum` | `'curriculum_level'` | PASS |
| `/director/sessions` | `'session'` | PASS |
| `/director/review` | `'review_item'` | PASS |
| `/director` | `'none'` | PASS |
| `/director/attention` | `'none'` | PASS |

---

## 3. Greeting Builder — Context-First Rule

| Scenario | Greeting Contains | Status |
|---|---|---|
| Player profile + priorities | Player name + priority count + top priority title | PASS |
| Player profile + 0 priorities | Player name + "No active priorities" | PASS |
| Curriculum level | Level name + "review" offer | PASS |
| Review center + pending items | "Review Center" + pending count | PASS |
| Dashboard + pending work | Page label + pending work summary | PASS |
| Generic page, no pending work | Page label + page intent | PASS |

DONNA never produces "How can I help?" as the greeting. The greeting always references current page or entity context.

---

## 4. Null Safety

| Input | Behavior | Status |
|---|---|---|
| `directorCtx: null` | All count fields default to 0 | PASS |
| `playerProfileCtx: null` | entityKind = 'none', no priority data | PASS |
| `moduleLabel: null` | Falls back to `pageMap.pageLabel` | PASS |
| `objectLabel: null` | entityLabel = null | PASS |
| Empty pathname | `getPageCapabilityMap('')` returns fallback map | PASS |

---

## 5. No Unsafe Data Exposure

- No raw coach notes referenced
- No parent-visible data in any field
- All string fields are safe counts, labels, or status strings
- `entitySummary` maximum: priority count + top priority title (no scores, no private notes)

**Certification: PASS**
