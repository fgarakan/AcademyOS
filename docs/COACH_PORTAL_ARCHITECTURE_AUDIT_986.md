# Coach Portal Architecture Audit
Sprint 986 — 2026-05-18

## Purpose

Audit the actual current state of the Coach Portal before beginning Sprints 987–1000. This document is the source of truth for the remaining sprint block. Do not treat the sprint plan as accurate before reading this audit — the existing codebase is significantly more built than the plan assumed.

---

## 1. Existing Coach Routes

| Route | File | Status |
|---|---|---|
| `/coach` | `src/app/coach/page.tsx` | **Built** — today's sessions, pending wrap-up alert, player list, recent notes, quick actions |
| `/coach/sessions` | `src/app/coach/sessions/page.tsx` | **Built** — sessions list |
| `/coach/sessions/[sessionId]` | `src/app/coach/sessions/[sessionId]/page.tsx` | **Built** — full session detail: blocks, exercises, roster, attendance, execution, wrap-up drawer |
| `/coach/players` | `src/app/coach/players/page.tsx` | **Built** — player list |
| `/coach/players/[playerId]` | `src/app/coach/players/[playerId]/page.tsx` | **Built** — player detail |
| `/coach/recap` | `src/app/coach/recap/page.tsx` | **Built** |
| `/coach/voice` | `src/app/coach/voice/page.tsx` | **Built** |
| `/coach/sessions/[sessionId]/execute` | — | **Does not exist** — `CoachSessionExecutionClient` exists inside the session page but no dedicated route |
| `/coach/sessions/[sessionId]/wrap-up` | — | **Does not exist** — wrap-up is a drawer within the session page |
| `/coach/sessions/[sessionId]/wrap-up/review` | — | **Does not exist** |
| `/coach/sessions/[sessionId]/attendance` | — | **Does not exist** |
| `/coach/capture` | — | **Does not exist** |
| `/coach/today` | — | **Does not exist** — `/coach` serves this role |

---

## 2. Existing Session Components

| Component | File | Status |
|---|---|---|
| `CoachSessionExecutionClient` | session/`CoachSessionExecutionClient.tsx` | **Built** — start/stop session, per-exercise status (done/skipped/modified), notes, attendance tracking |
| `CoachWrapUpDrawer` | session/`CoachWrapUpDrawer.tsx` | **Built** — full 7-question wrap-up flow, player notes, block completion, unrostered detection |
| `CoachWrapUpStatusCard` | session/`CoachWrapUpStatusCard.tsx` | **Built** — shows wrap-up completion state |
| `CoachWrapUpDetailPanel` | session/`CoachWrapUpDetailPanel.tsx` | **Built** — post-wrap-up attendance + block completion detail view |
| `CoachRecapCommandPanel` | session/`CoachRecapCommandPanel.tsx` | **Built** — voice/text recap with AI structuring |
| `CoachSessionGapBriefPanel` | session/`CoachSessionGapBriefPanel.tsx` | **Built** — curriculum gap brief for the session |
| `CoachSessionCurriculumPanel` | session/`CoachSessionCurriculumPanel.tsx` | **Built** — curriculum context panel |
| `CoachSessionActions` | session/`CoachSessionActions.tsx` | **Built** — session action buttons |
| `SessionRecapPanel` | session/`SessionRecapPanel.tsx` | **Built** |

---

## 3. Existing Wrap-Up Question Flow (CoachWrapUpDrawer)

The wrap-up drawer implements a 7-question flow:

| Step | Question |
|---|---|
| 1 | Was everyone here, or was anyone missing or added today? |
| 2 | Did the session mostly follow the plan? |
| 3 | What changed or got skipped — and why? |
| 4 | Any players stand out positively today? |
| 5 | Any players need extra attention next time? |
| 6 | What should the focus be for the next session? |
| 7 | Any parent or director follow-up needed? |

Phase states: `questions → summary → saved`. Voice input placeholder exists (`VoiceInputButton`, `AudioRecorderButton`). Running block completion UI built. Player name extraction from free text implemented.

---

## 4. Existing Server Actions

| Action | File | Purpose | Writes to |
|---|---|---|---|
| `saveSessionExecutionAction` | session/`actions.ts` | Update session status, notes | `sessions` |
| `saveAttendanceAction` | session/`actions.ts` | Save attendance per player | `session_attendance` |
| `saveSessionRecapAction` | session/`actions.ts` | Save recap to session_notes | `sessions` |
| `saveWrapUpDraftAction` | session/`saveWrapUpDraftAction.ts` | Session actual → proposed_actions | `voice_commands`, `proposed_actions` |
| `saveWrapUpObservationsAction` | session/`saveWrapUpObservationsAction.ts` | Observations → proposed_actions per player | `voice_commands`, `proposed_actions` |
| `saveWrapUpAttendanceExceptionAction` | session/`saveWrapUpAttendanceExceptionAction.ts` | Unrostered attendees → proposed_actions | `voice_commands`, `proposed_actions` |
| `structureCoachRecapAction` | session/`structureCoachRecapAction.ts` | Structure recap text via AI | `voice_commands`, `structured_recap` |

