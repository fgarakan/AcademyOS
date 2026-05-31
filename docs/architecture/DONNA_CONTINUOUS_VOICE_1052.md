# DONNA Continuous Voice Session — Sprint 1052

**Sprint:** 1052 — DONNA Continuous Voice Session V1
**Date:** 2026-05-31
**Files changed:**
- `src/components/assistant/VoiceInputButton.tsx`
- `src/components/assistant/DonnaVoiceLayer.tsx`
- `src/components/assistant/DonnaAssistantButton.tsx`

---

## Problem

The voice session required the user to click the mic button to start, and again after every session stop. The session stopped too easily:
1. The user opened the panel → had to click the mic button to start
2. DONNA processed a response → the mic kept running, incrementing the retry counter during processing
3. After 5 silence cycles (~1.5 sec each), the session stopped → user had to click again

## Changes

### 1. `VoiceInputButton.tsx` — `autoStart` prop

Added `autoStart?: boolean` prop. When `autoStart` becomes `true` AND `persistent=true` AND voice is supported AND the session is idle, the session starts automatically.

```tsx
useEffect(() => {
  if (!autoStart || !persistent || supported !== true) return
  if (voiceState !== 'idle' || sessionActiveRef.current) return
  sessionActiveRef.current = true
  retryCountRef.current = 0
  setRetryExhausted(false)
  startRecognition()
}, [autoStart, supported])
```

**Fallback:** If the browser blocks microphone access, `onerror('not-allowed')` fires → `onError` callback → `voicePermissionError` state → "Voice is unavailable" notice shown to user. Graceful.

**Double-start guard:** `voiceState !== 'idle' || sessionActiveRef.current` prevents starting a second session.

### 2. `DonnaVoiceLayer.tsx` — three changes

**a) `autoStart` prop threaded through to VoiceInputButton**

**b) `maxRetries` increased from 5 to 20** — allows up to 20 consecutive silence cycles (~6 seconds total) before the session stops. Previously, 5 retries meant the session stopped after ~1.5 seconds of silence, which is too short for reading DONNA's response.

**c) `shouldPause` now fires during `isThinking` as well as `isSpeaking`**

Before: `shouldPause={isSpeaking}`
After: `shouldPause={isSpeaking || isThinking}`

When DONNA is processing (loading context, running God Mode, etc.), the mic is now paused. The retry counter doesn't increment while paused. When processing completes, the `shouldPause` effect resumes the mic after 600ms. This prevents retry exhaustion during DONNA's response time.

### 3. `DonnaAssistantButton.tsx` — pass `autoStart`

```tsx
autoStart={panelOpen && !isOnboardingActive(onboardingStep)}
```

- `autoStart=true` when panel opens (and not in onboarding flow)
- `autoStart=false` when panel closes/minimizes → voice session stops via the existing `closePanel()` cleanup
- When panel re-opens: `autoStart` changes false→true → effect re-fires → session restarts

---

## Resulting flow

1. User clicks DONNA button → panel opens
2. `autoStart=true` → VoiceInputButton starts session (if supported and permitted)
3. Header shows "Listening" status badge
4. User speaks → transcript → DONNA processes
5. `isThinking=true` → `shouldPause=true` → mic paused (session alive, retry counter not incrementing)
6. DONNA responds → `isThinking=false` → `shouldPause=false` → mic resumes after 600ms
7. User speaks next turn → repeat
8. User minimizes/closes DONNA → `panelOpen=false` → `autoStart=false`

---

## Safety

- No DB mutations, no proposed_actions changes
- Text input and God Mode submit flow unchanged
- Onboarding flow excluded from auto-start (`!isOnboardingActive(onboardingStep)`)
- Voice fallback: if mic blocked → graceful error message → user can type
- VoiceInputButton `handleToggle()` still works as manual start/stop
