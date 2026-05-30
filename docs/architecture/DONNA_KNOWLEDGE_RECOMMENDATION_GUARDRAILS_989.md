# DONNA Knowledge → Recommendation Guardrails V1 — Sprint 989

**Date:** 2026-05-30
**Sprint:** 989
**Status:** Implemented — TypeScript clean

## 6 Core Guardrail Rules

1. Knowledge may inform but never replace live data in recommendations.
2. Recommendations based solely on knowledge must be labeled advisory.
3. Knowledge cannot trigger level changes, parent messages, or curriculum publishes.
4. Deprecated entries always show staleness warning.
5. Source citation is mandatory when knowledge content is used.
6. Scope label distinguishes global library vs academy knowledge.

## Key Functions
- `evaluateKnowledgeGuardrails(entries, intendedTrigger)` — checks all rules, returns guardrail result
- `enrichResponseWithGuardrails(text, entries, guardrails)` — appends advisory label, citations, warnings
- `isKnowledgeBlockedForTrigger(trigger)` — checks if intended action is blocked for knowledge use
- `getKnowledgeScopeLabel(scope)` — 'Platform Knowledge Library' or 'Academy Knowledge'

## No-Mutation Guarantee
Pure functions only. No DB calls, no proposed_actions.
