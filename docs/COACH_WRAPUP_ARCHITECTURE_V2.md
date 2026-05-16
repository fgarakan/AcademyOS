# Coach Daily Wrap-Up Architecture V2

**Sprint:** 469 — Coach Daily Wrap-Up Architecture Audit V1
**Date:** 2026-05-16
**Extends:** `docs/coach-wrap-up-assistant-architecture.md` (Sprint 11 V1 baseline)
**Covers:** Sprints 469–484 (Coach Wrap-Up Block)

---

## Product goal

After every session, the coach completes a short guided wrap-up. DONNA (not DANA) asks one question at a time. The coach answers naturally — text or voice. The system turns those answers into structured drafts routed to the director review queue.

The coach never feels like they are filling out a form. They feel like they are debriefing with an assistant.

---

## Design principles

1. **One question at a time.** Never show the coach more than one prompt at a time.
2. **Natural language preferred.** The coach types or dictates freely — DONNA structures it.
3. **Short is fine.** A one-word answer ("yes", "all good") is valid input.
4. **Everything is a draft.** No output writes to official records until director approves.
5. **Mobile first.** The wrap-up must be usable on a phone immediately after a session.
6. **No cognitive overload.** Cap at 3–7 questions. Skip questions with obvious answers.

---

## Question order

Five guided questions in this sequence:

| # | Question | Output type | Input style |
|---|---|---|---|
| Q1 | Was everyone here today? Any absences or unexpected players? | Attendance draft | Multi-select + text |
| Q2 | Did the session go as planned? | Session actual draft | Select + optional text |
| Q3 | Who stood out positively? | Player observation (positive) | Player picker + text |
| Q4 | Who needs attention? | Player observation (concern) | Player picker + text |
| Q5 | Any parent or director follow-up needed? | Follow-up draft | Multi-type select + text |

DONNA may skip Q3/Q4 if answered clearly in Q2 (e.g., "everyone was great"). DONNA may add a follow-up prompt only when critical context is missing.

---

## Coach input model

Each question accepts:

```typescript
interface WrapUpAnswer {
  questionId: 'q1_attendance' | 'q2_session_actual' | 'q3_standouts' | 'q4_needs_attention' | 'q5_follow_up'
  rawText: string              // Free-text coach input
  structuredData: unknown      // Parsed by question-specific parser
  voiceTranscript: string | null  // If voice was used
  answeredAt: string           // ISO timestamp
  skipped: boolean
}
```

Structured data per question:

```typescript
// Q1
interface AttendanceAnswer {
  everyonePresent: boolean
  absences: { name: string; confirmed: boolean }[]
  unrostered: { name: string }[]
  unsure: boolean
}

// Q2
interface SessionActualAnswer {
  completedAsPlanned: boolean
  modifications: ('skipped_block' | 'added_block' | 'weather' | 'space_issue' | 'context_issue' | 'other')[]
  notes: string
}

// Q3 + Q4
interface PlayerObservationAnswer {
  players: { name: string; observation: string; nextStep: string | null }[]
}

// Q5
interface FollowUpAnswer {
  items: {
    type: 'parent_update' | 'director_follow_up' | 'coach_follow_up' | 'player_support' | 'admin_note'
    description: string
    playerName: string | null
  }[]
}
```

---

## Text input path

Coach types freely into a textarea. DONNA's question appears above the input. Coach taps "Next →" to advance.

- Minimum: 1 character (to handle "yes" / "all good")
- Maximum: 1,000 characters per answer
- Auto-grow textarea on mobile
- "Skip this question" link below input (not a primary action — avoid hiding it)

---

## Voice dictation path

Voice input uses **browser/device dictation** — no dependency install, no custom STT.

```typescript
// Detection
const hasSpeechRecognition =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
```

- If speech recognition available: show mic icon button that activates `SpeechRecognition`
- If not available: show "Use device keyboard dictation" note
- Text fallback always present regardless of voice support
- Voice transcript fills the same textarea as text — coach can edit before submitting

Future path (Sprint 480): Dedicated mic icon in the wrap-up input area. Sprint 481: DONNA spoken prompts via browser `speechSynthesis`.

---

## Adaptive question logic (Sprint 482)

DONNA reduces questions based on context:

| Condition | Action |
|---|---|
| Q1 answer is "everyone was here" (exact or near-exact) | Skip absence/unrostered sub-prompts |
| Q2 answer is "as planned" | Skip modification details |
| Q3 has no players named | Ask one prompt: "Anyone worth noting?" |
| Q5 follow-up mentioned in earlier answer | Ask for details instead of asking cold |
| 7 questions already answered | Do not ask more |

