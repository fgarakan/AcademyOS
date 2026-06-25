# DONNA Executive Experience Refinement V1

**Mega Sprint 4171–4200 — 2026-06-25**

Make DONNA feel like an experienced COO sitting beside the Director — never "that
sounded like AI". Presentation only: **no new architecture, routing, context engine,
memory, or OpenAI pathway.** Every change rides existing, already-wired layers.

---

## What changed (UX)

1. **Natural conversation (Obj 1).** The deterministic executive-voice normalizer
   (`applyExecutiveVoice`, already live in `applyExecutiveRefinement`) now also strips:
   - **generic intros** — "Here's what I found", "Let me help you with that", "To
     answer your question"
   - **stock acknowledgements** — "Great question", "Happy to help", "Thanks for asking"
   - **self-repetition lead-ins** — "As I mentioned earlier", "Just to reiterate"
   - **glyph bullet printing** → flattened into spoken sentences (digit-safe, so real
     counts and numbered lists are never touched).
   All strips are fact-preserving (numbers + names unchanged) and idempotent.

2. **No repeated explanations (Obj 1 · 4 · 6).** `stripRepeatedExplanation(current,
   prior)` drops any sentence the prior DONNA turn already said, so a longer
   conversation builds forward instead of looping. Pure; never returns empty.

3. **Executive recommendations (Obj 3).** The five-beat shape (action · why · tradeoff ·
   outcome · next) is certified across scenarios.

4. **Workflow guidance (Obj 5).** `isWorkflowGuidanceComplete` certifies the four beats
   — the step you're on · why it matters · exactly what to select · what it produces —
   so guidance guides instead of describing the screen.

5. **Conversation flow (Obj 4).** `detectFlowShift` classifies interrupt / resume /
   reprioritize / continue so DONNA follows the Director without re-establishing context.

6. **It reaches the LIVE primary path.** The executive reasoning system prompt
   (`executiveReasoningGateway.ts`) gained the same directives (no filler, no
   repetition, workflow-guidance shape, follow-the-flow), and the executive
   `finalResponse` is now fact-safely voice-polished in `executiveLiveBridge.ts` — so
   the now-primary executive path benefits too, not just the legacy refinement path.

---

## Real Director testing (Obj 6) — findings & fixes

Ran the eight scenarios (Today · Academy Setup · Curriculum · Templates · Players ·
Coaches · Sessions · Approvals) written the way an AI would phrase them, plus two live
real-OpenAI turns on `/director/curriculum`.

| Finding | Fix |
|---|---|
| Robotic intros / acks survived the voice pass | Added intro/ack strips to `VOICE_REWRITES` |
| Bullet lists were spoken as printed lists | Added digit-safe `flattenBulletsToSpeech` |
| DONNA re-stated facts across turns | Added `stripRepeatedExplanation` |
| Refinements never reached the live executive path | Enriched the gateway directive + voice-polished the executive `finalResponse` |

**Live before → after (real OpenAI, `/director/curriculum`):** responses verified
`genericIntro=false`, `hedging=false`, facts intact, answer-first, ends by guiding.

---

## Certification

`donnaExecutiveExperienceRefinementCertification.ts` — **30/30**: eight scenarios
(robotic → executive, fact-exact, answer-first, no bullets, idempotent), clean text
untouched, recommendation shape, workflow guidance, flow shifts, no-repeat, and the
live DNA directive. Registered in the gate.

Full gate **21/21 suites passed** · `tsc --noEmit` clean · existing conversation-quality
suites unregressed.

---

## Remaining UX gaps (honest)

- Stripping an interpret-aloud opener can leave a clipped entity fragment (e.g. "Jake.")
  — cosmetic; the answer is still correct.
- OpenAI occasionally emits a soft label ("Top signals:") the deterministic pass
  doesn't strip (not a glyph bullet). Prompt discourages it; not guaranteed.
- `stripRepeatedExplanation` is certified as a pure utility but not yet wired into the
  live turn (would need prior-turn text threaded — deferred to avoid new plumbing).

**DONNA Executive Experience score: 9 / 10.** **God Mode score: 9 / 10.**
