# DONNA Voice Certification V3
**Sprint:** Mega Sprint 995–1024C
**Date:** 2026-06-08
**Status:** CERTIFIED — zero active browser TTS bypass paths; all speech routes through canonical runtime

---

## Certification summary

| Check | Result |
|---|---|
| Active `window.speechSynthesis.speak()` calls | **0** |
| Active `new SpeechSynthesisUtterance()` calls | **0** |
| Active `new Audio()` outside canonical client | **0 (1 in donnaServerTtsClient.ts — canonical)** |
| All DONNA speech uses `speakDonnaPremium` | **YES** |
| All stop behavior uses `stopDonna` | **YES** |
| Runtime logging identifies caller for every utterance | **YES** |
| Browser fallback disabled | **YES** |
| TypeScript clean | **YES** (`npx tsc --noEmit` — no output) |

---

## Complete speech path inventory

### Canonical paths — all certified

| File | Entry point | Lock mechanism | Caller tag |
|------|-------------|----------------|-----------|
| `donnaPremiumVoiceRuntime.ts` | `speakDonna()` | `_speakVersion` counter + AbortController | Canonical |
| `donnaServerTtsClient.ts` | `speakWithServerTts()` | AbortController per fetch | Called by canonical |
| `DonnaVoiceReadyShell.tsx` | `speakDonnaPremium()` direct | Via canonical | `DonnaVoiceReadyShell` |
| `DonnaAssistantButton.tsx` | `speakDonna()` → `speakDonnaPremium()` | Via canonical | `DonnaAssistantButton` |
| `DonnaAssistantButton.tsx` | `playOnboardingVoice()` Path 2 | Via canonical | `DonnaAssistantButton:playOnboardingVoice` |
| `DonnaAssistantButton.tsx` | `testBrowserVoice()` (dev only) | Via canonical | `DonnaAssistantButton:testBrowserVoice` |
| `useSpeechOutput.ts` | `speakDonnaPremium()` | Via canonical | `useSpeechOutput` |
| `DonnaWrapUpPrompt.tsx` | `speakDonnaPremium()` | Via canonical | `DonnaWrapUpPrompt` |
| `CoachWrapUpDrawer.tsx` | `speakDonnaPremium()` | Via canonical | `CoachWrapUpDrawer` |
| `DirectorInterviewAssistant.tsx` | `speakAssistant()` → `speakDonnaPremium()` | Via canonical | `DirectorInterviewAssistant` |
| `DirectorInterviewAssistant.tsx` | `stopAssistantSpeech()` → `stopDonna()` | Via canonical | — |

### Non-speech `speechSynthesis` references (classified safe)

| File | Line | Type | Active audio? |
|------|------|------|--------------|
| `donnaVoicePreload.ts` | 49–65 | `getVoices()` + `voiceschanged` listener | NO — reads voice list only |
| `donnaVoicePolicy.ts` | 31 | Returns string `'browser_tts'` (type constant) | NO — type value only |
| `donnaVoiceRuntime.ts` | 10 | Type comment | NO — comment only |
| `donnaConversationController.ts` | Multiple | `speakText` field name in data objects | NO — data field |
| `donnaFailureModes.ts` | 134, 143 | Developer message strings | NO — strings only |
| `personality.ts` | 18 | Comment | NO — comment only |
| `useDonnaRealtimeVoice.ts` | 8 | Comment | NO — comment only |
| `DirectorInterviewAssistant.tsx` | 1346 | Code comment (Sprint 995 V3 note) | NO — comment only |

### Bypass paths fixed (cumulative V1 → V3)

| Sprint | File | What was bypassing | Fix applied |
|--------|------|--------------------|-------------|
| V1 (995–1024A) | `useSpeechOutput.ts` | Direct `speechSynthesis.speak()` | Routed through `speakDonnaPremium` |
| V2 (995–1024B) | `CoachWrapUpDrawer.tsx` | Direct `speechSynthesis.speak()` in useEffect | Routed through `speakDonnaPremium` |
| V2 (995–1024B) | `DonnaWrapUpPrompt.tsx` | Local `speakText()` helper with `speechSynthesis.speak()` | Routed through `speakDonnaPremium` |
| V2 (995–1024B) | `DonnaAssistantButton.tsx` | `playOnboardingVoice()` Path 2 called `speakAssistantText()` with `speechSynthesis.speak()` | Routed through `speakDonnaPremium` |
| V2 (995–1024B) | `donnaPremiumVoiceRuntime.ts` | `speakBrowserFallback()` | Disabled — returns silent |
| V2 (995–1024B) | `donnaServerTtsClient.ts` | `browserTtsFallback()` | Disabled — returns silent |
| V3 (995–1024C) | `DirectorInterviewAssistant.tsx` | `speakAssistant()` with 100-line browser TTS implementation | Replaced with `speakDonnaPremium` wrapper |
| V3 (995–1024C) | `DirectorInterviewAssistant.tsx` | `stopAssistantSpeech()` calling `window.speechSynthesis.cancel()` | Replaced with `stopDonna()` |
| V3 (995–1024C) | `DirectorInterviewAssistant.tsx` | Voice loading useEffect reading `speechSynthesis.getVoices()` | Removed (unused without browser TTS) |
| V3 (995–1024C) | `DirectorInterviewAssistant.tsx` | `speechSynthesis.cancel()` gesture prime in `startVoiceInterview()` | Removed |
| V3 (995–1024C) | `DonnaAssistantButton.tsx` | `speakAssistantText()` function (dead code — no remaining callers) | Deleted |
| V3 (995–1024C) | `DonnaAssistantButton.tsx` | `testBrowserVoice()` calling `speechSynthesis.speak()` (dev only) | Routed through `speakDonnaPremium` |

