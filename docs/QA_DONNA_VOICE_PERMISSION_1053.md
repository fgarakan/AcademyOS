# QA — DONNA Voice Permission + Fallback — Sprint 1053

**Sprint:** 1053 | **Date:** 2026-05-31

---

## Permission error messages

### Mic blocked (not-allowed)
- [ ] Open DONNA → auto-start fires → browser blocks mic
- [ ] Error message: **"Microphone access is blocked. You can enable it in your browser settings or type instead."**
- [ ] **NOT the old hardcoded** "Voice is unavailable. You can type, or retry microphone."
- [ ] "Retry mic" button clears error

### Other voice errors
- [ ] Error message: "Voice is unavailable right now. You can type instead."

### Unsupported browser (Firefox etc.)
- [ ] "Voice is unavailable in this browser. You can type instead." shown instead of mic button

## Text fallback always works

- [ ] Textarea visible and focusable when voice is unavailable
- [ ] Send button submits typed text
- [ ] God Mode response renders in DonnaPanelResponseRenderer

## TypeScript

- [ ] `npx tsc --noEmit` passes clean
