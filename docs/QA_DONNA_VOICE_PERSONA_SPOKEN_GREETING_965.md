# QA Checklist — Sprint 965: DONNA Voice Persona + Spoken Greeting V1

**Date:** 2026-05-29

---

## TypeScript

- [ ] `npx tsc --noEmit` exits with code 0
- [ ] No errors in `src/lib/donna/donnaVoiceConfig.ts`
- [ ] No new errors in `src/components/assistant/DonnaAssistantButton.tsx`
- [ ] Sprint 964 files (`donnaPageChipRegistry.ts`, `DonnaPanelPageChips.tsx`) still compile cleanly

---

## Voice Config Checklist

- [ ] `DONNA_VOICE_PERSONALITY` is `'female_british_calm_coo'`
- [ ] `DONNA_OPENAI_TTS_VOICE` is unchanged (`'marin'`) — no fake/unsupported voice ID introduced
- [ ] `DONNA_OPENAI_TTS_MODEL` is unchanged (`'gpt-4o-mini-tts'`)
- [ ] `DONNA_VOICE_INSTRUCTIONS` includes "slight English or British accent"
- [ ] `DONNA_VOICE_INSTRUCTIONS` includes COO/professional/trustworthy framing
- [ ] `DONNA_VOICE_INSTRUCTIONS` does NOT mention specific player names, coach notes, or private data
- [ ] `preferredBrowserVoiceKeywords` lists British/UK female voices (Hazel, Libby, Serena, Moira, Fiona) before US quality voices
- [ ] `preferredBrowserVoiceKeywords` still includes US/neutral quality voices as fallback (Natural, Neural, Enhanced, Aria, Jenny, Samantha, Karen, Google US English)
- [ ] `Daniel` (macOS UK male) remains in the list but at lower priority
- [ ] `avoidBrowserVoiceKeywords` unchanged
- [ ] Comments in config honestly state browser fallback is best-effort and OS/browser-dependent

---

## Spoken Greeting Checklist

- [ ] When director opens DONNA panel for the first time on a given calendar day: greeting text is spoken
- [ ] Greeting uses `speakDonna(content.primaryText)` — NOT `speakAssistantText`
- [ ] `speakDonna` routes through `speakWithServerTts` → `/api/donna/tts` → `marin` voice
- [ ] If server TTS unavailable (no `OPENAI_API_KEY`): browser speechSynthesis fallback fires — no crash, no silent failure
- [ ] Greeting text comes from `buildDonnaOpeningGreeting(firstName, pathname, isFirstOpenToday)` — unchanged
- [ ] Visual greeting card (`showGreeting`) still appears alongside the spoken greeting
- [ ] `markDailyDonnaGreetingShown()` is called before `speakDonna` — same as before

---

## Anti-Repeat Checklist

- [ ] `hasGreetedRef.current` gate: greeting fires only once per component mount — subsequent panel opens in the same session do NOT re-speak
- [ ] `isFirstOpenToday` gate: greeting fires only on the first panel open of the calendar day
- [ ] Opening and closing the panel multiple times in the same session: greeting is NOT re-spoken
- [ ] Refreshing the page resets `hasGreetedRef` (React ref) — greeting can speak again on first open IF `isFirstOpenToday` is still true (has not yet been marked as shown)
- [ ] On second+ calendar day: `shouldShowDailyDonnaGreeting()` returns true → greeting fires on first open → `markDailyDonnaGreetingShown()` marks it for that day
- [ ] DONNA does NOT speak on every render

---

## One-Shell / No-Duplicate Checklist

- [ ] Exactly one DONNA FAB exists in the director shell — unchanged from Sprint 964
- [ ] No additional voice button added to the panel
- [ ] No new voice widget component created
- [ ] No second TTS API endpoint created
- [ ] `DonnaVoiceLayer` is unchanged
- [ ] `DonnaVoiceReadyShell` is unchanged
- [ ] Onboarding voice path (`speakAssistantText` in onboarding branch) is unchanged
- [ ] Dev tools voice test (`speakAssistantText` in test path) is unchanged
- [ ] `/director/donna` full-page command center is unchanged

---

## No-Duplicate Voice Path Checklist

- [ ] Only `speakDonna` is called for the director spoken greeting (Sprint 965 change)
- [ ] `speakAssistantText` is NOT called for the director greeting
- [ ] Both `speakDonna` and `speakAssistantText` still coexist in the codebase — each has its own use case; no paths were deleted
- [ ] `speakWithServerTts` is the single server TTS client function — not duplicated

---

## Browser Fallback Checklist

- [ ] When `OPENAI_API_KEY` is not set: `/api/donna/tts` returns 503 with `reason: 'server_tts_not_configured'`
- [ ] `speakWithServerTts` catches the non-audio response and falls through to `browserTtsFallback`
- [ ] `browserTtsFallback` applies `preferredBrowserVoiceKeywords` to select the best available voice
- [ ] On macOS Safari: Serena or Moira voice preferred when available
- [ ] On Windows: Hazel or Libby preferred when available
- [ ] On Chrome Linux/Android: typically no UK voices available; falls back to US quality voices — no crash
- [ ] If no voice matches any keyword: first available local English voice is used
- [ ] If no English voice at all: `window.speechSynthesis.speak(utt)` with default voice — no crash

---

## Route Safety Checklist

- [ ] `speakDonna` called from within `useEffect([panelOpen])` — not from voice input or any listener
- [ ] No microphone is activated by the spoken greeting
- [ ] No auto-listening added
- [ ] No always-listening mode added
- [ ] `speakDonna` does not trigger any UI action dispatcher
- [ ] `speakDonna` does not create any `proposed_actions` row

---

## No-Mutation / No-Send Checklist

- [ ] Spoken greeting does NOT create any database record
- [ ] Spoken greeting does NOT send parent/player communication
- [ ] Spoken greeting does NOT change player level, placement, roster, billing, attendance, curriculum, sessions, or templates
- [ ] `speakDonna` sends ONLY a text string to `/api/donna/tts` — no player names, no private data
- [ ] `/api/donna/tts` authenticates the user but writes nothing to the database
- [ ] `markDailyDonnaGreetingShown()` writes only a date string to `localStorage` — no DB write
- [ ] No `proposed_actions` record created
- [ ] No `audit_logs` record created
- [ ] `execute_approved_action()` not called
- [ ] `finalize_player_placement()` not called

---

## Protected Systems Checklist

- [ ] Sprint 964 page-aware chips (`DonnaPanelPageChips`) unchanged and still rendered
- [ ] Sprint 964 highlight escalation (`DonnaPanelPageChips` escalation tracking) unchanged
- [ ] Sprint 964 `donnaPageChipRegistry.ts` unchanged
- [ ] Sprint 904 approve/reject behavior untouched
- [ ] DONNA God Mode V1 (Sprints 939–960) systems untouched
- [ ] Emergency fix c94bad7 (impact preview client boundary) intact
- [ ] Coach wrap-up loop (Sprints 926–936) untouched
- [ ] `DonnaHighlightBanner` unchanged
- [ ] `data-donna-focus-id` targets on existing pages unchanged
- [ ] `DonnaSessionContextProvider` unchanged
- [ ] `donnaFocusTarget.ts` unchanged
- [ ] `donnaServerTtsClient.ts` unchanged
- [ ] `/api/donna/tts/route.ts` unchanged
- [ ] `donnaGreeting.ts` unchanged
- [ ] All `src/lib/backend/` files unchanged
- [ ] `src/middleware.ts` unchanged
- [ ] No RLS policies changed
- [ ] No migrations added
- [ ] No schema changes
- [ ] No npm packages added or removed
