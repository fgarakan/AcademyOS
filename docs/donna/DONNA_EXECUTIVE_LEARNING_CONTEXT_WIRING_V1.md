# DONNA Executive Learning Context Wiring V1

**Mega Sprint 4231–4260 — 2026-06-25**

Complete the loop: every OpenAI reasoning request now automatically benefits from
everything DONNA has learned. Durable learning is retrieved before reasoning and
folded into the **live** Executive Context Packet through the **existing**
`relevant_memory` slot — DONNA reuses compressed learning instead of re-sending
context. No second memory system; OpenAI only reasons (it never reads or writes memory).

```
Director → Page Context → Workflow Context → Operating Session
  → Relevant Durable Learning → Executive Context Packet → OpenAI → Executive Response
```

---

## What changed

1. **Durable persistence (migration 084).** New `donna_executive_learning` table —
   the long-lived home for Learning Ledger entries (academy/director truth), RLS-scoped
   (staff read · directors write). `donna_working_memory` stays session-scoped; this is
   not a duplicate system.
2. **DB adapter** `donnaExecutiveLearningStore.ts` — `loadDurableLearning` /
   `saveDurableLearning` map rows ⇄ `LearningEntry`. Cast-typed (table not yet in
   generated types — no edit to the protected `database.types.ts`). Fail-open.
3. **Retrieval into the packet (reuses the shipped slot).** `learningToMemoryRecords`
   maps durable learning into `MemoryRecord { content, tags }`; the live adapter feeds it
   into `ResolverState.memories`; the existing `relevant_memory` context source surfaces
   only the records whose tags match the request.
4. **Live wiring** in `donnaLiveConversationAction`: before reasoning, load academy
   learning → retrieve relevant (max 6) → fold into the packet. When learning is present
   the replayed transcript window is narrowed (`slice(-3)`) — **net token reduction**.
   After the turn, learning is captured back (deduped) and persisted. All fail-open.
5. **Diagnostics.** `learningReused` added to the executive diagnostics + reasoning trace.

---

## Retrieval logic

`retrieveRelevantLearning({ request, store, max })` ranks usable learning
(`approved` / `promoted`) by keyword overlap + importance, capped at 6. Only the matching
records are tagged into `relevant_memory`; an unrelated comms preference is **not**
surfaced for a curriculum question (certified).

Memory types reaching the packet: **academy preferences, director preferences, operating
patterns, and approved long-term learning** (the seven `ExecutiveLearningType`s).

---

## Token efficiency, latency, quality

- **Tokens:** in certification, the packet with learning + a trimmed transcript used
  **fewer tokens** than replaying the full transcript (packet 534 → 440); estimated
  ~93% saving on the displaced transcript. Compressed learning is preferred over long
  history.
- **Latency:** retrieval adds one academy-scoped `SELECT` (tens of ms); capture is one
  best-effort `INSERT` off the answer's critical correctness path. Both fail-open.
- **Quality (live, real OpenAI):** the same request — "draft a parent note about missed
  sessions" — produced a generic note with no learning, and a **"brief … warm"** note
  with the learned director preference present (`learningReused=1`). DONNA applied how the
  academy operates without being told again.

---

## Model-agnostic

OpenAI receives durable learning **as packet context only**. It never stores, retrieves,
or owns memory — capture and retrieval are server-side. Swapping the reasoning model
changes nothing about learning. (Certified: learning rides the existing `relevant_memory`
source; no new packet field; the live bridge reports `learningReused`.)

---

## Certification

`donnaExecutiveLearningWiringCertification.ts` — **19/19**: learning reaches the packet,
relevance filtering, net token reduction, fail-open, model-agnostic reuse, and the
academy-scoped fail-open store adapter (mock Supabase). Full gate **23/23 suites passed**;
`tsc --noEmit` clean.

---

## Activation & remaining gaps (honest)

- **Migration 084 must be applied** to the live Supabase before any cross-session learning
  exists in the browser. Until applied, `loadDurableLearning` fails open to `[]` — zero
  behavior change (safe). Run it via the project's migration process; then regenerate
  `database.types.ts` and the adapter's `as any` casts can be dropped.
- **Literal browser cross-session "remembers yesterday"** needs the migration applied **and**
  a director login — not exercised here. The proof covers the exact live server pipeline
  with real OpenAI.
- **Capture runs per primary turn** (deduped). A session-end capture hook would reduce
  write volume; deferred.

**God Mode score: 9 / 10.**
