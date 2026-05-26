# Sprint 834 — Attendance Exception End-to-End Audit V1

**Date:** 2026-05-26
**Audit type:** Read-only end-to-end loop audit
**No source files modified**

---

## Audit Goal

Trace the full attendance exception loop: from coach or director capture of "everyone was here except Sarah, and Jeremy showed up" through structured attendance draft, absence/update proposal, unrostered attendee review, and director approval path — confirming no accidental roster, player, billing, or parent changes occur.

---

## Loop Map

```
Path A: Director DONNA Panel (natural language)
    └── Director types: "everyone was here except Sarah, and Jeremy showed up"
        ├── detectTaskIntent → 'handle_attendance_exception' 
        │   OR looksLikeNaturalAttendancePhrase → 'attendance_exception_draft' COO command
        ├── handleStartAttendanceExceptionDraft(sourceText)
        │   ├── extractNaturalAttendanceFlags() → { absences: ['Sarah'], unrostered: ['Jeremy'] }
        │   └── createAttendanceExceptionDraft({ naturalInput, flaggedAbsences, flaggedUnrostered })
        ├── DonnaAttendanceExceptionCard shows:
        │   ├── Original input quoted
        │   ├── "Possible absent: Sarah (needs confirmation)"
        │   ├── "Possible unrostered: Jeremy (director review required)"
        │   ├── Session picker (last 7 days, max 5 sessions) ← required step
        │   └── "Queue for review" CTA (enabled only after session resolved)
        └── Director clicks "Queue for review"
            └── saveAttendanceExceptionDraftAction(fields)
                ├── Auth + role check (director/head_coach only)
                ├── Requires _resolved_session_id (blocked without it)
                ├── Fetches roster via group_memberships (academy_id scoped)
                ├── buildAttendancePayload():
                │   ├── hasEveryoneBaseline() → true ("everyone was here")
                │   ├── extractAbsentNames() → ["Sarah"] (after "except")
                │   ├── matchToRoster("Sarah") → player record or warning
                │   ├── detectUnrosteredNames() → ["Jeremy"] (regex: "showed up")
                │   └── RosteredAttendanceDraft[]: present/absent/unknown per player
                └── proposed_actions { target_module: 'attendance_exception', status: 'pending_review' }
                    payload.warnings: "Draft only. No official attendance has been changed."

Path B: Coach Wrap-Up — Session Execution
    └── /coach/sessions/[sessionId] (CoachSessionExecutionClient)
        ├── During session: P/A/L/E tap buttons → saveAttendanceAction
        │   └── DIRECT WRITE to session_attendance ← not a draft, by design (in-session marking)
        │       (coach role, own session only, academy_id scoped)
        └── Unexpected attendee notice: "Player not on this list? Use the Unexpected Attendees
            section in the Session Wrap-Up — their attendance goes to director review."

Path C: Coach Wrap-Up — 6-Question DONNA-Guided Flow
    └── /coach/sessions/[sessionId]/wrap-up → WrapUpPageClient
        ├── Question 2: "Any attendance exceptions?"
        │   Hint: "Absences, late arrivals, early departures, or players not on the roster."
        │   Placeholder: "Everyone was here / Max was absent / A new player showed up"
        │   └── Answer stored as text field in saveWrapUpDraftAction
        │       → proposed_actions { target_module: 'session_recap_structuring' }
        │       ← attendance text EMBEDDED in wrap-up draft, NOT parsed as separate exception
        └── Wrap-up submitted: "Nothing has been sent to parents or applied to player profiles."

Path D: Coach Wrap-Up — Explicit Unrostered Attendee Capture
    └── CoachWrapUpDetailPanel (separate from 6-question flow)
        ├── CoachAttendanceExceptionDraftCard UI
        │   ├── "Everyone present — no exceptions" button
        │   ├── Add by name + type (absent/late/left_early/unrostered_arrival/excused)
        │   └── Quick presets: "Someone was absent", "Late arrival", "Unexpected player showed up"
        └── saveWrapUpAttendanceExceptionAction(sessionId, unrosteredEntries)
            ├── Auth + role check (coach/head_coach/director)
            ├── 15-second duplicate guard
            ├── Verifies session belongs to academy
            ├── Max 10 unrostered entries per submission
            └── proposed_actions { target_module: 'attendance_exception', status: 'pending_review' }
                payload.rostered_attendance: [] ← only unrostered entries, no roster parsing

Path E: Director Session Detail — createAttendanceExceptionDraftAction
    └── /director/sessions/[sessionId]/attendanceExceptionDraftAction.ts
        ├── Auth + role check (coach/head_coach/director)
        ├── Fetches roster from group_memberships
        ├── parseAttendance() — same rule-based parser as Path A
        └── proposed_actions { target_module: 'attendance_exception', status: 'pending_review' }

Director Review Queue
    └── /director/review → AttendanceExceptionDraftCard
        ├── Shows: original recap text (verbatim), session name, date, proposer
        ├── Rostered attendance table:
        │   ├── ✓ Present  → green (match_reason: '"Everyone" baseline detected')
        │   ├── ✗ Absent   → red   (match_reason: 'Mentioned after "except"')
        │   └── ? Unknown  → grey  (match_reason: 'No attendance baseline detected')
        ├── Unrostered Attendees section → orange warning cards
        │   └── "No roster change is made until approved" (confirmed in UI)
        ├── Parser warnings displayed inline
        └── AttendanceExceptionDraftDecisionControls:
            ├── "Approve for Application"
            ├── "Needs Clarification"
            └── "Reject Draft"
            Caveat: "Approving marks this draft as ready to apply. Rostered attendance will not
            be recorded until you explicitly apply it. Unrostered attendees are never auto-applied."

Director Apply (after approval)
    └── ApplyApprovedAttendanceExceptionControls → applyApprovedAttendanceExceptionAction
        ├── Status gate: must be 'approved' (hard block in checkAttendanceApplyGuardrails)
        ├── Session ownership re-verified
        ├── Player IDs cross-checked against academy_id before upsert
        ├── session_attendance.upsert { session_id, player_id, status, marked_by, marked_at }
        │   Unknown-status players SKIPPED (not written)
        ├── For each unrostered attendee:
        │   └── proposed_actions { target_module: 'placement_review', status: 'pending_review',
        │       risk_level: 'medium', no_automatic_player_creation: true }
        │       ← ZERO player profiles, ZERO roster changes, ZERO billing, ZERO parent comms
        └── audit_logs { action: 'attendance_exception.applied', full metadata }
            proposed_action status → 'executed'
```

