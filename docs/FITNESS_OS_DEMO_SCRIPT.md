# Fitness OS Template Builder — Demo Script

**Sprint:** 145
**Date:** 2026-05-01
**Route:** `/director/fitness/templates`

---

## Setup

- Logged in as academy_director or head_coach.
- At least one academy exists with an academy_id.
- Exercise library has at least a few exercises with movement/fitness/cool_down categories.

---

## Demo Sequence

### Step 1 — Open Fitness OS

Navigate to `/director/fitness/templates`.

**Show:**
- Page eyebrow: FITNESS OS
- Title: Fitness Templates
- Subtitle: "Build structured fitness templates from movement, agility, speed, strength, coordination, and recovery blocks."
- Stat cards: Total Templates, Active, Total Blocks
- Empty state with "No fitness templates yet" (if none exist) or the template list

**Talking point:**
> "This is the Fitness OS — a dedicated training layer separate from your class/session templates. Everything here is fitness-specific: structured protocols your coaches can load into training days."

---

### Step 2 — Create a Standard Fitness Template

Click **New Fitness Template**.

Fill in:
- Name: "Pre-Season Conditioning Protocol"
- Template Type: **Standard**
- Description: "Full fitness protocol for players entering pre-season training block."
- Duration: 75

Click **Create Template**.

**Show:**
- Redirect to the new template detail page.
- Page header shows "FITNESS OS" eyebrow and "Pre-Season Conditioning Protocol" title.
- Meta card shows: Standard type, 75 min, 0 blocks, 0 exercises, Active.

**Talking point:**
> "We have a clean Fitness OS builder. This is separate from your class template library — no session generation, no curriculum links. Pure fitness protocol."

---

### Step 3 — Add a Movement Block

Click **Add Fitness Block**.

Select **Movement**.

**Show:**
- Block appears immediately.
- Block label: "Movement" with accent color.
- Intent description: "Dynamic warm-up, movement preparation, footwork patterns"
- If exercises matched: up to 3 exercise rows auto-populated.

**Talking point:**
> "The system matched exercises from your library to this block type automatically. Three exercises, deterministic — no randomness. The director can always swap or remove."

---

### Step 4 — System Suggests 3 Movement Exercises

Point to the exercise rows:
- Category: movement or warm_up
- Duration shown per exercise

**Talking point:**
> "These came from your academy's exercise library. The system looked at category, subcategory, and exercise name keywords to find the best matches for a Movement block."

---

### Step 5 — Add an Agility Block

Click **Add Fitness Block** → **Agility**.

**Show:**
- Agility block added below Movement.
- System auto-populates matching exercises (ladder, cone drills, etc. if present).
- Intent: "Ladder drills, cone reactions, change of direction"

**Talking point:**
> "Same behavior — system finds the closest matches for Agility. We can have eight block types: Movement, Agility, Speed, Plyometrics, Strength, Coordination, Mobility, Recovery."

---

### Step 6 — Swap One Exercise

Click **Switch** on any exercise in the Agility block.

**Show:**
- FitnessExerciseSwitcher modal opens.
- "Agility" matches appear first with "Match" badge.
- Search bar filters by name/category.
- Select a different exercise.
- Click Confirm Switch.

**Show after:**
- Exercise row replaced with the selected exercise.
- Original exercise still exists in the library.

**Talking point:**
> "The swap updates only this block's exercise assignment. The exercise library is never modified. If the coach prefers a different ladder drill for this group, one click changes it."

---

### Step 7 — Add a Strength Block

Click **Add Fitness Block** → **Strength**.

**Show:**
- Strength block added.
- Intent: "Bodyweight strength, core stability, lower-body control"
- Exercises populated.

---

### Step 8 — Add a Voice Observation

Click the **MessageSquare** icon on the Agility block.

Observation panel opens.

Speak or type:
> "This group needs easier plyometric progressions after long match weekends."

Click **Save Observation**.

**Show:**
- Observation text appears below the Agility block header with green "Observation" label.
- Observation button now has a lime border (indicating notes are present).

**Talking point:**
> "This observation is internal only. It does not modify the template, does not update player records, and does not send any communication to parents or players."

---

### Step 9 — Explain the Future Vision

Point to the saved observation.

> "In a future sprint, the AI layer will be able to read these observations alongside fitness assessments, attendance data, and player readiness context — and draft suggested adjustments for the director's review. Nothing changes automatically. The director always approves."

> "This observation is the seed. The structure to act on it will be built next — but the core principle stays the same: AI proposes, director approves, system executes."

---

### Step 10 — Show Class Templates Separation

Navigate to `/director/class-templates`.

**Show:**
- Imported Airtable program templates appear here.
- Page eyebrow: "Curriculum"
- Title: "Class Templates"
- "Fitness training protocols are under Fitness OS."

**Talking point:**
> "Your imported program templates are here under Class Templates. Nothing was deleted. The Fitness OS is now a clean, separate system. Class templates stay in the Curriculum section. Fitness protocols stay in Fitness OS."

---

## End of Demo

Return to `/director/fitness/templates` to show the completed template in the list.
