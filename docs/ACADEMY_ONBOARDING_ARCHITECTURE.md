# Academy Onboarding — Master Architecture

Sprint 196 · 2026-05-10

---

## Product Promise

Academy onboarding is not a form. It is an AI-assisted setup process that turns a director's operating style into a configured academy workspace. The director tells the system how their academy works — the curriculum philosophy, the groups, the coaches, the rules — and Academy OS builds the operating system around them.

The director's experience should be:
> "I told it how we run things, and it set everything up. I just said yes."

---

## Existing Onboarding Infrastructure (Audit Result)

Before designing the new system, these assets are already built and must be preserved or extended:

| Asset | Location | What It Does | Status |
|---|---|---|---|
| `SetupProgressChecklist` | `src/components/onboarding/SetupProgressChecklist.tsx` | Dismissible 7-step checklist widget on director dashboard | Exists — V1 |
| Demo Tour | `src/app/director/demo/page.tsx` | 11-step sandbox demo with sample data creation | Exists — functional |
| Player Onboarding Review | `src/app/director/players/onboarding-review/page.tsx` | Post-activation player readiness checker | Exists — functional |
| Curriculum Customization Assistant | `src/components/curriculum/CurriculumCustomizationAssistant.tsx` | 5-step UI scaffold for curriculum customization | Exists — scaffolded |
| Platform Admin | `src/app/platform/page.tsx` | Platform-level academy tenant viewer | Exists — read-only |
| NextBestActionCard | `src/components/onboarding/NextBestActionCard.tsx` | CTA card used across app | Exists |
| GuidedStepCard | `src/components/onboarding/GuidedStepCard.tsx` | Step card component | Exists |

**No `/director/onboarding` or `/director/setup` route exists.** The current checklist is a widget, not a flow. This is the primary gap.

---

## Current Data Model — Existing Support

### What already exists

| Object | Table | Notes |
|---|---|---|
| Academy identity | `academies` | `name`, `slug`, `country`, `timezone`, `is_active`, `settings` (JSON) |
| Academy membership | `academy_memberships` | `profile_id`, `role` (academy_director / head_coach / coach / player / parent), `is_active` |
| Director/coach profile | `profiles` | `display_name`, `email`, `phone`, `locale`, `avatar_initials` |
| Groups | `groups` | `name`, `track`, `level_id`, `description`, `min_age`, `max_age`, `max_players`, `is_active` |
| Old academy levels | `academy_levels` | `label`, `level_number`, `track`, `description`, `sort_order` |
| Curriculum levels (global spine) | `curriculum_levels` | Full 15-level spine with gates, drills, content |
| Session templates | `templates` | `name`, `track`, `template_type` |
| Players | `players` | Full schema — placement pipeline functional |
| Placement | `placement_recommendations` | Full pipeline functional |
| Proposed actions | `proposed_actions` | All director-reviewed mutations |
| Audit logs | `audit_logs` | All major mutations |
| `academies.settings` | JSON column | Free-form; usable for onboarding state storage without migration |

### What can be stored in `academies.settings` immediately (no migration)

The `settings` JSON column on `academies` is writable and can store:

```json
{
  "onboarding_state": "curriculum_setup",
  "onboarding_completed_phases": ["academy_identity", "director_interview"],
  "communication_tone": "professional",
  "logo_url": "https://...",
  "portal_visibility": {
    "player_can_see_level": true,
    "player_can_see_mission": true,
    "parent_can_see_development": true,
    "parent_can_see_session_notes": false
  },
  "placement_rules": {
    "auto_placement": false,
    "require_director_approval": true
  },
  "brand_color": "#C8FF00",
  "website": "https://...",
  "description": "..."
}
```

This means a significant portion of onboarding state can be persisted without any migration. The trade-off is no typed columns, no RLS on individual fields, and no ability to query efficiently. Phase 2 migrations should promote the most critical fields to typed columns.

---

## Missing Data Model Support

