# DONNA Voice Loop Mobile QA — Sprint 1054

**Sprint:** 1054 — DONNA Voice Loop Mobile QA V1
**Date:** 2026-05-31
**File changed:** `src/components/assistant/DonnaAssistantButton.tsx`

---

## Mobile voice behavior by platform

### Android Chrome (primary mobile target)
- `webkitSpeechRecognition` supported
- Auto-start (Sprint 1052) works when mic permission is already granted
- First open: browser prompts for permission
- Subsequent opens: auto-starts immediately
- TTS pause/resume: works via `shouldPause` mechanism
- **Status: Full continuous voice loop**

### iOS Safari
- `webkitSpeechRecognition` supported
- **Auto-start does NOT work on iOS** — iOS requires a user gesture (tap) for each `start()` call, even if permission was previously granted
- `autoStart` effect fires → `startRecognition()` → iOS fires `onerror('not-allowed')`
- Error message: "Tap the mic button to start voice, or type your question below."
- User taps mic button (IS a user gesture) → recognition starts → session persists for the duration
- **Status: Manual first-tap required; continuous once started**

### Desktop Chrome / Edge (pilot primary)
- Full auto-start support
- Permission granted once; all subsequent opens auto-start
- **Status: Full continuous voice loop**

### Firefox (desktop/mobile)
- `SpeechRecognition` not supported
- `VoiceInputButton` shows "Voice is unavailable in this browser. You can type instead."
- Text input works fully
- **Status: Text fallback only**

---

## Fix: error message for `not-allowed`

**Before:** "Microphone access is blocked. You can enable it in your browser settings or type instead."
**After:** "Tap the mic button to start voice, or type your question below."

The previous message assumed the mic was permanently blocked (directing to browser settings). This is wrong for iOS (where the issue is the auto-start restriction, not a block) and potentially confusing on desktop where the mic may just need a gesture to prompt again.

The new message is action-oriented for both cases: tap the button (works on iOS) or type.

---

## Mobile panel layout

- Director (mobile): floating DONNA button is hidden (`hidden sm:flex`); `DONNADirectorMobileCommandBar` at bottom
- The DONNA panel on mobile: `w-full`, `bottom-[60px]` (leaves room for mobile bar)
- Voice button in panel has `min-h-[44px]` tap target (meets Apple 44px standard)
- Panel body has `overscroll-contain` (prevents pull-to-refresh on mobile)

---

## Known mobile limitation

iOS Safari requires a user gesture for each `webkitSpeechRecognition.start()` call. The auto-start mechanism (Sprint 1052) will fail on iOS on every panel open. The user must tap the mic button once per session. Once the session is started (persistent=true), it continues without re-tapping.

This is a platform constraint, not a code bug. No workaround exists without a native app bridge.
