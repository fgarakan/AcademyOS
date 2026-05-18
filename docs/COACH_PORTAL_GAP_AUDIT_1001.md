# Coach Portal Gap Audit
Sprint 1001 — 2026-05-18

---

## Part A — Gap Extraction from Sprint 1000 Audit

### What is complete

All items from the coach evidence loop (Sprints 986-1000) are structurally complete:

| Area | Status |
|---|---|
| Coach session list (`/coach/sessions`) | Complete |
| Coach session detail with template chip + curriculum level | Complete |
| Block progress rail (visual, links to execute) | Complete |
| Player watch list panel (`CoachPlayerWatchList`) | Complete |
| Focused execute view (`/coach/sessions/[sessionId]/execute`) | Complete |
| Attendance quick capture (`CoachAttendanceQuickCapture`) | Complete |
| Attendance exception summary (`CoachAttendanceExceptionSummary`) | Complete |
| Attendance exception server action (`saveWrapUpAttendanceExceptionAction`) | Complete |
| DONNA 6-question wrap-up flow (`/coach/sessions/[sessionId]/wrap-up`) | Complete |
| Running DONNA summary draft (builds as coach answers) | Complete |
| Save to `proposed_actions` with `pending_review` status | Complete |
| Wrap-up review page (`/coach/sessions/[sessionId]/wrap-up/review`) | Complete |
| Observation draft card (`CoachObservationDraftCard`) | Complete |
| Session actual draft card (`CoachSessionActualDraftCard`) | Complete |
| Curriculum evidence draft card (`CoachCurriculumEvidenceDraftCard`) | Complete |
| Parent-safe draft card (`CoachParentSafeDraftCard`) | Complete |

### What is demo/local-only

| Item | Notes |
|---|---|
| Block adjustment (easier/harder) in execute view | Local React state only, not persisted to DB |
| Quick note per block in execute view | Local state only, not persisted |
| Block status (done/skipped/modified) | localStorage only — no `session_blocks.status` column |

### What is not wired to backend yet

| Item | Notes |
|---|---|
| `CoachSessionActualDraftCard` on director side | Display component exists; not yet integrated into director review queue |
| `CoachCurriculumEvidenceDraftCard` director approval | Coach-side display only; gate linkage flow not built |
| `CoachParentSafeDraftCard` director send flow | Coach-side display only; no director "approve + send to parent" action |

### What still needs director review queue integration

| Gap | Priority |
|---|---|
| Director: view + approve session actual draft from wrap-up | High — next phase |
| Director: view + approve/send parent-safe summary | High — next phase |
| Director: link curriculum evidence to gate | High — gate confirmation flow |
| `execute_approved_action()` for `session_wrap_up_v1` action type | High — apply session actuals |

### What still needs migration/schema work later

| Item | Notes |
|---|---|
| `session_blocks.status` column | Needed to persist block done/skipped/modified from execute view |
| `session_actuals` table | Richer normalized session outcome records (future sprint) |
| Migration 045 (`curriculum_level_id` on templates) | Not yet applied to live DB |
| Migrations 041-044, 059-062 | Multiple schema gaps documented in `KNOWN_LIMITATIONS.md` |

### What must be fixed before building more UI

| Item | Status |
|---|---|
| Runtime error on `/director/templates/coach-preview` | FIXED this sprint — `onClick` removed from Server Component buttons |

---

## Part B — Runtime Error Fix

**Error:** "Event handlers cannot be passed to Client Component props. `<button ... onClick={function onClick} ...>`"

**Root cause:** `src/app/director/templates/coach-preview/page.tsx` is an `async` Server Component. It contained four `<button onClick={() => {}}>` demo chip elements. React cannot serialize function props from Server Components.

**Fix applied:** Converted the four demo DONNA quick-action chip `<button onClick={() => {}}>` elements to `<span>` elements. The handlers were empty (`() => {}`), so removing them changes no functionality. The `LayoutTemplate` icon and label text are preserved. Hover style removed (no longer interactive).

**File changed:** `src/app/director/templates/coach-preview/page.tsx`

**Routes verified (see Phase 4):**
- `/director/templates/coach-preview` — no longer crashes
- `/director/templates/coach-preview?type=class`
- `/director/templates/coach-preview?type=fitness`
- `/director/templates/coach-preview?level=Orange%20Ball%201&goal=Baseline`
- `/director/templates/coach-preview?level=Orange%20Ball%201&goal=Baseline&type=class`

---

## Part C — Prototype Workflow Audit

**Note:** The file `academyos-coach-portal.zip` was not found in the workspace root at audit time. This section audits based on the screen names described in the sprint prompt. Do not copy prototype files into AcademyOS.

**Strategic rule:** Prototype = workflow reference only. AcademyOS dark/lime/sidebar/card language is the visual system. Do not import prototype styles.