All wrap-up actions route through `proposed_actions` with `status='pending_review'`. No direct writes to player profiles, session records, or parent comms. No roster mutations.

---

## 5. Existing Coach Library (src/lib/coach)

| File | Purpose |
|---|---|
| `wrapUpSessionSelector.ts` | Finds sessions needing wrap-up for a coach |
| `wrapUpRosterLoader.ts` | Loads roster with attendance status for a session |
| `wrapUpAttendanceDraftLoader.ts` | Loads attendance draft from proposed_actions |
| `wrapUpSessionActualLoader.ts` | Loads session actual draft from proposed_actions |
| `wrapUpReviewQueueLoader.ts` | Loads pending wrap-up items for director review |
| `wrapUpPlayerNameMatcher.ts` | Fuzzy-matches player names from free-text recap answers |

---

## 6. Director Review Queue — Coach-Originated Items

| Card Component | File | Handles |
|---|---|---|
| `WrapUpDraftCard` | review/`WrapUpDraftCard.tsx` | Session actual drafts |
| `WrapUpObservationDraftCard` | review/`WrapUpObservationDraftCard.tsx` | Player observation drafts |
| `AttendanceExceptionDraftCard` | review/`AttendanceExceptionDraftCard.tsx` | Unrostered attendee exceptions |
| `ApplyWrapUpDraftControls` | review/`ApplyWrapUpDraftControls.tsx` | Approve/apply session actual |
| `ApplyWrapUpObservationDraftControls` | review/`ApplyWrapUpObservationDraftControls.tsx` | Approve/apply observations |
| `ApplyApprovedAttendanceExceptionControls` | review/`ApplyApprovedAttendanceExceptionControls.tsx` | Approve/apply attendance exceptions |

The director review queue already accepts and displays coach wrap-up drafts.

---

## 7. Existing DONNA Surfaces in Coach Portal

- `CoachRecapCommandPanel` — voice/text recap with structured DONNA output inside session page
- `DonnaOpenChip` — opens DONNA assistant from session page header
- `CoachSessionGapBriefPanel` — curriculum gap brief pulled into session context
- Wrap-up drawer intro copy: "Let's wrap this up quickly..."

**Missing DONNA surfaces:**
- No DONNA assistant card on coach home (`/coach`) beyond the wrap-up alert
- No DONNA prompt on "next session" focus
- No curriculum evidence hint during wrap-up

---

## 8. What the Coach Already Has

```
/coach
  → Today's sessions
  → Pending wrap-up alert
  → Player list
  → Recent notes
  → Quick actions

/coach/sessions/[sessionId]
  → Session detail + template name
  → Block timeline
  → Exercise list
  → Roster + attendance
  → Execution tracker (start/stop, per-exercise status)
  → CoachWrapUpDrawer: 7-question flow
    → Attendance exception capture
    → Block completion tracking
    → Player notes (positive / needs attention)
    → Unrostered attendee detection
    → Save to proposed_actions (3 separate actions)
  → CoachWrapUpStatusCard + CoachWrapUpDetailPanel
  → Voice/text recap with AI structuring
  → Curriculum gap brief
  → Curriculum panel
```

---

## 9. What the Coach Does Not Have

| Gap | Detail |
|---|---|
| No "Next Session" focus card on coach home | Only a list of today's sessions — no prominent "next up" card with curriculum focus and DONNA prompt |
| No template source/curriculum display in session plan | Session page shows blocks but not the originating curriculum stage, watch-fors, or DONNA suggestions |
| No dedicated execute route | `CoachSessionExecutionClient` is embedded in the full session page — no clean focused execute view |
| No `CoachPlayerWatchList` component | No pre-session at-a-glance player priority card |
| No dedicated `/coach/sessions/[sessionId]/wrap-up` page | Wrap-up is a drawer — works, but has no dedicated mobile URL |
| No dedicated wrap-up review page | No consolidated review-before-submit screen |
| No curriculum evidence draft links | Wrap-up produces session/observation drafts but no curriculum gate evidence linking |
| No parent-safe summary draft from wrap-up | Wrap-up does not generate a parent-safe summary |
| No "planned vs actual" summary for coach | Director has PlannedVsActualDiffPanel; coach side has block completion but no summary |

---

## 10. Data Model for Sessions

**Key tables (all exist):**

