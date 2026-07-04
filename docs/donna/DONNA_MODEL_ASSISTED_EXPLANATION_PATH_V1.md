# DONNA Model-Assisted Explanation Path V1

**Sprint:** 4362 — Gated OpenAI Provider + Model-Assist for loop-guidance explanations
**Date:** 2026-07-03
**Status:** Adapter + provider + validator + certifications **built and certified**. The live
**runtime wiring is PAUSED pending a decision** (see "Runtime wiring" below). **Off by default.**
**Certs:** Model Safety **146/146** · Model-Assisted Guidance **32/32** · live smoke skips by default.

---

## What this is

DONNA can use OpenAI **only** to rephrase deterministic loop-guidance into more natural language.
It is not automation, not chat, not database access, not action-taking. AcademyOS remains the
source of truth for state, permissions, approvals, visibility, and actions.

**The model produces prose only.** Every structured/safety field — `loopId`, `requiresApproval`,
`visibilityWarning`, `safeNextActions`, `suggestedRoute`, `source`, completion state — is copied
from the **deterministic** answer, never parsed from the model. The model therefore cannot invent
state.

## Flag behavior (off by default)

Enabled only when **both** are true (reusing the existing `isModelAssistEnabled()`):
- `FEATURE_DONNA_MODEL_ASSIST` is set (explicit opt-in), **and**
- `OPENAI_API_KEY` is present.

API-key presence alone does **not** enable it. Missing flag / missing key / provider error /
timeout / invalid or unsafe output / firewall block → **deterministic fallback** (today's answer).
No `.env.local` change is required or made; enabling is a deploy-time env setting.

## The governed OpenAI provider

`src/lib/donna/model/providers/openAIProvider.ts` — the **one** file permitted a network call:
- Calls only when the adapter invokes it and `isModelAssistEnabled()` is true.
- Sends only the firewall-approved payload (system prompt + serialized safe context).
- Bounded: `AbortController` timeout (5s), temperature 0.2, `max_tokens` ≤ 300.
- **No tools, no function-calling, no actions.** Plain-text rephrasing only.
- Throws on any failure → adapter falls back deterministically.

## Model output behavior

Plain-text rephrasing of the deterministic guidance. Validated by `responseValidator.ts` before
use: non-empty, length-bounded (≤ 700 chars), no forbidden PII/secret patterns, and parent/player-
safe. On any validation failure → deterministic fallback.

## Response contract

`ModelAdapterResult`: `message` (model prose when `source:'model_assisted'`, else deterministic),
`confidence` (`medium` when model-assisted, else `high`), `source`, and `loopId` /
`requiresApproval` / `visibilityWarning` / `safeNextActions` / `suggestedRoute` **all from the
deterministic input**. `blockedReason` records why a fallback happened.

## Logging safety

`debug` carries only safe metadata: `provider`, `usedFallback`, `latencyMs`; plus `source` and
`blockedReason` on the result. **Never** logged: prompts, model response text, secrets, raw context,
parent/player fields, guardian contact, coach notes, audit logs.

## Runtime wiring (ACTIVATED — Sprint 4364, flag-gated, off by default)

The model-assist is **not** in `processDonnaMessage` (it is synchronous and called from client
components — `DonnaVoiceReadyShell`, `DonnaAssistantButton` — so it cannot host an async server-side
model call). The activation seam is the async `'use server'` action **`donnaLiveConversationAction.ts`**
(director/head-coach), via the helper **`src/lib/donna/model/loopGuidanceAssist.ts`**.

**SWAP, not add.** After the brain result, for a **loop-guidance question with model-assist enabled**,
the action calls `maybeModelAssistLoopGuidance(...)` and uses the firewalled model rephrasing
**instead of** the general `applyExecutiveRefinement` — so there is **no duplicate OpenAI call**
(§5.1/G6). When the flag is off (default) or the message is not a loop question, the helper returns
`null` and the existing refinement path runs **unchanged** (zero behavior change).

```
const modelAssisted = await maybeModelAssistLoopGuidance({ userMessage, role, route, livePageState }, present)
const legacyResult  = modelAssisted ?? await applyExecutiveRefinement(present, role)
```

The model rephrases prose only; every structured/safety field (`requiresApproval`, `pageIntelligence`,
`action`, navigation) is copied from the grounded result. Deterministic fallback is guaranteed by
`runModelAssist`. `DonnaVoiceReadyShell` and `donnaStrategicConversationAction` are **untouched** this
sprint (strategic is a documented follow-up).

> **Clarification:** "flag off" does not mean "no model." The general executive refinement
> (`applyExecutiveRefinement`) remains **key-gated** and independent. `FEATURE_DONNA_MODEL_ASSIST`
> gates only the **loop-specific firewalled** path.

## Certification

- `modelSafetyCertification.ts` (**146/146**) — non-provider files network-free; the OpenAI provider's
  call is governed (timeout, key check, flag gate) and tool-free; no model file can mutate; firewall
  allowlist; all 10 loops safe; debug carries no PII.
- `modelAssistedGuidanceCertification.ts` (**32/32**, offline via injected stub) — valid rephrasing
  keeps structured fields deterministic; unsafe/empty/oversized/throwing/unavailable → fallback;
  firewall-blocked context never reaches the provider; action phrases never classify as loop
  questions; off-by-default → deterministic.
- `liveLlmSmokeTest.ts` — secret-gated (`RUN_LIVE_LLM_SMOKE=1` + key), synthetic context only,
  skips by default. Scripts: `npm run certify:model`, `npm run test:llm-smoke`.

## Waits for Sprint 4363

Migrating the scattered provider call sites onto this adapter; retiring `donnaOpenAIGateway`;
memory/learning; broader conversation; any model-for-decisions/tools/writes.
