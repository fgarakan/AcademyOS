# Curriculum Creation Workflow Audit V1

**Date:** 2026-06-04
**Auditor:** Claude Code
**Starting prompt:** "I want to create or modify a curriculum level."

---

## Overview

The curriculum creation workflow covers adding content to an existing curriculum level or modifying level structure. In AcademyOS, all curriculum content goes through a **propose → review → approve** pipeline — nothing changes directly.

This audit traces the workflow for creating/modifying each type of curriculum object and documents friction points at each step.

---

## Starting Point for the Director

A director who wants to create or modify curriculum navigates to:
`/director/curriculum` (sidebar: Curriculum → links to `/director/curriculum/builder`)

**What they see first:**
1. A CONNECTIONS section (4 icons explaining what curriculum connects to)
2. CurriculumStageInsightCard per stage (5 stages × level cards)
3. CurriculumLevelTree (the expandable tree below)
4. CurriculumHealthPanel (coverage report with A-F grade)

**Confusion on landing:**
- The connections section tells the director WHAT the curriculum connects to, not what to do next
- The stage insight cards and the level tree both show level information — two redundant representations of the same hierarchy
- No DONNA brief on entry: "Your curriculum has X levels. These Y need attention."
- No prominent "Add" CTA — director must know to click a level card to open the node drawer

---

## Workflow: Creating/Modifying a Curriculum Level

### Step 1: Find the level
- Director scrolls through the level tree or stage insight cards
- Levels are grouped by stage (Red/Orange/Green/Yellow/HP)
- Each stage shows level cards with gate count, drill count, a health dot
- **Friction:** No search for levels. Director with 10+ levels must visually scan.

### Step 2: Open the level
- Click a level card in the tree → CurriculumNodeDrawer slides in from the right
- Drawer shows the level name + stage at the top
- Tabs inside the drawer: Level Detail, Draft Entry, DONNA Add, Preview, Video, Drills, Skills, Tactical, Mental, Coach Cue Video, Media Role Preview, Assessment, Assessment Review

**CurriculumNodeDrawer tabs (12-13 tabs):**
| Tab | Purpose |
|---|---|
| Level Detail | View level data (CurriculumLevelDetailPanel) |
| Draft Entry | Freeform text draft for curriculum change (CurriculumDraftEntryPanel) |
| DONNA Add | DONNA suggestions for adding to this level (DonnaCurriculumNodeAddCard) |
| Preview | Node preview (CurriculumNodePreview) |
| Video | Video panel (CurriculumVideoPanel) |
| Drills | Drill draft (CurriculumDrillDraftPanel) |
| Skills | Skill draft (CurriculumSkillDraftPanel) |
| Tactical | Tactical content draft (CurriculumTacticalDraftPanel) |
| Mental | Mental performance draft (CurriculumMentalDraftPanel) |
| Coach Cue / Video | Coach cue + video pairing (CoachCueVideoPairingPanel) |
| Media Role Preview | Parent/player/coach visibility preview (MediaRolePreviewPanel) |
| Assessment | New player assessment (NewPlayerAssessmentPanel) |
| Assessment Review | Review assessments for this level (AssessmentReviewPanel) |

**Cognitive load:** 12-13 tabs in a drawer is overwhelming. Director landing on "Level Detail" must understand which tab matches their intent. There is no guidance on which tab to use.

### Step 3: Choose what to add

**For each object type:**

#### Adding a Drill
- Go to "Drills" tab in drawer
- Fill in drill details or attach existing drill
- Submits to `proposed_actions` pipeline → appears in review queue
- **Friction:** Unclear whether to use "Draft Entry" tab or "Drills" tab for drill-specific content. Two tabs could add drills.

#### Adding a Skill
- Go to "Skills" tab in drawer
- Define skill: name, domain, player-facing label, coach description, sub-skills
- Submits to `proposed_actions` pipeline
- **Friction:** `skillCount` in coverage scoring is hardcoded to 0 — director adding skills sees no impact on health score yet

#### Adding an Assessment
- Go to "Assessment" tab in drawer
- Launches NewPlayerAssessmentPanel for the level
- **Friction:** Assessment panel is focused on player assessment recording, not defining curriculum assessment criteria. The naming is ambiguous — "Assessment" could mean either.

#### Adding a Mission
- Through content type model, missions are attachable to levels
- No dedicated "Mission" tab in the drawer — missions are in the "Draft Entry" or "DONNA Add" flow
- **Friction:** Mission attachment to a level is not clearly surfaced as a direct action

#### Adding a Badge
- Through content type model, badges are attachable to levels
- No dedicated "Badge" tab in the drawer
- **Friction:** Badge attachment is not directly surfaced

