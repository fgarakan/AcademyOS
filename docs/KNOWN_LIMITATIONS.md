# Known Limitations

**Last updated:** 2026-05-06

This file documents what is currently broken, missing, or intentionally incomplete.
These are not bugs to fix immediately — they are known gaps that future sessions should be aware of.

---

## Live Transcription Activation (Sprint 88)

### OPENAI_API_KEY must be added to .env.local manually
- **Status:** Transcription endpoint is built and safe. `.gitignore` created (was missing — now protects `.env.local` and other sensitive files). `OPENAI_API_KEY` is not yet set in local environment.
- **To activate:** Add `OPENAI_API_KEY=sk-...` to `.env.local`, then restart the dev server.
- **Verification:** Call `POST /api/coach/sessions/{id}/transcribe` with a valid audio blob. If key is correct, returns `{ ok: true, transcript: "..." }`. If key missing or wrong, returns 503 or 502.
- **Key safety:** `OPENAI_API_KEY` is read via `process.env.OPENAI_API_KEY` (no `NEXT_PUBLIC_` prefix). Never exposed to the browser.
- **gitignore:** `.gitignore` now exists and covers `.env.local`, `.env`, `.next/`, `node_modules/`, `tsconfig.tsbuildinfo`, `supabase/.temp/`.

---

## Voice Demo Hardening (Sprint 87)

### Voice flow is demo-ready but requires OPENAI_API_KEY for production transcription
- **Status:** Full end-to-end flow documented and UI-complete. Coach audio recording → secure endpoint → Whisper transcript → coach edits → wrap-up save → director review → approve → apply. All states handle gracefully when API key is absent.
- **Remaining gap for live transcription:** Set `OPENAI_API_KEY` in server environment.
- **Parent/player safety:** Verified — no internal coach notes, transcript, or observations reach parent or player portals through any voice action.
- **Manual QA:** 35-check test table added to `docs/V1_MANUAL_TEST_CHECKLIST.md` covering Sprints 78–87.

---

## TTS Upgrade Readiness (Sprint 86)

### Production TTS is documented but not yet built
- **Plan:** `docs/assistant-tts-upgrade-plan.md`
- **Impact:** Voice output still uses browser `speechSynthesis` (prototype only). Planned upgrade: OpenAI TTS (V2) → ElevenLabs (V3 optional). V2 requires `OPENAI_API_KEY` to be set and a `/api/assistant/speak` endpoint to be built. A "Stop Speaking" button now appears next to the voice toggle when active in CoachWrapUpDrawer.
- **Pre-V2 requirements:** DPA for OpenAI, server-side TTS endpoint, academy voice settings schema.

---

## Director Assistant Voice Intake (Sprint 85)

### Voice command routing is deterministic — no AI NLU
- **File:** `src/app/director/command-center/DirectorAssistantPanel.tsx`
- **Impact:** Voice transcription fills the text input. `matchVoiceToSuggestion()` uses keyword matching (7 topic patterns) to select the corresponding suggestion chip response. Complex or ambiguous commands (e.g. "what's going on with the under-12s") will not match and show the fallback note. There is no multi-turn context and no memory between voice sessions.
- **Browser support:** Voice uses `SpeechRecognition` / `webkitSpeechRecognition` — Chrome/Edge only. Unsupported browsers show a fallback note. The text input works on all browsers.
- **No auto-actions:** Matching a voice command to a suggestion shows the response card but does not execute anything.

---

## Apply Approved Wrap-Up (Sprint 84)

### applyWrapUpDraftAction writes to sessions.session_notes — full session actuals table not yet built
- **File:** `src/app/director/review/applyWrapUpDraftAction.ts`
- **Impact:** Applying an approved wrap-up writes a structured text summary to `sessions.session_notes` and advances `sessions.status` to `completed`. This is a safe, reversible text write — no schema migration required. A dedicated `session_actuals` table with normalized fields (per-block outcomes, attendance deltas, coach-to-parent links) would provide richer reporting but is not yet built.
- **What is safe:** Session notes, session status, audit log write, proposed_action status = executed.
- **What is not affected:** Template, template blocks, curriculum, attendance records, player profiles, parent/player portals.
- **Fix path:** When `session_actuals` table is designed and migrated, extend `applyWrapUpDraftAction` to populate normalized fields in addition to `session_notes`.

