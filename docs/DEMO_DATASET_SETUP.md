# Demo Dataset Setup
**Academy OS — Pilot / Investor Demo Story**
Last updated: 2026-05-08

---

## Purpose

This document describes how to set up Academy OS with realistic data for a controlled demo or investor walkthrough. It covers the sandbox (automated) and the manual demo story (what to say at each step).

---

## Option A — Automated Sandbox (fastest, ~2 minutes)

1. Log in as the academy director
2. Navigate to `/director/demo`
3. Click **Create Demo Sandbox**
4. Wait ~5 seconds for confirmation
5. The sandbox creates:
   - 6 `[DEMO]` players with names, strengths, needs, and priorities
   - A `[DEMO] Orange 2 Sample Group`
   - A demo class template with 5 session blocks
   - A planned session linked to the group
   - (Optional) A demo curriculum version

6. Navigate to the 11-step demo path and follow it

**To reset:** Click **Reset Sandbox** on the same page.
**To delete:** Click **Delete Sandbox** to remove all demo records.

---

## Option B — Manual Demo Story (for live walkthrough)

Use this for a director who wants to feel the product "for real" with a small dataset.

### Characters in the story

| Name | Role | Level | Notes |
|---|---|---|---|
| Mia Alvarez | Player | Orange 2 | Recovery is a current priority |
| Sophie Chen | Player | Orange 2 | Return readiness is a focus area |
| Leo Martin | Player | Orange 2 | Contact spacing needs work |
| Brian (director) | Director | — | Running the academy |
| Coach (coach account) | Coach | — | Runs Orange 2 class |

---

### Step 1 — Import the roster

**What you're showing:** The player import flow is safe and validated.

1. Go to `/director/players/import`
2. Show the CSV upload area
3. Say: *"Before a single player is written to the database, the system runs a dry-run and validates every row. No surprises."*
4. Upload a CSV with the 3 demo players
5. Confirm, then proceed to onboarding review

---

### Step 2 — Review and activate players

**What you're showing:** The placement process is intentional.

1. Go to `/director/players`
2. Show pending players queue
3. Say: *"New players land here as 'pending placement.' The director actively decides when to activate them."*
4. Open one player profile
5. Show the development intake form (strengths, needs, priorities)

---

### Step 3 — Assign curriculum levels

**What you're showing:** Each player has a development path.

1. On the player profile, go to the curriculum section
2. Assign `Orange 2` to each demo player
3. Say: *"The level drives everything downstream — lesson plans, coach briefings, session gaps."*

---

### Step 4 — Explore the curriculum

**What you're showing:** The curriculum is structured, evidence-based, and transparent.

1. Go to `/director/curriculum`
2. Click `Orange 2`
3. Show: gates (what evidence does the player need to advance?), drills, coach language
4. Say: *"15 levels, each with specific gates the coach watches for. The language is standardized so every coach means the same thing."*
5. Point to the curriculum loop diagram: *"This is how curriculum flows to court — every session a coach runs is backed by this."*

---

### Step 5 — Create a class template

**What you're showing:** Templates are reusable structures that carry curriculum content.

1. Go to `/director/class-templates/new`
2. Create a template named `Orange 2 — Weekly Training`
3. Add blocks: Warm-Up (15m), Technical (20m), Tactical (20m), Competition (20m), Cool-Down (5m)
4. Assign curriculum level: `Orange 2`
5. Say: *"The template is the blueprint. Once I generate a lesson plan, every session from this template carries the same curriculum structure."*

---

### Step 6 — Generate and apply a lesson plan

**What you're showing:** AI drafts; director approves; nothing is automatic.

1. On the template detail page, scroll to **Lesson Plan Draft Generator**
2. Click **Generate Lesson Plan Draft**
3. Show the 4-step guided flow
4. Review the draft — walk through one block's drills and cues
5. Say: *"This is the plan. I can review every drill, every coaching cue. When I'm ready — I apply it. Not before."*
6. Click **Apply to Template**
7. Say: *"Now every session created from this template carries this plan."*

---

### Step 7 — Schedule a session

**What you're showing:** Sessions link templates to groups.

1. Go to `/director/sessions` → New Session
2. Select the template, select the Orange 2 group, set date
3. Say: *"One click — the session inherits the curriculum plan and the group roster."*

---

### Step 8 — Open the session as coach

**What you're showing:** The coach has everything they need before hitting the court.

1. Switch to the coach account (or show the coach view)
2. Open the session
3. Point to **Before Session** section: *"The coach sees the curriculum lesson plan before the session starts — drills, coaching cues, success criteria."*
4. Point to the block progress rail: *"As the class runs, the coach can track which blocks are done."*

---

### Step 9 — Mark attendance and run the session

**What you're showing:** Real-time execution tracking.

1. Mark 3 players as present
2. Complete one exercise
3. Show the attendance warning if any players are unmarked
4. Say: *"Attendance is captured in real time. The coach never has to go back and fill in a spreadsheet."*

---

### Step 10 — Submit a coach wrap-up

**What you're showing:** Structured coach-to-director communication.

1. Click **Coach Wrap-Up** in the After Session section
2. Walk through the wrap-up flow (what went well, what to adjust)
3. Submit
4. Say: *"The coach writes a quick note. The system structures it for the director to review."*

---

### Step 11 — Director reviews the wrap-up

**What you're showing:** The feedback loop closes.

1. Switch back to the director account
2. Go to `/director/review` → Wrap-Up tab
3. Show the structured wrap-up card
4. Approve it
5. Say: *"The director sees a structured summary — not a raw dump. One click to approve. The loop closes and the next session is better."*

---

## What NOT to demo

- Voice transcription (requires OpenAI API key in production)
- Email/push notifications (not yet built)
- Group-level analytics (not yet built)
- Placement engine edge cases (show the happy path)

---

## Reset after demo

1. Go to `/director/demo`
2. Click **Reset Sandbox** to restore demo data
3. Or click **Delete Sandbox** to fully clean up

---

## Talking points cheat sheet

| Moment | What to say |
|---|---|
| Import | "Dry-run validates before a single record is written." |
| Pending placement | "The director decides when to activate a player — nothing automatic." |
| Curriculum levels | "The level drives lesson plans, coach briefings, and gap analysis." |
| Lesson plan generation | "AI proposes. Director approves. Nothing applies without human sign-off." |
| Session execution | "The coach has context before they walk on court — not after." |
| Wrap-up | "Structured communication, not a chat message. It lands in a review queue." |
| Review queue | "One place for everything the director needs to approve or adjust." |
| Parent portal | "Parents see what they should — progress and how to support. Nothing internal." |
| Player portal | "Players see their mission. Not a report card — a mission." |
