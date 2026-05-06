# V1 Manual Test Checklist — Coach Operating Loop + Assistant Demo

**Sprint:** 87
**Date:** 2026-05-06
**Scope:** Sprints 67–87 — role-based UX, mobile layout, director mission control, coach assistant, voice output, director assistant, review cards, personality, demo polish, voice input, transcription architecture, transcription endpoint, audio recorder UI, name guardrails, audit log, wrap-up approve/apply, director voice intake, TTS plan, demo hardening

---

## Sprint 67–77 Quick Check

| Check | Area | Expected |
|---|---|---|
| S67 | Audit doc exists | `docs/role-based-ux-simplification-audit.md` present |
| S68 | Coach session mobile layout | "Wrap Up Session" is a full-width lime button. Attendance prompt appears before gap brief. |
| S69 | Director dashboard links | All command card links go to existing routes (no 404s). "Today's Priorities" label visible. |
| S70 | Coach assistant text flow | Wrap-Up header shows "Assistant · Wrap-Up". Questions show "Academy OS asks" label. Quick buttons on Q1 and Q2. |
| S71 | Coach review summary | Summary phase shows "Here's what I understood", block counts, queued observations, "Not shared with parents" note. "Save Wrap-Up" button (renamed from "Save Recap"). "Save as quick note" option if incomplete. |
| S72 | Voice output | Voice toggle button appears in step header (when `speechSynthesis` supported). "Under 60 sec" label visible. Toggling ON speaks the current question. Toggling OFF cancels speech. |
| S73 | Director assistant panel | `/director/command-center` shows "Ask what needs attention" panel with 7 suggestion chips. Tapping a chip shows a deterministic response. |
| S74 | AssistantActionCard | Response card shows: suggested action, why, expandable "What changes?", risk badge, safety note, dismiss, action link. |
| S75 | Personality guidelines | `docs/assistant-personality-and-voice-guidelines.md` present. `src/lib/assistant/personality.ts` present. |
| S76 | Sidebar clean | Intelligence, Competition, Reports, Configuration removed from sidebar. Only built routes shown. |
| S77 | Voice input | "Speak" mic button visible below textarea in question step (Chrome/Edge). Tapping starts listening. Transcript appends to answer. Unsupported browsers show fallback note. |
| S78 | Architecture doc | `docs/voice-transcription-security-architecture.md` present. Covers data flow, hard rules, security controls, privacy, STT provider, cost controls. |
| S79 | Transcription endpoint | `POST /api/coach/sessions/[sessionId]/transcribe` returns 503 when `OPENAI_API_KEY` not set. Returns transcript when key is set and audio is valid. Does not store audio. |
| S80 | Audio recorder UI | "Record" button appears in question step alongside "Browser Dictation". Tapping Record asks for mic permission. Timer counts up. Tapping Stop sends audio to endpoint. "Transcribing…" shows. Transcript appends to answer. Error shows if endpoint unavailable. "Audio is used only to create a transcript and is not saved." copy visible. |
| S85 | Director voice intake | `/director/command-center` shows text input + "Speak" button above suggestion chips. Speaking "review" or "wrap-ups" auto-selects corresponding chip. Speaking unknown term shows fallback: "I can help with: review, wrap-ups, attendance…". Typing Enter also matches. Nothing executes automatically. |
| S86 | TTS stop button | "Stop" button appears next to "Voice on" toggle when voice output is active. Tapping Stop cancels speech synthesis. `docs/assistant-tts-upgrade-plan.md` present. |
| S87 | Demo hardening | Full demo flow works end-to-end. All voice copy is clear about audio not being stored. Error states visible and safe. `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` updated to Sprint 87 flow. |
| S88 | gitignore + env | `.gitignore` exists. `git check-ignore .env.local` returns a match. `OPENAI_API_KEY` present in `.env.local` (add manually). Transcription returns `{ ok: true, transcript }` when key is set. Returns safe 503 when key is absent. |

---

## Assistant Demo Flow (End-to-End)

| Step | Role | Action | Expected |
|---|---|---|---|
| 1 | Director | Open `/director/command-center` | "Ask what needs attention" assistant panel visible |
| 2 | Director | Tap "What needs review today?" | Deterministic response card appears with pending count, why, action link to review queue |
| 3 | Director | Tap "Open Review Queue" | Routes to `/director/review` |
| 4 | Director | (optional) Tap "Show pending coach wrap-ups" | Response shows pending wrap-up count and safety note |
| 5 | Coach | Open a session in `/coach/sessions` | "Wrap Up Session" lime button visible near top of page |
| 6 | Coach | Tap "Wrap Up Session" | Full-screen "Assistant · Wrap-Up" drawer opens |
| 7 | Coach | Answer Q1 with quick button "Everyone here" | Advances to Q2 automatically |
| 8 | Coach | Complete remaining questions | Progress bar fills. Questions show "Academy OS asks" label. |
| 9 | Coach | Reach summary | "Here's what I understood" header. Block counts. "Not shared" note. |
| 10 | Coach | Tap "Save Wrap-Up" | Saves to director review queue. Routes back. |
| 11 | Director | Return to `/director/review` | New wrap-up item visible in queue |
| 12 | Parent | Open `/parent` | Development plan visible. No raw coach notes. Session history humanised. |
| 13 | Player | Open `/player` | "Current Level" card. "What to Work On" section. No score or assessment data. |

---

## Known Voice Output Limitations (Sprint 72)

- Voice toggle only appears when `window.speechSynthesis` is available (Chrome/Edge; not on iOS Safari).
- Voice reads assistant prompt questions only — not answers, notes, or summaries.
- Voice is off by default. No autoplay.
- Not all browsers support `speechSynthesis`. Falls back silently (no toggle shown on unsupported browsers).

