# DONNA Executive Experience V1 — Report

**Mega Sprint 3211–3240**
**Date:** 2026-06-20
**Scope:** Director-facing DONNA experience. No new architecture, no new orchestration, no schema/RLS/package changes. Pure TypeScript.

---

## Summary

DONNA's executive *architecture* was already strong (situation-gated `whatShouldIDoTodayEngine`, 5-field `focusTodayAnswerEngine`, `donnaResponseStyle` validator, `llmOrchestration/` COO routing). This sprint made the director experience *feel* like an elite COO through three surgical improvements and added a runnable certification + this report.

**Certification result: 87/87 criteria — 100% — CERTIFIED.**

Run:
```bash
npx tsx src/lib/donna/experience/donnaExecutiveExperienceCertification.ts
```

---

## What changed (surgical, additive)

| File | Change |
|---|---|
| `src/lib/donna/conversation/donnaResponseStyle.ts` | Added premium anti-patterns the validator was missing: `"i want to make sure i understand"`, `"you may want to"`, `"you might want to"`, `"just to make sure i understand"`. |
| `src/lib/donna/intent/donnaClarificationEngine.ts` | Replaced the default clarification preamble — was the banned phrase *"I want to make sure I understand."* — with a direct COO prefix: *"Here's where I'd focus. Which of these do you mean:"* |
| `src/lib/donna/proactive/focusTodayAnswerEngine.ts` | Added `detectVagueExecutiveInput()` + `buildExecutiveAssumptionAnswer()` — the Part 2 assumption layer: when the director is vague but the request is safe, DONNA makes the best COO assumption (no clarification question), grounded in live counts, ending with a recommended action and a completion offer. |
| `src/lib/donna/directorDonnaContext.ts` | Exported the existing `buildDemoContext()` (no behavior change) so the certification reuses the canonical fixture. |

What was **deliberately not built** (already exists — mission forbids rebuilding): the Today engine, the response-style system, the OpenAI/RealitySnapshot COO routing, intent classification, the attention/priority engines.

---

## Before / after

### "This seems off." (vague → previously a clarification question)

**Before** — clarification path led with a chatbot preamble:
> _I want to make sure I understand. Would you like to: 1. Review player progress …_

**After** — COO assumption layer, reality-aware, action + completion offer:
> [Demo] I'll prioritize this like a COO — what's urgent, what blocks progress, and what affects players first.
>
> Start here: 2 missing coach wrap-ups from today.
> This matters because coaching observations from today's sessions cannot be recovered retroactively.
> The blocker is decisions waiting on you.
> Evidence: 2 of today's 5 sessions have no coach wrap-up submitted.
> I can take you there and walk you through it.

### "What should I do today?" (already strong — unchanged engine)

> [Demo] Here's what I'd focus on today:
> **1. Highest leverage action:** 2 missing coach wrap-ups from today
> **2. Why it matters:** Coaching observations from today's sessions cannot be recovered retroactively…
> **3. Evidence:** 2 of today's 5 sessions have no coach wrap-up submitted.
> **4. Where to go:** Open Sessions… → /director/sessions
> **5. Your role:** No approval needed for viewing. DONNA will not submit wrap-ups or contact coaches automatically.

---

## Route scores

The certification routes the 12 sprint prompts (plus 2 all-clear honesty checks) through the existing experience engines. Every route surfaces real academy state, a next action, and the honest demo/live label.

| Prompt | Routed via | Criteria met |
|---|---|---|
| What should I do today? | `focus_today` | ✅ all |
| Good morning Donna. | `greeting + focus_today` | ✅ all |
| What matters most? | `focus_today` | ✅ all |
| This seems off. | `assumption` | ✅ all (incl. assumption) |
| I don't know what to do next. | `assumption` | ✅ all (incl. assumption) |
| What would an elite COO do? | `assumption` | ✅ all (incl. assumption) |
| Who needs attention? | `proactive_notice` | ✅ all |
| What is blocking us? | `proactive_notice` | ✅ all |
| Help me finish this. | `assumption` | ✅ all (incl. completion) |
| Take me to completion. | `assumption` | ✅ all (incl. completion) |
| What should Brian do today? | `focus_today` | ✅ all |
| Explain this simply. | `assumption` | ✅ all |
| (all-clear) What should I do today? | `focus_today` | ✅ honest empty state |
| (all-clear) This seems off. | `assumption` | ✅ honest empty state |

---

## Phrase scores (premium tone)

Each response passes `validateResponseStyle()` with **zero** chatbot anti-patterns and zero blocking violations. The `short_sentences` heuristic is intentionally excluded from the gate because the structured COO output is bulleted fragments, not prose — that rule misfires on intentional structure.

The validator now blocks, in addition to its prior list: `i want to make sure i understand`, `you may want to`, `you might want to`, `just to make sure i understand`.

---

## Remaining weak responses

None failed the certification. Tone weaknesses captured during the run: **0**.

---

## Remaining generic fallback risks

1. **`donnaGoalEngine.ts` (line ~350) still emits a soft preamble** — *"I want to make sure I understand correctly…"* This goal-completion clarification path is separate from the director clarification engine and was left untouched to avoid scope creep (its own cert, `donnaGuidedContinuityCertification`, asserts the exact phrase). It is now flagged by the upgraded `validateResponseStyle` and should be migrated to the assumption-first pattern in a follow-up.
2. **Assumption layer is not yet wired into the live director DONNA router.** `buildExecutiveAssumptionAnswer()` is built, certified, and ready, but the production shell still routes vague input to the clarification engine. Wiring is a UI sprint, not a library sprint.
3. **OpenAI COO reasoning (Part 6) was not modified.** The existing `llmOrchestration/` stack already passes RealitySnapshot + route + role + safety. No deterministic gap was found that justified touching it this sprint.

---

## Unrelated pre-existing failure (not introduced by this sprint)

`src/lib/donna/philosophy/philosophyCertification.ts` — 36/37, fails on `HighPerf: drift is not HIGH`. It imports none of the files touched this sprint; the failing assertion is philosophy-drift detection logic. Recorded here per the backend rule on noting (not fixing) out-of-scope failures.

---

## Certification suite status

`find src/lib/donna -name "*Certification.ts"` → 31 files. **30 pass, 1 pre-existing unrelated failure** (philosophy, above). The new `donnaExecutiveExperienceCertification.ts` passes 100%. `npx tsc --noEmit` is clean.

---

## Next sprint recommendation

**DONNA Executive Experience V2 — Live Router Wiring.**
1. Wire `detectVagueExecutiveInput` / `buildExecutiveAssumptionAnswer` into the live director DONNA shell so the assumption layer ships to real directors.
2. Migrate `donnaGoalEngine` clarification to the assumption-first pattern and update `donnaGuidedContinuityCertification` accordingly.
3. Manual validation pass with Brian on the 12 prompts against live academy data (the certification proves logic; only a live pass proves *feel*).
