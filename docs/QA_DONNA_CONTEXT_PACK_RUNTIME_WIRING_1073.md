# QA — Sprint 1073: Page Context Pack Runtime Wiring V1

**Date:** 2026-05-31
**Sprint:** 1073

---

## Test 1 — Academy Health (replacing Sprint 1071 intercept)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 1.1 | Navigate to `/director/kpi`. Type: "Tell me about the health of my academy." | Response from Academy Health context pack. Contains "Active Players", "Advancement Ready", "Attention Signals". Label: "Academy Health". | |
| 1.2 | Type: "How is my academy doing?" | Same Academy Health context pack answer. | |
| 1.3 | Type: "Explain these KPIs." | Same Academy Health answer. | |
| 1.4 | Type: "Which KPI needs attention?" | Same Academy Health answer. | |
| 1.5 | Say (voice): "Tell me about the health of my academy." | Same answer via voice path — both typed and voice reach `handleDonnaCooPrompt`. | |
| 1.6 | Navigate to `/director` (not KPI). Type: "Tell me about the health of my academy." | Does NOT fire Academy Health pack (different route). Falls through to routeDonnaPrompt/God Mode. | |

---

## Test 2 — Fitness Builder context pack

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2.1 | Navigate to a fitness template: `/director/fitness/templates/<any-id>`. Type: "Make this more game-based." | Response from Fitness Builder pack. Contains "game-based", "competitive movement". Label: "Fitness Builder". | |
| 2.2 | Type: "What does a load flag mean?" | Fitness Builder pack answer about Red/Orange Ball load flags. | |
| 2.3 | Type: "How should I structure this 45-minute session?" | Fitness Builder pack block sequence answer. | |
| 2.4 | Type: "What is the capital of France?" | No pack match. Falls through to routeDonnaPrompt → God Mode. | |

---

## Test 3 — Approvals context pack

| # | Action | Expected | Pass? |
|---|---|---|---|
| 3.1 | Navigate to `/director/review`. Type: "What should I review first?" | Approvals pack answer about parent-visibility risk → attendance → wrap-ups order. Label: "Approvals". | |
| 3.2 | Type: "What is the difference between approve and apply?" | Approvals pack answer about two-step design. | |
| 3.3 | Type: "What is an attendance exception?" | Approvals pack answer explaining attendance exceptions. | |

---

## Test 4 — Other context-pack pages

| # | Page | Trigger | Expected | Pass? |
|---|---|---|---|---|
| 4.1 | `/director` | "What needs my attention today?" | Today pack answer. Label: "Today". | |
| 4.2 | `/director` | "What is in my review queue?" | Today pack answer. | |
| 4.3 | `/director/class-templates/<id>` | "What blocks should a 60-minute Red 2 template have?" | Class Builder pack block structure answer. | |
| 4.4 | `/director/class-templates/<id>` | "What is the session flow check?" | Class Builder pack session flow check answer. | |
| 4.5 | `/director/players` | "Which players need attention?" | Players pack answer with filter bar guidance. | |
| 4.6 | `/director/players` | "Who is missing a curriculum level?" | Players pack answer about placement engine. | |
| 4.7 | `/director/sessions` | "Which sessions are missing wrap-ups?" | Sessions pack wrap-up coverage answer. | |
| 4.8 | `/director/parents` | "What can I include in a parent update?" | Parent Updates pack content rules answer. | |
| 4.9 | `/director/parents` | "What happens after I approve a parent update?" | Parent Updates pack dispatch workflow answer. | |

---

## Test 5 — Navigation commands still work (no interference)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 5.1 | On any page: type "Open approvals." | Routes to `/director/review` — handled by `handleUIDispatch` BEFORE `handleDonnaCooPrompt`. Context pack is never checked for navigation. | |
| 5.2 | Type "Go to players." | Routes to `/director/players`. | |
| 5.3 | Type "Academy health." | Routes to `/director/kpi`. | |
| 5.4 | Type "Take me to approvals." | Routes to `/director/review`. | |

---

## Test 6 — Unknown questions fall through to God Mode

| # | Action | Expected | Pass? |
|---|---|---|---|
| 6.1 | On `/director/kpi`, type an unrelated question: "How do I export data?" | No pack match → `routeDonnaPrompt` → if `answer_directly` → `detectAndHandleCommand` → God Mode. | |
| 6.2 | On `/director/review`, type: "What is 2+2?" | No pack match → falls through to God Mode or intent classifier. | |
| 6.3 | On a page with no context pack (e.g. `/director/curriculum`): type any question. | `getDonnaContextPackForRoute` returns null → skips pack lookup entirely → continues as before. | |

---

## Test 7 — No duplicate responses

| # | Check | Expected | Pass? |
|---|---|---|---|
| 7.1 | On `/director/kpi`, health question triggers context pack. | One response, not two. Sprint 1071 intercept is removed — no duplicate. | |
| 7.2 | Response label is "Academy Health" (from `pack.pageName`). | Not "DONNA" or hardcoded label. | |
| 7.3 | `cooThread` receives exactly one entry per question. | No double-append. | |

---

## Test 8 — Regression checks

| # | Check | Expected | Pass? |
|---|---|---|---|
| 8.1 | DONNA panel opens and closes. | Unchanged. | |
| 8.2 | Template draft workflow. | Unchanged. | |
| 8.3 | Generic task draft (attendance exception, player note, etc.). | Unchanged. | |
| 8.4 | Voice session with transcript. | Unchanged. | |
| 8.5 | Daily brief fetch. | Unchanged. | |
| 8.6 | Review queue fetch. | Unchanged. | |
| 8.7 | `donnaPageContextRegistry.ts` unchanged. | Not modified. | |
| 8.8 | `donnaPageContextEngine.ts` unchanged. | Not modified. | |
| 8.9 | `donnaUIActionDispatcher.ts` unchanged. | Not modified. | |
| 8.10 | `npx tsc --noEmit` passes. | Zero new TypeScript errors. | |

---

## Acceptance Criteria Summary

- [ ] "Tell me about the health of my academy" on `/director/kpi` answers from Academy Health context pack
- [ ] "Make this more game-based" on Fitness Builder answers from Fitness Builder context pack
- [ ] "What should I review first?" on `/director/review` answers from Approvals context pack
- [ ] Unknown questions on any page fall through to routeDonnaPrompt / God Mode
- [ ] Navigation commands ("open approvals") still route correctly — no interference
- [ ] No duplicate responses (Sprint 1071 intercept removed)
- [ ] TypeScript passes
