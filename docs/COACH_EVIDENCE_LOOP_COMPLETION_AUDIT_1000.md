# Coach Evidence Loop Completion Audit
Sprint 1000 — 2026-05-18

## Strategic Goal

Build the coach evidence loop:

> Curriculum → Template → Coach Session Execution → DONNA Wrap-Up → Attendance / Observation / Evidence Drafts → Director Review

This audit documents what was built across Sprints 986-1000, verifies loop integrity, and identifies the remaining gaps before the director review queue integration sprint.

---

## Loop Stage Audit

### Stage 1: Curriculum → Template

| Item | Status | File / Notes |
|---|---|---|
| Templates list page | Complete | `/director/templates` |
| Template detail page | Complete | `/director/templates/[templateId]` |
| Template blocks | Complete | `template_blocks` table |
| Curriculum level on template | Draft-ready | `rawDb` cast — migration 067 not yet applied |
| Template goal field | Draft-ready | `rawDb` cast — migration 067 not yet applied |
| Template chip on session detail | Complete | Sprint 988 — session detail shows template name + level |

### Stage 2: Template → Coach Session

| Item | Status | File / Notes |
|---|---|---|
| Coach session list | Complete | `/coach/sessions` |
| Coach session detail | Complete | `/coach/sessions/[sessionId]` |
| Block progress rail | Complete | Sprint 989 — visual rail with open execute link |
| Template chip + curriculum level chip | Complete | Sprint 988 |
| Player watch list panel | Complete | Sprint 990 — `CoachPlayerWatchList` |
| "Start Wrap-Up" CTA | Complete | Sprint 993 — lime CTA link to wrap-up route |

### Stage 3: Coach Session Execution

| Item | Status | File / Notes |
|---|---|---|
| Focused execute view | Complete | `/coach/sessions/[sessionId]/execute` |
| One-block-at-a-time mobile view | Complete | `ExecuteClient.tsx` |
| Make Easier / Make Harder buttons | Complete | Local state only, no DB write |
| Quick note per block | Complete | Local state only, no DB write |
| Block type chips + duration labels | Complete | `BLOCK_TYPE_LABEL` / `BLOCK_TYPE_COLOR` maps |
| "Wrap Up" CTA on last block | Complete | Links to wrap-up route |
| Block adjustments persisted to DB | **Not built** | Local state only — future sprint |

### Stage 4: DONNA Wrap-Up

| Item | Status | File / Notes |
|---|---|---|
| Wrap-up route | Complete | `/coach/sessions/[sessionId]/wrap-up` |
| 6-question DONNA flow | Complete | `WrapUpPageClient.tsx` |
| Running structured summary | Complete | Sprint 994 — builds section by section as coach answers |
| Save to proposed_actions | Complete | `saveWrapUpDraftAction.ts` — `pending_review` status |
| Success state with review link | Complete | Sprint 999 — "Review Submitted Draft" CTA |
| Review page | Complete | `/coach/sessions/[sessionId]/wrap-up/review` |
| Voice input for wrap-up | **Not built** | Future sprint — typed only for now |

### Stage 5: Evidence Drafts

| Item | Status | File / Notes |
|---|---|---|
| Attendance quick capture | Complete | `CoachAttendanceQuickCapture.tsx` — Sprint 991 |
| Unrostered player safety guardrail | Complete | Sprint 991 — does not add to roster or trigger billing |
| Attendance exception summary | Complete | `CoachAttendanceExceptionSummary.tsx` — Sprint 992 |
| Attendance exception server action | Complete | `saveWrapUpAttendanceExceptionAction.ts` (pre-existing) |
| Observation draft card | Complete | `CoachObservationDraftCard.tsx` — Sprint 995 |
| Observation draft list | Complete | Sprint 995 — max 3 shown, "Show N more" |
| Observation server action | Complete | `saveWrapUpObservationsAction.ts` (pre-existing) |
| Session actual draft card | Complete | `CoachSessionActualDraftCard.tsx` — Sprint 996 |
| Curriculum evidence draft card | Complete | `CoachCurriculumEvidenceDraftCard.tsx` — Sprint 997 |
| Parent-safe draft card | Complete | `CoachParentSafeDraftCard.tsx` — Sprint 998 |

