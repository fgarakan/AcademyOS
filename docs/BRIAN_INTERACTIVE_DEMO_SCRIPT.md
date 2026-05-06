# Brian Interactive Demo Script

**Sprint:** 76
**Date:** 2026-05-06

---

## Assistant Demo Path (Sprints 67–76)

This is the recommended 10-step demo for showing the Academy OS assistant experience.

### Pre-demo setup
- Log in as the academy director
- Have one session in the coach view (at `/coach/sessions`) with a roster
- The session should be in "planned" or "in_progress" state

### Step 1 — Director opens Mission Control
Navigate to `/director/command-center`.

**Say:**
> "This is where the director starts their day. The system tells them what needs attention — no hunting through menus."

**Point out:**
- "Ask what needs attention" panel at the top
- Seven pre-loaded question chips

---

### Step 2 — Director asks what needs review
Tap "What needs review today?"

**Say:**
> "I just asked the system what needs my attention. It gives me a real answer from live data — no AI inference needed for this."

**Point out:**
- The response card showing pending count
- "Why it matters" section
- "What changes?" expandable detail
- Risk level badge
- Safety note: "Nothing changes until you approve each item"
- Action link to Review Queue

---

### Step 3 — Director reviews pending wrap-ups
Tap "Open Review Queue". Show the pending wrap-ups tab.

**Say:**
> "Every coach wrap-up from last session is here, waiting for my review. Nothing becomes official until I sign off."

---

### Step 4 — Switch to coach view
Open a new tab or sign in as a coach. Navigate to `/coach/sessions` and open a session.

**Say:**
> "Now let's see what the coach sees. The session page has a clear mobile-first layout — the most important action is right at the top."

**Point out:**
- Full-width lime "Wrap Up Session" button
- Attendance prompt (if any unmarked players)
- Session blocks with status controls

---

### Step 5 — Coach opens the Assistant Wrap-Up
Tap "Wrap Up Session".

**Say:**
> "The assistant asks one question at a time. Under 60 seconds for a typical session."

**Point out:**
- "Assistant · Wrap-Up" header
- "Academy OS asks" prefix on the question
- Step progress indicator ("Question 1 of 6")
- "Under 60 sec" label

---

### Step 6 — Coach uses quick-answer buttons
On Q1, tap "✓ Everyone here".

**Say:**
> "Quick answers for yes/no questions. The coach doesn't have to type if it's a simple yes."

**Continue to Q2.** Show the blocks question quick buttons too.

---

### Step 7 — (Optional) Voice output
Tap the "Voice" toggle button.

**Say:**
> "The assistant can read questions aloud — useful on a phone at courtside. Voice output only. No recording. The coach still types or dictates via their device keyboard."

---

### Step 7b — (Optional, Chrome/Edge only) Voice input
Below the answer field, tap the "Speak" mic button.

**Say into the phone:**
> "Everyone was here, we completed the movement and forehand blocks, Sarah needs help with grip."

**Point out:**
- Button turns red and shows "Listening…" while active
- Transcript appears in the answer field when speaking stops
- Coach can edit the text before tapping Next
- Small note: "You can speak your answer, then edit before saving."

**Say:**
> "The coach can now speak answers directly into the assistant. The browser converts speech to text — no audio is recorded, nothing is uploaded. The coach reviews and edits the transcript before anything saves."

**Guardrail to emphasise:**
> "This is voice-to-text only. The coach still reviews every answer. Nothing is saved until they tap Save Wrap-Up."

---

### Step 8 — Coach completes wrap-up and reviews summary
Complete all 6 questions. Arrive at the summary phase.

**Say:**
> "Before saving, the coach sees exactly what the system understood: blocks completed, who was flagged, what the next focus should be — and most importantly, what will NOT be shared with parents or players."

**Point out:**
- "Here's what I understood" header
- Block completion counts
- "Not shared with parents or players" lock note
- "Save Wrap-Up" button (primary) and "Save as quick note" (fallback)

---

### Step 9 — Coach saves wrap-up
Tap "Save Wrap-Up".

**Say:**
> "Saved. Recap goes to the director review queue. Nothing else changed. No parent notification. No level change. Just a clean record."

---

### Step 10 — Return to Director view
Navigate back to `/director/review` as the director.

**Say:**
> "And here it is — the coach's wrap-up is now in the queue, waiting for review. The director sees the full structured summary, can approve or reject, and nothing becomes permanent until they do."

---

### Bonus: Parent and player portals
Navigate to `/parent` (as a parent user) and `/player` (as a player user).

**Say:**
> "Parents see their child's development plan in plain English — no scores, no internal notes. Players see their current level and what to work on. The system controls what each role can see."

---

## Demo in one sentence

> "The coach tells the OS what happened. The OS asks the right questions, builds a clean summary, and puts it in the director's review queue. Nothing becomes official without human approval."

