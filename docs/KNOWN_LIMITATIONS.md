# Known Limitations

**Last updated:** 2026-05-04

This file documents what is currently broken, missing, or intentionally incomplete.
These are not bugs to fix immediately — they are known gaps that future sessions should be aware of.

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

### Pending actions badge is hardcoded
- **File:** `src/app/director/layout.tsx`
- **Impact:** `pendingCount` is always `0`. The sidebar badge for pending actions never shows a real count.
- **Fix:** Query `v_pending_proposed_actions` count in the layout after voice pipeline is built.

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

### No `error.tsx` boundaries
- **Impact:** If a Supabase query fails inside a Server Component, the entire page crashes with an unhandled error.
  There are no Next.js `error.tsx` files anywhere in the route tree.
- **Fix:** Add `error.tsx` files at key route segments when building each module.

---

## Curriculum integration (Sprints 192–201)

### Curriculum level assignment — RESOLVED (Sprint 204)
- Director can assign or change a player's curriculum level from the Skill Path tab via `CurriculumLevelPickerCard`.
- Explicit director action only. No auto-promotion.

### Session curriculum context requires template to have a level assigned — RESOLVED (Sprint 207)
- Directors can now assign a curriculum level to any session template from the template detail page (`/director/fitness/templates/[templateId]`).
- `SessionCurriculumContextPanel` will show context once a level is assigned. Templates without a level still show the "no context" empty state until a director sets one.

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

## Testing

### No automated tests
- **Impact:** No unit tests, no integration tests, no E2E tests. TypeScript is the only safety net.
- **Status:** Intentional for now. Add Vitest + Playwright after core modules ship.
- **Risk:** A broken migration or component change has no automated detection.