---

## Director Wrap-Up Review (Sprint 83)

### Approve/Reject controls are built and functional
- **Files:** `src/app/director/review/WrapUpDraftDecisionControls.tsx`, `src/app/director/review/actions.ts` (`updateWrapUpDraftDecisionAction`), `src/app/director/review/ApplyWrapUpDraftControls.tsx`, `src/app/director/review/applyWrapUpDraftAction.ts`
- **Status:** Fully implemented. Approve → marks `proposed_action.status = 'approved'`. Apply (separate button, post-approval) → writes session notes, marks session `completed`, writes audit log, marks `proposed_action.status = 'executed'`. Reject → marks `proposed_action.status = 'rejected'`. Clarification Needed → marks `'clarification_needed'`. All transitions include optional reviewer note. No parent/player exposure. No curriculum/template mutation.

---

## Voice Privacy Settings (Sprint 82)

### No director voice settings UI yet
- **Plan:** `docs/voice-audit-log-plan.md`
- **Impact:** There is no `/director/configuration` screen where an academy director can see voice transcription status (configured/not configured) or disable it. Voice privacy is enforced in code (no audio stored, audit log written) but not yet visible in the UI.
- **Fix path:** Build the director configuration screen (Phase 4+) and add a read-only voice privacy card. The card spec is in `docs/voice-audit-log-plan.md`.
- **Current state:** Audit log writes are active. Privacy copy is in the recorder UI. No raw transcript or audio is ever stored.

---

## Transcript Player Name Guardrails (Sprint 81)

### Name detection is heuristic — false positives possible
- **File:** `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx`
- **Impact:** Capitalized words in wrap-up answers are matched against session roster first names. Unmatched capitalized words that are not in the common-words exclusion list show an orange warning in the summary. This is a deterministic text heuristic — it does not understand context, so it may warn on place names, nicknames, or proper nouns. The coach must confirm who is being referenced before adding a player note.
- **Limitation:** Multi-word names (e.g., "Van der Berg") may not be fully matched. Middle names are not matched. Names shorter than 2 characters are skipped.
- **No auto-action:** The guardrail is advisory only. No player observation is created automatically.

---

## Coach Audio Recorder UI (Sprint 80)

### AudioRecorderButton requires OPENAI_API_KEY for server transcription
- **File:** `src/components/assistant/AudioRecorderButton.tsx`
- **Impact:** Uses `MediaRecorder` to capture audio and sends it to `/api/coach/sessions/[sessionId]/transcribe`. When the server transcription endpoint returns a 503 (no API key), an inline error message is shown: "Production transcription is not configured. You can still type or use browser dictation." The existing `VoiceInputButton` (browser SpeechRecognition) remains as a secondary option labeled "Browser Dictation."
- **Audio storage:** None. Audio blob lives in browser memory only. Discarded immediately after endpoint responds.
- **Supported browsers:** Any browser that supports `MediaRecorder` and `getUserMedia` (Chrome, Edge, Firefox, Safari 14.1+).
- **Fallback:** Coach can always type, or use the "Browser Dictation" button (Chrome/Edge SpeechRecognition only).

---

## Secure Transcription Endpoint (Sprint 79)

### Production transcription endpoint built but gated by OPENAI_API_KEY
- **File:** `src/app/api/coach/sessions/[sessionId]/transcribe/route.ts`
- **Impact:** The endpoint is fully built with auth, academy membership, session access, MIME type, and file size checks. When `OPENAI_API_KEY` is not set, returns a safe 503 with "Production transcription is not configured. You can still type or use browser dictation." No audio is stored. No transcript is logged.
- **Fix path:** Set `OPENAI_API_KEY` in `.env.local` (local) or server environment (production) to enable live Whisper transcription.
- **No OpenAI SDK required:** Uses plain `fetch` + `FormData` against `https://api.openai.com/v1/audio/transcriptions`.

---

## Voice Transcription Architecture (Sprint 78)

