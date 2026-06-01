# QA — Sprint 1078: DONNA Product Memory / Approved Learning V1

**Date:** 2026-06-01
**Sprint:** 1078

---

## Test 1 — File exists and compiles

| # | Check | Expected | Pass? |
|---|---|---|---|
| 1.1 | `src/lib/donna/donnaProductMemory.ts` exists | File present | |
| 1.2 | `npx tsc --noEmit` passes | Zero new errors | |
| 1.3 | Exports `ProductMemoryItem` interface | Present | |
| 1.4 | Exports `ProductMemoryCategory` type (8 values) | Present | |
| 1.5 | Exports `ProductMemorySourceType` type (5 values) | Present | |
| 1.6 | Exports `ProductMemoryStatus` type (4 values) | `proposed`, `approved`, `rejected`, `archived` | |
| 1.7 | Exports `ProductMemoryScope` type (3 values) | `global`, `academy`, `page_specific` | |
| 1.8 | Exports `ProductMemoryVisibility` type (3 values) | `director_only`, `all_roles`, `internal` | |
| 1.9 | Exports `ProductMemoryApprovalMeta` interface | Present | |
| 1.10 | Exports `createProposedProductMemory` function | Present | |
| 1.11 | Exports `approveProductMemoryItem` function | Present | |
| 1.12 | Exports `rejectProductMemoryItem` function | Present | |
| 1.13 | Exports `getApprovedProductMemoryByCategory` function | Present | |
| 1.14 | Exports `SEED_PRODUCT_MEMORY` array | 4 entries | |

---

## Test 2 — ProductMemoryItem interface completeness

| Field | Type | Present? |
|---|---|---|
| `memoryId` | `string` | |
| `title` | `string` | |
| `category` | `ProductMemoryCategory` | |
| `sourceType` | `ProductMemorySourceType` | |
| `sourceText` | `string` | |
| `proposedRule` | `string` | |
| `scope` | `ProductMemoryScope` | |
| `visibility` | `ProductMemoryVisibility` | |
| `status` | `ProductMemoryStatus` | |
| `requiresApproval` | `boolean` | |
| `approvalMeta` | `ProductMemoryApprovalMeta \| null` | |
| `createdAt` | `string` | |
| `relatedRoutes` | `string[]` | |
| `relatedModules` | `string[]` | |
| `safetyNotes` | `string \| null` | |

---

## Test 3 — Seed approved memory rules

| # | memoryId | Category | Status | requiresApproval | Pass? |
|---|---|---|---|---|---|
| 3.1 | `donna-answers-from-page-context-first` | `donna_behavior_rule` | `approved` | `false` | |
| 3.2 | `donna-never-mutates-without-approval` | `safety_rule` | `approved` | `true` | |
| 3.3 | `younger-fitness-game-based-broad` | `fitness_rule` | `approved` | `false` | |
| 3.4 | `parent-communication-parent-safe-approval-gated` | `parent_communication_rule` | `approved` | `true` | |

---

## Test 4 — Seed rule content quality

| # | Rule | Expected content | Pass? |
|---|---|---|---|
| 4.1 | `donna-never-mutates-without-approval` | proposedRule mentions "proposed_actions" or "review queue" | |
| 4.2 | `donna-never-mutates-without-approval` | safetyNotes mentions "finalize_player_placement()" or "execute_approved_action()" | |
| 4.3 | `younger-fitness-game-based-broad` | proposedRule mentions "coordination", "rhythm", "balance", "reaction" | |
| 4.4 | `younger-fitness-game-based-broad` | proposedRule mentions "Red Ball" and "Orange Ball" | |
| 4.5 | `parent-communication-parent-safe-approval-gated` | proposedRule mentions "auto-sends" (never auto-sends) | |
| 4.6 | `parent-communication-parent-safe-approval-gated` | safetyNotes mentions "player_guardians" | |
| 4.7 | `donna-answers-from-page-context-first` | relatedRoutes contains "/director/kpi" | |
| 4.8 | All 4 seed rules | `approvalMeta !== null` (seeds are pre-approved) | |

---

## Test 5 — createProposedProductMemory helper

