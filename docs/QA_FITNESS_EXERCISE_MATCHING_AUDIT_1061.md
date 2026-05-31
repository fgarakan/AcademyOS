# QA Checklist — Sprint 1061 — Fitness Exercise Matching Audit V1

**Date:** 2026-05-31
**Sprint:** 1061
**Tester:** Director role

---

## Pre-test setup

- [ ] Log in as academy_director for demo academy `00000000-0000-0000-0000-000000000001`
- [ ] Navigate to `/director/fitness/templates`
- [ ] Choose an existing fitness template that has Coordination, Speed, and Agility blocks
- [ ] If no such template exists, create one via "New Fitness Template" and add those block types

---

## Test 1 — Coordination block receives coordination-relevant exercises

**Steps:**
1. Open a fitness template that has a Coordination block with no exercises assigned
2. Click "Populate Blocks with Exercises"
3. Inspect the exercises added to the Coordination block

**Expected:**
- Exercises match coordination intent: rhythm, balance, hand-eye, reaction ball, juggling
- Examples from current library: Ball Juggling, Reaction Ball Catch/Drill, Jump Rope – Coordination
- No speed exercises: Acceleration Sprint, Short Court Sprints, Resistance Band Sprint
- No agility exercises: Spider Drill, T-Drill, Zig-Zag Sprint

**Fail condition:**
- Coordination block shows Acceleration Sprint, Agility Ladder, or Butt Kicks as first exercises

---

## Test 2 — Speed block receives speed-relevant exercises

**Steps:**
1. Ensure template has a Speed block with no exercises
2. Click "Populate Blocks with Exercises"
3. Inspect Speed block exercises

**Expected:**
- Exercises match speed intent: sprint, acceleration, court sprints
- Examples: Acceleration Sprint, Short Court Sprints, First Step Quickness
- No strength exercises (Push-Up, Plank) as primary selections

---

## Test 3 — Agility block receives agility-relevant exercises

**Expected:**
- Exercises match agility intent: ladder, cone drills, change of direction, reaction
- Examples: Spider Drill, T-Drill, Zig-Zag Sprint, Star Drill, Reaction Ball Drill
- Not: Bodyweight Squat, Glute Bridge, Plank Hold

---

## Test 4 — Strength block receives strength-relevant exercises

**Expected:**
- Exercises match strength intent: squat, plank, core, push, lunge, resistance
- Examples: Goblet Squat, Plank Hold, Split Squat, Push-Up Progression
- Not: Agility ladder exercises, sprint exercises

---

## Test 5 — Movement/warm-up block still works

**Expected:**
- Movement block (DB type 'movement') still pulls movement/warm-up exercises
- No regression from the change

---

## Test 6 — Mobility block still works

**Expected:**
- Mobility block (DB type 'movement' but name 'Mobility') pulls mobility exercises
- Hip stretches, shoulder mobility, ankle mobility
- Not sprint or agility exercises

---

## Test 7 — Recovery/Cool Down block still works

**Expected:**
- Cool down block still pulls cool_down exercises
- Static stretches, breathing, foam roll exercises

---

## Test 8 — Existing exercises not removed

**Steps:**
1. Open a template that ALREADY has exercises populated in all blocks
2. Click "Populate Blocks with Exercises"
3. Verify no existing exercises were removed

**Expected:**
- `skippedExisting` count > 0 for blocks that already had exercises
- Existing exercises remain; new ones may be added up to remaining duration budget
- No exercises were deleted

---

## Test 9 — "Add Block" path still works correctly

**Steps:**
1. Click "Add Block" → choose Coordination → confirm
2. Inspect newly added block's exercises (added automatically on block creation)

**Expected:**
- The Add Block path (fitnessTemplateActions.ts) still assigns coordination-relevant exercises
- This path was already correct before Sprint 1061 and should remain correct

---

## Test 10 — FitnessExercisePicker still works

**Steps:**
1. Open a block's exercise picker (click "Add Exercise" button on a block)
2. For a Coordination block, check which exercises show as "matches" vs "others"

**Expected:**
- Matched exercises (highlighted) still include coordination-relevant ones
- No regression in the picker UI

---

## Test 11 — Non-fitness blocks unaffected

**Steps:**
1. If template has technical, tactical, or warm_up blocks, populate and check

**Expected:**
- Technical blocks get technical exercises (Serve Footwork, Return Split Timing)
- Warm-up blocks (if any) get warm_up exercises
- Category map path still functions for these non-fitness blocks

---

## Test 12 — TypeScript

- [ ] `npx tsc --noEmit` returns exit 0 with no errors in changed files

---

## Known residual issue (deferred to Sprint 1063)

After Sprint 1061, low-priority exercises (score=2 due to category match only) may still appear in coordination blocks if the duration budget is not fully filled by score=5+ exercises. For example, "Butt Kicks" (category='fitness', no coordination keywords) scores 2 for coordination and could appear if the budget needs filling.

This is a significant improvement over the pre-Sprint-1061 behavior (where these exercises appeared FIRST), but not yet perfect. Sprint 1063 will raise the minimum score threshold for coordination block matching.

---

## Before/after comparison for Coordination block

| | Before Sprint 1061 | After Sprint 1061 |
|---|---|---|
| First exercise | Acceleration Sprint (alphabetically first) | Ball Juggling – One Hand (score 5) |
| Second exercise | Agility Ladder – High Knees | Ball Juggling – Two Hands (score 5) |
| Third exercise | Agility Ladder – In-Out | Reaction Ball Catch (score 5) |
| Logic used | Alphabetical within entire `fitness` category pool | Scored by coordination keywords + category |
| Trust level | Broken — wrong exercises | Correct — coordination-relevant exercises |
