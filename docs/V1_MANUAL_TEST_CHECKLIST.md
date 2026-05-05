# V1 Manual Test Checklist — Coach Operating Loop

**Sprint:** 16
**Date:** 2026-05-05
**Scope:** Sprints 10–15 features — coach session execution, wrap-up guided recap, attendance, player observations, session actual draft

---

## Prerequisites

- Logged in as a **coach** user
- A session exists in `/coach/sessions` (created by a director from a template)
- The session has a group with rostered players
- Session has blocks (exercises optional — depends on migration 056 status)

---

## 1 — Coach Sessions List

| Step | Action | Expected |
|---|---|---|
| 1.1 | Navigate to `/coach/sessions` | Session list loads with all sessions scoped to the coach's academy |
| 1.2 | Verify session cards show name, date, status | Name, scheduled date, status pill visible |
| 1.3 | Click a session | Routes to `/coach/sessions/{sessionId}` |

---

## 2 — Session Detail

| Step | Action | Expected |
|---|---|---|
| 2.1 | Page loads | Session name, date, time, duration visible. Snapshot notice ("planned session snapshot") visible |
| 2.2 | Session has blocks | Block list renders with block names, duration, type |
| 2.3 | Session has exercises (requires migration 056) | Exercise list renders under each block |
| 2.4 | Migration 056 NOT applied | "Migration pending" notice appears when blocks exist but exercises are empty |
| 2.5 | Roster section visible | Player roster shows names with attendance status selectors |
| 2.6 | Gap brief panel | `CoachSessionGapBriefPanel` shows player development gaps if roster is non-empty |
| 2.7 | Coach Recap panel | `CoachRecapCommandPanel` visible below gap brief |
| 2.8 | Session Actions | Two cards: "Quick Note" and "Wrap Up Session" at the bottom |

---

## 3 — Session Execution

| Step | Action | Expected |
|---|---|---|
| 3.1 | Set session status to "In Progress" | Status updates; saved to DB |
| 3.2 | Mark exercises as completed (if visible) | Completed checkboxes toggle; count updates |
| 3.3 | Save session notes | Text area saves on blur/submit |

---

## 4 — Attendance (Inline)

| Step | Action | Expected |
|---|---|---|
| 4.1 | Find attendance section in execution client | Player roster with Present/Absent/Late/Excused selectors |
| 4.2 | Change a player to "Absent" | Selector updates locally |
| 4.3 | Save attendance | `saveAttendanceAction` called; success confirmation shown |
| 4.4 | Reload page | Attendance status persists (loaded from DB) |

---

## 5 — Quick Note

| Step | Action | Expected |
|---|---|---|
| 5.1 | Tap "Quick Note" | `QuickCaptureDrawer` opens as overlay |
| 5.2 | Type a note | Text area accepts input |
| 5.3 | Save | Saves to `voice_notes` table; drawer closes |
| 5.4 | No crash on close without saving | Drawer closes cleanly |

---

## 6 — Wrap Up Session (Guided Recap)

### 6A — Question flow

| Step | Action | Expected |
|---|---|---|
| 6.1 | Tap "Wrap Up Session" | Full-screen overlay opens; shows "Question 1 of 6" |
| 6.2 | Progress bar | 6 dots visible; current dot highlighted lime |
| 6.3 | Answer Q1 (attendance) | Text area accepts multi-line input |
| 6.4 | Tap "Next" | Advances to Q2; progress bar updates |
| 6.5 | Tap "Back" | Returns to Q1; answer preserved |
| 6.6 | Skip a question (leave blank) | Can still advance |
| 6.7 | Complete all 6 questions | "Review" button appears on last question |
| 6.8 | Tap "Review" | Transitions to summary phase |

### 6B — Summary / Review phase

| Step | Action | Expected |
|---|---|---|
| 6.9 | Summary shows all 6 answers | Each question label + answer (or "Skipped") visible |
| 6.10 | Block completion section | Each block listed with Completed / Modified / Skipped selector |
| 6.11 | Change a block to "Skipped" | Selector updates locally |
| 6.12 | Player notes under "standouts" | Each rostered player has a text input; placeholder "What stood out?" |
| 6.13 | Player notes under "attention" | Each rostered player has a text input; placeholder "What needs attention?" |
| 6.14 | Add a note for one player | Text input accepts input |
| 6.15 | Note privacy label | "Saved as internal coach notes — not visible to players or parents" |
| 6.16 | Attendance section visible | Each rostered player has Present/Absent/Late/Excused selector |
| 6.17 | Attendance pre-populated | Each player defaults to their existing attendance status (or "present") |
| 6.18 | Change a player status | Selector updates locally |
| 6.19 | Tap "Save Attendance" | Calls `saveAttendanceAction`; "Saved ✓" appears on success |
| 6.20 | Attendance saved — selectors lock | Dropdowns become disabled after save |
| 6.21 | Unrostered note visible | "Unrostered players must go to director review..." note visible |
| 6.22 | Tap "Copy" | Clipboard receives summary text; button shows "Copied" briefly |
| 6.23 | Tap "Back" | Returns to Q6; summary state preserved |

### 6C — Save Recap

| Step | Action | Expected |
|---|---|---|
| 6.24 | Tap "Save Recap" | Button shows "Saving…" with spinner |
| 6.25 | Save succeeds | Transitions to "saved" phase — green check, "Wrap-up saved" |
| 6.26 | Saved state message | "Your recap has been saved for director review. Nothing official has been changed." |
| 6.27 | Tap "Done" | Overlay closes; returns to session detail |
| 6.28 | No crash on second open | Wrap-up drawer can be opened again |

### 6D — Error states

| Step | Action | Expected |
|---|---|---|
| 6.29 | Recap save fails (simulate network error) | Error message shown in footer: "Save failed. Try copying the summary instead." |
| 6.30 | Attendance save fails | Error message shown under attendance section |

---

## 7 — Director Review

| Step | Action | Expected |
|---|---|---|
| 7.1 | Log in as director | Navigate to `/director/review` |
| 7.2 | Find session wrap-up draft | `proposed_actions` entry with `target_module = 'session_wrap_up_v1'`, status `pending_review` |
| 7.3 | Find coach observations | `coach_observations` records with `is_private = true` for each player note entered |
| 7.4 | Find raw recap in voice_notes | `voice_notes` record with `player_id IS NULL` for the session |

---

## 8 — Coach Recap Panel (free-form path)

| Step | Action | Expected |
|---|---|---|
| 8.1 | Type in Coach Recap text area | Signal detection preview appears ("Absence mention", skill tags) |
| 8.2 | Tap "Save Recap" | Saves to `voice_notes`; success banner shown |
| 8.3 | Tap "Structure Now" (appears after save) | Calls `structureCoachRecapAction`; structured draft created |
| 8.4 | Structure result | Attendance mentions listed, observation count shown, link to director review |

---

## Known V1 Limitations (as of Sprint 15)

- **Migration 056 required for exercises.** Until applied, exercise lists are empty but sessions/blocks load correctly.
- **Wrap-up saves three things sequentially.** If raw recap save fails, structured draft and player observations are skipped.
- **Attendance save is independent of recap save.** Coaches can save attendance without completing the full recap.
- **Unrostered attendees** (players not in the group) cannot be captured via the wrap-up drawer — they must be noted in the free-form recap and flagged via the director's Attendance Exceptions panel.
- **Player names in observations are stored as strings**, not resolved to player IDs in the structured draft (session_wrap_up_v1). The `coach_observations` records do link to actual `player_id`.
- **Wrap-up state is not persisted** between opens. If the drawer is closed mid-session, answers are lost. Copy is the fallback.
