# Coach Wrap-Up Loop — QA Certification Checklist
**Sprint:** 936 | **Date:** 2026-05-29
**Scope:** Sprints 926–936
**Method:** Manual QA + Static Code Analysis

---

## 1. Manual QA Checklist — Full Loop

### A. Coach sees daily brief
| Check | Pass/Fail |
|---|---|
| Log in as Coach → `/coach` renders | ☐ |
| CoachDailyBriefCard shows next session name + time | ☐ |
| Wrap-up status strip visible on card | ☐ |
| "Start Session" CTA routes to `/execute` | ☐ |
| Session list shows wrap-up status badges for today | ☐ |

### B. Coach executes session
| Check | Pass/Fail |
|---|---|
| `/execute` shows block-by-block view | ☐ |
| Block navigation (Next/Back) works | ☐ |
| After last block, "Wrap-Up →" routes to `/wrap-up` | ☐ |

### C. Coach completes wrap-up
| Check | Pass/Fail |
|---|---|
| `/wrap-up` renders 6-question DONNA flow | ☐ |
| Progress rail shows current/completed questions | ☐ |
| Voice input buttons present (AudioRecorder + Browser Dictation) | ☐ |
| Player name chips appear on standouts/attention questions (if roster exists) | ☐ |
| Chip tap appends player name to textarea | ☐ |
| Skip button works | ☐ |
| Running summary shows answered questions | ☐ |
| Early submit available after first answer | ☐ |
| "Submit for Review" saves wrap-up | ☐ |
| Saved state shows DONNA success screen | ☐ |
| Safety language visible ("pending director review, nothing sent") | ☐ |

### D. Coach creates player observation drafts
| Check | Pass/Fail |
|---|---|
| Player roster chips appear in saved state (if roster exists) | ☐ |
| Tap cycles through: + Note → ✓ Positive → ! Needs attention → removed | ☐ |
| Note input appears when type is selected | ☐ |
| "Submit player notes for review" button enabled with notes | ☐ |
| Submission succeeds → green confirmation | ☐ |

### E. Coach checks review status
| Check | Pass/Fail |
|---|---|
| Navigate to `/wrap-up/review` | ☐ |
| Loop summary card shows (pending / needs attention / complete / etc.) | ☐ |
| Loop summary does NOT show "Loop complete" if any draft is pending | ☐ |
| "Your player notes" shows each observation draft with status badge | ☐ |
| Status badge language human-friendly (no raw DB terms) | ☐ |
| "Attendance exceptions" section shows if exceptions were detected | ☐ |
| "No attendance exceptions detected" shown if none | ☐ |
| "Back to Session" link works | ☐ |

---

## 2. Director Path Checklist

| Check | Pass/Fail |
|---|---|
| Director logs in → `/director/review` accessible | ☐ |
| "Player Updates" tab shows observation drafts | ☐ |
| Observation draft card shows player name | ☐ |
| Observation draft card shows observation type (Positive/Needs Attention/General) | ☐ |
| Observation draft card shows note text | ☐ |
| Internal-only safety notice visible on draft card | ☐ |
| Approve button works → status changes to approved | ☐ |
| Reject button works → status changes to rejected | ☐ |
| "Request clarification" button works → status changes to clarification_needed | ☐ |
| Optional reviewer note captured on all three decisions | ☐ |
| "Apply — Create Observation" appears for approved drafts | ☐ |
| Apply action creates `coach_observations` record → status = executed | ☐ |
| Session wrap-up card shows player mention chips (if names in standouts/attention) | ☐ |
| Wrap-up approve/reject behavior unchanged from Sprint 904 | ☐ |

---

## 3. Coach Feedback Path Checklist

| Check | Pass/Fail |
|---|---|
| After director approves obs draft → coach review page shows "Approved" | ☐ |
| After director applies obs draft → coach review page shows "Applied" | ☐ |
| After director requests clarification → coach review page shows "Director has questions" | ☐ |
| Director note visible to coach when status is clarification_needed or rejected | ☐ |
| After all drafts applied → loop summary card shows "Loop complete" | ☐ |
| Sessions list shows "Applied" badge for executed wrap-ups | ☐ |
| Coach home DailyBriefCard shows "Applied" for completed session wrap-ups | ☐ |

---

## 4. Observation Draft Checklist

| Check | Pass/Fail |
|---|---|
| Obs drafts created via wrap-up player note form (Sprint 927) | ☐ |
| `target_module = 'coach_observation_draft_v1'` | ☐ |
| `is_private = true` in payload | ☐ |
| `source = 'coach_wrap_up'` in payload | ☐ |
| NOT visible on player portal | ☐ |
| NOT visible on parent portal | ☐ |
| Requires director approve → apply before writing to `coach_observations` | ☐ |
| Director applying does NOT send parent/player communication | ☐ |
| Director applying does NOT move player level | ☐ |

---

## 5. Attendance Exception Checklist

