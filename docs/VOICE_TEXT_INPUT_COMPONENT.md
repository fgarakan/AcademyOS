# VoiceTextInput Component

**Sprint:** 122
**Date:** 2026-05-01
**File:** `src/components/voice/VoiceTextInput.tsx`

---

## Purpose

A reusable client-side component that provides a premium voice-to-text input experience using the browser's built-in Web Speech API. Falls back gracefully to a plain textarea when voice is unavailable.

This component is an **input method only** — it never submits data, never calls external APIs, and never mutates anything. The parent component controls submission.

---

## Props

```ts
interface VoiceTextInputProps {
  value: string               // controlled value
  onChange: (value: string) => void  // called when text changes (voice or typing)
  placeholder?: string        // default: 'Speak or type here…'
  label?: string              // label above textarea
  helperText?: string         // helper text below controls
  disabled?: boolean          // disables typing and voice button
  minRows?: number            // textarea rows (default: 3)
}
```

---

## Behavior

### Voice supported (Chrome, Edge, Safari 14.1+)

1. User clicks **Start speaking** → browser requests microphone permission
2. Microphone icon and "Listening…" indicator appear (pulsing)
3. Speech is processed locally by the browser engine
4. On each recognized utterance, transcript is appended to the current text
5. User clicks **Stop listening** (or speech ends naturally)
6. Text box becomes editable again — user reviews and edits
7. User submits via the **parent component's submit button** (not this component)

### Voice not supported (Firefox, older browsers)

- Voice button is not shown
- Calm inline message: "Voice input is not available in this browser. You can still type."
- Textarea works normally

### Microphone permission denied

- Error message shown: "Microphone access was denied…"
- Textarea remains functional
- User can type instead

### No-speech timeout

- Browser fires a `no-speech` error after silence
- Listening stops silently (no error shown to user)
- User can click Start speaking again

---

## Implementation notes

### SpeechRecognition detection

```ts
const Ctor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
```

Detection runs only after hydration (`useEffect`) to avoid SSR mismatch.

### Stale closure prevention

When listening starts, the current `value` is captured in `baseTextRef`. All recognition results are appended to this snapshot. This ensures that multiple `onresult` events accumulate correctly even though `value` changes with each recognized utterance.

### TypeScript local interfaces

The Web Speech API types (`SpeechRecognition`, `SpeechRecognitionEvent`, etc.) are not always present in TypeScript's default lib. Minimal local interfaces are defined at the top of the file to satisfy the compiler without installing external packages.

---

## Usage example

```tsx
import { VoiceTextInput } from '@/components/voice/VoiceTextInput'

function MyPanel() {
  const [text, setText] = useState('')

  return (
    <form onSubmit={handleSubmit}>
      <VoiceTextInput
        value={text}
        onChange={setText}
        label="Session recap"
        placeholder="Speak or type your recap…"
        helperText="Speak or type. The OS creates a draft for review — nothing changes automatically."
        minRows={4}
      />
      <button type="submit">Save Draft</button>
    </form>
  )
}
```

---

## Guardrails enforced

- No auto-submit
- No external API calls
- No audio stored by Academy OS
- Works as plain textarea when voice unavailable
- Textarea is disabled during listening (prevents mid-dictation edits)
- Clear button removes text without confirmation (low risk — no DB writes)
- Microphone errors shown inline without alarming language
