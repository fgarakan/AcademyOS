# QA — Sprint 1076: DONNA Action Registry Expansion V1

**Date:** 2026-05-31
**Sprint:** 1076

---

## Test 1 — File exists and compiles

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `src/lib/donna/donnaActionRegistry.ts` exists | File present | |
| 1.2 | `npx tsc --noEmit` passes | Zero new TypeScript errors | |
| 1.3 | Exports `DonnaAction` interface | Present | |
| 1.4 | Exports `DonnaActionCategory` type with all 5 values | `navigation`, `explanation`, `draft`, `review`, `mutation_request` | |
| 1.5 | Exports `DonnaActionRiskLevel` type with 3 values | `low`, `medium`, `high` | |
| 1.6 | Exports `DonnaActionRole` type | Present | |
| 1.7 | Exports `DONNA_ACTIONS` array | 18 entries | |
| 1.8 | Exports `getDonnaActionById` function | Present | |
| 1.9 | Exports `matchDonnaActionIntent` function | Present | |
| 1.10 | Exports `getDonnaActionsForRoute` function | Present | |

---

## Test 2 — Required actions present

| # | actionId | Category | Risk | Approval? |
|---|---|---|---|---|
| 2.1 | `open_today` | navigation | low | false |
| 2.2 | `open_approvals` | navigation | low | false |
| 2.3 | `open_players` | navigation | low | false |
| 2.4 | `open_sessions` | navigation | low | false |
| 2.5 | `open_curriculum` | navigation | low | false |
| 2.6 | `open_parent_updates` | navigation | low | false |
| 2.7 | `open_academy_health` | navigation | low | false |
| 2.8 | `open_templates` | navigation | low | false |
| 2.9 | `open_coaches` | navigation | low | false |
| 2.10 | `open_settings` | navigation | low | false |
| 2.11 | `create_class_template` | draft | medium | true |
| 2.12 | `create_fitness_template` | draft | medium | true |
| 2.13 | `explain_academy_health` | explanation | low | false |
| 2.14 | `review_approvals` | review | low | false |
| 2.15 | `draft_parent_update` | draft | medium | true |
| 2.16 | `suggest_level_movement` | mutation_request | high | true |
| 2.17 | `create_session_adjustment_draft` | draft | medium | true |
| 2.18 | `make_fitness_template_game_based` | explanation | low | false |

---

## Test 3 — Safety rules for high/medium-risk actions

| # | actionId | Check | Expected | Pass? |
|---|---|---|---|---|
| 3.1 | `suggest_level_movement` | `riskLevel` | `'high'` | |
| 3.2 | `suggest_level_movement` | `requiresApproval` | `true` | |
| 3.3 | `suggest_level_movement` | `category` | `'mutation_request'` | |
| 3.4 | `suggest_level_movement` | `safetyMessage` contains | "proposed_actions" OR "Level Up" | |
| 3.5 | `suggest_level_movement` | `blockedMessage` | Non-null, explains DONNA doesn't move directly | |
| 3.6 | `draft_parent_update` | `requiresApproval` | `true` | |
| 3.7 | `draft_parent_update` | `safetyMessage` contains | "never sends" OR "director approval" | |
| 3.8 | `draft_parent_update` | `blockedMessage` | Non-null, explains director-only restriction | |
| 3.9 | `create_session_adjustment_draft` | `requiresApproval` | `true` | |
| 3.10 | `create_class_template` | `confirmationMessage` | Non-null, mentions "nothing is saved until you publish" | |

---

## Test 4 — Role restrictions

| # | actionId | Allowed roles | Pass? |
|---|---|---|---|
| 4.1 | `open_approvals` | `['academy_director']` only | |
| 4.2 | `open_curriculum` | `['academy_director']` only | |
| 4.3 | `open_academy_health` | `['academy_director']` only | |
| 4.4 | `draft_parent_update` | `['academy_director']` only | |
| 4.5 | `suggest_level_movement` | `['academy_director']` only | |
| 4.6 | `open_players` | `['academy_director', 'head_coach']` | |
| 4.7 | `create_class_template` | `['academy_director', 'head_coach']` | |

---

## Test 5 — getDonnaActionById helper

| # | Input | Expected | Pass? |
|---|---|---|---|
| 5.1 | `'open_approvals'` | Returns `open_approvals` action | |
| 5.2 | `'suggest_level_movement'` | Returns `suggest_level_movement` action | |
| 5.3 | `'nonexistent_action'` | Returns `null` | |

---

## Test 6 — matchDonnaActionIntent helper

| # | Prompt | Role | Expected | Pass? |
|---|---|---|---|---|
| 6.1 | `"open approvals"` | undefined | `open_approvals` action | |
| 6.2 | `"tell me about the health of my academy"` | undefined | `explain_academy_health` action | |
| 6.3 | `"make this more game-based"` | undefined | `make_fitness_template_game_based` action | |
| 6.4 | `"move a player to a new level"` | undefined | `suggest_level_movement` action | |
| 6.5 | `"draft a parent update"` | `'academy_director'` | `draft_parent_update` action | |
| 6.6 | `"draft a parent update"` | `'coach'` | `null` (coach not in allowedRoles) | |
| 6.7 | `"what is 2+2"` | undefined | `null` (no match) | |
| 6.8 | Case insensitive: `"OPEN APPROVALS"` | undefined | `open_approvals` action | |

---

## Test 7 — getDonnaActionsForRoute helper

| # | Route | Expected: includes actionId | Pass? |
|---|---|---|---|
| 7.1 | `/director/review` | `open_approvals`, `review_approvals`, `draft_parent_update` | |
| 7.2 | `/director/kpi` | `open_academy_health`, `explain_academy_health` | |
| 7.3 | `/director/parents` | `open_parent_updates`, `draft_parent_update` | |
| 7.4 | `/director/fitness/templates/abc123` | `make_fitness_template_game_based`, `create_fitness_template` | |
| 7.5 | `/director/curriculum` | `open_curriculum` | |
| 7.6 | `/director/completely_unknown_route` | Empty array `[]` | |

---

## Test 8 — No runtime behavior regressions

| # | Check | Expected | Pass? |
|---|---|---|---|
| 8.1 | Sprint 1073 context-pack lookup unchanged | Works as before | |
| 8.2 | Sprint 1075 academy profile in orchestrator unchanged | Still fires | |
| 8.3 | Navigation "open approvals" still routes to /director/review | Unchanged (dispatchUIIntent) | |
| 8.4 | `donnaUIActionDispatcher.ts` unchanged | Not modified | |
| 8.5 | `donnaUIActionRegistry.ts` unchanged | Not modified | |
| 8.6 | `donnaPageChipRegistry.ts` unchanged | Not modified | |
| 8.7 | `DonnaAssistantButton.tsx` unchanged | Not modified | |
| 8.8 | `matchDonnaActionIntent` NOT called at runtime | Not in any runtime path | |
| 8.9 | TypeScript: `npx tsc --noEmit` | Zero new errors | |

---

## Acceptance Criteria Summary

- [ ] All 18 required actions present in `DONNA_ACTIONS` registry
- [ ] All draft/mutation_request actions have `requiresApproval: true`
- [ ] `suggest_level_movement` is `'high'` risk and `'mutation_request'` category
- [ ] `draft_parent_update` has explicit `blockedMessage` and `safetyMessage`
- [ ] All three helpers compile and return correct types
- [ ] `matchDonnaActionIntent` correctly filters by role
- [ ] `getDonnaActionsForRoute` handles dynamic routes
- [ ] No existing DONNA runtime behavior changed
- [ ] TypeScript passes