| Check | Pass/Fail |
|---|---|
| Attendance text auto-parsed during wrap-up submission | ☐ |
| `target_module = 'attendance_exception'` | ☐ |
| `target_object_id = sessionId` (direct column) | ☐ |
| `status = pending_review` initially | ☐ |
| No `session_attendance` record written until director approves AND applies | ☐ |
| Ambiguous names → warnings field (director must confirm manually) | ☐ |
| Coach sees exception status on wrap-up review page (Sprint 935) | ☐ |
| Director sees exception in "Needs Approval" tab | ☐ |
| Reject does NOT write attendance records | ☐ |
| Coach review page shows "Sent for director review — no attendance changes until approved" | ☐ |

---

## 6. Safety Checklist

| Check | Pass/Fail |
|---|---|
| No parent communication sent at any point in the loop | ☐ |
| No player communication sent at any point in the loop | ☐ |
| No player level movement at any point in the loop | ☐ |
| No placement change at any point in the loop | ☐ |
| No roster change at any point in the loop | ☐ |
| No billing change at any point in the loop | ☐ |
| No curriculum change at any point in the loop | ☐ |
| All state changes visible in `proposed_actions` table | ☐ |
| All mutations write to `audit_logs` (apply actions) | ☐ |
| RLS active on all tables | ☐ |
| `academy_id` scoped on all queries | ☐ |
| `proposed_by_id` scoped where coach-ownership matters | ☐ |

---

## 7. Protected Systems Checklist

| Check | Pass/Fail |
|---|---|
| Sprint 904 `updateWrapUpDraftDecisionAction` behavior unchanged | ☐ |
| Sprint 904 `applyWrapUpDraftAction` behavior unchanged | ☐ |
| `updateObservationDraftDecisionAction` behavior unchanged | ☐ |
| `CoachWrapUpDrawer` (legacy drawer) still works | ☐ |
| Director review queue existing tabs unaffected | ☐ |
| `parentSafeResponseRules.ts` not modified | ☐ |
| `voiceRoleGuardrails.ts` not modified | ☐ |
| `roleGuardrails.ts` not modified | ☐ |
| Middleware role routing unchanged | ☐ |

---

## 8. TypeScript Validation

```bash
npx tsc --noEmit
```

| Check | Result |
|---|---|
| Sprints 926–935 all compile clean | ☐ |
| No type errors in wrap-up review page | ☐ |
| No type errors in sessions page | ☐ |
| No type errors in WrapUpDraftCard | ☐ |
| No type errors in WrapUpObservationDraftCard | ☐ |
| No type errors in CoachDailyBriefCard | ☐ |
| No type errors in coach player profile | ☐ |

---

## 9. Internal Pilot Go / No-Go Checklist

### Pre-Pilot Requirements
| Check | Go |
|---|---|
| Director account (Brian) configured with active academy | ☐ |
| Coach account (Coach Farshad) assigned to groups | ☐ |
| At least 2 sessions created with player roster + blocks | ☐ |
| OPENAI_API_KEY configured (or browser dictation acceptable) | ☐ |
| Brian briefed on director review queue flow | ☐ |
| Coach Farshad briefed on wrap-up flow | ☐ |
| Manual QA sections A–I completed with all Pass | ☐ |
| TypeScript clean | ☐ |
| No pending migrations blocking core wrap-up loop | ☐ |

### Known V2 Items (Not Blocking Pilot)
| Item | Status |
|---|---|
| Loop-complete badge in sessions list | V2 — Sprint 946 |
| Coach in-app clarification response flow | V2 — Sprint 939 |
| Block completion persistence to DB | V2 — Sprint 938 |
| Voice TTS production upgrade | V2 — Sprint 944 |
| Batch observation apply | V2 — Sprint 940 |

### Pilot Go/No-Go Decision

**GO** when: all pre-pilot requirements checked, all safety checks passing, TypeScript clean, and Brian/Farshad briefed.

**NO-GO** triggers:
- Any safety check fails (parent/player comm, roster/billing change, level movement)
- TypeScript errors in core wrap-up files
- Director review queue not accessible
- Coach wrap-up submission failing (proposed_actions not created)

---

## 10. Sprint Coverage Summary

| Sprint | Feature | Status |
|---|---|---|
| 926 | Coach Daily Brief Card | ✅ Complete |
| 927 | Coach Wrap-Up 10/10 V1 (voice, chips, obs drafts) | ✅ Complete |
| 928 | Coach Session Wrap-Up Status Wiring (home badges) | ✅ Complete |
| 929 | Coach Sessions List Wrap-Up Status | ✅ Complete |
| 930 | Coach Player Profile Wrap-Up Signal | ✅ Complete |
| 931 | Director Review Queue Observation Draft Panel | ✅ Complete |
| 932 | Coach Session Recap Review Status | ✅ Complete |
| 933 | Coach Wrap-Up Loop Completion Summary | ✅ Complete |
| 934 | Director Session Wrap-Up Review Improvement (name chips) | ✅ Complete |
| 935 | Coach Wrap-Up Attendance Parse Visibility | ✅ Complete |
| 936 | Loop Certification + V2 Plan | ✅ This sprint |
