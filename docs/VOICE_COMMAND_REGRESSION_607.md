# Voice and Command Regression — Sprint 607

**Date:** 2026-05-17
**Sprint:** 607 — Voice and Command Regression V1
**No code mutation in this sprint. Regression audit only.**

---

## Scope

Regression check on all DONNA command-layer files built in Sprints 591–598.

---

## Files Audited

| File | Sprint | Type | DB Write? | External Call? | Execution? |
|---|---|---|---|---|---|
| `src/lib/donna/donnaCommandRouter.ts` | 591 | Pure TS | No | No | No |
| `src/lib/donna/donnaIntentClassifier.ts` | 592 | Pure TS | No | No | No |
| `src/components/donna/DONNACommandPreviewCard.tsx` | 593 | UI | No | No | No |
| `src/components/donna/DONNACommandClarification.tsx` | 594 | UI | No | No | No |
| `src/components/donna/DONNACommandConfirmation.tsx` | 595 | UI | No | No | No |
| `src/components/donna/DONNACommandRejectionBanner.tsx` | 596 | UI | No | No | No |
| `src/lib/donna/donnaSessionMemory.ts` | 597 | Module store | No | No | No |
| `src/lib/donna/donnaMultiStepFlow.ts` | 598 | Pure TS | No | No | No |

---

## Key Safety Checks

### Command Router (`donnaCommandRouter.ts`)
- `routeDonnaCommand(category)` returns `DonnaRouteResult` — a data object, not an action
- `DONNA_ROUTING_INVARIANTS` constants explicitly encode safety rules
- No imports from Supabase, Next.js server, or external services
- ✅ Safe

### Intent Classifier (`donnaIntentClassifier.ts`)
- Keyword-matching only — no AI API calls
- Returns `IntentClassificationResult` — a data object
- No DB reads or writes
- ✅ Safe

### Command UI Components (593–596)
- All `'use client'` — client-only
- `onProceed`, `onConfirm`, `onSelect`, `onRetry` are callback props — no direct DB access
- No `import` from server actions or Supabase within these files
- ✅ Safe

### Session Memory (`donnaSessionMemory.ts`)
- Module-level store — `let _entries: SessionMemoryEntry[]`
- No Supabase client, no server imports
- Resets on page reload
- ✅ Safe (intentionally ephemeral)

### Multi-Step Flow (`donnaMultiStepFlow.ts`)
- Pure state machine — `transitionFlow(state, event)` returns new state
- No side effects
- ✅ Safe

---

## Command Flow Safety Invariants

| Invariant | Status |
|---|---|
| Intent classifier never calls external AI | ✅ Keyword matching only |
| Command router returns data, never executes | ✅ Confirmed |
| Confirmation component triggers callback, not DB write | ✅ Confirmed |
| Session memory is ephemeral, no DB sync | ✅ Confirmed |
| Multi-step flow is a pure state machine | ✅ Confirmed |
| No command bypasses proposed_actions pipeline | ✅ Confirmed — all routes end in preview/proposal |

---

## Conclusion

All DONNA command-layer files (Sprints 591–598) are **safe**. No DB writes, no external API calls, no execution capability. The command layer correctly terminates at preview or proposal — director approval is required before any execution occurs. **No migration needed.**