| Need | Gap | Migration Required? | Workaround |
|---|---|---|---|
| Logo/brand upload | No `logo_url` column or Supabase storage bucket | Yes (column + storage bucket) | Store as JSON in `settings.logo_url` |
| Onboarding progress state | No `onboarding_state` enum or column | Yes (column + enum) | Store as JSON in `settings.onboarding_state` |
| Communication tone | No `communication_tone` column | Yes | Store in `settings.communication_tone` |
| Portal visibility config | No dedicated table | Yes (future) | Store in `settings.portal_visibility` |
| Director interview data | No table for AI interview transcript/answers | Yes (future) | Store answers in proposed_actions payload |
| Placement rules | No `placement_rules` table | Yes (future) | Store in `settings.placement_rules` |
| Coach invite tokens | No `pending_invites` table | Yes (future) | Director creates membership manually for now |
| Curriculum clone/fork | No `academy_curriculum_customizations` table | Yes (future) | `CurriculumCustomizationAssistant` has scaffold only |
| Demo week preview data | Demo sandbox exists but is global | None | Demo sandbox at `/director/demo` works today |

---

## Full Onboarding Flow — All Phases

### Phase 1 — Registration / Workspace Creation
- **Director goal:** Create their academy workspace.
- **AI role:** Confirm academy identity fields; generate slug from name.
- **Voice example:** "My academy is called Angles Tennis Academy. We're based in Dallas, Texas."
- **Data objects:** `academies` (name, slug, country, timezone), `profiles` (director), `academy_memberships` (director role)
- **Approval:** Director confirms before workspace is created.
- **Parent/player risk:** None — no portal access until go-live.
- **Safe V1:** Static form. Name, country, timezone. Slug auto-generated.
- **Future 10/10:** Voice creates → AI drafts → director approves → workspace provisioned.

### Phase 2 — Academy Identity + Logo Upload
- **Director goal:** Give the academy a visual identity and public-facing profile.
- **AI role:** Prompt for logo upload, brand color, website, short description.
- **Voice example:** "Our primary color is lime green. Our website is anglestennisacademy.com."
- **Data objects:** `academies.settings` (logo_url, brand_color, website, description)
- **Approval:** Director saves; no external communication yet.
- **Parent/player risk:** Low — identity only; not exposed until portal is configured.
- **Safe V1:** Text form fields. `settings` JSON update via server action. Logo upload deferred.
- **Future 10/10:** Drag-and-drop logo upload to Supabase Storage. Brand color picker. Preview card.

### Phase 3 — AI Director Interview
- **Director goal:** Tell the system how their academy runs — philosophy, teaching approach, player population, competitive focus.
- **AI role:** Ask structured questions one at a time. Summarize answers. Propose configuration drafts. Director approves before anything is written.
- **Voice examples:**
  - "We're game-based. We use the Mouratoglou method for orange ball."
  - "Most of our players are 8–12 years old, recreational to semi-competitive."
  - "Coaches submit wrap-ups after every session. I review Monday mornings."
- **Data objects:** `proposed_actions` (interview answers stored as payload), `academies.settings` (approved configuration)
- **Approval:** Director explicitly approves each configuration block.
- **Parent/player risk:** None — configuration only.
- **Safe V1:** Static form with 5–7 key questions. Answers saved to `settings.director_interview`.
- **Future 10/10:** AI-driven conversation. Multi-turn. Contextual follow-ups. Produces a full configuration draft for director approval.

### Phase 4 — Curriculum Starter Selection
- **Director goal:** Choose which curriculum spine to start from.
- **AI role:** Show available curriculum paths (Skill / Competition / Fitness / Combined). Explain each. Recommend based on interview answers.
- **Voice example:** "We'll start with the Skill track for orange and green ball players."
- **Data objects:** `curriculum_levels` (read — global spine), `academies.settings` (chosen tracks)
- **Approval:** Director selects track(s). No academy curriculum records written yet.
- **Parent/player risk:** None.
- **Safe V1:** Track picker UI. Store choice in `settings.curriculum_tracks`.
- **Future 10/10:** AI recommends tracks based on director interview. Shows level count, gate types, sample drills per track.

### Phase 5 — Curriculum Customization Assistant
- **Director goal:** Review and optionally customize the selected curriculum levels.
- **AI role:** Walk director through level goals, gates, and drills for each selected track. Propose overrides. Summarize changes before writing.
- **Voice example:** "For Orange 2, I want to add a return-of-serve gate before advancement."
- **Data objects:** `curriculum_levels` (read), `proposed_actions` (override drafts → review queue)
- **Approval:** All overrides go through the review queue. Global spine untouched.
- **Parent/player risk:** None until portal visibility is configured.
- **Safe V1:** Read-only curriculum explorer with a note-taking area. Overrides deferred to post-launch.
- **Future 10/10:** CurriculumCustomizationAssistant fully wired. Voice-proposed overrides. Review queue integration.

