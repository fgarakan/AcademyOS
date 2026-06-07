# DONNA Brain Governance V1

**Sprint:** Mega Sprint 874–903 — DONNA Brain Governance V1
**Date:** 2026-06-07
**Scope:** Define the governance architecture that allows DONNA to learn safely without polluting the AcademyOS brain. Implement schema and architecture only. No learning, ingestion, or memory built this sprint.

---

## 1. Governing Principle

> The Global Brain is the platform's single source of truth.
> Academies can customize display and add local rules.
> DONNA can suggest — but never self-promote.
> Only the platform owner can promote knowledge to global.

This architecture enforces a clean separation between:
- What is universally true (Global Brain)
- What is locally true for one academy (Academy Knowledge + Aliases)
- What DONNA has observed but not yet been vetted (Knowledge Inbox)
- What is waiting for owner judgment (Promotion Queue)

---

## 2. Five-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — GLOBAL BRAIN                                                     │
│  Platform owner only. Vocabulary · Intents · Decision rules · Philosophy   │
│  Read by: all roles          Write/promote by: platform_owner only          │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — ACADEMY KNOWLEDGE                                                │
│  Academy-specific customization. Local rules · Preferences · Curriculum    │
│  mappings. Can override display — cannot override global decision logic.    │
│  Read by: director, head_coach, DONNA     Write by: director, owner         │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — ACADEMY ALIASES                                                  │
│  Director-controlled display remapping. "Session" → "Class", etc.          │
│  Must reference an existing global key. Cannot introduce new concepts.      │
│  Write by: director only                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 4 — KNOWLEDGE INBOX                                                  │
│  DONNA's suggestion queue. Vocab candidates · Intent candidates ·          │
│  Decision rule candidates · Philosophy candidates.                          │
│  Write by: DONNA only          Review by: platform_owner only               │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 5 — PROMOTION QUEUE                                                  │
│  Owner review gate before anything enters the Global Brain.                 │
│  Approve/reject/revise by: platform_owner only                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Global Brain Model

### Purpose
The Global Brain contains the canonical knowledge DONNA uses in all reasoning. It is the same for every academy. No academy-level action can change it.

### Entry types

| Type | Description | Examples |
|---|---|---|
| `vocabulary` | Canonical terms DONNA uses to understand and speak | "session", "group", "wrap-up", "level", "stall" |
| `intent` | Recognised question and command patterns | `intent.coach_needs_support`, `intent.player_stalled` |
| `decision_rule` | Deterministic logic rules | "Stall = 90+ days at level", "Over capacity = count > max_players" |
| `philosophy` | Product principles DONNA enforces | "AI proposes, director approves", "No automatic player movement" |

### Entry lifecycle
Every Global Brain entry begins as a `KnowledgeInboxItem` → passes through the `PromotionQueue` → is minted by the platform owner as a `GlobalBrainEntry` with `status: 'active'`.

Entries are never hard-deleted. They are deprecated (resolve for alias migration) then retired (audit trail only).

### Versioning
Every edit to a global entry increments `version`. The entry's `id` never changes. Deprecated entries retain their `id` for alias resolution during the migration window.

---

## 4. Academy Knowledge Model

### Purpose
Each academy can layer local rules, preferences, and curriculum mappings on top of the Global Brain. These customizations affect what DONNA says in that academy — not what she knows globally.

### Entry types

| Type | Description | Examples |
|---|---|---|
| `local_rule` | Academy-specific coaching rule | "Max 6 players per group", "All beginner sessions are 45 min" |
| `local_preference` | Display or UX preference | "We call our groups 'squads'", "Use 'lead coach' not 'head coach'" |
| `curriculum_mapping` | Local curriculum concept → global concept | "Red Ball = Orange Ball in global curriculum" |

### Constraint: Display overrides only, logic never
An academy knowledge entry with `overridesGlobal: true` may change what DONNA displays — the label, the phrasing, the recommendation copy. It may never change the underlying decision logic.

Example:
- A director sets "group = squad" → DONNA says "Your Squads" in that academy.
- The stall detection logic (90+ days) is global and cannot be changed by a director.

This is enforced by the contract on `AcademyKnowledgeEntry.overridesGlobal`:
- `true` = display override acknowledged; global logic preserved
- `false` = additive local rule; no global entry involved

---

## 5. Academy Alias Model

### Purpose
Directors can remap the display label of any active global vocabulary term for their academy. Aliases are the lightest-weight customization — pure display, zero logic.

### Rules
1. An alias must target an existing active `GlobalBrainEntry` key.
2. An alias cannot introduce a term with no global equivalent.
3. An alias cannot be used to override decision rules or philosophy entries — only `vocabulary` type entries are aliasable.
4. DONNA's internal reasoning always uses the global key. Aliases are applied at the rendering layer only.

