# ONE DONNA Operating System Convergence V1 — Report

**Mega Sprint 3271–3300**
**Date:** 2026-06-20
**Scope:** Convergence + consolidation. No new intelligence engines, no new orchestration layer, no second brain, no migration. Pure TypeScript wiring + one deletion.

---

## Summary

The audits proved the problem was not missing intelligence — it was **fragmentation**: the floating DONNA (on every page) ran a thin path, while the rich engines lived only behind `/director/donna`. This sprint converges them onto **one canonical routing decision** and **one documented OpenAI gateway**, brings the floating DONNA up to full parity, and removes a dead duplicate.

- **`oneDonnaOperatingSystemCertification.ts`: 45/45 — 100% CERTIFIED.**
- `npx tsc --noEmit`: clean.
- DONNA cert suite: 31/32 (the 1 failure is the pre-existing, unrelated `philosophyCertification`).

---

## Current → final architecture

**Before**
- Floating DONNA (`DonnaAssistantButton`, every director page) → `directorNextActionEngine` + `processDonnaMessage` only. No rich Today/focus/assumption/players/review answers.
- `/director/donna` (`DonnaVoiceReadyShell`) → a 30-rung ladder reaching all the rich engines.
- OpenAI reached via `donnaConversationTeacher` with no single documented entry; provider/key split undocumented.
- A dead duplicate `intent/donnaClarificationEngine` (zero real imports).

**After**
- **One canonical router** (`donnaCanonicalRouter.routeDonnaConversation`) is the single routing decision. The floating DONNA now calls it and reaches the same rich engines as `/director/donna`.
- **One documented OpenAI gateway** (`donnaOpenAIGateway`) names the existing teacher as THE OpenAI entry, with an explicit contract.
- Dead duplicate removed.

---

## Conversation pipeline (the one pipeline)

```
Director speaks
  ↓
Canonical router  (donnaCanonicalRouter.routeDonnaConversation)
  ↓ 1. Safety / permission   → tryDirectorClarificationOrBlock (blocked → review queue, never executed)
  ↓ 2. Reality-grounded engines (require live DirectorDonnaContext):
        • review            → donnaReviewQueueAnswer
        • players/attention → directorPlayersDonnaIntelligence
        • focus today       → focusTodayAnswerEngine
        • proactive/blocking→ focusTodayAnswerEngine.proactive
        • completion        → defer to the one brain's guided/goal completion
  ↓ 3. Executive assumption  → buildExecutiveAssumptionAnswer (vague-but-safe)
  ↓ 4. Clarify (only if required for data integrity)
  ↓ 5. Defer to the one brain (processDonnaMessage) → OpenAI gateway only if deterministic insufficient
  ↓
Permission validation (router never mutates; drafts are approval-gated)
  ↓
Response  → Guided completion → Reality update
```

Every entry point that calls `routeDonnaConversation` inherits this pipeline identically (proven by the certification across 5 routes).

## Reality flow (reality-first)

`RealitySnapshot / live DirectorDonnaContext → engine answer (carries sourceNote + confidence) → realityGrounded flag`. When context is absent or not live, the router defers to the brain, which carries its own `[Demo]`/insufficient-data honesty. DONNA never fabricates: null ≠ zero; missing reality is stated, not guessed.

## Routing flow

One function, one ordered decision (above). The floating DONNA inserts it as an **additive, fall-through pre-check** before its existing brain call — when no deterministic engine matches, behavior is unchanged (defers to the brain). No reduced experience anywhere.

## Completion flow

Completion intents (`take me to completion`, `walk me through`, `done`, `finish this`) route to `stage: 'guided_completion'` and defer to the **single** brain, which runs the existing GuidedCompletion / GoalCompletion engines. One completion engine, shared by all surfaces.

## OpenAI flow (one gateway)

