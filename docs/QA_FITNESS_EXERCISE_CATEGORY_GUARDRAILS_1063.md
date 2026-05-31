# QA Checklist — Sprint 1063 — Fitness Exercise Category Guardrails V1

**Date:** 2026-05-31
**Sprint:** 1063

---

## Pre-test setup

- [ ] Logged in as academy_director for demo academy
- [ ] Fitness template exists with Coordination, Speed, Agility blocks (no exercises yet)

---

## Test 1 — Coordination block is clean

**Steps:**
1. Open a fitness template; remove all exercises from the Coordination block
2. Click "Populate Blocks with Exercises"
3. Check exercises added to Coordination block

**Expected (after Sprints 1061 + 1063):**
- Exercises are from: Ball Juggling, Reaction Ball Catch/Drill, Jump Rope – Coordination, Catch and Toss Ladder
- NO Acceleration Sprint, Butt Kicks, Agility Ladder – High Knees, Agility Ladder – In-Out

**Fail:**
- Any speed/agility/sprint exercise appears in the Coordination block

---

## Test 2 — FitnessExercisePicker "suggested" section for Coordination

**Steps:**
1. Click "Add Exercise" on a Coordination block
2. Check the "suggested / match" section at the top of the list

**Expected:**
- Suggested section shows coordination exercises: Ball Juggling, Reaction Ball Catch, Jump Rope – Coordination
- Speed exercises (Acceleration Sprint, Sprint exercises) appear only in "Other Exercises" section

**Fail:**
- Acceleration Sprint or Agility Ladder appears in the "suggested" section for a coordination block

---

## Test 3 — Speed block still gets speed exercises

**Steps:**
1. Remove exercises from Speed block
2. Click "Populate Blocks with Exercises"

**Expected:**
- Speed block populated with: Acceleration Sprint, Short Court Sprints, First Step Quickness, or similar

---

## Test 4 — Agility block still gets agility exercises

**Expected:**
- Spider Drill, T-Drill, Zig-Zag Sprint, Star Drill, Mirror Drill, or Reaction Ball Drill

---

## Test 5 — Strength block still gets strength exercises

**Expected:**
- Plank Hold, Goblet Squat, Split Squat, Glute Bridge, or Push-Up Progression

---

## Test 6 — Plyometrics block gets plyometrics exercises

**Expected:**
- Squat jump, Broad jump, Lateral bound, Box jump (if available)
- NOT sprint or agility exercises

---

## Test 7 — Movement block still works

**Expected:**
- Dynamic warm-up movements (if any in library)
- Butt Kicks (has 'butt kick' keyword → scores for movement) may appear here — acceptable

---

## Test 8 — FitnessExerciseSwitcher shows correct suggestions

**Steps:**
1. Click "Switch Exercise" on an exercise in a Coordination block
2. Verify the suggested replacements are coordination-relevant

**Expected:**
- Suggested replacements: Ball Juggling, Reaction Ball Catch, Jump Rope – Coordination
- NOT Acceleration Sprint or Agility Ladder exercises

---

## Test 9 — "Add Block" path still assigns correct exercises

**Steps:**
1. Click "Add Block" → choose Coordination

**Expected:**
- Block created with coordination-matched exercises from scoring
- Same improvement as Populate Blocks

---

## Test 10 — TypeScript

- [ ] `npx tsc --noEmit` passes with no errors

---

## Regression checks

- [ ] Saving a template still works after exercise changes
- [ ] Removing an exercise still works
- [ ] Switching an exercise still works
- [ ] Picker still opens and closes correctly
- [ ] No errors in browser console on fitness template page

---

## Score verification (manual trace)

| Exercise | Expected block type | Expected coordination score | Qualifies for coord? |
|---|---|---|---|
| Ball Juggling – Two Hands | coordination | 5+ (juggling + movement cat) | ✅ yes |
| Reaction Ball Catch | coordination | 5 (reaction ball + movement cat) | ✅ yes |
| Acceleration Sprint | speed | 0 | ❌ no |
| Agility Ladder – High Knees | agility/speed | 0 | ❌ no |
| Butt Kicks | speed/movement | 0 | ❌ no |
| Jump Rope – Coordination | coordination | 5 (coordination + movement cat) | ✅ yes |
| Reaction Ball Drill | agility + coordination | 3 (reaction ball keyword) | ✅ borderline |