---

## Structured draft output

After all questions are answered, the wrap-up produces:

```typescript
interface CoachWrapUpDraft {
  sessionId: string
  coachId: string
  academyId: string
  answeredAt: string
  answers: WrapUpAnswer[]

  // Derived outputs
  attendanceDraft: AttendanceExceptionDraft[]   // → proposed_actions 'attendance_exception'
  sessionActualDraft: SessionActualDraft         // → voice_notes + proposed_actions 'session_wrap_up_v1'
  playerObservations: PlayerObservationDraft[]   // → coach_observations (is_private = true)
  followUpDrafts: FollowUpDraft[]                // → proposed_actions various types

  status: 'draft' | 'submitted' | 'director_reviewed'
}
```

---

## Director review routing

All coach wrap-up outputs route to the director review queue as `proposed_actions` with `status = 'pending_review'`.

| Output type | target_module | Review tab |
|---|---|---|
| Raw recap | `voice_notes` | Wrap-Up Recaps |
| Session actual draft | `session_wrap_up_v1` | Wrap-Up Recaps |
| Attendance exception | `attendance_exception` | Attendance Exceptions |
| Player observation | `coach_observations` (direct write, `is_private = true`) | Player Observations |
| Parent update candidate | `parent_update` | Parent Drafts |
| Director follow-up | `director_follow_up` | Director Notes |

---

## Safety boundaries — hard rules

| Rule | Enforcement |
|---|---|
| No official attendance write from wrap-up | Only `Save Attendance` button (independent of recap) writes to `session_attendance` |
| No player level movement | Wrap-up cannot trigger `finalize_player_placement()` |
| No parent send | Wrap-up outputs are drafts — no send action from wrap-up |
| No roster add | Unrostered player names are captured in text only |
| No profile mutation | Player observations write to `coach_observations.is_private = true` only |
| No template overwrite | Session actual draft does not modify `template_blocks` |
| No curriculum mutation | Wrap-up outputs do not affect curriculum records |
| All outputs are drafts | Every output has `status = 'pending_review'` |

---

## Mobile UX requirements (Sprint 479)

- One question per screen/section — never show two questions at once
- Large tap targets (min 48px height buttons)
- Progress indicator (e.g., "Question 2 of 5")
- "Back" to previous question
- "Skip" below main input (secondary, not blocking)
- Summary screen before submit — coach reviews all answers
- No horizontal scroll

---

## Sprint sequence (469–484)

| Sprint | Deliverable |
|---|---|
| 469 (this) | Architecture doc (this file) |
| 470 | Guided question flow (5-question sequence, one at a time) |
| 471 | Attendance first (Q1 sub-states: everyone, absences, unrostered, unsure) |
| 472 | Attendance exception parser (phrase → absence draft + unrostered draft) |
| 473 | Session actuals capture (Q2 structured output) |
| 474 | Coach player observation capture (Q3+Q4 structured) |
| 475 | Standouts and needs attention (Q3+Q4 UI) |
| 476 | Parent/director follow-up capture (Q5) |
| 477 | Review summary before submit |
| 478 | Recap to review queue routing |
| 479 | Coach mobile wrap-up UX |
| 480 | Voice dictation input UX |
| 481 | DONNA spoken prompt shell |
| 482 | Adaptive follow-up question logic |
| 483 | Safety pass |
| 484 | Regression |

---

## Relationship to existing work

- Sprint 11 V1 architecture: `docs/coach-wrap-up-assistant-architecture.md` — still valid for V1 storage pattern
- Sprint 12–15 implementation: `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — existing wrap-up drawer (6-question flow, voice input, summary). **Do not break this.** Sprints 470+ may refactor or extend the existing drawer, or create a new component — decision deferred to Sprint 470.
- Sprint 83: Director approve/reject + apply controls — fully built
- Sprint 84: Apply approved wrap-up → `sessions.session_notes` — fully built

---

## Known limitations from V1

- Unrostered players cannot be added to the roster from wrap-up (must use director review queue)
- Block progress (actual_status) not persisted to DB (localStorage only — Sprint 48 gap)
- Two recap UIs coexist: Quick Note + guided Wrap-Up (intentional — see Sprint 15)
- Save Attendance is independent of Save Recap (intentional — attendance is time-sensitive)