### Phase 6 — Level Gates + Promotion Rules
- **Director goal:** Confirm or customize the evidence requirements for player advancement.
- **AI role:** Show existing gates per level. Ask if director wants any changes. Propose rule modifications.
- **Voice example:** "For Orange 1 to Orange 2, I want at least 6 weeks at level and a coach assessment."
- **Data objects:** `progression_rules` (read — existing), `proposed_actions` (rule change drafts)
- **Approval:** All rule changes go through review queue.
- **Parent/player risk:** Low — rules affect future advancement, not current players.
- **Safe V1:** Display existing `progression_rules` per level. Allow director to note exceptions for later.
- **Future 10/10:** Full gate editor. Voice-proposed rule changes. Preview impact on current player population.

### Phase 7 — Program + Group Setup
- **Director goal:** Define the training groups that will run on court.
- **AI role:** Ask about group structure — how many groups, what tracks, age ranges, max sizes. Propose group names. Director approves.
- **Voice example:** "We have three groups: Orange 1 beginners, Orange 2 intermediate, and Green advanced. About 8 kids each."
- **Data objects:** `groups` (insert: name, track, description, min_age, max_age, max_players)
- **Approval:** Director reviews proposed groups before any insert.
- **Parent/player risk:** None — groups are internal until sessions are created.
- **Safe V1:** Manual group creation form. Existing `/director/class-templates` for templates.
- **Future 10/10:** AI proposes group structure from interview. Director approves → groups created in batch.

### Phase 8 — Coach Setup + Permissions
- **Director goal:** Add coaching staff with appropriate roles.
- **AI role:** Ask about team size, roles, responsibilities. Draft membership records.
- **Voice example:** "My head coach is Sarah. She handles Orange 2 and Green groups."
- **Data objects:** `profiles` (insert), `academy_memberships` (insert: role = head_coach / coach)
- **Approval:** Director confirms each coach before membership is created.
- **Parent/player risk:** Coach can see player profiles after membership. Director approves first.
- **Safe V1:** Manual coach invite form. Creates `profiles` + `academy_memberships`.
- **Future 10/10:** Email invite flow with `pending_invites` table. Coach receives link, creates account, joins academy.

### Phase 9 — Player Import / Pending Placement
- **Director goal:** Add the player roster.
- **AI role:** Guide through CSV import flow. Validate rows. Propose import. Director approves before any row is written.
- **Voice example:** "I have 24 players. Some are already in groups, some are new."
- **Data objects:** `players` (insert via existing import pipeline), `placement_recommendations`
- **Approval:** Import dry-run → director review → confirmed import. Existing `/director/players/import` handles this.
- **Parent/player risk:** Player records are internal. No portal access until portal setup is complete.
- **Safe V1:** Route to `/director/players/import`. Existing flow fully functional.
- **Future 10/10:** AI-assisted CSV mapping. Auto-suggests group placement from CSV data.

### Phase 10 — Placement Rules Setup
- **Director goal:** Configure how players are placed into groups.
- **AI role:** Ask whether placement requires director approval for all cases, or whether some can be auto-placed.
- **Voice example:** "All placements should require my sign-off. I want to see the recommendation before anything happens."
- **Data objects:** `academies.settings.placement_rules`
- **Approval:** Director saves configuration.
- **Parent/player risk:** None — affects future placements only.
- **Safe V1:** Simple toggle UI. Store in `settings.placement_rules.require_director_approval`.
- **Future 10/10:** Full placement rule editor. Age-based routing, track-based auto-placement, CV-based suggestions.

### Phase 11 — Parent Portal Visibility Setup
- **Director goal:** Choose what parents can see in the parent portal.
- **AI role:** Show each visibility option with plain-English explanation and example. Recommend defaults. Director approves.
- **Voice example:** "Parents should see development strengths but not raw coach notes."
- **Options:** Development summary (strengths/needs), session notes, curriculum level, assessment scores, attendance, priorities
- **Data objects:** `academies.settings.portal_visibility.parent_*`
- **Approval:** Director reviews the full preview before any parent portal is activated.
- **Parent/player risk:** This phase directly controls parent visibility. Nothing goes live until explicitly approved.
- **Safe V1:** Toggle UI with live preview. Store in `settings.portal_visibility`.
- **Future 10/10:** Per-player overrides. Per-group visibility rules. Parent preview mode.