---

## 10-Dimension Score

### 1. Entry Clarity — 8/10

**What works:**
- DONNA panel accepts "everyone was here except Sarah, and Jeremy showed up" as a natural phrase. Both `looksLikeNaturalAttendancePhrase()` and `detectTaskIntent('handle_attendance_exception')` would match.
- `EVERYONE_PHRASES` includes 12 variants; `EXCEPT_TRIGGERS` covers 5 exception keywords; `ARRIVAL_PATTERNS` catches "showed up", "came in", "turned up", "arrived", "appeared".
- Coach wrap-up Question 2 hint explicitly mentions "players not on the roster" — coaches know where to capture unrostered arrivals.
- In-session execution panel has a clear note: "Player not on this list? Use the Unexpected Attendees section in the Session Wrap-Up."
- `CoachAttendanceExceptionDraftCard` has quick presets including "Unexpected player showed up."

**Gap:**
- `WrapUpPageClient` Q2 attendance answer goes into the general wrap-up draft as embedded text — it is **not** parsed as an attendance exception. Director sees the text in the recap but gets no structured attendance exception draft from this path. A coach who writes "Everyone was here except Max" in Q2 creates a text note, not a structured exception. The only paths that create a real `attendance_exception` proposed_action are Director DONNA, `CoachWrapUpDetailPanel`'s unrostered section, and the session detail action.
- Two different components handle attendance: `CoachAttendanceExceptionDraftCard` (local state, saves via `saveWrapUpAttendanceExceptionAction`) and `WrapUpPageClient` (embedded text). A coach may not know which creates a real director review item.

---

### 2. DONNA Guidance — 8/10

**What works:**
- Natural language detection works end-to-end: "everyone was here except Sarah" → `hasEveryoneBaseline()` true + `extractAbsentNames()` → ["Sarah"]; "Jeremy showed up" → `detectUnrosteredNames()` → ["Jeremy"].
- `DonnaAttendanceExceptionCard` shows parsed flags with explicit "(needs confirmation)" and "(director review required)" caveats before submission.
- DONNA response for natural language path: "Flagged: [Sarah] absent; [Jeremy] possibly unrostered. Proceed to session." — accurate and non-committal.
- `attendanceExceptionReadyForQueue` requires both field-readiness AND a resolved session ID — DONNA cannot queue until the session is confirmed.
- Safety message on success: "No attendance records have been changed." + safety notes enumerated.
- Wrap-up DONNA prompt: "Any exceptions to normal attendance? Absences, late arrivals, or unregistered players?" — good framing.

