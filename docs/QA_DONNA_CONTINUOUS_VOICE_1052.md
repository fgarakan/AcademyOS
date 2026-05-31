# QA — DONNA Continuous Voice Session — Sprint 1052

**Sprint:** 1052 | **Date:** 2026-05-31

---

## Auto-start behavior (Chrome/Edge only)

### First open (no mic permission yet)
- [ ] Open DONNA panel → voice attempts to start
- [ ] If permission not granted: "Voice is unavailable. You can type, or retry microphone." message appears
- [ ] Text input still works as fallback
- [ ] "Retry mic" button dismisses error

### Subsequent opens (permission already granted)
- [ ] Open DONNA panel → header shows "Listening" status badge within ~1 second
- [ ] No manual mic button click required to start
- [ ] User speaks → transcript appears in DonnaVoiceLayer

## Continuous session behavior

- [ ] User speaks → DONNA processes (header shows "Thinking…") → mic pauses
- [ ] DONNA responds → "Thinking…" clears → mic resumes after ~600ms → header shows "Listening" again
- [ ] User can speak next turn without clicking anything
- [ ] Session stays active through multiple turns

## maxRetries=20 behavior

- [ ] With 20 silence cycles, session stays active for ~6 seconds of silence
- [ ] After 20 consecutive silences (no speech), session stops gracefully
- [ ] "Voice stopped after repeated silence. Tap the button to start again, or type below." message
- [ ] User can click button to restart

## Manual control preserved

- [ ] Mic button still shows "Listening… (tap to stop)" when active
- [ ] Clicking button stops the session
- [ ] Clicking button again restarts the session

## Fallbacks preserved

- [ ] Text input works when voice is not active
- [ ] God Mode submit via text works normally
- [ ] Onboarding flow: voice does NOT auto-start during onboarding questions

## Minimized panel

- [ ] Minimizing panel (Minus button) — voice session behavior not changed mid-turn
- [ ] Re-opening minimized panel — voice session resumes correctly

## Unsupported browser (Firefox, etc.)

- [ ] "Voice is unavailable in this browser. You can type instead." shown instead of button
- [ ] Text input works

## TypeScript

- [ ] `npx tsc --noEmit` passes clean
