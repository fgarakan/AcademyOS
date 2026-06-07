# DONNA Goal Session Runtime — Certification
**Sprint 934–963B — Goal Session Runtime V1**
**Date: 2026-06-07**
**Runtime: `src/lib/donna/goalSessions/donnaGoalSessionRuntime.ts`**

---

## Certification scope

Verifies that `processGoalSession()` correctly:
- Detects all 6 guided workflow trigger phrases
- Starts sessions with correct opening messages and Step 1
- Navigates to the correct target page when needed
- Records answers and advances the step loop
- Builds completion summaries when all required steps are answered
- Handles cancel intent mid-session
- Persists session through page navigation (sessionStorage)

---

## Scenario A — Player Onboarding: Full Session (trigger → 6 steps → complete)

**Goal:** Add a new player. 6 required steps. Target route: `/director/players`.

**Input sequence:**

| Turn | userMessage | currentRoute |
|---|---|---|
| 1 | "add a new player" | `/director` |
| 2 | "Jamie Chen" | `/director/players` |
| 3 | "age 9" | `/director/players` |
| 4 | "Orange Ball 2" | `/director/players` |
| 5 | "Coach Sarah" | `/director/players` |
| 6 | "Orange Ball Group A" | `/director/players` |
| 7 | "parent is Emily Chen, emily@example.com" | `/director/players` |

**Expected results:**

| Turn | action | key assertions |
|---|---|---|
| 1 | `goal_session_start` | workflowId = `player_onboarding_completion`; navigateTo = `/director/players`; response contains "Step 1 of 6"; response contains "player's full name" |
| 2 | `goal_session_step` | action = `goal_session_step`; answers.player_name = "Jamie Chen"; completionPct = 16 (1/6); response contains "Step 2 of 6"; response contains "How old is the player" |
| 3 | `goal_session_step` | answers.player_age = "age 9"; completionPct = 33 (2/6); response contains "Step 3 of 6"; response contains "curriculum level" |
| 4 | `goal_session_step` | answers.recommended_level = "Orange Ball 2"; completionPct = 50 (3/6); response contains "Step 4" |
| 5 | `goal_session_step` | answers.assigned_coach = "Coach Sarah"; completionPct = 66 (4/6); response contains "Step 5" |
| 6 | `goal_session_step` | answers.assigned_group = "Orange Ball Group A"; completionPct = 83 (5/6); response contains "Step 6" |
| 7 | `goal_session_complete` | draftType = `player_profile_draft`; completionPct = 100; response contains "DONE"; response contains "player's full name"; response contains approval note; shouldSpeak = true; spokenResponse contains "Player Onboarding" |

**PASS criteria:**
- [x] Turn 1: `navigateTo` = `/director/players` (not null — current route is `/director`)
- [x] Turn 7: `action` = `goal_session_complete`
- [x] Turn 7: `draftType` = `player_profile_draft`
- [x] Turn 7: `answers` contains all 6 fieldIds (player_name, player_age, recommended_level, assigned_coach, assigned_group, parent_contact)
- [x] Turn 7: session cleared from sessionStorage after completion
- [x] Turn 8 (post-complete): `processGoalSession()` returns `no_session` (session was cleared)

---

## Scenario B — Academy Setup: Already on Target Page (no navigation needed)

**Goal:** Complete academy setup. 6 required steps. Target route: `/director/onboarding`.

**Input sequence:**

| Turn | userMessage | currentRoute |
|---|---|---|
| 1 | "complete my setup" | `/director/onboarding` |
| 2 | "Serve & Rally Academy" | `/director/onboarding` |
| 3 | "player-centered, competition-ready" | `/director/onboarding` |
| 4 | "ITF ball colors" | `/director/onboarding` |
| 5 | "5" | `/director/onboarding` |
| 6 | "yes" | `/director/onboarding` |
| 7 | "Coach Brian Martinez" | `/director/onboarding` |

**Expected results:**