---

## Original Demo Script (Sprint 120)

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

---

## Voice Demo Add-On (Sprint 125)

Add this section after the Adaptive Session Planning demo when voice input is ready.

**Say:**
> "One more thing. The system can also take voice input. Not autonomous commands — voice-to-text that you review and approve. Like this."

### Step A — Curriculum customization by voice

**Navigate to:** `/director/curriculum`

**Click:** "Start speaking" in the Curriculum Customization panel.

**Say into microphone:**
> "For our Orange 2 players, I want more return-of-serve readiness before Orange 3."

**Point out:**
- Transcript appears in the text box
- Fully editable before submission
- Click "Create Override Draft" manually

**Say:**
> "Voice captured the intent. You review it. You submit it. It creates a draft — not a live change."

### Step B — Coach recap by voice

**Navigate to:** `/director/sessions/[demo-session-id]`

**Scroll to:** COACH RECAP section

**Click:** "Start speaking"

**Say into microphone:**
> "Everyone was here except Sarah. Mia improved recovery after wide balls. Leo still needs better contact spacing."

**Click:** "Save Recap"

**Say:**
> "Voice creates text. The OS structures it. Humans approve before anything changes."

### Voice guardrail to reinforce

> "Nothing happens automatically. The voice button is just a faster way to type. Every action still goes through the same review and approval process. Your data is always under director control."

For the full voice demo script, see `docs/BRIAN_VOICE_DEMO_SCRIPT.md`.

---

## Coach Operating Loop Add-On (Sprints 10–15)

Add this section after the Voice Demo when showing the full session execution loop.

### Setup

Log in as a **coach** user (not director). Navigate to `/coach/sessions`.

---

### Step C1: Coach Session List

**Navigate to:** `/coach/sessions`

**Say:**
> "This is what a coach sees when they log in. All their sessions, scoped to the academy. They can't see anything outside their role."

**Point out:**
- Session cards with name, date, status
- "In Progress" vs "Planned" status pills

---

### Step C2: Open a Session

**Click a session with a roster.**

**Say:**
> "Each session comes from a template. Blocks are pre-planned. The coach sees who's rostered, what the group is working on, and what gaps were flagged at the player level."

**Point out:**
- Session snapshot notice ("Planned session snapshot — coach updates don't change the template")
- Block list
- Roster with attendance selectors
- Gap Brief panel showing player development gaps

---

### Step C3: Mark Attendance

**Set one player to "Absent."**

**Click Save.**

**Say:**
> "Attendance is explicit. Every player is clicked. The coach confirms each status — not just who's missing. It saves immediately. The director can see attendance across all sessions in real time."

---

### Step C4: Run the Wrap-Up

**Scroll to Session Actions → Click "Wrap Up Session."**

**Say:**
> "After the session, the coach taps Wrap Up. Six questions. Takes about two minutes. The system doesn't guess — it asks."

**Walk through the questions:**
- Q1: Attendance (any absences, unrostered players)
- Q2: Did you complete all planned blocks?
- Q3: What changed or got skipped?
- Q4: Who stood out today?
- Q5: Who needs follow-up next session?
- Q6: What should the next session focus on?

**Say:**
> "Every question has a placeholder example. The coach can skip any question. Nothing is saved until they tap Save Recap."

---

### Step C5: Review and Save

**Tap "Review" on the last question.**

**Point out on the summary screen:**
- All answers in one view
- Block completion selectors (Completed / Modified / Skipped per block)
- Player note fields under "Who stood out" and "Who needs attention"
- Attendance confirmation with per-player dropdowns

**Say:**
> "The summary screen is where they confirm. They can change block completion status, add player-level notes, and verify attendance. None of this goes to players or parents — it's internal coach notes."

**Tap "Save Attendance" for the attendance section.**

**Tap "Save Recap."**

**Say:**
> "One tap saves three things: the raw text recap, a structured session actual draft for director review, and any player observation notes. All under director review — nothing automatic."

---

### Step C6: Director Sees the Draft

**Log back in as director. Navigate to `/director/review`.**

**Say:**
> "The director now sees the coach's session wrap-up as a pending review draft. Not a live change — a proposal. The director can approve, reject, or edit. That's the loop."

---

### Coach Operating Loop — Key Properties to Reinforce

| Property | What to Say |
|---|---|
| Coach role is scoped | "Coaches only see their sessions and roster. No cross-academy access." |
| Nothing saves until explicit tap | "Every action is coach-initiated. No background mutations." |
| Recap drives three saves | "Raw text + structured draft + player notes — one tap." |
| Director still reviews | "Wrap-up creates a draft. The director approves before anything is official." |
| Player notes are private | "Not visible to players or parents. Internal only." |

For the full manual test checklist covering this loop, see `docs/V1_MANUAL_TEST_CHECKLIST.md`.
