# Changelog

---

## 2026-05-10 — Sprint 201: Level Gates + Promotion Rules V1

**Sprint 200 commit verified:** `454ca10 — Sprint 200 — Curriculum Starter Selection V1`

**Onboarding/settings/level-gate pattern audit:**
- Settings merge pattern confirmed identical to Sprints 197–200.
- `cn` utility used for radio card + checkbox card selected-state styling (same as Sprint 200).
- Step 4 in `onboarding/page.tsx` confirmed to have no `settingsKey`, `href`, or `ctaLabel` — all three added this sprint.
- No existing `level_gates` or `promotion` records in the codebase — safe to build preference storage only.
- Checkbox card pattern built fresh (Sprint 200 had radio-only); uses square border, `bg-lime` fill, inline SVG checkmark.

**`/director/onboarding/level-gates` page added:**
- Server component. Four auth guard layers: auth → `profiles.academy_id` → `academy_memberships.role === 'academy_director'` → rawDb academy fetch.
- Reads `settings.level_gates` sub-object; passes `approval_model`, `evidence_required` (array), `portal_visibility`, `notes` as `initial*` props.
- Renders: back link, page header (GitBranch icon, "Onboarding · Step 4"), info banner ("This does not move any player yet…"), Card with form.

**`LevelGatesForm` added:**
- Client component. Three sections:
  1. Approval model — 3 radio cards (default: `coach_recommend_director_approve`).
  2. Evidence required — 7 checkbox cards in a 2-column grid (defaults: skill_assessment, coach_observations, session_performance, match_competition_behavior).
  3. Portal visibility — 3 radio cards (default: `show_simple_requirements`).
- Notes textarea (600 char max with live counter).
- Save button with `Loader2` spinner, success `CheckCircle2` panel, `status-red` error text.
- No AI generation. No curriculum/player/group mutations.

**`updateLevelGatesAction` added:**
- `'use server'`, `assertNotPreviewMode()` guard.
- Full auth chain: auth → `profiles.academy_id` → `academy_memberships.role === 'academy_director'`.
- Server-side allowlist validation for `approvalModel` (3 values), `portalVisibility` (3 values), and `evidenceRequired` (filters unknown values from the 7-item allowlist).
- Fetches existing `academies.settings`, spreads, overlays `level_gates` object + `level_gates_completed: true` + `onboarding_state`.
- Revalidates `/director/onboarding`, `/director/onboarding/level-gates`, `/director`.

**Settings merge behavior:**
- All prior keys preserved (`academy_identity_completed`, `director_interview`, `curriculum_setup`, etc.).
- `level_gates` sub-object: `{ approval_model, evidence_required, portal_visibility, notes, updated_at }`.

**`/director/onboarding` Step 4 behavior updated:**
- Step 4 now has `href: '/director/onboarding/level-gates'`, `ctaLabel: 'Set Level Gate Rules'`, `settingsKey: 'level_gates_completed'`.
- Completion check: `if (settings.level_gates_completed === true) completedStepNumbers.add(4)`.
- Steps 5–12 remain "Coming Soon".

**No curriculum gate editing added. Portal visibility preference stored as a setting only — no parent/player portal records changed.**

**Future level readiness / parent-player progress map context note:** `settings.level_gates.portal_visibility` will be read by the parent/player portal rendering logic in a future sprint to determine what promotion information is shown. `settings.level_gates.evidence_required` will inform the level readiness scoring engine.

**Data safety:** Only `academies.settings` written. No curriculum, player, placement, group, or communication mutations. No parent/player portal exposure changed.

**TypeScript:** Clean — `npx tsc --noEmit` passed with no errors.

**Manual browser QA:** Not yet performed.

**No migrations modified. `database.types.ts` untouched. Unrelated dirty files untouched.**

---

## 2026-05-10 — Sprint 200: Curriculum Starter Selection V1

**Sprint 199 commit verified:** `feaf7d5 — Sprint 199 — Director Interview Step V1`

**Onboarding/settings/curriculum pattern audit:**
- Settings merge pattern confirmed identical to Sprints 197–199: fetch → spread → overlay → update.
- `assertNotPreviewMode()` guard confirmed required.
- Existing `/director/curriculum/` directory contains operational curriculum files (`AcademyCurriculumVersionCard.tsx`, `VoiceOverrideInputPanel.tsx`, `academy-version/`, `learning/`) — all left untouched.
- `onboarding/page.tsx` Step 3 confirmed to have no `settingsKey`, `href`, or `ctaLabel` — all three added this sprint.
- `completedStepNumbers` block at line 157 — Step 3 check added.
- `cn` utility confirmed available at `@/lib/utils` (used for radio card styling).

**`/director/onboarding/curriculum` page added:**
- Server component. Four auth guard layers: authenticated user → `profiles.academy_id` → `academy_memberships.role === 'academy_director'` → rawDb academy fetch.
- Reads `settings.curriculum_setup` sub-object; passes `starter_option` and `notes` as `initial*` props to `CurriculumStarterForm`.
- Renders: back link to `/director/onboarding`, page header (BookOpen icon, "Onboarding · Step 3"), info banner ("This does not change your curriculum yet…"), Card with form.

**`CurriculumStarterForm` added:**
- Client component. Four selectable radio cards with lime accent border on selection.
- Default selection: `customize_starter` (if no prior saved value).
- Notes textarea (800 char max with live counter).
- Save button with `Loader2` spinner. Green `CheckCircle2` success panel. `status-red` error text.
- No AI generation. No curriculum record mutations.

**Four curriculum starter options:**
1. `customize_starter` — "Start with Academy OS curriculum and customize it" (default)
2. `academy_os_starter` — "Use Academy OS Starter Curriculum"
3. `upload_existing_later` — "I have my own curriculum"
4. `blank_structure` — "Start with a blank structure"

**`updateCurriculumStarterAction` added:**
- `'use server'`, `assertNotPreviewMode()` guard.
- Full auth chain: auth → `profiles.academy_id` → `academy_memberships.role === 'academy_director'`.
- Validates `starterOption` is one of the four allowed values (server-side allowlist).
- Fetches existing `academies.settings`, spreads, overlays `curriculum_setup` object + `curriculum_setup_completed: true` + `onboarding_state` (preserves existing or sets `'curriculum_setup'`).
- Revalidates `/director/onboarding`, `/director/onboarding/curriculum`, `/director`.

**Settings merge behavior:**
- All prior keys preserved (`academy_identity_completed`, `director_interview`, `logo_url`, etc.).
- `curriculum_setup` sub-object includes `starter_option`, `notes`, `updated_at`.

**`/director/onboarding` Step 3 behavior updated:**
- Step 3 now has `href: '/director/onboarding/curriculum'`, `ctaLabel: 'Choose Curriculum Starter'`, `settingsKey: 'curriculum_setup_completed'`.
- Completion check: `if (settings.curriculum_setup_completed === true) completedStepNumbers.add(3)`.
- When Steps 1 and 2 complete and Step 3 is next: CTA block shows "Choose Curriculum Starter".
- When Step 3 complete: green check + "Complete" badge + "Revisit →" link.

**No curriculum cloning or customization logic added.**

**Future curriculum customization assistant context note:** The `customize_starter` and `academy_os_starter` selections are stored as preferences only. Future sprints will read `settings.curriculum_setup.starter_option` to determine which Curriculum Customization Assistant flow to activate.

**Data safety:** Only `academies.settings` written. No curriculum, player, placement, group, or communication mutations.

**TypeScript:** Clean — `npx tsc --noEmit` passed with no errors.

**Manual browser QA:** Not yet performed.

**No migrations modified. `database.types.ts` untouched. Unrelated dirty files untouched.**

---

## 2026-05-10 — Sprint 199: Director Interview Step V1

**Sprint 198 commit verified:** `6a97021 — Sprint 198 — Academy Onboarding Wizard Entry Point V1`

**Onboarding/settings action pattern audit:**
- Settings merge pattern confirmed: fetch `academies.settings`, spread existing, overlay new keys, update — identical to `updateAcademySettingsAction`. Safe to replicate exactly.
- `assertNotPreviewMode()` guard confirmed required for all mutating actions.
- `revalidatePath` pattern confirmed: invalidate `/director/onboarding`, `/director/onboarding/interview`, `/director`.
- Auth guard chain confirmed: auth → `profiles.academy_id` → `academy_memberships.role === 'academy_director'` → rawDb fetch.
- `AcademySettingsForm.tsx` client pattern confirmed: `useState` per field, `useTransition` for async, `saved`/`error` state. Replicated exactly.

**`/director/onboarding/interview` page added:**
- Server component. Four auth guard layers (identical to settings page).
- Reads `academies.settings.director_interview` JSON and pre-fills all seven form fields.
- Renders page header (MessageSquare icon, "Onboarding · Step 2"), info banner, Card with `DirectorInterviewForm`.

**`DirectorInterviewForm` added:**
- Client component (`'use client'`). Seven textarea fields, one per interview question.
- Each field: question number indicator, label, prompt copy, textarea (600 char max with counter), onChange clears saved state.
- Save button with `Loader2` spinner while pending. Green `CheckCircle2` success panel. `status-red` error text.
- No AI generation. No parent/player communication.

**Seven director interview questions (V1):**
1. Coaching Philosophy — `philosophy`
2. Primary Player Focus — `player_focus`
3. Development Priorities — `development_priorities`
4. Competition Approach — `competition_approach`
5. Parent Communication Style — `parent_communication_style`
6. Coach Operating Style — `coach_operating_style`
7. Success in 90 Days — `ninety_day_success`

**`updateDirectorInterviewAction` added:**
- `'use server'`, `assertNotPreviewMode()` guard.
- Full auth chain: auth → `profiles.academy_id` → `academy_memberships.role === 'academy_director'`.
- Fetches existing `academies.settings`, spreads, overlays `director_interview` object + `director_interview_completed: true` + `onboarding_state` (preserves existing or sets `'director_interview'`).
- Revalidates `/director/onboarding`, `/director/onboarding/interview`, `/director`.

**Settings merge behavior:**
- Fetches current `academies.settings` JSON first.
- Spreads all existing keys before overlaying new ones — all prior keys (e.g. `academy_identity_completed`, `logo_url`) are preserved.
- `director_interview` sub-object includes `updated_at` timestamp.

**`/director/onboarding` Step 2 behavior updated:**
- Step 2 now has `href: '/director/onboarding/interview'` and `ctaLabel: 'Start Director Interview'`.
- Completion check: `if (settings.director_interview_completed === true) completedStepNumbers.add(2)`.
- When Step 1 is complete and Step 2 is next: next-step CTA block shows "Start Director Interview" linking to `/director/onboarding/interview`.
- When Step 2 is complete: green check + "Complete" badge + "Revisit →" link in step row.
- Step 3 onwards remain "Coming Soon" (no href, no CTA).

**No AI runtime or voice transcription added.**

**Data safety:** Only `academies.settings` written. No player, placement, or communication mutations.

**TypeScript:** Clean — `npx tsc --noEmit` passed with no errors.

**Manual browser QA:** Not yet performed.

**No migrations modified. `database.types.ts` untouched. Unrelated dirty files untouched.**

---

## 2026-05-10 — Sprint 198: Academy Onboarding Wizard Entry Point V1

**Sprint 197 commit verified:** `f64747b — Sprint 197 — Academy Identity + Settings V1`

**Onboarding/checklist/navigation pattern audit:**
- `SetupProgressChecklist` — client-only (localStorage dismiss/collapse); props are data counts; not reusable for wizard (different data shape).
- `GuidedStepCard` — server-safe; supports `complete`/`current`/`upcoming`; `complete` state hides description — rendered inline for full control over Revisit links and Coming Soon badges.
- `NextBestActionCard` — server-safe; used as the next-step CTA block pattern.
- `PageExplainerCard` — server-safe; used for context banners elsewhere.
- `SidebarNav.tsx` SYSTEM_ITEMS confirmed safe for adding Onboarding nav item.
- Auth pattern confirmed identical to `settings/page.tsx`: auth → profile → membership role check → rawDb fetch.

**`/director/onboarding` page added:**
- Server component. Read-only — no mutations.
- Auth guard: authenticated user → profile → academy_id → `academy_director` role check → rawDb fetch academy.
- Reads `academies.settings` JSON: `academy_identity_completed` (V1 only completion signal).
- 12-step onboarding journey defined inline in `STEP_DEFS`.
- Step status machine: complete → next (first incomplete, lime indicator) → upcoming (remaining).
- Progress bar + `N / 12 steps complete` counter.

**Onboarding step list (12 steps):**
1. Academy Identity — linked to `/director/settings`; complete when `academy_identity_completed === true`
2. Director Interview — Coming Soon
3. Curriculum Setup — Coming Soon
4. Level Gates + Promotion Rules — Coming Soon
5. Programs + Groups — Coming Soon
6. Coaches + Permissions — Coming Soon
7. Players + Placement — Coming Soon
8. Portal Visibility — Coming Soon
9. Communication Style — Coming Soon
10. Session Templates — Coming Soon
11. Demo Week — Coming Soon
12. Launch Checklist — Coming Soon

**Academy Identity step behavior:**
- Status = `complete` when `settings.academy_identity_completed === true`: green check, "Complete" badge, "Revisit →" link.
- Status = `next` when not yet complete: lime indicator, full description, "Open Academy Settings →" inline link + separate next-step CTA block above the list.
- Other steps show "Coming Soon" badge with Lock icon.

**Navigation:**
- `Onboarding` added to `SYSTEM_ITEMS` in `SidebarNav.tsx` with `Rocket` icon; appears before Demo Tour and Settings.

**Data safety:**
- Read-only page. No update/insert/delete anywhere.
- No player mutations. No placement mutations. No parent/player communication.

**AI-assisted onboarding context note:**
- Info banner at page bottom: "AI-assisted setup and voice-guided onboarding will plug into this flow as each phase becomes available. Steps marked Coming Soon will be unlocked in future releases."

**Manual browser QA:** Not yet performed (dev server not started this sprint — read-only shell page with no interactive state).

**TypeScript:** Clean — `npx tsc --noEmit` passed with no errors.

**No migrations modified. `database.types.ts` untouched. Unrelated dirty files untouched.**

---

## 2026-05-10 — Sprint 197: Academy Identity + Settings V1

**Files created:**
- `src/app/director/settings/updateAcademySettingsAction.ts` — Server action: auth guard (director-only), fetches current settings, merges fields, updates `academies` name/country/timezone and `settings` JSON (logo_url, website, description, academy_identity_completed, academy_identity_updated_at). Calls `revalidatePath` for `/director` and `/director/settings`.
- `src/app/director/settings/AcademySettingsForm.tsx` — Client form with three sections (Academy Identity, Branding, Description). Logo URL field with live preview (hidden on error). 500-char description textarea. Success/error feedback via `useTransition`.
- `src/app/director/settings/page.tsx` — Server component: auth → profile → membership role check (director-only) → rawDb academy fetch → renders form with extracted settings values.

**Files modified:**
- `src/components/nav/SidebarNav.tsx` — Added `Settings` icon import from lucide-react. Added `{ label: 'Settings', href: '/director/settings', icon: Settings }` to `SYSTEM_ITEMS` array.

**No migrations needed.** All persistent fields use existing `academies` columns (`name`, `country`, `timezone`) and the existing `settings` JSON column.

**TypeScript:** Clean — `npx tsc --noEmit` passed with no errors.

---

## 2026-05-10 — Sprint 196: Academy Onboarding Master Flow Architecture V1

**Sprint 195 commit verified:** `5edfc75 — Sprint 195 — Placement Engine Current State Audit + Next Phase Plan V1`

**Onboarding/setup route audit:**
- Existing assets confirmed: `SetupProgressChecklist` (7-step widget on director dashboard), `/director/demo` (11-step sandbox demo tour), `/director/players/onboarding-review` (post-activation player readiness), `CurriculumCustomizationAssistant` (5-step scaffold), `/platform` (platform admin — read-only).
- No `/director/onboarding` or `/director/setup` route exists. The checklist is a widget, not a flow. This is the primary gap.
- `GuidedStepCard`, `NextBestActionCard`, `PageExplainerCard`, `CurriculumLoopDiagram` exist in `src/components/onboarding/` — reusable for the wizard.

**Existing data model support confirmed:**
- `academies`: `name`, `slug`, `country`, `timezone`, `is_active`, `settings` (JSON — writable; key onboarding fields can be stored here without migration).
- `academy_memberships`: roles `academy_director`, `head_coach`, `coach`, `player`, `parent`.
- `groups`: `name`, `track`, `level_id`, `description`, `min_age`, `max_age`, `max_players`.
- `profiles`: `display_name`, `email`, `phone`, `locale`.
- `templates`, `curriculum_levels`, `placement_recommendations`, `proposed_actions`, `audit_logs` all functional.
- `academies.settings` JSON column can store: `onboarding_state`, `onboarding_completed_phases`, `logo_url`, `brand_color`, `communication_tone`, `portal_visibility`, `placement_rules`, `director_interview`.

**Missing data model support identified:**
- No `logo_url` column or Supabase Storage bucket for logos.
- No `onboarding_state` typed column or enum.
- No `communication_tone` column.
- No `portal_visibility_settings` table.
- No `onboarding_interview_answers` table.
- No `placement_rules` table.
- No `pending_invites` table for coach/parent email invite flow.
- No `academy_curriculum_selections` table for per-academy curriculum adoption.
- All of these can be deferred to future migrations; `settings` JSON handles V1.

**Full onboarding flow defined — 18 phases:**
1. Registration / Workspace Creation
2. Academy Identity + Logo Upload
3. AI Director Interview
4. Curriculum Starter Selection
5. Curriculum Customization Assistant
6. Level Gates + Promotion Rules
7. Program + Group Setup
8. Coach Setup + Permissions
9. Player Import / Pending Placement
10. Placement Rules Setup
11. Parent Portal Visibility
12. Player Portal Mission Visibility
13. Communication Style Setup
14. Starter Session Template Generation
15. Review Academy Setup
16. Demo Week Preview
17. Launch Checklist
18. Go Live

**For each phase:** director goal, AI assistant role, voice-assisted examples, data objects touched, approval/confirmation requirement, parent/player visibility risk, safe V1 version, future 10/10 version — all defined in `docs/ACADEMY_ONBOARDING_ARCHITECTURE.md`.

**Voice-first interaction model defined:** Voice creates → proposed_actions (pending_review) → UI confirms → database structures → system executes → human approves before official activation or communication.

**AI assistant behavior rules defined (10 rules):** one question at a time; summarize before writing; propose drafts; director approves; no parent/player communication without approval; no level movement without approval; no silent player activation; no raw coach notes exposed externally; no configuration overrides global defaults; onboarding progress is resumable.

**Onboarding state machine defined:** `not_started → academy_identity → director_interview → curriculum_setup → operations_setup → people_setup → portal_setup → launch_review → demo_preview → ready_to_launch → live`. Persisted in `academies.settings.onboarding_state`.

**Launch checklist defined — 14 checks:** academy profile complete, logo set/skipped, curriculum track selected, group created, class template created, coach invited/skipped, player import/skipped, placement rules approved, parent portal visibility saved, player portal visibility saved, communication tone selected, sample session generated, demo week previewed/skipped, director go-live approval.

**Recommended Sprint 197–206 block defined:** Sprint 197 = Academy Identity + Settings V1 (`/director/settings`, read/write `academies` fields + `settings` JSON, no migration).

**Open questions documented:** 8 product/data decisions requiring founder confirmation — academy creation model, logo storage target, coach invite vs manual creation, curriculum customization scope, parent portal URL structure, onboarding route guard, multi-director support, demo week with real data.

**Documentation created:** `docs/ACADEMY_ONBOARDING_ARCHITECTURE.md`

**Files modified:** `docs/ACADEMY_ONBOARDING_ARCHITECTURE.md` (new), `docs/CHANGELOG.md`

**No functional code changes.** No academy records mutated. No player records mutated. No placement records mutated. No parent/player communication sent. No migrations modified. `database.types.ts` untouched.

**TypeScript:** CLEAN — no code files modified; check is confirmatory.

**Manual browser QA status:** Documentation-only sprint. No UI changes to test.

**Future Director AI Agent context note:** The `academies.settings` JSON column is the V1 persistence layer for all onboarding state — including `onboarding_state`, `communication_tone`, `portal_visibility`, and `placement_rules`. A Director AI Agent in a future sprint can read these settings to understand the academy's configured operating style and tailor all proposed drafts accordingly (tone, depth, format). The 18-phase flow and state machine defined here provide the structured context that makes that agent coherent across sessions.

---

## 2026-05-10 — Sprint 195: Placement Engine Current State Audit + Next Phase Plan V1

**Sprint 194 commit verified:** `4f7b669 — Sprint 194 — Clarification-Needed Wrap-Ups Visible in Director Review Queue V1`

**Audit scope:** Full read-only audit of the placement engine — all three entry points, the complete proposed_actions pipeline for unknown-attendee placement, the direct placement engine for pending players, post-activation review, and backend utilities.

**Files read (no changes made):**
- `src/app/director/placement/page.tsx` — Entry Point C server component
- `src/app/director/placement/PlacementEngineClient.tsx` — Entry Point C client
- `src/app/director/placement/placementDraftAction.ts` — Entry Point C server actions
- `src/app/director/review/PlacementReviewCard.tsx` — Entry Point B Stage 1
- `src/app/director/review/PlacementIntakeCandidateCard.tsx` — Entry Point B Stage 2
- `src/app/director/review/PlacementAssessmentDraftCard.tsx` — Entry Point B Stage 3
- `src/app/director/review/PlacementRecommendationDraftCard.tsx` — Entry Point B Stage 4–5
- `src/app/director/review/actions.ts` (placement-related exports)
- `src/app/director/players/new/NewPlayerForm.tsx` — Entry Point A
- `src/app/director/players/new/createPlayerAction.ts` — Entry Point A action
- `src/app/director/players/onboarding-review/page.tsx` — post-activation review
- `src/lib/backend/assessments.ts` — backend utilities
- `supabase/migrations/004_players.sql` — confirmed `full_name` generated column, `join_date` default

**Three entry points confirmed:**

1. **Entry Point A (Direct Manual):** `/director/players/new` → `createPlayerAction` inserts player as `pending_placement` → enters Entry Point C queue. No `proposed_actions` trail.

2. **Entry Point B (Unknown Attendee):** `/director/review` five-stage pipeline through `proposed_actions`. Stages: placement_review → intake_candidate → assessment_draft → recommendation_draft → create player. Recommendation generation is deterministic (no AI). `createPlayerFromApprovedRecommendationAction` creates the player, creates a `placement_recommendations` row, calls `finalize_player_placement()`, marks proposed_action `executed`, writes audit log.

3. **Entry Point C (Direct Placement):** `/director/placement` → `placement_recommendations` table directly (not via proposed_actions). `createPlacementDraftAction` → `approvePlacementDraftAction` → `activatePlayerAction` → calls `finalize_player_placement()`.

**Activation gate confirmed:** `finalize_player_placement(p_recommendation_id, p_activator_id)` is called only from `activatePlayerAction` (Entry Point C) and `createPlayerFromApprovedRecommendationAction` (Entry Point B). No other activation path exists.

**Schema facts confirmed:**
- `players.full_name` is a `GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED` column — Entry Point B does not need to set it.
- `players.join_date` has `DEFAULT CURRENT_DATE` — Entry Point B does not need to set it.

**Known gaps identified for Phase 2:**
1. Curriculum level not set at placement (explicit warning in UI; must be assigned separately).
2. Entry Point C bypasses `proposed_actions` — no review audit trail for manually-added pending players.
3. No `recommended_track` field in Entry Point B's `createPlayerFromApprovedRecommendationAction` insert.
4. No guided next-step prompt to development intake after player activation.

**Audit document created:** `docs/PLACEMENT_ENGINE_AUDIT.md`

**Files modified:** `docs/PLACEMENT_ENGINE_AUDIT.md` (new), `docs/CHANGELOG.md`

**No code changes.** No migrations. No player mutations. No proposed_actions inserts. `database.types.ts` untouched.

**TypeScript:** CLEAN — no files modified; check is confirmatory.

---

## 2026-05-10 — Sprint 194: Clarification-Needed Wrap-Ups Visible in Director Review Queue V1

**Sprint 193 commit verified:** `3ca7515 — Sprint 193 — Rejected Wrap-Ups Visible in Director Review Queue V1`

**Director review queue clarification-needed audit:**
- `WrapUpDraftCard.tsx`: `clarification_needed` already handled — header badge renders `'needs clarification'`; Director Note panel gated on `clarification_needed || rejected` (both supported); decision controls `pending_review`-only (clarification_needed gets none); apply controls `approved`-only (clarification_needed gets none). **No card changes required.**
- `page.tsx` query filter (line 543): `['pending_review', 'approved', 'clarification_needed', 'rejected']` — `clarification_needed` already present from Sprint 192 audit. No query change needed.
- `page.tsx` arrays: `clarificationNeededWrapUpDrafts` was missing; `clarification_needed` items were fetched, enriched, then silently dropped.
- `page.tsx` JSX: no "Needs Clarification" section in the `wrap_ups` tab content.

**Implementation (Option A — page.tsx only):**
- Added `const clarificationNeededWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'clarification_needed')` between `approvedWrapUpDrafts` and `rejectedWrapUpDrafts` arrays.
- Added "Needs Clarification" section in the `wrap_ups` tab JSX between the pending section and the "Not Approved" section — conditionally rendered when `clarificationNeededWrapUpDrafts.length > 0`, with an orange count badge and `WrapUpDraftCard` per item.
- `WrapUpDraftCard.tsx`: zero changes.

**Section ordering in Session Wrap-Ups tab (post Sprint 194):**
1. Approved — Ready to Apply (lime badge) — director action: apply
2. Pending Review (or empty state) — director action: decide
3. Needs Clarification (orange badge) — waiting on coach
4. Not Approved (red badge) — terminal / historical

**Clarification-needed visibility:** `clarification_needed` wrap-ups now appear in the Session Wrap-Ups tab under "Needs Clarification" with an orange count badge. Section is hidden when none exist.

**Needs Clarification UI:** `WrapUpDraftCard` header shows `"Session Wrap-Up Draft · needs clarification"`. Full card content is shown. Director Note panel appears if `reviewerNotes` is non-empty, showing what was sent to the coach. Card is action-free — no decision or apply controls.

**Director Note behavior:** Supported since Sprint 192 — no change. `reviewerNotes` rendered for `clarification_needed` when non-null.

**Decision controls:** Hidden for `clarification_needed` — only shown for `pending_review`. Unchanged.

**Apply controls:** Hidden for `clarification_needed` — only shown for `approved`. Unchanged.

**Tab badge:** `TabLabel` `pending` count remains `pendingWrapUpDrafts.length`. `clarification_needed` items are waiting on coach — not a new director action — so they do not inflate the pending badge.

**Future Coach/Director AI Agent context note:** All four active wrap-up states (pending_review, clarification_needed, approved, rejected) are now visible in the queue. A future Director AI Agent could analyze the distribution of clarification_needed and rejected items per coach or group to surface coaching consistency signals. The Director Note text in each card provides structured feedback history for that analysis.

**Files modified:** `src/app/director/review/page.tsx`

**Data safety:** Read-only display change. One new `.filter()` derivation from an already-fetched array. No inserts, updates, deletes, player mutations, or communications.

**No player records mutated.** No parent/player communication sent. No migrations modified. `database.types.ts` untouched. `WrapUpDraftCard.tsx` untouched. `applyWrapUpDraftAction` untouched. `saveWrapUpDraftAction` untouched. Coach session pages untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Change is one additional `.filter()` array derivation and one conditionally-rendered JSX section using an already-proven card component with established `clarification_needed` support.

---

## 2026-05-10 — Sprint 193: Rejected Wrap-Ups Visible in Director Review Queue V1

**Sprint 192 commit verified:** `21f4419 — Sprint 192 — Director Wrap-Up Clarification Note Display V1`

**Director review queue rejected-state audit:**
- `WrapUpDraftCard.tsx`: `rejected` was already handled in the header badge (renders `'rejected'`), the Director Note panel (already gated on `clarification_needed || rejected`), decision controls (hidden for rejected — `pending_review` only), and apply controls (hidden for rejected — `approved` only). **No card changes needed.**
- `page.tsx` query filter (line 543): `['pending_review', 'approved', 'clarification_needed']` — `'rejected'` was missing.
- `page.tsx` arrays: `rejectedWrapUpDrafts` did not exist; `enrichedWrapUpDrafts` had no rejected filter.
- `page.tsx` JSX: no "Not Approved" section in the `wrap_ups` tab content.
- Additional finding: `clarification_needed` wraps are fetched by the existing query but also have no filter array or JSX section — a pre-existing gap, out of scope for Sprint 193 (noted as known limitation).

**Implementation:**
- `page.tsx`: added `'rejected'` to `.in('status', [...])` filter; added `const rejectedWrapUpDrafts = enrichedWrapUpDrafts.filter(d => d.status === 'rejected')`; added "Not Approved" section in the `wrap_ups` tab JSX after the pending section — conditionally rendered when `rejectedWrapUpDrafts.length > 0`, with a red count badge and `WrapUpDraftCard` per item.
- `WrapUpDraftCard.tsx`: no changes required — card already renders correctly for rejected status.

**Rejected wrap-up visibility:** Rejected wrap-ups now appear in the Session Wrap-Ups tab under a "Not Approved" section with a red count badge. Section is hidden when no rejected wraps exist.

**Rejected status UI:** `WrapUpDraftCard` header shows `"Session Wrap-Up Draft · rejected"` for rejected items. Card renders full payload content (blocks, key fields, warnings). Director Note panel shows if `reviewerNotes` is non-empty (sprint 192 behavior preserved).

**Director Note behavior:** Already supported for `rejected` since Sprint 192 — no change needed.

**Decision/apply controls:** Decision controls hidden for rejected (unchanged — only show for `pending_review`). Apply controls hidden for rejected (unchanged — only show for `approved`). No action behavior modified.

**Tab badge:** `TabLabel` `pending` count remains `pendingWrapUpDrafts.length` (action-needed items only). Rejected items are historical — no action required — so they do not inflate the pending badge.

**Future Coach/Director AI Agent context note:** The rejected wrap-up history is now visible in the queue. A future Director AI Agent could scan rejected wraps for patterns (e.g., sessions from a specific coach or group consistently getting rejected) and surface coaching quality signals. The Director Note panel on rejected cards also provides the rejection reason context for this analysis.

**Files modified:** `src/app/director/review/page.tsx`

**Data safety:** Read-only display change. One additional value in an existing `.in()` filter. No inserts, updates, deletes, player mutations, or communications.

**No player records mutated.** No parent/player communication sent. No migrations modified. `database.types.ts` untouched. `WrapUpDraftCard.tsx` untouched. `applyWrapUpDraftAction` untouched. `saveWrapUpDraftAction` untouched. Coach session pages untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Change is: one additional value in an `.in()` filter, one additional `.filter()` array derivation, and one conditionally-rendered JSX section. The card component already handled `rejected` before this sprint.

---

## 2026-05-10 — Sprint 192: Director Wrap-Up Clarification Note Display V1

**Sprint 191 commit verified:** `4840aba — Sprint 191 — Director Wrap-Up Clarification Request UX V1`

**Director review card architecture audit:**
- `page.tsx` wrap-up query (line 540) selected `id, status, target_object_id, proposed_payload, created_at, proposed_by_id` — `reviewer_notes` was not selected
- Local `DraftRow` interface had no `reviewer_notes` field
- `enrichedWrapUpDrafts.map()` did not extract or pass `reviewer_notes`
- `EnrichedWrapUpDraftItem` had no `reviewerNotes` field
- `WrapUpDraftCard` had no note display logic
- Wrap-up status filter: `['pending_review', 'approved', 'clarification_needed']` — `rejected` excluded from current queue
- `rawDb` is already `supabase as any`; adding `reviewer_notes` to the select string is safe

**Implementation (Option A):**
- `page.tsx`: added `reviewer_notes?: string | null` to `DraftRow` interface; added `reviewer_notes` to wrap-up `proposed_actions` select string; added `reviewerNotes: d.reviewer_notes ?? null` to `enrichedWrapUpDrafts.map()`
- `WrapUpDraftCard.tsx`: added `reviewerNotes?: string | null` to `EnrichedWrapUpDraftItem`; added `HelpCircle` to lucide-react imports; added director note panel rendered when `status === 'clarification_needed' || status === 'rejected'` and `reviewerNotes` is non-empty

**Director note display behavior:**
- Orange-tinted inset panel with `HelpCircle` icon
- Label: "Director Note · Visible to coach" (orange uppercase + muted qualifier)
- Body: note text in `text-text-secondary`
- Positioned between safety note and decision/apply controls
- Only renders when `reviewerNotes` is non-null and non-empty
- Shown for `clarification_needed` (primary V1 case) and `rejected` (future-safe; currently excluded from queue filter)

**Decision controls preserved:** `WrapUpDraftDecisionControls` unchanged. Still shown only for `pending_review`.

**Apply controls preserved:** `ApplyWrapUpDraftControls` unchanged. Still shown only for `approved`.

**Future Coach/Director AI Agent context note:** `reviewerNotes` is now surfaced on both the coach session page (Sprint 191) and the director review card (Sprint 192). A future Director AI Agent could detect patterns across `reviewer_notes` values (e.g., recurring "missing attendance details" notes) to surface coaching quality signals. A Coach AI Agent could use the same field to pre-populate the wrap-up revision drawer with the director's specific ask.

**Files modified:** `src/app/director/review/page.tsx`, `src/app/director/review/WrapUpDraftCard.tsx`

**Data safety:** Read-only display change. One additional column in an existing read query. No inserts, updates, deletes, player mutations, or communications.

**No player records mutated.** No parent/player communication sent. No migrations modified. `database.types.ts` untouched. `applyWrapUpDraftAction` untouched. `saveWrapUpDraftAction` untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Change is one additional Postgres column in an existing `rawDb` query, passed through a typed interface to a conditional render gated on status and non-null note. No async state, no effects, no new API surface.

---

## 2026-05-10 — Sprint 191: Director Wrap-Up Clarification Request UX V1

**Sprint 190 commit verified:** `59bf4b6 — Sprint 190 — Coach Wrap-Up Duplicate Submission Guard V1`

**Director decision architecture audit:**
- `reviewer_notes: string | null` is a confirmed real column on `proposed_actions` (verified in `database.types.ts`)
- `updateWrapUpDraftDecisionAction` already accepts `reviewNotes?: string` as a 3rd param and writes it to `reviewer_notes` for all decisions including `clarification_needed` — note was already being saved to DB
- `WrapUpDraftDecisionControls` already maintained `noteText` state and passed `noteText.trim() || undefined` to the action — the full save path already worked
- Coach `page.tsx` query only selected `'status'`; `reviewer_notes` was never read or surfaced
- `CoachWrapUpStatusCard` had no note prop and showed no note
- `actions.ts` required no modification

**Clarification note storage field identified:** `reviewer_notes` on `proposed_actions` — already populated by existing action, confirmed in generated types.

**Implementation:**
- `WrapUpDraftDecisionControls.tsx`: updated textarea label from "Decision note (optional)" → "Clarification note"; placeholder from "Add context for the coach or next reviewer…" → "What should the coach clarify?"; added helper "This note is visible to the coach."
- `page.tsx`: added `reviewer_notes` to `.select('status, reviewer_notes')` query; extracted `existingWrapUpNote: string | null`; passed `reviewerNote={existingWrapUpNote}` to `<CoachWrapUpStatusCard>`
- `CoachWrapUpStatusCard.tsx`: added `reviewerNote?: string | null` prop; for `clarification_needed` status, renders "Director note: [note]" in `text-text-secondary` with `text-status-orange` label below helper text

**Director clarification UX:** Single shared textarea (already present) now clearly labeled for clarification context. Label and placeholder guide the director to write what the coach needs to address. Helper confirms coach visibility.

**Coach clarification display:** When `status === 'clarification_needed'` and `reviewerNote` is non-null, `CoachWrapUpStatusCard` renders "Director note: …" below the helper text. Note is never shown for approved/rejected/pending_review/executed — scoped to clarification only.

**Update Wrap-Up behavior preserved:** Sprint 190 button guard unchanged. `clarification_needed` still enables the "Update Wrap-Up" button and opens `CoachWrapUpDrawer`.

**Approve/reject/apply behavior preserved:** `updateWrapUpDraftDecisionAction` unchanged. `ApplyWrapUpDraftControls` unchanged. `applyWrapUpDraftAction` unchanged. Approve and reject paths still accept optional notes; those notes go to `reviewer_notes` but are not surfaced to coach (only `clarification_needed` renders the note).

**Future Coach/Director AI Agent context note:** `reviewer_notes` is the canonical field for structured director-to-coach feedback. A future Coach AI Agent could pre-populate the wrap-up drawer with context drawn from `reviewer_notes` when `status === 'clarification_needed'`. A future Director AI Agent could draft clarification notes from pattern analysis.

**Files modified:** `src/app/director/review/WrapUpDraftDecisionControls.tsx`, `src/app/coach/sessions/[sessionId]/page.tsx`, `src/app/coach/sessions/[sessionId]/CoachWrapUpStatusCard.tsx`

**Data safety:** No inserts, updates, deletes, player mutations, or communications. Read-only change on the coach side; director side textarea label change only — action function unchanged.

**No player records mutated.** No parent/player communication sent. No migrations modified. `database.types.ts` untouched. `actions.ts` untouched. `saveWrapUpDraftAction` untouched. `applyWrapUpDraftAction` untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Logic is: one additional selected column in an existing query, one optional prop on an existing component with a conditional render gated on status and non-null note. Straightforward and low-risk.

---

## 2026-05-10 — Sprint 190: Coach Wrap-Up Duplicate Submission Guard V1

**Sprint 189 commit verified:** `ebc90f6 — Sprint 189 — Coach Sessions List Wrap-Up Status V1`

**Coach wrap-up action architecture audit (Option A chosen):**
- `CoachSessionActions` is a `'use client'` component — adding an optional `wrapUpStatus` prop is safe and straightforward
- `CoachWrapUpDrawer` is mounted only when `wrapUpOpen === true`; disabling the button prevents `setWrapUpOpen(true)` from firing — drawer is never mounted in blocked states
- `saveWrapUpDraftAction` always creates a new `proposed_actions` row and has no server-side duplicate check — UI guard is sufficient for V1
- Session detail page already had `existingWrapUpStatus: string | null` computed in step 7 (Sprint 188); only needed to pass it through to `CoachSessionActions`
- `CoachWrapUpStatusCard`, `CoachWrapUpDrawer`, `saveWrapUpDraftAction`, and `applyWrapUpDraftAction` are all unchanged

**Implementation:**
- Added `wrapUpStatus?: string | null` to `CoachSessionActions` Props interface
- Added `resolveWrapUpCTA(status)` helper: maps status string to `{ label, helper, helperColor, disabled }`
- Primary button is `disabled` for `pending_review` / `approved` / `executed` — styled as muted surface with `cursor-not-allowed`; `onClick` not fired
- Primary button remains enabled (lime) for `clarification_needed` / `rejected` with adjusted label and helper copy
- Helper text below Quick Note is hidden when button is disabled (wrap-up already complete) to avoid confusing copy
- Passed `wrapUpStatus={existingWrapUpStatus}` to `<CoachSessionActions>` in coach session detail page

**Duplicate guard behavior:**
| Status | Button label | Helper copy | Drawer opens |
|--------|-------------|-------------|--------------|
| `null` / unknown | Wrap Up Session | (none) | Yes |
| `clarification_needed` | Update Wrap-Up | Director requested clarification. | Yes |
| `rejected` | Submit New Wrap-Up | Your previous wrap-up was not approved. | Yes |
| `pending_review` | Wrap-up submitted | Director is reviewing your notes. | No |
| `approved` | Wrap-up approved | Director can apply it to the session record. | No |
| `executed` | Wrap-up applied | Your notes are part of the official session record. | No |

**Existing drawer behavior:** `CoachWrapUpDrawer` is completely unchanged. When the button is enabled, the multi-step form opens and submits exactly as before.

**Future Coach AI Agent context note:** The `resolveWrapUpCTA` helper provides a clean insertion point for a future Coach AI Agent to suggest "your previous wrap-up had a clarification request — here's what to update." The status-to-CTA mapping is intentionally decoupled from the drawer logic.

**Files modified:** `src/app/coach/sessions/[sessionId]/CoachSessionActions.tsx`, `src/app/coach/sessions/[sessionId]/page.tsx`

**Data safety:** UI-only change. No inserts, updates, deletes, player mutations, or communications.

**No player records mutated.** No parent/player communication sent. No migrations modified. `database.types.ts` untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Logic is straightforward conditional rendering with no async state; the `disabled` prop on a `<button>` is standard React behavior.

---

## 2026-05-10 — Sprint 189: Coach Sessions List Wrap-Up Status V1

**Sprint 188 commit verified:** `(committed immediately prior in this session)`

**Architecture audit:**
- `getCoachWorkspaceSummary` returns `profile.academy_id` — already available, no extra query needed
- `proposed_actions` can be queried in bulk with `.in('target_object_id', sessionIds)` — single round-trip for all session IDs
- Wrap-up badges needed only on Today + Completed rows; Upcoming sessions have no wrap-up state yet
- `SessionCard` and `SessionRow` are private server-only functions in the same file — prop extension is safe and type-checked

**Implementation (Option A — bulk query + `WrapUpBadge` helper):**
- `let academyId: string | null = null` and `const wrapUpStatusMap = new Map<string, string>()` declared at top of page function
- `academyId = summary.profile?.academy_id ?? null` extracted from try block alongside `coachId`
- Bulk `proposed_actions` query added inside `if (coachId)` block after `recentCompleted` query: collects all Today + Completed session IDs, queries `target_module = 'session_wrap_up_v1'` + `proposed_by_id = user.id` + `.in('target_object_id', sessionIds)` ordered by `created_at desc`; fills `wrapUpStatusMap` taking first (most recent) status per session
- `wrapUpStatus={wrapUpStatusMap.get(s.id)}` passed to `SessionCard` (Today) and `SessionRow` (Completed); Upcoming rows receive no prop
- `WrapUpBadge` helper added at bottom of file: renders a colored pill for known statuses, returns null for undefined/unknown

**Wrap-up badge labels:**
| Status | Label |
|--------|-------|
| `pending_review` | Wrap-up pending |
| `approved` | Wrap-up approved |
| `executed` | Wrap-up applied |
| `clarification_needed` | Clarification needed |
| `rejected` | Not approved |
| undefined / unknown | (renders nothing) |

**Files modified:** `src/app/coach/sessions/page.tsx`

**Data safety:** Bulk `proposed_actions` read is scoped to `academy_id` + `proposed_by_id` + `target_module`. Read-only. No inserts, updates, deletes, player mutations, or communications.

**No player records mutated.** No parent/player communication sent. No migrations modified. `database.types.ts` untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Badge is a pure read-only render with no state or effects.

---

## 2026-05-10 — Sprint 188: Coach Wrap-Up Submitted State V1

**Sprint 187 commit verified:** `ddec516 — Sprint 187 — Session Actual Display on Director Session Detail V1`

**Coach wrap-up submission architecture audit:**
- `proposed_actions.proposed_by_id` confirmed in schema (`string`, required FK) — safe to filter by current coach's user ID
- `saveWrapUpDraftAction` inserts with `target_module: 'session_wrap_up_v1'`, `target_object_id: sessionId`, `proposed_by_id: user.id`, `status: 'pending_review'`
- Coach session page is a server component with `user` and `academyId` already in scope
- `CoachSessionActions` is `'use client'` — wraps both the Wrap Up Session button and `CoachWrapUpDrawer`; left completely untouched
- `rawDb = supabase as any` pattern already used in the page; reused for the new query

**Implementation (Option A — read-only query + display component):**
- Added query (step 7) to coach session page: selects `status` from `proposed_actions`, scoped to `academy_id` + `target_module = 'session_wrap_up_v1'` + `target_object_id = session.id` + `proposed_by_id = user?.id`, ordered by `created_at desc`, limit 1 — yields `existingWrapUpStatus`
- Created `CoachWrapUpStatusCard.tsx`: maps status string to icon, title, helper copy, and color scheme; renders nothing when `status` is null or unknown
- Rendered `<CoachWrapUpStatusCard>` and `<CoachSessionActions>` inside a `space-y-3` wrapper in the "After Session" section — status card appears above the Wrap Up button, `space-y-3` produces natural gap only when card is visible

**Status mapping:**
| Status | Title | Helper |
|--------|-------|--------|
| `pending_review` | Wrap-up submitted — awaiting director review | Director is reviewing your notes. |
| `approved` | Wrap-up approved | Director can apply it to the session record. |
| `executed` | Wrap-up applied to the session record | Your notes are now part of the official session record. |
| `clarification_needed` | Director requested clarification | Review the feedback and update your wrap-up if needed. |
| `rejected` | Wrap-up was not approved | Check with the director if you need more context. |
| `null` / unknown | (renders nothing) | — |

**Existing CTA behavior:** `CoachSessionActions` (Wrap Up Session button) and `CoachWrapUpDrawer` are unchanged. Coaches can still submit or re-submit a wrap-up regardless of current status — V1 prioritizes visibility over duplicate guard.

**Data safety:** Read-only query only. No inserts, updates, deletes, player mutations, or communications.

**No player records mutated.** No parent/player communication sent. No migrations modified. `database.types.ts` untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Component is a pure read-only render of a single prop with no state or effects.

**Future Coach AI Agent context note:** `CoachWrapUpStatusCard` surfaces the canonical wrap-up pipeline state to the coach. When a Coach AI Agent generates session guidance, it should check `proposed_actions.status` for `target_module = 'session_wrap_up_v1'` + `target_object_id = sessionId` + `proposed_by_id = coachId` to determine whether a wrap-up has been submitted, approved, applied, or needs follow-up. The agent should never trigger `saveWrapUpDraftAction` if an `executed` or `approved` draft already exists.

**Files created:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpStatusCard.tsx` — read-only status display component

**Files modified:**
- `src/app/coach/sessions/[sessionId]/page.tsx` — import added, wrap-up status query added, `<CoachWrapUpStatusCard>` rendered above existing CTA
- `docs/CHANGELOG.md` — this entry

---

## 2026-05-10 — Sprint 187: Session Actual Display on Director Session Detail V1

**Sprint 186 commit verified:** `53fe13e — Sprint 186 — Apply Wrap-Up Draft to Session Actual V1`

**Director session detail architecture audit:**
- `session_notes` and `status` were already selected in the session query at line 75 of `page.tsx` — no query change needed
- An existing bare "Session Notes" display existed at lines 887–892, buried inside the session meta/stats card (Status / Blocks / Exercises), with no empty state, no completed badge, and no wrap-up attribution context
- `PlannedVsActualDiffPanel` reads from wrap-up payload (not `session_notes`) and was left untouched
- `updated_at` is not in the session select — not included in the new component to avoid query changes

**Implementation (Option B — dedicated component):**
- Created `SessionActualDisplay.tsx`: read-only card showing completed/not-applied badge, official notes with wrap-up attribution, and empty state
- Removed the existing rudimentary "Session Notes" inline block from the session meta card
- Added `<SessionActualDisplay>` as a dedicated section after the meta card and before Group Assignment

**Session Actual UI behavior:**
- Section label: "Session Actual" (`label-xs`)
- If `status === 'completed'`: green "Completed" badge + "This session has been marked completed." helper text
- If any other status: neutral "Not Applied Yet" badge + "Session actual has not been applied." helper text
- If `session_notes` present: "Official Notes" label + `whitespace-pre-wrap` notes in `bg-surface-raised` box + "These notes reflect the approved session wrap-up applied to this session." attribution
- If no `session_notes`: empty state box — "No session actual notes have been applied yet." + "Approved coach wrap-ups will appear here after they are applied."
- Planned curriculum content and `PlannedVsActualDiffPanel` remain visually separate below

**Data safety:** Read-only display. No inserts, updates, deletes, player mutations, or communications.

**No session records mutated.** No player records mutated. No parent/player communication sent. No migrations modified. `database.types.ts` untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Component is a pure read-only render of two already-available props — no new queries, no state, no effects.

**Future Director AI Agent context note:** The `SessionActualDisplay` is the canonical UI surface for `sessions.session_notes`. When the AI Agent generates session summaries or status checks, it should treat `session_notes` as the official applied record and `sessions.status = 'completed'` as the confirmation gate. The component's empty state is the correct signal that no wrap-up has been applied yet.

**Files created:**
- `src/app/director/sessions/[sessionId]/SessionActualDisplay.tsx` — read-only component for session actual section

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — import added, buried notes removed from meta card, `<SessionActualDisplay>` section added
- `docs/CHANGELOG.md` — this entry

---

## 2026-05-10 — Sprint 186: Apply Wrap-Up Draft to Session Actual V1

**Sprint 185 commit verified:** `16e2c58 — Sprint 185 — Director Review URL Tab State + Wrap-Up Deep Link V1`

**Apply/session actual architecture audit:**
- `applyWrapUpDraftAction.ts` was already fully implemented: auth → profile → academy → role guard → approved-only guard → session ownership guard → session notes write → status advance → proposed_action executed → audit_log → revalidatePath
- `ApplyWrapUpDraftControls.tsx` was already fully implemented: loading/success/error states, router refresh on success
- `WrapUpDraftCard.tsx` was already correctly wired: shows `<ApplyWrapUpDraftControls>` when `draft.status === 'approved'`
- No `session_actuals` table exists — `sessions.session_notes` + `sessions.status` is the correct and only target
- Schema confirmed: `sessions.session_notes` (`string | null`), `session_status` enum includes `"completed"`, `proposed_action_status` enum includes `"executed"`

**Gap identified and patched:**
- `raw_standouts_answer` and `raw_attention_answer` (added to `SessionActualDraftPayload` in Sprint 183) were not included in the session notes written by the apply action — patched in `applyWrapUpDraftAction.ts`

**Implementation (Option A — patch existing action):**
- Added two conditional lines to the `noteParts` builder in `applyWrapUpDraftAction.ts`:
  - `payload.raw_standouts_answer` → `Player Standouts: <value>` (only when present)
  - `payload.raw_attention_answer` → `Needs Attention: <value>` (only when present)
- All existing guards, writes, and revalidations preserved unchanged

**Apply action behavior:**
1. Auth guard — unauthenticated users blocked
2. Profile/academy guard — no academy context → blocked
3. Role guard — only `academy_director` or `head_coach` can apply
4. Module guard — `target_module` must equal `session_wrap_up_v1`
5. Status guard — draft must be `approved`; unapproved drafts return error
6. Session ownership guard — session must belong to same academy
7. Session notes written to `sessions.session_notes` (block summary, changes, next focus, group note, player standouts, needs attention)
8. Session status advanced to `completed` if currently `planned` or `in_progress` — never regressed
9. Proposed action marked `executed`
10. Audit log written with actor, session, block counts, source
11. `/director/review` and `/director/sessions/[sessionId]` revalidated

**UI behavior:** Apply button → "Applying…" loading → success banner ("Applied. Session notes updated and session marked completed.") + router refresh, or inline error message on failure.

**Data safety:** Only `sessions` and `proposed_actions` rows are mutated. No player records, no parent/player communication, no curriculum changes, no roster changes.

**No player records mutated.** No parent/player communication sent. No migrations modified. `database.types.ts` untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Core apply logic was pre-built and reviewed; patch is additive (two conditional string concatenations with no new queries or branching).

**Future Director AI Agent context note:** The apply action is the authoritative write path for session wrap-up data. When a Director AI Agent generates wrap-up links or status summaries, it should read `sessions.session_notes` and `sessions.status` for the canonical applied state, and `proposed_actions.status = 'executed'` to confirm application. The agent must never bypass the `approved` status guard.

**Files modified:**
- `src/app/director/review/applyWrapUpDraftAction.ts` — added `raw_standouts_answer` and `raw_attention_answer` to session notes builder
- `docs/CHANGELOG.md` — this entry

---

## 2026-05-10 — Sprint 185: Review Queue Wrap-Up Deep Link V1

**Sprint 184 commit verified:** `97adfb0 — Sprint 184 — Director Dashboard Wrap-Up Count V1`

**Director review tab architecture audit:**
- `src/app/director/review/page.tsx` had no `searchParams` prop — pure server component with no URL-driven tab selection
- Tabs rendered with Radix UI `<Tabs defaultValue={defaultTab}>` where `defaultTab` was computed server-side from pending counts
- Internal tab value for wrap-ups is `wrap_ups` (underscores); URL param convention is `wrap-ups` (hyphens)
- Two dashboard links pointed to `/director/review` without tab param: Coach Wrap-Ups CommandCard and AcademyAlertsPanel wrap-up alert

**Implementation (Option A — server-side searchParams):**
- Added `VALID_TAB_PARAMS` map (URL hyphens → internal underscores) to `page.tsx` before the page function
- Added `searchParams: { tab?: string }` prop to `DirectorReviewQueuePage`
- Computed `resolvedTab` from param; overrides `defaultTab` only when a valid known param is provided
- Changed `<Tabs defaultValue={defaultTab}>` to `<Tabs defaultValue={activeDefaultTab}>`
- Unknown or absent tab params fall back to the original pending-count-driven `defaultTab` logic — no behavior change

**Dashboard links updated:**
- Coach Wrap-Ups CommandCard (`src/app/director/page.tsx` line 287): `/director/review` → `/director/review?tab=wrap-ups`
- AcademyAlertsPanel wrap-up alert (`src/app/director/page.tsx` line 762): `/director/review` → `/director/review?tab=wrap-ups`

**URL behavior:**
- `/director/review?tab=wrap-ups` → opens directly to Session Wrap-Ups tab
- `/director/review?tab=session-wrap-ups` → also resolves to Session Wrap-Ups tab (alias)
- `/director/review` (no param) → existing pending-count-driven default, unchanged
- `/director/review?tab=unknown` → falls back to pending-count-driven default safely

**Data safety:** UI/navigation only. No inserts, updates, deletes, player mutations, or communications.

**No player records mutated.** No parent/player communication sent. No migrations modified. `database.types.ts` untouched.

**TypeScript:** CLEAN — `npx tsc --noEmit` produced no output.

**Manual browser QA status:** Not browser-tested in this environment. Logic is a pure server-side prop addition with no rendering complexity — safe for director QA.

**Future Director AI Agent context note:** The `VALID_TAB_PARAMS` map is the single authoritative place to register tab deep-link aliases. When the AI Agent generates review queue links, it should use the URL-param form (e.g. `?tab=wrap-ups`) which the server resolves to the internal Radix value.

**Files modified:**
- `src/app/director/review/page.tsx` — added `searchParams` prop and `VALID_TAB_PARAMS` map; overrides `defaultTab` when valid URL param present
- `src/app/director/page.tsx` — updated 2 hrefs to `/director/review?tab=wrap-ups`
- `docs/CHANGELOG.md` — this entry

---

## 2026-05-10 — Sprint 184: Director Dashboard Wrap-Up Count V1

**Sprint 183 commit verified:** `c3d6ade — Sprint 183 — Coach Wrap-Up Director Review V1`

**Director dashboard architecture audit:**
- `pendingWrapUpsCount` was already fetched at lines 165–172 of `src/app/director/page.tsx`: read-only count against `proposed_actions` scoped to `academy_id`, `target_module = 'session_wrap_up_v1'`, `status = 'pending_review'`.
- Already included in `totalAlerts` (feeds the "Needs Attention" CommandCard).
- Already shown in `AcademyAlertsPanel` as a dedicated "N coach wrap-ups awaiting review" alert item with a link to `/director/review`.
- Gap: no dedicated top-level `CommandCard` showing the wrap-up count alone — count was aggregated into "Needs Attention" and only visible as a detail in the alerts panel below the fold.
- Architecture: Option A — add a 6th `CommandCard` to the "Today's Priorities" grid.

**Files modified:**
- `src/app/director/page.tsx` — Three changes: (1) Added `ClipboardList` to lucide-react imports. (2) Changed "Today's Priorities" grid from `grid-cols-2 xl:grid-cols-5` to `grid-cols-2 sm:grid-cols-3 xl:grid-cols-6`. (3) Added 6th `CommandCard` — label "Coach Wrap-Ups", value `pendingWrapUpsCount`, sublabel "N need/s review" when count > 0 / "No pending wrap-ups" when zero, href `/director/review`, `accentColor="orange"` when count > 0 / `"default"` when zero, ClipboardList icon.

**Wrap-up count query:**
Reuses the existing `pendingWrapUpsCount` — no additional query. The count was already fetched; this sprint only surfaces it as a dedicated card.

**Review queue link:**
`/director/review` — direct link to the director review queue. No tab query params (review page does not expose URL-based tab selection).

**Empty state:**
When `pendingWrapUpsCount === 0`, the card shows value `0` with sublabel "No pending wrap-ups" and neutral accent. AcademyAlertsPanel wrap-up alert is also preserved (hidden when count is 0 via the `pendingWrapUpsCount > 0 &&` guard).

**Existing AcademyAlertsPanel alert preserved:** The existing alerts panel alert item and the "Needs Attention" aggregated count are both untouched.

**Data safety:**
- No new queries added — `pendingWrapUpsCount` was already fetched
- Read-only — zero writes, zero mutations
- No session, player, or attendance records modified
- No communications triggered
- No migrations, no schema changes

**Future Director AI Agent context:**
- `pendingWrapUpsCount` is now prominently surfaced at the top of the Director Dashboard.
- Future Director Agent answering "What needs my attention today?" can cite the wrap-up count directly from this dashboard metric.
- The CommandCard's href (`/director/review`) is the canonical navigation target for the Agent to direct the director to pending wrap-up reviews.
- The count will naturally scale: as more coaches submit wrap-ups and the director reviews them, the count drops to 0 — providing a clear "inbox zero" signal.

**Manual browser QA status:** Not yet run — dev server start required.

**TypeScript validation:** Clean — `npx tsc --noEmit`

**Known limitations:**
- The review page does not support `?tab=wrap_ups` query params — the director lands on the first tab and must click "Session Wrap-Ups" to reach the wrap-up tab. A future sprint could add URL-based tab state to the review page.
- The "Needs Attention" CommandCard still includes `pendingWrapUpsCount` in its `totalAlerts` value — this means wrap-up count is counted twice in the top command cards (once in "Needs Attention" total, once in the new "Coach Wrap-Ups" card). This is intentional: "Needs Attention" is a general signal; "Coach Wrap-Ups" is a specific actionable count.

---

## 2026-05-10 — Sprint 183: Coach Wrap-Up Director Review V1

**Sprint 182 commit verified:** `59a92e7 — Sprint 182 — Coach Session Run View V1`

**Wrap-up persistence/review architecture audit:**
- Coach wrap-up answers are persisted via `saveWrapUpDraftAction` as `proposed_actions` rows with `target_module = 'session_wrap_up_v1'`, `action_type = 'other'`, `status = 'pending_review'`. Payload type: `SessionActualDraftPayload` (`draft_type = 'session_actual_v1'`).
- Director review queue at `/director/review` already has a "Session Wrap-Ups" tab. `WrapUpDraftCard` already renders session name, date, coach name, block completion per block, changes from plan, next focus, group note, "View Session" link, decision controls (Approve/Needs Clarification/Reject), and apply controls.
- Three gaps: (1) `raw_standouts_answer` in payload — not rendered. (2) `raw_attention_answer` in payload — not rendered. (3) Group/class name — session query lacked `group_id`.
- Architecture: Option A — enhance existing `WrapUpDraftCard` and wrap-up session query in `page.tsx`.

**Files modified:**
- `src/app/director/review/WrapUpDraftCard.tsx` — Four changes: (1) Added `groupName?: string | null` to `EnrichedWrapUpDraftItem` interface. (2) Added group name to header meta row (Users icon, text-secondary). (3) Renamed "Attendance Context (raw)" → "Attendance Notes" for director-facing clarity. (4) Added "Player Standouts" field (Users icon, lime) and "Needs Attention" field (AlertTriangle, orange) to key fields grid — rendered from `payload.raw_standouts_answer` and `payload.raw_attention_answer` when present.
- `src/app/director/review/page.tsx` — Three changes in the wrap-up section: (1) Extended session select to include `group_id`. (2) After building `wrapUpSessionMap`, collected unique group_ids, queried `groups` table, built `wrapUpGroupMap` (same pattern as existing groups query at line 944). (3) Added `groupName` to `EnrichedWrapUpDraftItem` construction.

**Session context now shown:**
- Session title, date, submitting coach, group/class name (when available), block completion per block, "View Session" link

**Coach answers now shown:**
- Changes from plan, next focus, group note, attendance notes, player standouts, needs attention

**Review actions:**
- Approve, Needs Clarification, Reject — all preserved and unchanged via `WrapUpDraftDecisionControls`
- Apply Approved — preserved and unchanged via `ApplyWrapUpDraftControls`

**Data safety:**
- Read-mostly — session select and group lookup are new reads only
- No session records modified
- No player records modified
- No parent/player communication
- No migrations created or modified
- `database.types.ts` untouched

**Future Director AI Agent context:**
- `EnrichedWrapUpDraftItem` now carries `groupName` — Agent can cite class context when summarising a wrap-up.
- `raw_standouts_answer` and `raw_attention_answer` are now surfaced in the review card. Future Director Agent answering "Which players were mentioned?" or "What needs follow-up from yesterday's session?" can read these fields directly from the `proposed_actions.proposed_payload` without additional joins.
- The review card is the structured review object the Agent will use as its primary session-outcome context.

**Manual browser QA status:** Not yet run — dev server start required.

**TypeScript validation:** Clean — `npx tsc --noEmit`

**Known limitations:**
- Curriculum focus from the session template is not shown directly in the wrap-up review card. Directors can follow the "View Session" link (Sprint 181) to see the full curriculum context. Adding template curriculum inline would require passing `template_id` through the enrichment chain — deferred.
- `clarification_needed` wrap-up drafts are fetched (status filter includes it) but do not have a separate section in the UI; they appear in the pending section. A dedicated "Needs Clarification" sub-section could be added in a future sprint.

---

## 2026-05-10 — Sprint 182: Coach Session Run View V1

**Sprint 181 commit verified:** `1ea27d2 — Sprint 181 — Session Detail Curriculum Content V1`

**Coach session architecture audit:**
- `src/app/coach/sessions/[sessionId]/page.tsx` exists and is complete: auth, `academy_id` scoping, session blocks, group roster, attendance, curriculum panel, wrap-up drawer.
- `CoachSessionCurriculumPanel` exists and fetches curriculum via `template_id → template_blocks → curriculum_class_template_blocks → curriculum_content_items/drills`. Was missing `session_block_hint`, `is_coach_only`, `description`.
- `CoachSessionActions` + `CoachWrapUpDrawer` already provide a fully functional "Wrap Up Session" button — no placeholder needed.
- `session_blocks` SELECT did not include `template_block_id` — added in this sprint.
- Architecture: Option A — surgical edits to two existing files.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/page.tsx` — Three changes: (1) Added `template_block_id: string | null` to exported `SessionBlock` interface. (2) Added `template_block_id` to session_blocks `.select()` string. (3) Renamed "Before Session" section label to "Today's Plan".
- `src/app/coach/sessions/[sessionId]/CoachSessionCurriculumPanel.tsx` — Four changes: (1) Added `session_block_hint`, `is_coach_only`, `description` to `PlanItem` interface and `curriculum_content_items` join select. (2) Mapped new fields in `planBlocks` construction. (3) Removed redundant "Curriculum Lesson Plan" internal header — page section label "Today's Plan" is the single entry point. (4) Added rendering: "Internal" badge with Lock icon for `is_coach_only` items, `sessionBlockHint` as muted domain-adjacent context, `description` as `line-clamp-2` supplemental text. Empty state copy updated to "No planned focus content yet." Coach cues and success criteria preserved.

**Data path:**
`session.template_id → template_blocks.id → curriculum_class_template_blocks.block_id → curriculum_content_items / curriculum_drills`
Session blocks now carry `template_block_id` — available to future Coach AI Agent for per-block curriculum resolution.

**Wrap-up CTA:**
`CoachSessionActions` + `CoachWrapUpDrawer` are fully functional and unchanged. The prominent lime "Wrap Up Session" button and full six-question wrap-up drawer were already built. No placeholder needed.

**Data safety:**
- Read-only page — zero writes, zero mutations
- No session records modified
- No player records modified
- No parent/player communication
- No migrations created or modified
- `database.types.ts` untouched

**Future Coach AI Agent context:**
- `session_blocks.template_block_id` is now returned by the coach session page query.
- `CoachSessionCurriculumPanel` fetches and surfaces all curriculum metadata a Coach Agent would need: title, domain, `session_block_hint`, `description`, coach cues, success criteria, `is_coach_only`.
- Future Coach Agent answering "What should I focus on in block 2?" can resolve `session_blocks[1].template_block_id → curriculum_class_template_blocks → curriculum_content_items` without any additional schema changes.
- The "Today's Plan" section is the structural anchor for the Coach Agent's session context.

**Manual browser QA status:** Not yet run — dev server start required.

**TypeScript validation:** Clean — `npx tsc --noEmit`

**Known limitations:**
- Curriculum is shown before the execution section ("Today's Plan" above "Run the Session"), not inline within each execution block card. Inline integration would require refactoring `CoachSessionExecutionClient` (a client component) to accept curriculum props — deferred to a future sprint.
- `CoachSessionCurriculumPanel` fetches by `template_id → template_blocks`, not by `session_blocks.template_block_id`. Both paths resolve the same curriculum content for cleanly generated sessions. A future sprint could switch to the per-session-block path for precision (e.g., if session blocks are customized post-generation).

---

## 2026-05-10 — Sprint 181: Session Detail Curriculum Content V1

**Sprint 180 commit verified:** `b305988 — Sprint 180 — Generate Session from Template V1`

**Session detail architecture audit:**
- `session.template_id` was already fetched in the session select
- `session_blocks.template_block_id` exists in generated types (`string | null`) but was not included in the session_blocks select
- Step 14 of the page already fetched `curriculum_class_template_blocks → curriculum_content_items/drills` for `PlannedVsActualDiffPanel`, keyed by block name. The same query is extended to also key by `template_block.id` with richer fields.
- `CoachSessionCurriculumPanel` is a self-fetching Server Component designed for the coach view — not reused directly. Director page passes data as props instead.
- Architecture: Option B — new `SessionBlockCurriculumContent` component + minimal page changes.

**Files created:**
- `src/app/director/sessions/[sessionId]/SessionBlockCurriculumContent.tsx` — Pure display component. Props: `items: CurriculumItem[]`, `hasTemplateSource: boolean`. Renders content type badge, domain, session_block_hint, duration, Internal (coach-only) indicator, description. Two empty states: (1) no curriculum content for this block, (2) session not from a class template.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Four changes: (1) Added `template_block_id` to `session_blocks` select. (2) Imported `SessionBlockCurriculumContent` and `CurriculumItem`. (3) Extended step 14 CCTB select to include `description, session_block_hint, is_coach_only, duration_min`; built `curriculumByTemplateBlockId` map alongside existing `curriculumByBlockName`. (4) Rendered `SessionBlockCurriculumContent` inside each session block card, resolving items via `block.template_block_id`.

**Data path:**
`session.template_id → template_blocks.id → curriculum_class_template_blocks.block_id → curriculum_content_items / curriculum_drills`
Keyed by `template_block.id`, matched to `session_blocks.template_block_id`. No data copied or duplicated.

**Inherited content section:**
- Each block card now shows a "Planned Focus" section below exercises.
- Content items show type badge, domain, hint, duration, Internal indicator, description.
- Blocks with no curriculum content show "No curriculum content assigned to this block."
- Blocks with no `template_block_id` (not from a class template) show "Session was not generated from a class template."

**Data safety:**
- Read-only — zero writes, zero mutations
- No session records modified
- No player records modified
- No parent/player communication
- No migrations created or modified
- `database.types.ts` untouched

**Future Coach/Director AI Agent context:**
- `curriculumByTemplateBlockId` is now a structured in-memory data context for each session block.
- Future Director Agent answering "What is this session focused on?" can read this map to cite specific curriculum items per block.
- Future Coach Agent can use the same data to answer "What should I teach in block 2?" without any additional DB queries.
- The data path (session → template → curriculum) is now fully documented and exercised in the page.

**Manual browser QA status:** Not yet run — dev server start required.

**TypeScript validation:** Clean — `npx tsc --noEmit`

**Known limitations:**
- The "Source Template" link in the session meta card points to `/director/fitness/templates/[templateId]`. For sessions generated from class templates, this should point to `/director/class-templates/[templateId]`. Correcting this requires knowing the template's `track` or `category` — out of scope for this sprint.
- `CoachSessionCurriculumPanel` (coach view) is a separate component that fetches independently by `templateId`. It is not changed here; coach view retains its existing display.

---

## 2026-05-10 — Sprint 180: Generate Session from Template V1

**Sprint 179 commit verified:** `f9f22c3 — Sprint 179 — Template-to-Session Preview V1`

**Architecture audit:** Option A — use existing `generateSessionFromTemplateAction` (fitness template path) as-is. The action is schema-agnostic and handles auth, academy ownership, block copying, template_id reference, curriculum context injection, and exercise best-effort copy. Zero changes to the action.

**Files created:**
- `src/app/director/class-templates/[templateId]/GenerateSessionFromTemplateButton.tsx` — Client component: lime "Generate Session" trigger → inline expandable panel with session name, date (required), start time (optional), coach selector, notes, and optional focus gates. Calls `generateSessionFromTemplateAction`. Success state with link to created session at `/director/sessions/[id]` and "View all sessions" fallback.

**Files modified:**
- `src/app/director/class-templates/[templateId]/page.tsx` — Six changes: (1) Imported `GenerateSessionFromTemplateButton`, `CoachOption`, `GateOption`. (2) Extended profile query to fetch `display_name` for fallback coach label. (3) Added `coaches` query (academy_memberships + profiles join, same pattern as sessions/new). (4) Added `sessionCount` query (sessions with template_id = templateId, for setup guide Step 4). (5) Added `focusGates` query when curriculum level is set. (6) Added `hasSessionsFromTemplate` prop to `ClassTemplateSetupGuide`. (7) Rendered `GenerateSessionFromTemplateButton` section below Session Preview card.

**Session creation behavior:**
- Calls existing `generateSessionFromTemplateAction` which inserts `sessions` (status=planned, template_id preserved, coach assigned) and `session_blocks` (template_block_id preserved for source traceability) sequentially.
- Exercises copied best-effort from `template_block_exercises` (warning shown if migration 056 not applied).
- Curriculum content (`curriculum_class_template_blocks`) is NOT separately copied — session detail infers content via `session_blocks.template_block_id → curriculum_class_template_blocks.block_id`. This is correct V1 design; no new table needed.

**Redirect/link behavior:** Success state shows "Open planned session →" link to `/director/sessions/[generatedId]` and a secondary "View all sessions" link.

**Data safety:**
- Auth + academy membership verified before creation
- Template ownership verified (`template.academy_id = user.academy_id`)
- Coach is validated as an active member of the academy
- No player records mutated
- No parent/player communication sent
- No migrations created or modified
- `database.types.ts` untouched

**Future Director AI Agent compatibility:**
- Session generation is a named, reviewable action. Future AI agent can create a `proposed_action` with `target_module = 'session_generation'` referencing a template and date. The director reviews the draft, approves, and the system calls `generateSessionFromTemplateAction`. No changes to the action needed for this future path.

**Manual browser QA status:** Not yet run — dev server start required.

**TypeScript validation:** Clean — `npx tsc --noEmit`

**Known limitations:**
- `curriculum_class_template_blocks` rows are not separately duplicated into a `session_curriculum_blocks` table. Session detail infers curriculum content via template_block_id join. This is V1 scope.
- Exercise copy is best-effort; shows warning if migration 056 not applied to live DB.

---

## 2026-05-10 — Sprint 179: Template-to-Session Preview V1

**Goal:** Read-only preview showing how a class template's blocks and curriculum content would appear as a session plan, displayed on the template detail page before any session is created.

**Files created:**
- `src/app/director/class-templates/[templateId]/TemplateSessionPreviewCard.tsx` — Pure Server Component. Accepts `PreviewBlock[]` + `levelName`. Renders summary card (block count, estimated duration, curriculum item count, level badge), per-block list with content items, type badges, Internal lock indicator, domain/hint labels, and warning banners for blocks missing content.

**Files modified:**
- `src/app/director/class-templates/[templateId]/page.tsx` — Four changes: (1) Added `is_coach_only` to CCTB content_item select string and interface field. (2) Imported `TemplateSessionPreviewCard` and `PreviewBlock`. (3) Built `previewBlocks: PreviewBlock[]` from `blockList` + `curriculumByBlock`. (4) Rendered `<TemplateSessionPreviewCard>` in a Card above the Template Blocks section.

**Hard rules enforced:**
- No session records created or modified
- No migrations added
- No `generateSessionFromTemplateAction` called
- Read-only — zero DB writes in the preview path

**TypeScript validation:** Clean — `npx tsc --noEmit`

---

## 2026-05-10 — Sprint 178: Curriculum Content Picker QA Polish

**Sprint 177 commit verified:** `45a5a62 — Sprint 177 — Template Block Curriculum Content Picker V1`

**QA findings and fixes:**

- **`addBlockContentAction.ts`** — Added `.is('academy_id', null)` to content item verification. Previously only checked `is_active = true`; a request supplying an academy-specific content item UUID would have passed the server check. Now enforces global-only at the action level (defense-in-depth on top of the UI filter).

- **`BlockContentPickerCard.tsx`** — Six UI polish changes:
  1. Added "Curriculum Content" section label with lime item count above the assigned list
  2. Modal title updated from `"Add Content — {blockName}"` to `"Add Curriculum Content"`
  3. Added modal subtitle: `"For {blockName} — choose a drill, game, cue, or focus item."`
  4. Added in-flight spinner banner inside modal when `isPending` ("Saving…")
  5. "Add Content" button label changes to `"Updating…"` when `isPending`
  6. Remove button changed from `opacity-0` (invisible on touch devices) to `opacity-30` (subtly visible, full opacity on hover) — fixes mobile UX
  7. Footer copy updated to: "Internal planning only. Parent and player visibility is controlled separately."

**Duplicate prevention verified:** Server-side duplicate check (`block_id + content_item_id`) in `addBlockContentAction` confirmed; client-side `assignedContentIds` set filters picker list.

**Data safety verified:** Remove action only deletes the `curriculum_class_template_blocks` row by ID. `curriculum_content_items` and `template_blocks` are never touched. Audit log written for both add and remove.

**No migrations created or modified.**
**`database.types.ts` not manually edited.**
**Unrelated dirty files left untouched** (`exercise-import-dry-run-report.json`, `index.html`, migrations 053/057/058).

**Manual browser QA status:** Not performed — codespace environment has no browser. Code-level QA completed. Manual browser verification recommended before production use.

**TypeScript validation:** Clean — `npx tsc --noEmit`

---

## 2026-05-10 — Sprint 177: Template Block Curriculum Content Picker V1

**Goal:** Allow directors to manually assign and remove curriculum content items from individual class template blocks.

**Files created:**
- `src/app/director/class-templates/[templateId]/addBlockContentAction.ts` — Server Action: auth → academy ownership → block ownership → active content check → duplicate check → next order_index → INSERT one `curriculum_class_template_blocks` row + audit log
- `src/app/director/class-templates/[templateId]/removeBlockContentAction.ts` — Server Action: auth → academy ownership via template join → DELETE one `curriculum_class_template_blocks` row by ID + audit log
- `src/app/director/class-templates/[templateId]/BlockContentPickerCard.tsx` — Client component per block: assigned content list with hover-reveal remove buttons; "Add Content" dashed button opens a Modal picker with title search, content_type filter, domain filter, and per-item add buttons; duplicate prevention via assigned ID set; `router.refresh()` after each mutation

**Files modified:**
- `src/app/director/class-templates/[templateId]/page.tsx` — Added `content_item_id` and `drill_id` to CCTB select + interface; fetches all global active curriculum content items (47 Orange 1 rows); passes per-block assigned items and full available list to `BlockContentPickerCard`; Template Blocks section is now interactive

**No migrations created or modified.**
**`database.types.ts` not manually edited.**
**TypeScript validation:** Clean — `npx tsc --noEmit`

---

## 2026-05-10 — Sprint 176: Apply Migrations 062 + 063 and Regenerate Types

No new app code. No destructive commands. No production apply. No unrelated files touched.

**Context:** Migrations 062 and 063 were applied manually to DEV via the Supabase Dashboard SQL Editor. Two bugs in migration 063 were discovered and fixed before the migration ran successfully.

**DEV project ref:** `dbjjhhxdkpdreytsozlq`

**Migration 062 applied:** `supabase/migrations/062_class_template_content_junction.sql`

**New table:** `curriculum_class_template_blocks` — junction between `template_blocks` and `curriculum_content_items` / `curriculum_drills`. Enforces exactly-one-source CHECK constraint. RLS: staff read (scoped via template → academy), director/head coach manage.

**Columns:** `id`, `template_id`, `block_id`, `content_item_id`, `drill_id`, `order_index`, `notes`, `duration_min`, `created_at`, `updated_at`

**Migration 063 applied:** `supabase/migrations/063_orange1_foundation_content_seed.sql`

**Seed result:** `orange1_seed_count = 47` rows in `curriculum_content_items` (global, `academy_id = NULL`)

**Two bugs fixed before migration 063 ran successfully:**

1. **UTF-8 em-dash encoding** (`commit 823ec68`): 76 em dashes (U+2014, bytes E2 80 94) inside PL/pgSQL single-quoted string literals were misinterpreted by the Supabase Dashboard SQL Editor, breaking string boundaries. Replaced all 76 with ` -` (space-hyphen).

2. **PostgreSQL backslash-apostrophe escaping** (`commit 0e9e4a8`): 25 occurrences of `\'` throughout the DO block were invalid under PostgreSQL `standard_conforming_strings = on` (Supabase default). Replaced all 25 with `''` (SQL standard doubled-apostrophe).

**Types regenerated from DEV schema.**

**`curriculum_class_template_blocks` verified in types** — all 10 columns present with correct nullability and foreign key relationships.

**Migration 061 fields verified still present on `curriculum_content_items`:** `ball_level`, `domain`, `is_coach_only`, `is_parent_visible`, `is_player_visible`, `session_block_hint`.

**Note:** IDE plugin (`<claude-code-hint>` tag) was injected at end of generated file. Removed before TypeScript check.

**Files created:**
- `supabase/migrations/062_class_template_content_junction.sql` — new junction table (untracked, applied to DEV)
- `supabase/migrations/063_orange1_foundation_content_seed.sql` — Orange 1 content seed (two bug-fix commits)

**Files modified:**
- `src/lib/supabase/database.types.ts` — regenerated from DEV schema; 11,633 lines (was 11,559 prior to this sprint)
- `docs/CHANGELOG.md` — this entry

**TypeScript validation:** Clean — `npx tsc --noEmit`

---

## 2026-05-10 — Sprint 174: Curriculum Content Taxonomy Migration 061

No new app code. No destructive commands. No production apply. No unrelated files touched.

**Context:** Migration 061 was applied manually to DEV via the Supabase Dashboard SQL Editor (codespace environment lacks Supabase CLI configuration, psql, and DATABASE_URL). Types were then regenerated from the live DEV schema via `npx supabase gen types typescript --project-id dbjjhhxdkpdreytsozlq`.

**DEV project ref:** `dbjjhhxdkpdreytsozlq`

**Migration applied:** `supabase/migrations/061_curriculum_content_taxonomy.sql`

**Schema changes verified via regenerated types — all 6 columns now present on `curriculum_content_items`:**
- `ball_level: string | null` — CHECK (red, orange, green, yellow, any), nullable
- `domain: string | null` — CHECK (Technical, Tactical, Movement, Competition, Mentality, Fitness, Recovery, Lifestyle, Games, Assessment), nullable
- `is_coach_only: boolean` — NOT NULL DEFAULT false
- `is_parent_visible: boolean` — NOT NULL DEFAULT false
- `is_player_visible: boolean` — NOT NULL DEFAULT false
- `session_block_hint: string | null` — CHECK (Warm-Up, Focus, Train, Play, Game, Situational, Match-Play, Assessment, Cool-Down), nullable

**content_type CHECK constraint:** Expanded from original 9 values to 23 values (added: tactical_game, situational, match_play_theme, mental_skill, competition_behavior, coach_cue, success_criteria, success_criteria_item, progression, regression, player_mission, parent_guidance, level_gate_support).

**Indexes added (7):**
`idx_curriculum_content_items_content_type`, `_domain`, `_session_block_hint`, `_ball_level`, `_player_visible` (partial), `_parent_visible` (partial), `_lesson_plan` (composite: level_id + domain + content_type WHERE is_active).

**No row data modified.** No new tables. No junction tables.

**Note:** An IDE plugin (`<claude-code-hint>` tag) was injected at the end of the generated file. Removed before TypeScript check.

**Files modified:**
- `src/lib/supabase/database.types.ts` — regenerated from DEV schema; 11,559 lines (was 9,636 prior to this sprint)
- `docs/CHANGELOG.md` — this entry

**TypeScript validation:** Clean — `npx tsc --noEmit`

---

## 2026-05-10 — Sprint 173 Polish: Placement QA Fixes

No migrations. No schema changes. No parent/player portal. No billing. No parent communication. No new features.

**Context:** Sprint 173 QA static analysis (Bugs #2–6) identified polish and defense-in-depth issues after Bug #1 was committed separately.

**Bug #2 — Confidence display (PlacementEntryCard):** `confidenceScore` is stored as a decimal (0.8, 0.5, 0.2). Was displaying as "0.8%" — now displays as "80%", "50%", "20%" via `Math.round(score * 100)`. Null renders "—" unconditionally.

**Bug #3 — Player ownership check (setCurriculumLevelAction):** Action verified user academy membership and level validity but did not confirm the target player belongs to the same academy before calling the RPC. Added explicit `.eq('academy_id', academyId)` check on `players` table before any write.

**Bug #4 — Draft source label (DevelopmentSummaryDraftCard):** Placement-seeded drafts showed "from N observations" — misleading since `source_observation_count` is a count of non-null placement fields, not coach observations. Now reads `payload.generated_from`: shows "from placement assessment" if `'placement_seed'`, otherwise preserves "from N observation(s)".

**Bug #5 — Footer copy (FirstDevelopmentContextCard):** "Next: assign curriculum level from Skill Path" was stale after Sprint 172B added an Overview bridge. Now shows "assign curriculum level above or via the Skill Path tab" when `!hasCurriculum`, and "review first development priorities and confirm the player's first 2–3 sessions" when `hasCurriculum`.

**Bug #6 — Command center copy (page.tsx):** "Use the Skill Path tab to get started" was stale after the Overview bridge was added. Now reads "Use the assignment card on the Overview tab or the Skill Path tab to get started."

**Files modified:**
- `src/app/director/players/[playerId]/PlacementEntryCard.tsx` — Bug #2: decimal → percentage confidence display
- `src/app/director/players/[playerId]/setCurriculumLevelAction.ts` — Bug #3: player academy ownership check before RPC
- `src/app/director/review/DevelopmentSummaryDraftCard.tsx` — Bug #4: placement-seeded draft label
- `src/app/director/players/[playerId]/FirstDevelopmentContextCard.tsx` — Bug #5: footer copy
- `src/app/director/players/[playerId]/page.tsx` — Bug #6: command center missing-curriculum copy
- `docs/CHANGELOG.md` — This entry

**TypeScript validation:** Clean — `npx tsc --noEmit`

---

## 2026-05-09 — Sprint 172B: Placement → Curriculum Level Assignment Bridge

No migrations. No new assignment action. No level movement logic. No requirement completion. No evidence creation. No parent/player visibility. No billing. No parent communication.

**Goal:** Surface the existing curriculum level picker directly on the Overview tab for players who have no `player_curriculum_states` row. Closes the last blocking gap from the Sprint 168–171 placement pipeline.

**Existing infrastructure reused (no changes to these files):**
- `setCurriculumLevelAction.ts` — auth + academy + role + level verification + `assign_player_curriculum_state` RPC + `revalidatePath`
- `CurriculumLevelPickerCard.tsx` — stage-grouped level selector, save button, success/error states

**Schema path used:**
- `assign_player_curriculum_state` RPC (migration 038): upserts `player_curriculum_states.current_level_id`, seeds `player_domain_progress` rows at `status = 'not_started'` (scaffolding only — not completed evidence)
- `players.current_level_id` remains NULL — Skill Path reads from `player_curriculum_states`, not `players` directly

**Files created:**
- `src/app/director/players/[playerId]/PlacementCurriculumBridgeCard.tsx` — Server component: explanatory callout (copy, internal-only note, guardrail) + `CurriculumLevelPickerCard`. Shown on Overview tab when `!hasCurriculum && allCurriculumLevels.length > 0`. Disappears after assignment.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Import and render `PlacementCurriculumBridgeCard` in `overviewSlot` left column; pass `hasCurriculum` to `FirstDevelopmentContextCard`
- `src/app/director/players/[playerId]/FirstDevelopmentContextCard.tsx` — Add `hasCurriculum: boolean` prop; hide orange warning when `hasCurriculum` is true; update copy to reference "assignment card below"
- `docs/PILOT_PLACEMENT_FLOW_QA.md` — Added Step 12 (7 sub-checks); updated Known Limitation #4; updated remaining pipeline header
- `docs/CHANGELOG.md` — This entry

**TypeScript validation:** Clean — `npx tsc --noEmit`

---

## 2026-05-09 — Sprint 171: Seed Development Summary from Placement

No migrations. No direct writes to `player_development_summary`. No player record mutations. No curriculum level assignment. No parent/player portal. No billing. No parent communication. No AI generation.

**Goal:** Bridge the placement pipeline to the development summary pipeline. Directors can now seed a reviewable development summary draft from existing placement recommendation data without waiting for coach observations.

**Existing pipeline reused:**
- `target_module = 'development_summary_draft_v1'` (unchanged)
- `draft_type = 'development_summary_draft_v1'` (unchanged)
- Draft appears automatically in Director Review Queue → Development Summaries tab (no new tab)
- Apply path: `applyApprovedSummaryDraftAction` (unchanged) — only path that writes `player_development_summary`

**Files created:**
- `src/app/director/players/[playerId]/draftDevelopmentSummaryFromPlacementAction.ts` — Server action: auth + academy + role + player verify, duplicate check, finds executed `placement_recommendation_draft` by `created_player_id`, creates `voice_commands` FK row + `development_summary_draft_v1` proposed_action with `generated_from: 'placement_seed'`

**Files modified:**
- `src/app/director/players/[playerId]/FirstDevelopmentContextCard.tsx` — Added `'use client'`, `playerId: string` prop, "Draft Development Summary from Placement" button with loading/success/error/already-exists states
- `src/app/director/players/[playerId]/page.tsx` — Pass `playerId={params.playerId}` to `FirstDevelopmentContextCard`
- `src/app/director/players/[playerId]/draftSummaryUpdateAction.ts` — Extended `generated_from` union to `'recent_observations' | 'placement_seed'`; added optional `source_proposed_action_id?: string` and `internal_notes?: string` to `DevelopmentSummaryDraftPayload`
- `docs/PILOT_PLACEMENT_FLOW_QA.md` — Added Step 11 (7 sub-checks); updated Known Limitation #5; updated remaining pipeline header
- `docs/CHANGELOG.md` — This entry

**TypeScript validation:** Clean — `npx tsc --noEmit`

---

## 2026-05-09 — Sprint 170: New Player First Development Profile

Display-only sprint. No database writes, no migrations, no player record mutations, no parent/player portal, no billing, no parent communication.

**Goal:** Make the new player profile useful on Day 1 by surfacing placement recommendation context that would otherwise be invisible after the proposed_action is executed.

**Data source:** The executed `proposed_actions` row for `target_module = 'placement_recommendation_draft'` contains the full recommendation payload. Linked via `proposed_payload.created_player_id === params.playerId`. Fetches up to 20 executed rows and filters client-side — safe at pilot scale.

**No migration required.**

**Created `src/app/director/players/[playerId]/FirstDevelopmentContextCard.tsx`:**
- Read-only, internal-only card shown above Development Summary in the Overview tab left column.
- Shows: Starting Pathway, First Skill Priority, Suggested Group Type, Assigned Group, Confidence.
- Shows: Assessment evidence expander (age band, ball color, skill observations, movement observations, competitive readiness) — all gracefully omitted if null.
- Orange warning badge: "Curriculum level not assigned yet. Assign from Skill Path."
- Safety copy: "Internal director/coach context. Not shown to parents or players."
- Next step prompt at bottom.
- Renders nothing if no executed placement draft exists for this player (null guard in page.tsx).

**Modified `src/app/director/players/[playerId]/page.tsx`:**
- Added `FirstDevelopmentContextCard` and `FirstDevContextData` import.
- Added Sprint 170 query block: fetches executed `placement_recommendation_draft` proposed_actions for this academy, filters for `created_player_id === params.playerId`, extracts payload into `FirstDevContextData`.
- Renders `FirstDevelopmentContextCard` in left column above `DevelopmentProfileSummaryCard`.

**Modified `docs/PILOT_PLACEMENT_FLOW_QA.md`:**
- Added Step 10 — Sprint 170 verification (5 sub-checks: card appearance, internal copy, absent for non-placed players, no mutation confirmation, data source SQL).
- Added Known Limitation #5: `player_development_summary` not written at placement.

**TypeScript:** Clean.

---

## 2026-05-09 — Sprint 169: Approved Placement → Group Assignment Verification + Player Profile Entry Point

Verification + entry-point sprint. No new database tables or migrations. No parent/player portal, no billing, no parent communication.

**What was verified:**
- `finalize_player_placement()` confirmed to: close existing group_memberships, INSERT new group_memberships (is_current = true), UPDATE players.status = 'active' + current_group_id, UPDATE placement_recommendations.status = 'activated', INSERT audit_log entry (player.placement.finalized).
- Review queue automatically hides executed placement recommendation cards (status filter: `pending_review | approved` only).
- "View Player Profile →" link on the review card points to `/director/players/{playerId}` — correct, no change needed.
- Coach session roster queries `group_memberships WHERE is_current = true AND group_id = session.group_id` — newly placed player appears naturally in future sessions for their group.

**Known limitation documented:** `current_level_id` will be NULL after placement. Sprint 168 does not set `recommended_level_id` on the `placement_recommendations` row, so `finalize_player_placement()` cannot derive a level. Director must assign via the Skill Path tab.

**No migration required.**

**Created `src/app/director/players/[playerId]/PlacementEntryCard.tsx`:**
- Read-only, internal-only card showing placement origin context.
- Displays: assigned group name, activation date, player status, confidence score, placement recommendation ID.
- Shows four confirmed guardrails: no portal access, no billing, no parent comms, activated via finalize_player_placement().
- Notes curriculum level limitation at bottom.
- Renders only when a placement_recommendations row exists for the player (null guard in page.tsx).

**Modified `src/app/director/review/PlacementRecommendationDraftCard.tsx`:**
- Expanded post-success state after player creation to show full finalization confirmation.
- Lists five confirmed outcomes: players.status active, group assigned, group_memberships created, placement_recommendations activated, audit log written.
- Adds "Guardrails confirmed" section: no portal, no billing, no comms.
- Documents curriculum level limitation inline.
- "View Player Profile →" link unchanged — already correct.

**Modified `src/app/director/players/[playerId]/page.tsx`:**
- Added import for PlacementEntryCard and PlacementEntryData.
- Added placement query block: fetches most recent `placement_recommendations` row for this player (scoped to academy_id), then resolves group name from `groups`.
- Renders PlacementEntryCard in the right sidebar of the Overview tab, after PlayerPortalLinkPanel.

**Modified `docs/PILOT_PLACEMENT_FLOW_QA.md`:**
- Added Step 9 — full verification checklist for post-placement outcome (9 sub-checks: player row, group_memberships, placement_recommendations, proposed_action executed, audit logs, player profile link, review queue cleared, coach roster path, guardrails).
- Added current_level_id NULL limitation to Known Limitations.
- Fixed known limitations numbering (1–9).
- Updated "Sprint 169+ remaining pipeline" header to "Sprint 170+".

**TypeScript:** Clean.

---

## 2026-05-09 — Sprint 168: Approved Placement → Player Profile Creation

Implements the director-triggered player creation step at the end of the placement pipeline. After a recommendation draft is approved, the director sees a "Create Player Profile" button on the recommendation card. Clicking it creates the `players` row, `placement_recommendations` row, calls `finalize_player_placement()`, marks the `proposed_actions` row `executed`, and writes an audit log entry. An idempotency guard writes `created_player_id` into the payload immediately after player INSERT to block duplicate creation on retry. On success, a lime success panel appears with a link to the new player profile.

**No migration required.**

**Updated `src/app/director/review/actions.ts`:**
- Added `CreatePlayerResult` interface: `{ ok, error, playerId, placementRecommendationId }`.
- Added `mapConfidenceScore(confidence)` helper: `high → 0.8`, `medium → 0.5`, `low → 0.2`.
- Added `createPlayerFromApprovedRecommendationAction(recommendationDraftId)`:
  - Auth check (user, profile, academyId via `profiles` + role via `academy_memberships`).
  - Role guard: `academy_director` or `head_coach` only.
  - Fetches `proposed_actions` row; rejects if already `executed` or not `approved`.
  - Idempotency guard: rejects if `payload.created_player_id` already set.
  - Validates `player_identity.first_name`, `last_name`, `date_of_birth` (NOT NULL guard) and `recommended_group_id`.
  - Server-verifies group: `groups WHERE id = ? AND academy_id = ? AND is_active = true`.
  - Inserts `players` row (`status = 'pending_placement'`, `gender` cast to enum).
  - Immediately writes `created_player_id` to payload (idempotency stamp before RPC).
  - Builds `recommendation_rationale` from payload fields (level, pathway, skill priority, group type, observations).
  - Inserts `placement_recommendations` row (`status = 'approved'`, `confidence_score` from `mapConfidenceScore`).
  - Calls `finalize_player_placement(p_recommendation_id, p_activator_id)` RPC.
  - On RPC failure: returns partial-failure error with player ID so director can contact support.
  - On success: updates `proposed_actions.status = 'executed'` with finalization metadata and guardrail flags.
  - Writes audit log: `action = 'placement_recommendation.player_created'`.

**Updated `src/app/director/review/PlacementRecommendationDraftCard.tsx`:**
- Added `created_player_id?: string | null` to `PlacementRecommendationDraftPayload` type.
- Added `UserCheck` icon import from lucide-react.
- Added `createPlayerFromApprovedRecommendationAction` to action imports.
- Added `isCreatingPlayer` and `createPlayerResult` state.
- Added `handleCreatePlayer()` function: calls server action, sets result state.
- Added "Create Player Profile" button section — visible only when `isApproved && !payload.created_player_id`.
- Added success panel: lime checkmark + "View Player Profile →" link to `/director/players/{playerId}` — shown when `createPlayerResult.ok` or `payload.created_player_id` is set.
- Error from `createPlayerResult.error` displayed inline below button.

**Updated `docs/PILOT_PLACEMENT_FLOW_QA.md`:**
- Pipeline diagram updated: `⚠️ Sprint 168+ — Player creation (not yet built)` → `✅ Sprint 168 — Director clicks "Create Player Profile" → player activated`.
- Step 8 added: full QA walkthrough with SQL verification queries for `players`, `placement_recommendations`, `proposed_actions` (executed), and `audit_logs`.
- Known Limitation 1 updated: "Player creation not built" → RESOLVED (Sprint 168) with idempotency guard description.
- Guardrails checklist updated: pipeline-stages note updated to reflect Sprint 168 implementation.

**Guardrails confirmed:** No migrations. No schema changes. No billing. No parent/player communications. No external API calls. Academy-scoped group verification on server. `finalize_player_placement()` called as the sole activation path. Audit log written. TypeScript clean.

---

## 2026-05-09 — Sprint 168A: Placement Identity + Group Selection Unblocker

Unblocks Sprint 168 (player creation) by adding required player identity fields and a real academy group selector to the placement assessment and recommendation pipeline. No player rows, group_membership rows, billing records, or parent communications are created by this sprint. No migrations or schema changes.

**No migration required.**

**Updated `src/app/director/review/PlacementAssessmentDraftCard.tsx`:**
- Added `player_identity` block to `PlacementAssessmentDraftPayload` type (optional for backwards compatibility with existing drafts).
- Added four identity fields to the assessment form: First Name (text), Last Name (text), Date of Birth (`<input type="date">`, YYYY-MM-DD), Gender (select: male/female/other/blank).
- Pre-populates First Name and Last Name from `attendee_name` (splits on first space) when no saved identity exists.
- Inline warning panel explains that `players.date_of_birth` is NOT NULL and identity is required before recommendation generation.
- Identity fields are passed to `saveAssessmentDraftAction` and persisted in the payload on every save.

**Updated `src/app/director/review/PlacementRecommendationDraftCard.tsx`:**
- Added `AcademyGroup`, `recommended_group_id`, `recommended_group_name`, `player_identity` to `PlacementRecommendationDraftPayload` type.
- Added `academyGroups: AcademyGroup[]` prop (array of `{ id, name, track }` fetched from `groups` table).
- Added real group selector dropdown populated from academy's active groups. Client-side blocks approve if no group selected.
- Displays read-only `player_identity` summary (name, DOB, gender) from payload. Shows orange warning if identity is missing.
- Shows assigned group (lime highlight) on approved cards. Hides decision controls after approval.
- Override form includes its own group selector.
- Footer copy updated: "Approving does not create a player yet. It prepares this recommendation for the next step: player creation."
- Discriminated union `activeAction` preserved for correct per-button loading state.

**Updated `src/app/director/review/actions.ts`:**
- Exported `PlayerIdentity` interface: `{ first_name, last_name, date_of_birth, gender }`.
- Added `player_identity: PlayerIdentity` to `AssessmentDraftFields` interface.
- `saveAssessmentDraftAction` — merges `player_identity` into payload on every save.
- `generatePlacementRecommendationDraftAction` — validates `first_name`, `last_name`, `date_of_birth` before generating. Returns clear error if missing. Carries `player_identity` into recommendation payload. Adds `recommended_group_id: null`, `recommended_group_name: null` as initial values.
- `approveRecommendationDraftAction` — new params: `selectedGroupId`, `selectedGroupName`. Validates `player_identity` in payload. Server-side verifies `selectedGroupId` against `groups WHERE academy_id = ? AND is_active = true`. Merges verified `recommended_group_id` + `recommended_group_name` into payload before setting `status = approved`. Audit log includes group fields.
- `RecommendationOverrideFields` — added `recommended_group_id` and `recommended_group_name` fields.
- `overrideRecommendationDraftAction` — validates `recommended_group_id`. Server-side verifies group belongs to academy. Merges verified group into payload. `player_identity` preserved via spread.

**Updated `src/app/director/review/page.tsx`:**
- Fetches academy groups: `SELECT id, name, track FROM groups WHERE academy_id = ? AND is_active = true ORDER BY name`.
- Passes `academyGroups` prop to every `PlacementRecommendationDraftCard`.
- Imports `AcademyGroup` type.

**Updated `docs/PILOT_PLACEMENT_FLOW_QA.md`:**
- Known Limitations 2 and 3 updated: marked RESOLVED (Sprint 168A), with description of what was added and how validation works.

**Guardrails confirmed:** No migrations. No schema changes. No player rows. No group_membership rows. No billing. No parent/player communications. No external API calls. Academy-scoped group validation on server for both approve and override paths. Audit log written on approval. TypeScript clean.

---

## 2026-05-09 — Sprint 172: Pilot Placement Flow QA Guide

Creates `docs/PILOT_PLACEMENT_FLOW_QA.md` — a complete end-to-end reference for QA testing the unexpected-attendee → placement pipeline. Covers all 7 currently-implemented steps with SQL verification queries and known limitations. Includes explicit documentation of the Sprint 168 blocker (player creation not yet built).

**No code changes. Documentation only.**

**Contents:**
- Pipeline overview diagram (text)
- Step-by-step QA path: coach wrap-up → attendance exception → placement review → intake candidate → assessment draft → recommendation draft → approval
- SQL verification queries for every stage
- Known limitations section (6 items): player creation not built, date_of_birth required, group_id required, dismiss is permanent, no follow-up expiry, rough confidence algorithm
- Guardrails verification checklist with SQL audit queries

---

## 2026-05-09 — Sprint 167: Recommendation Review + Override

Adds Approve / Override / Reject controls to `PlacementRecommendationDraftCard`. Directors can now act on a generated recommendation. Approving does NOT create a player — that is the next explicit step (Sprint 168). Override shows an inline form to edit all four recommendation fields plus override notes.

**No migration required.**

**New server actions (`src/app/director/review/actions.ts`):**
- `approveRecommendationDraftAction` — verifies auth + role + module + status. Sets status to `approved`. Writes `placement_recommendation_draft.approved` to `audit_logs`.
- `rejectRecommendationDraftAction` — sets status to `rejected`. Writes `placement_recommendation_draft.rejected` to `audit_logs`. No player created.
- `overrideRecommendationDraftAction` — validates required fields (current_level, starting_pathway). Merges override fields into payload, sets `director_overridden: true`, sets status to `approved`. Writes `placement_recommendation_draft.overridden_and_approved` to `audit_logs`.

**Updated `PlacementRecommendationDraftCard.tsx`** (now a `'use client'` component):
- Three controls: "Approve Recommendation" (primary lime), "Override" (ghost — toggles inline form), "Reject" (ghost/danger).
- Override form: four text inputs (current_level, starting_pathway, suggested_group_type, first_skill_priority) + override notes textarea, pre-filled with current payload values.
- `activeAction: 'approve' | 'reject' | 'override'` discriminated union for correct loading state per button.
- Success flash with action-specific message: Approve clearly states "Player creation is the next explicit step."
- Approved cards remain visible (status filter now includes `approved`) so directors see the full funnel state before Sprint 168 is built.

**Updated `src/app/director/review/page.tsx`:**
- Recommendation fetch now includes `in('status', ['pending_review', 'approved'])`.
- Split into `pendingRecommendationDrafts` and `approvedRecommendationDrafts` for badge display; all items still rendered via `allEnrichedRecommendationDrafts`.
- Recommendation section header shows separate orange (pending) and lime (approved) count badges.

**Guardrails confirmed:** No migrations. No schema changes. No player/roster/billing/comms. Audit log written on every action. TypeScript clean.

---

## 2026-05-09 — Sprint 166: Placement Recommendation Draft V1

Adds deterministic placement recommendation generation from a completed assessment draft. No AI, no external API calls. The recommendation is derived from the assessment fields using pure rule-based logic. Director must approve before any player record is created.

**No migration required.**

**New server action (`src/app/director/review/actions.ts`):**
- `generatePlacementRecommendationDraftAction` — derives recommendation fields deterministically: `current_level` (from ball_color), `starting_pathway` (from ball_color + age_band), `first_skill_priority` (keyword scan on skill_observations), `suggested_group_type` (keyword scan on competitive_readiness), `confidence` (low/medium/high based on how many fields are filled). Creates `placement_recommendation_draft_v1` proposed_actions row (`risk_level: 'high'`). Marks assessment as `executed`. Writes `placement_assessment_draft.recommendation_generated` to `audit_logs`. No player, no roster, no billing, no parent comms.

**New component (`src/app/director/review/PlacementRecommendationDraftCard.tsx`):**
- Read-only display card (approval controls come in Sprint 167) showing: current_level, starting_pathway, suggested_group_type, first_skill_priority in a 2×2 grid, confidence pill (green/orange/red), collapsible assessment summary, safety badges, "Awaiting Approval" status badge.
- Note to director: "Sprint 167 will add Approve / Override / Reject controls."

**Updated `src/app/director/review/PlacementAssessmentDraftCard.tsx`:**
- Added `useRouter` and `generatePlacementRecommendationDraftAction` import.
- "Generate Placement Recommendation" primary lime button below the Save button. Tracks `activeAction: 'save' | 'generate'` for correct loading state on each button independently.
- On success: `router.refresh()` unmounts the assessment card (it's now `executed`) and the recommendation draft appears in the section below.

**Updated `src/app/director/review/page.tsx`:**
- Fetches `placement_recommendation_draft` rows, extracts session_id from payloads, batch-fetches sessions.
- Added "Placement Recommendations — Awaiting Approval" section at the bottom of the Intake Candidates tab.
- `recommendationDraftCount` added to: PageHeader prop/type/destructuring, Operations group `CategoryRow` ("Recommendation"), `totalPending` sum, tab badge, `oldestPendingDates`, all-caught-up check.

**Guardrails confirmed:** No migrations. No schema changes. No AI/external calls. No player/roster/billing/comms. Audit log written on generation. TypeScript clean.

---

## 2026-05-09 — Sprint 165: Placement Assessment Draft V1

Adds an inline-editable assessment draft stage to the placement intake pipeline. When a director clicks "Start Placement Assessment" on an intake candidate, it creates a `placement_assessment_draft_v1` proposed_actions row and moves the candidate to `executed`. The assessment card appears in the "Placement Assessments In Progress" section of the Intake Candidates tab.

**No migration required.**

**New server actions (`src/app/director/review/actions.ts`):**
- `startPlacementAssessmentDraftAction` — verifies auth + role, fetches intake candidate, creates `voice_commands` FK row, creates `placement_assessment_draft_v1` proposed_actions row, marks intake candidate as `executed`, writes `placement_intake_candidate.assessment_started` to `audit_logs`.
- `saveAssessmentDraftAction` — verifies auth + role + module. Updates `proposed_payload` fields (age_band, ball_color, skill_observations, movement_observations, competitive_readiness, recommended_next_step) using a merge patch. No status change. Returns `{ ok, error }`.

**New component (`src/app/director/review/PlacementAssessmentDraftCard.tsx`):**
- Controlled form with: Age Band (select from 7 options), Ball Color (select Red/Orange/Green/Yellow), Skill Observations (textarea), Movement Observations (textarea), Competitive Readiness (textarea), Recommended Next Step (textarea).
- "Save Assessment Draft" button with loading state + inline success/error feedback. No page refresh on save.
- Safety notice: "No player profile, billing record, or parent account is created by saving."
- Exports `PlacementAssessmentDraftPayload` and `EnrichedAssessmentDraftItem`.

**Updated `src/app/director/review/PlacementIntakeCandidateCard.tsx`:**
- Replaced dashed placeholder with "Start Placement Assessment" primary lime button (same pattern as Placement Review intake button).
- `activeAction` discriminated union now covers `'assess' | 'dismiss'`.
- Success flash message is action-specific.

**Updated `src/app/director/review/page.tsx`:**
- Fetches `placement_assessment_draft` rows, extracts `session_id` from payloads, batch-fetches sessions.
- Intake Candidates tab now has two sections: "Pending Intake Candidates" and "Placement Assessments In Progress".
- `assessmentDraftCount` added to: PageHeader prop/type/destructuring, Operations group `CategoryRow` ("In Assessment"), `totalPending` sum, tab badge, `oldestPendingDates`, all-caught-up check.

**Guardrails confirmed:** No migrations. No schema changes. No player/roster/billing/comms. Audit log written on assessment start. TypeScript clean.

---

## 2026-05-09 — Sprint 164: Placement Intake Candidate Dismiss Action

Adds a "Dismiss Candidate" action button to each intake candidate card. Dismissed candidates are set to `rejected` status and removed from the queue. Also adds a placeholder slot for "Start Placement Assessment" (Sprint 165). No player, roster, billing, or parent comms are created.

**No migration required.**

**New server action (`src/app/director/review/actions.ts`):**
- `dismissIntakeCandidateAction` — verifies auth, academy scope, role (director/head_coach), and `target_module === 'placement_intake_candidate'`. Sets status to `rejected`. Writes `placement_intake_candidate.dismissed` to `audit_logs`. Returns `{ ok, error }`.

**Updated `src/app/director/review/PlacementIntakeCandidateCard.tsx`:**
- Now a `'use client'` component with `useTransition` + `useRouter` (same pattern as `PlacementReviewCard`).
- Dismiss button with loading state and success card flash before `router.refresh()`.
- Dashed placeholder for "Start Placement Assessment" (replaced in Sprint 165).
- Dismiss microcopy: "Marks this candidate as dismissed. No player record is created."

**Guardrails confirmed:** No migrations. No schema changes. No player/roster/billing/comms. Audit log written on dismiss. TypeScript clean.

---

## 2026-05-09 — Sprint 163: Surface Placement Intake Candidates

Surfaces `placement_intake_candidate_v1` proposed_actions rows in the Director Review Queue as a new "Intake Candidates" tab. These items are created when a director chooses "Start Placement Intake" from the Placement Review tab. No player, roster, billing, or parent comms have been created at this stage.

**No migration required.** Display-only sprint — reads existing `proposed_actions` rows, no new mutations.

**New component (`src/app/director/review/PlacementIntakeCandidateCard.tsx`):**
- Read-only display card showing: attendee name, "Pending Intake" badge, source session context, coach note, four safety badges (No player record / No roster entry / No billing / No parent comms), and safety notice microcopy.
- No action buttons in this sprint (Sprint 164 adds Dismiss and further assessment controls).
- Exports `PlacementIntakeCandidatePayload` and `EnrichedIntakeCandidateItem` types.

**Updated `src/app/director/review/page.tsx`:**
- Fetches `proposed_actions` where `target_module = 'placement_intake_candidate'`, `status = 'pending_review'`, filtered to `draft_type === 'placement_intake_candidate_v1'`.
- Extracts `session_id` from each payload (not `target_object_id`, which is `academyId`); batch-fetches session names for source session context.
- New "Intake Candidates" tab trigger between Placement Review and Player Observations.
- New `placement_intake` tab content with EmptyState and card list.
- `intakeCandidateCount` added to: PageHeader prop/type/destructuring, Operations group `CategoryRow`, `totalPending` sum, `defaultTab` logic, `oldestPendingDates`, all-caught-up check.

**Guardrails confirmed:** No migrations. No schema changes. No mutations in this sprint. No player/roster/billing/comms. TypeScript clean.

---

## 2026-05-09 — Sprint 162: Placement Review → Player Onboarding Bridge

Turns Placement Review follow-ups into a clear, director-controlled onboarding bridge. Before this sprint, the only action was "Mark Reviewed" — an ambiguous dismiss. Directors now see three explicit decision controls with microcopy for each.

**No migration required.** `proposed_actions` is the safe bridge — no new tables created.

**New server actions (`src/app/director/review/actions.ts`):**
- `startPlacementIntakeFromReviewAction` — creates a `placement_intake_candidate_v1` proposed_actions row, marks the original `placement_review` item as `executed`, writes `placement_review.intake_started` to `audit_logs`. No player, no group_membership, no billing, no parent comms created.
- `markPlacementReviewFollowUpLaterAction` — sets status to `clarification_needed`, writes `placement_review.follow_up_later` to `audit_logs`. Item stays visible in the Follow-Up Later section but no longer counts as pending.

**Updated `PlacementReviewCard.tsx`:**
- Replaced single "Mark Reviewed" button with three director decision controls: **Start Placement Intake** (primary lime), **Follow-Up Later** (ghost), **Not a Fit / Dismiss** (ghost/danger).
- Each button shows a loading state keyed to the specific action in flight.
- Microcopy clearly states: "Starting intake does not create a player, roster assignment, billing record, or parent account."
- Separate card mode for `status === 'clarification_needed'` items: read-only info display with "Follow-Up Later" badge — no action buttons (Sprint 163 will add "Move back to Review" if needed).
- All 10 hard rules enforced: no player, no roster, no billing, no parent comms.

**Updated `src/app/director/review/page.tsx`:**
- Placement review fetch now includes `clarification_needed` status (Follow-Up Later items).
- Split into `pendingPlacementReviews` and `followUpPlacementReviews`.
- Tab badge, PageHeader count, defaultTab logic, and all-caught-up check all use `pendingPlacementReviews.length` only — follow-up items don't inflate the urgent pending count.
- Placement Review tab now shows a "Follow-Up Later" section when follow-up items exist.

**Guardrails confirmed:** No migrations. No schema changes. No player/roster/billing/comms mutations. Audit log written on every action. TypeScript clean.

---

## 2026-05-09 — Sprint 161: Coach Attendance Flow Clarity Pass

Clarity sprint. Pre-implementation audit (10-point checklist) confirmed the roster attendance write-back already worked end-to-end before this sprint: `CoachSessionExecutionClient` renders P/A/L/E buttons per rostered player, `saveAttendanceAction` upserts to `session_attendance`, and the player profile Session History tab reads those same rows directly — no director approval needed for normal roster attendance.

**The single functional problem found:** `PlayerSessionHistoryPanel` EmptyState wrongly told directors that attendance records appear "once a director applies an attendance exception draft from the review queue." That description applies only to unexpected/unrostered attendees (the wrap-up → `proposed_actions` path). Normal roster attendance written by the coach appears immediately with no director step.

**File modified:**
- `src/app/director/players/[playerId]/PlayerSessionHistoryPanel.tsx` — Fixed EmptyState description. New copy: "Attendance records appear here after a coach saves roster attendance from the session page. Unexpected attendee exceptions appear here once a director approves them from the review queue." Accurately separates the two flows.

**Copy left unchanged (correct as written):**
- Line 135 `PlayerSessionHistoryPanel`: coach observations *do* require director approval via proposed_actions — left as-is.
- `CoachSessionExecutionClient:291`: note about unexpected attendees going to director review — correct for that flow, left as-is.

**Guardrails confirmed:** No migrations. No schema changes. No action changes. No new components. No new DB queries. TypeScript clean.

---

## 2026-05-08 — Sprint 160: Player Profile Evidence + Session History Panel

Adds a read-only "Session History" tab to the director player profile. A director can now open a player profile and immediately see attendance history (last 60 days) and all applied coach observations in one consolidated panel, without switching between Fitness and Notes tabs. No new DB queries — uses data already fetched by `page.tsx` (`exposureTimeline` + `enrichedObservations`). No backend mutations. Not visible to parents or players.

**Files created:**
- `src/app/director/players/[playerId]/PlayerSessionHistoryPanel.tsx` — Read-only panel. Shows: internal notice, 4-metric counts strip (Sessions/Present/Absent-Late/Coach Notes), attendance list with status pills (last 60 days), applied coach observations reusing `CoachObservationsFeed`. Empty states for both sections when no data exists. Wrap-up observation count badge in section header.

**Files modified:**
- `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx` — Added `sessionHistory: ReactNode` prop. Added "Session History" tab trigger and content slot.
- `src/app/director/players/[playerId]/page.tsx` — Imported `PlayerSessionHistoryPanel`. Added `sessionHistorySlot` after `notesSlot` using existing `exposureTimeline` + `enrichedObservations` data. Passed `sessionHistory` prop to `PlayerProfileTabs`.

**Guardrails confirmed:** No migrations. No new DB queries. No schema changes. No parent/player data exposure. No mutations. TypeScript clean.

---

## 2026-05-08 — Sprint 159: Director Review Queue Command Center

Clarity sprint — makes the director review queue feel like a command center. No backend changes, no new workflows, no migrations. Only `page.tsx` modified.

**Files modified:**
- `src/app/director/review/page.tsx` — Reordered tabs: Attendance → Placement Review → Player Observations → Dev Summaries → Session Wrap-Ups → Session Recaps → Priorities → Evidence → Curriculum → Voice Intake → Captures. Updated `defaultTab` priority order to match (operational tabs first). Replaced flat per-category summary strip in `PageHeader` with a 4-group command-center grid: Operations (Attendance, Placement Review), Player Development (Observations, Dev Summaries, Priorities, Evidence), Session Review (Wrap-Ups, Recaps), System (Curriculum, Voice Intake, Captures). Added `CategoryRow` helper function — shows label, pending count (orange), ready count (lime), oldest age when pending. Added one-sentence "what this affects" microcopy at the top of each `TabsContent`. Improved empty state descriptions to clarify where each draft type originates.

**Guardrails confirmed:** No migrations. No schema changes. No new components. TypeScript clean.

---

## 2026-05-08 — Sprint 158: Director Attendance Exception Apply Flow

Closes the director-side apply loop for coach wrap-up attendance exceptions. The existing `applyApprovedAttendanceExceptionAction` previously failed with "No attendance rows to apply" when `rostered_attendance: []` (the exact shape coach wrap-up produces). This sprint fixes that failure and routes unrostered attendees through a safe placement review follow-up pipeline. No player profile, roster change, billing, or parent communication is created automatically.

**Files created:**
- `src/app/director/review/PlacementReviewCard.tsx` — Client card showing unexpected attendee name, reason, session context, and "Mark Reviewed" button. Calls `dismissPlacementReviewDraftAction`. Writes audit log on dismiss.

**Files modified:**
- `src/app/director/review/actions.ts` — Fixed `applyApprovedAttendanceExceptionAction`: removed the early fail when `rostered_attendance` is empty; added unrostered attendee processing loop that creates `voice_commands` + `proposed_actions` (target_module: 'placement_review', pending_review) for each attendee; updated audit log to include `unrostered_follow_ups_created`; added new `unrosteredFollowUpsCreated` field to result type. Added `dismissPlacementReviewDraftAction` — marks placement review item as executed + writes audit log.
- `src/app/director/review/ApplyApprovedAttendanceExceptionControls.tsx` — Updated result type to include `unrosteredFollowUpsCreated`. Updated pre-apply notice to explain follow-up behavior. Updated button label to "Apply Exception Draft". Updated success display to show unrostered follow-ups created count.
- `src/app/director/review/AttendanceExceptionDraftCard.tsx` — Updated unrostered attendees note to explain applying creates a placement review follow-up.
- `src/app/director/review/page.tsx` — Added `PlacementReviewCard` import. Added fetch block for `target_module: 'placement_review'`. Added "Placement Review" tab with `PlacementReviewCard` list + empty state. Added `placementReviewCount` to `PageHeader` props and function signature. Updated `totalPending`, `oldestPendingDates`, `defaultTab`, and category strip.

**Guardrails confirmed:** No migrations. No new tables. `target_module: 'placement_review'` is a free-text string column — no schema change. No player creation, no roster change, no billing, no parent/player communication. All changes go through `proposed_actions` + `audit_logs`. TypeScript clean.

---

## 2026-05-08 — Sprint 157: Coach-Side Attendance Exception Capture

Allows coaches to flag unexpected (unrostered) attendees directly inside the wrap-up flow as structured director review drafts. Replaces the old "use the Attendance Exceptions panel in the session detail view" note with an inline name + reason form that queues entries and submits them to `proposed_actions` via the existing `attendance_exception_v1` pipeline. No roster change until the director approves and applies.

**Files created:**
- `src/app/coach/sessions/[sessionId]/saveWrapUpAttendanceExceptionAction.ts` — Server action that validates coach role, verifies session belongs to the academy, creates a `voice_commands` row then a `proposed_actions` row with `action_type: 'other'`, `target_module: 'attendance_exception'`, `draft_type: 'attendance_exception_v1'`, `source: 'coach_wrap_up'`, `status: 'pending_review'`. Accepts structured `WrapUpUnrosteredEntry[]` — no text parsing. `rostered_attendance: []` always empty (handled separately by `saveAttendanceAction`).

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Added `Users` icon import, `saveWrapUpAttendanceExceptionAction` import, `NOTE_LABELS` constant. Added 5 new state variables (`unrosteredEntries`, `newUnrosteredName`, `newUnrosteredNote`, `attendanceExceptionSaved`, `attendanceExceptionError`). Added step 4 to `handleSave` to call exception action when entries exist. Replaced `{roster.length > 0 && <attendance-card>}` outer guard with unconditional card: per-player selects remain guarded; new "Unexpected attendees" subsection added with name input + reason select + Add button + remove-able list. Added unrostered count to "what will happen" summary box. Added exception count / error display in saved state.

**Guardrails confirmed:** No schema changes. No migrations. Exception drafts route through `proposed_actions` pipeline — existing director review infrastructure renders them without modification. No roster, billing, or parent communication changes. TypeScript clean.

---

## 2026-05-08 — Sprint 156: Coach Wrap-Up UX Consolidation

Unifies the coach end-of-session experience around one primary CTA. "Wrap Up Session" is the obvious primary action; "Quick Note" is clearly demoted with microcopy. Wrap-up flow adds a follow-up question and uses coach-friendly copy throughout. Confirmation state explicitly reports observation draft count.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Added 7th guided step ("Any parent or director follow-up needed?"), changed submit button copy to "Submit for Director Review", updated confirmation to "Session wrap-up submitted" with explicit observation count (including "No player observation drafts were created" when 0), changed "Save as quick note" link to "Save what you have". Updated step 2 and step 4 question copy to match sprint spec.
- `src/app/coach/sessions/[sessionId]/CoachSessionActions.tsx` — Added microcopy below "Quick Note" button: "Quick Note is an informal internal capture — not a session recap. Use Wrap Up Session to submit your end-of-session review."
- `src/app/coach/sessions/[sessionId]/CoachRecapCommandPanel.tsx` — Renamed section header from "QUICK NOTE" to "QUICK INTERNAL NOTE". Updated subtitle to clarify informal vs. structured recap distinction.
- `src/app/coach/sessions/[sessionId]/page.tsx` — Improved "After Session" section: removed confusing right-justified microcopy, replaced with inline label explaining the Wrap Up → director review flow. Added "Or, add a quick internal note" section label above `CoachRecapCommandPanel` to visually subordinate it.

**Guardrails confirmed:** No schema changes. No backend changes. Player observations still route through proposed_actions. No AI, no voice, no parent exposure. TypeScript clean.

---

## 2026-05-08 — Sprint 155: Approved Evidence → Development Summary Draft

Adds a director-triggered flow to assemble a development summary draft from recent internal coach observations. The draft is routed through `proposed_actions` for director review and apply — nothing writes to `player_development_summary` automatically.

**Files created:**
- `src/app/director/players/[playerId]/draftSummaryUpdateAction.ts` — Server action that assembles a `development_summary_draft_v1` proposed_action from recent `is_private` coach_observations (max 10). Exports `DevelopmentSummaryDraftPayload` type.
- `src/app/director/players/[playerId]/DraftSummaryUpdateButton.tsx` — Client button component. Disabled with hint when no internal observations exist. Shows observation count on success.
- `src/app/director/review/DevelopmentSummaryDraftCard.tsx` — Review queue card showing proposed strengths, work-on areas, coach summary, and safety notice. Routes to decision or apply controls based on status.
- `src/app/director/review/DevelopmentSummaryDraftDecisionControls.tsx` — Client component for approve/reject decision with optional note.
- `src/app/director/review/ApplyDevelopmentSummaryDraftControls.tsx` — Client component that calls `applyApprovedSummaryDraftAction` to upsert `player_development_summary`.

**Files modified:**
- `src/app/director/review/actions.ts` — Added `updateSummaryDraftDecisionAction` and `applyApprovedSummaryDraftAction` (upserts `player_development_summary` with `show_to_student: false, show_to_parent: false`, writes audit_log, marks executed).
- `src/app/director/players/[playerId]/page.tsx` — Added `DraftSummaryUpdateButton` card after `CoachObservationEvidenceSummary` in the overview tab.
- `src/app/director/review/page.tsx` — Added `development_summary_draft_v1` fetch block, "Dev Summaries" tab with pending/approved sections, updated all-clear check, defaultTab, oldestPendingDates, and PageHeader counts.

**Guardrails confirmed:** No migrations. `player_development_summary` only written after director approve + apply. `show_to_student: false, show_to_parent: false` on all upserts. No AI API calls — summary assembled deterministically from stored observations. RLS scoped via `academy_id`. TypeScript clean.

---

## 2026-05-08 — Sprint 154: Approved Observation → Player Profile Evidence

Applied coach wrap-up observations now appear clearly in the player profile with a "Coach Evidence" source badge, and the evidence summary reflects approved evidence count.

**Files modified:**
- `src/app/director/review/actions.ts` — Added `ai_entities: { source: 'coach_wrap_up', proposed_action_id }` to the `coach_observations` insert in `applyApprovedObservationDraftAction`, enabling source tracking.
- `src/app/director/players/[playerId]/CoachObservationsFeed.tsx` — Added "Coach Evidence" badge (green) for observations with `ai_entities.source === 'coach_wrap_up'`, matching the existing "From Recap" pattern.
- `src/app/director/players/[playerId]/CoachObservationEvidenceSummary.tsx` — Added `fromWrapUpCount`, unified `approvedEvidenceCount` stat (recap + wrap-up), updated "Approved" metric label and recap note text.

**Guardrails confirmed:** No schema changes. No parent/player exposure. Internal display only. TypeScript clean.

---

## 2026-05-08 — Sprint 153: Coach Wrap-Up → Director Evidence Queue

Routes coach player observations through the director review pipeline. Observations no longer write directly to `coach_observations` — each one becomes an individual `proposed_actions` draft requiring director approval and explicit apply.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/saveWrapUpObservationsAction.ts` — Replaced direct `coach_observations` INSERT with `voice_commands` + one `proposed_actions` row per observation (`target_module: 'coach_observation_draft_v1'`). Exports `CoachObservationDraftPayload` type. Added optional `sessionTitle` parameter.
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Updated saved-state copy and queue summary to reflect drafts going to director review instead of being saved directly.
- `src/app/director/review/actions.ts` — Added `updateObservationDraftDecisionAction` (approve/reject, status only) and `applyApprovedObservationDraftAction` (writes to `coach_observations`, writes `audit_log`, marks `executed`).
- `src/app/director/review/page.tsx` — Added fetch for `coach_observation_draft_v1` proposed_actions, enrichment with player/proposer names, "Player Observations" tab with pending/approved sections, and inclusion in all-clear check, defaultTab, and PageHeader counts.

**Files created:**
- `src/app/director/review/WrapUpObservationDraftCard.tsx` — Card component showing observation type badge, player name, session context, note content, internal-only badge. Shows decision controls when pending, apply controls when approved.
- `src/app/director/review/WrapUpObservationDraftDecisionControls.tsx` — Client component with approve/reject buttons and optional decision note.
- `src/app/director/review/ApplyWrapUpObservationDraftControls.tsx` — Client component with Apply button that calls `applyApprovedObservationDraftAction`.

**Guardrails confirmed:** No migrations. No parent/player exposure. No level movement. No AI tagging. `coach_observations` only written after director approve + apply. RLS scoped via `academy_id` on all queries. TypeScript clean.

---

## 2026-05-08 — Sprint 152: Role-Based Landing Dashboards Polish

Polishes the coach and director dashboards with contextual greeting, quick stats, and a setup-complete celebration banner.

**Files modified:**
- `src/app/coach/page.tsx` — Adds a personalized greeting using `profile.display_name` (e.g. "Good morning, Brian"). Adds a quick stats bar showing session count for today, player count, and notes count (if any). Both are derived from the existing `CoachWorkspaceSummary`.
- `src/app/director/page.tsx` — Adds a "Academy OS is live" success banner (green, `Sparkles` icon) that appears only when all 4 setup conditions are met: players exist, curriculum levels assigned, class templates exist, and sessions created. Banner text: "Players, curriculum, templates, and sessions are all connected. Coaches have everything they need on court."

**Guardrails confirmed:** No schema changes, no new data queries, no parent/player exposure. TypeScript clean.

---

## 2026-05-08 — Sprint 151: Demo Dataset Setup

Docs-only sprint. Creates a comprehensive demo story and dataset setup guide.

**Files created:**
- `docs/DEMO_DATASET_SETUP.md` — Two-path demo guide: (A) automated sandbox via `/director/demo`, (B) 11-step manual demo story with character bios (Mia, Sophie, Leo), script copy for each step, talking-point cheat sheet, and "what NOT to demo" list. Covers the full loop: import → levels → curriculum → template → lesson plan → session → coach execution → wrap-up → director review.

**Guardrails confirmed:** Docs only. No code changes, no schema changes. TypeScript clean.

---

## 2026-05-08 — Sprint 150: Launch Readiness UX Audit

Docs-only sprint. Creates two launch-readiness documents for the V1 pilot.

**Files created:**
- `docs/LAUNCH_READINESS_UX_AUDIT.md` — Screen-by-screen status for all four role portals (director, coach, player, parent). Documents known UX gaps (non-blocking), validated UX principles, and a pre-pilot sign-off checklist.
- (updated) `docs/V1_MANUAL_TEST_CHECKLIST.md` — Prepends a new "Sprint 150 — V1 Pilot Readiness" section covering: director setup loop, command center, session execution, review queue, parent portal, player portal, and demo tour checks. Preserves existing Sprint 67–87 checklist below.

**Guardrails confirmed:** Docs only. No code changes, no schema changes. TypeScript clean (no changes).

---

## 2026-05-08 — Sprint 149: End-to-End Guided Demo Polish

Adds an 11-step guided demo path to the existing demo tour page, making the full Academy OS lifecycle navigable in one place.

**Files modified:**
- `src/app/director/demo/page.tsx` — Adds `DEMO_PATH` constant (11 steps: import → activate → assign levels → curriculum → class template → lesson plan → session → coach pre-session → wrap-up → director review → close the loop). Adds `DemoPathRow` sub-component — a clickable row with step number badge, title, description, and label-with-arrow. Inserts the full 11-step list as "Section 0" above the existing sandbox controls, with a `label-xs` header and subtitle copy.

**Guardrails confirmed:** No schema changes, no mutations, no new data fetches. TypeScript clean.

---

## 2026-05-08 — Sprint 148: Visual Flow Diagrams and Light Motion

Adds three visual components — a curriculum loop diagram, an attendance sparkline, and a progress ring — wired into real data on existing pages.

**Files created:**
- `src/components/onboarding/CurriculumLoopDiagram.tsx` — Static horizontal flow diagram showing the 6-step curriculum execution loop (Global Curriculum → Class Template → Session Created → Coach Runs It → Wrap-Up Submitted → Director Reviews). Lime accent on first and last step; ArrowRight connectors; flex-wrap for mobile.
- `src/components/player/AttendanceSparkline.tsx` — Row of colored 10×10 dots representing recent session attendance. Color: green = present, orange = late, blue = excused, muted = absent. Props: `sessions`, `maxDots?`, `className?`.
- `src/components/player/LevelProgressRing.tsx` — SVG circular progress ring. Props: `percent` (0–100), `size?` (default 56), `label?`, `sublabel?`, `className?`. Lime stroke on dark track. `transition-all duration-700` on the progress arc.

**Files modified:**
- `src/app/director/curriculum/page.tsx` — Adds `CurriculumLoopDiagram` in a surface-raised card between the PageExplainerCard and CurriculumCustomizationAssistant.
- `src/app/player/page.tsx` — Wires `LevelProgressRing` and `AttendanceSparkline` into the "Recent Sessions" card. Ring shows session attendance % (e.g. "80%") replacing the Calendar icon. Sparkline appears above the session list. Adds `sessionAttendancePct` derived variable before return. Removes now-unused `Calendar` import.

**Guardrails confirmed:** No schema changes, no mutations, no parent/player data exposure. All components are server-safe (no client state). TypeScript clean.

---

## 2026-05-08 — Sprint 147: Empty State and Help Copy Pass

Audits and improves cold empty-state copy across coach and director routes, replacing terse system messages with contextual, warm descriptions.

**Files modified:**
- `src/app/coach/page.tsx` — Improves 3 empty states: (1) "No sessions scheduled yet" → adds "check back before your next court time"; (2) "No players assigned yet" → "Players will appear here — your director assigns players to you"; (3) "No notes yet" → "Notes you write during or after sessions will appear here for quick reference."
- `src/app/coach/sessions/page.tsx` — Improves 2 empty states: (1) today → "Nothing on the court today" with contact-director context; (2) upcoming → "No upcoming sessions scheduled — future sessions will appear here as your director adds them."
- `src/app/director/private-lessons/page.tsx` — Improves empty state from "No private lesson requests yet" to "No requests yet — when parents request private lessons through the parent portal, requests will appear here for your review."

**Guardrails confirmed:** Copy-only changes, no logic, no schema, no new files. TypeScript clean.

---

## 2026-05-08 — Sprint 146: Contextual Next Best Action Cards

Adds a reusable `NextBestActionCard` component and wires it into 4 contextual empty/action states across the product.

**Files created:**
- `src/components/onboarding/NextBestActionCard.tsx` — Inline action-card component. Props: `title`, `body`, `actionLabel`, `actionHref`, `variant` (guide/warning/success/info), `className?`. Each variant has a distinct icon and color treatment (lime for guide, orange for warning, green for success, blue for info). Server-component safe (Link-based action).

**Files modified:**
- `src/app/director/page.tsx` — Wires two NBA cards between Curriculum Coverage and Priority Queue: (1) warning card when `pendingCount > 0` ("X players pending placement"); (2) guide card when `classTemplateCount === 0 && players.length > 0` ("Create your first class template").
- `src/app/director/class-templates/page.tsx` — Adds guide NBA card above the existing EmptyState when no class templates exist ("Create your first class template — a reusable blueprint with curriculum-aligned lesson plans").
- `src/app/coach/sessions/[sessionId]/page.tsx` — Replaces cold `Card/CardContent` empty block state with an info NBA card ("No blocks in this session — add blocks through the class template"). Removes the now-unused `Card, CardContent` import.

**Guardrails confirmed:** No schema changes, no mutations, no parent/player data exposure. TypeScript clean.

---

## 2026-05-08 — Sprint 145: Parent and Player Onboarding Clarity Pass

Improves empty states, no-mapping states, and duplicate section handling on parent and player home pages.

**Files modified:**
- `src/app/parent/page.tsx` — Suppresses the `parentView.how_to_support_this_week` card when the richer `parentSupportGuide` is present (eliminates the duplicate "How to Support This Week" heading). Replaces cold no-mapping state with warmer copy ("Your academy is preparing your child's development view — once connected, you'll see their level, current focus, and how best to support them at home."). Updates "Latest Coach Update" empty state from "No updates yet" to "Your first update is on its way" with context copy.
- `src/app/player/page.tsx` — Updates "My Skills" empty state to "Your skill path is being set up" with warmer guidance. Updates "Wins & Streaks" empty state to "Wins are coming" with "Wins and streaks will come alive after a few sessions." Updates "Messages" empty state with more context ("Messages from your coach and academy will show up here when they have something to share.").

**Guardrails confirmed:** No schema changes, no mutations, no new files, no parent/player data exposure. TypeScript clean.

---

## 2026-05-08 — Sprint 144: Coach Session Guided Execution UX

Restructures the coach session detail page into three clear phases and adds a block progress rail at the top of each session.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/page.tsx` — Adds block progress rail (named pills with block order, name, duration) in the session header. Moves `CoachSessionCurriculumPanel` ABOVE the execution client under a "Before Session" label (what to coach today). Reframes execution blocks under "Run the Session". Adds "After Session" section with Quick Note vs Coach Wrap-Up helper copy. Updates snapshot notice to shorter copy. Updates empty blocks state to include guidance.
- `src/app/coach/sessions/[sessionId]/CoachSessionCurriculumPanel.tsx` — Updates empty state copy to: "Director has not applied a curriculum lesson plan yet. Run the session from the blocks below and add a wrap-up after class."

**Guardrails confirmed:** No schema, no backend logic changes, no parent/player exposure. TypeScript clean.

---

## 2026-05-08 — Sprint 143: Lesson Plan Generation Guided Flow

Adds a 4-step guided flow to the Lesson Plan Draft Generator panel so directors understand where they are in the generate → review → apply → session chain. Step states are derived from live component state (draft generated, applied) and the `hasCurriculumContent` prop.

**Files created:**
- `src/components/onboarding/GuidedStepCard.tsx` — Reusable component for a single step in a guided flow. Props: `stepNumber`, `totalSteps?`, `title`, `description`, `status` (complete/current/upcoming), `children?`, `className?`. Shows CheckCircle2 for complete, lime circle for current, muted circle for upcoming. Description hidden when complete.

**Files modified:**
- `src/app/director/class-templates/[templateId]/LessonPlanDraftPanel.tsx` — Adds 4 GuidedStepCard steps (Generate draft / Review the plan / Apply to template / Create session) with live state. Adds "Draft only — review before applying" inline label. Improves apply success copy: "Applied — coaches will see this plan when a session is created from this template." + "Next step: create a session." Adds clarity copy near apply button: "Applying updates curriculum content on this template. It does not change the global curriculum."

**Guardrails confirmed:** No schema, no mutations changed, no parent/player exposure. TypeScript clean.

---

## 2026-05-08 — Sprint 142: Class Template Guided Setup V1

Adds guided setup and next-step clarity to the class templates workflow. Directors now see a state-aware 4-step guide on each class template, and a page explainer on the list view that answers the five key questions about the class template → lesson plan → session workflow.

**Files created:**
- `src/components/onboarding/ClassTemplateSetupGuide.tsx` — Reusable server component. Props: `hasCurriculumLevel`, `hasCurriculumContent`, `hasSessionsFromTemplate?`, `className?`. Shows: (1) a status pill with context-aware next-step copy, (2) a 4-step flow with CheckCircle2/Circle state icons and current-step lime highlight, (3) a plain-language definitions block for Curriculum content, Lesson plan draft, Applied lesson plan, and Session.

**Files modified:**
- `src/app/director/class-templates/page.tsx` — Adds `PageExplainerCard` between the page header and the curriculum loop stats strip. Title: "Turn curriculum into coach-ready lesson plans". 5 Q&A tiles.
- `src/app/director/class-templates/[templateId]/page.tsx` — Imports `ClassTemplateSetupGuide` and renders it in a "Template Workflow" section between the meta card and the curriculum level selector. Passes `hasCurriculumLevel={!!curriculumLevelId}` and `hasCurriculumContent={hasCurriculumContent}` (both already computed on the page). `hasSessionsFromTemplate` omitted — requires an extra query not justified for V1.

**State logic:**
- Step 1 done: `!!curriculumLevelId`
- Steps 2 + 3 done: `hasCurriculumContent` (generating + applying are both prerequisites for content existing in the DB)
- Step 4 done: `hasSessionsFromTemplate === true` (omitted in V1, shown as next step)
- Status message: adaptive to current state — "Start here" / "Next: generate draft" / "Lesson plan applied. Next: create a session" / "Template is active"

**Guardrails confirmed:**
- UI-only scaffolding — no migrations, no schema, no database.types.ts edits
- No curriculum mutation, no template mutation
- generateLessonPlanDraftAction and applyLessonPlanDraftAction untouched
- No parent/player exposure changes
- No coach routes touched
- No AI, no service role
- TypeScript: clean

---

## 2026-05-08 — Sprint 141: Curriculum Customization Assistant UX V1

Adds a guided curriculum customization experience to the Director Curriculum page. Directors now see a clear explanation of what the curriculum is, how customization works, what the three layers mean, and plain-language definitions for all curriculum terms — before they engage with any of the technical controls.

**Files created:**
- `src/components/onboarding/PageExplainerCard.tsx` — Reusable server component. Accepts a title, body, and optional Q&A items. Renders a lime-bordered context card with a 2-column Q&A grid. No state, no client JS.
- `src/components/curriculum/CurriculumCustomizationAssistant.tsx` — Client component with three sections: (1) three-layer distinction card (Global curriculum / Academy version / Session plan), (2) 5-step customization process with "Preview only" note and "Start customization preview ↓" anchor link, (3) collapsible plain-language glossary (8 terms: curriculum level, gate, domain, drill, game, situational, match-play theme, academy override).

**Files modified:**
- `src/app/director/curriculum/page.tsx` — Imports PageExplainerCard and CurriculumCustomizationAssistant. Renders PageExplainerCard after the page header with 5 Q&A entries. Renders CurriculumCustomizationAssistant before the curriculum explorer. Adds `id="curriculum-explorer"` to the explorer section so the anchor link scrolls correctly.

**Guardrails confirmed:**
- UI-only scaffolding — no migrations, no schema, no database.types.ts edits
- No curriculum override records created
- No save/apply logic added
- No teaching philosophy saved
- No parent/player exposure changes
- No coach or lesson plan logic touched
- No AI, no service role
- TypeScript: clean

---

## 2026-05-08 — Sprint 140: Director First-Time Setup Wizard V1

Adds a collapsible, dismissible setup checklist to the Director Command Center dashboard. Shows new directors the 7-step path from "empty academy" to "curriculum live and coaches equipped". Progress is tracked via server-side boolean props; dismiss/collapse state is persisted to localStorage only (no schema changes).

**Files created:**
- `src/components/onboarding/SetupProgressChecklist.tsx` — Client component with 7 setup steps, lime progress bar, CheckCircle2/Circle icons, CTA links, and "Unlocks:" microcopy for incomplete steps. SSR-safe via `mounted` state. Dismiss key: `acos_setup_checklist_dismissed`. Collapse key: `acos_setup_checklist_collapsed`.

**Files modified:**
- `src/app/director/page.tsx` — Adds two lightweight data queries (`classTemplateCount` from non-fitness templates, `sessionsExist` from any session ever created). Imports and renders `SetupProgressChecklist` after the header, before "Today's Priorities".

**Guardrails confirmed:**
- UI-only — no migrations, no schema changes, no database.types.ts edits
- No parent/player data exposed
- No coach workflow changes
- No AI or external API calls
- localStorage-only persistence
- TypeScript: clean

---

## 2026-05-08 — Sprint 138: Investor / Academy Owner Demo Hardening

Polish pass on the curriculum feature set (Sprints 129–137) to ensure a clean end-to-end demo path.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachSessionCurriculumPanel.tsx` — Replaces the silent `return null` (when template has blocks but no lesson plan content) with a visible empty state Card. Coaches and demo viewers now see the curriculum section and understand what it's for, rather than having it silently disappear. The `tblList.length === 0` early return (no blocks at all) still returns null.
- `src/app/director/class-templates/[templateId]/LessonPlanDraftPanel.tsx` — Adds a "Lesson plan is live on this template" status banner (green, with BookOpen icon) that appears on initial load when `hasCurriculumContent=true` and no draft has been generated yet. This makes the applied state clearly visible to directors and investors without requiring them to scroll or generate a new draft. Adds `BookOpen` to lucide-react imports.

**Guardrails confirmed:**
- Display only — no mutations, no migrations
- No database.types.ts edits
- No Fitness OS changes
- TypeScript: clean

---

## 2026-05-08 — Sprint 137: Director Curriculum Loop Dashboard

Adds curriculum loop health metrics to the Class Templates list page — shows how many templates have lesson plans applied, how many have a curriculum level set, and how many sessions used curriculum-linked templates in the last 30 days. Each template row now shows a "Curriculum" count (number of curriculum content items linked via lesson plan).

**Files modified:**
- `src/app/director/class-templates/page.tsx` — Adds `curriculumItemCountByTemplate` map (counting `curriculum_class_template_blocks` rows per template), `templatesWithLessonPlan` and `templatesWithLevel` derived arrays, `recentCurriculumSessionCount` (sessions from curriculum-linked templates in last 30 days). Adds summary strip between page header and template list. Passes `curriculumItemCount` to `TemplateRow`, which shows it as a third stat column (lime when > 0, muted when 0).

**Guardrails confirmed:**
- Display only — no mutations, no migrations
- No database.types.ts edits (rawDb used for curriculum_class_template_blocks)
- No Fitness OS changes
- TypeScript: clean

**Next:** Sprint 138 — Investor / Academy Owner Demo Hardening

---

## 2026-05-08 — Sprint 136: Session Actuals → Gate Evidence Suggestions

Adds a "Gate Evidence Opportunities" section to the director session detail page. When a wrap-up has been submitted, shows which curriculum gates may have had evidence collected based on the session's completed blocks and curriculum content.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Adds computation step 15: derives covered curriculum domains from completed wrap-up blocks (using curriculumByBlockName from step 14), filters `sessionCurriculumExtra.topGates` by those domains, builds `gateEvidenceSuggestions[]` (no additional DB query — reuses already-fetched data). Renders "GATE EVIDENCE OPPORTUNITIES" section between Planned vs Actual and Curriculum Exposure sections when at least one gate suggestion is generated. Adds `Target` and `Info` to lucide-react imports.

**Logic:** Completed block names (from wrap-up `block_completion` where status = completed or modified) → matched to normalized block names in curriculumByBlockName → domain set extracted → curriculum_gates filtered by domains → suggestion list with criterion, threshold, and supporting activity titles.

**Guardrails confirmed:**
- No evidence auto-created — display only, with a note directing directors to player profile Skill Path tab
- No mutations — purely derived display
- No migration created
- No database.types.ts edits
- No Fitness OS changes
- No parent/player data exposure
- Uses `Array.from()` instead of `for...of` on Map/Set for TypeScript target compatibility
- TypeScript: clean

**Next:** Sprint 137 — Director Curriculum Loop Dashboard

---

## 2026-05-08 — Sprint 135: Planned vs Actual Wrap-Up Against Curriculum

Adds curriculum lesson plan items to the director's Planned vs Actual diff panel so curriculum delivery can be assessed alongside coach-reported block completion.

**Files modified:**
- `src/app/director/sessions/[sessionId]/PlannedVsActualDiffPanel.tsx` — Adds optional `curriculumByBlockName: Map<string, CurriculumPlanItem[]>` prop. Exports `CurriculumPlanItem` interface. For each planned block, looks up curriculum items by normalized block name and renders up to 2 items (title + domain) in the Planned column as lime-tinted subtext. Map callback updated from arrow-expression to block body to support the curriculum lookup computation.
- `src/app/director/sessions/[sessionId]/page.tsx` — Adds data fetch step 14: reads `template_blocks` for the session's template, fetches `curriculum_class_template_blocks` joining `curriculum_content_items` and `curriculum_drills`, groups items by normalized block name into a `Map`. Passes `curriculumByBlockName` to `PlannedVsActualDiffPanel`.

**Matching logic:** Session blocks were generated from template blocks with the same names. Curriculum content is keyed by normalized template block name (lowercase + trim) and looked up against each session block's name.

**Guardrails confirmed:**
- Read-only — no mutations
- No migration created
- No database.types.ts edits
- Fitness OS untouched
- No parent/player data exposure
- Map not passed across client boundary (PlannedVsActualDiffPanel has no 'use client')
- TypeScript: clean

**Next:** Sprint 136 — Session Actuals → Gate Evidence Suggestions

---

## 2026-05-08 — Sprint 134: Coach Class Session Curriculum View

Shows the curriculum lesson plan on the coach session detail page when the session was generated from a template that has curriculum content applied.

**Files created:**
- `src/app/coach/sessions/[sessionId]/CoachSessionCurriculumPanel.tsx` — Async Server Component. Reads `template_blocks` for the session's template, then fetches `curriculum_class_template_blocks` joining `curriculum_content_items` and `curriculum_drills`. Groups items by template block and renders block-by-block with title, domain, duration, coach cues (up to 3), and success criteria (up to 2). Returns null if no curriculum content is applied — no empty state shown (coach sees nothing if there's nothing to show).

**Files modified:**
- `src/app/coach/sessions/[sessionId]/page.tsx` — Imports `CoachSessionCurriculumPanel`. Renders it when `session.template_id` is present, placed between the execution client area and the Wrap-Up CTAs.

**Guardrails confirmed:**
- Read-only — no mutations
- No migration created
- No database.types.ts edits
- Fitness OS untouched
- No parent/player data exposure
- rawDb used only for tables not in database.types.ts (curriculum_class_template_blocks, curriculum_content_items, template_blocks.curriculum context)
- Panel renders nothing if template has no curriculum content — graceful empty state
- TypeScript: clean

**Next:** Sprint 135 — Planned vs Actual Wrap-Up Against Curriculum

---

## 2026-05-08 — Sprint 133: Apply Lesson Plan Draft to Class Template

Wires up the Apply button in the Lesson Plan Draft Panel to write the draft to `curriculum_class_template_blocks`.

**Files created:**
- `src/app/director/class-templates/[templateId]/applyLessonPlanDraftAction.ts` — Server Action that: (1) confirms template belongs to the director's academy; (2) deletes all existing `curriculum_class_template_blocks` rows for the template; (3) inserts new rows from the draft (content_item_id only, drill_id null, order_index per block); (4) writes to `audit_logs`. Returns `{ success, totalApplied }` or `{ error }`.

**Files modified:**
- `src/app/director/class-templates/[templateId]/LessonPlanDraftPanel.tsx` — Imports `applyLessonPlanDraftAction`. Adds `applying` and `applied` state. "Apply to Template" button now calls the action, shows spinner during apply, shows green "Applied" confirmation on success, and calls `router.refresh()` so the Server Component re-renders with the new curriculum content.

**Guardrails confirmed:**
- Delete-then-insert is scoped by `template_id` — cannot touch another academy's data (RLS + academy_id check)
- No parent/player data touched
- No migration created
- No database.types.ts edits
- Fitness OS (template_block_exercises / exercises) untouched
- Audit log written on every successful apply
- rawDb used for tables not in database.types.ts

**TypeScript:** clean

**Next:** Sprint 134 — Coach Class Session Curriculum View

---

## 2026-05-08 — Sprint 132: Lesson Plan Draft Generator V1

Adds a deterministic lesson plan draft generator to the class template detail page.

**Files created:**
- `src/app/director/class-templates/[templateId]/generateLessonPlanDraftAction.ts` — Server Action that reads the template's curriculum level, fetches matching `curriculum_content_items` (lesson-plan-relevant types only), and maps items to blocks by `session_block_hint` vs `block_type`. Returns a `LessonPlanDraft` object — no DB writes. Each block consumes items greedily (up to 3 per block, hint-matched first, then fallback to any unused item).
- `src/app/director/class-templates/[templateId]/LessonPlanDraftPanel.tsx` — Client component with "Generate Lesson Plan Draft" / "Regenerate Draft" button. Calls the server action and renders the draft as a block-by-block preview. Includes a disabled "Apply to Template" button (Sprint 133). Collapsible when a draft is present.

**Files modified:**
- `src/app/director/class-templates/[templateId]/page.tsx` — Imports and renders `LessonPlanDraftPanel` between the Curriculum Context card and the Curriculum Lesson Plan section.

**Guardrails confirmed:**
- No DB writes — generator is read-only
- No migration created
- No database.types.ts edits
- Fitness OS untouched
- No parent/player data exposure
- rawDb used only for tables not in database.types.ts (curriculum_content_items, templates.curriculum_level_id)
- TypeScript: clean

**Block type → session_block_hint mapping:**
- `warm_up` → Warm-Up
- `cool_down` → Cool-Down
- `technical` → Focus, Train
- `tactical` → Game, Play, Situational
- `movement` / `fitness` → Train, Focus
- `competition` → Match-Play, Situational, Game
- `mental` → Focus, Train, Play
- `free` → Focus, Train, Game, Play

**Content types included in draft:** warmup, cooldown, drill, game, skill, tactical, fitness, competition, assessment, tactical_game, situational, match_play_theme, mental_skill, competition_behavior

**Content types excluded:** coach_cue, success_criteria, success_criteria_item, progression, regression, player_mission, parent_guidance, level_gate_support

**Next:** Sprint 133 — Apply Lesson Plan Draft to Class Template (wire up the Apply button, write draft to `curriculum_class_template_blocks`)

---

## 2026-05-08 — Sprint 131: Class Template Curriculum Content Display

Updated class template detail page to prioritize curriculum content over legacy fitness exercises.

**Files modified:**
- `src/app/director/class-templates/[templateId]/page.tsx` — Queries `curriculum_class_template_blocks` joining `curriculum_content_items` and `curriculum_drills`. Renders a "Curriculum Lesson Plan" section above legacy exercise records. Shows block name, content title, content_type badge, domain, description, coach cues, success criteria, progressions/regressions, duration, and notes. Empty state: "No curriculum content applied yet — Generate a lesson plan draft." Legacy exercises de-emphasized with label "Attached exercise records (legacy/fitness)".

**Guardrails confirmed:**
- Fitness OS untouched (template_block_exercises and exercises still queried and shown)
- No mutations — read-only display
- No parent/player routes touched
- rawDb used for new curriculum_class_template_blocks table (not yet in database.types.ts)

**TypeScript:** clean.

---

## 2026-05-08 — Sprint 130: Orange 1 Foundation Content Seed

Seeds 46 curriculum content items for Orange 1 — Rally (global defaults, academy_id NULL).

**Files created:**
- `supabase/migrations/063_orange1_foundation_content_seed.sql` — Seeds 46 rows covering warmups (2), technical drills (6), tactical games (5), situationals (5), match-play themes (4), mental skills (4), competition behaviors (3), coach cues/internal (5), success criteria/internal (3), progressions (3), regressions (3), player_mission (2), parent_guidance (2). All rows have `is_player_visible = false` and `is_parent_visible = false`. Uses `ON CONFLICT DO NOTHING` for idempotent re-runs. Level resolved via `stage = 'orange_development' AND level_number = 1`.

**Guardrails confirmed:**
- No parent/player portal exposure (all visibility flags false)
- No app code changes
- No database.types.ts edits
- Fitness OS untouched
- Idempotent seed — safe to re-run

**TypeScript:** clean (SQL-only sprint).

**Requires manual SQL application:** Apply migrations 061 and 062 to live DB first, then apply 063.

---

## 2026-05-08 — Sprint 129: Class Template Curriculum Content Junction Table

Additive schema migration only. No app code changed. No UI changed. No Fitness OS changes.

**Files created:**
- `supabase/migrations/062_class_template_content_junction.sql` — Creates `curriculum_class_template_blocks` junction table linking class template blocks to `curriculum_content_items` or `curriculum_drills`. Includes RLS (staff read, director/head manage), 5 indexes, and updated_at trigger. Constraint ensures exactly one of `content_item_id` or `drill_id` is non-null.

**Guardrails confirmed:**
- `template_block_exercises` and `exercises` untouched (Fitness OS unaffected)
- RLS on new table scoped to `academy_id` via templates join
- No parent/player policies
- No app code changes
- No database.types.ts edits (regenerate after live apply)
- No seed data (Sprint 130)

**TypeScript:** clean (SQL-only sprint).

**Requires manual SQL application to live Supabase before Sprint 130 seeding works.**

---

## 2026-05-08 — Sprint 128: Curriculum Content Taxonomy Migration

Additive schema migration only. No app code changed. No UI changed. No seed data. No Fitness OS changes.

**Files created:**
- `supabase/migrations/061_curriculum_content_taxonomy.sql` — Extends `curriculum_content_items` with 6 new columns, expands the `content_type` CHECK constraint from 9 to 22 values, adds 7 new indexes. All changes are additive — no existing rows modified, no tables dropped.

**Columns added to `curriculum_content_items`:**
- `domain TEXT` — curriculum domain for lesson planning alignment (Technical, Tactical, Movement, Competition, Mentality, Fitness, Recovery, Lifestyle, Games, Assessment)
- `session_block_hint TEXT` — suggested lesson block placement (Warm-Up, Focus, Train, Play, Game, Situational, Match-Play, Assessment, Cool-Down)
- `is_player_visible BOOLEAN NOT NULL DEFAULT false` — future flag for player portal exposure (schema only, no exposure logic built)
- `is_parent_visible BOOLEAN NOT NULL DEFAULT false` — future flag for parent portal exposure (schema only, no exposure logic built)
- `is_coach_only BOOLEAN NOT NULL DEFAULT false` — marks strictly coach/director-facing content
- `ball_level TEXT` — ball colour/equipment level (red, orange, green, yellow, any)

**content_type constraint expanded:**
- Preserved: `drill`, `game`, `skill`, `assessment`, `warmup`, `cooldown`, `fitness`, `tactical`, `competition`
- Added: `tactical_game`, `situational`, `match_play_theme`, `mental_skill`, `competition_behavior`, `coach_cue`, `success_criteria`, `success_criteria_item`, `progression`, `regression`, `player_mission`, `parent_guidance`, `level_gate_support`

**Indexes added:**
- `idx_curriculum_content_items_content_type`
- `idx_curriculum_content_items_domain`
- `idx_curriculum_content_items_session_block_hint`
- `idx_curriculum_content_items_ball_level`
- `idx_curriculum_content_items_player_visible`
- `idx_curriculum_content_items_parent_visible`
- `idx_curriculum_content_items_lesson_plan` (composite: level_id, domain, content_type WHERE is_active)

**Guardrails confirmed:**
- No UI/app code changes
- No `database.types.ts` edits (regenerate after live DB apply)
- No Fitness OS tables touched
- `template_block_exercises` and `exercises` untouched
- Visibility flags default false — no portal exposure
- No seed data (Sprint 130)
- No junction table (Sprint 129)
- No AI, no proposed_actions

**TypeScript:** clean (migration and docs only — no TS files changed).

**Next:** Apply `supabase/migrations/061_curriculum_content_taxonomy.sql` to live Supabase, then regenerate `database.types.ts`. Sprint 129 (class template junction table) follows after approval.

---

## 2026-05-07 — Sprint 126: Player Mission / Next Step Card V1

Static rule-based player mission copy. No AI. No migrations. No internal data exposed.

**Files created:**
- `src/lib/player/playerMissionCopy.ts` — Pure static helper. `buildPlayerMissionCopy({ domain, levelStage, currentLevel })` returns `PlayerMissionCopy` with: `whyItMatters`, `tryThisNext`, `coachIsWatchingFor`. Language is domain-keyed (Technical, Tactical, Movement, Mentality, Competition, Fitness, Recovery, Lifestyle, default) with level-stage augmentation for `tryThisNext`. No AI, no DB calls, mission/progress framing only — no grade/fail language.

**Files modified:**
- `src/components/player/PlayerMissionPreview.tsx` — Added three new optional props: `whyItMatters`, `tryThisNext`, `coachIsWatchingFor`. Updated header from "Today's Mission" to "Current Mission". Updated empty state copy to "Your coach is setting up your next mission." Added three new display sections when data is present: Why It Matters (blue/Lightbulb), Try This Next (lime/ArrowRight), Coach is Watching For (muted/Eye). Added `Lightbulb` and `Eye` icon imports.
- `src/app/player/page.tsx` — Added `buildPlayerMissionCopy` import and `PlayerMissionCopy` type. Added `missionCopy: PlayerMissionCopy | null` top-level variable. Added `missionCopy = buildPlayerMissionCopy(...)` after IDP view build (uses `coachLang?.domain`, `currentStage`). Passes `whyItMatters`, `tryThisNext`, `coachIsWatchingFor` to `PlayerMissionPreview`.
- `docs/CHANGELOG.md` — Sprint 126 entry.

**Content examples:**
- Technical domain: "Solid technique is the foundation everything else is built on" / "Focus on your preparation — get your racket back early" / "Consistent preparation and clean contact"
- Tactical domain: "Tennis is a thinking sport" / "Pick one target before each rally starts. Aim crosscourt with control" / "Decision quality — choosing the right shot"
- Movement domain: "Great movement gets you to the ball early" / "After every shot, reset your position" / "Recovery speed and split step timing"

**Guardrails confirmed:**
- No raw coach notes exposed
- No audit logs exposed
- No internal gate history exposed
- No harsh criteria language
- No AI content
- No migrations

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 125: Parent Support Guide V1

Static rule-based parent support guide. No AI. No migrations. No internal data exposed.

**Files created:**
- `src/lib/parent/parentSupportGuide.ts` — Pure static helper. `buildParentSupportGuide({ domain, levelStage, playerFirstName })` returns `ParentSupportGuide` with: `whatToPraise`, `atHomeSupportIdea`, `practiceLanguage`, `avoidOvercoaching`, `whenToAskCoach`. Language is keyed by domain (Technical, Tactical, Movement, Mentality, Competition, Fitness, Recovery, Lifestyle, default) and optionally augmented by level stage (beginner/intermediate/advanced). No AI, no DB calls, no external APIs.

**Files modified:**
- `src/app/parent/page.tsx` — Added `buildParentSupportGuide` import and `ParentSupportGuide` type. Added `parentSupportGuide` and `coachLangDomain` hoisted variables. Added `coachLangDomain = cl.domain` inside the coach language fetch block. Added `parentSupportGuide = buildParentSupportGuide(...)` in the hoist block (using `coachLangDomain`, `currentStage`, player first name). Added **Parent Support Guide card** in the render (after IDP sections, before Session Consistency): shows What to Praise (green), At-Home Support Idea, After Practice Try Saying (italic), Avoid Overcoaching This (orange), When to Ask the Coach.
- `docs/CHANGELOG.md` — Sprint 125 entry.

**Content examples:**
- Technical domain: "Praise preparation and effort" / "Light ball drops at home" / "Ask what felt comfortable"
- Movement domain: "Praise recovery and reset" / "Tag, hopscotch, or dancing" / "How did your legs feel?"
- Mentality domain: "Praise persistence and composure" / "Talk about athletes who bounce back" / "Was there a moment you reset?"

**Guardrails confirmed:**
- No raw coach notes exposed
- No AI content
- No audit logs
- No internal gate statuses
- No parent communication triggered
- No migrations

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 124: Parent Progress Dashboard V1

Parent-safe progress dashboard at `/parent`. No migrations, no schema changes, no internal data exposed.

**Files modified:**
- `src/app/parent/page.tsx` — Added three top-level hoisted variables (`parentCurrentLevelName`, `parentNextLevelName`, `parentSafeDoingWell`) populated from the inner data-fetch block after curriculum level resolution. Added `ArrowRight` import. Added **Level Card** showing current level + next level with arrow between them (rendered above Child's Progress). Updated `ParentSafeProgressPreview` call: passes `doingWell={parentSafeDoingWell ? [parentSafeDoingWell] : []}` (sanitized via `sanitizeParentFacingText` during fetch) instead of empty array.

**What the parent dashboard now shows:**
- Level Card: Current Level (lime icon, bold name) + Next Level (arrow + name)
- Child's Progress: Doing Well (sanitized coach language) + Working On + Next Step
- Why It Matters, How to Support This Week, What to Say After Practice, What Not to Over-Focus On
- Session Consistency (attendance rate + recent session list)
- Approved data banner
- Safety note

**Guardrails confirmed:**
- No raw coach notes exposed
- No audit_logs exposed
- `coachLangDoingWell` sanitized via `sanitizeParentFacingText` before display
- No internal gate history exposed
- No auto-communication triggered
- No migrations

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 123: Player Progress Dashboard V1

Player-safe progress clarity screen at `/player`. No migrations, no schema changes, no internal data exposed.

**Files modified:**
- `docs/CHANGELOG.md` — Sprint 123 entry.

**What satisfies Sprint 123 requirements (already built):**
- `src/app/player/page.tsx` — Comprehensive player dashboard using IDP (Individual Development Plan) with player role view. Shows: PlayerMissionPreview (Today's Mission / Your Strength / Your Mission / Next Win / Current Level), Current Level + Next Level card, "What to Work On" (drill names from curriculum_drills), "What to Understand" (from coach language), "Next Evidence to Show" (gate criteria — player-safe wording only), "This Week's Challenge" (mini_challenge + reflection_question from learning module), "What to Ask Your Coach", Q&A answer, recent session history (attendance only, no notes). Empty state: "Your mission is on its way." All content passes through `buildRoleSpecificIdpView(plan, 'player')` — no internal notes, no audit logs, no raw evidence text, no harsh gate language.
- `src/components/player/PlayerMissionPreview.tsx` — Mission card component (Today's Mission, Your Strength, Your Mission, Next Win, Current Level) with safe empty state.

**Guardrails confirmed:**
- No coach observations exposed
- No audit_logs exposed
- No gate history exposed
- No internal evidence text
- No parent-only guidance visible
- No migrations
- No RLS changes

**TypeScript:** clean (no code changes this sprint).

---

## 2026-05-07 — Sprint 122: Tentative Lesson Plan Preview

Director-only UI. No migrations, no schema changes, no writes before session creation.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/GenerateSessionPanel.tsx` — Added `LessonPlanBlock` interface (id, name, duration_min, notes, exerciseNames). Added `blocks?: LessonPlanBlock[]` prop and `showPreview` state. Added "Preview tentative lesson plan" toggle button (Eye/EyeOff icons). Preview panel shows: session name/date/time/coach, template source, selected focus gates, and blocks in order with duration, notes (clamped), and exercise names. Copy: "Tentative Lesson Plan — Preview only. Session is created after you confirm." Preview only shown when blocks exist.
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added `lessonPlanBlocks: LessonPlanBlock[]` computed from `fitnessBlocks` (maps id, name, duration_min, notes, exerciseNames). Passes `blocks={lessonPlanBlocks}` to `GenerateSessionPanel`.

**Constraints confirmed:**
- No lesson_plan_drafts table created
- No proposed_actions written
- No data written before session creation
- No auto-publish to coach
- No parent/player routes touched
- No migrations

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 121: Today's Focus Gates Selector

Director session generation UI. No migrations, no schema changes, no evidence creation, no player status updates.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Extended `GenerateSessionInput` with optional `focusGateIds: string[]`. Action fetches selected gate criterion/domain/threshold from `curriculum_gates` (scoped by level_id to prevent cross-level spoofing). Appends `[Today's Curriculum Focus]` block to `session_notes` before other curriculum context. Context only — no evidence recorded.
- `src/app/director/fitness/templates/[templateId]/GenerateSessionPanel.tsx` — Added `GateOption` export interface and `focusGates?: GateOption[]` prop. Added `selectedGateIds` state. Added `toggleGate()` handler. Added focus gates checklist section between Notes and the submit button. Checked gates highlighted with lime border. Clarification copy: "This does not record evidence."
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added `curriculum_gates` fetch for `curriculumLevelId` (rawDb, `is_active=true`, ordered by `sort_order`, limit 15). Passes result as `focusGates` prop to `GenerateSessionPanel`. Imports `GateOption` type.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 120: Drill-Into-Block-Notes Population

Director-only server action. No migrations, no schema changes, no parent/player exposure.

**Files created:**
- `src/app/director/fitness/templates/[templateId]/PopulateDrillNotesButton.tsx` — Client button component calling `populateCurriculumDrillNotesAction`. Shows result with per-block details toggle. Disabled when template has no curriculum level or no blocks. Warning copy: "Does not add formal exercise records."

**Files modified:**
- `src/lib/actions/curriculumContentPopulation.ts` — Added `populateCurriculumDrillNotesAction` server action. Queries `curriculum_drills` by `level_min_id`, maps `session_block` → block `type` via `BLOCK_TYPE_TO_SESSION_BLOCKS`. Skips blocks with existing notes (no-overwrite). Writes drill name, objective, coaching cues, success criteria, progressions, and reference footer into `template_blocks.notes`. Returns `PopulateCurriculumBlocksResult` for UI display.
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added "Push Curriculum Drills to Block Notes" card rendering `PopulateDrillNotesButton`. Only shown for fitness templates.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 119: Curriculum Drill Reference Panel

Read-only UI. No migrations, no schema changes, no database.types.ts edits, no writes.

**Files created:**
- `src/components/templates/CurriculumDrillReferencePanel.tsx` — Server Component displaying curriculum drills for a template's assigned level. Groups drills by `session_block` (Warm-Up → Focus → Train → Play → Game order). Per-drill card shows: name, domain badge (color-coded), objective, duration, players_needed, up to 3 coaching cues (defensive JSONB parse via `parseCues`), success_criteria, and progressions easier/harder. Empty state: "No curriculum drills found for this level." Footer: "Reference only — nothing is added to this template automatically."

**Files modified:**
- `src/lib/templates/curriculumTemplateLinks.ts` — Added `CurriculumDrillRow` interface and `getCurriculumDrillsForLevel(levelId, academyId, supabase)` function. Queries `curriculum_drills` table via `rawDb` (not in database.types.ts). Scoped by `level_min_id`, `is_active = true`, academy_id or null (shared drills), ordered by domain → session_block → name, limit 60.
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added `getCurriculumDrillsForLevel` call after curriculum level resolution. Renders `<CurriculumDrillReferencePanel>` between the Curriculum Context card and Version History card when a level is assigned.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 117: Player Gate History Timeline

UI read-only. No migrations, no schema changes, no database.types.ts edits, no parent/player exposure, no gate status mutations.

**Files created:**
- `src/components/player/GateHistoryTimeline.tsx` — Server Component displaying a chronological audit trail of gate activity. Exports `GateAuditEntry` interface. Renders per-entry rows with: event type badge (evidence recorded / gate confirmed / gate waived), timestamp, gate criterion teaser (from payload snapshot or current gate name), actor display name (or "Staff" fallback), evidence count after (for evidence events), status transition (for decision events), "Waiver reason on record" flag when `waiver_reason_present` is true, and evidence text truncated to 80 chars labeled `[Internal]`. Empty state: "No gate activity yet. Record evidence from a gate to start the history."

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Added `audit_logs` query after `playerGateStatuses` block, scoped by `academy_id + action IN [gate_status.evidence_recorded, gate_status.director_decision] + target_id IN (current level gate IDs)`, limit 20. Resolves actor display names via a follow-up `profiles` query on unique actor IDs; falls back to `"Staff"`. Renders `<GateHistoryTimeline />` in the Skill Path tab directly after `<PlayerLevelRequirementsCard />`.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 116: Gate Evidence Threshold Readiness Audit + Safe Badge Logic

UI-only. No migrations, no schema changes, no status writes, no backend mutations.

**Files modified:**
- `src/components/player/PlayerLevelRequirementsCard.tsx` — Added `parseObservationThreshold(threshold: string): number | null` helper that returns a count only when the threshold string explicitly contains the word "observation" (e.g. "3 observations", "needs 3 coach observations"). Performance standards ("7/10 rallies", "80% consistency", "coach discretion") return null and are never parsed. When a parseable target is found, the evidence count display changes from `"N observation(s)"` to `"N / M obs"` (font-mono). When `evidence_count >= parsedTarget` and status is non-terminal, shows a lime-tinted hint: "Evidence count target may be met" + "Director confirmation still required". For non-parseable thresholds with evidence recorded, shows "Review criteria manually" in muted italic. Added `TERMINAL_STATUSES` set (`confirmed`, `waived`, `blocked`) — readiness hint is suppressed for all terminal states.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 115: End-to-End Brian Demo Hardening

UI-only. No migrations, no schema changes, no queries modified.

**Files modified:**
- `src/app/director/curriculum/VoiceOverrideInputPanel.tsx` — Added actionable "Open Review Queue →" link in the success state after a curriculum override draft is created. Previously showed plain text "Draft created — check Review Queue." with no link. Also added `Link` and `ArrowRight` imports.
- `src/app/director/demo/DemoSandboxControls.tsx` — Replaced two `window.location.reload()` calls (post-seed and post-delete) with `router.refresh()` from Next.js `useRouter`. Same behaviour but stays within the Next.js router context, avoiding a full browser navigation. Added `useRouter` import.
- `src/app/director/demo/page.tsx` — Added "Review Queue" quick link to the Quick Links section (Step 6 of the demo flow goes straight to the review queue after creating a curriculum draft). Added `ClipboardList` import.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 114: Mobile UX Masterclass Pass

UI-only. No migrations, no schema changes, no queries modified.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Three touch-target improvements for coaches using the session screen on mobile: (1) Attendance status buttons (P/A/L/E) increased from `w-8 py-1 rounded` to `w-10 py-2 rounded-lg` (~32×20px → ~40×32px min target). (2) Per-block status buttons (Planned/Active/Done/Skipped/Modified) increased `py-0.5` → `py-1.5` with `rounded-lg`. (3) Exercise status buttons (Done/Mod/Skip) increased from `text-[10px] px-2 py-0.5` to `text-xs px-3 py-1.5 rounded-lg` with `gap-1.5`; "Modified" label shortened to "Mod" to prevent overflow at larger size.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 113: Global Empty/Error/Loading State Pass

UI-only. No migrations, no schema changes, no queries modified.

**Files created:**
- `src/app/director/sessions/loading.tsx` — Next.js loading skeleton for sessions list: page header + 6 card-row skeletons matching the real list layout.
- `src/app/director/review/loading.tsx` — Next.js loading skeleton for review queue: header + category strip + tab row + 3 card skeletons with action button placeholders.
- `src/app/director/sessions/overview/loading.tsx` — Next.js loading skeleton for sessions overview: header + 4 summary card skeletons + session list skeleton rows.

**Files modified:**
- `src/app/director/private-lessons/page.tsx` — Replaced inline `div > icon + text` empty state with `EmptyState` component; added `EmptyState` to import.
- `src/app/director/improvement/page.tsx` — Replaced inline `div > icon + text` empty state with `EmptyState` component with descriptive copy; added `EmptyState` to import.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 112: Review Queue Unification Polish

UI label consistency pass. No migrations, no schema changes, no queries modified.

**Files modified:**
- `src/app/director/review/page.tsx` — Three targeted label fixes: (1) Wrap-Ups tab approved section label changed from "Approved — Apply Coming Next" to "Approved — Ready to Apply" now that `ApplyWrapUpDraftControls` is fully functional. (2) Voice Intake tab approved section label changed from "Approved" to "Approved — Ready to Execute" to match the execute controls already rendered for approved voice intake items. (3) Voice Intake empty state icon changed from `Calendar` to `Mic` (semantic match). Removed unused `Calendar` import; added `Mic` import.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 111: Template → Session Flow Polish

UI + minor server action extension only. No migrations, no schema changes. `scheduled_time` already exists in the sessions table.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Added optional `scheduledTime?: string | null` field to `GenerateSessionInput`; wired through to `scheduled_time` in the session insert. Previously sessions were always created with `null` scheduled_time even when the user intended a specific time.
- `src/app/director/fitness/templates/[templateId]/GenerateSessionPanel.tsx` — Added `time` state; added date/time two-column grid (replaces single date field); passes `scheduledTime` to the server action.
- `src/app/director/sessions/new/SessionFromTemplateForm.tsx` — Added `time` state; added `Start time` input field below the date field (Coach moved to its own row); passes `scheduledTime` to the server action.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 110: Fitness Template Builder UX Polish

UI-only. No migrations, no schema changes, no new queries.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx` — Replaced all 3 `window.location.reload()` calls with `router.refresh()` from `next/navigation`. Affected operations: Add Fitness Block, Switch Exercise, Pick Exercise. `router.refresh()` re-fetches server component data and merges it into the current page without a full reload, preserving scroll position and client state. The existing `useEffect(() => { setBlocks(initialBlocks) }, [initialBlocks])` sync pattern already handles the incoming data from `router.refresh()` correctly. Added `useRouter` import.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 109: Coach Session Execution UX Polish

UI-only. No migrations, no schema changes, no new queries, no new components.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — (1) Removed redundant `completedMap` state — it was kept in manual sync with `exerciseStatusMap` (source of truth) and both `handleSave` and `handleQuickStatusChange` now derive `completed: boolean` directly from `exerciseStatusMap`. (2) Removed unused `toggleExercise` function. (3) Added "All present" shortcut button next to "Save" in the attendance card header — marks all roster players as present in one tap. (4) Added per-block exercise completion count badge (`done/total`) in each block header, colored lime or green when complete. (5) Added "Mark all done" quick action per block, positioned opposite the block status pills. (6) Added `markAllPresent` and `markBlockAllDone` helper functions.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 108: Assessment Tab + Assessment History UX Polish

UI-only. No migrations, no schema changes, no new queries.

**Files modified:**
- `src/app/director/players/[playerId]/AssessmentHistoryCard.tsx` — Replaced local `formatDate` with shared `@/lib/utils` version; updated header to `label-xs` pattern with count badge; added per-domain horizontal score bars (colored fill strips, 0–100 width); promoted `promotion_ready` from plain text to green badge; improved empty state with actionable copy.
- `src/app/director/players/[playerId]/QuickAssessmentHistoryCard.tsx` — Replaced local `formatDate` with shared `@/lib/utils` version; updated header to `label-xs` pattern; added dynamic "N of M" count badge; improved empty state copy.
- `src/app/director/players/[playerId]/page.tsx` — Moved `AssessmentHistoryCard` from bottom of Notes tab into Overview tab (after `QuickAssessmentHistoryCard`), where all assessment data now lives together. Removed from `notesSlot`.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 107: Director Gate Confirmation Flow

UI + server action only. No migrations, no schema changes, no database.types.ts changes.

**Files created:**
- `src/app/director/players/[playerId]/confirmGateStatusAction.ts` — Server action allowing `academy_director` or `head_coach` to set a gate to `confirmed` or `waived`. Resolves `academy_id` from authenticated user's profile, verifies academy membership role, verifies player belongs to academy, guards against overwriting terminal statuses, upserts `player_gate_status`, writes `audit_logs` entry, calls `revalidatePath`. Uses `rawDb` cast pattern (consistent with existing gate actions). No external AI calls, no automatic level movement, no parent/player exposure.
- `src/app/director/players/[playerId]/ConfirmGateButton.tsx` — Client component rendered per gate in the Skill Path tab. Returns null for terminal statuses (confirmed, waived, blocked). For `evidence_threshold_met`: shows lime "Confirm gate" button + secondary "Waive" link. For earlier statuses (not_started, observing): shows only "Waive" link. Waive flow expands inline textarea for optional waiver reason (max 1000 chars). Full pending/error states with Loader2 and AlertTriangle.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Added import for `ConfirmGateButton`; added `confirmActions` prop to `PlayerLevelRequirementsCard` (passes a `ConfirmGateButton` per gate, bound to `currentStatus` from `playerGateStatuses`). `PlayerLevelRequirementsCard` already accepts and renders `confirmActions` from Sprint 106.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 106: Gate Status UI in Player Profile

UI-only. No migrations, no schema changes, no database.types.ts changes.

**Files modified:**
- `src/components/player/PlayerLevelRequirementsCard.tsx` — Added `GateStatusRow` interface (exported), `gateStatuses` and `confirmActions` props, `STATUS_CONFIG` badge map (6 statuses), `GateStatusBadge` helper, per-gate status section showing status badge + observation count + last evidence date, and empty state "No evidence recorded yet."
- `src/app/director/players/[playerId]/page.tsx` — Added `playerGateStatuses` fetch after `levelGates` using `rawDb` (consistent with existing pattern); passed `gateStatuses={playerGateStatuses}` to `PlayerLevelRequirementsCard` in `skillPathSlot`.

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 105: Player Profile Command Center Polish

UI/UX polish only. No migrations, no schema changes, no database.types.ts changes, no new queries.

**Files created:**
- `src/components/player/PlayerCommandCenterCard.tsx` — New command center card for the top of the Overview tab. Shows: current level badge + targeting next level, advancement status pill (Ready / In Progress / Not Evaluated), current development focus box (lime highlight or premium empty state), three quick-stat pills (Active Priorities, Gate Criteria, Assessments), latest assessment date + overall score teaser (or empty-state prompt), and a "Next Best Actions" list of 5 directed action prompts with tab labels. All data comes from props already fetched in page.tsx — no new queries.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Restructured Overview tab: (1) added `PlayerCommandCenterCard` as a full-width header card above the two-column layout, answering all 6 key director questions at a glance; (2) demoted "Player Info" card (join date, DOB, status) from the first position in the left column to the last, so development intelligence leads; (3) added import for the new component.

**UX changes:**
- Overview tab now leads with a command center that immediately answers: who is this player, what level, what are they working on, what evidence exists, what needs attention, and what should happen next.
- Development focus is visually foregrounded (lime-accented box vs. plain text).
- Admin data (DOB, join date) is moved below development-relevant content.
- Empty states are premium and action-directing (e.g., "Add coach observations in Notes tab, then use AI Draft").
- Next Best Actions section gives directors a clear directed prompt without requiring navigation knowledge.

**Guardrails confirmed:**
- No migration created or modified
- No `database.types.ts` changes
- No parent/player exposure changes
- No gate evidence backend changes (`recordGateEvidenceAction` untouched)
- No level movement logic added
- No threshold parsing
- No AI prompt/API changes
- No assessment scoring changes
- No new database queries — all props sourced from data already fetched before `overviewSlot`

**TypeScript:** clean.

---

## 2026-05-07 — Sprint 104: Gate Evidence Server Actions

Rewrote the gate evidence path so evidence writes directly to `player_gate_status` and `audit_logs`, replacing the `proposed_actions` stopgap from Sprint 103.

**Files modified:**
- `src/app/director/players/[playerId]/recordGateEvidenceAction.ts` — full rewrite: fetches existing `player_gate_status` row; if confirmed/waived returns a safe error; if row exists updates evidence_count, last_evidence_at, and transitions `not_started → observing`; if no row creates one (UPSERT, fetches `gate_criterion_snapshot` from `curriculum_gates`); writes to `audit_logs`; does not write to `proposed_actions` or `requirement_evidence_links`; uses `rawDb` for `player_gate_status` and `curriculum_gates` (not yet in types)
- `src/app/director/players/[playerId]/GateEvidenceButton.tsx` — copy only: "Submit for review" → "Record evidence", loading state "Submitting…" → "Recording…", success message updated, removed "Goes to director review queue" note, added "Adds evidence to this player's gate progress. Director confirmation comes later."
- `docs/KNOWN_LIMITATIONS.md` — updated migration 059 entry (Sprint 104 unblocked, requirement_evidence_links NOT NULL resolved), added gate evidence architecture section (orphaned proposed_actions records, status transitions, evidence_threshold_met deferred, Sprint 107 confirmation deferred, visibility flags)
- `docs/CHANGELOG.md` — this entry

**Guardrails confirmed:**
- No migration created or modified
- No `database.types.ts` changes
- No write to `requirement_evidence_links`
- No write to `proposed_actions` for new gate evidence
- No automatic gate confirmation
- No automatic level advancement
- No threshold parsing
- `is_player_visible` and `is_parent_visible` remain `false` on all rows — no parent/player exposure
- No AI calls
- No curriculum gates modified
- No assessment behavior changed
- `rawDb` used only for `player_gate_status` and `curriculum_gates` (not yet in types); `audit_logs` write follows same rawDb pattern as `requirementProgressConfirmationAction.ts`

**TypeScript:** clean.

**Live DB prerequisite:** Repair migrations 041 → 042 → 043 → 044 → 060 must be applied before this action works in production. Code is production-ready once DB is repaired and types are regenerated.

---

## 2026-05-07 — Sprint 103 Repair: Gate Status Migration Dependency Repair

Schema repair only. No application code, UI, or `database.types.ts` changes.

**Root cause:** Migration 059 partially applied on the live database with error `42P01: relation "requirement_evidence_links" does not exist`. Migration 041 (`041_requirement_domains.sql`), which creates `requirement_evidence_links`, was never applied to the live DB. The `player_gate_status` table, its indexes, trigger, and both RLS policies were committed by 059 before the failure. The `gate_id` column, its index, and the bootstrap INSERT were never executed.

**Migration created:**
- `supabase/migrations/060_gate_status_repair.sql` — idempotent repair covering the three statements 059 failed to complete: `ALTER TABLE requirement_evidence_links ADD COLUMN IF NOT EXISTS gate_id`, `CREATE INDEX IF NOT EXISTS idx_req_evidence_gate_id`, and the bootstrap `INSERT INTO player_gate_status ... ON CONFLICT DO NOTHING`. Prerequisites: migrations 041–044 must be applied first.

**Docs updated:**
- `docs/KNOWN_LIMITATIONS.md` — replaced the outdated "migration 059 pending" entry with the full partial-apply state, root cause (missing 041), required five-migration application order (041 → 042 → 043 → 044 → 060), warning not to re-run 059, Sprint 104 blocked notice, and updated verification SQL
- `docs/CHANGELOG.md` — this entry

**Guardrails confirmed:**
- Migration 060 does not drop or recreate `player_gate_status`
- Migration 060 does not drop or replace any existing RLS policies
- No parent/player RLS added
- No automatic player level advancement
- No assessment behavior changed
- No `curriculum_gates` rows modified
- No application code changed
- No UI files changed
- `database.types.ts` not touched (regenerate after repair migrations applied to live DB)

**TypeScript:** clean — no application code changed.

---

## 2026-05-06 — Sprint 103: Gate Evidence Foundation Schema

Schema-only sprint. Creates the `player_gate_status` table and extends `requirement_evidence_links` with a nullable `gate_id` column, establishing the foundation for per-player curriculum gate progress tracking.

**Migration created:**
- `supabase/migrations/059_player_gate_status.sql` — `player_gate_status` table with 6-state status lifecycle, `gate_criterion_snapshot` freeze field, `is_player_visible`/`is_parent_visible` flags defaulting false; nullable `gate_id` extension on `requirement_evidence_links`; bootstrap INSERT for existing active players; RLS (staff see + staff manage); updated_at trigger; 6 indexes

**Docs created:**
- `docs/gate-evidence-foundation.md` — purpose, field reference, status lifecycle, snapshot rationale, bootstrap strategy, RLS model, safety guarantees, next sprints

**Docs updated:**
- `docs/CHANGELOG.md` — this entry
- `docs/KNOWN_LIMITATIONS.md` — migration 059 pending live application

**Guardrails confirmed:**
- No UI changes
- No parent/player exposure (`is_player_visible` and `is_parent_visible` default false; no portal reads this table)
- No level movement logic
- No AI decision-making
- No changes to existing `assessments`, `curriculum_gates`, `requirement_evidence_links` behavior
- No changes to `database.types.ts` (regenerate after migration applied to live DB)
- `requirement_evidence_links.requirement_id` remains NOT NULL (Sprint 104 will address gate-only evidence path)

**TypeScript:** clean — no application code changed.

---

## 2026-05-06 — Sprint 101: Coach Notes + AI Draft UX Polish + Manual Test Hardening

UX polish pass on the Notes tab in `/director/players/[playerId]`. Reordered the workflow so Capture forms appear before the AI Draft panel. Added a workflow banner ("Capture → Structure → Review → Apply"), internal safety badge, and clearer copy throughout. Folded AddObservationForm and AddVoiceNoteForm into NotesAIDraftSection so capture is in the correct position in the flow. Added Sprint 101 manual test checklist (34 checks). No schema, migration, database.types.ts, auth, parent/player, or AI prompt changes.

**Files modified:**
- `src/app/director/players/[playerId]/NotesAIDraftSection.tsx` — major rework: workflow header, internal safety banner, Capture → Structure → Review → Apply layout, AddObservationForm and AddVoiceNoteForm folded in with new props
- `src/app/director/players/[playerId]/CoachObservationsFeed.tsx` — "Use this note for AI Draft ↓" button (was muted text link), better empty state
- `src/components/player/AIDraftPanel.tsx` — "Internal only" badge, helper copy: "AI creates a draft — not an official update", note that applying saves to internal summary only
- `src/components/player/AddVoiceNoteForm.tsx` — header renamed "Transcript-First Voice Note", copy clarifies transcript-first, no audio recording
- `src/components/player/AddObservationForm.tsx` — header renamed "Add Coach Observation", helper copy added
- `src/components/player/DevelopmentSummarySection.tsx` — "Applied Development Summary" header with "Internal" badge and "AI Draft Applied" badge, improved empty states
- `src/app/director/players/[playerId]/page.tsx` — two new props on NotesAIDraftSection (onSubmitObservation, onSubmitVoiceNote), removed redundant standalone form renders, removed unused imports
- `docs/V1_MANUAL_TEST_CHECKLIST.md` — Sprint 101 section added (34 checks: capture, voice note, AI draft, overwrite, apply, show_to_student/parent verification, empty states)
- `docs/CHANGELOG.md` — this entry

**Guardrails confirmed:**
- No schema or migration created
- No database.types.ts changes
- No AI prompt or Anthropic API logic modified
- No parent/player route exposure
- No voice recording or audio upload added
- `show_to_student` and `show_to_parent` remain `false` on all AI-applied drafts (unchanged)

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 100: AI Note Structuring MVP — Security Hardening

Added staff membership gate to `generateNoteDraftAction` in `src/lib/actions/notes.ts`. The action now verifies the caller holds an active `academy_director`, `head_coach`, or `coach` membership before calling the Anthropic API. Non-staff authenticated users receive a safe error message and the note text is never forwarded to the external API. TypeScript clean. No schema, migration, or database.types.ts changes. No player/parent exposure changes.

**Files modified:**
- `src/lib/actions/notes.ts` — added `academy_memberships` active-staff check before `structureCoachNote()` call
- `docs/CHANGELOG.md` — this entry
- `docs/CURRENT_BUILD_TARGET.md` — AI Note Structuring MVP marked complete

**Guardrails confirmed:**
- Raw note text is not logged
- AI API call only occurs after staff check passes
- `show_to_student` and `show_to_parent` remain `false` on all AI-applied drafts
- No player or parent routes modified

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 99: AI Suggestion Data Readiness Audit

Audited every data domain in Academy OS for AI lesson planning and suggestion readiness. Documented per-domain status (template structure, session planned data, session actuals, coach notes, attendance, player observations, assessments, curriculum), identified the top 10 data fields needed next (priority-ranked), listed the 6 critical gaps that block AI suggestions today, defined 8 safe AI suggestion guardrails (never auto-apply, never mutate curriculum, confidence gate, minimum session count, director override always wins), and recommended the next 3 actions (migrations 059–063, persist block status, add source_template_version). No code changes — audit only.

**Files created:**
- `docs/ai-suggestion-data-readiness-audit.md` — Full domain audit, top-10 field priority list, guardrails, and next-action recommendations.

**Files modified:**
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 98: Template Version History Readiness

Template version history doesn't exist yet — no `template_versions` table, no version column. Added a placeholder "Version History" card to the fitness template detail page showing created/modified dates and an internal note: "Template version history is not yet enabled — apply migration 064 to activate." Created `docs/template-version-history-plan.md` documenting proposed `template_versions` + `template_version_blocks` tables, migration plan (064–068), RLS patterns, and the UI design.

**Files created:**
- `docs/template-version-history-plan.md` — Full version history plan: tables, migration sequence, RLS, UI spec.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added Version History placeholder card.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 97: Session Archive Timeline V1

Created `/director/sessions/archive` page — a read-only timeline of completed sessions grouped by month. Each session card shows date, coach, group, duration, and a preview of `session_notes`. Timeline uses a vertical line + dot visual. Links to full session detail. Added "Archive" button to the sessions list page header.

**Files created:**
- `src/app/director/sessions/archive/page.tsx` — Read-only completed-sessions timeline, grouped by month.

**Files modified:**
- `src/app/director/sessions/page.tsx` — Added Archive link to PageHeader.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 96: Session Actuals Normalized Schema Plan

Created `docs/session-actuals-normalized-schema-plan.md` documenting the full normalized schema for session actuals: `session_actuals`, `session_actual_blocks`, `session_actual_exercises`, `session_actual_attendance`. Includes audit trail, parent/player visibility flag design, RLS policy patterns, AI readiness hooks, and migration plan (059–063). No migration applied — requires explicit STOP + approval before proceeding.

**Files created:**
- `docs/session-actuals-normalized-schema-plan.md` — Full schema plan: tables, columns, RLS, parent-safety, AI readiness, migration sequence.

**Files modified:**
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean (no code changes).

---

## 2026-05-06 — Sprint 95: Planned vs Actual Session Diff V1

Enhanced `PlannedVsActualDiffPanel` to also show exercise-level actuals from `session_block_exercises`. Each block row now expands inline to list its exercises with Done/Skipped/Modified icons, exercise names, and coach notes (the `[Skipped]`/`[Modified]` prefixes from Sprint 94 are detected and displayed with appropriate color-coding). Panel is read-only. Updated director session detail page to pass `sessionExercises` to the panel.

**Files modified:**
- `src/app/director/sessions/[sessionId]/PlannedVsActualDiffPanel.tsx` — Added `sessionExercises` prop, exercise grouping, and exercise-level diff rows under each block.
- `src/app/director/sessions/[sessionId]/page.tsx` — Pass `sessionExercises` mapped from existing `exercises` data to `PlannedVsActualDiffPanel`.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 94: Coach Live Session Exercise Editing V1

Added explicit Done / Modified / Skip status buttons per exercise in `CoachSessionExecutionClient`. Previously exercises only had a boolean checkbox; now each exercise shows three status buttons. Status maps to `session_block_exercises.completed` (done/modified→true, skipped→false) and prepends `[Skipped]` or `[Modified]` to notes so the director diff view can distinguish them. Added skipped-count to the progress display. Added "Session edits only — master template is unchanged" safety label. All changes affect `session_block_exercises` only — `template_block_exercises` is never touched.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Added `exerciseStatusMap`, `setExerciseStatus`, Done/Modified/Skip buttons per exercise, skipped-count display, safety label.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 93: Coach Assigned Sessions View Polish

Rewrote `CoachSessionsPage` (`/coach/sessions`) to show Today / Upcoming / Completed clearly. Today sessions render as prominent cards with an "Open" CTA button; active sessions get a lime highlight. Upcoming and Completed use compact rows with status badges. Removed the "Coming soon" footer. Added a recent-completed-sessions query. Hides cancelled sessions from Upcoming.

**Files modified:**
- `src/app/coach/sessions/page.tsx` — Full rewrite with three-section layout, SessionCard + SessionRow components, completed sessions query.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 92: Generate Session from Fitness Template V1

Wired the existing `GenerateSessionPanel` (previously built but not rendered) into the fitness template detail page. The director can now click "Create Session from Template," choose a date, coach, and optional notes, and generate a dated session that is a copy of the template at that moment. The master template is unchanged. Exercises and blocks are copied via `generateSessionFromTemplateAction`. A link to the created session is shown on success. Added coaches data fetch (all active academy_director/head_coach/coach members) to the server component.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added `GenerateSessionPanel` import, coaches + fallback-coach data fetch, and panel render inside a Card below the Template Settings card.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 91: Save Template / Save As Template Controls

Added `updateFitnessTemplateMetaAction` (updates name/description/duration on an existing fitness template) and `duplicateFitnessTemplateAction` (creates a full copy with all blocks and exercises) to `fitnessTemplateActions.ts`. Created `TemplateMetaEditorCard.tsx` client component with collapsible "Edit & Save Template" and "Save As New Template" sections. Wired into the fitness template detail page. Source template is never modified during duplicate.

**Files created:**
- `src/app/director/fitness/templates/[templateId]/TemplateMetaEditorCard.tsx` — Client component with save + duplicate flows.

**Files modified:**
- `src/app/director/fitness/fitnessTemplateActions.ts` — Added `updateFitnessTemplateMetaAction` and `duplicateFitnessTemplateAction`.
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added `TemplateMetaEditorCard` import and render.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 90: Template Auto-Populate Live UI Refresh

Root cause: `FitnessTemplateBuilderClient` initializes `useState(initialBlocks)` once on mount. After `populateFitnessTemplateBlocksAction` succeeds and `router.refresh()` is called, the Server Component re-renders with new blocks data but React does not reset existing state — exercises never appeared without a hard reload.

Fix: Added `useEffect(() => { setBlocks(initialBlocks) }, [initialBlocks])` to sync client state whenever the server delivers new props. `router.refresh()` was already in place in `PopulateFitnessBlocksButton` — only the client-state sync was missing.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx` — Added `useEffect` import + state sync on `initialBlocks` change.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 89: Fix template block exercise RLS

Root cause: `template_block_exercises` was created in migration 006 with RLS enabled but no policies. Migration 055 wrote the correct fix but was never applied to the live database. Migration 058 supersedes 055 with idempotent `DROP POLICY IF EXISTS` guards and separate SELECT / INSERT / UPDATE / DELETE policies (explicit `WITH CHECK` on INSERT and UPDATE), scoped through `block_id → template_blocks → templates → academy_id`. No app code changes — the `populateFitnessTemplateBlocksAction` was already correct.

**Root cause confirmed:** PostgreSQL denies all access when RLS is active and no policy matches, producing "new row violates row-level security policy for table template_block_exercises" on every INSERT attempt.

**Files created:**
- `supabase/migrations/058_template_block_exercises_rls.sql` — Idempotent RLS policies for template_block_exercises: SELECT, INSERT (WITH CHECK), UPDATE (WITH CHECK), DELETE. Supersedes migration 055.

**Files modified:**
- `docs/CHANGELOG.md` — This entry.
- `docs/KNOWN_LIMITATIONS.md` — Updated template_block_exercises section; migration 058 is now the canonical live-DB fix.

**TypeScript:** clean (no TS changes).

**To activate:** Apply `supabase/migrations/058_template_block_exercises_rls.sql` to the live Supabase instance via SQL Editor. Paste the full file and Run. No restart required.

---

## 2026-05-06 — Sprint 88: Live Transcription Activation + gitignore

Created `.gitignore` (was entirely missing — `.env.local` was untracked but unprotected). Now covers: `.env.local`, `.env`, `.next/`, `node_modules/`, `tsconfig.tsbuildinfo`, `supabase/.temp/`, `.vscode/`, OS artifacts. Confirmed `OPENAI_API_KEY` is NOT yet in `.env.local` — manual key addition required. Confirmed endpoint reads key via `process.env.OPENAI_API_KEY` (server-side only, safe). TypeScript clean.

**Live transcription smoke test:** Cannot be run automatically — requires manual steps: add key to `.env.local`, restart dev server, open coach session, tap Record, speak, tap Stop, verify transcript appears. Full QA checklist is in `docs/V1_MANUAL_TEST_CHECKLIST.md` (Sprint 78–87 checks, rows 79.1–80.7).

**Files created:**
- `.gitignore` — Full Next.js gitignore: env files, build output, node_modules, IDE, OS, Supabase temp.

**Files modified:**
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 88 limitation.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 87: End-to-End Voice Assistant Demo Hardening

Hardened the full voice assistant demo flow (Sprints 78–87) for production demo readiness. Updated Brian demo script with a complete 10-step voice+approval path covering: director voice command, coach audio recording, transcript review, name guardrails, wrap-up save, director approve/apply. Added a comprehensive Sprint 78–87 QA checklist covering 35 test cases: transcription endpoint guards (auth, MIME, size), audio recorder states, name detection, audit log, approve/reject/apply controls, director voice routing, TTS stop button, parent/player portal safety. Updated documentation for current sprint scope.

**Files modified:**
- `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` — Complete voice+approval demo path (Sprints 67–87).
- `docs/V1_MANUAL_TEST_CHECKLIST.md` — Updated to Sprint 87; added 35-check Sprint 78–87 QA table.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 87 note.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 86: Assistant Voice Quality + TTS Upgrade Readiness

Documented the full production TTS upgrade plan including: why browser `speechSynthesis` is prototype-only, production TTS options (OpenAI TTS recommended, ElevenLabs premium), voice personality spec per role, what can/cannot be spoken aloud, cost controls, caching policy, academy voice settings design, accessibility rules, and a phased implementation roadmap (V2: OpenAI TTS, V3: ElevenLabs). Added "Stop Speaking" button next to the voice toggle in CoachWrapUpDrawer — visible only when voice output is active. Updated assistant-personality-and-voice-guidelines.md with link to TTS upgrade plan.

**Files created:**
- `docs/assistant-tts-upgrade-plan.md` — Full TTS upgrade plan: options, voice spec, safety rules, cost controls, implementation roadmap.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Added "Stop" button next to voice toggle; imported `Square` icon.
- `docs/assistant-personality-and-voice-guidelines.md` — Added section 7 link to TTS upgrade plan.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 86 note.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 85: Director Assistant Voice Draft Intake V1

Added voice input and a text command field to the Director Assistant Panel. A text input + `VoiceInputButton` now appears at the top of the panel. Spoken or typed commands are matched deterministically to the 7 existing suggestion topics (review, wrap-ups, attendance, assessment, placement, curriculum, sessions) — no AI required. On a match, the corresponding response card activates automatically. On no match, a safe fallback: "I can help with: review, wrap-ups, attendance, players, assessment, curriculum, and sessions." No command executes automatically. Typing Enter also triggers matching. Nothing is saved. No external API.

**Files modified:**
- `src/app/director/command-center/DirectorAssistantPanel.tsx` — Added `VoiceInputButton`, text input, `VOICE_ROUTES` matcher, command state, unmatched fallback.
- `docs/V1_MANUAL_TEST_CHECKLIST.md` — Added S85 check.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 85 note.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 84: Apply Approved Wrap-Up to Session Actuals

The apply-to-session-actuals action was already fully built (`applyWrapUpDraftAction`). This sprint confirms the full flow: approved wrap-up → Apply button → session notes written + session marked completed + audit log written + proposed_action marked executed. Updated stale copy in `WrapUpDraftCard` safety note ("Apply action (Sprint 19) will be required" → accurate description of actual flow). Planned session and template remain untouched. Parent/player exposure: none. Migration: not required — `session_notes` and `status` columns exist.

**Files modified:**
- `src/app/director/review/WrapUpDraftCard.tsx` — Updated safety note to describe actual apply flow.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 84 note.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 83: Director Wrap-Up Approve/Reject Polish

The director review queue approve/reject controls for session wrap-up drafts were fully built in prior sprints. This sprint confirms and polishes: `WrapUpDraftDecisionControls` (Approve, Reject, Needs Clarification + optional note), `updateWrapUpDraftDecisionAction` (full auth/academy/session checks, safe status transitions), `ApplyWrapUpDraftControls` (apply button post-approval), and `applyWrapUpDraftAction` (session notes write + audit log). Updated decision copy to be clearer: "Nothing changes until you explicitly apply. No player, parent, or curriculum record is touched by this action."

**Files modified:**
- `src/app/director/review/WrapUpDraftDecisionControls.tsx` — Updated decision warning copy.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 83 note.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 82: Voice Privacy Audit Readiness

Added best-effort audit log writes to the transcription endpoint — event metadata only (academy, user, session, provider, file size, `audio_retained: false`). Transcript text and audio are never logged. Created `docs/voice-audit-log-plan.md` documenting current coverage, planned future fields (no schema change needed — all fit in existing `payload` JSONB), and the planned director voice privacy settings card. Privacy UI copy is already in `AudioRecorderButton`.

**Files created:**
- `docs/voice-audit-log-plan.md` — Current audit coverage, planned future fields, privacy card spec.

**Files modified:**
- `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts` — Added best-effort `audit_logs` write after successful transcription.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 82 limitation.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 81: Transcript Player Name Guardrails

Added deterministic name detection to the Coach Wrap-Up summary review phase. When the coach reaches the summary, all answers are scanned for capitalized words. Words matched to session roster first names are listed as "Roster names mentioned." Words that look like names but are not on the roster trigger an orange warning: "We heard a name that is not on this session roster. Do not save as a player note unless you confirm who it is." No AI, no external calls, no auto-actions. Detection filters out common non-name words (days, months, generic terms).

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Added `COMMON_NON_NAMES` constant, `useMemo`-based name detection, name guardrail UI panel in summary phase.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 81 limitation.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 80: Coach Audio Recorder UI V1

Added `AudioRecorderButton` — a production-ready MediaRecorder component that captures a short audio clip, sends it to the Sprint 79 transcription endpoint, receives the transcript, and appends it to the current answer textarea. Shows timer (max 60s), "Transcribing…" state, and a safe error message when the endpoint is not configured. The existing `VoiceInputButton` (browser SpeechRecognition) is retained as "Browser Dictation" option. Privacy copy: "Audio is used only to create a transcript and is not saved. Review and edit before saving. Nothing is saved until you tap Save Wrap-Up."

**Files created:**
- `src/components/assistant/AudioRecorderButton.tsx` — MediaRecorder UI: record, stop, auto-stop at 60s, timer, transcribing state, endpoint call, error handling.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Imported `AudioRecorderButton`; added it above `VoiceInputButton` in the question step; both options visible with "or" separator.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 80 limitation.
- `docs/V1_MANUAL_TEST_CHECKLIST.md` — Updated sprint number to 80; added S78/S79/S80 checks.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 79: Secure Coach Transcription Endpoint V1

Added a secure server-side API route that receives a short audio clip, sends it to OpenAI Whisper, returns the transcript, and discards the audio. Auth, academy membership, session access, role, MIME type, and file size are all checked before the STT call. When `OPENAI_API_KEY` is not configured, returns a safe 503. No audio is written to storage. No transcript is logged. No OpenAI SDK dependency — uses plain `fetch` + `FormData`.

**Files created:**
- `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts` — POST endpoint: auth, academy, session access, staff role check, MIME/size validation, Whisper call, transcript response.

**Files modified:**
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 79 endpoint limitation.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 78: Voice Transcription Security Architecture

Documented the production voice transcription architecture, security controls, and privacy rules for the Coach Wrap-Up audio input path. Defines the complete data flow from MediaRecorder to Whisper API to transcript-in-textarea, with explicit rules for no audio storage, no auto-save, no parent/player exposure, and no client-side API keys. Includes cost controls, STT provider decision, fallback chain, and future hardening roadmap.

**Files created:**
- `docs/voice-transcription-security-architecture.md` — Full architecture doc: product goal, data flow, hard rules, security controls, privacy/junior safety, STT provider spec, cost controls, future roadmap.

**Files modified:**
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 78 voice transcription architecture limitation.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean (docs-only sprint).

---

## 2026-05-06 — Sprint 77: Coach Assistant Voice Input V1

Added browser-native voice input to every question step in the Coach Wrap-Up assistant. A "Speak" mic button appears below the answer textarea. When tapped, it uses `SpeechRecognition` / `webkitSpeechRecognition` to capture speech and appends the transcript to the existing answer. On unsupported browsers (Firefox, iOS Safari), the button is replaced with a clear fallback note. No audio is recorded, stored, or uploaded. No external API. Coach reviews and edits every transcript before saving. The existing save flow is unchanged.

**Files created:**
- `src/components/assistant/VoiceInputButton.tsx` — Reusable client component; browser SpeechRecognition only; idle/listening/unsupported states; appends transcript to existing answer; fallback note on unsupported browsers.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Imported and placed `VoiceInputButton` below the answer textarea on every question step.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 77 voice input limitations section.
- `docs/V1_MANUAL_TEST_CHECKLIST.md` — Updated to Sprint 77; added S77 quick check row, Sprint 77 voice input checks table, and known voice input limitations section.
- `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` — Added optional Step 7b for voice input demo with speak-and-review script.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 76: End-to-End Assistant Demo Polish

Cleaned up sidebar navigation to show only built routes. Removed unbuilt items (Intelligence, Competition, Reports, Configuration) from director sidebar. Updated the manual test checklist with a full Sprint 67–76 quick-check table and 13-step assistant demo flow. Updated the Brian interactive demo script with a structured 10-step assistant demo path covering both director and coach views. Added Sprint 72 voice output and Sprint 73 director assistant limitations to the known limitations doc.

**Files modified:**
- `src/components/nav/SidebarNav.tsx` — Removed 4 unbuilt nav items and their unused icon imports (`Brain`, `Trophy`, `BarChart3`, `Settings`).
- `docs/V1_MANUAL_TEST_CHECKLIST.md` — Updated to Sprint 76. Added Sprint 67–76 quick-check table, 13-step assistant demo flow table, and known voice output limitations section.
- `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` — Added 10-step "Assistant Demo Path (Sprints 67–76)" with pre-demo setup, step scripts, and one-sentence demo summary.
- `docs/KNOWN_LIMITATIONS.md` — Added Sprint 72 voice output limitation and Sprint 73 director assistant deterministic limitation.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 75: Assistant Personality + Voice System Guidelines

Documented the complete assistant personality, language rules, safety boundaries, and future voice direction. Covers all four roles: coach, director, parent, player. Includes voice output rules, ElevenLabs future spec, and 4 example prompt scripts. Also created an internal constants file with wrap-up questions, speech settings, and role-specific language maps.

**Files created:**
- `docs/assistant-personality-and-voice-guidelines.md` — Full personality and voice guidelines doc (8 sections).
- `src/lib/assistant/personality.ts` — Internal constants: wrap-up questions, speech settings, parent/player language maps.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 74: Director Assistant Review/Approval Cards

Created reusable `AssistantActionCard` component. Updated `DirectorAssistantPanel` to use it for all suggestion responses. Each response now shows: suggested action summary, why it matters, what will change (expandable), visibility scope, risk level badge, action link, safety note, and dismiss button.

**Files created:**
- `src/components/assistant/AssistantActionCard.tsx` — Reusable director assistant card with suggested action, why, what changes (expandable), visibility, risk level badge, action link, dismiss.

**Files modified:**
- `src/app/director/command-center/DirectorAssistantPanel.tsx` — Switched inline response card to `AssistantActionCard`. Added `whatWillChange`, `visibility`, `riskLevel` fields to each suggestion response.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 73: Director Assistant Command Center V1

Added a deterministic Director Assistant panel above the existing Command Center. Shows 7 suggested queries the director can tap — each produces a real-data inline response: count summary, why it matters, action link, and safety note. No AI required. Queries are: what needs review, pending wrap-ups, attendance concerns, players needing assessment, pending placements, curriculum, session from template. Updated the command center page to fetch assistant counts (wrap-ups, placements, assessment due).

**Files created:**
- `src/app/director/command-center/DirectorAssistantPanel.tsx` — Client component with suggestion chips and deterministic response cards.

**Files modified:**
- `src/app/director/command-center/page.tsx` — Added 3 additional count queries, passes counts to `DirectorAssistantPanel`, renders panel above CommandCenterClient.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 72: Coach Assistant Voice Output Prototype

Added browser `speechSynthesis` voice output toggle to the Coach Wrap-Up assistant. When enabled, the assistant reads each question aloud as the coach steps through the flow. Toggle is only shown when `speechSynthesis` is available in the browser. Default off. Safety note: "Voice output only. You still type or use your device keyboard." No recording, no STT, no external API.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Added `voiceEnabled` state, `Volume2`/`VolumeX` icons, voice toggle button (shown only when browser supports speechSynthesis), `useEffect` to speak questions on step change and cancel on unmount/disable.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 71: Coach Assistant Review Summary V1

Enhanced the wrap-up summary phase to show a clear "Here's what I understood" assistant summary: block completion counts, queued observations count, next focus preview, and which content will go to director review. Added "Not shared with parents or players" lock note. Renamed "Save Recap" button to "Save Wrap-Up". Changed "Back" to "Edit". Added "Save as quick note" secondary option when some questions are unanswered.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Enhanced summary phase header with assistant summary block, visibility note, save/not-save clarity. Added "Save as quick note" fallback for incomplete wrap-ups.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 70: Coach Assistant Text Flow V1

Enhanced the Coach Wrap-Up flow to feel like a guided assistant: added "Academy OS asks" question label, quick-answer shortcut buttons for yes/no questions (attendance, block completion), added "Under 60 sec" time label next to step counter, renamed header to "Assistant · Wrap-Up". All existing persistence and navigation unchanged.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Added assistant framing ("Academy OS asks" label, "Under 60 sec" tag, "Assistant · Wrap-Up" header), quick-answer buttons for attendance and blocks questions that pre-fill and advance automatically.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 69: Director Mission Control Dashboard Polish

Fixed all broken dashboard card links (were pointing to non-existent routes). Added "Today's Priorities" section header. Renamed "Voice Note AI" quick action to "Review Queue". Renamed "Academy Intelligence" quick action to "Signals". Removed dead code (`completedMissingNotes` with `false` predicate, stale `BookMarked` unused import). Fixed all alert panel hrefs to use existing routes.

**Files modified:**
- `src/app/director/page.tsx` — Fixed broken hrefs, added "Today's Priorities" label, renamed quick actions, removed dead code, replaced `BookMarked` stale import.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 68: Coach Session Mobile Masterclass Layout

Restructured the coach session page to improve the mobile experience: attendance prompt now appears before the gap brief panel, "Wrap Up Session" is a full-width lime primary CTA, and "Quick Note" is a secondary ghost button. The gap brief panel moves to the bottom of the page.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/page.tsx` — Reordered: attendance prompt → session actions (wrap up CTA) → recap panel → gap brief. Removed unused `CardHeader`/`SectionHeader` imports.
- `src/app/coach/sessions/[sessionId]/CoachSessionActions.tsx` — Redesigned layout: full-width lime "Wrap Up Session" primary button, small ghost "Quick Note" secondary button. Removed 2-column icon tile grid.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 67: Role-Based UX Simplification Audit

Created a full audit of all four role experiences (director, coach, parent, player) documenting what is clear, what is cluttered, mobile risks, language gaps, and the assistant integration strategy. Includes Top 20 UX simplification fixes and recommended design rules.

**Files created:**
- `docs/role-based-ux-simplification-audit.md` — Full role-based UX audit with 7 sections and 20 prioritised fixes.

**TypeScript:** no code changes — audit doc only.

---

## 2026-05-06 — Sprint 66: Director New Player Wizard V1

Added a single-player creation form at `/director/players/new`. Directors can add a player with name, date of birth, gender, and optional notes. Player is created with `pending_placement` status and the director is redirected to the new player profile.

**Files created:**
- `src/app/director/players/new/page.tsx` — Simple server component: back link, page header, Card wrapping `NewPlayerForm`.
- `src/app/director/players/new/NewPlayerForm.tsx` — Client form: first name, last name, date of birth (required), gender select, notes textarea. Calls `createPlayerAction` and shows error inline on failure.
- `src/app/director/players/new/createPlayerAction.ts` — Server action: authenticates user, resolves academy_id from profiles, verifies role (director/head_coach via academy_memberships), validates required fields, inserts players row with `status = 'pending_placement'`, redirects to `/director/players/${id}`.

**Files modified:**
- `src/app/director/players/page.tsx` — Added `UserPlus` import and "Add player" lime button linking to `/director/players/new`, placed to the left of the existing Import button.

**Safety:** Director/head_coach only. Role verified via `academy_memberships`. `academy_id` from auth profile — never from user input. No RLS bypass. New player starts at `pending_placement` — placement engine controls activation.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 65: Coach Session Attendance Completion Prompt

Added an attendance completion prompt to the coach session detail page. When roster players have not yet been marked, an orange banner appears above the Recap panel reminding the coach to complete attendance before saving.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/page.tsx` — Added `AlertTriangle` lucide import. Computed `unmarkedAttendanceCount` (roster players where `currentStatus === null`). Added orange banner between the session execution section and `CoachRecapCommandPanel`: shows count of unmarked players, visible only when `roster.length > 0 && unmarkedAttendanceCount > 0`.

**Safety:** Coach-only view. Read-only prompt — no mutations. No schema changes.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 64: Director Player List Assessment Context

Enhanced the player directory list to show each player's most recent overall assessment score and score delta alongside the last-assessed date.

**Files modified:**
- `src/app/director/players/_components/PlayersDirectoryClient.tsx` — Assessment column (hidden on small screens) now shows: overall_score as a large mono number, score_delta with +/- sign in green/red, last-assessed relative date, and next-due date. `overall_score` and `score_delta` are already present on `VPlayerSummary` from `v_player_summary` view — no additional fetch needed.

**Safety:** Director-only read. No mutations. No schema changes. Score data is already fetched via existing `getPlayerSummaries` call.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 63: Parent Portal Attendance History Polish

Polished the "Session Consistency" card in the parent portal: formatted dates, humanized status labels, and surfaced the late-attendance count.

**Files modified:**
- `src/app/parent/page.tsx` — Attendance list: formatted raw ISO date strings to "Mon, Apr 15" style using `toLocaleDateString`. Humanized status labels: `present` → "Attended", `late` → "Attended late", `excused` → "Excused", `absent` → "Missed". Removed uppercase raw status badge; `absent` now uses a neutral muted style rather than alarming red. Added late count sentence ("N sessions attended late") above the session list when `lateCount > 0`. Replaced `null` session name fallback from "Session" to "Training session".

**Safety:** Parent-safe. Read-only display changes only. No schema changes. No score or internal note exposure.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 62: Player Portal Current Curriculum Level Card

Added a "Current Level" card to the player portal, positioned above "What to Work On". Shows the player's current level name prominently with stage label and the next level name when available.

**Files modified:**
- `src/app/player/page.tsx` — Added `currentLevelStage` and `nextLevelDisplayName` outer-scope variables (assigned inside the curriculum fetch block). Added a "Current Level" card in the `idpView &&` section: lime icon, current level name, stage label, next level name on the right. Renders only when `idpView.current_level` is set.

**Safety:** Player-safe. Reads only level name and stage from curriculum_levels, which are already fetched for IDP. No internal assessment data, notes, or score exposure.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 61: Signals Dashboard Attendance Concern Signal

Added an "Attendance concerns" signal bucket to `/director/signals`. Surfaces players with 2 or more absences in the last 30 days, sorted by absence count descending. Links to each player's profile.

**Files modified:**
- `src/app/director/signals/page.tsx` — Added `AttendanceConcernSignal` interface. Fetches recent session IDs for the academy (last 30 days), then queries `session_attendance` for `status = 'absent'` against those session IDs, aggregates by player_id in JS, filters for 2+ absences, batch-fetches names from `v_player_summary`. Renders new "Attendance concerns" `SignalSection` with red accent between wrap-ups and lesson requests. Extended `SignalSection` accent type union and maps to include `red`.

**Safety:** Director-only read. No mutations. No schema changes. No parent/player exposure.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 60: Director Player Assessment History Section

Added a full "Assessment History" card to the director player profile Notes tab, showing the last 10 assessments across all types (intake, quarterly, reassessment, promotion, ad_hoc).

**Files created:**
- `src/app/director/players/[playerId]/AssessmentHistoryCard.tsx` — Display component. Shows each assessment with a type badge (color-coded per type), date, overall score, domain scores (Tech/Tact/Mvmt/Comp/Bhvr) as numeric values with score-based color coding, notes snippet, assessor name, baseline and promotion-ready flags. Empty state when no assessments exist.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Added `AssessmentHistoryCard` import. Added fetch: queries `assessments` for all types for this player, ordered by `assessed_date DESC`, limit 10. Batch-fetches assessor display names. Passes enriched array to `AssessmentHistoryCard` at the bottom of the Notes tab.

**Safety:** Director-only read. No parent/player exposure. No schema changes. No level movement.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 59: Coach Wrap-Up Player Notes Persistence Verification

Verified `saveWrapUpObservationsAction` is correct and working. Improved coach feedback: queued observation count is shown before save, and saved/error count is shown in the confirmation state.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Added `observationsSaved` and `observationsError` state. Captured result of `saveWrapUpObservationsAction` and stored count. Added "X observations queued" notice above Save Recap button. Added "X observations saved" or partial-error message in saved confirmation state.

**What was verified:** `saveWrapUpObservationsAction` already correctly: authenticates, resolves academy_id, verifies coach role, verifies session belongs to academy, verifies each player, inserts into `coach_observations` with `is_private = true`. No fix needed — only surfaced result to coach.

**Safety:** Coach explicit Save required. Notes stay internal (`is_private = true`). No parent/player exposure. No schema changes.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 58: Director Quick Assessment History Card

Added a "Quick Rating History" card to the director player profile Overview tab, showing the last 3 ad-hoc assessments with date, domain labels, note snippet, and assessor name.

**Files created:**
- `src/app/director/players/[playerId]/QuickAssessmentHistoryCard.tsx` — Pure display component. Shows last 3 ad-hoc assessments. Converts raw scores (25/50/75/100) back to labels (Needs support/Developing/Solid/Strong) with color coding. Shows note snippet with line-clamp. Empty state when no ratings exist yet.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Added `QuickAssessmentHistoryCard` import. Added fetch: queries `assessments` for `type = 'ad_hoc'`, `player_id`, `academy_id`, ordered by `created_at DESC`, limit 3. Batch-fetches assessor display names. Passes enriched array to `QuickAssessmentHistoryCard` in Overview left column below `QuickAssessmentPanel`.

**Safety:** Director-only read. No parent/player exposure. No schema changes. No level movement.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 57: Session Block Status Persistence — Migration Plan

**STOPPED FOR MIGRATION APPROVAL.** Frontend implementation gated on migration approval and type regeneration.

Audited `session_blocks` schema — confirmed no `actual_status`, `status`, or `progress` column exists. A migration is required before server action and frontend persistence can be built.

**Files created:**
- `docs/session-block-status-persistence-plan.md` — Full plan: root cause, proposed column definition, RLS analysis, post-approval implementation plan, rollback instructions, decision checklist.
- `supabase/migrations/057_session_block_status.sql` — PROPOSAL ONLY (not applied). Adds `actual_status TEXT NOT NULL DEFAULT 'planned' CHECK (IN 'planned','in_progress','completed','skipped','modified')` to `session_blocks`. No new RLS policies needed (existing staff ALL policy covers it via session→academy chain). Includes rollback instructions.

**What was intentionally NOT built:**
- Server action `updateBlockStatusAction` — blocked on migration approval
- `CoachSessionExecutionClient` persistence wiring — blocked
- `CoachWrapUpDrawer` server read — blocked
- `database.types.ts` update — must be regenerated via `supabase gen types` after migration is applied, not manually edited

**Next step:** Apply `supabase/migrations/057_session_block_status.sql` to live Supabase, regenerate types, then approve Sprint 57 continuation.

---

## 2026-05-06 — Sprint 56: Director Assessment Quick Rating V1

Added a "Quick Assessment" panel to the director player profile Overview tab. Directors can rate any combination of the 5 domains (Technical, Tactical, Movement, Competition, Behavioral) on a 4-point scale (Needs support / Developing / Solid / Strong) with an optional note, and save it as an ad-hoc assessment record.

**Files created:**
- `src/app/director/players/[playerId]/quickAssessmentAction.ts` — Server action. Validates auth, academy scope, and director/head_coach role. Verifies player belongs to academy. Inserts `assessments` row with `type = 'ad_hoc'`, `is_baseline = false`, `promotion_ready = false`. Maps ratings 1–4 to scores 25/50/75/100. At least one domain required. Notes capped at 500 chars. Revalidates player profile path.
- `src/app/director/players/[playerId]/QuickAssessmentPanel.tsx` — Client component. Grid of 5 domains × 4 rating buttons. Toggle-select (click same button to deselect). Color-coded selected state. Optional note textarea. Submit calls `quickAssessmentAction`. On success shows confirmation and "Add another" button to reset.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Added `QuickAssessmentPanel` import and placed `<QuickAssessmentPanel playerId={params.playerId} />` in the Overview tab left column, after `DevelopmentProfileSummaryCard`.

**Safety:** Director explicit submit only. `promotion_ready = false` forced. No automatic level movement. No parent/player exposure. No schema changes. No voice pipeline bypass.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 55: Player Portal Recent Session History V1

Added a "Recent Sessions" card to the player portal showing the player's last 10 sessions (last 60 days) with date and attendance status in player-safe language.

**Files modified:**
- `src/app/player/page.tsx` — Added `Calendar` and `CheckCircle` imports. Declared `recentSessionHistory` array. Inside the linked-player block, queries `session_attendance` for the player's own rows (no notes, academy-scoped), then batch-fetches `sessions` by ID for name and date. Builds a sorted array of `{ sessionName, date, status }`. Renders "Recent Sessions" card in the idpView section after the encouragement footer. Status shown as: Attended / Attended late / Excused / Not attended — no internal notes, no raw coach data.

**Safety:** Player sees only their own attendance (scoped by `player_id = playerRow.id` and `academy_id`). No coach notes. No internal session payload. No schema changes. No voice pipeline bypass.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 54: Director Review Queue Batch Actions V1

Added batch dismiss controls to the Voice Intake and Captures tabs of the review queue. Directors can now select multiple items, see a confirmation banner, and dismiss them in one action.

**Files created:**
- `src/app/director/review/batchReviewActions.ts` — Two server actions: `batchDismissVoiceIntakeAction` (sets `proposed_actions.status = 'dismissed'` for selected voice intake items) and `batchDismissCapturesAction` (sets `voice_notes.processing_status = 'dismissed'`). Both require director/head_coach auth, academy scope, max 50 items, and `assertNotPreviewMode`.
- `src/app/director/review/VoiceIntakeBatchPanel.tsx` — Client component replacing the pending section of the Voice Intake tab. Shows select-all toggle, "Dismiss N selected" button, inline confirmation banner with cancel, and optimistic dismissed-state tracking (dismissed items disappear without page reload).
- `src/app/director/review/CapturesBatchPanel.tsx` — Same pattern for the Captures tab, calling `batchDismissCapturesAction`.

**Files modified:**
- `src/app/director/review/page.tsx` — Added imports for `VoiceIntakeBatchPanel` and `CapturesBatchPanel`. Replaced pending voice intake loop with `<VoiceIntakeBatchPanel pending={pendingVoiceIntakeDrafts} />`. Replaced captures loop with `<CapturesBatchPanel captures={generalCaptures} players={playerOptions} />`. Removed now-unused `GeneralCaptureDraftCard` value import (type import retained).

**Safety:** Batch dismiss only — no approve/apply/execute. Academy scoped. Director/head_coach only. Max 50 items. No schema changes. No voice pipeline bypass. No parent/player exposure. No official records modified.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 53: Coach Player List Sort + Context

Upgraded the coach player list with client-side sort controls (name / group / level / last assessed) and added focus_areas chips and last-assessed date display.

**Files created:**
- `src/app/coach/players/CoachPlayersClient.tsx` — Client component. Four sort buttons (name, group, level desc, last assessed desc). Player rows now show focus area chips (up to 3, overflow count badge), group name, and level label. Last assessed date shows when sorted by that key.

**Files modified:**
- `src/app/coach/players/page.tsx` — Server component now maps `assignedPlayers` to a plain serializable shape and passes it to `CoachPlayersClient`. All fetch logic unchanged.

**Safety:** Read-only. No mutations. No schema changes. No voice pipeline bypass.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 52: Director Signals Dashboard V1

Added `/director/signals` page aggregating four attention buckets: players without a group, players without a curriculum level, pending coach wrap-up drafts, and new private lesson requests. Each bucket is a card with linked rows routing to the relevant page. Sidebar now includes a "Signals" nav item.

**Files created:**
- `src/app/director/signals/page.tsx` — Server component. Queries `v_player_summary` (active players missing group or level), `proposed_actions` (pending `session_wrap_up_v1`), and `private_lesson_requests` (status `new`). Renders a signal card per bucket with row links. Shows "All clear" state when no signals exist.

**Files modified:**
- `src/components/nav/SidebarNav.tsx` — Added `Activity` icon import and "Signals" link (`/director/signals`) to `FOUNDATION_ITEMS`, between "Sessions" and "Review Queue".

**Safety:** Read-only queries, academy-scoped. No mutations. No schema changes. No voice pipeline bypass.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 51: Parent Lesson Request Status Tracker

Added a status tracker card to the parent portal so parents can see the current state of their most recent private lesson request without contacting the academy.

**Files modified:**
- `src/app/parent/page.tsx` — Added `LessonRequestStatus` interface. Fetches the parent's latest `proposed_actions` row where `target_module = 'parent_lesson_request'`. Maps internal statuses (`pending_review`, `approved`, `applied`, `rejected`, `dismissed`) to parent-safe labels. Renders a status card above `PrivateLessonRequestCard` showing status badge, preferred day, focus area, and submission date.

**Safety:** Reads only the parent's own `proposed_actions` rows (`proposed_by_id = user.id`). No internal coach notes, no raw DB mutations. Status labels are parent-safe (no internal terminology). No schema changes.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 50: Player Portal Mission View V1

Improved the player portal with a "What to ask your coach" prompt card, an encouragement footer, and a friendlier no-link empty state.

**Files modified:**
- `src/app/player/page.tsx` — Added `HelpCircle` and `Sparkles` imports. Added "What to ask your coach" card that derives coaching questions from `what_to_understand` items (framed as "How am I doing with X?") and a generic mission question. Added encouragement footer card. Replaced generic no-player-link empty state with warmer copy ("Your mission is on its way") and icon.

**Safety:** Player-safe only. No internal coach notes. No raw observations. No schema changes.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 49: Director Session Builder from Template V1

Added a dedicated session creation page (`/director/sessions/new`) with template picker, date, coach, and notes. Uses existing `generateSessionFromTemplateAction`.

**Files created:**
- `src/app/director/sessions/new/page.tsx` — Server component: fetches all academy templates + coaches, renders `SessionFromTemplateForm`. Empty state links to `/director/fitness/templates`.
- `src/app/director/sessions/new/SessionFromTemplateForm.tsx` — Client component: template selector (all templates, any category), session name (pre-filled from template), date picker, coach selector, optional notes, create button. On success shows confirmation with link to new session.

**Files modified:**
- `src/app/director/sessions/page.tsx` — Added "New Session" button in `PageHeader` linking to `/director/sessions/new`. Made header a flex row (title + button).

**Safety:** Uses existing `generateSessionFromTemplateAction` — that action verifies auth, academy scope, and does not overwrite any template. Explicit director click required.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 48: Coach Block Status Persistence Readiness

Wired block status from live session execution into the Wrap-Up drawer via localStorage. Documented missing DB persistence.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — `setBlockStatus` now writes to `session_block_status_${sessionId}` in localStorage on every coach tap, mapping `planned`/`in_progress` → `'completed'`, `skipped` → `'skipped'`, `modified` → `'modified'` for the Wrap-Up format.
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — On mount, after restoring the wrap-up draft, also reads `session_block_status_${sessionId}` from localStorage. If the wrap-up draft has no existing `blockStatus`, pre-populates from the execution client's saved statuses.
- `docs/KNOWN_LIMITATIONS.md` — Added section documenting that `session_blocks` has no `status` column; block statuses are localStorage-only until a migration adds the column.

**Schema:** No change. `session_blocks` does not have a `status` field. Migration required to persist to DB.

**Safety:** localStorage only. No DB writes. No parent/player exposure.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 47: Director Player Invite Flow V1

Added portal invite guidance to the Player Portal Access panel. No email system exists — directors get copy-to-clipboard instructions to share with players manually.

**Files modified:**
- `src/app/director/players/[playerId]/PlayerPortalLinkPanel.tsx` — Added `playerName` prop. When portal is NOT linked, shows "Invite instructions" section with numbered steps, and a "Copy invite instructions" button that writes a formatted plaintext message to clipboard (player name, signup steps, what to do after). Replaced generic "account must already exist" note with clearer flow.
- `src/app/director/players/[playerId]/page.tsx` — Pass `player.full_name` as `playerName` prop to `PlayerPortalLinkPanel`.

**Not built:** Real email sending — no email provider is configured. Manual instructions are the correct V1.

**Safety:** No external service. No account creation. No schema changes. Clipboard only.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 46: Coach Wrap-Up → Observation Auto-Draft

Added assisted "Add note from recap" section in the coach Wrap-Up summary phase. V1 uses manual assisted flow — no AI parsing.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Added `recapNotePlayer`, `recapNoteType`, `recapNoteText` local state for the quick note form. Added `Plus` icon import. Added "Add note from recap" panel in the summary phase: player selector from session roster, note type selector (positive / needs attention), free-text area, "Add note" button that pushes the observation into `playerNotes` (same mechanism as inline step notes). Added "Queued observations" list showing all pending observations. Notes are saved as `coach_observations` (is_private = true) when coach taps "Save Recap" via existing `saveWrapUpObservationsAction`.

**Safety:** Internal-only. No parent/player visibility. Coach explicit action required per note. Saves only when "Save Recap" is pressed. No AI inference — coach types the note manually.

**Not built:** Deterministic name extraction from recap text (requires NLP or fuzzy matching — deferred to V2).

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 45: Session Block Exercise RLS Migration Gate

Added migration 056 diagnostic warning to the coach session execution view, matching the existing gate already present in the director session detail.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Added conditional warning: when `blocks.length > 0 && exercises.length === 0`, shows an orange alert explaining session exercises are missing and includes the SQL verification query for migration 056.

**Already present (not changed):**
- `src/app/director/sessions/[sessionId]/page.tsx` — Director session detail already shows migration 056 message with verification SQL.
- `supabase/migrations/056_session_block_exercises_rls.sql` — Migration file exists; must be applied to live Supabase instance separately.

**Safety:** Read-only diagnostic only. No SQL executed. No RLS bypassed. No service role used.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 44: Player Portal Profile Linkage UI

Added Player Portal Access panel to the director player profile Overview tab, below the Guardian linking panel.

**Files created:**
- `src/app/director/players/[playerId]/playerPortalLinkAction.ts` — Server actions: `linkPlayerPortalAction` (find profile by email in academy, set `players.profile_id`) and `unlinkPlayerPortalAction` (set `players.profile_id = null`). Both academy-scoped with director/head_coach auth check.
- `src/app/director/players/[playerId]/PlayerPortalLinkPanel.tsx` — Client component: shows linked portal status (profile email + name); inline email form to link by email; unlink button; warning that this controls player portal access; no invite or email sending.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Added `PlayerPortalLinkPanel` import. Added portal profile fetch (profile email + display_name from `players.profile_id`). Renders `PlayerPortalLinkPanel` in Overview right column.

**Safety:** No automatic account creation. No email sending. Uses existing `players.profile_id` column. Player portal access is controlled by this link — warning shown to director. Academy-scoped.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 43: Director Private Lesson Request Review + Accept

Audit confirmed: director private lesson review with full accept/decline/notes UI was already built in commit `66bc146` as part of the director dashboard drilldown work.

**Files verified (no changes needed):**
- `src/app/director/private-lessons/page.tsx` — Shows all lesson requests, counts by status, renders `PrivateLessonRequestCard` per request
- `src/app/director/private-lessons/PrivateLessonRequestCard.tsx` — Expandable card with: player/parent/coach info, preferred days/times, goal, notes; inline status selector (new → reviewing → assigned → scheduled → declined → completed); director notes textarea with save; all transitions persist via server action
- `src/app/director/private-lessons/privateLessonActions.ts` — `updatePrivateLessonStatusAction` and `updateDirectorNotesAction` — both academy-scoped, director/head_coach role-gated

**Safety:** No automatic communication. No billing. Director explicit action required. Status changes only; no calendar events created.

**TypeScript:** clean.

---

## 2026-05-06 — Sprint 42: Coach Session Block Progress Tracker

Added per-block status tracking to the coach session execution view. State is local to the session; feeds into Wrap-Up recap.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Added `blockStatusMap` state (keyed by block id, defaults to `'planned'`). Added `setBlockStatus` helper. Added block progress summary bar showing completed/skipped/modified counts. Added per-block status button row: `Planned`, `Active`, `Done`, `Skipped`, `Modified`. Added `blockStatusLabel` and `blockStatusActiveClass` helper functions. Replaced previous placeholder "Block-level tracking will be added later" note.

**Schema:** No schema change. Block status is local React state — not persisted to DB (session_blocks has no status column). State feeds into WrapUp drawer indirectly via coach memory during live session.

**Safety:** No DB mutations. No template overwrites. No parent/player exposure. Planned vs actual remain separate.

**TypeScript:** clean.

---

## 2026-05-05 — Sprint 41: Voice Intake Execution Routing V1

Extended approved voice intake drafts to execute safe downstream actions.

**Files created:**
- `src/app/director/review/executeVoiceIntakeDraftAction.ts` — Server action: verifies approval status + director/head_coach role, dispatches execution for safe intents: `create_player_observation` / `record_director_note` / `create_gap_signal` / `alert_director` → create `coach_observations` (is_private=true); `create_session_recap` → create `voice_notes` for session if session_id present in context. Marks proposed_action as `applied` on success.

**Files modified:**
- `src/app/director/review/VoiceIntakeDraftCard.tsx` — Added `VoiceIntakeExecuteControls` component shown for approved drafts. Previously showed static "future update" note. Now shows "Execute — Create Internal Record" button. Imports `Zap`, `Loader2` from lucide-react.

**Intents executed:** `create_player_observation`, `record_director_note`, `create_gap_signal`, `alert_director`, `create_session_recap`

**Intents not yet executed:** `create_session_draft`, `create_group_draft`, `set_group_focus`, `create_parent_safe_draft`, `create_gate_evidence_draft` — require manual handling or future sprints.

**Safety:** No parent/player exposure. No automatic level changes. Director approval required before execution. Player names in `affected_players` are heuristic strings — not resolved to player_id (observation has `player_id = null` with player names included in content).

TypeScript: clean.

---

## 2026-05-05 — Sprint 40: Parent Guardian Linking UI

Added guardian/parent access panel to the director player profile Overview tab.

**Files created:**
- `src/app/director/players/[playerId]/guardianLinkingAction.ts` — Server actions: `linkGuardianToPlayerAction` (find or create guardian, create player_guardians link) and `unlinkGuardianFromPlayerAction` (remove link); both academy-scoped with director/head_coach auth check
- `src/app/director/players/[playerId]/GuardianLinkingPanel.tsx` — Client component; shows linked guardians with portal status; inline form to add guardian by first/last name + email + relationship; unlink button per guardian

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Added guardian data fetch (player_guardians join guardians, academy_id scoped); renders `GuardianLinkingPanel` in Overview right sidebar

**Safety:** No automatic account creation. No email sending. Guardian portal access is activated only when parent signs up with linked email. Director explicit action required. Academy-scoped.

TypeScript: clean.

---

## 2026-05-05 — Sprint 39: Director Player Filters + Bulk Actions

Added group and curriculum stage filter chips to the player directory. Derived from already-loaded player data — no extra DB query.

**Files modified:**
- `src/app/director/players/_components/PlayersDirectoryClient.tsx` — Added `groupFilter` and `stageFilter` state; derived distinct groups + stages from loaded player data; added FilterChip rows for group and stage; updated `filtered` useMemo to apply all four filter dimensions

**Bulk actions:** Not added — no safe non-destructive bulk action exists that maps to existing schema without migration.

TypeScript: clean.

---

## 2026-05-05 — Sprint 38: Coach Session Roster Inline Attendance

Audit confirmed: inline attendance controls were already built as part of Sprint 29 in `CoachSessionExecutionClient.tsx`.

**No code changes needed.** Inline P/A/L/E buttons per roster player, batch Save Attendance action, and success/error feedback are all present.

TypeScript: clean (no changes).

---

## 2026-05-05 — Sprint 37: Placement Engine V1

The Placement Engine was already fully built at `/director/placement/`. Sprint 37 surfaces it in navigation.

**Files modified:**
- `src/components/nav/SidebarNav.tsx` — Added `UserPlus` import and "Placement" link to FOUNDATION_ITEMS

**Placement flow:** pending player list → create draft → director approve → activate via `finalize_player_placement()` RPC.

TypeScript: clean.

---

## 2026-05-05 — Sprint 36: Curriculum Explorer Procedure Field + Use in Session Polish

**Files modified:**
- `src/lib/backend/curriculumExplorer.ts` — Added `procedure: string | null` to `CurriculumDrill` type. Added `procedure` to the drill select query in `getCurriculumExplorerData`.
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — Added `drill.procedure` to `hasDetail` check. Added numbered Procedure steps display in the drill expanded section (splits on ` | ` separator from seed data). Polished "Use in session" placeholder: changed from a disabled `<button>` to a `<span>` with cleaner label `+ Session`.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 35: Director Dashboard Pending Coach Wrap-Ups Signal

**Files modified:**
- `src/app/director/page.tsx` — Added `pendingWrapUpsCount` query (proposed_actions where target_module = 'session_wrap_up_v1' and status = 'pending_review'). Wired into `totalAlerts` count. Added `pendingWrapUpsCount` prop to `AcademyAlertsPanel`. Added new alert entry: "X coach wrap-ups awaiting review" linking to `/director/review` when count > 0.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 34: Parent Private Lesson Request V1

**Files created:**
- `src/app/parent/requestPrivateLessonAction.ts` — Server action that validates the lesson request form and inserts a `proposed_action` with `target_module = 'parent_lesson_request'` and `status = 'pending_review'`. Never directly schedules anything. Follows the proposed_actions pipeline.
- `src/app/parent/PrivateLessonRequestCard.tsx` — Client component with a functional lesson request form: preferred day (required), preferred time (optional), focus area (required), additional notes (optional). Shows success state after submission. Shows error if action fails.

**Files modified:**
- `src/app/parent/page.tsx` — Imported `PrivateLessonRequestCard` and added it below the Messages card when `parentView && linkedPlayerFirstName` are set.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 33: Parent Attendance + Session Consistency Data

**Files modified:**
- `src/app/parent/page.tsx` — Added live attendance data to the "Session Consistency" card. Fetches `session_attendance` records for the linked player (last 60 days), joins with sessions for date and name, computes present/absent/late counts and attendance rate. Shows lime progress bar, percentage, and list of last 5 sessions with color-coded status badges. Falls back to "No attendance recorded yet" empty state when no records exist or account not linked.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 32: Coach → Player Profile Deep Link

**Files created:**
- `src/app/coach/players/[playerId]/page.tsx` — Coach player profile page. Fetches player data (name, curriculum level, coach language, top priority, recent observations, group name). Uses `CoachPlayerSnapshot` component to render the coaching snapshot. Shows last 5 coach observations.

**Files modified:**
- `src/app/coach/players/page.tsx` — Wrapped each player row in a `<Link href="/coach/players/[playerId]">` with ChevronRight indicator and hover highlight. Updated footer copy. Added `Link`, `ChevronRight` imports.
- `docs/LOCKED_MODULES.md` — Updated coach players entry to reflect the deep link is built.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 31: Review Queue Priority Inbox Redesign

**Files modified:**
- `src/app/director/review/page.tsx` — Three improvements: (1) Computed `oldestPendingDates` per category (last item in each pending array since sorted newest-first = oldest). (2) Updated `PageHeader` to accept and render oldest pending age per category in the summary strip using a new `relativeAge()` helper ("2h ago", "3d ago"). (3) Added "All caught up" green banner above the tabs when total pending count is zero. Added `CheckCircle` import.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 30: Error Boundaries + Toast System

**Files created:**
- `src/components/ui/Toast.tsx` — Context-based toast system. `ToastProvider` wraps the app; `useToast()` hook fires `success`, `error`, or `info` toasts. 4s auto-dismiss, X dismiss button. No external library.
- `src/app/director/error.tsx` — Next.js error boundary for /director route segment.
- `src/app/coach/error.tsx` — Next.js error boundary for /coach route segment.
- `src/app/player/error.tsx` — Next.js error boundary for /player route segment.
- `src/app/parent/error.tsx` — Next.js error boundary for /parent route segment.

**Files modified:**
- `src/app/layout.tsx` — Imported `ToastProvider` from `@/components/ui/Toast` and wrapped `{children}` with it.
- `src/components/ui/index.ts` — Exported `ToastProvider`, `useToast`, and `ToastType`.
- `docs/KNOWN_LIMITATIONS.md` — Marked "No error.tsx boundaries" as RESOLVED. Added remaining gap note (nested sub-routes not yet covered).

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 29: Session Status + Start/End Session CTA

**Files created:**
- `src/app/director/sessions/[sessionId]/DirectorSessionStatusCTA.tsx` — Client component rendering a "Start Session" (planned→in_progress) or "End Session" (in_progress→completed) CTA button for the director session detail page.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Added `handleQuickStatusChange()` helper and prominent Start/End Session CTAs at the top of the component. Start Session (lime) shown when `status === 'planned'`; End Session (green) shown when `status === 'in_progress'`. Both immediately call `saveAction` and update local status on success. Added `Play` and `Square` imports.
- `src/app/director/sessions/[sessionId]/actions.ts` — Added `updateSessionStatusAction` server action (director/head_coach auth, academy_id scoped, status-only update).
- `src/app/director/sessions/[sessionId]/page.tsx` — Imported and placed `DirectorSessionStatusCTA` in the session header right-hand side.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 28: Coach Wrap-Up Persistence + Single Recap Entry Point

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — Added localStorage auto-save/restore keyed by `sessionId`. Drawer now restores all 6 question answers, block statuses, player notes, attendance map, and current phase (questions/summary) when reopened mid-session. Draft is cleared from localStorage only after successful Save Recap. Added "Draft saved locally" indicator text in the questions footer when any answer has content or a draft was restored.
- `src/app/coach/sessions/[sessionId]/CoachRecapCommandPanel.tsx` — Renamed section header from "COACH RECAP" to "QUICK NOTE". Updated subtitle copy to distinguish it from the guided Wrap-Up: "Leave a quick note about anything you want to flag. For a full end-of-session debrief, use the guided Wrap-Up above."
- `docs/KNOWN_LIMITATIONS.md` — Removed "Wrap-up state is not persisted between opens" (resolved). Updated "Two recap UIs" entry to reflect new "Quick Note" label and clarify intentional distinction. Updated "Pending actions badge" entry to RESOLVED (Sprint 27).

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 27: Emergency UX Polish + Broken Signal Fixes

**Files modified:**
- `src/app/director/layout.tsx` — Replaced hardcoded `pendingCount = 0` with real query from `proposed_actions` where `status = 'pending_review'` for the academy. Sidebar badge now reflects actual pending review items.
- `src/app/coach/page.tsx` — Replaced four disabled "Coming soon" Quick Action tiles with two real navigation links (My Sessions → `/coach/sessions`, My Players → `/coach/players`). Today's session list items are now clickable links to `/coach/sessions/[sessionId]`. Removed "On the Roadmap" section entirely. Replaced footer "Coming soon" copy with "View all sessions →" link.
- `src/app/player/page.tsx` — Removed "Coming Soon" pills section (Progress tracking, Skill badges, Competition log) that was visible to players.
- `src/app/parent/page.tsx` — Removed disabled/locked Private Lesson Request form card that was shown with Coming Soon label and grayed-out inputs. Removed unused `GraduationCap` and `Lock` imports.
- `docs/LOCKED_MODULES.md` — Updated "Not built yet" section to reflect current reality: Dashboard, Players List, Coach Workspace, Sessions, Coach Sessions, Player Portal, and Parent Portal are all built. Added "Partially built" table with accurate status and remaining work.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

**What was intentionally not built:**
- Review queue tab counts — already existed (TabLabel component already had pending/ready badges).
- Full Private Lesson Request — deferred to Sprint 34.

---

## 2026-05-05 — Sprint 26: Curriculum Customization Assistant Architecture V1

**Files created:**
- `docs/curriculum-customization-assistant-architecture.md` — Full architecture for the guided curriculum customization assistant UX layer. Covers: product goal (structured guided front-end on existing `academy_curriculum_overrides` system), one-question-at-a-time director experience (scope → target → current value → impact preview → submit), 8 supported customization targets (level gates, progression requirements, key questions, exercises, drills, coach cues, assessment criteria, parent/player explanations), override draft model (reuses existing proposed_actions → director review → apply pipeline unchanged), 5 scope prompts (session / group / level / whole academy / consultant/Brian master), source preservation (global master and Brian master read-only), versioning (each override is a new row with rollback_of_override_id), rollback (proposed_action → review → apply, no immediate undo), diff/compare using buildOverrideSummaryLines(), downstream impact preview (templates, sessions, assessments, player gaps, gap class questions, parent/player explanations), future schema needs (consultant mode, per-session override, history UI, conflict detection), sprint sequence (Sprints 27-33+).

**Files modified:**
- `docs/CHANGELOG.md`

**No code changes.** Architecture-only sprint. VoiceOverrideInputPanel remains the current input mechanism. No assistant UI built — architecture design only. Brian master fully read-only in V1. Consultant mode not implemented.

**TypeScript:** No code changes — no type check required.

---

## 2026-05-05 — Sprint 25: Gap Class / Knowledge Check Architecture V1

**Files created:**
- `docs/gap-class-knowledge-check-architecture.md` — Full architecture for Gap Class learning layer. Covers: product goal, student-facing positive framing ("Next Mission" not "Gap Class"), parent-safe language rules, director approval model (gap → proposed_action → approve → module), curriculum requirement linkage, question bank model, learning module model, knowledge check model, gap→module flow, Angles App reinforcement hook, Brian curriculum override impact, role permissions, data safety, future schema proposal (gap_class_modules / gap_class_questions / gap_class_knowledge_checks), V1 sprint sequence, known limitations.

**Files modified:**
- `docs/CHANGELOG.md`

**No code changes.** Architecture-only sprint. No player-facing UI. No gap auto-assignment. No schema created.

**TypeScript:** No code changes — no type check required.

---

## 2026-05-05 — Sprint 24: Assessment → Curriculum Requirement Link Audit

**Files created:**
- `docs/assessment-curriculum-gap-architecture.md` — Architecture audit documenting: current schema map (assessments, curriculum levels, requirement evidence links), five gap categories and their data quality, Gap 1-4 missing links (no assessment→requirement domain mapping, no per-requirement gate, unstructured scores_detail, assessment evidence type not wired), recommended `assessment_requirement_criteria` table, approval model (proposed_actions → director review → requirement_evidence_link), PlayerGapSummaryPanel connection, Gap Class connection, future migration requirements.

**Files modified:**
- `docs/CHANGELOG.md`

**No code changes.** Docs-only sprint. All gap confirmation via assessment data requires a future migration sprint with explicit approval.

**TypeScript:** No code changes — no type check required.

---

## 2026-05-05 — Sprint 23: Player Gap Summary V1

**Files created:**
- `src/components/player/PlayerGapSummaryPanel.tsx` — Director-only, read-only gap summary panel. Consolidates: exposure gaps (from attendance timeline), training gaps (from detectTrainingGaps), knowledge gaps (from detectKnowledgeGaps), fitness gap placeholder (from load data). Shows each gap with confidence label: possible / needs review / confirmed. Derives "Recommended Next Focus" from highest-priority gap. Safety guardrail note confirms internal-only, no automatic level changes.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Added `PlayerGapSummaryPanel` import. Added panel in Skill Path tab after GapGuidanceSummaryCard, passing trainingGaps, knowledgeGaps, exposureTimeline, playerLoad, currentLevelName.

**Safety:** Director internal only. No parent/player exposure. No AI auto decisions. No promotion/level movement. No migration. Read-only suggestions only.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 22: Player Training Exposure Timeline V1

**Files created:**
- `src/components/player/PlayerTrainingExposureTimeline.tsx` — Director-only read-only timeline card. Shows last 60 days of session attendance per player: date, session name, attendance status pill, exposure inference (likely exposed vs possible missed), block count, link to session detail. Empty state if no attendance. V1 note about observation count deferral.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Added session_attendance query (last 60 days), session join, session_blocks count per session. Builds `exposureTimeline[]` array. Added `PlayerTrainingExposureTimeline` import and render in Fitness/Load tab.

**Safety:** Read-only. Internal director view only. No parent/player exposure. No migration. No gap records created. Observation count deferred to future sprint (requires enrichedObservations ordering fix).

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 21: Curriculum Exposure Tracking V1

**Files created:**
- `src/lib/curriculum/exposureTracking.ts` — Deterministic exposure candidate helper. `deriveSessionExposureCandidates()` takes players (with attendance status), planned blocks, and optional wrap-up block_completion. Returns per-player: likely exposed blocks, possible missed exposure blocks, confidence label, note. No DB writes — candidates only.
- `src/app/director/sessions/[sessionId]/SessionExposureSummaryPanel.tsx` — Director-only read-only panel. Shows per-player exposure confidence (likely/missed/unknown). Summary strip with counts. Confidence key. Safety note confirming no gap records are created.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Added `SessionExposureSummaryPanel` import and "CURRICULUM EXPOSURE (V1)" section on session detail, passing existing directorRoster, blockList, and wrapUpPayload.

**Safety:** Read-only display. No exposure records written. No gap records created. No parent/player exposure. No migration. Internal director view only. Data sourced entirely from already-loaded page data.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 20: Planned vs Actual Session Diff V1

**Files created:**
- `src/app/director/sessions/[sessionId]/PlannedVsActualDiffPanel.tsx` — Read-only diff panel. Matches each planned session block to its actual completion status from the latest coach wrap-up draft. Shows completed/modified/skipped/unknown per block with inline notes. Displays changes note, next focus, group note. Renders empty state if no wrap-up exists. Safety notice confirms template/curriculum are unchanged.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Added query 13: fetches latest proposed_action with target_module = session_wrap_up_v1 for this session. Added `PlannedVsActualDiffPanel` import and "PLANNED VS ACTUAL" section before Coach Recap.

**Safety:** Read-only display only. No session data changed. Template and curriculum untouched. Blocks matched by ID first, then name — transparent empty/unknown state if unmatched.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 19: Apply Session Actual Draft V1

**Files created:**
- `src/app/director/review/applyWrapUpDraftAction.ts` — Server action that applies an approved session wrap-up draft. Verifies director/head_coach role, fetches the approved proposed_action (target_module = session_wrap_up_v1), builds session_notes from the wrap-up payload (blocks, changes, next focus, group note), writes to sessions.session_notes, advances session status to completed if planned/in_progress, marks proposed_action as executed, writes audit_log. No template, curriculum, attendance, or player profile changes.
- `src/app/director/review/ApplyWrapUpDraftControls.tsx` — Client component with "Apply Session Actual" button. Shows scope guardrail, success/error state. Calls `applyWrapUpDraftAction`.

**Files modified:**
- `src/app/director/review/WrapUpDraftCard.tsx` — Replaced "apply coming in future sprint" banner with live `ApplyWrapUpDraftControls` for approved drafts.

**Safety:** Explicit director click required. Preserves planned session and template. Does not delete draft. Does not change parent/player views. Does not alter curriculum. Audit logged. TypeScript: `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 18: Director Review Queue — Session Wrap-Up Drafts V1

**Files created:**
- `src/app/director/review/WrapUpDraftCard.tsx` — Display card for session_wrap_up_v1 proposed_actions. Shows session name, date, proposer, block completion (completed/modified/skipped), changes note, next focus, group note, raw attendance context, warnings, safety notice. Embeds `WrapUpDraftDecisionControls`.
- `src/app/director/review/WrapUpDraftDecisionControls.tsx` — Client component for approve/reject/clarification on wrap-up drafts. Calls `updateWrapUpDraftDecisionAction`.

**Files modified:**
- `src/app/director/review/actions.ts` — Added `updateWrapUpDraftDecisionAction` server action. Validates academy membership (director/head_coach only), verifies target_module = 'session_wrap_up_v1', updates status only. Never writes to sessions, session_blocks, attendance, or any other table.
- `src/app/director/review/page.tsx` — Added "Session Wrap-Ups" tab to review queue. Queries proposed_actions for target_module = 'session_wrap_up_v1' and draft_type = 'session_actual_v1'. Enriches with session names and proposer names. Renders pending/approved sections with WrapUpDraftCard. Updated PageHeader and defaultTab logic.

**Safety:** Read-only display. No session data modified. No attendance changed. No template touched. Apply action deferred to Sprint 19. Director must explicitly click Approve/Reject — nothing automatic.

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 17: Verify Session Exercise Rendering

**Audit only — no code changes.**

Verified:
- `generateSessionFromTemplateAction` correctly returns `sessionId` even when exercise INSERT fails (best-effort step 9, Sprint 8).
- Director session detail (`/director/sessions/[sessionId]/page.tsx`) shows blocks and exercises when available; displays orange migration warning when blocks exist but exercises are empty.
- Coach session detail (`/coach/sessions/[sessionId]/page.tsx`) same behavior.
- `GenerateSessionPanel.tsx` shows an orange warning box alongside the generated session link when exercises could not be copied.
- All links to generated sessions work correctly.
- No stale "future sprint" messages found — all copy is current.

Migration 056 verification remains manual (Supabase CLI not available in dev). SQL check documented in `KNOWN_LIMITATIONS.md`.

**Files modified:**
- `docs/KNOWN_LIMITATIONS.md` — updated migration 056 entry with "code-side: fully ready" status; clarified impact notes for director and coach pages; confirmed no further code changes needed after migration is applied.

**TypeScript:** No code changes — no type check required.

---

## 2026-05-05 — Sprint 16: Brian Demo Hardening + V1 Operating Loop QA

**Files created:**
- `docs/V1_MANUAL_TEST_CHECKLIST.md` — step-by-step manual test checklist for the V1 coach operating loop (Sprints 10–15). Covers session list, execution, attendance, quick note, wrap-up 6-question flow, summary review, save path, and director review. Documents known V1 limitations.

**Files modified:**
- `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` — added "Coach Operating Loop Add-On" section (Steps C1–C6) covering coached-scoped session view, attendance marking, guided wrap-up flow, summary review, and director draft visibility. Added coach loop key property table. Reference to `V1_MANUAL_TEST_CHECKLIST.md`.
- `docs/KNOWN_LIMITATIONS.md` — added "Coach Wrap-Up V1" section documenting: wrap-up state not persisted between opens, unrostered attendees cannot be added from wrap-up, sequential save failure behavior, dual recap UI (CoachRecapCommandPanel + CoachWrapUpDrawer) potential confusion, and attendance saved independently of recap.

**No code changes. Doc-only sprint.**

**TypeScript:** No new code — no type check required.

---

## 2026-05-05 — Sprint 15: Attendance Exception Drafts from Wrap-Up V1

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — added `attendanceMap` state (defaults each roster player to their existing status or 'present'); added `handleSaveAttendance()` function calling `saveAttendanceAction`; summary review step now shows per-player attendance selector with Present/Absent/Late/Excused options and a dedicated "Save Attendance" button (independent of wrap-up save). Clear note directs unrostered players to director review panel. Added `saveAttendanceAction, AttendanceUpdate` import from `'./actions'`.

**Safety:** Attendance save is isolated — does not block or depend on wrap-up recap save. Players verified server-side in `saveAttendanceAction`. Unrostered players explicitly excluded with visible UI note. No migration, no new tables, no RLS changes. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 14: Coach Wrap-Up → Player Observation Drafts V1

**Files created:**
- `src/app/coach/sessions/[sessionId]/saveWrapUpObservationsAction.ts` — server action that saves player observations from wrap-up to `coach_observations`. Verifies coach role, verifies each player belongs to same academy and is active, inserts with `is_private: true`. Never parent/player-facing.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — added `roster: RosterPlayer[]` prop and `playerNotes` state. Summary step now shows per-player note inputs under "Who stood out?" and "Who needs attention?" questions. Notes keyed by `playerId:type`. On save, calls `saveWrapUpObservationsAction` (best-effort after raw recap save).
- `src/app/coach/sessions/[sessionId]/CoachSessionActions.tsx` — added `roster` prop, passes to `CoachWrapUpDrawer`.
- `src/app/coach/sessions/[sessionId]/page.tsx` — passes `roster` to `CoachSessionActions`.

**Safety:** `is_private: true` always. Player membership verified server-side. No parent/player exposure. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 13: Coach Wrap-Up → Session Actual Draft V1

**Files created:**
- `src/app/coach/sessions/[sessionId]/saveWrapUpDraftAction.ts` — server action that saves a structured session actual draft to `proposed_actions` (target_module = 'session_wrap_up_v1'). Includes block completion status, changes note, next focus, and raw answers. Requires `voice_commands` FK record (same pattern as attendance exception). Draft status = 'pending_review'. No official session records updated.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — added `blocks: SessionBlock[]` prop; block completion state (completed/skipped/modified per block); block status selectors shown in summary review step; `handleSave` now calls both `saveSessionRecapAction` (raw text) and `saveWrapUpDraftAction` (structured draft, best-effort).
- `src/app/coach/sessions/[sessionId]/CoachSessionActions.tsx` — added `blocks: SessionBlock[]` prop; passes to `CoachWrapUpDrawer`.
- `src/app/coach/sessions/[sessionId]/page.tsx` — passes `blockList` to `CoachSessionActions`.

**Safety:** Draft only. No session_blocks, templates, or attendance records modified. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 12: Coach Wrap-Up Guided Recap UI V1

**Files created:**
- `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx` — full-screen guided recap overlay. Six questions, one at a time. Text answers. Progress bar. Back/Next navigation. Summary review step with Copy to clipboard fallback. Save calls `saveSessionRecapAction` → `voice_notes` table. Saved state with confirmation.

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachSessionActions.tsx` — enabled Wrap Up Session button. Imports and conditionally renders `CoachWrapUpDrawer`.

**Coach experience:** "Let's wrap this up quickly. I'll ask a few questions and turn it into notes for review."
Six guided questions → summary review → one tap to save. Nothing is saved until explicit save.

**Storage:** `voice_notes` (existing table). `processing_status = 'pending'`. Director sees it in recap history. No new schema.

**What was NOT changed:** No migration, no RLS, no new tables, no parent/player exposure. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 11: Coach Wrap-Up Assistant Architecture Audit

**Files created:**
- `docs/coach-wrap-up-assistant-architecture.md` — product goal, 6-question minimum recap checklist, data flow diagram, storage options (voice_notes / proposed_actions / coach_observations), approval model, draft vs official boundary, role visibility matrix, V1 sprint sequence, migration needs (none required), technical implementation plan, safety invariants.

**Key finding:** No new migration is required for V1. All storage uses existing tables.

**TypeScript:** `npx tsc --noEmit` — clean (docs-only sprint).

---

## 2026-05-05 — Sprint 10: Coach Session Execution View V1

**Files created:**
- `src/app/coach/sessions/[sessionId]/CoachSessionActions.tsx` — client component with two action cards: "Quick Note" (opens QuickCaptureDrawer inline, avoids conflict with mobile tab bar) and "Wrap Up Session" (placeholder, enabled in Sprint 12).

**Files modified:**
- `src/app/coach/sessions/[sessionId]/page.tsx` — imports and renders `CoachSessionActions` at the bottom of the session page, passing `sessionId`, `academyId`, `sessionName`.

**Design rationale:** QuickCaptureButton (director) is a fixed floating button that conflicts with the coach bottom tab bar. Coach session uses an inline grid card instead, rendering `QuickCaptureDrawer` directly without the fixed-position trigger.

**What was NOT changed:** No migration, no RLS, no schema. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 9: Session Detail View V1 Polish

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — (1) Source Template field is now a clickable link to `/director/fitness/templates/{template_id}` instead of plain text. (2) A migration-pending warning banner is shown when blocks exist but exercises are 0, with the exact verification SQL. Added `AlertTriangle` icon import.

**What was NOT changed:** No migration, no RLS, no schema, no new components. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 8: Session Generation Live QA + Repair

**Root fix:** Exercise INSERT (step 9 of `generateSessionFromTemplateAction`) was treating RLS failure as a hard error, returning `{ sessionId: null }` even though the session and blocks were already created. This left orphaned sessions that directors could not navigate to.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Step 9 is now best-effort: if `session_block_exercises` INSERT fails (e.g. migration 056 not yet applied), a warning message is returned alongside the valid `sessionId`. Session and blocks are always returned on success.
- `src/app/director/fitness/templates/[templateId]/GenerateSessionPanel.tsx` — Added `formWarning` state. Success path now shows the session link regardless of exercise warning. If warning is present, an orange info box describes the pending migration.

**What was NOT changed:** No migration, no RLS, no schema, no auth. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 7: Migration 056 Live Verification Audit

**Audit result:** Cannot verify from development environment — Supabase CLI is not configured in this workspace.

**Manual verification steps (run in Supabase SQL Editor):**
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'session_block_exercises';
```
Expected: `"Staff see session block exercises"` and `"Staff manage session block exercises"`. If empty, apply `supabase/migrations/056_session_block_exercises_rls.sql`.

**Files changed:**
- `docs/KNOWN_LIMITATIONS.md` — updated migration 056 entry with verification SQL, Sprint 8/9 impact corrections, and manual verification instructions
- `docs/CHANGELOG.md` — this entry

**TypeScript:** `npx tsc --noEmit` — clean (docs-only sprint, no code changes).

---

## 2026-05-05 — Migration 056: session_block_exercises RLS policies

**Why:** `session_block_exercises` was created in migration 007 with `ENABLE ROW LEVEL SECURITY` but zero policies — identical to the `template_block_exercises` gap fixed in migration 055. PostgreSQL silently returns empty arrays on SELECT and returns an explicit RLS violation on INSERT, blocking all session generation that involves exercises and causing session detail pages to render blocks without exercises.

**What it fixes:**
- `generateSessionFromTemplateAction` step 9 (INSERT into `session_block_exercises`) now succeeds for templates with exercises — sessions generate fully.
- Session detail pages (`/director/sessions/[sessionId]`, `/coach/sessions/[sessionId]`) can now read block exercises via the `session_blocks → session_block_exercises` join.
- Coach session execution (`saveSessionExecutionAction`) can now read and update per-exercise completion state.

**File created:**
- `supabase/migrations/056_session_block_exercises_rls.sql` — adds two policies to `session_block_exercises`:
  - `"Staff see session block exercises"` — SELECT, scoped through `block_id → session_blocks → sessions → academy_id = auth_academy_id() AND auth_is_staff()`
  - `"Staff manage session block exercises"` — ALL (INSERT/UPDATE/DELETE/SELECT), same scope

**Non-destructive:** Adds policies only. No table changes, no data changes, no drops.

**How to apply to live Supabase:**
1. Open your Supabase project → SQL Editor
2. Paste and run the full contents of `supabase/migrations/056_session_block_exercises_rls.sql`
3. Verify: attempt to generate a session from a template that has exercises — it should succeed and return a `sessionId`

**Files changed:**
- `supabase/migrations/056_session_block_exercises_rls.sql` — created
- `docs/CHANGELOG.md` — this entry
- `docs/KNOWN_LIMITATIONS.md` — updated status from "requires migration 056" to "migration 056 created; must be applied to live Supabase"

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 6: Sessions Tab Population Audit + Fix

**Root cause identified:**
- `session_block_exercises` table has RLS ENABLED (migration 007) but **zero policies** — identical to `template_block_exercises` gap fixed in migration 055. This silently blocks all SELECT queries and returns an RLS violation on INSERT when a template has exercises. Session generation fails at step 9; blocks render without exercises. Fix requires migration 056 (not applied — documented in KNOWN_LIMITATIONS.md).
- Secondary: `GenerateSessionPanel` success state had stale "future sprint" copy discouraging navigation; sessions empty states had no navigation links.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/GenerateSessionPanel.tsx` — replaced stale success copy ("future sprint") with live "Open session →" link and "View all sessions" link
- `src/app/director/sessions/page.tsx` — improved empty state: descriptive text, btn-lime link to `/director/fitness/templates`, secondary link to `/director/class-templates`
- `src/app/director/sessions/overview/page.tsx` — added "View all sessions →" and "Generate from template" links to empty state
- `docs/KNOWN_LIMITATIONS.md` — documented `session_block_exercises` RLS gap, impact on session generation and detail page, exact policy template for migration 056, and workaround

**What was NOT changed:**
- No migration. No RLS change. No schema change. No auth/middleware change. ✅
- `session_block_exercises` RLS gap documented but deferred to migration 056. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 5: Route Capture to Player V1

**Files modified:**
- `src/lib/actions/capture.ts` — add `routeGeneralCaptureToPlayerAction(captureId, academyId, playerId)`: verifies director/head_coach membership; fetches capture confirming it belongs to this academy and is unrouted; verifies player is active in same academy; creates `coach_observation` with `is_private: true`; updates `voice_note` with `player_id`, `processing_status: 'routed'`, `parsed_observation_id` for traceability; revalidates `/director/review` and `/director/players/[playerId]`
- `src/app/director/review/GeneralCaptureDraftCard.tsx` — replaced disabled stub with live player picker: expandable Route to Player panel with player dropdown, confirm button, cancel; internal-only label; loading/error states; card hides on success. Exports `PlayerOption` type.
- `src/app/director/review/page.tsx` — fetches active players for routing dropdown (`players` table, `is_active: true`, ordered by `full_name`); passes `playerOptions` to each `GeneralCaptureDraftCard`; imports `PlayerOption` type.
- `src/components/capture/QuickCaptureButton.tsx` — button label updated from "Capture" to "Quick Capture"
- `src/components/capture/QuickCaptureDrawer.tsx` — general-capture placeholder updated to "Type or dictate a note. Use your keyboard mic if you want to speak." (removes false implication of browser audio recording)

**Safety:**
- Route action verifies director/head_coach role before writing. ✅
- Both capture and player verified to belong to same academy before any write. ✅
- `coach_observation` created with `is_private: true` — never parent/player-facing. ✅
- Original `voice_note` is never deleted — `processing_status: 'routed'` preserves traceability. ✅
- `parsed_observation_id` links voice_note ↔ observation for full audit trail. ✅
- No migration, no RLS change, no schema change, no auth/middleware change. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-05 — Sprint 4: Quick Capture Review Inbox V1

**Files created:**
- `src/lib/actions/capture.ts` — two Server Actions: `saveGeneralCaptureAction` writes a general capture to `voice_notes` with `player_id: null`, `session_id: null`, `processing_status: 'pending_review'`; `dismissGeneralCaptureAction` sets `processing_status: 'dismissed'`
- `src/app/director/review/GeneralCaptureDraftCard.tsx` — client card for an unrouted capture: shows timestamp, author, full content; live Dismiss button; disabled "Route to Player" stub labelled Sprint 5

**Files modified:**
- `src/components/capture/QuickCaptureDrawer.tsx` — general-path now calls `saveGeneralCaptureAction` via `useTransition`; success message changed to "Saved to review inbox."; holding-message updated to direct user to review queue
- `src/app/director/review/page.tsx` — adds Captures tab; queries `voice_notes` where `player_id IS NULL AND processing_status = 'pending_review'`; batch-fetches author names; renders `GeneralCaptureDraftCard` list with empty state; wires capture count into `PageHeader` and `defaultTab` logic; adds Captures to summary strip

**Persistence:**
- General captures land in `voice_notes` (existing table, `player_id` nullable). No migration. No new table. No RLS change.
- `processing_status: 'pending_review'` marks them as actionable in the inbox.
- Dismiss sets `processing_status: 'dismissed'` — soft delete, no data loss.

**Safety:**
- No parent/player data involved. ✅
- Director sees only own academy's captures (academy_id scoped). ✅
- Nothing is auto-routed or auto-applied. ✅
- "Route to Player" is disabled stub — deferred to Sprint 5. ✅

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-05-04 — Sprint 3: Quick capture context routing

**Files modified:**
- `src/components/capture/QuickCaptureDrawer.tsx` — full context routing: `/director/players/[id]` → Player Observation; `/director/players` → General Player Directory Note; `/director` → Director Capture; other → General Capture. Added destination override: player context shows "Change to General Draft" link. Refined route hints per context.

**Context rules implemented:**
- Player profile → auto-detects Player Observation, saves as internal coach observation
- Player directory → General Player Directory Note, directs user to open a profile
- Director root → Director Capture, general acknowledgment
- Other director pages → General Capture with review inbox coming soon note
- User can override Player Observation → General Draft without losing their text

**TypeScript:** clean, zero errors.

---

## 2026-05-04 — Sprint 2: Director quick capture button

**Files created:**
- `src/components/capture/QuickCaptureButton.tsx` — fixed FAB button (bottom-right, lime pill) that opens the capture modal
- `src/components/capture/QuickCaptureDrawer.tsx` — context-aware capture modal; reads usePathname to detect player profile context; saves as internal observation on player routes; acknowledges general captures without backend write

**Files modified:**
- `src/app/director/layout.tsx` — extract academyId, render QuickCaptureButton at bottom of layout

**Behavior:**
- On `/director/players/[playerId]` → shows "Player Observation" context, saves as internal coach observation after explicit click
- On all other director routes → shows "General Capture", acknowledges capture, routes review inbox coming in Sprint 4
- No auto-routing, no auto-save, no parent/player exposure

**TypeScript:** clean, zero errors.

---

## 2026-05-04 — Sprint 1: Lock notes AI flow

**Files modified:**
- `src/app/director/players/[playerId]/CoachObservationsFeed.tsx` — fix misleading empty state (previously said "session recap drafts", now correctly describes all observation sources)
- `src/lib/ai/structureCoachNote.ts` — improve missing API key error to be actionable: detects blank/placeholder keys, shows "contact admin" message
- `src/components/player/AIDraftPanel.tsx` — distinguish setup errors (orange warning with settings icon) from AI errors (red text)

**No migration. No new backend. No schema changes.**

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

**Flow audit:**
- Manual observation add ✅ works, saves internally
- Voice note transcript add ✅ works, saves internally
- "Use for Draft →" prefills AI panel ✅
- "Draft with AI" requires explicit click ✅
- AI output is editable before applying ✅
- "Apply Draft to Summary" requires explicit click ✅
- show_to_student = false (hard-coded hidden field) ✅
- show_to_parent = false (hard-coded hidden field) ✅
- No player/parent exposure ✅
- Missing API key shows actionable error ✅

---

## 2026-05-04 — Connect coach observations to AI Draft Panel

**Sprint:** AI Note Structuring MVP — observation-to-draft connection.

**What changed:**
- Each coach observation card in the Notes tab now shows a "Use for Draft →" button.
- Clicking it prefills the AI Draft Panel textarea with that observation's text.
- Director still must click "Draft with AI" manually — no auto-generation.
- AI output remains draft-only: `show_to_student=false`, `show_to_parent=false`, saved only after director clicks "Apply Draft to Summary".
- `CoachObservationsFeed` and `AIDraftPanel` are now rendered together via a thin `NotesAIDraftSection` client component that holds the shared prefill state.

**No migration. No new backend. No AI prompt changes.**

**Files modified:**
- `src/app/director/players/[playerId]/CoachObservationsFeed.tsx` — add `'use client'`, `onSelectForDraft` prop, "Use for Draft →" button per card
- `src/components/player/AIDraftPanel.tsx` — add `initialText` prop, sync via `useEffect`
- `src/app/director/players/[playerId]/page.tsx` — replace separate `AIDraftPanel` + `CoachObservationsFeed` with `NotesAIDraftSection`

**Files created:**
- `src/app/director/players/[playerId]/NotesAIDraftSection.tsx` — thin client component holding `prefillText` state

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

**Manual test steps:**
1. Open `/director/players`, open any player profile, go to Notes tab.
2. Scroll to "Internal Coach Observations". Click "Use for Draft →" on any observation card.
3. Scroll up — AI Draft Panel textarea is prefilled with that observation's text.
4. Click "Draft with AI". Review the structured output.
5. Edit fields as needed. Click "Apply Draft to Summary".
6. Confirm Development Summary updates only after explicit apply — no auto-save.
7. Confirm show_to_student / show_to_parent are `false` (hidden fields in form).

---

## 2026-05-04 — Fix fitness template director write flow

**Mode:** Bug fix. One new migration (055). No schema changes beyond adding missing RLS policies.

**Issue 1 — Curriculum level save crashed with Supabase schema error:**
- Root cause: `setCurriculumLevelAction.ts` called `.update({ curriculum_level_id: ... })` on the `templates` table. The column exists only in migration 045, which has not been applied to the live database. Supabase PostgREST returned: "Could not find the 'curriculum_level_id' column of 'templates' in the schema cache."
- The action passed this raw error string directly to `CurriculumLevelSelector`, which displayed it as a red error message.
- Fix: `setCurriculumLevelAction` now detects the "Could not find / schema cache" error pattern and returns `{ error: null, notPersisted: true }` instead of the raw Supabase message.
- `CurriculumLevelSelector` now shows a muted info message ("Curriculum source persistence is not enabled yet — migration 045 pending. Selection is not saved.") instead of a red crash error.
- The save button still works; the action still runs; it simply informs the director that the selection is not persisted until the migration is applied.

**Issue 2 — Auto-populate said "Blocks already populated" but blocks showed 0 exercises:**
- Root cause: `template_block_exercises` was created in migration 006 with `ENABLE ROW LEVEL SECURITY` but **zero RLS policies were ever defined for it**. PostgreSQL denies all access by default when RLS is enabled and no policy matches. All SELECT and INSERT calls on `template_block_exercises` by authenticated users were silently returning empty data / failing.
- The populate action's deduplication check (`SELECT block_id, exercise_id FROM template_block_exercises`) returned 0 rows (RLS denial silently returned null). So `existingByBlock` was empty, and `fresh` always had candidates.
- Inserts then failed silently (no INSERT policy either). `exercisesAdded` stayed 0, but `totalInsertAttempts` would be non-zero.
- Previously: action returned `{ ok: true, totalExercisesAdded: 0, ... }`, which the client UI rendered as "Blocks already populated — no new exercises added." This message was wrong — blocks were NOT populated.
- The page join query (`template_block_exercises` → `exercises`) also failed silently (no error was captured), so blocks always showed "No exercises in this block."
- Fixes:
  1. **Migration 055** adds `SELECT` and `ALL` policies for `template_block_exercises`, scoped to staff members via the `block → template → academy_id` chain.
  2. `populateFitnessBlocksAction.ts` now tracks `totalInsertAttempts` and `totalInsertFailures`. If every attempted insert fails, it returns `{ ok: false, error: 'Could not save exercises — database error: ...' }` instead of silently succeeding with 0 exercises.
  3. `page.tsx` now captures the `tbeError` from the join query and passes it as `blockExercisesQueryError` to `FitnessTemplateBuilderClient`.
  4. `FitnessTemplateBuilderClient.tsx` shows a new diagnostic banner when `blockExercisesQueryError` is present: "Block exercise data unavailable: [error]. Contact your admin — a database policy may be missing."

**Migration 055 — required for Issue 2 to be fully resolved:**
- File: `supabase/migrations/055_template_block_exercises_rls.sql`
- Non-destructive. Adds two new policies only. Does not modify any existing data or existing policies.
- **This migration must be applied to the live Supabase instance before the populate feature will work.**
- Apply via: Supabase SQL editor → paste and run the file contents, OR `supabase db push` if CLI is configured.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/setCurriculumLevelAction.ts` — detect schema-cache error, return `notPersisted` flag
- `src/app/director/fitness/templates/[templateId]/CurriculumLevelSelector.tsx` — handle `notPersisted`, show muted limitation message
- `src/app/director/fitness/templates/[templateId]/populateFitnessBlocksAction.ts` — track insert errors, return failure when all inserts fail
- `src/app/director/fitness/templates/[templateId]/page.tsx` — capture `tbeError`, pass `blockExercisesQueryError` to client
- `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx` — add `blockExercisesQueryError` prop + diagnostic banner

**Files created:**
- `supabase/migrations/055_template_block_exercises_rls.sql` — missing RLS policies for `template_block_exercises`

**TypeScript:** `npx tsc --noEmit` — clean, zero errors.

**QA scripts:** All 4 QA scripts passed (38/38, 0 failures, 24/24, 15/15).

**Manual test checklist (requires migration 055 applied first):**
- [ ] `/director/fitness/templates` loads for brian@dabul.test
- [ ] Open any fitness template
- [ ] 83 exercises badge appears
- [ ] Curriculum Context selector: clicking Save shows muted "persistence not enabled" message, not red error
- [ ] Populate Blocks with Exercises: adds exercises when blocks have none
- [ ] After populate, summary exercise count matches visible block exercises
- [ ] Hard refresh keeps populated exercises visible
- [ ] Add Exercise picker opens and shows exercises
- [ ] No preview-mode error (Brian is not in preview mode)

---

## 2026-05-04 — Sprint 263: Exercise Library Data Resolution + Activation V1

**Mode:** Data audit + UI improvement. No migrations. No schema changes.

**Root cause identified and resolved:**
- Architecture audit (Sprint 251) stated exercise import was dry-run only — no data inserted.
- Sprint 263 live check confirmed: **83 exercises already in DB** (14 seed + 69 Airtable import). All `is_active = true`.
- The import was run in a previous sprint (commit `ff8f834`).
- Exercises ARE present. If the fitness template builder shows empty library for a logged-in director, the cause is **RLS**: the director's `profiles.academy_id` doesn't match the demo academy, or their `academy_memberships` row is inactive/missing.

**Data confirmation:**
- 70 Airtable exercises: all had `Status = "Approved"` in CSV → all inserted with `is_active = true`
- Import script is idempotent — re-running inserts 0 rows (all 70 exist as DB duplicates)
- Rollback SQL: `DELETE FROM exercises WHERE academy_id = '00000000-0000-0000-0000-000000000001' AND 'import_batch:airtable_exercise_library_2026_04_29' = ANY(tags)`

**UI improvements:**
- Active exercise count now shown as a lime badge when exercises are available (previously buried in inline text)
- Fitness template builder count text cleaned up: badge when present, specific message when empty
- Exercise picker now shows: result count, block-type match count, "Clear search" button when search is active
- "No exercises found" message now distinguishes search-filtered vs no data

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Count badge, cleaned up empty-state text
- `src/app/director/fitness/templates/[templateId]/FitnessExercisePicker.tsx` — Count row, match count, clear search, better no-results message

**Files created:**
- `docs/templates/exercise-library-resolution.md` — Full resolution document: table schema, data state, import status, RLS condition, root cause, fix applied, remaining actions

**Validation results:**
- `npx tsc --noEmit` → CLEAN
- `qa-curriculum-seed-migration.mjs` → 38/38 passed
- `audit-curriculum-product-language.mjs` → PASS
- `qa-command-parser.mjs` → 24/24 passed
- `qa-voice-intake-structure.mjs` → 15/15 passed

---

## 2026-05-04 — Sprint 262: Fitness Exercise Library Diagnostic

**Mode:** Bug fix + diagnostic improvement. No migrations. No schema changes.

**Root cause identified:**
The fitness template builder's exercise library query (`is_active = true`) silently discarded its Supabase error and provided no distinction between:
1. No exercises in DB for this academy
2. Exercises exist but `is_active = false` (e.g. imported but not approved)
3. A Supabase/RLS query error returning empty results

Result: the page showed "Exercise library is empty" for all three cases with no diagnostic information.

**Fix applied:**
Added a diagnostic total-count query (without `is_active` filter) alongside the active-exercises query. The count query distinguishes case 1 from case 2. The library error is now surfaced to the client component for case 3. All three empty-state paths now show different, actionable messages.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Capture `libraryError`, add total-count query, pass both to client; update server-rendered hint text to show inactive-vs-empty distinction
- `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx` — Accept `libraryQueryError` and `totalExercisesInAcademy` props; update diagnostic banner to show specific message per case

**Validation results:**
- `npx tsc --noEmit` → CLEAN

**Known remaining gap:**
If RLS blocks the exercises query (e.g. `auth_is_staff()` returns false for the logged-in user), both the active-count and total-count queries return 0 via RLS row filtering. The page would show "Exercise library is empty" even if exercises exist — indistinguishable from case 1 without service-role access.

---

## 2026-05-04 — Sprint 261: Template System Stabilization + Runtime QA V1

**Mode:** Bug fixes + new route. No migrations. No schema changes.

**Sprint status before continuation:** NOT STARTED — last commit was Sprint 260.

**Root causes fixed:**
1. `class-templates` list and detail pages crashed with "column templates.curriculum_level_id does not exist" — caused by PostgREST rejecting explicit column names that don't exist in the live DB. Fixed by changing `.select('*, curriculum_level_id')` to `.select('*')` in two files.
2. `generate-session-actions.ts` had the same explicit column issue (`.select('id, name, curriculum_level_id')`). Fixed by using `.select('*')` — column is included when present, silently absent when not.
3. `assertNotPreviewMode()` in four Server Actions threw uncaught errors when invoked in preview mode, causing client-side crashes. Fixed by wrapping each call in try/catch and returning a safe `{ error: 'Writes are disabled in preview mode.' }` result.
4. `createFitnessTemplateAction` had no preview mode guard at all. Fixed by adding an `isPreviewMode()` check at the top that returns a friendly error.
5. `/director/class-templates/new` did not exist. Created the page, form, and server action.

**Files modified:**
- `src/app/director/class-templates/page.tsx` — Fix `select('*')`, add "+ New Class Template" button
- `src/app/director/class-templates/[templateId]/page.tsx` — Fix `select('*')`
- `src/app/director/fitness/fitnessTemplateActions.ts` — Add `isPreviewMode` guard to `createFitnessTemplateAction`
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Wrap `assertNotPreviewMode`, fix column select
- `src/app/director/fitness/templates/[templateId]/populateFitnessBlocksAction.ts` — Wrap `assertNotPreviewMode`
- `src/app/director/fitness/templates/[templateId]/setCurriculumLevelAction.ts` — Wrap `assertNotPreviewMode`
- `src/app/director/class-templates/[templateId]/setCurriculumLevelAction.ts` — Wrap `assertNotPreviewMode`

**Files created:**
- `src/app/director/class-templates/createClassTemplateAction.ts` — Server action: preview guard, auth, role check, insert
- `src/app/director/class-templates/new/page.tsx` — Create class template page
- `src/app/director/class-templates/new/NewClassTemplateForm.tsx` — Client form

**Validation results:**
- `npx tsc --noEmit` → CLEAN
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `qa-command-parser.mjs` — 24/24 passed
- `audit-curriculum-product-language.mjs` — PASS
- `qa-voice-intake-structure.mjs` — 15/15 passed

**Manual test checklist (static analysis):**
- `/director/class-templates` — no longer crashes on `curriculum_level_id` column error
- `/director/class-templates/new` — now exists and loads
- `/director/fitness/templates` — unaffected (query uses `*` already)
- `/director/fitness/templates/new` — `createFitnessTemplateAction` now returns friendly error in preview mode
- `/director/sessions` — unaffected (reads only, no preview mode risk)
- Preview mode — all write actions return `{ error: 'Writes are disabled in preview mode.' }` instead of throwing
- `assertNotPreviewMode()` preserved in all actions — not removed or bypassed

**Remaining limitations:**
- `templates.curriculum_level_id` column not in `database.types.ts` (migration 045 not applied to live DB). All queries now use `select('*')` which is safe regardless of column presence. When column exists, curriculum links work. When absent, curriculum link UI shows "Not linked yet".
- Class template block editing not yet built (class template detail shows read-only block list).

---

## 2026-05-04 — Sprint 260: Template Population QA and Demo Loop V1

**Mode:** Documentation + validation. No code changes. No migrations.

**Validation results:**
- `npx tsc --noEmit` → CLEAN
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `qa-command-parser.mjs` — 24/24 passed
- `audit-curriculum-product-language.mjs` — PASS
- `qa-voice-intake-structure.mjs` — 15/15 passed

**Files created:**
- `docs/templates/template-population-demo-flow.md` — complete demo flow for fitness template, class template, and session generation paths; library utility reference; known gaps

**Known gaps documented:**
- `database.types.ts` not regenerated (curriculum fields use rawDb)
- Class template block editing not yet built
- Recommendation engines not surfaced in UI
- Template source badges not rendered
- Session notes curriculum cues are text-only (no structured DB field)

---

## 2026-05-04 — Sprint 259: Session Generation From Curriculum-Linked Templates V1

**Mode:** Server action enhancement. No migrations. No schema changes.

**What was built:**
- Session generation now embeds curriculum coach language cues in session_notes when a template has a curriculum level assigned
- Added `[Coach Cues: ...]` line to the curriculum prefix in session_notes — up to 4 coach language cues from `curriculum_content_items` (section: curriculum_coach_language)
- Uses `getCurriculumContentForLevel()` from the new `curriculumTemplateLinks.ts` utility
- Session notes format: `[Curriculum: Level Name]` → `[Academy Version: ...]` → `[Coach Cues: ...]` → user notes

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — added curriculum content query and coach cues line to session notes prefix

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS
- `qa-command-parser.mjs` — 24/24 passed
- `qa-voice-intake-structure.mjs` — 15/15 passed

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 258: Template Preview and Source Traceability V1

**Mode:** Pure utility library. No migrations. No DB access. No AI calls.

**What was built:**
- `templateSourceTraceability.ts` — parses template tags and provides source traceability for templates and session blocks
- `parseTemplateTags()` — extracts import_batch, airtable_id, template_type, isFitnessTemplate from template tags array
- `buildTemplateSourceInfo()` — combines tag data + curriculum level into a structured TemplateSourceInfo
- `formatTemplateOriginBadge()` — short label for display: "Imported", "Fitness OS", "Manual", "Curriculum-Linked"
- `formatTemplateSourceDescription()` — full one-line source description for UI tooltips and audit views
- Session block traceability: `sessionBlockIsTraceable()`, `formatSessionBlockSourceLabel()`, `formatSessionBlockProvenance()`
- Covers the `session_blocks.template_block_id` → `template_blocks.id` chain documented in database.types.ts

**Files created:**
- `src/lib/templates/templateSourceTraceability.ts` — source traceability utility

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 257: Curriculum to Template Block Recommendations V1

**Mode:** Pure utility library. No migrations. No DB access. No AI calls.

**What was built:**
- `curriculumBlockRecommendations.ts` — maps curriculum stage/fitness phase to recommended session block sequences
- `getRecommendedBlocksForStage()`: returns recommended blocks (type, duration, emphasis, rationale) for a given stage and session duration
- `getRecommendedBlocksForFitnessPhase()`: same but accepts fitness phase string from `curriculum_fitness_guidance`
- `stageForFitnessPhase()`: maps fitness phase → curriculum stage
- All 5 stages covered: Red Foundation through High Performance, with evidence-based block sequences and rationale text
- Durations are proportional to total session time (not hardcoded), so a 60-min session vs 90-min session produces correct block sizes

**Files created:**
- `src/lib/templates/curriculumBlockRecommendations.ts` — block recommendation utility

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 256: Class Template Curriculum Picker V1

**Mode:** New page + client component + server action. No migrations. No schema changes.

**What was built:**
- Class template detail page at `/director/class-templates/[templateId]` — was previously missing
- `ClassTemplateCurriculumSelector` — curriculum level dropdown + save for class templates; revalidates class-template path (not fitness-template path)
- `setCurriculumLevelAction` (class-template scoped) — same security model as fitness version; revalidates both `class-templates/[id]` and `class-templates`
- Block list panel: read-only view of template blocks with exercises and durations
- Fixed class templates list page: links now go to `/director/class-templates/[id]` instead of `/director/fitness/templates/[id]`

**Files created:**
- `src/app/director/class-templates/[templateId]/page.tsx` — class template detail page
- `src/app/director/class-templates/[templateId]/setCurriculumLevelAction.ts` — server action with correct revalidation path
- `src/app/director/class-templates/[templateId]/ClassTemplateCurriculumSelector.tsx` — curriculum picker client component

**Files modified:**
- `src/app/director/class-templates/page.tsx` — fixed template row link href from fitness to class-templates path

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS
- `qa-command-parser.mjs` — 24/24 passed
- `qa-voice-intake-structure.mjs` — 15/15 passed

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 255: Class Template Curriculum Link Model V1

**Mode:** Server utility library. No migrations. No UI changes.

**What was built:**
- `curriculumTemplateLinks.ts` — server-side utility for resolving curriculum context from class templates
- `getCurriculumLevelForTemplate()` — fetches the `curriculum_level_id` assigned to a template, returns level metadata
- `getCurriculumContentForLevel()` — fetches content items from `curriculum_content_items` for a level; supports optional section filter
- `getTemplateCurriculumContext()` — full context resolver combining level + content + formatted summary
- `formatCurriculumContextText()` — formats curriculum context for embedding in session_notes at generation time
- `getAllCurriculumLevels()` — all levels ordered by sort_order, for powering picker dropdowns
- All queries use `rawDb = supabase as any` since `curriculum_level_id` and `curriculum_content_items` are not in generated types

**Files created:**
- `src/lib/templates/curriculumTemplateLinks.ts` — curriculum context resolver utility

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 254: Fitness Template Auto-Populate Suggestions V1

**Mode:** Pure utility library. No migrations. No DB access. No AI calls.

**What was built:**
- `fitnessExerciseRecommendations.ts` — ranked exercise suggestion engine for fitness block types
- `rankExercisesForBlock()`: scores all library exercises for a given block type, returns sorted list with reasons and fit level (strong/moderate/weak)
- `getBlockRecommendations()`: fills a duration budget with best-matching exercises, excludes already-assigned exercises, returns budget accounting
- Reasons are human-readable strings ("Category 'movement' matches…", "Name contains 'agility'…") suitable for UI tooltips and future director summaries

**Files created:**
- `src/lib/templates/fitnessExerciseRecommendations.ts` — ranked recommendation utility

**QA results:** TypeScript clean — no QA scripts needed (pure utility, no DB/UI changes).

---

## 2026-05-04 — Sprint 253: Fitness Template Exercise Picker V1

**Mode:** UI component. No migrations. No schema changes.

**What was built:**
- `FitnessExercisePicker` modal — searchable exercise picker for manually adding exercises to fitness template blocks
- Sorts best-category-match exercises first, then alphabetically; search filters by name/category/subcategory
- Calls existing `addExerciseToFitnessBlockAction`; reloads page on success
- "Add Exercise" dashed button added to bottom of each fitness block card (only shown when library has exercises)

**Files created:**
- `src/app/director/fitness/templates/[templateId]/FitnessExercisePicker.tsx` — add-exercise modal component

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx` — wired picker state + modal, added "Add Exercise" button to FitnessBlockCard, updated empty block message

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS
- `qa-command-parser.mjs` — 24/24 passed
- `qa-voice-intake-structure.mjs` — 15/15 passed

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 252: Fix Fitness Exercise Library Population

**Mode:** UI wiring + action result improvements. No migrations. No schema changes.

**Root cause resolved:**
- Exercises ARE present in DB (83 rows) — dry run report was misleading
- Real gap: `PopulateFitnessBlocksButton` was never imported or mounted on the fitness template detail page
- No diagnostic visibility for library size in the builder UI

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/populateFitnessBlocksAction.ts` — added `exercisesInLibrary` field to result type and final return
- `src/app/director/fitness/templates/[templateId]/PopulateFitnessBlocksButton.tsx` — added `exerciseLibraryCount` prop; improved success/empty state messaging with library count badge
- `src/app/director/fitness/templates/[templateId]/page.tsx` — wired `PopulateFitnessBlocksButton` into page (new "Auto-Populate Exercises" card); dynamic library count in description text
- `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx` — added orange warning banner when library is empty; context-aware "no exercises" message per block

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS
- `qa-command-parser.mjs` — 24/24 passed
- `qa-voice-intake-structure.mjs` — 15/15 passed

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 251: Template Population Architecture Audit

**Mode:** Audit and docs only. No code changes. No migrations.

**What was audited:**
- Exercise storage: `exercises` table, `exercise_category` enum, `is_active` flag, academy scoping
- Exercise import: `import-exercises.js` was run in DRY RUN mode only — 70 exercises were never inserted; only 14 seeded exercises exist
- Fitness template population: query, matching logic, and RLS are correct; failure is pure data gap
- FitnessBlockType taxonomy vs DB `block_type` enum: two separate type systems, mapped in `fitnessBlockTypes.ts`
- `templates` table: has two level columns (`level_id` → old academy_levels, `curriculum_level_id` → new curriculum_levels)
- `curriculum_content_items` table: exists (migration 045) but not in generated types
- Class template builder: list page exists, detail/builder page does NOT exist
- Session generation: works; copies template_blocks → session_blocks; curriculum level embedded as text in session_notes
- Schema gaps: no structured `curriculum_source_id` on `template_blocks`; `database.types.ts` not regenerated after migration 045

**Files created:**
- `docs/templates/template-population-architecture-audit.md` — comprehensive architecture map for Sprints 252–260

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS
- `qa-command-parser.mjs` — 24/24 passed
- `qa-voice-intake-structure.mjs` — 15/15 passed

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 250: Competition Tab Content V1

**Mode:** UI build. No migrations. No schema changes. Academy-scoped reads only.

**What was built:**
- Competition tab in player profile now shows live UTR data instead of a placeholder empty state
- UTR profile card: singles/doubles UTR, win rate, wins/losses, matches played (90d + YTD), last match date
- UTR trend chart: lime line chart of last 12 UTR readings with delta on latest reading
- UTR insights: active insights with delta indicators and period windows
- Match results list: last 10 matches with result badge, opponent name + UTR, score, tournament, surface, UTR impact
- Empty state shown when no competition data exists for the player

**Files created:**
- `src/components/player/UtrHistoryChart.tsx` — `'use client'` recharts line chart for UTR history trend (isolated to keep page.tsx server-compatible)
- `src/components/player/PlayerCompetitionTab.tsx` — server-compatible competition tab component; accepts pre-fetched UTR data as props

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — added 4 sequential UTR queries (profile, history, matches, insights) after load queries; replaced competition placeholder with `<PlayerCompetitionTab />`

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 249: Voice Intake Demo and QA V1

**Mode:** Docs only. No code changes. No migrations. No schema changes. Closes the Voice Intake OS Foundation block (Sprints 240–249).

**What was built:**
- Demo flow document covering director Command Center, coach session workspace, and director review queue — with raw transcript examples, structured output examples, safety invariants, safety flags reference, role permission matrix, QA checklist, V1 limitations, and AI/STT integration path
- `CURRENT_BUILD_TARGET.md` updated — Voice Intake OS Foundation marked complete; Competition tab identified as next target; Step 9 (Voice Command Center execution) updated to reflect foundation complete
- `KNOWN_LIMITATIONS.md` updated — "Voice UI should not be built yet" replaced with accurate V1 limitations; Command Center execution note updated from "3 of 14" to "11 of 15" action types
- `LOCKED_MODULES.md` updated — date updated; `voiceRoleGuardrails.ts`, `voiceIntakeTypes.ts`, `voice-intake-architecture.md` added as locked; voice structurer, router, panel, and review card added as "usable but incomplete"; voice intake execution routing entry added

**QA results:**
- `qa-voice-intake-structure.mjs` — 15/15 passed
- `qa-command-parser.mjs` — 24/24 passed
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero product/tool references

**Files created:**
- `docs/conversational-os/voice-intake-demo-flow.md` — full demo script + safety reference + V1 limitations + AI integration path

**Files modified:**
- `docs/CURRENT_BUILD_TARGET.md` — Voice Intake OS Foundation block added as complete
- `docs/KNOWN_LIMITATIONS.md` — voice pipeline limitations updated for V1 reality
- `docs/LOCKED_MODULES.md` — new voice intake modules catalogued

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 248: Voice Safety and Role Guardrails V1

**Mode:** New pure utility module + defense-in-depth integration. No DB calls. No migrations. No UI changes.

**What was built:**
- `voiceRoleGuardrails.ts` — voice intent permission matrix; director-only intents (create_session_draft, create_group_draft, set_group_focus, create_player_review_request, create_parent_safe_draft, summarize_curriculum_gaps, create_coach_briefing, record_director_note); coach intents (record_attendance_exception, flag_unrostered_attendee, create_player_observation, create_gate_evidence_draft, create_session_recap, create_gap_signal, create_parent_safe_candidate, alert_director); exports: `canRoleCreateVoiceIntent()`, `getVoiceBlockedReason()`, `getVoiceIntentsForRole()`, `isVoiceActionIntent()`, `voiceIntentRequiresApproval()`, `isHardBlockedAutoIntent()`
- `structureVoiceIntake.ts` updated with defense-in-depth filter: after `detectIntentsForRole()`, every detected intent is re-checked against `canRoleCreateVoiceIntent()`; blocked intents are removed and a `parse_warning` is added; if all intents are blocked, falls back to `unknown`

**Files created:**
- `src/lib/voice/voiceRoleGuardrails.ts` — voice intent permission matrix and guardrail functions

**Files modified:**
- `src/lib/voice/structureVoiceIntake.ts` — import and integrate `canRoleCreateVoiceIntent()` + `getVoiceBlockedReason()` as defense-in-depth post-detection filter

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 247: Voice Intake Review Panel V1

**Mode:** New card component + server action + review page tab. No schema changes. No migrations. No execution step — V1 approval records the director's review decision only.

**What was built:**
- `VoiceIntakeDraftCard` — full-detail display card for voice intake proposed_actions: transcript, cleaned summary, role/context, confidence, safety flags, detected intents, extracted entities, suggested destinations, recommended action, what would change, what would not change, source note
- Inline `VoiceIntakeDecisionControls` — approve / needs clarification / reject with optional note; calls new server action
- New `updateVoiceIntakeDraftDecisionAction` — verifies academy_id, role (director/head_coach), target_module = voice_intake, draft_type = voice_intake_v1, status = pending_review; updates status + reviewer tracking fields only
- Voice Intake tab added to Director Review Queue: fetch, PageHeader stats, tab trigger, tab content with approved/pending sections and EmptyState

**Files created:**
- `src/app/director/review/VoiceIntakeDraftCard.tsx` — Client Component: display card + decision controls for voice intake drafts

**Files modified:**
- `src/app/director/review/actions.ts` — add `updateVoiceIntakeDraftDecisionAction`
- `src/app/director/review/page.tsx` — import + fetch voice_intake drafts (steps 28–31), add to PageHeader, defaultTab, TabsTrigger, and TabsContent

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 246: Voice Intake to Proposed Actions V1

**Mode:** Server action + UI wiring. No schema changes. No migrations. All voice intake drafts route through proposed_actions pipeline — always pending_review, never auto-executed.

**What was built:**
- Server action creates a `voice_commands` row (required FK) then a `proposed_actions` row with `target_module = 'voice_intake'`, `action_type = 'other'`, `status = 'pending_review'`
- Risk level auto-set: `medium` if safety flags present, `low` otherwise
- Director command center wires the action: "Create Review Draft" button appears after voice structuring result; shows success state with "View Review Queue" link on creation
- Reset state on new input: voiceDraftId and voiceDraftError cleared on any text change

**Files created:**
- `src/app/director/command-center/createVoiceIntakeDraftAction.ts` — server action: auth → academy_id → role check → voice_commands INSERT → proposed_actions INSERT

**Files modified:**
- `src/app/director/command-center/CommandCenterClient.tsx` — import action, add voiceDraftId/voiceDraftError/isCreatingVoiceDraft state, handleCreateVoiceDraft(), update VoiceStructuredResultCard to accept and render draft creation button + success state

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 245: Voice Destination Router V1

**Mode:** New pure helper. No DB calls. No UI page changes. No migrations.

**What was built:**
- `voiceDestinationRouter.ts` — deterministic destination routing; 14 destination definitions with label, description, why_useful, risk_level, requires_approval, what_would_change, what_would_not_change, allowed_roles; exports `routeVoiceIntakeDraft()`, `getDestinationRiskLevel()`, `destinationRequiresApproval()`, `canRoleRouteToDestination()`, `explainDestination()`
- Role restrictions enforced: `parent_safe_draft`, `player_mission`, `session_planning`, `group_planning`, `coach_briefing`, `director_note` restricted to director/head_coach only
- Director command center updated to use `routeVoiceIntakeDraft()` for enriched destination chips (primary destination starred, risk level color-coded)
- QA script expanded to 15 tests (5 new router tests): destination risk level, all-require-approval, coach/director role restrictions

**Files created:**
- `src/lib/voice/voiceDestinationRouter.ts` — destination catalogue, routing logic, role restrictions

**Files modified:**
- `src/app/director/command-center/CommandCenterClient.tsx` — import router, use `routeVoiceIntakeDraft()` in VoiceStructuredResultCard destination display
- `scripts/qa-voice-intake-structure.mjs` — add destination router tests (5 new tests)

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.
**QA:** 15 tests, 15 passed.

---

## 2026-05-04 — Sprint 244: Coach Voice Structuring V1

**Mode:** Client component enhancement. No schema changes. No migrations. No new DB writes. Preserves all existing coach recap save/structure behavior.

**What was built:**
- `CoachRecapCommandPanel` enhanced: raw textarea replaced with `VoiceTextInput` (adds browser SpeechRecognition with text fallback to coach recap input)
- `structureVoiceIntake()` wired as a `useMemo` in `CoachRecapCommandPanel` — runs client-side whenever recap text ≥ 15 characters, no async, no DB
- `CoachVoiceStructureDisplay` component — shows coach-specific structure preview: detected intents (attendance exception, unrostered attendee, player observation, gate evidence, session recap, gap signal, parent safe candidate, director alert), player name mentions, gap signal links, "will not change" safety note
- All existing save/structure/review flow preserved untouched
- Coach examples supported by intent patterns: "except Sarah", "Jeremy showed up", "Lucas recovered", "Maya understood the pattern"

**Files modified:**
- `src/app/coach/sessions/[sessionId]/CoachRecapCommandPanel.tsx` — import VoiceTextInput + structureVoiceIntake; replace textarea with VoiceTextInput; add voiceStructure useMemo; add CoachVoiceStructureDisplay

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 243: Director Voice Structuring V1

**Mode:** Client component wiring. No schema changes. No migrations. No DB writes from new code.

**What was built:**
- `structureVoiceIntake()` wired into Director Command Center — runs client-side on every VoiceIntakePanel submit
- Director voice examples added to VoiceIntakePanel: Orange 2 session, group focus watching, parent update, evidence summary
- `VoiceStructuredResultCard` component — shows full voice intake draft: cleaned summary, safety flags, detected intents (chips), extracted entities, suggested destinations, recommended primary action, what would change (if approved), what would not change (always-blocked list), parse warnings
- Safety flags shown with color coding (orange/red) inline before intents
- "Review draft only — requires approval" badge on requires_review drafts
- Confidence badge (high/medium/low) with color coding
- VoiceIntakePanel onChange now also clears voiceResult

**Files modified:**
- `src/app/director/command-center/CommandCenterClient.tsx` — import structureVoiceIntake + types; add voiceResult state; update handleParse to call structureVoiceIntake client-side; add VoiceStructuredResultCard; add DIRECTOR_VOICE_EXAMPLES; pass examples to VoiceIntakePanel

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 242: Voice Intake Draft Model V1

**Mode:** New pure helpers + QA script. No DB calls. No AI. No UI changes. No migrations.

**What was built:**
- `VoiceIntakeTypes` — complete type definitions: VoiceIntakeRole, VoiceIntakeContext, VoiceIntakeIntentType (16 values), VoiceDestinationModule (14 values), VoiceSafetyFlag (7 values), VoiceExtractedEntity, VoiceIntakeDraft, VoiceIntakeStructureInput, VoiceIntakeStructureResult
- `structureVoiceIntake()` — deterministic structuring helper; cleans transcript; detects 8 director + 8 coach intents via pattern matching; extracts player names, group names, curriculum levels, focus keywords; scores confidence; builds destination list; generates what_would_change and what_would_not_change (6 unconditional rules); sets safety_flags (7 types); infers gap links; returns VoiceIntakeStructureResult
- `qa-voice-intake-structure.mjs` — 10-case QA script; pure JS mirror; covers director commands, coach commands, safety flag detection, what_would_not_change invariants, empty and unknown inputs
- Fixed safety flag detection: parent exposure pattern now handles "parent...update" word order; level change detection handles "move [name] up" patterns

**Files created:**
- `src/lib/voice/voiceIntakeTypes.ts` — all voice intake TypeScript types
- `src/lib/voice/structureVoiceIntake.ts` — deterministic voice intake structuring helper
- `scripts/qa-voice-intake-structure.mjs` — QA test script (10 tests, all passing)

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.
**QA:** 10 tests, 10 passed.

---

## 2026-05-04 — Sprint 241: Universal Voice Button UI V1

**Mode:** New component + minimal client component edit. No schema changes. No migrations. No AI. No DB writes.

**What was built:**
- `VoiceIntakePanel` — reusable controlled voice/text intake component; wraps `VoiceTextInput` with role badge, context label, submit button, safety note, optional examples list
- Replaced raw textarea card in Director Command Center with `VoiceIntakePanel`; preserved all existing parse, draft creation, example, history behavior
- `handleParse` updated to accept optional text override (prevents state race on submit)
- Coach integration deferred to Sprint 244 per sprint plan

**Files created:**
- `src/components/voice/VoiceIntakePanel.tsx` — controlled voice/text intake panel; role prop, contextLabel, value/onChange/onSubmit, optional examples, safety guardrail note

**Files modified:**
- `src/app/director/command-center/CommandCenterClient.tsx` — import VoiceIntakePanel, replace textarea card, update handleParse signature

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 240: Voice Intake Architecture Audit

**Mode:** Docs only. No code. No schema changes. No migrations. No UI.

**What was built:**
- Full voice intake architecture document defining the V1 Voice Intake OS foundation
- North star, role-specific voice sources, director and coach voice examples
- Supported V1 intents (8 director, 8 coach, 1 shared)
- Destination module catalogue (14 destinations with risk levels and approval rules)
- `VoiceIntakeDraft` typed shape with all fields, supporting types, safety flags
- Approval rules matrix, safety rules (10 unconditional blocks)
- `proposed_actions` mapping pattern for voice intake drafts
- What must never happen automatically (10 rules)
- Text input fallback rationale
- Future AI/STT integration plan (V2 STT, V3 AI enrichment, V4 real-time session voice)
- Build order for Sprints 241–249 with titles and descriptions
- Architecture diagram (full pipeline)
- Relationship to existing pipeline components
- Known V1 limitations

**Files created:**
- `docs/conversational-os/voice-intake-architecture.md` — complete voice intake OS architecture

**TypeScript:** Clean — no code changes; `npx tsc --noEmit` baseline passes.

---

## 2026-05-04 — Sprint 239: Fitness / Load Tab Content

**Mode:** New component + minimal page edit. No schema changes. No migrations. No AI. No mutations.

**What was built:**
- `PlayerLoadTab` — director-internal display component for `player_load_aggregation` data
  - Overload alert banner (shown only when `overload_flag = true`)
  - Training Volume card: sessions 7d/28d, duration 7d/28d, absences 7d (color-coded at thresholds)
  - Session Domain Mix card: skill / fitness / competition session counts (28d)
  - Intensity & Fatigue card: avg intensity 7d/28d, perceived load, high-intensity blocks, fatigue risk label + score, load trend with directional icon
  - "No load data" empty state when no `player_load_aggregation` row exists
  - "Last calculated" timestamp for data freshness
- Expanded `loadRow` select in player profile page to include `duration_7d_min`, `avg_intensity_7d`, `avg_intensity_28d`, `avg_perceived_load_7d`, `avg_perceived_load_28d`, `high_intensity_blocks_7d`, `calculated_at`
- Replaced "Fitness & load tracking coming soon" empty state with live `<PlayerLoadTab>` render
- `FitnessHomeworkRecommendationButton` kept below the load tab as a director action

**Files created:**
- `src/components/player/PlayerLoadTab.tsx` — load metrics display component with overload alert, volume, domain mix, intensity & fatigue sections

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — expand load query (7 additional fields), swap fitnessSlot empty state for PlayerLoadTab, remove unused Activity import, add PlayerLoadTab import
- `docs/CURRENT_BUILD_TARGET.md` — updated to reflect actual build state (steps 1–5 and IDP engine complete; Competition tab is next)

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 238: Polish IDP and Gap Engine Demo

**Mode:** UI wiring + documentation. No schema changes. No migrations. No new components.

**What was built:**
- Wired full gap detection into the director player profile Skill Path tab
- One new `player_load_aggregation` query (`.maybeSingle()`, gracefully handles missing data)
- Runs `detectTrainingGaps()`, `detectKnowledgeGaps()`, `buildDirectorGapGuidance()` per player page load (all pure helpers, no AI)
- `GapGuidanceSummaryCard` rendered in Skill Path tab after curriculum assignment card — shows top action, all items by priority, director-internal label
- Created comprehensive demo script covering director flow, coach flow, all gap types, safety rules, file locations, pre-conditions for each demo scenario

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — added 4 imports, 1 load query, 3 gap detection calls, 1 `GapGuidanceSummaryCard` render in Skill Path tab

**Files created:**
- `docs/player-development/idp-gap-engine-demo.md` — full demo script: architecture summary, pre-conditions, director flow, coach flow, gap type reference, priority tiers, safety rules, file locations, known limitations

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 237: Add Gap Context to Coach Session Workspace

**Mode:** New component + minimal page modification. No schema changes. No migrations. No mutations.

**What was built:**
- `CoachSessionGapBriefPanel` — Async Server Component; fetches load aggregation and curriculum gap data for all roster players; runs `detectTrainingGaps()`, `detectKnowledgeGaps()`, `buildCoachGapGuidance()` per player (all pure helpers from Sprints 232–234)
- 5 sequential Supabase queries: load aggregation, curriculum states, gates, coach language, drill counts
- Compact per-player row: player name + level label + top_action text + act_now/monitor priority badge + "+N more" overflow count
- Panel renders null when roster is empty; shows EmptyState when no gaps detected for any roster player
- Coach-internal safety label — "not visible to players" — displayed in card header
- Wired into `/coach/sessions/[sessionId]` between execution client and recap panel

**Files created:**
- `src/app/coach/sessions/[sessionId]/CoachSessionGapBriefPanel.tsx` — async Server Component with gap brief rendering

**Files modified:**
- `src/app/coach/sessions/[sessionId]/page.tsx` — import panel, build rosterNames map, render panel before CoachRecapCommandPanel

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 236: Expand Approved Action Execution Coverage

**Mode:** Migration + documentation. No app-layer changes. No UI changes.

**What was built:**
- Extended `execute_approved_action()` RPC from 5 to 11 handled action types (of 15 in the enum)
- New WHEN clauses: `modify_session`, `create_template`, `modify_template`, `create_placement_assessment`, `adjust_session_intensity`, `flag_player`
- `create_placement_assessment` side-effects: advances player from `pending_placement` → `placement_in_progress`
- `flag_player` sets `player_progression.promotion_flagged_at/by` — does not change `player_status` enum
- `adjust_session_intensity` updates ALL blocks in the session (not block-by-block)
- All new cases write to `action_execution_logs` and `audit_logs` via existing boilerplate
- Deferred: `generate_parent_update`, `create_player`, `create_exercise` (rationale documented)
- Coverage plan doc maps all 15 action types, payload contracts, and remaining unblock path

**Files created:**
- `supabase/migrations/054_execute_approved_action_expansion.sql` — CREATE OR REPLACE FUNCTION with 6 new WHEN clauses
- `docs/conversational-os/approved-action-execution-coverage-plan.md` — full coverage map, payload contracts, deferred type rationale

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors (SQL migration — no TS impact).

---

## 2026-05-04 — Sprint 235: Improve Director Review Decision UX

**Mode:** UI refactor only. No schema changes. No migrations. No new queries. No mutations.

**What was built:**
- Replaced the 5-section scrolling layout in the director review page with tab navigation
- 5 tabs: Session Recaps, Priorities, Evidence, Attendance, Curriculum
- `defaultTab` computed server-side — director always lands on the first category with pending items
- `TabLabel` helper renders orange pending count badges and lime ready count badges inline in tab triggers
- All 27 data-fetching steps kept 100% identical — no logic changes, only layout restructure

**Files modified:**
- `src/app/director/review/page.tsx` — converted scrolling layout to `<Tabs>` with 5 `<TabsTrigger>` / `<TabsContent>` pairs

**TypeScript:** Clean — `npx tsc --noEmit` passed with 0 errors.

---

## 2026-05-04 — Sprint 234: Role-Specific Gap Guidance V1

**Mode:** Pure helper library + display component. No DB calls. No AI. No migrations. No writes.

**What was built:**
- `buildRoleSpecificGapGuidance(input)` — pure function translating `IdpTrainingGap[]` and `IdpKnowledgeGap[]` into role-appropriate `RoleSpecificGapGuidance`
- `buildDirectorGapGuidance(...)` and `buildCoachGapGuidance(...)` — convenience wrappers
- 8 training gap types × 2 roles = distinct action and rationale text per role
- 7 knowledge gap types × 2 roles = distinct action and rationale text per role
- Priority tiers: `act_now` (immediate) → `monitor` (watch closely) → `informational` (contextual)
- `top_action` derived from first `act_now` item, or first `monitor` item if none
- `insufficient_data` training gaps produce no guidance item (null — no data to act on)
- `GapGuidanceSummaryCard` component: top action in lime-bordered box, items grouped by priority, source and domain badges
- Director and coach roles only — player and parent never receive gap guidance

**Safety boundaries enforced:**
- No automatic actions triggered by guidance items
- No player or parent data exposed
- No raw coach notes, session content, or internal staff names in guidance text
- Guidance is informational only — director/coach must act manually

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed

**TypeScript:** 0 errors.

### Files created
- `docs/player-development/role-specific-gap-guidance.md` — spec: inputs, outputs, priority tiers, role mapping tables, examples, safety rules, future integration points
- `src/lib/gaps/roleSpecificGapGuidance.ts` — pure helper with per-role guidance translation for all training and knowledge gap types
- `src/components/player/GapGuidanceSummaryCard.tsx` — director/coach gap guidance card with top action highlight and priority-grouped item list

---

## 2026-05-03 — Sprint 233: Knowledge Gap Detection V1

**Mode:** Pure helper library + display component. No DB calls. No AI. No migrations. No writes.

**What was built:**
- `detectKnowledgeGaps(input)` — pure function returning `IdpKnowledgeGap[]` from curriculum, gate, and coach language data
- 7 gap types: `no_curriculum_level`, `insufficient_data`, `no_coach_language`, `no_drills_available`, `domain_gap_cluster`, `many_open_gates`, `no_module_domain_match`
- Domain normalizer maps raw gate domains to `LearningModuleDomain` for `suggested_module_domain` — fuzzy keyword match with `'Technical'` fallback
- `domain_gap_cluster` detects when ≥ 70% of open gates concentrate in one domain
- `many_open_gates` triggers at 5+ open gates (broad coverage gap)
- `KnowledgeGapCard` component: director/coach facing, severity-colored icons, lime badge for `suggested_module_domain`
- Gaps sorted: high → medium → low → insufficient_data
- Knowledge gaps are NEVER surfaced to player or parent views

**TypeScript fixes applied:**
- `IdpKnowledgeGap` has no `role_note` field — operational detail moved into `description` field
- Replaced `Map`/`Set` iterator spread with array-based `Object.entries()` approach (ES5 compat)

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed

**TypeScript:** 0 errors.

### Files created
- `docs/player-development/knowledge-gap-detection.md` — spec: inputs, 7 gap types, severity rules, domain mapping, role visibility, safety
- `src/lib/gaps/knowledgeGapDetection.ts` — pure `detectKnowledgeGaps()` helper with domain normalizer
- `src/components/player/KnowledgeGapCard.tsx` — director/coach knowledge gap display card

---

## 2026-05-03 — Sprint 232: Training Gap Detection V1

**Mode:** Pure helper library + display component. No DB calls. No AI. No migrations. No writes.

**What was built:**
- `detectTrainingGaps(input)` — pure function returning `IdpTrainingGap[]` from player load and attendance data
- 8 gap types: `insufficient_data`, `overload_risk`, `low_session_frequency`, `high_absence_rate`, `domain_imbalance`, `undertraining`, `gate_evidence_exposure`, `load_declining`
- All inputs sourced from `player_load_aggregation` fields (confirmed in DB schema)
- `insufficient_data` returned when all numeric load fields are null — never throws or crashes
- Gaps sorted by severity: high → medium → low → insufficient_data
- `TrainingGapCard` component: director/coach facing, `showRoleNote` prop, severity-colored icons
- Spec doc: input sources, gap types, severity thresholds, role visibility rules, safety rules
- Training gaps are NEVER surfaced to player or parent views

**Safety boundaries:**
- `role_note` content is internal operational language — never exposed to player or parent
- No deficit framing in user-visible descriptions
- No product/tool names in any gap text

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed

**TypeScript:** 0 errors.

### Files created
- `docs/player-development/training-gap-detection.md` — spec: inputs, gap types, severity thresholds, role rules, safety
- `src/lib/gaps/trainingGapDetection.ts` — pure `detectTrainingGaps()` helper
- `src/components/player/TrainingGapCard.tsx` — director/coach gap display card

---

## 2026-05-03 — Sprint 231: Parent Approved Development Plan Portal V1

**Mode:** Parent portal auth + IDP integration. No schema changes. No migrations. Read-only.

**What was built:**
- `/parent` route resolves auth user → `guardians.profile_id` → `player_guardians` → linked active player
- If no guardian record exists for the user, shows safe empty state with account-linking instructions
- If no player is linked to the guardian, shows safe empty state
- If mapping found: fetches curriculum state, next level, coach language (sanitized via `sanitizeParentFacingText`), active priorities
- Builds `IndividualDevelopmentPlan` via `buildIndividualDevelopmentPlan()`
- Renders parent role view via `buildRoleSpecificIdpView(plan, 'parent')` → `IdpParentView`
- Approved data banner: "This view uses approved development information only." (from `approved_data_note`)
- Child's Progress card: maps `what_child_is_working_on` and `next_development_step` to `ParentSafeProgressPreview`
- Live sections: Why It Matters, How to Support This Week, What to Say After Practice, What Not to Over-Focus On
- Safety note footer: from `IdpParentView.safety_note`
- All data passes through `sanitizeParentFacingText` — no raw coach notes, no scores, no rankings

**Safety boundaries:**
- No raw coach observations or internal notes exposed
- No assessment scores or percentile ranks
- No ranking or comparison to other players
- No unapproved content — all text derived from curriculum-level coach language only
- `isPreviewOnly={false}` on `ParentSafeProgressPreview` — parent sees their own data, not a director preview

**Known limitation:** Guardian-to-player mapping (`guardians.profile_id` + `player_guardians`) may not be populated in the current database. Parents without a linked guardian record see the empty state with account-linking instructions.

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed

**TypeScript:** 0 errors.

### Files modified
- `src/app/parent/page.tsx` — converted to async Server Component; guardian → player resolution; live IDP parent view sections; safe empty states

---

## 2026-05-03 — Sprint 230: Player Portal Live Development Plan V1

**Mode:** Player portal auth + IDP integration. No schema changes. No migrations. Read-only.

**What was built:**
- `/player` route now resolves auth user → `players.profile_id` → player record
- If no mapping exists, shows safe empty state with "ask your coach to connect your profile" message
- If mapping exists, fetches curriculum state, gates, drills, coach language, active priorities
- Builds `IndividualDevelopmentPlan` using `buildIndividualDevelopmentPlan()`
- Renders player role view: Today's Mission, What to Work On, What to Understand, Next Evidence to Show, This Week's Challenge (learning module), Q&A answer
- All data is player-safe: no coach observations, no assessment scores, no other-player data

**Known limitation:** `players.profile_id` may not be set in current data. If not set, player sees safe empty state.

**QA results:**
- `audit-curriculum-product-language.mjs` — PASS
- TypeScript: 0 errors

### Files modified
- `src/app/player/page.tsx` — auth + IDP resolution, live development plan sections

---

## 2026-05-03 — Sprint 229: Player Individual Development Plan Model V1

**Mode:** New pure helper + doc. No DB calls. No AI. No migration. No routes changed.

### Files created
- `docs/player-development/individual-development-plan-model.md` — full spec for the IDP object, role views, safety rules, and computation sources
- `src/lib/player/individualDevelopmentPlan.ts` — pure helper exporting `IndividualDevelopmentPlan`, `IdpRoleView`, `IdpTrainingGap`, `IdpKnowledgeGap`, `buildIndividualDevelopmentPlan()`, `buildRoleSpecificIdpView()`, `getIdpSafetyNote()`

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed

**TypeScript:** 0 errors.

---

## 2026-05-03 — Sprint 228: Conversational OS QA + Polish V1

**Mode:** Polish and safety pass only. No schema changes. No migrations. No writes. No AI. No new routes.

**Routes audited:**
- `/director/command-center` — guardrail badges, "requires approval" labels, query-only labels, draft visibility panel, bottom guardrail note: all correct
- `/director/curriculum/learning` — "Learning Module Preview — read-only" badge, director eyebrow, no player/parent data exposure: correct
- `/director/players/[playerId]` Q&A preview — "Director preview — read-only" badge, Mission/Try this/Reflection sections: correct
- `/director/players/[playerId]` parent guidance preview — "Director preview — not sent" badge, bottom privacy note: correct
- `/director/review` StructuredDraftCard — "Will change if approved" / "Will not change automatically" panels, source recap, safety banner: correct (Sprint 225)
- `/player` — `PlayerMissionPreview` shows clean empty state, no internal data: correct
- `/parent` — `ParentSafeProgressPreview` shows clean empty state, no internal data: **fix applied** (see below)
- `/director/improvement` — "Working On" label polish, "No development focus set" empty text: correct
- `/director/players/active` — "Current Focus" label replacing "Working on:": correct

**Safety fix applied:**
- `src/app/parent/page.tsx`: Changed `isPreviewOnly={true}` → `isPreviewOnly={false}`. The `isPreviewOnly` flag shows a "Preview only" badge — correct for the director-side preview in `ParentGuidancePreviewPanel`, but wrong on the parent portal where the parent is viewing their own data. Parent portal should not display director-internal language. Empty state wording is unchanged.

**What was built:**
- `src/components/player/ParentSafeProgressPreview.tsx` — new parent-safe progress component. Accepts `doingWell`, `workingOn`, `currentFocus`, `nextStep` props. Shows clean empty state when all empty. Shows "Doing Well" / "Working On" / "Current Focus" / "Next Step" sections when data is present. No raw coach notes. No scores. No internal fields.

**No issues found in:**
- All "requires approval" and "query only" labels in command center
- All "preview only" / "not sent" labels on director-side panels
- All empty states on player and parent portal
- All privacy boundaries (no coach notes, no scores, no observations exposed to player/parent)
- Product/tool language scan: CLEAN across all Sprint 228 files

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed
- Product language scan (Sprint 228 files) — CLEAN

**TypeScript:** 0 errors.

### Files created
- `src/components/player/ParentSafeProgressPreview.tsx` — parent-safe progress display component for parent portal.

### Files modified
- `src/app/parent/page.tsx` — `ParentSafeProgressPreview` replaces old placeholder card; `isPreviewOnly={false}` corrected.
- `src/app/director/improvement/page.tsx` — "Working On" label and "No development focus set" empty text polish.
- `src/app/director/players/active/page.tsx` — "Current Focus" label polish.

---

## 2026-05-03 — Sprint 227: Conversational OS Documentation + Locked Principles V1

**Mode:** Docs only. No app code. No schema changes. No migrations.

**What was built:**
- `docs/conversational-os/conversational-os-master-plan.md` — new locked-principles document containing:
  - North star and core operating principle
  - Role-specific experiences (academy_director, head_coach, coach, player, parent)
  - Full command lifecycle diagram with intent type table
  - Approval model table (what requires approval)
  - Data safety model (role isolation + audit requirements)
  - Player Q&A model (safe data sources, answer intents)
  - Parent guidance model (safe fields, never-exposed fields)
  - Curriculum learning module model (fields, computation source)
  - Coach recap model (flow, outputs)
  - 10-item hard list of what must never happen automatically
  - Next build order (Sprints 229–238)
- `docs/CURRENT_BUILD_TARGET.md` — date + phase updated; Conversational OS Foundation section added marking Sprints 219–228 complete
- `docs/LOCKED_MODULES.md` — date updated; four new locked modules added (parentSafeResponseRules, learningModules, roleGuardrails, master plan); "usable but incomplete" table expanded; "not built yet" table corrected for routes that now exist
- `docs/KNOWN_LIMITATIONS.md` — date updated; new Conversational OS section added with six specific limitations (player portal empty state, parent portal empty state, no full chat UI, modules director-preview only, draft execution limited, parent guidance not yet sendable)

**QA results:**
- `qa-curriculum-seed-migration.mjs` — 38/38 passed
- `audit-curriculum-product-language.mjs` — PASS, zero forbidden references
- `qa-command-parser.mjs` — 24/24 passed
- Product language scan on Sprint 227 doc files — CLEAN

**TypeScript:** 0 errors.

### Files created
- `docs/conversational-os/conversational-os-master-plan.md` — conversational OS architecture + locked principles.

### Files modified
- `docs/CURRENT_BUILD_TARGET.md` — phase update + completed foundation section.
- `docs/LOCKED_MODULES.md` — new stable modules, corrected route table.
- `docs/KNOWN_LIMITATIONS.md` — new conversational OS limitations section.

---

## 2026-05-03 — Sprint 226: Learning Modules → Player Next Mission V1

**Mode:** Pure helper update + UI display. No DB writes. No AI calls. No migrations.

**What was built:**
- `playerProgressQa.ts` — updated `PlayerProgressQaAnswer` with `mini_challenge`, `reflection_question`, `try_this` fields (nullable); `PlayerProgressQaInput` now accepts optional `learningModuleHint`; `what_to_practice` answer populates these from the hint if available; graceful fallback if no hint
- `PlayerQaPreviewPanel.tsx` — now shows "Mission", "Try this", "This week's challenge", "Reflection" sections below the answer when the `what_to_practice` intent is active
- `page.tsx` (player profile) — computes `qaLearningModuleHint` from `buildModuleForLevelDomain()` using first coach language entry; passed to `PlayerQaPreviewPanel`
- `components/player/PlayerMissionPreview.tsx` — new component for player home page showing strength, mission, next win, current level (empty state if all null)
- `app/player/page.tsx` — uses `PlayerMissionPreview` replacing old placeholder card

**TypeScript:** 0 errors.

### Files created
- `src/components/player/PlayerMissionPreview.tsx` — player-facing mission display component.

### Files modified
- `src/lib/player/playerProgressQa.ts` — `QaLearningModuleHint` type, new answer fields, learning module integration.
- `src/app/director/players/[playerId]/PlayerQaPreviewPanel.tsx` — Mission/Try this/Reflection sections.
- `src/app/director/players/[playerId]/page.tsx` — import `buildModuleForLevelDomain`, compute `qaLearningModuleHint`, pass to panel.
- `src/app/player/page.tsx` — `PlayerMissionPreview` replacing placeholder.

---

## 2026-05-03 — Sprint 225: Coach Recap Director Review Preview V1

**Mode:** Read-only display improvement. No new tables. No migrations. No writes.

**What was built:**
- `StructuredDraftCard.tsx` — improved display for session recap proposed_actions:
  - **Source Recap** section: shows truncated raw coach voice recap in italics
  - **Session Focus** section: shows `session_actual_draft.actual_focus` tags + skipped items
  - **Will change if approved** panel: lists specific records flagged (attendance, observations, parent drafts, director summary)
  - **Will not change automatically** panel: explicitly calls out curriculum levels, parent communications, advancement decisions
- Uses `CheckCircle2`, `XCircle`, `FileText`, `Activity` icons to make sections visually distinct

**TypeScript:** 0 errors.

### Files modified
- `src/app/director/review/StructuredDraftCard.tsx` — added source recap, session focus, will/won't change panels.

---

## 2026-05-03 — Sprint 224: Command Center Draft Visibility V1

**Mode:** Read-only draft display. No new tables. No migrations. No writes.

**What was built:**
- `RecentDraftsPanel` — new sub-component in `CommandCenterClient.tsx`:
  - Shows recent command-created `proposed_actions` with `target_module = 'director_command'`
  - Displays: status badge (color-coded), intent label, command text, "what would happen", "will not do" list, created time
  - Empty state if no drafts yet
  - Link to `/director/review` from each pending draft
  - Link to review queue in header
- `page.tsx` — fetches `recentDrafts` from `proposed_actions` scoped by `academy_id`; passes to `CommandCenterClient`

**TypeScript:** 0 errors.

### Files modified
- `src/app/director/command-center/CommandCenterClient.tsx` — `RecentDraft` type, `RecentDraftsPanel` component, `recentDrafts` prop wired.
- `src/app/director/command-center/page.tsx` — query for recent command drafts passed to client.

---

## 2026-05-03 — Sprint 223: Parent Guidance Preview V1

**Mode:** Director-only preview. No emails. No parent portal. No writes. No AI.

**What was built:**
- `ParentGuidancePreviewPanel.tsx` — director-side client component on Notes tab of player profile:
  - "What your child is working on" — from curriculum level + coach language current_focus (sanitized)
  - "Next target" — shown if nextLevelName exists
  - "How to support this week" — from parent_support_tip or safe fallback
  - "What to say after practice" — 3 fixed suggestions
  - "What not to over-focus on" — 3 pressure-reducing reminders
  - "Pressure-reducing note" — personalized with first name
  - Badge: "Director preview — not sent"
  - Guardrail note: "No parent communication is sent from this preview."
- All text runs through `sanitizeParentFacingText()` from `parentSafeResponseRules.ts`.
- Uses `player.first_name`, `curriculum_level`, `curriculum_coach_language.current_focus` only — no raw coach notes.

**TypeScript:** 0 errors.

### Files created
- `src/app/director/players/[playerId]/ParentGuidancePreviewPanel.tsx` — parent guidance preview client component.

### Files modified
- `src/app/director/players/[playerId]/page.tsx` — import + panel added to Notes tab.

---

## 2026-05-03 — Sprint 222: Director Command Center Guardrail Integration V1

**Mode:** Additive UI + server-side guard. No new tables. No migrations.

**What was built:**
- `CommandCenterClient.tsx` — replaced single role check with rich guardrail block:
  - "Academy Director — allowed" badge via `getRoleDisplayName` + `canRoleUseIntent`
  - "Creates review draft only — requires your approval" badge for action intents
  - "Query only — no draft created" badge for read-only intents
  - Director boundary sentence via `getSafeResponseBoundary`
  - Added 2 new example commands: group draft + director note
- `submitDirectorCommandAction.ts` — added `canRoleUseIntent` server-side guardrail before draft creation. Returns error if role is blocked (e.g. unknown role attempts action).

**TypeScript:** 0 errors.

### Files modified
- `src/app/director/command-center/CommandCenterClient.tsx` — guardrail badges + new examples.
- `src/app/director/command-center/submitDirectorCommandAction.ts` — server-side role guardrail.

---

## 2026-05-03 — Sprint 221: Role-Aware Chat Guardrails V1

**Mode:** Pure helper + spec doc + light UI integration. No DB calls. No migrations.

**What was built:**
- `roleGuardrails.ts` — 6 exported functions governing role-based command/data access:
  - `canRoleUseIntent(role, intentType)` — boolean permission check
  - `intentRequiresApproval(intentType)` — true for create_session_draft, create_group_draft, record_director_note
  - `canExposeFieldToRole(role, fieldOrCategory)` — data access gate
  - `getBlockedReason(role, intentType)` — human-readable block message
  - `getSafeResponseBoundary(role)` — one-sentence boundary description per role
  - `getRoleDisplayName(role)` — display name for role
- `role-aware-chat-guardrails.md` — full spec: permission matrix, intent map, field exposure table, parent/player privacy rules, child-safety principles, audit log requirements.
- Light integration: `PlayerQaPreviewPanel` now shows player-safe boundary note via `getSafeResponseBoundary('player')`.

**TypeScript:** 0 errors.

### Files created
- `src/lib/commands/roleGuardrails.ts` — role permission helper.
- `docs/conversational-os/role-aware-chat-guardrails.md` — guardrail spec.

### Files modified
- `src/app/director/players/[playerId]/PlayerQaPreviewPanel.tsx` — added player-safe boundary note.

---

## 2026-05-03 — Sprint 220: Curriculum Learning Modules UI V1

**Mode:** Read-only director preview. No AI. No writes. No player/parent exposure.

**What was built:**
- `/director/curriculum/learning` page — server component fetches all levels, gates, drills, coach language; calls `buildLearningModulePreviews()`; passes modules to client.
- `LearningModulesClient.tsx` — client component: stage/domain/level filters, grouped module cards, expandable detail (why it matters, key idea, watch for, try this, mini challenge, reflection, parent tip, source labels).
- Link added from `/director/curriculum` footer to `/director/curriculum/learning`.
- Badge: "Learning Module Preview — read-only".
- Stats strip: module count, level count, domain count, gates, drills.

**TypeScript:** 0 errors.

### Files created
- `src/app/director/curriculum/learning/page.tsx` — server page: auth + data fetch + module build.
- `src/app/director/curriculum/learning/LearningModulesClient.tsx` — client: filters + expandable module cards.

### Files modified
- `src/app/director/curriculum/page.tsx` — added "Learning Modules" link in footer nav.

---

## 2026-05-03 — Sprint 219: Curriculum Learning Module Model V1

**Mode:** Pure helper + spec doc. No DB calls. No UI. No side effects.

**What was built:**
- `learningModules.ts` — deterministic module builder from curriculum data. Exports:
  - `LearningModuleDomain` — 8 domain types
  - `CurriculumLearningModule` — full module shape (16 fields)
  - `buildLearningModulePreviews(input)` — generates all modules for all level+domain combos
  - `buildModuleForLevelDomain(input)` — single module for one level+domain
  - `getLearningModuleSafetyNote(role)` — role-appropriate safety note text
- `curriculum-learning-module-model.md` — spec: module structure, domain table, language rules, generation rules.
- Modules generated from: `curriculum_levels` × `curriculum_coach_language` × `curriculum_gates` × `curriculum_drills`

**TypeScript:** 0 errors.

### Files created
- `src/lib/curriculum/learningModules.ts` — pure learning module builder helper.
- `docs/curriculum/curriculum-learning-module-model.md` — module structure spec.

---

## 2026-05-03 — Sprint 218: Player Progress Q&A Preview V1

**Mode:** Read-only director preview. No AI calls. No writes. No parent/player exposure.

**What was built:**
- `playerProgressQa.ts` — pure deterministic Q&A helper. Exports:
  - `PlayerProgressQuestionIntent` — 6 intents: `current_level`, `next_level`, `level_requirements`, `what_to_practice`, `level_meaning`, `unknown`
  - `parsePlayerProgressQuestion(question)` — keyword-based intent detection
  - `buildPlayerProgressAnswer(intent, input)` — deterministic answers from curriculum level, gates, drills, coach language
  - Answer shape: `question_intent`, `title`, `answer`, `bullets`, `next_mission`, `safety_note`, `source_labels`, `blocked_reason`
- `PlayerQaPreviewPanel.tsx` — director-only client component added to the Skill Path tab. Features:
  - 4 sample question buttons: "What level am I?", "What do I need to do next?", "How do I move up?", "What should I practice?"
  - Custom question input
  - Answer card with intent label, bullets, next mission, source labels
  - "Director preview — read-only" badge
  - Guardrail note: "Uses curriculum level, gates, drills, and coach language only. Internal notes are not shown."
- `page.tsx` updated with two new sequential queries: `curriculum_drills` (top 5 by level_min_id) and `curriculum_coach_language` (all domains for current level).

**Safety:** Read-only only. No mutations. No external AI. No parent/player portal exposure. Player portal remains a stub.

**Supported questions:** current_level · next_level · level_requirements · what_to_practice · level_meaning · unknown fallback

**QA scripts:** qa-curriculum-seed-migration.mjs (38/38) · audit-curriculum-product-language.mjs (PASS) · qa-command-parser.mjs (24/24)

**Product language:** CLEAN — no Swinget, SwingCheck, The Angle, or [PROPOSED:] in sprint files.

**TypeScript:** 0 errors.

### Files created
- `src/lib/player/playerProgressQa.ts` — pure Q&A helper: intent detection + deterministic answer builder.
- `src/app/director/players/[playerId]/PlayerQaPreviewPanel.tsx` — client component: interactive Q&A preview panel with director badge.

### Files modified
- `src/app/director/players/[playerId]/page.tsx` — added drills + coach language queries; `PlayerQaPreviewPanel` added to Skill Path tab.

---

## 2026-05-03 — Sprint 217: Parent-Safe Response Rules V1

**Mode:** New utility module + spec doc. No DB calls, no UI, no side effects.

**What was built:**
- `parentSafeResponseRules.ts` — four exported functions governing parent-facing communication:
  - `canShowParentField(fieldName)` — runtime gate against a field allowlist (7 safe fields)
  - `sanitizeParentFacingText(text)` — replaces 11 harsh/clinical phrases + strips internal annotations
  - `getParentSafeToneGuidelines()` — 10 guidelines for coach-facing UI copy and future AI prompts
  - `buildParentSupportGuidanceDraft(params)` — constructs parent-safe session summary (handles absent/late/present with skill focus + sanitized observation)
- `parent-safe-response-rules.md` — full spec: field allowlist, sanitization table, tone rules, draft examples, integration points.

**Safety:** No communications sent. No parent portal changes. All output requires director/coach review before use.

**TypeScript:** 0 errors.

### Files created
- `src/lib/communications/parentSafeResponseRules.ts` — parent-safe response utility module.
- `docs/conversational-os/parent-safe-response-rules.md` — field allowlist, sanitization rules, tone guidelines, integration map.

---

## 2026-05-03 — Sprint 216: Coach Recap Command Center V1

**Mode:** Rule-based structuring. No external AI. All results require director review.

**What was built:**
- `structureCoachRecapAction` — server action on coach session page. Authenticates coach, fetches session roster, runs deterministic keyword structuring (absence/late/skill phrase detection per player), creates `voice_commands` + `proposed_actions` (target_module='session_recap_structuring', status='pending_review'), marks voice_note as 'structured'.
- `CoachRecapCommandPanel` — client component replacing `SessionRecapPanel`. Shows real-time client-side signal preview as coach types (absence/late/skill keywords). "Save Recap" → returns `voiceNoteId`. "Structure Now" button appears after save → calls structuring action → shows attendance mentions, observation count, link to /director/review.
- `saveSessionRecapAction` updated to return `voiceNoteId` via `.select('id').single()`.

**Safety:** structureCoachRecapAction checks `processing_status === 'structured'` to prevent double-structuring. All structured drafts require director approval before any records change. No player profiles, attendance records, or priorities were modified.

**TypeScript:** 0 errors.

### Files created
- `src/app/coach/sessions/[sessionId]/structureCoachRecapAction.ts` — server action: roster build → rule-based structuring → voice_commands + proposed_actions.
- `src/app/coach/sessions/[sessionId]/CoachRecapCommandPanel.tsx` — client component: real-time signal preview + save + structure flow.

### Files modified
- `src/app/coach/sessions/[sessionId]/actions.ts` — `SaveSessionRecapResult` now includes `voiceNoteId`; `saveSessionRecapAction` returns it.
- `src/app/coach/sessions/[sessionId]/page.tsx` — replaced `SessionRecapPanel` with `CoachRecapCommandPanel`; imports `structureCoachRecapAction`.

---

## 2026-05-03 — Sprint 215: Director Commands to Review Drafts V1

**Mode:** Server action. Creates proposed_actions from parsed director commands. No auto-execution.

**What was built:**
- `submitDirectorCommandAction` — parses command text using `parseAcademyCommand`, then for action intents creates `voice_commands` + `proposed_actions` rows (status: pending_review). Query-only intents return parsed result only with no DB write. Role-checked: director/head_coach only.
- `CommandCenterClient` wires up "Create Review Draft" button for action intents. Shows draft created confirmation + link to /director/review.

**Safety:** All drafts: status=pending_review. Nothing executes until director approves from /director/review. Query intents write nothing.

**TypeScript:** 0 errors.

### Files created/modified
- `src/app/director/command-center/submitDirectorCommandAction.ts` — server action: parse → voice_commands → proposed_actions.

---

## 2026-05-03 — Sprint 214: Command Intent Parser V1

**Mode:** New library module + QA script. No DB calls. No side effects.

**What was built:**
- `src/lib/commands/parseAcademyCommand.ts` — deterministic regex-based parser supporting 8 intent types: show_players_missing_curriculum_level, show_curriculum_gap_suggestions, show_advancement_eligible, create_session_draft, create_group_draft, record_director_note, ask_curriculum_level_requirements, summarize_reassessment_pipeline, unknown.
- Returns: intent_type, confidence (high/medium/low), extracted_entities (level, focus, note_text), missing_information, suggested_next_step, requires_confirmation, role_required, will_not_do.
- Curriculum level extraction via regex: matches "Orange 2", "Green 1", "High Performance 3" patterns.
- `scripts/qa-command-parser.mjs` — 24 test cases, all passing.

**TypeScript:** 0 errors. QA: 24/24 passed.

### Files created
- `src/lib/commands/parseAcademyCommand.ts` — deterministic command intent parser.
- `scripts/qa-command-parser.mjs` — 24-case QA script.

---

## 2026-05-03 — Sprint 213: Director Command Center UI V1

**Mode:** New route + UI. Read-only except for parse/draft actions.

**What was built:**
- `/director/command-center` — premium dark UI: command input textarea (⌘↵ to parse), example commands list, recent command history from voice_commands, available curriculum levels reference strip, pending draft count link to review queue.
- `CommandCenterClient` — client component: parse command → show intent/confidence/entities/what-would-happen/will-not-do; "Create Review Draft" button for action intents; confirmation link to review queue.
- Sidebar nav: "Command Center" added to Intelligence section.
- Page header: operating principle strip "Voice creates → UI confirms → Database structures → System executes."

**TypeScript:** 0 errors.

### Files created
- `src/app/director/command-center/page.tsx` — Server component; fetches recent commands, curriculum levels.
- `src/app/director/command-center/CommandCenterClient.tsx` — Client UI for command input and intent preview.

### Files modified
- `src/components/nav/SidebarNav.tsx` — Added Command Center to Intelligence section.

---

## 2026-05-03 — Sprint 212: Conversational Command Architecture Audit

**Mode:** Audit + documentation. No code changes.

**What was documented:**
- Full map of existing command-like systems: voice notes + structuring, AI suggestions, proposed_actions lifecycle, director review queue.
- proposed_actions schema: action_type DB enum, target_module string, voice_command_id FK requirement.
- Role/membership patterns: director/head_coach write paths, coach session paths, player/parent stubs.
- Parent/player portal current state (both stub-only).
- Safe V1 command intents for the command center (8 intents).
- Blocked command intents (6 categories).
- No-code next sprint plan for Sprints 213–221.
- Architecture principle confirmation: voice/text creates → proposed_actions/drafts → director approves.

**TypeScript:** 0 errors.

### Files created
- `docs/conversational-os/conversational-command-architecture-audit.md` — Full architecture audit for conversational OS foundation.

---

## 2026-05-03 — Recovery Sprint 206: Skill Path Tab Content V1

**Mode:** Tab content reorganization. No schema changes. No migrations. No mutations.

**What was built:**
- Moved `PlayerProgressionRequirements` (advancement score thresholds), `PlayerRequirementProgressReadOnly` (requirement progress with evidence), `EvidenceRequirementDrafts`, and `EvidenceRequirementDraftButton` from the Notes tab into the Skill Path tab where they belong.
- `skillPathSlot` declaration moved to after all required data fetches so all variables (`requirementProgressRows`, `evidenceByProgressId`, `confirmProgressAction`, `createEvidenceDraftAction`, `progressionScores`) are in scope.
- Skill Path tab now shows the full director view: level picker → version source → advancement → curriculum grid → gate requirements with evidence → advancement thresholds → requirement progress → evidence linking → review-based guardrail.
- `DevelopmentSummarySection` labels polished: "Current Strengths" → "Doing Well", "Things to Work On" → "Working On", "Development Focus" → "Current Focus", "Coach Summary" → "Coach Insight", "Student-Facing Preview" → "Player Preview", "Visible to student" → "Visible to player".
- Notes tab cleaned: removed curriculum-specific progression content that now lives in Skill Path tab; retains development summary, AI draft, observations feed, priorities, voice, evidence timeline.

**Safety:** UI reorganization only. No new queries. No new mutations. No schema changes.

**TypeScript:** 0 errors. QA: 38/38. Product-language: PASS.

### Files modified
- `src/app/director/players/[playerId]/page.tsx` — skillPathSlot reorganized with full content; moved from pre-fetch position to post-fetch position.
- `src/components/player/DevelopmentSummarySection.tsx` — Label polishing for director clarity.

---

## 2026-05-03 — Recovery Sprint 205: Player Profile Tab Structure V1

**Mode:** Audit + documentation. No code changes required.

**Audit result:**
- `PlayerProfileTabs` component (`_components/PlayerProfileTabs.tsx`) is complete: 5 tabs — Overview, Skill Path, Competition, Fitness / Load, Notes.
- All tabs use `<TabsList scrollable>` for mobile-safe horizontal scrolling.
- Each tab has content: Overview (player info, curriculum card, level progress, domain summary), Skill Path (level picker, assignment, advancement, progress grid, gates), Competition (premium empty state), Fitness (empty state + fitness homework recommendation), Notes (full coach notes, voice, observations, priorities, evidence).
- Tab content is injected via server component slots — no client-side coupling.
- Sprint 205 was fully implemented in earlier sprints (tab component, content, mobile support). Documentation gap only.

**TypeScript:** 0 errors (no code changes).

### Files audited (no changes)
- `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx`
- `src/app/director/players/[playerId]/page.tsx`

---

## 2026-05-03 — Recovery Sprint 207: Session Template Curriculum Level Picker V1

**Mode:** UI wiring. No schema changes. No migrations. No auto-changes to existing templates.

**What was built:**
- Template detail page (`fitness/templates/[templateId]/page.tsx`) now fetches all 15 `curriculum_levels` and renders `CurriculumLevelSelector` for every template (fitness and class). Directors can assign a level, which saves to `templates.curriculum_level_id` via the existing `setCurriculumLevelAction`.
- Helper copy: "Assign a level to power session curriculum context and coach cues." / "Sessions generated from this template will show curriculum context for [level]."
- Empty state shown when no curriculum levels are seeded.
- Class templates list (`class-templates/page.tsx`) now shows a lime curriculum level badge when a template has a level assigned.
- `rawDb` cast hoisted to function scope in template detail page (was scoped inside an `if` block).

**Why this matters:** Director session pages already read `template.curriculum_level_id` and pass it to `SessionCurriculumContextPanel`. This sprint closes the gap — directors can now set the level without touching the DB directly.

**Safety:** Director-explicit action only. No auto-changes. No auto-population of drills. The column exists in DB (migration 045); generated types do not reflect it — rawDb used throughout.

**TypeScript:** 0 errors. QA: 38/38. Product-language: PASS.

### Files modified
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added curriculum level fetch, rendered CurriculumLevelSelector, hoisted rawDb.
- `src/app/director/class-templates/page.tsx` — Added rawDb fetch with curriculum_level_id; shows level badge in template list rows.

---

## 2026-05-03 — Sprint 211: Curriculum Gate Evidence Tracking V1

**Mode:** New components + server action. No schema changes. No migrations. No auto-advancement.

**What was built:**
- `GateEvidenceButton.tsx` — director-only client component. "Record evidence" inline form per gate row. Submits to `proposed_actions` for review. Shows success/error state.
- `recordGateEvidenceAction.ts` — server action scoped to director/head_coach. Inserts `proposed_actions` with `action_type = 'other'` and payload `{ subtype: 'curriculum_gate_observation', gate_id, gate_criterion, evidence_text, player_id }`. Requires approval.
- `PlayerLevelRequirementsCard.tsx` — added optional `gateActions?: Record<string, ReactNode>` prop. Renders action slot below each gate row. Removed "coming next" placeholder.
- Player profile page wires `GateEvidenceButton` into each gate row via `gateActions` map.

**Safety:** Evidence goes to `proposed_actions` with `requires_approval = true`. Nothing changes until director approves. No auto-advancement triggered.

**TypeScript:** 0 errors.

### Files created
- `src/app/director/players/[playerId]/GateEvidenceButton.tsx` — Client component for inline evidence recording.
- `src/app/director/players/[playerId]/recordGateEvidenceAction.ts` — Server action for evidence draft creation.

### Files modified
- `src/components/player/PlayerLevelRequirementsCard.tsx` — Added `gateActions` prop; removed placeholder text.
- `src/app/director/players/[playerId]/page.tsx` — Imports GateEvidenceButton; passes gateActions map to requirements card.

---

## 2026-05-03 — Sprint 210: Coach Workspace Live Session Curriculum Context

**Mode:** UI enrichment. No schema changes. No migrations. Read-only curriculum data.

**What was built:**
- Coach session page now fetches `player_curriculum_states` + `curriculum_levels` for all roster players.
- `RosterPlayer` interface extended with `curriculumLevelName` and `curriculumStage`.
- Attendance roster in `CoachSessionExecutionClient` shows each player's curriculum level in stage color below their name.
- Stage colors: red (Red Foundation), amber (Orange Development), green (Green Performance), yellow (Yellow Competitive), violet (High Performance).

**Safety:** Read-only fetch. No mutations. Academy-scoped query.

**TypeScript:** 0 errors.

### Files changed
- `src/app/coach/sessions/[sessionId]/page.tsx` — Added curriculum state fetch; extended RosterPlayer interface.
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Added STAGE_TEXT map; renders curriculum level below player name.

---

## 2026-05-03 — Sprint 209: Placement Engine V1

**Mode:** New page + server actions. No schema changes. No migrations.

**What was built:**
- `/director/placement` — new director-only page listing all pending-placement players.
- `PlacementEngineClient.tsx` — client UI: per-player card with create-draft form (group + track + optional level + notes); review/approve existing draft; activate approved player.
- `placementDraftAction.ts` — three server actions scoped to director/head_coach: `createPlacementDraftAction` (inserts `placement_recommendations`), `approvePlacementDraftAction` (updates status to 'approved'), `activatePlayerAction` (calls `finalize_player_placement` RPC).
- Deterministic track suggestion: age < 16 → Skill, age 16+ → Competition (director can override).
- Status summary chips: "needs draft", "awaiting approval", "ready to activate".

**Safety:** `finalize_player_placement()` called only after director explicitly approves. No auto-activation. All actions validate director/head_coach membership before executing.

**TypeScript:** 0 errors.

### Files created
- `src/app/director/placement/page.tsx` — Server component; fetches pending players, groups, levels, existing recs.
- `src/app/director/placement/PlacementEngineClient.tsx` — Client UI for the full placement flow.
- `src/app/director/placement/placementDraftAction.ts` — Server actions: create, approve, activate.

---

## 2026-05-03 — Sprint 208: Director Dashboard Curriculum Intelligence

**Mode:** UI + data fetch. No schema changes. No migrations. No mutations.

**What was built:**
- Curriculum coverage section on director dashboard: players with assigned level, players missing level, curriculum gap suggestion count.
- Data fetched from `player_curriculum_states` (count per academy) and `academy_suggestions` (filtered by `suggestion_type = 'curriculum_gap'` and `status = 'pending'`).
- Missing-level count shown in orange when > 0; gap suggestions link to `/director/ai-suggestions`; player counts link to `/director/players`.

**Safety:** Read-only display. No mutations. No auto-promotion.

**TypeScript:** 0 errors.

### Files changed
- `src/app/director/page.tsx` — Added curriculum coverage data fetch and intelligence section UI.

---

## 2026-05-03 — Sprint 204: Player Curriculum Level Assignment UI

**Mode:** UI + server action. No schema changes. No migrations. No auto-promotion.

**What was built:**
- `setCurriculumLevelAction.ts` — new `'use server'` action scoped to director/head_coach; calls existing `assign_player_curriculum_state` RPC with explicit `p_level_id`; validates membership and level existence before write.
- `CurriculumLevelPickerCard.tsx` — select all 15 curriculum levels grouped by stage; Save button only enabled when selection changed; shows level preview before save; success/error state; guardrail copy: "This does not auto-promote the player."
- `page.tsx` — fetches all 15 `curriculum_levels` on load; renders `CurriculumLevelPickerCard` at top of Skill Path tab.

**Safety:** Explicit director action only. No automatic level change. No parent/player notification. No AI.

**TypeScript:** 0 errors. QA: 38/38. Product-language: PASS.

### Files changed
- `src/app/director/players/[playerId]/setCurriculumLevelAction.ts` — New server action for curriculum level assignment.
- `src/app/director/players/[playerId]/CurriculumLevelPickerCard.tsx` — New UI component for level selection.
- `src/app/director/players/[playerId]/page.tsx` — Fetches levels list; adds picker to Skill Path tab.

---

## 2026-05-03 — Sprint 203: Player Profile Responsive Layout

**Mode:** UI-only. No data changes.

**What was improved:**
- Player profile outer container: `p-6` → `p-4 sm:p-6` for smaller mobile padding.
- Added `max-w-5xl` cap to prevent runaway width on large monitors.
- Back link to `/director/players` already present in `PlayerProfileHeader`.
- Responsive `grid-cols-1 xl:grid-cols-[1fr_240px]` already in place for overview tab.

**TypeScript:** 0 errors.

### Files changed
- `src/app/director/players/[playerId]/page.tsx` — Responsive padding and max-width.

---

## 2026-05-03 — Sprint 202: Players List Curriculum Enrichment

**Mode:** UI + server data. No schema changes. No migrations.

**What was built:**
- `PlayersPage`: fetches `player_curriculum_states` + `curriculum_levels` for all active players; builds `curriculumMap` record; shows "N without curriculum level" badge in header when any players are missing.
- `PlayersDirectoryClient`: accepts `curriculumMap` prop; shows new-curriculum stage badge + level name (from migration 052 tables) when available; falls back to old `LevelBadge` from `v_player_summary`; shows "Ready to advance" badge from new `advancement_eligible` field.

**TypeScript:** 0 errors. QA: 38/38. Product-language: PASS.

### Files changed
- `src/app/director/players/page.tsx` — Added curriculum state fetch and `curriculumMap` prop.
- `src/app/director/players/_components/PlayersDirectoryClient.tsx` — New curriculum badge + `curriculumMap` prop.

---

## 2026-05-03 — Sprint 201: Curriculum Integration QA + Polish

**Mode:** Polish + docs. No schema changes. No new migrations.

**QA results:**
- `node scripts/qa-curriculum-seed-migration.mjs` — 38/38 checks passed.
- `node scripts/audit-curriculum-product-language.mjs` — PASS. Zero product/tool references. Allowed tennis phrases intact.
- `npx tsc --noEmit` — 0 errors.

**What was fixed:**
- `CurriculumExplorer`: Level list and detail panel now stack on mobile (`flex-col md:flex-row`). Left column width responsive (`w-full md:w-56`).
- `CurriculumExplorer`: `shadow-lime` (undefined class) replaced with `shadow-[0_0_8px_rgba(200,255,0,0.15)]` for selected level card glow.

**Docs updated:**
- `docs/KNOWN_LIMITATIONS.md` — Added curriculum integration section covering: level assignment has no UI, session context requires template level, drill `procedure` field not fetched, "Use in session" disabled, explorer is Director-only.

### Files changed
- `src/components/curriculum/CurriculumExplorer.tsx` — Responsive two-panel layout; fixed shadow class.
- `docs/KNOWN_LIMITATIONS.md` — Added curriculum integration limitations section.

---

## 2026-05-03 — Sprint 200: Director Curriculum Demo Flow V1

**Mode:** UI-only. No schema changes. No new migrations. No fake data inserted.

**What was built:**
- `CurriculumDemoFlowPanel` — new collapsible component on `/director/curriculum` with a 7-step demo walk-through: choose a level → read gates → browse drills → read coach language → open a player → see level requirements → open a session with curriculum context. Each step links to the relevant page. Collapsed by default.
- No fake data inserted — all CTAs link to real pages; explorer uses live seed data.
- Product-language audit: CLEAN.

**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/CurriculumDemoFlowPanel.tsx` — New. Collapsible 7-step demo flow panel.
- `src/app/director/curriculum/page.tsx` — Added `CurriculumDemoFlowPanel` above the "How it works" section.

---

## 2026-05-03 — Sprint 199: AI Suggestions From Curriculum Gaps V1

**Mode:** Logic + UI. No schema changes. No new migrations. No AI API calls. No npm installs.

**Audit:** Existing `academy_suggestions` table + `SuggestionCard` component + `generateAcademySuggestionsAction` already handles suggestion lifecycle with accept/deny/defer. Suggestion types include `curriculum_gap`.

**What was added to `generateAcademySuggestions.ts`:**
- `PlayerCurriculumStateInput` interface.
- `buildNoCurriculumAssignmentSuggestions()` — generates `curriculum_gap` suggestions for active players with no curriculum level assigned.
- `buildCurriculumProgressStaleSuggestions()` — generates `curriculum_gap` suggestions for players at a level for ≥60 days without review (high priority at ≥90 days).
- `AcademySuggestionDraftInputs` extended with optional `playerCurriculumStates`.
- `buildAcademySuggestionDrafts()` updated to call both new generators.

**What was added to `suggestionActions.ts`:**
- Fetches `player_curriculum_states` (current_level_id, updated_at) for all active players.
- Fetches curriculum level names for enrichment.
- Passes `playerCurriculumStates` to `buildAcademySuggestionDrafts`.
- Duplicate-prevention via existing existingSet is preserved.

**Safety:** No auto-writes. No auto-promotions. No AI calls. Suggestions are pending_review; directors accept/deny via existing review UI.

**TypeScript result:** 0 errors.

### Files changed
- `src/lib/suggestions/generateAcademySuggestions.ts` — Added curriculum gap generators and input type.
- `src/app/director/ai-suggestions/suggestionActions.ts` — Added curriculum state fetch and pass to generator.

---

## 2026-05-03 — Sprint 198: Session Planning Curriculum Context V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Audit:** Session page at `/director/sessions/[sessionId]` already had a "Curriculum Focus" card showing level name + stage + academy overrides. It already fetches `template.curriculum_level_id`.

**What was added:**
- `SessionCurriculumContextPanel` — new component showing top domains, active gates (up to 4), recommended drills (up to 3), coach language cues (up to 3 domains). "Full explorer" link to /director/curriculum. Read-only. Internal coach context only.
- `SessionNoCurriculumContextPanel` — graceful empty state when session has no curriculum level assigned.
- Session page: queries added for gates/drills/coach language for the session's curriculum level (using rawDb pattern). Both panels rendered in the session view — context panel below existing curriculum focus card; no-context panel when template has no level.

**Safety:** Read-only. No mutations. No template changes. No auto-generation.

**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/SessionCurriculumContextPanel.tsx` — New. Session-scoped curriculum context panel.
- `src/app/director/sessions/[sessionId]/page.tsx` — Added extended curriculum data queries and panel renders.

---

## 2026-05-03 — Sprint 197: Player Level Requirements Read-Only View V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**What was built:**
- `PlayerLevelRequirementsCard` — new component showing gate-based requirements to advance from current Skill Track level. Gates grouped by domain; each row shows criterion, threshold (lime), evaluator, evidence window. Evidence tracking placeholder at bottom. Empty states for no curriculum / no gates.
- Player profile Skill Path tab: `PlayerLevelRequirementsCard` added after `CurriculumProgressGrid`.
- Player profile page: query added for gates where `from_level_id = curriculumSummary.current_level_id`, `is_active = true`, ordered by sort_order.

**Safety:** Read-only. No gate completion tracking. No auto-promotions. No fabricated progress.

**TypeScript result:** 0 errors.

### Files changed
- `src/components/player/PlayerLevelRequirementsCard.tsx` — New. Gate-based requirements to advance.
- `src/app/director/players/[playerId]/page.tsx` — Added gates query and `PlayerLevelRequirementsCard` render in Skill Path tab.

---

## 2026-05-03 — Sprint 196: Player Profile Curriculum Connection V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**What was built:**
- `PlayerCurriculumCard` — new component showing Skill Track level, Competition Track level (from `player_curriculum_states.competition_track_level_id`), Fitness phase (from `player_curriculum_states.fitness_path_phase`), next target level, and "Explore" link to `/director/curriculum`. Premium empty state when no curriculum assigned.
- Player profile Overview tab sidebar: `PlayerCurriculumCard` added above existing `LevelProgressCard`.
- Player profile page: added sequential queries for `competition_track_level_id` and `fitness_path_phase` from `player_curriculum_states` using `rawDb` pattern; fetches competition track level name from `curriculum_levels`.

**Safety:** Read-only. No level assignment. No data writes. RLS enforced via academy_id + player_id scoping. rawDb cast used only for cross-table joins where TS2589 would occur.

**TypeScript result:** 0 errors.

### Files changed
- `src/components/player/PlayerCurriculumCard.tsx` — New. Curriculum track summary card.
- `src/app/director/players/[playerId]/page.tsx` — Added competition/fitness curriculum state query and `PlayerCurriculumCard` render in Overview sidebar.

---

## 2026-05-03 — Sprint 195: Coach Language Layer UX V1

**Mode:** UI-only. No schema changes. No new migrations. No AI calls.

**Changes to `CurriculumLevelDetailPanel.tsx`:**
- CoachLanguageTab: added three-view toggle — Coach View / Parent-Safe Draft / Player-Friendly Draft.
- Coach View: unchanged full language (doing_well / working_on / current_focus / next_step).
- Parent-Safe Draft: deterministic subset — "What's going well" (doing_well) + "What we're working toward" (next_step). Orange draft banner. Not published.
- Player-Friendly Draft: deterministic subset — "Your mission this level" (current_focus). Blue draft banner. Not published.
- All views read-only, clearly marked as draft/preview. Zero AI involvement.

**Product-language audit:** CLEAN.
**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — CoachLanguageTab upgraded with three-view toggle and draft preview banners.

---

## 2026-05-03 — Sprint 194: Curriculum Drill/Game Library UX V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Changes to `CurriculumLevelDetailPanel.tsx`:**
- DrillsTab: added session_block filter (in addition to existing domain filter) using shared `FilterPills` helper.
- DrillRow: shows full session_block name (not truncated 3-char code), all existing detail fields.
- "Use in session" disabled placeholder button on each drill row — tooltip indicates session builder is coming.
- Live count display: "Showing X of Y drills" with empty-filter messaging.
- No backend changes — `curriculumExplorer.ts` locked per AI_BACKEND_RULES.md #9.

**Product-language audit:** CLEAN.
**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — DrillRow and DrillsTab upgraded with session_block filter, full block label, "Use in session" placeholder.

---

## 2026-05-03 — Sprint 193: Curriculum Gates UX V1

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Changes to `CurriculumLevelDetailPanel.tsx`:**
- Fixed gate_type badge: now handles actual DB values — OBSERVATION, RESULT, RATE, COUNT, CHECKLIST, TIME_WINDOW — each with distinct color.
- Added `GateBadge` helper component for reusable pill styling.
- Evaluator and cadence now render as visual badge pills in each gate row.
- Threshold shown with lime monospace font for visual hierarchy.
- Gates tab header upgraded: "Level-up requirements" title, gate count, domain count, final exit gate indicator.
- "Evidence tracking coming" placeholder framing per sprint spec.

**Product-language audit:** CLEAN.
**TypeScript result:** 0 errors.

### Files changed
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — Gate type badge map, evaluator/cadence badges, gates tab header upgrade.

---

## 2026-05-03 — Sprint 192: Curriculum Explorer Full Level Detail UX

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Route:** `/director/curriculum` — expanded level detail panel within existing explorer.

**Changes:**
- `CurriculumLevelDetailPanel.tsx` rewritten as `'use client'` component with full tabbed detail view.
- Four tabs per selected level: Gates | Drills | Coach Language | Fitness & Comp.
- Gates tab: all gates grouped by domain, expandable rows showing threshold/evaluator/cadence/evidence_window/recording_method/notes. HP3 final exit gate badge. Level-up requirements framing.
- Drills tab: domain filter pills, all drills with expandable rows showing setup/coaching cues/progressions/success_criteria.
- Coach Language tab: all domains, all four fields (doing well / working on / current focus / next step) in 2-col grid.
- Fitness & Comp tab: detailed Volume, Fitness, Competition cards with all available fields.
- Empty states per section when data is absent.
- Product-language audit: CLEAN.

**TypeScript result:** 0 errors.

**QA:** 38/38 curriculum seed checks pass. Product-language audit: PASS.

### Files changed
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — Rewritten. Full tabbed detail panel replacing the previous preview-only layout.

---

## 2026-05-02 — Sprint 191: Build premium curriculum explorer

**Mode:** UI-only. No schema changes. No new migrations. No npm installs.

**Route:** `/director/curriculum` — rewrites the existing director curriculum page.

**New UI:** Premium Curriculum Explorer with:
- Summary bar: 15 levels, 57 gates, 152 drills, 120 coach language entries, product-clean badge
- Stage navigation tabs: Red / Orange / Green / Yellow / HP with level counts
- Level card list (left panel): stage-color accented, gates + drills count per level, lime glow on selection
- Level detail panel (right panel): exit gates by domain, drills preview, coach language sample, competition/fitness/volume snapshot
- Graceful degradation when migration 052 tables are not yet applied

**Data loading:** All curriculum tables loaded server-side via `getCurriculumExplorerData()`. Client component manages selection state only. No direct DB queries in client code.

**Existing features preserved:** `AcademyCurriculumVersionCard` + `VoiceOverrideInputPanel` moved to secondary section below the explorer.

**TypeScript result:** 0 errors.

**QA:** 38/38 curriculum seed checks pass. Product-language audit: PASS.

### Files changed
- `src/lib/backend/curriculumExplorer.ts` — New. Types + `getCurriculumExplorerData()` for migration 052 tables via rawDb pattern.
- `src/components/curriculum/CurriculumExplorer.tsx` — New. Client component with stage nav and level selection state.
- `src/components/curriculum/CurriculumLevelDetailPanel.tsx` — New. Detail panel: gates, drills, coach language, competition/fitness/volume.
- `src/app/director/curriculum/page.tsx` — Rewritten. Server component loads explorer data; mounts CurriculumExplorer; keeps existing version card and voice panel.

---

## 2026-05-03 — Sprint 190 Follow-up: Remove product language from curriculum seed data

**Mode:** Follow-up hotfix. No UI. No schema changes. No new tables. No npm installs.

**Migrations regenerated:** `supabase/migrations/053_curriculum_seed.sql`

**Product-language audit result:** CLEAN — all 10 seed sections pass `scripts/audit-curriculum-product-language.mjs`. Zero Swinget / Swing Check / SwingCheck / The Angle™ / `[PROPOSED:]` markers in any data field. Allowed tennis phrase `'First-volley closing the angle.'` intact.

**`[PROPOSED:]` handling:** Markers stripped from all fields; planning content retained. Applies to `curriculum_archetypes.primary_curriculum_protection` and `curriculum_failure_modes.required_response`.

**Swing Check in failure_modes:** Replaced with generic descriptions (`a standardized movement assessment`, `a video assessment protocol`).

**TypeScript result:** 0 errors.

**QA:** 38/38 checks pass. Audit script: PASS.

**Supabase rerun required:** Migration 053 uses `ON CONFLICT DO NOTHING` — already-inserted rows won't update. To apply the cleaned data, truncate `curriculum_archetypes` and `curriculum_failure_modes` before rerunning, or run targeted UPDATEs. See QA report §12b for exact SQL.

### Files changed
- `scripts/generate-curriculum-seed-sql.py` — Added `strip_product_refs()` helper; applied to all text fields in all section generators; simplified gate notes stripping to use same helper.
- `supabase/migrations/053_curriculum_seed.sql` — Regenerated; [PROPOSED:] and product names stripped from all data fields.
- `scripts/audit-curriculum-product-language.mjs` — New. Dedicated product-language audit script covering all 10 seed sections with allowed-phrase exceptions.
- `scripts/qa-curriculum-seed-migration.mjs` — Updated: [PROPOSED:] check now requires zero across all data lines.
- `docs/curriculum/curriculum-seed-import-qa.md` — Updated: sections 8, 12b, 13 reflect follow-up hotfix.

---

## 2026-05-03 — Sprint 190 Hotfix: Fix curriculum seed drill duration handling

**Mode:** Hotfix. No UI. No schema changes. No new tables.

**Migrations regenerated:** `supabase/migrations/053_curriculum_seed.sql`

**Root cause:** `DRILL_YELLOW2_COM_061` had `duration_minutes = 0`, violating migration 052 CHECK constraint `curriculum_drills_duration_minutes_check`. Generator coerced source value `0` to SQL `0` instead of `NULL`.

**Fix:** `scripts/generate-curriculum-seed-sql.py` — duration coercion changed so any value `< 1` (including 0 and blank) produces SQL `NULL`.

**Result:** 7 drills now have `duration_minutes = NULL`; 145 have a valid positive value; 0 have `duration_minutes = 0`. QA script: 38/38 checks pass. TypeScript: 0 errors.

---

## 2026-05-03 — Sprint 190: Curriculum Seed QA + Import Validation

**Mode:** QA only. No UI built. No app routes modified. No migrations created. No schema changes. No npm installs.

**Migrations created:** None.

**TypeScript result:** `npx tsc --noEmit` — 0 errors

**QA script:** `scripts/qa-curriculum-seed-migration.mjs` — 38 static checks, 0 failures.

**Live migration apply:** Could not execute — Supabase CLI not installed, no local Supabase instance, migrations 052 and 053 not yet applied to remote. Static QA substituted.

**Product-tool leakage result:** CLEAN in all core data fields. No Swinget, SwingCheck, Swing Check app, or The Angle™ references. `[PROPOSED:]` markers confirmed contained to archetypes and failure_modes sections only.

**Final readiness decision:** PASS WITH LIMITATIONS — static QA passes; live apply pending manual execution.

### Sprint 190 — Curriculum Seed QA V1
- Created `scripts/qa-curriculum-seed-migration.mjs` — Static QA script for migration 053. Parses SQL file and runs 38 checks: row counts per table, idempotency, HP3 exit gate, stage enum validity, product-tool leakage in core fields, `[PROPOSED:]` marker containment, all 15 display names, deferred table confirmation.
- Created `docs/curriculum/curriculum-seed-import-qa.md` — Full QA report. Documents static pass, live apply limitation, manual apply commands, row count SQL for post-apply verification, domain distribution audit, leakage analysis, and next sprint recommendation.

**Static row counts verified:**
- `curriculum_levels` UPDATEs: 15
- `curriculum_archetypes`: 8
- `curriculum_failure_modes`: 14
- `curriculum_gates`: 57
- `curriculum_coach_language`: 120
- `curriculum_drills`: 152 (full)
- `curriculum_drill_tags`: 614
- `curriculum_competition_track`: 15
- `curriculum_fitness_guidance`: 15
- `curriculum_volume_guidance`: 15
- `drill_gate_mappings`: 0 (intentionally empty)

---

## 2026-05-02 — Sprint 189: Curriculum Seed Migration

**Mode:** Migration only. No UI built. No app routes modified. No new tables. No schema changes. No npm installs.

**Migrations created:** `supabase/migrations/053_curriculum_seed.sql`

**TypeScript result:** `npx tsc --noEmit` — 0 errors

### Sprint 189 — Curriculum Seed Migration V1
- Created `scripts/generate-curriculum-seed-sql.py` — Python generator that reads all 7 validated xlsx source files and produces `supabase/migrations/053_curriculum_seed.sql`. Applies all normalization mappings from Sprint 188 validation report. Uses level lookup subqueries (never hardcoded UUIDs). Strips Swinget [PROPOSED:] annotation from gate notes. Parses JSONB coaching_cues from pipe-delimited source strings. Covers all 10 curriculum foundation tables.
- Created `supabase/migrations/053_curriculum_seed.sql` — Seeds all curriculum foundation tables. 10,468 lines, 528 KB. All inserts use ON CONFLICT DO NOTHING for idempotency.

**Row counts per table:**
- `curriculum_levels`: 15 display-name UPDATE statements
- `curriculum_archetypes`: 8 rows (A1–A8)
- `curriculum_failure_modes`: 14 rows (FM-01–FM-14)
- `curriculum_gates`: 57 rows (full)
- `curriculum_coach_language`: 120 rows (full — 15 stages × 8 domains)
- `curriculum_drills`: 152 rows (full)
- `curriculum_drill_tags`: 614 rows
- `curriculum_competition_track`: 15 rows (full)
- `curriculum_fitness_guidance`: 15 rows (full)
- `curriculum_volume_guidance`: 15 rows (full)
- `drill_gate_mappings`: 0 rows (intentionally deferred — strategy not confirmed)

**Product-tool grep result:** CLEAN in all data fields. Two SQL comment-only references (header and strip-note), one confirmed false positive (`'First-volley closing the angle.'` — tennis coaching term, not The Angle™ product).

---

## 2026-05-02 — Sprint 188: Curriculum Spreadsheet Validation + Normalized Seed Preview

**Mode:** Validation and preview only. No migrations created. No data inserted. No UI built. No app routes modified. No npm installs.

**Migrations created:** None. Validation precedes migration 053.

**TypeScript result:** `npx tsc --noEmit` — 0 errors

### Sprint 188 — Curriculum Spreadsheet Validation + Normalized Seed Preview V1
- Created `scripts/validate-curriculum-seed-sources.mjs` — Validation script using openpyxl (Python) for xlsx parsing. Validates 7 source files (57 sheets), 86 constraint checks: file existence, sheet presence, required columns, row counts, unique IDs, domain values, stage values, archetype tags, failure mode IDs, product-tool leakage. Outputs normalized preview JSON files and a markdown validation report.
- Created `docs/curriculum/seed-validation-report.md` — Full validation report. 86 checks passed, 0 failed, 6 warnings. All 8 tables confirmed ready for migration 053. Normalization mappings documented. Product-tool leakage clean in all core fields.
- Created `docs/curriculum/seed-preview/curriculum-gates-preview.json` — 57 gate rows with domain_raw and domain_normalized fields.
- Created `docs/curriculum/seed-preview/curriculum-drills-preview.json` — First 20 of 152 drill rows (normalized).
- Created `docs/curriculum/seed-preview/curriculum-coach-language-preview.json` — All 120 coach language entries.
- Created `docs/curriculum/seed-preview/curriculum-archetypes-preview.json` — All 8 archetype rows.
- Created `docs/curriculum/seed-preview/curriculum-failure-modes-preview.json` — All 14 failure mode rows.

**Normalization mappings required at seed time:**
- Gates domain: "Movement / Athletic" → "Movement", "Mentality / Learning Behavior" → "Mentality", "Tactical (Court Mapping)" → "Tactical"
- Gates evaluator: "Coach + Director" → "Director" (19 gates)
- Gates To: "Out (Living-as-a-Pro)" → NULL (to_level_id IS NULL, HP3 exit gate)
- Fitness phase: descriptive names → migration enum values

**Product-tool leakage result:** CLEAN in all core data fields. One informational [PROPOSED:] note in Gates Notes column (RED1__RED2__02) flagged as non-blocking warning. One false positive ("closing the angle" = tennis term) documented and excluded.

---

## 2026-05-02 — Sprints 176–185: AI Suggestion Review Engine + Director Approval Cards V1

**Mode:** AI suggestion infrastructure — deterministic generation, director review page, lifecycle actions, dashboard card. No npm installs. No external AI API. No parent/player publishing. No level mutations. No auto-applying suggestions.

**Migrations created:** `supabase/migrations/051_academy_suggestions.sql`

**TypeScript result:** `npx tsc --noEmit` — 0 errors

### Sprint 176 — AI Suggestion System Architecture Audit V1
- Created `docs/AI_SUGGESTION_REVIEW_ENGINE_ARCHITECTURE.md` — Full audit of existing review queues, adaptive suggestions, data sources. Includes recommended `academy_suggestions` table schema, suggestion types, impact preview model, accept/deny/defer lifecycle, V1 safe behaviors, audit plan, and implementation plan.

### Sprint 177 — AI Suggestions Data Model V1
- Created `supabase/migrations/051_academy_suggestions.sql` — `academy_suggestions` table with all lifecycle fields (status, priority, confidence, evidence JSONB, impact_preview JSONB, proposed_changes JSONB, will_not_change JSONB, review tracking). RLS policies for director/head_coach roles only. 3 performance indexes.
- Created `docs/ACADEMY_SUGGESTIONS_DATA_MODEL.md` — Schema documentation.

### Sprint 178 — Suggestion Generation Helpers V1
- Created `src/lib/suggestions/suggestionTypes.ts` — Type definitions: `AcademySuggestionType`, `AcademySuggestionPriority`, `AcademySuggestionConfidence`, `AcademySuggestionStatus`, `AcademySuggestionDraft`, `AcademySuggestionRow`, display label maps and CSS class maps.
- Created `src/lib/suggestions/generateAcademySuggestions.ts` — Deterministic suggestion generators (pure functions, no DB calls, no AI API): `buildPlayerFocusMissingSuggestions`, `buildPrivateLessonPendingSuggestions`, `buildParentSafeSummaryOpportunitySuggestions`, `buildLevelReadinessReviewSuggestions`, `buildReassessmentFollowupSuggestions`, `buildAcademySuggestionDrafts`.

### Sprint 179 — Suggestion Server Actions V1
- Created `src/app/director/ai-suggestions/suggestionActions.ts` — Server actions: `generateAcademySuggestionsAction` (fetch + dedup + insert), `acceptSuggestionAction`, `denySuggestionAction`, `deferSuggestionAction`, `markSuggestionAppliedAction`. All academy-scoped and role-checked. No auto-mutation on accept.

### Sprint 180 — Director AI Suggestions Dashboard Card V1
- Modified `src/app/director/page.tsx` — Added AI Suggestions card alongside Academy Alerts panel (2-column layout). Queries `academy_suggestions` for pending count and high-priority count. Updated Academy Intelligence quick action to link to `/director/ai-suggestions`.
- Modified `src/components/nav/SidebarNav.tsx` — Added "AI Suggestions" nav item under Intelligence section with Sparkles icon.

### Sprint 181 — AI Suggestions Review Page V1
- Created `src/app/director/ai-suggestions/page.tsx` — Full review page: eyebrow/title/subtitle header, "Generate Suggestions" form button, summary stat cards (Pending/High Priority/Accepted/Deferred), filter tabs by status, guardrail note ("nothing changes automatically"), SuggestionCard list with bound server actions. Empty state per status. `SummaryStatCard` local component.

### Sprint 182 — Suggestion Card Component + Impact Preview V1
- Created `src/components/suggestions/SuggestionCard.tsx` — Client component with expand/collapse, Accept/Deny/Defer actions, inline note textarea for deny/defer, `useTransition` for async state, action result messages. Positive development language throughout.
- Created `src/components/suggestions/ImpactPreviewPanel.tsx` — Presentational component showing Evidence, "If accepted" (lime panel), "Will not change" (surface-raised panel), "Recommended next step". Exports `parseSuggestionImpactPreview` helper.

### Sprint 183 — Safe Accept/Deny/Defer Workflow V1
- Implemented in `suggestionActions.ts` — Accept only marks status + returns nextStep from impact_preview. Deny/Defer store optional review_note. All actions verify academy ownership via membership check. `revalidatePath` keeps counts fresh.

### Sprint 184 — Suggestion Audit + Duplicate Prevention V1
- Duplicate prevention enforced in `generateAcademySuggestionsAction` via composite key `suggestion_type:entity_type:entity_id` checked against in-memory Set.
- `reviewed_by`, `reviewed_at`, `review_note` populated on all review actions.
- Created `docs/AI_SUGGESTION_LIFECYCLE_AND_AUDIT.md` — Lifecycle states, duplicate prevention design, accepted vs applied distinction, V1 safety rules per type, future audit_logs integration plan, RLS enforcement summary.

### Sprint 185 — AI Suggestions QA + Brian Demo Script V1
- Created `docs/AI_SUGGESTIONS_QA.md` — 21-item QA checklist covering UI rendering, generation, dedup, card interactions, accept/deny/defer, safety guardrails, TypeScript.
- Created `docs/AI_SUGGESTIONS_BRIAN_DEMO_SCRIPT.md` — 10-step demo script: dashboard card → review page → generate → expand card → evidence → impact preview → accept → deny → defer → filter tabs.
- Updated `docs/CHANGELOG.md` — this entry.

---

## 2026-05-02 — Sprints 166–175: Player + Parent Development Profile Experience V1

**Mode:** UI/UX build — development profile components, parent/player safe previews, dashboard drilldown language. No npm installs. No AI API calls. No migrations. No parent/player publishing. No level mutations.

**Migrations created:** None

**TypeScript result:** `npx tsc --noEmit` — 0 errors

### Sprint 166 — Player Profile Experience Audit V1
- Created `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_EXPERIENCE_AUDIT.md` — Full audit of current player profile data sources, visibility gaps, and component opportunities. Maps `current_strengths` → Doing Well, `things_to_work_on` → Working On, `development_focus` → Current Focus.

### Sprint 167 — Player Development Summary Card V1
- Created `src/components/player/DevelopmentProfileSummaryCard.tsx` — Internal coach-facing development summary card. Adapts `player_development_summary` + `player_priorities` into Doing Well / Working On / Current Focus / Next Step sections. Shows "Internal coach view" badge.

### Sprint 168 — Doing Well / Working On / Current Focus Sections V1
- Created `src/components/player/DevelopmentFocusSections.tsx` — Four-section presentational component (Doing Well, Working On, Current Focus, Next Step) with positive development language and color-coded icons.
- Modified `src/components/player/DevelopmentSummarySection.tsx` — Updated labels: "Current Strengths" → "Doing Well", "Things to Work On" → "Working On", "Development Focus" → "Current Focus", "Coach Summary" → "Coach Insight", "Student-Facing Preview" → "Player Preview".

### Sprint 169 — Progress Evidence + Recent Notes Timeline V1
- Created `src/components/player/ProgressEvidenceTimeline.tsx` — Timeline of coach observations with Internal/Coach note visibility pills. Truncates content at 180 chars. Shows observation type, coach name, session context.

### Sprint 170 — Coach-Facing Player Snapshot V1
- Created `src/components/player/CoachPlayerSnapshot.tsx` — Pre-session coach view: Current Focus, Doing Well, Working On, Next Priority, Recent Note with date. Answers "what to focus on with this player today."

### Sprint 171 — Parent-Safe Player Progress Preview V1
- Created `src/components/player/ParentSafeProgressPreview.tsx` — Parent portal card with "Preview only" Lock badge. Empty state: "Progress summaries will appear here after coach/director review." Never exposes raw coach notes.
- Modified `src/app/parent/page.tsx` — Replaced generic "Child's Progress" card with `ParentSafeProgressPreview`.

### Sprint 172 — Player Mission View Preview V1
- Created `src/components/player/PlayerMissionPreview.tsx` — Player portal mission card. Your Strength / Your Mission / Next Win sections. Empty state: "Your next mission will appear after your coach reviews your progress."
- Modified `src/app/player/page.tsx` — Replaced generic "Today's Mission" card with `PlayerMissionPreview`.

### Sprint 173 — Level-Up Requirements / Next Level Progress V1
- Created `src/components/player/LevelProgressCard.tsx` — Sidebar card showing current level, next target level, advancement status (CheckCircle2 / Clock), and director approval requirement.

### Sprint 174 — Dashboard Drilldown Integration V1
- Modified `src/app/director/players/[playerId]/page.tsx` — Added `DevelopmentProfileSummaryCard` to Overview tab left column; added `LevelProgressCard` to Overview sidebar; added `CoachPlayerSnapshot` at top of Notes tab; added `ProgressEvidenceTimeline` in Notes tab. Moved `rawDb`, `developmentSummary`, `activePriorities`, `progressionRequirements`, and `nextCurriculumLevel` queries before `overviewSlot`.
- Modified `src/app/director/players/active/page.tsx` — Updated "Working on:" label to "Current Focus" to match development profile language.
- Modified `src/app/director/improvement/page.tsx` — Added "Working On" label above focus area text in player rows.

### Sprint 175 — Player/Parent Development Experience QA + Demo Script V1
- Created `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_EXPERIENCE_QA.md` — 15-item QA checklist covering all components, safety guardrails, and TypeScript.
- Created `docs/PLAYER_PARENT_DEVELOPMENT_PROFILE_DEMO_SCRIPT.md` — 10-step demo sequence from Director Dashboard through parent/player previews with guardrail explanation.
- Updated `docs/CHANGELOG.md` — This entry.

---

## 2026-05-02 — Sprints 156–165: Fitness OS Template Builder + Class Template Separation V1 (Completion Pass)

**Mode:** Fitness OS product completion — utility functions, server action, and docs. No npm installs. No AI API calls. No migrations.

**Migrations created:** None

### Sprint 156 — Fitness/Class Template Separation Audit V1
- Updated `docs/FITNESS_TEMPLATE_SEPARATION_AUDIT.md` — Revised sprint reference from 136 to 156. Updated implementation plan table to map 136-145 → 156-165 with completion status.

### Sprint 157 — Class Templates Route + Navigation Separation V1
- No changes needed. `src/app/director/class-templates/page.tsx` and sidebar separation confirmed complete from Sprint 137.

### Sprint 158 — Fitness Block Taxonomy V1
- Modified `src/lib/fitness/fitnessBlockTypes.ts` — Added `isFitnessBlockType(value)` type guard export.

### Sprint 159 — Fitness Exercise Matching Engine V1
- Modified `src/lib/fitness/fitnessExerciseMatching.ts` — Added `normalizeFitnessExerciseCategory(value)` export for normalizing legacy category strings to DB enum values.
- Created `docs/FITNESS_EXERCISE_MATCHING_ENGINE.md` — Documents scoring algorithm, block→keyword mappings, fallback exercise policy, all exported functions, category normalization table, and guardrails.

### Sprint 160 — Fitness Template Data Model + Actions V1
- Modified `src/app/director/fitness/fitnessTemplateActions.ts` — Added `updateFitnessExercisePrescriptionAction` to update `duration_min` and `notes` on a template_block_exercise row without touching the global exercise library.

### Sprint 161 — Fitness Template List Page V1
- No changes needed. Page confirmed complete from Sprint 141.

### Sprint 162 — Fitness Template Detail / Block Builder V1
- No changes needed. FitnessTemplateBuilderClient, FitnessBlockCard, ExerciseRow, observation panel confirmed complete from Sprint 142.

### Sprint 163 — Fitness Exercise Switcher V1
- No changes needed. FitnessExerciseSwitcher confirmed complete from Sprint 143.

### Sprint 164 — Fitness Voice/Text Observation Drafts V1
- No changes needed. VoiceTextInput observation panel confirmed complete from Sprint 144.

### Sprint 165 — Fitness OS QA + Brian Demo Script V1
- Updated `docs/FITNESS_OS_TEMPLATE_BUILDER_QA.md` — Updated sprint reference to 165. Added QA items 17 (isFitnessBlockType validation) and 18 (normalizeFitnessExerciseCategory).
- Updated `docs/FITNESS_OS_DEMO_SCRIPT.md` — Updated sprint reference to 165.
- Modified `docs/CHANGELOG.md` — This entry.
- TypeScript: ✓ clean (exit 0)

---

## 2026-05-01 — Sprints 146–155: Director Dashboard Command Cards + Drilldowns + Private Lesson Requests V1

**Mode:** Director dashboard command layer. No npm installs. No AI API calls. No communications sent.

**Migrations created:** `supabase/migrations/050_private_lesson_requests.sql`

### Sprint 146 — Architecture Audit V1
- Created `docs/DIRECTOR_DASHBOARD_COMMAND_CARDS_ARCHITECTURE.md` — Full audit: current dashboard state, available data, command card plan, drilldown plans, private lesson request plan, alerts plan, schema gaps, implementation order.

### Sprint 147 — Dashboard Top Command Cards V1
- Modified `src/app/director/page.tsx` — Full rewrite. 5 CommandCards (Active Players/Academy Improvement/Sessions/Private Lessons/Academy Alerts), Academy Alerts middle panel, 4 QuickAction bottom tiles. rawDb pattern for private_lesson_requests.

### Sprint 148 — Active Players Drilldown V1
- Created `src/app/director/players/active/page.tsx` — Active players list with summary cards (total, with focus, missing summary, needs review), player table with focus areas and score delta, links to player profiles.

### Sprint 149 — Academy Improvement Drilldown V1
- Created `src/app/director/improvement/page.tsx` — Improvement metrics using v_player_summary.score_delta. Summary cards, player table with trend chips, UTR note, links to player profiles.

### Sprint 150 — Sessions Drilldown V1
- Created `src/app/director/sessions/overview/page.tsx` — Current week sessions with summary cards (sessions, participants, completed, missing recap), session list with coach/group/status/recap status.

### Sprint 151 — Private Lesson Requests Schema V1
- Created `supabase/migrations/050_private_lesson_requests.sql` — private_lesson_requests table with RLS (directors/head coaches only). Status: new/reviewing/assigned/scheduled/declined/completed.
- Created `docs/PRIVATE_LESSON_REQUESTS_ARCHITECTURE.md` — Schema docs, guardrails, status values, deferred parent write access.

### Sprint 152 — Private Lesson Requests Director Queue V1
- Created `src/app/director/private-lessons/page.tsx` — Director queue with summary cards, expandable request cards.
- Created `src/app/director/private-lessons/PrivateLessonRequestCard.tsx` — Client component: expand/collapse, status update, director notes.
- Created `src/app/director/private-lessons/privateLessonActions.ts` — Server actions: updatePrivateLessonStatusAction, updateDirectorNotesAction.

### Sprint 153 — Parent Portal Private Lesson Preview V1
- Modified `src/app/parent/page.tsx` — Added "Request a Private Lesson" preview card. Form fields shown but disabled. Submit button disabled. No live submission wired.

### Sprint 154 — Academy Alerts Command Center V1
- Created `src/app/director/alerts/page.tsx` — Deterministic alert aggregation (no AI). 6 alert types. Category filters. Severity-coded cards with why/action/link. Summary row.

### Sprint 155 — Positive Development Language + Dashboard QA V1
- Created `docs/DIRECTOR_DASHBOARD_COMMAND_CARDS_QA.md` — 13 QA tests covering all sprint deliverables.
- Created `docs/POSITIVE_DEVELOPMENT_LANGUAGE_GUIDE.md` — Approved language terms, parent/player examples, implementation checklist.
- TypeScript: clean (0 errors).

---

## 2026-05-01 — Sprints 136–145: Fitness OS Template Builder + Class Template Separation V1

**Mode:** Fitness OS product build — UI + server actions + library utilities. No migrations.

**Migrations created:** None

### Sprint 136 — Fitness/Class Template Separation Audit V1
- Created `docs/FITNESS_TEMPLATE_SEPARATION_AUDIT.md` — Full audit of template mixing problem, data risks, table strategy, and implementation plan for Sprints 137–145.

### Sprint 137 — Route + Navigation Separation V1
- Created `src/app/director/class-templates/page.tsx` — Read-only class templates page filtering out fitness_template:true-tagged templates.
- Modified `src/components/nav/SidebarNav.tsx` — Added "Class Templates" nav item (LayoutTemplate icon) and renamed "Fitness" → "Fitness OS".

### Sprint 138 — Fitness Block Taxonomy V1
- Created `src/lib/fitness/fitnessBlockTypes.ts` — Exports FITNESS_BLOCK_TYPES, FitnessBlockType, getFitnessBlockLabel, getFitnessBlockAccent, getFitnessBlockBorderAccent, getDbBlockType, inferFitnessBlockType, getDefaultBlockDuration, getFitnessBlockIntent, defaultFitnessTemplateBlockOrder.
- Created `docs/FITNESS_BLOCK_TAXONOMY.md` — Documents 8 fitness block types, DB mapping strategy, template type tags, and distinction from curriculum blocks.

### Sprint 139 — Fitness Exercise Pool + Default Exercise Matching V1
- Created `src/lib/fitness/fitnessExerciseMatching.ts` — Exports getDefaultExercisesForFitnessBlock, matchExerciseToFitnessBlock, getFallbackFitnessExercises, getExercisesForFitnessBlock. Deterministic keyword + category scoring, 3-exercise default, fallback placeholders never inserted into DB.

### Sprint 140 — Fitness Template Builder Data Actions V1
- Created `src/app/director/fitness/fitnessTemplateActions.ts` — Server actions: createFitnessTemplateAction, addFitnessBlockAction (auto-populates exercises), removeFitnessBlockAction, reorderFitnessBlocksAction, addExerciseToFitnessBlockAction, removeExerciseFromFitnessBlockAction, swapExerciseInFitnessBlockAction, updateFitnessBlockNotesAction. All role-checked (director/head_coach), academy-scoped, fitness-template-verified.

### Sprint 141 — Fitness Template Builder UI V1
- Modified `src/app/director/fitness/templates/page.tsx` — Full rewrite. Fitness OS command page. Filters to fitness_template:true only. Stat cards, type labels, New Fitness Template CTA, premium card list.
- Created `src/app/director/fitness/templates/new/page.tsx` — New template creation page.
- Created `src/app/director/fitness/templates/new/NewFitnessTemplateForm.tsx` — Client form: name, template type picker, description, duration. Redirects to builder on success.

### Sprint 142 — Fitness Template Detail / Block Builder V1
- Modified `src/app/director/fitness/templates/[templateId]/page.tsx` — Full rewrite. Fitness block builder for fitness templates. Non-fitness templates show a class template notice. Passes blocks and exercise library to client.
- Created `src/app/director/fitness/templates/[templateId]/fitnessBuilderTypes.ts` — Shared TypeScript interfaces: FitnessBlock, FitnessExercise, ExerciseLibraryItem.
- Created `src/app/director/fitness/templates/[templateId]/FitnessTemplateBuilderClient.tsx` — Client component: add/remove/reorder blocks, remove exercises, open switcher, observation panel with VoiceTextInput.

### Sprint 143 — Fitness Exercise Switcher V1
- Created `src/app/director/fitness/templates/[templateId]/FitnessExerciseSwitcher.tsx` — Modal: shows matching exercises first (labeled "Match"), search filter, select replacement, confirm swap. Does not touch exercise library.

### Sprint 144 — Fitness Voice Observation Drafts V1
- Observations stored in `template_blocks.notes` via `updateFitnessBlockNotesAction` (in Sprint 140 actions file).
- Observation UI in FitnessTemplateBuilderClient: MessageSquare button per block, VoiceTextInput panel, save/cancel. Internal only — no player mutation, no communications.

### Sprint 145 — Fitness OS QA + Demo Script V1
- Created `docs/FITNESS_OS_TEMPLATE_BUILDER_QA.md` — 16-item QA test list covering separation, creation, block management, exercise swaps, library safety, observations, and TypeScript.
- Created `docs/FITNESS_OS_DEMO_SCRIPT.md` — 10-step demo walkthrough from template creation through voice observations.
- Modified `docs/CHANGELOG.md` — This entry.
- TypeScript: ✓ clean (exit 0)

---

## 2026-05-01 — Sprints 126–135: Premium UI System Alignment + Manus Aesthetic Match V1

**Mode:** UI/aesthetic alignment sprint — no backend changes, no migrations.

**Migrations created:** None

### Sprint 126 — UI Audit + Design System Plan V1
- Created `docs/PREMIUM_UI_SYSTEM_AUDIT.md` — Full audit of current styling architecture, component inventory, routes requiring polish, safest update paths, design token targets.

### Sprint 127 — Global Theme Tokens + Base Surface V1
- Modified `tailwind.config.ts` — Changed primary accent `lime` token from lime green (#C8FF00) to cyan (#11d9df). Deepened background tokens to near-black Manus aesthetic. Added `status.purple` (#b56cff), `shadow.cyan`, updated all surface/border/text colors.
- Modified `src/app/globals.css` — Added comprehensive CSS variables (--bg-app, --accent-cyan, --border-subtle, etc.). Added new utility classes: `.page-eyebrow`, `.page-title`, `.page-subtitle`, `.label-xs-cyan`, `.pill-*`, `.input-base`, `.table-card`, updated `.btn-lime` (dark text, glow), `.btn-ghost`, `.btn-danger`.
- Modified `src/app/layout.tsx` — Updated themeColor to new base color.
- Created `docs/PREMIUM_UI_STYLE_GUIDE.md` — Full style guide with colors, typography, spacing, card/button/table/form/sidebar/top-bar rules.

### Sprint 128 — Shared Shell, Sidebar, and Top Bar V1
- Modified `src/components/nav/SidebarNav.tsx` — Section labels (FOUNDATION / INTELLIGENCE / SYSTEM), active nav with left accent + cyan pill, bottom user card with circular avatar, name/email, sign-out icon. Accepts `userDisplayName` and `userEmail` props.
- Modified `src/app/director/layout.tsx` — Passes `userDisplayName` and `userEmail` to SidebarNav.

### Sprint 129 — Shared UI Components Polish V1
- Modified `src/components/ui/Card.tsx` — hover uses `shadow-cyan`, CardFooter uses CSS variable border.
- Modified `src/components/ui/MetricCard.tsx` — updated variant borders, optional icon slot.
- Modified `src/components/ui/StatusBadge.tsx` — updated border opacities.
- Modified `src/components/ui/Table.tsx` — CSS variable-based dividers.
- Modified `src/components/ui/Tabs.tsx` — active state cyan, inactive hover subtle border.
- Modified `src/components/ui/Avatar.tsx` — cyan initials on dark bg.
- Modified `src/components/ui/SearchFilterBar.tsx` — premium focus ring, FilterChip updated.
- Modified `src/components/ui/EmptyState.tsx` — icon container uses cyan soft bg.
- Modified `src/components/nav/BottomTabBar.tsx` — icon glow on active, sidebar bg.

### Sprint 130 — Director Dashboard + Demo Tour Polish V1
- Modified `src/app/director/page.tsx` — Premium header with `page-eyebrow`, CTA button, Curriculum + Sessions promoted to Live modules.
- Modified `src/app/director/demo/page.tsx` — Premium eyebrow header.

### Sprint 131 — Players + Player Profile Polish V1
- Modified `src/app/director/players/page.tsx` — Premium header with eyebrow.
- Modified `src/app/director/players/_components/PlayersDirectoryClient.tsx` — `table-card` wrapper with CSS variable dividers.
- Modified `src/app/director/players/import/page.tsx` — Premium eyebrow header.
- Modified `src/app/director/players/development-intake/page.tsx` — Premium eyebrow header.
- Modified `src/app/director/players/onboarding-review/page.tsx` — Premium eyebrow header (both states).

### Sprint 132 — Curriculum + Templates + Exercise Library Polish V1
- Modified `src/app/director/curriculum/page.tsx` — Premium eyebrow header.
- Modified `src/app/director/curriculum/academy-version/page.tsx` — Premium eyebrow header.
- Modified `src/app/director/fitness/templates/page.tsx` — Premium eyebrow header, p-6 padding.
- Modified `src/app/director/fitness/templates/[templateId]/page.tsx` — Premium eyebrow header, p-6 padding.

### Sprint 133 — Sessions + Coach Workflow Polish V1
- Modified `src/app/director/sessions/page.tsx` — Premium eyebrow header, p-6 padding.
- Modified `src/app/director/sessions/[sessionId]/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/players/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/sessions/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/sessions/[sessionId]/page.tsx` — Premium eyebrow header.
- Modified `src/app/coach/voice/page.tsx` — Premium eyebrow header.
- Modified `src/components/voice/VoiceTextInput.tsx` — Premium textarea with rounded-xl, focus ring.

### Sprint 134 — Intelligence, Reporting, Parent Comms, Settings Polish V1
- Modified `src/app/director/review/page.tsx` — Premium eyebrow header, updated badge opacities.
- Modified `src/app/parent/page.tsx` — Premium eyebrow header.
- Modified `src/app/player/page.tsx` — Premium eyebrow header.

### Sprint 135 — Whole-App UI QA + Consistency Pass V1
- Created `docs/PREMIUM_UI_QA.md` — Routes checked, visual updates completed, known remaining polish items, mobile/responsive notes, accessibility notes.
- TypeScript: **Clean** — zero errors.

---

## 2026-05-01 — Sprints 121–125: Voice Input Demo Layer V1

**Mode:** Safe browser-native voice-to-text input layer. No autonomous voice execution. No external AI APIs. All voice input feeds existing human-review workflows. Microphone → transcript → editable text box → manual submit → existing draft pipeline.

**Migrations created:** None (voice_notes table already exists)

---

### Sprint 121 — Voice Input Architecture + Guardrails V1

**Files created:**
- `docs/VOICE_INPUT_DEMO_LAYER_ARCHITECTURE.md` — Purpose, safe voice model, supported workflows, browser Web Speech API approach, fallback typing, guardrails, privacy notes, no external AI policy, sprint path, known browser limitations.

**TypeScript:** Not applicable (docs only).

---

### Sprint 122 — Reusable VoiceTextInput Component V1

**Files created:**
- `src/components/voice/VoiceTextInput.tsx` — Reusable voice-to-text textarea component with start/stop listening, transcript append, editable text, clear button, graceful microphone error handling, browser support detection, and calm fallback for unsupported browsers.
- `docs/VOICE_TEXT_INPUT_COMPONENT.md` — Component props, behavior, implementation notes, usage example, guardrails.

**TypeScript:** Clean.

---

### Sprint 123 — Voice Curriculum Command Demo Integration V1

**Files modified:**
- `src/app/director/curriculum/VoiceOverrideInputPanel.tsx` — Replaced raw textarea with `VoiceTextInput`. Manual submit flow unchanged. Added "Speak or type. The OS creates a draft for review — nothing changes automatically." copy. No auto-submit. No AI API.

**TypeScript:** Clean.

---

### Sprint 124 — Voice Coach Recap Demo Integration V1

**Files created:**
- `src/app/director/sessions/[sessionId]/saveSessionVoiceNoteAction.ts` — Server action to save a session-level voice_note (author_id, session_id, null player_id, raw_input, status: pending). Auth, academy_id scoping, and coach role verification enforced.
- `src/app/director/sessions/[sessionId]/VoiceCoachRecapInput.tsx` — Voice-enabled coach recap input. VoiceTextInput + Save Recap button + success message. No auto-submit. No player mutations.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Added VoiceCoachRecapInput to the COACH RECAP section (above recap history). Added conditional display for recaps list.

**TypeScript:** Clean.

---

### Sprint 125 — Voice Demo QA + Brian Script V1

**Files created:**
- `docs/VOICE_INPUT_DEMO_QA.md` — 14-item manual QA checklist covering voice support, no-voice fallback, microphone denial, transcript editing, no auto-submit, draft-only submission, no external API, no parent/player visibility, no communication, no curriculum/template/player mutation.
- `docs/BRIAN_VOICE_DEMO_SCRIPT.md` — Full demo script: sandbox setup, curriculum voice prompt, coach recap voice prompt, key talking points, what NOT to say.

**Files modified:**
- `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` — Added "Voice Demo Add-On" section at the end with Step A (curriculum voice) and Step B (recap voice) and core guardrail talking point.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 111–120: Real Demo Sandbox + Brian Interactive Tour V1

**Mode:** Real demo sandbox seeded into director's academy with `[DEMO]` prefix tagging. Interactive tour page with status, player roster, curriculum preview, session preview, adaptive suggestions preview. Full reset/delete flow with cascade safety. No migration. No parent/player visibility. No communications.

**Migrations created:** None (naming convention isolation; existing schema sufficient)

---

### Sprint 111 — Demo Sandbox Architecture + Guardrails V1

**Files created:**
- `docs/DEMO_SANDBOX_ARCHITECTURE.md` — Purpose, isolation strategy, cascade delete map, forbidden records, how demo connects to real workflows, recommended sprint path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 112 — Demo Data Tagging + Reset Strategy V1

**Files created:**
- `docs/DEMO_SANDBOX_RESET_STRATEGY.md` — Naming convention tagging strategy, step-by-step delete order, safety guarantees, confirmation requirements, audit trail.

**TypeScript:** Not applicable (docs only).

---

### Sprint 113 — Demo Seed Pack V1

**Files created:**
- `src/app/director/demo/demoSandboxActions.ts` — `createOrResetDemoSandboxAction()`: seeds 6 demo players with dev profiles + priorities + group memberships + curriculum states + demo group + demo template (5 blocks) + demo session (5 blocks) + demo curriculum version + override. `resetDemoSandboxAction()`: cascade-safe delete in correct FK order. `getDemoSandboxStatusAction()`: query current sandbox state for page. All actions scoped to `[DEMO]` prefix.

**TypeScript:** Clean.

---

### Sprint 114 — Demo Reset / Delete Flow V1

**Files created:**
- `src/app/director/demo/DemoSandboxControls.tsx` — Client component with create/reset/delete buttons, confirmation checkbox, result/warning display, page reload on completion.

**TypeScript:** Clean.

---

### Sprint 115 — Brian Demo Tour Landing Page V1

**Files created:**
- `src/app/director/demo/page.tsx` — Server component; loads sandbox status; renders all demo tour sections (status, what this shows, demo flow steps, quick links).

**TypeScript:** Clean.

---

### Sprint 116 — Demo Player + Development Profile Walkthrough V1

**Files modified:**
- `src/app/director/demo/page.tsx` — Added "Sample Player Data" section with per-player cards showing strengths, needs, and priority. Links to player import, development intake, onboarding review.

---

### Sprint 117 — Demo Curriculum + Voice Customization Walkthrough V1

**Files modified:**
- `src/app/director/demo/page.tsx` — Added "Curriculum Customization Preview" section with sample director prompt, 3-step explanation, deep links to curriculum and review queue.

---

### Sprint 118 — Demo Session + Coach Intelligence Walkthrough V1

**Files modified:**
- `src/app/director/demo/page.tsx` — Added "Coach Session Preview" section with demo session status, checklist of what session page shows, link to open demo session.

---

### Sprint 119 — Demo Adaptive Suggestions Interactive Preview V1

**Files modified:**
- `src/app/director/demo/page.tsx` — Added "Adaptive Suggestions Preview" section with 3 example suggestion cards, guardrail explanation, link to demo session for real generation.

---

### Sprint 120 — Brian Interactive Demo QA + Script V1

**Files created:**
- `docs/DEMO_SANDBOX_QA.md` — 16 QA test cases covering creation, players, group, dev profiles, curriculum, template, session, suggestions, apply flow, reset, real data safety, parent/player isolation, communications.
- `docs/BRIAN_INTERACTIVE_DEMO_SCRIPT.md` — 14-step interactive demo script with exact actions, speaking points, and key properties to reinforce.

**Files modified:**
- `src/components/nav/SidebarNav.tsx` — Added "Demo Tour" link with FlaskConical icon.
- `docs/CHANGELOG.md` — This entry.

**TypeScript:** Clean (exit 0).

---

## 2026-05-01 — Sprints 101–110: Player Import + Development Profile Onboarding V1

**Mode:** CSV import with dry-run/commit flow, bulk development profile intake, onboarding review. No AI API calls. No parent/player visibility. No billing. No communications. No new migrations.

**Migrations created:** None (existing schema sufficient)

---

### Sprint 101 — Player Import Schema Audit V1

**Files created:**
- `docs/PLAYER_IMPORT_SCHEMA_AUDIT.md` — Full audit: tables and columns, safe import fields, deferred fields, duplicate detection, group/curriculum assignment approaches, risks, sprint 102–110 path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 102 — Player CSV Template V1

**Files created:**
- `docs/PLAYER_IMPORT_CSV_TEMPLATE.md` — Column reference, 3 example rows, import flow diagram, known limitations, what NOT to include.
- `data/player-import/player_import_template.csv` — Ready-to-copy CSV template with example rows.

**TypeScript:** Not applicable (data/docs only).

---

### Sprint 103 — Player Import Parsing + Dry Run Utility V1

**Files created:**
- `src/lib/player-import/playerImportParser.ts` — `runPlayerImportParsing()`, `parsePlayerImportCsv()`, `normalizePlayerImportRow()`, `validatePlayerImportRows()`. Pure TS, no DB, no AI. In-upload duplicate detection, field validation, normalization.
- `docs/PLAYER_IMPORT_PARSER.md` — Function signatures, validation rules, normalization table, guardrails.

**TypeScript:** Clean.

---

### Sprint 104 — Player Import Dry Run + Commit Server Actions V1

**Files created:**
- `src/app/director/players/import/playerImportActions.ts` — `runPlayerImportDryRunAction()`: auth + academy check, parse, DB lookups for existing players/groups/levels/coaches, returns per-row dry-run results. `commitPlayerImportAction()`: re-validates, creates players, upserts dev summaries, creates priorities, assigns curriculum and groups. Writes audit_logs. Conservative duplicate handling.

**TypeScript:** Clean.

---

### Sprint 105 — Player Import UI V1

**Files created:**
- `src/app/director/players/import/page.tsx` — Route shell with back link and page header.
- `src/app/director/players/import/PlayerImportClient.tsx` — Client component: CSV column guide, textarea + file upload, Run Dry Run button, DryRunReport with expandable rows, CommitSection with confirmation checkbox, ImportResultReport with links to next steps.

**Files modified:**
- `src/app/director/players/page.tsx` — Added "Import Players" button linking to /director/players/import.

**TypeScript:** Clean.

---

### Sprint 106 — Player Import Commit Flow V1

**Files modified:**
- `src/app/director/players/import/playerImportActions.ts` — `commitPlayerImportAction()` added: guarded mutations only after director confirmation; re-runs parse inside server action; creates players, dev summaries, priorities, curriculum states, group memberships; skips on errors; writes audit_logs.

**TypeScript:** Clean.

---

### Sprint 107 — Commit UI + Import Result Report V1

**Files modified:**
- `src/app/director/players/import/PlayerImportClient.tsx` — Added CommitSection with confirmation checkbox and Commit Import button; ImportResultReport with stat pills and links to Players + Development Intake.

**TypeScript:** Clean.

---

### Sprint 108 — Bulk Strengths / Needs Entry UI V1

**Files created:**
- `src/app/director/players/development-intake/developmentIntakeActions.ts` — `updatePlayerDevelopmentIntakeAction()`: upserts `player_development_summary`, deactivates old priorities and creates new one.
- `src/app/director/players/development-intake/DevelopmentIntakeClient.tsx` — Client panel with per-player expandable intake cards (3 strengths, 3 needs, priority, notes), filter by missing data, Save per player.
- `src/app/director/players/development-intake/page.tsx` — Server component: loads active players + dev summaries + priorities, passes to client.

**TypeScript:** Clean.

---

### Sprint 109 — Curriculum + Group Assignment Review V1

**Files created:**
- `src/app/director/players/onboarding-review/page.tsx` — Server component: loads players, checks curriculum states, group memberships, dev summaries, priorities; shows readiness bar, gap checklist with fix links, per-player readiness list with icon indicators.

**TypeScript:** Clean.

---

### Sprint 110 — Academy Player Onboarding QA + Brian Data Prep Demo V1

**Files created:**
- `docs/PLAYER_IMPORT_ONBOARDING_QA.md` — 13 test cases covering empty CSV, missing fields, duplicates, existing players, unknown groups/levels, dev profile import, commit flow, parent/player isolation, communications, coach intelligence improvements.
- `docs/BRIAN_PLAYER_DATA_PREP_DEMO.md` — 10-step demo script: Brian gives names → import → dry run → commit → development intake → onboarding review → session with real adaptive suggestions.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 91–100: Adaptive Session Planning Suggestions V1

**Mode:** Backend rule engine + server actions + review UI. No AI API calls. No parent/player visibility. No player level changes. No package installs. Migration: 049.

**Migrations created:** `049_session_adjustment_suggestions.sql`

---

### Sprint 91 — Session Modification Suggestion Architecture V1

**Files created:**
- `docs/ADAPTIVE_SESSION_PLANNING_ARCHITECTURE.md` — Full architecture: product goal, source inputs, 13 suggestion types, draft lifecycle diagram, review/apply flow, guardrails, future AI-ready path, recommended schema, sprint 92–100 path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 92 — Group Needs Aggregation Utility V1

**Files created:**
- `src/lib/session-planning/groupNeedsAggregation.ts` — `getGroupNeedsForSession()`: 11 sequential Supabase queries, aggregates player strengths/needs/priorities/curriculum/attendance into `GroupNeedsResult`.
- `docs/GROUP_NEEDS_AGGREGATION.md` — Purpose, function signature, query list, return shape, graceful fallbacks, guardrails.

**TypeScript:** Clean.

---

### Sprint 93 — Template Block Modification Rule Engine V1

**Files created:**
- `src/lib/session-planning/sessionModificationRules.ts` — `generateSessionModificationSuggestions()`: 8 deterministic rules covering recovery, spacing, return readiness, direction, mixed levels, small class, evidence gaps, academy overrides. Returns max 8 `SuggestionDraft[]`.
- `docs/SESSION_MODIFICATION_RULE_ENGINE.md` — Function signature, 8 rules documented, threshold logic, output limits, guardrails.

**TypeScript:** Clean.

---

### Sprint 94 — Session Adjustment Drafts V1

**Files created:**
- `supabase/migrations/049_session_adjustment_suggestions.sql` — New table with academy RLS, indexes. Status lifecycle: `pending_review → approved/rejected/dismissed → applied`.
- `src/app/director/sessions/[sessionId]/createSessionAdjustmentSuggestionsAction.ts` — Server action: auth + academy membership check, loads session blocks and curriculum context, runs group needs aggregation and rule engine, inserts suggestions as `pending_review`, replaces prior draft batch.

**TypeScript:** Clean.

---

### Sprint 95 — Session Adjustment Review Controls V1

**Files created:**
- `src/app/director/sessions/[sessionId]/sessionAdjustmentReviewActions.ts` — `approveSuggestionAction`, `rejectSuggestionAction`, `dismissSuggestionAction` server actions with auth/academy guards.
- `src/app/director/sessions/[sessionId]/SessionAdjustmentSuggestionsPanel.tsx` — Client panel: Generate button, suggestion cards with expand/collapse, approve/reject/dismiss controls, empty states, status pills, warning display.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Added query 12 (existing suggestions), built `existingSuggestions` with block note context, added `SUGGESTED ADJUSTMENTS` section before Coach Recap.

**TypeScript:** Clean.

---

### Sprint 96 — Apply Approved Session Adjustments V1

**Files created:**
- `src/app/director/sessions/[sessionId]/applyApprovedSessionAdjustmentAction.ts` — Server action: verifies `approved` status, appends `[Adaptive Adjustment]` to `session_blocks.notes` (or `session_notes` if no block), marks suggestion `applied`, writes `audit_logs`. Never touches `template_blocks`.

**Files modified:**
- `src/app/director/sessions/[sessionId]/SessionAdjustmentSuggestionsPanel.tsx` — Added "Apply to Session" button for approved suggestions.

**TypeScript:** Clean.

---

### Sprint 97 — Coach Briefing Shows Suggested Adjustments V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Coach Briefing now shows suggestion counts (pending/approved/applied) and top 3 pending suggestion previews.

**TypeScript:** Clean.

---

### Sprint 98 — Session Plan Diff View V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/SessionAdjustmentSuggestionsPanel.tsx` — Expanded suggestion card now shows before/after diff: current block notes vs. proposed adaptive adjustment text.
- `src/app/director/sessions/[sessionId]/page.tsx` — Pass `target_block_current_notes` to suggestion rows for diff display.

**TypeScript:** Clean.

---

### Sprint 99 — Adaptive Session Planning QA V1

**Files created:**
- `docs/ADAPTIVE_SESSION_PLANNING_QA.md` — 10 test cases covering no-roster, missing summaries, recovery needs, return readiness, mixed levels, small class, apply behavior, template protection, player record protection, parent/player isolation. Guardrails matrix.

**TypeScript:** Clean.

---

### Sprint 100 — Brian Adaptive Session Demo V1

**Files created:**
- `docs/BRIAN_ADAPTIVE_SESSION_PLANNING_DEMO.md` — 10-step demo script: template → session → roster → generate suggestions → show cards → approve → apply → confirm session-only change → confirm template unchanged → confirm player records unchanged.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 81–90: Premium UI + Coach Class Intelligence V1

**Mode:** UI polish, read-only coach intelligence. No AI API calls. No parent/player visibility. No player level changes. No package installs. No migrations.

**Migrations created:** None

---

### Sprint 81 — Premium UI Audit V1

**Files created:**
- `docs/PREMIUM_UI_AUDIT.md` — Audit of 6 director/coach screens: clutter risks, hierarchy problems, quick wins, reusable patterns, design rules, recommended polish path for Sprints 82–90.

**TypeScript:** Not applicable (docs only).

---

### Sprint 82 — Director Curriculum Page Premium Polish V1

**Files modified:**
- `src/app/director/curriculum/page.tsx` — Academy Version promoted to primary section; How It Works numbered guide; Global Curriculum Foundation moved to bottom grid.

**TypeScript:** Clean.

---

### Sprint 83 — Academy Version Audit Premium Polish V1

**Files modified:**
- `src/app/director/curriculum/academy-version/page.tsx` — AuditStat compact horizontal strip replaces 6-box grid; attention items use calm bordered style; AuditStat helper component added at module level.

**TypeScript:** Clean.

---

### Sprint 84 — Review Queue Premium Organization V1

**Files modified:**
- `src/app/director/review/page.tsx` — Added `p-6` container; per-category summary strip added to PageHeader showing pending/ready counts by category (Session Recaps, Priorities, Evidence, Attendance, Curriculum).

**TypeScript:** Clean.

---

### Sprint 85 — Template Builder Premium Polish V1

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Curriculum Intelligence section moved to top of page; populate from curriculum is now primary action; helpful copy about academy version/overrides added.

**TypeScript:** Clean.

---

### Sprint 86 — Coach Session View Premium Polish V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Curriculum Focus moved near top; planned-snapshot notice condensed to one muted line; `p-6` container added.

**TypeScript:** Clean.

---

### Sprint 87 — Class Roster Intelligence Panel V1

**Files created:**
- `src/app/director/sessions/[sessionId]/ClassRosterIntelligencePanel.tsx` — Read-only per-player panel: name, curriculum level, source (academy/global), strengths, focus areas, top priority, attendance status. Graceful fallbacks when data is absent.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Added player intelligence queries (curriculum states, development summaries, priorities); renders ClassRosterIntelligencePanel after Group Assignment.

**TypeScript:** Clean.

---

### Sprint 88 — Player Strengths / Needs Summary Cards V1

*Integrated into Sprint 87 ClassRosterIntelligencePanel — no additional files.*

**TypeScript:** Clean.

---

### Sprint 89 — Coach Session Briefing V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Coach Briefing section added: deterministic synthesis of curriculum focus, class size, watch-for-today items (academy emphasis, players with needs/priorities/missing assignment), capture-after-class suggestions.

**TypeScript:** Clean.

---

### Sprint 90 — Premium Demo Readiness QA V1

**Files created:**
- `docs/PREMIUM_UI_DEMO_READINESS_QA.md` — QA checklist for all 5 screens, known limitations, remaining clutter risks, recommended future sprints.
- `docs/BRIAN_PREMIUM_UI_AND_COACH_INTELLIGENCE_DEMO.md` — Full demo script for Brian actor: 6 steps from curriculum command center through player profile.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 71–80: Academy Curriculum Resolution + Operating Loop V1

**Mode:** Backend utility, server action enhancements, read-only UI additions, docs. No AI API calls. No parent/player visibility. No player level changes. No package installs. No migrations.

**Migrations created:** None

---

### Sprint 71 — Academy Curriculum Resolution Engine V1

**Files created:**
- `src/lib/curriculum/academyCurriculumResolution.ts` — Resolution utility: `getActiveAcademyCurriculumVersion`, `resolveAcademyCurriculumContext`, `getAcademyOverridesForContext`, `extractOverrideFocusTags`, `buildOverrideSummaryLines`. Deterministic, read-only, no mutations.
- `docs/ACADEMY_CURRICULUM_RESOLUTION_ENGINE.md` — Architecture doc: resolution rules, function signatures, security notes, V1 limitations.

**TypeScript:** Clean.

---

### Sprint 72 — Player Curriculum Assignment Review V1

**Files created:**
- `src/app/director/players/[playerId]/PlayerCurriculumAssignmentCard.tsx` — Read-only card: shows academy curriculum version source, assigned level, active override count, override summaries, warnings. Links to /director/curriculum.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Imports `resolveAcademyCurriculumContext` and `PlayerCurriculumAssignmentCard`. Calls resolution utility per page load. Card added to skillPath slot above CurriculumProgressGrid.

**TypeScript:** Clean.

---

### Sprint 73 — Group Curriculum Assignment V1

**Files created:**
- `docs/GROUP_CURRICULUM_ASSIGNMENT_PLAN.md` — Documents that groups use `level_id → academy_levels` (not `curriculum_levels`). Gap analysis: three options (migration, join table, inference). V1: no code change, group resolution deferred.

**TypeScript:** Not applicable (docs only).

---

### Sprint 74 — Template Uses Academy Curriculum Version V1

**Files modified:**
- `src/lib/actions/curriculumContentPopulation.ts` — Imports resolution utility. Fetches active academy version + overrides after resolving curriculum level. `buildCurriculumNotes` extended with `AcademyNotesContext` param: includes `[Academy Version:]`, `[Override Focus:]`, and `ACADEMY CUSTOMIZATIONS:` sections in block notes. Content items biased toward override focus tags (focus-tagged items appear first, deterministically).

**TypeScript:** Clean.

---

### Sprint 75 — Session Generation Uses Academy Curriculum Version V1

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Imports resolution utility. After resolving curriculum level name, fetches active academy version and override summaries. `session_notes` prefix now includes `[Academy Version:]` and `[Academy Overrides: N active]` lines with summaries.

**TypeScript:** Clean.

---

### Sprint 76 — Coach Session View Shows Academy-Specific Overrides V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Imports resolution utility. `CurriculumContext` interface extended with `academyVersionName` and `overrideSummaryLines`. CURRICULUM FOCUS section shows: academy version badge (GitBranch icon), override summaries under "Academy Customizations", "Internal coach context only" guardrail note.

**TypeScript:** Clean.

---

### Sprint 77 — Player Profile Uses Academy Curriculum Version V1

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — Requirements source indicator added in notes slot above `PlayerProgressionRequirements`: shows green/grey dot, curriculum version name or "Global curriculum defaults", active override count in lime.

**TypeScript:** Clean.

---

### Sprint 78 — Evidence Links Resolve Against Academy Curriculum V1

**Files created:**
- `docs/EVIDENCE_ACADEMY_CURRICULUM_RESOLUTION_PLAN.md` — Current state, proposed V2 resolution logic, files to modify in V2, guardrails, dependencies. Implementation deferred — safe V1 fallback documented.

**TypeScript:** Not applicable (docs only).

---

### Sprint 79 — Curriculum Version Consistency Audit V1

**Files modified:**
- `src/app/director/curriculum/academy-version/page.tsx` — Added "Curriculum Connection Audit" section: queries template count with/without curriculum level, player count with/without assignment. Shows stats grid + recommendation cards (orange warnings for gaps, green confirmation when connected).

**TypeScript:** Clean.

---

### Sprint 80 — Academy Curriculum Operating Loop QA + Brian Demo V1

**Files created:**
- `docs/ACADEMY_CURRICULUM_OPERATING_LOOP_QA.md` — Full QA checklist for Sprints 71–80: resolution engine, player assignment, group gap, template population, session generation, coach view, player requirements, evidence, audit, security.
- `docs/BRIAN_ACADEMY_CURRICULUM_OPERATING_LOOP_DEMO.md` — 8-step demo script: curriculum version confirm → template population with override context → session generation → session view → player profile → requirements source → audit → global master confirmation.

**Files modified:**
- `docs/CHANGELOG.md` — Sprint 71–80 entries added.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 61–70: Academy Curriculum Clone + Voice Customization V1

**Mode:** Architecture doc, schema migration, server actions, UI components. No AI API calls. No parent/player visibility. No player level changes. No package installs.

**Migrations created:** 048

---

### Sprint 61 — Academy Curriculum Clone Architecture Plan V1

**Files created:**
- `docs/ACADEMY_CURRICULUM_CLONE_ARCHITECTURE.md` — Architecture document: global master model, academy instance model, clone strategy (reference + overrides, no physical duplication), versioning, rollback, audit strategy, risk assessment, Sprint 62–70 path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 62 — Academy Curriculum Clone Schema V1

**Files created:**
- `supabase/migrations/048_academy_curriculum_clone.sql` — Creates `academy_curriculum_versions` (per-academy lightweight reference pointer) and `academy_curriculum_overrides` (structured delta records). Full RLS (staff read, director/head_coach write), indexes, updated_at triggers.

**TypeScript:** Not applicable (SQL migration only).

---

### Sprint 63 — Academy Curriculum Clone Flow V1

**Files created:**
- `src/lib/actions/academyCurriculumClone.ts` — `createAcademyCurriculumCloneAction()`: resolves academy_id from auth profile, checks for existing active version, creates academy_curriculum_versions row (version_number=1, status=active), writes audit log.
- `src/app/director/curriculum/AcademyCurriculumVersionCard.tsx` — Client component: shows active version status + override count, or "Create" button if none exists.

**Files modified:**
- `src/app/director/curriculum/page.tsx` — Added `AcademyCurriculumVersionCard` (queries academy_curriculum_versions + override count) and `VoiceOverrideInputPanel`. Added "Academy Version" to quick-nav links.

**TypeScript:** Clean.

---

### Sprint 64 — Voice Curriculum Override Draft Parser V1

**Files created:**
- `src/lib/actions/curriculumOverrideDraft.ts` — `createCurriculumOverrideDraftAction(rawInput)`: deterministic parser (no AI) for level names, pathway words, focus keywords, scope words. Creates `proposed_actions` row with `target_module = 'curriculum_override'`.
- `src/app/director/curriculum/VoiceOverrideInputPanel.tsx` — Client component: textarea input, submit to `createCurriculumOverrideDraftAction`, shows draft created confirmation.

**TypeScript:** Clean.

---

### Sprint 65 — Curriculum Override Review Queue V1

**Files created:**
- `src/app/director/review/CurriculumOverrideDraftCard.tsx` — Shows raw input, parsed level/pathway/focus/scope, proposed change summary, affected targets, warnings, clarification questions. Shows decision controls for pending, apply controls for approved.
- `src/app/director/review/CurriculumOverrideDraftDecisionControls.tsx` — Client component: approve / reject / clarification_needed buttons for curriculum override drafts.

**Files modified:**
- `src/app/director/review/actions.ts` — Added `updateCurriculumOverrideDraftDecisionAction()` and `applyApprovedCurriculumOverrideDraftAction()`.
- `src/app/director/review/page.tsx` — Added curriculum override draft fetch (step 24–27), enriched items assembly, "Curriculum Override Drafts" section, updated `PageHeader` props.

**TypeScript:** Clean.

---

### Sprint 66 — Approved Curriculum Override Application Guardrails V1

**Files created:**
- `src/app/director/review/ApplyCurriculumOverrideDraftControls.tsx` — Client component: "Apply Academy Curriculum Override" button calling `applyApprovedCurriculumOverrideDraftAction`.

**TypeScript:** Clean. (Action in actions.ts, Sprint 65.)

---

### Sprint 67 — Academy Curriculum Version + Override List V1

**Files created:**
- `src/app/director/curriculum/academy-version/page.tsx` — Read-only director view: version summary card, applied overrides list, rolled-back overrides list, guardrail copy. Uses `CurriculumOverrideDiffCard` and `RollbackOverrideButton`.

**TypeScript:** Clean.

---

### Sprint 68 — Curriculum Diff / Impact Preview V1

**Files created:**
- `src/app/director/curriculum/academy-version/CurriculumOverrideDiffCard.tsx` — Before/after comparison per override. Shows original_snapshot or "Global default", applied change summary, downstream impact preview ("Impact partially inferred"), rollback button for applied overrides.

**TypeScript:** Clean.

---

### Sprint 69 — Rollback Academy Override V1

**Files created:**
- `src/lib/actions/rollbackCurriculumOverride.ts` — `rollbackAcademyCurriculumOverrideAction(overrideId)`: verifies auth/academy/role/status, inserts rollback record (`rollback_of_override_id` set), marks original as `rolled_back`, writes audit log.
- `src/app/director/curriculum/academy-version/RollbackOverrideButton.tsx` — Client component: two-click confirm rollback flow.

**TypeScript:** Clean.

---

### Sprint 70 — Academy Curriculum Clone + Voice Customization QA / Demo V1

**Files created:**
- `docs/ACADEMY_CURRICULUM_CLONE_QA.md` — QA checklist covering all 9 workflow steps, security checks, and known V1 limitations.
- `docs/BRIAN_CURRICULUM_VOICE_CUSTOMIZATION_DEMO.md` — Full 10-step demo script from global curriculum view through rollback, with expected behavior at each step.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprint 60.5: Director Curriculum Landing Page V1

**Mode:** Read-only page only. No schema changes. No migrations. No mutations. No package installs.

### Sprint 60.5 — Director Curriculum Landing Page V1

**Files created:**
- `src/app/director/curriculum/page.tsx` — Read-only landing page at `/director/curriculum`. Fixes the 404 for that route. Resolves `academy_id` from `profiles` using existing director page patterns. Shows 5 section cards: Global / Academy Curriculum Spine, Orange Ball Starter Content, Curriculum-Aware Templates, Coach Session Curriculum Context, and Next steps. Queries `curriculum_levels` (typed), `curriculum_track_requirements` (rawDb), `curriculum_content_items` (rawDb), `curriculum_content_requirement_mappings` (rawDb), and `templates.curriculum_level_id` (rawDb) — all with error checks; shows "Not available until curriculum migrations are applied." if any new-table query fails. Links to `/director/fitness/templates`, `/director/sessions`, `/director/players`, `/director/review`.

**TypeScript:** Clean.

---

## 2026-05-01 — Sprints 51–60: Curriculum Content Engine V1

**Mode:** New schema, seed data, server actions, and UI components. No AI API calls. No parent/player visibility. No player level changes. No package installs.

**Migrations created:** 045, 046, 047

---

### Sprint 51 — Curriculum Content Model Audit V1

**Files created:**
- `docs/CURRICULUM_CONTENT_MODEL_AUDIT.md` — Audit of existing curriculum spine, requirements, exercise/template schema. Documents what exists, what is missing, recommended new tables, risk assessment, and Sprint 52–60 path.

**TypeScript:** Not applicable (docs only).

---

### Sprint 52 — Drill / Game / Skill Content Schema Plan V1

**Files created:**
- `docs/CURRICULUM_CONTENT_SCHEMA_PLAN.md` — Full schema definition for `curriculum_content_items` and `curriculum_content_requirement_mappings`. Includes field list, RLS strategy, index plan, content type → block type mapping, and implementation roadmap.

**TypeScript:** Not applicable (docs only).

---

### Sprint 53 — Curriculum Content Tables / Seed Structure V1

**Files created:**
- `supabase/migrations/045_curriculum_content_library.sql` — Creates `curriculum_content_items` (drills, games, skills, assessments with coaching metadata), `curriculum_content_requirement_mappings` (content → requirement FK links), and adds `curriculum_level_id` column to `templates`. Full RLS, indexes, update_at trigger.

**TypeScript:** Not applicable (SQL migration only).

---

### Sprint 54 — Orange Ball Curriculum Content Pack V1

**Files created:**
- `supabase/migrations/046_orange_ball_content_pack.sql` — Seeds 29 global-default content items across Orange 1 (9), Orange 2 (10), Orange 3 (10). All items include success criteria, coach cues, progressions, regressions, parent-safe names.
- `docs/ORANGE_BALL_CURRICULUM_CONTENT_PACK.md` — Describes the content pack: content counts, content quality notes, block type mapping reference.

**TypeScript:** Not applicable (SQL migration + docs only).

---

### Sprint 55 — Content-to-Requirement Mapping V1

**Files created:**
- `supabase/migrations/047_content_requirement_mappings_seed.sql` — Maps 29 Orange Ball content items to 32 Orange Ball requirements using develops/assesses/reinforces mapping types. Idempotent via ON CONFLICT DO NOTHING. Guards: resolves all IDs by natural key, skips silently if any ID is missing.

**TypeScript:** Not applicable (SQL migration only).

---

### Sprint 56 — Curriculum-Aware Template Block Population V1

**Files created:**
- `src/lib/actions/curriculumContentPopulation.ts` — Server action `populateTemplateBlocksFromCurriculumAction`. Reads template's `curriculum_level_id`, fetches matching content items, writes structured curriculum notes (drills, games, cues, success criteria) to `template_blocks.notes` for each empty block. Skips blocks with existing notes. Returns per-block results.
- `src/app/director/fitness/templates/[templateId]/PopulateCurriculumBlocksButton.tsx` — Client button that calls the population action. Shows per-block detail expandable results.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Added imports for `PopulateCurriculumBlocksButton` and `CurriculumLevelSelector`.

**TypeScript:** Clean.

---

### Sprint 57 — Director Template Builder Curriculum Focus Selector V1

**Files created:**
- `src/app/director/fitness/templates/[templateId]/setCurriculumLevelAction.ts` — Server action to update `templates.curriculum_level_id`. Auth + role + academy + level ID validation. Revalidates template page path.
- `src/app/director/fitness/templates/[templateId]/CurriculumLevelSelector.tsx` — Client component with grouped dropdown (by stage), Save button, saved confirmation. Uses `useTransition` for optimistic UX.
- `docs/CURRICULUM_TEMPLATE_POPULATION_LIMITATIONS.md` — Documents 4 known V1 limitations: no exercise row insertion, rawDb cast for new column, no force-refresh, Orange Ball only.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Fetches `curriculum_level_id` and all curriculum levels. Renders `CurriculumLevelSelector` and `PopulateCurriculumBlocksButton` in a new Curriculum card above the Exercise Population section.

**TypeScript:** Clean.

---

### Sprint 58 — Generated Session Plan from Curriculum Template V1

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Now fetches `curriculum_level_id` from the template alongside name. If a curriculum level exists, its name is prepended to `session.session_notes` as `[Curriculum: {levelName}]`. Block notes (already containing curriculum content from Sprint 56) are copied to session_blocks.notes unchanged — curriculum context flows automatically.

**TypeScript:** Clean.

---

### Sprint 59 — Coach Session Curriculum Context V1

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — Extended template fetch to also read `curriculum_level_id`. Resolves level `display_name` and `stage`. Renders a `CURRICULUM FOCUS` section card above Group Assignment showing the level name, stage, and a note that block notes contain curriculum content for the coach.

**TypeScript:** Clean.

---

### Sprint 60 — Curriculum Content QA + Demo Readiness V1

**Files created:**
- `docs/CURRICULUM_CONTENT_ENGINE_QA.md` — QA checklist: schema checks, TypeScript check, 10-step manual walkthrough, known limitations table, expected git status.
- `docs/BRIAN_CURRICULUM_DEMO_SCRIPT.md` — 8-scene demo script for director persona. Covers: requirements → content → mappings → template level selector → block population → session generation → curriculum context panel → player progress loop.

**TypeScript:** Clean.

---

## 2026-05-01 — Claude Code Operating System Setup

**Mode:** Config/docs only. No runtime behavior changed. No schema changes. No package installs.

**Purpose:** Set up reusable Claude Code skills, subagent definitions, guardrails, and documentation to make future Academy OS sprints safer and more autonomous.

**Files created:**
- `CLAUDE.md` — appended sprint execution protocol, git hygiene rules, security guardrails, protected files list, TypeScript validation requirement, and available commands reference
- `.claude/commands/academy-sprint.md` — invokable `/academy-sprint` skill: full sprint execution workflow with inspect → plan → implement → validate → report phases
- `.claude/commands/academy-guardrails.md` — invokable `/academy-guardrails` skill: product safety checklist (data visibility, mutations, communications, RLS, scope)
- `.claude/commands/supabase-sprint.md` — invokable `/supabase-sprint` skill: Supabase-specific sprint protocol (academy_id scoping, proposed_actions pattern, migration rules, type handling)
- `.claude/commands/review-queue-workflow.md` — invokable `/review-queue-workflow` skill: standard draft → review → approve → apply pattern with code templates
- `.claude/commands/voice-workflow.md` — invokable `/voice-workflow` skill: voice-first patterns, ambiguity handling, attendance exception example
- `.claude/agents/schema-auditor.md` — read-only schema review subagent (migration necessity, academy_id scoping, RLS coverage, type alignment)
- `.claude/agents/guardrail-auditor.md` — read-only product safety review subagent (visibility leaks, auto-mutations, communications, RLS bypass, audit trail)
- `docs/CLAUDE_CODE_OPERATING_SYSTEM.md` — human-readable guide: command reference, sprint patterns, batch sprint workflow, commit strategy, stop conditions
- `docs/CLAUDE_CODE_HOOKS_PLAN.md` — documented-only hooks plan: 6 recommended hooks (TypeScript check, protected file warning, git status, package install guard, .env guard, database.types.ts guard)

**Validation:**
- `npx tsc --noEmit` — not affected (docs/config only, no source files modified)
- `git status --short` — only intentional files in scope

---

## 2026-05-01 — Sprints 43–50: Attendance Exception Workflow + Fitness Gap + Recommendation Drafts

**Mode:** New features. No schema changes. No parent/player visibility. No AI API calls.

**Architecture pattern honored throughout:** Voice creates → UI confirms → DB structures → System executes. All writes go through `proposed_actions` pipeline. All drafts start at `pending_review`.

---

### Sprint 43 — Voice Attendance Exception Drafts V1

**Files created:**
- `src/app/director/sessions/[sessionId]/attendanceExceptionDraftAction.ts`
- `src/app/director/sessions/[sessionId]/AttendanceExceptionDraftPanel.tsx`

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx`

Rule-based attendance exception parser. Detects "everyone except X" pattern, extracts absent names, flags unrostered attendees (e.g. "Jeremy showed up"). Creates `proposed_actions` draft with `target_module = 'attendance_exception'` and `status = 'pending_review'`. Session detail page shows existing drafts with status pills.

---

### Sprint 44 — Attendance Exception Director Review Queue V1

**Files created:**
- `src/app/director/review/AttendanceExceptionDraftCard.tsx`
- `src/app/director/review/AttendanceExceptionDraftDecisionControls.tsx`

**Files modified:**
- `src/app/director/review/page.tsx`

Review queue now displays attendance exception drafts in a dedicated section. Each card shows raw input, parsed rostered attendance, and unrostered attendee warnings. Decision controls (Approve / Needs Clarification / Reject) follow the same pattern as existing draft controls.

---

### Sprint 45 — Attendance Exception Decision Controls V1

**Files created:**
- `src/app/director/review/ApplyApprovedAttendanceExceptionControls.tsx`

**Files modified:**
- `src/app/director/review/actions.ts`

Added `updateAttendanceExceptionDraftDecisionAction` and `applyApprovedAttendanceExceptionAction`. Apply action upserts `session_attendance` rows for rostered players only (`on_conflict: session_id,player_id`), writes audit_log, marks draft `executed`. Unrostered attendees (e.g. Jeremy) are never applied.

---

### Sprint 46 — Fitness Template Block Exercise Population V1

**Files created:**
- `src/app/director/fitness/templates/[templateId]/populateFitnessBlocksAction.ts`
- `src/app/director/fitness/templates/[templateId]/PopulateFitnessBlocksButton.tsx`
- `docs/FITNESS_EXPOSURE_TRACKING_PLAN.md`

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx`

"Populate Blocks with Exercises" button on template detail page. Matches exercises from the exercise library to each block by category and duration budget. Already-populated blocks are skipped. Returns per-block result counts.

---

### Sprint 47 — Fitness Assessment + Attendance Gap Logic Plan V1

**Files created:**
- `src/lib/fitness/gapLogic.ts`
- `docs/FITNESS_GAP_LOGIC_PLAN.md`

Pure deterministic utility: `computeFitnessGaps(inputs: GapInputs): FitnessGapAssessment`. No DB access, no AI API. Scores 8 fitness categories from assessment dimensions, missed session exposure, completed exercise categories, and coach note tags. Respects overtraining signals and injury constraints. Top gaps capped at 3.

---

### Sprint 48 — At-Home Fitness Recommendation Drafts V1

**Files created:**
- `src/app/director/players/[playerId]/fitnessHomeworkRecommendationAction.ts`
- `src/app/director/players/[playerId]/FitnessHomeworkRecommendationButton.tsx`

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx`

Director-triggered server action that reads attendance, assessments, coach notes, and active signals, calls `computeFitnessGaps()`, and creates a `fitness_homework_recommendation_v1` proposed_actions draft. Internal only — not visible to player or parent until explicit director approval and publication.

---

### Sprint 49 — Parent/Player-Safe Fitness Homework Draft V1

**Files created:**
- `src/app/director/players/[playerId]/parentPlayerFitnessHomeworkDraftAction.ts`

Converts an approved internal fitness recommendation into a `parent_player_fitness_homework_summary_v1` draft. Uses safe category language templates (no medical terminology). Status: `pending_review` — never auto-published.

---

### Sprint 50 — Internal Development Loop QA + Demo Readiness

**Files created:**
- `docs/INTERNAL_DEVELOPMENT_LOOP_QA.md`

Full QA checklist and 7-step demo script covering the complete flow: fitness template → populate blocks → attendance exception → director review → apply → coach observations as evidence → requirement progress → fitness gap recommendation.

**Known limitations at Sprint 50:**
- Fitness recommendation drafts not yet shown in the director review queue (next sprint)
- No parent/player publication pathway yet
- Fitness exposure aggregation not pre-aggregated (computable from existing tables)
- Unrostered attendee decision UI not yet built
- Coach workspace attendance recording not yet built

**Validation:**
- `npx tsc --noEmit` — passes with 0 errors

---

## 2026-05-01 — Sprint 42: Requirement Progress Dashboard Polish + QA V1

**Mode:** Polish + QA. No new core workflow. No schema changes. No new mutations. No parent/player visibility.

**Objective:** Improve visual hierarchy, reduce redundancy, and improve scannability of the director-facing Level-Up Requirements section without changing any business logic.

**Files inspected:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx`
- `src/app/director/players/[playerId]/LevelReadinessSummary.tsx`
- `src/app/director/players/[playerId]/RequirementEvidenceDetailList.tsx`
- `src/app/director/players/[playerId]/RequirementProgressConfirmationControls.tsx`
- `src/app/director/players/[playerId]/types.ts`
- `src/app/director/players/[playerId]/page.tsx`
- `src/components/ui/index.ts`

**Files changed:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx`
- `src/app/director/players/[playerId]/LevelReadinessSummary.tsx`
- `src/app/director/players/[playerId]/RequirementProgressConfirmationControls.tsx`
- `docs/CHANGELOG.md`

**Polish applied:**

*`PlayerRequirementProgressReadOnly.tsx`*
- Removed the redundant "Displaying requirements for / [level name]" banner — `LevelReadinessSummary` already shows the current level name in its header, making the banner a visual duplicate.
- `DomainSection` header now shows `evidence_needed` and `blocked` counts alongside `met` / `in_progress` / `not_started`, all guarded behind `> 0` so clean domain headers show nothing unnecessary. Previously "0 not started" always appeared even when all requirements were met.

*`LevelReadinessSummary.tsx`*
- Removed the 4-line footer guardrail block. The top guardrail ("Internal readiness signal only…") in the same component already covers the intent. Removing the footer reduces repetition without removing the guardrail.
- Overall counts: zero-value rows now hidden except "Total requirements" and "Total evidence links" (always shown for reference). Removes visual noise on players with no blocked/evidence_needed rows.
- Domain breakdown: zero-value stats now hidden except "Total" per domain. A domain with all requirements met no longer lists every other status at 0.

*`RequirementProgressConfirmationControls.tsx`*
- Added a "Current saved: [label]" indicator that appears below the status picker only when the user has selected a different status than the current DB value. Previously, once you clicked a different status option, there was no visual reminder of what the current saved state was.

**What was not changed:**
- No server action logic touched
- No readiness label calculation changed
- No evidence application behavior changed
- No requirement confirmation behavior changed
- No parent/player visibility
- No migrations
- No new packages
- `RequirementEvidenceDetailList.tsx` — clean, no changes needed
- `types.ts` — clean, no changes needed

**Validation:**
- `npx tsc --noEmit` — passes with 0 errors

**Manual QA checklist (to verify before commit):**
1. Open `/director/players/[playerId]` → Notes tab
2. Confirm Level-Up Requirements section hierarchy: Summary → Domains → Cards → Evidence → Confirmation
3. Confirm Level Readiness Summary appears above domain groups (no duplicate level name banner above it)
4. Confirm domain headers show only non-zero counts
5. Confirm Overall counts in summary hide zero-value statuses (except totals)
6. Confirm domain breakdown stats are compact (no "Blocked: 0" rows)
7. Confirm evidence toggle still works
8. Confirm "No official evidence linked yet" shows on cards with no evidence
9. Confirm status picker shows "Current saved: X" when a different option is selected
10. Confirm no promote / level movement button exists
11. Confirm no parent/player visibility controls
12. Confirm viewing page does not mutate DB
13. Confirm Sprint 36 evidence draft button still appears
14. Confirm Sprint 40 evidence details still display when toggled

---

## 2026-05-01 — Sprint 41: Level Readiness Summary V1

**Mode:** Implementation + validation. Read-only internal summary only. No mutations. No level movement. No parent/player visibility.

**Schema fields confirmed:**

`v_player_requirement_progress_detail` (from migration 041):
- `progress_id`, `academy_id`, `player_id`, `curriculum_level_id`, `requirement_id` ✓
- `requirement_title`, `requirement_description`, `requirement_type` ✓
- `requirement_domain_key` (`skill | competition | fitness`), `requirement_domain_label` ✓
- `level_display_name`, `level_number` ✓
- `status` (`not_started | in_progress | evidence_needed | met | waived | blocked`) ✓
- `progress_value`, `evidence_count`, `last_evidence_at` ✓
- `is_required`, `is_parent_visible`, `is_player_visible` ✓
- `domain_display_order`, `requirement_display_order` ✓
- No new DB query needed — uses already-loaded `requirementProgressRows` from page.tsx ✓

**Files created:**
- `src/app/director/players/[playerId]/LevelReadinessSummary.tsx` — read-only summary component; accepts `rows: RequirementProgressRow[]` and `currentLevelName: string | null`; computes all values from client-side data, no new fetch; returns `null` when `rows.length === 0`

**Files modified:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx` — imports `LevelReadinessSummary`; renders it between the current level context banner and the domain sections (inside the `rows.length > 0` branch only)

**Summary behavior:**

*Overall counts* — computed from `requirementProgressRows`:
- total requirements, met, in progress, evidence needed, blocked, waived, not started, total evidence links

*Domain breakdown* — computed per `skill | competition | fitness` key:
- total, met, in progress, evidence needed, blocked, not started, evidence links

*Readiness label* — derived from required-row percentages, no DB write:
| Condition | Label |
|---|---|
| No rows or no required rows | Not Configured |
| 0 met and 0 total evidence | Not Started |
| < 25% required met | Building Foundation |
| 25–49% required met | Developing |
| 50–74% required met | Strong Progress |
| 75–89% required met, no blocked | Nearly Ready |
| 75–89% required met, blocked exists | Strong Progress |
| ≥ 90% required met, no blocked, no evidence_needed | Ready for Director Review |
| ≥ 90% required met, blocked or evidence_needed | Nearly Ready |

*Readiness explanation* — deterministic sentence derived from status counts and domain strength; no AI API.

*Guardrails copy* (two locations):
- Top: "Internal readiness signal only. This does not move the player up, change levels, or publish anything to parents."
- Footer: four lines confirming internal-only nature and no automatic promotion.

**What was NOT built (by design):**
- No promote button, level-up approval, or promotion workflow
- No readiness score written to DB
- No parent/player portal changes
- No AI API calls
- No new migrations
- No package installs
- No parent communication
- No automatic level movement of any kind

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm an Orange Ball player has `player_requirement_progress` rows in Supabase.
2. Open `/director/players/[playerId]` → Notes tab → Level-Up Requirements.
3. Confirm Level Readiness Summary appears above the Skill / Competition / Fitness domain groups.
4. Confirm current level name appears in the summary header if available.
5. Confirm total requirement count in summary matches the visible requirement cards.
6. Confirm Skill / Competition / Fitness domain breakdown appears.
7. Confirm readiness label changes based on the mix of statuses (e.g. all not_started → "Not Started").
8. Confirm no promote / level movement button exists anywhere in the summary.
9. Confirm guardrail copy is visible at top and footer.
10. Confirm no DB rows change from simply viewing the summary.
11. Confirm parent/player portal views are unchanged.
12. Confirm Sprint 39 manual confirmation controls still work.
13. Confirm Sprint 40 evidence detail toggles still work.

**git add command:**
```
git add src/app/director/players/[playerId]/LevelReadinessSummary.tsx src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx docs/CHANGELOG.md
```

---

## 2026-05-01 — Sprint 40: Requirement Evidence Detail View V1

**Mode:** Implementation + validation. Read-only evidence display. No mutations. No status changes. No parent/player visibility.

**Files created:**
- `src/app/director/players/[playerId]/types.ts` — `RequirementEvidenceDetailRow` interface (local type; `requirement_evidence_links` not yet in `database.types.ts`)
- `src/app/director/players/[playerId]/RequirementEvidenceDetailList.tsx` — read-only evidence display component; renders each evidence link with type badge, confidence %, created date, internal indicator, evidence summary, coach observation snippet, and creator name

**Files modified:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx` — imported `useState`, `RequirementEvidenceDetailList`, `RequirementEvidenceDetailRow`; added `evidenceByProgressId?: Record<string, RequirementEvidenceDetailRow[]>` to `Props`; threaded through `DomainSection` → `RequirementCard`; `RequirementCard` now has toggle state (`showEvidence`) and renders a collapsible Evidence section above the confirmation controls
- `src/app/director/players/[playerId]/page.tsx` — imported `RequirementEvidenceDetailRow`; after `requirementProgressRows` loads, sequentially fetches: (1) `requirement_evidence_links` scoped to `academy_id + player_id + player_requirement_progress_id IN progressIds`; (2) `coach_observations` snippets for `evidence_type = 'coach_observation'` scoped to `academy_id + player_id`; (3) creator `display_name` from `profiles`; builds `evidenceByProgressId` map with enrichments; passes to `PlayerRequirementProgressReadOnly`

**Evidence display UX:**
- Each requirement card has an "Evidence" section header below the meta row, above the confirmation controls
- If no evidence: static "No official evidence linked yet."
- If evidence exists: collapsed by default, "Show N item(s)" toggle button to expand
- Expanded view shows each evidence row: type badge, confidence %, date, internal indicator (EyeOff), evidence summary text, coach observation snippet (observation type label + date + up to 250-char content excerpt), creator name
- "Internal evidence only. Not visible to parents or players." copy shown when expanded
- If `evidence_count > 0` but rows fail to load: warning "Evidence count exists, but details could not be loaded."

**Coach observation snippet:**
- Fetched from `coach_observations` table scoped to `academy_id + player_id`
- Matched by `evidence_id` (soft FK from `requirement_evidence_links.evidence_id`)
- Shows `observation_type`, `created_at`, and up to 250 chars of `content`
- Not exposed to parent/player views — staff portal only

**Data fetching:**
- Server-side in `page.tsx` (server component)
- Sequential queries per `AI_BACKEND_RULES.md` rule 5
- `rawDb = supabase as any` cast used — `requirement_evidence_links` not yet in `database.types.ts`
- No service role. All queries go through authenticated session with RLS enforced.

**Security:**
- `academy_id` resolved from authenticated session profile — never from client input
- Evidence links queried with `academy_id + player_id` double-scope
- Observation snippets queried with same `academy_id + player_id` scope
- Cross-academy data not accessible

**Sprint 39 confirmation controls:**
- Untouched. Status picker, note textarea, Confirm Status button, and `router.refresh()` all continue to work.

**What was NOT built (by design):**
- No evidence creation, editing, deletion, or unlinking
- No automatic requirement status updates from evidence
- No level-up readiness scoring or promotion workflow
- No parent/player portal views
- No `is_parent_safe` toggle
- No AI API calls
- No new migrations
- No package installs
- No parent communication

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm migrations 041–044 applied to live DB
2. Confirm at least one Orange Ball player has `player_requirement_progress` rows
3. Confirm at least one requirement has official `requirement_evidence_links` from Sprint 38
4. Open `/director/players/[playerId]` → Notes tab → Level-Up Requirements
5. Confirm requirements with `evidence_count > 0` show "Show N item(s)" toggle
6. Click toggle — confirm evidence details expand: summary, type, confidence, date, internal indicator
7. If evidence_type = `coach_observation`, confirm observation snippet appears
8. Confirm requirements with no evidence show "No official evidence linked yet."
9. Click "Hide" — confirm evidence collapses
10. Confirm status confirmation controls (Sprint 39) still work
11. Confirm `requirement_evidence_links` rows are unchanged
12. Confirm `player_requirement_progress.evidence_count` / `status` unchanged from viewing
13. Confirm parent/player views unchanged

---

## 2026-05-01 — Sprint 39: Requirement Progress Confirmation Workflow V1

**Mode:** Implementation + validation. Manual confirmation only. No automatic status inference. No level movement. No parent/player visibility.

**Files created:**
- `src/app/director/players/[playerId]/requirementProgressConfirmationAction.ts` — `confirmRequirementProgressStatusAction` server action (security chain, status validation, confirmer field logic, audit log)
- `src/app/director/players/[playerId]/RequirementProgressConfirmationControls.tsx` — client component: status picker buttons, optional note textarea, guardrail copy, save button with pending state, success/error feedback, `router.refresh()` on success

**Files modified:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx` — added `ConfirmAction` type alias, added `confirmAction?` prop to `Props`; threaded `confirmAction` through `DomainSection` → `RequirementCard`; `RequirementCard` renders `RequirementProgressConfirmationControls` when `confirmAction` is present
- `src/app/director/players/[playerId]/page.tsx` — imported `confirmRequirementProgressStatusAction`; bound it with `params.playerId` via `.bind()`; passed as `confirmAction` to `PlayerRequirementProgressReadOnly`

**Server action — `confirmRequirementProgressStatusAction`:**
- Signature: `confirmRequirementProgressStatusAction(playerId, progressId, newStatus, note?)`
- `playerId` bound from server component; `progressId`, `newStatus`, `note` supplied by client
- Security chain: `assertNotPreviewMode` → auth → resolve `academy_id` from `profiles` → verify active membership (director/head_coach only) → verify player belongs to academy → fetch `player_requirement_progress` → verify `academy_id` + `player_id` match → validate `newStatus` ∈ allowed values → validate note ≤ 1000 chars
- Database writes: updates `player_requirement_progress` (status, notes if provided, confirmer fields); writes `audit_logs`
- No service role. No RLS bypass. All writes go through the anon client with active RLS.

**Confirmer field logic:**
- `newStatus = 'met'` + role `academy_director` → `director_confirmed_by = user.id`, `confirmed_at = now()`
- `newStatus = 'met'` + role `head_coach` → `coach_confirmed_by = user.id`, `confirmed_at = now()`
- Moving FROM `met` to any other status → clears `confirmed_at`, `director_confirmed_by`, `coach_confirmed_by`
- Neither old nor new status is `met` → confirmer fields left unchanged

**Notes handling:**
- If `note` provided → `notes = note.trim()` (empty string → `null`)
- If `note` not provided → existing notes preserved (field excluded from update payload)

**Audit log:**
- Action: `requirement_progress.status_confirmed`
- Target type: `player_requirement_progress`
- Payload: `player_id`, `old_status`, `new_status`, `note_present`, `evidence_count`, `role`, `confirmed_by`

**Evidence display:**
- Existing `evidence_count` and `last_evidence_at` already shown in each requirement row
- Detailed expandable evidence display deferred to Sprint 40

**What was NOT built (by design):**
- No automatic status change based on `evidence_count`
- No level-up recommendation
- No player level or profile field mutations
- No player priorities mutation
- No parent/player portal views or `is_parent_visible`/`is_player_visible` controls
- No parent communication
- No AI API calls
- No new migrations
- No package installs
- No batch confirmation
- No drag-and-drop

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm migrations 041–044 applied to live DB
2. Confirm an Orange Ball player has `player_requirement_progress` rows
3. Open `/director/players/[playerId]` → Notes tab → Level-Up Requirements section
4. Each requirement card now shows status picker buttons + note field + guardrail copy
5. Change one status from `not_started` to `in_progress` → click "Confirm Status"
6. Confirm success message "Status confirmed." and page refreshes
7. Confirm `player_requirement_progress.status` updated in DB
8. Confirm `player_requirement_progress.evidence_count` did NOT change
9. Confirm `requirement_evidence_links` did NOT change
10. Confirm player level did NOT change
11. Change one status to `met` → confirm `confirmed_at` + confirmer field set in DB
12. Check `audit_logs` for `requirement_progress.status_confirmed` entry
13. Confirm parent/player views unchanged

---

## 2026-05-01 — Sprint 38: Approved Evidence Link Application Guardrails

**Mode:** Implementation + validation. Guarded application only. No requirement status mutation. No automatic progress confirmation.

**Files created:**
- `src/app/director/review/ApplyEvidenceRequirementDraftControls.tsx` — client component: "Create Official Evidence Links" button with guardrail copy; calls `applyApprovedEvidenceRequirementDraftAction`; pending + success + error states; refreshes router on success

**Files modified:**
- `src/app/director/review/actions.ts` — added `applyApprovedEvidenceRequirementDraftAction` server action (full security chain, duplicate check, inserts, progress update, audit log, proposed_actions → executed)
- `src/app/director/review/EvidenceRequirementDraftCard.tsx` — approved drafts now render `ApplyEvidenceRequirementDraftControls` instead of static lime banner; pending drafts still show `EvidenceRequirementDraftDecisionControls`; status banner is now conditional (lime for approved, orange for pending)
- `src/app/director/review/page.tsx` — added `evidenceApprovedCount` to `PageHeader` props and `totalReadyToApply`; updated section label from "Ready for Future Evidence Application" to "Approved — Ready to Apply"; updated badge text from "approved" to "ready to apply"

**Apply action — `applyApprovedEvidenceRequirementDraftAction`:**
- Security chain: `assertNotPreviewMode` → auth → resolve `academy_id` from profile → verify active membership (director/head_coach) → fetch `proposed_action` → verify `academy_id`, `status = approved`, `target_module = requirement_evidence_link`, `target_object_type = player`, `draft_type = requirement_evidence_link_v1` → verify player belongs to same academy
- Payload validation: validates each link has `coach_observation_id`, `requirement_progress_id`, `requirement_id`, `evidence_type = coach_observation`; confidence between 0–1 if present
- Cross-verification: fetches `coach_observations` and `player_requirement_progress` — verifies both belong to same academy + player; verifies `requirement_id` in link matches the progress row's `requirement_id`
- Duplicate protection: application-level check on `(academy_id, player_id, requirement_id, evidence_type, evidence_id)` — no unique constraint on `requirement_evidence_links`; skips duplicates silently; returns error if all are duplicates

**Database write strategy:**
- Inserts `requirement_evidence_links` rows for non-duplicate links
  - `evidence_type = 'coach_observation'`, `evidence_id = coach_observation_id`, `is_parent_safe = false`
- Updates `player_requirement_progress` for each affected progress row:
  - `evidence_count` = actual SELECT COUNT(*) from `requirement_evidence_links` (idempotent — safe to retry)
  - `last_evidence_at` = max `created_at` among all evidence links for that progress row
  - `status` is NOT changed — requirement confirmation is a separate future workflow
- Writes to `audit_logs` (action: `requirement_evidence_link.applied`) — `action_execution_logs` has no INSERT RLS
- Marks `proposed_actions.status = executed` after all writes succeed

**UI behavior:**
- Button label: "Create Official Evidence Links"
- Pending state: "Creating evidence links…"
- Success: "Official evidence links created." + `router.refresh()`
- After refresh: executed drafts drop from queue (query filters `status IN (pending_review, approved)`)
- Error states: "Only approved evidence link drafts can be applied." / "This draft does not contain valid evidence links." / "All proposed evidence links already exist. No duplicates were created."

**What was NOT built (by design):**
- No mark requirements met
- No mark requirement in_progress
- No change to `player_requirement_progress.status`
- No level-up recommendation
- No player level or profile field mutations
- No parent/player portal views or communication
- No AI API calls
- No migrations
- No package installs
- No batch apply-all

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm at least one `proposed_actions` row with `target_module = requirement_evidence_link`, `status = approved`, `draft_type = requirement_evidence_link_v1`
2. Open `/director/review`
3. Confirm approved evidence draft shows "Create Official Evidence Links" button with guardrail copy
4. Click "Create Official Evidence Links"
5. Confirm success message "Official evidence links created."
6. Confirm `requirement_evidence_links` rows exist: `evidence_type = coach_observation`, `evidence_id = coach_observation_id` from payload, `requirement_id` matches payload, `player_requirement_progress_id` matches payload, `is_parent_safe = false`
7. Confirm `player_requirement_progress.evidence_count` updated
8. Confirm `player_requirement_progress.last_evidence_at` updated
9. Confirm `player_requirement_progress.status` did NOT change
10. Confirm player level did NOT change
11. Confirm `coach_observations` did NOT change
12. Confirm parent/player views did NOT change
13. Confirm `proposed_actions.status = executed`
14. Try applying same draft again or navigate back — confirm duplicates are blocked/skipped safely
15. Confirm session recap and priority recommendation sections still work correctly

---

## 2026-05-01 — Sprint 37: Evidence Requirement Draft Review Queue V1

**Mode:** Review visibility and decision controls only. No official evidence-link application. No requirement progress mutation.

**Files created:**
- `src/app/director/review/EvidenceRequirementDraftDecisionControls.tsx` — client component: approve / needs clarification / reject buttons; calls `updateEvidenceRequirementDraftDecisionAction`; optional decision note (max 1000 chars); refreshes router on success
- `src/app/director/review/EvidenceRequirementDraftCard.tsx` — display card: player name, proposer, created date, status, proposed link count, domain breakdown (skill / competition / fitness), first 5 requirement titles with domain tag + confidence %, evidence summaries; draft-only warnings; View Player Profile link; decision controls for pending drafts; approved banner for approved drafts

**Files modified:**
- `src/app/director/review/page.tsx` — added evidence link draft fetch (steps 14–18); player name batch lookup; proposer batch lookup; enriched item assembly; "Evidence Link Drafts" section with pending + optional approved subsection; updated `PageHeader` to include `evidencePendingCount` in total pending badge

**Review queue behavior:**
- New "Evidence Link Drafts" section appears after the existing Priority Recommendation Drafts section on `/director/review`
- Fetches `proposed_actions` where `target_module = requirement_evidence_link`, `status IN (pending_review, approved)`, `academy_id = current academy`
- Post-fetch filter: `proposed_payload.draft_type = requirement_evidence_link_v1`
- Pending drafts shown in main subsection with decision controls
- Approved drafts shown in "Approved — Ready for Future Evidence Application" subsection; no apply button
- Empty state shown when no pending or approved evidence link drafts exist

**Decision behavior:**
- `updateEvidenceRequirementDraftDecisionAction` (already in `actions.ts` from Sprint 36) handles approve / reject / clarification_needed
- Updates only `proposed_actions.status` + reviewer tracking fields (`approved_by`, `approved_at`, `rejected_by`, `rejected_at`, `reviewer_notes`, `rejection_reason`)
- Verifies: authenticated user, academy membership (director or head_coach), `academy_id` match, `target_module = requirement_evidence_link`, `target_object_type = player`, `draft_type = requirement_evidence_link_v1`, `status = pending_review`

**Database read/write strategy:**
- Reads: `proposed_actions`, `players` (name lookup), `profiles` (proposer name lookup) — all scoped to `academy_id`
- Writes: `proposed_actions` reviewer fields only
- No writes to: `requirement_evidence_links`, `player_requirement_progress`, `coach_observations`, player profiles, or any other table

**Security checks:**
- `assertNotPreviewMode()`
- Authenticated Supabase server client (no service role)
- `academy_id` resolved from authenticated profile — never trusts client input
- Active academy membership verified (`academy_director` or `head_coach` only)
- `proposed_actions.academy_id` verified against session academy
- `target_module`, `target_object_type`, `draft_type` verified before any update
- `status = pending_review` required — already-reviewed drafts blocked

**What was NOT built (by design):**
- No "Apply Evidence Links" button
- No inserts into `requirement_evidence_links`
- No updates to `player_requirement_progress` (evidence_count, last_evidence_at, status)
- No coach_observations mutations
- No player level or profile field mutations
- No parent/player portal views
- No AI API calls
- No migrations
- No package installs

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Manual verification steps:**
1. Confirm at least one `proposed_actions` row exists with `target_module = requirement_evidence_link`, `status = pending_review`, `draft_type = requirement_evidence_link_v1`
2. Open `/director/review`
3. Confirm "Evidence Link Drafts" section appears below Priority Recommendation Drafts
4. Confirm card shows player name, link count, requirement titles, domain breakdown, draft-only warnings
5. Click "View Player Profile" — confirm navigates to `/director/players/[playerId]`
6. Click "Needs Clarification" or "Approve" — confirm `proposed_actions.status` updates only
7. Confirm `requirement_evidence_links`, `player_requirement_progress`, `coach_observations` unchanged
8. Confirm existing session recap and priority review sections still work correctly

---

## 2026-04-30 — Sprint 36: Evidence-to-Requirement Link Drafts V1

**Mode:** Draft creation only. No mutations to evidence tables. No requirement status updates. No parent/player views.

**Files created:**
- `src/app/director/players/[playerId]/evidenceRequirementDraftAction.ts` — server action: auth chain → fetch observations → fetch requirement progress → deterministic keyword matching → insert one batch `proposed_actions` row
- `src/app/director/players/[playerId]/EvidenceRequirementDraftButton.tsx` — client button component, same pattern as `PriorityRecommendationDraftButton`
- `src/app/director/players/[playerId]/EvidenceRequirementDrafts.tsx` — read-only display of pending evidence link drafts on the player profile

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — imports for 3 new files; query for existing evidence link drafts; action binding; `EvidenceRequirementDrafts` + `EvidenceRequirementDraftButton` card added to notesSlot after `PlayerRequirementProgressReadOnly`

**What was built:**
- "Create Evidence Link Drafts" button in a new "Evidence Linking" card in the Notes tab of the director player profile.
- Deterministic keyword matching — no AI API call. Uses three domain keyword families (`skill`, `competition`, `fitness`) plus tokenized requirement title/description words.
- Matching logic: tokenizes observation tags and content; computes keyword overlap with requirement keyword sets; requires ≥1 matching keyword; confidence = 0.3 + (match_count / 10) × 0.6, capped at 0.9.
- Caps output to 10 proposed links per click; deduplicates per (observation, requirement) pair.
- Duplicate prevention: checks for existing `pending_review` draft with same `target_module` + `target_object_id` before creating a new batch.
- Empty/safe states: returns descriptive messages for no observations, no requirement rows, and no matches found.
- One batch `proposed_actions` row per click — reduces review clutter vs. per-link rows.
- Proposed payload shape: `draft_type = requirement_evidence_link_v1`, `source = coach_observation_requirement_matching`, `links[]` with `coach_observation_id`, `requirement_progress_id`, `requirement_id`, `requirement_title`, `requirement_domain_key`, `evidence_summary`, `match_reason`, `confidence`, `is_parent_safe = false`.
- Existing pending/approved evidence link drafts displayed above the button in "Evidence Link Drafts" section — shows link count, domain breakdown, first 5 requirement titles, and draft-only warning.

**Security chain:**
- `assertNotPreviewMode()`
- Authenticated Supabase server client (no service role)
- `academy_id` resolved from authenticated profile — never trusts client input
- Active academy membership verified (`academy_director` or `head_coach` only)
- Player verified as belonging to this academy
- All queries scoped to `academy_id` + `player_id`
- No RLS bypass

**proposed_actions write strategy:**
- `target_module = requirement_evidence_link`
- `target_object_type = player`
- `target_object_id = player.id`
- `status = pending_review`
- `action_type = other`
- `voice_command_id` created via `voice_commands` relay row insert (NOT NULL constraint requires it)

**What was NOT built (by design):**
- No inserts into `requirement_evidence_links`
- No updates to `player_requirement_progress` (evidence_count, status, last_evidence_at)
- No updates to `coach_observations`
- No requirement confirmation workflow
- No "mark met" or "mark in progress" controls
- No parent/player portal views
- No review queue integration (deferred to next sprint)
- No AI API calls
- No new migrations
- No new packages

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Type regeneration note:**
`database.types.ts` does not yet include `v_player_requirement_progress_detail`. Local types used in the action file are consistent with the view definition in migration 041.

---

## 2026-04-30 — Sprint 35: Player Requirement Progress Read-Only UI

**Mode:** Read-only UI only. No mutations. No confirmation workflow. No evidence linking.

**Files changed:**
- `src/app/director/players/[playerId]/PlayerRequirementProgressReadOnly.tsx` — created
- `src/app/director/players/[playerId]/page.tsx` — query + component integration

**What was built:**
- New `PlayerRequirementProgressReadOnly` component added to the Notes tab of the director player profile.
- Queries `v_player_requirement_progress_detail` filtered by `academy_id` + `player_id`, ordered by `domain_display_order` then `requirement_display_order`.
- Groups requirement rows into three domain sections: Skill Path, Competition Path, Fitness Path.
- Each requirement card shows: title, description, status badge, required/optional badge, evidence count, requirement type, last evidence date (if any), and internal-only visibility indicator.
- Status labels: Not Started, In Progress, Evidence Needed, Met, Waived, Blocked.
- Domain section headers show per-status counts (met / in progress / not started).
- Current level context displayed when rows exist.
- Read-only disclaimer at section top.
- Empty state when no rows exist, differentiated for Orange Ball vs. other levels.
- Empty state when no curriculum assigned.

**Security:**
- Uses authenticated Supabase server client (no service role).
- Resolves `academy_id` from authenticated profile.
- Queries scoped strictly to `academy_id = current academy` and `player_id = current player`.
- RLS on `player_requirement_progress` and `curriculum_track_requirements` enforces academy scoping at DB level.

**Data fetch strategy:**
- Server-side query in `page.tsx` using existing `rawDb` cast pattern (avoids TS2589).
- Local `RequirementProgressRow` interface defined in the component file — used because `v_player_requirement_progress_detail` is not yet in `database.types.ts`.
- `isOrangeBallPlayer` derived from `curriculumSummary?.stage === 'orange_development'`.

**Type handling:**
- `v_player_requirement_progress_detail` is NOT in `database.types.ts`.
- Local TypeScript interface `RequirementProgressRow` used instead.
- `database.types.ts` was NOT manually edited.
- After applying migrations 041–044 to live DB, run `supabase gen types typescript` to regenerate types and remove the local interface.

**What was NOT built (by design):**
- No status update controls, no "mark met" button, no checkboxes.
- No evidence linking controls.
- No parent/player portal views.
- No level-up recommendation or promotion button.
- No AI summary.
- No scoring logic.
- No confirmation workflow.
- No new migrations.
- No new packages.

**Validation:**
- `npx tsc --noEmit` — passes with zero errors.

**Type regeneration note:**
`database.types.ts` does not yet include `v_player_requirement_progress_detail`, `player_requirement_progress`, `requirement_evidence_links`, `curriculum_requirement_domains`, or `curriculum_track_requirements`. These were added in migration 041. After applying migrations 041–044 to the live database, regenerate types with:
```
supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
```
Once types are regenerated, the local `RequirementProgressRow` interface in `PlayerRequirementProgressReadOnly.tsx` can be replaced with the generated `Tables<'v_player_requirement_progress_detail'>` type.

---

## 2026-04-30 — Sprint 34: Player Requirement Progress Bootstrap V1

**Mode:** Migration only. No UI. No scoring. No evidence linking. No player data changes.

**Migration file created:** `supabase/migrations/044_player_requirement_progress_bootstrap.sql`

**Purpose:**
Initialises empty `player_requirement_progress` rows for all players whose current curriculum state (`player_curriculum_states.current_level_id`) is assigned to one of the three Orange Ball levels seeded in Sprint 33.

**Orange Ball levels targeted:**
- Orange 1 — Rally (`orange_development`, level_number=1)
- Orange 2 — Direction (`orange_development`, level_number=2)
- Orange 3 — Construction (`orange_development`, level_number=3)

**Bootstrap logic:**
One row is inserted per (player, requirement) by joining:
- `player_curriculum_states` → identifies each player's current level
- `curriculum_levels` → filters to `stage = 'orange_development'` and `level_number IN (1, 2, 3)`
- `curriculum_track_requirements` → selects only active global defaults (`academy_id IS NULL`, `source_type = 'global_default'`, `version = 1`, `is_active = true`)

**Rows created per player (based on Sprint 33 seed):**
| Orange Ball Level | Requirements per player |
|---|---|
| Orange 1 — Rally | 10 |
| Orange 2 — Direction | 11 |
| Orange 3 — Construction | 11 |

**Default values for every inserted row:**
- `status = 'not_started'`
- `progress_value = NULL`
- `evidence_count = 0`
- `last_evidence_at = NULL`
- `coach_confirmed_by = NULL`
- `director_confirmed_by = NULL`
- `confirmed_at = NULL`
- `notes = NULL`
- `is_parent_visible = false`
- `is_player_visible = false`

**Idempotency strategy:**
`ON CONFLICT (player_id, requirement_id) DO NOTHING`
Targets the UNIQUE constraint on `player_requirement_progress(player_id, requirement_id)` defined in migration 041. Safe to re-run — duplicate inserts silently skipped.

**Tables intentionally untouched (Sprint 34 scope):**
- `requirement_evidence_links` — no evidence links created
- `player_curriculum_states` — not altered; only read as the population source
- `players` — unchanged
- `player_priorities` — unchanged
- All UI components — unchanged
- All server actions — unchanged
- All backend files — unchanged

**No new tables, views, functions, types, or indexes created.**

**Type regeneration status:** Migration does not add new tables or columns. `database.types.ts` shape is unchanged from Sprint 30. After applying to live DB, run:
```
supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/database.types.ts
```

**TypeScript check:** Skipped — no source files changed. Migration and changelog only.

**Validation:**
- SQL syntax reviewed manually ✓
- All column names cross-checked against migration 041 (`player_requirement_progress`) and migration 036 (`player_curriculum_states`, `curriculum_levels`) ✓
- `stage = 'orange_development'` matches the `curriculum_stage` enum defined in migration 036 ✓
- `source_type = 'global_default'` satisfies CHECK constraint in migration 041 ✓
- `status = 'not_started'` satisfies CHECK constraint in migration 041 ✓
- `ON CONFLICT (player_id, requirement_id)` matches UNIQUE constraint in migration 041 ✓
- No player data created, inferred, or modified ✓
- No scoring logic ✓
- No evidence links ✓
- No parent/player visibility enabled ✓

**Manual verification queries (run after migration is applied):**

```sql
-- 1. Confirm Orange Ball levels exist
SELECT display_name, level_number, sort_order
FROM curriculum_levels
WHERE stage = 'orange_development'
ORDER BY sort_order;

-- 2. Confirm Orange Ball requirement definitions
SELECT cl.display_name, COUNT(*) AS requirement_count
FROM curriculum_track_requirements ctr
JOIN curriculum_levels cl ON cl.id = ctr.curriculum_level_id
WHERE cl.stage = 'orange_development'
  AND cl.level_number IN (1,2,3)
  AND ctr.academy_id IS NULL
  AND ctr.source_type = 'global_default'
GROUP BY cl.display_name
ORDER BY cl.display_name;

-- 3. Confirm player progress rows exist only for Orange curriculum players
SELECT cl.display_name, COUNT(*) AS progress_rows
FROM player_requirement_progress prp
JOIN curriculum_levels cl ON cl.id = prp.curriculum_level_id
WHERE cl.stage = 'orange_development'
GROUP BY cl.display_name
ORDER BY cl.display_name;

-- 4. Confirm all new rows default correctly
SELECT status, evidence_count, is_parent_visible, is_player_visible, COUNT(*)
FROM player_requirement_progress
GROUP BY status, evidence_count, is_parent_visible, is_player_visible;
-- Expected: status=not_started, evidence_count=0, is_parent_visible=false, is_player_visible=false

-- 5. Confirm no evidence links created
SELECT COUNT(*) FROM requirement_evidence_links;

-- 6. Confirm no player level changes (compare before/after)
SELECT player_id, current_level_id FROM player_curriculum_states;
```

---

## 2026-04-30 — Sprint 33: Orange Ball Starter Requirement Seed Migration

**Mode:** Seed migration only. No UI. No player data changes. No player progress bootstrap.

**Migration file created:** `supabase/migrations/043_orange_ball_starter_requirements.sql`

**Orange Ball levels targeted:**
- Orange 1 — Rally (`orange_development`, level_number=1, sort_order=4)
- Orange 2 — Direction (`orange_development`, level_number=2, sort_order=5)
- Orange 3 — Construction (`orange_development`, level_number=3, sort_order=6)

**Rows seeded into `curriculum_track_requirements` (32 total):**

| Level | Skill | Competition | Fitness | Total |
|---|---|---|---|---|
| Orange 1 — Rally | 4 | 3 | 3 | 10 |
| Orange 2 — Direction | 5 | 3 | 3 | 11 |
| Orange 3 — Construction | 4 | 4 | 3 | 11 |
| **Total** | **13** | **10** | **9** | **32** |

**Row field conventions for all 32 rows:**
- `academy_id = NULL` — global default, not academy-specific
- `source_type = 'global_default'`
- `version = 1`
- `is_active = true`
- `evidence_policy = 'coach_confirmed'` — no automatic progression
- `is_parent_visible_default = false`
- `is_player_visible_default = false`

**requirement_type breakdown:**
- `'qualitative'` — 28 rows (all observation-based requirements)
- `'attendance'` — 4 rows: Effort and readiness (O1 Fit), Session-length effort (O2 Fit), Internal match play participation (O3 Comp), Full session stamina (O3 Fit)

**Attendance-type rows with numeric targets:**
| Title | target_value | unit |
|---|---|---|
| Effort and readiness (O1) | 8 | sessions |
| Session-length effort (O2) | 8 | sessions |
| Internal match play participation (O3) | 2 | matches |
| Full session stamina (O3) | 8 | sessions |

**is_required=false rows (8 of 32):**
- Orange 1: Basic directional intent (Skill), Effort and readiness (Fitness)
- Orange 2: Rally under directional constraint (Skill), Serve reliability in game context (Competition), Session-length effort (Fitness)
- Orange 3: Shot transition — defence to offence (Skill), Opponent weakness awareness (Competition), Between-point recovery routine (Fitness)

**Idempotency strategy:**
`ON CONFLICT (curriculum_level_id, requirement_domain_id, title, version) WHERE academy_id IS NULL DO NOTHING`
Targets the partial unique index `idx_curriculum_track_req_global_unique` defined in migration 041. Safe to re-run — duplicate inserts silently skipped.

**Guard clauses:** Migration raises `RAISE EXCEPTION` if any Orange Ball level or domain lookup returns NULL, preventing silent partial seeding.

**Tables intentionally untouched (Sprint 33 scope):**
- `player_requirement_progress` — no rows created
- `requirement_evidence_links` — no rows created
- `player` tables — unchanged
- `player_priorities` — unchanged
- All UI components — unchanged
- All server actions — unchanged
- All backend files — unchanged

**Type regeneration status:** Migration not yet applied to live DB. `database.types.ts` not updated — this migration adds no new tables or columns; type shape is unchanged from Sprint 30. After applying, run:
```
supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/database.types.ts
```

**TypeScript check:** Skipped — no source files changed. Migration and changelog only.

**Validation:**
- SQL syntax reviewed manually ✓
- `requirement_type` values (`'qualitative'`, `'attendance'`) satisfy CHECK constraint in migration 041 ✓
- `evidence_policy` value (`'coach_confirmed'`) satisfies CHECK constraint in migration 041 ✓
- `source_type` value (`'global_default'`) satisfies CHECK constraint in migration 041 ✓
- ON CONFLICT predicate matches `idx_curriculum_track_req_global_unique` partial index exactly ✓
- `academy_id = NULL` on all rows — no academy-scoped data created ✓
- Single-quote escaping verified for apostrophe characters in pass_condition and description fields ✓
- Row count verified: 10 + 11 + 11 = 32 ✓

**Manual verification steps (after applying migration):**
1. Confirm requirement domains exist:
   `SELECT key, label FROM curriculum_requirement_domains ORDER BY display_order;`
2. Confirm Orange Ball levels exist:
   `SELECT display_name, level_number, sort_order FROM curriculum_levels WHERE display_name ILIKE '%Orange%' ORDER BY sort_order;`
3. Confirm seeded requirement count:
   `SELECT COUNT(*) FROM curriculum_track_requirements WHERE academy_id IS NULL AND source_type = 'global_default' AND version = 1;`
   — Expected: 32
4. Confirm Orange Ball rows by level/domain:
   ```sql
   SELECT cl.display_name, crd.key, COUNT(*)
   FROM curriculum_track_requirements ctr
   JOIN curriculum_levels cl ON cl.id = ctr.curriculum_level_id
   JOIN curriculum_requirement_domains crd ON crd.id = ctr.requirement_domain_id
   WHERE cl.display_name ILIKE '%Orange%'
   GROUP BY cl.display_name, crd.key
   ORDER BY cl.display_name, crd.key;
   ```
   — Expected: Orange 1 (competition=3, fitness=3, skill=4), Orange 2 (competition=3, fitness=3, skill=5), Orange 3 (competition=4, fitness=3, skill=4)
5. Confirm no player progress rows were created:
   `SELECT COUNT(*) FROM player_requirement_progress;`
   — Expected: 0 (or unchanged from pre-migration count)
6. Confirm no evidence links were created:
   `SELECT COUNT(*) FROM requirement_evidence_links;`
   — Expected: 0 (or unchanged)
7. Confirm no academy-specific rows were created:
   `SELECT COUNT(*) FROM curriculum_track_requirements WHERE academy_id IS NOT NULL;`
   — Expected: 0 (or unchanged)

**Files changed:**
- `supabase/migrations/043_orange_ball_starter_requirements.sql` — created (240 lines)
- `docs/CHANGELOG.md` — this entry

**git add command (do not commit until approved):**
```
git add supabase/migrations/043_orange_ball_starter_requirements.sql docs/CHANGELOG.md
```

---

## 2026-04-30 — Sprint 32: Starter Requirement Seed Pack Planning

**Mode:** Planning and documentation only. No migration. No seed SQL. No UI. No player data changes.

**Planning document created:** `docs/STARTER_REQUIREMENT_SEED_PACK_PLAN.md`

**Schema inspection confirmed:**
- `curriculum_levels` contains 15 rows across 5 stages
- Orange Ball levels confirmed: `Orange 1 — Rally`, `Orange 2 — Direction`, `Orange 3 — Construction`
- `curriculum_requirement_domains` contains 3 seeded rows: `skill`, `competition`, `fitness`
- `curriculum_track_requirements` schema confirmed with all required columns: `requirement_type`, `measurement_method`, `target_value`, `unit`, `pass_condition`, `evidence_policy`, `is_required`, `display_order`, `is_parent_visible_default`, `is_player_visible_default`, `source_type`, `version`, `is_active`
- `player_requirement_progress` and `requirement_evidence_links` exist with correct shape

**Scope decision:** Option A — Orange Ball 1–3 only (approximately 27–45 requirement rows across 3 levels × 3 domains).

**Starter requirement language drafted for:**
- Orange 1 — Rally: 4 Skill, 3 Competition, 3 Fitness requirements (10 total)
- Orange 2 — Direction: 5 Skill, 3 Competition, 3 Fitness requirements (11 total)
- Orange 3 — Construction: 4 Skill, 4 Competition, 3 Fitness requirements (11 total)

**Key design decisions:**
- All starter rows: `source_type = 'global_default'`, `academy_id = NULL`, `version = 1`, `is_active = true`
- All starter rows: `evidence_policy = 'coach_confirmed'` — no automatic promotion
- All starter rows: `is_parent_visible_default = false`, `is_player_visible_default = false`
- `requirement_type` leans `'qualitative'`; attendance-based requirements use `'attendance'`
- Human approval required before Sprint 33 seeds these rows

**Tables intentionally untouched (Sprint 32 scope):**
- `curriculum_track_requirements` — no rows seeded; language plan only
- `player_requirement_progress` — no rows created
- `requirement_evidence_links` — no rows created
- All player tables, player profile, player priorities — unchanged
- All UI components — unchanged
- All supabase migrations — unchanged

**Recommended next sprints:**
- Sprint 33 — Orange Ball Starter Requirement Seed Migration (pending human approval)
- Sprint 34 — Player Requirement Progress Bootstrap V1
- Sprint 35 — Player Requirement Progress Read-Only UI
- Sprint 36 — Evidence-to-Requirement Link Drafts V1
- Sprint 37 — Requirement Confirmation Workflow V1

**TypeScript check:** Skipped — no source files changed.

**Migration created:** None.

**Files changed:**
- `docs/STARTER_REQUIREMENT_SEED_PACK_PLAN.md` — created
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 31: Requirement Domain Seed Pack V1

**Mode:** Seed migration only. No UI. No player data changes. No track requirement content.

**Migration file created:** `supabase/migrations/042_requirement_domain_seed.sql`

**Rows seeded into `curriculum_requirement_domains` (3):**

| key | label | display_order | is_active |
|---|---|---|---|
| `skill` | Skill Path | 10 | true |
| `competition` | Competition Path | 20 | true |
| `fitness` | Fitness Path | 30 | true |

**Idempotency strategy:** `ON CONFLICT (key) DO UPDATE SET` — reruns update label, description, display_order, is_active, updated_at. Safe to apply multiple times.

**Tables seeded:** `curriculum_requirement_domains` only.

**Tables intentionally untouched (Sprint 31 scope):**
- `curriculum_track_requirements` — no requirement rows seeded; no level-specific content built
- `player_requirement_progress` — no player rows created
- `requirement_evidence_links` — no evidence rows created
- All player tables, player profile, player priorities — unchanged
- All UI components — unchanged
- All app server actions — unchanged

**Type regeneration status:** Migration not applied to live DB yet. `database.types.ts` not updated (seed-only migration adds no new columns or tables; type shape is unchanged from Sprint 30). Run `supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts` after applying both migrations 041 and 042.

**TypeScript check:** Skipped — no source files changed. Migration and changelog only.

**Validation:**
- SQL syntax reviewed manually — `ON CONFLICT (key)` targets the `UNIQUE` constraint defined in migration 041 ✓
- CHECK constraint (`key IN ('skill', 'competition', 'fitness')`) satisfied by all three rows ✓
- `display_order` values (10, 20, 30) are non-overlapping integers ✓
- `is_active = true` for all three rows ✓
- No RLS bypass required — migration runs as database owner ✓

**Manual verification steps (after applying migration):**
1. `SELECT key, label, display_order, is_active FROM curriculum_requirement_domains ORDER BY display_order;`
2. Confirm exactly 3 rows: `skill / competition / fitness`
3. Confirm labels: `Skill Path / Competition Path / Fitness Path`
4. Confirm display_order: `10 / 20 / 30`
5. Confirm `is_active = true` for all three
6. `SELECT COUNT(*) FROM curriculum_track_requirements;` — should be 0
7. `SELECT COUNT(*) FROM player_requirement_progress;` — should be 0
8. `SELECT COUNT(*) FROM requirement_evidence_links;` — should be 0

**Files changed:**
- `supabase/migrations/042_requirement_domain_seed.sql` — created (44 lines)
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 30: Requirement Domain Tables Migration

**Mode:** Schema migration only. No seed data. No UI. No app behavior changes.

**Migration file created:** `supabase/migrations/041_requirement_domains.sql`

**Tables created (4):**

- `curriculum_requirement_domains` — Global reference table. Defines the three pathway domain buckets (skill, competition, fitness). `key` column has CHECK constraint. No `academy_id`. 3 rows will be seeded in Sprint 31.
- `curriculum_track_requirements` — Named requirements per curriculum level and pathway domain. Supports global defaults (`academy_id IS NULL`) and academy-specific overrides/additions (`academy_id IS NOT NULL`). Partial unique indexes used to handle NULL uniqueness correctly.
- `player_requirement_progress` — Per-player per-requirement status tracking. `UNIQUE(player_id, requirement_id)`. Preserves history across level advances.
- `requirement_evidence_links` — Polymorphic evidence-to-requirement links. `evidence_id` is a soft FK (application-enforced). Immutable once created (no `updated_at`).

**View created (1):**

- `v_player_requirement_progress_detail` — Read-only join of all four tables. Exposes `requirement_domain_key`, `requirement_domain_label`, `level_display_name`, `level_number`, `status`, `evidence_count`, and display order fields for the player profile curriculum UI. RLS enforced on underlying tables.

**RLS summary:**

| Table | Read | Write |
|---|---|---|
| `curriculum_requirement_domains` | All authenticated | Directors/heads only (`auth_is_director_or_head()`) |
| `curriculum_track_requirements` | All authenticated (global rows) + own academy rows | Directors/heads for own academy rows only; global rows not writable from app |
| `player_requirement_progress` | Academy staff (`auth_is_staff()`) | Academy staff only |
| `requirement_evidence_links` | Academy staff | Academy staff only |

**Parent/player access deferred to Sprint 32.**

**updated_at triggers:**
- `trg_curriculum_req_domains_updated_at` — uses `update_updated_at_column()` (defined in migration 036)
- `trg_curriculum_track_req_updated_at` — same function
- `trg_player_req_progress_updated_at` — same function
- `requirement_evidence_links` — no trigger; evidence links are immutable once created

**Unique constraint approach for `curriculum_track_requirements`:**
Standard `UNIQUE (academy_id, ...)` cannot enforce uniqueness for global rows because `NULL != NULL` in PostgreSQL. Two partial unique indexes are used instead:
- `idx_curriculum_track_req_global_unique` — unique on `(curriculum_level_id, requirement_domain_id, title, version)` WHERE `academy_id IS NULL`
- `idx_curriculum_track_req_academy_unique` — unique on `(academy_id, curriculum_level_id, requirement_domain_id, title, version)` WHERE `academy_id IS NOT NULL`

**No seed data.** Domain rows (skill, competition, fitness) deferred to Sprint 31.

**No UI changes.** `progression_rules` and `v_curriculum_level_requirements` are untouched.

**Type regeneration status:** Migration not applied to live DB yet. `database.types.ts` not updated. Run `supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts` after applying migration.

**TypeScript check:** Clean (`npx tsc --noEmit` — no source files changed; no errors).

**Files changed:**
- `supabase/migrations/041_requirement_domains.sql` — created (320 lines)
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 29: Curriculum Requirement Domains Schema Plan

**Mode:** Schema inspection + planning only. No migrations. No implementation.

**Schema inspected:**
- `curriculum_stages`, `curriculum_levels`, `skill_progressions`, `skill_domains` — global, no academy_id, no per-track breakdown
- `progression_rules` — general level-up criteria, no academy override, no source/version tracking
- `v_curriculum_level_requirements` — VIEW (not a table), flat criteria, no track differentiation
- `player_curriculum_states` — academy_id present, single-level state, no per-track state
- `player_domain_progress` — tracks mastery for 8 Skill path domains only, no competition/fitness equivalent
- `player_progression` — flat aggregate scores (technical/tactical/competition/movement), not per-requirement
- `player_priorities` — category enum adjacent to tracks but not curriculum-linked
- `assessments`, `coach_observations`, `session_attendance`, `player_outcomes` — valid future evidence sources, no FK to any curriculum requirement
- `development_track` enum (`skill | competition | fitness | combined`) confirmed to exist but NOT wired into curriculum tables
- App homework / external evidence tables — confirmed absent from all 40 migrations

**Gap confirmed:**
- No per-pathway (Skill / Competition / Fitness) requirement rows
- No named requirement table (only aggregate thresholds in `progression_rules`)
- No player progress tracking per named requirement
- No requirement-to-evidence linkage
- No academy override mechanism for requirements
- No parent/player visibility flags on requirements
- No versioning on requirement definitions

**Plan created:** `docs/CURRICULUM_REQUIREMENT_DOMAINS_PLAN.md`

**Proposed new tables:**
- `curriculum_requirement_domains` — 3 pathway domains (skill, competition, fitness)
- `curriculum_track_requirements` — named requirements per level per domain, with academy override support
- `player_requirement_progress` — per-player per-requirement status tracking
- `requirement_evidence_links` — links coach observations, assessments, attendance, outcomes to requirements

**Recommended migration sequence:** Sprint 30 (domain + requirement tables) → Sprint 31 (seed data) → Sprint 32 (progress view + UI) → Sprint 33 (evidence linking) → Sprint 34 (confirmation workflow)

**No migrations created. No implementation. No source files changed.**

**TypeScript check skipped** — no source files changed; check not required per sprint rules.

**Files changed:**
- `docs/CURRICULUM_REQUIREMENT_DOMAINS_PLAN.md` — created (planning document)
- `docs/CHANGELOG.md` — this entry

---

## 2026-04-30 — Sprint 28: Player Progression Requirements Read-Only V1

**Schema fields confirmed:**
- `players.current_level_id` → references `academy_levels` (academy-specific levels)
- `player_curriculum_states.current_level_id` → references `curriculum_levels` (global curriculum spine)
- `v_player_curriculum_detail` (already fetched as `domainRows`) has `current_level_id`, `current_level_name`, `stage`, `stage_name`, `advancement_eligible` — no extra query needed for current level display
- `v_curriculum_level_requirements` view: has `level_id`, `sort_order`, `level_number`, `stage_name`, `min_assessment_score`, `min_domains_mastered`, `min_total_outcomes`, `min_weeks_at_level`, `requires_director_approval`, `requires_final_assessment`, `blocking_signal_types` — authenticated read confirmed
- `curriculum_levels`: global, authenticated read, used for next-level derivation by `sort_order`
- `progression_rules`: authenticated read, LEFT JOINed into `v_curriculum_level_requirements` — NULLs expected if rules not yet seeded for a level
- `player_progression` (joined in `getPlayerById`): has `technical_score`, `tactical_score`, `competition_score`, `movement_score` — used as current development score context
- `development_track` enum (`skill | competition | fitness | combined`) does NOT appear on `v_curriculum_level_requirements` — per-track requirements are NOT in schema; grouping by Skill/Competition/Fitness not supported yet

**Schema decision:**
Requirements exist as GENERAL level criteria (not per-track). Skill/Competition/Fitness grouping is schema-absent. Component shows general advancement criteria with a note that per-track breakdown comes in a future curriculum sprint. Track scores from `player_progression` displayed as context.

**Files created:**
- `src/app/director/players/[playerId]/PlayerProgressionRequirements.tsx` — read-only component; shows current curriculum level, next target level (if derivable), general advancement criteria, current development scores; no controls; no mutations

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — added `PlayerProgressionRequirements` import; added 2 sequential rawDb queries (v_curriculum_level_requirements + curriculum_levels); added `progressionScores` from already-fetched player_progression; renders `PlayerProgressionRequirements` in Notes tab above `PlayerActivePriorities`
- `docs/CHANGELOG.md` — this entry

**Data queries added (page.tsx):**
1. `rawDb.from('v_curriculum_level_requirements').select(...).eq('level_id', curriculumSummary.current_level_id).limit(1)` — gets advancement criteria + sort_order
2. `rawDb.from('curriculum_levels').select(...).gt('sort_order', ...).order('sort_order').limit(1)` — derives next curriculum level
- Both queries are conditional on `curriculumSummary?.current_level_id` being non-null
- `progressionScores = (player as any).player_progression?.[0]` — no new DB query (already joined)

**Display behavior:**
- Section appears in Notes tab, above Active Priorities
- If no curriculum state: "No curriculum level has been assigned to this player yet."
- Current level: shows `current_level_name` + `stage_name` from `domainRows[0]`
- Next target: shows next `curriculum_levels` row by sort_order, or "Next target level has not been configured yet."
- Advancement eligibility: lime banner if eligible, muted banner if not
- Advancement criteria: table rows for each non-null requirement, or "not configured yet" message
- Blocking signals: orange pills if any `blocking_signal_types` set
- Track scores: 2×2 or 4-column grid of technical/tactical/competition/movement scores (hidden if all null)
- Disclaimer: "Read-only development guidance. This does not move the player up, change priorities, or publish anything to parents."

**Security checks:**
- Uses authenticated Supabase server client (no service role)
- `academy_id` resolved from server-side profile (existing pattern)
- Player verified in existing code (`getPlayerById` throws → `notFound()`)
- `curriculum_levels` and `v_curriculum_level_requirements` queries use player's `current_level_id`, not cross-academy data
- No player, priority, observation, or proposed_action mutations

**What was not built:**
- No parent portal progression view
- No player portal progression view
- No level-up scoring or automatic promotion recommendation
- No level update button or move-up workflow
- No per-track (Skill/Competition/Fitness) requirement rows — schema does not support yet
- No migrations

**Validation:**
- `npx tsc --noEmit` — passes, zero errors

---

## 2026-04-30 — Sprint 27: Approved Priority Recommendation Application Guardrails

**Schema fields confirmed:**
- `proposed_actions.status` enum includes `approved` and `executed` — both confirmed present
- `proposed_actions.target_object_type` — string, confirmed `player` for priority recommendation drafts
- `proposed_actions.voice_command_id` — NOT NULL, passed through to audit_logs
- `player_priorities` required insert fields: `academy_id`, `player_id`, `title`, `category` (priority_category enum)
- `player_priorities.is_active` — boolean, default true; the player profile page filters by this field only
- `player_priorities` has no provenance fields (`source_proposed_action_id`, `generated_by`) — provenance recorded in `audit_logs.payload`
- `player_priorities` RLS: `"Staff manage priorities" FOR ALL` — covers INSERT for authenticated staff
- `audit_logs` INSERT confirmed working (same pattern as sprint 21 recap action)
- No database-level uniqueness constraint on `player_priorities` title — duplicate check is application-level

**Files created:**
- `src/app/director/review/ApplyPriorityRecommendationControls.tsx` — client component; "Create Active Priority" button; guardrail copy; calls `applyApprovedPriorityRecommendationAction`; success/error states; `router.refresh()` on success

**Files modified:**
- `src/app/director/review/actions.ts` — added `applyApprovedPriorityRecommendationAction`; full security chain (auth → academy_id → membership → proposed_action verify → payload validate → player verify → duplicate check → insert player_priorities → audit_log → mark executed); no service role; no RLS bypass
- `src/app/director/review/PriorityRecommendationDraftCard.tsx` — dynamic status label (pending vs approved); different banner color for approved; conditionally renders `ApplyPriorityRecommendationControls` for approved drafts, `PriorityDraftDecisionControls` for pending
- `src/app/director/review/page.tsx` — priority draft query changed from `eq('status', 'pending_review')` to `in('status', ['pending_review', 'approved'])`; pending/approved splits computed; "Approved — Ready to Apply" section added for priority drafts; `PageHeader` updated with `priorityApprovedCount`; total ready-to-apply badge in page header now includes both session recap and priority approved counts

**Files read only:**
- `src/app/director/players/[playerId]/PlayerActivePriorities.tsx`, `priorityRecommendationAction.ts`, `page.tsx`
- `supabase/migrations/020_player_priorities.sql`
- `src/lib/supabase/database.types.ts`
- `docs/CHANGELOG.md`, `docs/AI_BACKEND_RULES.md`, `docs/CURRENT_BUILD_TARGET.md`, `docs/LOCKED_MODULES.md`, `docs/KNOWN_LIMITATIONS.md`, `docs/MODULE_BUILD_PROCESS.md`

**Apply behavior:**
- Button appears only on approved priority recommendation drafts
- Clicking "Create Active Priority" calls `applyApprovedPriorityRecommendationAction(proposedActionId)`
- Inserts one `player_priorities` row: `is_active=true`, `status='active'`, title/description/category/priority_level/urgency from `proposed_payload.recommended_priority`, `priority_rank=max_existing+1`
- Writes `audit_logs` row with full provenance (proposed_action_id, player_id, applied_by, source)
- Updates `proposed_actions.status = 'executed'` only after successful insert
- `router.refresh()` causes the applied draft to disappear from the queue (executed status excluded from query)
- Active priority appears on `/director/players/[playerId]` Active Priorities section

**Duplicate handling:**
- Fetches active player priorities before insert
- Normalizes title (lowercase trim) and checks for exact match
- Returns: "An active priority with a similar title already exists for this player. No duplicate was created."
- No insert attempted if duplicate found

**Security checks:**
- `assertNotPreviewMode`
- Auth user required
- `academy_id` resolved from server-side profile — never from client
- Active academy membership verified — `academy_director` or `head_coach` only
- `proposed_action.academy_id` verified against authenticated `academy_id`
- `status === 'approved'` required
- `target_module === 'priority_recommendation'` required
- `target_object_type === 'player'` required
- `draft_type === 'priority_recommendation_v1'` required
- Title non-empty, ≤ 200 chars
- Description ≤ 1000 chars
- Category validated against full `priority_category` enum list
- Player membership in academy verified by separate query

**What was NOT built:**
- No batch apply
- No auto-apply after approval
- No priority editing, completion, or deletion
- No parent/player-facing priority view
- No level-up logic
- No progression score
- No duplicate resolution UI
- No drag-and-drop rank reordering
- No notification or communication drafts
- No migrations
- No package installs
- No AI API

**TypeScript:** clean

---

## 2026-04-30 — Sprint 26: Priority Recommendation Review Queue V1

**Schema fields confirmed:**
- `proposed_actions.target_module` — string, used to filter `priority_recommendation`
- `proposed_actions.status` — `proposed_action_status` enum includes `pending_review`, `approved`, `rejected`, `clarification_needed`
- `proposed_actions.target_object_id` — player UUID for priority recommendation drafts
- `proposed_actions.proposed_by_id` — UUID ref to `profiles.id`
- `players.first_name`, `players.last_name`, `players.full_name` — name fields for player lookup
- `profiles.display_name` — proposer display name

**Files created:**
- `src/app/director/review/PriorityDraftDecisionControls.tsx` — client component; approve/reject/clarification controls; calls `updatePriorityRecommendationDecisionAction`; governance copy: "Approval marks this recommendation as ready for a future priority-creation step. It does not create an active priority yet."
- `src/app/director/review/PriorityRecommendationDraftCard.tsx` — card component; shows player name, created date, proposer, recommended priority title, category, priority level, urgency, evidence tags, observation count, overlap warning, draft-only banner, View Player Profile link

**Files modified:**
- `src/app/director/review/actions.ts` — added `updatePriorityRecommendationDecisionAction`; guards `target_module === 'priority_recommendation'`; same security chain as existing session recap action; never touches `player_priorities`
- `src/app/director/review/page.tsx` — added priority recommendation section: queries `proposed_actions` by `target_module = priority_recommendation` + `status = pending_review`; batch-fetches player names and proposer names; renders `PriorityRecommendationDraftCard` per draft; session recap section unchanged; added `Target` icon to `PageHeader` pending count

**Files read only:**
- `src/app/director/review/StructuredDraftCard.tsx`, `DraftDecisionControls.tsx`, `ApplyApprovedDraftControls.tsx`
- `src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx`, `priorityRecommendationAction.ts`
- `src/lib/supabase/database.types.ts`

**What was NOT built:**
- No `player_priorities` insert/update
- No apply/activate button for priority recommendations
- No active priority creation
- No parent/player-facing view
- No migrations
- No package installs

**TypeScript:** clean

---

## 2026-04-30 — Sprint 25: Priority Recommendation Drafts from Evidence V1

**Schema fields confirmed:**

**`proposed_actions`:**
- `voice_command_id: string` — NOT NULL in Insert → voice_commands relay row required ✓
- `action_type`: `Enums['action_type']` — `'other'` is valid ✓
- `status`: `Enums['proposed_action_status']` — `'pending_review'` is valid ✓
- `target_module: string` — free text, `'priority_recommendation'` is safe ✓
- `target_object_type: string | null` — free text, `'player'` is safe ✓
- `target_object_id: string | null` — holds player UUID ✓
- `proposed_payload: Json` — stores full recommendation payload ✓
- `action_label: string` — required, set to `"Priority Recommendation Draft"` ✓

**`voice_commands` (relay row):**
- Required FK (proposed_actions.voice_command_id is NOT NULL) → relay row created as in Sprint 18 ✓
- `input_method: 'typed' | 'audio' | 'api'` → `'typed'` used ✓
- `issuer_role`: `user_role` enum — `academy_director` and `head_coach` both valid ✓

**`player_priorities.category`:** `priority_category` enum: `technical_skill | tactical_skill | physical_fitness | competition_exposure | behavioral | load_management | reassessment | promotion_readiness` — matches sprint tag mapping exactly ✓

**`priority_category` enum vs tag mapping:** Confirmed identical. Tag→category map built from sprint spec. Tiebreaker order: technical_skill > behavioral > tactical_skill > physical_fitness > competition_exposure > load_management > reassessment > promotion_readiness.

**Recommendation logic (deterministic, no AI):**
- Tags from all coach_observations (limit 50) are counted across the whole observation set
- Tag → category vote map applied using sprint's keyword mapping
- Highest category by vote count wins; tiebreaker by priority order
- If no tag votes: observation types used as fallback via second map
- Top 2 tags → recommended title via category-specific phrase template
- Active priority overlap: checked by scanning active priority titles for shared top tags
- Overlap warning stored in payload when found
- All logic in-process; no external API; no AI

**`proposed_payload` shape:** `draft_type: 'priority_recommendation_v1'`, `source: 'player_evidence_summary'`, `recommended_priority: { title, description, category, priority_level: 'medium', urgency: 'normal', suggested_status: 'recommended', requires_review: true }`, `evidence: { observation_count, top_tags, top_observation_types, from_recap_count, session_linked_count, most_recent_observation_at }`, `active_priority_overlap_warning`, `warnings: ['Draft only...', 'Requires director approval...']`

**Files created:**
- `src/app/director/players/[playerId]/priorityRecommendationAction.ts` — server action `createPriorityRecommendationDraftAction(playerId)`. Security chain: assertNotPreviewMode → auth → academy_id from profile → active academy_director/head_coach membership → player ownership (verified against academy_id) → fetch coach_observations (rawDb, limit 50) → guard: no observations → error early → fetch active player_priorities (rawDb) → generate deterministic recommendation → build payload → create voice_commands relay row → insert proposed_actions (target_module='priority_recommendation', target_object_type='player', status='pending_review', action_type='other'). Never writes player_priorities, player profile fields, coach_observations, attendance, or parent views.
- `src/app/director/players/[playerId]/PriorityRecommendationDraftButton.tsx` — `'use client'` component. "Create Priority Recommendation Draft" button with Sparkles icon. `useTransition` for pending state. "Creates a draft recommendation from internal evidence. It does not update active priorities." copy. Green success message / red error message after action completes.
- `src/app/director/players/[playerId]/PriorityRecommendationDrafts.tsx` — read-only display of existing priority recommendation drafts for this player. Shows: "Draft Only · Not Applied" badge, status label (Pending Review / Approved / Needs Clarification), recommended title, category badge, evidence tags, overlap warning (AlertTriangle icon), created date. Returns null when no drafts. No approve/apply controls.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — 3 additions: (1) imports for 3 new files; (2) query for existing recommendation drafts (proposed_actions where target_module='priority_recommendation' + target_object_id=playerId + status in [pending_review, approved, clarification_needed], limit 5); (3) bound action `createDraftAction = createPriorityRecommendationDraftAction.bind(null, params.playerId)`; (4) in notesSlot: `<PriorityRecommendationDrafts>` and `<PriorityRecommendationDraftButton>` inserted between Evidence Summary and Internal Coach Observations feed.
- `docs/CHANGELOG.md` — this entry

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required (no user → early return)
- `academy_id` resolved from authenticated profile — never trusted from client
- `academy_director` or `head_coach` active membership required
- Player verified as belonging to academy before any processing
- No observations → early error return (button disabled by error message)
- `rawDb` cast only for JSONB-heavy queries (coach_observations, player_priorities, proposed_actions fetch)
- Typed client for voice_commands and proposed_actions inserts
- No service role; no RLS bypass
- `proposed_actions` insert always includes `.eq('academy_id', academyId)` scoping

**Not built (intentional scope boundary):**
- No direct player_priorities insert/update
- No priority editing, completion, or deletion
- No approve/apply recommendation button
- No parent/player-facing priority view
- No review queue integration (priority recommendation drafts do not appear in /director/review — that queue filters target_module='session_recap_structuring' only)
- No level-up logic
- No progression score
- No profile mutation
- No parent-safe message generation
- No AI API integration
- No migrations
- No package installs

**Validation:** `npx tsc --noEmit` — no errors.

**Manual verification steps:**
1. Ensure a player has coach_observations rows with tags.
2. Open /director/players/[playerId] → Notes tab.
3. Confirm "Priority Recommendation" card is visible with "Create Priority Recommendation Draft" button.
4. Confirm copy reads: "Creates a draft recommendation from internal evidence. It does not update active priorities."
5. Click "Create Priority Recommendation Draft".
6. Confirm green success message: "Priority recommendation draft created for review."
7. Refresh page — confirm "Priority Recommendation Drafts" card appears with the new draft.
8. Confirm draft shows: "Draft Only · Not Applied" badge, "Pending Review" status, recommended title, category badge, evidence tags.
9. In Supabase: confirm proposed_actions row exists with target_module='priority_recommendation', target_object_type='player', target_object_id=player.id, status='pending_review', proposed_payload.draft_type='priority_recommendation_v1'.
10. Confirm player_priorities was NOT modified.
11. Confirm player profile fields were NOT modified.
12. Confirm coach_observations were NOT modified.
13. Confirm parent/player views were NOT modified.
14. Open /director/review — confirm NO priority recommendation draft appears there (review queue filters session_recap_structuring only).
15. If player has no observations, confirm button shows error: "No coach observations found..."

---

## 2026-04-30 — Sprint 24: Player Active Priorities Read-Only V1

**Schema fields confirmed — `player_priorities`:**
- `id`, `academy_id`, `player_id` ✓
- `title` (string) — priority text ✓
- `description` (string | null) — notes ✓
- `category` (`priority_category` enum: technical_skill, tactical_skill, physical_fitness, competition_exposure, behavioral, load_management, reassessment, promotion_readiness) ✓
- `status` (string) — plain string ✓
- `is_active` (boolean) — active filter ✓
- `priority_level` (string) — high / medium / low ✓
- `priority_rank` (number) — display order ✓
- `urgency` (string) ✓
- `generated_at`, `updated_at` (string) — dates ✓

**Query strategy:**
- Scoped by `academy_id` + `player_id`, filtered `is_active = true`, ordered by `priority_rank ASC`
- `rawDb` cast (same pattern as enriched observations) to avoid TS2589

**Files changed:**
- `src/app/director/players/[playerId]/PlayerActivePriorities.tsx` — new read-only component
- `src/app/director/players/[playerId]/page.tsx` — import + query + inserted above evidence summary in Notes tab
- `docs/CHANGELOG.md`

**Implementation:**
- Active Priorities section in the Notes tab above Development Evidence Summary
- Priority cards: title, category badge, priority_level, urgency badge, status badge, description, generated_at / updated_at
- Ordered by `priority_rank`
- Empty state: "No active priorities have been set for this player yet. Future sprints will allow director-approved priorities to be created from evidence."
- Disclaimer: "Priorities are shown for visibility only. Observations and evidence summaries do not automatically change priorities yet."

**Security:**
- Authenticated server client only — no service role
- `academy_id` resolved from authenticated profile
- Priorities queried only where `academy_id` + `player_id` match — no cross-academy exposure
- Read-only — no add/edit/delete/complete controls

**Not built (intentional scope boundary):**
- No priority creation, editing, completion, or deletion
- No AI-generated priority recommendations
- No automatic priority updates from observations
- No parent/player-facing priority display
- No level-up logic
- No migrations

**Validation:** `npx tsc --noEmit` — no errors.

---

## 2026-04-30 — Sprint 23: Player Profile Evidence Summary V1

**Schema fields confirmed:**

**coach_observations** — all fields already confirmed in Sprint 22; reused for summary:
- `observation_type`: string — grouped and counted to produce top types ✓
- `tags`: string[] | null — flattened and counted across all observations for top themes ✓
- `is_private`: boolean — counted for "Internal" metric ✓
- `ai_entities`: JSONB — `ai_entities.source === 'session_recap_draft'` counted for "From Recap" metric ✓
- `created_at`: string — first item (newest-first sort) used for "Most recent observation" ✓
- `sessions` join present — non-null sessions counted for "Session-linked" metric ✓

**What can be summarized without AI:**
- Observations by type ✓
- Tags by frequency ✓
- Internal count, From Recap count, Session-linked count ✓
- Last observation date ✓
- Recap ratio text note ✓

**Files changed:**
- `src/app/director/players/[playerId]/CoachObservationEvidenceSummary.tsx` — new component; deterministic evidence summary
- `src/app/director/players/[playerId]/page.tsx` — import + inserted summary above observations feed
- `docs/CHANGELOG.md`

**Implementation:**
- Zero additional DB queries — reuses `enrichedObservations` already fetched in `page.tsx`
- Metric grid: Total, Internal, From Recap, Session-linked
- Most recent observation date shown
- Top observation types (up to 3) with counts
- Top tags/themes (up to 5) with counts
- Deterministic recap-ratio note ("Most recent evidence comes from structured coach recaps" if ≥50% from recap)
- Disclaimer: "Internal evidence summary. This does not change player level, priorities, or parent-facing communication."
- Empty state: "No evidence summary yet. Applied coach observations will create the first evidence signals."

**Security:**
- Read-only — no mutations
- No additional queries; uses same `academy_id + player_id` scoped data
- No parent/player visibility

**What was NOT built:**
- No parent-facing or player-facing summaries
- No level-up / progression logic
- No automatic priorities
- No AI summarization
- No chart library
- No profile field mutations
- No observation approval workflow
- No migrations

**TypeScript:** `npx tsc --noEmit` — zero errors

**Validation (manual):**
1. Navigate to `/director/players/[playerId]` → Notes tab
2. Confirm Evidence Summary card appears above Internal Coach Observations
3. Confirm total, Internal, From Recap, Session-linked counts are visible
4. Confirm top observation types and top tags appear if observations exist
5. Confirm disclaimer copy is present
6. Confirm empty state shows when no observations exist
7. Confirm no player profile fields, priorities, or parent/player views changed

---

## 2026-04-30 — Sprint 22: Coach Observations Player Profile Feed V1

**Schema fields confirmed:**

**coach_observations**
- `id`, `academy_id`, `player_id`, `coach_id`, `session_id` ✓
- `content`, `observation_type`, `tags`, `is_private` ✓
- `ai_entities: JSONB` — includes `{ source: 'session_recap_draft', ... }` for recap-originated rows ✓
- `voice_command_id`, `created_at`, `updated_at` ✓
- Can query by `academy_id + player_id` ✓; RLS: `academy_id = auth_academy_id() AND auth_is_staff()` ✓

**profiles** — `display_name` available via `coach_observations_coach_id_fkey` join ✓

**sessions** — `name`, `scheduled_date` available via `coach_observations_session_id_fkey` join ✓

**Files changed:**
- `src/app/director/players/[playerId]/CoachObservationsFeed.tsx` — new component; enriched read-only feed
- `src/app/director/players/[playerId]/page.tsx` — replaced `getCoachObservations` + `CoachObservationTimeline` with enriched inline query + `CoachObservationsFeed`
- `docs/CHANGELOG.md`

**Implementation:**
- Enriched query uses `rawDb = supabase as any` (TS2589 avoidance for multi-join select)
- Query scoped to `academy_id + player_id`; RLS provides belt-and-suspenders academy isolation
- Join: `profiles!coach_observations_coach_id_fkey(display_name)` for coach name
- Join: `sessions!coach_observations_session_id_fkey(name, scheduled_date)` for session context
- Sorted newest-first, limit 20
- "Internal" badge when `is_private = true`
- "From Recap" badge when `ai_entities.source = 'session_recap_draft'`
- Tags displayed as chips
- Coach name + session name/date shown as provenance
- "Internal development evidence. Not parent-facing yet." label on section
- Empty state: "No coach observations have been applied to this player yet. Approved session recap drafts will appear here after they are applied."

**What was NOT built:**
- No parent-facing or player-facing feed
- No level-up / progression logic
- No profile mutation
- No priority update
- No observation editing, deletion, or approval
- No AI summarization
- No batch actions
- No migrations
- No package installs

**TypeScript check:** `npx tsc --noEmit` — clean, zero errors.

---

## 2026-04-30 — Sprint 21: Approved Draft Application Plan + Guardrails

**Schema fields confirmed before coding:**

**proposed_actions**
- `status` enum: `pending_review | clarification_needed | approved | modified | rejected | executed | failed | expired` — `executed` and `failed` both valid ✓
- `approved_by: string | null`, `approved_at: string | null` — set by Sprint 20 ✓
- `proposed_payload: Json` — never modified by this action ✓
- NO `executed_by`/`executed_at` directly on `proposed_actions` — those live in `action_execution_logs` ✓

**action_execution_logs**
- Has `executed_by`, `executed_at`, `status` (`success|partial|failed`), `execution_result`, `objects_created`, `error_message` ✓
- **No INSERT RLS policy** — cannot write from application code without service role ✗ → writes go to `audit_logs` instead

**coach_observations**
- `academy_id: string` (required) ✓
- `player_id: string` (required, NOT NULL) ✓
- `coach_id: string` (required, NOT NULL) — uses `session.coach_id` ✓
- `session_id: string | null` ✓
- `content: string` (required) ✓
- `is_private: boolean` — default `false`; application sets `true` ✓
- `observation_type: string` — strict CHECK constraint: `general | technical | tactical | movement | competition | behavioral | injury_concern | positive_highlight` — application uses `'general'` ✓
- `tags: string[] | null` — application passes `possible_focus` keywords ✓
- `voice_command_id: UUID | null` — no FK constraint; application passes proposed_action's voice_command_id ✓
- `ai_entities: JSONB | null` — application stores `{ source, proposed_action_id, requires_review: true }` for provenance ✓

**sessions**
- `coach_id: string` (NOT NULL) — always available ✓

**audit_logs**
- INSERT RLS policy: `CHECK (academy_id = auth_academy_id())` — writeable from app code ✓

**Key structural constraint:**
`PlayerObservationDraft` has `player_name` but NOT `player_id`. Player IDs come from `detected_players[].player_id` (matched by name). Only observations where `player_name === detected_player.name` are applied; others are skipped.

---

**Application Plan:**

| Payload section | Disposition | Target table | Risk | Confirmation |
|---|---|---|---|---|
| `detected_players` | Supporting data only (for player_id resolution) | — | Low | Already approved |
| `attendance_mentions` | Defer | None | High | Requires attendance-specific confirmation |
| `session_actual_draft` | Defer | None | Medium | No session_actuals table exists yet |
| `player_observation_drafts` | **Apply now** (confirmed player_id only) | `coach_observations` | Low | Director approval sufficient |
| `director_summary_draft` | Defer | None | Medium | No single official target table |
| `parent_safe_draft_candidates` | Never auto-apply | None | High | Requires parent-safe approval + delivery pipeline |
| `warnings` | Informational only | — | — | — |

---

**Files created:**
- `src/app/director/review/ApplyApprovedDraftControls.tsx` — `'use client'` component. Scope guardrail copy (required per spec): "Apply only creates internal coach observations from approved player observation drafts. It does not update attendance, parent messages, player priorities, player levels, or profiles." Apply button (lime, `PlayCircle` icon). Success message with observation count. Error display with rollback note. `useTransition` for pending state.

**Files modified:**
- `src/app/director/review/actions.ts` — added `ApplyApprovedDraftResult` interface and `applyApprovedStructuredDraftAction` server action. Security chain: assertNotPreviewMode → auth → academy_id from profile → active director/head_coach membership → fetch proposed_action (rawDb) → verify academy_id + status=approved + target_module=session_recap_structuring → verify draft_type=session_recap_structuring_v1 → fetch session (verify academy_id, get coach_id) → build name→player_id map from detected_players → match observation drafts to player_ids (skip unmatched, skip sentinel text) → batch verify player_ids against academy → sequential inserts into coach_observations (is_private=true, observation_type='general', tags=possible_focus, ai_entities with source provenance) → write audit_logs → update proposed_actions.status='executed' only after all inserts succeed. Never touches attendance, parent messages, player priorities, player profiles, or templates.
- `src/app/director/review/StructuredDraftCard.tsx` — imported `ApplyApprovedDraftControls`; dynamic status label in header (`approved — ready to apply` vs `pending review`); conditionally renders `ApplyApprovedDraftControls` when `draft.status === 'approved'`, `DraftDecisionControls` otherwise.
- `src/app/director/review/page.tsx` — expanded query to `.in('status', ['pending_review', 'approved'])`; splits enriched drafts into `pendingDrafts` + `approvedDrafts`; renders "Approved — Ready to Apply" section above pending section; `PageHeader` now shows both pending count (orange) and approved count (lime); empty state only applies to pending section.
- `docs/CHANGELOG.md` — this entry

**Application write sequence (only on full success):**
1. Insert `coach_observations` rows sequentially (one per qualifying observation)
2. Insert into `audit_logs` (action: `session_recap.observations.applied`)
3. Update `proposed_actions.status = 'executed'`
If any observation insert fails: stop, do not write audit_logs, do not mark executed, return error.

**Why action_execution_logs was NOT used:**
Migration 009 creates `action_execution_logs` with only a SELECT policy for directors. There is no INSERT policy. Writes from application code would be blocked by RLS. The `execute_approved_action()` SECURITY DEFINER function writes to it, but we are not calling that RPC (it handles voice action_types, not session_recap_structuring). `audit_logs` has a working INSERT policy and is used instead.

**Observation fields applied:**
- `content` ← `obs.observation`
- `observation_type` ← `'general'` (only safe value within CHECK constraint for recap-originated notes)
- `is_private` ← `true` (staff-only internal observation)
- `tags` ← `obs.possible_focus` (keyword array from structuring)
- `session_id` ← `proposedAction.target_object_id` (the source session)
- `coach_id` ← `session.coach_id` (the coach who ran the session)
- `voice_command_id` ← `proposedAction.voice_command_id` (source voice command)
- `ai_entities` ← `{ source: 'session_recap_draft', proposed_action_id, requires_review: true }`

**What was NOT built:**
- attendance_mentions → session_attendance (high risk, needs separate confirmation flow)
- session_actual_draft → sessions or session_actuals (no session_actuals table exists)
- director_summary_draft → any table (no clear target)
- parent_safe_draft_candidates → parent_messages or parent_updates (requires parent-safe approval + delivery)
- player priority updates from draft
- player level/progression updates
- batch apply
- auto-apply after approval
- edit observations before applying
- AI API integration

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a `proposed_actions` row exists with `target_module = 'session_recap_structuring'` and `status = 'approved'`.
2. Open `/director/review`.
3. Confirm "Approved — Ready to Apply" section appears above pending section.
4. Confirm header shows both "N pending" (orange) and "N ready to apply" (lime) badges.
5. Confirm approved draft card shows "approved — ready to apply" status label.
6. Confirm guardrail copy is visible: "Apply only creates internal coach observations…"
7. Click "Apply Approved Draft".
8. Confirm green success message with observation count.
9. Confirm approved section disappears from page (status became `executed`).
10. In Supabase: confirm `coach_observations` rows were created with `is_private = true`, `observation_type = 'general'`, correct `session_id`, `coach_id`, `player_id`.
11. Confirm `ai_entities` on each observation contains `source: 'session_recap_draft'` and `proposed_action_id`.
12. Confirm `proposed_actions.status = 'executed'` for the applied draft.
13. Confirm `audit_logs` row exists with `action = 'session_recap.observations.applied'`.
14. Confirm `session_attendance` was NOT modified.
15. Confirm player profiles were NOT modified.
16. Confirm player priorities were NOT modified.
17. Confirm `parent_updates` was NOT modified.
18. Confirm templates were NOT modified.

---

## 2026-04-30 — Sprint 20: Structured Draft Decision Controls V1

**Schema fields confirmed before coding:**
- `proposed_actions.status` — `Enums['proposed_action_status']` — `approved`, `rejected`, `clarification_needed` all valid ✓
- `proposed_actions.approved_by: string | null` — used for `approved` decision (no `reviewed_by_id` field; schema separates approved_by and rejected_by) ✓
- `proposed_actions.approved_at: string | null` — used for `approved` decision ✓
- `proposed_actions.rejected_by: string | null` — used for `rejected` decision ✓
- `proposed_actions.rejected_at: string | null` — used for `rejected` decision ✓
- `proposed_actions.rejection_reason: string | null` — used for `rejected` decision notes ✓
- `proposed_actions.reviewer_notes: string | null` — used for all decisions (note: field is `reviewer_notes`, not `review_notes`; no `reviewed_at` column exists) ✓
- `proposed_actions.proposed_payload` — never modified by this action ✓
- No `reviewed_by_id` or `reviewed_at` columns exist; `approved_by`/`rejected_by` are the reviewer tracking fields ✓
- No migrations needed ✓

**Files created:**
- `src/app/director/review/actions.ts` — server action `updateStructuredDraftDecisionAction`. Security chain: assertNotPreviewMode → auth → academy_id from profile → active academy membership (academy_director or head_coach only) → fetch proposed_action by ID → verify academy_id match → verify target_module = session_recap_structuring → verify status = pending_review → validate decision value → validate reviewer_notes max 1000 chars → update proposed_actions (status + reviewer tracking fields only). Never modifies proposed_payload, player profiles, attendance, parent messages, coach_observations, player priorities, or any table other than proposed_actions.
- `src/app/director/review/DraftDecisionControls.tsx` — `'use client'` component. Three decision buttons: Approve for Application (green), Needs Clarification (orange), Reject Draft (red). Optional decision note textarea (max 1000 chars, char counter appears at 800+). Governance banner: "Approving does not apply changes yet. It only marks this draft as ready for a future application step." On success: green confirmation banner + `router.refresh()` to remove card from pending queue. Error display if action fails. `useTransition` for pending state; buttons disabled while pending.

**Files modified:**
- `src/app/director/review/StructuredDraftCard.tsx` — imported `DraftDecisionControls`; added `<DraftDecisionControls proposedActionId={draft.id} />` at the bottom of CardContent, after the parent-safe candidate count.
- `docs/CHANGELOG.md` — this entry

**Decision → DB write strategy:**
| Decision | Columns written |
|---|---|
| `approved` | `status='approved'`, `approved_by=user.id`, `approved_at=now()`, `reviewer_notes` (if provided) |
| `rejected` | `status='rejected'`, `rejected_by=user.id`, `rejected_at=now()`, `rejection_reason` (if provided), `reviewer_notes` (if provided) |
| `clarification_needed` | `status='clarification_needed'`, `reviewer_notes` (if provided) |

No other columns touched. `proposed_payload` never modified. Only `proposed_actions` written.

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required (no user → early return)
- `academy_id` resolved from authenticated profile — never trusted from client
- `academy_director` or `head_coach` active membership required
- Proposed action verified to exist and belong to same academy
- `target_module` verified = `session_recap_structuring`
- `status` verified = `pending_review` before allowing decision (idempotency guard)
- `decision` value validated against allowed enum
- `reviewer_notes` validated max 1000 chars
- No service role; no RLS bypass
- Double `.eq('academy_id', academyId)` on the update call

**After decision:**
- Card disappears from `/director/review` on next render (query filters `status = pending_review`)
- `router.refresh()` triggers server re-render immediately
- Empty state appears if no pending drafts remain

**What was NOT built:**
- Apply approved drafts to player profiles
- Apply approved drafts to attendance
- Create parent messages
- Create coach_observations from draft
- Update player priorities from draft
- Director intelligence feed writes
- Batch approve / batch reject
- Edit draft content
- Clarification workflow messaging
- Rejected draft history page
- Parent-safe message creation or sending
- Notifications
- AI API integration
- Voice transcription
- Audio upload

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure at least one `proposed_actions` row exists with `target_module = 'session_recap_structuring'` and `status = 'pending_review'`.
2. Open `/director/review`.
3. Confirm each draft card shows decision controls: Approve for Application, Needs Clarification, Reject Draft.
4. Confirm governance banner is visible: "Approving does not apply changes yet…"
5. Add a decision note in the textarea.
6. Click "Needs Clarification" on one draft.
7. Confirm green "Decision recorded. Refreshing queue…" appears.
8. Confirm the card disappears from the queue after refresh.
9. In Supabase: confirm `proposed_actions.status = 'clarification_needed'` and `reviewer_notes` saved.
10. Click "Approve for Application" on another draft.
11. Confirm card disappears. In Supabase: confirm `status = 'approved'`, `approved_by = user.id`, `approved_at` set.
12. Confirm `proposed_payload` was NOT modified.
13. Confirm no player profile, attendance, coach_observation, parent message, or player priority rows changed.
14. Confirm no template rows changed.
15. If all cards reviewed, confirm empty state appears.

---

## 2026-04-30 — Sprint 19: Structured Draft Review Queue V1

**Schema fields confirmed before coding:**
- `proposed_actions.id` — `string` ✓
- `proposed_actions.academy_id` — `string` ✓
- `proposed_actions.status` — `Enums['proposed_action_status']` — `'pending_review'` is a valid value ✓
- `proposed_actions.target_module` — `string` — filterable to `'session_recap_structuring'` ✓
- `proposed_actions.target_object_id` — `string | null` — holds session UUID ✓
- `proposed_actions.target_object_type` — `string | null` — `'session'` (informational only) ✓
- `proposed_actions.proposed_payload` — `Json` — holds `StructuredDraftPayload`; `draft_type` checked after fetch ✓
- `proposed_actions.created_at` — `string` ✓
- `proposed_actions.proposed_by_id` — `string` — FK to profiles ✓
- `proposed_actions.voice_command_id` — `string` (NOT NULL FK — Sprint 18 creates voice_commands row) ✓
- `sessions.id`, `sessions.name`, `sessions.scheduled_date` — confirmed ✓
- `profiles.id`, `profiles.display_name` — confirmed (no `full_name` on profiles) ✓
- `academy_memberships.profile_id`, `academy_memberships.role` (`user_role` enum), `academy_memberships.is_active` — confirmed ✓
- `user_role` enum: `academy_director | head_coach | coach | player | parent` ✓
- `proposed_action_status` enum: `pending_review | clarification_needed | approved | modified | rejected | executed | failed | expired` ✓
- No migrations needed — all required tables and columns exist ✓

**Files created:**
- `src/app/director/review/page.tsx` — Server Component. Security chain: auth → academy_id from profile → active membership check (academy_director or head_coach) → query proposed_actions by academy_id + status=pending_review + target_module=session_recap_structuring → post-fetch filter to draft_type=session_recap_structuring_v1 → batch-fetch session names/dates → batch-fetch proposer display_names → render StructuredDraftCard list. Empty state if no pending drafts. Never mutates any table.
- `src/app/director/review/StructuredDraftCard.tsx` — Server Component card. Exports `EnrichedDraftItem` interface and `StructuredDraftCard` component. Displays: draft label, session name/date, proposer name, created timestamp, safety banner, 4-count summary grid (detected players / attendance mentions / observation drafts / parent-safe drafts), director summary preview (3-line clamp), detected player chips, attendance mention rows with status colors, player observation previews (2-line clamp), parent-safe candidate count with note, link to source session detail.

**Files modified:**
- `src/components/nav/SidebarNav.tsx` — added `ClipboardList` import and `Review Queue` → `/director/review` nav item between Sessions and Competition in primary nav.
- `docs/CHANGELOG.md` — this entry

**Review queue behavior:**
1. Director opens `/director/review`
2. Auth and academy_director/head_coach membership verified server-side
3. All proposed_actions with status=pending_review and target_module=session_recap_structuring for this academy are fetched
4. Each card shows: session context (name, date), proposer name, created timestamp, draft count summary, director summary preview, detected players, attendance mentions, observation drafts preview, parent-safe draft count
5. "View Session" link on each card navigates to `/director/sessions/[sessionId]` for full session detail
6. Empty state message if no pending drafts exist yet
7. Sidebar nav shows "Review Queue" link with ClipboardList icon between Sessions and Competition

**Database read strategy:**
- Sequential queries per AI_BACKEND_RULES.md rule 5
- `rawDb = supabase as any` for proposed_actions query (avoids TS2589 — same pattern as session detail page)
- proposed_actions scoped to academy_id + status + target_module in DB query
- draft_type filter applied in memory after fetch (JSON field — not DB-filterable)
- Session info batch-fetched by target_object_id IN clause
- Proposer names batch-fetched by proposed_by_id IN clause
- All session/profile reads verified against academy_id (sessions: .eq('academy_id', academyId))

**Security checks:**
- Auth required (no user → early return)
- academy_id resolved from authenticated profile — never trusted from client
- academy_director or head_coach active membership verified before any data is shown
- proposed_actions query always includes .eq('academy_id', academyId) — no cross-academy reads
- sessions batch-fetch also filtered by .eq('academy_id', academyId)
- No service role; no RLS bypass

**What was not built:**
- Approve/apply draft button
- Reject/dismiss draft
- Edit draft
- Player profile updates from draft
- Attendance mutation from draft
- Parent-safe message creation or sending
- Coach observation creation
- Player priority updates
- Director intelligence feed writes
- Batch actions on multiple drafts
- Draft notifications or badges in real-time
- Analytics on draft processing rates
- AI API integration
- Voice transcription
- Audio upload

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure Sprint 18 has created at least one proposed_actions row with status=pending_review.
2. Open `/director/review`.
3. Confirm pending structured drafts appear as cards.
4. Confirm each card shows session name, session date, proposer name, 4-count grid, director summary preview, and safety banner.
5. Click "View Session" link — confirm navigates to `/director/sessions/[sessionId]`.
6. Confirm `/director/sessions/[sessionId]` still shows its own structured draft view (unchanged).
7. Confirm no player profiles changed.
8. Confirm no attendance changed.
9. Confirm no parent messages were created.
10. Confirm no proposed_actions status changed (still pending_review).
11. Confirm "Review Queue" link appears in sidebar nav between Sessions and Competition.
12. Confirm empty state message appears if no pending drafts exist.

---

## 2026-04-30 — Sprint 17: Coach Session Recap MVP

**Schema fields confirmed before coding:**
- `voice_notes` table (migration 010) — confirmed suitable for session-level recap:
  - `session_id UUID REFERENCES sessions(id)` — nullable, links recap to session ✓
  - `author_id UUID REFERENCES profiles(id)` — coach who wrote it ✓
  - `academy_id UUID NOT NULL` — multi-tenant boundary ✓
  - `raw_input TEXT NOT NULL` — stores typed recap text ✓
  - `transcript TEXT` — same as raw_input for V1 typed input ✓
  - `player_id UUID` — nullable; NULL = session-level (not player-specific) ✓
  - `processing_status TEXT DEFAULT 'pending'` — `'pending'` = raw, awaiting AI structuring ✓
  - `audio_path TEXT` — NULL for V1; field exists for V2 voice integration ✓
  - `parsed_observation_id UUID` — NULL until AI structures the recap (next sprint) ✓
  - RLS: `auth_is_staff()` covers coaches, head_coaches, directors ✓
- `coach_observations` — NOT used: `player_id NOT NULL` makes it unsuitable for session-level recaps (requires a specific player); used for per-player observations post-AI-parsing
- `sessions.session_notes` — NOT used: already used for execution notes during the session; different semantic
- No migration needed — `voice_notes` already exists and supports session_id + player_id=NULL pattern

**Files created:**
- `src/app/coach/sessions/[sessionId]/SessionRecapPanel.tsx` — `'use client'` component. Shows lightweight session context (session name, exercises completed count, attendance summary). Textarea with placeholder example. Character count (0/5,000). Voice-ready copy: "Voice capture will be added later. For now, type the recap the same way you would say it after class." Save Recap button (disabled when empty, useTransition for pending state). Success message on save: "Recap saved. Next sprint will structure this into attendance context, session actuals, player observations, and director updates for review." Error display with AlertCircle icon.
- `src/app/director/sessions/[sessionId]/SessionRecapSummary.tsx` — Server-renderable display component. Accepts `RecapEntry[]`. Empty state: "No coach recap recorded yet." Warning banner: "Raw coach recap — not yet AI-structured or parent-safe." Renders each recap with timestamp and whitespace-preserved text. Most recent first (sorted by caller).

**Files modified:**
- `src/app/coach/sessions/[sessionId]/actions.ts` — Added `SaveSessionRecapInput`, `SaveSessionRecapResult` interfaces and `saveSessionRecapAction` server action. Security chain: assertNotPreviewMode → auth → academy_id from profile → session ownership verified (academy_id match) → coach access check (session.coach_id === user or active membership in [coach, head_coach, academy_director]) → validate recap text (non-empty, max 5,000 chars) → insert voice_notes row (player_id=null, processing_status='pending', transcript=raw_input). Never updates templates, player profiles, player priorities, parent messages, or proposed_actions.
- `src/app/coach/sessions/[sessionId]/page.tsx` — Added step 6: fetch most recent session-level voice_note (player_id IS NULL, ordered by created_at DESC, limit 1, maybeSingle) to pre-populate recap textarea. Compute context: totalExercises, completedCount (from DB state), attendanceSummary ("N/M present" or null). Render `<SessionRecapPanel>` after the execution blocks section (always visible regardless of whether session has blocks).
- `src/app/director/sessions/[sessionId]/page.tsx` — Added step 9: fetch voice_notes for this session (player_id IS NULL, ordered by created_at DESC, limit 5). Added "COACH RECAP" section at the bottom of the page (after ROSTER & ATTENDANCE) with `<SessionRecapSummary>`. Read-only for director.
- `docs/CHANGELOG.md` — this entry

**Coach recap behavior:**
1. Open `/coach/sessions/[sessionId]`
2. Scroll to SESSION RECAP section (below execution blocks and attendance)
3. Session context shows: session name, exercises completed, attendance summary
4. Textarea pre-populated with most recent saved recap (empty on first visit)
5. Type recap text → Save Recap → success message with AI-structuring future hint
6. Refresh → textarea pre-populated with most recently saved recap

**Director recap visibility:**
1. Open `/director/sessions/[sessionId]`
2. Scroll to COACH RECAP section (below ROSTER & ATTENDANCE)
3. If coach has saved recaps: orange warning banner + recap text with timestamps (most recent first)
4. If no recap yet: "No coach recap recorded yet." empty state

**Database write strategy:**
- Each "Save Recap" inserts a NEW row in `voice_notes` (natural history of recap iterations)
- On page load: most recent recap pre-populates the textarea (fetch by session_id + player_id IS NULL + ORDER BY created_at DESC LIMIT 1)
- Director shows up to 5 most recent recaps
- Only table written: `voice_notes`
- Columns set: `academy_id`, `author_id`, `session_id`, `raw_input`, `transcript` (same as raw_input), `processing_status: 'pending'`
- `player_id` omitted (null) — session-level, not player-specific
- `audio_path` omitted (null) — V1 typed only
- `parsed_observation_id` omitted (null) — set later by AI structuring sprint

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Session verified against academy_id before write
- Coach access: session.coach_id === user.id OR active membership in [coach, head_coach, academy_director]
- Recap text validated server-side: non-empty, max 5,000 characters
- No RLS bypass; no service role

**What was not built:**
- AI extraction or structuring of recap text
- Player-specific parsed observations from recap
- Parent-safe summaries
- Director intelligence feed updates
- Player profile or player priority updates
- Automatic group recommendations
- Coach incentive/score dashboard
- Voice transcription integration (ElevenLabs, Whisper, browser recording)
- File/audio upload
- Author name display on director recap view (deferred — would require profiles join)

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a generated session exists.
2. Open `/coach/sessions/[sessionId]`.
3. Scroll to SESSION RECAP section at the bottom.
4. Confirm voice-ready copy is visible.
5. Type: "Sarah was absent. Maria was present. We skipped the speed block and spent extra time on forehand grip and preparation. Maria improved when cued to set the racket earlier."
6. Click Save Recap — confirm green success message with next-sprint note.
7. Refresh page — confirm recap text persists in textarea.
8. Open `/director/sessions/[sessionId]`.
9. Scroll to COACH RECAP section — confirm raw recap appears with orange warning banner and timestamp.
10. Confirm no player profile, parent message, template, player priority, or proposed_action rows were created.

---

## 2026-04-30 — Sprint 16: Session Group Assignment V1

**Schema fields confirmed before coding:**
- `sessions.group_id` — `string | null`, present in Row/Insert/Update ✓ — supports update
- `sessions.academy_id` — `string` ✓
- `groups.id`, `groups.name`, `groups.academy_id`, `groups.is_active: boolean` ✓ — filterable by academy_id and is_active
- `group_memberships.group_id`, `group_memberships.player_id`, `group_memberships.is_current`, `group_memberships.academy_id` ✓ — membership counts readable
- `academy_memberships.role` — enum `academy_director | head_coach | coach | player | parent` ✓
- No migrations needed — all required fields existed from Sprint 15

**Files created:**
- `src/app/director/sessions/[sessionId]/actions.ts` — `assignGroupToSessionAction` server action. Security chain: assertNotPreviewMode → auth → academy_id from profile → academy_director/head_coach membership required → session ownership verified → group verified (same academy, is_active=true) → update sessions.group_id only. Never touches templates, group_memberships, players, attendance, or player profiles.
- `src/app/director/sessions/[sessionId]/GroupAssignmentPanel.tsx` — `'use client'` component. Shows current group if assigned, dropdown of active groups with member counts, Save Group Assignment button. Disabled until a different group is selected. Success/error inline feedback. Empty state if no active groups.

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — added `GroupAssignmentPanel` import; added sequential queries for active groups (by academy_id + is_active) and their member counts (batch, single query); inserted GROUP ASSIGNMENT section (SectionHeader + Card + GroupAssignmentPanel) between session meta and blocks; updated empty-state copy for no-group roster to reference the assignment panel above.
- `src/app/director/sessions/page.tsx` — added `group_id` to session select; added batch group name fetch (step 5); updated session card to show group name or "No group" label.
- `docs/CHANGELOG.md` — this entry

**Director group assignment behavior:**
1. Open `/director/sessions/[sessionId]`
2. GROUP ASSIGNMENT section appears with dropdown of active groups (each shows member count)
3. If already assigned, current group name shown above dropdown
4. Select a group → Save Group Assignment button activates
5. On save: success message "Group assigned. Refresh to see the updated roster."
6. After refresh: ROSTER & ATTENDANCE section populates from group_memberships

**Database write strategy:**
- Single `UPDATE sessions SET group_id = ? WHERE id = ? AND academy_id = ?`
- Only column updated: `sessions.group_id`
- No other tables written

**Security checks:**
- `assertNotPreviewMode()` — writes blocked in preview
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Caller must be `academy_director` or `head_coach` in this academy (active membership)
- Session verified against academy_id before write
- Group verified against same academy_id and is_active=true before write
- No RLS bypass; no service role

**What was not built:**
- Group builder / group creation UI
- Group scheduling
- Manual player-to-session assignment (no group)
- Attendance analytics
- Player profile updates from attendance
- Voice group assignment
- Automatic group recommendations
- CSV import

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a generated session exists.
2. Open `/director/sessions/[sessionId]` — GROUP ASSIGNMENT section appears.
3. Confirm current group state shown (or blank if unassigned).
4. Select an active group from dropdown.
5. Click Save Group Assignment — success message appears.
6. Refresh page — group assignment persisted; ROSTER & ATTENDANCE shows players if group has current members.
7. Open `/coach/sessions/[sessionId]` — Attendance card shows group roster.
8. Mark attendance and save — confirm no templates, player profiles, or group membership rows changed.
9. Check `/director/sessions` list — group name (or "No group") shown on each session card.

---

## 2026-04-30 — Sprint 15: Session Attendance + Player Roster V1

**Schema findings confirmed before coding:**
- `session_attendance` ✓ — `id, session_id, player_id, status TEXT CHECK ('present','absent','late','excused'), notes, marked_by, marked_at`, `UNIQUE(session_id, player_id)`, RLS via sessions.academy_id join
- `sessions.group_id` ✓ — nullable; currently null for template-generated sessions
- `group_memberships` ✓ — `player_id, group_id, is_current (bool), academy_id`
- `groups` ✓ — `id, name, academy_id, is_active`
- `players` ✓ — `id, full_name, first_name, last_name, academy_id`
- No TS enum for attendance status — string union `'present' | 'absent' | 'late' | 'excused'` used
- No migrations needed

**Roster source logic:**
- `session.group_id` set → roster from `group_memberships WHERE group_id=X AND is_current=true AND academy_id=X` → joined with `players`
- `session.group_id` null → empty roster with explanation (template-generated sessions do not assign a group yet)

**Files modified:**
- `src/app/director/sessions/[sessionId]/page.tsx` — added `group_id` to session select; sequential roster fetch (groups → group_memberships → players → session_attendance); read-only Roster & Attendance section: group name, present/absent/late/excused/unrecorded counts, per-player AttendancePill; empty states for no group_id or no members
- `src/app/coach/sessions/[sessionId]/page.tsx` — added `group_id` to session select; exported `RosterPlayer` interface; sequential roster fetch (group_memberships → players → session_attendance); roster + existing attendance passed to CoachSessionExecutionClient; imported saveAttendanceAction
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — added `roster: RosterPlayer[]` and `saveAttendanceAction` props; attendance state (`attendanceMap` keyed by player_id, initialized from currentStatus); `isAttendancePending` / `attendanceResult` states; `markAttendance()` handler; `handleSaveAttendance()` handler (filters unset players, calls saveAttendanceAction); Attendance card rendered above execution blocks with per-player P/A/L/E buttons, result feedback; `attendanceActiveClass()` helper
- `src/app/coach/sessions/[sessionId]/actions.ts` — added `AttendanceUpdate`, `SaveAttendanceInput`, `SaveAttendanceResult` interfaces; added `saveAttendanceAction` function
- `docs/CHANGELOG.md` — this entry

**Security chain (saveAttendanceAction):**
- `assertNotPreviewMode()` guard
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Session must belong to coach's academy
- Coach access: either `session.coach_id === user.id` or active academy membership with allowed role
- `session.group_id` fetched from DB (never from client input)
- Valid player IDs fetched from `group_memberships` (is_current=true, matching group_id + academy_id)
- All submitted player IDs verified against valid set before any write
- Statuses server-validated against `('present','absent','late','excused')` (DB CHECK also enforces)
- Sequential upserts (per AI_BACKEND_RULES #5) — `UNIQUE(session_id, player_id)` ensures safe insert/update
- Only `session_attendance` updated — templates, player profiles, development priorities never touched

**What was not built (deferred):**
- Player-to-session manual assignment without a group (requires group_id or dedicated session_players table)
- Group builder / group scheduling
- Player profile development updates from attendance
- Voice recap, AI note structuring
- Parent messages
- Attendance analytics dashboard
- CSV import

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Ensure a generated session exists.
2. Open `/director/sessions/[sessionId]` — Roster & Attendance section appears at bottom. If session has no group, shows "No group assigned" empty state.
3. If session has group_id: group name, present/absent/late/excused counts, and per-player pills render.
4. Open `/coach/sessions/[sessionId]` — Attendance card appears above exercise blocks with P/A/L/E buttons per player (or empty state if no group).
5. Mark one player Present, one Absent, one Late — click Save Attendance. Confirm green success banner.
6. Refresh page — attendance persists. Director view reflects changes.
7. Confirm no template table rows changed (check templates, template_blocks, template_block_exercises).
8. Confirm no player development profile updates were made.

---

## 2026-04-30 — Sprint 14: Director Session Viewer + Coach Session Execution V1

**Schema findings confirmed before coding:**
- `sessions`: status enum `planned | in_progress | completed | cancelled` ✓, `session_notes` ✓
- `session_blocks`: no completion/status field — block-level partial/skipped deferred, UI copy added
- `session_block_exercises`: `completed` (boolean) ✓, `notes` ✓

**Files created:**
- `src/app/director/sessions/page.tsx` — Director sessions list. Fetches sessions for academy (newest first). Sequential batch queries: profiles for coach display names, templates for template names, session_blocks for block counts. Cards link to detail page. Empty state if no sessions.
- `src/app/director/sessions/[sessionId]/page.tsx` — Read-only director session detail. Shows: session name/date/time/duration, coach, status, source template, session notes, progress (completed exercises / total), ordered session blocks with ordered exercises, completion dots, exercise notes. rawDb cast for nested select (session_block_exercises → exercises). Cross-academy guard: session verified against academy_id. Planned-snapshot notice banner.
- `src/app/coach/sessions/[sessionId]/page.tsx` — Coach session execution server page. Fetches session (academy_id verified), template name, ordered blocks, ordered exercises with names (rawDb cast). Passes data to CoachSessionExecutionClient.
- `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx` — Client component. Exercise checkboxes (completed toggle), per-exercise notes textareas, session status selector (4 statuses), session notes textarea, Save Execution button with useTransition. Progress counter (N / total). Inline block-level deferral notice. Success/error result display.
- `src/app/coach/sessions/[sessionId]/actions.ts` — Server action `saveSessionExecutionAction`. Security chain: assertNotPreviewMode → auth → academy_id from profile → session ownership via academy_id → coach access check (session.coach_id === user or active membership in [coach, head_coach, academy_director]) → session status+notes update → session_blocks fetch to build valid block ID set → session_block_exercises fetch to build valid exercise ID set → reject any submitted exercise ID not in set → sequential per-exercise updates (completed, notes). Never touches template tables.

**Files modified:**
- `src/app/coach/sessions/page.tsx` — Added `Link` import and `formatDate`; sessions in Today section now link to `/coach/sessions/[id]`; added Upcoming section (sessions after today, ordered ascending, limit 10); extracted `SessionRow` component.
- `docs/CHANGELOG.md` — this entry

**Security chain (coach actions):**
- `assertNotPreviewMode()` guard
- Auth required
- `academy_id` resolved from authenticated profile (never trusted from client)
- Session must belong to coach's academy
- Coach access: either `session.coach_id === user.id` or active academy membership with allowed role
- Exercise IDs validated against this session's blocks before any update
- Sequential updates — no Promise.all
- Only session-layer tables updated: `sessions`, `session_block_exercises`
- `template_blocks`, `template_block_exercises`, `templates` never touched

**What was not built (deferred):**
- Block-level partial/skipped status (not in schema — UI copy added)
- Attendance, player roster, group scheduling
- Voice recap, AI note structuring
- Parent messages
- Exercise swapping / session override reordering
- Session generation from curriculum spine
- Director write on session detail

**TypeScript:** clean (`npx tsc --noEmit` — no output)

**Manual verification steps:**
1. Generate a session from a fitness template if none exist.
2. Open `/director/sessions` — session appears in list with date, coach, template name, block count.
3. Click session → `/director/sessions/[sessionId]` — blocks and exercises display in order; completion dots shown; planned-snapshot notice visible.
4. Open `/coach/sessions` — today's session appears with → link; upcoming section shows future sessions.
5. Click session → `/coach/sessions/[sessionId]` — blocks and exercises with checkboxes; session status buttons; notes textareas; Save Execution button.
6. Check one exercise, add a note, change status to in_progress, click Save Execution.
7. Refresh page — confirm changes persisted.
8. Open `/director/sessions/[sessionId]` — confirm execution changes reflected (dot filled, note shown).
9. Open the source fitness template → confirm template blocks unchanged.

---

Records completed build milestones in chronological order.
Update this file at the end of every completed module.

---

## 2026-04-30 — Sprint 13: Generate Session from Template

Added "Generate Session" to the fitness template detail page. Directors can now turn an official fitness template into a planned session snapshot. The master template is never mutated.

**Files created:**
- `src/app/director/fitness/templates/[templateId]/generate-session-actions.ts` — Server action `generateSessionFromTemplateAction`. Security chain: assertNotPreviewMode → auth → academy_id → template ownership → coach membership validation → template blocks fetch → reject if no blocks → template exercises fetch → insert session row (status=planned, template_id preserved) → insert session_blocks sequentially (template_block_id preserved for source tracking, is_override=false) → collect inserted block IDs → insert session_block_exercises sequentially. Returns `{ sessionId, error }`. Never touches templates/template_blocks/template_block_exercises.
- `src/app/director/fitness/templates/[templateId]/GenerateSessionPanel.tsx` — Client component. States: closed → form → generating → success/error. Form fields: session name (defaults from template name), session date (required), coach select (academy head_coach/coach profiles; falls back to director with label if none), optional notes. Success state shows generated session ID and explains that `/director/sessions` detail view is a future sprint. Error state shows inline message with AlertCircle icon.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Fetches active coaches (two sequential queries: `academy_memberships` filtered by role in [coach, head_coach] → `profiles` for display_name); adds `display_name` to initial profile select; renders `<GenerateSessionPanel>` between `<PageHeader>` and `<TemplateMeta>`.
- `docs/CHANGELOG.md` — this entry

**Snapshot strategy:**
- `sessions.template_id` → source template reference preserved
- `session_blocks.template_block_id` → source template block reference preserved
- Block order, exercise order, durations, names all copied at generation time
- Future template edits do not affect already-generated sessions (snapshot is independent)

**Security constraints:**
- `assertNotPreviewMode()` guard on server action
- Auth required; academy_id resolved from authenticated profile
- Template ownership verified via `academy_id` match before any read
- Coach validated as active academy member (director's own profile passes this check)
- Blocks must exist before generation is allowed
- Sequential inserts — no Promise.all (per AI_BACKEND_RULES #5)
- No service role; no RLS bypass; no template table mutations

**Not built (deferred):**
- `/director/sessions` route and session detail view
- Coach execution / live session runner
- Attendance, player roster, group scheduling
- Session overrides / coach-layer changes
- Voice recap, AI note structuring, parent messages
- Session completion recording

**TypeScript:** clean (`npx tsc --noEmit` — no output)

---

## 2026-04-30 — Sprint 12: Fitness Template Builder Save Verification + Edit Hardening

Hardened the Sprint 11 Fitness Template Builder. No new product features — reliability and security fixes only.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/actions.ts` — Six hardening additions:
  (1) Reject empty/missing IDs before any DB query.
  (2) Reject duplicate block IDs in submitted payload.
  (3) Reject duplicate exercise IDs in submitted payload.
  (4) Reject negative duration values at server level (client also validates, now double-checked).
  (5) Fix exercise block_id verification — now fetches `id, block_id` from DB and verifies each submitted exercise's `block_id` matches the actual DB record. Previous check only verified the exercise existed in *any* submitted block; a wrong submitted `block_id` would pass verification but cause the DB update to silently match no rows (silent data loss).
  (6) Add server-side `order_index` normalization — sort blocks and exercises (per block) by submitted `order_index`, then reassign as clean 0-based sequential integers. Ensures no gaps, no duplicates, no negative values written to DB regardless of client input. Critical for future voice command compatibility.
- `src/app/director/fitness/templates/[templateId]/TemplateEditor.tsx` — Three hardening additions:
  (1) `saveSuccess` state — shows "Template saved" with check icon after successful save, auto-clears after 3 seconds.
  (2) Master template warning — edit mode now shows: "Director edits update the official template. Coach changes during live sessions will be handled as session overrides and will not affect this master template." This is architecturally important to distinguish master-template writes from future coach session overrides.
  (3) `confirmedBlocks` and `editBlocks` initialized with `deepCopyBlocks` (lazy initializer) so they never share object references with `initialBlocks` props from the server.

**Constraints confirmed:**
- No migrations
- No npm install
- No service role
- No RLS bypass
- No new product features (no drag/drop, create, delete, publish, voice, session generation)
- TypeScript: clean (`npx tsc --noEmit` passes with no output)

---

## 2026-04-30 — Sprint 11: Fitness Template Builder V1 (Director Edit Mode)

Added director-only edit mode to the fitness template detail page. Directors can now reorder blocks, reorder exercises within blocks, and edit durations — all from the existing read-only viewer at `/director/fitness/templates/[templateId]`.

**Files created:**
- `src/app/director/fitness/templates/[templateId]/actions.ts` — Server action `saveTemplateEditsAction` with 5-step security chain (auth → academy_id → template ownership → block ID validation → exercise ID validation). Defines `TemplateOperation` type union aligned with future voice command pathway (`reorder_block`, `reorder_exercise`, `update_block_duration`, `update_exercise_duration`). Sequential per-row updates with double-lock `.eq('id') + .eq('template_id'/'block_id')`.
- `src/app/director/fitness/templates/[templateId]/TemplateEditor.tsx` — `'use client'` component managing read/edit mode toggle. Up/down chevron buttons for block and exercise reordering (no drag/drop — no library installed). Editable `<input type="number">` for `block.duration_min` (required) and `exercise.duration_min` (nullable). Save/Cancel controls with `useTransition` for pending state. Array position → `order_index` on save.

**Files modified:**
- `src/app/director/fitness/templates/[templateId]/page.tsx` — Builds `EditableBlock[]` shape from fetched data; renders `<TemplateEditor>` instead of static block cards; removed "Read-only" lock badge (mode indicator now lives in TemplateEditor).

**Constraints confirmed:**
- No migrations created
- No packages installed
- No service role used
- No RLS bypass
- No create/delete/publish/duplicate
- No voice UI
- TypeScript: clean (`npx tsc --noEmit` passes with no output)

## 2026-04-29 — Coach Workspace Navigation V1

Added safe, demo-ready shell pages for the three missing coach nav routes. Bottom nav is now fully navigable.

**Files created:**
- `src/app/coach/players/page.tsx` — async Server Component; calls `getCoachWorkspaceSummary`; renders assigned players only (filtered via `coach_group_assignments`); initials avatar + `full_name` + `group_name · level_label` + `player_status` badge; `EmptyState` fallback; no edit actions; no links to player profiles
- `src/app/coach/sessions/page.tsx` — async Server Component; calls `getCoachWorkspaceSummary`; renders today's sessions with name, `scheduled_time`, and status badge; `EmptyState` fallback; coming-soon footer (Session plans · Attendance · Group check-in)
- `src/app/coach/voice/page.tsx` — sync static Server Component; no Supabase imports; hero card + three disabled coming-soon tiles (Record Voice Note, Structure into Observation, Review Before Saving) + coach-review safety note; no `voice_notes` queried

**No files modified** beyond this changelog.

**Constraints confirmed:**
- No migrations created
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform actions changed
- No server actions changed
- No backend helper changes (`coachWorkspace.ts` untouched)
- No layout changes (`coach/layout.tsx` untouched)
- No BottomTabBar changes
- No player or parent portal changes
- No service role / `getSupabaseAdmin` used
- No write actions added
- No `voice_notes` queried
- No AI drafts queried
- No fake data — real queries with `EmptyState` fallbacks; voice page is fully static
- `player_status` used (not `status`) — verified against `v_player_summary` in `database.types.ts`
- PreviewBanner inherited automatically from `coach/layout.tsx` on all three new routes
- BottomTabBar highlights correctly: Players/Sessions/Voice use `startsWith`, Home uses `exact: true`

TypeScript: clean.

**Manual test steps:**
1. `npm run dev`
2. Log in as platform user → `/platform`
3. Click "Preview as Coach" on any academy card → `/coach` loads with PreviewBanner
4. Click "Players" tab → `/coach/players` loads; Players tab highlighted; player list or empty state; no 404
5. Click "Sessions" tab → `/coach/sessions` loads; Sessions tab highlighted; today's sessions or empty state; no 404
6. Click "Voice" tab → `/coach/voice` loads; Voice tab highlighted; hero card + 3 tiles + safety note; no 404
7. Click "Home" tab → `/coach` loads; only Home tab highlighted (exact match)
8. Click "Exit Preview" → `/platform`
9. No runtime errors on any route

---

## 2026-04-29 — Platform Preview Mode Infrastructure (Phase 1B)

Enables platform users (platform_owner / platform_admin) to enter a read-only preview of any academy's portal UI, scoped to a chosen role. Writes are blocked in preview. Normal academy users are completely unaffected.

**Files created:**
- `src/lib/utils/previewMode.ts` — `PreviewRole` type, `PreviewContext` interface, `PREVIEW_COOKIE` constant; `parsePreviewCookie()` (pure, safe for Edge/middleware); `getPreviewContext()`, `isPreviewMode()`, `assertNotPreviewMode()` (Server Component / Server Action use only, via dynamic `import('next/headers')` to avoid Edge Runtime issues)
- `src/lib/actions/platform.ts` — `enterPreviewModeAction(academyId, role)`: authenticates user, verifies platform_roles row, validates role, reads academy name, sets httpOnly `ao_preview` cookie (sameSite strict, 8-hour maxAge, secure in production), redirects to correct portal; `exitPreviewModeAction()`: deletes cookie, redirects to /platform
- `src/components/platform/PreviewBanner.tsx` — async Server Component; reads preview context via `getPreviewContext()`; renders lime-accented banner with role, academy name, "Writes are disabled in preview." note, and Exit Preview form button; returns null when not in preview

**Files modified:**
- `src/middleware.ts` — platform user routing refactored: /platform still always accessible; root `/` still redirects to /platform; portal routes (director/coach/player/parent) now require a valid `ao_preview` cookie with matching role — no matching cookie → redirect to /platform; non-platform users are completely unaffected (their path is structurally separated and unchanged)
- `src/app/platform/page.tsx` — each academy card now has a "Preview Portal" section with 4 buttons (Director / Coach / Player / Parent); each button binds `enterPreviewModeAction` with the academy ID and role; "Preview Mode" removed from coming-soon module cards
- `src/app/director/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/app/coach/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/app/player/layout.tsx` — removed `'use client'` (layout has no hooks; BottomTabBar carries its own `'use client'`); `<PreviewBanner />` added above `{children}`
- `src/app/parent/layout.tsx` — `<PreviewBanner />` added above `{children}` inside `<main>`
- `src/lib/actions/notes.ts` — `await assertNotPreviewMode()` added as first line of `addObservationAction`, `updateDevelopmentSummaryAction`, `addVoiceNoteAction`; `generateNoteDraftAction` is NOT guarded (no DB write)
- `src/lib/actions/curriculum.ts` — `await assertNotPreviewMode()` added as first line of `assignCurriculumAction`, `evaluateAdvancementAction`
- `src/components/nav/PlatformNav.tsx` — "Preview Mode" removed from `COMING_SOON_ITEMS` (preview is now live in academy cards)

**Constraints confirmed:**
- No migrations created
- No schema changes
- No service role / `getSupabaseAdmin()` used
- `ao_preview` cookie only benefits platform users (middleware ignores it for non-platform users)
- Writes blocked in preview: `assertNotPreviewMode()` guards all 5 mutating server actions
- Normal director/coach/player/parent users are completely unchanged
- No coach/player/parent shell improvements built
- No fake data created
- No academy_memberships created or modified
- No database roles changed
- No RLS bypassed
- Cross-academy live data preview deferred (RLS still uses profiles.academy_id)

**Preview mode scope (Phase 1B):**
Preview shows the portal shell and any data the authenticated platform user's own Supabase session can read via normal RLS. It does not bypass RLS or show cross-academy private data. Full cross-academy data preview is deferred to a future approved RLS migration.

TypeScript: clean.

**Manual test steps:**
1. Log in as platform user → land on /platform
2. On an academy card, click "Director" → `ao_preview` cookie set → redirected to /director with PreviewBanner visible
3. Attempt "Assign Curriculum" or "Add Observation" → should throw "Writes are disabled in preview mode."
4. Click "Exit Preview" → cookie deleted → redirected to /platform
5. Repeat with Coach / Player / Parent roles — each shows correct PreviewBanner
6. Log in as a normal academy_director → /platform should redirect to /director; `ao_preview` cookie (if present) has no effect
7. As platform user with no preview cookie, manually visit /director → redirected to /platform

---

## 2026-04-29 — Multi-Tenant Access Foundation Phase 1A: Platform Role + Shell

Established the minimum safe platform-owner foundation. Angles / platform owner can now log in, be routed to `/platform`, and view all academy tenants read-only.

**Files created:**
- `supabase/migrations/040_platform_roles.sql` — `platform_roles` table (user_id → platform_owner | platform_admin); RLS: users see own active row only; additive SELECT policy on `academies` so platform users can list all tenants via anon key (no service role needed)
- `src/lib/backend/platform.ts` — two backend helpers: `getPlatformRole(db, userId)`, `getAllAcademies(db)`; rawDb cast for platform_roles (not yet in database.types.ts)
- `src/components/nav/PlatformNav.tsx` — fixed sidebar for /platform routes; shows "Angles Platform" brand + role badge; primary nav (Tenants); coming-soon items (Tenant Management, Consultant Access, Preview Mode, Billing, Global Templates); sign-out button
- `src/app/platform/layout.tsx` — Server Component; verifies platform role (redirects to /login if not found); renders PlatformNav + main content
- `src/app/platform/page.tsx` — Server Component; shows Platform Command Center header with role badge; academy tenant cards (name, slug, country, timezone, is_active badge, created date); coming-soon module cards; no player data, no private data

**Files modified:**
- `src/middleware.ts` — checks platform_roles BEFORE academy_memberships; /platform routes allow only platform users (others redirected to their academy home); root `/` redirects platform users to /platform; non-platform routes with no matching academy role redirect platform users back to /platform (e.g. a platform_owner also with academy_director membership can still access /director)
- `src/app/login/LoginForm.tsx` — checks platform_roles after successful auth; platform users immediately routed to /platform before academy membership check runs
- `docs/CHANGELOG.md` — this entry

**Constraints confirmed:**
- No preview mode built
- No consultant access built
- No write guards added (deferred to Phase 1B)
- No service role / `getSupabaseAdmin()` used in /platform routes — anon key + RLS only
- No player data, coach notes, voice notes, AI drafts, or private observations shown
- No modifications to profiles.academy_id, academy_memberships, database.types.ts, or any locked modules
- No schema changes beyond migration 040
- Existing /director, /coach, /player, /parent routing unchanged

**To activate:**
1. Apply migration 040 in Supabase Dashboard (SQL Editor)
2. Manually INSERT a row into `platform_roles` for the platform owner's auth.users UUID
3. Run `supabase gen types typescript` to update database.types.ts after migration

TypeScript: clean.

---

## 2026-04-28 — Guardrail and source-of-truth layer

Created the permanent Claude Code guardrail system before further feature work.

**Files created:**
- `CLAUDE.md` — root-level Claude session instructions, design system reference, architecture red lines
- `docs/AI_BACKEND_RULES.md` — backend safety rules (10 rules, backend file status table)
- `docs/CURRENT_BUILD_TARGET.md` — current build phase and step-by-step build order
- `docs/LOCKED_MODULES.md` — locked / in-progress / not-built module registry
- `docs/KNOWN_LIMITATIONS.md` — documented gaps, missing features, stale docs warnings
- `docs/MODULE_BUILD_PROCESS.md` — 8-step process for every future build task
- `docs/CHANGELOG.md` — this file

**No app functionality changed.**
**No backend files changed.**
**No frontend files changed.**

---

## 2026-04-27 — Backend stable, TypeScript clean

All backend files in `src/lib/backend/` compile without TypeScript errors.

Covered:
- `director.ts` — player profile data, recommendation overrides
- `players.ts` — player list, signals, priorities, recommendations, progress snapshots
- `curriculum.ts` — domain progress, assignment RPC, advancement evaluation RPC
- `assessments.ts` — create assessment, placement recommendations, finalize placement
- `sessions.ts` — session CRUD, session recommendations, attendance, outcomes
- `dashboard.ts` — priority queue, group summaries, reassessment pipeline
- `intelligence.ts` — behavior profiles, predictions, coaching messages
- `utr.ts` — UTR recording, history, insights
- `voice.ts` — voice command submission, proposed action approval/rejection/execution

TypeScript: clean.

---

## 2026-04-27 — Initial role-based app shell

Framework, auth, and layout shells committed.

- Next.js 14 App Router initialized
- Supabase Auth with email+password
- Middleware role routing: director → `/director`, coach → `/coach`, player → `/player`, parent → `/parent`
- Director sidebar layout (`SidebarNav`)
- Coach/Player/Parent bottom tab layout (`BottomTabBar`)
- Login page (`/login`) fully functional
- Signout API route (`/api/auth/signout`)
- Tailwind design system configured (dark base, lime accent)
- UI component library created: Card, MetricCard, ActionCard, StatusBadge, LevelBadge, ProgressBar, Avatar, EmptyState, LoadingSkeleton, SectionHeader, Modal, Tabs, Table, SearchFilterBar, DomainRing

---

## 2026-04-27 — Player Profile v0

First real feature page built at `/director/players/[playerId]`.

What works:
- Player header: name, initials avatar, level badge, advancement status, last evaluated date
- Curriculum grid: 8-domain skill progress (status, mastery %, blocked-by list)
- Player info sidebar: status, join date, DOB, notes
- Coach Focus sidebar: advancement evaluation button, domain summary counts, blocked-by list
- Assign curriculum Server Action
- Evaluate advancement Server Action
- Loading skeleton (`loading.tsx`)
- Empty state when no curriculum is assigned

Data: all real Supabase queries (no mock data).

Known gaps logged in `docs/KNOWN_LIMITATIONS.md`:
- No tab structure yet
- 3-column fixed layout not mobile-safe
- Back link points to stub dashboard (will fix after Players List is built)

TypeScript: clean.

---

## 2026-04-28 — Players List

Built the player directory at `/director/players` (Step 1 of Phase 1).

**Files created:**
- `src/app/director/players/page.tsx` — Server Component; fetches academy_id from profiles, calls `getPlayerSummaries()`, renders page header and client component
- `src/app/director/players/_components/PlayersDirectoryClient.tsx` — Client Component; search by name, filter by status (All / Active / Reassessment Due / On Hold / Pending), player rows with Avatar, StatusBadge, LevelBadge, last assessed date, next due date with overdue indicator, promotion-ready chip
- `src/app/director/players/loading.tsx` — Next.js skeleton; 8 SkeletonRows inside a Card

**No backend files changed.**
**No locked files changed.**
TypeScript: clean.

---

## 2026-04-28 — Player Profile responsive layout (Step 2)

Fixed the broken 3-column fixed layout at `/director/players/[playerId]`.

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — replaced `grid-cols-[260px_1fr_260px]` with responsive `grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_240px]`; added `lg:col-span-2 xl:col-span-1` to Coach Focus column so it spans full width at `lg` and returns to a single column at `xl`; added `p-6` to page wrapper
- `src/components/player/PlayerProfileHeader.tsx` — fixed back link from `/director` → `/director/players`, label from `Dashboard` → `All Players`

**No backend files changed.**
**No locked files changed.**
TypeScript: clean.

---

## 2026-04-28 — Director layout sidebar offset fix

Fixed content rendering underneath the fixed sidebar on all `/director` routes.

**Files modified:**
- `src/app/director/layout.tsx` — added `ml-60` to `<main>` so content is offset 240px right, matching the fixed sidebar width. Single global fix; no per-page hacks needed.

**No backend files changed.**
**No locked files changed.**
**No player profile data logic changed.**
TypeScript: clean.

---

## 2026-04-28 — Director Dashboard V1

Built the command center at `/director` (Step 5 of Phase 1, built ahead of Steps 3–4 by explicit request).

**Files modified:**
- `src/app/director/page.tsx` — replaced 6-line stub with full Server Component dashboard

**Data fetched (sequential per AI_BACKEND_RULES):**
- `profiles` → `academy_id`
- `academies` → `name` (for header)
- `getPlayerSummaries()` → all 4 snapshot metrics + pending placement list
- `getAcademyPriorityQueue({ limit: 5 })` → priority panel

**Sections built:**
- Header: academy name label + "Command Center" H1 + today's date
- Snapshot metrics: Total Players / Active / Pending Placement / Needs Attention (all real data)
- Priority Queue card: top 5 priority items with urgency badge + primary action; empty state if none
- Pending Placement card: up to 5 pending players with status badge; empty state if none
- Module cards: Players (live, links to `/director/players`) + 5× Coming Soon (Curriculum, Sessions, Intelligence, Reports, Configuration)

**No backend files changed.**
**No locked files changed.**
**No fake numbers — all metrics derived from real Supabase queries.**
TypeScript: clean.

---

## 2026-04-29 — Player Profile tab structure (Step 3)

Added 5-tab workspace to the Player Profile at `/director/players/[playerId]`.

**Files created:**
- `src/app/director/players/[playerId]/_components/PlayerProfileTabs.tsx` — minimal Client Component; accepts 5 `ReactNode` slots; renders `Tabs` with `scrollable` TabsList and one `TabsContent` per tab

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — refactored layout from 3-column grid into 5 named slot variables passed to `PlayerProfileTabs`

**Tab breakdown:**
1. Overview — Player Info card + Coach Focus summary (domain counts, advancement status); no action button
2. Skill Path — EvaluateAdvancementButton + advancement eligible/blocked-by logic + CurriculumProgressGrid or PlayerCurriculumEmptyState
3. Competition — premium `EmptyState` placeholder; no fake data
4. Fitness / Load — premium `EmptyState` placeholder; no fake data
5. Notes — premium `EmptyState` placeholder; no fake data; prepares for Coach Notes + Voice Notes

**Architecture notes:**
- `page.tsx` remains a Server Component; all data fetching unchanged
- Server actions (`assignAction`, `evaluateAction`) remain bound in the Server Component and passed to child Client Components via slot content — no function references cross the Server → `PlayerProfileTabs` boundary
- Icons (`Trophy`, `Activity`, `MessageSquare`) are imported and rendered in `page.tsx` (Server Component) as part of slot JSX; no icon function references passed as props
- `TabsList scrollable` prop handles horizontal tab overflow on narrow viewports

**No backend files changed.**
**No Supabase files changed.**
**No locked modules changed.**
**No fake data added.**
TypeScript: clean.

---

## 2026-04-29 — Coach Notes Foundation (Phase 1)

Built the real Notes tab for coach-facing player development notes.

**Files created:**
- `supabase/migrations/039_player_development_summary.sql` — new `player_development_summary` table; full RLS (staff read/write, players/parents gated behind show_to_student/show_to_parent flags which default false)
- `src/lib/backend/notes.ts` — four backend helpers: `getCoachObservations`, `createCoachObservation`, `getPlayerDevelopmentSummary`, `upsertPlayerDevelopmentSummary`; uses `rawDb = db as any` for the new table (types will resolve after migration + `supabase gen types`)
- `src/lib/actions/notes.ts` — two server actions: `addObservationAction`, `updateDevelopmentSummaryAction`; authenticated, validated, revalidates player profile path
- `src/components/player/CoachObservationTimeline.tsx` — renders coach_observations for a player in reverse-chronological order; Internal badge when is_private; empty state
- `src/components/player/DevelopmentSummarySection.tsx` — read-only display of development summary; shows strengths, priorities, development focus, coach summary, student-facing preview with visibility labels
- `src/components/player/AddObservationForm.tsx` — client form; observation_type dropdown (all 8 existing values), content textarea, is_private toggle (defaults true/internal)
- `src/components/player/EditDevelopmentSummaryForm.tsx` — client form; newline-separated strengths/work-ons converted to arrays; visibility toggles rendered but disabled (future sprint gate)

**Files modified:**
- `src/app/director/players/[playerId]/page.tsx` — replaced Notes tab placeholder with real UI; sequential data fetching for observations and development summary; bound server actions for forms

**Constraints confirmed:**
- No voice features built
- No AI structuring built
- No fake or hardcoded notes
- Coach-only notes not exposed to player or parent routes (RLS + show_to_student/show_to_parent default false)
- coach_observations schema untouched
- voice_notes schema untouched
- parent_updates schema untouched
- No locked modules modified

**Migration note:** Migration `039` must be applied and `supabase gen types typescript` run before deploying. The `player_development_summary` backend helpers use `rawDb = db as any` until types are regenerated.

TypeScript: clean.

---

## 2026-04-29 — Voice Note Capture MVP (transcript-first)

Added transcript-first voice note capture to the Notes tab.

**Files created:**
- `src/components/player/AddVoiceNoteForm.tsx` — client form; textarea for transcript (with device dictation microcopy), observation_type dropdown, is_private toggle (default true); follows AddObservationForm pattern with useTransition

**Files modified:**
- `src/lib/backend/notes.ts` — added `createVoiceNoteWithObservation()`: three sequential queries — insert voice_notes (processing_status=pending), insert coach_observations, update voice_notes.parsed_observation_id + processing_status=parsed
- `src/lib/actions/notes.ts` — added `addVoiceNoteAction()`: authenticates user, validates transcript and observation_type, calls createVoiceNoteWithObservation, revalidatePath
- `src/app/director/players/[playerId]/page.tsx` — imported AddVoiceNoteForm and addVoiceNoteAction; bound server action; added AddVoiceNoteForm below AddObservationForm in notesSlot

**Architecture constraints confirmed:**
- No migration created — voice_notes already existed in migration 010 and database.types.ts
- No schema changes — voice_notes, coach_observations, player_development_summary untouched
- No browser recording, audio upload, Supabase Storage, transcription, or AI structuring
- No voice command execution or proposed_actions pipeline
- Voice notes are staff-only (existing RLS); resulting observations default is_private=true
- No player or parent exposure

**Data flow:** transcript → voice_notes row (processing_status=parsed) → coach_observations row via parsed_observation_id → appears in CoachObservationTimeline immediately

TypeScript: clean.

---

## 2026-04-29 — AI Note Structuring MVP

Added coach-reviewed AI draft generation for player development summaries.

**Files created:**
- `src/lib/ai/structureCoachNote.ts` — Anthropic SDK call; `AIDraftResult` type; system prompt enforcing tennis coaching tone; JSON validation; safe error on missing API key
- `src/components/player/AIDraftPanel.tsx` — client component; note textarea; "Draft with AI" button with loading state; editable draft fields (strengths, work-ons, focus, coach summary, student summary); confidence badge; warnings display; overwrite warning with explicit confirmation gate when existing summary has content; "Apply Draft to Summary" form submission

**Files modified:**
- `src/lib/actions/notes.ts` — added `generateNoteDraftAction()` server action; authenticated; returns `GenerateDraftResult` (ok+draft or error string); does not write to database
- `src/app/director/players/[playerId]/page.tsx` — imported `AIDraftPanel`, `generateNoteDraftAction`; inserted `AIDraftPanel` in Notes tab between `DevelopmentSummarySection` and `EditDevelopmentSummaryForm`
- `package.json` / `package-lock.json` — added `@anthropic-ai/sdk`

**Constraints confirmed:**
- No migration created
- No schema changes (player_development_summary, coach_observations, voice_notes untouched)
- No AI output auto-saved — coach must click "Apply Draft to Summary"
- show_to_student and show_to_parent hardcoded false in apply form
- source set to 'ai_draft' on apply
- API key never exposed to client — call is server-side only
- Overwrite protection: if existing summary has content, a warning block appears and coach must click confirm before the apply form is shown
- Player and parent routes not modified
- No fake or hardcoded AI responses

TypeScript: clean.

---

## 2026-04-29 — Coach / Player / Parent Shell V1

Premium shell pages for all three non-director portals. Shell-only — no data queries, no private data exposure, no fake data.

**Files modified:**
- `src/app/coach/page.tsx` — Coach Hub shell: header with current date, Today's Sessions card (EmptyState + coming-soon footer), My Players + Recent Notes in sm:grid-cols-2 with "Soon" badges, 4 disabled Quick Action tiles (opacity-50 / cursor-not-allowed), On the Roadmap pills
- `src/app/player/page.tsx` — Player Home shell: "YOUR JOURNEY" header, motivating tagline, Today's Mission (lime accent), My Skills, Wins & Streaks, Messages cards (all EmptyState), Coming Soon pill row
- `src/app/parent/page.tsx` — Parent Home shell: "FAMILY PORTAL" header, Child's Progress (lime accent), Latest Coach Update, Session Consistency, Support at Home (static safe copy — no data), Messages & Updates cards

**Constraints confirmed:**
- No new files created
- No migrations
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform action changes
- No server action changes
- No backend helper changes
- No layout changes
- No BottomTabBar changes
- No Supabase queries — all three pages are plain sync Server Components
- No async added to any page
- No private coach notes, AI drafts, voice transcripts, or internal summaries exposed to player or parent
- No fake data — all cards use EmptyState or safe static copy
- PreviewBanner continues rendering from layouts (untouched)

TypeScript: clean.

**Manual test steps:**
1. Log in as platform user → /platform loads
2. Click "Preview as Coach" on any academy card
   → /coach loads with PreviewBanner visible
   → Coach Hub header + today's date visible
   → Today's Sessions, My Players, Recent Notes, Quick Actions, Roadmap all visible
   → Bottom nav: Home / Players / Sessions / Voice — all render
   → No runtime errors
3. Click "Exit Preview" → /platform
4. Click "Preview as Player" on any academy card
   → /player loads with PreviewBanner visible
   → Player Home header + tagline visible
   → Today's Mission, My Skills, Wins & Streaks, Messages cards visible
   → Coming Soon pills visible
   → Bottom nav: Home / Progress / Wins / Messages — all render
   → No coach observations, notes, AI drafts, or voice transcripts visible
   → No runtime errors
5. Click "Exit Preview" → /platform
6. Click "Preview as Parent" on any academy card
   → /parent loads with PreviewBanner visible
   → Parent Home header visible
   → Child's Progress, Latest Coach Update, Session Consistency, Support at Home, Messages & Updates visible
   → No gamified player language, no coach observations, no internal notes
   → No runtime errors
7. Click "Exit Preview" → /platform

---

## 2026-04-29 — Coach Workspace Real Data V1

Replaced the static Coach Hub shell with real Supabase data. No fake data, no new schema, no service role usage.

**Files created:**
- `src/lib/backend/coachWorkspace.ts` — `getCoachWorkspaceSummary(db, userId)`: sequential RLS-respecting queries; fetches coach profile → active group assignments → assigned groups (v_group_summary) → assigned players (v_player_summary filtered by group IDs) → recent coach_observations (by coach, not voice_notes) → player name resolution → today's sessions. Returns typed `CoachWorkspaceSummary` with graceful empty fallback.

**Files modified:**
- `src/app/coach/page.tsx` — converted from static shell to async Server Component; calls `getCoachWorkspaceSummary`; Today's Sessions renders real session rows with status badge; My Players renders up to 5 assigned players with initials avatar and group/level detail; Recent Notes renders up to 5 recent coach_observations with type label, Internal badge, and truncated content; all sections fall back to `EmptyState` when no data.

**Constraints confirmed:**
- No migrations created
- No schema changes
- No database.types.ts changes
- No middleware changes
- No preview mode logic changes
- No platform actions changed
- No server actions changed
- No player page, parent page, or layout changes
- No BottomTabBar changes
- No service role / getSupabaseAdmin used
- No write actions added
- No voice_notes queried
- No AI drafts queried
- No fake data
- RLS not broadened
- Unassigned players not shown — players filtered only through coach's assigned group IDs via coach_group_assignments

TypeScript: clean.

**Manual test steps:**
1. `npm run dev`
2. Log in as platform user → /platform
3. Click "Preview as Coach" on an academy card
   → /coach loads with PreviewBanner visible
   → Today's Sessions: real sessions or empty state
   → My Players: real assigned players or empty state
   → Recent Notes: real coach_observations or empty state
4. Click "Exit Preview" → /platform

---

## Next build target

**Player Profile tab content** — fill Step 4 tabs with real backend data

See `docs/CURRENT_BUILD_TARGET.md` Step 4 for full specification.