**Gap:**
- The non-natural-language DONNA dispatcher path (`/absent|missed.*session|attendance exception|mark.+(absent|missing)/i`) returns: "I'll draft an attendance exception. Tell me the player's name and the reason — I'll submit it to your review queue." This message is for slot-filling ONE player. It doesn't handle "everyone was here except Sarah" — that's the COO/natural language path. The two entry paths are parallel and the messaging doesn't clarify when to use which.
- After successful queue submission, `DonnaAttendanceExceptionCard` shows success message + safety notes but **no link to `/director/review`**. Director must navigate manually.

---

### 3. Page-Aware Context — 6/10

**What works:**
- Director DONNA fetches last 7 days of sessions (max 5) via `fetchRecentSessionsAction()` — enriched with session name, date, group label. Director can confirm session from this list.
- If no recent session found, "Confirm session later" fallback prevents blocking.
- `saveAttendanceExceptionDraftAction` requires `_resolved_session_id` — blocks submission without a confirmed session ID.
- Coach session execution panel: in-page direct attendance marking (P/A/L/E) with the session already in context.

**Gap:**
- When the director is on a specific session page (`/director/sessions/[sessionId]`) and uses DONNA, DONNA does not automatically inject the current session ID into the attendance draft. The director still needs to pick from the session picker. No page-context injection passes `currentSessionId` from the page to the DONNA panel.
- Session picker: last 7 days, max 5. Sessions older than 7 days do not appear. For make-up sessions, cancelled/rescheduled sessions, or end-of-week reviews, this window may be too narrow for reliable session matching.

---

### 4. Navigation/Highlight Support — 5/10

**What works:**
- DONNA `draft_attendance_exception` dispatcher result includes `route: '/director/review'` — navigates to review queue after queuing.
- The review queue has a clear "Attendance Exceptions" section header with pending count badge.
- `revalidatePath('/director/review')` called after `saveAttendanceExceptionDraftAction` — review page freshens.

**Gaps:**
- No `data-donna-focus-id` attributes anywhere on `/director/review`. DONNA navigates to the page but cannot highlight the "Attendance Exceptions" section. The highlight fires and finds no DOM target.
- Post-queue success state in `DonnaAttendanceExceptionCard`: shows "View and apply in the Review Queue when ready" but no `href` link. Director must navigate to `/director/review` manually.
- The `AttendanceExceptionDraftCard` in the review queue has no back-link to the originating session.

---

### 5. UI Cognitive Load — 7/10

**What works:**
- One-at-a-time DONNA wrap-up flow: 6 questions, clear progress rail, DONNA summary builds in real time below.
- `DonnaAttendanceExceptionCard` is clean: original input quoted, flagged names separated (absent vs. unrostered), session picker, single "Queue for review" CTA.
- `AttendanceExceptionDraftCard` in review: original recap → rostered attendance table → unrostered section → warnings → decision controls. Top-to-bottom readable structure.
- Two-step (approve then apply): by design — prevents accidental activation. Clear status labels: "Approved — Ready to Apply" vs. "Pending Review".
- Pre-apply warning: "Applying will not create a player or change a roster." + explicit count displays.

**Gaps:**
- When multiple `unknown` status players appear in the attendance table (no baseline detected), the director has no inline way to correct individual statuses in the review card. They would need to reject the draft and re-submit with a clearer recap.
- A single session wrap-up can generate TWO separate proposed_actions: one `session_recap_structuring` draft (from WrapUpPageClient Q2 answer) and one `attendance_exception` draft (from CoachWrapUpDetailPanel unrostered section). Director sees both in the review queue for the same session. The relationship between them is not visually connected.

---

### 6. Data Honesty — 9/10

