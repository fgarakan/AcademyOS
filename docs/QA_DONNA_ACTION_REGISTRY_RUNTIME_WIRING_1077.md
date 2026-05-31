# QA — Sprint 1077: DONNA Action Registry Runtime Wiring V1

**Date:** 2026-05-31
**Sprint:** 1077

---

## Test 1 — Compile

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `npx tsc --noEmit` passes | Zero new errors | |
| 1.2 | `matchDonnaActionIntent` imported | No import errors | |
| 1.3 | `DonnaActionRole` type imported | No type errors | |

---

## Test 2 — "Suggest level movement" (mutation_request, high risk)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 2.1 | Type: "Move this player up." | Registry matches `suggest_level_movement` → `blockedMessage` → responseType: 'honest' | |
| 2.2 | Type: "Suggest level movement." | Same — blockedMessage explains DONNA only produces a proposal | |
| 2.3 | No player record is changed | Zero DB writes | |
| 2.4 | No `proposed_action` is created | No server action called | |
| 2.5 | Response card shown as 'honest' type | Orange / approval-style card | |
| 2.6 | `suggest_level_movement.blockedMessage` text visible | References Level Up queue | |

---

## Test 3 — "Make this fitness template game-based" (explanation, low risk)

| # | Page | Action | Expected | Pass? |
|---|---|---|---|---|
| 3.1 | On `/director/fitness/templates/<id>` | Type: "Make this more game-based." | Context pack fires first (richer page-specific answer). Registry never reached. | |
| 3.2 | On `/director` (not builder) | Type: "Make this more game-based." | Registry matches `make_fitness_template_game_based` → safetyMessage → responseType: 'info' | |
| 3.3 | No template blocks are mutated | Zero DB writes | |
| 3.4 | Response is guidance/explanation only | No builder state changed | |

---

## Test 4 — "Review approvals" (review, low risk)

| # | Action | Expected | Pass? |
|---|---|---|---|
| 4.1 | Type: "Review approvals." | Registry matches `review_approvals` → confirmationMessage → responseType: 'info' | |
| 4.2 | No items approved or rejected | Zero DB writes | |
| 4.3 | Response type is 'info' | Blue info card | |

---

## Test 5 — Navigation commands still use dispatcher

| # | Action | Expected | Pass? |
|---|---|---|---|
| 5.1 | Type: "Open approvals." | handleUIDispatch catches it → router.push('/director/review'). Registry never reached. | |
| 5.2 | Type: "Go to players." | Dispatcher routes to /director/players. Registry not reached. | |
| 5.3 | Type: "Academy health." | Dispatcher routes to /director/kpi. Registry not reached. | |
| 5.4 | Type: "Take me to approvals." | Dispatcher routes. Registry not reached. | |

---

## Test 6 — Context-pack answers still fire first

| # | Page | Prompt | Expected | Pass? |
|---|---|---|---|---|
| 6.1 | `/director/kpi` | "Tell me about the health of my academy." | Context-pack answer (3 signals). Registry not reached. | |
| 6.2 | `/director/review` | "What should I review first?" | Context-pack answer (priority ordering). Registry not reached. | |
| 6.3 | `/director/fitness/templates/<id>` | "Make this more game-based." | Context-pack answer (block restructuring). Registry not reached. | |
| 6.4 | `/director/parents` | "What can I include in a parent update?" | Context-pack answer (content rules). Registry not reached. | |

---

## Test 7 — Unknown prompts still fall through

| # | Prompt | Expected | Pass? |
|---|---|---|---|
| 7.1 | "What is 2+2?" | No context-pack match, no registry match → routeDonnaPrompt → God Mode | |
| 7.2 | "Random phrase with no intent." | Falls through entire stack → God Mode | |
| 7.3 | "How do I export data?" | Falls through → God Mode or routeDonnaPrompt | |

---

## Test 8 — "Draft a parent update" (already handled by dispatcher)

| # | Check | Expected | Pass? |
|---|---|---|---|
| 8.1 | Type: "Draft a parent update." | `handleUIDispatch` → `resolveDraftIntent` catches it. Routes to `/director/review`. Registry never reached. | |
| 8.2 | No parent message auto-sent | Zero sends | |

---

## Test 9 — Regression checks

| # | Check | Expected | Pass? |
|---|---|---|---|
| 9.1 | Sprint 1073 context-pack lookup unchanged | Still runs first inside handleDonnaCooPrompt | |
| 9.2 | Sprint 1075 academy profile in orchestrator unchanged | Still fires | |
| 9.3 | Sprint 1076 registry unchanged | Not modified | |
| 9.4 | `donnaUIActionDispatcher.ts` unchanged | Not modified | |
| 9.5 | `donnaPageContextRegistry.ts` unchanged | Not modified | |
| 9.6 | Voice input still works | Same handleVoiceTranscript path | |
| 9.7 | Typed input still works | Same handleCommandSubmit path | |
| 9.8 | Response cards and chips unchanged | UI behavior unchanged | |

---

## Acceptance Criteria Summary

- [ ] "Move this player up" → high-risk approval-safe response, zero mutations
- [ ] "Make this fitness template game-based" (off builder page) → safe guidance response
- [ ] "Review approvals" → confirmationMessage, no items approved
- [ ] "Open approvals" → dispatcher routes to /director/review (not registry)
- [ ] Context-pack answers still fire before registry
- [ ] Unknown prompts fall through to routeDonnaPrompt / God Mode
- [ ] TypeScript passes
