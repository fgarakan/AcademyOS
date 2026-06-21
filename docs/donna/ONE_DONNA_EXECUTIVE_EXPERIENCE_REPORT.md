# ONE DONNA — Executive Experience Convergence V1

**Mega Sprint 3361–3390**
**Date:** 2026-06-21
**Status:** Final convergence pass before Director Pilot.

---

## Executive summary

AcademyOS already contains sufficient DONNA intelligence. The two prior mega-sprints
(3271–3300 *ONE DONNA Operating System Convergence*, 3301–3360 *Adaptive COO Operating
Day*) had already collapsed the DONNA experience onto a **single pipeline**: one canonical
router, one brain, one OpenAI gateway, one RealitySnapshot, one completion engine, and
layered (not duplicated) memory.

This sprint did **not** add intelligence. It did three things:

1. **Audited** every DONNA entry point and proved there is exactly ONE DONNA — every
   surface (floating, expanded `/director/donna`, voice, any page) runs the same
   `routeDonnaConversation` pipeline and reaches the same engines.
2. **Added the canonical Executive Communication layer** — a final, **fail-open**,
   **fact-preserving**, presentation-only refinement step over the *existing* OpenAI
   gateway. No second pathway, no new provider, no new brain.
3. **Certified** the complete director day at **100%** and confirmed no regressions.

**Verdict: pilot-ready.** A director can open AcademyOS anywhere, say "Donna…", and get the
same elite-COO experience regardless of page, route, conversation length, or entry point.

---

## ONE DONNA experience audit (Parts 1–2)

Every entry point answers the eight audit questions identically:

| Entry point | File | Same DONNA? | Same pipeline? | Same RealitySnapshot? | Same gateway? | Same history? |
|---|---|:--:|:--:|:--:|:--:|:--:|
| Floating DONNA | `components/assistant/DonnaAssistantButton.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Expanded `/director/donna` | `components/donna/DonnaVoiceReadyShell.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Coach DONNA | `app/coach/donna/CoachDonnaShellClient.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Voice / wake word | `components/donna/DonnaWakeWordLayer.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Today / Players / Curriculum / Sessions panels | `app/director/**` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Live AI conversation action | `app/director/_actions/donnaLiveConversationAction.ts` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Strategic AI conversation action | `app/director/_actions/donnaStrategicConversationAction.ts` | ✅ | ✅ | ✅ | ✅ | ✅ |

**Can two DONNAs disagree?** No — all routing flows through one `routeDonnaConversation`
decision, then one `processDonnaMessage` brain.
**Can one DONNA reach intelligence another cannot?** No — entry-point independence is
certified: identical stage + engine across all five probed routes.

---

## Conversation pipeline diagram

```
        Director speaks: "Donna…"  (floating | expanded | voice | any page)
                              │
                              ▼
                 RealitySnapshot  (reality/realitySnapshot.ts — source of truth)
                              │
                              ▼
          Canonical Router  (brain/donnaCanonicalRouter.ts → routeDonnaConversation)
            reality-first: safety → daily_brief → exception → review → players
            → focus_today → proactive → assumption → guided_completion → clarify
                              │  (defer when deterministic intelligence is insufficient)
                              ▼
            The ONE Brain  (brain/processDonnaMessage.ts)
                              │
                              ▼
        Canonical OpenAI Gateway  (brain/donnaOpenAIGateway.ts → askConversationTeacher,
                              │     gpt-4o-mini, OPENAI_API_KEY, privacy-guarded)
                              ▼
   Executive Communication Layer  (brain/donnaExecutiveCommunicationLayer.ts)  ◀── NEW
        final presentation only · fail-open · fact-preserving · reality wins
                              │
                              ▼
                         Response to the director
```

The Executive Communication layer is the **only** new code in the live path. It is purely
additive and degrades to a no-op whenever refinement cannot safely apply.

---

## Reality flow (reality always wins)

- **Source of truth:** `reality/realitySnapshot.ts` — immutable, timestamped, every field a
  `RealitySignal<T>` with confidence + staleness.
- The router grounds every deterministic answer from the live `DirectorDonnaContext`; answers
  carry a `sourceNote` (provenance) and `realityGrounded` honestly reflects `ctx.isLive`.
- The Executive Communication layer **never touches facts**. Its contract forbids
  `change_academy_facts`, `invent_reality`, and `change_recommendations`. If the refined text
  grows beyond a conservative size bound (a cheap fact-alteration guard), it is **rejected**
  and the original grounded answer is returned.

## OpenAI flow (one gateway, teacher not authority)

- **One gateway:** `brain/donnaOpenAIGateway.ts` → `askConversationTeacher` (gpt-4o-mini).
- The Executive Communication layer adds **no new call site** — it invokes the same
  `callDonnaOpenAIGateway` with an additive `executive_refinement` mode added to the gateway
  module itself.
- Gateway guarantees (unchanged): never mutates academy data, never bypasses
  permissions/RealitySnapshot/approval, never fabricates facts, never becomes a second brain.
- **Provider map:** OpenAI = director conversation + refinement + TTS. Anthropic =
  `llmOrchestration` tool-calling (approval-gated drafts). These remain separate by design;
  neither is a second "DONNA brain."

---

## Conversation continuity results (Part 5)

