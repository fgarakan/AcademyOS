# Internal Development Loop QA + Demo Readiness

**Status:** Sprint 50 — QA and demo documentation.
**Last updated:** 2026-05-01

---

## What was built in Sprints 43–50

| Sprint | Feature | Files |
|---|---|---|
| 43 | Voice Attendance Exception Drafts V1 | `attendanceExceptionDraftAction.ts`, `AttendanceExceptionDraftPanel.tsx` |
| 44 | Attendance Exception Director Review Queue V1 | `AttendanceExceptionDraftCard.tsx`, `AttendanceExceptionDraftDecisionControls.tsx`, `review/page.tsx` |
| 45 | Attendance Exception Decision Controls V1 | `actions.ts` (updateAttendanceExceptionDraftDecisionAction, applyApprovedAttendanceExceptionAction), `ApplyApprovedAttendanceExceptionControls.tsx` |
| 46 | Fitness Template Block Exercise Population V1 | `populateFitnessBlocksAction.ts`, `PopulateFitnessBlocksButton.tsx` |
| 47 | Fitness Gap Logic Plan + Utilities | `src/lib/fitness/gapLogic.ts`, `docs/FITNESS_GAP_LOGIC_PLAN.md` |
| 48 | At-Home Fitness Recommendation Drafts V1 | `fitnessHomeworkRecommendationAction.ts`, `FitnessHomeworkRecommendationButton.tsx` |
| 49 | Parent/Player-Safe Fitness Homework Draft V1 | `parentPlayerFitnessHomeworkDraftAction.ts` |
| 50 | QA + Demo Readiness | This document, `docs/FITNESS_EXPOSURE_TRACKING_PLAN.md` |

---

## Demo Script for Brian

### Flow: Session Planning → Attendance Exception → Fitness Recommendation

---

#### Step 1 — Director views a fitness template

1. Navigate to `/director/fitness/templates`
2. Open any fitness template (e.g. "Junior Fitness Block — Red Ball")
3. Click **"Populate Blocks with Exercises"**
   - The system matches exercises from the exercise library to each block by category
   - Duration budget is respected — blocks aren't overfilled
   - Already-populated blocks are skipped
   - Refresh shows new exercises in the block list

---

#### Step 2 — Coach records an attendance exception

1. Navigate to `/director/sessions/[sessionId]` for a recent session
2. Scroll to **"ATTENDANCE EXCEPTIONS"** section
3. Enter a natural-language recap:
   > "Everyone was here except Sarah. Also, this new kid Jeremy showed up."
4. Click **"Create Attendance Exception Draft"**
   - System parses: Sarah = absent, roster baseline = everyone else present, Jeremy = unrostered
   - A `proposed_actions` draft is created with `draft_type = attendance_exception_v1`
   - No attendance is recorded yet — pending director review

---

#### Step 3 — Director reviews the attendance exception

1. Navigate to `/director/review`
2. Scroll to **"Attendance Exception Drafts"** section
3. See the draft:
   - Raw input shown
   - Rostered attendance proposed (present / absent)
   - Unrostered attendees flagged with warning (Jeremy)
4. Add a review note if needed
5. Click **"Approve for Application"**
   - Status changes to `approved`
   - Apply controls appear

6. Click **"Apply Rostered Attendance"**
   - `session_attendance` rows are upserted for rostered players only
   - Jeremy is NOT added — unrostered attendees require separate director action
   - Audit log written
   - Draft marked as `executed`

---

#### Step 4 — Coach observations become evidence

1. Return to the player profile (Sarah or another player)
2. Navigate to **Notes** tab
3. Add a coach observation mentioning fitness areas (e.g. "Sarah showed great agility but struggled with sprint mechanics")
4. The observation automatically becomes available as evidence for:
   - Priority recommendations (existing Sprint 35–37 flow)
   - Evidence requirement links (Sprint 36 flow)
   - Fitness gap computation (Sprint 47–48 inputs)

---

#### Step 5 — Player requirement progress visible

1. On the player profile **Notes** tab, scroll to **Requirement Progress** section
2. Director can see requirement statuses
3. Evidence link drafts can be created from observations
4. Progression requirements visible (level score thresholds, weeks at level, etc.)

---

#### Step 6 — Fitness gap and recommendation draft generated

