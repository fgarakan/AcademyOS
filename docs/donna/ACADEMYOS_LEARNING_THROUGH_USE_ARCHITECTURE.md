# AcademyOS Learning-Through-Use Architecture

**Sprint 4365 — Define the architecture, rules, boundaries, and certification for
learning-through-use. Docs + certification + a tiny constants file only.**

AcademyOS must be designed to **learn through use** in every safe and valuable way — but
DONNA must **not** automatically remember everything. AcademyOS captures structured
learning signals from usage, conversations, workflows, curriculum, player development,
coach behaviour, parent-safe signals, and academy operations — and turns them into durable
memory **only through explicit human approval**.

This document is doctrine. Its taxonomy is made testable in
`src/lib/donna/learning/learningEventTypes.ts` (`LEARNING_EVENT_TYPES`, `LEARNING_LAYERS`)
and certified by `src/lib/donna/certification/donnaConversationCertification.ts`.

> **Scope honesty.** This sprint introduces **no** persistence, schema, model-routing,
> permission, or runtime-behaviour change. Durable learning already partially exists
> (`donna_executive_learning`, migration 084, currently **unapplied** → fail-open; the
> in-memory ledger under `src/lib/donna/learning/*`; the promotion pipeline under
> `src/lib/donna/knowledgePromotion/*`). This sprint defines the rulebook those paths must
> obey and certifies it — it does not build or activate capture. See
> `DONNA_LEARNING_RULES_V1.md` for the source rules and `DONNA_CONVERSATION_STYLE_GUIDE.md`
> for how DONNA speaks about learning.

---

## 1. The five learning layers

A signal only ever **rises** a layer, and it crosses from ephemeral to durable **only
through a human approval gate**. `LEARNING_LAYERS` is the source of truth.

| # | Layer (`id`) | Durable? | Approval | Where it lives today |
|---|---|---|---|---|
| 1 | `temporary_conversation_context` | No | none | `conversation/conversationLearningRecord.ts` (in-memory, capped, evicted) |
| 2 | `session_summary` | No | none | `executive/donnaExecutiveLearning.ts` (extracted from a completed session) |
| 3 | `learning_candidate` | No | none (proposed, not yet trusted) | `learning/*` ledger (`LearningEntry`, `status: 'captured' → 'reviewing'`) |
| 4 | `director_approved_academy_memory` | **Yes** | **Director** | `donna_executive_learning` (`status: 'approved'/'promoted'`); `knowledgePromotion/donnaApprovedKnowledgeRegistry` |
| 5 | `owner_approved_global_learning` | **Yes** | **Owner** (+ anonymization) | `knowledgePromotion` `KnowledgeTargetScope: 'global_platform_candidate'` / `'brian_philosophy'` |

**Separation invariant:** layers 1–3 are ephemeral/untrusted and never persist as durable
rules; layers 4–5 are durable and each require explicit approval. Layer 5 additionally
requires **anonymization** before any cross-academy reuse.

---

## 2. What AcademyOS should learn from (safe sources)

Repeated DONNA questions · repeated director corrections · approved academy settings ·
approved curriculum overrides · director-approved vocabulary and aliases · template/session
usage · coach wrap-up patterns · assessment outcomes · player progression evidence ·
approval/rejection patterns · parent-safe communication preferences · workflow friction ·
page confusion · loop completion/dropoff · safe product telemetry · confirmed director
feedback · owner-approved knowledge updates.

## 3. What DONNA may PROPOSE as learning candidates

DONNA may **propose** (never auto-adopt): preferred academy language · preferred curriculum
phrasing · local drill names · recurring workflow preferences · parent communication
preferences · coach wrap-up summary preferences · common next-action patterns · repeated
director corrections · page guidance improvements · vocabulary/alias additions ·
academy-specific operating habits. A proposal is a **layer-3 `learning_candidate`** — it
changes nothing until approved.

## 4. What requires approval before it becomes durable

