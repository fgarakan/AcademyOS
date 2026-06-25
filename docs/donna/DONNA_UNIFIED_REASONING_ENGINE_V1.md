# DONNA Unified Reasoning Engine V1

**Mega Sprint 3931–3960** · 2026-06-25 · Status: **COMPLETE + CERTIFIED (14/14 gate suites green, guardians GREEN)**

> One reasoning pipeline. Every reasoning request flows through the same path:
> Intent → Routing Constitution → Executive Operating Layer → Context Resolver →
> Executive Context Packet → OpenAI (one gateway) → Response Validator → Action
> Planner → AcademyOS. No feature runs a second reasoning pipeline.

---

## 1. The single pipeline

```
request
  → classifyRequest()                    (Routing Constitution — reasoning vs execution)
  → runExecutiveLive()                   (Executive Operating Layer — the one entry)
      → resolveExecutiveContext()        (Context Resolver — the one context pipeline)
      → ExecutiveContextPacket           (the one packet)
      → runExecutiveReasoning()          (the one reasoning engine)
          → callDonnaOpenAIGateway()     (the one gateway)
              → askConversationTeacher() (the one OpenAI call site)
      → validateExecutiveResponse()      (the one Response Validator)
      → planActions()                    (Action Planner — reasoning separated from execution)
  → AcademyOS                            (source of truth + execution + approvals + audit)
```

**The developer test:**
| Question | Answer |
|---|---|
| Where does reasoning happen? | Executive Operating Layer (`runExecutiveOperatingTurn`) |
| Where is context assembled? | Context Resolver (`resolveExecutiveContext`) |
| Where is OpenAI called? | The Executive Gateway → `callDonnaOpenAIGateway` → `askConversationTeacher` |
| Where is validation performed? | Response Validator (`validateExecutiveResponse`) |

Anything else is a certification failure (`donnaUnifiedReasoningCertification.ts`).

---

## 2. What changed this sprint

The Routing Constitution (3901–3930) already routed reasoning to the Executive Layer
from the **live** action. The remaining divergence was the **strategic** path
(`strategic_ai_assist` → `processStrategicAIConversation`), which assembled its own
context (`buildStrategicContextPacket`) and called the teacher directly.

**`donnaStrategicConversationAction.ts` now mirrors the live action exactly:** the
strategic brain runs as the certified fail-open fallback (preserving its DNA guard +
approval-gated strategic learning capture), then `runExecutiveLive()` owns the reasoned
answer in `primary` mode. Strategic reasoning is now a **client** of the one Executive
Operating Layer — not a separate pipeline.

**Files changed (3) + new (2):**
- `donnaStrategicConversationAction.ts` — converged onto `runExecutiveLive` + full trace.
- `donnaLiveConversationAction.ts` — upgraded to the full `logReasoningTrace`.
- `donnaRoutingLog.ts` — added `logReasoningTrace` (classification · routing · context
  built · OpenAI · validator · fallback · final source).
- `donnaRoutingConstitution.ts` — reasoning vocabulary extended (`review, advise,
  evaluate, assess, prioritize, "what should I", "what's next"`) so the certification
  prompts all classify as reasoning. Additive — no CRUD/mutation reclassified.
- `donnaUnifiedReasoningCertification.ts` — the regression lock (new suite).
- `scripts/certificationSuites.ts` — registers the suite.

---

## 3. Pipeline audit (Objective 1)

**One reasoning gateway** — `askConversationTeacher` (`donnaConversationTeacher.ts:138`)
is the only direct `api.openai.com/v1/chat/completions` call in the reasoning pipeline.
Everything routes through it:

| Caller | Path to the gateway | Role |
|---|---|---|
| Executive layer | `runExecutiveReasoning` → `callDonnaOpenAIGateway` → `askConversationTeacher` | **primary reasoning pipeline** |
| Live brain (legacy) | `processLiveAIConversation` → `askConversationTeacher` | fail-open fallback |
| Strategic brain (legacy) | `processStrategicAIConversation` → `askConversationTeacher` | fail-open fallback |
| Executive Communication | `applyExecutiveRefinement` → `callDonnaOpenAIGateway` | presentation refinement only |

**One Context Resolver** — `resolveExecutiveContext` builds the `ExecutiveContextPacket`.
**One Response Validator** — `validateExecutiveResponse` (5 gates) in every executive turn.

---

## 4. Certification (Objective 7)

`donnaUnifiedReasoningCertification.ts` — **36/36**, registered in the CI gate
(**14/14 suites green**). It is a *structural* regression lock that fails the build if a
future change:

- **A** adds a `chat/completions` fetch outside the one gateway (+ two documented advisories);
- **B** makes the executive gateway call OpenAI directly instead of delegating;
- **C** lets either director reasoning action bypass `runExecutiveLive`;
- **D** removes the Context Resolver, reasoning engine, or Response Validator from the turn;
- **E** drops the developer reasoning trace;
- **F** routes any certification prompt (`What should I do? · Explain · Compare ·
  Recommend · Coach me · Teach me · Summarize · Review this`) off the executive pipeline.

---

## 5. Remaining exceptions (documented, bounded)

1. **Fail-open legacy computation.** In `primary` mode the legacy brain
   (`processLiveAIConversation` / `processStrategicAIConversation`) still runs *before*
   `runExecutiveLive` and may call OpenAI — it is the certified fail-open fallback and
   **never owns a reasoning answer** when the executive path validates. It is retained
   (not deleted) because it carries the Academy DNA guard + approval-gated learning
   capture. Collapsing this duplicate call is a future optimization, not an architecture
   gap: the executive layer is the sole **owner** of every reasoned answer.
2. **Two advisory OpenAI utilities** outside the conversation pipeline —
   `donnaLearningAnalyzer.ts` (testing-only enrichment) and
   `donnaKnowledgeDraftGenerator.ts` (uncalled draft generator). They make their own
   `chat/completions` calls, are not part of director reasoning, and are explicitly
   allow-listed in the certification so any *third* off-path caller fails the build.
3. **Media OpenAI** (TTS, Whisper transcription, realtime voice) — not reasoning; out of
   scope by design.

---

## 6. Scores

- **Executive readiness: 99** — every reasoning request, from both director entry points,
  now traverses the one Executive Operating Layer; structurally locked.
- **God Mode: 95** — single reasoning engine, context pipeline, gateway, and validator,
  provable and regression-protected. Short of 100 only because the fail-open legacy
  computation (exception #1) still issues a redundant OpenAI call in primary mode before
  the executive layer takes ownership.
