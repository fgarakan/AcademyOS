# Coach Mobile + Assessment Capture QA Checklist

**Sprint:** 593 — Coach Mobile + Assessment QA V1
**Date:** 2026-05-21
**Covers:** Sprints 584–593 (Phase 4 of Mega Sprint 554–603)

---

## Pre-test setup

- [ ] Sign in as `head_coach` or `coach`
- [ ] Navigate to `/coach` home
- [ ] TypeScript: `npx tsc --noEmit` exits clean

---

## Sprint 584 — Coach Mobile Home Polish V1

- [ ] "ON-COURT CAPTURE" section visible below DONNA card and above "QUICK ACTIONS"
- [ ] 4 large touch-friendly tiles visible: Quick Capture, Assessment, Curriculum Idea, Wrap-Up
- [ ] Quick Capture tile is lime-accented
- [ ] Assessment and Curriculum Idea tiles are surface-accented
- [ ] Wrap-Up tile links to `/coach/recap`
- [ ] Tapping Quick Capture opens fullscreen sheet (no route change)
- [ ] Tapping Assessment opens DONNA assessment capture sheet
- [ ] Tapping Curriculum Idea opens curriculum draft capture sheet
- [ ] Closing any sheet returns to home without losing page scroll position
- [ ] Last capture confirmation appears on home after capture is saved and dismissed
- [ ] Curriculum feedback card appears after submitting a curriculum idea

---

## Sprint 585 — Coach Session Plan Curriculum Focus V1

- [ ] `CoachSessionFocusCard` component exists at `src/app/coach/_components/CoachSessionFocusCard.tsx`
- [ ] Component accepts: sessionName, curriculumFocus, keyDomains, watchFors, assessmentOpportunities, drilNote
- [ ] Collapsed by default — click header to expand
- [ ] Curriculum focus text visible when set
- [ ] Key domains shown as chips
- [ ] Assessment opportunities section with lime accent and Sparkles icon
- [ ] Player watch-fors show player name + focus + "assess" badge when isAssessmentOpportunity
- [ ] Quick note textarea saves locally
- [ ] "Stays local until wrap-up" note visible
- [ ] Empty state shows when no curriculum content is set

---

## Sprint 586 — Coach Attendance Exception UX V1

- [ ] `CoachAttendanceExceptionDraftCard` component exists
- [ ] "✓ Everyone present" button available as quick action
- [ ] Exception entry: player name input + type selector + note + Add button
- [ ] Exception types: Absent, Late arrival, Left early, Showed up (not on roster), Excused absence
- [ ] Quick add chips: Someone was absent, Late arrival, Left early, Unexpected player showed up
- [ ] Unrostered arrival warning badge visible when exception type = unrostered_arrival
- [ ] "No roster change until approved" copy visible
- [ ] Exceptions list shows with × remove button
- [ ] Save as Draft button disabled until at least one exception added
- [ ] Saved state shows all exceptions and "draft only" disclaimer

---

## Sprint 587 — Coach Quick Capture V2

- [ ] 7 capture types visible in type selector: Player note, Session note, Curriculum idea, Drill idea, Assessment note, Parent follow-up idea, Readiness flag
- [ ] Each type has distinct colour
- [ ] Player name field appears for types that need a player (player_note, assessment_note, parent_followup, readiness_flag)
- [ ] Note textarea placeholder changes per type
- [ ] "Save Draft" disabled until note filled (and player if required)
- [ ] Saved state shows type emoji, player name, captured text
- [ ] "Capture another" resets form
- [ ] Readiness flag shows red internal warning
- [ ] Parent follow-up shows orange "reviewed by director" warning

---

## Sprint 588 — Coach Voice-to-Curriculum Draft UI V1

- [ ] Free text input textarea
- [ ] 4 example prompts clickable
- [ ] "Structure with DONNA" button active when input is not empty
- [ ] After structuring: DONNA comment card visible
- [ ] Content type selector (7 options) — pre-selected from detection
- [ ] Target stage selector (6 options) — pre-selected from detection
- [ ] Coach can adjust content type and stage before submitting
- [ ] Confidence level shown
- [ ] "Nothing official changed yet" copy prominent
- [ ] Submit for Review → submitted state with confirmation
- [ ] No AI API call — uses keyword pattern matching only

---

## Sprint 589 — Coach Voice-to-Assessment Draft UI V1

- [ ] Player name field required
- [ ] Observation textarea with example prompts
- [ ] "Structure with DONNA" classifies domain and score
- [ ] Review phase shows: DONNA comment, confidence badge, domain (if detected), score picker 1–10
- [ ] Coach can adjust score using number picker
- [ ] Band label and description shown for current score
- [ ] Domain not detected → red error, back button to edit
- [ ] Confirm Draft → confirmed state with player + domain + score summary
- [ ] "No official player record changed" copy visible
- [ ] Uses `voiceStructuring.ts` from Phase 3 — no external AI call

