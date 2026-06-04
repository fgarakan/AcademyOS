# AcademyOS Atomic Loop Certification V1

**Date:** 2026-06-04
**Sprint:** Mega Sprint 1771–1790

---

## Purpose

This document certifies the six core atomic loops of AcademyOS for testability, completeness, and loop integrity. It does not assess style or design polish — only whether a director can complete the loop end-to-end and understand what happened.

**Audit method:** Codebase trace of all routes, server actions, and components involved in each loop. No live DB access.

---

## Loop 1: Add Player → Onboarding → Assessment → Placement

### Current Path

1. `/director/players` → "Add Player" button → `/director/players/new`
2. `NewPlayerForm` — captures first_name, last_name, DOB, gender (optional), notes → `createPlayerAction` → inserts into `players` table → redirects to `/director/players/[id]/onboard`
3. `/director/players/[id]/onboard` → `OnboardingStepperClient` — 6-step flow:
   - Step 1: Parent Capture (guardian form)
   - Step 2: Assessment (domain scores — technical, tactical, movement, competition, behavioral)
   - Step 3: Director Review (text review of assessment data)
   - Step 4: DONNA Recommendation (placement suggestion — deterministic)
   - Step 5: Activate Player (`finalize_player_placement()` RPC)
4. Post-activation: page resets to "saved" phase; no redirect or explicit next steps

Placement page: `/director/placement` — shows players in `pending_placement`, `placement_in_progress`, and `pending_approval` states with existing recommendation status.

### Expected Path

1. Add player form → player created → auto-redirect to onboarding ✓
2. Onboarding stepper → parent → assessment → placement recommendation → activate ✓
3. After activation: director sees a clear "player is now active — here's what to do next" confirmation
4. Next steps prompt links to: assign curriculum level, assign to group, schedule first session

### What Works

- NewPlayerForm creates a player and redirects to onboarding ✓
- OnboardingStepperClient renders all 6 steps ✓
- Assessment step saves domain scores ✓
- DONNA recommendation is deterministic and displays group + level suggestion ✓
- `finalize_player_placement()` is the sole activation path (red line respected) ✓
- Placement page shows pending players with recommendation status ✓

### What Breaks or Is Confusing

- **No post-activation confirmation**: After `finalize_player_placement()` succeeds, the stepper resets to a "saved" phase with no success message, no next steps, and no redirect. Director doesn't know if the activation worked.
- **No "Assign to group" button after activation**: Placement shows groups but provides no UI to assign the newly activated player to a group.
- **Onboarding stepper doesn't validate step completion**: StepActivatePlayer allows activation even if prior steps have incomplete or no data.
- **No link from placement page to onboarding**: `/director/placement` lists players but the "Continue onboarding" action is not obvious.
- **Parent capture step has no confirmation**: Parent guardian contact entry is saved but no confirmation is shown that the guardian record was created.

### Required Fixes

| Priority | Fix | Effort |
|---|---|---|
| High | Add success state + "What's next" panel after `finalize_player_placement()` succeeds in `OnboardingStepperClient` | Small |
| Medium | Add validation guard: StepActivatePlayer should be disabled if assessment step is empty | Small |
| Low | Add "Continue onboarding" deep link from placement page | Small |

### Acceptance Test

1. Director creates a new player via `/director/players/new`.
2. Director completes all 6 onboarding steps.
3. Director clicks Activate Player.
4. Director sees a confirmation state with at least: player name, "Player is now active", and a link to the player profile.
5. Player status is `active` in the database.

---

## Loop 2: Assessment → Evidence → Readiness → Player Profile

### Current Path

1. `/director/players/[id]` → Assessments tab → `AssessmentsTab` — director enters domain scores or runs a quick assessment
2. `QuickAssessmentPanel` → `quickAssessmentAction` → inserts into `assessments` table
3. `/director/players/[id]` → Skill Path tab → `PlayerLevelRequirementsCard` → `GateEvidenceButton` per gate → `recordGateEvidenceAction` → updates `player_gate_status`
4. Readiness surfaces on: `ReadinessEvidencePanel` (Overview tab), `PlayerLevelReadinessDraftView` (Notes tab), `PlayerCurriculumGateEvidencePanel` (Notes tab)
5. Player profile shows gate status, evidence count, and advancement eligibility across tabs

### Expected Path

