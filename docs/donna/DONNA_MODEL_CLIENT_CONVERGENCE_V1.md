# DONNA Model Client Convergence V1

**Sprint:** 4363 — Unified DONNA Model Client Convergence (narrow migration)
**Date:** 2026-07-03
**Status:** The primary active OpenAI chat path is converged onto the one governed provider.
**Certs:** Model Convergence **13/13** · Model Safety **146/146** · Model-Assisted Guidance **32/32** ·
Loop Guidance Wiring **38/38** · Atomic Loop **60/60**. Off by default; no runtime behavior change.

---

## What converged

`src/lib/donna/conversation/donnaConversationTeacher.ts` — the OpenAI chat call behind
`callDonnaOpenAIGateway` / `applyExecutiveRefinement` — **no longer makes a direct `fetch`**. Its
`callOpenAI` now routes through **`OpenAIProvider.generate`**, the single governed OpenAI boundary.

**Behavior preserved (equivalence):** same model (`gpt-4o-mini`), same `temperature: 0.3` (now passed
per-call via the new optional `AIGenerateParams.temperature`), same `max_tokens` (≤300, within the
provider's cap), same key gating, and the same fail-open fallback — the teacher keeps its
`privacyGuard`, its `OPENAI_API_KEY` gate, and its `buildFallbackResult` catch. The only incidental
improvements: the provider's 5s `AbortController` timeout (the outer executive layer's 4s still
dominates the refinement path) and an empty-response now falls back instead of surfacing empty text.

## Why executive refinement stays on its own privacyGuard (temporary caveat)

Executive refinement sends **grounded answers that legitimately contain player first names**
(RealitySnapshot content). The loop-guidance **allowlist** context firewall would refuse/strip that
content — so routing executive refinement through the allowlist firewall now would be a **behavior
change** (blocked legitimate content). Therefore Sprint 4363 converges the **provider / network
boundary only**; executive refinement keeps its existing `privacyGuard`. **"One firewall for all
model paths" is deferred** until the right context shape is designed (post-4364).

## Enablement (unchanged)

- **Executive refinement:** key-gated (`OPENAI_API_KEY`), fail-open — as before.
- **Loop-guidance model-assist:** `FEATURE_DONNA_MODEL_ASSIST` + key, **off by default** — as before.
- The two use cases **share the governed provider** but keep **different enablement policies**. The
  provider's `generate()` needs only a key; `isAvailable()` (the flag gate) is the loop-guidance policy
  and is not on the refinement path. **No env file changed.**

## Provider paths still OUTSIDE the adapter (deferred to Sprint 4364)

- `learning/donnaLearningAnalyzer.ts` — direct OpenAI (learning). **Deferred.**
- `knowledgePromotion/donnaKnowledgeDraftGenerator.ts` — direct OpenAI (knowledge drafts). **Deferred.**
- `llmOrchestration/llmApiClient.ts` — Anthropic tool-calling orchestrator. **Deferred.**
- `ai/structureCoachNote.ts` — Anthropic via `aiReasoningProvider`. **Deferred.**
- `executive/executiveReasoningGateway.ts`, `brain/donnaCanonicalRouter.ts` — gateway users
  (executive reasoning dormant behind `DONNA_EXECUTIVE_REASONING=off`). **Reconcile in 4364.**
- **Audio/realtime** (`api/.../transcribe` Whisper, `api/donna/tts`, `api/.../realtime-session`, the
  two realtime hooks) — a **separate modality**, not the text adapter; likely stays a distinct boundary.
- **`donnaOpenAIGateway.ts`** — still used by the paths above; **retire only when unused** (4364).

The convergence cert lists the two deferred direct-OpenAI files explicitly, so the "single client"
claim is honest and scoped, not falsely green.

## Certification

- `modelConvergenceCertification.ts` (**13/13**, offline): teacher imports/uses `OpenAIProvider`; no
  direct `api.openai.com`/`fetch(` remains in the teacher; `privacyGuard` / key gate / `buildFallbackResult`
  / `temperature: 0.3` preserved; **no-key → deterministic fallback** (offline, no network); high
  confidence → not called; deferred files documented.
- Regression: Model Safety, Model-Assisted Guidance, Loop Guidance Wiring, Atomic Loop — all green.

## Waits for Sprint 4364

Migrate the deferred OpenAI/Anthropic paths onto the adapter; reconcile the gateway users; **retire
`donnaOpenAIGateway`** once unused; design and adopt one unified context firewall for all text-model
paths; decide the audio-boundary policy.