| Table | Purpose |
|---|---|
| `sessions` | Session record with `template_id`, `group_id`, `coach_id`, `status`, `scheduled_date/time` |
| `session_blocks` | Blocks copied from template at session creation; `order_index` defines plan |
| `session_block_exercises` | Exercises within blocks |
| `session_attendance` | Player attendance per session |
| `proposed_actions` | All coach wrap-up drafts land here for director review |
| `voice_commands` | Required FK for proposed_actions — wrap-up actions create a record here |
| `coach_observations` | Applied observations (approved from proposed_actions) |

---

## 11. Refined Sprint Plan 987–1000

| Sprint | Goal | Files | Migration risk | Risk | Type |
|---|---|---|---|---|---|
| 987 | Coach Today Enhancement | `/coach` page enhancement, DONNA next-session card | None | Low | Enhancement |
| 988 | Session Plan Curriculum Context | session `[sessionId]/page.tsx` — add curriculum source/watch-fors/template source display | None | Low | Enhancement |
| 989 | Dedicated Coach Execute Route | `src/app/coach/sessions/[sessionId]/execute/page.tsx` | None | Low | New route |
| 990 | Coach Player Watch List | `src/components/coach/CoachPlayerWatchList.tsx` | None | Low | New component |
| 991 | Attendance Quick Capture Component | `src/components/coach/CoachAttendanceQuickCapture.tsx` | None | Low | New component |
| 992 | Attendance Exception Review Draft Enhancement | Enhance `AttendanceExceptionDraftCard` display; add coach-side pending summary | None | Low | Enhancement |
| 993 | Dedicated Coach Wrap-Up Route | `src/app/coach/sessions/[sessionId]/wrap-up/page.tsx` | None | Medium | New route |
| 994 | DONNA Wrap-Up Question Flow Enhancement | Add running summary panel and curriculum evidence hints to wrap-up | None | Low | Enhancement |
| 995 | Coach Observation Draft Enhancement | Add pathway, evidence flag, urgency fields to observation draft output | None | Low | Enhancement |
| 996 | Session Actual Draft Enhancement | Add planned-vs-actual block summary to coach wrap-up output | None | Low | Enhancement |
| 997 | Curriculum Evidence Draft Links | Suggest curriculum gate evidence links from wrap-up answers | None | Low | New feature |
| 998 | Parent-Safe Draft Summary | Generate parent-safe summary from wrap-up answers (no sends) | None | Low | New feature |
| 999 | Coach Wrap-Up Review Submit Route | `src/app/coach/sessions/[sessionId]/wrap-up/review/page.tsx` — consolidated draft review | None | Low | New route |
| 1000 | Coach Evidence Loop Completion Audit | `docs/COACH_EVIDENCE_LOOP_COMPLETION_AUDIT_1000.md` | None | None | Audit doc |

---

## 12. Security and Role Guardrails

All coach portal actions already enforce:
- `academyId` from `profiles` via session — never URL
- Role check before any write (coach/head_coach/director only)
- No parent/player data exposure in coach-only views
- All mutations route through `proposed_actions` (status `pending_review`)
- No direct writes to `coach_observations`, `players`, `group_memberships`
- Unrostered player → proposed_actions only; never → roster/billing/parent comms
- `assertNotPreviewMode()` gate on all write actions

---

## 13. Key Risks

| Risk | Mitigation |
|---|---|
| Coach cognitive load | Sprint 989 dedicated execute view; large tap targets; one-question wrap-up drawer already built |
| Mobile usability | All new routes must be mobile-first; no table layouts |
| Wrong player name matching | `wrapUpPlayerNameMatcher` already built; expose confidence in UI |
| Unrostered players | Already routed through proposed_actions with director review required |
| Parent-safe vs internal notes | `parentSafeResponseRules.ts` exists and must be consulted for Sprint 998 |
| Evidence confidence | Sprint 997 must show confidence label on all evidence suggestions |
| Review queue overload | Coach wrap-up already batches into 3 action types — manageable |
| Coach compliance/adoption | UX must feel like help, not admin — Sprint 987 DONNA card framing critical |

---

## 14. 10/10 UX Principles

1. Coach feels helped, not managed — DONNA introduces the wrap-up as "Let's wrap this up quickly"
2. No dense forms after class — the wrap-up drawer is already one question at a time
3. Always editable — no answer is locked until submit
4. Large tap targets — all new mobile routes must use `py-3 px-4` minimum button sizing
5. Voice-first but not voice-only — `VoiceInputButton` and `AudioRecorderButton` already in drawer
6. Review before official updates — all drafts land in proposed_actions first
7. No hidden parent visibility — internal observations are `is_private: true`; parent comms require approval
8. Fastest path: coach taps session → taps "Wrap Up" → answers 7 questions → taps "Save" → done

---

## TypeScript: CLEAN
## Migrations: NONE
## Next sprint: 987 — Coach Today Enhancement V1
