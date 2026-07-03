# DONNA Model Adapter + Context Firewall V1

**Sprint:** 4361 — OpenAI / Model Adapter + Context Firewall V1
**Date:** 2026-07-03
**Status:** Build-and-certify only. **No runtime model calls. No network. Not wired into `processDonnaMessage`.**
**Certification:** `src/lib/donna/certification/modelSafetyCertification.ts` — **128/128 checks (100%)**

---

## Purpose

Establish the safe boundary that will one day let DONNA reason through an external model —
**built and certified before any live model behavior exists.** The model can never see private
data, never mutate records, and never bypass approvals. In this sprint the adapter always returns
the deterministic answer; the provider's `generate()` is never invoked.

```
Deterministic AcademyOS context (loop knowledge + page intelligence + role)
      │
      ▼
Context Firewall  (ALLOWLIST DTO — only safe fields; refuses anything else)
      │
      ▼
Model Adapter  (the one governed client: firewall gate → provider select → fallback)
      │
      ▼
Provider (behind AIReasoningProvider)  →  NullProvider (V1 default, unavailable)
                                          OpenAIProvider (scaffold, unavailable, no network)
      │
      ▼
Response Contract (source-tagged; advisory only) → DONNA brain/UI → human approval
```

## Files (Sprint 4361)

| File | Role |
|---|---|
| `src/lib/donna/model/modelTypes.ts` | `ModelProvider` (extends existing `AIReasoningProvider`), `ModelSafeContext`, allowlist + forbidden patterns, response contract, system prompt constant |
| `src/lib/donna/model/contextFirewall.ts` | `buildModelSafeContext` (allowlist builder), `assertModelSafeContext`, `serializeModelContext` (injection-hardened) |
| `src/lib/donna/model/modelAdapter.ts` | `runModelAssist` (firewall gate → provider → deterministic fallback), `createModelProvider` |
| `src/lib/donna/model/providers/nullProvider.ts` | Call-free default provider — `isAvailable()` always false |
| `src/lib/donna/model/providers/openAIProvider.ts` | **Scaffold only** — interface-conformant, no SDK, no `fetch`, `isAvailable()` false |
| `src/lib/featureFlags/featureFlags.ts` | `isModelAssistEnabled()` — double-gated (flag + key), OFF by default |
| `src/lib/donna/certification/modelSafetyCertification.ts` | Behavioral + static safety cert |

**Reused, not duplicated:** the provider interface is the existing `src/lib/ai/aiReasoningProvider.ts`
(`AIReasoningProvider`) — the Constitution's model-agnostic swap point (§5.8). No parallel abstraction
was created.

## Context Firewall — allowed / blocked

**Allowed (the only fields ever constructed into `ModelSafeContext`):** `userRole`, `academyRoleLabel`,
`route`, `loopId`, `loopName`, `loopKnowledgeSummary`, `pageGuidanceSummary`, `completionSummary`,
`missingStateSummary`, `safeNextActions`, `approvalRequirement`, `visibilityWarning`, `userQuestion`
(length-capped, treated as untrusted).

**Blocked (never fetched into the DTO):** raw parent/player records, guardian email/phone, raw coach
notes, audit-log contents, full player histories, internal evidence text, service-role results,
cross-academy data, secrets/env vars, raw DB rows, unrestricted query output.

It is an **allowlist** — private data is never read into context, so it cannot leak. `assertModelSafeContext`
is belt-and-suspenders: it rejects any non-allowlisted key and scans for forbidden patterns (email,
phone, DOB, guardian contact, `audit_logs` identifier, `service_role`, raw coach-note / assessment-score
markers). The English phrase "recorded in the audit log" is safe governance language and is allowed;
the sensitive identifier `audit_logs` is not.

## Model usage rules

**May (Sprint 4362+):** natural conversation, explain why a loop matters, summarize safe loop context,
rephrase deterministic guidance, prioritize safe next steps, answer "what next?" / "why?", draft
non-published text.
**May NOT (ever):** write to the database, approve actions, move player levels, publish parent/player
updates, bypass RLS, invent system state, claim completion unless the deterministic completion summary
says so, expose restricted data, contact anyone, or create evidence.

## Response contract

`ModelAdapterResult`: `message`, `confidence` (`low|medium|high`), `source` (`deterministic|model_assisted`,
defaults deterministic), optional `loopId`, `safeNextActions`, `requiresApproval` (informational — never
triggers approval), `visibilityWarning`, `suggestedRoute` (suggestion only), `blockedReason`, and `debug`
(safe metadata only: `provider`, `usedFallback`, `latencyMs`).

## Provider & fallback strategy

- **OpenAI first when enabled** (`isModelAssistEnabled()` = `FEATURE_DONNA_MODEL_ASSIST` set **and**
  `OPENAI_API_KEY` present) — otherwise `NullProvider`. In Sprint 4361 **both providers are unavailable**,
  so no model is ever called.
- Behind the `AIReasoningProvider` interface → model-agnostic; swapping/adding a provider is config.
- **No hard dependency in core DONNA:** `processDonnaMessage` does not import the adapter in 4361.
- **Fallback:** unavailable / firewall-block / (future) error/timeout → deterministic answer tagged
  `source:'deterministic'`, `usedFallback:true`; no crash, no lost action.

## Why this is provably call-free

- `NullProvider` and `OpenAIProvider` import only **types** from `aiReasoningProvider` — no SDK at runtime.
- Neither contains `fetch`, `api.openai.com`, `new OpenAI`, or any network path (static-scanned by the cert).
- Both `isAvailable()` return **false**, so `runModelAssist` never calls `generate()`.
- The adapter imports no Supabase client, no `proposed_actions`, no service role (static-scanned) →
  structurally cannot mutate.

## What waits for later sprints

- **Sprint 4362:** implement `OpenAIProvider`'s real, governed call (timeout, budget, retry, usage log,
  kill switch); wire **one** flag-gated, off-by-default model-assisted *explanation* path into Step 7.65
  with the deterministic fallback proven; add a nightly secret-gated live-LLM smoke test.
- **Sprint 4363:** broader model-assisted conversation; migrate the ~5 existing scattered provider call
  sites onto this one adapter (converge-by-deletion); retire `donnaOpenAIGateway` as a nominal wrapper.
