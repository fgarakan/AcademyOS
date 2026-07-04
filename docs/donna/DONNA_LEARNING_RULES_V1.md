# DONNA Learning Rules V1

**Sprint 4365 — Define the rules for how DONNA may safely learn. Governance only.**

This document defines **what DONNA may and may not learn from, and under what approval**.
It does **not** implement learning persistence, add sources, add writes, or change any
runtime behaviour in this sprint. It governs a path that **already exists**.

---

## 1. Honest starting point — learning already exists

DONNA already has a durable-learning path, and it is wired into the live director
conversation:

- **Table:** `donna_executive_learning` (migration `084_donna_executive_learning.sql`),
  with a lifecycle `status IN ('captured','reviewing','approved','rejected','promoted','archived')`.
  Per project status, migration 084 is **not yet applied** to the live database, so the
  code path runs **fail-open** today (a failed load returns empty; nothing crashes).
- **Adapter:** `src/lib/donna/executive/donnaExecutiveLearningStore.ts`
  (`saveDurableLearning` → `insert`, `loadDurableLearning` → academy-scoped select).
- **Bridge + gate:** `src/lib/donna/executive/donnaExecutiveLearning.ts` extracts learning
  from a completed executive session and **gates high-impact learning for Director approval**.
- **In-memory ledger + trust model:** `src/lib/donna/learning/*`
  (`learningEntryModel.ts` → `LearningSourceType`, `LearningStatus`;
  `donnaSourceReliabilityEngine.ts` → `SOURCE_BASE_RELIABILITY`).

**This sprint does not add, expand, or activate any of it.** It writes the rulebook the
existing path must obey, and certifies that the rulebook forbids unsafe sources and
requires approval before persistent learning is trusted.

---

## 2. What DONNA may learn from

DONNA may learn only from **approved, academy-scoped, non-sensitive** sources:

- approved academy settings
- approved curriculum overrides
- director-approved language preferences
- owner-approved vocabulary and aliases
- completed loop outcomes
- confirmed corrections from directors
- explicit owner/admin knowledge updates
- approved academy-specific teaching language

These map to trusted entries in the existing `LearningSourceType` union and are weighted by
`SOURCE_BASE_RELIABILITY` (director/owner-confirmed sources are the highest-trust; unverified
inputs are the lowest and never auto-promoted).

---

## 3. What DONNA may NOT learn from

DONNA must **never** learn from, or persist, any of the following:

- raw parent messages
- private player notes
- guardian contact details
- raw coach notes (unless explicitly approved and sanitised)
- audit logs
- cross-academy data
- unapproved AI guesses
- one-off hallucinations
- sensitive health or personal information
- anything outside the user's role or academy boundary
- anything not explicitly approved as academy knowledge

These sources are barred regardless of confidence. No trust weight, no recurrence count,
and no model output can promote a forbidden source into learning.

---

## 4. Approval before persistent learning

Persistent, trusted learning is **human-gated**:

- **High-impact learning requires Director approval.** In
  `donnaExecutiveLearning.ts`, high-impact learning (philosophy, curriculum defaults,
  placement, communication style) is stored with `status: 'reviewing'` and
  `reviewRequired: true`, `approvedBy: null` — it is **not** trusted until a Director
  approves it.
- **Low-impact operational learning** may be captured as `status: 'approved'` by the
  system for reuse, but remains reversible and academy-scoped.
- **Promotion to reusable knowledge is human-in-the-loop** — only an approved
  `LearningEntry` may become an `ApprovedKnowledgeEntry`; rejected entries never enter the
  registry.
- **Academy DNA overrides AI.** `donnaAcademyDNAGuard.ts` treats the declared academy
  philosophy as the supreme authority; AI-derived learning is advisory and can be flagged
  or blocked against it.
- **OpenAI never decides truth or approval.** The model may draft or rephrase; it never
  approves, rejects, or determines what is true (`knowledgePromotion/donnaKnowledgeDraftGenerator.ts`).

---

## 5. Safety invariants (permanent)

1. Learning is **academy-scoped** — no entry crosses the tenant boundary.
2. Learning is **fail-open** — a persistence failure degrades to no-learning, never to a crash or a guess.
3. Learning is **reversible** — status transitions are one-way-validated but any entry can be rejected or archived.
4. Learning **never** captures PII, contact details, raw notes, scores, or health data.
5. Persistent, trusted learning **always** passes an explicit approval gate.
6. Nothing in this document is activated by this sprint — it is the contract the existing
   path is certified against.

---

## 6. Learning-through-use layers, events, and approval matrix

Learning-through-use is governed by five layers and a fixed event vocabulary, both defined
as testable constants in `src/lib/donna/learning/learningEventTypes.ts` and described in
full in `ACADEMYOS_LEARNING_THROUGH_USE_ARCHITECTURE.md`.

**The five layers (`LEARNING_LAYERS`)** — a signal only rises a layer, and only crosses
from ephemeral to durable through a human gate:

1. `temporary_conversation_context` — ephemeral, no approval
2. `session_summary` — ephemeral, no approval
3. `learning_candidate` — proposed, not yet trusted, no durable effect
4. `director_approved_academy_memory` — **durable, Director approval required**
5. `owner_approved_global_learning` — **durable, Owner approval + anonymization required**

**The event vocabulary (`LEARNING_EVENT_TYPES`, 16):** `usage_event`, `conversation_event`,
`correction_event`, `preference_signal`, `curriculum_signal`, `workflow_signal`,
`assessment_signal`, `progression_signal`, `approval_signal`, `rejection_signal`,
`parent_safe_signal`, `coach_signal`, `product_friction_signal`, `learning_candidate`,
`approved_learning`, `rejected_learning`.

**Approval matrix — what requires a human gate before it becomes durable:** durable academy
memory · vocabulary/alias additions · curriculum interpretation changes · parent-facing
communication preferences · coach evaluation preferences · player-development heuristics ·
global/platform learning · anything reused across future sessions. Model output can **never
become memory directly** — only an approved candidate becomes durable.

See also: `DONNA_CONVERSATION_STYLE_GUIDE.md` for how DONNA speaks, and
`ACADEMYOS_LEARNING_THROUGH_USE_ARCHITECTURE.md` for the full architecture.
