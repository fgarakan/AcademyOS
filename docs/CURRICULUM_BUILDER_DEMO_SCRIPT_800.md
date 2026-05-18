# Sprint 800 — Curriculum Builder Demo Script V1

**Date:** 2026-05-18
**Sprint:** 800
**Audience:** Academy director (Brian Dabul or equivalent pilot director)
**Duration:** ~8 minutes

---

## Pre-demo checklist

- [ ] Log in as `academy_director` role
- [ ] Confirm curriculum data is loaded (levels visible at `/director/curriculum/map`)
- [ ] Navigate to `/director/curriculum` before starting

---

## Script

### Step 1 — Land on the curriculum home (30s)

> "This is your curriculum builder. It's not a document — it's a live view of what your academy teaches at each level, and a place to ask DONNA to help you improve it."

Point to the DONNA welcome panel. If `hasActiveVersion` is true, show the "View curriculum map" chip.

> "Every change you make here goes into a draft. Nothing is applied to what your coaches teach until you approve it."

---

### Step 2 — Open the Curriculum Map (90s)

Navigate to `/director/curriculum/map`.

> "Here's your full curriculum at a glance. Fifteen levels across five stages — Red Foundation through High Performance."

Point to the relationship map at the top.

> "The pathway shows how players move through your academy — left to right within each stage, then up to the next."

Scroll to the level grid. Point to a level card with coloured dots.

> "These dots tell you the health of each level. Green means it has enough drills and gates. Orange means it's light. Red means it's empty."

Click a level card to open the inline detail.

> "Click any level to see exactly what's in it — drills, gates, coaching language, fitness guidance. And this 'Open builder' link takes you into the full editing view."

---

### Step 3 — Open a level in the builder (90s)

Click "Open builder →" on a level with some content.

> "This is the Level Builder. It gives you five tabs — an overview of everything in the level, then individual views for drills, gates, fitness, and coaching language."

Click the **Drills** tab.

> "Here are the drills for this level. If you want to add one, you don't type it directly into the database. You ask DONNA to draft it."

Click "Ask DONNA to draft a drill".

> "Type what you have in mind — as if you were explaining it to a new coach."

Type a 30-word drill description.

> "DONNA will take what you described and turn it into a structured drill draft. It goes to your Review Queue — you review it and decide whether it fits before anything changes."

Click "Create draft". Show the success state.

> "The draft is queued. Nothing has changed in your curriculum yet. You'd go to the Review Queue to approve it."

---

### Step 4 — Show the overview tab DONNA context (60s)

Click the **Overview** tab.

> "At the bottom of the overview, DONNA shows you what she knows about this level. How many drills, how many gates, and what she's noticed."

Point to the `DonnaCurriculumContextPanel`.

> "She's transparent about what she can't see. She knows about curriculum content, but she doesn't have access to session data or attendance from this view — that's in the coaching layer."

Point to the safety disclosure.

> "And she always reminds you — she proposes, you approve, the system applies. That's the rule."

---

### Step 5 — Show the Guided Review (60s)

Navigate to `/director/curriculum/guided`.

> "If you want to review your whole curriculum systematically — maybe once a season — the Guided Review walks you through every level in order."

Show the progress rail.

> "You can mark each level reviewed, skip ones you want to come back to, or jump directly to any level."

Show the jump modal.

> "When you're done, DONNA can help you build a list of improvements to queue up."

---

### Step 6 — Close the demo (30s)

> "That's the Curriculum Builder. It gives you a clear picture of what you teach and a safe way to propose improvements — DONNA drafts, you approve, your coaches see only what's been approved."

> "No changes happen automatically. No one gets surprised. And DONNA is always honest about what she knows and what she's guessing."

---

## Demo do-nots

- Do not claim the DONNA draft creates an item in the review queue yet (it's a UI shell in V1 — be honest if asked)
- Do not show the impact preview panel unless you have a real `ImpactEstimate` to pass it (show it empty and explain it's a V2 calculation)
- Do not navigate to advanced admin tools (not built yet)
