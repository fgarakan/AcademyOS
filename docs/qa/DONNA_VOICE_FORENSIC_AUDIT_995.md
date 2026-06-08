# DONNA Voice Runtime Forensic Audit
**Sprint:** Mega Sprint 995–1024B
**Date:** 2026-06-08
**Status:** V2 fixes applied — browser fallback disabled, all paths routed through global lock

---

## Problem

User heard two simultaneous DONNA voices after Single Voice Runtime V1. V1 routed `useSpeechOutput` through `speakDonnaPremium`, but three additional bypass paths were still producing independent speech.

---

## Complete Speech Path Inventory

### Canonical paths (all go through global lock)

| File | Entry point | Lock mechanism | Status |
|------|-------------|---------------|--------|
| `donnaPremiumVoiceRuntime.ts` | `speakDonna()` | `_speakVersion` counter + AbortController | ✅ Canonical |
| `donnaServerTtsClient.ts` | `speakWithServerTts()` | AbortController per fetch | ✅ Called by canonical |
| `DonnaVoiceReadyShell.tsx:475` | `speakDonnaPremium()` direct | Via canonical | ✅ Locked |
| `DonnaAssistantButton.tsx:783` | Local `speakDonna()` wrapper → `speakDonnaPremium()` | Via canonical | ✅ Locked |
| `useSpeechOutput.ts:46` | `speakDonnaPremium()` | Via canonical | ✅ Fixed in V1 |

### Bypass paths found (fixed in V2)

| File | Path | How it bypassed | Fix applied |
|------|------|----------------|-------------|
| `CoachWrapUpDrawer.tsx:211` | `window.speechSynthesis.speak(utterance)` | Direct browser TTS, no lock | Routed through `speakDonnaPremium` |
| `DonnaWrapUpPrompt.tsx:27` | `window.speechSynthesis.speak(utterance)` | Direct browser TTS, no lock | Routed through `speakDonnaPremium` |
| `DonnaAssistantButton.tsx:748` | `speakAssistantText()` → `speechSynthesis` | Direct browser TTS, no lock | Replaced with `speakDonnaPremium` |

### Known bypass — audit only, not modified

| File | Path | Context | Recommendation |
|------|------|---------|----------------|
| `DirectorInterviewAssistant.tsx:1467` | `speakAssistant()` → `speechSynthesis.speak()` | Director onboarding interview page only. Has own state machine + Realtime primary path. | Separate sprint required to refactor; low frequency path (onboarding only). |

---

## Two-Voice Scenario (root cause)

### Scenario A: Coach Wrap-Up + Floating DONNA Panel (most likely)

1. Coach opens session wrap-up drawer, enables voice toggle
2. `CoachWrapUpDrawer` step advances → `window.speechSynthesis.speak(question)` fires
3. Coach also speaks to `DonnaAssistantButton` (always mounted in coach layout)
4. `DonnaAssistantButton` calls `speakDonnaPremium(response)` → fetches `/api/donna/tts`
5. Server TTS response arrives as Audio element → `el.play()`
6. **Both audio sources play simultaneously**: speechSynthesis (wrap-up question) + Audio element (DONNA response)

**Fix**: CoachWrapUpDrawer now calls `speakDonnaPremium('...', { caller: 'CoachWrapUpDrawer' })`. The global lock's `stopDonna()` is called at the start of every `speakDonna()` invocation, which stops any in-flight Audio element AND cancels any active speechSynthesis utterance.

### Scenario B: Browser Fallback Race

1. `speakDonnaPremium` called — server TTS fetch starts (async, ~200–800ms)
2. During the fetch: a second browser-TTS bypass path fires `speechSynthesis.speak()`
3. Server fetch completes → Audio element starts playing
4. **Both play**: speechSynthesis (bypass) + Audio element (server TTS)

**Fix**: Browser fallback disabled in both `donnaServerTtsClient.browserTtsFallback()` and `donnaPremiumVoiceRuntime.speakBrowserFallback()`.

---

## Changes Applied

### `src/lib/donna/voice/donnaPremiumVoiceRuntime.ts`
- Added `caller?: string` to `SpeakDonnaOptions`
- Added `DonnaSpeechLogEntry` type and `_speechLog` ring buffer (last 20 entries)
- Exported `getSpeechLog()` and `clearSpeechLog()` for debugging
- Added `console.log('[DonnaVoice] ...')` to every speak/cancel event
- **Disabled `speakBrowserFallback()`** — returns silent immediately with warning log
- `stopDonna()` marks pending log entries as cancelled

### `src/components/assistant/donnaServerTtsClient.ts`
- **Disabled `browserTtsFallback()`** — returns silent immediately with warning log
- When server TTS fails, DONNA is silent (no browser voice substitution)

### `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx`
- Removed direct `window.speechSynthesis.cancel()` and `window.speechSynthesis.speak(utterance)` calls
- Now calls `speakDonnaPremium(questionText, { caller: 'CoachWrapUpDrawer' })`
- Stop button now calls `stopDonna()` instead of `speechSynthesis.cancel()`
- Unmount cleanup now calls `stopDonna()`

