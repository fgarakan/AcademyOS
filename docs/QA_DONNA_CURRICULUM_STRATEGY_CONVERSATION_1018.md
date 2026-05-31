# QA Checklist — DONNA Strategic Curriculum Conversation Mode (Sprint 1018)

**Date:** 2026-05-31
**Sprint:** 1018

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `curriculumStrategyConversation.ts` imports compile
- [ ] `contextPacket.ts` new imports resolve: `isCurriculumStrategyQuery`, `CURRICULUM_STRATEGY_PROMPT_SECTION`
- [ ] `systemPrompt` variable changed from `const` to `let` (needed for conditional append)

---

## `isCurriculumStrategyQuery` unit checklist

- [ ] "should we add more fitness content to orange level?" → true
- [ ] "curriculum philosophy for red stage" → true
- [ ] "what are our pending review items?" → false
- [ ] "how many players do we have?" → false
- [ ] "orange level progression" → true (phrase match)
- [ ] "level curriculum design approach" → true (keyword combo)
- [ ] "" (empty string) → false
- [ ] never throws

---

## Context packet injection checklist

- [ ] `buildContextPacket({ pathname: '/director/curriculum', userInput: 'hello' })` → systemPrompt includes CURRICULUM_STRATEGY_PROMPT_SECTION
- [ ] `buildContextPacket({ pathname: '/director', userInput: 'should we add more fitness to orange?' })` → systemPrompt includes CURRICULUM_STRATEGY_PROMPT_SECTION
- [ ] `buildContextPacket({ pathname: '/director', userInput: 'how many pending reviews?' })` → systemPrompt does NOT include CURRICULUM_STRATEGY_PROMPT_SECTION
- [ ] Curriculum strategy section appended AFTER safety rules section (not replacing it)
- [ ] Existing system prompt structure unchanged for non-curriculum queries

---

## Safety checklist

- [ ] `CURRICULUM_STRATEGY_PROMPT_SECTION` includes "cannot apply changes"
- [ ] `CURRICULUM_STRATEGY_PROMPT_SECTION` includes "draft → Review Queue → approval"
- [ ] `CURRICULUM_STRATEGY_DISCLAIMER` is non-empty and advisory-only
- [ ] `curriculumStrategyRequiresDisclaimer()` always returns true

---

## Sprint 1015 regression checklist

- [ ] `get_curriculum_context` tool registration unchanged
- [ ] `curriculumAnswering.ts` unchanged
- [ ] `contextPacket.ts` tool manifest unchanged (still 14 tools)
- [ ] `buildSystemPrompt` function signature unchanged
