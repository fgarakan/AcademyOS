# Coach Wrap-Up Loop — Final Certification

**Sprint:** 936 | **Date:** 2026-05-29
**Scope:** Sprints 926–936 — Coach Wrap-Up Mega Sprint
**Status:** Internal Pilot Ready (V1)

---

## 1. Full Loop Map

```
COACH WRAP-UP LOOP — End to End

  ┌─────────────────────────────────────────────────────────────┐
  │  COACH HOME  /coach                                         │
  │  Sprint 926: CoachDailyBriefCard — next session + status    │
  │  Sprint 928: Wrap-up status badges on session list          │
  └───────────────────┬─────────────────────────────────────────┘
                      │ "Start Session" →
  ┌─────────────────────────────────────────────────────────────┐
  │  SESSION EXECUTE  /coach/sessions/[id]/execute              │
  │  Sprint 927: /execute routes to /wrap-up after done         │
  └───────────────────┬─────────────────────────────────────────┘
                      │ → /wrap-up
  ┌─────────────────────────────────────────────────────────────┐
  │  COACH WRAP-UP  /coach/sessions/[id]/wrap-up                │
  │  Sprint 927: 6-question DONNA flow                          │
  │    • Voice input per question (AudioRecorder + Browser STT) │
  │    • Player name chips for standouts/attention              │
  │    • Optional player observation drafts in saved state      │
  │  On submit:                                                 │
  │    a. proposed_actions: session_wrap_up_v1 (pending_review) │
  │    b. Auto-parse Q1 attendance → attendance_exception draft │
  │    c. Optional: coach_observation_draft_v1 (per player)     │
  └───────────────────┬─────────────────────────────────────────┘
                      │ → /wrap-up/review
  ┌─────────────────────────────────────────────────────────────┐
  │  COACH REVIEW  /coach/sessions/[id]/wrap-up/review          │
  │  Sprint 933: Loop completion summary card                   │
  │  Sprint 932: Per-player note status list                    │
  │  Sprint 935: Attendance exception status                    │
  └─────────────────────────────────────────────────────────────┘
                      ↕ (director reviews in parallel)
  ┌─────────────────────────────────────────────────────────────┐
  │  DIRECTOR REVIEW QUEUE  /director/review                    │
  │  Sprint 931: WrapUpObservationDraftCard (approve/reject/    │
  │              request clarification)                         │
  │  Sprint 934: WrapUpDraftCard player mention chips           │
  │  Existing: AttendanceExceptionDraftCard                     │
  │  Existing: WrapUpDraftCard + ApplyWrapUpDraftControls       │
  └─────────────────────────────────────────────────────────────┘
                      ↓ director approves + applies
  ┌─────────────────────────────────────────────────────────────┐
  │  OFFICIAL RECORDS                                           │
  │  sessions.session_notes (applied wrap-up)                   │
  │  coach_observations (applied observation drafts)            │
  │  session_attendance (approved attendance exceptions)        │
  └─────────────────────────────────────────────────────────────┘
                      ↓ coach visibility
  ┌─────────────────────────────────────────────────────────────┐
  │  COACH PLAYER PROFILE  /coach/players/[id]                  │
  │  Sprint 930: Coach Signals section                          │
  │    • Pending observation draft count                        │
  │    • Group session wrap-up status                           │
  └─────────────────────────────────────────────────────────────┘
```

---

## 2. Files / Systems Involved

### Server Actions (write)
| File | Action | Creates |
|---|---|---|
| `saveWrapUpDraftAction.ts` | Coach submits wrap-up | `session_wrap_up_v1` proposed_action |
| `saveWrapUpDraftAction.ts` | Auto-parse attendance | `attendance_exception` proposed_action |
| `saveWrapUpObservationsAction.ts` | Optional player notes | `coach_observation_draft_v1` proposed_action |
| `saveWrapUpAttendanceExceptionAction.ts` | Drawer unexpected attendees | `attendance_exception` proposed_action |
| `actions.ts` (review) | Director approve/reject | Updates `proposed_actions.status` |
| `applyWrapUpDraftAction.ts` | Director applies wrap-up | Writes `sessions.session_notes` |
| `applyApprovedObservationDraftAction.ts` | Director applies obs | Writes `coach_observations` |