### `src/components/capture/DonnaWrapUpPrompt.tsx`
- Removed local `hasSpeechSynthesis()`, `TTSOptions`, `speakText()`, `stopSpeaking()` helpers
- Removed `ttsSupported` state and `utteranceRef`
- Now calls `speakDonnaPremium(fullText, { caller: 'DonnaWrapUpPrompt' })` for all speech
- Cleanup calls `stopDonna()`

### `src/components/assistant/DonnaAssistantButton.tsx`
- Replaced `speakAssistantText()` call in `playOnboardingVoice()` Path 2 with `speakDonnaPremium(text, { mode: 'browser', caller: 'DonnaAssistantButton:playOnboardingVoice' })`
- Browser fallback is disabled so this returns silent, but the call is now registered in the global lock

### Caller tags added
- `DonnaAssistantButton` → `caller: 'DonnaAssistantButton'`
- `DonnaVoiceReadyShell` → `caller: 'DonnaVoiceReadyShell'`
- `useSpeechOutput` → `caller: 'useSpeechOutput'`
- `CoachWrapUpDrawer` → `caller: 'CoachWrapUpDrawer'`
- `DonnaWrapUpPrompt` → `caller: 'DonnaWrapUpPrompt'`

---

## Global Speech Lock Mechanism

```
speakDonnaPremium(text, { caller })
  ↓
_speechLog.push(entry)           // log the request
stopDonna()                      // cancel ALL active speech (AbortController + speechSynthesis.cancel)
_speakVersion++                  // claim version slot
speakWithServerTts(text)         // async fetch /api/donna/tts
  ↓ on success → Audio element plays
  ↓ on fail → browserTtsFallback() → [DISABLED: returns silent]
  ↓ if _speakVersion !== myVersion → superseded, return silent
```

If two surfaces call `speakDonnaPremium` simultaneously:
- Second caller's `stopDonna()` aborts first caller's fetch
- Second caller claims the version slot
- First caller's await resolves with `{ reason: 'cancelled' }` → returns silent
- Only second caller's audio plays

---

## Runtime Logging

Every `speakDonnaPremium` call writes a `DonnaSpeechLogEntry`:
```ts
{
  requestId: 'req_42',
  caller: 'DonnaAssistantButton',
  textPreview: 'You have 3 sessions today...',
  timestamp: '2026-06-08T14:32:01.123Z',
  mode: 'premium' | 'browser_fallback' | 'silent' | 'pending',
  cancelled: false,
  played: true,
}
```

To inspect in browser DevTools:
```js
// Requires: import { getSpeechLog } from 'lib/donna/voice/donnaPremiumVoiceRuntime'
// Or expose globally via window.__donnaSpeechLog for debugging
```

If you see two entries with `played: true` at nearly the same timestamp, that is the rogue source.

---

## Certification Checklist

| Scenario | Expected | Verified |
|----------|----------|---------|
| Hey Donna speaks once | Single audio output from server TTS | [ ] |
| Sidebar (DonnaVoiceReadyShell) speaks once | Single audio, logged as `DonnaVoiceReadyShell` | [ ] |
| Daily brief speaks once | Single audio, logged as `DonnaAssistantButton` | [ ] |
| Goal session speaks once | Single audio, one log entry | [ ] |
| Navigation speaks once | Single audio | [ ] |
| No browser voice | `console.warn '[DonnaTTS] Browser fallback DISABLED'` in DevTools means any browser path was attempted | [ ] |
| No overlapping audio | If two `speakDonnaPremium` calls fire within 100ms, only one log entry has `played: true` | [ ] |
| Logs prove one caller per utterance | DevTools `[DonnaVoice] played` shows single caller per utterance | [ ] |
| CoachWrapUpDrawer voice enable | Wrap-up questions route through lock, no second voice | [ ] |
| DonnaWrapUpPrompt read aloud | Routes through lock, no second voice | [ ] |

---

## To Re-enable Browser Fallback

Once the audit confirms no second voice:

1. In `donnaServerTtsClient.ts`: restore the original `browserTtsFallback()` body
2. In `donnaPremiumVoiceRuntime.ts`: restore the original `speakBrowserFallback()` body
3. Run `npx tsc --noEmit` to confirm clean compile
4. Test on a network-isolated environment (no OPENAI_API_KEY) to confirm fallback triggers correctly
5. Confirm single voice throughout

---

## Known Remaining Bypass

`DirectorInterviewAssistant.tsx` (`speakAssistant()` function, line ~1467) contains a full independent `window.speechSynthesis.speak()` implementation. This is only active on the `/director/onboarding/interview` route. It was NOT modified in this sprint because:
- It has its own complex state machine (audioStatus, utteranceRef, advanceTimerRef)
- It uses OpenAI Realtime as primary and browser TTS as fallback
- Modifying it requires a dedicated sprint with the interview flow

**Risk**: On the interview page, if a director opens the floating DONNA panel (`DonnaAssistantButton`) and clicks "Play Donna voice" while `DirectorInterviewAssistant` is speaking, they may hear two voices. Mitigation: `DonnaAssistantButton.playOnboardingVoice()` on interview pages now uses `speakDonnaPremium` (locked), but `DirectorInterviewAssistant` still uses direct `speechSynthesis`. This path requires a future fix.