### Phase 12 — Player Portal Mission Visibility
- **Director goal:** Choose what players can see in the player portal.
- **AI role:** Explain mission card, current level, upcoming gates. Director approves each item.
- **Voice example:** "Players can see their current mission and level, but not their assessment scores."
- **Data objects:** `academies.settings.portal_visibility.player_*`
- **Approval:** Director approves before any player portal content is visible.
- **Parent/player risk:** This phase directly controls player visibility.
- **Safe V1:** Toggle UI with live preview. Existing `PlayerPortalLinkPanel` at player profile level.
- **Future 10/10:** Mission card preview. Player-facing level progression path.

### Phase 13 — Communication Style Setup
- **Director goal:** Set the tone for all AI-generated communications and coach briefings.
- **AI role:** Ask: formal vs conversational, length preference, technical depth, motivational style.
- **Voice example:** "Keep it professional but warm. Not too technical. Parents should feel confident."
- **Data objects:** `academies.settings.communication_tone`, `academies.settings.communication_preferences`
- **Approval:** Director approves before tone is applied.
- **Parent/player risk:** Low — affects future AI drafts, not retroactive.
- **Safe V1:** Select from 3 presets (Professional, Conversational, Technical). Store in `settings`.
- **Future 10/10:** Custom tone training. AI samples tone for director approval.

### Phase 14 — Starter Session Template Generation
- **Director goal:** Have at least one class template ready for coaches to run.
- **AI role:** Propose a starter template for each group based on curriculum track and group size.
- **Voice example:** "Generate a starter Orange 1 session — 60 minutes, 3 blocks, warmup + technical + game."
- **Data objects:** `templates` (insert), `template_blocks` (insert)
- **Approval:** Director reviews before template is created.
- **Parent/player risk:** None — templates are internal.
- **Safe V1:** Route to `/director/class-templates/new`. Existing form.
- **Future 10/10:** AI proposes complete session structure from curriculum level + group profile. One click to create.

### Phase 15 — Review Academy Setup
- **Director goal:** See a complete summary of everything configured before going live.
- **AI role:** Present a read-only review of all configured phases. Flag any gaps.
- **Data objects:** Read-only across all configured objects.
- **Approval:** Director signs off on the summary.
- **Parent/player risk:** None — review only.
- **Safe V1:** Static summary page listing each phase and configured values.
- **Future 10/10:** Animated summary with edit-in-place for quick fixes.

### Phase 16 — Demo Week Preview
- **Director goal:** See how the system will feel with real data before going live.
- **AI role:** Populate a demo sandbox with the academy's actual structure.
- **Data objects:** Demo sandbox (existing at `/director/demo`)
- **Approval:** Director creates and resets sandbox freely.
- **Parent/player risk:** Demo data is clearly labeled `[DEMO]` everywhere.
- **Safe V1:** Existing `/director/demo` sandbox. Already functional.
- **Future 10/10:** Demo populated from actual onboarding configuration, not generic sample data.

### Phase 17 — Launch Checklist
- **Director goal:** Confirm all required items are complete before going live.
- **AI role:** Run automated checks. Surface gaps. Block go-live if critical items are missing.
- **Data objects:** Read across all configured objects.
- **Approval:** Director checks off each item.
- **Parent/player risk:** None until go-live is triggered.
- **Safe V1:** Static checklist. See Launch Checklist section below.
- **Future 10/10:** Real-time automated checks with per-item CTA links.

### Phase 18 — Go Live
- **Director goal:** Activate the academy for full operation.
- **AI role:** Confirm readiness. Explain what goes live. Director approves.
- **Data objects:** `academies.settings.onboarding_state` → `'live'`
- **Approval:** Explicit director click. Cannot be triggered by AI alone.
- **Parent/player risk:** This is the first moment anything becomes visible to parents/players — only if portal visibility was enabled.
- **Safe V1:** Button to mark onboarding complete. Dismisses the onboarding flow.
- **Future 10/10:** Staged go-live: director view live first, then coach, then parent/player.

---

## Voice-First Interaction Model

```
Voice creates
  → proposed_actions (draft record, pending_review)
    → UI confirms (director review)
      → database structures (approved action executed)
        → system executes (data written)
          → human approves before official activation or communication
```

