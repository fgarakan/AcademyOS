# Brian Interactive Demo Script

**Sprint:** 120
**Date:** 2026-05-01

---

## Setup Before the Demo

1. Log in as the academy director.
2. Navigate to `/director/demo`.
3. If demo sandbox already exists, click "Reset Demo Sandbox" to get a clean state.
4. If not yet created, proceed to Step 3 below.

---

## The Demo in One Sentence

> "This is sample data. Once we upload your actual roster and coaches add strengths and needs, this is exactly how the system works."

---

## Demo Script

### Step 1: Open /director/demo

**Say:**
> "This is the Academy OS Demo Tour. Everything you're about to see runs on real code — real database, real workflows. The only difference is that these are sample players we seeded for the demo. Once we swap them out for your real roster, this is exactly what you'd see."

**Point out:**
- "Preview Mode" banner at the top
- "Demo sandbox not yet created" empty state (if first time)

---

### Step 2: Create the Demo Sandbox

**Action:** Click **"Create Demo Sandbox"**

**Say:**
> "Watch this. I'm creating six sample players — Mia, Leo, Sophie, Ben, Ava, Noah — plus a group, a template, and a session. All tagged as demo data. This takes a couple of seconds."

**Point out after creation:**
- Status pills: 6 players, group, template, session all showing "Ready"
- The result message listing what was created

---

### Step 3: Show Sample Player Roster

**Point to the "Sample Player Data" section.**

**Say:**
> "Each player has a name, and more importantly — strengths, things to work on, and a current priority. This is the development profile. It's what makes the system intelligent about specific kids."

**Click into one player (e.g., Mia Alvarez):**
- Show the full player profile
- Point out strengths: Rally tolerance, Forehand consistency
- Point out needs: Recovery after direction, Return readiness
- Point out priority: Recover after crosscourt ball

**Say:**
> "Takes about 2 minutes per class group to fill these in. After that, the system knows the class."

---

### Step 4: Show Development Profile Intake

**Navigate to:** `/director/players/development-intake`

**Say:**
> "This is how you fill in or update development profiles in bulk. Every player in the list. Click to expand, add strengths and needs, hit Save."

**Point out:**
- "Missing Data" filter button
- How each card auto-expands when data is empty

---

### Step 5: Show Onboarding Review

**Navigate to:** `/director/players/onboarding-review`

**Say:**
> "Before we send any player into the real coaching intelligence, we check four things: curriculum level, group assignment, development profile, current priority. This page shows you the checklist for every player."

**Point out:**
- Readiness bar
- Setup Checklist with gap counts
- Per-player icon indicators (lime = ready, grey = missing)

---

### Step 6: Show Curriculum Customization Preview

**Return to:** `/director/demo` → "Curriculum Customization Preview" section

**Say:**
> "Here's the curriculum flow. A director types — or speaks — a customization. For example: 'For our Orange 2 players, I want more return-of-serve readiness before Orange 3.' The OS creates a draft. The director reviews it. Once approved, it applies to the academy's version of the curriculum — never the global master."

**Point out the sample prompt card.**

**Navigate to:** `/director/curriculum` (show the curriculum page exists)

**Navigate to:** `/director/review` (show where overrides land for review)

---

### Step 7: Open Demo Template

**Navigate to:** `/director/sessions`

**Scroll to:** `[DEMO] Orange 2 Direction + Return Start`

**Say:**
> "This is a session template. Five blocks: movement prep, direction technical drill, crosscourt recovery game, serve and return start, cooldown. Think of this as the master blueprint. We never edit this automatically — it stays as-is."

---

### Step 8: Open Demo Session

**Click the demo session** or use the "Open Demo Session" link on the demo page.

**Navigate to:** `/director/sessions/{demoSessionId}`

**Say:**
> "This is the actual session that would run with the Orange 2 group. Scroll down to Class Roster Intelligence."

**Point out:**
- Class Roster Intelligence panel
- Each demo player listed with their strengths and needs
- "3 players with active focus areas" in the briefing
- Session blocks matching the template

---

### Step 9: Show Coach Briefing

**Point to the Coach Briefing section.**

**Say:**
> "Before the session starts, the coach sees this briefing. Not generic advice — specific to these kids, this group, this curriculum level. It tells the coach what to watch for, who's working on what, what the academy's curriculum emphasis is."

---

### Step 10: Generate Adaptive Suggestions

**Click "Generate Suggestions for This Class."**

**Say:**
> "Now the OS reads the class data and applies deterministic rules. Not AI — rule-based logic. If two or more players have recovery needs, Rule 1 fires. If return readiness is a focus area, a specific return drill suggestion is generated. Watch."

**Wait for suggestions to appear.**

**Point out:**
- Each suggestion has a type, a description, a reason, and named players
- Example: "Add recover-to-middle constraint" → "[DEMO] Mia Alvarez, [DEMO] Ava Thompson"
- Example: "Simplify return-readiness game" → "[DEMO] Sophie Chen"

---

### Step 11: Approve and Apply One Suggestion

**Click Approve on one suggestion.**

**Then click Apply.**

**Say:**
> "Approved means the coach reviewed it and agreed. Apply means it gets written into this session's block notes. Not the template — just this session. The master template is untouched."

**Show the session block with the applied note:**
- Scroll to the affected block
- Show `[Adaptive Adjustment — date]` in the notes

**Say:**
> "This is the guardrail. No suggestion is ever automatic. A human approves every change. And the change only lives in this session."

---

### Step 12: Return to Demo Page and Confirm

**Navigate back to:** `/director/demo`

**Say:**
> "Now we've seen the whole loop: players imported, development profiles filled, curriculum connected, session running, coach briefing informed by real player data, adaptive suggestions named and approved. This is exactly what happens with real players."

---

### Step 13: Reset Demo Data

**Action:** Check the confirmation checkbox → Click "Delete Demo Data"

**Say:**
> "And this is how we clean up. Every record labeled demo — deleted. Real player records, untouched. We can run this demo again at any time by clicking Create Demo Sandbox."

---

### Step 14: The Ask

**Return to empty state.**

**Say:**
> "Now we replace the sample players with Brian's real roster. The import tool is ready. Once we upload the CSV with player names, groups, and curriculum levels, and coaches spend about 2 minutes per class group filling in strengths and needs — the system knows the class. Every briefing is specific. Every suggestion is named. The system knows the kids."

---

## Key Properties to Reinforce

| Property | What to Say |
|---|---|
| Real code, not mockup | "Same code paths your coaches will use." |
| Dry-run before commit | "Nothing is saved until the director reviews and confirms." |
| Human approval | "No suggestion, no curriculum change, no action is ever automatic." |
| Session-only changes | "Approved adjustments live in the session — the template is protected." |
| 2-minute dev intake | "Two minutes per class group is all it takes." |
| Named, specific | "The suggestions are named. The briefing names the kids. Not generic." |
