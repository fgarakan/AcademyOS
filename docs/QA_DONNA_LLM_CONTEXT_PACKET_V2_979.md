# QA — DONNA LLM Context Packet V2 — Sprint 979

**Date:** 2026-05-30
**Sprint:** 979

---

## TypeScript Checklist

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `types.ts` compiles cleanly with new types (ConversationTurn, ConversationHistory, PageContextSummary, AcademyStateSummary)
- [ ] `contextPacket.ts` compiles cleanly — all new fields typed
- [ ] `orchestrator.ts` still compiles (imports from contextPacket unchanged)

---

## Context Packet Structure Checklist

- [ ] `buildContextPacket({ role: 'academy_director', pathname: '/director', userInput: 'hello' })` returns `ContextPacket` with all V2 fields
- [ ] `packet.systemPrompt` contains sections: Identity, Current State, Available Tools, Safety Rules, Output Format
- [ ] `packet.pageContext` has `highlightTargets`, `promptChips`, `hasApprovalGates`, `isDirectorOnly`
- [ ] `packet.toolManifest` has 8 entries (all V1 registered tools)
- [ ] `packet.conversationHistory` is `[]` when no history provided
- [ ] `packet.tokenBudget` is `'compact'` for short inputs

---

## Conversation History Checklist

- [ ] `appendUserTurn([], 'hello')` returns array with 1 user turn
- [ ] `appendDonnaTurn([], 'response')` returns array with 1 donna turn
- [ ] History is capped at 10 turns — providing 15 turns returns 10
- [ ] Turn content is capped at 200 chars
- [ ] System prompt includes last 6 turns when history is provided
- [ ] Original history array not mutated (immutable)

---

## Page Context Checklist

- [ ] `buildPageContext('/director')` returns `hasApprovalGates: false`, `isDirectorOnly: true`
- [ ] `buildPageContext('/director/review')` returns `hasApprovalGates: true`
- [ ] `buildPageContext('/coach')` returns `isDirectorOnly: false`
- [ ] `highlightTargets` contains only IDs from the chip registry highlight chips

---

## Academy State Summary Checklist

- [ ] `buildAcademyStateSummary({ pendingReviews: 0 })` returns `academyHealthSignal: 'on_track'`
- [ ] `buildAcademyStateSummary({ pendingReviews: 5 })` returns `academyHealthSignal: 'attention_needed'`
- [ ] `buildAcademyStateSummary({ pendingReviews: 12 })` returns `academyHealthSignal: 'critical'`
- [ ] No player names, coach notes, or private data in summary

---

## Safety Checklist

- [ ] System prompt always includes Safety Rules section
- [ ] User input capped at 500 chars in packet
- [ ] Conversation history content capped at 200 chars/turn
- [ ] No raw private data in systemPrompt
- [ ] No player names in packet
- [ ] No coach notes in packet

---

## Sprint 978 Regression Checklist

- [ ] `orchestrator.ts` still compiles and works
- [ ] Deterministic fast paths still resolve `'What should I do next?'`
- [ ] `buildContextPacket` backward-compatible — all V1 inputs still work with V2 builder
