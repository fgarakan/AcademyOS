# DONNA Persistent Conversation Mode V1 — QA

Sprint: Mega Sprint 1791–1800
Date: 2026-06-04

## Overview

After "Hey Donna" starts a session, DONNA remains active as an academy partner / COO.
The user does not need to repeat the wake phrase. Every subsequent utterance is routed
as a command until the user explicitly ends the session.

---

## State machine

| State        | Description                                                  |
|--------------|--------------------------------------------------------------|
| dormant      | Mic off. Wake word disabled. Shows "Say Hey Donna to start." |
| listening    | Mic on, waiting for "Hey Donna" — pre-session               |
| wakeDetected | Wake phrase heard — "I'm here. What do you need?"           |
| active       | Persistent session: every utterance is a command             |
| processing   | Command dispatched to DONNA pipeline                         |
| paused       | Director paused session; mic off until resumed               |
| stopped      | Stop phrase/button fired; brief message, then → dormant      |

---

## Stop phrases

Any of the following end the persistent session:
- "Stop listening"
- "Donna stop"
- "Stop Donna"
- "That's all"
- "Go to sleep"
- "Goodbye Donna"
- "Bye Donna"

---

## QA Test Scenarios

### Scenario 1 — Basic wake
1. Navigate to any Director page.
2. Click the Mic button in the bottom-left pill to enable listening.
3. Say "Hey Donna".
4. **Expected:** State transitions: dormant → listening → wakeDetected → active.
5. **Expected:** SESSION ACTIVE badge appears. Pill shows lime glow.
6. **Expected:** DONNA panel opens (donna:open event fires).
7. **Expected:** Pill reads "DONNA is listening."

---

### Scenario 2 — Wake phrase with inline command
1. Enable listening (click Mic button or say "Hey Donna" to a prior session first).
2. Say "Hey Donna, review Jamie".
3. **Expected:** State jumps directly to processing, then active.
4. **Expected:** DONNA panel opens with "review Jamie" routed as command.
5. **Expected:** No need to say "Hey Donna" again.

---

### Scenario 3 — Follow-up command after activation
1. Complete Scenario 1 (session active).
2. Without saying "Hey Donna", say "Show evidence".
3. **Expected:** State → processing → active. Command routed to DONNA.
4. **Expected:** Session remains active. Wake phrase not required.

---

### Scenario 4 — Multiple commands in one session
1. Complete Scenario 1.
2. Say "What should I focus on today?" → routes, returns to active.
3. Say "Take me to Orange Ball 2" → routes, returns to active.
4. Say "Create a parent update draft" → routes, returns to active.
5. **Expected:** Each command routes without wake phrase.
6. **Expected:** Session stays active across all commands.
7. **Expected:** Existing approval guardrails preserved (no auto-mutations).

---

### Scenario 5 — Stop phrase ends session
1. Complete Scenario 1 (session active).
2. Say "Stop listening".
3. **Expected:** State → stopped (briefly shows "Say Hey Donna to start again.").
4. **Expected:** After ~2 seconds → dormant. SESSION ACTIVE badge disappears.
5. **Expected:** Mic stops. No further commands routed.
6. Repeat with: "Donna stop", "That's all", "Go to sleep".

---

### Scenario 6 — Stop button ends session
1. Complete Scenario 1 (session active).
2. Click the Stop (square) button in the pill.
3. **Expected:** State → dormant immediately.
4. **Expected:** SESSION ACTIVE badge disappears. Mic stops.
5. **Expected:** Pill returns to dormant style (grey, no glow).

---

### Scenario 7 — Pause and resume
1. Complete Scenario 1 (session active).
2. Click the Pause button in the pill.
3. **Expected:** State → paused. Pill shows "DONNA paused." Resume + Stop buttons visible.
4. Click the Resume (play) button.
5. **Expected:** State → active. Session resumes. Mic restarts.
6. Say a command without wake phrase.
7. **Expected:** Command routes successfully.

---

### Scenario 8 — Text input still works
1. Open the DONNA panel via the panel button (not voice).
2. Type a command in the text input.
3. **Expected:** Command processes normally.
4. **Expected:** No interference from wake word layer.
5. **Expected:** Existing routing and approval guardrails preserved.

---

### Scenario 9 — Browser fallback
1. Open the app in Firefox or Safari (no SpeechRecognition).
2. **Expected:** Wake word pill is not shown.
3. **Expected:** "Start Donna" button appears in its place.
4. Click "Start Donna".
5. **Expected:** DONNA panel opens (donna:open event fires).
6. **Expected:** Text input still available in panel.

---

### Scenario 10 — Approval guardrails preserved
1. Complete Scenario 1 (session active).
2. Say a command that would normally require director approval (e.g. "Move Jamie to Orange Ball 2").
3. **Expected:** Command is routed to DONNA as a draft/proposal.
4. **Expected:** No automatic execution. On-screen approval button still required.
5. **Expected:** Session state not affected by approval flow.

---

## Acceptance Checklist

- [ ] "Hey Donna" starts session
- [ ] Wake phrase required only once per session
- [ ] Follow-up commands work without wake phrase
- [ ] Commands route through existing DONNA pipeline (donna:open event)
- [ ] Stop phrase ends session
- [ ] Stop button ends session
- [ ] Pause/resume works
- [ ] SESSION ACTIVE badge visible during active session
- [ ] Mic ping animation visible when active
- [ ] "stopped" state shows briefly, then → dormant
- [ ] Browser fallback button shown on unsupported browsers
- [ ] Text input works independently of voice session
- [ ] Approval guardrails preserved — no auto-mutations
- [ ] TypeScript clean (npx tsc --noEmit)
- [ ] No unsafe mutations, no DB writes, no record changes from voice alone
