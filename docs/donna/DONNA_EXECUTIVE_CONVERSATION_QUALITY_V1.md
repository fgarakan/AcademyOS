# DONNA Executive Conversation Quality V1

**Mega Sprint 4021–4050 · 2026-06-25**

> Every response should sound like an experienced COO sitting beside the Director:
> **answer first, recommend confidently, explain why, guide to completion.** Never a chatbot.

Conversation quality only — **no new architecture, routing, or memory.** This sprint
strengthens the existing voice contract, the live presentation layer, and the OpenAI
prompt. The Executive Architecture, Context Engine, and Unified Reasoning Engine
(prior sprints) are unchanged.

---

## 1. Natural executive voice (Objectives 1 + 6)

The canonical Conversation DNA (`conversation/donnaConversationDNA.ts`) now owns the
anti-chatbot contract:

- **`hasChatbotHedging(text)`** — flags interpret-aloud openers ("I think you're
  asking…", "If I understand correctly…"), servile clarifiers ("Could you clarify…",
  "Please choose…", "Describe what you need."), defer-backs ("Would you like me to…"),
  leading filler ("Sure,", "Of course,"), and weak recommendations.
- **`applyExecutiveVoice(text)`** — a **deterministic, pure, idempotent,
  fact-preserving** normalizer that rewrites those into decisive executive phrasing.
  It never alters numbers, names, recommendations, or meaning — only the hedged
  scaffolding. Examples:
  - "I think you're asking about the 5 items." → "The 5 items."
  - "Would you like me to open the review queue?" → "Want me to open the review queue?"
  - "You may wish to consider assigning the 6 players." → "I'd recommend assigning the 6 players."
  - "Could you clarify which group?" → "Tell me which group?"
- **`answersFirst`**, **`hasExecutiveRecommendationShape`** (action · why · tradeoff ·
  outcome · next), and an extended **`conformsToConversationDNA`** (now flags hedging).

Because it is deterministic, the executive voice reaches the Director **live even with
no OpenAI key** — the no-model path no longer sounds like a chatbot.

---

## 2. Live wiring

`applyExecutiveRefinement` (the final presentation layer both director actions already
call — live and strategic) now runs the deterministic polish as the last step:

```
grounded draft ─▶ (OpenAI refinement, if available) ─▶ applyExecutiveVoice() ─▶ response
                                                          │ fact-preserving guard
                                                          │ (numbers unchanged, no growth)
                                                          ▼ fail-safe: keep base on any doubt
```

- Over OpenAI's wording when it refined; over the grounded draft when it didn't.
- **Untouched:** approval-gated, safety-blocked, mutation, and non-`respond` results.
- Structured fields (navigation, workflow, approval, confidence) always pass through.

The OpenAI path additionally gets an **executive-voice directive** prepended in the
Executive Reasoning Gateway: answer first, never ask which page, recommend with
why · tradeoff · outcome · next step, concise and conversational.

---

## 3. Page-aware guidance (Objective 2)

No new code — reuses the Unified Executive Context Engine. The page packet already
carries title, purpose, current step, selected values, completion status, and the
recommended next action, so a COO answer built from it is answer-first, never asks the
Director what page they are on, and ends by guiding the next click. Proven across
Today, Onboarding, Curriculum, Templates, Players, Coaches, Approvals.

---

## 4. Continuity (Objective 5)

Unchanged recognizers, verified: `isAcknowledgmentPhrase` ("yes / okay / ok / sure")
and `isContinuityPhrase` ("continue / let's continue / keep going") keep the thread on
short replies. The voice normalizer is verified to **preserve** this/that/here/continue
references — polishing tone never drops a coreference.

---

## 5. Certification (Objective 7)

`donnaExecutiveConversationQualityCertification.ts` — **39/39**, offline + deterministic:

| Section | Proves |
|---|---|
| A | 8 hedging patterns cleaned, output conforms, idempotent, numbers + names preserved, clean text untouched |
| B | 7 pages × answer-first, ends-with-guidance, never asks the page, DNA-conformant |
| C | Executive recommendation shape (action · why · tradeoff · outcome · next) |
| D | Guided completion — every page leaves a concrete next step |
| E | Continuity tokens recognized; references preserved through polish |
| F | Live no-key path sheds hedging; facts + navigation preserved; approval-gated untouched |
| G | Concision — polish never adds verbosity |

Full registered suite green (16/16, zero failures). `tsc --noEmit` clean.

---

## 6. Remaining conversational gaps

- **Deterministic removal is conservative.** Standalone clarifying questions that are
  genuinely answerable from context are softened, not deleted — true "answer instead of
  ask" when context suffices is the OpenAI path's job (directive added). The deterministic
  layer never risks deleting a question that was actually needed.
- **Executive layer dormant live** (`DONNA_EXECUTIVE_REASONING` unset) — the prompt
  directive applies when enabled; the deterministic voice polish applies now regardless.
- **Recommendation completeness is model-driven.** `hasExecutiveRecommendationShape`
  scores structure; producing all five parts every time depends on the OpenAI path.
- Tone calibration per role beyond director/coach is still the personality table's job.

---

## 7. Scores

- **Executive Conversation: 9 / 10** — answer-first, decisive, page-aware, continuity-safe
  voice that ships live without a model. Held from 10 by the dormant executive flag and
  model-dependent full-recommendation completeness.
- **God Mode: 9.5 / 10** — the operating partner now *sounds* like the COO the
  architecture already makes her. Remaining: live-flag enablement and durable learning.
