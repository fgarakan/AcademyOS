# Premium UI Audit

**Sprint:** 81
**Last updated:** 2026-05-01

---

## Screens Reviewed

1. `/director/curriculum` — Curriculum command center
2. `/director/curriculum/academy-version` — Academy version + overrides + audit
3. `/director/review` — Draft review queue
4. `/director/fitness/templates/[templateId]` — Template detail
5. `/director/sessions/[sessionId]` — Session detail / coach view
6. `/director/players/[playerId]` — Player profile

---

## Clutter Risks

### `/director/curriculum`
- 6 equal-weight cards in a 2-column grid — no visual hierarchy between "foundation stats" and "your academy version"
- The Academy Curriculum Version card is not differentiated from the content stat cards
- Quick links section at bottom duplicates sidebar navigation — adds noise
- The `label-xs` "Curriculum Content Engine" label appears before the grid with no clear section break
- No guidance on what to do next

### `/director/curriculum/academy-version`
- Audit section (Sprint 79) has 6 stat boxes in a 3x2 grid — dense and hard to scan
- Diff cards show technical fields: `target_type`, `override_type`, `scope`, `pathway`
- Applied overrides section header has both a label and a badge but is otherwise minimal
- Recommendation section has 3-4 items without visual priority
- Guardrail banner at top is fine but verbose

### `/director/review`
- Section headers are `label-xs` with thin border — sections don't feel distinct enough
- The "Approved — Ready to Apply" / "Pending Review" split within each section is repetitive across 5 draft types
- PageHeader shows total counts as badges but there is no visual summary of what's in which category
- No queue overview — director lands on the page and has to scroll to find what needs attention

### `/director/fitness/templates/[templateId]`
- Curriculum level selector and "Populate from Curriculum" are buried after GenerateSessionPanel and TemplateMeta
- The populate button is the most valuable intelligent action but is visually secondary
- `PopulateFitnessBlocksButton` and `PopulateCurriculumBlocksButton` are at the same visual level — curriculum should be primary
- Import-source tags (airtable_id, import_batch) are shown in the template meta by default — clutter

### `/director/sessions/[sessionId]`
- The "planned session snapshot" info banner is verbose — directors know this
- Session meta stats (blocks, exercises, completed) are good but positioned early before more important context
- Curriculum Focus section is good but appears after Group Assignment — curriculum is more important for coaching
- No class-level briefing — coaches can't get a quick overview of who is in the class and what they need
- Roster & Attendance section shows data but no development context per player

### `/director/players/[playerId]`
- Tab structure is clean and well-organized
- `PlayerCurriculumAssignmentCard` (Sprint 72) is good — shows academy version clearly
- The Notes tab is dense — long list of sections with many equal-weight cards

---

## Hierarchy Problems

1. **Academy Version not primary** — On the curriculum page, the academy version is equal weight to 4 content stat cards. It should be the primary element because it drives everything.

2. **Curriculum Focus not first** — On the session page, curriculum context is the most important coaching context but is positioned after session meta. It should be near the top.

3. **Review queue has no overview** — There is no way to see at a glance what categories have pending items without scrolling the entire page.

4. **Template curriculum section is secondary** — The most valuable action (populate curriculum blocks) is buried after template stats and session generation.

5. **Roster without context** — The session roster shows attendance but not development context per player. Coaches can't see who needs what.

---

## Quick Wins

1. **Move Academy Version to top of curriculum page** — Prominent placement + "how it works" guide
2. **Add Coach Briefing section on session page** — Top-level summary of class before the details
3. **Add Class Roster Intelligence** — Per-player development context on session page
4. **Add review queue summary strip** — Quick overview of all pending/ready counts by category
5. **Move curriculum section above GenerateSessionPanel on template page** — Make populate the primary action
6. **Simplify audit section stats** — Compact horizontal strip instead of 6-box grid
7. **Remove airtable import tags from template meta default view** — Show only if debugging needed

---

## Reusable UI Patterns Already Available

- `Card`, `CardHeader`, `CardContent` — Use for all grouped content
- `EmptyState` — Use for zero-state sections
- `SectionHeader` — Use for section titles
- `StatusBadge`, `LevelBadge` — Use for status indicators
- `label-xs` — Small uppercase section labels
- `btn-lime`, `btn-ghost` — Primary/secondary actions
- Lime accent (`text-lime`, `border-lime/30`) — Reserve for active/success states only

---

## Premium Design Rules for This Repo

1. **One primary action per section** — The most important action has a `btn-lime` style; secondary actions are `btn-ghost` or plain links.
2. **Stats hierarchy** — Large mono numbers for the most important count; small secondary labels for details.
3. **Card sparingly** — Don't put every piece of information in its own Card. Group related items.
4. **Technical fields are hidden by default** — No `target_type`, `override_type`, `scope` unless in an expansion or debug view.
5. **Status pills are calm** — Small, right-aligned, never dominating the card.
6. **Section labels are uppercase tiny** — `label-xs` / `text-[10px] uppercase tracking-widest`
7. **Guardrails are present but quiet** — Show the guardrail once, in muted text, not as a banner that takes up space.
8. **Empty states explain what to do** — Not just "nothing here" but "here's the next step."
9. **Lime accent is sparse** — Active states, primary numbers, success indicators only. Not decorative.
10. **Override counts in lime** — Applied count in lime, other counts in muted.

---

## Recommended Polish Path for Sprints 82–90

| Sprint | Target | Key Change |
|--------|--------|-----------|
| 82 | `/director/curriculum` | Academy Version as primary; How it works guide |
| 83 | `/director/curriculum/academy-version` | Cleaner stats strip; calmer diff cards |
| 84 | `/director/review` | Queue summary strip at top |
| 85 | `/director/fitness/templates/[templateId]` | Curriculum section first; populate as primary action |
| 86 | `/director/sessions/[sessionId]` | Curriculum Focus earlier; polish header |
| 87 | Session page | Class Roster Intelligence Panel (read-only) |
| 88 | Session page | Add strengths/needs/priority to each player card |
| 89 | Session page | Coach Briefing section (synthesized, read-only) |
| 90 | All | QA + demo script |
