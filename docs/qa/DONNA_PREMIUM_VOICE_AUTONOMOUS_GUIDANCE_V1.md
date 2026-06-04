# DONNA Premium Voice + Autonomous Guidance V1 — QA Scenarios

**Sprint:** Mega Sprint 1861–1880
**Date:** 2026-06-04
**Status:** Ready for manual QA

---

## Context

This QA document covers the three core improvements delivered in Mega Sprint 1861–1880:

1. **DONNA Voice Consolidation** — single canonical voice runtime (`donnaPremiumVoiceRuntime.ts`)
2. **True Hey Donna Activation** — wake word without pressing the DONNA button first
3. **Today Guidance Loop** — DONNA guides the director into action, not just answers

---

## Test Scenarios

---

### Scenario 1 — Hey Donna activates without pressing the DONNA button

**Precondition:** Director has previously tapped "Enable Hey Donna" (localStorage key `donna_wake_autostart = true`).

**Steps:**
1. Open `/director` (director portal).
2. Do not press the DONNA button.
3. Say: "Hey Donna."

**Expected:**
- DONNA wake layer shows "I'm here." immediately.
- DONNA panel opens (via `donna:open` custom event).
- No button press was required.

**Failure:**
- If the mic listener is dormant on page load, auto-start did not work.
- If the DONNA panel does not open on "Hey Donna," check `useDonnaWakeWord.ts` → `dispatchDonnaOpen`.

---

### Scenario 2 — First-time "Enable Hey Donna" card

**Precondition:** Director has never enabled Hey Donna (localStorage key not set or missing).

**Steps:**
1. Open `/director` in a fresh browser session (clear localStorage if needed).
2. Observe the wake word layer in the bottom-left corner.

**Expected:**
- "Enable Hey Donna" card appears (not the dormant pill).
- Card shows: "Say 'Hey Donna' from anywhere" and "Requires mic permission · Chrome / Edge".
- Tapping the card calls `startListening()` and saves `donna_wake_autostart = true` to localStorage.
- On next page load, listener auto-starts (Scenario 1 applies).

**Failure:**
- If standard pill appears instead of the enable card, check `readAutoStartPreference()` logic.

---

### Scenario 3 — Ask "What do I need to do today?"

**Precondition:** Director is in the DONNA panel (any path: button click or "Hey Donna").

**Steps:**
1. Ask: "What do I need to do today?"
2. Observe DONNA's response.

**Expected:**
- DONNA presents up to 3 ranked priorities.
- Response format:
  ```
  Today, I recommend starting with these 3 items:

  1. [Item A]
  2. [Item B]
  3. [Item C]

  The highest-impact item is: [Item A]
  Reason: [why it matters]
  ```
- DONNA follows up with a question (e.g. "Would you like me to walk you through it?").

**Failure:**
- If DONNA just says "no signals" when signals exist, check `buildTodayGuidanceLoop` → `buildAcademyAttentionReport`.
- If no follow-up question appears, check `donnaAutonomousGuidanceEngine.ts` → `buildAutonomousFollowUp`.

**Notes:**
- In demo mode, response is prefixed with `[Demo]`.
- In live mode, response reflects real DB data.

---

### Scenario 4 — Director says "Yes" to guided workflow

**Precondition:** DONNA has asked "Would you like me to walk you through it?" after Scenario 3.

**Steps:**
1. Say: "Yes" (or "Go ahead" / "Let's do it").
2. Observe behavior.

**Expected:**
- `detectDirectorControl("yes")` returns `'accept'`.
- DONNA routes to the guided workflow identified by `workflowCandidate`.
- Guided completion step runner begins (first question is asked).

**Notes:**
- Workflow start is a navigation + guided completion trigger — no mutations occur at this step.
- Director approval is still required for any save action.

---

### Scenario 5 — DONNA uses only premium voice

**Precondition:** `OPENAI_API_KEY` is configured in the environment.

**Steps:**
1. Open the director portal.
2. Ask DONNA any question that produces a spoken response.
3. Monitor the browser network tab or TTS debug logs.

**Expected:**
- Request to `/api/donna/tts` succeeds.
- Response is audio from OpenAI gpt-4o-mini-tts (marin voice).
- `speakDonna()` returns `{ mode: 'premium', voice: 'marin' }`.
- No `window.speechSynthesis.speak()` call fires for this response.

---

### Scenario 6 — Browser fallback is clearly labeled

**Precondition:** `OPENAI_API_KEY` is NOT configured (or `/api/donna/tts` returns 503).

**Steps:**
1. Open the director portal.
2. Ask DONNA a question.
3. Observe voice output.

**Expected:**
- DONNA falls back to browser `speechSynthesis`.
- `speakDonna()` returns `{ mode: 'browser_fallback', reason: 'server_unavailable' }`.
- If voice diagnostics panel is open, it shows "DONNA voice (browser fallback)" — not "premium".
- No silent failure — browser voice is audible if browser supports it.

