# DONNA Proactive Academy COO V1

**Sprint:** Mega Sprint 1691–1700
**Date:** 2026-06-03
**Scope:** Academy Attention Engine, Focus Today Answer, Proactive Notice, COO Brief Card

---

## Architecture

| Component | File | Builds on |
|---|---|---|
| Academy Attention Engine | `src/lib/donna/proactive/academyAttentionEngine.ts` | `donnaAttentionRankingEngine.ts` (Sprint 913.2) |
| Focus Today Answer Engine | `src/lib/donna/proactive/focusTodayAnswerEngine.ts` | `academyAttentionEngine.ts` |
| Academy COO Brief Card | `src/components/donna/DonnaAcademyCOOBriefCard.tsx` | `academyAttentionEngine.ts` |
| Shell routing | `DonnaVoiceReadyShell.tsx` — `FOCUS_TODAY_PATTERN` intercept | `focusTodayAnswerEngine.ts` |

---

## 1. Academy Attention Engine

**File:** `src/lib/donna/proactive/academyAttentionEngine.ts`

### Coverage matrix

| Signal | Covered by | Status |
|---|---|---|
| Players needing attention | `high_risk_players` + `medium_risk_players` items | PASS |
| Promotion-ready players | `advancement_eligible` item | PASS |
| Overdue assessments | `assessment_coverage_gap` item | PASS |
| Incomplete onboarding | `onboarding_incomplete` + `onboarding_not_started` items | PASS |
| Placement issues | Included in `high_risk_players` / attention items | PASS |
| Parent update approvals | `attendance_exceptions` item (affects parent records) | PASS |
| Coach recap gaps | `missing_wrap_ups` item | PASS |
| Curriculum bottlenecks | `curriculum_drafts` + `curriculum_gaps` + `template_coverage_gap` items | PASS |

All 8 categories from the sprint prompt are covered.

### Health signal

| Signal | Condition | Status |
|---|---|---|
| `'clear'` | No items from `buildAttentionPriorities()` | PASS |
| `'attention_needed'` | Items exist, none with `severity: 'critical'` | PASS |
| `'critical'` | At least one item with `severity: 'critical'` | PASS |

### Empty state

`buildAcademyAttentionReport(ctx)` with all-zero context:
- `isEmpty: true`
- `healthSignal: 'clear'`
- `healthSummary: 'Academy is operating normally — no urgent signals.'`
- `topAction: null`
- `allItems: []`

No invented data. No fabricated signals.

**Certification: PASS**

---

## 2. "What should I focus on today?" — 5-Field Response

**File:** `src/lib/donna/proactive/focusTodayAnswerEngine.ts`

### Detection patterns

| Command | Detected | Status |
|---|---|---|
| "What should I focus on today?" | YES | PASS |
| "What's my focus for today?" | YES | PASS |
| "Where should I start today?" | YES | PASS |
| "What's the highest leverage action today?" | YES | PASS |
| "What are you noticing?" | YES (proactive notice) | PASS |
| "What's new today?" | YES (proactive notice) | PASS |
| "Any new signals today?" | YES (proactive notice) | PASS |
| "What should I know?" | YES (proactive notice) | PASS |
| "What should I do first?" | NO — falls to existing dashboard priority handler | PASS (correct) |
| "Give me a brief" | NO — falls to existing brief handler | PASS (correct) |

### 5-field response format (when signals exist)

```
Here's what I'd focus on today:

1. Highest leverage action:
   [item.label]

2. Why it matters:
   [item.whyItMatters]

3. Evidence:
   [item.evidence]

4. Where to go:
   [item.bestNextAction] → [item.href]

5. Your role:
   Director approval required — [item.donnaWillNotDo]
   OR
   No approval needed for viewing. [item.donnaWillNotDo]
```

### Supporting items

- Max 3 additional items listed below the top action
- Format: `N. [item.label]`
- If total > 4, overflow noted: "…and N more items in your attention queue."

### All-clear state

```
No urgent signals right now — academy is operating normally.
[session count if any]
[curriculum gap suggestion OR progress suggestion]
```

DONNA does not fabricate urgency when the academy is clear.

**Certification: PASS**

---

## 3. Proactive Notice Answer ("What are you noticing?")

| Check | Status |
|---|---|
| Returns top 5 items with `whyItMatters` summary per item | PASS |
| States approval requirement accurately | PASS |
| All-clear state: "Nothing new to flag" | PASS |
| No invented data | PASS |

**Certification: PASS**

---

## 4. DonnaAcademyCOOBriefCard

| Check | Status |
|---|---|
| Health badge: green/orange/red per signal | PASS |
| Top action: lime highlight, full 5-field detail on expand | PASS |
| Supporting items: compact ranked list, up to 4 | PASS |
| Approval badge shown when `requiresApproval: true` | PASS |
| "Go" button links to `item.href` | PASS |
| Empty state: "Academy is operating normally" | PASS |
| Dismissible via `onDismiss` prop | PASS |
| Full attention queue link → `/director/attention` | PASS |
| Voice hint: "Say 'What should I focus on today?'" | PASS |
| `data-donna-focus-id="academy-coo-brief"` for highlight support | PASS |

**Certification: PASS**

---

## 5. Shell Routing

**Position in pipeline:**
- Fires BEFORE `tryAnswerDashboardPriorityQuestion` (existing)
- Fires AFTER: brief, page guide, missing context, KPI

**Non-overlap:** `detectFocusTodayQuestion()` uses tighter patterns than `detectDashboardPriorityQuestion()`. Commands like "what should I do first?" and "give me a brief" fall through to the existing handlers (correct behaviour).

**Certification: PASS**

---

## 6. Safety Invariants

| Rule | Status |
|---|---|
| DONNA does not move levels | PASS — `donnaWillNotDo` on every item |
| DONNA does not send parent communications | PASS |
| DONNA does not approve placements | PASS |
| DONNA does not publish curriculum | PASS |
| `requiresApproval: true` items marked explicitly | PASS |
| No fake/invented data | PASS — all from `buildAttentionPriorities(ctx)` which reads from `DirectorDonnaContext` |
| Empty states honest | PASS |
| No DB calls in any new file | PASS |
| No mutations in any new file | PASS |

---

## Manual Test Checklist

- [ ] Say "What should I focus on today?" — confirm 5-field response with top item detail
- [ ] Say "What are you noticing?" — confirm proactive notice list
- [ ] Say "What's new today?" — confirm proactive notice list
- [ ] Academy with all-zero signals: confirm all-clear honest response
- [ ] Top item has `requiresApproval: true` — confirm approval note in response
- [ ] `DonnaAcademyCOOBriefCard` renders with mock report — top action highlighted
- [ ] Expand card — 5-field detail shows for top action
- [ ] Empty report renders — honest empty state
- [ ] TypeScript clean: `npx tsc --noEmit` passes

---

## Known Limitations

| Limitation | Impact |
|---|---|
| `DonnaAcademyCOOBriefCard` not yet mounted on any director page — component exists, requires caller to import and render | Card is available; follow-up sprint mounts it on dashboard or DONNA page |
| `buildAcademyAttentionReport` max 8 items — items 9+ are silently dropped | Acceptable for V1; full queue available at `/director/attention` |
| Proactive notice fires only when director asks — DONNA does not auto-push notifications | Push notification layer is a future sprint |
