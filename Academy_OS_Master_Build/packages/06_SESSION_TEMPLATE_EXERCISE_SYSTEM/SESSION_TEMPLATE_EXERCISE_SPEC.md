# SESSION TEMPLATE EXERCISE SPEC
**Package:** 06 — Session / Template / Exercise System
**Version:** 1.0 | **Status:** Draft

---

## Architecture Rule

> Template default order ≠ session runtime order.

Editing a session's block order or intensity **never** modifies the source template.
A session is an independent instance.

---

## Objects

### Exercise
The atomic training unit. Lives in the exercise library. Reused across templates.

**Key fields:** name, category, subcategory, description, instructions, coaching_points,
duration_min, equipment, tags, level_range, track, video_url

### Template Block
A segment within a template. Has type (warm_up, technical, tactical, etc.),
duration, intensity, and order. Order here is the **default template order**.

### Template
A reusable blueprint for a session. Has a name, group target, track, level target,
and a list of template blocks.

### Session Block
An independent copy of a template block for a specific session.
Can have different order, intensity, and duration than the source template block.
`is_override = true` when changed from template.

### Session
A live instance on a specific date, for a specific group, by a specific coach.
Created from a template (copies template blocks to session blocks) or from scratch.

---

## Exercise Library

### Create Exercise

**Required:** name, category
**Optional:** subcategory, description, instructions, coaching_points, duration_min,
equipment (array), tags (array), level_range, track, video_url

**Categories (enum):** `technical`, `tactical`, `movement`, `fitness`, `competition`,
`mental`, `warm_up`, `cool_down`

**Access:** Any staff member can create. Directors can archive.

### Exercise List View

Filters: category, subcategory, track, level range, tag, search by name

Table columns: Name, Category, Track, Level Range, Duration, Tags

Click → Exercise detail page with full instructions and coaching points.

---

## Template Builder

### Create Template

**Required:** name, academy_id
**Optional:** group_id, track, level_id, description, tags

A template is group-targetable but not group-exclusive.
Multiple groups can use the same template.

### Add Block to Template

Order: drag-and-drop in template editor. `order_index` updates on save.

**Block fields:**
- Type (select from block_type enum)
- Name (text)
- Duration in minutes (integer)
- Intensity (1–5 slider: Low / Moderate / Medium-High / High / Maximum)
- Notes (optional coach note for this block)

### Add Exercise to Block

Search exercise library → add to block → set duration and notes.
Multiple exercises per block. Order within block is drag-sortable.

### Save Template

Template saved with all blocks and exercises.
New sessions created for this group will default to this template if `is_default = true`.

### Template Detail View

Shows all blocks in template order. Read-only. Edit button → template editor.

**Fields visible:** total duration, block types and their intensities, exercises per block.

---

## Session Creation

### From Template

1. Coach selects group → system loads group's default template
2. Coach selects date
3. Session created: `create_session_from_template()` copies template blocks to session blocks
4. Coach can optionally adjust any session block before saving (does not change template)

### From Voice Command

> "Build next Monday's orange-ball technical block."

Voice pipeline creates a proposed action → director approves → `create_session_from_template()` called.

### From Scratch

No template. Coach manually adds session blocks and exercises.

---

## Session Editor

Opened from the session detail page or calendar.

### Block List

Shows session blocks in **session runtime order** (independently sortable from template).

Each block row shows:
- Block type icon
- Name
- Duration
- Intensity indicator (color-coded 1–5)
- Override indicator if changed from template
- Exercises in this block (collapsed / expand)

**Reorder:** Drag blocks to change session runtime order. Template unaffected.

**Edit block inline:**
- Duration (number input)
- Intensity (1–5 slider)
- Notes

Changes → `session_blocks.is_override = true`

### Load Summary (always visible while editing)

Three-bar horizontal indicator showing average intensity for:
- Skill (technical + tactical blocks)
- Competition (competition blocks)
- Fitness (fitness + movement blocks)

**Overload warning:** Shown in red if all three are ≥ 4 (high / maximum).

---

## Attendance

Taken on the session page after session starts.

Shows player list for the group. Each player: Present / Absent / Late / Excused toggle.

Session status flows: `planned → in_progress → completed`

---

## Load Management View

Available from: session list, group overview, director dashboard.

Shows one row per session. Columns:

| Column | Description |
|---|---|
| Date | Scheduled date |
| Group | |
| Coach | |
| Skill Intensity | Average of technical + tactical blocks |
| Competition Intensity | Average of competition blocks |
| Fitness Intensity | Average of fitness + movement blocks |
| Overload | ⚠️ flag if all three ≥ 4 |

Draws from `v_session_load` view.

---

## Intensity Scale

| Value | Label | Description |
|---|---|---|
| 1 | Low | Recovery; light warm-up; low demand |
| 2 | Moderate | Development work; sustainable effort |
| 3 | Medium-High | Full-speed technical work; good effort |
| 4 | High | Competition simulation; near-max effort |
| 5 | Maximum | Peak demand; used sparingly |

---

## V1 Scope

- Exercise library (CRUD) ✅
- Template builder ✅
- Session creation from template ✅
- Session editor (block reorder, intensity override) ✅
- Attendance tracking ✅
- Load summary in session editor ✅
- Load management view ✅

**V2:**
- Voice-created templates
- AI session brief (pre-session summary from template content)
- Session performance notes per exercise
- Export session as PDF