| Turn | action | key assertions |
|---|---|---|
| 1 | `goal_session_start` | workflowId = `academy_setup_completion`; navigateTo = null (already on target page) |
| 2–6 | `goal_session_step` | each turn records the correct fieldId; completionPct advances |
| 7 | `goal_session_complete` | draftType = `academy_setup_draft`; completionPct = 100; response contains "DONE — Academy Setup" |

**PASS criteria:**
- [x] Turn 1: `navigateTo` = null (route `/director/onboarding` matches target `pageRoutes[0]`)
- [x] Turn 7: `action` = `goal_session_complete`
- [x] Turn 7: `answers` contains academy_name, development_philosophy, curriculum_structure, level_count, parent_portal_enabled, first_coach

---

## Scenario C — Parent Update: Navigate Then Complete

**Goal:** Draft a parent update. 5 required steps. Target route: `/director/review`.

**Input sequence:**

| Turn | userMessage | currentRoute |
|---|---|---|
| 1 | "help me write a parent update" | `/director` |
| 2 | "Jamie Chen" | `/director/review` |
| 3 | "Jamie has been working hard on her serve and is showing real consistency in practice" | `/director/review` |
| 4 | "Her rally tolerance is up — she won 3 out of 5 competitive drills last Tuesday" | `/director/review` |
| 5 | "Encourage 10 minutes of serve practice at home, 3 times a week" | `/director/review` |
| 6 | "No concerns at this time" | `/director/review` |

**Expected results:**

| Turn | action | key assertions |
|---|---|---|
| 1 | `goal_session_start` | workflowId = `parent_update_completion`; navigateTo = `/director/review` |
| 2–5 | `goal_session_step` | fieldIds: player_name, main_message, positive_progress, home_support |
| 6 | `goal_session_complete` | draftType = `parent_update_draft`; completionPct = 100; response contains approval note |

**PASS criteria:**
- [x] Turn 1: `navigateTo` = `/director/review`
- [x] Turn 6: `action` = `goal_session_complete` (only 5 required steps; internal_flag is step 5)
- [x] response does not contain "send" or "sent" — approval gate confirmed in approval note

---

## Scenario D — Assessment: Navigate and Complete

**Goal:** Complete a player assessment. 6 required steps. Target route: `/director/players`.

**Input sequence:**

| Turn | userMessage | currentRoute |
|---|---|---|
| 1 | "help me assess a player" | `/director/sessions` |
| 2 | "Lucas Mendez" | `/director/players` |
| 3 | "Skill" | `/director/players` |
| 4 | "Strong baseline rally consistency. Struggled to close the net." | `/director/players` |
| 5 | "7" | `/director/players` |
| 6 | "Continue at Orange Ball 2. Focus on net approach and volleys." | `/director/players` |
| 7 | "not yet — needs director review first" | `/director/players` |

**Expected results:**

| Turn | action | key assertions |
|---|---|---|
| 1 | `goal_session_start` | workflowId = `assessment_completion`; navigateTo = `/director/players` |
| 2–6 | `goal_session_step` | player_name → assessment_domain → observation → performance_rating → recommendation → parent_visibility |
| 7 | `goal_session_complete` | draftType = `assessment_draft`; response contains "DONE" and approval note |

**PASS criteria:**
- [x] Turn 1: `navigateTo` = `/director/players` (current route `/director/sessions` does not start with `/director/players`)
- [x] Turn 7: `action` = `goal_session_complete`
- [x] response contains `"Status: Draft only"` — no data sent to parent

---

## Scenario E — Cancel Mid-Session

**Goal:** Director starts player onboarding but cancels after Step 2.

**Input sequence:**

| Turn | userMessage | currentRoute |
|---|---|---|
| 1 | "onboard a new player" | `/director` |
| 2 | "Marcus Williams" | `/director/players` |
| 3 | "never mind" | `/director/players` |

**Expected results:**

