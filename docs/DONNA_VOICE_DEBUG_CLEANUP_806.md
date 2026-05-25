# Sprint 806 — DONNA Voice Debug Controls Cleanup V1

**Date:** 2026-05-25
**Sprint:** 806
**Type:** UX cleanup — remove developer-level voice debug controls from director-facing panel
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

Sprint 805 certification blocker:

> **"Voice debug controls visible to directors"** — "Play Donna voice (browser)", "Try Browser Voice", "Reset Donna voice", "Did you hear it? Yes/No", "Realtime voice is not configured" are developer/diagnostic controls visible inside the DONNA onboarding panel. Directors see these during setup and interpret DONNA as a dev tool, not a trusted assistant.

Sprint 806 removes these controls and leaves only what a director needs:
1. A single **Play Donna voice** button
2. A single plain-language failure message: "Voice unavailable — type your response instead."

---

## What was removed

| Control | Why removed |
|---|---|
| Technical `realtimeStatus` status text ("Donna is connecting…", "Donna voice unavailable — browser voice available.", realtime error strings) | Exposes internal voice backend state to directors |
| "Try Browser Voice" button | Developer bypass — directors don't know what "browser voice" means |
| "Reset Donna voice" link | Dev recovery action — meaningless to directors |
| "Realtime voice is not configured. Browser voice or typed setup is available." | Internal config message — exposes architecture to directors |
| "Did you hear it? Yes / No" confirmation buttons | Confirmation loop is a developer test pattern, not a UX for directors |
| `voiceOutputConfirmed === true/false` follow-up states | Dependent on removed confirmation buttons |

## What was kept

| Control | Why kept |
|---|---|
| `DONNA_SAFETY_REMINDER` text | Core trust/safety copy — never remove |
| "Play Donna voice" primary button | Single clear voice action — user-meaningful |
| Button states: idle / starting / speaking / again / done | Status the director actually needs |
| Failure message: "Voice unavailable — type your response instead." | Simple, actionable fallback — no architecture exposed |

---

## Voice quality pill (secondary change)

Simplified two labels in the post-TTS status pill (opacity-50, shown only after TTS fires):

| Before | After |
|---|---|
| "Fallback device voice active" | "Device voice active" |
| "Text-only fallback" | "Text-only mode" |

Removed the word "Fallback" which implies a degraded path and may raise director concern.

---

## Before / after: DONNA onboarding voice section

**Before Sprint 806:**
```
DONNA_SAFETY_REMINDER
[technical realtimeStatus text: "Donna is connecting…" / error messages]
[Play Donna voice] or [Play Donna voice (browser)]  ← mode-dependent copy
  stall → "Donna voice was not confirmed. Try Browser Voice or continue typed."
          [Try Browser Voice]
          [Reset Donna voice]
  unavailable → "Realtime voice is not configured. Browser voice or typed setup is available."
  done/speaking → [Did you hear it? Yes] [No]
    confirmed=true → "Donna is ready."
    confirmed=false → "No problem — try browser voice or continue typed." [Try again]
```

**After Sprint 806:**
```
DONNA_SAFETY_REMINDER
[Play Donna voice]
  stall/error → "Voice unavailable — type your response instead."
```

Director path: clear. No technical copy. No recovery loops.

---

## Estimated score lift

| Dimension | Sprint 805 | Sprint 806 estimate |
|---|---|---|
| DONNA Side Panel | 74/100 | ~82/100 |
| Voice debug control visibility | 4/10 (debug visible) | 9/10 (removed) |

**Key gain:** Panel now reads as a finished product, not a voice debugging environment.

---

## Files changed in Sprint 806

- **Modified** `src/components/assistant/DonnaAssistantButton.tsx` — removed debug voice controls from onboarding section; simplified voice quality pill labels
- **Created** `docs/DONNA_VOICE_DEBUG_CLEANUP_806.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 806 entry
