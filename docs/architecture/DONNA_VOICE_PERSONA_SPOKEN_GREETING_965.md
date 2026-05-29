# DONNA Voice Persona + Spoken Greeting V1

**Sprint:** 965  
**Date:** 2026-05-29  
**Status:** Complete

---

## Official DONNA Voice Persona

DONNA's voice identity is defined in `src/lib/donna/donnaVoiceConfig.ts` as:

```
DONNA_VOICE_PERSONALITY = 'female_british_calm_coo'
```

| Attribute | Value |
|---|---|
| Gender presentation | Female-sounding |
| Accent | Slight English / British accent |
| Tone | Calm, trustworthy, premium, COO-like |
| Pace | Medium-slow, clear, deliberate |
| Energy | Composed confidence |
| Avoid | Hype, cheerleader tone, robotic cadence, over-familiar tone |

**Honest disclosure:** The British/English accent is _requested_ through voice instructions to the `gpt-4o-mini-tts` model. OpenAI does not offer a guaranteed British-accent voice ID as of Sprint 965. The server path shapes accent fidelity through `DONNA_VOICE_INSTRUCTIONS`; the browser fallback is best-effort only (see below).

---

## Current TTS Path (unchanged from Sprint 720)

```
Director opens DONNA panel
  └─ isFirstOpenToday = true (once per calendar day)
       └─ speakDonna(greetingText)                   ← upgraded from speakAssistantText (Sprint 965)
            └─ speakWithServerTts(text, onStatus)    ← donnaServerTtsClient.ts
                 │
                 ├─ Path 1: POST /api/donna/tts
                 │    └─ OpenAI gpt-4o-mini-tts + marin + DONNA_VOICE_INSTRUCTIONS
                 │         (British accent instruction, calm COO tone)
                 │    Fallback: tts-1-hd + nova (if plan lacks gpt-4o-mini-tts)
                 │    Returns: audio/mpeg → HTMLAudioElement.play()
                 │
                 └─ Path 2: browser speechSynthesis (if Path 1 fails or OPENAI_API_KEY absent)
                      └─ preferredBrowserVoiceKeywords (British/UK voices first, then US quality)
```

No new TTS API. No new DONNA button. No new voice widget. One path — `speakDonna`.

---

## Server TTS — Voice ID and Instructions

**Model:** `gpt-4o-mini-tts`  
**Voice:** `marin` (preserved — warmest, most professional voice available on this model)  
**Fallback voice:** `nova` on `tts-1-hd` (for plans without `gpt-4o-mini-tts`)

**Voice instructions (Sprint 965 update):**
> "Speak with a slight English or British accent — calm, composed, and trustworthy. You are DONNA, an AI COO assistant for a tennis academy. Professional and warm — like a trusted senior colleague, not a customer service assistant. Keep a measured, even pace. Pause briefly before questions so they land naturally. No announcer tone. No robotic cadence. No filler words. When offering to navigate or open something, keep the final question short and clear."

The British accent instruction is applied via `gpt-4o-mini-tts` voice instructions. The `marin` voice ID is not replaced — it is the safest supported voice and the instructions shape its delivery style. If a future OpenAI release adds a guaranteed British-accent voice ID, update `DONNA_OPENAI_TTS_VOICE` in `donnaVoiceConfig.ts`.

---

## Browser TTS Fallback — Voice Preference Order (Sprint 965 update)

Previous order prioritized US quality voices (Samantha, Jenny, Aria) first.  
Sprint 965 reorders to prefer British/UK female voices:

| Priority | Keyword | Voice | OS |
|---|---|---|---|
| 1 | `Hazel` | Microsoft Hazel | Windows (UK female) |
| 2 | `Libby` | Microsoft Libby | Windows (UK female) |
| 3 | `Serena` | Serena | macOS (UK English female) |
| 4 | `Moira` | Moira | macOS (Irish English — closest British female on macOS) |
| 5 | `Fiona` | Fiona | macOS (Scottish English) |
| 6–13 | Natural, Neural, Enhanced, Aria, Jenny, Samantha, Karen, Google US | Quality US/neutral | Various |
| 14 | `Daniel` | Daniel | macOS (UK English male — lower priority per persona) |

**Honest disclosure:** Browser voice availability depends on the user's OS and browser. Chrome on Linux/Android typically has no UK voices and will use a US voice. Safari iOS may offer UK voices on some locales. The server TTS path (`marin` + voice instructions) is the authoritative voice — the browser fallback is always best-effort.