### Production voice transcription is documented but not yet wired to a live STT key
- **File:** `docs/voice-transcription-security-architecture.md`
- **Impact:** The security architecture, data flow, and privacy controls are documented. The Whisper endpoint and AudioRecorder UI will be built in Sprints 79–80. Until `OPENAI_API_KEY` is set in the environment, the endpoint returns a safe 503 fallback.
- **Scope:** V1 is intentionally narrow — Coach Wrap-Up question answers only. Not a generic voice assistant.
- **Fix path:** Set `OPENAI_API_KEY` in `.env.local` (local) or Vercel environment (production) after Sprint 79 endpoint is deployed.

---

## Coach Assistant Voice Input (Sprint 77)

### Voice input is browser-native only — no STT backend
- **File:** `src/components/assistant/VoiceInputButton.tsx`
- **Impact:** Voice input uses `window.SpeechRecognition` / `window.webkitSpeechRecognition`. Supported in Chrome and Edge. Not available in Firefox or iOS Safari. Mic button is hidden on unsupported browsers with a fallback note.
- **Limitation:** Single-shot mode only — recognition starts on tap, ends when the coach stops speaking. No continuous streaming. No interim results. No Whisper, no ElevenLabs, no external API.
- **Audio storage:** None. No audio is recorded, uploaded, or stored. Transcription happens entirely in the browser.
- **Fallback:** Coach can type normally or use device-native keyboard dictation on any browser.
- **Fix path:** Sprint 80+ — integrate Whisper API or similar STT backend for broader browser support and better accuracy.

---

## Coach Assistant Voice Output (Sprint 72)

### Voice output is prototype-only — browser speechSynthesis
- **File:** `src/app/coach/sessions/[sessionId]/CoachWrapUpDrawer.tsx`
- **Impact:** Voice output uses `window.speechSynthesis` (Chrome/Edge support). Not available on iOS Safari. No ElevenLabs or production TTS. Voice toggle is hidden on unsupported browsers.
- **Limitation:** Reads assistant prompt questions only. Cannot read summaries, notes, or observations aloud (by design — safety rule).
- **Fix path:** Sprint 77+ — integrate ElevenLabs or similar TTS for production voice. See `docs/assistant-personality-and-voice-guidelines.md` for voice spec.

---

## Director Assistant Panel (Sprint 73)

### Director assistant responses are deterministic — no AI inference
- **File:** `src/app/director/command-center/DirectorAssistantPanel.tsx`
- **Impact:** Responses are based on live DB counts (pending wrap-ups, pending placements, etc.) and pre-written copy. There is no AI inference, no natural language understanding, and no personalization.
- **Fix path:** Sprint 77+ — wire real AI layer when query pattern and guardrails are confirmed. The deterministic V1 response structure (summary + why + what changes + risk) is designed to match what an AI response would look like.

---

## Coach session block status (Sprint 48)

### Block progress does not persist to the database
- **File:** `src/app/coach/sessions/[sessionId]/CoachSessionExecutionClient.tsx`
- **Impact:** Block status (planned / active / done / skipped / modified) is stored in local React state and written to localStorage (`session_block_status_${sessionId}`). It is NOT persisted to the `session_blocks` table because that table has no `status` or `progress` column.
- **Workaround (Sprint 48):** The execution client writes block statuses to localStorage; the WrapUp drawer reads them on open and pre-populates its own block status selectors.
- **Fix needed:** Add a `status` column to `session_blocks` table via a new migration and a server action to persist block status on each coach tap.

---

## Navigation gaps

### Players List is missing
- **Route:** `/director/players`
- **Impact:** There is no way for a director to navigate to player profiles through the UI.
  The only working path to a player profile is by knowing the player's UUID and typing it directly into the URL.
- **Fix:** Build step 1 in `CURRENT_BUILD_TARGET.md`.

### Director Dashboard is a placeholder
- **Route:** `/director`
- **Impact:** A director who logs in sees only a grey text message: "Director Dashboard — coming in Phase 5."
  There is no orientation, no data, no value.
- **Fix:** Build step 5 in `CURRENT_BUILD_TARGET.md`, after the player spine is complete.

### Sidebar links to unbuilt routes
- **Routes:** `/director/curriculum`, `/director/sessions`, `/director/competition`, `/director/intelligence`, `/director/reports`, `/director/configuration`
- **Impact:** All six sidebar links lead to pages that do not exist (will return a Next.js 404).
- **Fix:** Build each route in order per `CURRENT_BUILD_TARGET.md`. Do not remove the links — they are intentional placeholders.