1. Director records a domain assessment score ✓
2. Director records gate evidence per gate ✓
3. Readiness panel shows % gates met and advancement eligibility ✓
4. Player profile reflects updated state on same page ✓
5. Director can see which gate is blocking advancement and why

### What Works

- QuickAssessmentPanel saves domain scores correctly ✓
- GateEvidenceButton records evidence to `player_gate_status` ✓
- ReadinessEvidencePanel displays gate completion % ✓
- PlayerLevelReadinessDraftView generates a DONNA readiness narrative ✓
- AssessmentHistoryCard shows all assessments by type ✓
- Gate History Timeline shows per-gate audit trail ✓

### What Breaks or Is Confusing

- **Assessment does not trigger readiness re-evaluation**: Director submits an assessment but the Evaluate Advancement button must be clicked separately. No prompt after assessment to "re-evaluate now."
- **Gate evidence button context unclear**: On the Skill Path tab, `GateEvidenceButton` appears per gate row. After submitting, the gate status updates but there is no visible confirmation that evidence was counted. Director must scroll to gate status column to verify.
- **No evidence-to-requirement linking in Assessments tab**: `EvidenceRequirementDraftButton` exists on the Skill Path tab but is absent from the Assessments tab. Director cannot link an assessment score to a specific requirement without leaving the Assessments tab.
- **ConfirmGateButton state is silent**: Director can confirm a gate, but the button doesn't transition to a "confirmed" visual state on the same render cycle.
- **ReadinessEvidencePanel doesn't list which specific gates are unmet**: Shows "X of Y requirements met" but doesn't enumerate which ones remain open without scrolling to `PlayerLevelRequirementsCard`.

### Required Fixes

| Priority | Fix | Effort |
|---|---|---|
| High | After `quickAssessmentAction` success, show inline prompt: "Run Evaluate Advancement to refresh eligibility." | Tiny |
| Medium | After `recordGateEvidenceAction` success, show updated gate status (evidence count) inline without requiring scroll | Small |
| Low | List unmet gates by name in `ReadinessEvidencePanel` (already have the data) | Small |

### Acceptance Test

1. Director navigates to Assessments tab and records a quick assessment with all 5 domain scores.
2. Director navigates to Skill Path tab, finds an open gate, and clicks GateEvidenceButton.
3. Director enters evidence text and submits. Evidence count on that gate increments visibly.
4. Director clicks "Evaluate Advancement." Advancement eligibility updates.
5. ReadinessEvidencePanel on Overview tab reflects the updated gate completion count.

---

## Loop 3: Coach Recap → Structured Note → Player Update → Director Review

### Current Path

1. `/coach/sessions/[id]` → Coach Wrap-Up Drawer → 7-question guided flow → saves to `proposed_actions` (`session_actual_v1`, `coach_observation_draft_v1`, `attendance_exception_v1`) + `voice_notes`
2. `/director/review` → "For Your Review" tab → `WrapUpDraftCard` — shows session, coach, attendance, block summary → Approve / Reject / Clarification Needed buttons
3. Director approves → `ApplyWrapUpDraftControls` → director clicks "Apply Wrap-Up Draft" → `applyWrapUpDraftAction` → writes `sessions.session_notes`, advances `sessions.status = 'completed'`, writes audit log, marks proposed_action = executed
4. Separately: player observations from wrap-up appear in review queue → approve → linked to player profile via `coach_observations`

### Expected Path

1. Coach completes wrap-up → draft appears in director review queue ✓
2. Director approves → apply becomes available ✓
3. Apply executes → session marked complete, player observations added ✓
4. Director can see the effect on the player profile ✓

### What Works

- Coach Wrap-Up Drawer captures all 7 questions with audio input option ✓
- Attendance per-player confirmation with unexpected attendee support ✓
- Draft creation in `proposed_actions` with structured payload ✓
- Director review queue shows pending wrap-ups with approve/reject controls ✓
- Apply action writes session notes + updates status + writes audit log ✓
- Player observations create `coach_observations` rows linked to player ✓
- Quick Note (CoachRecapCommandPanel) creates a separate `voice_notes` entry ✓

### What Breaks or Is Confusing