All onboarding voice commands follow this pipeline:

1. Director speaks or types a natural-language instruction.
2. The AI interprets and proposes a structured draft (e.g., "Create a group called Orange 2, track: skill, 8 players").
3. Draft is shown to the director in plain English before any write.
4. Director approves, edits, or rejects.
5. Approved draft is executed. Audit log written.
6. No parent/player notification until the director explicitly enables it.

**Onboarding commands are director-only.** Coaches, players, and parents cannot trigger onboarding steps.

---

## AI Assistant Behavior Rules

1. **One question at a time.** The AI never asks more than one question per turn.
2. **Summarize before writing.** Before any database write, the AI presents a plain-English summary of what will be created/changed.
3. **Propose drafts, not final writes.** The AI always creates `pending_review` records, never directly executed changes.
4. **Director approves.** No configuration, record, or visibility change is applied without explicit director action.
5. **No parent/player communication without approval.** The AI never drafts a parent or player message until the director has approved the content AND the communication settings are configured.
6. **No official level movement without approval.** Player advancement through curriculum gates requires explicit director or coach action.
7. **No silent player activation.** Players move from `pending_placement` to `active` only through `finalize_player_placement()`, triggered by an explicit director action.
8. **No raw coach notes exposed externally.** All coach notes pass through the proposed_actions pipeline before any director-approved version reaches any portal.
9. **No configuration overrides global defaults.** Academy curriculum customizations are layered on top of the global spine; the global spine is never modified.
10. **Onboarding progress is resumable.** Directors can stop at any phase and resume from where they left off. The state persists in `academies.settings.onboarding_state`.

---

## Onboarding State Machine

```
not_started
  → academy_identity
    → director_interview
      → curriculum_setup
        → operations_setup
          → people_setup
            → portal_setup
              → launch_review
                → demo_preview
                  → ready_to_launch
                    → live
```

Each state persisted in `academies.settings.onboarding_state`. Director can move forward or jump back to any phase. Terminal state: `live`.

**State definitions:**

| State | Phases Completed |
|---|---|
| `not_started` | None |
| `academy_identity` | Phases 1–2 |
| `director_interview` | Phase 3 |
| `curriculum_setup` | Phases 4–6 |
| `operations_setup` | Phases 7 + 14 |
| `people_setup` | Phases 8–10 |
| `portal_setup` | Phases 11–13 |
| `launch_review` | Phase 15 |
| `demo_preview` | Phase 16 |
| `ready_to_launch` | Phase 17 |
| `live` | Phase 18 |

---

## Launch Checklist

Required before go-live. All checks are director-confirmed:

| # | Check | Data Source | Blocking? |
|---|---|---|---|
| 1 | Academy profile complete (name, country, timezone) | `academies` row | Yes |
| 2 | Logo/brand set OR explicitly skipped | `settings.logo_url` or skip flag | No |
| 3 | At least one curriculum track selected | `settings.curriculum_tracks` | Yes |
| 4 | At least one group created and active | `groups` count | Yes |
| 5 | At least one class template created | `templates` count | Yes |
| 6 | At least one coach invited OR solo-director confirmed | `academy_memberships` count | No |
| 7 | Player import completed OR skipped | `players` count | No |
| 8 | Placement rules approved | `settings.placement_rules` | Yes |
| 9 | Parent portal visibility settings saved | `settings.portal_visibility.parent_*` | Yes |
| 10 | Player portal visibility settings saved | `settings.portal_visibility.player_*` | Yes |
| 11 | Communication tone selected | `settings.communication_tone` | No |
| 12 | Sample session template generated | `templates` count | No |
| 13 | Demo week previewed OR explicitly skipped | `settings.demo_week_skipped` or sandbox | No |
| 14 | Director explicitly approves go-live | Button click | Yes |

---

## Recommended Sprint 197–206

