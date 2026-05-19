# Sprint 384 — Director Class Template Builder V1

**Date:** 2026-05-19
**Branch:** main

---

## Route State Before Sprint

`/director/class-templates/new` existed with a minimal 3-step form:
- Step 1: Template name + description
- Step 2: Template type, ball level, group type (select menus)
- Step 3: Total duration input
- Submit called `createClassTemplateAction` and redirected to `[templateId]` detail page

The form was functional but had no block structure selection, no coach preview,
no Academy DNA connection, and no draft-first language. The page was a stateless
server component with no DB reads.

---

## Backend Save

**Full backend save implemented.** The new builder uses a new server action:

`src/app/director/class-templates/createClassTemplateWithBlocksAction.ts`

Modeled on `saveAssistantTemplateDraftAction` (the existing voice assistant template pattern).

Auth pattern:
1. `isPreviewMode()` check
2. `getSupabaseServer()` + `supabase.auth.getUser()`
3. `profiles.academy_id` — academy from authenticated profile
4. `academy_memberships` role check — `academy_director` or `head_coach`
5. Insert `templates` row (tags: `['source:builder_v1', 'status:draft']`)
6. Insert `template_blocks` rows for each selected block
7. `revalidatePath('/director/class-templates')`

Block notes are stored as JSON: `{ coach_cue: string }`.

The existing `createClassTemplateAction` is unchanged and still used by the
assistant-based voice flow.

---

## Builder Sections Added

### 1. Header (page.tsx)
- Title: "Create Class Template"
- Subtitle: "Turn your Academy DNA into a coach-ready session structure."
- Draft pill: "Draft first — nothing published to coaches until you apply it"

### 2. DONNA Guidance Card
- Shows DNA session approach pills when `settings.academy_dna` is present
- Lists DNA development priorities if available
- "Apply standard session structure" link pre-populates blocks deterministically
  (no AI call — purely rule-based based on session duration)
- Static fallback when no DNA: "Once your Academy DNA is saved..."

### 3. Template Basics
- Template name (required)
- Description
- Template type (select)
- Ball / Level focus (select)
- Group type (select)
- Session length in minutes

### 4. Block Builder
- Nine-block catalog: Warm-Up · Technical Skills · Drills · Tactical Patterns ·
  Games · Point Play · Match Play · Assessment Moment · Reflection/Wrap-Up
- Add Block: inline catalog picker with type badge + default duration
- Each added block: index number · type badge · label · duration input · expand toggle · remove
- Expanded block: Coach Cue text input
- Total minutes indicator (clock icon + used/total)
- Over-budget warning (orange alert, shows overage in minutes)

### 5. Coach Preview
- Live-updating from selected blocks
- Shows: block order · label · duration badge · coach cue (if set)
- Renders as "Coach View — Session Plan"
- Only shown when at least one block is selected

### 6. Draft Safety Notice
- "Draft only. Nothing is published to coaches yet."
- Persists above the submit button throughout the form

### 7. Save Button
- "Save Draft Template" (not "Create Template", not "Publish")
- Disabled when name is empty or while saving
- On success: redirects to `[templateId]` detail page for further refinement

---

## Class Block Model Used

| Label | DB block_type | Default (min) |
|---|---|---|
| Warm-Up | warm_up | 10 |
| Technical Skills | technical | 15 |
| Drills | technical | 10 |
| Tactical Patterns | tactical | 10 |
| Games | competition | 10 |
| Point Play | competition | 10 |
| Match Play | competition | 10 |
| Assessment Moment | mental | 5 |
| Reflection / Wrap-Up | cool_down | 5 |

---

## Academy DNA Connection

**Connected server-side.** `page.tsx` is now `async` and reads:
- `settings.academy_dna.session_design.session_blocks` → `dnaSessionBlocks[]`
- `settings.academy_dna.player_development.development_priorities` → `dnaDevelopmentPriorities[]`

DNA read is best-effort (wrapped in try/catch) — page renders with static DONNA
card if read fails. No new DB query path — reuses the same `academies.settings`
pattern established in Sprint 381.

DNA `session_blocks` are coaching approach IDs (e.g. `technique-blocks`,
`point-play`) not block structure types. They are displayed as labelled pills
in the DONNA card. Direct approach→block mapping is deferred to a future sprint.

The "Apply standard structure" button provides a deterministic pre-population:
- 60 min: Warm-Up · Technical Skills · Tactical Patterns · Games · Wrap-Up
- 90 min+: Warm-Up · Technical Skills · Drills · Tactical Patterns · Games · Point Play · Wrap-Up

---

## Safety Language

All draft/safety language:
- Page header pill: "Draft first — nothing published to coaches until you apply it"
- DONNA card is explicitly labeled "DONNA" with the D avatar
- Submit button: "Save Draft Template" (not "Publish", not "Send to coaches")
- Draft safety notice: "Draft only. Nothing is published to coaches yet."
- Tags written to DB: `['source:builder_v1', 'status:draft']`
- No "applied academy-wide" language anywhere

---

## What Is Not Implemented Yet

| Feature | Deferred to |
|---|---|
| Player watch-for per block | Sprint 385 or detail page |
| Evidence opportunity per block | Detail page (curriculum link flow) |
| Block reordering (drag-and-drop) | Future sprint |
| Fitness template blocks in this builder | Separate fitness builder route |
| Direct DNA approach → block type mapping | Future sprint |
| Curriculum level pre-linking | Detail page via SetCurriculumLevelAction |
| Coach note templates per block | Detail page |
| Video placeholder label | Future sprint |

---

## Files Created/Modified

| File | Change |
|---|---|
| `src/app/director/class-templates/new/page.tsx` | Rewritten: async, reads Academy DNA, passes props to form, updated header |
| `src/app/director/class-templates/new/NewClassTemplateForm.tsx` | Rewritten: full builder with DONNA card, block builder, coach preview, draft notice |
| `src/app/director/class-templates/createClassTemplateWithBlocksAction.ts` | Created: new server action for template + blocks atomic creation |

---

## Next Sprint Recommendation

**Sprint 385 — Director Class Template List View Enhancement V1**

The class template list page (`/director/class-templates`) currently shows created
templates but may not differentiate between draft and published states. Add:
- Draft vs active status badges on template list cards
- Quick link to "Create First Class Template" if list is empty
- Template block count + total duration shown on list cards
- Academy DNA approach tags shown if present in template

OR pivot to **Sprint 385 — Director Fitness Template Builder V1** to complete
the second post-DNA setup task (Create Fitness Template).

---

## TypeScript

Clean. `npx tsc --noEmit` — no errors.
