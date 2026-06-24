# DONNA Live Executive Activation Certification V1

**Mega Sprint 3811–3840** · 2026-06-24 · Verdict: **PASS (engine)** with **one production-activation gap**

> Mission: prove a real Director message reaches
> `User → Router → Brain → Executive Operating Layer → Context Packet → OpenAI → Validator → UI`,
> and that the Executive Layer — not a legacy engine — owns the answer.

This is a **certification**, not a build. No architecture was added. One throwaway live
trace runner was written (`scripts/liveExecutiveActivationTrace.ts`).

---

## What was proven, and how

The trace runner invokes the **exact** function the live sidebar action invokes —
`runExecutiveLive()` (the call at `donnaLiveConversationAction.ts:159`) — with
`DONNA_EXECUTIVE_REASONING=primary` and a present `OPENAI_API_KEY`, making **real HTTP
calls to `api.openai.com` (gpt-4o-mini)**. Nothing in the executive path is mocked or
re-implemented. Instrumentation (`openaiInstrumentation.ts`, `executiveShadowMode.ts`) is
the in-process recorder the production code already writes to.

**Honest scope:** this is a live-action trace of the **real production engine + real
OpenAI API**, not a browser-DOM click. Supabase auth + the upstream legacy computation
(`processLiveAIConversation`) sit *before* the executive layer and were supplied as a
representative fail-open `legacy` result — exactly the role they play at runtime, since
the action runs `runExecutiveLive` **unconditionally** in `primary` mode regardless of
what the brain/legacy produced (`donnaLiveConversationAction.ts:154–166`). To reproduce
in the browser, set the flag (below), restart `next dev`, log in as a director, and type
into the sidebar — the same `runExecutiveLive` executes.

---

## Objective 1 + 2 — Live execution traces (7 real Director messages)

Every turn: `executive mode=primary · executive invoked=YES · context packet built=YES ·
OpenAI invoked=YES (source=openai) · model=gpt-4o-mini · fallback=NO · validator=accepted ·
executive path used=YES · final source=OpenAI/Executive Layer · legacy leaked=NO`.

| # | Message | Router (1.6) | Brain (2.5) | Goal | Packet | OpenAI | Latency | Validator | Owner |
|---|---------|--------------|-------------|------|--------|--------|---------|-----------|-------|
| 1 | Good morning Donna. | operating_session¹ | classify=NO² | analyze | 4 src / 85 tok | openai, 354 resp tok | 1384ms | accepted | Executive |
| 2 | What should I do today? | executive_reasoning | classify=YES | recommend | 4 / 97 | openai, 361 | 1509ms | accepted | Executive |
| 3 | What should I focus on? | executive_reasoning | classify=YES | recommend | 4 / 97 | openai, 356 | 1500ms | accepted | Executive |
| 4 | Help me complete onboarding. | executive_reasoning | start_goal_session² | analyze | 4 / 87 | openai, 348 | 1281ms | accepted | Executive |
| 5 | Do I have onboarding completed already? | defer_to_brain | classify=NO² | analyze | 4 / 90 | openai, 344 | 1214ms | accepted | Executive |
| 6 | Why are you recommending that? | executive_reasoning | classify=YES | diagnose | 4 / 88 | openai, 353 | 1441ms | accepted | Executive |
| 7 | What else do I need to do? | executive_reasoning | classify=YES | analyze | 4 / 87 | openai, 352 | 1419ms | accepted | Executive |

¹ Router Step 1.6 is consulted but the **action layer** (`runExecutiveLive` in `primary`)
is the unconditional activation point, so even classifier non-matches (1, 5) still get a
real executive OpenAI answer. ² Brain action shown where the brain ran with full input;
classifier non-match does **not** stop activation at the action layer.

Raw proof lines (per turn), e.g.:
```
[donna.openai] goal=recommend model=gpt-4o-mini source=openai disposition=accepted ctxTokens=97 ctxSources=4 respTokens=361 latencyMs=1509 confTarget=0.8
[donna.executive] "What should I do today?" — mode=primary openaiInvoked=YES realCall=YES model=gpt-4o-mini goal=recommend packetTokens=97 sources=4 latencyMs=1509 disposition=accepted fallbackUsed=NO executivePathUsed=YES
```

---

## Objective 3 — Response ownership audit

In `primary`, when the executive response validates, **the Executive Layer owns the final
UI text** (`executiveLiveBridge.mapTurnToResult` sets `response = turn.finalResponse`).
All 7 turns: **OpenAI/Executive Layer**. Legacy (Workflow Router / Deterministic Engine /
Goal Engine / Template Collector) is computed first but only returned as fallback — it
owned **0/7**.

