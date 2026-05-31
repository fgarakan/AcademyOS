# QA — Sprint 1072: DONNA Context Pack Architecture V1

**Date:** 2026-05-31
**Sprint:** 1072

---

## Test 1 — Registry file exists and compiles

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `src/lib/donna/donnaContextPackRegistry.ts` exists | File present | |
| 1.2 | `npx tsc --noEmit` passes | Zero TypeScript errors | |
| 1.3 | File exports `DonnaContextPack`, `DonnaContextPackAnswer`, `DonnaContextPackNeverDoRule`, `DonnaContextPackRole` | All 4 types exported | |
| 1.4 | File exports `DONNA_CONTEXT_PACKS` array | Array present with 8 entries | |
| 1.5 | File exports `getDonnaContextPackForRoute` function | Function exported | |
| 1.6 | File exports `lookupAnswerInContextPack` function | Function exported | |

---

## Test 2 — Interface completeness

For each context pack in the registry, verify all required fields are present:

| Field | Required | Check |
|---|---|---|
| `route` | yes | Non-empty string |
| `pageName` | yes | Human-readable name |
| `roles` | yes | Non-empty array of valid role strings |
| `pagePurpose` | yes | One-sentence description |
| `availableData` | yes | Array of strings (what server renders) |
| `keyMetrics` | yes | Array with id, label, description |
| `commonQuestions` | yes | ≥5 director question strings |
| `commonCommands` | yes | Array with phrase, action, optional route |
| `safeActions` | yes | ≥3 entries |
| `approvalRequiredActions` | yes | ≥2 entries |
| `neverDoRules` | yes | Each entry has `action` AND `reason` |
| `relatedRoutes` | yes | ≥2 related routes with label and route |
| `exampleAnswers` | yes | ≥1 entry with triggers and response |
| `missingDataFallback` | yes | Non-empty honest fallback |

---

## Test 3 — Initial pages covered (8 required)

| # | Page | Route | Pack Present? |
|---|---|---|---|
| 3.1 | Today | `/director` | |
| 3.2 | Approvals | `/director/review` | |
| 3.3 | Academy Health | `/director/kpi` | |
| 3.4 | Fitness Builder | `/director/fitness/templates/[templateId]` | |
| 3.5 | Class Builder | `/director/class-templates/[templateId]` | |
| 3.6 | Players | `/director/players` | |
| 3.7 | Sessions | `/director/sessions` | |
| 3.8 | Parent Updates | `/director/parents` | |

---

## Test 4 — Key example answers

| # | Route | Trigger phrase | Expected: response contains | Pass? |
|---|---|---|---|---|
| 4.1 | `/director/kpi` | "tell me about the health of my academy" | "Active Players", "Advancement Ready", "Attention Signals" | |
| 4.2 | `/director/kpi` | "how is my academy doing" | Same three signals | |
| 4.3 | `/director/fitness/templates/[templateId]` | "make this more game-based" | "game-based", "Fitness Games", "competitive" | |
| 4.4 | `/director/fitness/templates/[templateId]` | "what does a load flag mean" | "Red", "plyometrics", "age" | |
| 4.5 | `/director/review` | "what should i review first" | "parent-visibility", "attendance", "7 days" | |
| 4.6 | `/director/review` | "difference between approve and apply" | "database", "two-step" | |
| 4.7 | `/director/parents` | "what can i include in a parent update" | "NOT include", "raw coach notes" | |
| 4.8 | `/director/parents` | "what happens after i approve a parent update" | "not yet sent", "dispatch" | |
| 4.9 | `/director/players` | "who needs attention" | "filter bar", "review queue" | |
| 4.10 | `/director` | "what needs my attention" | "review queue", "attention signals" | |

---

## Test 5 — getDonnaContextPackForRoute helper

| # | Input | Expected output | Pass? |
|---|---|---|---|
| 5.1 | `/director/kpi` | Academy Health pack | |
| 5.2 | `/director/review` | Approvals pack | |
| 5.3 | `/director` | Today pack | |
| 5.4 | `/director/parents` | Parent Updates pack | |
| 5.5 | `/director/fitness/templates/abc123` | Fitness Builder pack (dynamic match) | |
| 5.6 | `/director/class-templates/xyz789` | Class Builder pack (dynamic match) | |
| 5.7 | `/director/sessions` | Sessions pack | |
| 5.8 | `/director/players` | Players pack | |
| 5.9 | `/director/curriculum` | null (no pack for this route yet) | |
| 5.10 | `/coach/sessions/abc` | null (coach route — not covered yet) | |

---

## Test 6 — lookupAnswerInContextPack helper

| # | Pack | Prompt | Expected | Pass? |
|---|---|---|---|---|
| 6.1 | Academy Health | "tell me about the health of my academy" | Non-null answer | |
| 6.2 | Academy Health | "TELL ME ABOUT THE HEALTH OF MY ACADEMY" | Non-null (case-insensitive) | |
| 6.3 | Fitness Builder | "make this more game-based" | Non-null answer | |
| 6.4 | Fitness Builder | "what is the capital of France?" | null (no match) | |
| 6.5 | Approvals | "approve vs apply" | Non-null answer | |
| 6.6 | Parent Updates | "raw coach notes" | Non-null answer (what-can-i-include trigger) | |

---

## Test 7 — No behavior regressions

| # | Check | Expected | Pass? |
|---|---|---|---|
| 7.1 | Existing DONNA panel opens and closes normally | Unchanged | |
| 7.2 | Sprint 1071 "open approvals" navigation still works | Routes to /director/review | |
| 7.3 | Sprint 1071 KPI page health answer still works | Grounded three-section answer | |
| 7.4 | Sprint 1071 voice status fix still works | No Listening + error co-display | |
| 7.5 | donnaPageContextRegistry.ts unchanged | No modifications | |
| 7.6 | donnaPageContextEngine.ts unchanged | No modifications | |
| 7.7 | donnaPageChipRegistry.ts unchanged | No modifications | |
| 7.8 | DonnaAssistantButton.tsx unchanged | No modifications | |
| 7.9 | TypeScript: `npx tsc --noEmit` | Zero new errors | |

---

## Acceptance Criteria Summary

- [ ] Context pack standard exists in `src/lib/donna/donnaContextPackRegistry.ts`
- [ ] All 8 required director pages have context packs
- [ ] Academy Health pack has example answer for "tell me about the health of my academy"
- [ ] Fitness Builder pack has example answer for "make this more game-based"
- [ ] Approvals pack has clear approval/never-do rules (approve vs. apply, no auto-approve)
- [ ] Parent Updates pack has 5 never-do rules including parent-visible safety rules
- [ ] `getDonnaContextPackForRoute` returns correct pack for all 8 routes including dynamic
- [ ] `lookupAnswerInContextPack` returns correct answer for key triggers
- [ ] No existing DONNA behavior changed
- [ ] TypeScript passes