- **No "wrap-up received" indicator in coach portal**: After submitting wrap-up, coach has no confirmation in their portal that the director received it. No session status change visible to coach.
- **Apply and Approve are two separate steps**: Directors frequently miss the "Apply" step after approving. The UI doesn't make it clear that approval alone doesn't execute the changes.
- **No structured note → player profile confirmation**: When an observation is applied from the review queue, the player profile silently updates. Director doesn't see a toast or banner confirming which player's profile changed.
- **Block completion data has no downstream use**: Block statuses (completed/skipped/modified) are recorded but never surface in curriculum or future session planning.
- **Attendance exceptions don't alert director**: Unexpected attendees create `placement_review` items, but no banner or badge in the review queue directs director to the Placement tab.
- **Two recap UIs on session page are labeled inconsistently**: "Quick Note" vs. "Coach Wrap-Up" coexist without a clear statement of when to use each.

### Required Fixes

| Priority | Fix | Effort |
|---|---|---|
| High | Add explicit visual distinction between "Approved" and "Applied" states in WrapUpDraftCard: approved card should show "Now click Apply to execute" | Small |
| Medium | Show a toast or inline notice on player profile after an observation is applied via review queue | Medium |
| Low | Add a badge or note in review queue when a wrap-up contains unexpected attendees | Tiny |

### Acceptance Test

1. Coach completes wrap-up for a session. Wrap-up appears in director review queue.
2. Director opens review queue, finds the pending wrap-up, reads the summary.
3. Director approves. Card transitions to "Approved — ready to apply" state.
4. Director clicks "Apply Wrap-Up Draft." Session is marked complete. Audit log entry created.
5. Player observations from the wrap-up appear in the player's Notes tab.

---

## Loop 4: DONNA Attention → Guided Workflow → Decision

### Current Path

1. `/director/review` → `DonnaReviewTabGuide` → "Start guided review" button per workflow type (placement, assessment, curriculum_review) → `setActiveWorkflow()` in sessionStorage
2. `DonnaActiveWorkflowBanner` mounts on player profile + review page — reads sessionStorage → shows `DonnaDecisionGuidePanel` when workflow type matches current route
3. `DonnaDecisionGuidePanel` shows: workflow title, step X of Y, step description, action button linking to step-specific route, prev/next navigation, safety note ("DONNA will not…")
4. Director follows steps: navigate to route → take action → advance to next step via prev/next buttons
5. No completion tracking — director can dismiss banner; no "workflow complete" state exists

Alternate entry: Director types or speaks in DONNA shell on any director page → DONNA can suggest a workflow → director clicks "Start guided review" from DONNA response

### Expected Path

1. Director opens review queue, DONNA/Donna tab guide prompts "Start guided review for Player X" ✓
2. Director starts workflow → banner shows on relevant pages ✓
3. Director follows steps with clear action buttons ✓
4. Director takes decision → workflow marks that step as done ✓
5. Director sees "Workflow complete" or "X of Y steps done" ✓

### What Works

- DonnaDecisionGuidePanel renders step content, action button, prev/next navigation ✓
- DonnaActiveWorkflowBanner mounts on player profile and review page ✓
- 5 workflow types: promotion, placement, assessment, parent_update, curriculum_review ✓
- Workflow is dismissible per session ✓
- DONNA can classify intent and suggest workflows via `DonnaVoiceReadyShell` ✓
- "DONNA will not…" safety note is present on every step ✓

### What Breaks or Is Confusing

- **No auto-trigger**: Director must manually start a workflow. There is no proactive "you should review player X" push. The workflow is passive unless the director explicitly asks.
- **Step progress doesn't persist across navigation**: If director clicks the step action button and navigates to the linked route, returning to the workflow resets to step 1 (sessionStorage doesn't track `currentStep` across navigations).
- **No workflow completion state**: Workflows have no "done" state. Director can dismiss but receives no "you completed the placement review workflow" confirmation.
- **Workflow steps are informational, not action-capturing**: The panel guides director to a page but doesn't record that the action was taken. Step completion is entirely manual (director uses prev/next).
- **DONNA approval note is generic**: "DONNA will not change levels without approval" — director doesn't know what DONNA actually did after approving a proposed action. No audit trail visible in the panel.
- **Workflow entry point is not obvious**: "Start guided review" button is in `DonnaReviewTabGuide` on the review page — not prominent. Director may never find it.

### Required Fixes

| Priority | Fix | Effort |
|---|---|---|
| High | Persist `currentStep` in sessionStorage on every step change so navigation doesn't reset progress | Small |
| Medium | Add completion state to workflow: when director reaches last step, show "Workflow complete — [action taken]" card instead of repeating the steps | Small |
| Low | Add a "guided workflows available" badge to the review queue tab header when pending items exist | Tiny |

