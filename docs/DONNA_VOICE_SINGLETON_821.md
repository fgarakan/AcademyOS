# Sprint 821 — DONNA Voice Singleton V1

**Date:** 2026-05-25
**Sprint:** 821
**Type:** Voice architecture refinement
**Files changed:** 1 source file + 2 docs

---

## What this sprint delivers

DONNA now sounds like one assistant with one voice across the director experience.

**Before:** The OpenAI Realtime voice could fire in the floating DONNA panel (on any director page), producing a different voice than the Server TTS used elsewhere. Two systems could collide in the same session.

**After:** Realtime is restricted to `/director/onboarding/interview` only. The floating panel greeting and onboarding speech routes through `speakDonna()` (Server TTS → browser fallback). One voice, one system per context.

---

## Voice Path Architecture (post-821)

| Context | Voice Path | System |
|---|---|---|
| `/director/onboarding/interview` | Path 1: OpenAI Realtime | `useDonnaRealtimeVoice` → `realtimeConnect()` + `realtimeSpeak()` |
| `/director/onboarding/interview` (Realtime fails) | Path 2: Browser TTS | `window.speechSynthesis` |
| All other director pages (floating panel) | Path 1.5: Server TTS | `speakDonna()` → `speakWithServerTts()` → browser fallback |

---

## Implementation

### `src/components/assistant/DonnaAssistantButton.tsx`

Modified `playOnboardingVoice()` function:

1. **Added `isInterviewPage` gate** — `pathname.startsWith('/director/onboarding/interview')`
2. **Path 1 (Realtime)** — only entered when `isInterviewPage === true`
3. **Path 1.5 (Server TTS)** — new branch for non-interview pages:
   ```typescript
   if (!isInterviewPage) {
     activatedVoiceModeRef.current = 'browser'
     speakDonna(text)
     setVoiceGreetingStatus('done')
     return
   }
   ```
4. **Path 2 (Browser TTS)** — retained as interview-page-only fallback when Realtime fails

---

## What was NOT changed

- `useDonnaRealtimeVoice.ts` — untouched (used on interview page)
- `src/app/api/director/interview/realtime-session/route.ts` — untouched
- `speakDonna()` / `speakWithServerTts()` — untouched
- All DONNA UI, panel layout, or navigation logic — untouched

---

## Safety

- No data mutations
- No voice auto-starts (user must still trigger DONNA)
- No role boundary changes
- No external API changes (Realtime still available on interview page)

---

## TypeScript

Clean — `npx tsc --noEmit` passes with no errors.