---

## Sprint 590 — End-of-Session Recap UI Polish V1

- [ ] `/coach/recap` now has 7 questions (added "Assessment Notes" between Needs Attention and Readiness Check)
- [ ] "Assessment Notes" question has DONNA classification hint copy
- [ ] "Readiness Check" question (formerly "Safety & Readiness") uses observable, non-medical language
- [ ] Review stage: DONNA context note mentions "classifying assessment notes"
- [ ] Assessment note awareness card appears when assessment answer has content
- [ ] Player observation awareness card appears when standouts or attention answers have content
- [ ] Assessment Draft section in structured draft preview shows assessment answers
- [ ] Submit → no API call, just local state (existing shell behaviour preserved)

---

## Sprint 591 — Coach Player Observation Draft Review V1

- [ ] `CoachObservationDraftReviewPanel` component exists
- [ ] Accepts observations array and onSubmit callback
- [ ] Collapsed by default with count badge
- [ ] Each observation shows: player name, level, type, observation text, priority badge, visibility label
- [ ] Eye/EyeOff icons for parent-safe / not parent-safe status
- [ ] "Readiness flag" badge for readiness_flag observations
- [ ] Approve / Exclude buttons per observation
- [ ] Approved count shown in header badge
- [ ] Submit button disabled until at least one observation approved
- [ ] Submitted state shows count and "director reviews before anything reaches players or parents"
- [ ] Nothing published to players or parents from this component

---

## Sprint 592 — Coach Curriculum Feedback Loop V1

- [ ] `CoachCurriculumFeedbackCard` component exists
- [ ] Shows after curriculum draft is submitted from `CoachCurriculumDraftCapture`
- [ ] Content type classification visible
- [ ] Target stage visible
- [ ] Idea summary text truncated to 3 lines
- [ ] "Director review queue" pipeline status visible
- [ ] "Nothing official changed" status visible
- [ ] "If approved, director will add it" copy visible
- [ ] Dismiss button clears the card from home screen

---

## Mobile responsiveness

- [ ] All capture sheets fill the full viewport on mobile (fixed inset-0)
- [ ] Capture type grid is 2 columns on mobile
- [ ] No horizontal overflow on any capture screen
- [ ] Score picker wraps cleanly on small screens
- [ ] Input fields do not cause horizontal scroll

---

## Security / data safety

- [ ] No parent/player data exposed in any Phase 4 component
- [ ] No official attendance writes from `CoachAttendanceExceptionDraftCard`
- [ ] Unrostered arrival = director review draft only — no roster change
- [ ] No official curriculum writes from `CoachCurriculumDraftCapture`
- [ ] No official assessment writes from `CoachAssessmentDraftCapture`
- [ ] No official player observation writes from `CoachObservationDraftReviewPanel`
- [ ] DONNA classification is pattern matching only — no external AI API calls
- [ ] Readiness flags use observable, non-medical language ("low energy", "worth monitoring")
- [ ] Parent follow-up ideas go to director review — no direct parent communication
- [ ] All drafts remain local state unless explicitly submitted via wrap-up flow

---

## DONNA mutation safety

- [ ] No direct DB mutation in any Phase 4 client component
- [ ] All DONNA output is labelled "draft" or "pending director review"
- [ ] "Nothing official changed" copy present in every submission confirmation
- [ ] Coach observations go through `proposed_actions` pipeline (existing safe path)
- [ ] Curriculum ideas classified locally before director review

---

## Known limitations (expected — not regressions)

- `CoachSessionFocusCard` shows empty state until session template has curriculum content linked
- Assessment draft is local state only — not persisted to DB yet (Phase 4 scope)
- Attendance exceptions from `CoachAttendanceExceptionDraftCard` are local — not connected to wrap-up drawer yet
- Observation draft review component requires parent to pass observations array — not wired to session recap page yet
- Voice input on recap page shows "coming soon" placeholder (existing behaviour)
- Curriculum feedback card only appears when using `CoachCurriculumDraftCapture` — not from other flows

---

## Migration readiness (for future phase)

- [ ] `CoachAssessmentDraftCapture` output compatible with `AssessmentEventDraft` from `src/lib/assessments/index.ts`
- [ ] `CoachObservationDraftReviewPanel` output compatible with `saveWrapUpObservationsAction` input
- [ ] `CoachAttendanceExceptionDraftCard` output compatible with `saveWrapUpAttendanceExceptionAction` input
- [ ] Curriculum draft output compatible with `proposed_actions` pipeline