### Acceptance Test

1. Director opens review queue. At least one pending review item exists.
2. Director clicks "Start guided review" for the placement workflow.
3. Workflow banner appears on the player profile page.
4. Director navigates through all steps via the action buttons. Step progress is preserved across route changes.
5. Director reaches the last step, takes the final action, and sees a completion confirmation.

---

## Loop 5: Curriculum Gap → Recommendation → Draft → Approval

### Current Path

1. `/director/players/[id]` → Skill Path tab → `GapGuidanceSummaryCard` + `PlayerGapSummaryPanel` — shows training/knowledge gaps with priority levels (act_now, monitor, informational)
2. Director manually navigates to Notes tab → `PriorityRecommendationDraftButton` → `createPriorityRecommendationDraftAction` → creates `proposed_action` with `target_module: 'priority_recommendation'`
3. `/director/review` → "Player Signals" tab → `PriorityRecommendationDraftCard` — shows recommendation title, description, evidence → Approve / Reject / Clarification Needed
4. Director approves → `ApplyPriorityRecommendationControls` → director clicks "Create Active Priority" → `applyApprovedPriorityRecommendationAction` → inserts into `player_priorities`
5. Active priority appears on player profile Notes tab → `PlayerActivePriorities`

### Expected Path

1. Gap visible on Skill Path tab with clear action prompt ✓ (partially — action prompt now added in Sprint 1771)
2. Director creates recommendation draft from gap context → draft in review queue ✓
3. Director approves draft → priority becomes active ✓
4. Active priority visible on player profile ✓

### What Works

- GapGuidanceSummaryCard shows gaps with priority levels, top action, and rationale ✓
- PlayerGapSummaryPanel shows per-gap confidence levels and sources ✓
- `createPriorityRecommendationDraftAction` builds a deterministic draft from observation tags ✓
- Review queue "Player Signals" tab shows pending drafts ✓
- Approve + Apply creates an active priority in `player_priorities` ✓
- Active priorities appear in `PlayerActivePriorities` on Notes tab ✓
- Overlap warning shown when draft overlaps an existing active priority ✓

### What Breaks or Is Confusing

- **Gap-to-action UX disconnect (partially fixed in Sprint 1771)**: Gap guidance was on the Skill Path tab; the recommendation draft button was on the Notes tab. Director had to navigate between tabs with no cross-link. Sprint 1771 adds a footer note to `GapGuidanceSummaryCard` directing to the Notes tab.
- **Gap detection doesn't auto-draft**: No "Draft recommendation from this gap" button adjacent to the gap item. Director must remember to go to Notes tab and click a separate button. The gap text and the draft are not linked.
- **No evidence-gap drill-down**: Gaps reference domains (e.g., "Serve") but don't link to which gate or curriculum requirement is missing. Director can't trace gap → specific requirement → evidence.
- **Applied priority doesn't auto-refresh on player profile**: After approval + apply, player profile requires a manual reload to show the new active priority.
- **No "gap resolved" tracking**: Once a priority is created and worked on, there is no mechanism to flag when the gap is resolved. Priorities accumulate without a close loop.
- **Recommendation is based on observations only**: If no coach observations exist, the draft action fails. Director sees "No coach observations found" error. There's no fallback to assessment data or gate status.

### Required Fixes

| Priority | Fix | Effort |
|---|---|---|
| High | Add "Create recommendation draft" button directly on `GapGuidanceSummaryCard` when `top_action` exists and `guidance.role === 'director'` | Medium |
| Medium | After apply, `revalidatePath` player profile so priorities appear without reload | Tiny (check if already done) |
| Low | Add fallback in `createPriorityRecommendationDraftAction`: use assessment scores when no observations exist | Medium |

### Acceptance Test

1. Player has at least one coach observation.
2. Director navigates to Skill Path tab. Gap guidance card shows at least one gap with a "top action."
3. Director sees the cross-link note to the Notes tab.
4. Director navigates to Notes tab, clicks "Create Priority Recommendation Draft." Draft is created.
5. Director opens review queue, finds the draft in "Player Signals," approves it.
6. Director clicks "Create Active Priority." Active priority appears on player profile Notes tab.

---

## Loop 6: Parent Update → Director Review → Approve → Parent-Safe Output

### Current Path (before Sprint 1771)

**Broken — no initiation point existed.**

