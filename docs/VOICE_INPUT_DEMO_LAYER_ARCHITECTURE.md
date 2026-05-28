# Voice Input Demo Layer — Architecture

**Sprint:** 121
**Date:** 2026-05-01

---

## Purpose

The Voice Input Demo Layer adds safe, human-in-the-loop speech-to-text input to the Academy OS demo experience. It is not autonomous voice execution. It is a voice-powered text input method that feeds into existing human-review workflows.

The goal is to show prospective academy directors:

> "You can speak naturally to the system. It captures your words, shows them to you, and lets you review and edit before anything is created or changed."

---

## Why voice-to-text first, not autonomous voice execution

Autonomous voice execution — where a spoken command directly mutates data — requires:
1. A complete `execute_approved_action()` RPC covering all 14 action types (currently covers 3)
2. High-confidence intent parsing with clear rollback paths
3. Director trust built over multiple sessions

Voice-to-text first is safer because:
- The human sees exactly what the system heard
- The human can edit before submitting
- The existing draft → review → approve pipeline handles all mutations
- No new execution paths are added
- Failure mode is benign: the text box is just wrong, not a destructive action

This architecture gives the demo the feel of a voice-capable OS without bypassing safety guardrails.

---

## Operating model

```
User clicks microphone
→ Browser Web Speech API captures audio locally (no server, no external API)
→ Transcript appears in editable text box
→ User reviews and edits transcript
→ User manually clicks submit
→ Existing workflow creates a draft (proposed_actions / voice_notes)
→ Human reviews and approves the draft before anything changes
```

No step in this chain is automatic. The microphone is only an input method.

---

## Supported workflows (V1)

### 1. Curriculum customization (Sprint 123)

- Route: `/director/curriculum`
- Component: `VoiceOverrideInputPanel`
- Voice input replaces the existing textarea
- Spoken prompt → transcript → "Create Override Draft" button (manually triggered)
- Draft goes to Review Queue
- Nothing in the global curriculum changes automatically

### 2. Coach recap (Sprint 124)

- Route: `/director/sessions/[sessionId]`
- Component: `VoiceCoachRecapInput`
- Spoken recap → transcript → "Save Recap" button (manually triggered)
- Saves a `voice_notes` row (status: pending)
- Existing `StructureRecapButton` then optionally structures the recap into a draft
- Draft goes to proposed_actions as pending_review
- No player records, attendance, or priorities are modified automatically

### 3. Adaptive session planning prompt (future — Sprint 130+)

- Voice input for the session planning prompt
- Same pattern: speak → edit → submit → AI generates suggestions → human reviews

### 4. Player development intake (future — Sprint 140+)

- Voice input for initial player assessment notes
- Feeds into placement flow with explicit human review step

---

## Browser Web Speech API approach

```ts
const SpeechRecognitionClass =
  (window as any).SpeechRecognition ||
  (window as any).webkitSpeechRecognition || null

if (SpeechRecognitionClass) {
  const recognition = new SpeechRecognitionClass()
  recognition.continuous = true
  recognition.interimResults = false
  recognition.lang = 'en-US'
  recognition.onresult = (event) => { /* append to text box */ }
  recognition.start()
}
```

All audio processing happens inside the browser. No audio data is sent to any server.

---

## Fallback typing approach

If `SpeechRecognition` / `webkitSpeechRecognition` is unavailable:
- The voice button is hidden
- A calm inline message is shown: "Voice input is not available in this browser. You can still type."
- The text area remains fully functional
- The submit flow is identical

No degradation in functionality — voice is an enhancement, not a requirement.

---

## Guardrails enforced in V1

| Guardrail | Mechanism |
|---|---|
| Voice never applies changes | No auto-submit — user must click manually |
| Voice never moves player levels | VoiceTextInput has no connection to player actions |
| Voice never sends communication | No communication actions triggered by this layer |
| Voice never mutates parent/player views | Component scoped to director/coach context only |
| Voice never modifies master templates | Only session-level and academy override drafts |
| Voice never modifies global curriculum | Draft → review pipeline required |
| Manual edit always available | Textarea is editable after voice fills it |
| Typing fallback if voice unavailable | Always shown if SpeechRecognition is missing |
| Microphone errors handled gracefully | Error messages shown inline, typing still works |

---

## Privacy notes

- All audio is processed by the browser's built-in speech engine (Google in Chrome, Apple in Safari)
- No audio is sent to Academy OS servers
- No audio is stored or logged by Academy OS
- The transcript text is stored only after the user explicitly submits
- Users should be aware that browser speech engines may send audio to the browser vendor's servers per their privacy policy — this is outside Academy OS's control
- For sensitive contexts, typing is always available as an alternative

---

## No external AI/API policy

This layer uses ONLY:
- Browser Web Speech API (built-in, no install required)
- Existing Academy OS server actions (no new external calls)
- Existing rule-based structuring in `structureRecapAction.ts` (no AI)

It does NOT use:
- OpenAI / Whisper
- ElevenLabs
- Any third-party speech or AI API
- Any Academy OS AI endpoints

---

## Recommended sprint path (122–125)

| Sprint | Scope |
|---|---|
| 122 | `VoiceTextInput` reusable component + component docs |
| 123 | Integrate into curriculum customization panel |
| 124 | Integrate into session coach recap section |
| 125 | QA checklist + Brian demo script |

---

## Known browser limitations

| Browser | Status | Notes |
|---|---|---|
| Chrome (desktop) | Full support | SpeechRecognition available, continuous mode works |
| Safari 14.1+ | Partial support | webkitSpeechRecognition available; continuous may have quirks |
| Firefox | No support | SpeechRecognition not implemented; fallback to typing |
| Edge (Chromium) | Full support | Same as Chrome |
| Safari iOS | Partial | Works on-device but may require explicit permission |
| Chrome Android | Full support | Works with microphone permission |

The component detects support at runtime and degrades gracefully. Never show an error for unsupported browsers — only show the calm fallback message.

---

## File locations

| File | Role |
|---|---|
| `src/components/voice/VoiceTextInput.tsx` | Reusable voice input component |
| `src/app/director/curriculum/VoiceOverrideInputPanel.tsx` | Curriculum integration (Sprint 123) |
| `src/app/director/sessions/[sessionId]/VoiceCoachRecapInput.tsx` | Recap integration (Sprint 124) |
| `src/app/director/sessions/[sessionId]/saveSessionVoiceNoteAction.ts` | Server action for saving session recap |
