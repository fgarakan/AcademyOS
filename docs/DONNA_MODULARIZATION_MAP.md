# DONNA Modularization Map — Sprint 384

## Summary

`DonnaAssistantButton.tsx` was refactored from a 4,168-line monolith into a prop-driven orchestrator shell (~3,346 lines) with three real JSX extractions and five documentation stubs.

All state, hooks, and event handlers remain in `DonnaAssistantButton.tsx`. Extracted components are presentational wrappers that receive read-only state + callback props.

---

## Module Boundaries

### Real extractions (JSX moved out)

| Component | File | What it renders |
|---|---|---|
| `DonnaVoiceLayer` | `src/components/assistant/DonnaVoiceLayer.tsx` | VoiceInputButton, interim transcript, voice permission error, editable voice answer, voice transcript display, typed text input + Send button, suggestion chips |
| `DonnaWorkflowCards` | `src/components/assistant/DonnaWorkflowCards.tsx` | Active draft card + version history + draft review panel, command response, daily brief, attention report, rule-based recommendations, communication draft + review panel, attendance exception layer, onboarding suggestions, context summary |
| `DonnaDeveloperTools` | `src/components/assistant/DonnaDeveloperTools.tsx` | Dev-only diagnostic panel: reset intro, TTS display, wake listener toggle, browser voice test, voice diagnostics, audit trail, preferences, COO state, last card action, draft session storage, golden path checklist |
| `DonnaAttendanceLayer` | `src/components/assistant/DonnaAttendanceLayer.tsx` | Thin null-guard wrapper around `DonnaAttendanceExceptionCard` |

### Documentation stubs (extraction deferred — tight coupling)

| Stub file | What it documents |
|---|---|
| `DonnaPanelShell.tsx` | Why the `<aside>` panel container + trigger button cannot be extracted; requires DonnaPanelContext + useReducer migration |
| `DonnaCommandDispatcher.ts` | Why dispatch runtime cannot be extracted; `dispatchCooCommand`, `detectAndHandleCommand`, `handleCommandSubmit` close over 30+ state setters |
| `DonnaDraftLayer.tsx` | Template and generic draft rendering is already handled by `TemplateDraftPanel`, `GenericDraftPanel`, `DonnaDraftCard` |
| `DonnaReviewLayer.tsx` | Review queue output is already handled by `DonnaReviewQueuePanel` |
| `DonnaInputBar.tsx` | Typed text input lives in `DonnaVoiceLayer`; shares `onCommandSubmit` handler |

---

## Orchestrator role (`DonnaAssistantButton.tsx`)

`DonnaAssistantButton` is the single source of truth for:

- All React state (40+ state values)
- All hooks (`useDonnaRealtimeVoice`, `useRef`, `useEffect` chains)
- All event handlers that close over state setters
- Panel open/close + mode switching
- Draft lifecycle (create, answer, discard, save)
- Voice transcript routing → command dispatch → state mutation
- Rendering the extracted components in order with props

---

## Future path to further modularization

1. **DonnaPanelContext** — migrate panel open/close + mode state to a React context + useReducer. Unlocks DonnaPanelShell extraction.
2. **DonnaCommandContext** — migrate dispatch state to a context. Unlocks DonnaCommandDispatcher extraction.
3. **DonnaDraftContext** — migrate all draft state to a context. Unlocks further DonnaDraftLayer extraction.

Until then, `DonnaAssistantButton.tsx` is the intentional orchestration point and new agent owners should add sub-panels by adding a new extracted component and wiring it through props.

---

## Already-extracted pre-Sprint-384 components

These existed before Sprint 384 and remain unchanged:

- `TemplateDraftPanel` — legacy template draft form
- `GenericDraftPanel` — generic task draft form
- `DonnaDraftCard` — conversation controller draft card
- `DonnaClassTemplateDraftPreview` / `DonnaClassTemplateDraftPreviewFromDraft` — live template preview
- `DonnaVersionHistoryPanel` — draft version history
- `DonnaReviewQueuePanel` — review queue command center
- `DonnaObjectResolverPanel` — safe object resolution
- `DonnaSuggestionCard` — predictive suggestion chips
- `DonnaVoiceDiagnostics` — voice diagnostics panel
- `DonnaCommunicationDraftCard` / `DonnaMessageReviewPanel` — comms draft flow
- `DonnaDailyBriefCard` — daily brief output
- `DonnaAttentionCard` — what-needs-attention output
- `DonnaRecommendationCard` — rule-based recommendation output
- `DonnaReviewQueueBadge` — pending items badge

---

*Last updated: Sprint 384*