The `ParentGuidancePreviewPanel` showed what a parent update *could* say, but there was no button to create one. The review queue `ParentSummaryReviewCard` could display a parent communication draft, and `applyParentCommunicationAction` would write to `parent_updates` — but the first step of the loop was missing.

### Current Path (after Sprint 1771 fix)

1. `/director/players/[id]` → Notes tab → `ParentGuidancePreviewPanel` (preview of parent-safe content) → **`InitiateParentUpdateButton`** → `initiateParentUpdateAction` → creates `proposed_action` with `target_module: 'parent_communication'`
2. `/director/review` → review queue → `ParentSummaryReviewCard` — shows draft content, warnings, parent-safe text → Approve / Reject / Clarification Needed
3. Director approves → `applyParentCommunicationAction` → creates `parent_updates` row, updates `player_development_summary.parent_summary`, marks proposed_action = executed, writes audit log
4. `/parent` portal → parent-safe summary shown via `show_to_parent = true` on `player_development_summary`

### Expected Path

1. Director reviews ParentGuidancePreviewPanel to see what content will be sent ✓
2. Director initiates a draft → proposed_action created → goes to review queue ✓ (Sprint 1771)
3. Director reviews and approves draft in review queue ✓
4. Director applies the draft → `parent_updates` row created, parent portal updated ✓
5. Parent logs into `/parent` portal and sees the update ✓ (depends on guardian-to-profile linkage)

### What Works (after Sprint 1771)

- `InitiateParentUpdateButton` creates a parent-safe draft in the review queue ✓
- Draft content uses curriculum level + coach language + development focus — no raw coach notes ✓
- `ParentSummaryReviewCard` renders the draft content for director review ✓
- Approve + Apply pipeline creates `parent_updates` + updates `player_development_summary` ✓
- `sanitizeParentFacingText` sanitizes all content before it reaches the draft ✓
- Audit log records `parent_communication_applied` event ✓

### What Breaks or Is Confusing

- **Parent portal doesn't show a "Messages from director" panel**: Even after `apply`, the parent portal (`/parent`) shows attendance + mission data but not the parent update content. Director cannot confirm from the UI that the update is visible to the parent.
- **No read receipt**: No mechanism to confirm the parent has seen the update.
- **"Not sent" label on preview is confusing**: The preview says "Director preview — not sent." But after the Sprint 1771 button is used, a draft IS queued. The label remains accurate (the preview itself never sends) but directors may confuse the preview with the initiated draft.
- **Draft text is template-based**: `initiateParentUpdateAction` builds draft from level name + coach language. If neither is available, it falls back to a generic message. No personalization beyond curriculum level.
- **Guardian-to-profile linkage required**: The parent update is only visible at `/parent` if the guardian record is linked to the auth user. Many pilots won't have this configured.

### Required Fixes

| Priority | Fix | Effort |
|---|---|---|
| High | Add "Latest parent update" section to `/parent` page showing approved+applied parent updates | Medium |
| Medium | After `applyParentCommunicationAction`, show director a confirmation with link to `/parent` preview | Small |
| Low | Add a "Guardian linked?" check before showing `InitiateParentUpdateButton` — warn if no guardian is linked | Tiny |

### Acceptance Test

1. Player has a curriculum level assigned and at least one coach language entry.
2. Director navigates to Notes tab on player profile. "Initiate Parent Update" card is visible.
3. Director clicks "Draft parent update." Success message shows "draft is in review queue."
4. Director navigates to review queue. Parent communication draft is visible with correct content.
5. Director approves the draft.
6. Director clicks "Apply." `parent_updates` row is created. `player_development_summary.show_to_parent = true`.
7. Parent logs in at `/parent` and sees the update (requires guardian-to-profile linkage).

---

## Summary: Highest-Impact Gaps Across All Loops

| Loop | Gap | Severity | Status |
|---|---|---|---|
| 1 | No post-activation confirmation or next steps | High | **Audit correction** — `StepActivatePlayer` already shows success state with next steps links |
| 2 | Assessment doesn't prompt re-evaluation | Medium | Open |
| 3 | Approve vs. Apply distinction is unclear | High | **Fixed in Sprint 1790** — "Step 2 of 2 required" callout added to top of approved `WrapUpDraftCard` |
| 4 | Workflow step progress resets on navigation | High | **Fixed in Sprint 1790** — `onStepChange` wired in `DonnaActiveWorkflowBanner` to call `updateWorkflowStep()` |
| 5 | Gap-to-recommendation requires tab change | High | Partially fixed in Sprint 1771 (cross-link note added) |
| 6 | No way to initiate a parent update draft | Critical | **Fixed in Sprint 1771** — `InitiateParentUpdateButton` added |
| 6 | Parent portal doesn't show approved update | High | **Audit correction** — `/parent/updates` page exists and shows `player_development_summary.parent_summary` where `show_to_parent = true`; parent home page links to it |