### Pages / Components (read)
| File | Purpose | Sprint |
|---|---|---|
| `src/app/coach/page.tsx` | Coach home — daily brief + status | 926, 928 |
| `src/app/coach/_components/CoachDailyBriefCard.tsx` | Next session + wrap-up strip | 926, 928 |
| `src/app/coach/sessions/page.tsx` | Sessions list + wrap-up badges | 929 |
| `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx` | 6-question DONNA wrap-up | 927 |
| `src/app/coach/sessions/[sessionId]/wrap-up/review/page.tsx` | Wrap-up review + player notes + att exc | 932, 933, 935 |
| `src/app/coach/players/[playerId]/page.tsx` | Coach player signals | 930 |
| `src/app/director/review/WrapUpDraftCard.tsx` | Director wrap-up card + name chips | 934 |
| `src/app/director/review/WrapUpObservationDraftCard.tsx` | Observation draft card | 931 |
| `src/app/director/review/WrapUpObservationDraftDecisionControls.tsx` | Approve/reject/clarify obs | 931 |

### Library Helpers (read)
| File | Purpose | Sprint |
|---|---|---|
| `src/lib/coach/wrapUpStatusMap.ts` | Batch load wrap-up status | 928 |
| `src/lib/coach/wrapUpSessionSelector.ts` | Sessions needing wrap-up | pre-926 |
| `src/lib/coach/wrapUpPlayerNameMatcher.ts` | Roster name matching | pre-926 |

---

## 3. Coach Workflow

1. Coach opens **Coach Hub** → sees `CoachDailyBriefCard` with next session time, group, curriculum focus, and wrap-up status strip.
2. Coach taps **"Start Session"** → opens `/execute` for focused block-by-block session running.
3. After session, coach is routed to **Wrap-Up** → DONNA-branded 6-question flow.
4. Coach answers questions using **text, voice recording (AudioRecorderButton), or browser dictation (VoiceInputButton)**.
5. On standouts/attention questions, **player name chips** appear for quick-tap roster mentions.
6. Coach submits → wrap-up draft created (pending director review).
7. In the saved state, coach can optionally **add player observation notes** (per-player, typed, positive/needs-attention). Each creates a separate draft.
8. Coach can check **Wrap-Up Review** page to see full loop status:
   - Loop completion summary card (pending / approved / complete / etc.)
   - Per-player note statuses (pending review / approved / applied / director has questions / needs revision)
   - Attendance exception status (if auto-detected)
9. Coach can see session wrap-up status on **Coach Home** and **/coach/sessions** session list as colored badges.
10. Coach can see coaching signal summary on **/coach/players/[id]** (pending obs drafts, group session status).

---

## 4. Director Workflow

1. Director opens **Review Queue** → `/director/review` → "Player Updates" tab.
2. For each **observation draft**: sees player name, observation type (Positive/Needs Attention/General), note text, session source, safety notice.
3. Director chooses: **Approve**, **Reject**, or **Request Clarification** (each captures an optional reviewer note).
4. For approved observation drafts: director clicks **Apply** → `applyApprovedObservationDraftAction` writes the official `coach_observations` record.
5. For each **session wrap-up**: sees DONNA summary answers, block completion, player mention chips (Sprint 934 heuristic extraction), warnings.
6. Director approves wrap-up → then clicks Apply → writes `sessions.session_notes`.
7. For each **attendance exception**: sees parsed absent/unexpected attendee summary, decides to approve or reject.
8. All decisions are recorded in `proposed_actions` — no hidden state.

---

## 5. Observation Draft Path

```
Coach submits wrap-up with player notes
    ↓ saveWrapUpObservationsAction (one proposed_action per player)
    ↓ target_module = 'coach_observation_draft_v1'
    ↓ target_object_id = player_id  ← (not session_id, see V2 section)
    ↓ proposed_payload.session_id = sessionId  ← JSON field
    ↓ status: pending_review
    ↓ is_private: true, source: 'coach_wrap_up'
Director reviews in "Player Updates" tab
    ↓ updateObservationDraftDecisionAction
    ↓ status → approved / rejected / clarification_needed
If approved → director clicks Apply
    ↓ applyApprovedObservationDraftAction
    ↓ writes coach_observations row (is_private = true)
    ↓ status → executed
Coach sees status on wrap-up review page (Sprint 932)
```

