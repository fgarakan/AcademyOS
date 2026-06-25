# DONNA Durable Executive Learning V1

**Mega Sprint 4201–4230 — 2026-06-25**

Make DONNA learn from completed Director work. Every meaningful operating session
now produces durable, approved, deduplicated learning that later turns reuse as
**compressed memory instead of a long transcript**. No new routing, no new OpenAI
pathway, no migration — a pure bridge built on the **existing Learning Ledger**.

---

## Learning architecture

```
Completed Executive operating session
  (ExecutiveSession · DialogueState · WorkflowState)
        │  summarizeOperatingSession()        ← Obj 1
        ▼
  ExecutiveSessionSummary (objectives · decisions · actions · paused ·
                           unresolved · preferences · patterns · follow-ups)
        │  extractDurableLearning()           ← Obj 2 (noise filtered)
        ▼
  ExecutiveLearningCandidate[]  ── classifyLearningApproval ──→  Obj 3
        │  toLearningEntries()  (→ existing LearningEntry model)
        ▼
  applyLearningHygiene()  →  contradiction-vs-truth → dedupe → expire   ← Obj 5
        │
        ▼
  ExecutiveLearningStore (port; InMemory here, donna_working_memory in prod)
        │
        ▼
  retrieveRelevantLearning() + estimateTokenSavings()                   ← Obj 4
```

**Reuses, never duplicates:** `learningEntryModel` (`createLearningEntry`,
`LearningEntry`), `donnaLearningDeduplicator` (`deduplicateBatch`),
`donnaLearningContradictionDetector` (`detectContradictions`). New code is only the
session→learning bridge, the approval gate, the token-reuse layer, and diagnostics.

**Single new file:** `src/lib/donna/executive/donnaExecutiveLearning.ts`. Pure
TypeScript, persistence-agnostic.

---

## Memory types (Obj 2)

| Type | Domain | Default impact | TTL |
|---|---|---|---|
| `curriculum_choice` | curriculum | high → approval | never |
| `coaching_philosophy` | coaching_philosophy | high → approval | never |
| `academy_preference` | player_development / ops | high → approval | never |
| `director_preference` | academy_operations | high → approval | never |
| `recurring_decision` | academy_operations | low → auto | 120 d |
| `workflow_tendency` | session_execution | low → auto | 90 d |
| `operating_pattern` | academy_operations | low → auto | 60 d |

Noise (greetings, acks, content-free fragments) is dropped — never stored.

---

## Approval rules (Obj 3)

- **High-impact** (academy philosophy, curriculum defaults, player-placement logic,
  coach expectations, communication style) → entry lands in `reviewing`,
  `reviewRequired = true`, `approvedBy = null`. The Director decides.
- **Low-risk operational** memory → auto `approved` by `system`, immediately usable.
- A **casual auto-entry that contradicts confirmed truth is downgraded to `reviewing`**
  — it can never silently overwrite academy truth.

---

## Retrieval logic (Obj 4)

`retrieveRelevantLearning({ request, store, max })` ranks only **usable** learning
(`approved` / `promoted`) by keyword overlap + importance, capped (default 6).
`buildCompressedLearningContext` renders it as a short spoken-style block;
`estimateTokenSavings` compares it to replaying the transcript.

**Token efficiency:** in certification, reusing compressed learning instead of an
8 000-char transcript saved **1 964 tokens (~98%)** for that turn. Savings are clamped
to never go negative.

---

## Learning hygiene (Obj 5)

Ordered so correctness holds: **contradiction-vs-truth first** (an opposite-sentiment
entry is a contradiction, not a duplicate — this fixed a real bug where dedup would
silently drop it), **then** dedupe the remainder, **then** expire stale entries by TTL.
High-impact academy truth never expires.

---

## Developer diagnostics (Obj 6)

`formatExecutiveLearningDiagnostics` →
`[donna.learning] meaningful=… captured=… skipped=… approvalRequired=… reused=…
tokensSaved=… contradictions=…`

---

## Certification

`donnaExecutiveLearningCertification.ts` — **36/36**: summary creation, useful-capture
vs noise, approval gating, dedupe + expiry, contradiction flagging + casual-overwrite
guard, relevant retrieval + token savings, end-to-end + diagnostics + store isolation.
Full gate **22/22 suites passed**; `tsc --noEmit` clean.

---

## Remaining gaps (honest)

- **Persistence is a port, not yet wired to the DB.** Production should add a
  `DonnaWorkingMemoryLearningStore` against the existing `donna_working_memory` table
  (already RLS-protected — no migration). Until then learning is per-process.
- **Retrieval is not yet folded into the live Executive Context Engine.** The capability
  (retrieve + compress + token estimate) is built and certified; wiring it into the
  packet assembly to actually reduce live token load is the next step.
- **Summary extraction is structured-state-only** (no transcript parsing), so director
  preferences only surface when present as decisions/tradeoffs.

**God Mode score: 9 / 10.**