| Sprint | Title | Scope |
|---|---|---|
| **197** | Academy Identity + Settings V1 | `/director/settings` page. Read/write `academies.name`, `country`, `timezone`, `settings.logo_url` (URL input), `settings.description`. Server action. No migration. |
| **198** | Onboarding State Machine + Persisted Progress V1 | Write/read `settings.onboarding_state` and `settings.onboarding_completed_phases`. `/director/onboarding` shell page with phase nav. Progress visible. |
| **199** | Portal Visibility Settings V1 | Toggle UI for parent/player visibility options. Store in `settings.portal_visibility`. Preview panel. No migration. |
| **200** | Communication Tone Setup V1 | 3-preset tone selector. Store in `settings.communication_tone`. Used by AI-generated content. |
| **201** | Group Creation in Onboarding V1 | In-onboarding group creation form. Reuses existing `groups` insert. Director approves before any insert. |
| **202** | Coach Invite UI V1 | Form to create `profiles` + `academy_memberships`. Director-controlled. No email invite yet. |
| **203** | Launch Checklist Automated Check V1 | Server component that reads the 14 checklist items from live data and presents pass/fail per item. |
| **204** | Onboarding Shell → `/director/onboarding` V1 | Full multi-phase wizard UI. Phase nav. Persistent state. Existing components wired in. |
| **205** | Director Interview Form V1 | 5–7 structured questions. Answers stored in `settings.director_interview`. Drives curriculum and group suggestions. |
| **206** | AI Configuration Proposal Draft V1 | Director interview answers → AI proposes group structure, curriculum track, communication tone → proposed_actions draft → director approves |

---

## Data Model Changes Needed (Future Migrations)

These are architectural requirements identified in this sprint. They should not be built until the `settings` JSON prototype has been validated:

1. **`academies.logo_url TEXT`** — explicit column; Supabase Storage bucket for logos
2. **`academies.onboarding_state TEXT`** — typed column with enum check
3. **`academies.communication_tone TEXT`** — explicit column
4. **`academies.description TEXT`** — explicit column
5. **`academies.website TEXT`** — explicit column
6. **`portal_visibility_settings` table** — per-academy, RLS-protected, versioned
7. **`onboarding_interview_answers` table** — per-question storage, linked to academy
8. **`placement_rules` table** — per-academy placement configuration
9. **`pending_invites` table** — coach/parent invite tokens with expiry
10. **`academy_curriculum_selections` table** — which global tracks/levels an academy has adopted

---

## Open Questions

1. **Is academy creation in-app or platform-created?** Today, academies are created at the platform level (`/platform`). Does the director onboard to an existing academy, or does registration create the academy? Decision needed before Sprint 197.

2. **Logo upload target:** Supabase Storage vs external CDN vs URL-only? URL input is migration-free. Storage upload requires a new bucket and RLS policy.

3. **Coach email invite vs manual creation:** Current `profiles` table requires `academy_id` at creation — there is no invite token table. Is V1 OK with director creating coach accounts manually, or does email invite need to be designed first?

4. **Curriculum customization scope:** Does academy curriculum customization (Phase 5) mean: (a) hiding/showing existing levels, (b) adding academy-specific drills to a level, or (c) full level override? The current `CurriculumCustomizationAssistant` component only scaffolds option (a). Options (b) and (c) need migration work.

5. **Parent/player portal activation:** Is the parent portal a separate URL (`parent.academy.com`) or a tab on the main app? This affects how portal visibility settings are enforced at auth time.

6. **Onboarding route guard:** Should the director be forced through onboarding before accessing the main app, or can they skip it? A force-through would require middleware changes.

7. **Multi-director academies:** Some academies may have multiple directors. Who owns the onboarding flow? Is onboarding per-director or per-academy?

8. **Demo week with real data:** The current demo sandbox uses generic `[DEMO]` data. Should the demo week use the director's actual groups and templates once they are created?

---

## File Map

| File | Purpose |
|---|---|
| `docs/ACADEMY_ONBOARDING_ARCHITECTURE.md` | This document |
| `src/components/onboarding/SetupProgressChecklist.tsx` | V1 checklist widget — extend to Phase 17 launch checklist |
| `src/components/onboarding/GuidedStepCard.tsx` | Step card — reusable in onboarding wizard |
| `src/components/onboarding/NextBestActionCard.tsx` | CTA card — reusable at end of each phase |
| `src/app/director/demo/page.tsx` | Phase 16 demo preview — functional, no changes needed for V1 |
| `src/app/director/players/onboarding-review/page.tsx` | Post-activation player readiness — feeds into launch checklist |
| `src/components/curriculum/CurriculumCustomizationAssistant.tsx` | Phase 5 scaffold — needs wiring in Sprint 204+ |
| `src/app/platform/page.tsx` | Platform admin — academy creation lives here for now |