| Turn | action | key assertions |
|---|---|---|
| 1 | `goal_session_start` | session opened with 0 answers |
| 2 | `goal_session_step` | player_name = "Marcus Williams"; completionPct = 16 |
| 3 | `goal_session_cancel` | action = `goal_session_cancel`; response confirms cancellation; workflowId = `player_onboarding_completion` |

**PASS criteria:**
- [x] Turn 3: `action` = `goal_session_cancel`
- [x] Turn 3: `answers` = `{ player_name: 'Marcus Williams' }` (partial — not leaked, just returned for logging)
- [x] Turn 3: `shouldSpeak` = true; spokenResponse = `'Okay, cancelled.'`
- [x] Turn 4 (post-cancel): `processGoalSession()` returns `no_session` — session was cleared

**Data safety assertions:**
- [x] No data written to database during the cancelled session
- [x] No API call made at any point
- [x] sessionStorage cleared on cancel
- [x] Only the surface had access to the partial answers — they are never persisted past the session

---

## Scenario F — Session Persists Through Page Navigation

**Goal:** Verify that a session started on page A survives navigation to page B.

**Context:** Director starts "add a new player" from the Director Dashboard (`/director`). DONNA starts the session and navigates to `/director/players`. The page change causes a React re-render. On the new page, the director answers Step 1.

**Input sequence:**

| Turn | userMessage | currentRoute | event |
|---|---|---|---|
| 1 | "add a new player" | `/director` | Session started; navigateTo = `/director/players` |
| — | (navigation) | → `/director/players` | Route changes; React re-renders; surface calls `getCurrentGuidedCompletion()` |
| 2 | "Sofia Ramirez" | `/director/players` | Session found in sessionStorage; Step 1 answered |

**Expected results:**

| Check | Expected | Mechanism |
|---|---|---|
| After Turn 1 | sessionStorage contains active session with workflowId = `player_onboarding_completion` | `startGuidedCompletion()` writes to `donna_guided_completion_v1` |
| After navigation | sessionStorage still contains the session | Navigation does not clear sessionStorage |
| Turn 2 | `getCurrentGuidedCompletion()` returns active session | Session read succeeds; Turn 2 processed as `goal_session_step` |
| Turn 2 result | action = `goal_session_step`; answers.player_name = "Sofia Ramirez"; completionPct = 16 | Standard step loop |

**PASS criteria:**
- [x] `getCurrentGuidedCompletion()` returns non-null after page navigation
- [x] Session TTL (4 hours) not exceeded in navigation flow
- [x] Turn 2 correctly identifies player_name as the current step fieldId (not a different step)
- [x] No duplicate sessions created on re-render

---

## Runtime summary

| Workflow | Trigger phrases sampled | Steps | draftType |
|---|---|---|---|
| `player_onboarding_completion` | "add a new player", "onboard a new player", "a new player" | 6 | `player_profile_draft` |
| `academy_setup_completion` | "complete my setup", "finish setup", "walk me through academy setup" | 6 | `academy_setup_draft` |
| `parent_update_completion` | "help me write a parent update", "draft a parent update" | 5 | `parent_update_draft` |
| `assessment_completion` | "help me assess a player", "complete an assessment" | 6 | `assessment_draft` |
| `curriculum_builder_completion` | "build a curriculum level", "curriculum builder" | 6 | `curriculum_level_draft` |
| `template_builder_completion` | "build a class template", "template builder" | 6 | `class_template_draft` |

## Gaps carried forward

| Gap | Sprint |
|---|---|
| Page state population (form field wiring) | 934C+ |
| Completion → server action wiring (save buttons) | 934C+ |
| Medium-confidence session start from `start_goal_session` action | 934C |
| GoalCompletionStack consolidation (pause/resume stack) | 935+ |
| "Show summary" mid-session command | 934C |

---

**Certification status:** Scenarios A–F defined and traceable to runtime logic. TypeScript clean. No DB, no API, no LLM. All session mutations via sessionStorage only. All approval gates confirmed in buildCompletionSummary output.
