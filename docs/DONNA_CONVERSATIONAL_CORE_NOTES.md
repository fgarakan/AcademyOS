# DONNA Conversational Core Notes

> Sprint 462 — DONNA Conversational Core V1
> See also: `src/lib/donna/conversation/index.ts`, `src/lib/donna/conversationTypes.ts`, `docs/donna-trust-modes.md`

---

## What exists

The DONNA conversational system is built across multiple modules:

| Module | Purpose |
|---|---|
| `src/lib/donna/conversationTypes.ts` | ConversationState machine, MessageRole, MessageKind types |
| `src/lib/donna/donnaSessionMemory.ts` | In-process session memory (no DB, resets on reload) |
| `src/lib/donna/donnaMultiStepFlow.ts` | Multi-step task flow state machine |
| `src/lib/donna/donnaIntentClassifier.ts` | Intent classification from user input |
| `src/lib/donna/donnaCOOAnswerEngine.ts` | Core answer engine with confidence types |
| `src/lib/donna/donnaConfidence.ts` | Confidence derivation helpers |
| `src/lib/donna/donnaRoleBlocks.ts` | Role-based action blocking |
| `src/lib/donna/donnaDraftOnlyActions.ts` | Draft validation — observation, wrap-up, session mod |
| `src/lib/donna/donnaSafeReadActions.ts` | Safe read answer shapes — no state changes |
| `src/lib/donna/donnaBoundaryResponses.ts` | Canned refusals for out-of-scope requests |
| `src/lib/donna/conversation/index.ts` | Organizational re-export index |

---

## Conversational behavior rules

1. DONNA answers only within the academy context. No general internet knowledge.
2. DONNA cites evidence and data sources in every substantive answer.
3. DONNA asks one clarifying question at a time — never a list of questions.
4. DONNA offers structured drafts and previews, not direct mutations.
5. If data is unknown or insufficient, DONNA says so with confidence level.
6. DONNA uses academy-specific names (group names, level names, coach names) from context.
7. All proposed actions enter the approved_actions pipeline — not executed directly.

---

## Conversation state machine

```
idle → input → classifying → clarifying? → previewing → confirming → submitting → complete
                                         ↓
                                      (error)
```

---

## Session memory (Sprint 597)

In-process only. Resets on page reload. Stores:
- Recent commands (by category)
- Submitted drafts
- Confirmed actions (pending)

No cross-session memory without explicit persistence (future feature, requires director approval).

---

## Trust alignment

- DONNA's conversational layer is Layer 1 (AI Proposes)
- Drafts surface as preview cards before entering the pipeline
- Sensitive data is never included in raw AI context without classification check
- Role blocks are enforced before any action is proposed