Durable academy memory · vocabulary/alias additions · curriculum interpretation changes ·
parent-facing communication preferences · coach evaluation preferences ·
player-development heuristics · global/platform learning · **anything reused across future
sessions**. All of these are layer 4 or 5 and pass an explicit human gate.

## 5. What DONNA must NEVER auto-learn from (forbidden)

Raw parent messages · guardian contact details · private player notes · raw coach notes
unless sanitized and approved · medical/health/sensitive personal information · audit logs ·
cross-academy data · unapproved AI guesses · hallucinated model output · private messages ·
anything outside role or academy boundaries. These are barred regardless of confidence,
recurrence, or model certainty.

---

## 6. Learning event types

The structured vocabulary a signal is classified into — `LEARNING_EVENT_TYPES` (16):

`usage_event` · `conversation_event` · `correction_event` · `preference_signal` ·
`curriculum_signal` · `workflow_signal` · `assessment_signal` · `progression_signal` ·
`approval_signal` · `rejection_signal` · `parent_safe_signal` · `coach_signal` ·
`product_friction_signal` · `learning_candidate` · `approved_learning` · `rejected_learning`.

`approved_learning` and `rejected_learning` are terminal states of a `learning_candidate`
after the human gate — a candidate never becomes `approved_learning` without approval.

---

## 7. The learning pipeline

```
user action or conversation
  → structured event                (one of LEARNING_EVENT_TYPES)
  → safe classification             (forbidden sources dropped here)
  → possible learning candidate     (layer 3 — proposed, not trusted)
  → human approval if durable       (Director for academy; Owner for global)
  → academy memory update           (layer 4/5 — the only durable write)
  → DONNA uses approved memory in future guidance
  → outcome measured
  → confidence adjusted over time
```

**Model boundary:** OpenAI may draft or rephrase inside this pipeline; it never classifies
a forbidden source as safe, never approves, and its output can **never become memory
directly** — only an approved `LearningEntry` becomes durable
(`knowledgePromotion/donnaKnowledgeDraftGenerator.ts`: "OpenAI never determines what is
truth").

---

## 8. Per-loop learning signals

Every canonical loop has both a **safe learning signal** (what it may safely contribute) and
a **forbidden signal** (what must never be learned from it — mirrored by each loop's existing
`blockedForParentPlayer` categories in `loopKnowledge.ts`).

| Loop | Safe learning signal | Forbidden signal |
|---|---|---|
| 1 · Set up your academy | Setup-step completion/dropoff (`workflow_signal`) | Director-only configuration internals |
| 2 · Build your curriculum | Approved curriculum overrides, phrasing (`curriculum_signal`) | Unapproved draft interpretation |
| 3 · Create a class template | Template usage patterns (`usage_event`) | Internal template decisions |
| 4 · Create a session | Common next-action patterns (`usage_event`) | Raw coach notes, internal scores |
| 5 · Assign a coach & readiness | Coverage/readiness workflow friction (`workflow_signal`) | Staffing decisions as personal data |
| 6 · Run the session on court | Block-flow usage (`usage_event`) | Verbatim coach observations |
| 7 · Wrap up the session | Coach wrap-up summary preferences (`coach_signal`) | Raw recap, verbatim observations |
| 8 · Player development & evidence | Assessment/progression outcomes (`assessment_signal`, `progression_signal`) | Raw scores, health/personal info, other players' data |
| 9 · Review & approve | Approval/rejection patterns (`approval_signal`, `rejection_signal`) | Queue contents as personal data |
| 10 · Parent & player-safe clarity | Parent-safe communication preferences (`parent_safe_signal`) | Raw parent messages, guardian contact |

---

## 9. Confidence over time

Approved memory is not permanent truth. Each durable entry carries a confidence that is
**measured against outcomes** and **adjusted over time**; contradicted or stale memory is
demoted, and any entry can be rejected or archived. Academy DNA remains the supreme
authority — approved learning is advisory against the declared philosophy, never above it.