| Prototype Screen | Purpose | Keep / Adapt / Defer | AcademyOS Equivalent | Data Connection | Safety Risk | Covered by Sprints 986-1000? |
|---|---|---|---|---|---|---|
| CoachToday | Coach home — today's sessions, quick stats, wrap-up CTA | Keep — adapt to AcademyOS | `/coach` (built) | `coachWorkspace` backend — live | Low | Yes — coach home exists with real data |
| SessionPlan | Pre-session view — block list, player watch list, curriculum context | Keep — adapt | `/coach/sessions/[sessionId]` (built) | `sessions`, `session_blocks`, player data — live | Low | Yes — Sprint 988-990 |
| TemplateExecution | One-block-at-a-time execution view | Keep — adapt | `/coach/sessions/[sessionId]/execute` (built) | localStorage only for block state | Medium (no DB persist) | Yes — Sprint 989 |
| PlayerWatchList | Per-player attention flags during session | Keep | `CoachPlayerWatchList` (built) | Static DONNA-style flags — no DB | Low | Yes — Sprint 990 |
| DonnaAssistant | DONNA chat during session / wrap-up | Defer — unrestricted chat not safe for V1 | `WrapUpPageClient` (structured questions only) | No free chat; Q&A only | High if open-ended | Partial — DONNA wrap-up is structured, not free chat |
| DonnaWrapUp | 6-question DONNA-guided wrap-up | Keep | `/coach/sessions/[sessionId]/wrap-up` (built) | `saveWrapUpDraftAction` → `proposed_actions` | Low — draft only | Yes — Sprints 993-994 |
| AttendanceException | Unrostered player flagging + exception summary | Keep | `CoachAttendanceQuickCapture` + `CoachAttendanceExceptionSummary` (built) | `saveWrapUpAttendanceExceptionAction` — live | Low — guardrail built | Yes — Sprints 991-992 |
| PlayerObservation | Structured player observation drafts | Keep | `CoachObservationDraftCard` (built) | `saveWrapUpObservationsAction` → `proposed_actions` | Low — draft only | Yes — Sprint 995 |
| WrapUpReview | Coach-side review of submitted wrap-up draft | Keep | `/coach/sessions/[sessionId]/wrap-up/review` (built) | `proposed_actions` query | Low | Yes — Sprint 999 |
| SubmittedSummary | Status of submitted drafts | Keep — adapt | `CoachSessionActualDraftCard` + `CoachParentSafeDraftCard` (built) | `proposed_actions` — live | Low | Partial — display only, no director flow |
| PortalLayout | Mobile-first coach portal shell | Keep — adapt to AcademyOS | `BottomTabBar` + `/coach` layout (built) | N/A | Low | Yes |
| AcademyOSBrand | Visual identity / design tokens | Do not import — use AcademyOS system | `tailwind.config.ts` + `globals.css` | N/A | None | N/A |

---

## Part D — UI Coverage Table

Audit of actual AcademyOS coach routes and components (Sprints 986-1000).

| Prototype Screen | AcademyOS Route or Component | Built? | AcademyOS-native? | Data Live/Demo? | Safe for V1? | Gap |
|---|---|---|---|---|---|---|
| CoachToday | `/coach` — `page.tsx` | Yes | Yes — dark/lime, Card, bottom nav | Live (coachWorkspace) | Yes | None significant |
| SessionPlan | `/coach/sessions/[sessionId]` | Yes | Yes | Live | Yes | No coach-today sub-route exists |
| TemplateExecution | `/coach/sessions/[sessionId]/execute` | Yes | Yes | Live blocks; local state only for status | Partial | Block status not persisted to DB |
| PlayerWatchList | `CoachPlayerWatchList.tsx` | Yes | Yes | Static flags | Yes | Flags are DONNA-style demo data, not DB-driven |
| DonnaAssistant (free chat) | Not built | No | N/A | N/A | Deferred | Unrestricted DONNA chat not safe for V1 |
| DonnaWrapUp | `/coach/sessions/[sessionId]/wrap-up` + `WrapUpPageClient.tsx` | Yes | Yes | `proposed_actions` write | Yes | Typed only; no voice input yet |
| AttendanceException | `CoachAttendanceQuickCapture.tsx` + `CoachAttendanceExceptionSummary.tsx` | Yes | Yes | `session_attendance` + `proposed_actions` | Yes | None |
| PlayerObservation | `CoachObservationDraftCard.tsx` | Yes | Yes | `proposed_actions` | Yes | Display component; wiring to wrap-up flow varies |
| WrapUpReview | `/coach/sessions/[sessionId]/wrap-up/review` | Yes | Yes | `proposed_actions` | Yes | None |
| SubmittedSummary | `CoachSessionActualDraftCard.tsx` + `CoachParentSafeDraftCard.tsx` | Yes (display) | Yes | `proposed_actions` | Partial | Director approval + send flow not yet built |
| PortalLayout | `/coach/layout.tsx` + `BottomTabBar.tsx` | Yes | Yes | N/A | Yes | None |
| CurriculumEvidence | `CoachCurriculumEvidenceDraftCard.tsx` | Yes (display) | Yes | `proposed_actions` | Partial | Director gate linkage not yet built |

