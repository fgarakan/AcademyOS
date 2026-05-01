# Brian — Curriculum Content Engine Demo Script

**Date:** 2026-05-01
**Audience:** Brian (director/head coach persona)
**Mode:** Director-facing walkthrough

---

## Demo Narrative

"Academy OS now connects the curriculum to every session — from level to template to coach execution. Here is how it works."

---

## Scene 1: Orange Ball curriculum has levels and requirements

**Action:** Navigate to `/director/players/[any-orange-player-id]`

**Show:**
- Player is at Orange 1 — Rally
- Curriculum requirements panel shows the 10 Orange 1 requirements across Skill / Competition / Fitness
- Requirements have evidence links and progress status
- "Level Readiness" section shows which requirements are met

**Say:** "Every Orange Ball player has a set of named requirements. The system tracks which are met, which need evidence, and which are blocking advancement."

---

## Scene 2: Orange Ball levels have content — drills, games, assessments

**Action:** Run query or navigate to future curriculum content page:
```sql
SELECT title, content_type, pathway
FROM curriculum_content_items
WHERE level_id = (SELECT id FROM curriculum_levels WHERE stage = 'orange_development' AND level_number = 1)
AND academy_id IS NULL
ORDER BY content_type, title;
```

**Show:**
- 9 content items for Orange 1: skills, drills, games, assessments
- Each item has cues, success criteria, progressions, regressions
- Assessment items are tagged `is_assessment_moment = true`

**Say:** "The OS ships with a curriculum content pack for every Orange Ball level — drills, games, and assessment moments designed specifically for where these players are developmentally."

---

## Scene 3: Content maps to requirements

**Action:** Show the mapping query:
```sql
SELECT cci.title as content, ctr.title as requirement, ccrm.mapping_type
FROM curriculum_content_requirement_mappings ccrm
JOIN curriculum_content_items cci ON cci.id = ccrm.content_id
JOIN curriculum_track_requirements ctr ON ctr.id = ccrm.requirement_id
WHERE cci.level_id = (SELECT id FROM curriculum_levels WHERE stage = 'orange_development' AND level_number = 1)
ORDER BY ccrm.mapping_type, cci.title;
```

**Show:**
- "5-Ball Rally Consistency Assessment" → **assesses** "Rally consistency" requirement
- "Cooperative Crosscourt Baseline Rally" → **develops** "Rally consistency" + reinforces "Basic directional intent"
- "Mini-Set with Scoring Practice" → **develops** "Scoring awareness" + "Point-start routine"

**Say:** "The OS knows which content develops, assesses, or reinforces each requirement. This is the bridge between the session plan and the player's progress."

---

## Scene 4: Director creates a template and selects a curriculum level

**Action:** Navigate to `/director/fitness/templates/[template-id]`

**Show:**
- Template detail page with the new `Curriculum Focus` card
- Click the dropdown — shows all 15 curriculum levels grouped by stage
- Select `Orange 1 — Rally`
- Click `Save` — confirm saved

**Say:** "The director tags this template as an Orange 1 session. One click — the OS now knows who this template is for."

---

## Scene 5: OS populates blocks from the curriculum

**Action:** On the same template page, click `Populate from Curriculum`

**Show:**
- Button activates (was greyed out without a level selected)
- After click: result card shows "Populated X of Y blocks from Orange 1 — Rally"
- Click `Show block detail` — shows each block with content items written
- Click into the template editor — block notes contain `[Curriculum: Orange 1 — Rally]` with drills, games, cues, and success criteria

**Say:** "The OS automatically fills each block with curriculum-appropriate content. The warm-up block gets warmup and movement drills. The technical block gets skill drills. The competition block gets games and assessment moments. All from the Orange 1 content library."

---

## Scene 6: Director generates a session — curriculum context preserved

**Action:** Use the `Generate Session` panel to create a session

**Show:**
- Create a session from this template
- Navigate to `/director/sessions/[new-session-id]`
- Session notes start with `[Curriculum: Orange 1 — Rally]`
- Each session block shows the curriculum notes the coach will read

**Say:** "When the director generates a session from this template, the curriculum context travels with it. The coach opens the session and sees exactly which drills to run and what success looks like for this level."

---

## Scene 7: Coach sees curriculum context during execution

**Action:** On the session page, scroll to `CURRICULUM FOCUS`

**Show:**
- `CURRICULUM FOCUS` section shows: `Orange 1 — Rally`
- Subtitle: `Orange Development`
- Note: "Block notes contain curriculum drills, games, cues, and success criteria"
- Each session block shows structured notes including drills, key cues, and success criteria

**Say:** "The coach has everything they need. No separate documents. No guessing. The curriculum is built into the session plan."

---

## Scene 8: Player progress and evidence loop

**Action:** Return to player profile

**Show:**
- Player profile has Orange 1 requirements
- After a session where a coach confirms a requirement: evidence link appears
- Evidence progresses the requirement
- Level readiness updates

**Say:** "After the session, evidence connects back to the player's requirements. The curriculum loop is closed: level → template → session → coach execution → evidence → player progress → next recommendation."

---

## Closing

"Academy OS is now curriculum-aware from template to session to player progress. The next step is adding content packs for Red Ball, Green Ball, and Yellow levels — and connecting the template population to the coach workspace for live session execution."

---

## Demo Checklist

- [ ] Orange Ball player loaded with requirements visible
- [ ] Orange Ball content items visible in DB (29 rows expected)
- [ ] Content-to-requirement mappings visible in DB
- [ ] Template curriculum level selector functional
- [ ] `Populate from Curriculum` writes curriculum notes to blocks
- [ ] Generated session has curriculum prefix in notes
- [ ] Session page shows `CURRICULUM FOCUS` card
- [ ] TypeScript check passes: `npx tsc --noEmit`
- [ ] No parent/player data exposed
- [ ] No AI API calls
- [ ] No player level changes
