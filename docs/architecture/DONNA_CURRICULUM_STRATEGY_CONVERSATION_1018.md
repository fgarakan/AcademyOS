# DONNA Strategic Curriculum Conversation Mode — Sprint 1018

**Date:** 2026-05-31
**Sprint:** 1018
**Status:** Complete

---

## What was built

When a director asks DONNA a curriculum strategy question ("should we add more fitness content?", "how does our orange level compare to best practice?"), the LLM now receives an enriched system prompt section that:
1. Frames DONNA's role in curriculum discussions (analyst, not decision-maker)
2. Instructs the LLM to use `get_curriculum_context` for grounding
3. Enforces explicit safety rules: DONNA proposes, director approves

---

## New module: `curriculumStrategyConversation.ts`

### `isCurriculumStrategyQuery(text: string): boolean`

Conservative intent detector. Returns true when:
- Text contains an explicit strategy phrase ("curriculum philosophy", "orange level", "level progression", etc.)
- OR text contains 2+ curriculum-related keywords

False negatives are acceptable — the LLM handles general questions.
False positives add helpful context without harm.

### `CURRICULUM_STRATEGY_PROMPT_SECTION`

7-rule system prompt supplement:
1. DONNA can discuss and suggest — cannot apply changes
2. Use `get_curriculum_context` to ground the answer
3. Frame suggestions as options, not directives
4. No learning philosophy absolutism ("correct" approach varies by academy)
5. Explain draft → Review Queue → approval path for changes
6. Cite confidence level (general principles vs. actual academy data)
7. Do not auto-generate curriculum items — suggest what to add

### `buildCurriculumStrategyAdvice(ctx: CurriculumStrategyContext): string`

Builds a grounding statement from live curriculum counts (level count + pending drafts).
Useful for context packet enrichment when curriculum state is available.

### `CURRICULUM_STRATEGY_DISCLAIMER`

Standard advisory footer for curriculum strategy responses.

---

## Context packet change

`buildContextPacket` (Sprint 979) injects `CURRICULUM_STRATEGY_PROMPT_SECTION` when:
- Director is on `/director/curriculum` page (always inject — any question here is curriculum-adjacent)
- OR `isCurriculumStrategyQuery(userInput)` returns true

The section is appended after the main system prompt — does not disrupt other sections.

---

## Safety invariants

- Curriculum strategy framing explicitly blocks any suggestion that DONNA can "apply" changes
- Draft → review queue → approval path always cited when a change is suggested
- `CURRICULUM_STRATEGY_DISCLAIMER` available for any response that could be interpreted as directive
- No new tools added — uses existing `get_curriculum_context` (Sprint 1015)