1. Navigate to the player profile
2. Click the **Fitness** tab
3. Click **"Generate Fitness Homework Recommendation Draft"**
   - System reads: attendance (absent sessions), assessments (dimension scores), coach notes (tags)
   - Runs `computeFitnessGaps()` — pure deterministic function, no AI
   - Creates a `fitness_homework_recommendation_v1` proposed_actions draft
   - Status: pending_review
   - Not visible to player or parent

4. Navigate to `/director/review` (future Sprint) to review and approve the fitness recommendation

---

#### Step 7 — Parent/Player safe version (Sprint 49)

Once the internal recommendation is approved, a director can convert it to parent/player-safe language via `createParentPlayerFitnessHomeworkDraftAction`. This creates a `parent_player_fitness_homework_summary_v1` draft with:
- Simple, encouraging language
- No medical terminology
- Clear weekly dosage
- Safety notes
- Status: pending_review (never auto-published)

---

## QA Checklist

### Attendance exception flow

- [ ] Can enter text recap in session detail page
- [ ] "Everyone except X" → X marked absent, everyone else present
- [ ] Unknown name "Jeremy" → appears in unrostered_attendees
- [ ] Draft appears in review queue with correct status badge
- [ ] Director can approve/reject/clarification_needed
- [ ] Apply button available after approval
- [ ] After applying: session_attendance rows exist for rostered players
- [ ] After applying: Jeremy NOT added to any table
- [ ] Audit log written after application
- [ ] Draft marked executed after application
- [ ] Review queue refreshes after decision

### Fitness template population

- [ ] "Populate Blocks" button visible on template detail page
- [ ] Clicking populates blocks with exercises from exercise library
- [ ] Exercises match block category (fitness → fitness exercises, etc.)
- [ ] Duration budget respected (no overfilling)
- [ ] Already-populated blocks skipped (no duplicates)
- [ ] Success message shows count of exercises added per block
- [ ] Page refreshes after population

### Fitness gap computation

- [ ] `computeFitnessGaps()` in `src/lib/fitness/gapLogic.ts` compiles cleanly
- [ ] Returns gap scores for all 8 categories
- [ ] Top gaps capped at 3 categories
- [ ] Overtraining signal → recommended_intensity = 'recovery_only'
- [ ] Injury constraint → recommended_intensity = 'reduced'
- [ ] Player under 12 → safety flag added

### Fitness homework recommendation draft

- [ ] Button visible on player profile Fitness tab
- [ ] Clicking creates proposed_actions draft
- [ ] Draft is internal only (target_module = 'fitness_homework_recommendation')
- [ ] Draft payload contains gap assessment, exercises, safety notes, dosage
- [ ] No player/parent visibility until explicit approval + publication

### TypeScript

- [ ] `npx tsc --noEmit` passes with 0 errors

---

## Known limitations at Sprint 50

### What is NOT built yet

1. **Fitness recommendation review queue** — The `fitness_homework_recommendation` drafts are in proposed_actions but the review page doesn't yet show them. This is the next sprint.

2. **Parent/player fitness homework publication** — The `parent_player_fitness_homework_summary_v1` draft exists but there is no publication pathway to player/parent portals yet. Sprint 51+ scope.

3. **Fitness exposure aggregation table** — See `docs/FITNESS_EXPOSURE_TRACKING_PLAN.md`. No migration created — data is computable from existing tables but not pre-aggregated.

4. **Unrostered attendee decision flow** — Jeremy can be flagged with decision labels (needs_follow_up, trial_player_candidate, etc.) but no UI for this exists yet. The draft payload contains the unrostered_attendees data for future use.

5. **Coach workspace sessions attendance recording** — The coach `/coach/sessions/[sessionId]` page has no attendance recording UI yet. The attendance exception flow works from the director session page only.

---

## Architecture constraints honored

All Sprints 43–50 respect the project red lines:

| Red line | Status |
|---|---|
| Voice never directly mutates core data | ✓ All writes go through proposed_actions pipeline |
| template_blocks and session_blocks are always separate | ✓ Never merged |
| Every new write goes to audit_logs | ✓ Attendance application + fitness draft creation both audited |
| finalize_player_placement() is the only activation path | ✓ Not touched |
| execute_approved_action() is the only voice execution path | ✓ Not bypassed |
| No parent/player live visibility added | ✓ All drafts internal only |
| No AI API calls | ✓ All logic is deterministic rule-based |
| No RLS bypass | ✓ All queries are RLS-scoped |