---

## Sprint 77 Voice Input Checks

| Step | Action | Expected |
|---|---|---|
| 77.1 | Open wrap-up drawer in Chrome/Edge | "Speak" mic button visible below answer textarea |
| 77.2 | Tap "Speak" | Button turns red, shows "Listening…", page microphone permission prompt may appear first time |
| 77.3 | Say: "Everyone was here, we completed the movement and forehand blocks, Sarah needs help with grip." | Transcript appears appended to the answer textarea |
| 77.4 | Edit the transcript text | Textarea accepts manual edits normally |
| 77.5 | Tap "Stop" while listening | Recognition stops, transcript is inserted, state returns to idle |
| 77.6 | Tap Next | Proceeds to next question; voice input available on each question |
| 77.7 | Complete all 6 questions with voice answers | Summary phase shows all transcribed answers |
| 77.8 | Tap Save Wrap-Up | Saves normally — voice input does not change the save flow |
| 77.9 | Open in Firefox or iOS Safari | "Speak" button is hidden; note reads: "Voice input is not supported in this browser. You can still type or use your keyboard dictation." |
| 77.10 | Verify no audio recorded | No audio blob, no network request for audio, no storage of raw audio |

## Known Voice Input Limitations (Sprint 77)

- Browser `SpeechRecognition` / `webkitSpeechRecognition` only — Chrome and Edge supported, Firefox and iOS Safari not supported.
- Single-shot recognition — each tap starts one recognition session that ends when the coach stops speaking or taps Stop.
- No interim/streaming results — transcript appears only after the utterance ends.
- No audio stored. No audio uploaded. Transcription is entirely in-browser.
- No Whisper, no ElevenLabs, no external STT backend.
- Coach must review and can edit the transcript before saving.
- Nothing saves automatically from voice input.

---

## Sprint 78–87 Voice + Approval Loop Checks

| Step | Area | Action | Expected |
|---|---|---|---|
| 78.1 | Architecture doc | Check file exists | `docs/voice-transcription-security-architecture.md` present and complete |
| 79.1 | Transcription endpoint | Call `POST /api/coach/sessions/{id}/transcribe` without key | Returns 503 + "Production transcription is not configured. You can still type or use browser dictation." |
| 79.2 | Auth guard | Call endpoint unauthenticated | Returns 401 |
| 79.3 | MIME guard | Send wrong MIME type | Returns 415 Unsupported Media Type |
| 79.4 | Size guard | Send file >4MB | Returns 413 |
| 80.1 | Record button | Open wrap-up drawer | "Record" button visible in question step |
| 80.2 | Record flow | Tap Record | Mic permission prompt (first time). Timer starts. |
| 80.3 | Stop flow | Tap Stop | "Transcribing…" appears. Transcript (or error) appears in textarea. |
| 80.4 | No-key fallback | With no OPENAI_API_KEY | Error: "Production transcription is not configured. You can still type or use browser dictation." |
| 80.5 | Privacy copy | At rest | "Audio is used only to create a transcript and is not saved." visible below Record button |
| 80.6 | Auto-stop | Let recording exceed 60s | Recording stops automatically at 60s |
| 80.7 | Both options | Question step | "Record" and "Browser Dictation" both visible with "or" separator |
| 81.1 | Name detection (match) | Speak/type a roster player name in an answer | Summary shows "Roster names mentioned" card with player's name |
| 81.2 | Name detection (no-match) | Type a name not on roster | Summary shows orange warning: "Name not on roster — do not save as player note unless you confirm" |
| 81.3 | Common words excluded | Type "Today Everyone completed" | "Today" and "Everyone" not flagged as unmatched names |
| 82.1 | Audit log | Successful transcription with key | audit_logs row created: action=voice_transcription.completed, audio_retained=false |
| 82.2 | No transcript in audit | Check audit log row | payload does NOT contain transcript text |
| 83.1 | Approve button | Open pending wrap-up in review queue | Approve, Reject, Needs Clarification buttons visible |
| 83.2 | Approve action | Tap Approve | Status changes to approved. Apply button appears. |
| 83.3 | Reject action | Tap Reject | Status changes to rejected. Item preserved (not deleted). |
| 84.1 | Apply action | Tap Apply on approved item | Session notes updated. Session marked completed. Audit log written. proposed_action.status = executed. |
| 84.2 | Template safe | After apply | Template blocks unchanged. Curriculum unchanged. Player profiles unchanged. |
| 85.1 | Director voice | `/director/command-center` Speak "review" | "What needs review today?" chip activates. Response card shown. |
| 85.2 | Director text | Type "wrap up" in input + Enter | "Show pending coach wrap-ups" chip activates. |
| 85.3 | Unknown fallback | Speak something unrelated | Fallback note: "I can help with: review, wrap-ups, attendance, players, assessment, curriculum, and sessions." |
| 85.4 | No auto-action | Voice command matched | Response card shown. No data changed. No page navigated automatically. |
| 86.1 | Stop button | Enable voice output in wrap-up | "Stop" button appears next to "Voice on" toggle |
| 86.2 | Stop cancels speech | Tap Stop while speaking | Speech synthesis cancels immediately |
| 86.3 | TTS plan doc | Check file | `docs/assistant-tts-upgrade-plan.md` present |
| 87.1 | Parent portal safe | After completing full voice flow | `/parent` shows no internal coach notes. No raw observations. No voice transcript. |
| 87.2 | Player portal safe | After completing full voice flow | `/player` shows no coach observations. No attendance flags for individuals. |
| 87.3 | Audio never stored | Full flow | No audio blob in browser storage (check Application → IndexedDB → Local Storage). No audio in Supabase storage. |

---

## Original Sprint 10–15 Checklist

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