### Coach, Player, Parent portals are stubs
- **Routes:** `/coach`, `/player`, `/parent`
- **Impact:** These roles can log in but see placeholder text. No functionality.
- **Fix:** Build steps 7–8 in `CURRENT_BUILD_TARGET.md`.

---

## Player Profile gaps

### Player Profile is not mobile-safe
- **File:** `src/app/director/players/[playerId]/page.tsx`
- **Impact:** The `grid-cols-[260px_1fr_260px]` layout breaks on screens narrower than ~900px.
  No responsive breakpoints defined.
- **Fix:** Build step 2 in `CURRENT_BUILD_TARGET.md`.

### Player Profile is missing tabbed sections
- **File:** `src/app/director/players/[playerId]/page.tsx`
- **Impact:** The spec calls for 9 tabs (Overview, Curriculum, Skill Path, Competition, Signals + Priorities,
  Recommendations, Outcomes, Load + Fitness, Notes + Comms). Currently only Curriculum (in the center column) is built.
  All other sections — assessments, UTR, signals, priorities, recommendations, behavior profiles, outcomes, coaching messages — have no UI.
- **Note:** All backend queries for the missing sections are already written in `src/lib/backend/`.
- **Fix:** Build steps 3–4 in `CURRENT_BUILD_TARGET.md`.

### Back link returns to stub dashboard
- **File:** `src/app/director/players/[playerId]/page.tsx` → `PlayerProfileHeader`
- **Impact:** Back link points to `/director` (the placeholder), not `/director/players`.
- **Fix:** Update when Players List is built (step 1).

---

## Voice pipeline

### Voice Intake OS Foundation is complete — V1 limitations remain
- **Status:** Sprints 240–249 complete. Input, structuring, routing, review queue, safety guardrails all built.
- **V1 does not execute actions.** Approving a voice intake draft records the director's review decision but triggers no downstream execution. Creating a session plan, attendance exception, or player observation from a voice intake requires Sprint 250+ execution routing.
- **No real STT.** Browser `SpeechRecognition` API (Chrome/Edge only) is used for voice capture. Falls back to text input on unsupported browsers. Production voice should use a dedicated STT service.
- **Intent detection is deterministic.** Pattern matching only — no AI inference. Long or ambiguous transcripts may produce `unknown` or miss secondary intents.
- **Player names are not resolved to IDs.** Extracted names (e.g., "Lucas") are heuristic matches, not resolved to actual `player_id` UUIDs. Resolution to roster records is a future sprint.
- **No multi-turn context.** Each voice submission is stateless.
- **execute_approved_action() covers 11 of 15 action types.** The remaining 4 voice action types are not yet handled by the RPC. See `docs/conversational-os/approved-action-execution-coverage-plan.md`.
- **Fix path:** See `docs/conversational-os/voice-intake-demo-flow.md` for the full AI/STT integration roadmap.

---

## Data / backend

### Pending actions badge — RESOLVED (Sprint 27)
- **File:** `src/app/director/layout.tsx`
- **Status:** `pendingCount` is now queried live from `proposed_actions` where `status = 'pending_review'` and scoped to `academy_id`.

### `intelligence.ts` uses a different DB pattern
- **File:** `src/lib/backend/intelligence.ts`
- **Impact:** Unlike all other backend files (which accept `db: DB` as a parameter), `intelligence.ts`
  calls `getSupabaseServer()` internally. This is intentional but inconsistent. Do not copy this pattern.
- **Status:** Working. Leave as-is until explicitly refactored.

### `director.ts` uses `rawDb = db as any`
- **File:** `src/lib/backend/director.ts`
- **Impact:** Type safety is bypassed for the complex multi-join query. This is intentional (TS2589 workaround).
- **Status:** Working. Leave as-is.

---

## Documentation

### Generated docs in `Academy_OS_Master_Build/generated/` are stale
- **Files:** `frontend_inventory.md`, `backend_inventory.md`, `acceptance_report.md`
- **Impact:** These were written before the app was built. They say "no framework, no components, no backend."
  All three claims are false now. Do not use them as the source of current truth.
- **Fix:** Use the files in `/docs/` (this folder) as the source of truth.