Ownership decision points:
- **OpenAI** generates the text (`runExecutiveReasoning → callDonnaOpenAIGateway → askConversationTeacher`).
- **Executive Layer** owns structure, validation, completion (`runExecutiveOperatingTurn`).
- **Legacy** wins only if the executive turn crashes or the validator **rejects**.

---

## Objective 4 — Legacy interception findings

"Would you like…" / "I think you're trying to…" / "describe what you need" / "please
choose an option" phrasings exist in ~10 deterministic engines: `donnaWhatNextEngine`,
`donnaDailyGreeting`, `workflows/donnaWorkflowRegistry`, `workflows/curriculumImprovementWorkflow`,
`guidance/donnaTodayGuidanceLoop`, `reasoning/donnaConversationQualityEngine`,
`donnaMissingContextEngine`, `donnaUIGuidedOperators`, `curriculumBuilderOperator`,
`donnaGoalCompletionModel`.

**These are suppressed in `primary`** by two independent guards:
1. **Ownership** — the executive response replaces the legacy `response` when it validates.
2. **Validator Step 2.5** (`responseValidator.ts:76–98`) — even if OpenAI itself emitted a
   menu / "I think you're trying to…" / generic clarification, when context exists the
   validator **rewrites** it to grounded executive guidance (`disposition=modified`),
   never passing the legacy pattern to the director.

Live result: **0/7 turns leaked** a legacy phrase.

**However** — with the flag `off` (current production state), the action returns
`legacyResult` directly (`donnaLiveConversationAction.ts:155–157`) and these phrases reach
the director. The legacy phrasing is only neutralized **while the flag is on.**

---

## Objective 5 — Activation proof

With `DONNA_EXECUTIVE_REASONING=primary` set in-process before any module read it:
- `resolveExecutiveMode()` → `primary`
- `isExecutiveReasoningEnabled()` → `true`
- **Router Step 1.6** (`donnaCanonicalRouter.ts:195`) → `executive_reasoning` stage for matching turns
- **Brain Step 2.5** (`processDonnaMessage.ts:740`) → `live_ai_assist` for classifier matches
- **Action Layer** (`donnaLiveConversationAction.ts:154–166`) → `runExecutiveLive` invoked
- **Executive Operating Layer** → real OpenAI + validator, all 7 turns

---

## Root causes / the one real gap

**The committed runtime does not activate the executive layer.** `.env.local` contains
**no `DONNA_EXECUTIVE_REASONING`** (and it is in no committed env example). So
`resolveExecutiveMode()` returns `off` in the actually-running app, the action returns
`legacyResult`, and the Director is served by the legacy/deterministic engines (with their
"Would you like…" phrasing). The executive engine is **fully built, wired, and proven —
but dormant.** Certs ≠ live behavior until the flag is set.

---

## Recommended fixes

1. **Activate (decision required):** set `DONNA_EXECUTIVE_REASONING=primary` in the
   deployment env (or `shadow` first to log executive-vs-legacy diffs with zero user
   impact). Restart — not hot reload (`resolveExecutiveMode` reads `process.env`).
2. **De-risk before primary:** run `shadow` in the pilot env for a day; review
   `getShadowRecords()` differences and `getOpenAICallLog()`.
3. **Cost/latency:** primary makes up to **two** OpenAI calls per director turn (legacy
   `live_ai_assist` + executive). If cost matters, short-circuit the legacy OpenAI call
   when mode is `primary` (legacy text is only a fallback). ~1.2–3.9s observed latency.
4. **Don't commit secrets:** keep the flag in deployment config, not `.env.example`.

---

## Scores

| Score | Value | Basis |
|---|---|---|
| **Executive readiness** | **98 / 100** | Engine proven end-to-end with real OpenAI; −2 for double-OpenAI cost in primary. |
| **Live DONNA (as-deployed)** | **40 / 100** | Engine works, but flag is `off` in committed env → director is served by legacy engines today. |
| **God Mode (updated)** | **88 / 100** | Spine converged + executive engine live-certified; capped until the flag is actually set in the running app and validated in-browser. |

**Certification verdict:** the Executive Layer **is capable of serving the Director with
real OpenAI reasoning, end-to-end, with no legacy engine replacing it** — proven on 7 real
messages. It is **not serving the Director in the committed runtime** because the
activation flag is unset. One env decision closes the gap.