### Example

```
Global Brain: key = "session", label = "Training Session"
Academy Alias: globalKey = "session", displayLabel = "Class"

DONNA reasoning: "The session has no wrap-up."
DONNA display:   "The class has no wrap-up."  ← alias applied at render
```

### Conflict: alias_has_no_global_key
If a director tries to create an alias for a key that does not exist in the Global Brain, it is rejected immediately. The director is prompted to submit a vocabulary candidate to the inbox instead.

---

## 6. Knowledge Inbox Workflow

```
DONNA observes a recurring pattern
          │
          ▼
  Writes KnowledgeInboxItem
  (type, suggestedKey, evidence, confidence)
          │
          ▼
  Status: inbox_pending
          │
          ▼  Platform owner reviews
          │
    ┌─────┴─────┐
    │           │
  Queue      Dismiss
    │           │
  inbox_      inbox_
  queued      dismissed
```

### DONNA's inbox obligations
- DONNA writes to the inbox when she detects a pattern she cannot resolve from existing global entries.
- She includes `evidence[]` — the specific observations that triggered the suggestion.
- She includes `confidence` — honest signal of how certain the pattern is.
- She never self-promotes. The inbox is her only write surface in the brain.

### Inbox item types

| Type | Trigger | Example |
|---|---|---|
| `vocabulary_candidate` | DONNA encounters a concept with no global key | A coach uses "point play" consistently; no global vocabulary entry exists |
| `intent_candidate` | A question pattern reaches the LLM fallback repeatedly | "What's the energy like this week?" asked across 5 academies |
| `decision_rule_candidate` | DONNA notices a threshold that might be useful globally | "Coaches with 0 sessions in 14 days seem to need outreach" |
| `philosophy_candidate` | A product principle is applied inconsistently | DONNA detects cases where the "propose, don't execute" rule is being tested |

---

## 7. Promotion Queue Workflow

```
inbox_queued (owner moved from inbox)
          │
          ▼
  PromotionQueueItem created
  Status: queue_under_review
          │
          ▼  Platform owner decides
          │
    ┌─────┼──────────┐
    │     │          │
  Approve Reject  Needs revision
    │     │          │
    ▼     ▼          ▼
 queue_ queue_   queue_needs_
 approved rejected  revision
    │                │
    │                ▼
    │         returned to inbox_pending
    │         (with revision note)
    ▼
 GlobalBrainEntry minted
 status: global_active
 version: 1
 promotedAt: <now>
 promotedBy: <owner>
```

### Owner approval requirements
Before approving a promotion queue item, the platform owner must verify:

1. **Key uniqueness** — the proposed key does not conflict with any active or deprecated global entry.
2. **Definition clarity** — the definition is unambiguous and usable in DONNA reasoning.
3. **Evidence quality** — the inbox evidence supports the pattern (not a one-off or noise).
4. **Conflict check** — `conflictsWith[]` has been reviewed and resolved.
5. **Philosophy alignment** — the entry does not weaken any existing philosophy entry.

Only when all five are satisfied should the owner approve. The system flags `conflictsWith[]` automatically — the owner reviews, not the system.

---

## 8. Permission Matrix

| Layer | Read | Write | Promote | Dismiss | Alias |
|---|---|---|---|---|---|
| **Global Brain** | All roles | owner only | owner only | — | — |
| **Academy Knowledge** | owner, director, head_coach, DONNA | owner, director | — | — | — |
| **Academy Aliases** | All roles | — | — | — | director only |
| **Knowledge Inbox** | owner only | DONNA only | — | owner only | — |
| **Promotion Queue** | owner only | — | owner only | — | — |

**Key invariants:**
- No academy role can write to the Global Brain.
- No academy role can read the Knowledge Inbox or Promotion Queue.
- DONNA can only write to the Inbox — not read it, not promote from it.
- Directors can only alias existing global vocabulary — they cannot introduce new concepts.
- The platform owner is the only entity that can move knowledge from suggested → global.

---

## 9. Conflict Handling

| Conflict type | Severity | Resolution |
|---|---|---|
| `alias_has_no_global_key` | Blocking | Reject alias creation; prompt director to submit vocabulary candidate to inbox |
| `academy_rule_contradicts_global` | Warning | Allow display customisation; preserve global logic; log conflict; notify director |
| `duplicate_vocabulary` | Warning | Owner marks inbox item as duplicate; link to existing global key; no new entry |
| `deprecated_key_in_use` | Informational | Warn director; suggest updating to successor key; deprecated key continues to resolve during migration window |

### Resolution principle
**Global logic always wins.** Display customisation is always allowed. Logic override is never allowed.

This means:
- DONNA may say "Your squad has 12 members" (alias applied).
- DONNA may never ignore a stall threshold because a director set a local rule saying "we don't track stalls."