**What works:**
- `match_reason` is written per player in the draft: `'"Everyone" baseline detected'`, `'Mentioned after "except"'`, `'No attendance baseline detected for this player'`. Director sees exactly why each player received their proposed status.
- `payload.raw_input` preserved verbatim and shown in the review card under "Original Recap."
- Parser warnings visible inline: `'"Sarah" was mentioned as absent but could not be matched to the roster.'`
- `AttendanceExceptionDraftCard` shows a distinct "? Unknown" group with count when no baseline detected.
- Recap note on coach side: "All exceptions are draft only. Nothing official changes until director review." (9px footer copy, always present).
- `ApplyApprovedAttendanceExceptionControls` pre-apply disclaimer: "Applying will not create a player or change a roster. Rostered attendance will be recorded (unknown status skipped). Each unexpected attendee creates a placement review follow-up for director decision."

**Minor gap:**
- `match_reason: 'Mentioned after "except"'` is accurate but uses developer shorthand. A coach-facing version would be: `'Named as absent after "except"'` for clarity on the review card.

---

### 7. Draft/Review/Approval Safety — 10/10

**What works:**
- Three distinct steps required: (1) draft created (`proposed_actions status: 'pending_review'`) — zero writes to `session_attendance`; (2) director approves; (3) director explicitly clicks "Apply Exception Draft."
- `checkAttendanceApplyGuardrails`: hard block if `draftStatus !== 'approved'`; hard block if no player data; warns HIGH_ABSENCE_RATE (>50% absent); warns UNKNOWN_STATUS players; warns PARSER_WARNINGS; `requiresExtraConfirmation` flag for high-severity paths.
- Player ID re-verification: `applyApprovedAttendanceExceptionAction` cross-checks all `player_id` values against `players.academy_id` before upsert. Cannot apply attendance for a player from another academy even if IDs were crafted.
- Unrostered attendees: each becomes a separate `placement_review` proposed_action (`risk_level: 'medium'`), with `no_automatic_player_creation: true` in payload. Zero player records created.
- Audit log written at apply time: actor, session, row counts, unrostered follow-ups, voice_command_id. Full traceability.
- Risk notes in proposed_action: "No player profiles, billing, or parent communications were modified." Three separate statements.
- In-session P/A/L/E direct write: coach-authenticated, own session only, academy_id gate.

No gaps found in this dimension.

---

### 8. Error/Edge-Case Handling — 7/10

**What works:**
- `unsureFlag`: `/unsure|not sure|don't know|can't remember/` → return `unsureFlag: true`; coach told manual review needed.
- Short names warning: names ≤ 2 chars flagged as "may be initials. Confirm identity."
- Empty input: explicit warning "Empty input — no attendance data to parse."
- Name length cap: 100 chars in `saveWrapUpAttendanceExceptionAction`.
- Unrostered entry count cap: max 10 per submission.
- 15-second duplicate submission guard in `saveWrapUpAttendanceExceptionAction`.
- Roster mismatch warning: `"${name}" was mentioned as absent but could not be matched to the roster.`
- No-roster session: `'No roster attached to this session — player-level attendance could not be generated.'`

**Gaps:**
- **Ambiguous first names**: `matchToRoster("Sarah", roster)` returns the **first** match found. If two players named Sarah are on the roster (e.g., Sarah Mitchell and Sarah Jones), the first Sarah alphabetically or by insertion order is silently assigned. No ambiguity detection or director warning. This could silently mark the wrong Sarah absent.
- **Session window**: 7-day / 5-session limit on the picker. Sessions outside this window require "confirm later" → director manually navigates to the session to complete the draft. No instructions provided.
- `extractAbsentNames` only reads the **first** EXCEPT_TRIGGER found (uses `break` after the first match). "Everyone was here except Sarah, excluding Max" → only "Sarah" extracted. The second trigger phrase is silently dropped.

---

### 9. Mobile Usability — 8/10

**What works:**
- `WrapUpPageClient`: full-screen mobile-first design, `max-w-lg mx-auto`, one question at a time, large "Submit for Review" CTA.
- `DonnaAttendanceExceptionCard`: inline card within DONNA panel overlay, works on mobile.
- Session picker: full-width button rows with date + group label.
- `CoachAttendanceExceptionDraftCard`: "Everyone present" big green button as first option — easy no-exception confirm.

**Gap:**
- In-session P/A/L/E attendance buttons: labeled with single uppercase letters (P/A/L/E), sized `w-10 py-2`. On mobile with fat fingers, these are small tap targets (~40px) and could produce mis-taps between status options. A confirmed tap is a direct write to `session_attendance`, making mis-taps more serious than in draft flows.
- Four buttons in a row with small labels: no visual confirmation ring or haptic feedback pattern described.