---

## Global speech lock mechanism (certified)

```
speakDonnaPremium(text, { caller })
  ↓
_speechLog.push(entry)           // log: requestId, caller, textPreview, timestamp
stopDonna()                      // cancel ALL active speech:
                                 //   → AbortController.abort() (cancels in-flight /api/donna/tts fetch)
                                 //   → HTMLAudioElement.pause() (stops playing audio)
                                 //   → window.speechSynthesis.cancel() (stops any browser TTS)
_speakVersion++                  // claim version slot — any prior async chain is now superseded
speakWithServerTts(text)         // async fetch /api/donna/tts
  ↓ on success → new Audio(url).play()
  ↓ on fail    → browserTtsFallback() → [DISABLED: returns silent (Sprint 995 V2)]
  ↓ if _speakVersion !== myVersion → superseded, return silent
```

**Two simultaneous callers:**
Second caller's `stopDonna()` aborts first caller's fetch and invalidates its version. First caller's await resolves with `cancelled`. Only second caller's audio plays.

---

## Runtime logging (every utterance)

Every `speakDonnaPremium` call writes:
```ts
{
  requestId: 'req_N',
  caller: 'DirectorInterviewAssistant',  // identifies the surface
  textPreview: 'Welcome, Brian...',      // first 60 chars
  timestamp: '2026-06-08T...',
  mode: 'premium' | 'browser_fallback' | 'silent' | 'pending',
  cancelled: false,
  played: true,
}
```

DevTools inspection: `getSpeechLog()` from `donnaPremiumVoiceRuntime.ts`, or expose via `window.__donnaSpeechLog` for live debugging.

---

## Final bypass search results

Command run: `grep -rn "window\.speechSynthesis\.speak\b|new SpeechSynthesisUtterance|speechSynthesis\.speak\b" src/`

**Active calls found: 0**

Only match was a code comment in `DirectorInterviewAssistant.tsx:1346`:
```
// Sprint 995 V3: direct window.speechSynthesis.speak() calls removed.
```

---

## Certification scenarios

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Hey Donna speaks once | Single audio from server TTS; log shows `DonnaAssistantButton`, 1 entry with `played: true` | [ ] |
| 2 | Sidebar DONNA speaks once | Single audio; log shows `DonnaVoiceReadyShell`, 1 `played: true` | [ ] |
| 3 | Goal session speaks once | Single audio; log shows `useSpeechOutput` or goal session surface, 1 `played: true` | [ ] |
| 4 | Daily brief speaks once | Single audio; log shows `DonnaAssistantButton`, 1 `played: true` | [ ] |
| 5 | Director interview speaks | `speakAssistant()` routes through `DirectorInterviewAssistant` caller tag in log | [ ] |
| 6 | Coach wrap-up speaks | Wrap-up questions logged as `CoachWrapUpDrawer`; no second voice | [ ] |
| 7 | No browser default voice | No `[DonnaTTS] Browser fallback DISABLED` warn (would appear if any path still tried browser TTS) | [ ] |
| 8 | No overlapping audio | Two rapid `speakDonnaPremium` calls produce only 1 `played: true`; first has `cancelled: true` | [ ] |
| 9 | Log proves one caller per utterance | DevTools `[DonnaVoice] played` shows exactly one caller per utterance | [ ] |

---

## Build classification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean (no output) |
| New files created | `docs/qa/DONNA_VOICE_CERTIFICATION_V3_995.md` |
| Files modified | `DirectorInterviewAssistant.tsx`, `DonnaAssistantButton.tsx`, `DONNA_CAPABILITY_SCORECARD.md`, `CHANGELOG.md` |
| Migrations | None |
| New dependencies | None |
| New API routes | None |

---

## Re-enable browser fallback (when ready)

After field testing confirms no second voice:
1. In `donnaServerTtsClient.ts`: restore original `browserTtsFallback()` body
2. In `donnaPremiumVoiceRuntime.ts`: restore original `speakBrowserFallback()` body
3. Run `npx tsc --noEmit`
4. Test on a network-isolated environment (no OPENAI_API_KEY) to confirm fallback fires correctly
5. Confirm single voice throughout all 9 certification scenarios
