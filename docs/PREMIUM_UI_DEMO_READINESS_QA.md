# Premium UI Demo Readiness QA

**Sprint:** 90
**Date:** 2026-05-01

---

## Screens Improved

| Screen | Changes |
|--------|---------|
| `/director/curriculum` | Academy Version promoted to primary section; How It Works guide added; Global Foundation stats moved to bottom |
| `/director/curriculum/academy-version` | AuditStat compact strip replaces 6-box grid; attention items use calm alert style; page header simplified |
| `/director/review` | `p-6` container added; per-category summary strip added to PageHeader showing pending/ready counts by type |
| `/director/fitness/templates/[templateId]` | Curriculum Intelligence section moved to top; "Uses your academy curriculum version and approved overrides" copy added; populate as primary action |
| `/director/sessions/[sessionId]` | Curriculum Focus moved near top; planned-snapshot notice condensed to one muted line; Coach Briefing section added; Class Roster Intelligence Panel added |

---

## New Components

| Component | Purpose |
|-----------|---------|
| `ClassRosterIntelligencePanel.tsx` | Per-player development context: curriculum level, source (academy/global), strengths, focus areas, top priority, attendance status |

---

## Demo Checklist

### `/director/curriculum`

- [ ] Page loads without sign-in prompt
- [ ] Academy Curriculum Version card is the first content section
- [ ] VoiceOverrideInputPanel appears below it
- [ ] "How It Works" guide visible with 4 steps
- [ ] Navigation links at bottom of How It Works box work
- [ ] Global Curriculum Foundation stats cards render (Spine / Content Library / Templates)
- [ ] "Pending migration" shown gracefully if tables are missing

### `/director/curriculum/academy-version`

- [ ] Page loads with version summary card
- [ ] Version Details: name, status, version number, applied overrides count
- [ ] Applied overrides section shows diff cards
- [ ] Connection Audit: compact AuditStat strip shows Version, Applied, Rolled Back, Templates with level, Players assigned
- [ ] Orange attention items appear when templates missing level or players without assignment
- [ ] Green confirmation item appears when overrides are applied

### `/director/review`

- [ ] Page loads with `p-6` container
- [ ] Total pending and ready-to-apply counts in header
- [ ] Category summary strip shows per-category breakdown (Session Recaps, Priorities, Evidence, Attendance, Curriculum)
- [ ] Each category section renders correctly
- [ ] Empty states are helpful

### `/director/fitness/templates/[templateId]`

- [ ] Curriculum Intelligence section appears at top
- [ ] CurriculumLevelSelector is the first interactive element
- [ ] "Uses your academy curriculum version and approved overrides" copy is visible
- [ ] PopulateCurriculumBlocksButton is prominent
- [ ] GenerateSessionPanel is below
- [ ] TemplateMeta stats card is below that
- [ ] Exercise Population section follows
- [ ] TemplateEditor is at the bottom

### `/director/sessions/[sessionId]`

- [ ] Session header shows name, status pill, date, duration, coach
- [ ] If curriculum context: Curriculum Focus section appears near top
  - [ ] Level name + stage shown
  - [ ] Academy Version name in rounded tag
  - [ ] Academy Customizations listed if overrides exist
  - [ ] "Internal coach context only" guardrail at bottom
- [ ] Coach Briefing section appears after Curriculum Focus
  - [ ] Class size + group name shown
  - [ ] "Watch for today" items: academy emphasis, players with focus areas, players with priorities, players without assignment
  - [ ] "Capture after class" items: recap reminder, unrecorded attendance, priorities suggestion
- [ ] Planned snapshot notice is a single muted line (no card/border)
- [ ] Session meta stats card follows
- [ ] Group Assignment panel works
- [ ] Class Roster Intelligence Panel: per-player cards show name, curriculum level, source, strengths, focus areas, priority, attendance status
  - [ ] Falls back gracefully when no development data recorded
  - [ ] Falls back gracefully when no curriculum assignment
- [ ] Session Blocks render
- [ ] Roster & Attendance section still works
- [ ] Attendance Exception Drafts panel renders
- [ ] Coach Recap section at bottom

---

## Known Limitations

1. **ClassRosterIntelligencePanel** requires `player_development_summary` and `player_priorities` tables to be populated. If empty, players show "No development data recorded" — graceful fallback.
2. **Coach Briefing** "Watch for today" items are empty when no players have development data — correct fallback shown.
3. **Review Queue** has no sorting/filtering — items appear newest first.
4. **Template page** Curriculum Intelligence section relies on `curriculum_level_id` column on `templates` table (migration 045). If absent, selector shows "No levels available."
5. **Session page** does not yet show per-player development in the Roster & Attendance section — that section is now redundant with Class Roster Intelligence (which is the richer view). Consider removing the plain roster list in a future sprint.

---

## Remaining Clutter Risks

1. Session page still has both "Class Roster Intelligence" and "Roster & Attendance" — the simpler attendance section is now somewhat redundant. Consider merging in Sprint 91+.
2. Review queue section headers use `label-xs` with thin borders — could benefit from slightly more visual weight.
3. Template page `TemplateMeta` still shows airtable import tags when present — filtered by existing logic but visible. Low priority.

---

## Recommended Future Sprints

| Sprint | Target | Change |
|--------|--------|--------|
| 91 | Session page | Merge Roster & Attendance into Class Roster Intelligence Panel |
| 92 | Review queue | Collapsible sections for zero-count categories |
| 93 | Player profile | Notes tab polish — reduce equal-weight cards |
| 94 | All | Mobile QA pass |