---

### 10. Coach/Director Demo Readiness — 7/10

**What works:**
- **Full natural language loop confirmed working**: "everyone was here except Sarah, and Jeremy showed up" → parsed → flagged → session picker → queue → approve → apply → `session_attendance` written + placement_review for Jeremy.
- Coach wrap-up: polished DONNA-guided UX, progress rail, running summary, clear safety language.
- Review card: original recap quoted, per-player status table, two-step approve/apply, applied state shows row counts.
- DONNA success response includes safety notes enumerated.

**Demo risks:**
- **Session picker window**: demo session must have run within the last 7 days to appear in the session list. If running a demo with older data, the session won't appear → director sees "No recent sessions found" → must use "confirm later" → cannot queue until session is confirmed via another path.
- **Empty roster**: if demo session has no `group_memberships` records, all players will be "unknown" — the review card will show `? N players — status unknown (no baseline detected)`. This looks like a failure even though the exception was correctly parsed.
- **Jeremy detection specificity**: regex `/([A-Z][a-z]{1,20})\s+showed\s+up/g` requires "Jeremy" to be capitalized and "showed up" to be exactly those two words. "Jeremy showed up late" → `showed up` followed by space + "late" — regex uses `\b` boundary, not EOL, so this should match. "jeremy showed up" (lowercase) → NOT matched (requires `[A-Z]` initial).
- **Two items in review queue**: a session wrap-up produces both a `session_recap_structuring` draft AND an `attendance_exception` draft. Director sees two cards for one session in the review queue. Without visual linking, this may appear confusing.

---

## Score Summary

| Dimension | Score |
|---|---|
| 1. Entry Clarity | 8/10 |
| 2. DONNA Guidance | 8/10 |
| 3. Page-Aware Context | 6/10 |
| 4. Navigation/Highlight Support | 5/10 |
| 5. UI Cognitive Load | 7/10 |
| 6. Data Honesty | 9/10 |
| 7. Draft/Review/Approval Safety | 10/10 |
| 8. Error/Edge-Case Handling | 7/10 |
| 9. Mobile Usability | 8/10 |
| 10. Coach/Director Demo Readiness | 7/10 |
| **Total** | **75/100** |

---

## Status: ⚠️ DEMO-READY WITH CAVEATS

---

## Critical Gaps

### GAP-A: WrapUpPageClient Attendance Question Creates Text Only, Not a Structured Draft
`src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx`

The coach DONNA-guided wrap-up Question 2 ("Any attendance exceptions?") captures free text that is stored as an embedded answer in the `session_recap_structuring` proposed_action. It does NOT create a `attendance_exception_v1` draft. If a coach writes "Everyone was here except Max, Jeremy showed up" in Q2, the director sees this text inside the wrap-up card but receives no structured attendance exception draft — no separate approve/apply flow for attendance, no rostered attendance table, no placement_review follow-up for Jeremy.

The actual structured path for unrostered attendees requires the `CoachWrapUpDetailPanel`'s separate attendee form (`saveWrapUpAttendanceExceptionAction`). Coaches may not know to use both flows.

**Demo risk**: If a director demo shows "coach types attendance in Q2" → director review, they will not see an attendance exception card. The attendance text only appears inside the wrap-up draft's raw answer.

---

### GAP-B: No data-donna-focus-id on Review Page Sections
`src/app/director/review/page.tsx`

DONNA navigates to `/director/review` after queuing an attendance exception, but cannot highlight the "Attendance Exceptions" section. No `data-donna-focus-id` attributes exist on the review page. The director lands at the top of the review queue and must scroll to find their draft.

---

### GAP-C: No Link After Queue Success
`src/components/assistant/DonnaAttendanceExceptionCard.tsx`

After successful queue submission, the card shows "View and apply in the Review Queue when ready" as plain text with no link. Director must dismiss DONNA and navigate to `/director/review` manually with no `href` guidance.

---

## Notable Findings

### Architectural Strength: Strongest Safety Architecture in the System
The attendance exception pipeline is the most guarded in AcademyOS. Three explicit stops (draft → approve → apply), `checkAttendanceApplyGuardrails` with hard blockers and soft warnings, secondary player ID re-verification at apply time, explicit `no_automatic_player_creation: true` in placement_review payload, and `audit_logs` at every write. The system never creates players, never modifies rosters, never triggers billing or parent communication from an attendance exception.