---

## Fixes Implemented in Sprint 1771

| File | Change |
|---|---|
| `src/app/director/players/[playerId]/initiateParentUpdateAction.ts` | New server action — creates `parent_communication` proposed_action from player profile. Follows full safety pipeline: voice_commands relay → proposed_actions pending_review → director review queue. No parent communication sent. |
| `src/app/director/players/[playerId]/InitiateParentUpdateButton.tsx` | New client button component — calls `initiateParentUpdateAction`. Success state shows review queue link. Error state shows inline message. |
| `src/app/director/players/[playerId]/page.tsx` | Wires `InitiateParentUpdateButton` into Notes tab adjacent to `ParentGuidancePreviewPanel`. |
| `src/components/player/GapGuidanceSummaryCard.tsx` | Adds cross-link footer note: "Go to Notes tab → Priority Recommendation to act on this gap." |

## Fixes Implemented in Sprint 1790

| File | Change |
|---|---|
| `src/app/director/review/WrapUpDraftCard.tsx` | Adds "Step 2 of 2 required — Apply to execute" callout at top of card body when `draft.status === 'approved'`. Callout names the "Apply Session Actual" button so directors know what to look for. Approval-alone-makes-no-changes is stated explicitly. (Loop 3 fix) |
| `src/components/donna/DonnaActiveWorkflowBanner.tsx` | Imports `updateWorkflowStep` and passes `onStepChange={(step) => updateWorkflowStep(step)}` to `DonnaDecisionGuidePanel`. Step progress now persists to sessionStorage on every prev/next tap and survives page navigation within the same session. (Loop 4 fix) |

## Audit Corrections (Sprint 1790)

These items were listed as gaps in the original audit but are already implemented:

| Loop | Correction |
|---|---|
| 1 | `StepActivatePlayer.tsx` (lines 29–73) already shows: "Player is now active" banner, assigned group, "DONNA development blueprint generating" notice, "View full player profile" + "View development plan" next-step links. No fix needed. |
| 6 | `/parent/updates/page.tsx` exists (Sprint 1082) and shows `player_development_summary.parent_summary` where `show_to_parent = true`. `applyParentCommunicationAction` sets this field on apply. Parent home page links to `/parent/updates` with "Coach Updates" CTA. Loop 6 end-to-end is testable. Guardian-to-profile linkage in DB is still required for the parent account to see their child's data (known limitation). |

---

## Remaining Open Items (not fixed in Sprint 1771–1790)

| Fix | Severity | Notes |
|---|---|---|
| Assessment → re-evaluate prompt | Medium | After `quickAssessmentAction` success, add inline note: "Run Evaluate Advancement to refresh eligibility." Tiny change to `QuickAssessmentPanel`. |
| Loop 5: direct "Draft recommendation" button on gap card | High | Gap guidance card on Skill Path tab shows a cross-link note (Sprint 1771) but still requires tab navigation. Requires making `GapGuidanceSummaryCard` a client component or passing a server action callback. |
| Loop 4: Workflow completion state | Medium | When director reaches last step of a workflow, show "Workflow complete" state instead of repeating steps. Currently "Complete" text appears but there's no visual distinction from an active workflow. |
| Loop 6: Parent update badge on home page | Low | When a new approved update exists, the "Coach Updates" CTA on `/parent` home doesn't show a badge or indicator. Update is only visible after tapping through to `/parent/updates`. |

---

## Known Hard Limitations (will not be fixed in V1)

- Voice commands (Loop 3, 4) use browser `SpeechRecognition` — Chrome/Edge only. No production STT.
- Parent portal updates (Loop 6) require guardian-to-profile linkage in DB — manual setup per player.
- `execute_approved_action()` covers 11 of 15 voice action types. Remaining 4 types have no execution path.
- Session block completion status is localStorage-only — not persisted to DB (known limitation from Sprint 48).
- Pending migrations must be applied to live DB before some UI features work (see `docs/KNOWN_LIMITATIONS.md`).