### `Academy_OS_Master_Build/packages/08.../DESIGN_SYSTEM.md` describes different colors
- **Impact:** That document uses a blue accent (`#4f8ef7`) and different base values from the implemented system.
  The implemented system uses lime (`#C8FF00`) as the primary accent. Do not use the spec doc as color reference.
- **Fix:** Use `tailwind.config.ts` and `src/app/globals.css` as the source of truth for design tokens.

---

## Error handling

### Error boundaries — RESOLVED (Sprint 30)
- **Status:** `error.tsx` boundaries added at `/director`, `/coach`, `/player`, and `/parent` route segments. Supabase query failures in Server Components now show a user-friendly "Something went wrong / Try again" screen instead of crashing the full page.
- **Remaining gap:** Nested route segments (e.g., `/director/players/[playerId]`, `/coach/sessions/[sessionId]`) do not have their own error boundaries. Errors inside those sub-routes will bubble to the nearest parent boundary.

---

## Curriculum integration (Sprints 192–201)

### Curriculum level assignment — RESOLVED (Sprint 204)
- Director can assign or change a player's curriculum level from the Skill Path tab via `CurriculumLevelPickerCard`.
- Explicit director action only. No auto-promotion.

### Session curriculum context requires template to have a level assigned — RESOLVED (Sprint 207)
- Directors can now assign a curriculum level to any session template from the template detail page (`/director/fitness/templates/[templateId]`).
- `SessionCurriculumContextPanel` will show context once a level is assigned. Templates without a level still show the "no context" empty state until a director sets one.

### `templates.curriculum_level_id` column not in generated types (Sprint 261)
- **Status:** Migration 045 added `curriculum_level_id` to the `templates` table, but the column **does not exist in the live database** and `database.types.ts` has not been regenerated.
- **Impact:** Clicking Save in the Curriculum Context selector on fitness templates now shows a muted message ("Curriculum source persistence is not enabled yet — migration 045 pending") instead of a red Supabase error. Selection is not persisted. Session curriculum cues will not be linked to templates until the migration is applied.
- **Fix:** Apply migration 045 to the live Supabase database, then run `supabase gen types typescript` to regenerate `src/lib/supabase/database.types.ts`.

### `session_block_exercises` has missing RLS policies — migration 056 created, must be applied to live Supabase

- **Status:** `session_block_exercises` was created in migration 007 with `ALTER TABLE session_block_exercises ENABLE ROW LEVEL SECURITY` but **no SELECT, INSERT, UPDATE, or DELETE policies were ever defined** — the same gap that `template_block_exercises` had (fixed in migration 055). Migration 056 (`supabase/migrations/056_session_block_exercises_rls.sql`) adds the missing policies. **The live database still needs this migration applied.**
- **Code-side: fully ready (Sprint 17 audit):** Session generation, director session detail, and coach session detail are all fully implemented with graceful degradation. No further code changes needed — only the live DB migration application is pending.
- **Verification status:** Cannot be verified automatically — Supabase CLI is not configured in the development environment. To verify manually, open Supabase → SQL Editor and run:
  ```sql
  SELECT policyname FROM pg_policies WHERE tablename = 'session_block_exercises';
  ```
  If the result includes `"Staff see session block exercises"` and `"Staff manage session block exercises"`, the migration is applied. If the result is empty, migration 056 must be applied.
- **Impact on session generation (until applied):** `generateSessionFromTemplateAction` step 9 INSERT into `session_block_exercises` fails with an RLS violation. The action treats exercise insertion as best-effort: the session and blocks are created and `sessionId` is returned. An orange warning is shown alongside the success link. Exercises will appear once migration 056 is applied.
- **Impact on session detail (until applied):** Session blocks render but exercises are always missing. An orange "migration pending" warning is shown when blocks exist but exercises are empty (both director and coach session detail pages).
- **Impact on session list:** The sessions list at `/director/sessions` is unaffected — it only queries `sessions` and `session_blocks` which have correct policies.
- **Fix:** Apply `supabase/migrations/056_session_block_exercises_rls.sql` to the live Supabase instance via the SQL Editor. Paste the full file contents and run. No code changes needed after application — exercises will render automatically.

### `player_gate_status` partially applied — repair via migration 060

