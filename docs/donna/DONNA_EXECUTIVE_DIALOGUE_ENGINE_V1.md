# DONNA Executive Dialogue Engine V1

**Mega Sprint 4051–4080 · 2026-06-25**

> A Director should be able to spend 30 minutes solving a complex academy problem with
> DONNA without feeling like they are repeatedly talking to an AI. The conversation
> should feel like working alongside an experienced executive partner.

**Dialogue quality only** — no new routing, no new context engine, no new memory store.
Dialogue state is **derived per turn** from the conversation history that already flows
through the Executive Context Packet, then fed into the existing reasoning prompt.

---

## 1. Architecture

```
ResolverState.conversationHistory (already in the packet)
        │
        ▼
deriveDialogueState(history, message)        ← executive/donnaExecutiveDialogue.ts (pure)
        │   objective · topic · decisions · open · assumptions · risks · tradeoffs · stage
        ├── assessIdea(message, state)        ← respectful challenge for weak ideas
        ▼
buildDialogueDirective(state, assessment)    ← compact DIALOGUE STATE block + directive
        │
        ▼
runExecutiveReasoning(packet, role, directive)  ← gateway folds it into the OpenAI call
```

`runExecutiveOperatingTurn` derives the state and threads the directive; nothing is
stored, no new source or route is added. The turn result now also carries
`dialogueState` for diagnostics and certification.

---

## 2. Conversation flow improvements

- **Multi-turn reasoning (Obj 1):** the directive tells the model to continue the same
  line of reasoning, reference what was already decided, and not re-derive settled
  points — so DONNA never restarts every message.
- **Strategic discussion (Obj 2):** `detectStrategicTopic` recognizes build-academy,
  curriculum, retention, revenue, onboarding, staffing, scheduling, and
  player-development, so the prompt frames the right kind of problem.
- **Executive communication (Obj 6):** voice contract extended with think-with /
  build-progressively / challenge-respectfully lines; anti-repetition keeps DONNA from
  repeating herself.

---

## 3. Decision tracking (Objective 5)

`DialogueState` derives, every turn:

| Field | How it's derived |
|---|---|
| `activeObjective` | earliest user turn with an objective verb (build/redesign/improve/increase/optimize/fix…) |
| `decisionsMade` | a DONNA recommendation the Director accepted on the next turn |
| `openDecisions` | DONNA questions not yet answered by a later turn |
| `assumptions` / `risks` / `tradeoffs` | sentence-level signal scan across the dialogue |
| `strategicTopic` | first strategic domain detected |

Recommendations adapt as the discussion evolves because the directive carries the
current decided/open set into every call.

---

## 4. Progressive planning (Objective 4)

Six stages — **objective → constraints → options → recommendation → execution →
review** — with the furthest-reached stage tracked and `nextStage()` pointing one step
ahead. The directive asks the model to move the discussion one step forward each turn
instead of dumping one large answer. Verified monotonic over a 16-turn dialogue
(`constraints → options → execution → review`). A *process* recommendation ("I'd
recommend we lock the constraints next") does not advance the stage — only a solution
recommendation does.

---

## 5. Executive challenge (Objective 3)

`assessIdea` flags weak ideas by kind — **overcomplex** ("build everything at once"),
**brute_force** ("just hire more"), **wrong_problem** ("more marketing"),
**scope_creep** ("while we're at it…"), **premature** (execute before the objective is
set) — and returns a respectful challenge frame that **always explains why**.
`isRespectfulChallenge` enforces it: a challenge must explain (— / because / since) and
must never attack (no "stupid / ridiculous / bad idea / you're wrong"). DONNA
challenges the idea, never the Director.

---

## 6. Certification (Objective 7)

`donnaExecutiveDialogueCertification.ts` — **28/28**, offline + deterministic:

| Section | Proves |
|---|---|
| A | 16-turn dialogue — objective, topic, ≥2 decisions, tradeoffs, risks tracked; reaches review |
| B | Progressive planning advances monotonically; early≤options, late≥execution |
| C | All 8 strategic domains classify correctly |
| D | Weak ideas challenged respectfully with a why; sound ideas not challenged; premature execution caught |
| E | Mid-dialogue weak idea adapts to a challenge; near-duplicate flagged; fresh line not |
| F | Dialogue directive carries objective, stage+next, decided, anti-repeat + progressive, challenge |
| G | Live operating turn exposes dialogue state; topic + decisions carried; conversation grounded |

Full registered suite green (17/17, zero failures). `tsc --noEmit` clean.

---

## 7. Remaining dialogue gaps

- **History window.** The live `current_page`/`conversation_history` packet keeps the
  most recent turns; very long (30+ turn) dialogues rely on that window plus the derived
  state summary rather than the full transcript. The derived `decisionsMade` /
  `activeObjective` summary mitigates this, but a longer durable thread is future work.
- **Heuristic derivation.** Decisions, risks, and stage come from signal scans, not a
  model — robust and deterministic, but coarser than an LLM extraction.
- **Executive layer dormant live** (`DONNA_EXECUTIVE_REASONING` unset) — the dialogue
  directive applies when enabled; the derivation runs and is certified now.
- **Challenge coverage** is signal-based; novel weak-idea phrasings outside the catalog
  pass through (the model's own judgment still applies via the directive).

---

## 8. Scores

- **Executive Dialogue: 9 / 10** — sustained multi-turn reasoning, decision tracking,
  progressive planning, respectful challenge, and anti-repetition, all derived and
  certified. Held from 10 by the heuristic derivation and the live-flag/long-thread gaps.
- **God Mode: 9.5 / 10** — DONNA now thinks *with* the Director across a long problem,
  not just answer by answer. Remaining lift: live-flag enablement and durable learning.