---

## Spoken Greeting Behavior

### What triggers it

In `DonnaAssistantButton.tsx`, inside the `useEffect([panelOpen])` handler:

```ts
if (!hasGreetedRef.current) {
  hasGreetedRef.current = true
  setShowGreeting(true)
  // ...
  if (role === 'director') {
    const isFirstOpenToday = shouldShowDailyDonnaGreeting()
    const content = buildDonnaOpeningGreeting(firstName, pathname, isFirstOpenToday)
    setDailyGreetingState(greeting)
    if (isFirstOpenToday) {
      markDailyDonnaGreetingShown()
      speakDonna(content.primaryText)   // ← Sprint 965: was speakAssistantText
    }
  }
}
```

### What it speaks
`buildDonnaOpeningGreeting(firstName, pathname, isFirstOpenToday)` — returns role+page-aware copy from `donnaGreeting.ts`. The greeting text is unchanged; only the voice path is upgraded.

### What it does NOT do
- Does not speak on every render.
- Does not speak on every panel re-open in the same session.
- Does not speak if it is not the first open of the calendar day.
- Does not auto-listen (no microphone activated by greeting).
- Does not send any communication to parents or players.

---

## Anti-Repeat / Spam Prevention

Two independent guards are combined:

| Guard | Scope | Backing store | Resets when |
|---|---|---|---|
| `hasGreetedRef.current` | React component mount | React ref (RAM) | Component unmounts (full page reload) |
| `isFirstOpenToday` | Calendar day | `localStorage` | Calendar day changes |

Result: The spoken greeting fires at most **once per calendar day on the first panel open**. All subsequent panel opens in the same day show the visual greeting but do not speak it.

This behavior is identical to the pre-Sprint-965 pattern — Sprint 965 only upgrades the voice path, not the frequency rules.

---

## No Second Voice Surface

Sprint 965 does NOT add:
- A second voice button
- A second voice widget
- A second TTS path
- A separate voice persona component
- Any changes to `DonnaVoiceLayer`, `DonnaVoiceReadyShell`, or the onboarding voice path

The only change in `DonnaAssistantButton.tsx` is the substitution of `speakAssistantText` → `speakDonna` on the director greeting branch (3 lines total).

`speakAssistantText` (browser-only speechSynthesis) remains in use for:
- Onboarding voice prompts (Sprint 290 path)
- Voice test button (dev tools)
- Template question read-aloud during creation

These paths are not changed. They are intentionally separate from the greeting path because they must fire from user-gesture events (browser autoplay policy requires it).

---

## Voice Settings UI — V2

No voice on/off affordance is added in Sprint 965. The KNOWN_LIMITATIONS doc notes that the director configuration screen (`/director/configuration`) is not yet built. When it is:

- Add a "DONNA Voice" toggle that controls whether `speakDonna()` fires on greeting
- Store preference in `localStorage` (no schema change needed)
- Preference key: `academyos:donna:voiceEnabled:v1`

Sprint 965 documents this as V2 work; no code change is required today.

---

## Coach / Parent / Player Parity — V2

The coach greeting branch in `DonnaAssistantButton.tsx` still uses `speakAssistantText`. Upgrading it to `speakDonna` follows the same pattern as the director change and is V2 work when coach DONNA role-shell parity is built.

---

## Files Changed

| File | Type | Change |
|---|---|---|
| `src/lib/donna/donnaVoiceConfig.ts` | Modified | `DONNA_VOICE_PERSONALITY` updated; British accent added to `DONNA_VOICE_INSTRUCTIONS`; `preferredBrowserVoiceKeywords` reordered to prefer British/UK voices |
| `src/components/assistant/DonnaAssistantButton.tsx` | Modified | Director greeting branch: `speakAssistantText(content.primaryText)` → `speakDonna(content.primaryText)` (3 lines) |

---

## Safety Boundaries

- No DB reads or writes.
- No parent or player data exposed.
- `speakDonna` sends only the greeting text string to `/api/donna/tts` — authenticated endpoint, no private data in the text.
- Proposed actions pipeline untouched.
- Sprint 904 approve/reject paths untouched.
- Sprint 964 page-aware chips untouched.
- `execute_approved_action()` not called.
- `finalize_player_placement()` not called.
- No RLS changes.
- No migrations.

---

## No-Migration Guarantee

Sprint 965 introduces zero schema changes. No migrations. No new tables. No RLS policy changes. No new npm packages. Pure config + 3-line component change.