- **Status:** Migration 059 (`supabase/migrations/059_player_gate_status.sql`) **partially applied** on the live database. It failed with `ERROR: 42P01: relation "requirement_evidence_links" does not exist` because migration 041 (`041_requirement_domains.sql`) had not been applied to the live DB first.

- **What 059 committed before the failure (already on live DB):**
  - `player_gate_status` table, all 6 indexes, `trg_player_gate_status_updated_at` trigger
  - RLS enabled, `"Staff see player gate status"` policy, `"Staff manage player gate status"` policy

- **What 059 did NOT execute (still missing from live DB):**
  - `requirement_evidence_links.gate_id` column
  - `idx_req_evidence_gate_id` index
  - Bootstrap `player_gate_status` rows (INSERT never reached)

- **Root cause:** Migration 041 (`041_requirement_domains.sql`) was never applied to the live database. This means `requirement_evidence_links`, `curriculum_track_requirements`, `player_requirement_progress`, and `curriculum_requirement_domains` are also absent. Migrations 042, 043, and 044 (which seed those tables) were also never applied.

- **DO NOT re-run migration 059.** `player_gate_status` already exists. Re-running 059 will fail on `CREATE TABLE player_gate_status` (relation already exists).

- **Sprint 104 is blocked until the repair is applied.**

- **Required application order:**
  1. `041_requirement_domains.sql` — creates `requirement_evidence_links` and three related tables
  2. `042_requirement_domain_seed.sql` — seeds `curriculum_requirement_domains` (3 domain rows)
  3. `043_orange_ball_starter_requirements.sql` — seeds `curriculum_track_requirements`
  4. `044_player_requirement_progress_bootstrap.sql` — bootstraps `player_requirement_progress` rows
  5. `060_gate_status_repair.sql` — adds `gate_id` column, index, and bootstrap rows (the three steps 059 failed to complete)

- **Fix:** Open Supabase → SQL Editor and apply each file in the order above. Paste the full contents of each file and Run before proceeding to the next.

- **Verification after applying migration 060:**
  ```sql
  -- Confirm gate_id column was added
  SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'requirement_evidence_links'
    AND column_name = 'gate_id';
  -- Expect: one row

  -- Confirm index was created
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'requirement_evidence_links'
    AND indexname = 'idx_req_evidence_gate_id';
  -- Expect: one row

  -- Confirm bootstrap rows were inserted
  SELECT COUNT(*) FROM player_gate_status;
  -- Expect: > 0 if any players have a player_curriculum_states row
  -- with active gates at their current level

  -- Confirm policies are intact (should already be present from partial 059)
  SELECT policyname FROM pg_policies
  WHERE tablename = 'player_gate_status'
  ORDER BY policyname;
  -- Expect: "Staff manage player gate status", "Staff see player gate status"
  ```

- **Known constraint (unchanged):** `requirement_evidence_links.requirement_id` remains NOT NULL (migration 041). Gate-only evidence rows (no matching track requirement) cannot be stored without a `requirement_id`. Sprint 104 must resolve this before rewriting `recordGateEvidenceAction`.

- **Type regeneration:** After applying all five migrations, run `supabase gen types typescript` to regenerate `src/lib/supabase/database.types.ts`. Do not edit the types file manually.

### `template_block_exercises` missing RLS policies — migration 058 pending live application

- **Status:** `template_block_exercises` was created in migration 006 with `ENABLE ROW LEVEL SECURITY` but no SELECT/INSERT/UPDATE/DELETE policies. Migration 055 was written to fix this but was never applied to the live database before migrations 056–057 were committed. Migration 058 supersedes 055 with idempotent DROP/CREATE guards and explicit `WITH CHECK` on INSERT and UPDATE. **Migration 058 must be applied to the live Supabase instance.**
- **Error before fix:** Director clicks "Populate Blocks with Exercises" → `populateFitnessTemplateBlocksAction` → INSERT into `template_block_exercises` → "new row violates row-level security policy for table template_block_exercises".
- **Fix:** Open Supabase → SQL Editor, paste the full contents of `supabase/migrations/058_template_block_exercises_rls.sql`, and Run. No code changes or restart needed. The migrate is idempotent — safe to run even if migration 055 was partially applied.
- **Verification:** After applying, run in SQL Editor:
  ```sql
  SELECT policyname FROM pg_policies WHERE tablename = 'template_block_exercises' ORDER BY policyname;
  ```
  Expect four rows: `"Staff delete template block exercises"`, `"Staff insert template block exercises"`, `"Staff see template block exercises"`, `"Staff update template block exercises"`.

