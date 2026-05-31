# QA — DONNA One-Click Voice Activation Guarantee
## Sprint 1057

**Date:** 2026-05-31
**Environment:** Desktop Chrome / Edge, mic permission controllable via browser settings

---

## Setup

1. Open the app as a director.
2. To test first-time permission: go to site settings → reset mic permission to "Ask".
3. To test already-permitted: grant mic permission once, then reload.

---

## Test Suite

### A. One-Click Activation — Permission Already Granted

| # | Step | Expected Result | Pass/Fail |
|---|---|---|---|
| A1 | Mic permission is "Allow" in browser settings | — | — |
| A2 | Click the DONNA floating button (bottom-right) | Panel slides open | |
| A3 | Observe the panel header badge within 2 seconds | Shows **Listening** (red pulse) — not "Mic blocked", not "Ready" | |
| A4 | Speak any phrase | `DONNA heard` transcript appears in the voice card | |
| A5 | Do not click the internal mic button | Voice started without second click — one DONNA click only | |

### B. One-Click Activation — First Use (Permission Not Yet Granted)

| # | Step | Expected Result | Pass/Fail |
|---|---|---|---|
| B1 | Reset mic permission to "Ask" in browser site settings | — | — |
| B2 | Click the DONNA floating button | Browser permission dialog appears | |
| B3 | Click "Allow" in the permission dialog | Panel opens (or is already open), header badge shows **Listening** | |
| B4 | Speak any phrase | Transcript appears | |
| B5 | No second mic click needed | Voice started from first DONNA click | |

### C. Permission Denied — Clean Fallback, No Retry Loop

| # | Step | Expected Result | Pass/Fail |
|---|---|---|---|
| C1 | Reset mic permission to "Block" in browser site settings | — | — |
| C2 | Click the DONNA floating button | Panel opens | |
| C3 | Observe within 1 second | Header shows **Mic blocked** (orange badge) | |
| C4 | Observe voice card message | Shows "Tap the mic button to start voice, or type your question below." | |
| C5 | Wait 10 seconds | "Voice stopped after repeated silence. Tap the button to start again." does NOT appear | |
| C6 | Voice card retry count | Internal mic button shows `Ask DONNA` (idle) — no 20-retry loop | |
| C7 | Type a question in text input and press Send | DONNA responds normally | |
| C8 | Tap the internal mic button manually | Error message shown once — still no retry loop | |

### D. DONNA Responds — Voice Resumes After

| # | Step | Expected Result | Pass/Fail |
|---|---|---|---|
| D1 | Click DONNA → Listening | Panel header shows **Listening** | |
| D2 | Ask: "What needs attention today?" | DONNA processes → header shows **Thinking…** then a response card | |
| D3 | Wait for response to finish | Header returns to **Listening** (or **Paused** briefly, then **Listening**) | |
| D4 | Ask another question by voice | DONNA hears and responds again — continuous loop works | |

### E. Minimize / Expand — Session Preserved

| # | Step | Expected Result | Pass/Fail |
|---|---|---|---|
| E1 | Click DONNA → panel opens → Listening | — | |
| E2 | Click DONNA again (while open) | Panel minimizes — session preserved (no new mic dialog) | |
| E3 | Click DONNA again (while minimized) | Panel expands — returns to previous state | |
| E4 | No extra permission dialogs on E2 or E3 | getUserMedia only fires on fresh open | |

### F. Text Input Preserved

| # | Step | Expected Result | Pass/Fail |
|---|---|---|---|
| F1 | Click DONNA → panel opens | Text area is visible below the voice card | |
| F2 | Type a question and press Enter or Send | DONNA responds | |
| F3 | Voice starts AND text input works simultaneously | No conflict | |

### G. God Mode Preserved

| # | Step | Expected Result | Pass/Fail |
|---|---|---|---|
| G1 | Click DONNA → type a complex question | Response card appears with a God Mode result | |
| G2 | God Mode highlights and navigation links work | Clicking a suggestion navigates correctly | |

### H. Onboarding — No Mic Pre-Auth During Intro

| # | Step | Expected Result | Pass/Fail |
|---|---|---|---|
| H1 | Clear `academyos:donna:introCompleted:v1` from sessionStorage | — | |
| H2 | Reload and click DONNA (no director name set) | Onboarding intro starts — no mic permission dialog fired pre-emptively | |
| H3 | Onboarding completes normally | — | |

### I. Unsupported Browser (Firefox / Safari 16 or earlier)

| # | Step | Expected Result | Pass/Fail |
|---|---|---|---|
| I1 | Open app in Firefox or unsupported Safari | — | |
| I2 | Click DONNA | Panel opens normally | |
| I3 | Voice card shows | "Voice is unavailable in this browser. You can type instead." | |
| I4 | Text input still works | DONNA responds to typed input | |

---

## Regression Checks

| Area | Expected | Pass/Fail |
|---|---|---|
| Response cards (GOD Mode + COO thread) | Render correctly, no regression | |
| Chip bar (page-aware suggestions) | Chips appear, clicking sends prompt | |
| Sidebar simplification | Sidebar still simplified (Sprint 1040 behavior) | |
| Director review queue badge | Still shows pending count | |
| Coach portal voice | VoiceInputButton behavior in wrap-up drawer unaffected | |

---

## Known Limitations

- **First use on HTTP (non-localhost)**: `getUserMedia` may be blocked by browser; voice already unavailable there — not a regression.
- **iOS Safari**: `SpeechRecognition` not supported. Voice shows the unsupported message. No change from prior behavior.
- **Permission dialog timing**: On first use, the browser permission dialog may appear briefly before the panel opens. This is expected and standard browser behavior.
- **Service-not-allowed**: Rare error on some enterprise Chrome policies. Handled identically to `not-allowed` — session stops, no retry loop.