#### Adding Parent Guidance
- Through content type model, parent_guidance is a content type
- No dedicated "Parent Guidance" tab — covered under "Draft Entry" or the DONNA suggest flow
- **Friction:** Parent guidance addition has no dedicated creation flow

#### Adding a Learning Module
- Learning modules are generated in-memory — not added through the drawer
- **Gap:** Learning modules cannot be customized or saved through any UI

#### Adding a Coach Cue
- "Coach Cue / Video" tab in drawer
- Uses CoachCueVideoPairingPanel
- **Friction:** This is one of the cleaner flows in the drawer

#### Adding a Player-Facing Explanation
- No dedicated tab
- Covered loosely under "Skills" (playerFacingLabel on the Skill object)
- **Gap:** No direct "what the player should know about this level" creation flow

---

## Step 4: Create the draft

After entering content in any drawer tab, the director submits a draft.

**What happens:**
- Draft goes into `proposed_actions` as `status: 'pending_review'`
- OR draft goes into `academy_curriculum_overrides` as `status: 'draft'`
- **Not immediately applied to curriculum**

**Confusion point:** Two different tables receive curriculum drafts:
1. `proposed_actions` — for coach suggestions, voice intake, DONNA proposals
2. `academy_curriculum_overrides` — for director-initiated curriculum changes via the builder

The review queue tab "Curriculum & Session" shows `CurriculumBuilderDraftCard` and `CoachCurriculumSuggestionCard` — but these come from different tables and different flows. The director may not know which queue their draft is in.

---

## Step 5: Review and approve

**Director-initiated overrides:**
- Go to `/director/curriculum/builder` → CurriculumBuilderChangeQueue
- Shows pending `academy_curriculum_overrides` rows
- Director clicks Approve → `execute_curriculum_override()` RPC applies the change

**Coach suggestions / voice intake:**
- Go to `/director/review` → "Curriculum & Session" tab
- Shows `CurriculumBuilderDraftCard` or `CoachCurriculumSuggestionCard`
- Director approves → `proposed_action.status = 'approved'`
- **Gap:** Approved coach suggestions do not automatically update the curriculum. The approval marks the proposed_action as approved, but no `execute_curriculum_override()` is called. The gap between "approved" and "applied to curriculum" is not closed.

---

## Workflow Friction Summary

| Step | Friction | Severity |
|---|---|---|
| Landing on curriculum page | No orientation — two representations of hierarchy | MEDIUM |
| Finding a level | No search — must visually scan | MEDIUM |
| Opening the drawer | 12-13 tabs with no guidance | HIGH |
| Adding a drill | Two tabs could be used — unclear which | MEDIUM |
| Adding a mission | No dedicated tab | HIGH |
| Adding parent guidance | No dedicated tab | HIGH |
| Adding a badge | No dedicated tab | HIGH |
| Creating draft | Two different draft pipelines | HIGH |
| Reviewing drafts | Two different queue locations | HIGH |
| Applying approved changes | Approved ≠ applied for coach suggestions | CRITICAL |

---

## What DONNA Currently Helps With

- `DonnaCurriculumContextPanel`: activated by `?improve=[levelKey]` URL param — provides evidence-backed improvement suggestions
- `DonnaCurriculumNodeAddCard`: DONNA suggestions for what to add to a specific level
- `DonnaCurriculumImproveDraftButton`: one-click to create a draft from DONNA's suggestion

**DONNA does NOT currently:**
- Orient the director on entry ("Your curriculum has these gaps, here's where to start")
- Guide the director through which tab to use for their intent
- Explain the two-pipeline draft system
- Identify that approved coach suggestions aren't being applied to the curriculum

---

## Where DONNA Should Help (Currently Missing)

1. **On curriculum landing:** "You have 3 levels with critical gaps. Orange Ball 2 is missing fitness content — 8 players are affected. Want to start there?"
2. **In the drawer:** "Based on your intent (you said 'add a warm-up drill'), go to the Drills tab."
3. **After draft created:** "Your draft is in the review queue. It will be applied after you approve it in [link to queue location]."
4. **After approval:** "This suggestion was approved but needs to be applied to the curriculum. [Link to builder]."

---

## Objects That Lack a Creation Flow

| Object | Status |
|---|---|
| Drill | Partial — Drills tab in drawer |
| Coach Cue | Partial — Coach Cue tab in drawer |
| Assessment Criterion | Partial — Assessment tab (ambiguous) |
| Skill / Sub-Skill | Partial — Skills tab in drawer |
| Mission | NO dedicated creation flow |
| Badge | NO dedicated creation flow |
| Parent Guidance | NO dedicated creation flow |
| Player-facing explanation | NO dedicated creation flow |
| Learning Module | NO creation flow (generated in-memory, not editable) |
| Video / Source attachment | Partial — Video tab in drawer |
