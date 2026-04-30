# Changelog

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