---

## 6. Attendance Exception Path

```
Coach answers Q1 (attendance) in wrap-up
    ↓ saveWrapUpDraftAction auto-parses free text
    ↓ parseAttendanceExceptionText() — deterministic, no LLM
    ↓ Detects absent names + unexpected names
If exceptions detected:
    ↓ Creates proposed_action: attendance_exception
    ↓ target_object_id = sessionId  ← direct column
    ↓ proposed_payload: { rostered_attendance, unrostered_attendees, warnings }
    ↓ source = 'wrap_up_q2_parse'
Director reviews in "Needs Approval" tab
    ↓ AttendanceExceptionDraftCard
    ↓ Approve → applyApprovedAttendanceExceptionAction
    ↓ Writes session_attendance records
Coach sees status on wrap-up review page (Sprint 935)
```

---

## 7. Status Visibility Map

| Signal | Where visible | Data source |
|---|---|---|
| Next session wrap-up status | Coach home (DailyBriefCard strip) | `loadWrapUpStatusMap` |
| Session list wrap-up badge | /coach/sessions | `loadWrapUpStatusMap` |
| Wrap-up loop state | /wrap-up/review (loop summary) | Derived from `proposed_actions` |
| Per-player note status | /wrap-up/review (player notes) | `proposed_actions` (by proposed_by_id) |
| Attendance exception status | /wrap-up/review (attendance section) | `proposed_actions` (by column) |
| Group session wrap-up signal | /coach/players/[id] (Coach Signals) | `loadWrapUpStatusMap` |
| Pending obs draft count | /coach/players/[id] (Coach Signals) | `proposed_actions` count |

### Status label mapping (all coach-facing)
| DB status | Coach sees |
|---|---|
| pending_review | "Pending review" |
| approved | "Approved" |
| executed | "Applied" |
| rejected | "Needs revision" |
| clarification_needed | "Director has questions" |

---

## 8. Safety Boundaries

### What NEVER happens automatically
- Parent or player communication is sent
- Player level changes
- Player placement changes
- Roster changes
- Billing changes
- Curriculum changes
- Observation drafts applied to official records
- Attendance records written
- Session notes written

### What happens automatically (safe, reversible)
- Wrap-up free text is parsed for attendance exceptions → creates a `pending_review` proposed_action (NOT an attendance record)
- Entity summary updates are triggered (fire-and-forget, Sprint 925)

### Approval gates

All mutations require explicit director action:
1. **Approve** wrap-up draft → marks `status = approved` (no record written yet)
2. **Apply** approved wrap-up → writes `sessions.session_notes` (explicit second click)
3. **Approve** observation draft → marks `status = approved`
4. **Apply** approved observation draft → writes `coach_observations` (explicit second click)
5. **Approve** attendance exception → marks `status = approved`; apply path writes `session_attendance`

---

## 9. Read-Only vs Mutation

| Operation | Category | Writes to |
|---|---|---|
| All coach wrap-up page views | Read-only | — |
| Coach submitting wrap-up | Mutation (through pipeline) | `voice_commands`, `proposed_actions` |
| Coach submitting observation notes | Mutation (through pipeline) | `voice_commands`, `proposed_actions` |
| Director approving | Mutation | `proposed_actions.status` |
| Director applying wrap-up | Mutation | `sessions.session_notes`, `audit_logs` |
| Director applying observations | Mutation | `coach_observations`, `audit_logs` |
| Director applying attendance exception | Mutation | `session_attendance`, `audit_logs` |
| Coach home / sessions / player profile views | Read-only | — |
| Director review queue views | Read-only | — |

---

## 10. Parent/Player Safety

- Internal coach notes (`is_private: true`) are **never shown to parents or players**.
- Observation drafts require director approval + apply before writing to `coach_observations`.
- `coach_observations` is an internal table — no parent/player portal reads it.
- No wrap-up content flows to parent or player portals at any stage.
- `parentSafeResponseRules.ts` defines allowed parent-facing content — wrap-up notes are not in scope.
- `is_player_visible = false` on all gate status records.

---

## 11. Known Risks