```
Deterministic engines insufficient (low confidence)
  → donnaOpenAIGateway.callDonnaOpenAIGateway  (delegates to askConversationTeacher, gpt-4o-mini)
  → OPENAI_API_KEY gate; absent → safe fallback (no silent intelligence loss, no crash)
  → text only; never mutates, never bypasses approval/permissions/RealitySnapshot, never a second brain
```
**Provider map (documented):** OpenAI = live conversation reasoning + learning extraction + TTS (`OPENAI_API_KEY`). Anthropic = `llmOrchestration` tool-calling for multi-step drafts (`ANTHROPIC_API_KEY`) — a separate, approval-gated tool path, not a second DONNA brain. The director **conversation** pipeline uses the OpenAI gateway.

## Engines merged / consolidated

- **Routing** — the rich routing ladder is now expressed once in `donnaCanonicalRouter` (reused by the floating DONNA; `/director/donna` retains its tuned ladder calling the same engine functions).
- **OpenAI** — one named gateway over the existing teacher (no new call site).
- **Executive assumption** — `buildExecutiveAssumptionAnswer` (previously orphaned/cert-only) is now **live** via the canonical router; its detector was broadened to cover `this seems wrong`, `I'm confused`, `what am I missing`, `what would Brian do`, `explain that simply`.

## Engines removed

- **`src/lib/donna/intent/donnaClarificationEngine.ts`** — deleted. Proven zero real imports repo-wide (only a comment referenced it); tsc clean and certifications pass after removal. (This was where the 3211–3240 clarification-prefix edit landed — confirming that edit was on dead code. The **live** `directorClarificationEngine` already uses specific, premium questions, so no language port was needed.)

## Duplicate engines remaining (documented; not removed this sprint)

Removing these requires runtime testing of the giant client ladders, deferred to avoid regressions:
- Two attention engines (`operations/academyAttentionEngine`, `proactive/academyAttentionEngine`).
- Two proactive-alerts files (`coo/donnaProactiveAlerts`, root `donnaProactiveAlerts`).
- Multiple dead COO daily/weekly loops (`coo/donnaDailyCooIntelligenceEngine`, `coo/dailyReflectionEngine`, `donnaDailyOperatingLoop`, `donnaWeeklyOperatingLoop`).
- `/director/donna` (`DonnaVoiceReadyShell`) still runs its own 30-rung ladder instead of delegating to `routeDonnaConversation` (same engines; full delegation is a safe, runtime-tested follow-up).

## Conversation examples (floating DONNA, now)

- **"What should I do today?"** → `focus_today` → `focusTodayAnswerEngine` (5-field reality-grounded answer).
- **"Who needs attention?"** → `players` → `directorPlayersDonnaIntelligence`.
- **"What is blocking us?"** → `proactive` → proactive notice.
- **"This seems wrong." / "I'm confused." / "What would an elite COO do?"** → `assumption` → executive COO assumption (no generic clarification).
- **"Take me to completion." / "Walk me through it."** → `guided_completion` → the one brain's completion loop.
- **"Move this player up now."** → `safety_block` → routed to the review queue; never executed.
- Unmatched → `defer_to_brain` → OpenAI gateway only if deterministic intelligence is insufficient.

## Safety / approval guarantees

- Router never mutates (`ONE_DONNA_CONTRACT.neverMutates`). Unsafe/mutation requests → `safety_block` → review queue.
- OpenAI gateway is text-only and contract-bound (no mutate, no approval bypass, no reality bypass, no fabrication, not a second brain).
- Floating-DONNA wiring is additive + fall-through: zero behavior change when no engine matches.

## Remaining blockers

1. `/director/donna` full delegation to the canonical router (deferred — needs runtime testing of its 30-rung ladder to avoid reordering regressions like the `who-is-stalled` intelligence/roster overlap).
2. Floating DONNA's **voice** path (`handleVoiceTranscript`) still uses the older ladder; only the typed/submit path (`handleCommandSubmit`) gained the canonical pre-check. Routing voice through `handleCommandSubmit` is a safe follow-up.
3. Durable learning persistence (in-memory only) — out of scope here; remains the migration-gated sprint proposed previously.

## Next sprint recommendation

**"ONE DONNA Convergence V2 — Shell Delegation & Voice Unification" (wiring only):** route `/director/donna` and the floating voice path through `routeDonnaConversation` (with runtime verification of the existing ladder), then retire `DonnaVoiceReadyShell`'s duplicate rungs. Follow with the previously-proposed **persistent learning migration** sprint.
