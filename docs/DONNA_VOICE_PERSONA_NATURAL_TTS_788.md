# DONNA Voice Persona + Natural TTS V1 — Sprint 788

**Date:** 2026-05-25
**Sprint:** 788
**Status:** COMPLETE

---

## Goal

Unify DONNA's browser voice selection and rate/pitch settings so both speak paths (greeting/onboarding via `speakAssistantText`, and conversational via `speakDonna`) use the same central config. Also refine `DONNA_VOICE_INSTRUCTIONS` to better match the Sprint 786 persona standard.

---

## Problem Before Sprint 788

Two speak paths existed in `DonnaAssistantButton.tsx`:

| Path | Used for | Config source |
|---|---|---|
| `speakDonna()` → `speakWithServerTts()` | All conversational responses | `donnaVoiceConfig.ts` ✅ |
| `speakAssistantText()` | Greeting, onboarding questions, test voice | Inline hardcoded values ❌ |

`speakAssistantText` had:
- `utt.rate = 0.95` and `utt.pitch = 0.98` — hardcoded, could drift from central config
- Voice selection: only checked `natural`/`neural`/`enhanced` — missed `Samantha`, `Jenny`, `Aria`, `Google US English`, `Daniel`, `Karen` from `preferredBrowserVoiceKeywords`
- No `avoidBrowserVoiceKeywords` filtering — could select `compact` or other low-quality variants

---

## What Changed

### 1. `src/components/assistant/DonnaAssistantButton.tsx`

**New import** (after Sprint 350 server TTS import):
```ts
import {
  fallbackBrowserRate,
  fallbackBrowserPitch,
  fallbackBrowserVolume,
  preferredBrowserVoiceKeywords,
  avoidBrowserVoiceKeywords,
} from '@/lib/donna/donnaVoiceConfig'
```

**`speakAssistantText` — voice selection rewritten:**

Before (inline, Sprint 719):
```ts
utt.rate = 0.95
utt.pitch = 0.98
const preferred = voices.find(v =>
  v.lang.startsWith('en') && (
    v.name.toLowerCase().includes('natural') ||
    v.name.toLowerCase().includes('neural') ||
    v.name.toLowerCase().includes('enhanced')
  )
) ?? voices.find(v => v.lang.startsWith('en') && v.localService)
  ?? voices.find(v => v.lang.startsWith('en')) ?? null
```

After (central config, Sprint 788):
```ts
utt.rate = fallbackBrowserRate
utt.pitch = fallbackBrowserPitch
utt.volume = fallbackBrowserVolume
const usableVoices = voices.filter(v =>
  v.lang.startsWith('en') &&
  !avoidBrowserVoiceKeywords.some(kw => v.name.toLowerCase().includes(kw.toLowerCase()))
)
let preferred: SpeechSynthesisVoice | null = null
for (const keyword of preferredBrowserVoiceKeywords) {
  const match = usableVoices.find(v => v.name.toLowerCase().includes(keyword.toLowerCase()))
  if (match) { preferred = match; break }
}
if (!preferred) preferred = usableVoices.find(v => v.localService) ?? usableVoices[0] ?? null
```

**Result:** Both speak paths now use identical voice selection logic and the same rate/pitch/volume values. Config changes in `donnaVoiceConfig.ts` apply everywhere automatically.

### 2. `src/lib/donna/donnaVoiceConfig.ts`

**`DONNA_VOICE_INSTRUCTIONS` refined** to match the Sprint 786 persona standard:

Before:
```
'Speak like a warm, professional academy COO assistant. '
'Calm, confident, concise, and natural. '
'Helpful but not overly cheerful. '
'No announcer voice. No robotic cadence. '
'Pace yourself evenly. Pause naturally between sentences.'
```

After:
```
'Speak like a calm, professional tennis academy director. '
'Warm and composed — like a trusted colleague, not a customer service assistant. '
'Keep a measured, even pace. Pause briefly before questions so they land naturally. '
'No announcer tone. No robotic cadence. No filler words. '
'When offering to navigate or open something, keep the final question short and clear.'
```

Key improvements:
- "tennis academy director" > "COO assistant" — more specific to the domain
- "trusted colleague" — matches the Sprint 786 style target
- "Pause briefly before questions" — critical for DONNA's question-ending responses ("Want me to open it?")
- "keep the final question short and clear" — directly targets the most common DONNA response pattern

---

## What Was Not Changed

- No routing logic
- No DB/API behavior
- No new components
- No migrations
- `speakDonna` function unchanged — it already calls `speakWithServerTts` which uses the config
- `donnaServerTtsClient.ts` unchanged — `pickBrowserVoice()` already implements the same algorithm
- `testBrowserVoice()` unchanged — isolated test function, intentionally minimal

---

## Voice Config Source of Truth

After Sprint 788, `donnaVoiceConfig.ts` is the **single source of truth** for all DONNA voice settings:

| Setting | Used by |
|---|---|
| `DONNA_OPENAI_TTS_MODEL` + `DONNA_OPENAI_TTS_VOICE` | `/api/donna/tts` route |
| `DONNA_VOICE_INSTRUCTIONS` | `/api/donna/tts` route |
| `fallbackBrowserRate/Pitch/Volume` | `donnaServerTtsClient.ts` + `speakAssistantText` |
| `preferredBrowserVoiceKeywords` | `donnaServerTtsClient.ts` + `speakAssistantText` |
| `avoidBrowserVoiceKeywords` | `donnaServerTtsClient.ts` + `speakAssistantText` |

---

## TypeScript

Clean — `npx tsc --noEmit` passes with zero errors.