| Risk | Severity | Mitigation | V2 path |
|---|---|---|---|
| No coach "respond to clarification" flow | Medium | Coach sees "Director has questions" and director note; resolves offline | Sprint 939: in-app response UI |
| Block completion not persisted to DB (localStorage) | Medium | Works for same device/session; cleared on logout | Sprint 938: add `status` column to `session_blocks` via migration |
| Heuristic player mention chips (Sprint 934) may have false positives | Low | Chips are clearly scan aids, not confirmed players; no action taken on them | Sprint 946: roster-validated matching once session IDs are columns |
| Voice transcription requires OPENAI_API_KEY | Medium | Falls back gracefully to browser dictation + typing; no blocking error | Configure OPENAI_API_KEY in production environment |
| Loop-complete sessions-list badge deferred to V2 | Low | "Applied" badge (Sprint 929) already shows wrap-up completion; obs draft status requires JSON filter | Sprint 946: after Sprint 937 adds session_id column |
| Observation draft → session linkage is via JSON payload | Low | Works correctly for all current use cases; adds query complexity for sessions-list | Sprint 937: add `session_id` column to `proposed_actions` for obs drafts |

---

## 12. Completion Badge V2 Rationale

A true "Loop complete" badge in the sessions list requires all three signals:
1. Wrap-up `status = executed` — ✅ queryable by column (`target_object_id = sessionId`)
2. Attendance exception `status = executed` — ✅ queryable by column (`target_object_id = sessionId`)
3. Observation drafts all `status = executed` — ❌ only linkable via `proposed_payload.session_id` (JSON)

The JSON payload filter for observation drafts across multiple sessions in a list is not efficient or safe enough for the sessions list without a schema improvement.

**V2 path (Sprint 937):** Add a `session_id` column to `proposed_actions` rows where `target_module = 'coach_observation_draft_v1'`. Migration required. After this, Sprint 946 can implement the true loop-complete badge.

In the meantime, the "Applied" badge (Sprint 929, green) effectively communicates wrap-up completion on the sessions list.

---

## 13. Internal Pilot Readiness Rating

| Dimension | Rating | Notes |
|---|---|---|
| Safety / data integrity | 9/10 | All mutations require explicit director approval. RLS + academy_id + proposed_by_id scoping on all queries. No automatic communication or profile changes. |
| Coach wrap-up UX | 8/10 | DONNA-branded, voice-first, low cognitive load. Known gap: no in-app clarification response flow. |
| Director review UX | 7/10 | Full review queue with approval/rejection/clarification. Two-click apply (approve → apply) is intentional safety measure. |
| Status visibility (coach) | 8/10 | Coach sees wrap-up status on home, sessions list, player profile, and review page. Loop completion summary clear. |
| Status visibility (director) | 8/10 | Player mention chips, player name extraction, session summary display all in place. |
| System completeness | 7/10 | Full loop exists. V2 items (sessions-list completion badge, clarification response) do not block pilot. |
| TypeScript / code quality | 10/10 | Clean compile, no errors. |

**Overall: 8/10 — Ready for supervised internal pilot.**

**Go conditions for pilot:**
- ✅ At least one director account configured
- ✅ At least one coach account configured
- ✅ At least one session with players and a group
- ✅ OPENAI_API_KEY set (or browser dictation acceptable for pilot)
- ✅ Manual QA checklist completed (see QA doc)
- ✅ Brian and Coach Farshad briefed on the loop model

**Not required for pilot:**
- Loop-complete badge in sessions list (V2)
- Coach clarification response flow (V2)
- Voice TTS production upgrade (V2)

---

## 14. Manual QA Script — Brian + Coach Farshad Pilot

### Setup
1. Director account (Brian): configure academy, add coach
2. Coach account (Coach Farshad): assign to groups
3. Create at least 2 sessions with player roster and blocks

### QA Flow

**A. Coach sees daily brief**
1. Log in as Coach Farshad
2. Open `/coach` → confirm CoachDailyBriefCard shows next session
3. Confirm time, group, status strip visible
4. Confirm "Start Session" CTA routes to `/execute`

**B. Coach executes session**
1. Tap "Start Session" → arrives at `/execute`
2. Step through blocks (Next button)
3. Confirm final block shows "Wrap-Up →" CTA
4. Tap → arrives at `/coach/sessions/[id]/wrap-up`

