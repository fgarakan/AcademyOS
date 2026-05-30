# DONNA Tool Result Interpreter V1 — Sprint 986

**Date:** 2026-05-30
**Sprint:** 986
**Status:** Implemented — TypeScript clean

## Purpose
Converts raw tool call results into COO-style DONNA text responses with highlight/navigation instructions.

## Key API
- `interpretToolResult(result: ToolCallResult): ToolInterpretation`

## ToolInterpretation Fields
- `donnaText` — what DONNA says
- `shouldHighlight` — whether to dispatch donna:highlight
- `targetFocusId` / `targetRoute` — highlight target
- `shouldSuggestNavigation` — whether to show a navigation suggestion
- `suggestedRoute` — route to suggest
- `requiresConfirmation` — whether director must confirm

## Interpreter Coverage
All 8 V1 registered tools have specific interpreters.
Failed tool calls always return a safe fallback interpretation — never crash.

## No-Mutation Guarantee
No DB calls. No proposed_actions created. Pure text interpretation.