### Two Parsers, One Payload Shape
There are two parallel attendance parsers that produce `attendance_exception_v1` payloads: `donnaAttendanceParser.ts` (in components) and `attendanceExceptionDraftAction.ts` (in director sessions). Both share the same EVERYONE_PHRASES, EXCEPT_TRIGGERS, and NAME_STOP_WORDS — they're architecturally consistent. The `attendanceExceptionParser.ts` in `src/lib/wrap-up/` uses richer ABSENCE_PATTERNS (regex-based with multiple forms) and is more accurate for complex phrases. Only the simpler parsers are used in the action files; the richer parser exists but is not used in the draft actions.

### Unrostered Attendees Never Auto-Resolve
"Jeremy showed up" never creates a player record. It creates a `placement_review` proposed_action (risk_level: medium) that goes to director review. No roster change, billing, enrollment, or parent communication occurs without an explicit additional director decision on that separate item. This is exactly correct.

### Session Picker Freshness Window is a Constraint
The session picker for DONNA-initiated drafts only fetches the last 7 days / 5 sessions. For academies with high session volume (multiple groups per day), 5 sessions may not cover even the current week. For makeup sessions or delayed logging, the 7-day window may exclude the relevant session. Increasing to 14 days / 10 sessions, or adding a search option, would reduce the "confirm later" fallback rate.

### extractAbsentNames Single-Trigger Limitation
`extractAbsentNames()` in both `attendanceExceptionDraftAction.ts` and `donnaAttendanceActions.ts` stops at the **first** EXCEPT_TRIGGER found (uses `break`). Input "Everyone except Sarah but not Max" → only "Sarah" extracted; "Max" is missed. "Everyone except Sarah and Max" → correctly extracts both (comma/and splitting within first trigger). The single-trigger break is a correctness gap for inputs with multiple exception clauses.

---

## Recommended Sprint Order (Post-Audit Phase)

1. **Attendance Review Queue DONNA Highlight V1** — Add `data-donna-focus-id="attendance-exceptions-section"` to review page attendance section header (GAP-B). One attribute, immediate DONNA addressability.
2. **Attendance Queue Success Link V1** — Add `href="/director/review"` link to the "View and apply in the Review Queue" message in `DonnaAttendanceExceptionCard` (GAP-C). One line.
3. **WrapUpPageClient Attendance Structured Parse V1** — Parse Q2 attendance answer in `WrapUpPageClient` to detect natural language exceptions and auto-create an `attendance_exception_v1` draft alongside the wrap-up draft (GAP-A). Larger change.
4. **extractAbsentNames Multi-Trigger Fix V1** — Remove the `break` from the EXCEPT_TRIGGER loop to capture multiple exception clauses in a single phrase.

---

## Files Read (Audit Only — Not Modified)

- `src/app/coach/sessions/[sessionId]/wrap-up/WrapUpPageClient.tsx`
- `src/app/coach/sessions/[sessionId]/saveWrapUpAttendanceExceptionAction.ts`
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` (grep)
- `src/app/coach/_components/CoachAttendanceExceptionDraftCard.tsx`
- `src/app/director/_actions/donnaAttendanceActions.ts`
- `src/app/director/_actions/donnaAttendanceSessionActions.ts`
- `src/app/director/sessions/[sessionId]/attendanceExceptionDraftAction.ts`
- `src/app/director/review/page.tsx` (partial)
- `src/app/director/review/AttendanceExceptionDraftCard.tsx`
- `src/app/director/review/AttendanceExceptionDraftDecisionControls.tsx`
- `src/app/director/review/ApplyApprovedAttendanceExceptionControls.tsx`
- `src/app/director/review/actions.ts` (partial — attendance exception decision + apply sections)
- `src/lib/donna/attendanceApplyGuardrails.ts`
- `src/lib/wrap-up/attendanceExceptionParser.ts`
- `src/lib/donna/donnaUIActionDispatcher.ts` (grep)
- `src/components/assistant/DonnaAttendanceExceptionCard.tsx`
- `src/components/assistant/donnaAttendanceWorkflow.ts`
- `src/components/assistant/DonnaAssistantButton.tsx` (grep)
- `src/components/assistant/donnaAttendanceParser.ts` (grep)