**C. Coach completes wrap-up**
1. Work through all 6 DONNA questions
2. Test voice input on at least one question (if OPENAI_API_KEY configured)
3. On standouts question: confirm player name chips appear if roster has members
4. Answer attendance question with an absence (e.g., "Sarah was absent today")
5. Tap "Submit for Review" → confirm saved state
6. In saved state, add 1 player observation (pick player, Positive type, add note)
7. Tap "Submit player notes for review"

**D. Coach checks review status**
1. Navigate to `/coach/sessions/[id]/wrap-up/review`
2. Confirm loop summary card shows "Waiting for director review"
3. Confirm "Your player notes" shows the observation with "Pending review" badge
4. Confirm "Attendance exceptions" shows "1 absent player — Pending review" (if Sarah was matched)

**E. Director reviews wrap-up**
1. Log in as Brian (director)
2. Open `/director/review`
3. Find session wrap-up in "Needs Approval" tab
4. Confirm player mention chips appear in WrapUpDraftCard (Sarah should appear in Needs Attention)
5. Approve the wrap-up → confirm status badge changes

**F. Director reviews observation drafts**
1. Go to "Player Updates" tab
2. Find the observation draft for the player
3. Confirm: player name, observation type badge, note text, safety notice visible
4. Approve observation draft
5. Click "Apply — Create Observation" → confirm "Applied" message

**G. Director reviews attendance exception**
1. Find attendance exception in "Needs Approval" tab
2. Confirm: absent player name visible (if roster match succeeded)
3. Approve attendance exception

**H. Coach confirms loop closed**
1. Return to Coach Farshad session
2. Open `/coach/sessions/[id]/wrap-up/review`
3. Confirm loop summary shows "Loop complete" (or "Reviewed — waiting to be applied")
4. Confirm player note shows "Applied" badge
5. Confirm attendance exception shows "Approved" badge

**I. Safety verification**
1. Log in as a player → confirm NO wrap-up content visible on player portal
2. Log in as a parent → confirm NO internal notes visible on parent portal
3. Confirm no emails or messages were sent during the above flow
4. Confirm Sarah's attendance was NOT changed in `session_attendance` until director explicitly applied

---

## 15. Recommended Next 10 Sprints

| # | Sprint | Description |
|---|---|---|
| 937 | Observation Draft Session Column V1 | Add `session_id` column to `proposed_actions` for `coach_observation_draft_v1` rows; enables sessions-list loop-complete badge without JSON filtering. Migration required. |
| 938 | Coach Session Block Completion Persistence V1 | Add `status` column to `session_blocks` table; wire `CoachSessionExecutionClient` localStorage block statuses to DB. Migration required. |
| 939 | Coach Clarification Response Flow V1 | Add in-app "respond to director" UI on wrap-up review page when observation draft has `clarification_needed`; creates a follow-up note in the existing draft or a new proposed_action. |
| 940 | Director Batch Observation Apply V1 | Add "Apply all approved" button to the Player Notes section of the director review queue; applies all `approved` observation drafts for a session in a single action. |
| 941 | Coach Wrap-Up 48-Hour Nudge V1 | Extend coach home banner to show "2 sessions from yesterday still need wrap-up" with a time context; urgency increases after 24h. |
| 942 | Parent-Safe Session Summary Draft V1 | When a director applies a session wrap-up, offer a one-click "Draft parent summary" that creates a `parent_communication` proposed_action for optional director review and manual send. |
| 943 | Pilot Analytics Dashboard V1 | Add director-facing read-only analytics: wrap-up submission rate, observation draft submission rate, attendance exception rate, and director review time. Uses `proposed_actions` data. |
| 944 | Voice STT Production Key V1 | Configure `OPENAI_API_KEY` in production environment; verify `/api/coach/sessions/[id]/transcribe` endpoint returns correct transcripts; regression test fallback behavior. |
| 945 | Coach Wrap-Up History V1 | Add a "Past wrap-ups" section to the session list page showing the last 10 submitted wrap-ups across all sessions, with status badges. Coach gets a longitudinal view of their submission history. |
| 946 | Loop Complete Sessions-List Badge V1 | Using Sprint 937 session_id column, combine wrap-up + observation + attendance exception statuses per session into a true "Loop complete" badge in the sessions list. Final closure of the mega sprint loop. |
