# DONNA Single Premium Voice Source — Sprint 1094E

**Date:** 2026-06-01
**Sprint:** 1094E
**Scope:** Voice routing unification — one file changed, no backend/logic/schema changes.

---

## Problem

A robotic voice was heard in the Template section. Investigation found a split voice architecture:

| Function | Path | Sound |
|---|---|---|
| `speakDonna()` | Server TTS (`/api/donna/tts`) → browser fallback | Premium (marin voice via OpenAI) |
| `speakAssistantText()` | Direct `window.speechSynthesis` | Robotic (system/browser default) |

25 call sites in `DonnaAssistantButton.tsx` were using `speakAssistantText()` instead of `speakDonna()`, including:
- All template draft clarifying questions (`speakAssistantText(firstQ.question)`)
- Template completion announcements
- Multi-step plan summaries
- Conversation controller speech (undo, cancel, revision announcements)
- Guided task question announcements
- JSX `onQuestionAnswered` callbacks in `TemplateDraftPanel` and `GenericDraftPanel`

---

## Voice architecture (pre-1094E)

```
speakDonna()          → speakWithServerTts() → POST /api/donna/tts → OpenAI "marin"
                                             ↘ browser TTS fallback (configured keywords)

speakAssistantText()  → new SpeechSynthesisUtterance() → window.speechSynthesis.speak()
                        (direct browser, system default voice, ROBOTIC)
```

---

## Voice architecture (post-1094E)

```
ALL DONNA SPEECH → speakDonna() → speakWithServerTts() → POST /api/donna/tts → OpenAI "marin"
                                                        ↘ browser TTS fallback (configured voice)
```

`speakAssistantText()` is now restricted to 2 legitimate uses only:
1. **`playOnboardingVoice()` browser fallback** — interview page (`/director/onboarding/interview`) 
   when OpenAI Realtime is unavailable. This path has a callback signature: 
   `speakAssistantText(text, (callbackStatus) => {...})` — distinguishable.
2. **`testBrowserVoice()` dev tool** — isolated developer diagnostics function. Not user-facing.

---

## Change made

**File**: `src/components/assistant/DonnaAssistantButton.tsx`

25 `speakAssistantText(...)` call sites replaced with `speakDonna(...)`:

| Context | Count |
|---|---|
| Template draft question speech | 10 |
| Template completion announcements | 5 |
| Multi-step plan summaries | 2 |
| Conversation controller speech | 5 |
| Guided task question speech (JSX callbacks) | 3 |

Added clarifying comment on `speakAssistantText()` marking it as restricted.
Updated comment on `speakDonna()` to state it is the canonical DONNA voice path.

---

## Fallback policy

`speakDonna()` already has a correct fallback chain:

1. **Server TTS** (`/api/donna/tts`): OpenAI voice "marin" with personality instructions. Returns audio if `OPENAI_API_KEY` is set.
2. **Browser TTS fallback** (in `donnaServerTtsClient.ts`): Uses `preferredBrowserVoiceKeywords` from `donnaVoiceConfig.ts` to select the best available browser voice. Does NOT use system default — explicitly avoids robotic voices via `avoidBrowserVoiceKeywords`.
3. **Silent fallback**: If neither is available, the text is always shown in the UI. No random voice plays.

---

## What is NOT changed

| Component | Status |
|---|---|
| `CoachWrapUpDrawer.tsx` — direct `speechSynthesis` | Kept — coach role, intentional coach voice |
| `DirectorInterviewAssistant.tsx` — `speakAssistant()` | Kept — onboarding interview has its own Realtime + browser chain |
| `useSpeechOutput.ts` / `DonnaVoiceWrapUpShell.tsx` | Kept — appear orphaned (no render found) |
| `DonnaWrapUpPrompt.tsx` — `speakText()` | Kept — appears orphaned (no render found) |
| `DonnaVoiceReadyShell.tsx` — already uses `speakWithServerTts` | Already premium ✅ |
| `donnaServerTtsClient.ts` | Unchanged |
| `donnaVoiceConfig.ts` | Unchanged |
| `/api/donna/tts` route | Unchanged |
| All DONNA backend logic | Unchanged |

---

## Acceptance criteria met

- [x] No unwrapped DONNA speech calls in director/DONNA sidebar flow
- [x] Template section uses same premium path as sidebar (both route through `speakDonna`)
- [x] Sidebar voice unchanged
- [x] Daily brief voice unchanged (was already using `speakDonna`)
- [x] If TTS fails: fallback is controlled (configured browser voice or silent), not random robotic voice
- [x] TypeScript: clean (0 errors)
