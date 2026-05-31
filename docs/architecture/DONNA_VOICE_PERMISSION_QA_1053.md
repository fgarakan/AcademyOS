# DONNA Voice Permission + Fallback QA — Sprint 1053

**Sprint:** 1053 — DONNA Voice Permission + Fallback QA V1
**Date:** 2026-05-31
**File changed:** `src/components/assistant/DonnaVoiceLayer.tsx`

---

## Problem

`DonnaVoiceLayer.tsx` showed a **hardcoded** error message regardless of the actual error:

> "Voice is unavailable. You can type, or retry microphone."

But `handleVoiceError` in `DonnaAssistantButton` already produces specific messages:
- `not-allowed` → "Microphone access is blocked. You can enable it in your browser settings or type instead."
- other errors → "Voice is unavailable right now. You can type instead."

These specific messages were passed via the `voicePermissionError` prop but then ignored — the hardcoded string appeared instead.

## Fix

Changed `DonnaVoiceLayer` to display `{voicePermissionError}` (the actual prop value) instead of the hardcoded string.

## Complete voice permission + fallback flow (post Sprint 1052–1053)

### First open (no permission yet)

1. User clicks floating DONNA button → panel opens
2. `autoStart=true` → `VoiceInputButton.autoStart` effect fires → `startRecognition()`
3. Browser prompts: "Allow microphone access?"

**If allowed:**
- Recognition starts → header shows "Listening"
- Session continues automatically

**If blocked/denied:**
- `onerror({error: 'not-allowed'})` → `handleVoiceError('not-allowed')`
- `voicePermissionError = "Microphone access is blocked. You can enable it in your browser settings or type instead."`
- Error shown in DonnaVoiceLayer with "Retry mic" button
- Text input remains fully functional

### After permission granted

- Panel opens → auto-starts without prompting again
- Session is persistent: speaks → processes → resumes listening

### Fallback paths

| Scenario | Behavior |
|---|---|
| Mic blocked (not-allowed) | "Microphone access is blocked..." + Retry mic button |
| Mic unavailable (hardware) | "Voice is unavailable right now. You can type instead." |
| Unsupported browser (Firefox) | VoiceInputButton shows "Voice is unavailable in this browser. You can type instead." instead of button |
| isThinking=true | Mic paused; resumes when processing completes |
| isSpeaking=true (TTS) | Mic paused; resumes 600ms after TTS ends |
| maxRetries exhausted | "Voice stopped — tap to restart" button shown |

### Text input fallback

Text input is always visible in the panel regardless of voice state. Submit button is always active.