### Stage 6: Director Review

| Item | Status | File / Notes |
|---|---|---|
| Director review queue | Complete (pre-existing) | `/director/review-queue` |
| proposed_actions table + RLS | Complete (migration 009) | All coach wrap-up drafts land here |
| `execute_approved_action()` | Complete (pre-existing) | Director approval path |
| Coach wrap-up drafts in director queue | Complete (pre-existing) | `pending_review` status auto-routes |
| Director observation review card | Complete (pre-existing) | Director-side display |
| Director session actual review card | **Partially built** | `CoachSessionActualDraftCard` is display-only — director integration pending |
| Director parent-safe summary approval | **Not built** | `CoachParentSafeDraftCard` is coach-side only — director send flow pending |
| Director curriculum gate evidence approval | **Not built** | `CoachCurriculumEvidenceDraftCard` is coach-side only — gate linkage pending |

---

## Component Inventory

| Component | Sprint | Purpose |
|---|---|---|
| `CoachPlayerWatchList.tsx` | 990 | Per-player attention flags + watch-for notes in session detail |
| `CoachAttendanceQuickCapture.tsx` | 991 | Attendance status capture + unrostered safety guardrail |
| `CoachAttendanceExceptionSummary.tsx` | 992 | Exception draft list with status tracking |
| `CoachObservationDraftCard.tsx` | 995 | Player observation drafts with type/pathway/urgency/flags |
| `CoachSessionActualDraftCard.tsx` | 996 | Planned-vs-actual block completion card |
| `CoachCurriculumEvidenceDraftCard.tsx` | 997 | Curriculum gate evidence link suggestions |
| `CoachParentSafeDraftCard.tsx` | 998 | Parent-safe session summary drafts |

## Route Inventory

| Route | Sprint | Purpose |
|---|---|---|
| `/coach/sessions/[sessionId]/execute` | 989 | Focused block-by-block execution view |
| `/coach/sessions/[sessionId]/wrap-up` | 993 | DONNA 6-question wrap-up flow |
| `/coach/sessions/[sessionId]/wrap-up/review` | 999 | Review submitted wrap-up draft + director status |

---

## Safety Audit

All evidence draft components comply with the core operating model:

| Rule | Status |
|---|---|
| AI proposes → Director approves → System records → System executes | Enforced — all drafts land in `proposed_actions` with `pending_review` status |
| No auto-approval | Confirmed — no component or action auto-approves a draft |
| No parent sends | Confirmed — `CoachParentSafeDraftCard` is display-only; no send button |
| No automatic level movement | Confirmed — `CoachCurriculumEvidenceDraftCard` has explicit safety notice |
| No roster mutation | Confirmed — `CoachAttendanceQuickCapture` unrostered section shows guardrail; no DB write to roster |
| No billing trigger | Confirmed — unrostered capture explicitly states "does not trigger billing" |
| Internal notes not shown to parents/players | Confirmed — all observation and parent-safe draft cards use `parentSafe` flag and "Internal only" labels |
| Draft disclaimer visible | Confirmed — every draft card has a footer or notice stating approval required |

---

## Remaining Gaps (Post-Sprint 1000)

| Gap | Priority | Notes |
|---|---|---|
| Block adjustments (easier/harder) persist to DB | Medium | Currently local state only in ExecuteClient |
| Voice input for wrap-up | Medium | Typed only for now |
| Director: approve + send parent-safe summary | High | Next phase — director review queue integration |
| Director: link curriculum evidence to gate | High | Next phase — curriculum gate approval flow |
| Director: session actual draft → session record apply | High | `execute_approved_action` integration for session_wrap_up_v1 |
| Wrap-up re-open / amend flow | Low | Currently one-shot save only |
| Block note persist to session_blocks | Low | Quick note in execute view is local only |

---

## Conclusion

The coach evidence loop (Sprints 986-1000) is structurally complete from coach input through proposed_actions submission. All 7 new coach components follow the draft-first, director-review pattern with no auto-approvals, no parent sends, and no automatic data mutations. The director review queue integration — converting approved proposed_actions into real session records, curriculum gate links, and parent communications — is the next build phase.
