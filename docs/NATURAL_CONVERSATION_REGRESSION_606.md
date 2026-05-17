# Natural Conversation Regression — Sprint 606

**Date:** 2026-05-17
**Sprint:** 606 — Natural Conversation Regression V1
**No code mutation in this sprint. Regression audit only.**

---

## Scope

Regression check on all DONNA natural conversation and voice components (Sprints 540–555).

---

## Files Audited

| File | Sprint | Type | DB Write? | External Call? |
|---|---|---|---|---|
| `src/components/donna/DonnaConversationalPanel.tsx` | 542 | UI Shell | No | No |
| `src/components/donna/DonnaConversationSummary.tsx` | 546 | UI | No | No |
| `src/lib/donna/wrapUpDraftAdapter.ts` | 547 | Pure TS | No | No |
| `src/lib/donna/useVoiceDictation.ts` | 549 | Hook | No | Web Speech API (browser-native) |
| `src/lib/donna/useSpeechOutput.ts` | 550 | Hook | No | Speech Synthesis API (browser-native) |
| `src/components/donna/VoiceTranscriptReview.tsx` | 551 | UI | No | No |
| `src/components/donna/VoiceErrorFallback.tsx` | 552 | UI | No | No |
| `src/components/donna/DonnaVoiceWrapUpShell.tsx` | 553 | UI Shell | No | No |
| `src/lib/donna/donnaCOOAnswerEngine.ts` | 554 | Pure TS | No | No |
| `src/components/donna/DONNAAnswerCard.tsx` | 555 | UI | No | No |

---

## Key Safety Checks

### Voice Dictation (`useVoiceDictation.ts`)
- Uses `window.SpeechRecognition` — browser-native, no external API key
- `continuous: false` — stops after one utterance
- `interimResults: true` — shows interim text only (not submitted)
- No auto-submit — coach must click "Use this"
- ✅ Safe

### Speech Output (`useSpeechOutput.ts`)
- Uses `window.speechSynthesis` — browser-native
- `defaultMuted: true` — muted by default
- No external TTS API
- ✅ Safe

### Wrap-Up Draft Adapter (`wrapUpDraftAdapter.ts`)
- Pure computation — builds `WrapUpAnswerSet` from `ConversationMessage[]`
- No DB read or write
- Supports corrections (uses last coach message per question)
- ✅ Safe

### Conversation Panel (`DonnaConversationalPanel.tsx`)
- State machine: idle/typing/listening/clarifying/summarizing/awaiting_review/complete/error
- No DB connection — accepts data via props
- Calls `onSubmit(answerset)` callback — actual submission handled externally
- ✅ Safe

---

## Conversation → DB Invariants

| Invariant | Status |
|---|---|
| DONNA never auto-submits | ✅ Coach must confirm at `DonnaConversationSummary` |
| Voice transcript never auto-applied | ✅ `VoiceTranscriptReview` requires "Use this" |
| No proposed_action created from conversation layer | ✅ Created only by `saveWrapUpDraftAction` server action |
| No level movement from conversation | ✅ Confirmed — no placement calls found |
| No parent message sent from conversation | ✅ Confirmed — not present |

---

## Conclusion

All natural conversation and voice components are **safe**. No DB writes, no external API calls (browser-native speech only), no auto-execution. Wrap-up draft adapter correctly builds structured draft for server action to submit. **No migration needed.**
