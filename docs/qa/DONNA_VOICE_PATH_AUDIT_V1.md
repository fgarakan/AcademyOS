# DONNA Voice Path Audit V1

**Sprint:** Mega Sprint 1881–1890
**Date:** 2026-06-04
**Scope:** All voice output paths across the AcademyOS codebase

---

## Audit Method

Searched for: `window.speechSynthesis`, `speechSynthesis.speak`, `SpeechSynthesisUtterance`, `speakDonna`, `useSpeechOutput`, `donnaServerTtsClient`, `audio.play`, `/api/donna/tts`, `speakWithServerTts`.

---

## Director DONNA Voice Paths

### Path 1 — `speakDonna()` (canonical director path)
**File:** `src/components/assistant/DonnaAssistantButton.tsx` (internal function, ~line 744)
**Status after Sprint 1881:** ✅ Routes through `donnaPremiumVoiceRuntime.ts`
**What it does:** Called for every DONNA response in the floating director panel
**Voice chain:** `speakDonnaPremium()` → `/api/donna/tts` (OpenAI gpt-4o-mini-tts + marin) → browser `speechSynthesis` fallback
**Note:** Includes sentence-boundary truncation (max 150 chars for TTS) + state management

### Path 2 — `speakAssistantText()` (restricted onboarding path)
**File:** `src/components/assistant/DonnaAssistantButton.tsx` (~line 549)
**Status:** ⚠️ Direct `window.speechSynthesis` — intentionally kept for onboarding interview only
**What it does:** Browser TTS for the `/director/onboarding/interview` page fallback, plus `testBrowserVoice()` dev tool
**Note:** Restricted by code comment: "only for (1) playOnboardingVoice browser fallback on interview page, (2) testBrowserVoice() dev tool. Do not add new callers."
**Risk:** Low — restricted use only

### Path 3 — `playOnboardingVoice()` — Realtime WebRTC
**File:** `src/components/assistant/DonnaAssistantButton.tsx` (~line 639)
**Status:** ✅ Uses OpenAI Realtime (primary) → `speakDonna()` (non-interview pages)
**What it does:** Premium WebRTC voice for the director onboarding interview flow
**Voice chain:** `realtimeConnect()` + `realtimeSpeak()` → WebRTC audio output
**Note:** Only active on `/director/onboarding/interview`. All other pages use `speakDonna()`.

### Path 4 — `stopDonna()` (unified stop)
**File:** `src/components/assistant/DonnaAssistantButton.tsx` — `resetVoice()`, `closePanel()`, route-change handler
**Status after Sprint 1881:** ✅ All three locations now use `stopDonna()` from `donnaPremiumVoiceRuntime.ts`
**What it does:** Stops both server audio (HTMLAudioElement) and browser TTS simultaneously

### Path 5 — `DonnaVoiceReadyShell.tsx` direct `speakWithServerTts`
**File:** `src/components/donna/DonnaVoiceReadyShell.tsx` (~line 465)
**Status:** ⚠️ Uses `speakWithServerTts` directly (does not yet use `donnaPremiumVoiceRuntime.ts`)
**What it does:** Voice output for the `/director/donna` dedicated DONNA page shell
**Risk:** Low — `speakWithServerTts` is the underlying function that `donnaPremiumVoiceRuntime` wraps; functionally equivalent. Future sprint can migrate to unified runtime.

---

## Coach Voice Paths (intentionally separate from director DONNA)

### Coach Path 1 — `CoachWrapUpDrawer.tsx`
**File:** `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx`
**Status:** Direct `window.speechSynthesis` (intentional)
**What it does:** Reads wrap-up questions aloud during coach guided session. Browser TTS only.
**Separation rationale:** Coach context; no server TTS needed; no premium DONNA voice required.
**Risk:** None — correct design for the coach role.

### Coach Path 2 — `DonnaVoiceWrapUpShell.tsx`
**File:** `src/components/donna/DonnaVoiceWrapUpShell.tsx`
**Status:** Uses `useSpeechOutput` hook (browser TTS)
**What it does:** Guided coach wrap-up prompts
**Separation rationale:** Coach role; muted by default; no premium voice needed.

### Coach Path 3 — `DonnaWrapUpPrompt.tsx`
**File:** `src/components/capture/DonnaWrapUpPrompt.tsx`
**Status:** Direct `window.speechSynthesis`
**What it does:** Simple wrap-up question prompts for coach context
**Risk:** None — coach role only.

---

## Premium Voice Runtime

### `donnaPremiumVoiceRuntime.ts`
**File:** `src/lib/donna/voice/donnaPremiumVoiceRuntime.ts`
**Status:** ✅ Created Sprint 1861; wired into DonnaAssistantButton Sprint 1881
**API:** `speakDonna(text, { mode, fallback, onStatus })` → `SpeakDonnaResult { ok, mode, voice, reason }`
**Modes:** `premium` (server TTS, default) → `browser_fallback` (labeled) → `silent` (if both fail)
**stopDonna():** Cancels both `HTMLAudioElement` (server audio) and `window.speechSynthesis` (browser TTS)

---

## `/api/donna/tts` Endpoint
**File:** `src/app/api/donna/tts/route.ts`
**Status:** Active — used by `speakWithServerTts` (via `donnaPremiumVoiceRuntime`)
**Voice model:** OpenAI `gpt-4o-mini-tts` + `marin` voice + British COO persona instructions
**Fallback model:** `tts-1-hd` + `nova` voice (when marin unavailable)
**Auth:** Server-side only; `OPENAI_API_KEY` required; returns 503 if unconfigured

---

## Summary

| Path | File | Role | Status | Voice |
|---|---|---|---|---|
| `speakDonna()` internal | DonnaAssistantButton | Director | ✅ Premium runtime | Server TTS → browser |
| `speakAssistantText()` | DonnaAssistantButton | Director (interview only) | ⚠️ Restricted browser TTS | Browser only |
| Realtime WebRTC | DonnaAssistantButton | Director (interview only) | ✅ OpenAI Realtime | WebRTC |
| `DonnaVoiceReadyShell` | DonnaVoiceReadyShell | Director (/donna page) | ⚠️ Direct speakWithServerTts | Server TTS → browser |
| `CoachWrapUpDrawer` | CoachWrapUpDrawer | Coach | ✅ Correct (browser only) | Browser only |
| `DonnaVoiceWrapUpShell` | DonnaVoiceWrapUpShell | Coach | ✅ Correct (useSpeechOutput) | Browser only |
| `DonnaWrapUpPrompt` | DonnaWrapUpPrompt | Coach | ✅ Correct (browser only) | Browser only |

### Remaining gap

`DonnaVoiceReadyShell.tsx` still calls `speakWithServerTts` directly (not via `donnaPremiumVoiceRuntime`). Since `donnaPremiumVoiceRuntime` wraps `speakWithServerTts`, the behavior is functionally equivalent. A future sprint should migrate it to use `speakDonna` from the runtime for full consolidation.