### Preview mode write actions previously threw uncaught errors — RESOLVED (Sprint 261)
- **Status:** Server Actions that guard writes with `assertNotPreviewMode()` now catch the throw and return `{ error: 'Writes are disabled in preview mode.' }` instead of propagating the exception to the client. Preview banner ("Writes are disabled in preview.") displays in the director layout when in preview mode.
- **Impact resolved:** Clicking save/create buttons in preview mode now shows a friendly error message instead of crashing the page.

### Class template block editing not built
- **File:** `src/app/director/class-templates/[templateId]/page.tsx`
- **Impact:** Class template detail shows a read-only block list. Blocks cannot be added, removed, or reordered from the class template detail page. Only the curriculum level can be assigned.
- **Fix:** Future sprint — build class template block editor (lower priority than fitness template system).

### Fitness exercise library — RESOLVED (Sprint 263)
- **Status:** 83 exercises confirmed in DB for demo academy `00000000-0000-0000-0000-000000000001`. All active (`is_active = true`). Import confirmed complete via live check 2026-05-04.
- **Import:** 14 seed exercises (migration 024) + 69 Airtable exercises (`data/airtable-import/import-exercises.js`).
- **If library appears empty to a logged-in director:** The cause is RLS. Either the director's `profiles.academy_id` does not match the demo academy, or their `academy_memberships` row is inactive or missing. The Sprint 262 total-count diagnostic will show 0 in both the active query and the total-count query in this case (RLS applies to both). Check the director's profile and membership in Supabase.
- **If library is truly empty (no exercises at all):** Run `cd data/airtable-import && SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node import-exercises.js --live --confirm-live-import`
- **UI:** Exercise count shown as a lime badge when exercises are available. Picker shows result count and "Clear search" button when filter is active. See `docs/templates/exercise-library-resolution.md` for full details.
- **Remaining gap:** No director-facing activation UI exists for exercises with `is_active = false`. Activation requires direct DB access or Supabase dashboard.

### Drill detail panel does not show `procedure` field
- **Impact:** `curriculum_drills.procedure` is not fetched by `getCurriculumExplorerData()` (locked backend file). The drill expanded panel shows setup, cues, progressions, and success criteria but not procedure.
- **Fix:** Unlock and update `src/lib/backend/curriculumExplorer.ts` to include `procedure` in the drill select.

### "Use in session" drill button is disabled
- **Impact:** Each drill row in the explorer shows a disabled "Use in session" button. Session builder integration is a future sprint.

### Curriculum explorer is Director-only
- **Impact:** Coaches have no access to the curriculum explorer. The `/director/curriculum` route is restricted to the director role.

---

## Player Q&A (Sprint 218)

### Player Q&A is director-preview only — player portal not exposed
- **Location:** Skill Path tab of `/director/players/[playerId]`
- **Impact:** Player portal (`/player`) remains a stub. Players cannot directly access the Q&A. The preview exists only for directors to preview what player-facing answers would look like.
- **Fix:** Build real player portal (step 9+ in build order) and wire up with role-scoped data access before exposing to real players.

### Player Q&A answers are deterministic — no AI personalization
- **Impact:** Answers are built from curriculum level, gates, drills, and coach language using keyword matching and template logic. No AI inference, no personalized feedback, no voice analysis.
- **Fix:** Add AI-layer after player portal is built and approved.

### Player Q&A drills show level_min_id match only
- **Impact:** Only drills where `level_min_id` = current level ID are returned. Drills with a wider range (e.g., spanning multiple levels) may not appear.
- **Fix:** Add range query when more drill-to-level matching logic is needed.

---

## Conversational OS (Sprints 219–228)