---

## 10. Knowledge Lifecycle

```
suggested → inbox_pending → inbox_queued ──────────┐
                 │                                  │
           inbox_dismissed                  queue_under_review
           (dead end)                              │
                                  ┌────────────────┼──────────────┐
                                  │                │              │
                           queue_approved   queue_rejected  queue_needs_revision
                                  │                               │
                            global_active              (back to inbox_pending)
                                  │
                         global_deprecated
                                  │
                          global_retired
                         (audit trail only)
```

### Irreversibility points
- `global_active` → cannot be rolled back to `queue_approved`. Only forward: deprecate, then retire.
- `inbox_dismissed` → cannot be re-queued. A new inbox item must be submitted with new evidence.
- `global_retired` → permanent. Entry exists only in audit trail.

---

## 11. Owner Approval Requirements — Summary

| Action | Required checks |
|---|---|
| Move inbox_pending → inbox_queued | Evidence quality, non-duplicate, non-noise |
| Move queue_under_review → queue_approved | Key uniqueness, definition clarity, evidence quality, conflict resolution, philosophy alignment |
| Mint global_active | All above + explicit owner confirmation |
| Deprecate global_active → global_deprecated | Successor key named, all aliases using deprecated key notified |
| Retire global_deprecated → global_retired | Zero active references to deprecated key remain |

---

## 12. TypeScript Implementation

**File:** `src/lib/donna/brain/donnaBrainGovernance.ts`

Types implemented:

| Type / Constant | Description |
|---|---|
| `GlobalBrainEntryType` | Union of vocabulary / intent / decision_rule / philosophy |
| `GlobalBrainEntryStatus` | active / deprecated / retired |
| `GlobalBrainEntry` | Full global brain entry shape |
| `AcademyKnowledgeEntryType` | local_rule / local_preference / curriculum_mapping |
| `AcademyKnowledgeEntry` | Academy-scoped knowledge entry with globalKeyRef + overridesGlobal |
| `AcademyAlias` | Director alias mapping — resolves to globalKey |
| `AliasResolutionResult` | Output of alias resolution at render time |
| `KnowledgeInboxItemType` | vocabulary_candidate / intent_candidate / decision_rule_candidate / philosophy_candidate |
| `KnowledgeInboxItemStatus` | pending / queued / dismissed / duplicate |
| `KnowledgeInboxItem` | DONNA's suggestion shape with evidence[] and confidence |
| `PromotionQueueItemStatus` | under_review / approved / rejected / needs_revision |
| `PromotionQueueItem` | Owner review record with proposedEntry + conflictsWith[] |
| `BrainGovernanceRole` | platform_owner / academy_director / head_coach / coach / donna |
| `BrainLayerOperation` | read / write / promote / dismiss / alias |
| `LayerPermission` | Permission rule: layer + operation + allowedRoles |
| `BRAIN_GOVERNANCE_PERMISSIONS` | Constant array of all 12 permission rules |
| `ConflictSeverity` | blocking / warning / informational |
| `BrainConflict` | Conflict type + severity + description + resolution |
| `BRAIN_CONFLICT_RULES` | Constant array of 4 conflict rules |
| `KnowledgeLifecycleState` | 12-state lifecycle union |
| `KnowledgeLifecycleTransition` | Transition: from → to, triggeredBy, requiresApproval |
| `KNOWLEDGE_LIFECYCLE_TRANSITIONS` | Constant array of all 12 valid transitions |

---

## 13. What Is NOT Built This Sprint

| Capability | Status | When |
|---|---|---|
| DONNA pattern observation engine | Not built | Future sprint — learning layer |
| Inbox write action | Not built | Future sprint — ingestion layer |
| Promotion queue UI | Not built | Future sprint — owner UI |
| Global Brain persistent store | Not built | Future sprint — migration required |
| Academy alias UI for directors | Not built | Future sprint — settings screen |
| Alias resolution in DONNA rendering | Not built | Future sprint — brain render layer |
| Memory / cross-session context | Not built | Future sprint — memory layer |

This sprint establishes the contract. Subsequent sprints implement the layers one at a time.

---

## 14. Architecture Invariants Preserved

| Invariant | Status |
|---|---|
| AI proposes, director approves — not reversed | ✅ DONNA writes only to Inbox; no self-promotion |
| No mutations without audit trail | ✅ All GlobalBrainEntry changes include promotedBy + lastModifiedBy |
| Academy data is scoped to academy_id | ✅ AcademyKnowledgeEntry + AcademyAlias both carry academyId |
| Global logic cannot be overridden locally | ✅ overridesGlobal = display only; decision rules are immutable from academy layer |
| No new tables without RLS | ✅ No tables created this sprint — types only |
| TypeScript: clean | ✅ 0 errors |
