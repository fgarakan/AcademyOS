# Voice Unsupported Browser QA — Sprint 731

**Date:** 2026-05-17
**Sprint:** 731 — Voice Unsupported Browser QA V1
**Auditor:** Claude Code (automated codebase scan + manual review)

---

## 1. Executive Summary

**Result: Voice input degrades gracefully in all unsupported browsers. Text fallback is available everywhere voice is offered.**

The codebase detects SpeechRecognition API availability at mount time, before rendering any voice UI. When voice is unavailable, a calm inline message replaces the mic button. All voice input surfaces have a "type instead" path. No feature requires voice — all voice inputs also accept typed text.

No fixes required.

---

## 2. Browser Support Detection

### `useVoiceDictation.ts` — hook-level detection

```ts
function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}
```

On mount, the hook checks for `SpeechRecognition` or `webkitSpeechRecognition`. If neither exists:
- `state.isAvailable = false`
- `state.status = 'unavailable'`

The hook never throws. It returns a stable state object regardless of browser support.

### `VoiceInputButton.tsx:158` — UI-level detection

```tsx
// Unsupported browser — show calm inline note, not a button
if (!supported) {
  return (
    <p className="text-[10px] text-text-muted">
      <MicOff />
      Voice is unavailable in this browser. You can type instead.
    </p>
  )
}
```

While support is being detected (`supported === null`), the component renders `null` (no flash). When confirmed unsupported, it renders a calm inline message — not an error, not a broken button.

---

## 3. Text Fallback Availability

Every voice input surface has a text input path:

### `VoiceTextInput.tsx`

Dual-mode component: voice mic button + text area. When mic fails:
```ts
setMicError('Microphone access was denied. Allow microphone access in your browser settings, or type instead.')
setMicError('Voice capture stopped. You can try again or type instead.')
setMicError('Could not start voice capture. You can type instead.')
```

All mic error messages include "type instead" guidance. The text area remains active regardless of voice state.

### `WrapUpVoiceInput.tsx`

Coach wrap-up voice input. Has "Type instead" fallback button:
```tsx
Type instead
```

### `DirectorInterviewAssistant.tsx`

Director onboarding interview. Mic start is wrapped in try/catch:
```ts
try { r.start(); setListening(true) } catch { setMicError('Could not start voice capture. Type instead.') }
```

Text input is always present alongside the voice option.

### `DonnaConversationalPanel` and `DonnaVoiceLayer`

DONNA's conversational panel always shows a text input field. Voice is an enhancement — not the only input path. The "Send" button in these components submits typed text.

---

## 4. Permission Denied Handling

`useVoiceDictation.ts:160`

```ts
recognition.onerror = (event) => {
  const errorMap: Record<string, VoiceDictationError> = {
    'not-allowed': 'permission_denied',
    'permission-denied': 'permission_denied',
    'no-speech': 'no_speech',
    aborted: 'aborted',
    network: 'network',
    'service-not-allowed': 'unsupported',
  }
}
```

All SpeechRecognition error codes are mapped to named error types. `permission_denied` and `unsupported` are handled explicitly. The hook never crashes on an unrecognized error code — it uses `?? 'unknown'` fallback.

---

## 5. Realtime Voice (OpenAI Realtime API)

A separate Realtime voice mode exists in `useRealtimeInterviewVoice.ts` for the Director Interview Assistant. When Realtime is unavailable:
- `realtimeStatus: 'unavailable'` or `'error'`
- `realtimeUnavailableReason` is propagated to `DonnaVoiceDiagnostics`
- The UI falls back to browser STT or typed input

`DonnaDeveloperTools.tsx` and `DonnaVoiceDiagnostics.tsx` include diagnostic panels showing the unavailable reason — useful for development and troubleshooting.

---

## 6. Server-Side STT (Whisper)

The coach session transcription API route (`/api/coach/sessions/[sessionId]/transcribe`) calls OpenAI Whisper for audio transcription. If the Whisper call fails:

```ts
console.error('[transcribe] STT call failed', err)
```

The error is logged and the response returns an error payload. The coach session wrap-up UI handles this gracefully — the recap text field remains editable regardless of transcription success.

---

## 7. Risky Patterns Found

None. All voice surfaces degrade cleanly.

---

## 8. Fixes Made

None.

---

## 9. Final Safety Conclusion

**Voice unsupported browser states are handled correctly in AcademyOS V1.**

- SpeechRecognition availability is detected at hook-mount time before any UI renders
- Unsupported browser renders a calm inline message, not an error or broken button
- All voice inputs have a text fallback
- Permission denied, no-speech, network, and unsupported errors are all handled without crash

**Sprint 731 production readiness check: PASSED.**