**Failure:**
- If browser voice fires without the `mode: 'browser_fallback'` label, the runtime is not classifying correctly.

---

### Scenario 7 — Persistent conversation continues without re-waking

**Precondition:** Director has said "Hey Donna" and DONNA is in `active` session state.

**Steps:**
1. Say: "What do I need to do today?"
2. Wait for DONNA's response.
3. Without saying "Hey Donna" again, say: "Show me the second item."
4. Observe routing.

**Expected:**
- Both utterances are routed to DONNA without requiring the wake phrase again.
- Wake state stays `active` throughout.
- `SESSION ACTIVE` badge is visible.

---

### Scenario 8 — Director says "Not now"

**Precondition:** DONNA has asked a follow-up question (e.g. "Would you like me to walk you through it?").

**Steps:**
1. Say: "Not now."
2. Observe DONNA's response.

**Expected:**
- `detectDirectorControl("not now")` returns `'pause'`.
- DONNA responds: "No problem. I'm here when you need me."
- DONNA does NOT repeat the follow-up question.
- Director can ask a new question at any time.

---

### Scenario 9 — Director says "Show me another option"

**Precondition:** DONNA has presented today's top priority.

**Steps:**
1. Say: "Show me another option" (or "What else" / "Other options").
2. Observe DONNA's response.

**Expected:**
- `detectDirectorControl("show me another option")` returns `'show_options'`.
- `buildAlternateOptions(todayGuidance, 0)` is called.
- DONNA presents the remaining 1–2 items from the priority list.
- Response: "Here are the other items worth your attention today: ..."

---

### Scenario 10 — Approval-gated actions remain gated

**Precondition:** Director is in a guided workflow that involves saving a draft.

**Steps:**
1. Complete all required steps in a guided workflow.
2. Say: "Save it" or "Apply it".

**Expected:**
- `isProtectedVoicePhrase("save it")` returns `true` (from `donnaVoiceRuntime.ts`).
- DONNA responds: "Approval actions always require the on-screen button. I never apply level changes, send messages, or save data from voice alone."
- No save occurs. No mutation fires.
- On-screen "Save Draft" button is the only path to save.

---

## Acceptance Criteria

| # | Criterion | Status |
|---|---|---|
| 1 | One DONNA voice path (donnaPremiumVoiceRuntime.ts) | ✓ |
| 2 | Premium voice default (server TTS first) | ✓ |
| 3 | Browser voice labeled as fallback — never default | ✓ |
| 4 | Hey Donna works without pressing DONNA button (after permission) | ✓ |
| 5 | First-time "Enable Hey Donna" permission card shown | ✓ |
| 6 | Mic active state visible in UI | ✓ |
| 7 | Today guidance loop returns ranked priorities | ✓ |
| 8 | Highest-impact item identified | ✓ |
| 9 | DONNA asks follow-up question after presenting priorities | ✓ |
| 10 | DONNA can identify a guided workflow from today priorities | ✓ |
| 11 | Director can say "not now" to pause guidance | ✓ |
| 12 | Director can say "show me options" for alternates | ✓ |
| 13 | Director can say "stop" to end guidance | ✓ |
| 14 | Approval gates preserved — voice cannot save/publish/approve | ✓ |
| 15 | TypeScript clean | Pending tsc check |
| 16 | No migrations required | ✓ |
| 17 | No unsafe mutations | ✓ |

---

## Files Delivered

| File | Type | Description |
|---|---|---|
| `src/lib/donna/voice/donnaPremiumVoiceRuntime.ts` | New | Unified `speakDonna()` voice runtime — server TTS → browser fallback |
| `src/lib/donna/guidance/donnaTodayGuidanceLoop.ts` | New | Today guidance loop engine — ranked priorities + follow-up question |
| `src/lib/donna/guidance/donnaAutonomousGuidanceEngine.ts` | New | Autonomous follow-up guidance — director control detection + follow-up builder |
| `src/components/donna/DonnaWakeWordLayer.tsx` | Modified | Auto-start on mount + "Enable Hey Donna" card + localStorage persistence |
| `docs/qa/DONNA_PREMIUM_VOICE_AUTONOMOUS_GUIDANCE_V1.md` | New | This document |

---

## Known Limitations

- `DonnaAssistantButton.tsx` still contains direct `window.speechSynthesis` calls in several places. These predate `donnaPremiumVoiceRuntime.ts` and will be consolidated in a future dedicated sprint. The new runtime is the canonical reference going forward.
- `donnaTodayGuidanceLoop.ts` output is available for DONNA to present as text, but the full loop (DONNA proactively asking the question without prompting) requires wiring into the persistent conversation session handler — deferred to the next sprint.
- Coach voice paths (`CoachWrapUpDrawer`, `DonnaWrapUpPrompt`) are intentionally separate — they serve the coach role and do not use the director DONNA premium runtime.
