# QA — DONNA Voice Loop Mobile — Sprint 1054

**Sprint:** 1054 | **Date:** 2026-05-31

---

## Desktop Chrome/Edge (pilot primary)

- [ ] Open DONNA panel → voice auto-starts (header shows "Listening")
- [ ] Speak → DONNA processes → mic pauses → DONNA responds → mic resumes
- [ ] No manual tap required between turns
- [ ] Panel minimize → re-open → voice auto-starts again

## iOS Safari (mobile)

- [ ] Open DONNA panel → auto-start attempts → `not-allowed` → error appears
- [ ] Error message: **"Tap the mic button to start voice, or type your question below."**
- [ ] NOT: "Microphone access is blocked. You can enable it in your browser settings..."
- [ ] User taps mic button → recognition starts
- [ ] Session continues without re-tapping for subsequent turns

## Android Chrome (mobile)

- [ ] Open DONNA panel → auto-starts if permission granted
- [ ] Voice loop works same as desktop

## Firefox (any)

- [ ] "Voice is unavailable in this browser. You can type instead." shown
- [ ] Mic button not shown
- [ ] Text input works

## Mobile panel layout

- [ ] Panel is full-width on mobile (no overflow)
- [ ] Panel stops at `bottom-[60px]` (mobile bar area is clear)
- [ ] Mic button has sufficient tap target (≥44px height)

## TypeScript

- [ ] `npx tsc --noEmit` passes clean
