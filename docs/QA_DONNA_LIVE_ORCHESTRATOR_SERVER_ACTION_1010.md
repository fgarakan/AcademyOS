# QA — DONNA Live Orchestrator Server Action V1 — Sprint 1010

**Date:** 2026-05-30
**Sprint:** 1010

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `donnaOrchestratorAction.ts` compiles with 'use server'
- [ ] `DonnaOrchestratorInput` interface compiles cleanly
- [ ] `DonnaOrchestratorResult` interface compiles cleanly
- [ ] `runDonnaOrchestratorAction` return type is `Promise<DonnaOrchestratorResult>`
- [ ] `orchestrate` import from `@/lib/donna/llmOrchestration/orchestrator` resolves
- [ ] `writeUsageEventToDb` import from `@/lib/usage/usageTracker` resolves

---

## Auth Checklist

- [ ] `academyId` comes from `getAuthorizedContext()` — never from `input.academyId`
- [ ] `role` comes from `getAuthorizedContext()` — never from `input.role`
- [ ] Unauthenticated request returns `{ ok: false, error: 'Not authenticated.' }`
- [ ] Non-director/head-coach role returns `{ ok: false, error: 'Director or Head Coach access required.' }`
- [ ] Profile with no academy_id returns `{ ok: false, error: 'Academy context unavailable.' }`

---

## Input Validation Checklist

- [ ] Empty `userInput` returns validation error
- [ ] `userInput` over 800 chars returns validation error
- [ ] Whitespace-only `userInput` returns validation error
- [ ] Missing `pathname` returns validation error
- [ ] `pathname` not starting with `/` returns validation error
- [ ] `useLlm` defaults to `true` when not provided

---

## Orchestrator Call Checklist

- [ ] `orchestrate()` is called with `academyId` from auth (not from input)
- [ ] `orchestrate()` is called with `role` from auth (not from input)
- [ ] `orchestrate()` is called with `userInput.trim()`
- [ ] `playerId` from input is passed through (optional, route-context only)
- [ ] `sessionId` from input is passed through (optional, route-context only)
- [ ] `orchestrate()` exception returns `{ ok: false, error: 'DONNA is temporarily unavailable.' }`
- [ ] Stack trace is NOT returned in error

---

## Result Safety Checklist

- [ ] `safetyAudit` is NOT returned to client
- [ ] `contextSummary` is NOT returned to client
- [ ] `secondaryOutputs` is NOT returned to client (only primaryOutput)
- [ ] `error` messages are safe, generic strings — no raw DB errors
- [ ] `output.text` comes from orchestrator's validated output (safety contract enforced)

---

## Usage DB Write Checklist

- [ ] `writeUsageEventToDb` called after successful orchestration
- [ ] Event: `eventType: 'donna_intelligence_call'`
- [ ] Event: `academyId` from auth (not from input)
- [ ] Event: `userId` from auth
- [ ] Event: `blocked` = `hadBlockedAttempt`
- [ ] Event: `requestId` = `'${outputType}:${source}'` (safe label)
- [ ] DB write is `void` (fire-and-forget — does not block response)
- [ ] DB write failure never propagates to caller

---

## Privacy Checklist

- [ ] `userInput` is NOT written to DB (not in UsageEvent)
- [ ] `output.text` is NOT written to DB
- [ ] `safetyAudit` entries are NOT written to DB
- [ ] No player names in DB write
- [ ] No coach notes in DB write
- [ ] `requestId` is safe label only (outputType:source)

---

## Protected Systems Checklist

- [ ] No mutation of `players`, `sessions`, `template_blocks`, `proposed_actions`
- [ ] No change to review queue items
- [ ] No parent/player communication sent
- [ ] `orchestrate()` returns output only — no DB mutations in orchestrator
- [ ] Sprint 904 approve/reject paths unchanged
- [ ] Sprint 978 safety contract unchanged
- [ ] Sprint 999 LLM API path unchanged

---

## Sprint 1009/1008/1007 Regression Checklist

- [ ] `donnaGuidedAction.ts` unchanged
- [ ] `DonnaResponseCard` unchanged
- [ ] `writeUsageEventToDb` unchanged
- [ ] `usageTracker.ts` unchanged

---

## Not-Wired-Yet Checklist (expected)

- [ ] `runDonnaOrchestratorAction` not yet called from DonnaAssistantButton — Sprint 1011 wires it
- [ ] `runDonnaOrchestratorAction` not yet on any page — Sprint 1011 handles integration
