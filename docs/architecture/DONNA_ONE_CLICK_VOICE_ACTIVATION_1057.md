# DONNA One-Click Voice Activation Guarantee — Sprint 1057

**Date:** 2026-05-31
**Status:** Implemented

---

## Problem

Sprint 1052 (DONNA Continuous Voice Session) introduced `autoStart` on `VoiceInputButton` to start the voice session automatically when the DONNA panel opens. However, two failure modes persisted:

1. **"Mic blocked" header badge** — `SpeechRecognition.start()` fires `onerror('not-allowed')` because mic permission was not yet granted for the site and the call was outside a direct user gesture.
2. **"Voice stopped after repeated silence"** — `VoiceInputButton` retries on every `onend` event (persistent mode, `maxRetries=20`). Since `not-allowed` errors do not clear `sessionActiveRef`, the retry loop fires 20 × ~300ms = ~6 seconds before exhausting.

---

## Root Cause

### Why `recognition.start()` fires outside a user gesture

The DONNA button click calls `openDonnaPanel()` (a React state update). React schedules a re-render. `VoiceInputButton` mounts in the new render. Two `useEffect` hooks fire after mount:

1. `useEffect([])` → detects `supported` → `setSupported(true)`
2. `useEffect([autoStart, supported])` → calls `startRecognition()`

Both effects fire **after the browser has painted the new panel**. By this point, the original click event's "transient activation" window may have moved on. More critically, if mic permission was not previously granted, Chrome requires the call to originate from a user gesture — and a `useEffect` does not satisfy that requirement.

### Why the retry loop fires for `not-allowed`

`VoiceInputButton.onerror` only set `recognitionRef.current = null`. It did not clear `sessionActiveRef.current`. `onend` fires after every `onerror` (browser guarantee). In persistent mode, `onend` checks `sessionActiveRef.current === true` and schedules a retry after 300ms. A `not-allowed` error is permanent — retrying will always fail — but the loop ran until `maxRetries=20` was exhausted.

---

## Fix

### Fix 1 — Stop retry loop on permanent permission errors (`VoiceInputButton.tsx`)

In `startRecognition > recognition.onerror`:

```
if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
  sessionActiveRef.current = false
}
```

`onend` checks `sessionActiveRef.current` before scheduling a retry. Setting it to `false` on a permanent error stops the loop immediately after the first failure.

### Fix 2 — Pre-authorize mic within the user gesture (`DonnaAssistantButton.tsx`)

In the DONNA floating button `onClick`, before `openDonnaPanel()`:

```js
if (!isOnboardingActive(onboardingStep) && typeof navigator !== 'undefined' && navigator.mediaDevices) {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => stream.getTracks().forEach(t => t.stop()))
    .catch(() => { /* permission denied — VoiceInputButton handles gracefully */ })
}
```

`navigator.mediaDevices.getUserMedia({ audio: true })` called within a click handler satisfies Chrome's user-gesture requirement for the mic permission prompt. Once the user clicks "Allow", Chrome stores the permission site-wide. Subsequent `SpeechRecognition.start()` calls from `useEffect` succeed because permission is already granted. Tracks are stopped immediately — no audio is captured, no stream is held open.

---

## Browser Behavior Model

| Condition | Result after fix |
|---|---|
| Mic permission already granted | Panel opens → `autoStart` useEffect fires → `recognition.start()` succeeds → **Listening** |
| Mic permission not yet granted (first use) | Click → `getUserMedia` dialog appears → user allows → panel opens → `autoStart` fires → **Listening** |
| Mic permission denied | Click → `getUserMedia` denied → panel opens → `not-allowed` error → loop stopped immediately → "Tap the mic button to start voice" message shown — no retry loop |
| Browser does not support SpeechRecognition | `VoiceInputButton` shows "Voice is unavailable in this browser" — no change from prior behavior |

---

## Invariants Preserved

- One DONNA button. One DONNA panel. One voice path.
- Text input, God Mode submit, response cards, chips, highlights, sidebar simplification all unaffected.
- No schema changes. No migrations.
- `proposed_actions` pipeline untouched.
- No audio captured or stored — `getUserMedia` tracks are stopped immediately.
- `VoiceInputButton` remains a self-contained component. No imperative refs added.
