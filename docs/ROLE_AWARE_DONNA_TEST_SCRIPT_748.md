# Role-Aware DONNA Real-World Test Script — Sprint 748

**Sprint:** 748
**Date:** 2026-05-17

---

## Purpose

A manual test script for verifying that DONNA behaves correctly for each role in AcademyOS. Tests cover: what DONNA can surface, what DONNA must not surface, and that role boundaries hold in the real UI.

---

## Director DONNA Tests

### D1 — DONNA daily brief

- Navigate to `/director` → check DONNA executive card
- **Expected:** Academy Health summary, what needs attention, review queue count
- **Must not show:** Another academy's data; raw SQL; internal field names

### D2 — DONNA command center

- Navigate to `/director/command-center`
- Type: "What needs attention today?"
- **Expected:** Structured response with Academy Health signal, review queue count, coach wrap-ups pending
- **Must not show:** Parent-facing content, automatic execution messages

### D3 — DONNA curriculum override

- Navigate to `/director/curriculum`
- Speak or type a curriculum customization
- **Expected:** Draft created in review queue; "Draft — not yet applied" confirmation
- **Must not show:** "Applied" or "Changed" without going through review queue

### D4 — DONNA cannot auto-send

- Navigate to any parent draft in review queue
- **Expected:** "Send" button disabled or absent; only "Approve Draft" visible
- **Must not show:** A "Send Now" action that bypasses review

---

## Coach DONNA Tests

### C1 — Coach wrap-up is scoped

- Log in as coach; open a session; open wrap-up drawer
- **Expected:** Questions about this session's players and blocks only
- **Must not show:** Other coaches' session data; director-level approval options; review queue full interface

### C2 — Coach cannot approve PA

- Log in as coach
- **Expected:** No "Approve" button visible on any proposed action
- If coach navigates to `/director/review` → **Expected:** Redirect to `/coach` (middleware enforcement)

### C3 — Voice fallback works

- On coach session page, click mic button; deny microphone permission
- **Expected:** Text input fallback visible with "You can type instead" message
- **Must not show:** Crash or blank screen

---

## Player DONNA Tests

### P1 — Player sees only own profile

- Log in as a player (requires profile_id linkage)
- Navigate to `/player`
- **Expected:** Own development plan, own curriculum level, own learning modules
- **Must not show:** Other players' data; coach session notes; director intelligence

### P2 — Player cannot reach director routes

- While logged in as player, navigate to `/director`
- **Expected:** Redirect to `/player` (middleware enforcement)

---

## Parent DONNA Tests

### PA1 — Parent sees only child's profile

- Log in as a parent (requires guardian linkage)
- Navigate to `/parent`
- **Expected:** Child's approved development plan only
- **Must not show:** Other players; coach notes (internal); director review queue

### PA2 — Parent cannot trigger sends

- While logged in as parent, navigate to `/director/review`
- **Expected:** Redirect to `/parent` (middleware enforcement)

---

## Test Results Template

| Test | Expected | Actual | Pass/Fail |
|---|---|---|---|
| D1 | Academy Health + review count | | |
| D2 | Structured DONNA response | | |
| D3 | Draft in queue | | |
| D4 | No send button | | |
| C1 | Scoped to session | | |
| C2 | No approve button | | |
| C3 | Text fallback visible | | |
| P1 | Own profile only | | |
| P2 | Redirect to /player | | |
| PA1 | Child's plan only | | |
| PA2 | Redirect to /parent | | |

Fill in "Actual" column during manual testing session with Brian or during pre-pilot verification.
