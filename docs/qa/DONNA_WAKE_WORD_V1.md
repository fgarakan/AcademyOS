# DONNA Wake Word V1 — QA Checklist

**Sprint:** Mega Sprint 1791–1800
**Feature:** "Hey Donna" wake phrase activation
**Files:** `src/lib/donna/useDonnaWakeWord.ts`, `src/components/donna/DonnaWakeWordLayer.tsx`
**Browser requirement:** Chrome or Edge (SpeechRecognition API)

---

## Browser Compatibility

| Browser | Expected behavior |
|---|---|
| Chrome 90+ | Full wake word support |
| Edge 90+ | Full wake word support |
| Firefox | Component hidden — no wake word pill shown |
| Safari < 14.1 | Component hidden — no wake word pill shown |
| Safari 14.1+ | May work; not officially supported |

---

## Scenario 1 — Bare wake phrase

**Input:** User says "Hey Donna"
**Expected:**
- Wake pill shows "Hi, I'm listening."
- DONNA panel opens
- DONNA greeting shown (no command auto-submitted)
- After 600ms, pill transitions to "Listening…" (active state)
- 60-second inactivity timer starts

**Pass:** ✓ / Fail: ✗

---

## Scenario 2 — Full wake + command

**Input:** User says "Hey Donna, review Jamie"
**Expected:**
- Wake pill briefly shows "Hi, I'm listening."
- DONNA panel opens with "review Jamie" pre-filled
- DONNA processes "review Jamie" automatically (auto-submit fires after 400ms)
- Pill transitions to "Working on it…" then returns to "Listening…"
- DONNA response appears in the panel chat thread

**Pass:** ✓ / Fail: ✗

---

## Scenario 3 — Focus question via wake phrase

**Input:** User says "Hey Donna, what should I focus on today?"
**Expected:**
- DONNA panel opens
- "what should I focus on today?" is auto-submitted
- DONNA answers the focus question from existing directive intelligence

**Pass:** ✓ / Fail: ✗

---

## Scenario 4 — Continued active session (no wake phrase required)

**Pre-condition:** DONNA panel is open from a previous wake
**Input:** User speaks directly (no "Hey Donna")
**Expected:**
- Existing DONNA voice/text input in the panel handles the command normally
- Wake word layer does not interfere

**Pass:** ✓ / Fail: ✗

---

## Scenario 5 — Inactivity timeout

**Pre-condition:** User is in active state (just said "Hey Donna", panel is open)
**Action:** User stays silent for 60 seconds
**Expected:**
- Pill transitions to "Say Hey Donna to continue."
- After 4 seconds, pill returns to "Listening…"
- DONNA panel remains open; its own session is unaffected

**Pass:** ✓ / Fail: ✗

---

## Scenario 6 — Manual stop

**Pre-condition:** Listening mode is active
**Action:** User clicks the Stop (square) button on the wake pill
**Expected:**
- Pill returns to dormant state showing "Say Hey Donna" (grayed out)
- SpeechRecognition is fully stopped (no background mic access)
- DONNA panel is not affected

**Pass:** ✓ / Fail: ✗

---

## Scenario 7 — Text fallback

**Pre-condition:** Wake mode is dormant (or unsupported browser)
**Action:** User opens DONNA panel manually and types a command
**Expected:**
- Text input works exactly as before — wake word layer has no effect
- DONNA responds normally

**Pass:** ✓ / Fail: ✗

---

## Scenario 8 — Microphone permission denied

**Pre-condition:** User clicks Start on the wake pill
**Action:** User denies microphone permission in browser
**Expected:**
- Wake pill shows a permission error message above the pill
- Pill returns to dormant state
- No silent failure; user knows what happened
- DONNA text input in the panel is unaffected

**Pass:** ✓ / Fail: ✗

---

## Safety Checks

| Rule | Status |
|---|---|
| Wake word may NOT approve, promote, publish, or send without director gate | ✓ Enforced — wake routes through existing `donna:open` → `handleCommandSubmit` pipeline which has all existing guardrails |
| Wake word routes to existing DONNA pipeline — no duplicate routing | ✓ No separate command system built |
| Wake word does not bypass `proposed_actions` pipeline | ✓ DONNA still routes to review queue for all mutations |
| Text fallback still works when wake mode is off | ✓ Wake layer is independent of DONNA panel |
| No global always-listening without user consent | ✓ User must click the mic button to start; starts dormant |
| Mic access stops when user clicks Stop | ✓ `stopListening()` calls `recognition.abort()` |
| Component hidden on unsupported browsers | ✓ Returns null when `isSupported = false` |
| No audio stored, no transcripts persisted | ✓ SpeechRecognition is browser-only; no API calls, no DB writes |

---

## Known Limitations (V1)

- Two SpeechRecognition instances may run simultaneously (wake layer + DONNA panel voice). This is acceptable; browsers allow multiple instances.
- Wake word detection uses `detectWakePhrase()` from `donnaVoiceRuntime.ts` (keyword matching). Complex pronunciations or heavy accents may not trigger reliably.
- Component is desktop-only (`hidden lg:flex`). Mobile directors use the DONNA button directly.
- "Hey Donna" in active state is a no-op (resets timeout only). This prevents double-routing when the user says the wake phrase again while already active.
