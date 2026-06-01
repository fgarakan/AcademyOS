# Sprint 1078 — DONNA Product Memory / Approved Learning V1

**Date:** 2026-06-01
**Sprint:** 1078

---

## Problem

Sprints 1071–1077 gave DONNA better page context, academy context, action recognition, and safe routing. But product rules — how DONNA should behave, what counts as age-appropriate fitness, how parent communication works — were scattered across code comments, CLAUDE.md, AI_BACKEND_RULES.md, and implicit sprint implementations. There was no single inspectable registry where "what DONNA knows" could be approved, versioned, and retrieved.

---

## Existing Memory Architecture (pre-1078)

| System | File | Durable? | Purpose |
|---|---|---|---|
| Safe Session Memory | `donnaSafeSessionMemory.ts` | No (sessionStorage) | Tab navigation context |
| Chat Session Memory | `donnaChatSessionMemory.ts` | No (RAM) | In-panel conversation thread |
| Semantic Memory | `donnaSemanticMemory.ts` | Yes (DB migration 074) | Entity embeddings for search |
| Memory Policy | `donnaMemoryPolicy.ts` | Code-only | Memory category taxonomy |
| Knowledge Library | `knowledgeTypes.ts`, `knowledgeReviewQueue.ts` | Code-only (no DB yet) | External knowledge review pipeline |
| Context Packs | `donnaContextPackRegistry.ts` | Code-only | Page-specific Q&A and rules |
| Action Registry | `donnaActionRegistry.ts` | Code-only | Intent-level action definitions |

**Gap:** No system for *product rules* — behavioral standards, approval policies, fitness philosophy, curriculum norms.

---

## New: Product Memory Foundation

### File

`src/lib/donna/donnaProductMemory.ts`

Pure TypeScript — no DB, no API. Safe to import anywhere.

### Types

```typescript
export type ProductMemoryCategory =
  | 'product_rule' | 'ux_standard' | 'donna_behavior_rule'
  | 'curriculum_rule' | 'fitness_rule' | 'parent_communication_rule'
  | 'safety_rule' | 'business_rule'

export type ProductMemorySourceType =
  | 'director_correction' | 'sprint_decision' | 'product_policy'
  | 'curriculum_standard' | 'pilot_feedback'

export type ProductMemoryStatus = 'proposed' | 'approved' | 'rejected' | 'archived'

export type ProductMemoryScope = 'global' | 'academy' | 'page_specific'

export type ProductMemoryVisibility = 'director_only' | 'all_roles' | 'internal'

export interface ProductMemoryApprovalMeta {
  approvedBy: string
  approvedAt: string
  notes: string | null
}

export interface ProductMemoryItem {
  memoryId: string
  title: string
  category: ProductMemoryCategory
  sourceType: ProductMemorySourceType
  sourceText: string         // original statement or policy text
  proposedRule: string       // actionable rule DONNA should follow when approved
  scope: ProductMemoryScope
  visibility: ProductMemoryVisibility
  status: ProductMemoryStatus
  requiresApproval: boolean
  approvalMeta: ProductMemoryApprovalMeta | null
  createdAt: string
  relatedRoutes: string[]
  relatedModules: string[]
  safetyNotes: string | null
}
```

### Approval Model

```
createProposedProductMemory()
    → status: 'proposed'   ← not yet active
    ↓ director or platform owner reviews
approveProductMemoryItem()
    → status: 'approved'   ← DONNA may use this rule
                              approvalMeta.approvedBy / approvedAt set
rejectProductMemoryItem()
    → status: 'rejected'   ← preserved for audit trail
                              rejection reason appended to safetyNotes
```

Only `status === 'approved'` items are active. DONNA never acts on `proposed` items.

### Helpers

```typescript
createProposedProductMemory(input)          // new item in 'proposed' status
approveProductMemoryItem(item, meta)        // approve → pure function, returns new object
rejectProductMemoryItem(item, reason)       // reject → pure function, appends reason to safetyNotes
getApprovedProductMemoryByCategory(items, category) // filter to active rules by domain
```

All helpers are pure functions — no mutations, no DB, no side effects.

---

## Seed Approved Rules

Sprint 1078 codifies four locked AcademyOS rules that were already implemented across prior sprints but were not inspectable as product memory:

### 1. `donna-answers-from-page-context-first`
- **Category:** donna_behavior_rule
- **Source:** Sprint 1071 (KPI page intercept), Sprint 1073 (context-pack wiring)
- **Rule:** DONNA answers from page context before asking for clarification. Only asks for clarification when context is genuinely insufficient.
- **Related modules:** context_pack_registry, donna_conversational_router, god_mode_orchestrator

### 2. `donna-never-mutates-without-approval`
- **Category:** safety_rule
- **Source:** CLAUDE.md, AI_BACKEND_RULES.md — core architectural invariant
- **Rule:** DONNA never directly writes to player/session/curriculum/parent records. All consequential actions route through proposed_actions or review queue. No action executes automatically.
- **Safety note:** finalize_player_placement() and execute_approved_action() are the ONLY valid mutation paths.

### 3. `younger-fitness-game-based-broad`
- **Category:** fitness_rule
- **Source:** Curriculum standard, Sprint 1072 Fitness Builder context pack, Sprint 1068 load-check
- **Rule:** Red Ball and Orange Ball fitness must prioritise game-based exercises, coordination/rhythm/balance/reaction. Plyometrics, strength blocks, and speed work are flagged for these age groups.
- **Safety note:** Load flags in the builder are the enforcement mechanism — DONNA guidance is advisory only.

### 4. `parent-communication-parent-safe-approval-gated`
- **Category:** parent_communication_rule
- **Source:** CLAUDE.md, parentSafeResponseRules.ts, Sprint 1072 Parent Updates context pack
- **Rule:** All parent communications must pass the parent-safe filter, route through proposed_actions, be explicitly approved by the director, and be manually dispatched. Auto-send is an architectural invariant, never a preference.
- **Safety note:** guardian-to-player linking via player_guardians is a precondition.

---

## What Is NOT Wired in This Sprint

- Not called from `handleDonnaCooPrompt`
- Not injected into the LLM orchestrator context
- Not connected to any director-facing UI
- No DB table created
- No connection to existing proposed_actions pipeline (future sprint)

---

## Future Wiring (Sprint 1079+)

```typescript
// Inject approved DONNA behavior rules into orchestrator system prompt:
const behaviorRules = getApprovedProductMemoryByCategory(SEED_PRODUCT_MEMORY, 'donna_behavior_rule')
const safetyRules = getApprovedProductMemoryByCategory(SEED_PRODUCT_MEMORY, 'safety_rule')
const ruleLines = [...behaviorRules, ...safetyRules]
  .map(r => `- ${r.proposedRule}`)
  .join('\n')
// Append to systemPrompt as "## Approved Product Rules"

// Surface fitness rules in context-pack answers for the fitness builder
const fitnessRules = getApprovedProductMemoryByCategory(SEED_PRODUCT_MEMORY, 'fitness_rule')

// Build a director-facing review UI using the same proposed/approved/rejected lifecycle
// as the existing review queue — createProposedProductMemory → review → approveProductMemoryItem
```

---

## Safety Invariants

- No schema changes, no migrations
- DONNA never auto-learns from messages (no implicit capture)
- All items start as `proposed` — no rule is active without explicit `approveProductMemoryItem`
- Pure functions — all helpers return new objects, never mutate input
- Sprint 1077 action registry runtime wiring unchanged
- Sprint 1075 academy profile in orchestrator unchanged