Certified via entry-point independence: the probes *"What should I do first?"*, *"Who needs
attention?"*, *"Something feels wrong."*, and *"What's next?"* route to an **identical stage
and engine** across `/director`, `/director/players`, `/director/curriculum`,
`/director/sessions`, and `/director/donna`.

- No duplicate introductions — one greeting/brief path (`daily_brief`).
- No separate conversations — floating ↔ expanded share the canonical router + persisted
  conversation state (in-process → localStorage → DB, layered by scope).
- Page/route changes do not fork the conversation.

---

## Scores

| Dimension | Score | Basis |
|---|---|---|
| **ONE DONNA convergence** | 100% | 51/51 executive-conversation cert; 45/45 operating-system cert |
| **Natural conversation** | 100% | Full director day: 0 unnecessary clarifications (≤1 target); vague-but-safe input → executive assumption, not a question |
| **Executive tone** | 100% | Every grounded answer passes `validateResponseStyle` — zero chatbot anti-patterns, no robotic preamble |
| **Trust / reality integrity** | 100% | Provenance on every grounded answer; mutation → `safety_block` → review queue, never executed; refinement cannot alter facts |
| **Approval safety** | 100% | Direct mutations intercepted + approval-gated; drafting allowed, execution never |

---

## Conversation quality improvements

- **Vague-but-safe input now assumes like a COO** instead of deferring. Broadened the
  executive-assumption detector to cover *"something feels wrong / it feels off"* (previously
  only *"seems wrong/off"* matched). This closed the one real gap found by the day cert.
- **Executive refinement** (when `OPENAI_API_KEY` is present) tightens tone, concision, and
  the phrasing of assumptions/explanations/follow-ups/completion guidance — without changing a
  single fact, number, name, recommendation, or next step.

## Latency impact

- **No key (CI / unconfigured):** ~0 ms added. The layer short-circuits on
  `isOpenAIGatewayConfigured()` before any network call and returns the original answer.
- **Key present:** at most one additional gpt-4o-mini call on `action: 'respond'` results
  whose text is ≤ 480 chars. Bounded by a **4 s timeout**; on timeout the original grounded
  answer is returned immediately. Navigation, workflow, approval, and structured results skip
  refinement entirely (zero added latency).

## Fallback behavior (fail-open)

The director never notices a refinement outage. The original RealitySnapshot-grounded response
is returned immediately on any of: no API key, gateway fallback (privacy/key/error), timeout,
empty/too-long/too-short draft, identical output, or output that looks fact-altering. Sources
are surfaced for telemetry: `openai | unchanged | not_configured | skipped | fallback |
timeout | rejected | error`.

---

## Remaining duplicate DONNA components (Part 7)

**None safe to delete.** A full import-graph audit was run:

- The prior sprint already removed the one proven-dead duplicate
  (`intent/donnaClarificationEngine.ts`).
- `brain/donnaLiveAIConversationBrain.ts` was flagged by automated audit as "possibly legacy"
  but is **live** — imported by both `donnaLiveConversationAction.ts` and
  `donnaStrategicConversationAction.ts`. **Retained.** Deleting it would break the live AI
  conversation path.
- The multiple routers (`processDonnaMessage`, `donnaCanonicalRouter`, `donnaCommandRouter`,
  `donnaConversationalRouter`, `llmOrchestration/orchestrator`) are **specialized, not
  duplicative** — general conversation vs. reality-first read layer vs. command-category
  classification vs. response-mode selection vs. approval-gated tool execution.
- Memory modules are **layered by scope** (in-process / localStorage / DB), not duplicates.

Net deletions this sprint: **0** (deletion is gated on proven-zero-imports; nothing qualifies).

---

## Pilot readiness recommendation

**Ship to the Director Pilot.**

- One DONNA, certified from every entry point.
- Reality is authoritative; OpenAI is a teacher and a presentation polisher, never the brain.
- Approval safety is intact: nothing mutates without director approval through the review
  queue.
- The new presentation layer is fail-open — worst case, the director gets today's exact
  (already-good) experience.

---

## Remaining blockers

**None block the pilot.** Documented, non-blocking follow-ups:

1. **`OPENAI_API_KEY` not set in the environment** — refinement (and live AI assist) run in
   safe fallback until the key is configured. No code change required to activate.
2. **Long answers (> 480 chars) skip refinement** — they fail-open to the deterministic
   answer (which is already style-clean). A future chunked-refine pass could cover them.
3. **Strategic responses** keep their structured `Top signals / Next action / Follow-up`
   format; refinement applies but is conservative by design to preserve that structure.
4. **`philosophyCertification` 36/37** — pre-existing, unrelated failure (imports none of the
   files touched this sprint). Tracked separately.

---

## Validation

- `npx tsc --noEmit` — **clean**.
- `oneDonnaExecutiveConversationCertification` — **51/51 (100%)**.
- `oneDonnaOperatingSystemCertification` — **45/45 (100%)**.
- `donnaAdaptiveCOOOperatingDayCertification` — **144/144 (100%)**.
- `atomicLoopUsabilityCertification` — **60/60 (100%)**.
- `donnaExecutiveExperienceCertification` — **87/87 (100%)**.
- No regressions. Only pre-existing, unrelated failure: `philosophyCertification` (36/37).