| # | Check | Expected | Pass? |
|---|---|---|---|
| 5.1 | `status` of new item | `'proposed'` | |
| 5.2 | `approvalMeta` of new item | `null` | |
| 5.3 | `requiresApproval` defaults to `true` when not specified | `true` | |
| 5.4 | `relatedRoutes` defaults to `[]` when not specified | `[]` | |
| 5.5 | `createdAt` is an ISO 8601 string | Non-empty string, valid format | |
| 5.6 | Input fields correctly propagated | All specified fields present | |

---

## Test 6 — approveProductMemoryItem helper

| # | Check | Expected | Pass? |
|---|---|---|---|
| 6.1 | Returns new item (does not mutate input) | Original item status unchanged | |
| 6.2 | Returned item `status` | `'approved'` | |
| 6.3 | Returned item `approvalMeta.approvedBy` | Value from input meta | |
| 6.4 | Returned item `approvalMeta.approvedAt` | Value from input meta | |
| 6.5 | All other fields unchanged | Identical to input item except status + approvalMeta | |

---

## Test 7 — rejectProductMemoryItem helper

| # | Check | Expected | Pass? |
|---|---|---|---|
| 7.1 | Returns new item (does not mutate input) | Original item status unchanged | |
| 7.2 | Returned item `status` | `'rejected'` | |
| 7.3 | Rejection reason appended to `safetyNotes` | `safetyNotes` contains "Rejected: <reason>"  | |
| 7.4 | Original `safetyNotes` preserved | Existing notes still present when non-null | |

---

## Test 8 — getApprovedProductMemoryByCategory helper

| # | Input | Expected | Pass? |
|---|---|---|---|
| 8.1 | `SEED_PRODUCT_MEMORY`, `'safety_rule'` | Returns 1 item (`donna-never-mutates-without-approval`) | |
| 8.2 | `SEED_PRODUCT_MEMORY`, `'fitness_rule'` | Returns 1 item (`younger-fitness-game-based-broad`) | |
| 8.3 | `SEED_PRODUCT_MEMORY`, `'parent_communication_rule'` | Returns 1 item | |
| 8.4 | `SEED_PRODUCT_MEMORY`, `'donna_behavior_rule'` | Returns 1 item | |
| 8.5 | Empty array input | Returns `[]` | |
| 8.6 | Items with `status !== 'approved'` | Not returned | |
| 8.7 | `SEED_PRODUCT_MEMORY`, `'business_rule'` | Returns `[]` (no seed items in this category) | |

---

## Test 9 — No runtime behavior regressions

| # | Check | Expected | Pass? |
|---|---|---|---|
| 9.1 | Sprint 1077 action registry wiring unchanged | Works as before | |
| 9.2 | Sprint 1073 context-pack lookup unchanged | Works as before | |
| 9.3 | `donnaActionRegistry.ts` unchanged | Not modified | |
| 9.4 | `DonnaAssistantButton.tsx` unchanged | Not modified | |
| 9.5 | `donnaSafeSessionMemory.ts` unchanged | Not modified | |
| 9.6 | `donnaMemoryPolicy.ts` unchanged | Not modified | |
| 9.7 | `knowledgeTypes.ts` unchanged | Not modified | |
| 9.8 | `matchDonnaActionIntent` not called at runtime from new code | Not in any runtime path | |
| 9.9 | `SEED_PRODUCT_MEMORY` not injected into orchestrator | Not in any system prompt | |
| 9.10 | TypeScript: `npx tsc --noEmit` | Zero new errors | |

---

## Acceptance Criteria Summary

- [ ] `donnaProductMemory.ts` exists with all 6 types + interface + 4 helpers + seed array
- [ ] All 4 seed items have `status: 'approved'` and `approvalMeta !== null`
- [ ] `donna-never-mutates-without-approval` is `'safety_rule'`, `requiresApproval: true`
- [ ] `parent-communication-parent-safe-approval-gated` requires approval, mentions guardian linking
- [ ] `younger-fitness-game-based-broad` covers Red Ball + Orange Ball + 4 movement attributes
- [ ] All helpers are pure functions (no mutation of inputs)
- [ ] `createProposedProductMemory` always creates `status: 'proposed'`
- [ ] No existing DONNA runtime behavior changed
- [ ] TypeScript passes