### Player portal shows empty state when profile_id is not linked
- **File:** `src/app/player/page.tsx`
- **Impact:** `/player` resolves auth user → `players.profile_id`. If no player record has `profile_id` set to the logged-in user, the player sees a safe empty state prompting them to ask their coach or director to connect their profile. Live development plan is only visible when the player-to-profile mapping is set.
- **Fix:** Director or coach must set `profile_id` on the player record to the player's auth user ID.

### Parent portal guardian-to-player mapping may not be populated
- **File:** `src/app/parent/page.tsx`
- **Impact:** `/parent` now resolves auth user → `guardians.profile_id` → `player_guardians` → linked player and renders a live IDP parent view. However, if no guardian record is linked to the auth user in the `guardians` table (via `profile_id`), or no player is linked via `player_guardians`, the parent sees a safe empty state prompting them to contact the director. Live development guidance is only visible when the guardian-to-player mapping is set.
- **Fix:** Director must link parent accounts to guardian records and assign players via `player_guardians`.

### Role-aware chat guardrails are enforcement-only — no full chat UI
- **File:** `src/lib/commands/roleGuardrails.ts`
- **Impact:** Guardrail functions are used by the command center and Q&A preview. There is no standalone role-aware chat interface for coaches, players, or parents.
- **Fix:** Build role-specific chat UI after player portal and parent portal are functional.

### Learning modules are director-preview only — not persisted
- **File:** `src/app/director/curriculum/learning/page.tsx`, `src/lib/curriculum/learningModules.ts`
- **Impact:** Modules are generated in-memory at request time. They are never stored in the database. No player or parent can see them directly.
- **Fix:** Sprint 236 — Curriculum Module Player Preview. Requires player portal to be functional first.

### Command Center draft execution is limited
- **Impact:** `execute_approved_action()` in the database covers 11 of 15 action types. Command-created `proposed_actions` with `target_module = 'director_command'` or `target_module = 'voice_intake'` have no execution path for the remaining types.
- **Fix:** Extend the RPC coverage in Sprint 250+ before building full command execution. Voice intake foundation is complete — execution routing is the next layer.

### Parent guidance preview is director-only — not sent
- **File:** `src/app/director/players/[playerId]/ParentGuidancePreviewPanel.tsx`
- **Impact:** The panel shows a director what a parent-safe summary would look like. There is no mechanism to send it yet.
- **Fix:** Sprint 237 — Parent Communication Draft Queue.

---

## Coach Wrap-Up V1 (Sprints 12–15)

### Unrostered attendees cannot be captured via wrap-up drawer
- **Impact:** The wrap-up attendance section only shows players currently rostered in the session's group. A player who attended but is not in the group cannot be added from this screen.
- **Fix:** Use the Director review queue's Attendance Exceptions panel to flag unrostered attendees. The wrap-up's Q1 answer ("Was anyone missing or added today?") can note the name in free text, which is stored in the raw voice_notes recap for director follow-up.

### Wrap-up saves are sequential — partial failure stops remaining saves
- **Impact:** Step 1 (raw recap → `voice_notes`) is required. If it fails, steps 2 and 3 are skipped. Steps 2 (structured draft) and 3 (player observations) are best-effort after step 1.
- **Fix:** Copy button in summary provides a clipboard fallback if the full save fails.

### Two recap UIs on the same session page
- **Impact:** Both `CoachRecapCommandPanel` (now labeled "Quick Note") and `CoachWrapUpDrawer` (guided 6-question "Coach Wrap-Up") save recaps to `voice_notes`. A coach using both in one session will create two voice_note records. The director review queue will show both.
- **Status:** Intentional — Quick Note is the async/freeform option; guided Wrap-Up is the end-of-session structured option. Labels now distinguish the two modes clearly.
- **Fix:** No further fix needed. De-duplication in the review queue is a potential future polish.

### Attendance saved independently of wrap-up recap
- **Impact:** The "Save Attendance" button in the wrap-up summary saves attendance to `session_attendance` immediately. This is independent of the "Save Recap" button. Coaches can save attendance without completing the full recap, or vice versa.
- **Status:** Intentional — attendance is time-sensitive; recap can be deferred.

---

## Testing

### No automated tests
- **Impact:** No unit tests, no integration tests, no E2E tests. TypeScript is the only safety net.
- **Status:** Intentional for now. Add Vitest + Playwright after core modules ship.
- **Risk:** A broken migration or component change has no automated detection.
