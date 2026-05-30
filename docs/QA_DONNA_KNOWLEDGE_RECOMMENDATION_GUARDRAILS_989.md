# QA — DONNA Knowledge → Recommendation Guardrails V1 — Sprint 989

**Date:** 2026-05-30
**Sprint:** 989

## TypeScript Checklist
- [ ] `npx tsc --noEmit` passes
- [ ] `knowledgeGuardrails.ts` compiles cleanly

## Guardrail Checklist
- [ ] `isKnowledgeBlockedForTrigger('change_player_level')` → true
- [ ] `isKnowledgeBlockedForTrigger('send_parent_message')` → true
- [ ] `isKnowledgeBlockedForTrigger('get_page_context')` → false
- [ ] `evaluateKnowledgeGuardrails([], 'change_player_level')` → `passed: false`, `blockedReasons` non-empty
- [ ] `evaluateKnowledgeGuardrails([], undefined)` → `passed: true`, `safeToUse: true`
- [ ] Deprecated entry → `warnings` non-empty in guardrail result
- [ ] `enrichResponseWithGuardrails('hello', [], { mustLabelAsAdvisory: true, mustIncludeCitation: false, warnings: [], ... })` → includes advisory label