**Overall coverage score:** 10 of 12 prototype screens have an AcademyOS-native equivalent. 2 remain:
- DonnaAssistant free chat (deferred by design — not safe for V1)
- Director-side approval flows for parent-safe and curriculum evidence (next sprint block)

---

## Part E — Explicit Defers

The following features must NOT be built until explicitly authorized in a future sprint:

| Feature | Reason to Defer |
|---|---|
| Real voice transcription (STT) | Requires `OPENAI_API_KEY`; endpoint built but not activated |
| Unrestricted DONNA chat for coaches | No role guardrails for open-ended coach queries; free chat bypasses review pipeline |
| Automatic parent sends | Violates core operating model: director approval required before any parent communication |
| Automatic player profile updates from wrap-up | Profile updates must go through `proposed_actions` and director review |
| Automatic curriculum evidence application | Gate decisions require explicit director confirmation |
| Automatic attendance writes (roster mutations) | Unrostered additions require director review |
| Automatic roster mutation | No coach action can add/remove a player from a group |
| Billing triggers | Not in scope; no billing schema |
| Unapproved parent-safe messages | `CoachParentSafeDraftCard` is display-only until director "approve + send" flow is built |
| Real-time AI decisions without review | All AI/DONNA outputs land in `proposed_actions` with `pending_review` status |

---

## Part F — Recommended Sprint 1002-1015 Block

Based on the audit findings, the highest-value work in priority order:

### Director Review Queue Integration (Highest Priority)

| Sprint | Deliverable | Why Now |
|---|---|---|
| 1002 | Director: Session Actual Draft Review Card | `CoachSessionActualDraftCard` exists on coach side; director needs a matching review card in `/director/review` with approve/reject + apply controls |
| 1003 | Director: `execute_approved_action()` for wrap-up apply | Extend the RPC handler to apply approved session wrap-up data to `sessions.session_notes` and advance session status |
| 1004 | Director: Parent-Safe Summary Approval Flow | Add approve + send-queued flow to director review queue; `CoachParentSafeDraftCard` is already display-ready on coach side |
| 1005 | Director: Curriculum Gate Evidence Review | Add director-side gate evidence review card — link evidence to `player_gate_status`, confirm or reject |

### Coach Portal Polish (Second Priority)

| Sprint | Deliverable | Why Now |
|---|---|---|
| 1006 | Coach Today — session entry points audit | Verify `/coach` surfaces today's sessions clearly with "Start Wrap-Up" CTA visible after session |
| 1007 | Coach session detail — missing data state polish | Block list empty states when migration pending; curriculum context panel when no level assigned |
| 1008 | Mobile usability QA pass — coach routes | All coach routes tested at 375px; BottomTabBar active state; wrap-up flow scroll behavior |

### Backend Wiring (When Ready)

| Sprint | Deliverable | Why Now |
|---|---|---|
| 1009 | Block status DB persist — add `status` column to `session_blocks` | Required migration; unblocks execute view persistence |
| 1010 | Block adjustments (easier/harder) persist to `proposed_actions` | Converts local state into a reviewable draft |

### Director Dashboard + Review Queue Hardening

| Sprint | Deliverable | Why Now |
|---|---|---|
| 1011 | Director review queue — wrap-up action type coverage audit | Confirm all 7 coach-generated draft types appear in `/director/review` correctly |
| 1012 | Review queue badge count — live pending_review scoped count | Currently hardcoded at 0 for some action types |
| 1013 | Director: approve observation → player observation record | Close the observation loop from coach → proposed_action → player observation table |

### Future (Only After Above Are Done)

| Sprint | Deliverable | Gate |
|---|---|---|
| 1014 | Parent portal: approved session summary display | Requires Sprint 1004 complete + guardian linkage |
| 1015 | Player portal: approved development update display | Requires Sprint 1013 complete + profile_id linkage |

---

## Safety Summary

All components built in Sprints 986-1000 comply with the core operating model. No features added in this sprint block should bypass the rule:

> AI proposes → Director approves → System records → System executes

No coach action from Sprints 986-1000 auto-approves, auto-sends, or auto-mutates.
The director review queue integration (Sprints 1002-1005) will be the first time approved coach evidence results in real downstream writes — and those writes must continue to flow through `execute_approved_action()` and `audit_logs`.
